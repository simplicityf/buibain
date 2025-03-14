import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  TextField,
  Button,
  InputAdornment,
  Card,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  AccountBalance as BankIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Numbers as NumbersIcon,
  Notes as NotesIcon,
} from "@mui/icons-material";
import { addBank, getSingleBank, updateBank } from "../../api/bank";
import toast from "react-hot-toast";
import { errorStyles } from "../../lib/constants";
import { IBank } from "../../lib/interface";
import ClockedAlt from "../../Components/ClockedAlt";
import { useUserContext } from "../../Components/ContextProvider";

const CreateBank: React.FC = () => {
  const [searchParams] = useSearchParams();
  const bankId = searchParams.get("bankId");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [bank, setBank] = useState<IBank | null>(null);
  const { user } = useUserContext();
  const [formData, setFormData] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
    funds: "",
    additionalNotes: "",
    id: "",
  });
  useEffect(() => {
    const fetchBankData = async () => {
      if (bankId) {
        setLoading(true);
        try {
          const data = await getSingleBank(bankId);
          if (data?.success) {
            const bankData = {
              id: data.data.id,
              bankName: data.data.bankName,
              accountName: data.data.accountName,
              accountNumber: data.data.accountNumber,
              funds: data.data?.funds,
              additionalNotes: data.data?.additionalNotes,
            };
            setBank(data.data);
            setFormData(bankData);
          }
        } catch (err) {
          setError("Failed to fetch bank details");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchBankData();
  }, [bankId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (bank !== null && bankId) {
        const data = await updateBank(formData.id, formData);
        if (data?.success) {
          navigate("/banks");
          return;
        }
      } else {
        if (
          !formData.accountName ||
          !formData.accountNumber ||
          !formData.bankName
        ) {
          return toast.error("Incomplete fields!", errorStyles);
        }
        const data = await addBank(formData);
        if (data?.success) {
          navigate("/banks");
          return;
        }
      }
    } catch (err) {
      setError("Failed to save bank details");
    } finally {
      setLoading(false);
    }
  };

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const textFieldStyle = {
    "& .MuiOutlinedInput-root": {
      height: "60px",
    },
    "& .MuiOutlinedInput-input": {
      padding: "8px 14px",
    },
    "& .MuiInputLabel-root": {
      transform: "translate(14px, 12px) scale(1)",
    },
    "& .MuiInputLabel-shrink": {
      transform: "translate(14px, -9px) scale(0.75)",
    },
  };

  if (!user.clockedIn && user.userType !== "admin") {
    return <ClockedAlt />;
  }
  return (
    <div className="h-[80vh] w-full flex px-[7rem] justify-center items-center font-primary">
      <div className="w-full  mx-auto">
        {/* Simple Header */}
        <div className="mb-6 flex items-center gap-3">
          <Button
            startIcon={<ArrowBackIcon />}
            className="text-text2 normal-case"
            onClick={() => window.history.back()}
          >
            Back
          </Button>
          <h1 className="text-2xl font-semibold text-foreground">
            {bankId ? "Edit Bank Account" : "Create New Bank Account"}
          </h1>
        </div>

        {/* Compact Form */}
        <Card className="shadow-md">
          {error && (
            <Alert severity="error" className="rounded-none">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {/* First Row */}
              <TextField
                label="Bank Name"
                required
                fullWidth
                value={formData.bankName}
                onChange={handleChange("bankName")}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BankIcon className="text-text2" fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldStyle}
              />
              <TextField
                label="Account Name"
                required
                fullWidth
                value={formData.accountName}
                onChange={handleChange("accountName")}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon className="text-text2" fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldStyle}
              />

              {/* Second Row */}
              <TextField
                label="Account Number"
                required
                fullWidth
                value={formData.accountNumber}
                onChange={handleChange("accountNumber")}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <NumbersIcon className="text-text2" fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldStyle}
              />
              <TextField
                label="Initial Funds"
                type="number"
                required
                fullWidth
                value={formData.funds}
                onChange={handleChange("funds")}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MoneyIcon className="text-text2" fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldStyle}
              />

              {/* Full Width Notes Field */}
              <TextField
                label="Additional Notes"
                multiline
                rows={3}
                fullWidth
                className="col-span-2 mt-2"
                value={formData.additionalNotes}
                onChange={handleChange("additionalNotes")}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <NotesIcon className="text-text2" fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button
                variant="outlined"
                className="normal-case"
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={
                  loading ? <CircularProgress size={20} /> : <SaveIcon />
                }
                className="normal-case bg-button hover:bg-primary2"
                sx={{
                  backgroundColor: "#F8BC08",
                  "&:hover": {
                    backgroundColor: "#C6980C",
                  },
                }}
              >
                {loading ? "Saving..." : bankId ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreateBank;
