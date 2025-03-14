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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaxfulTradeDetails = exports.fetchPaxfulTrades = exports.PaxfulService = void 0;
const PaxfulApi_js_1 = require("@paxful/sdk-js/dist/PaxfulApi.js");
class PaxfulService {
    constructor(config) {
        if (!config.clientId || !config.clientSecret) {
            throw new Error("Client ID and secret are required for Paxful service");
        }
        this.paxfulApi = new PaxfulApi_js_1.PaxfulApi({
            clientId: config.clientId,
            clientSecret: config.clientSecret,
        });
        this.accountId = config.accountId;
        this.label = config.label;
    }
    makeRequest(endpoint_1) {
        return __awaiter(this, arguments, void 0, function* (endpoint, data = {}) {
            try {
                console.log(`[${this.label}] Making request to ${endpoint}`);
                const response = yield this.paxfulApi.invoke(endpoint, data);
                return response;
            }
            catch (error) {
                console.error(`[${this.label}] Request failed:`, {
                    endpoint,
                    error: error.message,
                });
                throw new Error(`Paxful API Error for account ${this.label}: ${error.message}`);
            }
        });
    }
    listActiveTrades() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.makeRequest("/paxful/v1/trade/list");
            return response.data.trades;
        });
    }
    getTradeDetails(tradeHash) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.makeRequest("/paxful/v1/trade/get", {
                trade_hash: tradeHash,
            });
        });
    }
    // Add to PaxfulService class
    markTradeAsPaid(tradeHash) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.makeRequest("/paxful/v1/trade/paid", {
                    trade_hash: tradeHash,
                });
                return response.data.success;
            }
            catch (error) {
                throw new Error(`Failed to mark trade as paid for account ${this.label}: ${error.message}`);
            }
        });
    }
    getBitcoinPrice() {
        return __awaiter(this, void 0, void 0, function* () {
            const paxfulApi = new PaxfulApi_js_1.PaxfulApi({
                clientId: "qdmuUssOPik1cCfGD3lxQjUu6EYzUoP2olFh4TGkormR0JBC",
                clientSecret: "qtyTukmnNSzbQv8UQJzsSglALTHWCukWcaJUjX8lGGAC8Ex3",
            });
            const paxfulRateResponse = yield paxfulApi.invoke("/paxful/v1/currency/btc", {});
            return paxfulRateResponse.price;
        });
    }
    getWalletBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.makeRequest("/paxful/v1/wallet/balance");
            return response.data.balance;
        });
    }
    getTotalBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.makeRequest("/paxful/v1/wallet/balance");
            const available = response.balance;
            const escrow = response.pending_balance;
            return {
                available,
                escrow,
                total: (parseFloat(available) + parseFloat(escrow)).toString(),
            };
        });
    }
    // New methods below
    getTradeChat(tradeHash) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.makeRequest("/paxful/v1/trade-chat/get", {
                    trade_hash: tradeHash,
                });
                console.log(response);
                return {
                    messages: response.data.messages,
                    attachments: response.data.attachments,
                };
            }
            catch (error) {
                throw new Error(`Failed to fetch trade chat for account ${this.label}: ${error.message}`);
            }
        });
    }
    sendTradeMessage(tradeHash, message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.makeRequest("/paxful/v1/trade-chat/post", {
                    trade_hash: tradeHash,
                    message: message,
                });
                console.log(response);
                return response.data ? response.data.message : response.error.message;
            }
            catch (error) {
                throw new Error(`Failed to send trade message for account ${this.label}: ${error.message}`);
            }
        });
    }
    getTransactionHistory() {
        return __awaiter(this, arguments, void 0, function* (options = {}) {
            try {
                const response = yield this.makeRequest("/paxful/v1/wallet/transactions", options);
                return response.data.transactions;
            }
            catch (error) {
                throw new Error(`Failed to fetch transaction history for account ${this.label}: ${error.message}`);
            }
        });
    }
    listOffers() {
        return __awaiter(this, arguments, void 0, function* (params = {}) {
            try {
                const response = yield this.makeRequest("/paxful/v1/offer/list", params);
                return response.data.offers;
            }
            catch (error) {
                throw new Error(`Failed to list offers for account ${this.label}: ${error.message}`);
            }
        });
    }
    cancelTrade(tradeHash) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.makeRequest("/paxful/v1/trade/cancel", {
                    trade_hash: tradeHash,
                });
                return true;
            }
            catch (error) {
                throw new Error(`Failed to cancel trade for account ${this.label}: ${error.message}`);
            }
        });
    }
    uploadTradeDocument(tradeHash, document, filename) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.makeRequest("/paxful/v1/trade/document/upload", {
                    trade_hash: tradeHash,
                    document: document,
                    filename: filename,
                });
                return response.data.document;
            }
            catch (error) {
                throw new Error(`Failed to upload trade document for account ${this.label}: ${error.message}`);
            }
        });
    }
    getUserProfile(username) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.makeRequest("/paxful/v1/user/info", {
                    username: username,
                });
                return response.data.user;
            }
            catch (error) {
                throw new Error(`Failed to fetch user profile for account ${this.label}: ${error.message}`);
            }
        });
    }
    getFeedback() {
        return __awaiter(this, arguments, void 0, function* (params = {}) {
            try {
                const response = yield this.makeRequest("/paxful/v1/feedback/list", params);
                return response.data.feedback;
            }
            catch (error) {
                throw new Error(`Failed to fetch feedback for account ${this.label}: ${error.message}`);
            }
        });
    }
    listActiveOffers(offerType) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const params = { active: true };
                if (offerType) {
                    params.offer_type = offerType;
                }
                const response = yield this.paxfulApi.invoke("/paxful/v1/offer/list", params);
                if (!((_a = response.data) === null || _a === void 0 ? void 0 : _a.offers)) {
                    console.warn(`[${this.label}] No offers data in response:`, response);
                    return [];
                }
                return response.data.offers;
            }
            catch (error) {
                throw new Error(`Failed to list active offers for account ${this.label}: ${error.message}`);
            }
        });
    }
    updateOffer(offerId, margin) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.makeRequest("/paxful/v1/offer/update", {
                    offer_hash: offerId,
                    margin: margin.toString(),
                });
                console.log(response);
                return response;
            }
            catch (error) {
                throw new Error(`Failed to update offer for account ${this.label}: ${error.message}`);
            }
        });
    }
    turnOffAllOffers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.paxfulApi.invoke("/paxful/v1/offer/turn-off", {});
                console.log(response);
                return response.data;
            }
            catch (error) {
                throw new Error(`Failed to turn off all offers for account ${this.label}: ${error.message}`);
            }
        });
    }
    turnOnAllOffers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.paxfulApi.invoke("/paxful/v1/offer/turn-on", {});
                console.log(response);
                return response.data;
            }
            catch (error) {
                throw new Error(`Failed to turn off all offers for account ${this.label}: ${error.message}`);
            }
        });
    }
    createOffer(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const requestParams = {
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
                if (params.country)
                    requestParams.country = params.country;
                console.log(`[${this.label}] Creating Paxful offer...`);
                const response = yield this.makeRequest("/paxful/v1/offer/create", requestParams);
                console.log(response);
                return {
                    success: true,
                };
            }
            catch (error) {
                console.error("Error creating Paxful offer:", error);
                throw new Error(`Failed to create offer: ${error.message}`);
            }
        });
    }
}
exports.PaxfulService = PaxfulService;
const apiConfig = {
    clientId: process.env.PAXFUL_CLIENT_ID ||
        "L4HJDA4ic91JwsWLkQCDeZkue7TH4jmpn4kyKUuKkRSUdCF3",
    clientSecret: process.env.PAXFUL_CLIENT_SECRET ||
        "5lVWlN54pPhnrqWkU8mqv1P2ExEpadN7LuQ4RiIKQtF36nk2",
};
const paxfulService = new PaxfulService(apiConfig);
const fetchPaxfulTrades = () => __awaiter(void 0, void 0, void 0, function* () { return paxfulService.listActiveTrades(); });
exports.fetchPaxfulTrades = fetchPaxfulTrades;
const getPaxfulTradeDetails = (tradeHash) => __awaiter(void 0, void 0, void 0, function* () { return paxfulService.getTradeDetails(tradeHash); });
exports.getPaxfulTradeDetails = getPaxfulTradeDetails;
exports.default = paxfulService;
