import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Chip,
  Tooltip,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  styled,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  FilterList,
  Download,
  Refresh,
  ArrowUpward,
  ArrowDownward
} from "@mui/icons-material";
import { useUserContext } from "../../Components/ContextProvider";
import ClockedAlt from "../../Components/ClockedAlt";
import { getCompletedTrades } from "../../api/trade"; 

// Styled Components
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  padding: theme.spacing(2),
  color: theme.palette.text.primary,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const HeaderCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
}));

const TransactionHistory = () => {
  const { user } = useUserContext();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    itemsPerPage: 10,
  });
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ field: "", direction: "asc" });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayer, setSelectedPayer] = useState("");
  const [dateRange, setDateRange] = useState("");

  // Fetch trades from backend
  const fetchTrades = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const res = await getCompletedTrades(page, limit);
      if (res?.success && res.data) {
        setTransactions(res.data.trades);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching trades:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTrades();
  }, []);

  const handleSort = (field: string) => {
    setSortConfig((prevConfig) => ({
      field,
      direction: prevConfig.field === field && prevConfig.direction === "asc" ? "desc" : "asc",
    }));
    // Optionally: Implement client-side sorting here.
  };

  if (!user?.clockedIn && user?.userType !== "admin") {
    return <ClockedAlt />;
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <Container>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary", mb: 1 }}>
            Transaction History
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            Complete overview of all trading transactions and performance metrics
          </Typography>
        </Box>

        {/* Summary Stats Cards (if needed, update as per BE data) */}
        {/* ... Your summary stats section remains here ... */}

        {/* Filters and Actions */}
        <HeaderCard>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", gap: 2, flex: 1 }}>
              <TextField
                size="small"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ color: "text.secondary", mr: 1 }} />,
                }}
                sx={{ minWidth: 300 }}
              />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Payer</InputLabel>
                <Select value={selectedPayer} label="Payer" onChange={(e) => setSelectedPayer(e.target.value)}>
                  <MenuItem value="">All Payers</MenuItem>
                  <MenuItem value="john">John Doe</MenuItem>
                  <MenuItem value="jane">Jane Smith</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Date Range</InputLabel>
                <Select value={dateRange} label="Date Range" onChange={(e) => setDateRange(e.target.value)}>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                sx={{
                  borderColor: "primary.main",
                  color: "primary.main",
                  "&:hover": {
                    borderColor: "primary.dark",
                    bgcolor: "primary.lighter",
                  },
                }}
              >
                More Filters
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                sx={{
                  borderColor: "primary.main",
                  color: "primary.main",
                  "&:hover": {
                    borderColor: "primary.dark",
                    bgcolor: "primary.lighter",
                  },
                }}
              >
                Export
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => fetchTrades()}
                sx={{
                  borderColor: "primary.main",
                  color: "primary.main",
                  "&:hover": {
                    borderColor: "primary.dark",
                    bgcolor: "primary.lighter",
                  },
                }}
              >
                Refresh
              </Button>
            </Box>
          </Box>
        </HeaderCard>

        {/* Transactions Table */}
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 2,
            boxShadow: 1,
            overflow: "auto",
            maxHeight: "calc(100vh - 400px)",
            "& .MuiTable-root": {
              borderCollapse: "separate",
              borderSpacing: 0,
            },
            "&::-webkit-scrollbar": {
              width: 8,
              height: 8,
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "background.paper",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "divider",
              borderRadius: 4,
            },
          }}
        >
          <Table stickyHeader sx={{ minWidth: 2000 }}>
            <TableHead>
              <TableRow>
                {[
                  { id: "sn", label: "S/N", width: 70 },
                  { id: "payer", label: "Payer", width: 150 },
                  { id: "payingBank", label: "Paying Bank", width: 150 },
                  { id: "platformAccount", label: "Platform Account", width: 180 },
                  { id: "tradeHash", label: "Trade Hash", width: 200 },
                  { id: "sellerUsername", label: "Seller Username", width: 150 },
                  { id: "btcBought", label: "BTC Bought", width: 120 },
                  { id: "ngnPaid", label: "NGN Paid", width: 150 },
                  { id: "openedAt", label: "Opened At", width: 180 },
                  { id: "paidAt", label: "Paid At", width: 180 },
                  { id: "payerSpeed", label: "Payer's Speed (secs)", width: 150 },
                  { id: "ngnSellingPrice", label: "NGN Selling Price", width: 150 },
                  { id: "ngnCostPrice", label: "NGN Cost Price", width: 150 },
                  { id: "usdCost", label: "USD Cost", width: 120 },
                ].map((column) => (
                  <StyledTableCell
                    key={column.id}
                    onClick={() => handleSort(column.id)}
                    sx={{
                      cursor: "pointer",
                      width: column.width,
                      minWidth: column.width,
                      backgroundColor: "background.paper",
                      position: "sticky",
                      top: 0,
                      zIndex: 1,
                      py: 3,
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, width: "max-content" }}>
                        {column.label}
                      </Typography>
                      {/* Optionally show sort indicator */}
                      {sortConfig.field === column.id && (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          {sortConfig.direction === "asc" ? (
                            <ArrowUpward fontSize="small" />
                          ) : (
                            <ArrowDownward fontSize="small" />
                          )}
                        </Box>
                      )}
                    </Box>
                  </StyledTableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction, index) => (
                <TableRow
                  key={transaction.id + index}
                  hover
                  sx={{
                    "&:hover": { bgcolor: "action.hover" },
                    transition: "background-color 0.2s",
                  }}
                >
                  <TableCell sx={{ py: 2.5 }}>{index + 1}</TableCell>
                  <TableCell sx={{ py: 2.5 }}>{transaction.payer}</TableCell>
                  <TableCell sx={{ py: 2.5 }}>{transaction.payingBank}</TableCell>
                  <TableCell sx={{ py: 2.5 }}>{transaction.platformAccount}</TableCell>
                  <TableCell sx={{ py: 2.5 }}>
                    <Tooltip title={transaction.tradeHash}>
                      <Typography
                        noWrap
                        sx={{
                          maxWidth: 180,
                          color: "primary.main",
                          fontFamily: "monospace",
                        }}
                      >
                        {transaction.tradeHash}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ py: 2.5 }}>{transaction.sellerUsername}</TableCell>
                  <TableCell sx={{ py: 2.5, fontFamily: "monospace" }}>{transaction.btcBought}</TableCell>
                  <TableCell sx={{ py: 2.5 }}>
                    <Typography sx={{ fontWeight: 500 }}>{transaction.ngnPaid}</Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2.5 }}>
                    <Typography variant="body2" color="text.secondary">{transaction.openedAt}</Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2.5 }}>
                    <Typography variant="body2" color="text.secondary">{transaction.paidAt}</Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2.5 }}>
                    <Chip
                      label={`${transaction.payerSpeed}s`}
                      size="small"
                      color={transaction.payerSpeed < 90 ? "success" : "warning"}
                      sx={{ minWidth: 70 }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 2.5 }}>{transaction.ngnSellingPrice}</TableCell>
                  <TableCell sx={{ py: 2.5 }}>{transaction.ngnCostPrice}</TableCell>
                  <TableCell sx={{ py: 2.5 }}>{transaction.usdCost}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination controls could be added here using pagination.totalPages and pagination.currentPage */}
      </Container>
    </Box>
  );
};

export default TransactionHistory;
