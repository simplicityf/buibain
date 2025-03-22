import { useState } from "react";
import {
  Box,
  Card,
  Typography,
  IconButton,
  Stack,
  Button,
  useTheme,
  alpha,
  ButtonGroup,
  Avatar,
  Chip,
} from "@mui/material";
import {
  ArrowUpward,
  ArrowDownward,
  Analytics,
  Refresh,
} from "@mui/icons-material";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Bar,
  Legend,
} from "recharts";

// Sample forex data
const forexData = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  EUR: 1.0 + Math.random() * 0.1,
  GBP: 1.2 + Math.random() * 0.1,
  JPY: 110 + Math.random() * 5,
  volume: 1000 + Math.random() * 500,
  volatility: Math.random() * 0.5,
}));

const currencyPairData = [
  { pair: "BTC/NGN", change: 0.75, price: 1.0876, volume: "12.5M" },
  { pair: "GBP/USD", change: -0.45, price: 1.2534, volume: "8.2M" },
  { pair: "USD/JPY", change: 1.2, price: 115.67, volume: "10.1M" },
  { pair: "USD/CHF", change: -0.3, price: 0.9245, volume: "5.8M" },
];

const ForexAnalytics = () => {
  const theme = useTheme();
  const [timeframe, setTimeframe] = useState("1H");

  const timeframes = ["1H", "4H", "1D", "1W", "1M"];

  return (
    <Box sx={{ mt: 4 }}>
      <Card
        sx={{
          my: 2,
          boxShadow: "none",
          background: "transparent",
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}
            >
              <Analytics />
            </Avatar>
            <Typography variant="h5" fontWeight={600}>
              Forex Market Analytics
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <ButtonGroup size="small">
              {timeframes.map((tf) => (
                <Button
                  key={tf}
                  variant={timeframe === tf ? "contained" : "outlined"}
                  onClick={() => setTimeframe(tf)}
                >
                  {tf}
                </Button>
              ))}
            </ButtonGroup>
            <IconButton>
              <Refresh />
            </IconButton>
          </Stack>
        </Stack>

        {/* Currency Pairs Overview - Replaced Grid with Box */}
        <Box
          sx={{
            display: "grid",
            // xs: 1 column, sm: 2 columns, md: 4 columns
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" },
            gap: 3,
            mb: 4,
          }}
        >
          {currencyPairData.map((pair) => (
            <Card
              key={pair.pair}
              sx={{
                p: 2,
                backgroundColor: "background.paper",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                },
              }}
            >
              <Stack spacing={1}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="h6" fontWeight={600}>
                    {pair.pair}
                  </Typography>
                  <Chip
                    size="small"
                    icon={pair.change > 0 ? <ArrowUpward /> : <ArrowDownward />}
                    label={`${Math.abs(pair.change)}%`}
                    color={pair.change > 0 ? "success" : "error"}
                  />
                </Stack>
                <Typography variant="h4" fontWeight={700}>
                  {pair.price}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Volume: {pair.volume}
                </Typography>
              </Stack>
            </Card>
          ))}
        </Box>

        {/* Main Chart */}
        <Card sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Currency Pair Performance
          </Typography>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forexData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="EUR"
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="GBP"
                  stroke={theme.palette.success.main}
                  strokeWidth={2}
                />
                <Bar
                  yAxisId="right"
                  dataKey="volume"
                  fill={alpha(theme.palette.warning.main, 0.4)}
                  barSize={20}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        </Card>

        {/* Additional Charts - Replaced Grid with Box */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            gap: 3,
          }}
        >
          {/* Volatility Chart */}
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Market Volatility
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forexData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="volatility"
                    stroke={theme.palette.error.main}
                    fill={alpha(theme.palette.error.main, 0.1)}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Card>

          {/* Price Movement Chart */}
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Price Movements
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forexData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="JPY"
                    stroke={theme.palette.info.main}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Box>
      </Card>
    </Box>
  );
};

export default ForexAnalytics;
