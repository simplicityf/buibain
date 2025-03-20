"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getUnfinishedTrades = exports.getAllTrades = exports.reassignTrade = exports.turnOnAllOffers = exports.turnOffAllOffers = exports.updateOffersMargin = exports.getCompletedPaidTrades = exports.getDashboardStats = exports.markTradeAsPaid = exports.getPayerTrade = exports.getRates = exports.setOrUpdateRates = exports.getWalletBalances = exports.sendTradeChatMessage = exports.getTradeDetails = exports.getCurrencyRates = exports.fetchTradeDetailsById = exports.assignLiveTrades = exports.getLiveTrades = void 0;
const database_1 = __importDefault(require("../config/database"));
const trades_1 = require("../models/trades");
const rates_1 = require("../models/rates");
const accounts_1 = require("../models/accounts");
const noones_1 = require("../config/noones");
const paxful_1 = __importStar(require("../config/paxful"));
const binance_1 = require("../config/binance");
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const escalatedTrades_1 = require("../models/escalatedTrades");
const user_1 = require("../models/user");
const typeorm_1 = require("typeorm");
/**
 * Initialize platform services with accounts from your database.
 */
function initializePlatformServices() {
    return __awaiter(this, void 0, void 0, function* () {
        const accountRepo = database_1.default.getRepository(accounts_1.Account);
        const accounts = yield accountRepo.find();
        const services = {
            noones: [],
            paxful: [],
            binance: [],
        };
        for (const account of accounts) {
            const decryptedKey = account.api_key;
            const decryptedSecret = account.api_secret;
            switch (account.platform) {
                case "noones":
                    services.noones.push(new noones_1.NoonesService({
                        apiKey: decryptedKey,
                        apiSecret: decryptedSecret,
                        accountId: account.id,
                        label: account.account_username,
                    }));
                    break;
                case "paxful":
                    services.paxful.push(new paxful_1.PaxfulService({
                        clientId: decryptedKey,
                        clientSecret: decryptedSecret,
                        accountId: account.id,
                        label: account.account_username,
                    }));
                    break;
                case "binance":
                    services.binance.push(new binance_1.BinanceService({
                        apiKey: decryptedKey,
                        apiSecret: decryptedSecret,
                        accountId: account.id,
                        label: account.account_username,
                    }));
                    break;
            }
        }
        return services;
    });
}
// Helper function: aggregateLiveTrades
const aggregateLiveTrades = () => __awaiter(void 0, void 0, void 0, function* () {
    const services = yield initializePlatformServices();
    let liveTrades = [];
    // Fetch trades from Paxful.
    for (const service of services.paxful) {
        try {
            const paxfulTrades = yield service.listActiveTrades();
            liveTrades = liveTrades.concat(paxfulTrades.map((trade) => (Object.assign(Object.assign({}, trade), { platform: "paxful", accountId: service.accountId }))));
        }
        catch (error) {
            console.error(`Error fetching Paxful trades for account ${service.accountId}:`, error);
        }
    }
    // Fetch trades from Noones.
    for (const service of services.noones) {
        try {
            const noonesTrades = yield service.listActiveTrades();
            liveTrades = liveTrades.concat(noonesTrades.map((trade) => (Object.assign(Object.assign({}, trade), { platform: "noones", accountId: service.accountId }))));
        }
        catch (error) {
            console.error(`Error fetching Noones trades for account ${service.accountId}:`, error);
        }
    }
    // Filter for trades with status "PENDING" (unassigned).
    return liveTrades.filter((trade) => trade.status === "PENDING");
});
/**
 * GET live trades (aggregated from Paxful and Noones)
 */
