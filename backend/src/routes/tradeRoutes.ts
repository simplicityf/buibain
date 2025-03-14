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
  updateOffersMargin,
  turnOffAllOffers,
  turnOnAllOffers,
  reassignTrade,
} from "../controllers/tradeController";
import { authenticate, roleAuth } from "../middlewares/authenticate";
import { User, UserType } from "../models/user";

const router: any = express.Router();

router.use(authenticate);

router.get("/currency/rates", getCurrencyRates);

router.get("/payer/assignedTrade/:id", getPayerTrade);

router.post("/payer/trade/info", getTradeDetails);

router.post("/trade/mark-paid", markTradeAsPaid);

router.post("/message", sendTradeChatMessage);

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

router.get("/dashboard", roleAuth([UserType.ADMIN]), getDashboardStats);

router.get(
  "/completed",
  roleAuth([UserType.ADMIN, UserType.CC]),
  getCompletedPaidTrades
);

router.get(
  "/wallet-balances",
  // roleAuth([UserType.ADMIN, UserType.RATER]),
  getWalletBalances
);

router.put(
  "/offers/update",
  roleAuth([UserType.ADMIN, UserType.RATER]),
  updateOffersMargin
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
