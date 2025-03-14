import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import RefreshIcon from "@mui/icons-material/Refresh";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { getActivityLogs } from "../../api/admin";
import Loading from "../../Components/Loading";

interface ActivityLog {
  id: string;
  timestamp: Date;
  user: {
    name: string;
    avatar: string;
    role: string;
  };
  activityType: string;
  description: string;
  details: string;
  status?: "success" | "warning" | "error";
}
const activityTypes = [
  { value: "authentication", label: "Login/Logout" },
  { value: "rate_update", label: "Rate Update" },
  { value: "bank_management", label: "Bank Edit" },
  { value: "profit_management", label: "Profit Declaration" },
  { value: "escalation", label: "Escalation" },
  { value: "complaint", label: "Complaint Resolution" },
  { value: "trade", label: "Trade Status Change" },
  { value: "admin", label: "Admin Action" },
];

const getRoleColor = (role: string | undefined) => {
  switch (role?.toLowerCase()) {
    case "admin":
      return "bg-red-100 text-red-800";
    case "rater":
      return "bg-blue-100 text-blue-800";
    case "payer":
      return "bg-green-100 text-green-800";
    case "ceo":
      return "bg-purple-100 text-purple-800";
    case "customer-support":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getActivityTypeColor = (activity: string) => {
  switch (activity) {
    case "user_login":
    case "user_logout":
      return "border-blue-500 text-blue-700";
    case "rate_update":
      return "border-green-500 text-green-700";
    case "bank_update":
    case "bank_create":
    case "bank_delete":
      return "border-purple-500 text-purple-700";
    case "profit_declaration":
      return "border-orange-500 text-orange-700";
    case "system":
      return "border-gray-500 text-gray-700";
    default:
      return "border-gray-500 text-gray-700";
  }
};

const getActivityLabel = (activity: string) => {
  return activity
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const userRoles = [
  "Admin",
  "Rater",
  "Payer",
  "CC Agent",
  "Bank Manager",
  "Customer",
];

const sampleLogs: ActivityLog[] = [
  {
    id: "1",
    timestamp: new Date(),
    user: {
      name: "John Doe",
      avatar: "/api/placeholder/32/32",
      role: "Rater",
    },
    activityType: "Rate Update",
    description: "Updated USD/EUR exchange rate",
    details: "Changed from 1.12 to 1.13",
    status: "success",
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 3600000),
    user: {
      name: "Sarah Smith",
      avatar: "/api/placeholder/32/32",
      role: "Admin",
    },
    activityType: "Admin Action",
    description: "Approved rate change request",
    details: "Request #4582 - USD/GBP rate modification",
    status: "success",
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 7200000),
    user: {
      name: "Mike Johnson",
      avatar: "/api/placeholder/32/32",
      role: "CC Agent",
    },
    activityType: "Complaint Resolution",
    description: "Resolved customer dispute",
    details: "Ticket #7823 - Transaction delay issue",
    status: "success",
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 10800000),
    user: {
      name: "Emma Davis",
      avatar: "/api/placeholder/32/32",
      role: "Bank Manager",
    },
    activityType: "Bank Edit",
    description: "Updated bank balance",
    details: "Manual adjustment for Account #9876",
    status: "warning",
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 14400000),
    user: {
      name: "Tom Wilson",
      avatar: "/api/placeholder/32/32",
      role: "Rater",
    },
    activityType: "Rate Update",
    description: "Updated JPY/EUR exchange rate",
    details: "System automated update",
    status: "success",
  },
];

