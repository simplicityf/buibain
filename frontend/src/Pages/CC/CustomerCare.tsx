import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Badge,
  Avatar,
  Tab,
  Tabs,
} from "@mui/material";
import {
  Search,
  FilterList,
  Refresh,
  NotificationsActive,
  ArrowDownward,
  ArrowUpward,
  AccessTime,
  Assignment,
  SupportAgent,
  ErrorOutline,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import { getAllEscalatedTrades } from "../../api/escalatedTrade";
import Loading from "../../Components/Loading";
import { exportToCSV, exportToPDF } from "../../lib/reportExporter";
import { getCompletedTrades } from "../../api/trade";

// Interface for the TabPanel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const ExportButtons = ({
  data,
  type,
}: {
  data: any[];
  type: "completedTrades" | "escalatedTrades";
}) => {
  return (
    <Box className="flex items-center gap-2">
      <Button
        variant="outlined"
        onClick={() => exportToCSV(data, type)}
        startIcon={<Assignment />}
        sx={{
          borderColor: "primary.main",
          color: "primary.main",
          "&:hover": {
            borderColor: "secondary.main",
            bgcolor: "rgba(248, 188, 8, 0.04)",
          },
        }}
      >
        Export CSV
      </Button>
      <Button
        variant="outlined"
        onClick={() => exportToPDF(data, type)}
        startIcon={<Assignment />}
        sx={{
          borderColor: "primary.main",
          color: "primary.main",
          "&:hover": {
            borderColor: "secondary.main",
            bgcolor: "rgba(248, 188, 8, 0.04)",
          },
        }}
      >
        Export PDF
      </Button>
    </Box>
  );
};

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`support-tabpanel-${index}`}
      aria-labelledby={`support-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const mockComplaints = [];

const CustomerSupport = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [escalatedTrades, setEscalatedTrades] = useState<any[]>([]);
  const [sortConfig, setSortConfig] = useState({ field: "", direction: "asc" });
  const [notificationAnchor, setNotificationAnchor] =
    useState<null | HTMLElement>(null);
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLButtonElement>(
    null
  );
  const [completedTrades, setCompletedTrades] = useState([]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Styling helpers
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return { bgcolor: "#FEE2E2", color: "#DC2626" };
      case "medium":
        return { bgcolor: "#FEF3C7", color: "#D97706" };
      case "low":
        return { bgcolor: "#DCFCE7", color: "#15803D" };
      default:
        return { bgcolor: "#F3F4F6", color: "#6B7280" };
    }
  };
  console.log(escalatedTrades);

  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
      case "open":
        return { bgcolor: "#FFF7ED", color: "#EA580C" };
      case "resolved":
        return { bgcolor: "#F0FDF4", color: "#16A34A" };
      default:
        return { bgcolor: "#F3F4F6", color: "#6B7280" };
    }
  };
  useEffect(() => {
    const fetch = async () => {
      const esclatedData = await getAllEscalatedTrades();
      const completedData = await getCompletedTrades();
      if (completedData?.success) {
        setCompletedTrades(completedData.data.trades);
      }
      if (esclatedData?.success) {
        setEscalatedTrades(esclatedData.data);
      }
      setLoading(false);
    };
    fetch();
  }, []);
  function formatDate(createdAt: string): string {
    const now = new Date();
    const createdDate = new Date(createdAt);

    // Format the date as YYYY-MM-DD
    const formattedDate = createdDate.toISOString().split("T")[0];

    // Calculate time difference
    const timeDiff = now.getTime() - createdDate.getTime();
    const minutes = Math.floor(timeDiff / (1000 * 60));
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    let timeLapsed = "";
    if (days > 0) {
      timeLapsed = `${days}d ago`;
    } else if (hours > 0) {
      timeLapsed = `${hours}h ago`;
    } else if (minutes > 0) {
      timeLapsed = `${minutes}m ago`;
    } else {
      timeLapsed = "Just now";
    }

    return `${formattedDate}<br/>${timeLapsed}`;
  }

  if (loading) return <Loading />;
  return (
    <Box className="min-h-screen">
      <Box className="mb-8">
        {/* Header Section */}
        <Box className="flex justify-between items-center mb-6">
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: "text.primary", mb: 1 }}
            >
              Customer Support Center
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              Manage customer complaints and escalated trades
            </Typography>
          </Box>
          <Box className="flex items-center gap-4">
            <Tooltip title="Notifications">
              <IconButton
                onClick={(e) => setNotificationAnchor(e.currentTarget)}
                sx={{
                  bgcolor: "background.paper",
                  boxShadow: 1,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Badge badgeContent={5} color="error">
                  <NotificationsActive color="primary" />
                </Badge>
              </IconButton>
            </Tooltip>
            <ExportButtons
              data={tabValue === 0 ? completedTrades : escalatedTrades}
              type={tabValue === 0 ? "completedTrades" : "escalatedTrades"}
            />
          </Box>
        </Box>

        {/* Tabs Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              "& .MuiTab-root": {
                minWidth: 200,
                fontWeight: 600,
                fontSize: "1rem",
                textTransform: "none",
                "&.Mui-selected": {
                  color: "primary.main",
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "primary.main",
                height: 3,
              },
            }}
          >
            <Tab
              icon={<ErrorOutline sx={{ mr: 1 }} />}
              iconPosition="start"
              label="Escalated Trades"
            />
            <Tab
              icon={<SupportAgent sx={{ mr: 1 }} />}
              iconPosition="start"
              label="Vendor Trades"
            />
          </Tabs>
        </Box>

        <Box className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6 w-full">
          {[
            {
              label: tabValue === 1 ? "Total Completed" : "Total Escalations",
              value:
                tabValue === 1
                  ? completedTrades.length
                  : escalatedTrades.length,
              trend: "+12% this week",
            },
          ].map((stat) => (
            <Paper
              key={stat.label}
              elevation={0}
              sx={{
                width: "100%",
                p: 3,
                borderRadius: 3,
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 2,
                },
              }}
            >
              <Typography
                variant="h5"
                sx={{ color: "text.primary", fontWeight: 600, mb: 1 }}
              >
                {stat.value}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mb: 1 }}
              >
                {stat.label}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {stat.trend}
              </Typography>
            </Paper>
          ))}
        </Box>

        <TabPanel value={tabValue} index={1}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Box className="flex flex-wrap items-center justify-between gap-4">
              <Box className="flex items-center gap-2 flex-1">
                <TextField
                  size="small"
                  placeholder="Search complaints by ID, Platform, User..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <Search
                        className="mr-2"
                        sx={{ color: "text.secondary" }}
                      />
                    ),
                  }}
                  sx={{
                    minWidth: "320px",
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "background.paper",
                      "&:hover": {
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "primary.main",
                        },
                      },
                    },
                  }}
                />
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={(e) => setFilterAnchor(e.currentTarget)}
                  sx={{
                    borderColor: "primary.main",
                    color: "primary.main",
                    "&:hover": {
                      borderColor: "secondary.main",
                      bgcolor: "rgba(248, 188, 8, 0.04)",
                    },
                  }}
                >
                  Filter
                </Button>
              </Box>
              <Box className="flex items-center gap-2">
                <Button
                  variant="outlined"
                  startIcon={<AccessTime />}
                  sx={{
                    borderColor: "primary.main",
                    color: "primary.main",
                    "&:hover": {
                      borderColor: "secondary.main",
                      bgcolor: "rgba(248, 188, 8, 0.04)",
                    },
                  }}
                >
                  Set Auto-Reminder
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  sx={{
                    borderColor: "primary.main",
                    color: "primary.main",
                    "&:hover": {
                      borderColor: "secondary.main",
                      bgcolor: "rgba(248, 188, 8, 0.04)",
                    },
                  }}
                >
                  Refresh
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Complaints Table */}
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              overflowX: "auto",
            }}
            className="scroll-bar"
          >
            <Table>
              <TableHead>
                <TableRow>
                  {[
                    "ID",
                    "Platform",
                    "Submitted By",
                    "Type",
                    "Status",
                    "Priority",
                    "Date",
                    "Description",
                    "Actions",
                  ].map((header) => (
                    <TableCell
                      key={header}
                      sx={{
                        bgcolor: "background.paper",
                        fontWeight: 600,
                        color: "text.primary",
                        cursor: "pointer",
                        py: 3,
                        "&:hover": {
                          bgcolor: "action.hover",
                        },
                      }}
                    >
                      <Box className="flex items-center gap-1">
                        {header}
                        {sortConfig.field === header &&
                          (sortConfig.direction === "asc" ? (
                            <ArrowUpward fontSize="small" />
                          ) : (
                            <ArrowDownward fontSize="small" />
                          ))}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {completedTrades?.map((complaint) => (
                  <TableRow
                    key={complaint.id}
                    hover
                    sx={{
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                      transition: "background-color 0.2s",
                    }}
                  >
                    <TableCell>
                      <Box className="flex items-center gap-2">
                        {complaint.hasNewMessages && (
                          <Badge color="error" variant="dot" />
                        )}
                        <Typography
                          sx={{ fontWeight: 500, color: "text.primary" }}
                        >
                          {complaint.complaintId}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: "text.primary" }}>
                        {complaint.platform}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box className="flex items-center flex-col gap-2">
                        <Avatar
                          src={complaint.submittedBy.avatar}
                          sx={{ width: 32, height: 32 }}
                        />
                        <Typography
                          sx={{ color: "text.primary", fontSize: "14px" }}
                          className="text-center"
                        >
                          {complaint.submittedBy.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{ color: "text.primary", fontSize: "14px" }}
                        className="text-center"
                      >
                        {complaint.type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={complaint.status}
                        size="small"
                        sx={{
                          ...getStatusStyles(complaint.status),
                          fontWeight: 500,
                          px: 1,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={complaint.priority}
                        size="small"
                        sx={{
                          ...getPriorityColor(complaint.priority),
                          fontWeight: 500,
                          px: 1,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "text.primary",
                            fontSize: "14px",
                            width: "max-content",
                          }}
                        >
                          {complaint.date}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", fontSize: "12px" }}
                        >
                          {complaint.timeElapsed}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: "12px",
                          width: "max-content",
                          color: "text.primary",
                        }}
                      >
                        {complaint.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box className="flex items-center gap-2">
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            bgcolor: "primary.main",
                            color: "black",
                            "&:hover": {
                              bgcolor: "secondary.main",
                            },
                            textTransform: "none",
                            px: 2,
                            py: 1,
                            width: "max-content",
                          }}
                        >
                          <Link to={`/complaint/${complaint.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={0}>
          {/* Search and Filter Section for Escalated Trades */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Box className="flex flex-wrap items-center justify-between gap-4">
              <Box className="flex items-center gap-2 flex-1">
                <TextField
                  size="small"
                  placeholder="Search by Trade ID, Platform, Payer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <Search
                        className="mr-2"
                        sx={{ color: "text.secondary" }}
                      />
                    ),
                  }}
                  sx={{
                    minWidth: "320px",
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "background.paper",
                      "&:hover": {
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "primary.main",
                        },
                      },
                    },
                  }}
                />
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={(e) => setFilterAnchor(e.currentTarget)}
                  sx={{
                    borderColor: "primary.main",
                    color: "primary.main",
                    "&:hover": {
                      borderColor: "secondary.main",
                      bgcolor: "rgba(248, 188, 8, 0.04)",
                    },
                  }}
                >
                  Filter
                </Button>
              </Box>
              <Box className="flex items-center gap-2">
                <Button
                  variant="outlined"
                  startIcon={<AccessTime />}
                  sx={{
                    borderColor: "primary.main",
                    color: "primary.main",
                    "&:hover": {
                      borderColor: "secondary.main",
                      bgcolor: "rgba(248, 188, 8, 0.04)",
                    },
                  }}
                >
                  Set Auto-Reminder
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  sx={{
                    borderColor: "primary.main",
                    color: "primary.main",
                    "&:hover": {
                      borderColor: "secondary.main",
                      bgcolor: "rgba(248, 188, 8, 0.04)",
                    },
                  }}
                >
                  Refresh
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Escalated Trades Table */}
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              overflowX: "auto",
            }}
            className="scroll-bar"
          >
            <Table>
              <TableHead>
                <TableRow>
                  {[
                    "Trade ID",
                    "Platform",
                    "Escalated By",
                    "Amount",
                    "Status",
                    "Date",
                    "Complaint",
                    "Actions",
                  ].map((header) => (
                    <TableCell
                      key={header}
                      // onClick={() => handleSort(header)}
                      sx={{
                        bgcolor: "background.paper",
                        fontWeight: 600,
                        color: "text.primary",
                        cursor: "pointer",
                        py: 3,
                        "&:hover": {
                          bgcolor: "action.hover",
                        },
                      }}
                    >
                      <Box className="flex items-center gap-1">
                        {header}
                        {sortConfig.field === header &&
                          (sortConfig.direction === "asc" ? (
                            <ArrowUpward fontSize="small" />
                          ) : (
                            <ArrowDownward fontSize="small" />
                          ))}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {escalatedTrades.map((trade) => (
                  <TableRow
                    key={trade.id}
                    hover
                    sx={{
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                      transition: "background-color 0.2s",
                    }}
                  >
                    <TableCell>
                      <Box className="flex items-center gap-2">
                        {trade.hasNewMessages && (
                          <Badge color="error" variant="dot" />
                        )}
                        <Typography
                          sx={{ fontWeight: 500, color: "text.primary" }}
                        >
                          {trade?.trade?.tradeHash}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: "text.primary" }}>
                        {trade.platform}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box className="flex items-center flex-col justify-center gap-2">
                        <Avatar
                          src={trade.escalatedBy.avatar}
                          sx={{ width: 40, height: 40 }}
                        />
                        <Typography
                          sx={{ fontSize: "14px", color: "text.primary" }}
                        >
                          {trade.escalatedBy.fullName.substring(0, 20)}...
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{ fontWeight: 500, color: "primary.main" }}
                      >
                        {trade.amount}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={trade.status}
                        size="small"
                        sx={{
                          ...getStatusStyles(trade.status),
                          fontWeight: 500,
                          px: 1,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ color: "text.primary" }}
                      >
                        <div
                          dangerouslySetInnerHTML={{
                            __html: formatDate(trade.createdAt),
                          }}
                        ></div>
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: "12px",
                          width: "max-content",
                          color: "text.primary",
                        }}
                      >
                        {trade?.complaint?.substring(0, 50) || "No Complaint"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box className="flex items-center gap-2">
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            bgcolor: "primary.main",
                            color: "black",
                            "&:hover": {
                              bgcolor: "secondary.main",
                            },
                            textTransform: "none",
                            px: 2,
                            py: 1,
                            width: "max-content",
                          }}
                        >
                          <Link to={`/escalated-trade/${trade.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Box>

      {/* Menus - Your existing notification and filter menus */}
    </Box>
  );
};

export default CustomerSupport;
