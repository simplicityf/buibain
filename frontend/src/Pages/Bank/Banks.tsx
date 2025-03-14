import React, { useEffect, useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  Button,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalance as AccountIcon,
  ArrowDownward as ArrowDownwardIcon,
  AccountBalance,
  Add,
} from "@mui/icons-material";
import { deleteBank, getAllBanks } from "../../api/bank";
import Loading from "../../Components/Loading";
import { formatDate } from "../../lib/constants";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../../Components/ContextProvider";
import ClockedAlt from "../../Components/ClockedAlt";
interface Bank {
  id: string;
  accountNumber: string;
  createdAt: Date;
  bankName: string;
  accountName: string;
  funds: string;
}

const Banks = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useUserContext();

  const navigate = useNavigate();
  const handleMenuOpen = (event: any, bank: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedBank(bank);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBank(null);
  };

  const handleBankDelete = async (id: string) => {
    const data = await deleteBank(id);
    if (data?.success) {
      const newBanks = banks.filter((bank) => bank.id !== id);
      setBanks(newBanks);
    }
  };

  const handleEditBank = async (id: string) => {
    navigate(`/banks/create?bankId=${id}`);
    return;
  };
  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getAllBanks();
        if (data?.success) {
          setBanks(data.data);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <Loading />;
  if (!user.clockedIn && user.userType !== "admin") {
    return <ClockedAlt />;
  }
  return (
    <div className="space-y-6  min-h-screen font-primary">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Bank Management
          </h1>
          <p className="text-text2 mt-1">
            Manage your bank accounts and transactions
          </p>
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          className="bg-button hover:bg-primary2 text-white shadow-lg normal-case"
          sx={{
            backgroundColor: "#F8BC08",
            "&:hover": {
              backgroundColor: "#C6980C",
            },
          }}
          onClick={() => navigate("/banks/create")}
        >
          Add New Bank
        </Button>
      </div>

      {/* Table Section */}
      <TableContainer component={Paper} className="shadow-lg">
        <Table>
          <TableHead className="bg-muted/50">
            <TableRow>
              <TableCell className="font-semibold">
                <div className="flex items-center gap-2">
                  Bank Name
                  <ArrowDownwardIcon
                    fontSize="small"
                    className="text-gray-400"
                  />
                </div>
              </TableCell>
              <TableCell className="font-semibold">Account Name</TableCell>
              <TableCell className="font-semibold">Account Number</TableCell>
              <TableCell className="font-semibold">Funds</TableCell>
              <TableCell className="font-semibold">Created Date</TableCell>
              <TableCell align="center" className="font-semibold">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {banks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="w-20 h-20 rounded-full bg-button/10 flex items-center justify-center mb-4">
                      <AccountBalance
                        className="text-button"
                        sx={{ fontSize: 40 }}
                      />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No Banks Found
                    </h3>
                    <p className="text-text2 text-center max-w-md mb-6">
                      You haven't added any bank accounts yet. Click the button
                      below to add your first bank account.
                    </p>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      className="bg-button hover:bg-primary2 text-white shadow-lg normal-case"
                      sx={{
                        backgroundColor: "#F8BC08",
                        "&:hover": {
                          backgroundColor: "#C6980C",
                        },
                      }}
                    >
                      Add New Bank
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              banks.map((bank) => (
                <TableRow
                  key={bank.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <AccountIcon className="text-primary" />
                      </div>
                      <span className="font-medium">{bank.bankName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{bank.accountName}</TableCell>
                  <TableCell className="font-mono">
                    {bank.accountNumber}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">
                      ${bank.funds.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-text2">
                    {formatDate(new Date(bank.createdAt))}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, bank)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    anchorOrigin={{
                      vertical: "bottom",
                      horizontal: "right",
                    }}
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                  >
                    <MenuItem
                      onClick={() => {
                        handleEditBank(bank.id);
                      }}
                      className="flex items-center gap-2"
                    >
                      <EditIcon fontSize="small" />
                      Edit
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleBankDelete(bank.id);
                      }}
                      className="flex items-center gap-2 text-destructive"
                    >
                      <DeleteIcon fontSize="small" />
                      Delete
                    </MenuItem>
                  </Menu>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
    </div>
  );
};

export default Banks;