const getLiveTrades = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const unassignedTrades = yield aggregateLiveTrades();
        return res.status(200).json({
            success: true,
            data: unassignedTrades,
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.getLiveTrades = getLiveTrades;
/**
 * Get all available payers (users with role PAYER who are currently clockedIn)
 */
const getAvailablePayers = () => __awaiter(void 0, void 0, void 0, function* () {
    const userRepository = database_1.default.getRepository(user_1.User);
    const payers = yield userRepository.find({
        where: { userType: user_1.UserType.PAYER, clockedIn: true },
        order: { createdAt: "ASC" },
    });
    return payers;
});
/**
 * Round-robin assignment: Distribute all live (unassigned) trades among available payers.
 */
// A temporary helper function to simulate dummy live trades for testing.
const getDummyLiveTrades = () => {
    return [
        {
            trade_hash: "dummyTradeHash1",
            platform: "paxful", // or "noones"
            amount: 1000,
            accountId: "dummyPaxfulAccountId", // Simulate an external account identifier
            status: "PENDING",
        },
        {
            trade_hash: "dummyTradeHash2",
            platform: "noones",
            amount: 2000,
            accountId: "dummyNoonesAccountId", // Simulate an external account identifier
            status: "PENDING",
        },
    ];
};
const assignLiveTrades = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // If query parameter or environment variable indicates dummy mode, use dummy data.
        const useDummy = req.query.useDummy === "true" || process.env.USE_DUMMY_LIVE_TRADES === "true";
        const liveTrades = useDummy ? getDummyLiveTrades() : yield aggregateLiveTrades();
        if (!liveTrades || liveTrades.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No unassigned live trades found.",
            });
        }
        // Get available payers (users with role PAYER and clockedIn true).
        const availablePayers = yield getAvailablePayers();
        if (availablePayers.length === 0) {
            return next(new errorHandler_1.default("No available payers found", 400));
        }
        // Retrieve platform services for further processing.
        const services = yield initializePlatformServices();
        const tradeRepository = database_1.default.getRepository(trades_1.Trade);
        const assignedTrades = [];
        let payerIndex = 0;
        // Iterate over each live trade.
        for (const tradeData of liveTrades) {
            // Round-robin assignment.
            const payer = availablePayers[payerIndex];
            payerIndex = (payerIndex + 1) % availablePayers.length;
            // Check if the trade is already assigned.
            const existingTrade = yield tradeRepository.findOne({
                where: { tradeHash: tradeData.trade_hash },
            });
            if (existingTrade)
                continue;
            // For platforms that support fetching additional vendor details.
            let tradeDetails = null;
            let tradeChat = null;
            if (tradeData.platform === "noones" || tradeData.platform === "paxful") {
                const platformKey = tradeData.platform;
                const platformService = (_a = services[platformKey]) === null || _a === void 0 ? void 0 : _a.find((s) => s.accountId === tradeData.accountId);
                if (platformService) {
                    tradeDetails = yield platformService.getTradeDetails(tradeData.trade_hash);
                    if (platformService.getTradeChat) {
                        tradeChat = yield platformService.getTradeChat(tradeData.trade_hash);
                    }
                }
            }
            // Create a new Trade record.
            let trade = tradeRepository.create({
                tradeHash: tradeData.trade_hash,
                platform: tradeData.platform,
                amount: tradeData.amount,
                status: trades_1.TradeStatus.ASSIGNED,
                assignedPayerId: payer.id,
                assignedAt: new Date(),
                accountId: tradeData.accountId,
                // Optionally store tradeDetails/tradeChat in your JSON columns if your entity supports it.
            });
            trade = yield tradeRepository.save(trade);
            assignedTrades.push(trade);
        }
        return res.status(200).json({
            success: true,
            message: "Live trades assigned to available payers using round-robin strategy.",
            data: assignedTrades,
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.assignLiveTrades = assignLiveTrades;
/**
 * Fetch trade details (including chat) based on stored trade data.
 * Instead of manually inputting tradeHash, platform, and accountId,
 * this endpoint uses the trade record (identified by tradeId) to retrieve those details.
 */
const fetchTradeDetailsById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tradeId } = req.params;
        const tradeRepository = database_1.default.getRepository(trades_1.Trade);
        const trade = yield tradeRepository.findOne({ where: { id: tradeId } });
        if (!trade) {
            return next(new errorHandler_1.default("Trade not found", 404));
        }
        // Destructure stored values from the trade record.
        const { tradeHash, platform, accountId } = trade;
        const services = yield initializePlatformServices();
        let tradeDetails, tradeChat;
        switch (platform) {
            case "noones": {
                const service = services.noones.find((s) => s.accountId === accountId);
                if (!service)
                    return next(new errorHandler_1.default("Noones account not found", 404));
                tradeDetails = yield service.getTradeDetails(tradeHash);
                tradeChat = yield service.getTradeChat(tradeHash);
                break;
            }
            case "paxful": {
                const service = services.paxful.find((s) => s.accountId === accountId);
                if (!service)
                    return next(new errorHandler_1.default("Paxful account not found", 404));
                tradeDetails = yield service.getTradeDetails(tradeHash);
                // Assuming paxful returns { data: { trade: ... } }
                tradeDetails = tradeDetails.data.trade;
                tradeChat = yield service.getTradeChat(tradeHash);
                break;
            }
            default:
                return next(new errorHandler_1.default("Unsupported platform", 400));
        }
        return res.status(200).json({
            success: true,
            data: { tradeDetails, tradeChat },
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.fetchTradeDetailsById = fetchTradeDetailsById;
/**
 * GET Currency Rates
 */
const getCurrencyRates = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const services = yield initializePlatformServices();
        const rates = {};
        // Get Noones rate
        if (services.noones.length > 0) {
            try {
                const rate = yield services.noones[0].getBitcoinPrice();
                rates.noonesRate = rate;
            }
            catch (error) {
                console.error("Error fetching Noones rate:", error);
            }
        }
        if (services.binance.length > 0) {
            try {
                const { btcUsdt } = yield services.binance[0].fetchAllRates();
                rates.binanceRate = btcUsdt.price;
                console.log("Binance rate: ", rates.binanceRate);
            }
            catch (error) {
                console.error("Error fetching Binance rate:", error);
            }
        }
        const paxfulRate = yield paxful_1.default.getBitcoinPrice();
        rates.paxfulRate = paxfulRate;
        console.log("Paxful rate: ", rates.paxfulRate);
        if (Object.keys(rates).length === 0) {
            return next(new errorHandler_1.default("Failed to fetch rates from any platform", 500));
        }
        return res.status(200).json({ data: Object.assign({}, rates), success: true });
    }
    catch (error) {
        console.log(error.message);
        return next(error);
    }
});
exports.getCurrencyRates = getCurrencyRates;
/**
 * Get trade details from any platform.
 * (Legacy endpoint expecting tradeHash, platform, accountId in the body.)
 * Consider using fetchTradeDetailsById instead.
 */
