"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWithinShiftHours = exports.getCurrentShift = exports.forceEndShift = exports.getShiftMetrics = exports.endBreak = exports.startBreak = exports.clockOut = exports.clockIn = void 0;
const typeorm_1 = require("typeorm");
const shift_1 = require("../models/shift");
const user_1 = require("../models/user");
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const server_1 = require("../server");
const SHIFT_TIMES = {
    [shift_1.ShiftType.MORNING]: { start: "08:00", end: "15:00" },
    [shift_1.ShiftType.AFTERNOON]: { start: "15:00", end: "15:00" },
    [shift_1.ShiftType.NIGHT]: { start: "19:00", end: "08:00" },
};
const clockIn = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            throw new errorHandler_1.default("Unauthorized", 401);
        const userRepo = (0, typeorm_1.getRepository)(user_1.User);
        const shiftRepo = (0, typeorm_1.getRepository)(shift_1.Shift);
        const user = yield userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new errorHandler_1.default("User not found", 404);
        const activeShift = yield shiftRepo.findOne({
            where: {
                user: { id: userId },
                isClockedIn: true,
            },
        });
        if (activeShift)
            throw new errorHandler_1.default("Already clocked in", 400);
        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes();
        let shiftType;
        if (currentTime >= 800 && currentTime < 1500) {
            shiftType = shift_1.ShiftType.MORNING;
        }
        else if (currentTime >= 1500 && currentTime < 2100) {
            shiftType = shift_1.ShiftType.AFTERNOON;
        }
        else {
            shiftType = shift_1.ShiftType.NIGHT;
        }
        // Find shift for current session
        const currentShift = yield shiftRepo.findOne({
            where: {
                user: { id: userId },
                shiftType: shift_1.ShiftType.AFTERNOON,
                status: shift_1.ShiftStatus.ACTIVE,
            },
        });
        if (!currentShift) {
            throw new errorHandler_1.default("No shift found for current session", 404);
        }
        const isLate = checkIfLate(currentTime, shiftType);
        // Update the existing shift
        currentShift.isClockedIn = true;
        currentShift.clockInTime = now;
        currentShift.isLateClockIn = isLate;
        currentShift.lateMinutes = isLate
            ? calculateLateMinutes(now, shiftType)
            : 0;
        yield shiftRepo.save(currentShift);
        yield userRepo.update(userId, { clockedIn: true });
        server_1.io.emit("shiftUpdate", {
            userId: user.id,
            status: "clocked-in",
            shiftId: currentShift.id,
        });
        res.json({
            success: true,
            message: "Successfully clocked in",
            data: currentShift,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.clockIn = clockIn;
function checkIfLate(currentTime, shiftType) {
    switch (shiftType) {
        case shift_1.ShiftType.MORNING:
            return currentTime > 800;
        case shift_1.ShiftType.AFTERNOON:
            return currentTime > 1500;
        case shift_1.ShiftType.NIGHT:
            return currentTime > 2100 || currentTime < 800;
    }
}
const clockOut = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId)
        return next(new errorHandler_1.default("Unauthorized", 401));
    const userRepo = (0, typeorm_1.getRepository)(user_1.User);
    const shiftRepo = (0, typeorm_1.getRepository)(shift_1.Shift);
    try {
        const user = yield userRepo.findOne({ where: { id: userId } });
        if (!user)
            return next(new errorHandler_1.default("User not found", 404));
        let activeShift = yield shiftRepo.findOne({
            where: { user: { id: userId }, status: shift_1.ShiftStatus.ACTIVE },
        });
        console.log(activeShift);
        if (!activeShift)
            return next(new errorHandler_1.default("No active shift found", 404));
        const now = new Date();
        try {
            // Attempt to close shift gracefully
            activeShift.clockOutTime = now;
            activeShift.isClockedIn = false;
            activeShift.totalWorkDuration += calculateWorkDuration(activeShift.clockInTime, now, activeShift.breaks);
            activeShift.overtimeMinutes = calculateOvertime(activeShift.shiftType, activeShift.totalWorkDuration);
            activeShift.status = shift_1.ShiftStatus.ENDED;
            yield shiftRepo.save(activeShift);
            yield userRepo.update(userId, { clockedIn: false });
            server_1.io.emit("shiftUpdate", {
                userId: user.id,
                status: "clocked-out",
                shiftId: activeShift.id,
            });
            res.json({
                success: true,
                message: "Successfully clocked out",
                data: activeShift,
            });
        }
        catch (shiftError) {
            console.error("🚨 Error updating shift:", shiftError);
            activeShift.status = shift_1.ShiftStatus.FORCE_CLOSED;
            activeShift.clockOutTime = now;
            yield shiftRepo.save(activeShift);
            yield userRepo.update(userId, { clockedIn: false });
            return next(new errorHandler_1.default("Unexpected error. Shift forcefully ended.", 500));
        }
    }
    catch (error) {
        console.error("🚨 Unexpected error during clock-out:", error);
        try {
            let activeShift = yield shiftRepo.findOne({
                where: { user: { id: userId }, status: shift_1.ShiftStatus.ACTIVE },
            });
            if (activeShift) {
                activeShift.status = shift_1.ShiftStatus.FORCE_CLOSED;
                activeShift.clockOutTime = new Date();
                yield shiftRepo.save(activeShift);
            }
            yield userRepo.update(userId, { clockedIn: false });
        }
        catch (cleanupError) {
            console.error("🚨 Error during shift force closure:", cleanupError);
        }
        return next(new errorHandler_1.default("Critical error occurred. Shift forcefully closed.", 500));
    }
});
exports.clockOut = clockOut;
const startBreak = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            throw new errorHandler_1.default("Unauthorized", 401);
        const shiftRepo = (0, typeorm_1.getRepository)(shift_1.Shift);
        const activeShift = yield shiftRepo.findOne({
            where: {
                user: { id: userId },
                status: shift_1.ShiftStatus.ACTIVE,
            },
        });
        if (!activeShift)
            throw new errorHandler_1.default("No active shift found", 404);
        const now = new Date();
        const newBreak = {
            startTime: now,
            duration: 0,
        };
        activeShift.breaks = [...(activeShift.breaks || []), newBreak];
        activeShift.status = shift_1.ShiftStatus.ON_BREAK;
        yield shiftRepo.save(activeShift);
        server_1.io.emit("breakUpdate", {
            userId,
            status: "break-started",
            shiftId: activeShift.id,
        });
        res.json({
            success: true,
            message: "Break started successfully",
            data: activeShift,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.startBreak = startBreak;
const endBreak = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            throw new errorHandler_1.default("Unauthorized", 401);
        const shiftRepo = (0, typeorm_1.getRepository)(shift_1.Shift);
        const activeShift = yield shiftRepo.findOne({
            where: {
                user: { id: userId },
                status: shift_1.ShiftStatus.ON_BREAK,
            },
        });
        if (!activeShift)
            throw new errorHandler_1.default("No active break found", 404);
        const now = new Date();
        const currentBreak = activeShift.breaks[activeShift.breaks.length - 1];
        if (currentBreak && !currentBreak.endTime) {
            currentBreak.endTime = now;
            currentBreak.duration = Math.floor((now.getTime() - new Date(currentBreak.startTime).getTime()) / 60000);
        }
        activeShift.status = shift_1.ShiftStatus.ACTIVE;
        yield shiftRepo.save(activeShift);
        server_1.io.emit("breakUpdate", {
            userId,
            status: "break-ended",
            shiftId: activeShift.id,
        });
        res.json({
            success: true,
            message: "Break ended successfully",
            data: activeShift,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.endBreak = endBreak;
const getShiftMetrics = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.userId;
        if (!userId)
            throw new errorHandler_1.default("User ID required", 400);
        const { startDate, endDate } = req.query;
        const shiftRepo = (0, typeorm_1.getRepository)(shift_1.Shift);
        const shifts = yield shiftRepo.find({
            where: {
                user: { id: userId },
            },
            order: { createdAt: "DESC" },
        });
        const totalBreakDuration = shifts.reduce((acc, shift) => {
            var _a;
            const breakDurations = ((_a = shift.breaks) === null || _a === void 0 ? void 0 : _a.reduce((sum, breakItem) => sum + (breakItem.duration || 0), 0)) || 0;
            return acc + breakDurations;
        }, 0);
        const metrics = {
            totalShifts: shifts.length,
            totalWorkDuration: shifts.reduce((acc, shift) => acc + (shift.totalWorkDuration || 0), 0),
            totalBreakDuration,
            totalOvertimeMinutes: shifts.reduce((acc, shift) => acc + (shift.overtimeMinutes || 0), 0),
            totalLateMinutes: shifts.reduce((acc, shift) => acc + (shift.lateMinutes || 0), 0),
            lateClockIns: shifts.filter((shift) => shift.isLateClockIn).length,
            shiftsByType: {
                [shift_1.ShiftType.MORNING]: shifts.filter((s) => s.shiftType === shift_1.ShiftType.MORNING).length,
                [shift_1.ShiftType.AFTERNOON]: shifts.filter((s) => s.shiftType === shift_1.ShiftType.AFTERNOON).length,
                [shift_1.ShiftType.NIGHT]: shifts.filter((s) => s.shiftType === shift_1.ShiftType.NIGHT)
                    .length,
            },
        };
        res.json({
            success: true,
            data: metrics,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getShiftMetrics = getShiftMetrics;
const forceEndShift = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { shiftId } = req.params;
        const { adminNotes } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.userType) !== user_1.UserType.ADMIN) {
            throw new errorHandler_1.default("Unauthorized", 401);
        }
        const shiftRepo = (0, typeorm_1.getRepository)(shift_1.Shift);
        const shift = yield shiftRepo.findOne({
            where: { id: shiftId },
            relations: ["user"],
        });
        if (!shift)
            throw new errorHandler_1.default("Shift not found", 404);
        const now = new Date();
        shift.status = shift_1.ShiftStatus.FORCE_CLOSED;
        shift.shiftEndType = shift_1.ShiftEndType.ADMIN_FORCE_CLOSE;
        shift.clockOutTime = now;
        shift.adminNotes = adminNotes;
        shift.approvedByAdminId = userId;
        shift.approvalTime = now;
        shift.isClockedIn = false;
        shift.totalWorkDuration = calculateWorkDuration(shift.clockInTime, now, shift.breaks);
        yield shiftRepo.save(shift);
        yield (0, typeorm_1.getRepository)(user_1.User).update(shift.user.id, { clockedIn: false });
        server_1.io.emit("shiftUpdate", {
            userId: shift.user.id,
            status: "force-closed",
            shiftId,
        });
        res.json({
            success: true,
            message: "Shift force closed successfully",
            data: shift,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.forceEndShift = forceEndShift;
const calculateLateMinutes = (clockIn, shiftType) => {
    const shiftStart = SHIFT_TIMES[shiftType].start;
    const [hours, minutes] = shiftStart.split(":").map(Number);
    const shiftStartDate = new Date(clockIn);
    shiftStartDate.setHours(hours, minutes, 0, 0);
    return Math.max(0, Math.floor((clockIn.getTime() - shiftStartDate.getTime()) / 60000));
};
const calculateWorkDuration = (clockIn, clockOut, breaks) => {
    const totalMs = (clockOut === null || clockOut === void 0 ? void 0 : clockOut.getTime()) - (clockIn === null || clockIn === void 0 ? void 0 : clockIn.getTime());
    const breakTimeMs = breaks.reduce((acc, b) => acc + (b.duration ? b.duration * 60000 : 0), 0);
    return Math.max(0, (totalMs - breakTimeMs) / 60000);
};
const calculateOvertime = (shiftType, totalWorkDuration) => {
    const standardDurations = {
        morning: 7 * 60,
        afternoon: 6 * 60,
        night: 11 * 60,
    };
    return Math.max(0, totalWorkDuration - standardDurations[shiftType]);
};
// Get Current Active for a user
const getCurrentShift = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        console.log(req.user);
        if (!userId)
            throw new errorHandler_1.default("Unauthorized", 401);
        const userRepo = (0, typeorm_1.getRepository)(user_1.User);
        const shiftRepo = (0, typeorm_1.getRepository)(shift_1.Shift);
        const user = yield userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new errorHandler_1.default("User not found", 404);
        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes();
        let shiftType;
        // if (currentTime >= 800 && currentTime < 1500) {
        //   shiftType = ShiftType.MORNING;
        // } else if (currentTime >= 1500 && currentTime < 2100) {
        //   shiftType = ShiftType.AFTERNOON;
        // } else {
        //   shiftType = ShiftType.NIGHT;
        // }
        const currentShift = yield shiftRepo.findOne({
            where: {
                user: { id: userId },
                shiftType: shift_1.ShiftType.AFTERNOON,
                status: shift_1.ShiftStatus.ACTIVE,
            },
            relations: ["user"],
        });
        if (!currentShift) {
            throw new errorHandler_1.default("No active shift found for current session", 404);
        }
        res.json({
            success: true,
            message: "Current shift retrieved successfully",
            data: {
                shift: currentShift,
                currentSession: shift_1.ShiftType.AFTERNOON,
                isActive: currentShift.status === shift_1.ShiftStatus.ACTIVE,
                clockedIn: currentShift.isClockedIn,
                workDuration: currentShift.totalWorkDuration || 0,
                breaks: currentShift.breaks || [],
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getCurrentShift = getCurrentShift;
const isWithinShiftHours = (currentTime, shiftType) => {
    switch (shiftType) {
        case shift_1.ShiftType.MORNING:
            return currentTime >= 800 && currentTime < 1500;
        case shift_1.ShiftType.AFTERNOON:
            return currentTime >= 1500 && currentTime < 2100;
        case shift_1.ShiftType.NIGHT:
            return currentTime >= 2100 || currentTime < 800;
        default:
            return false;
    }
};
exports.isWithinShiftHours = isWithinShiftHours;