const ActivityLogs: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const getStatusColor = (status: string = "success") => {
    const colors = {
      success: "bg-green-100 text-green-800 border-green-300",
      warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
      error: "bg-red-100 text-red-800 border-red-300",
    };
    return colors[status as keyof typeof colors] || colors.success;
  };

  const getActivityTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      "Rate Update": "border-blue-400 text-blue-600",
      "Admin Action": "border-purple-400 text-purple-600",
      "Complaint Resolution": "border-orange-400 text-orange-600",
      "Bank Edit": "border-green-400 text-green-600",
      "Login/Logout": "border-gray-400 text-gray-600",
    };
    return colors[type] || "border-primary text-primary";
  };

  console.log(logs);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false ||
      log.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false ||
      (typeof log.details === "object"
        ? JSON.stringify(log.details)
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        : log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          false);

    const matchesRole =
      !selectedRole ||
      log.userRole?.toLowerCase() === selectedRole.toLowerCase();

    const matchesActivity =
      !selectedActivity || log.activity === selectedActivity;

    const matchesDate =
      !selectedDate ||
      new Date(log.timestamp).toISOString().split("T")[0] === selectedDate;

    return matchesSearch && matchesRole && matchesActivity && matchesDate;
  });

  useEffect(() => {
    const fetch = async () => {
      const data = await getActivityLogs();
      if (data?.success) {
        setLogs(data.data);
      } else {
        setLogs([]);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <Loading />;
  return (
    <Box className="p-6 bg-gray-50 min-h-screen">
      <Box className="max-w-7xl mx-auto">
        <Box className="flex justify-between items-center mb-6">
          <Typography
            variant="h4"
            className="font-extrabold font-secondary text-gray-800"
          >
            Activity Logs
          </Typography>
          <Box className="flex gap-2">
            <Tooltip title="Refresh logs">
              <IconButton className="text-gray-600 hover:bg-gray-100">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Toggle filters">
              <IconButton
                className="text-gray-600 hover:bg-gray-100"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {showFilters && (
          <Paper className="p-4 mb-6 shadow-sm border border-gray-100">
            <Stack spacing={2}>
              <TextField
                variant="outlined"
                placeholder="Search by user or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon className="mr-2 text-gray-400" />,
                }}
                fullWidth
                size="small"
              />

              <Box className="flex flex-wrap gap-4 items-center">
                <TextField
                  type="date"
                  label="Filter by date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  className="w-48"
                />

                <FormControl size="small" className="w-48">
                  <InputLabel>User Role</InputLabel>
                  <Select
                    value={selectedRole}
                    label="User Role"
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <MenuItem value="">All Roles</MenuItem>
                    {userRoles.map((role) => (
                      <MenuItem key={role} value={role}>
                        {role}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" className="w-48">
                  <InputLabel>Activity Type</InputLabel>
                  <Select
                    value={selectedActivity}
                    label="Activity Type"
                    onChange={(e) => setSelectedActivity(e.target.value)}
                  >
                    <MenuItem value="">All Activities</MenuItem>
                    {activityTypes.map((type) => (
                      <MenuItem key={type.label} value={type.label}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </Paper>
        )}

        <Paper className="shadow-sm border border-gray-100">
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell className="bg-gray-50 font-semibold">
                    Timestamp
                  </TableCell>
                  <TableCell className="bg-gray-50 font-semibold">
                    User
                  </TableCell>
                  <TableCell className="bg-gray-50 font-semibold">
                    Role
                  </TableCell>
                  <TableCell className="bg-gray-50 font-semibold">
                    Activity
                  </TableCell>
                  <TableCell className="bg-gray-50 font-semibold">
                    Description
                  </TableCell>
                  <TableCell className="bg-gray-50 font-semibold"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.reverse().map((log) => (
                  <TableRow key={log.id} hover className="group">
                    <TableCell className="whitespace-nowrap">
                      <Typography variant="body2" className="text-gray-600">
                        {new Date(log.timestamp).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {log.user ? (
                        <Box className="flex items-center justify-center gap-2 flex-col">
                          <Avatar
                            src={log.user.avatar}
                            alt={log.user.fullName}
                            className="w-8 h-8"
                          />
                          <Typography
                            variant="body2"
                            className="font-medium w-max text-sm"
                          >
                            {log.user.fullName}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography
                          variant="body2"
                          className="text-gray-500 italic"
                        >
                          System
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.userRole || "System"}
                        size="small"
                        className={`${getRoleColor(log.userRole)}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getActivityLabel(log.activity)}
                        size="small"
                        variant="outlined"
                        className={`${getActivityTypeColor(log.activity)}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{log.description}</Typography>
                    </TableCell>
                    <TableCell>
                      {!log.isSystemGenerated && (
                        <IconButton
                          size="small"
                          className="opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredLogs.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default ActivityLogs;
