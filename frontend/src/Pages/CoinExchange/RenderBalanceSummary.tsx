// BalanceSummary.tsx
import React from "react";
import {
  Card,
  CardContent,
  IconButton,
  Typography,
  Grid,
  Box as MuiBox,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { RefreshCw, Wallet } from "lucide-react";
import CurrencyBitcoinIcon from "@mui/icons-material/CurrencyBitcoin";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import TimelineIcon from "@mui/icons-material/Timeline";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

// Types
interface PlatformData {
  name: string;
  logo: string;
  balance: number;
  usdValue: number;
  change24h: number;
  status: string;
}

interface BalanceData {
  totalCoins: number;
  capCoin: number;
  excessCoin: number;
  totalUSDT: number;
  averageRate: number;
  lastExchangeTime: string;
}

interface RateHistoryItem {
  time: string;
  rate: number;
  volume: number;
}

interface MockData {
  platforms: Record<string, PlatformData>;
  balances: BalanceData;
  rateHistory: RateHistoryItem[];
}

// Styled Components
const AnimatedValue = styled(Typography)(({ theme }) => ({
  transition: "all 0.3s ease-in-out",
  "&:hover": {
    transform: "scale(1.02)",
  },
}));

export const StyledCard = styled(Card)(({ theme }) => ({
  height: "100%",
  backgroundColor: theme.palette.background.paper,
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
  "&:hover": {
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
  },
  transition: "all 0.3s ease-in-out",
  borderRadius: "16px",
  overflow: "hidden",
}));

const GradientCard = styled(StyledCard)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  color: "white",
}));

const MetricCard = styled(MuiBox)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: "12px",
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  backdropFilter: "blur(10px)",
}));

const StyledChip = styled("div")(({ theme }) => ({
  padding: "4px 12px",
  borderRadius: "8px",
  fontSize: "0.75rem",
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
}));

// Utility Functions
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
};

const formatBTC = (value: number): string => {
  return value.toFixed(4) + " BTC";
};

// Mock Data
const mockData: MockData = {
  platforms: {
    paxful: {
      name: "Paxful",
      logo: "/paxful.jpg",
      balance: 2.45,
      usdValue: 102900,
      change24h: 3.2,
      status: "active",
    },
    noones: {
      name: "Noones",
      logo: "/noones.png",
      balance: 1.82,
      usdValue: 76440,
      change24h: -1.5,
      status: "maintenance",
    },
    binance: {
      name: "Binance",
      logo: "/binance.jpg",
      balance: 3.21,
      usdValue: 134820,
      change24h: 2.8,
      status: "active",
    },
  },
  balances: {
    totalCoins: 7.48,
    capCoin: 5.0,
    excessCoin: 2.48,
    totalUSDT: 124500,
    averageRate: 41500,
    lastExchangeTime: "4 hours ago",
  },
  rateHistory: [
    { time: "12:00", rate: 41200, volume: 1.2 },
    { time: "13:00", rate: 41500, volume: 1.8 },
    { time: "14:00", rate: 41300, volume: 1.5 },
    { time: "15:00", rate: 41800, volume: 2.1 },
    { time: "16:00", rate: 42000, volume: 1.9 },
  ],
};

const BalanceSummary: React.FC = () => {
  return (
    <>
      {/* Total Balance Summary */}
      <Grid container spacing={4} className="mb-8">
        <Grid item xs={12} md={6}>
          <GradientCard>
            <CardContent className="p-6">
              <MuiBox className="flex justify-between items-center mb-6">
                <MuiBox className="flex items-center gap-2">
                  <CurrencyBitcoinIcon fontSize="large" />
                  <Typography variant="h5" className="font-bold">
                    Total Balance Overview
                  </Typography>
                </MuiBox>
                <IconButton color="inherit" size="small">
                  <RefreshCw className="w-5 h-5" />
                </IconButton>
              </MuiBox>
              <Grid container spacing={4}>
                <Grid item xs={6}>
                  <MetricCard>
                    <MuiBox className="space-y-2">
                      <Typography variant="subtitle2" className="opacity-80">
                        Total Coins
                      </Typography>
                      <AnimatedValue variant="h4" className="font-bold">
                        {formatBTC(mockData.balances.totalCoins)}
                      </AnimatedValue>
                      <Typography variant="body2" className="opacity-75">
                        ≈{" "}
                        {formatCurrency(
                          mockData.balances.totalCoins *
                            mockData.balances.averageRate
                        )}
                      </Typography>
                    </MuiBox>
                  </MetricCard>
                </Grid>
                <Grid item xs={6}>
                  <MetricCard>
                    <MuiBox className="space-y-2">
                      <Typography variant="subtitle2" className="opacity-80">
                        Excess Coins
                      </Typography>
                      <AnimatedValue variant="h4" className="font-bold">
                        {formatBTC(mockData.balances.excessCoin)}
                      </AnimatedValue>
                      <Typography variant="body2" className="opacity-75">
                        Cap: {formatBTC(mockData.balances.capCoin)}
                      </Typography>
                    </MuiBox>
                  </MetricCard>
                </Grid>
              </Grid>
            </CardContent>
          </GradientCard>
        </Grid>
      </Grid>

      {/* Platform Balances */}
      <MuiBox className="mb-4 flex items-center justify-between">
        <MuiBox className="flex items-center gap-2">
          <AccountBalanceWalletIcon />
          <Typography variant="h5" className="font-bold">
            Platform Balances
          </Typography>
        </MuiBox>
      </MuiBox>

      <Grid container spacing={4}>
        {Object.entries(mockData.platforms).map(([key, platform]) => (
          <Grid item xs={12} md={4} key={key}>
            <StyledCard>
              <CardContent className="p-6">
                <MuiBox className="flex justify-between items-start mb-6">
                  <MuiBox className="flex w-max items-center gap-4">
                    <img
                      src={platform.logo}
                      alt={platform.name}
                      className="w-max h-6 object-cover object-center"
                    />
                    <MuiBox>
                      <Typography variant="h6" className="font-bold">
                        {platform.name}
                      </Typography>
                    </MuiBox>
                  </MuiBox>
                  <TrendingUpIcon className="text-gray-400" />
                </MuiBox>
                <MuiBox className="space-y-4">
                  <MuiBox>
                    <AnimatedValue variant="h4" className="font-bold">
                      {formatBTC(platform.balance)}
                    </AnimatedValue>
                    <Typography className="text-gray-500 mt-1">
                      {formatCurrency(platform.usdValue)}
                    </Typography>
                  </MuiBox>
                </MuiBox>
              </CardContent>
            </StyledCard>
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default BalanceSummary;
