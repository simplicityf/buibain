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
exports.assignTradesToPayers = exports.createActivityLog = void 0;
const trades_1 = require("../models/trades");
const user_1 = require("../models/user");
const database_1 = __importDefault(require("../config/database"));
const notificationController_1 = require("../controllers/notificationController");
const notifications_1 = require("../models/notifications");
const messageTemplates_1 = require("../models/messageTemplates");
const activityLogs_1 = require("../models/activityLogs");
const createActivityLog = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, activity, description, details, isSystemGenerated = false, }) {
    const activityLogRepository = database_1.default.getRepository(activityLogs_1.ActivityLog);
    const userRepository = database_1.default.getRepository(user_1.User);
    let user;
    if (userId) {
        user = yield userRepository.findOne({ where: { id: userId } });
        if (!user)
            throw new Error("User not found");
    }
    const activityLog = activityLogRepository.create({
        user,
        userRole: user === null || user === void 0 ? void 0 : user.userType,
        activity,
        description,
        details,
        isSystemGenerated,
    });
    yield activityLogRepository.save(activityLog);
    return activityLog;
});
exports.createActivityLog = createActivityLog;
const assignTradesToPayers = () => __awaiter(void 0, void 0, void 0, function* () {
    const queryRunner = database_1.default.createQueryRunner();
    yield queryRunner.connect();
    yield queryRunner.startTransaction();
    try {
        const tradeRepository = queryRunner.manager.getRepository(trades_1.Trade);
        const userRepository = queryRunner.manager.getRepository(user_1.User);
        // Get pending trades with proper stale time handling
        const staleTime = new Date(Date.now() - 5 * 60 * 1000);
        const pendingTrades = yield tradeRepository.find({
            where: {
                status: trades_1.TradeStatus.PENDING,
            },
            order: { createdAt: "ASC" },
        });
        if (!pendingTrades.length) {
            console.log("No pending trades found");
            yield queryRunner.commitTransaction();
            return;
        }
        // Get available payers with proper type handling
        const availablePayers = yield userRepository
            .createQueryBuilder("user")
            .select([
            "user.id AS user_id",
            "user.email AS user_email",
            "user.fullName AS user_fullname",
            "user.status AS user_status",
            "user.userType AS user_userType",
            "user.createdAt AS user_createdAt",
            "MAX(trade.assignedAt) AS last_assigned_at",
        ])
            .leftJoin(trades_1.Trade, "trade", "trade.assignedPayerId = user.id AND trade.status = :assignedStatus", { assignedStatus: trades_1.TradeStatus.ASSIGNED })
            .where("user.userType = :payerType", { payerType: user_1.UserType.PAYER })
            .andWhere("user.status = :activeStatus", { activeStatus: "active" })
            .groupBy("user.id")
            .addOrderBy("user.createdAt", "ASC")
            .getRawMany();
        if (!availablePayers.length) {
            console.log("No available payers found");
            yield queryRunner.commitTransaction();
            return;
        }
        console.log(`Found ${pendingTrades.length} trades and ${availablePayers.length} payers`);
        const assignedPayerIds = new Set();
        for (const trade of pendingTrades) {
            let selectedPayer = null;
            for (const payer of availablePayers) {
                if (assignedPayerIds.has(payer.user_id))
                    continue;
                // Check for active assignments using repository methods
                const activeTrade = yield tradeRepository.findOne({
                    where: {
                        assignedPayerId: payer.user_id,
                        // status: TradeStatus.ASSIGNED,
                    },
                });
                console.log(activeTrade, payer);
                if (!activeTrade) {
                    selectedPayer = payer;
                    assignedPayerIds.add(payer.user_id);
                    break;
                }
            }
            if (!selectedPayer) {
                console.log("No available payers without assigned trades");
                break;
            }
            try {
                // Final consistency check
                const existingAssignment = yield tradeRepository.findOne({
                    where: {
                        assignedPayerId: selectedPayer.user_id,
                        status: trades_1.TradeStatus.ASSIGNED,
                    },
                });
                if (existingAssignment) {
                    console.log(`Payer ${selectedPayer.user_id} already has assignment`);
                    assignedPayerIds.delete(selectedPayer.user_id);
                    continue;
                }
                // Update trade with proper transaction handling
                yield tradeRepository.update(trade.id, {
                    assignedPayerId: selectedPayer.user_id,
                    assignedAt: new Date(),
                    status: trades_1.TradeStatus.ASSIGNED,
                });
                // Create notification with proper user reference
                yield (0, notificationController_1.createNotification)({
                    userId: selectedPayer.user_id,
                    title: "New Trade Assigned",
                    description: `Assigned trade ${trade.id} (${trade.amount} ${trade.fiatCurrency})`,
                    priority: notifications_1.PriorityLevel.HIGH,
                });
                // Activity log with proper typing
                yield (0, exports.createActivityLog)({
                    userId: selectedPayer.user_id,
                    activity: activityLogs_1.ActivityType.TRADE_ASSIGNED,
                    description: `Assigned trade ${trade.id} to ${selectedPayer.user_fullname}`,
                    details: {
                        tradeId: trade.id,
                        amount: trade.amount,
                        currency: trade.fiatCurrency,
                    },
                    isSystemGenerated: true,
                });
                // Handle platform messages with proper type checking
                const platform = trade.platform === trades_1.TradePlatform.NOONES
                    ? messageTemplates_1.Platform.NOONES
                    : messageTemplates_1.Platform.PAXFUL;
                const template = yield database_1.default.getRepository(messageTemplates_1.AutoMessageTemplate).findOne({
                    where: { type: messageTemplates_1.TemplateType.WELCOME, platform, isActive: true },
                    order: { displayOrder: "ASC" },
                });
                // if (template) {
                //   const message = template.content
                //     .replace("{tradeId}", trade.id)
                //     .replace("{payerName}", selectedPayer.user_fullname)
                //     .replace("{amount}", trade.amount.toString())
                //     .replace("{currency}", trade.fiatCurrency);
                //   if (trade.platform === TradePlatform.NOONES) {
                //     await new NoonesService({
                //       apiKey: process.env.NOONES_API_KEY!,
                //       apiSecret: process.env.NOONES_API_SECRET!,
                //     }).sendTradeMessage(trade.tradeHash, message);
                //   } else if (trade.platform === TradePlatform.PAXFUL) {
                //     await paxfulService.sendTradeMessage(trade.tradeHash, message);
                //   }
                // }
                console.log(`Assigned trade ${trade.id} to ${selectedPayer.user_fullname}`);
            }
            catch (error) {
                console.error(`Error assigning trade ${trade.id}:`, error);
                assignedPayerIds.delete(selectedPayer.user_id);
                yield queryRunner.rollbackTransaction();
                throw error;
            }
        }
        yield queryRunner.commitTransaction();
    }
    catch (error) {
        console.error("Trade assignment failed:", error);
        yield queryRunner.rollbackTransaction();
        throw error;
    }
    finally {
        yield queryRunner.release();
    }
});
exports.assignTradesToPayers = assignTradesToPayers;
