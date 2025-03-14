import { loadingStyles, successStyles } from "../lib/constants";
import { api, handleApiError } from "./user";
import toast from "react-hot-toast";
import { ResInterface } from "../lib/interface";

export const createEscalatedTrade = async (data: {
  tradeHash: string;
  tradeId: string;
  platform: string;
  complaint: string;
  amount: number;
  assignedPayerId: string;
  escalatedById: string;
}) => {
  try {
    toast.loading("Escalating Trade...", loadingStyles);
    const res: ResInterface = await api.post(
      "/escalated-trades/escalate",
      data
    );
    toast.dismiss();
    toast.success(res.message, successStyles);
    return res;
  } catch (error) {
    toast.dismiss();
    handleApiError(error, "Failed to escalate the trade.");
  }
};

export const getAllEscalatedTrades = async (status?: string) => {
  try {
    const params = status ? { status } : {};
    const res: ResInterface = await api.get("/escalated-trades/all", {
      params,
    });
    return res;
  } catch (error) {
    handleApiError(error, "Failed to fetch escalated trades.");
  }
};

export const getEscalatedTradeById = async (id: string) => {
  try {
    const res: ResInterface = await api.get(`/escalated-trades/${id}`);
    return res;
  } catch (error) {
    handleApiError(error, "Failed to fetch trade details.");
  }
};

export const updateEscalatedTrade = async (id: string, updateData: any) => {
  try {
    toast.loading("Updating Trade...", loadingStyles);
    const res: ResInterface = await api.put(
      `/escalated-trades/${id}`,
      updateData
    );
    toast.dismiss();
    toast.success(res.message, successStyles);
    return res;
  } catch (error) {
    toast.dismiss();
    handleApiError(error, "Failed to update the trade.");
  }
};

export const deleteEscalatedTrade = async (id: string) => {
  try {
    toast.loading("Deleting Trade...", loadingStyles);
    const res: ResInterface = await api.delete(`/escalated-trades/${id}`);
    toast.dismiss();
    toast.success(res.message, successStyles);
    return res;
  } catch (error) {
    toast.dismiss();
    handleApiError(error, "Failed to delete the trade.");
  }
};
