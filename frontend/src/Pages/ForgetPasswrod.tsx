import React, { useState } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  Box,
} from "@mui/material";
import { Mail, ArrowRight, LockKeyhole } from "lucide-react";
import axios from "axios";
import { BASE_URL, loadingStyles, successStyles } from "../lib/constants";
import toast from "react-hot-toast";

const ForgetPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      toast.loading("Sending reset link...", loadingStyles);
      const res = await axios.post(
        `${BASE_URL}/user/forget-password`,
        { email },
        { headers: { "Content-Type": "application/json" } }
      );
      const data = res.data;

      toast.dismiss();
      toast.success(data.message, successStyles);
      setSuccessMessage("Password reset link sent successfully!");
      setError("");

      return;
    } catch (error) {
      toast.dismiss();
      setError("Failed to send reset link. Please try again.");
    }
  };

  return (
    <Box
      className="min-h-screen flex items-center justify-center p-4"
      sx={{
        background:
          "linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at center, rgba(248,188,8,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        },
      }}
    >
      <Card
        className="w-full max-w-[500px]"
        sx={{
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-button to-primary2 flex items-center justify-center transform hover:scale-105 transition-transform duration-300 shadow-lg">
              <LockKeyhole className="w-10 h-10 text-white" />
            </div>

            <div className="text-center space-y-3">
              <Typography
                variant="h4"
                className="text-3xl font-bold font-primary"
                sx={{
                  background: "linear-gradient(135deg, #F8BC08, #C6980C)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Forgot Password?
              </Typography>

              <Typography
                variant="body1"
                className="text-text2 font-secondary text-lg"
              >
                No worries! Enter your email and we'll send you reset
                instructions.
              </Typography>
            </div>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              {successMessage && (
                <Alert
                  severity="success"
                  sx={{
                    borderRadius: "12px",
                    backgroundColor: "rgba(74, 222, 128, 0.1)",
                    color: "#22c55e",
                    "& .MuiAlert-icon": {
                      color: "#22c55e",
                    },
                    border: "1px solid rgba(74, 222, 128, 0.2)",
                    marginBottom: "1rem",
                  }}
                >
                  {successMessage}
                </Alert>
              )}

              <TextField
                fullWidth
                variant="outlined"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!error}
                helperText={error}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail className="text-text2" size={20} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 1)",
                    },
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: "56px",
                    "& fieldset": {
                      borderColor: "rgba(0, 0, 0, 0.1)",
                      borderWidth: "2px",
                      borderRadius: "12px",
                    },
                    "&:hover fieldset": {
                      borderColor: "#F8BC08",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#F8BC08",
                      borderWidth: "2px",
                    },
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                className="font-primary text-lg"
                endIcon={<ArrowRight className="w-5 h-5" />}
                sx={{
                  background: "linear-gradient(135deg, #F8BC08, #C6980C)",
                  height: "56px",
                  borderRadius: "12px",
                  textTransform: "none",
                  fontSize: "1.1rem",
                  boxShadow: "0 4px 15px rgba(248, 188, 8, 0.3)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #C6980C, #F8BC08)",
                    boxShadow: "0 6px 20px rgba(248, 188, 8, 0.4)",
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                Reset Password
              </Button>

              <div className="text-center pt-4">
                <Button
                  href="/login"
                  className="font-primary text-base hover:underline"
                  sx={{
                    color: "#7E7E7E",
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: "transparent",
                      color: "#F8BC08",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  ← Back to Login
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-6 mt-10">
              <div
                className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #4ade80, #22c55e)",
                  boxShadow: "0 4px 15px rgba(74, 222, 128, 0.3)",
                }}
              >
                <Mail className="w-10 h-10 text-white" />
              </div>

              <Typography
                variant="h5"
                className="font-semibold font-primary text-2xl"
                sx={{
                  color: "#22c55e",
                }}
              >
                Check Your Email
              </Typography>

              <Typography
                variant="body1"
                className="text-text2 font-secondary text-lg"
              >
                We have sent a password reset link to
                <br />
                <span className="font-medium text-foreground">{email}</span>
              </Typography>

              <Button
                onClick={() => setIsSubmitted(false)}
                variant="outlined"
                className="mt-8 font-primary"
                sx={{
                  borderColor: "#F8BC08",
                  color: "#F8BC08",
                  borderWidth: "2px",
                  borderRadius: "12px",
                  padding: "12px 24px",
                  textTransform: "none",
                  fontSize: "1.1rem",
                  "&:hover": {
                    borderColor: "#C6980C",
                    color: "#C6980C",
                    borderWidth: "2px",
                    backgroundColor: "rgba(248, 188, 8, 0.05)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                Back to Reset Password
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForgetPassword;
