import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Unique,
  Index,
  OneToOne,
} from "typeorm";
import { User } from "./user";
import { Chat } from "./chats";
import { Trade } from "./trades";

export enum TradeStatus {
  PENDING = "pending",
  RESOLVED = "resolved",
  ASSIGNED = "assigned",
}

export enum Platform {
  PAXFUL = "paxful",
  NOONES = "noones",
  BINANCE = "binance",
}

@Entity("escalated_trades")
export class EscalatedTrade {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @OneToOne(() => Trade, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "trade_id" })
  trade!: Trade;

  @ManyToOne(() => User, (user) => user.id, {
    nullable: true,
    onDelete: "SET NULL",
  })
  assignedCcAgent!: User | null;

  @ManyToOne(() => Chat, (chat) => chat.id, { nullable: true })
  chat!: Chat;

  @Column({
    type: "enum",
    enum: TradeStatus,
    default: TradeStatus.PENDING,
  })
  status!: TradeStatus;

  @Column({
    type: "enum",
    enum: Platform,
    nullable: false,
  })
  platform!: Platform;

  @ManyToOne(() => User, (user) => user.id, {
    nullable: true,
    onDelete: "SET NULL",
  })
  assignedPayer!: User | null;

  @ManyToOne(() => User, (user) => user.id, {
    nullable: true,
    onDelete: "SET NULL",
  })
  escalatedBy!: User | null;

  @Column({ type: "text", nullable: true })
  complaint!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
  amount!: number;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
