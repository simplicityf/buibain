import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "../models/user";
import { Role } from "../models/roles";
import { RolePermission } from "../models/role_permissions";
import { Permission } from "../models/permissions";
import { Chat } from "../models/chats";
import { Message } from "../models/messages";
import { Bank } from "../models/bank";
import { EscalatedTrade } from "../models/escalatedTrades";
import { Shift } from "../models/shift";
import { ActivityLog } from "../models/activityLogs";
import { Trade } from "../models/trades";
import { Notification } from "../models/notifications";
import { AutoMessageTemplate } from "../models/messageTemplates";
import { Rates } from "../models/rates";
import { Account } from "../models/accounts";

dotenv.config();

const dbConnect = new DataSource({
  type: "postgres",
  host: "aws-0-eu-central-1.pooler.supabase.com",
  port: 5432,
  username: "postgres.bnnqdyndohfjjczvqtbx",
  password: "password",
  database: "postgres",
  synchronize: false,
  logging: true,
  entities: [
    User,
    Account,
    AutoMessageTemplate,
    Notification,
    Rates,
    ActivityLog,
    Role,
    Trade,
    EscalatedTrade,
    Shift,
    Bank,
    RolePermission,
    Permission,
    Chat,
    Message,
  ],
  // Uncomment if you want to use migrations
  migrations: ["src/migration/**/*.ts"],
});

// Initialize database connection
dbConnect.initialize()
  .then(() => console.log("Database connected successfully!"))
  .catch((error) => console.error("Database connection error:", error));

export default dbConnect;