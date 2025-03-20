import { Request, Response, NextFunction, RequestHandler } from "express";
import dbConnect from "../config/database";
import { UserRequest } from "../middlewares/authenticate";
import { Shift, ShiftType, ShiftStatus, ShiftEndType } from "../models/shift";
import { User, UserType } from "../models/user";
import ErrorHandler from "../utils/errorHandler";
import { ActivityLog, ActivityType } from "../models/activityLogs";
import { io } from "../server";

const SHIFT_TIMES = {
  [ShiftType.MORNING]: { start: "08:00", end: "15:00" },
  [ShiftType.AFTERNOON]: { start: "15:00", end: "15:00" },
  [ShiftType.NIGHT]: { start: "19:00", end: "08:00" },
};

export const clockIn: RequestHandler = async (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ErrorHandler("Unauthorized", 401);

    const userRepo = dbConnect.getRepository(User);
    const shiftRepo = dbConnect.getRepository(Shift);

    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) throw new ErrorHandler("User not found", 404);

    const activeShift = await shiftRepo.findOne({
      where: {
        user: { id: userId },
        isClockedIn: true,
      },
    });

    if (activeShift) throw new ErrorHandler("Already clocked in", 400);

    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    let shiftType: ShiftType;

    if (currentTime >= 800 && currentTime < 1500) {
      shiftType = ShiftType.MORNING;
    } else if (currentTime >= 1500 && currentTime < 2100) {
      shiftType = ShiftType.AFTERNOON;
    } else {
      shiftType = ShiftType.NIGHT;
    }

    // Find shift for current session
    const currentShift = await shiftRepo.findOne({
      where: {
        user: { id: userId },
        shiftType: ShiftType.AFTERNOON,
        status: ShiftStatus.ACTIVE,
      },
    });

    if (!currentShift) {
      throw new ErrorHandler("No shift found for current session", 404);
    }

    const isLate = checkIfLate(currentTime, shiftType);

    // Update the existing shift
    currentShift.isClockedIn = true;
    currentShift.clockInTime = now;
    currentShift.isLateClockIn = isLate;
    currentShift.lateMinutes = isLate
      ? calculateLateMinutes(now, shiftType)
      : 0;

    await shiftRepo.save(currentShift);
    await userRepo.update(userId, { clockedIn: true });

    io.emit("shiftUpdate", {
      userId: user.id,
      status: "clocked-in",
      shiftId: currentShift.id,
    });

    res.json({
      success: true,
      message: "Successfully clocked in",
      data: currentShift,
    });
  } catch (error) {
    next(error);
  }
};

function checkIfLate(currentTime: number, shiftType: ShiftType): boolean {
  switch (shiftType) {
    case ShiftType.MORNING:
      return currentTime > 800;
    case ShiftType.AFTERNOON:
      return currentTime > 1500;
    case ShiftType.NIGHT:
      return currentTime > 2100 || currentTime < 800;
  }
}

export const clockOut = async (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id;
  if (!userId) return next(new ErrorHandler("Unauthorized", 401));

  const userRepo = dbConnect.getRepository(User);
  const shiftRepo = dbConnect.getRepository(Shift);

  try {
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) return next(new ErrorHandler("User not found", 404));

    let activeShift = await shiftRepo.findOne({
      where: { user: { id: userId }, status: ShiftStatus.ACTIVE },
    });

    console.log(activeShift);

    if (!activeShift)
      return next(new ErrorHandler("No active shift found", 404));

    const now = new Date();

    try {
      // Attempt to close shift gracefully
      activeShift.clockOutTime = now;
      activeShift.isClockedIn = false;
      activeShift.totalWorkDuration += calculateWorkDuration(
        activeShift.clockInTime,
        now,
        activeShift.breaks
      );
      activeShift.overtimeMinutes = calculateOvertime(
        activeShift.shiftType,
        activeShift.totalWorkDuration
      );
      activeShift.status = ShiftStatus.ENDED;

      await shiftRepo.save(activeShift);
      await userRepo.update(userId, { clockedIn: false });

      io.emit("shiftUpdate", {
        userId: user.id,
        status: "clocked-out",
        shiftId: activeShift.id,
      });

      res.json({
        success: true,
        message: "Successfully clocked out",
        data: activeShift,
      });
    } catch (shiftError) {
      console.error("🚨 Error updating shift:", shiftError);

      activeShift.status = ShiftStatus.FORCE_CLOSED;
      activeShift.clockOutTime = now;

      await shiftRepo.save(activeShift);
      await userRepo.update(userId, { clockedIn: false });

      return next(
        new ErrorHandler("Unexpected error. Shift forcefully ended.", 500)
      );
    }
  } catch (error) {
    console.error("🚨 Unexpected error during clock-out:", error);

    try {
      let activeShift = await shiftRepo.findOne({
        where: { user: { id: userId }, status: ShiftStatus.ACTIVE },
      });

      if (activeShift) {
        activeShift.status = ShiftStatus.FORCE_CLOSED;
        activeShift.clockOutTime = new Date();
        await shiftRepo.save(activeShift);
      }

      await userRepo.update(userId, { clockedIn: false });
    } catch (cleanupError) {
      console.error("🚨 Error during shift force closure:", cleanupError);
    }

    return next(
      new ErrorHandler("Critical error occurred. Shift forcefully closed.", 500)
    );
  }
};

