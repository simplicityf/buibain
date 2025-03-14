// src/api/account.ts
import { api, handleApiError } from "./user";
import { ResInterface } from "../lib/interface";
import toast from "react-hot-toast";
import { loadingStyles, successStyles, errorStyles } from "../lib/constants";

export interface AccountCreateData {
  account_username: string;
  api_key: string;
  api_secret: string;
  platform: "noones" | "paxful" | "binance";
}

export interface AccountUpdateData {
  api_secret?: string;
  status?: "active" | "inactive" | "suspended";
}

// Create Forex Account
export const createAccount = async (data: unknown) => {
  try {
    toast.loading("Creating account...", loadingStyles);
    const res: ResInterface = await api.post("/account/create", data);
    toast.dismiss();
    toast.success(res.message, successStyles);
    return res;
  } catch (error) {
    toast.dismiss();
    handleApiError(error, "Failed to create account");
  }
};

// Update Forex Account
export const updateAccount = async (id: string, data: AccountUpdateData) => {
  try {
    toast.loading("Updating account...", loadingStyles);
    const res: ResInterface = await api.put(`/account/update/${id}`, data);
    toast.dismiss();
    toast.success(res.message, successStyles);
    return res;
  } catch (error) {
    toast.dismiss();
    handleApiError(error, "Failed to update account");
  }
};

// Delete Forex Account
export const deleteAccount = async (id: string) => {
  try {
    toast.loading("Deleting account...", loadingStyles);
    const res: ResInterface = await api.delete(`/account/delete/${id}`);
    toast.dismiss();
    toast.success(res.message, successStyles);
    return res.data;
  } catch (error) {
    toast.dismiss();
    handleApiError(error, "Failed to delete account");
  }
};

// Get All Forex Accounts
export const getAllAccounts = async () => {
  try {
    const res: ResInterface = await api.get("/account/all");
    return res.data;
  } catch (error) {
    handleApiError(error, "Failed to fetch accounts");
    return [];
  }
};

// Get Single Forex Account
export const getSingleAccount = async (id: string) => {
  try {
    const res: ResInterface = await api.get(`/account/single/${id}`);
    return res;
  } catch (error) {
    handleApiError(error, "Failed to fetch account details");
    return null;
  }
};

// Verify Account Ownership (Optional)
export const verifyAccountOwnership = async (accountId: string) => {
  try {
    const res: ResInterface = await api.post("/account/verify-ownership", {
      accountId,
    });
    return res.data;
  } catch (error) {
    handleApiError(error, "Ownership verification failed");
    return null;
  }
};
