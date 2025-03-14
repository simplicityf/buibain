import { Router } from "express";
import { body, param, query } from "express-validator";
import validateRequest from "../middlewares/validateRequest";
import {
  escalateTrade,
  deleteTrade,
  getAllTrades,
  getTradeById,
  updateTrade,
} from "../controllers/escalatedTradesController";
import { TradeStatus } from "../models/escalatedTrades";
import { authenticate } from "../middlewares/authenticate";

const router: any = Router();

router.use(authenticate);

// Route to escalate a trade
router.post(
  "/escalate",
  [
    body("tradeId").notEmpty().withMessage("Trade ID is required."),
    body("platform").notEmpty().withMessage("Platform is required."),
    body("complaint")
      .isString()
      .notEmpty()
      .withMessage("Complaint is required."),
    body("amount").isNumeric().withMessage("Amount must be a number."),
    body("assignedPayerId").isUUID().withMessage("Invalid payer ID."),
    body("escalatedById").isUUID().withMessage("Invalid escalatedBy ID."),
  ],
  validateRequest,
  escalateTrade
);

// Route to delete a trade
router.delete(
  "/:id",
  [param("id").isUUID().withMessage("Invalid trade ID.")],
  validateRequest,
  deleteTrade
);

// Route to fetch all trades
router.get(
  "/all",
  [
    query("status")
      .optional()
      .isIn(Object.values(TradeStatus))
      .withMessage("Invalid status value."),
  ],
  validateRequest,
  getAllTrades
);

// Route to fetch a specific trade by ID
router.get(
  "/:id",
  [param("id").isUUID().withMessage("Invalid trade ID.")],
  validateRequest,
  getTradeById
);

// Route to update a trade
router.put(
  "/:id",
  [
    param("id").isUUID().withMessage("Invalid trade ID."),
    body().isObject().withMessage("Request body must be an object."),
  ],
  validateRequest,
  updateTrade
);

export default router;