export const startBreak: RequestHandler = async (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ErrorHandler("Unauthorized", 401);

    const shiftRepo = dbConnect.getRepository(Shift);
    const activeShift = await shiftRepo.findOne({
      where: {
        user: { id: userId },
        status: ShiftStatus.ACTIVE,
      },
    });

    if (!activeShift) throw new ErrorHandler("No active shift found", 404);

    const now = new Date();
    const newBreak = {
      startTime: now,
      duration: 0,
    };

    activeShift.breaks = [...(activeShift.breaks || []), newBreak];
    activeShift.status = ShiftStatus.ON_BREAK;
    await shiftRepo.save(activeShift);

    io.emit("breakUpdate", {
      userId,
      status: "break-started",
      shiftId: activeShift.id,
    });

    res.json({
      success: true,
      message: "Break started successfully",
      data: activeShift,
    });
  } catch (error) {
    next(error);
  }
};

export const endBreak: RequestHandler = async (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ErrorHandler("Unauthorized", 401);

    const shiftRepo = dbConnect.getRepository(Shift);
    const activeShift = await shiftRepo.findOne({
      where: {
        user: { id: userId },
        status: ShiftStatus.ON_BREAK,
      },
    });

    if (!activeShift) throw new ErrorHandler("No active break found", 404);

    const now = new Date();
    const currentBreak = activeShift.breaks[activeShift.breaks.length - 1];

    if (currentBreak && !currentBreak.endTime) {
      currentBreak.endTime = now;
      currentBreak.duration = Math.floor(
        (now.getTime() - new Date(currentBreak.startTime).getTime()) / 60000
      );
    }

    activeShift.status = ShiftStatus.ACTIVE;
    await shiftRepo.save(activeShift);

    io.emit("breakUpdate", {
      userId,
      status: "break-ended",
      shiftId: activeShift.id,
    });

    res.json({
      success: true,
      message: "Break ended successfully",
      data: activeShift,
    });
  } catch (error) {
    next(error);
  }
};

export const getShiftMetrics: RequestHandler = async (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.userId;
    if (!userId) throw new ErrorHandler("User ID required", 400);

    const { startDate, endDate } = req.query;
    const shiftRepo = dbConnect.getRepository(Shift);

    const shifts = await shiftRepo.find({
      where: {
        user: { id: userId },
      },
      order: { createdAt: "DESC" },
    });

    const totalBreakDuration = shifts.reduce((acc, shift) => {
      const breakDurations =
        shift.breaks?.reduce(
          (sum, breakItem) => sum + (breakItem.duration || 0),
          0
        ) || 0;
      return acc + breakDurations;
    }, 0);

    const metrics = {
      totalShifts: shifts.length,
      totalWorkDuration: shifts.reduce(
        (acc, shift) => acc + (shift.totalWorkDuration || 0),
        0
      ),
      totalBreakDuration,
      totalOvertimeMinutes: shifts.reduce(
        (acc, shift) => acc + (shift.overtimeMinutes || 0),
        0
      ),
      totalLateMinutes: shifts.reduce(
        (acc, shift) => acc + (shift.lateMinutes || 0),
        0
      ),
      lateClockIns: shifts.filter((shift) => shift.isLateClockIn).length,
      shiftsByType: {
        [ShiftType.MORNING]: shifts.filter(
          (s) => s.shiftType === ShiftType.MORNING
        ).length,
        [ShiftType.AFTERNOON]: shifts.filter(
          (s) => s.shiftType === ShiftType.AFTERNOON
        ).length,
        [ShiftType.NIGHT]: shifts.filter((s) => s.shiftType === ShiftType.NIGHT)
          .length,
      },
    };

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
};

