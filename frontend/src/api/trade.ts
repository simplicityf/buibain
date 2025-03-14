import toast from "react-hot-toast";
import { ResInterface } from "../lib/interface";
import { api, handleApiError } from "./user";
import { successStyles } from "../lib/constants";

export const getRates = async () => {
  try {
    const res: ResInterface = await api.get("/trade/currency/rates");
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

export const getPayerTrade = async (id: string) => {
  try {
    const res: ResInterface = await api.get(`/trade/payer/assignedTrade/${id}`);
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

export const getTradeDetails = async (
  platform: string,
  tradeHash: string,
  accountId: string
) => {
  try {
    const res: ResInterface = await api.post("/trade/payer/trade/info", {
      platform,
      tradeHash,
      accountId,
    });
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

export const sendTradeMessage = async (
  tradeHash: string,
  content: string,
  platform: string,
  accountId: string
) => {
  try {
    const res: ResInterface = await api.post("/trade/message", {
      tradeHash,
      content,
      platform,
      accountId,
    });
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

export const getCurrentRates = async () => {
  try {
    const res: ResInterface = await api.get("/trade/currency/rates");

    return res;
  } catch (error) {
    handleApiError(error);
  }
};

export const setRaterRates = async (
  sellingPrice: number,
  noonesRate: number,
  paxfulRate: number,
  usdtNgnRate: any,
  markup2: any
) => {
  try {
    const res: ResInterface = await api.post("/trade/set-rates", {
      sellingPrice,
      noonesRate,
      paxfulRate,
      usdtNgnRate,
      markup2,
    });

    return res;
  } catch (error) {
    handleApiError(error);
  }
};

export const getRaterRates = async () => {
  try {
    const res: ResInterface = await api.get("/trade/get-rates");
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

export const markTradeAsPaid = async (
  platform: string,
  tradeHash: string,
  accountId: string
) => {
  try {
    const res: ResInterface = await api.post("/trade/mark-paid", {
      platform,
      tradeHash,
      accountId,
    });
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

export const getDashboardStats = async () => {
  try {
    const res: ResInterface = await api.get("/trade/dashboard");
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

export const getCompletedTrades = async (page?: number, limit?: number) => {
  try {
    const res: ResInterface = await api.get("/trade/completed", {
      params: { page, limit },
    });
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateOffersMargin = async (
  paxfulMargin: number,
  noonesMargin: number
) => {
  try {
    const res: ResInterface = await api.put("/trade/offers/update", {
      paxfulMargin,
      noonesMargin,
    });
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

export const turnOnAllOffers = async () => {
  try {
    const res: ResInterface = await api.get("/trade/offers/turn-on");
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

export const turnOffAllOffers = async () => {
  try {
    const res: ResInterface = await api.get("/trade/offers/turn-off");
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

export const reAssignTrade = async (tradeId: string, userId: string) => {
  try {
    const res: ResInterface = await api.post("/trade/reassign-trade", {
      tradeId,
      userId,
    });
    toast.success(res.message, successStyles);
    return res;
  } catch (error) {
    handleApiError(error);
  }
};
