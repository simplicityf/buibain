import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  Typography,
  IconButton,
  Stack,
  Button,
  useTheme,
  alpha,
  Menu,
  MenuItem,
  Tooltip,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  TrendingUp,
  Assignment,
  Warning,
  CloudOff,
  Speed as SpeedIcon,
  WavingHand as WavingHandIcon,
  Construction as ConstructionIcon,
  Timeline,
} from "@mui/icons-material";
import ForexAnalytics from "./ForexAnalytics";
import { useUserContext } from "../../Components/ContextProvider";
import { RefreshCwIcon } from "lucide-react";
import { getDashboardStats } from "../../api/trade";

const StatusCard: React.FC<{
  title: string;
  value: any;
  subtitle: string;
  icon: any;
  color: string;
}> = ({ title, value, subtitle, icon, color }) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: "100%",
        background: `linear-gradient(135deg, ${alpha(color, 0.12)} 0%, ${alpha(
          color,
          0.05
        )} 100%)`,
        border: `1px solid ${alpha(color, 0.1)}`,
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 4px 20px ${alpha(color, 0.15)}`,
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(color, 0.12),
              color: color,
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: color,
            }}
          >
            {value}
          </Typography>
        </Stack>
        <Typography
          variant="subtitle2"
          sx={{
            mt: 2,
            mb: 0.5,
            color: theme.palette.text.secondary,
            fontWeight: 500,
          }}
        >
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
    </Card>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const { user } = useUserContext();
  const [stats, setStats] = useState({
    currentlyAssigned: 0,
    notYetAssigned: 0,
    escalated: 0,
    paidButNotMarked: 0,
    totalTradesNGN: 0,
    totalTradesBTC: 0,
    averageResponseTime: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getDashboardStats();
        if (response.data) {
          setStats({
            currentlyAssigned: response.data.currentlyAssigned,
            notYetAssigned: response.data.notYetAssigned,
            escalated: response.data.escalated,
            paidButNotMarked: response.data.paidButNotMarked,
            totalTradesNGN: response.data.totalTradesNGN,
            totalTradesBTC: response.data.totalTradesBTC,
            averageResponseTime: response.data.averageResponseTime,
          });
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleMenuClick = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleClearCache = () => {
    handleMenuClose();
  };

  const handleMaintenanceMode = () => {
    setMaintenanceMode(!maintenanceMode);
    handleMenuClose();
  };

  const fullName = user?.fullName?.toString() || "";
  const firstName = fullName.split(" ")[0];

  return (
    <Box sx={{ p: 3, maxWidth: "2xl", mx: "auto" }}>
      <Box
        sx={{
          mb: 4,
          p: 3,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.error.dark} 100%)`,
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            p: 1,
          }}
        >
          <Stack direction="row" spacing={1}>
            <Tooltip title="Clear Cache">
              <Button
                variant="contained"
                size="small"
                startIcon={<CloudOff />}
                onClick={handleClearCache}
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                  },
                }}
              >
                Clear Cache
              </Button>
            </Tooltip>
            <Tooltip title="Maintenance Settings">
              <IconButton onClick={handleMenuClick} sx={{ color: "white" }}>
                <ConstructionIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            Hello {firstName}
            <WavingHandIcon sx={{ fontSize: 32 }} />
          </Typography>
        </Stack>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMaintenanceMode}>
            <FormControlLabel
              control={
                <Switch
                  checked={maintenanceMode}
                  onChange={handleMaintenanceMode}
                  color="primary"
                />
              }
              label="Maintenance Mode"
            />
          </MenuItem>
        </Menu>

        {/* System Status Cards */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "rgba(0, 0, 0, 0.1)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <SpeedIcon />
                  <Typography variant="subtitle1">Uptime</Typography>
                </Stack>
                <Typography
                  variant="h4"
                  sx={{ color: "#4CAF50", fontWeight: 700 }}
                >
                  99.9%
                </Typography>
              </Stack>
              <Typography
                variant="caption"
                sx={{ color: "rgba(255, 255, 255, 0.7)" }}
              >
                Last 30 Days
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "rgba(0, 0, 0, 0.1)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Warning />
                  <Typography variant="subtitle1">Errors</Typography>
                </Stack>
                <Typography
                  variant="h4"
                  sx={{ color: "#f44336", fontWeight: 700 }}
                >
                  5
                </Typography>
              </Stack>
              <Typography
                variant="caption"
                sx={{ color: "rgba(255, 255, 255, 0.7)" }}
              >
                Last 30 Days
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
      {/* Status Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard
            title="Currently Assigned"
            value={stats.currentlyAssigned.toString()}
            subtitle="Active assignments"
            icon={<Assignment />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard
            title="Not Yet Assigned"
            value={stats.notYetAssigned.toString()}
            subtitle="Pending assignments"
            icon={<Timeline />}
            color={theme.palette.warning.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard
            title="Escalated"
            value={stats.escalated.toString()}
            subtitle="Requires attention"
            icon={<TrendingUp />}
            color={theme.palette.error.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard
            title="Paid but not marked"
            value={stats.paidButNotMarked.toString()}
            subtitle="Pending verification"
            icon={<RefreshCwIcon />}
            color={theme.palette.success.main}
          />
        </Grid>
      </Grid>

      {/* Trades Section */}
      <Card sx={{ mb: 4 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600}>
            TRADES PAID REALTIME
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              >
                <Typography variant="h4" fontWeight={700} color="primary">
                  {stats.averageResponseTime.toFixed(1)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  AVERAGE RESPONSE TIME OF PAYER (SECS)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.warning.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                }}
              >
                <Typography variant="h4" fontWeight={700} color="warning.main">
                  {stats.totalTradesNGN.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  TOTAL (NGN)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.success.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                }}
              >
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {stats.totalTradesBTC.toFixed(5)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  TOTAL (BTC)
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Additional content */}
    </Box>
  );
};

export default Dashboard;
