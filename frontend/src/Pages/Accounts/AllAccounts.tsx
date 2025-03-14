import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Card,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { FilterIcon } from "lucide-react";
import { DataGrid } from "@mui/x-data-grid";
import {
  getAllAccounts,
  deleteAccount,
  getSingleAccount,
} from "../../api/account";
import { useNavigate } from "react-router-dom";

const AllAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await getAllAccounts();
      // Add serial numbers to the data
      const accountsWithSerial = data.map((account, index) => ({
        ...account,
        serialNo: index + 1,
      }));
      setAccounts(accountsWithSerial);
      setError("");
    } catch (err) {
      setError("Failed to fetch accounts");
      console.error("Error fetching accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformChange = (event) => {
    setSelectedPlatform(event.target.value);
  };

  const handleDelete = async () => {
    try {
      await deleteAccount(selectedAccountId);
      await fetchAccounts();
      setDeleteDialogOpen(false);
      setSelectedAccountId(null);
    } catch (err) {
      console.error("Error deleting account:", err);
    }
  };

  const confirmDelete = (id: string) => {
    setSelectedAccountId(id);

    setDeleteDialogOpen(true);
  };

  const detectImage = (platform: string) => {
    switch (platform) {
      case "binance":
        return "/binance.png";
        break;
      case "noones":
        return "/noones.png";
        break;
      case "paxful":
        return "/paxful.jpg";
        break;
    }
  };

  const filteredAccounts = accounts.filter((account) =>
    selectedPlatform === "all" ? true : account.platform === selectedPlatform
  );

  const columns = [
    {
      field: "serialNo",
      headerName: "Serial No",
      width: 100,
      headerClassName: "table-header",
    },
    {
      field: "account_username",
      headerName: "Account Username",
      flex: 1,
      headerClassName: "table-header",
      renderCell: (params) => (
        <Typography className="font-medium">{params.value}</Typography>
      ),
    },
    {
      field: "platform",
      headerName: "Platform",
      width: 150,
      headerClassName: "table-header",
      renderCell: (params) => (
        <img
          src={detectImage(params.value)}
          className="h-6 w-max object-cover object-center"
        />
      ),
    },
    // {
    //   field: "total_trades",
    //   headerName: "Total Trades",
    //   width: 130,
    //   headerClassName: "table-header",
    //   renderCell: (params) => (
    //     <Typography className="font-medium">{params.value || 0}</Typography>
    //   ),
    // },
    {
      field: "paid_trades",
      headerName: "Paid Trades",
      width: 130,
      headerClassName: "table-header",
      renderCell: (params) => (
        <Typography className="font-medium">{params.value || 0}</Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      headerClassName: "table-header",
      sortable: false,
      renderCell: (params) => {
        return (
          <Box className="flex gap-2">
            {/* <IconButton
              onClick={() => navigate(`/accounts/view/${params.row.id}`)}
              className="text-blue-600 hover:bg-blue-50"
              size="small"
            >
              <ViewIcon />
            </IconButton>
            */}
            <IconButton
              onClick={() =>
                navigate(`/admin/account/create?accountId=${params.row.id}`)
              }
              className="text-green-600 hover:bg-green-50"
              size="small"
            >
              <EditIcon />
            </IconButton>

            <IconButton
              onClick={() => confirmDelete(params.row.id)}
              className="text-red-600 hover:bg-red-50"
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="h-1 bg-gradient-to-r from-button to-primary2" />

      <Container maxWidth="xl" className="py-6">
        <Box className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold font-secondary bg-gradient-to-r from-primary2 to-primary bg-clip-text text-transparent">
              Forex Accounts
            </h1>
          </div>

          <Button
            variant="contained"
            onClick={() => navigate("/admin/account/create")}
            className="bg-button hover:bg-primary2 text-white shadow-md"
            startIcon={<AddIcon />}
            sx={{
              backgroundColor: "#F8BC08",
              "&:hover": { backgroundColor: "#C6980C" },
              textTransform: "none",
              borderRadius: "50px",
              px: 3,
              py: 1,
            }}
          >
            Add Account
          </Button>
        </Box>

        <Card className="shadow-sm rounded-lg w-full py-4 px-4 overflow-hidden">
          <Box className="px-4 py-3 w-max bg-white border-b flex flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3  w-max">
              <FormControl size="small" className="w-[200px]">
                <InputLabel>Platform</InputLabel>
                <Select
                  value={selectedPlatform}
                  onChange={handlePlatformChange}
                  label="Platform"
                  className="bg-white"
                >
                  <MenuItem value="all">All Platforms</MenuItem>
                  <MenuItem value="noones">Noones</MenuItem>
                  <MenuItem value="paxful">Paxful</MenuItem>
                  <MenuItem value="binance">Binance</MenuItem>
                </Select>
              </FormControl>
            </div>
          </Box>
          {error && (
            <Alert
              severity="error"
              className="mx-4 mt-4"
              sx={{ borderRadius: 1 }}
            >
              {error}
            </Alert>
          )}
          <DataGrid
            rows={filteredAccounts}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            autoHeight
            loading={loading}
            className="bg-white"
            sx={{
              border: "none",
              "& .table-header": {
                backgroundColor: "#ffffff",
                color: "#64748b",
                fontWeight: "600",
                fontSize: "0.875rem",
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid #f1f5f9",
                padding: "12px 16px",
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "#f8fafc",
              },
              "& .MuiDataGrid-columnHeaders": {
                borderBottom: "1px solid #e2e8f0",
              },
              "& .MuiDataGrid-footerContainer": {
                borderTop: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
              },
            }}
          />
        </Card>

        {/* Delete Dialog - Refined design */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            elevation: 0,
            className: "rounded-lg",
          }}
        >
          <DialogTitle className="px-6 py-4 bg-gray-50 border-b">
            <Typography className="font-semibold text-gray-800">
              Delete Account
            </Typography>
          </DialogTitle>
          <DialogContent className="p-6">
            <Alert severity="warning" className="mb-4">
              This action cannot be undone.
            </Alert>
            <Typography className="text-gray-600 text-sm">
              Are you sure you want to delete this account? All associated data
              will be permanently removed.
            </Typography>
          </DialogContent>
          <DialogActions className="px-6 py-4 border-t bg-gray-50">
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              className="text-gray-600 hover:bg-gray-100"
              size="small"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              variant="contained"
              className="bg-red-600 hover:bg-red-700"
              size="small"
              sx={{
                bgcolor: "#dc2626",
                "&:hover": { bgcolor: "#b91c1c" },
                textTransform: "none",
              }}
            >
              Delete Account
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </div>
  );
};

export default AllAccounts;
