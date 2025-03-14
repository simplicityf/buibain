import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Container,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import LockResetIcon from "@mui/icons-material/LockReset";
import { verifyEmail } from "../api/user";

const validationSchema = Yup.object({
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[0-9]/, "Password must contain at least one number")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[^\w]/, "Password must contain at least one symbol")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required"),
});

const VerifyAccount: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState<string>("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      navigate("/login");
    }
  }, [navigate, searchParams]);

  const handleSubmit = async (values: {
    password: string;
    confirmPassword: string;
  }) => {
    try {
      const data = await verifyEmail({ password: values.password, code: code });
      if (data?.success) {
        navigate("/login");
      }
    } catch (error) {
      console.error("Error verifying account:", error);
    }
  };

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      navigate("/login");
      return;
    }
    setCode(code);
  }, []);
  return (
    <Container
      maxWidth="sm"
      className="min-h-screen flex items-center justify-center py-12"
    >
      <Paper elevation={3} className="w-full p-8 space-y-6">
        <Box className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <LockResetIcon
              className="w-8 h-8 text-primary-600"
              sx={{ fontSize: "50px" }}
            />
          </div>
          <Typography variant="h5" component="h1" className="font-bold ">
            Set Password
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please set a strong password for your account
          </Typography>
        </Box>

        <Formik
          initialValues={{ password: "", confirmPassword: "" }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, handleChange, handleBlur, values }) => (
            <Form className="space-y-4">
              <TextField
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.password && Boolean(errors.password)}
                helperText={touched.password && errors.password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                value={values.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                error={
                  touched.confirmPassword && Boolean(errors.confirmPassword)
                }
                helperText={touched.confirmPassword && errors.confirmPassword}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        edge="end"
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                className="mt-6 bg-primary-600 hover:bg-primary-700"
              >
                Set Password
              </Button>
            </Form>
          )}
        </Formik>
      </Paper>
    </Container>
  );
};

export default VerifyAccount;
