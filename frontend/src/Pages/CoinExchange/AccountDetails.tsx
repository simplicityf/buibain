import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Alert,
  Card,
  CardContent,
  Collapse,
  styled,
  Button,
  Chip,
  AlertTitle,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import WarningIcon from "@mui/icons-material/Warning";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import RefreshIcon from "@mui/icons-material/Refresh";

// Styled Components
const AccountCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: "12px",
  border: "1px solid rgba(248, 188, 8, 0.1)",
  backgroundColor: "#FFFFFF",
  transition: "all 0.2s ease",
  "&:hover": {
    boxShadow: "0 4px 20px rgba(248, 188, 8, 0.1)",
  },
}));

const PlatformHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(2),
  cursor: "pointer",
  "&:hover": {
    backgroundColor: "rgba(248, 188, 8, 0.05)",
  },
}));

const StyledIconButton = styled(IconButton)({
  color: "#F8BC08",
  "&:hover": {
    backgroundColor: "rgba(248, 188, 8, 0.1)",
  },
});

interface Balance {
  totalBalance: number;
  usdtBalance: number;
  excessCoins?: number;
  capitalCoinLimit?: number;
}

interface Account {
  id: string;
  name: string;
  balances: Balance;
  status: "active" | "error" | "maintenance";
}

interface AccountDetailsProps {
  account: any;
  onRefresh: () => void;
  lastUpdate: string;
  isLoading: boolean;
  onExchange?: any;
}

const formatBTC = (value: number) => `${value.toFixed(4)} BTC`;
const formatUSDT = (value: number) =>
  `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const AccountDetails: React.FC<any> = ({
  account,
  onRefresh,
  lastUpdate,
  isLoading,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  return (
    <AccountCard elevation={0}>
      <PlatformHeader onClick={() => setIsExpanded(!isExpanded)}>
        <Box className="flex items-center gap-3">
          <Box className="w-10 h-10 rounded-lg bg-button/10 flex items-center justify-center">
            <AccountBalanceWalletIcon className="text-button" />
          </Box>
          <Box>
            <Typography variant="h6" className="font-primary font-semibold">
              {account.name}
            </Typography>
            <Typography variant="body2" className="text-text2 font-secondary">
              Last update: {lastUpdate}
            </Typography>
          </Box>
        </Box>
        <Box className="flex items-center gap-4">
          <Chip
            label={account.status.toUpperCase()}
            color={account.status === "active" ? "success" : "warning"}
            size="small"
            className="font-secondary"
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
      </PlatformHeader>

      <Collapse in={isExpanded}>
        <CardContent className="px-6 pt-4 pb-6">
          {account.status === "error" ? (
            <Alert
              severity="error"
              className="rounded-lg font-secondary"
              action={
                <Button color="inherit" size="small" onClick={onRefresh}>
                  Retry
                </Button>
              }
            >
              Unable to fetch balance for {account.name}
            </Alert>
          ) : (
            <>
              {/* Balance Section */}
              <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <BalanceCard
                  title="Total Wallet Balance"
                  value={formatBTC(account.balances.totalBalance)}
                  subtitle="Available BTC"
                />
                <BalanceCard
                  title="Total USDT Balance"
                  value={formatUSDT(account.balances.usdtBalance)}
                  subtitle="Available USDT"
                />
              </Box>

              {/* Excess Coins Warning */}
              {account.balances.excessCoins &&
                account.balances.excessCoins > 0 && (
                  <Alert
                    severity="warning"
                    className="mb-6 rounded-lg"
                    icon={<WarningIcon />}
                  >
                    <AlertTitle className="font-primary">
                      Excess Coins Detected
                    </AlertTitle>
                    <Typography className="font-secondary">
                      {formatBTC(account.balances.excessCoins)} above capital
                      limit
                      {account.balances.capitalCoinLimit &&
                        ` of ${formatBTC(account.balances.capitalCoinLimit)}`}
                    </Typography>
                  </Alert>
                )}
            </>
          )}
        </CardContent>
      </Collapse>
    </AccountCard>
  );
};

const BalanceCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
}> = ({ title, value, subtitle }) => (
  <Card className="p-4 border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
    <Typography variant="body2" className="text-text2 font-secondary mb-1">
      {title}
    </Typography>
    <Typography variant="h5" className="font-primary font-bold text-gray-900">
      {value}
    </Typography>
    <Typography variant="body2" className="text-text2 font-secondary">
      {subtitle}
    </Typography>
  </Card>
);

export default AccountDetails;
