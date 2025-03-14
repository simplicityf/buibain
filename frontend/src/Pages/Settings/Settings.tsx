import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Avatar,
  Button,
  TextField,
  Grid,
  Stack,
  Alert,
  Divider,
  useTheme,
  alpha,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Person as PersonIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  Lock as LockIcon,
  Key as KeyIcon,
} from "@mui/icons-material";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useUserContext } from "../../Components/ContextProvider";
import { changePassword, editUserDetails } from "../../api/user";
import toast from "react-hot-toast";

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const generalSettingsSchema = Yup.object({
  fullName: Yup.string().required("Full name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  phone: Yup.string().matches(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
  language: Yup.string().required("Language is required"),
});

const securitySettingsSchema = Yup.object({
  currentPassword: Yup.string().required("Current password is required"),
  newPassword: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .matches(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    )
    .required("New password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Confirm password is required"),
});

const Settings: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = React.useState(0);
  const { user, setUser } = useUserContext();
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setAvatarFile(event.target.files[0]);
    }
  };

  return (
    <Box sx={{ maxWidth: "lg", mx: "auto", p: { xs: 2, sm: 3 } }}>
      <Card
        sx={{
          boxShadow: theme.shadows[3],
          transition: "box-shadow 0.3s ease-in-out",
          "&:hover": {
            boxShadow: theme.shadows[6],
          },
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="settings tabs"
            sx={{
              px: 2,
              "& .MuiTab-root": {
                textTransform: "none",
                minHeight: 64,
                fontSize: "1rem",
              },
            }}
          >
            <Tab
              icon={<PersonIcon />}
              iconPosition="start"
              label="General Settings"
              sx={{ px: 3 }}
            />
            <Tab
              icon={<SecurityIcon />}
              iconPosition="start"
              label="Security"
              sx={{ px: 3 }}
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <Formik
              initialValues={{
                fullName: user?.fullName,
                email: user?.email,
                phone: user?.phone,
                language: "English",
                emailNotifications: true,
              }}
              validationSchema={generalSettingsSchema}
              onSubmit={async (values) => {
                const data = await editUserDetails({ ...values, avatarFile });
                if (data?.success) {
                  setUser(data.data);
                }
              }}
            >
              {({ values, errors, touched, handleChange, handleBlur }) => (
                <Form className="px-[2rem]">
                  <Grid container spacing={3}>
                    {/* Avatar Section */}
                    <Grid item xs={12}>
                      <Stack
                        direction="column"
                        alignItems="center"
                        spacing={2}
                        sx={{ mb: 4 }}
                      >
                        <Avatar
                          sx={{
                            width: 150,
                            height: 150,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                          }}
                          src={
                            avatarFile
                              ? URL.createObjectURL(avatarFile)
                              : user?.avatar
                          }
                        >
                          {!avatarFile && <PersonIcon sx={{ fontSize: 100 }} />}
                        </Avatar>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleAvatarChange}
                          accept="image/*"
                          style={{ display: "none" }}
                        />
                        <Button
                          variant="outlined"
                          startIcon={<PhotoCameraIcon />}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Change Avatar
                        </Button>
                      </Stack>
                    </Grid>

                    {/* Personal Information */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        name="fullName"
                        label="Full Name"
                        value={values.fullName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.fullName && Boolean(errors.fullName)}
                        helperText={touched.fullName && errors.fullName}
                        InputProps={{
                          startAdornment: (
                            <PersonIcon color="action" sx={{ mr: 1 }} />
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        name="email"
                        disabled
                        label="Email Address"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.email && Boolean(errors.email)}
                        helperText={touched.email && errors.email}
                        InputProps={{
                          startAdornment: (
                            <EmailIcon color="action" sx={{ mr: 1 }} />
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
                        disabled
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.phone && Boolean(errors.phone)}
                        helperText={touched.phone && errors.phone}
                        InputProps={{
                          startAdornment: (
                            <PhoneIcon color="action" sx={{ mr: 1 }} />
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Notifications
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            name="emailNotifications"
                            checked={values.emailNotifications}
                            onChange={handleChange}
                          />
                        }
                        label="Email Notifications"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        sx={{ mt: 2 }}
                      >
                        Save Changes
                      </Button>
                    </Grid>
                  </Grid>
                </Form>
              )}
            </Formik>
          </CardContent>
        </TabPanel>

        {/* Security Settings Tab */}
        <TabPanel value={tabValue} index={1}>
          <CardContent className="w-full flex justify-center items-center">
            <Formik
              initialValues={{
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
              }}
              validationSchema={securitySettingsSchema}
              onSubmit={async (values, { resetForm }) => {
                if (values.newPassword !== values.confirmPassword) {
                  toast.error("New password's don't match");
                  return;
                }
                const data = await changePassword(values);
                if (data?.success) {
                  resetForm();
                }
              }}
            >
              {({ values, errors, touched, handleChange, handleBlur }) => (
                <Form className="max-w-[30vw]">
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ mb: 3 }}>
                        Ensure your new password is strong and unique. Use a mix
                        of letters, numbers, and symbols.
                      </Alert>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="password"
                        name="currentPassword"
                        label="Current Password"
                        value={values.currentPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={
                          touched.currentPassword &&
                          Boolean(errors.currentPassword)
                        }
                        helperText={
                          touched.currentPassword && errors.currentPassword
                        }
                        InputProps={{
                          startAdornment: (
                            <LockIcon color="action" sx={{ mr: 1 }} />
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="password"
                        name="newPassword"
                        label="New Password"
                        value={values.newPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={
                          touched.newPassword && Boolean(errors.newPassword)
                        }
                        helperText={touched.newPassword && errors.newPassword}
                        InputProps={{
                          startAdornment: (
                            <KeyIcon color="action" sx={{ mr: 1 }} />
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="password"
                        name="confirmPassword"
                        label="Confirm New Password"
                        value={values.confirmPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={
                          touched.confirmPassword &&
                          Boolean(errors.confirmPassword)
                        }
                        helperText={
                          touched.confirmPassword && errors.confirmPassword
                        }
                        InputProps={{
                          startAdornment: (
                            <KeyIcon color="action" sx={{ mr: 1 }} />
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                      >
                        Update Password
                      </Button>
                    </Grid>
                  </Grid>
                </Form>
              )}
            </Formik>
          </CardContent>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default Settings;
