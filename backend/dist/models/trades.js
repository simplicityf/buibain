"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trade = exports.TradeStatus = exports.TradePlatform = void 0;
const typeorm_1 = require("typeorm");
const user_1 = require("./user");
var TradePlatform;
(function (TradePlatform) {
    TradePlatform["PAXFUL"] = "paxful";
    TradePlatform["NOONES"] = "noones";
    TradePlatform["BINANCE"] = "binance";
})(TradePlatform || (exports.TradePlatform = TradePlatform = {}));
var TradeStatus;
(function (TradeStatus) {
    TradeStatus["PENDING"] = "pending";
    TradeStatus["ASSIGNED"] = "assigned";
    TradeStatus["COMPLETED"] = "completed";
    TradeStatus["CANCELLED"] = "cancelled";
    TradeStatus["DISPUTED"] = "disputed";
})(TradeStatus || (exports.TradeStatus = TradeStatus = {}));
let Trade = class Trade {
};
exports.Trade = Trade;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Trade.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100 }),
    (0, typeorm_1.Index)({ unique: true }),
    __metadata("design:type", String)
], Trade.prototype, "tradeHash", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "varchar",
        length: 100,
        nullable: false,
        comment: "External account identifier for the trade",
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Trade.prototype, "accountId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: TradePlatform, nullable: false }),
    __metadata("design:type", String)
], Trade.prototype, "platform", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: TradeStatus, default: TradeStatus.PENDING }),
    __metadata("design:type", String)
], Trade.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: false }),
    __metadata("design:type", String)
], Trade.prototype, "tradeStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "numeric",
        precision: 20,
        scale: 2,
        nullable: false,
        transformer: {
            to: (value) => value === null || value === void 0 ? void 0 : value.toString(),
            from: (value) => parseFloat(value),
        },
    }),
    __metadata("design:type", Number)
], Trade.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "numeric",
        precision: 20,
        scale: 8,
        nullable: false,
        transformer: {
            to: (value) => value === null || value === void 0 ? void 0 : value.toString(),
            from: (value) => parseFloat(value),
        },
    }),
    __metadata("design:type", Number)
], Trade.prototype, "cryptoAmountRequested", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "numeric",
        precision: 20,
        scale: 8,
        nullable: false,
        transformer: {
            to: (value) => value === null || value === void 0 ? void 0 : value.toString(),
            from: (value) => parseFloat(value),
        },
    }),
    __metadata("design:type", Number)
], Trade.prototype, "cryptoAmountTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "numeric",
        precision: 20,
        scale: 8,
        nullable: false,
        transformer: {
            to: (value) => value === null || value === void 0 ? void 0 : value.toString(),
            from: (value) => parseFloat(value),
        },
    }),
    __metadata("design:type", Number)
], Trade.prototype, "feeCryptoAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], Trade.prototype, "flagged", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "numeric",
        precision: 10,
        scale: 2,
        nullable: false,
        transformer: {
            to: (value) => value === null || value === void 0 ? void 0 : value.toString(),
            from: (value) => parseFloat(value),
        },
    }),
    __metadata("design:type", Number)
], Trade.prototype, "feePercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: false }),
    __metadata("design:type", String)
], Trade.prototype, "sourceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: false }),
    __metadata("design:type", String)
], Trade.prototype, "responderUsername", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: false }),
    __metadata("design:type", String)
], Trade.prototype, "ownerUsername", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: false }),
    __metadata("design:type", String)
], Trade.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 2, nullable: true }),
    __metadata("design:type", String)
], Trade.prototype, "locationIso", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 3, nullable: false }),
    __metadata("design:type", String)
], Trade.prototype, "fiatCurrency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10, nullable: false }),
    __metadata("design:type", String)
], Trade.prototype, "cryptoCurrencyCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], Trade.prototype, "isActiveOffer", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", String)
], Trade.prototype, "offerHash", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "numeric",
        precision: 10,
        scale: 2,
        nullable: true,
        transformer: {
            to: (value) => value === null || value === void 0 ? void 0 : value.toString(),
            from: (value) => (value ? parseFloat(value) : undefined),
        },
    }),
    __metadata("design:type", Number)
], Trade.prototype, "margin", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "numeric",
        precision: 20,
        scale: 2,
        nullable: true,
        transformer: {
            to: (value) => value === null || value === void 0 ? void 0 : value.toString(),
            from: (value) => (value ? parseFloat(value) : undefined),
        },
    }),
    __metadata("design:type", Number)
], Trade.prototype, "dollarRate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "numeric",
        precision: 20,
        scale: 8,
        nullable: true,
        transformer: {
            to: (value) => value === null || value === void 0 ? void 0 : value.toString(),
            from: (value) => (value ? parseFloat(value) : undefined),
        },
    }),
    __metadata("design:type", Number)
], Trade.prototype, "btcRate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "numeric",
        precision: 20,
        scale: 8,
        nullable: true,
        transformer: {
            to: (value) => value === null || value === void 0 ? void 0 : value.toString(),
            from: (value) => (value ? parseFloat(value) : undefined),
        },
    }),
    __metadata("design:type", Number)
], Trade.prototype, "btcAmount", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "assigned_payer_id" }),
    __metadata("design:type", user_1.User)
], Trade.prototype, "assignedPayer", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "assigned_payer_id", type: "uuid", nullable: true }),
    __metadata("design:type", String)
], Trade.prototype, "assignedPayerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], Trade.prototype, "assignedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], Trade.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], Trade.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], Trade.prototype, "platformMetadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Array)
], Trade.prototype, "activityLog", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamp" }),
    __metadata("design:type", Date)
], Trade.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: "timestamp" }),
    __metadata("design:type", Date)
], Trade.prototype, "updatedAt", void 0);
exports.Trade = Trade = __decorate([
    (0, typeorm_1.Entity)("trades"),
    (0, typeorm_1.Unique)("UQ_TRADE_HASH", ["tradeHash"]),
    (0, typeorm_1.Index)("IDX_ACCOUNT_PLATFORM", ["accountId", "platform"])
], Trade);
