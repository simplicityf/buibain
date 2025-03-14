import dotenv from "dotenv";
import axios from "axios";
import { AxiosError } from "axios";

dotenv.config();

export interface NoonesServiceConfig {
  apiKey: string;
  apiSecret: string;
  accountId?: string;
  label?: string;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
}

export interface NoonesApiResponse<T> {
  data: T;
  status: string;
  timestamp: number;
}

interface WalletBalance {
  currency: string;
  name: string;
  balance: number;
  type: "crypto" | "fiat";
}

export interface ChatMessage {
  message_id: string;
  sender: string;
  content: string;
  timestamp: number;
  success: boolean;
}

export class NoonesService {
  private apiKey: string;
  private apiSecret: string;
  private token: string | null = null;
  private tokenExpiry: number | null = null;
  private isInitialized: boolean = false;
  public accountId?: string;
  public label?: string;

  constructor(config: NoonesServiceConfig) {
    if (!config.apiKey || !config.apiSecret) {
      throw new Error("API credentials are required");
    }

    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.accountId = config.accountId;
    this.label = config.label;
  }

  private handleApiError(error: any): never {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || "An error occurred";

      console.error(`[${this.label}] API Error:`, {
        status,
        message,
        url: error.config?.url,
        method: error.config?.method,
      });

      switch (status) {
        case 401:
          this.token = null;
          this.tokenExpiry = null;
          this.isInitialized = false;
          throw new Error(`Authentication failed for account ${this.label}`);
        case 429:
          throw new Error(`Rate limit exceeded for account ${this.label}`);
        case 404:
          throw new Error(`Resource not found: ${error.config?.url}`);
        default:
          throw new Error(`API Error (${status}): ${message}`);
      }
    }
    throw new Error(`Network error: ${error.message}`);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.getAccessToken();
      this.isInitialized = true;
      console.log(`[${this.label}] Service initialized successfully`);
    } catch (error) {
      this.isInitialized = false;
      console.error(`[${this.label}] Initialization failed:`, error);
      throw error;
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    try {
      const url = "https://auth.noones.com/oauth2/token";
      const headers = { "Content-Type": "application/x-www-form-urlencoded" };
      const params = new URLSearchParams();
      params.append("response", "text");
      params.append("client_id", this.apiKey);
      params.append("client_secret", this.apiSecret);
      params.append("grant_type", "client_credentials");

      console.log(`[${this.label}] Making request to ${url}`);
      const response = await axios.post<TokenResponse>(url, params, {
        headers,
      });

      if (!response.data.access_token) {
        throw new Error("No access token received");
      }

      this.token = response.data.access_token;
      this.tokenExpiry = Date.now() + response.data.expires_in * 1000;

      return this.token;
    } catch (error: any) {
      this.token = null;
      this.tokenExpiry = null;
      console.log(`This is nooones Response`, error);
      throw new Error(`Failed to fetch access token: ${error.message}`);
    }
  }

  private async makeAuthenticatedRequest<T>(
    endpoint: string,
    params: URLSearchParams = new URLSearchParams()
  ): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const token = await this.getAccessToken();
      const url = `https://api.noones.com${endpoint}`;

      console.log(`[${this.label}] Making request to ${url}`);
      const response = await axios.post<NoonesApiResponse<T>>(url, params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data;
    } catch (error) {
      return this.handleApiError(error as AxiosError);
    }
  }

  async getBitcoinPrice(): Promise<number> {
    try {
      const accessToken = await this.getAccessToken();
      const Btcparams = new URLSearchParams();
      Btcparams.append("response", "string");

      const response = await axios.post(
        "https://api.noones.com/noones/v1/currency/btc",
        Btcparams,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data.price;
    } catch (error) {
      console.error("Error fetching Bitcoin price:", error);
      throw new Error("Failed to fetch Bitcoin price");
    }
  }

  async getTradeDetails(tradeHash: string): Promise<any> {
    try {
      const params = new URLSearchParams({ trade_hash: tradeHash });
      const response = await this.makeAuthenticatedRequest<any>(
        "/noones/v1/trade/get",
        params
      );
      return response.trade;
    } catch (error: any) {
      throw new Error(
        `Failed to fetch trade details for account ${this.label}: ${error.message}`
      );
    }
  }

  async listActiveTrades(): Promise<any[]> {
    try {
      const response = await this.makeAuthenticatedRequest<any>(
        "/noones/v1/trade/list"
      );

      if (!response.trades) {
        console.warn(`[${this.label}] No trades data in response:`, response);
        return [];
      }
      console.log(response);
      return response.trades;
    } catch (error: any) {
      throw new Error(
        `Failed to list active trades for account ${this.label}: ${error.message}`
      );
    }
  }

  async verifyCredentials(): Promise<boolean> {
    try {
      await this.initialize();
      return true;
    } catch (error) {
      return false;
    }
  }
  async getWalletBalances(): Promise<WalletBalance[]> {
    try {
      const response = await this.makeAuthenticatedRequest<{
        cryptoCurrencies: {
          code: string;
          name: string;
          balance: string;
        }[];
        preferredFiatCurrency: {
          code: string;
          name: string;
          balance: string;
        };
      }>("/noones/v1/user/wallet-balances");

      const balances: WalletBalance[] = [];

      console.log(response);
      // Add crypto currencies with null checks
      if (response?.cryptoCurrencies?.length) {
        response.cryptoCurrencies.forEach((crypto: any) => {
          balances.push({
            currency: crypto.code,
            name: crypto.name,
            balance: parseFloat(crypto.balance) || 0,
            type: "crypto",
          });
        });
      }

      // Add fiat currency with null checks
      if (response?.preferredFiatCurrency) {
        balances.push({
          currency: response.preferredFiatCurrency.code,
          name: response.preferredFiatCurrency.name,
          balance: parseFloat(response.preferredFiatCurrency.balance) || 0,
          type: "fiat",
        });
      }

      return balances;
    } catch (error: any) {
      throw new Error(
        `Failed to fetch wallet balances for account ${this.label}: ${error.message}`
      );
    }
  }
  // Method to get trade chat history
  async getTradeChat(tradeHash: string): Promise<ChatMessage[]> {
    try {
      const params = new URLSearchParams({
        trade_hash: tradeHash,
        limit: "50", // Default limit, could be made configurable
      });

      const response = await this.makeAuthenticatedRequest<{
        messages: ChatMessage[];
      }>("/noones/v1/trade-chat/get", params);

      if (!response.messages) {
        console.warn(`[${this.label}] No chat messages in response:`, response);
        return [];
      }

      return response.messages;
    } catch (error: any) {
      throw new Error(
        `Failed to fetch trade chat for account ${this.label}: ${error.message}`
      );
    }
  }

  // Method to send a chat message
  async sendTradeMessage(tradeHash: string, message: string): Promise<string> {
    try {
      const params = new URLSearchParams({
        trade_hash: tradeHash,
        message: message,
      });

      const response = await this.makeAuthenticatedRequest<{
        message: ChatMessage;
      }>("/noones/v1/trade-chat/post", params);
      console.log(response);

      if (response?.success) {
        return "Message Posted Successfully!";
      } else {
        return "Failed To send Message!";
      }
    } catch (error: any) {
      throw new Error(
        `Failed to send trade message for account ${this.label}: ${error.message}`
      );
    }
  }

  // Add to NoonesService class

  async markTradeAsPaid(tradeHash: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({ trade_hash: tradeHash });
      const response = await this.makeAuthenticatedRequest<{
        success: boolean;
      }>("/noones/v1/trade/paid", params);
      return response.success;
    } catch (error: any) {
      throw new Error(
        `Failed to mark trade as paid for account ${this.label}: ${error.message}`
      );
    }
  }

  // Method to get transaction history
  async getTransactionHistory(
    options: {
      currency?: string;
      type?: string;
      start_time?: number;
      end_time?: number;
      limit?: number;
    } = {}
  ): Promise<any[]> {
    try {
      const params = new URLSearchParams();

      if (options.currency) params.append("currency", options.currency);
      if (options.type) params.append("type", options.type);
      if (options.start_time)
        params.append("start_time", options.start_time.toString());
      if (options.end_time)
        params.append("end_time", options.end_time.toString());
      if (options.limit) params.append("limit", options.limit.toString());

      const response = await this.makeAuthenticatedRequest<{
        transactions: any[];
      }>("/noones/v1/wallet/transactions", params);

      if (!response.transactions) {
        console.warn(
          `[${this.label}] No transaction data in response:`,
          response
        );
        return [];
      }

      return response.transactions;
    } catch (error: any) {
      throw new Error(
        `Failed to fetch transaction history for account ${this.label}: ${error.message}`
      );
    }
  }
  async listActiveOffers(offerType?: "buy" | "sell"): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      params.append("active", "true");
      if (offerType) {
        params.append("offer_type", offerType);
      }

      const response = await this.makeAuthenticatedRequest<any>(
        "/noones/v1/offer/list",
        params
      );

      if (!response.offers) {
        console.warn(`[${this.label}] No offers data in response:`, response);
        return [];
      }

      return response.offers;
    } catch (error: any) {
      throw new Error(
        `Failed to list active offers for account ${this.label}: ${error.message}`
      );
    }
  }
  async updateOffer(offerHash: string, margin: number): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      params.append("offer_hash", offerHash);
      params.append("margin", margin.toString());

      const response = await this.makeAuthenticatedRequest<{
        success: boolean;
      }>("/offer/update", params);
      console.log(response);
      return response;
    } catch (error: any) {
      throw new Error(
        `Failed to update offer for account ${this.label}: ${error.message}`
      );
    }
  }
  // Add to NoonesService class
  async turnOffAllOffers(): Promise<number> {
    try {
      const response = await this.makeAuthenticatedRequest<{
        count: number;
      }>("/noones/v1/offer/turn-off", new URLSearchParams());

      return response.count;
    } catch (error: any) {
      throw new Error(
        `Failed to turn off all offers for account ${this.label}: ${error.message}`
      );
    }
  }
  async turnOnAllOffers(): Promise<number> {
    try {
      const response = await this.makeAuthenticatedRequest<{
        count: number;
      }>("/noones/v1/offer/turn-on", new URLSearchParams());

      return response.count;
    } catch (error: any) {
      throw new Error(
        `Failed to turn off all offers for account ${this.label}: ${error.message}`
      );
    }
  }

  async createOffer(params: any) {
    const {
      tags,
      margin,
      currency,
      flow_type,
      offer_cap,
      duty_hours,
      custom_rate,
      fixed_price,
      location_id,
      offer_terms,
      bank_accounts,
      is_fixed_price,
      payment_method,
      payment_window,
      crypto_currency = "usdt",
      payment_country,
      offer_type_field,
      predefined_amount,
      custom_rate_active,
      payment_method_group,
      payment_method_label,
      bank_reference_message,
      show_only_trusted_user,
      country_limitation_list,
      country_limitation_type,
      require_min_past_trades,
      custom_rate_fiat_currency,
      auto_share_vendor_payment_account,
    } = params;

    try {
      // Prepare the request body for offer creation
      const requestParams = new URLSearchParams();
      requestParams.append("tags", tags);
      requestParams.append("margin", margin.toString());
      requestParams.append("currency", currency);
      requestParams.append(
        "offer_cap[range_max]",
        offer_cap.range_max.toString()
      );
      requestParams.append(
        "offer_cap[range_min]",
        offer_cap.range_min.toString()
      );
      requestParams.append("offer_terms", offer_terms);
      requestParams.append("payment_method", payment_method);
      requestParams.append("payment_window", payment_window.toString());
      requestParams.append("payment_country", payment_country);
      requestParams.append("offer_type_field", offer_type_field);

      // Optional fields
      if (flow_type) requestParams.append("flow_type", flow_type);
      if (duty_hours)
        requestParams.append("duty_hours", JSON.stringify(duty_hours));
      if (custom_rate !== undefined)
        requestParams.append("custom_rate", custom_rate.toString());
      if (fixed_price !== undefined)
        requestParams.append("fixed_price", fixed_price.toString());
      if (location_id)
        requestParams.append("location_id", location_id.toString());
      if (is_fixed_price) requestParams.append("is_fixed_price", "true");
      if (crypto_currency)
        requestParams.append("crypto_currency", crypto_currency);
      if (predefined_amount)
        requestParams.append("predefined_amount", predefined_amount);
      if (custom_rate_active !== undefined)
        requestParams.append(
          "custom_rate_active",
          custom_rate_active.toString()
        );
      if (payment_method_group)
        requestParams.append("payment_method_group", payment_method_group);
      if (payment_method_label)
        requestParams.append("payment_method_label", payment_method_label);
      if (bank_reference_message)
        requestParams.append(
          "bank_reference_message",
          JSON.stringify(bank_reference_message)
        );
      if (show_only_trusted_user !== undefined)
        requestParams.append(
          "show_only_trusted_user",
          show_only_trusted_user.toString()
        );
      if (country_limitation_list)
        requestParams.append(
          "country_limitation_list",
          country_limitation_list
        );
      if (country_limitation_type)
        requestParams.append(
          "country_limitation_type",
          country_limitation_type
        );
      if (require_min_past_trades)
        requestParams.append(
          "require_min_past_trades",
          require_min_past_trades.toString()
        );
      if (custom_rate_fiat_currency)
        requestParams.append(
          "custom_rate_fiat_currency",
          custom_rate_fiat_currency
        );
      if (auto_share_vendor_payment_account !== undefined)
        requestParams.append(
          "auto_share_vendor_payment_account",
          auto_share_vendor_payment_account.toString()
        );

      // Make the request to create the offer
      const response = await this.makeAuthenticatedRequest<any>(
        "/noones/v1/offer/create",
        requestParams
      );
      console.log(response);
      if (response?.offer_hash) {
        return {
          success: true,
          offer_hash: response.offer_hash,
        };
      } else {
        throw new Error("Failed to create the offer");
      }
    } catch (error: any) {
      console.error("Error creating offer:", error);
      throw new Error(`Failed to create offer: ${error.message}`);
    }
  }
}
