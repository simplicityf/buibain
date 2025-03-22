import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Collapse,
  styled,
  Button,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "../../api/user";
import { ResInterface } from "../../lib/interface";
import Loading from "../../Components/Loading";
import { CopyAll } from "@mui/icons-material";

// Styled Components
const DashboardCard = styled(Card)({
  background: "linear-gradient(135deg, #F8BC08 0%, #C6980C 100%)",
  color: "white",
  borderRadius: "16px",
  marginBottom: "24px",
  backdropFilter: "blur(10px)",
  boxShadow: "0 8px 32px rgba(248, 188, 8, 0.1)",
  transition: "transform 0.3s ease",
  "&:hover": {
    transform: "translateY(-2px)",
  },
});

const PlatformCard = styled(Card)(({ theme }) => ({
  borderRadius: "12px",
  padding: theme.spacing(0),
  marginBottom: theme.spacing(2),
  border: "1px solid rgba(248, 188, 8, 0.1)",
  background: "#FFFFFF",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)",
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: "0 8px 24px rgba(248, 188, 8, 0.15)",
    borderColor: "#F8BC08",
  },
}));

const StyledIconButton = styled(IconButton)({
  color: "#F8BC08",
  "&:hover": {
    backgroundColor: "rgba(248, 188, 8, 0.1)",
  },
});