const getTradeDetails = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tradeHash, platform, accountId } = req.body;
        if (!platform || !tradeHash || !accountId) {
            return next(new errorHandler_1.default("Platform, trade hash, and account ID are required", 400));
        }
        const services = yield initializePlatformServices();
        let trade;
        let tradeChat;
        switch (platform) {
            case "noones": {
                const service = services.noones.find((s) => s.accountId === accountId);
                if (!service) {
                    return next(new errorHandler_1.default("Account not found", 404));
                }
                trade = yield service.getTradeDetails(tradeHash);
                tradeChat = yield service.getTradeChat(tradeHash);
                break;
            }
            case "paxful": {
                const service = services.paxful.find((s) => s.accountId === accountId);
                if (!service) {
                    return next(new errorHandler_1.default("Account not found", 404));
                }
                trade = yield service.getTradeDetails(tradeHash);
                trade = trade.data.trade;
                tradeChat = yield service.getTradeChat(tradeHash);
                break;
            }
            default:
                return next(new errorHandler_1.default("Unsupported platform", 400));
        }
        if (!trade) {
            return next(new errorHandler_1.default("No trade found", 404));
        }
        return res.status(200).json({
            success: true,
            data: { trade, tradeChat },
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.getTradeDetails = getTradeDetails;
/**
 * Send message in trade chat.
 */
const sendTradeChatMessage = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { tradeId } = req.params;
        const { content } = req.body;
        if (!tradeId || !content) {
            return next(new errorHandler_1.default("Trade ID and content are required", 400));
        }
        const tradeRepository = database_1.default.getRepository(trades_1.Trade);
        const trade = yield tradeRepository.findOne({ where: { id: tradeId } });
        if (!trade) {
            return next(new errorHandler_1.default("Trade not found", 404));
        }
        // Binance does not support sending trade messages.
        if (trade.platform === "binance") {
            return next(new errorHandler_1.default("Binance does not support sending trade messages", 400));
        }
        const services = yield initializePlatformServices();
        const platformService = (_a = services[trade.platform]) === null || _a === void 0 ? void 0 : _a.find((s) => s.accountId === trade.accountId);
        if (!platformService) {
            return next(new errorHandler_1.default("Platform service not found", 404));
        }
        yield platformService.sendTradeMessage(trade.tradeHash, content);
        return res.status(200).json({
            success: true,
            message: "Message posted successfully",
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.sendTradeChatMessage = sendTradeChatMessage;
/**
 * Get wallet balances.
 */
const getWalletBalances = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountRepository = database_1.default.getRepository(accounts_1.Account);
        const accounts = yield accountRepository.find({
            where: { status: "active" },
        });
        const services = [];
        const balances = {};
        for (const account of accounts) {
            try {
                switch (account.platform) {
                    case "noones":
                        services.push({
                            platform: "noones",
                            label: account.account_username,
                            accountId: account.id,
                            getBalance: () => __awaiter(void 0, void 0, void 0, function* () {
                                const service = new noones_1.NoonesService({
                                    apiKey: account.api_key,
                                    apiSecret: account.api_secret,
                                    label: account.account_username,
                                });
                                yield service.initialize();
                                return service.getWalletBalances();
                            }),
                        });
                        break;
                    case "paxful":
                        services.push({
                            platform: "paxful",
                            label: account.account_username,
                            accountId: account.id,
                            getBalance: () => __awaiter(void 0, void 0, void 0, function* () {
                                const service = new paxful_1.PaxfulService({
                                    clientId: account.api_key,
                                    clientSecret: account.api_secret,
                                    label: account.account_username,
                                });
                                return [
                                    {
                                        currency: "BTC",
                                        name: "Bitcoin",
                                        balance: yield service.getWalletBalance(),
                                        type: "crypto",
                                    },
                                ];
                            }),
                        });
                        break;
                    case "binance":
                        services.push({
                            platform: "binance",
                            label: account.account_username,
                            accountId: account.id,
                            getBalance: () => __awaiter(void 0, void 0, void 0, function* () {
                                const service = new binance_1.BinanceService({
                                    apiKey: account.api_key,
                                    apiSecret: account.api_secret,
                                    label: account.account_username,
                                });
                                const balance = yield service.getBTCBalance();
                                return [
                                    {
                                        currency: "BTC",
                                        name: "Bitcoin",
                                        balance: yield service.getBTCBalance(),
                                        type: "crypto",
                                    },
                                ];
                            }),
                        });
                        break;
                }
            }
            catch (error) {
                console.error(`Error initializing service for account ${account.id}:`, error);
                balances[account.id] = {
                    error: "Service initialization failed",
                    platform: account.platform,
                    label: account.account_username,
                };
            }
        }
        yield Promise.all(services.map((service) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const balance = yield service.getBalance();
                balances[service.accountId] = {
                    platform: service.platform,
                    label: service.label,
                    balances: balance,
                };
            }
            catch (error) {
                console.error(`Error fetching balance for ${service.label}:`, error);
                balances[service.accountId] = {
                    error: "Failed to fetch balance",
                    platform: service.platform,
                    label: service.label,
                };
            }
        })));
        const transformedBalances = {};
        for (const [accountId, balanceData] of Object.entries(balances)) {
            if (balanceData.error) {
                transformedBalances[accountId] = balanceData;
                continue;
            }
            transformedBalances[accountId] = {
                balances: balanceData.balances.map((balance) => ({
                    currency: balance.currency,
                    name: balance.name,
                    balance: balance.balance,
                    type: balance.type,
                })),
                platform: balanceData.platform,
                label: balanceData.label,
            };
        }
        return res.status(200).json({
            success: true,
            data: transformedBalances,
        });
    }
    catch (error) {
        console.error("Unexpected error in getWalletBalances:", error);
        return next(error);
    }
});
exports.getWalletBalances = getWalletBalances;
/**
 * Controller to manually set or update rates.
 */
