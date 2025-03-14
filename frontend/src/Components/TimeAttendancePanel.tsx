import React, { useEffect, useState } from "react";
import { getShiftMetrics } from "../api/shift";
import { format } from "date-fns";
import {
  Box,
  Grid,
  Paper,
  Stack,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";
import {
  AccessTime as ClockIcon,
  Warning as WarningIcon,
  Timer as TimerIcon,
  LocalCafe as BreakIcon,
  Update as DurationIcon,
  Speed as PerformanceIcon,
} from "@mui/icons-material";

const TimeAttendancePanel: React.FC<{ userId: string }> = ({ userId }) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      const startDate = format(new Date().setDate(1), "yyyy-MM-dd");
      const endDate = format(new Date(), "yyyy-MM-dd");
      const response = await getShiftMetrics(userId, startDate, endDate);
      if (response?.success) {
        setMetrics(response.data);
      }
    };
    fetchMetrics();
  }, [userId]);

  const metricsData = [
    {
      title: "Total Shifts",
      value: metrics?.totalShifts || 0,
      icon: <ClockIcon />,
      color: theme.palette.primary.main,
      suffix: "",
    },
    {
      title: "Work Duration",
      value: metrics?.totalWorkDuration || 0,
      icon: <DurationIcon />,
      color: theme.palette.success.main,
      suffix: " mins",
    },
    {
      title: "Break Duration",
      value: metrics?.totalBreakDuration || 0,
      icon: <BreakIcon />,
      color: theme.palette.info.main,
      suffix: " mins",
    },
    {
      title: "Late Minutes",
      value: metrics?.totalLateMinutes || 0,
      icon: <WarningIcon />,
      color: theme.palette.error.main,
      suffix: " mins",
    },
    {
      title: "Overtime",
      value: metrics?.totalOvertimeMinutes || 0,
      icon: <TimerIcon />,
      color: theme.palette.warning.main,
      suffix: " mins",
    },
    {
      title: "Late Clock-ins",
      value: metrics?.lateClockIns || 0,
      icon: <PerformanceIcon />,
      color: theme.palette.error.main,
      suffix: "",
    },
  ];

  return (
    <Box sx={{ p: "10px" }}>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metricsData.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Paper
              sx={{
                p: 3,
                height: "100%",
                bgcolor: alpha(item.color, 0.04),
                transition:
                  "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: theme.shadows[4],
                  bgcolor: alpha(item.color, 0.08),
                },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(item.color, 0.12),
                    color: item.color,
                  }}
                >
                  {item.icon}
                </Box>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    {item.title}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {item.value}
                    {item.suffix}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <div>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Shifts by Type
        </Typography>
        <Grid container spacing={3}>
          {Object.entries(metrics?.shiftsByType || {}).map(
            ([type, count]: any) => (
              <Grid item xs={12} sm={4} key={type}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: "center",
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)} Shift
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {count}
                  </Typography>
                </Paper>
              </Grid>
            )
          )}
        </Grid>
      </div>
    </Box>
  );
};

export default TimeAttendancePanel;
