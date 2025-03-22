import toast from "react-hot-toast";
import { ResInterface } from "../lib/interface";
import { api, handleApiError } from "./user";
import { successStyles } from "../lib/constants";

// Currency and Rates Endpoints
export const getRates = async () => {
  try {
    const res: ResInterface = await api.get("/trade/currency/rates");
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
  usdtNgnRate: unknown,
  markup2: unknown
) => {
  try {
    const res: ResInterface = await api.post("/trade/set-rates", {
      sellingPrice,
      noonesRate,
      paxfulRate,
      usdtNgnRate,
      markup2,
    });

    console.log("API Response from setRaterRates:", res);
    return res;
  } catch (error) {
    console.error("Error in setRaterRates:", error);
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

// Trade Endpoints
export const getLiveTrades = async () => {
  try {
    const res: ResInterface = await api.get("/trade/live-trades");
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

export const assignLiveTrades = async () => {
  try {
    const res: ResInterface = await api.post("/trade/assign-live-trade");
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
    const res: ResInterface = await api.get(
      `/trade/payer/trade/info/${platform}/${tradeHash}/${accountId}`
    );
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Send a trade chat message.
 * Updated to match backend: route is POST /trade/message/:tradeId with { content } in the body.
 */
export const sendTradeMessage = async (
  tradeId: string,
  content: string
) => {
  try {
    const res: ResInterface = await api.post(`/trade/message/${tradeId}`, {
      content,
    });
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Mark trade as paid.
 * Updated to match backend: route is POST /trade/mark-paid/:tradeId with { message } in the body.
 */
export const markTradeAsPaid = async (
  tradeId: string,
  message: string
) => {
  try {
    const res: ResInterface = await api.post(`/trade/mark-paid/${tradeId}`, {
      message,
    });
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

// Dashboard and Completed Trades Endpoints
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

// Wallet and Offers Endpoints
export const getWalletBalances = async () => {
  try {
    const res: ResInterface = await api.get("/trade/wallet-balances");
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

export const getOffersMargin = async () => {
  try {
    const res: ResInterface = await api.get("/trade/offers");
    return res;
  } catch (error) {
    handleApiError(error);
  }
};


export const updateOffersMargin = async () => {
  try {
    const res = await api.post("/trade/offers/update");
    console.log("Update Margin API Response from setRaterRates:", res);
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

export const getAllTrades = async (page?: number, limit?: number) => {
  try {
    const res: ResInterface = await api.get("/trade/all-trades", {
      params: { page, limit },
    });
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

export const getUnfinishedTrades = async (page?: number, limit?: number) => {
  try {
    const res: ResInterface = await api.get("/trade/unfinished-trades", {
      params: { page, limit },
    });
    return res;
  } catch (error) {
    handleApiError(error);
  }
};