const setOrUpdateRates = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { noonesRate, paxfulRate, sellingPrice, usdtNgnRate, markup2 } = req.body;
        if (!noonesRate || !paxfulRate || !sellingPrice || !usdtNgnRate || !markup2) {
            return next(new errorHandler_1.default("All rates (noonesRate, paxfulRate, sellingPrice, usdtNgnRate, markup2) are required", 400));
        }
        const ratesRepository = database_1.default.getRepository(rates_1.Rates);
        let ratesAll = yield ratesRepository.find();
        let rates = ratesAll.length > 0 ? ratesAll[0] : null;
        if (!rates) {
            rates = new rates_1.Rates();
            rates.costPriceNoones = noonesRate;
            rates.costPricePaxful = paxfulRate;
            rates.sellingPrice = sellingPrice;
            rates.usdtNgnRate = usdtNgnRate;
            rates.markup2 = markup2;
            yield ratesRepository.save(rates);
            return res.status(201).json({
                success: true,
                message: "Rates set successfully",
                data: rates,
            });
        }
        else {
            rates.costPriceNoones = noonesRate;
            rates.costPricePaxful = paxfulRate;
            rates.sellingPrice = sellingPrice;
            rates.usdtNgnRate = usdtNgnRate;
            rates.markup2 = markup2;
            yield ratesRepository.save(rates);
            return res.status(200).json({
                success: true,
                message: "Rates updated successfully",
                data: rates,
            });
        }
    }
    catch (error) {
        return next(error);
    }
});
exports.setOrUpdateRates = setOrUpdateRates;
/**
 * GET Rates.
 */
