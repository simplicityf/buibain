import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("rates")
export class Rates {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "numeric", precision: 50, scale: 8, nullable: false })
  sellingPrice!: string;

  @Column({ type: "numeric", precision: 50, scale: 8, nullable: false })
  costPricePaxful!: string;

  @Column({ type: "numeric", precision: 50, scale: 8, nullable: false })
  costPriceNoones!: string;

  @Column({ type: "numeric", precision: 50, scale: 8, nullable: false })
  usdtNgnRate!: string;

  @Column({ type: "numeric", precision: 50, scale: 8, nullable: false })
  markup2!: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
