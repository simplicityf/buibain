"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tradeController_1 = require("../controllers/tradeController");
const authenticate_1 = require("../middlewares/authenticate");
const user_1 = require("../models/user");
const router = express_1.default.Router();
router.use(authenticate_1.authenticate);
// Currency and Rates Endpoints:
router.get("/currency/rates", tradeController_1.getCurrencyRates);
router.post("/set-rates", (0, authenticate_1.roleAuth)([user_1.UserType.ADMIN, user_1.UserType.RATER]), tradeController_1.setOrUpdateRates);
router.get("/get-rates", (0, authenticate_1.roleAuth)([user_1.UserType.ADMIN, user_1.UserType.RATER, user_1.UserType.PAYER]), tradeController_1.getRates);
// Trade Endpoints:
router.get("/live-trades", tradeController_1.getLiveTrades);
router.post("/assign-live-trade", tradeController_1.assignLiveTrades);
router.post("/payer/trade/info", tradeController_1.getTradeDetails);
router.post("/mark-paid", tradeController_1.markTradeAsPaid);
router.post("/message", tradeController_1.sendTradeChatMessage);
router.get("/all-trades", tradeController_1.getAllTrades);
router.get("/unfinished-trades", tradeController_1.getUnfinishedTrades);
// Payer and Dashboard Endpoints:
router.get("/dashboard", (0, authenticate_1.roleAuth)([user_1.UserType.ADMIN]), tradeController_1.getDashboardStats);
router.get("/payer/assignedTrade/:id", tradeController_1.getPayerTrade);
router.get("/completed", (0, authenticate_1.roleAuth)([user_1.UserType.ADMIN, user_1.UserType.CC]), tradeController_1.getCompletedPaidTrades);
// Wallet and Offers Endpoints
router.get("/wallet-balances", 
// roleAuth([UserType.ADMIN, UserType.RATER]),
tradeController_1.getWalletBalances);
router.put("/offers/update", (0, authenticate_1.roleAuth)([user_1.UserType.ADMIN, user_1.UserType.RATER]), tradeController_1.updateOffersMargin);
router.get("/offers/turn-off", (0, authenticate_1.roleAuth)([user_1.UserType.ADMIN, user_1.UserType.RATER]), tradeController_1.turnOffAllOffers);
router.get("/offers/turn-on", (0, authenticate_1.roleAuth)([user_1.UserType.ADMIN, user_1.UserType.RATER]), tradeController_1.turnOnAllOffers);
router.post("/reassign-trade", (0, authenticate_1.roleAuth)([user_1.UserType.ADMIN, user_1.UserType.CC]), tradeController_1.reassignTrade);
exports.default = router;
