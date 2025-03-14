import {
  BASE_URL,
  errorStyles,
  loadingStyles,
  successStyles,
} from "../lib/constants";
import { ResInterface } from "../lib/interface";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 100000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error: AxiosError) => {
    if (error.response) {
      console.error("Response error: ", error.response.data);

      if (error.response.status === 401) {
        window.location.href = "/login";
      }
    } else if (error.request) {
      console.error("No response received: ", error.request);
    } else {
      console.error("Error: ", error.message);
    }
    return Promise.reject(error);
  }
);

export const handleApiError = (error: unknown, defaultMessage?: string) => {
  if (axios.isAxiosError(error)) {
    toast.error(error.response?.data?.message || error.message, errorStyles);
  } else if (error instanceof Error) {
    toast.error(error.message, errorStyles);
  } else {
    toast.error(defaultMessage || "Unexpected Error", errorStyles);
  }
  console.error(error);
};

export const logout = async () => {
  try {
    const res: ResInterface = await api.get("/user/logout");
    toast.success(res.message, successStyles);
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

export const editUserDetails = async (data: any) => {
  try {
    toast.loading("Saving User...", loadingStyles);
    const formData = new FormData();

    if (data.avatarFile) {
      formData.append("file", data.avatarFile);
    }

    formData.append("fullName", data.fullName);
    const res: ResInterface = await api.put("/user/update", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    toast.dismiss();
    toast.success(res.message, successStyles);
    return res;
  } catch (error) {
    toast.dismiss();
    handleApiError(error);
  }
};

export const changePassword = async (data: {
  newPassword: string;
  currentPassword: string;
}) => {
  try {
    toast.loading("Saving new password...", loadingStyles);
    const res: ResInterface = await api.put("/user/change-password", data);

    toast.dismiss();
    toast.success(res.message, successStyles);

    return res;
  } catch (error) {
    toast.dismiss();
    handleApiError(error);
  }
};

export const getSingleUser = async (id: string) => {
  try {
    const res: ResInterface = await api.get(`/admin/user/single/${id}`);
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

export const verifyEmail = async (values: {
  code: string;
  password: string;
}) => {
  try {
    toast.loading("Verifying Account...", loadingStyles);
    const res: ResInterface = await api.post("/user/verify-email", values);
    toast.dismiss();
    toast.success(res.message, successStyles);
    return res;
  } catch (error) {
    toast.dismiss();
    handleApiError(error);
  }
};

export const verify2fa = async ({
  twoFaCode,
  email,
}: {
  twoFaCode: string;
  email: string;
}) => {
  try {
    toast.loading("Verifying 2FA...", loadingStyles);
    const res: ResInterface = await api.post("/user/verify-2fa", {
      twoFaCode,
      email,
    });
    toast.dismiss();
    toast.success(res.message, successStyles);
    return res;
  } catch (error) {
    toast.dismiss();
    handleApiError(error);
  }
};

export const forgetPassword = async (email: string) => {
  try {
    toast.loading("Sending reset link...", loadingStyles);
    const res: ResInterface = await api.post("/user/forget-password", {
      email,
    });
    toast.dismiss();
    toast.success(res.message, successStyles);
    return res;
  } catch (error) {
    toast.dismiss();
    handleApiError(error, "Failed to send reset link.");
  }
};

export const resetPassword = async (data: {
  token: string;
  newPassword: string;
}) => {
  try {
    toast.loading("Resetting password...", loadingStyles);
    const res: ResInterface = await api.post("/user/reset-password", data);
    toast.dismiss();
    toast.success(res.message, successStyles);
    return res;
  } catch (error) {
    toast.dismiss();
    handleApiError(error, "Failed to reset password.");
  }
};

export const getAllNotifications = async () => {
  try {
    const res: ResInterface = await api.get("/notification/all");
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

export const markAllNotificationsAsCompleted = async () => {
  try {
    const res: ResInterface = await api.get("/notification/read");

    return res;
  } catch (error) {
    handleApiError(error, "Failed to mark notifications as completed.");
  }
};

export const deleteNotificationById = async (notificationId: string) => {
  try {
    const res: ResInterface = await api.delete(
      `/notification/${notificationId}`
    );
    toast.success(res.message, successStyles);
    return res;
  } catch (error) {
    handleApiError(error);
  }
};
