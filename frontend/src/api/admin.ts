import toast from "react-hot-toast";
import { ResInterface } from "../lib/interface";
import { api, handleApiError } from "./user";
import { loadingStyles, successStyles } from "../lib/constants";

export const createUser = async (data: {
  email: string;
  phone: string;
  userType: string;
  password: string;
  fullName: string;
}) => {
  try {
    toast.loading("Creating User", loadingStyles);
    const res: ResInterface = await api.post("/admin/create-user", data);
    toast.dismiss();
    toast.success(res.message, successStyles);
    return res;
  } catch (error) {
    toast.dismiss();
    handleApiError(error);
  }
};

export const getAllUsers = async (query?: any) => {
  try {
    const res: ResInterface = await api.get(`/admin/user/all?${query}`);

    return res;
  } catch (error) {
    toast.dismiss();
    handleApiError(error);
  }
};

// Function for Delete Users

export const deleteUser = async (id: string) => {
  try {
    toast.loading("Deleting User", loadingStyles);
    const res: ResInterface = await api.delete(`/admin/user/${id}`);
    toast.dismiss();
    toast.success(res.message, successStyles);
    return res;
  } catch (error) {
    toast.dismiss();
    handleApiError(error);
  }
};

export const getActivityLogs = async () => {
  try {
    const res: ResInterface = await api.get("/activity");
    return res;
  } catch (error) {
    handleApiError(error);
  }
};