// Main Component
const BalanceCheckUI: React.FC = () => {
  const [lastUpdate, setLastUpdate] = useState("4 hours ago");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<string[]>([]);
  const [filter, setFilter] = useState("all");
  const [rateHistory, setRateHistory] = useState<
    Array<{ time: string; rate: number }>
  >([]);
  const [balances, setBalances] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [capitalLimit, setCapitalLimit] = useState<number>(100);

  const groupPlatformsByType = () => {
    return Object.entries(balances).reduce(
      (acc, [platformId, platformData]) => {
        const type = platformData.platform || "other";
        console.log(`This is acc type`, platformData);
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push({ platformId, ...platformData });
        return acc;
      },
      {} as Record<string, Array<{ platformId: string; [key: string]: any }>>
    );
  };

  const calculateTotalBTC = (balances: Record<string, any>): number => {
    let totalBTC = 0;
    Object.values(balances).forEach((platformData) => {
      if (platformData.balances && Array.isArray(platformData.balances)) {
        platformData.balances.forEach((balance: any) => {
          if (balance.currency === "BTC") {
            const btcBalance =
              typeof balance.balance === "string"
                ? parseFloat(balance.balance)
                : balance.balance;
            totalBTC += btcBalance;
          }
        });
      }
    });
    return totalBTC;
  };

  const totalBTCBalance = calculateTotalBTC(balances);
  const calculateExcessCoins = (
    totalBTC: number,
    capitalLimit: number
  ): number => {
    return Math.max(totalBTC - capitalLimit, 0);
  };

  const excessCoins = calculateExcessCoins(totalBTCBalance, capitalLimit);

  const fetchWalletBalances = async () => {
    setIsLoading(true);
    try {
      const response: ResInterface = await api.get("/trade/wallet-balances");
      if (response?.success) {
        const history = Object.values(response.data).flatMap((platform: any) =>
          platform.balances
            .filter((b: any) => b.currency === "BTC")
            .map((btcBalance: any) => ({
              time: new Date().toLocaleTimeString(),
              rate:
                typeof btcBalance.balance === "string"
                  ? parseFloat(btcBalance.balance)
                  : btcBalance.balance,
            }))
        );
        setRateHistory((prev) => [...prev.slice(-10), ...history.slice(0, 2)]);
        setBalances(response.data);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching wallet balances:", err);
      setError("Failed to fetch wallet balances. Please try again.");
    } finally {
      setIsLoading(false);
      setLastUpdate("Just now");
    }
  };

  useEffect(() => {
    fetchWalletBalances();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchWalletBalances();
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleTypeExpand = (type: string) => {
    setExpandedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handlePlatformExpand = (platformId: string) => {
    setExpandedPlatform((prev) => (prev === platformId ? null : platformId));
  };

  const handleFilterChange = (event: any) => {
    setFilter(event.target.value);
  };

  if (isLoading) return <Loading />;

  const groupedPlatforms = groupPlatformsByType();

  return (
    <Box className="min-h-screen bg-white font-primary p-6 rounded-md px-8">
      {/* Top Metrics Section */}
      <Box className="flex justify-between items-center mb-6">
        <h1 className="font-semibold text-gray-800 text-[30px]">
          Coin Exchange Page
        </h1>
        <Box className="flex items-center gap-4">
          <FormControl size="small" className="w-40">
            <InputLabel>Filter</InputLabel>
            <Select value={filter} onChange={handleFilterChange} label="Filter">
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="usdt">USDT Only</MenuItem>
              <MenuItem value="btc">BTC Only</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchWalletBalances}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Metrics Grid */}
      <Box className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Total Coins and Excess Coins Cards */}
        <DashboardCard
          sx={{
            background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
            boxShadow: "0 8px 32px rgba(255, 165, 0, 0.3)",
          }}
        >
          <CardContent className="p-6">
            <Box className="flex justify-between items-center mb-6">
              <Typography variant="h5" className="font-primary font-bold">
                Dashboard Metrics
              </Typography>
              <StyledIconButton size="small" sx={{ color: "black" }}>
                <RefreshIcon />
              </StyledIconButton>
            </Box>
            <Box className="flex flex-col gap-8">
              {/* Total Coins Box */}
              <Box className="p-4 bg-black/10 rounded-xl backdrop-blur-sm border border-white/20 relative">
                {/* Copy Button */}
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(totalBTCBalance.toFixed(3))
                  }
                  className="absolute top-4 right-4 p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-all duration-300"
                  title="Copy BTC Value"
                >
                  <CopyAll sx={{ fontSize: "18px", color: "#3b82f6" }} />
                </button>

                {/* Content */}
                <Typography className="text-black/90 font-secondary mb-2">
                  Total Coins
                </Typography>
                <Typography className="text-4xl font-bold font-primary mb-1 text-black">
                  {totalBTCBalance.toFixed(3)}{" "}
                  <span className="text-blue-500">BTC</span>
                </Typography>
                <Typography className="text-black/80 font-secondary">
                  ≈ ${balances.totalUSDT?.toLocaleString() || "0.00"}
                </Typography>
              </Box>

              <Box className="p-4 bg-black/10 rounded-xl backdrop-blur-sm border border-white/20 relative">
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(excessCoins.toFixed(3))
                  }
                  className="absolute top-4 right-4 p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-all duration-300"
                  title="Copy Excess Coins Value"
                >
                  <CopyAll sx={{ fontSize: "18px", color: "#3b82f6" }} />
                </button>

                <Typography className="text-black/90 font-secondary mb-2">
                  Excess Coins
                </Typography>
                <Typography className="text-4xl font-bold font-primary mb-1 text-black">
                  {excessCoins.toFixed(3)}{" "}
                  <span className="text-blue-500">BTC</span>
                </Typography>
                <Typography className="text-black/80 font-secondary">
                  Cap: {capitalLimit.toFixed(4)} BTC
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </DashboardCard>

        {/* Rate History Chart */}
        <DashboardCard
          sx={{
            background: "linear-gradient(135deg, #4A90E2 0%, #2B6CB0 100%)",
            boxShadow: "0 8px 32px rgba(74, 144, 226, 0.2)",
          }}
        >
          <CardContent className="p-6">
            <Box className="flex justify-between items-center mb-4">
              <Typography variant="h5" className="font-primary font-bold">
                BTC Balance History
              </Typography>
              <StyledIconButton size="small" sx={{ color: "white" }}>
                <RefreshIcon />
              </StyledIconButton>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rateHistory}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.2)"
                />
                <XAxis dataKey="time" stroke="white" tick={{ fontSize: 12 }} />
                <YAxis
                  stroke="white"
                  tickFormatter={(value) => value.toFixed(4)}
                />
                <Tooltip
                  contentStyle={{
                    background: "#2B6CB0",
                    borderRadius: "8px",
                  }}
                  formatter={(value: any) => [
                    value.toFixed(8) + " BTC",
                    "Rate",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#FFD700"
                  strokeWidth={2}
                  dot={{ fill: "#FFD700", strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </DashboardCard>
      </Box>

      <h1 className="font-bold text-2xl font-secondary mb-4">
        Accounts Wallet Balance
      </h1>

      {/* Platform Type Groups */}
      {Object.entries(groupedPlatforms).map(([type, platforms]) => (
        <PlatformCard key={type}>
          <Box
            className="cursor-pointer"
            onClick={() => handleTypeExpand(type)}
            sx={{
              backgroundColor: "#f8f9fa",
              padding: 2,
              borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
            }}
          >
            <Box className="flex justify-between items-center">
              <Typography variant="h6" className="font-semibold text-gray-800">
                {type.charAt(0).toUpperCase() + type.slice(1)} Accounts
              </Typography>
              <KeyboardArrowDownIcon
                className={`transform transition-transform duration-300 ${
                  expandedTypes.includes(type) ? "rotate-180" : ""
                }`}
              />
            </Box>
          </Box>

          <Collapse in={expandedTypes.includes(type)}>
            <Box className="p-4 space-y-4">
              {platforms.map((platform) => (
                <div key={platform.platformId} className="border rounded-lg">
                  <Box
                    className="cursor-pointer"
                    onClick={() => handlePlatformExpand(platform.platformId)}
                    sx={{
                      padding: 2,
                      "&:hover": { backgroundColor: "#f8f9fa" },
                    }}
                  >
                    <Box className="flex justify-between items-center">
                      <Typography variant="subtitle1" className="font-medium">
                        {platform.label}
                      </Typography>
                      <KeyboardArrowDownIcon
                        className={`transform transition-transform duration-300 ${
                          expandedPlatform === platform.platformId
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                    </Box>
                  </Box>

                  <Collapse in={expandedPlatform === platform.platformId}>
                    <Box className="px-4 pb-4 space-y-4">
                      {platform.balances.map((balance: any, index: number) => (
                        <AccountCard
                          key={index}
                          account={balance}
                          onRefresh={fetchWalletBalances}
                          lastUpdate={lastUpdate}
                          isLoading={isLoading}
                        />
                      ))}
                    </Box>
                  </Collapse>
                </div>
              ))}
            </Box>
          </Collapse>
        </PlatformCard>
      ))}
    </Box>
  );
};

// Account Card Component (keep the same as original)
const AccountCard: React.FC<any> = ({
  account,
  onRefresh,
  lastUpdate,
  isLoading,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="p-4 border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
      <Box
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Box className="flex justify-between items-center">
          <Typography
            variant="subtitle1"
            className="font-semibold text-gray-800"
          >
            {account.currency}
          </Typography>
          <Box className="flex items-center gap-4">
            <Chip
              label={account.type.toUpperCase()}
              color={
                account.type === "crypto"
                  ? "success"
                  : account.type === "fiat"
                  ? "primary"
                  : "warning"
              }
              size="small"
            />
            <StyledIconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onRefresh();
              }}
              className={isLoading ? "animate-spin" : ""}
            >
              <RefreshIcon />
            </StyledIconButton>
            <KeyboardArrowDownIcon
              className={`transform transition-transform duration-300 text-button
                ${isExpanded ? "rotate-180" : ""}`}
            />
          </Box>
        </Box>
      </Box>

      <Collapse in={isExpanded}>
        <Box className="mt-4 space-y-4">
          <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BalanceCard
              title="Balance"
              value={`${account?.balance || "0.0000"} ${account?.currency}`}
              subtitle={`Available ${account.currency}`}
            />
            <BalanceCard
              title="Name"
              value={account.name}
              subtitle="Currency Name"
            />
          </Box>
        </Box>
      </Collapse>
    </Card>
  );
};

// Balance Card Component (keep the same as original)
const BalanceCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
}> = ({ title, value, subtitle }) => (
  <Card className="p-4 border border-gray-100 bg-white">
    <Typography variant="body2" className="text-text2 mb-1">
      {title}
    </Typography>
    <Typography variant="h5" className="font-bold text-gray-900">
      {value}
    </Typography>
    <Typography variant="body2" className="text-text2">
      {subtitle}
    </Typography>
  </Card>
);

export default BalanceCheckUI;
