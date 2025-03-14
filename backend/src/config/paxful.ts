import crypto from "crypto";
import { PaxfulApi } from "@paxful/sdk-js/dist/PaxfulApi.js";
import usePaxful from "@paxful/sdk-js";

export interface PaxfulAccountConfig {
  clientId: string;
  clientSecret: string;
  accountId?: string;
  label?: string;
}

export interface TradeMessage {
  id: string;
  text: string;
  timestamp: number;
  sender: string;
}

export interface WalletTransaction {
  txid: string;
  type: string;
  amount: string;
  status: string;
  timestamp: number;
  currency: string;
}

export interface OfferDetails {
  id: string;
  type: string;
  currency: string;
  price: string;
  min_amount: string;
  max_amount: string;
  payment_method: string;
  status: string;
}

export class PaxfulService {
  private paxfulApi: PaxfulApi;
  public accountId?: string;
  public label?: string;

  constructor(config: PaxfulAccountConfig) {
    if (!config.clientId || !config.clientSecret) {
      throw new Error("Client ID and secret are required for Paxful service");
    }

    this.paxfulApi = new PaxfulApi({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });
    this.accountId = config.accountId;
    this.label = config.label;
  }

  private async makeRequest(
    endpoint: string,
    data: Record<string, any> = {}
  ): Promise<any> {
    try {
      console.log(`[${this.label}] Making request to ${endpoint}`);
      const response = await this.paxfulApi.invoke(endpoint, data);
      return response;
    } catch (error: any) {
      console.error(`[${this.label}] Request failed:`, {
        endpoint,
        error: error.message,
      });
      throw new Error(
        `Paxful API Error for account ${this.label}: ${error.message}`
      );
    }
  }

  async listActiveTrades(): Promise<any[]> {
    const response = await this.makeRequest("/paxful/v1/trade/list");
    return response.data.trades;
  }

  async getTradeDetails(tradeHash: string) {
    return await this.makeRequest("/paxful/v1/trade/get", {
      trade_hash: tradeHash,
    });
  }

  // Add to PaxfulService class

  async markTradeAsPaid(tradeHash: string): Promise<boolean> {
    try {
      const response = await this.makeRequest("/paxful/v1/trade/paid", {
        trade_hash: tradeHash,
      });
      return response.data.success;
    } catch (error: any) {
      throw new Error(
        `Failed to mark trade as paid for account ${this.label}: ${error.message}`
      );
    }
  }
  async getBitcoinPrice(): Promise<number> {
    const paxfulApi = new PaxfulApi({
      clientId: "qdmuUssOPik1cCfGD3lxQjUu6EYzUoP2olFh4TGkormR0JBC",
      clientSecret: "qtyTukmnNSzbQv8UQJzsSglALTHWCukWcaJUjX8lGGAC8Ex3",
    });

    const paxfulRateResponse = await paxfulApi.invoke(
      "/paxful/v1/currency/btc",
      {}
    );
    return paxfulRateResponse.price;
  }

  async getWalletBalance(): Promise<string> {
    const response = await this.makeRequest("/paxful/v1/wallet/balance");
    return response.data.balance;
  }

  async getTotalBalance(): Promise<{
    available: string;
    escrow: string;
    total: string;
  }> {
    const response = await this.makeRequest("/paxful/v1/wallet/balance");
    const available = response.balance;
    const escrow = response.pending_balance;
    return {
      available,
      escrow,
      total: (parseFloat(available) + parseFloat(escrow)).toString(),
    };
  }

  // New methods below

  async getTradeChat(tradeHash: string): Promise<any> {
    try {
      const response = await this.makeRequest("/paxful/v1/trade-chat/get", {
        trade_hash: tradeHash,
      });
      console.log(response);
      return {
        messages: response.data.messages,
        attachments: response.data.attachments,
      };
    } catch (error: any) {
      throw new Error(
        `Failed to fetch trade chat for account ${this.label}: ${error.message}`
      );
    }
  }

  async sendTradeMessage(
    tradeHash: string,
    message: string
  ): Promise<TradeMessage> {
    try {
      const response = await this.makeRequest("/paxful/v1/trade-chat/post", {
        trade_hash: tradeHash,
        message: message,
      });
      console.log(response);
      return response.data ? response.data.message : response.error.message;
    } catch (error: any) {
      throw new Error(
        `Failed to send trade message for account ${this.label}: ${error.message}`
      );
    }
  }

  async getTransactionHistory(
    options: {
      type?: string;
      limit?: number;
      offset?: number;
      currency?: string;
    } = {}
  ): Promise<WalletTransaction[]> {
    try {
      const response = await this.makeRequest(
        "/paxful/v1/wallet/transactions",
        options
      );
      return response.data.transactions;
    } catch (error: any) {
      throw new Error(
        `Failed to fetch transaction history for account ${this.label}: ${error.message}`
      );
    }
  }