const getRates = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ratesRepository = database_1.default.getRepository(rates_1.Rates);
        const ratesAll = yield ratesRepository.find();
        if (ratesAll.length === 0) {
            return res.status(200).json({
                success: true,
                data: {},
            });
        }
        const rates = ratesAll[0];
        return res.status(200).json({
            success: true,
            message: "Rates fetched successfully",
            data: rates,
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.getRates = getRates;
/**
 * Get payer's assigned trade.
 */
const getPayerTrade = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const tradeRepository = database_1.default.getRepository(trades_1.Trade);
        const assignedTrade = yield tradeRepository.findOne({
            where: {
                assignedPayerId: id,
                status: trades_1.TradeStatus.ASSIGNED,
            },
            relations: {
                assignedPayer: true,
            },
            order: {
                assignedAt: "DESC",
            },
        });
        if (!assignedTrade) {
            return res.status(404).json({
                success: false,
                message: "No active trade found for this payer",
            });
        }
        if (!assignedTrade.assignedPayer) {
            const reloadedTrade = yield tradeRepository.findOne({
                where: { id: assignedTrade.id },
                relations: ["assignedPayer"],
                select: [
                    "id",
                    "tradeHash",
                    "platform",
                    "status",
                    "tradeStatus",
                    "amount",
                    "cryptoAmountRequested",
                    "cryptoAmountTotal",
                    "feeCryptoAmount",
                    "feePercentage",
                    "sourceId",
                    "responderUsername",
                    "ownerUsername",
                    "paymentMethod",
                    "locationIso",
                    "fiatCurrency",
                    "cryptoCurrencyCode",
                    "isActiveOffer",
                    "offerHash",
                    "margin",
                    "btcRate",
                    "dollarRate",
                    "btcAmount",
                    "assignedAt",
                    "completedAt",
                    "notes",
                    "platformMetadata",
                    "activityLog",
                ],
            });
            if (!(reloadedTrade === null || reloadedTrade === void 0 ? void 0 : reloadedTrade.assignedPayer)) {
                console.error(`Failed to load assignedPayer relation for trade ${assignedTrade.id}`);
                return next(new errorHandler_1.default("Error loading trade details: Missing assigned payer information", 500));
            }
            return res.status(200).json({
                success: true,
                data: Object.assign(Object.assign({}, reloadedTrade), { platformMetadata: Object.assign(Object.assign({}, reloadedTrade.platformMetadata), { sensitiveData: undefined }) }),
            });
        }
        const sanitizedTrade = Object.assign(Object.assign({}, assignedTrade), { platformMetadata: Object.assign(Object.assign({}, assignedTrade.platformMetadata), { sensitiveData: undefined }) });
        return res.status(200).json({
            success: true,
            data: sanitizedTrade,
        });
    }
    catch (error) {
        console.error("Error in getPayerTrade:", error);
        return next(new errorHandler_1.default("Error retrieving trade details", 500));
    }
});
exports.getPayerTrade = getPayerTrade;
/**
 * Mark a trade as paid and send a chat message (message provided by user) to notify the vendor.
 */
