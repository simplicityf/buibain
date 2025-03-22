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

// Route to escalate a trade (IDs from params instead of body)
router.post(
  "/escalate/:tradeId/:escalatedById/:assignedPayerId",
  [
    // Only complaint is required in the request body now.
    body("complaint")
      .isString()
      .notEmpty()
      .withMessage("Complaint is required."),
    param("tradeId").isUUID().withMessage("Invalid trade ID."),
    param("escalatedById")
      .isUUID()
      .withMessage("Invalid escalatedBy ID."),
    param("assignedPayerId")
      .isUUID()
      .withMessage("Invalid assignedPayer ID."),
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
