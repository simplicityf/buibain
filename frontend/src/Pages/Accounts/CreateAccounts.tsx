import React, { useState, useEffect } from "react";
import { data, useLocation, useNavigate } from "react-router-dom";
import {
  createAccount,
  updateAccount,
  getSingleAccount,
} from "../../api/account";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  Alert,
  Box,
  InputLabel,
  FormControl,
  Select,
  CircularProgress,
  Container,
} from "@mui/material";
import { ArrowLeft } from "lucide-react";

const CreateAccounts = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const accountId = queryParams.get("accountId");
  const [formData, setFormData] = useState({
    account_username: "",
    api_key: "",
    api_secret: "",
    platform: "noones",
  });

  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const fetchAccountDetails = async (id: string) => {
    try {
      const data = await getSingleAccount(id);
      if (data.success) {
        const account = data.data;
        console.log(`This is the accounts Data `, account);
        setFormData({
          account_username: account.username,
          api_key: account.api_key,
          api_secret: account.api_secret,
          platform: account.platform,
        });
        setIsEditing(true);
      }
    } catch (error) {
      console.error("Failed to fetch account details:", error);
    }
  };

  const validateForm = () => {
    const newErrors: any = {};
    if (!formData.account_username.trim()) {
      newErrors.account_username = "Username is required";
    }
    if (!formData.api_key.trim()) {
      newErrors.api_key = "API Key is required";
    }
    if (!formData.api_secret.trim()) {
      newErrors.api_secret = "API Secret is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const cfs = window.confirm("Are you sure if the api input is correct ?");
    if (!cfs) {
      return;
    }
    setIsSubmitting(true);
    try {
      let data;
      if (isEditing && accountId) {
        data = await updateAccount(accountId, formData);
        setSuccessMessage("Account updated successfully!");
      } else {
        data = await createAccount(formData);
        setSuccessMessage("Account created successfully!");
        setFormData({
          account_username: "",
          api_key: "",
          api_secret: "",
          platform: "noones",
        });
      }
      if (data.success) {
        navigate("/admin/account/all");
        return;
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const inputProps = {
    sx: {
      "& .MuiOutlinedInput-root": {
        backgroundColor: "white",
        transition: "all 0.3s ease-in-out",
        "&:hover": {
          backgroundColor: "#f8f9fa",
        },
        "&.Mui-focused": {
          backgroundColor: "white",
          "& fieldset": {
            borderColor: "#F8BC08",
            borderWidth: "2px",
          },
        },
      },
      "& .MuiInputLabel-root.Mui-focused": {
        color: "#C6980C",
      },
    },
  };

  useEffect(() => {
    if (accountId) {
      fetchAccountDetails(accountId);
    }
  }, []);

  return (
    <Container maxWidth={false} className="min-h-screen py-12 px-4">
      <Card className="max-w-2xl mx-auto shadow-xl rounded-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
        <div className="bg-white">
          <div className="bg-gradient-to-r from-button to-primary2 py-8 px-6 flex justify-center items-center ">
            <button
              onClick={() => navigate(-1)}
              className="flex justify-center items-center gap-2 absolute top-0 left-0 m-4"
            >
              <ArrowLeft /> Back
            </button>
            <h1 className="text-center font-primary text-white text-[30px] font-bold">
              {isEditing ? "Update Forex Account" : "Add Forex Account"}
            </h1>
          </div>

          <CardContent className="p-8">
            {successMessage && (
              <Alert
                severity="success"
                className="mb-8 rounded-lg"
                sx={{
                  "& .MuiAlert-icon": {
                    color: "#2e7d32",
                  },
                }}
              >
                {successMessage}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <TextField
                fullWidth
                label="Account Username"
                name="account_username"
                value={formData.account_username}
                onChange={handleInputChange}
                error={!!errors.account_username}
                helperText={errors.account_username}
                variant="outlined"
                {...inputProps}
              />

              <FormControl fullWidth variant="outlined" {...inputProps}>
                <InputLabel>Platform</InputLabel>
                <Select
                  name="platform"
                  value={formData.platform}
                  onChange={handleInputChange}
                  label="Platform"
                  className="bg-white"
                >
                  <MenuItem value="noones">Noones</MenuItem>
                  <MenuItem value="paxful">Paxful</MenuItem>
                  <MenuItem value="binance">Binance</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="API Key"
                name="api_key"
                type="password"
                value={formData.api_key}
                onChange={handleInputChange}
                error={!!errors.api_key}
                helperText={errors.api_key}
                variant="outlined"
                {...inputProps}
              />

              <TextField
                fullWidth
                label="API Secret"
                name="api_secret"
                type="password"
                value={formData.api_secret}
                onChange={handleInputChange}
                error={!!errors.api_secret}
                helperText={errors.api_secret}
                variant="outlined"
                {...inputProps}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                className="w-full text-white font-medium py-3.5 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                sx={{
                  backgroundColor: "#F8BC08",
                  "&:hover": {
                    backgroundColor: "#C6980C",
                  },
                  textTransform: "none",
                  fontSize: "1.0rem",
                  boxShadow: "0 4px 6px rgba(248, 188, 8, 0.2)",
                }}
              >
                {isSubmitting ? (
                  <Box className="flex items-center justify-center gap-3">
                    <CircularProgress size={20} color="inherit" />
                    <span>
                      {isEditing
                        ? "Updating Account..."
                        : "Creating Account..."}
                    </span>
                  </Box>
                ) : isEditing ? (
                  "Update Account"
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </CardContent>
        </div>
      </Card>
    </Container>
  );
};

export default CreateAccounts;
