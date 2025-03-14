import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Box,
  Grid,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Alert,
  Stack,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  VpnKey as KeyIcon,
  Badge as BadgeIcon,
  Security as SecurityIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { createUser } from "../../api/admin";
import { useNavigate } from "react-router-dom";

// Define the UserType enum to match backend
enum UserType {
  ADMIN = "admin",
  PAYER = "payer",
  RATER = "rater",
  CEO = "ceo",
  CC = "customer-support",
}

// Validation schema using Yup
const validationSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  fullName: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .required("Full name is required"),
  userType: Yup.string()
    .oneOf(Object.values(UserType), "Invalid user type")
    .required("User type is required"),
  phone: Yup.string()
    .matches(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
    .nullable(),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .matches(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one special character"
    )
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Please confirm your password"),
  twoFaEnabled: Yup.boolean(),
  status: Yup.string()
    .oneOf(["active", "inactive", "suspended"], "Invalid status")
    .required("Status is required"),
});

const CreateUser: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const initialValues = {
    email: "",
    fullName: "",
    userType: "",
    phone: "",
    password: "",
    confirmPassword: "",
    twoFaEnabled: true,
    status: "active",
  };

  const handleSubmit = async (
    values: any,
    { setSubmitting, resetForm }: any
  ) => {
    try {
      const data = await createUser(values);
      if (data?.success) {
        resetForm();
        navigate("/admin/users");
        return;
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: "lg", mx: "auto" }}>
      <Card
        sx={{
          p: 2,
          boxShadow: theme.shadows[3],
          transition: "box-shadow 0.3s ease-in-out",
          "&:hover": {
            boxShadow: theme.shadows[6],
          },
        }}
      >
        <CardHeader
          avatar={
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PersonIcon sx={{ color: theme.palette.primary.main }} />
            </Box>
          }
          title={
            <Typography
              variant="h5"
              sx={{ fontWeight: 600, color: theme.palette.text.primary }}
            >
              Create New User
            </Typography>
          }
          subheader="Add a new user to the system"
        />

        <CardContent>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              isSubmitting,
              resetForm,
            }) => (
              <Form>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      name="fullName"
                      label="Full Name"
                      value={values.fullName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.fullName && Boolean(errors.fullName)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BadgeIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      name="email"
                      label="Email Address"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.email && Boolean(errors.email)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      name="phone"
                      label="Phone Number"
                      value={values.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.phone && Boolean(errors.phone)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      select
                      name="userType"
                      label="User Type"
                      value={values.userType}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.userType && Boolean(errors.userType)}
                    >
                      {Object.entries(UserType).map(([key, value]) => (
                        <MenuItem key={key} value={value}>
                          {key.charAt(0) + key.slice(1).toLowerCase()}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      name="password"
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.password && Boolean(errors.password)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <KeyIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? (
                                <VisibilityOffIcon />
                              ) : (
                                <VisibilityIcon />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      name="confirmPassword"
                      label="Confirm Password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={values.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={
                        touched.confirmPassword &&
                        Boolean(errors.confirmPassword)
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <KeyIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              edge="end"
                            >
                              {showConfirmPassword ? (
                                <VisibilityOffIcon />
                              ) : (
                                <VisibilityIcon />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      select
                      name="status"
                      label="Status"
                      value={values.status}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.status && Boolean(errors.status)}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="suspended">Suspended</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="twoFaEnabled"
                          checked={values.twoFaEnabled}
                          onChange={handleChange}
                          color="primary"
                        />
                      }
                      label={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <SecurityIcon color="action" />
                          <Typography>
                            Enable Two-Factor Authentication
                          </Typography>
                        </Stack>
                      }
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Password must contain at least 8 characters, including
                      uppercase, lowercase, numbers, and special characters.
                    </Alert>
                  </Grid>

                  <Grid item xs={12}>
                    <Stack
                      direction="row"
                      spacing={2}
                      justifyContent="flex-end"
                    >
                      <Button
                        variant="outlined"
                        startIcon={<ClearIcon />}
                        onClick={() => resetForm()}
                        disabled={isSubmitting}
                      >
                        Reset
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={isSubmitting}
                        sx={{
                          bgcolor: theme.palette.primary.main,
                          "&:hover": {
                            bgcolor: theme.palette.primary.dark,
                          },
                        }}
                      >
                        Create User
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateUser;
