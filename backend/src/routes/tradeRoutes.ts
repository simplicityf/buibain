import express from "express";
import {
  getCurrencyRates,
  getRates,
  getTradeDetails,
  getWalletBalances,
  sendTradeChatMessage,
  setOrUpdateRates,
  getPayerTrade,
  markTradeAsPaid,
  getDashboardStats,
  getCompletedPaidTrades,
  updateOffers,
  turnOffAllOffers,
  turnOnAllOffers,
  reassignTrade,
  getLiveTrades,
  assignLiveTrades,
  getAllTrades,
  getUnfinishedTrades,
  getOffersMargin
} from "../controllers/tradeController";
import { authenticate, roleAuth } from "../middlewares/authenticate";
import { User, UserType } from "../models/user";

const router: any = express.Router();

router.use(authenticate);

// Currency and Rates Endpoints:
router.get("/currency/rates", getCurrencyRates);

router.post(
  "/set-rates",
  roleAuth([UserType.ADMIN, UserType.RATER]),
  setOrUpdateRates
);

router.get(
  "/get-rates",
  roleAuth([UserType.ADMIN, UserType.RATER, UserType.PAYER]),
  getRates
);

// Trade Endpoints:
router.get("/live-trades", getLiveTrades);

router.post("/assign-live-trade", assignLiveTrades);

router.get("/payer/trade/info/:platform/:tradeHash/:accountId", getTradeDetails);

router.post("/mark-paid", markTradeAsPaid);

router.post("/message", sendTradeChatMessage);

router.get("/all-trades", getAllTrades);

router.get("/unfinished-trades", getUnfinishedTrades);

// Payer and Dashboard Endpoints:
router.get("/dashboard", roleAuth([UserType.ADMIN]), getDashboardStats);

router.get("/payer/assignedTrade/:id", getPayerTrade);

router.get(
  "/completed",
  roleAuth([UserType.ADMIN, UserType.CC]),
  getCompletedPaidTrades
);

// Wallet and Offers Endpoints

router.get(
  "/wallet-balances",
  // roleAuth([UserType.ADMIN, UserType.RATER]),
  getWalletBalances
);

router.get(
  "/offers",
  roleAuth([UserType.ADMIN, UserType.RATER]),
  getOffersMargin
);

router.post(
  "/offers/update",
  roleAuth([UserType.ADMIN, UserType.RATER]),
  updateOffers
);

router.get(
  "/offers/turn-off",
  roleAuth([UserType.ADMIN, UserType.RATER]),
  turnOffAllOffers
);

router.get(
  "/offers/turn-on",
  roleAuth([UserType.ADMIN, UserType.RATER]),
  turnOnAllOffers
);

router.post(
  "/reassign-trade",
  roleAuth([UserType.ADMIN, UserType.CC]),
  reassignTrade
);

export default router;