export const forceEndShift: RequestHandler = async (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { shiftId } = req.params;
    const { adminNotes } = req.body;
    const userId = req.user?.id;

    if (!userId || req.user?.userType !== UserType.ADMIN) {
      throw new ErrorHandler("Unauthorized", 401);
    }

    const shiftRepo = dbConnect.getRepository(Shift);
    const shift = await shiftRepo.findOne({
      where: { id: shiftId },
      relations: ["user"],
    });

    if (!shift) throw new ErrorHandler("Shift not found", 404);

    const now = new Date();
    shift.status = ShiftStatus.FORCE_CLOSED;
    shift.shiftEndType = ShiftEndType.ADMIN_FORCE_CLOSE;
    shift.clockOutTime = now;
    shift.adminNotes = adminNotes;
    shift.approvedByAdminId = userId;
    shift.approvalTime = now;
    shift.isClockedIn = false;
    shift.totalWorkDuration = calculateWorkDuration(
      shift.clockInTime,
      now,
      shift.breaks
    );

    await shiftRepo.save(shift);
    await dbConnect.getRepository(User).update(shift.user.id, { clockedIn: false });

    io.emit("shiftUpdate", {
      userId: shift.user.id,
      status: "force-closed",
      shiftId,
    });

    res.json({
      success: true,
      message: "Shift force closed successfully",
      data: shift,
    });
  } catch (error) {
    next(error);
  }
};

const calculateLateMinutes = (clockIn: Date, shiftType: ShiftType): number => {
  const shiftStart = SHIFT_TIMES[shiftType].start;
  const [hours, minutes] = shiftStart.split(":").map(Number);
  const shiftStartDate = new Date(clockIn);
  shiftStartDate.setHours(hours, minutes, 0, 0);

  return Math.max(
    0,
    Math.floor((clockIn.getTime() - shiftStartDate.getTime()) / 60000)
  );
};

const calculateWorkDuration = (
  clockIn: Date,
  clockOut: Date,
  breaks: any
): number => {
  const totalMs = clockOut?.getTime() - clockIn?.getTime();
  const breakTimeMs = breaks.reduce(
    (acc: any, b: any) => acc + (b.duration ? b.duration * 60000 : 0),
    0
  );
  return Math.max(0, (totalMs - breakTimeMs) / 60000);
};

const calculateOvertime = (
  shiftType: Shift["shiftType"],
  totalWorkDuration: number
): number => {
  const standardDurations = {
    morning: 7 * 60,
    afternoon: 6 * 60,
    night: 11 * 60,
  };

  return Math.max(0, totalWorkDuration - standardDurations[shiftType]);
};
// Get Current Active for a user

export const getCurrentShift: RequestHandler = async (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    console.log(req.user);
    if (!userId) throw new ErrorHandler("Unauthorized", 401);

    const userRepo = dbConnect.getRepository(User);
    const shiftRepo = dbConnect.getRepository(Shift);

    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) throw new ErrorHandler("User not found", 404);

    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    let shiftType: ShiftType;

    // if (currentTime >= 800 && currentTime < 1500) {
    //   shiftType = ShiftType.MORNING;
    // } else if (currentTime >= 1500 && currentTime < 2100) {
    //   shiftType = ShiftType.AFTERNOON;
    // } else {
    //   shiftType = ShiftType.NIGHT;
    // }

    const currentShift = await shiftRepo.findOne({
      where: {
        user: { id: userId },
        shiftType: ShiftType.AFTERNOON,
        status: ShiftStatus.ACTIVE,
      },
      relations: ["user"],
    });

    if (!currentShift) {
      throw new ErrorHandler("No active shift found for current session", 404);
    }

    res.json({
      success: true,
      message: "Current shift retrieved successfully",
      data: {
        shift: currentShift,
        currentSession: ShiftType.AFTERNOON,
        isActive: currentShift.status === ShiftStatus.ACTIVE,
        clockedIn: currentShift.isClockedIn,
        workDuration: currentShift.totalWorkDuration || 0,
        breaks: currentShift.breaks || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

export const isWithinShiftHours = (
  currentTime: number,
  shiftType: ShiftType
): boolean => {
  switch (shiftType) {
    case ShiftType.MORNING:
      return currentTime >= 800 && currentTime < 1500;
    case ShiftType.AFTERNOON:
      return currentTime >= 1500 && currentTime < 2100;
    case ShiftType.NIGHT:
      return currentTime >= 2100 || currentTime < 800;
    default:
      return false;
  }
};