const markTradeAsPaid = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { tradeId } = req.params;
        const { message } = req.body;
        if (!tradeId || !message) {
            return next(new errorHandler_1.default("Trade ID and message are required", 400));
        }
        const tradeRepository = database_1.default.getRepository(trades_1.Trade);
        const trade = yield tradeRepository.findOne({ where: { id: tradeId } });
        if (!trade) {
            return next(new errorHandler_1.default("Trade not found", 404));
        }
        // If the platform is Binance, which does not support these actions, return an error.
        if (trade.platform === "binance") {
            return next(new errorHandler_1.default("Binance does not support marking trades as paid", 400));
        }
        const services = yield initializePlatformServices();
        const platformService = (_a = services[trade.platform]) === null || _a === void 0 ? void 0 : _a.find((s) => s.accountId === trade.accountId);
        if (!platformService) {
            return next(new errorHandler_1.default("Platform service not found", 404));
        }
        // Call the platform-specific methods.
        yield platformService.markTradeAsPaid(trade.tradeHash);
        yield platformService.sendTradeMessage(trade.tradeHash, message);
        return res.status(200).json({
            success: true,
            message: "Trade marked as paid and vendor notified successfully",
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.markTradeAsPaid = markTradeAsPaid;
/**
 * Get dashboard stats.
 */
const getDashboardStats = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tradeRepository = database_1.default.getRepository(trades_1.Trade);
        const escalatedTradeRepository = database_1.default.getRepository(escalatedTrades_1.EscalatedTrade);
        const currentlyAssigned = yield tradeRepository.count({
            where: { status: trades_1.TradeStatus.ASSIGNED },
        });
        const notYetAssigned = yield tradeRepository.count({
            where: { status: trades_1.TradeStatus.PENDING },
        });
        const escalated = yield escalatedTradeRepository.count({});
        const paidButNotMarked = yield tradeRepository.count({
            where: { status: trades_1.TradeStatus.COMPLETED, completedAt: undefined },
        });
        const totalTradesNGN = yield tradeRepository
            .createQueryBuilder("trade")
            .select("SUM(trade.amount)", "totalNGN")
            .where("trade.status = :status", { status: trades_1.TradeStatus.COMPLETED })
            .getRawOne();
        const totalTradesBTC = yield tradeRepository
            .createQueryBuilder("trade")
            .select("SUM(trade.cryptoAmountTotal)", "totalBTC")
            .where("trade.status = :status", { status: trades_1.TradeStatus.COMPLETED })
            .getRawOne();
        const averageResponseTime = yield tradeRepository
            .createQueryBuilder("trade")
            .select("AVG(EXTRACT(EPOCH FROM (trade.completedAt - trade.assignedAt)))", "averageResponseTime")
            .where("trade.status = :status", { status: trades_1.TradeStatus.COMPLETED })
            .andWhere("trade.completedAt IS NOT NULL")
            .andWhere("trade.assignedAt IS NOT NULL")
            .getRawOne();
        const stats = {
            currentlyAssigned,
            notYetAssigned,
            escalated,
            paidButNotMarked,
            totalTradesNGN: totalTradesNGN.totalNGN || 0,
            totalTradesBTC: totalTradesBTC.totalBTC || 0,
            averageResponseTime: averageResponseTime.averageResponseTime || 0,
        };
        return res.status(200).json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.getDashboardStats = getDashboardStats;
/**
 * Get completed paid trades with pagination.
 */
const getCompletedPaidTrades = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tradeRepository = database_1.default.getRepository(trades_1.Trade);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const query = tradeRepository
            .createQueryBuilder("trade")
            .where({
            status: trades_1.TradeStatus.COMPLETED,
            tradeStatus: "Paid",
        })
            .leftJoinAndSelect("trade.assignedPayer", "assignedPayer")
            .orderBy("trade.completedAt", "DESC")
            .skip(skip)
            .take(limit);
        const [trades, total] = yield query.getManyAndCount();
        const totalPages = Math.ceil(total / limit);
        return res.status(200).json({
            success: true,
            data: {
                trades,
                pagination: {
                    total,
                    totalPages,
                    currentPage: page,
                    itemsPerPage: limit,
                },
            },
        });
    }
    catch (error) {
        return next(new errorHandler_1.default(`Error retrieving completed trades: ${error.message}`, 500));
    }
});
exports.getCompletedPaidTrades = getCompletedPaidTrades;
const updateOffersMargin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { paxfulMargin, noonesMargin } = req.body;
        if (typeof paxfulMargin !== "number" || typeof noonesMargin !== "number") {
            return next(new errorHandler_1.default("Margin values must be valid numbers", 400));
        }
        const services = yield initializePlatformServices();
        // Fetch all offers from both platforms
        const noonesOffers = yield fetchAllOffers(services.noones);
        const paxfulOffers = yield fetchAllOffers(services.paxful);
        const allOffers = [...noonesOffers, ...paxfulOffers];
        console.log("Fetched offers:", allOffers);
        // Filter offers to process only BTC/USD offers
        const btcUsdOffers = allOffers.filter((offer) => {
            return offer.crypto_currency_code === "BTC";
        });
        if (btcUsdOffers.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No BTC/USD offers found to update",
                data: [],
            });
        }
        // Process each offer: Copy details & Create USDT Offer
        const updateResults = yield Promise.all(btcUsdOffers.map((offer) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                let margin;
                let serviceInstance;
                if (offer.platform === "noones") {
                    margin = noonesMargin;
                    serviceInstance = services.noones.find((s) => s.accountId === offer.accountId);
                }
                else if (offer.platform === "paxful") {
                    margin = paxfulMargin;
                    serviceInstance = services.paxful.find((s) => s.accountId === offer.accountId);
                }
                else {
                    throw new Error("Unsupported platform");
                }
                if (!serviceInstance) {
                    throw new Error(`${offer.platform} account service not found`);
                }
                // Create a new USDT offer based on the copied details
                const newOffer = yield serviceInstance.createOffer({
                    margin: margin,
                    currency: offer.fiat_currency_code,
                    offer_cap: {
                        range_max: offer.max_amount,
                        range_min: offer.min_amount,
                    },
                    offer_terms: offer.offer_terms,
                    payment_method: offer.payment_method,
                    payment_window: offer.payment_window,
                    payment_country: offer.payment_country,
                    offer_type_field: offer.offer_type, // "buy" or "sell"
                    crypto_currency: "usdt", // Set to USDT
                    is_fixed_price: offer.is_fixed_price || false,
                    predefined_amount: offer.predefined_amount || undefined,
                });
                return {
                    id: offer.id,
                    platform: offer.platform,
                    success: true,
                };
            }
            catch (error) {
                return {
                    id: offer.id,
                    platform: offer.platform,
                    success: false,
                    error: error.message,
                };
            }
        })));
        return res.status(200).json({
            success: true,
            message: "Margin update and USDT offer creation completed",
            data: updateResults,
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.updateOffersMargin = updateOffersMargin;
/**
 * Fetch all active offers from a list of services.
 */
function fetchAllOffers(services) {
    return __awaiter(this, void 0, void 0, function* () {
        const allOffers = [];
        for (const service of services) {
            try {
                let offers = [];
                if (service instanceof noones_1.NoonesService) {
                    offers = yield service.listActiveOffers();
                    offers = offers.map((offer) => (Object.assign(Object.assign({}, offer), { platform: "noones", accountId: service.accountId })));
                }
                else if (service instanceof paxful_1.PaxfulService) {
                    offers = yield service.listOffers({ status: "active" });
                    offers = offers.map((offer) => (Object.assign(Object.assign({}, offer), { platform: "paxful", accountId: service.accountId })));
                }
                allOffers.push(...offers);
            }
            catch (error) {
                console.error(`Error fetching offers for service ${service.label}:`, error);
            }
        }
        return allOffers;
    });
}
const turnOffAllOffers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const services = yield initializePlatformServices();
        let count = 0;
        for (const service of [...services.paxful, ...services.noones]) {
            yield service.turnOffAllOffers();
        }
        return res.status(200).json({
            success: true,
            message: `Turned off  offers on all platforms`,
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.turnOffAllOffers = turnOffAllOffers;
const turnOnAllOffers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const services = yield initializePlatformServices();
        let count = 0;
        for (const service of [...services.noones, ...services.paxful]) {
            yield service.turnOnAllOffers();
        }
        return res.status(200).json({
            success: true,
            message: `Turned on offers on all platforms`,
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.turnOnAllOffers = turnOnAllOffers;
// Controller for  re assigning a trade
const reassignTrade = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tradeId } = req.params;
        const { userId } = req.body;
        if (!tradeId || !userId) {
            return next(new errorHandler_1.default("Trade ID and User ID are required", 400));
        }
        const tradeRepository = database_1.default.getRepository(trades_1.Trade);
        const trade = yield tradeRepository.findOne({ where: { id: tradeId }, relations: ["assignedPayer"] });
        if (!trade) {
            return next(new errorHandler_1.default("Trade not found", 404));
        }
        if (trade.status === trades_1.TradeStatus.COMPLETED || trade.status === trades_1.TradeStatus.CANCELLED) {
            return next(new errorHandler_1.default("This trade cannot be reassigned", 400));
        }
        const userRepository = database_1.default.getRepository(user_1.User);
        const user = yield userRepository.findOne({ where: { id: userId } });
        if (!user || user.userType !== user_1.UserType.PAYER) {
            return next(new errorHandler_1.default("Invalid user. Only payers can be assigned the trade", 400));
        }
        if (trade.assignedPayerId === userId) {
            return next(new errorHandler_1.default("The trade is already assigned to this user", 400));
        }
        trade.assignedPayerId = userId;
        trade.assignedAt = new Date();
        trade.status = trades_1.TradeStatus.ASSIGNED;
        yield tradeRepository.save(trade);
        return res.status(200).json({ success: true, message: "Trade reassigned successfully", data: trade });
    }
    catch (error) {
        return next(error);
    }
});
exports.reassignTrade = reassignTrade;
const getAllTrades = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tradeRepository = database_1.default.getRepository(trades_1.Trade);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const [trades, total] = yield tradeRepository.findAndCount({
            skip,
            take: limit,
            order: { createdAt: "DESC" },
        });
        const totalPages = Math.ceil(total / limit);
        return res.status(200).json({
            success: true,
            data: { trades, pagination: { total, totalPages, currentPage: page, itemsPerPage: limit } },
        });
    }
    catch (error) {
        return next(new errorHandler_1.default(`Error retrieving trades: ${error.message}`, 500));
    }
});
exports.getAllTrades = getAllTrades;
const getUnfinishedTrades = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tradeRepository = database_1.default.getRepository(trades_1.Trade);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Example: return trades that are not completed or not marked as "Paid"
        const [trades, total] = yield tradeRepository.findAndCount({
            where: { status: (0, typeorm_1.Not)(trades_1.TradeStatus.COMPLETED) },
            skip,
            take: limit,
            order: { createdAt: "DESC" },
        });
        const totalPages = Math.ceil(total / limit);
        return res.status(200).json({
            success: true,
            data: { trades, pagination: { total, totalPages, currentPage: page, itemsPerPage: limit } },
        });
    }
    catch (error) {
        return next(new errorHandler_1.default(`Error retrieving unfinished trades: ${error.message}`, 500));
    }
});
exports.getUnfinishedTrades = getUnfinishedTrades;
