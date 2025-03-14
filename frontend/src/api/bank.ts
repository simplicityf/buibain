import { api } from "./user";
import { ResInterface } from "../lib/interface";
import toast from "react-hot-toast";
import { handleApiError } from "./user";
import { loadingStyles, successStyles } from "../lib/constants";

// Function to add a new bank
export const addBank = async (data: unknown) => {
  try {
    toast.loading("Adding Bank...", loadingStyles);
    const res: ResInterface = await api.post("/banks/add", data);
    toast.dismiss();
    toast.success(res.message, successStyles);
    return res;
  } catch (error) {
    toast.dismiss();
    handleApiError(error);
  }
};

// Function to get all banks
export const getAllBanks = async () => {
  try {
    const res: ResInterface = await api.get("/banks");
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

// Function to get free banks
export const getFreeBanks = async () => {
  try {
    const res: ResInterface = await api.get("/banks/free");
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

// Function to get funded banks
export const getFundedBanks = async () => {
  try {
    const res: ResInterface = await api.get("/banks/funded");
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

// Function to update a bank's details
export const updateBank = async (id: string, data: unknown) => {
  try {
    toast.loading("Updating Bank...", loadingStyles);
    const res: ResInterface = await api.put(`/banks/${id}`, data);
    toast.dismiss();
    toast.success(res.message, successStyles);
    return res;
  } catch (error) {
    toast.dismiss();
    handleApiError(error);
  }
};

export const deleteBank = async (id: string) => {
  try {
    toast.loading("Deleting Bank...", loadingStyles);
    const res: ResInterface = await api.delete(`/banks/${id}`);
    toast.dismiss();
    toast.success(res.message, successStyles);
    return res;
  } catch (error) {
    toast.dismiss();
    handleApiError(error);
  }
};

export const getSingleBank = async (id: string) => {
  try {
    const res: ResInterface = await api.get(`/banks/single/${id}`);

    return res;
  } catch (error) {
    handleApiError(error);
  }
};
