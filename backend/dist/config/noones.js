"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoonesService = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
dotenv_1.default.config();
class NoonesService {
    constructor(config) {
        this.token = null;
        this.tokenExpiry = null;
        this.isInitialized = false;
        if (!config.apiKey || !config.apiSecret) {
            throw new Error("API credentials are required");
        }
        this.apiKey = config.apiKey;
        this.apiSecret = config.apiSecret;
        this.accountId = config.accountId;
        this.label = config.label;
    }
    handleApiError(error) {
        var _a, _b, _c, _d;
        if (error.response) {
            const status = error.response.status;
            const message = ((_a = error.response.data) === null || _a === void 0 ? void 0 : _a.message) || "An error occurred";
            console.error(`[${this.label}] API Error:`, {
                status,
                message,
                url: (_b = error.config) === null || _b === void 0 ? void 0 : _b.url,
                method: (_c = error.config) === null || _c === void 0 ? void 0 : _c.method,
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
                    throw new Error(`Resource not found: ${(_d = error.config) === null || _d === void 0 ? void 0 : _d.url}`);
                default:
                    throw new Error(`API Error (${status}): ${message}`);
            }
        }
        throw new Error(`Network error: ${error.message}`);
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isInitialized)
                return;
            try {
                yield this.getAccessToken();
                this.isInitialized = true;
                console.log(`[${this.label}] Service initialized successfully`);
            }
            catch (error) {
                this.isInitialized = false;
                console.error(`[${this.label}] Initialization failed:`, error);
                throw error;
            }
        });
    }
    getAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
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
                const response = yield axios_1.default.post(url, params, {
                    headers,
                });
                if (!response.data.access_token) {
                    throw new Error("No access token received");
                }
                this.token = response.data.access_token;
                this.tokenExpiry = Date.now() + response.data.expires_in * 1000;
                return this.token;
            }
            catch (error) {
                this.token = null;
                this.tokenExpiry = null;
                console.log(`This is nooones Response`, error);
                throw new Error(`Failed to fetch access token: ${error.message}`);
            }
        });
    }
    makeAuthenticatedRequest(endpoint_1) {
        return __awaiter(this, arguments, void 0, function* (endpoint, params = new URLSearchParams()) {
            if (!this.isInitialized) {
                yield this.initialize();
            }
            try {
                const token = yield this.getAccessToken();
                const url = `https://api.noones.com${endpoint}`;
                console.log(`[${this.label}] Making request to ${url}`);
                const response = yield axios_1.default.post(url, params, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Authorization: `Bearer ${token}`,
                    },
                });
                return response.data.data;
            }
            catch (error) {
                return this.handleApiError(error);
            }
        });
    }
    getBitcoinPrice() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const accessToken = yield this.getAccessToken();
                const Btcparams = new URLSearchParams();
                Btcparams.append("response", "string");
                const response = yield axios_1.default.post("https://api.noones.com/noones/v1/currency/btc", Btcparams, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                return response.data.price;
            }
            catch (error) {
                console.error("Error fetching Bitcoin price:", error);
                throw new Error("Failed to fetch Bitcoin price");
            }
        });
    }
    getTradeDetails(tradeHash) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const params = new URLSearchParams({ trade_hash: tradeHash });
                const response = yield this.makeAuthenticatedRequest("/noones/v1/trade/get", params);
                return response.trade;
            }
            catch (error) {
                throw new Error(`Failed to fetch trade details for account ${this.label}: ${error.message}`);
            }
        });
    }
    listActiveTrades() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.makeAuthenticatedRequest("/noones/v1/trade/list");
                if (!response.trades) {
                    console.warn(`[${this.label}] No trades data in response:`, response);
                    return [];
                }
                console.log(response);
                return response.trades;
            }
            catch (error) {
                throw new Error(`Failed to list active trades for account ${this.label}: ${error.message}`);
            }
        });
    }
    verifyCredentials() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.initialize();
                return true;
            }
            catch (error) {
                return false;
            }
        });
    }
    getWalletBalances() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield this.makeAuthenticatedRequest("/noones/v1/user/wallet-balances");
                const balances = [];
                console.log(response);
                // Add crypto currencies with null checks
                if ((_a = response === null || response === void 0 ? void 0 : response.cryptoCurrencies) === null || _a === void 0 ? void 0 : _a.length) {
                    response.cryptoCurrencies.forEach((crypto) => {
                        balances.push({
                            currency: crypto.code,
                            name: crypto.name,
                            balance: parseFloat(crypto.balance) || 0,
                            type: "crypto",
                        });
                    });
                }
                // Add fiat currency with null checks
                if (response === null || response === void 0 ? void 0 : response.preferredFiatCurrency) {
                    balances.push({
                        currency: response.preferredFiatCurrency.code,
                        name: response.preferredFiatCurrency.name,
                        balance: parseFloat(response.preferredFiatCurrency.balance) || 0,
                        type: "fiat",
                    });
                }
                return balances;
            }
            catch (error) {
                throw new Error(`Failed to fetch wallet balances for account ${this.label}: ${error.message}`);
            }
        });
    }
    // Method to get trade chat history
    getTradeChat(tradeHash) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const params = new URLSearchParams({
                    trade_hash: tradeHash,
                    limit: "50", // Default limit, could be made configurable
                });
                const response = yield this.makeAuthenticatedRequest("/noones/v1/trade-chat/get", params);
                if (!response.messages) {
                    console.warn(`[${this.label}] No chat messages in response:`, response);
                    return [];
                }
                return response.messages;
            }
            catch (error) {
                throw new Error(`Failed to fetch trade chat for account ${this.label}: ${error.message}`);
            }
        });
    }
    // Method to send a chat message
    sendTradeMessage(tradeHash, message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const params = new URLSearchParams({
                    trade_hash: tradeHash,
                    message: message,
                });
                const response = yield this.makeAuthenticatedRequest("/noones/v1/trade-chat/post", params);
                console.log(response);
                if (response === null || response === void 0 ? void 0 : response.success) {
                    return "Message Posted Successfully!";
                }
                else {
                    return "Failed To send Message!";
                }
            }
            catch (error) {
                throw new Error(`Failed to send trade message for account ${this.label}: ${error.message}`);
            }
        });
    }
    // Add to NoonesService class
    markTradeAsPaid(tradeHash) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const params = new URLSearchParams({ trade_hash: tradeHash });
                const response = yield this.makeAuthenticatedRequest("/noones/v1/trade/paid", params);
                return response.success;
            }
            catch (error) {
                throw new Error(`Failed to mark trade as paid for account ${this.label}: ${error.message}`);
            }
        });
    }
    // Method to get transaction history
    getTransactionHistory() {
        return __awaiter(this, arguments, void 0, function* (options = {}) {
            try {
                const params = new URLSearchParams();
                if (options.currency)
                    params.append("currency", options.currency);
                if (options.type)
                    params.append("type", options.type);
                if (options.start_time)
                    params.append("start_time", options.start_time.toString());
                if (options.end_time)
                    params.append("end_time", options.end_time.toString());
                if (options.limit)
                    params.append("limit", options.limit.toString());
                const response = yield this.makeAuthenticatedRequest("/noones/v1/wallet/transactions", params);
                if (!response.transactions) {
                    console.warn(`[${this.label}] No transaction data in response:`, response);
                    return [];
                }
                return response.transactions;
            }
            catch (error) {
                throw new Error(`Failed to fetch transaction history for account ${this.label}: ${error.message}`);
            }
        });
    }
    listActiveOffers(offerType) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const params = new URLSearchParams();
                params.append("active", "true");
                if (offerType) {
                    params.append("offer_type", offerType);
                }
                const response = yield this.makeAuthenticatedRequest("/noones/v1/offer/list", params);
                if (!response.offers) {
                    console.warn(`[${this.label}] No offers data in response:`, response);
                    return [];
                }
                return response.offers;
            }
            catch (error) {
                throw new Error(`Failed to list active offers for account ${this.label}: ${error.message}`);
            }
        });
    }
    updateOffer(offerHash, margin) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const params = new URLSearchParams();
                params.append("offer_hash", offerHash);
                params.append("margin", margin.toString());
                const response = yield this.makeAuthenticatedRequest("/offer/update", params);
                console.log(response);
                return response;
            }
            catch (error) {
                throw new Error(`Failed to update offer for account ${this.label}: ${error.message}`);
            }
        });
    }
    // Add to NoonesService class
    turnOffAllOffers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.makeAuthenticatedRequest("/noones/v1/offer/turn-off", new URLSearchParams());
                return response.count;
            }
            catch (error) {
                throw new Error(`Failed to turn off all offers for account ${this.label}: ${error.message}`);
            }
        });
    }
    turnOnAllOffers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.makeAuthenticatedRequest("/noones/v1/offer/turn-on", new URLSearchParams());
                return response.count;
            }
            catch (error) {
                throw new Error(`Failed to turn off all offers for account ${this.label}: ${error.message}`);
            }
        });
    }
    createOffer(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { tags, margin, currency, flow_type, offer_cap, duty_hours, custom_rate, fixed_price, location_id, offer_terms, bank_accounts, is_fixed_price, payment_method, payment_window, crypto_currency = "usdt", payment_country, offer_type_field, predefined_amount, custom_rate_active, payment_method_group, payment_method_label, bank_reference_message, show_only_trusted_user, country_limitation_list, country_limitation_type, require_min_past_trades, custom_rate_fiat_currency, auto_share_vendor_payment_account, } = params;
            try {
                // Prepare the request body for offer creation
                const requestParams = new URLSearchParams();
                requestParams.append("tags", tags);
                requestParams.append("margin", margin.toString());
                requestParams.append("currency", currency);
                requestParams.append("offer_cap[range_max]", offer_cap.range_max.toString());
                requestParams.append("offer_cap[range_min]", offer_cap.range_min.toString());
                requestParams.append("offer_terms", offer_terms);
                requestParams.append("payment_method", payment_method);
                requestParams.append("payment_window", payment_window.toString());
                requestParams.append("payment_country", payment_country);
                requestParams.append("offer_type_field", offer_type_field);
                // Optional fields
                if (flow_type)
                    requestParams.append("flow_type", flow_type);
                if (duty_hours)
                    requestParams.append("duty_hours", JSON.stringify(duty_hours));
                if (custom_rate !== undefined)
                    requestParams.append("custom_rate", custom_rate.toString());
                if (fixed_price !== undefined)
                    requestParams.append("fixed_price", fixed_price.toString());
                if (location_id)
                    requestParams.append("location_id", location_id.toString());
                if (is_fixed_price)
                    requestParams.append("is_fixed_price", "true");
                if (crypto_currency)
                    requestParams.append("crypto_currency", crypto_currency);
                if (predefined_amount)
                    requestParams.append("predefined_amount", predefined_amount);
                if (custom_rate_active !== undefined)
                    requestParams.append("custom_rate_active", custom_rate_active.toString());
                if (payment_method_group)
                    requestParams.append("payment_method_group", payment_method_group);
                if (payment_method_label)
                    requestParams.append("payment_method_label", payment_method_label);
                if (bank_reference_message)
                    requestParams.append("bank_reference_message", JSON.stringify(bank_reference_message));
                if (show_only_trusted_user !== undefined)
                    requestParams.append("show_only_trusted_user", show_only_trusted_user.toString());
                if (country_limitation_list)
                    requestParams.append("country_limitation_list", country_limitation_list);
                if (country_limitation_type)
                    requestParams.append("country_limitation_type", country_limitation_type);
                if (require_min_past_trades)
                    requestParams.append("require_min_past_trades", require_min_past_trades.toString());
                if (custom_rate_fiat_currency)
                    requestParams.append("custom_rate_fiat_currency", custom_rate_fiat_currency);
                if (auto_share_vendor_payment_account !== undefined)
                    requestParams.append("auto_share_vendor_payment_account", auto_share_vendor_payment_account.toString());
                // Make the request to create the offer
                const response = yield this.makeAuthenticatedRequest("/noones/v1/offer/create", requestParams);
                console.log(response);
                if (response === null || response === void 0 ? void 0 : response.offer_hash) {
                    return {
                        success: true,
                        offer_hash: response.offer_hash,
                    };
                }
                else {
                    throw new Error("Failed to create the offer");
                }
            }
            catch (error) {
                console.error("Error creating offer:", error);
                throw new Error(`Failed to create offer: ${error.message}`);
            }
        });
    }
}
exports.NoonesService = NoonesService;
