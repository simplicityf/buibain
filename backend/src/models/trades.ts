import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Unique,
  Index,
} from "typeorm";
import { User } from "./user";

export enum TradePlatform {
  PAXFUL = "paxful",
  NOONES = "noones",
  BINANCE = "binance",
}

export enum TradeStatus {
  PENDING = "pending",
  ASSIGNED = "assigned",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  DISPUTED = "disputed",
}

@Entity("trades")
@Unique("UQ_TRADE_HASH", ["tradeHash"])
@Index("IDX_ACCOUNT_PLATFORM", ["accountId", "platform"])
export class Trade {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  @Index({ unique: true })
  tradeHash!: string;

  @Column({
    type: "varchar",
    length: 100,
    nullable: false,
    comment: "External account identifier for the trade",
  })
  @Index()
  accountId!: string;

  @Column({ type: "enum", enum: TradePlatform, nullable: false })
  platform!: TradePlatform;

  @Column({ type: "enum", enum: TradeStatus, default: TradeStatus.PENDING })
  status!: TradeStatus;

  @Column({ type: "varchar", nullable: false })
  tradeStatus!: string;

  @Column({
    type: "numeric",
    precision: 20,
    scale: 2,
    nullable: false,
    transformer: {
      to: (value: number) => value?.toString(),
      from: (value: string) => parseFloat(value),
    },
  })
  amount!: number;

  @Column({
    type: "numeric",
    precision: 20,
    scale: 8,
    nullable: false,
    transformer: {
      to: (value: number) => value?.toString(),
      from: (value: string) => parseFloat(value),
    },
  })
  cryptoAmountRequested!: number;

  @Column({
    type: "numeric",
    precision: 20,
    scale: 8,
    nullable: false,
    transformer: {
      to: (value: number) => value?.toString(),
      from: (value: string) => parseFloat(value),
    },
  })
  cryptoAmountTotal!: number;

  @Column({
    type: "numeric",
    precision: 20,
    scale: 8,
    nullable: false,
    transformer: {
      to: (value: number) => value?.toString(),
      from: (value: string) => parseFloat(value),
    },
  })
  feeCryptoAmount!: number;

  @Column({ type: "boolean", default: false })
  flagged!: boolean;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: false,
    transformer: {
      to: (value: number) => value?.toString(),
      from: (value: string) => parseFloat(value),
    },
  })
  feePercentage!: number;

  @Column({ type: "varchar", length: 100, nullable: false })
  sourceId!: string;

  @Column({ type: "varchar", length: 100, nullable: false })
  responderUsername!: string;

  @Column({ type: "varchar", length: 100, nullable: false })
  ownerUsername!: string;

  @Column({ type: "varchar", length: 100, nullable: false })
  paymentMethod!: string;

  @Column({ type: "varchar", length: 2, nullable: true })
  locationIso?: string;

  @Column({ type: "varchar", length: 3, nullable: false })
  fiatCurrency!: string;

  @Column({ type: "varchar", length: 10, nullable: false })
  cryptoCurrencyCode!: string;

  @Column({ type: "boolean", default: false })
  isActiveOffer!: boolean;

  @Column({ type: "varchar", length: 100, nullable: true })
  offerHash?: string;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | undefined) => value?.toString(),
      from: (value: string | null) => (value ? parseFloat(value) : undefined),
    },
  })
  margin?: number;

  @Column({
    type: "numeric",
    precision: 20,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | undefined) => value?.toString(),
      from: (value: string | null) => (value ? parseFloat(value) : undefined),
    },
  })
  dollarRate?: number;

  @Column({
    type: "numeric",
    precision: 20,
    scale: 8,
    nullable: true,
    transformer: {
      to: (value: number | undefined) => value?.toString(),
      from: (value: string | null) => (value ? parseFloat(value) : undefined),
    },
  })
  btcRate?: number;

  @Column({
    type: "numeric",
    precision: 20,
    scale: 8,
    nullable: true,
    transformer: {
      to: (value: number | undefined) => value?.toString(),
      from: (value: string | null) => (value ? parseFloat(value) : undefined),
    },
  })
  btcAmount?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "assigned_payer_id" })
  assignedPayer?: User;

  @Column({ name: "assigned_payer_id", type: "uuid", nullable: true })
  assignedPayerId?: string;

  @Column({ type: "timestamp", nullable: true })
  assignedAt?: Date;

  @Column({ type: "timestamp", nullable: true })
  completedAt?: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  notes?: string;

  @Column({ type: "jsonb", nullable: true })
  platformMetadata?: Record<string, any>;

  @Column({ type: "jsonb", nullable: true })
  activityLog?: Array<{
    action: string;
    performedBy: string;
    performedAt: Date;
    details?: Record<string, any>;
  }>;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