  async listOffers(
    params: {
      type?: "buy" | "sell";
      status?: "active" | "paused" | "closed";
      offset?: number;
      limit?: number;
    } = {}
  ): Promise<OfferDetails[]> {
    try {
      const response = await this.makeRequest("/paxful/v1/offer/list", params);
      return response.data.offers;
    } catch (error: any) {
      throw new Error(
        `Failed to list offers for account ${this.label}: ${error.message}`
      );
    }
  }

  async cancelTrade(tradeHash: string): Promise<boolean> {
    try {
      await this.makeRequest("/paxful/v1/trade/cancel", {
        trade_hash: tradeHash,
      });
      return true;
    } catch (error: any) {
      throw new Error(
        `Failed to cancel trade for account ${this.label}: ${error.message}`
      );
    }
  }

  async uploadTradeDocument(
    tradeHash: string,
    document: Buffer,
    filename: string
  ): Promise<{
    document_id: string;
    url: string;
  }> {
    try {
      const response = await this.makeRequest(
        "/paxful/v1/trade/document/upload",
        {
          trade_hash: tradeHash,
          document: document,
          filename: filename,
        }
      );
      return response.data.document;
    } catch (error: any) {
      throw new Error(
        `Failed to upload trade document for account ${this.label}: ${error.message}`
      );
    }
  }

  async getUserProfile(username: string): Promise<any> {
    try {
      const response = await this.makeRequest("/paxful/v1/user/info", {
        username: username,
      });
      return response.data.user;
    } catch (error: any) {
      throw new Error(
        `Failed to fetch user profile for account ${this.label}: ${error.message}`
      );
    }
  }

  async getFeedback(
    params: {
      username?: string;
      type?: "received" | "given";
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<any[]> {
    try {
      const response = await this.makeRequest(
        "/paxful/v1/feedback/list",
        params
      );
      return response.data.feedback;
    } catch (error: any) {
      throw new Error(
        `Failed to fetch feedback for account ${this.label}: ${error.message}`
      );
    }
  }
  async listActiveOffers(offerType?: "buy" | "sell"): Promise<any[]> {
    try {
      const params: Record<string, any> = { active: true };
      if (offerType) {
        params.offer_type = offerType;
      }

      const response = await this.paxfulApi.invoke(
        "/paxful/v1/offer/list",
        params
      );

      if (!response.data?.offers) {
        console.warn(`[${this.label}] No offers data in response:`, response);
        return [];
      }

      return response.data.offers;
    } catch (error: any) {
      throw new Error(
        `Failed to list active offers for account ${this.label}: ${error.message}`
      );
    }
  }
  async updateOffer(offerId: string, margin: number): Promise<boolean> {
    try {
      const response = await this.makeRequest("/paxful/v1/offer/update", {
        offer_hash: offerId,
        margin: margin.toString(),
      });
      console.log(response);
      return response;
    } catch (error: any) {
      throw new Error(
        `Failed to update offer for account ${this.label}: ${error.message}`
      );
    }
  }
  async turnOffAllOffers(): Promise<number> {
    try {
      const response = await this.paxfulApi.invoke(
        "/paxful/v1/offer/turn-off",
        {}
      );
      console.log(response);
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Failed to turn off all offers for account ${this.label}: ${error.message}`
      );
    }
  }
  async turnOnAllOffers(): Promise<number> {
    try {
      const response = await this.paxfulApi.invoke(
        "/paxful/v1/offer/turn-on",
        {}
      );
      console.log(response);
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Failed to turn off all offers for account ${this.label}: ${error.message}`
      );
    }
  }

  async createOffer(params: any) {
    try {
      const requestParams: Record<string, any> = {
        type: params.type,
        margin: params.margin,
        currency: params.currency,
        min_amount: params.min_amount,
        max_amount: params.max_amount,
        payment_method: params.payment_method,
        payment_window: params.payment_window,
        offer_terms: params.offer_terms,
        crypto_currency: params.crypto_currency || "usdt",
      };

      if (params.price !== undefined) {
        requestParams.fixed_price = params.price;
        requestParams.is_fixed_price = true;
      }

      if (params.country) requestParams.country = params.country;

      console.log(`[${this.label}] Creating Paxful offer...`);

      const response = await this.makeRequest(
        "/paxful/v1/offer/create",
        requestParams
      );
      console.log(response);
      return {
        success: true,
      };
    } catch (error: any) {
      console.error("Error creating Paxful offer:", error);
      throw new Error(`Failed to create offer: ${error.message}`);
    }
  }
}

const apiConfig: PaxfulAccountConfig = {
  clientId:
    process.env.PAXFUL_CLIENT_ID ||
    "L4HJDA4ic91JwsWLkQCDeZkue7TH4jmpn4kyKUuKkRSUdCF3",
  clientSecret:
    process.env.PAXFUL_CLIENT_SECRET ||
    "5lVWlN54pPhnrqWkU8mqv1P2ExEpadN7LuQ4RiIKQtF36nk2",
};

const paxfulService = new PaxfulService(apiConfig);

export const fetchPaxfulTrades = async () => paxfulService.listActiveTrades();
export const getPaxfulTradeDetails = async (tradeHash: string) =>
  paxfulService.getTradeDetails(tradeHash);

export default paxfulService;
