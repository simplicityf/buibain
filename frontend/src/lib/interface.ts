export interface ResInterface {
  message: string;
  data: any;
  success: boolean;
}

export enum UserType {
  ADMIN = "admin",
  PAYER = "payer",
  RATER = "rater",
  CEO = "ceo",
  CC = "customer-support",
}

export type UserStatus = "active" | "inactive" | "suspended";

export interface User {
  id: string;
  email: string;
  avatar: string;
  password?: string | null;
  userType: UserType;
  fullName: string;
  phone?: string;
  twoFaEnabled: boolean;
  twoFaSecret?: string;
  twoFaVerified: boolean;
  emailVerificationCode?: string | null;
  emailVerificationExp?: Date | null;
  phoneVerificationCode?: string;
  phoneVerificationExp?: Date;
  resetPasswordToken?: string | null;
  resetPasswordExp?: Date | null;
  status: UserStatus;
  createdAt: Date;
  clockedIn: boolean;
  updatedAt: Date;
}

export interface Chat {
  id: string;
  participants: User[];
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}

export interface Attachment {
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface Message {
  id: string;
  chat: Chat;
  sender: User;
  content: string;
  seen: boolean;
  createdAt: Date;
  updatedAt: Date;
  attachments: Attachment[];
}

export interface IBank {
  id: string;
  bankName: string;
  accountName: string;
  additionalNotes?: string;
  accountNumber: string;
  funds: number;
  logs?: {
    description: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export enum ActivityType {
  // Rate Related
  RATE_UPDATE = "rate_update",

  // User Authentication
  USER_LOGIN = "user_login",
  USER_LOGOUT = "user_logout",
  LOGIN_FAILED = "login_failed",
  TWO_FA_GENERATED = "two_fa_generated",
  TWO_FA_VERIFIED = "two_fa_verified",
  TWO_FA_FAILED = "two_fa_failed",

  USER_CREATE = "user_create",
  USER_UPDATE = "user_update",
  USER_DELETE = "user_delete",
  USER_PROFILE_UPDATE = "user_profile_update",
  USER_STATUS_CHANGE = "user_status_change",

  EMAIL_VERIFICATION = "email_verification",
  EMAIL_VERIFICATION_REQUEST = "email_verification_request",
  EMAIL_VERIFICATION_FAILED = "email_verification_failed",
  EMAIL_VERIFICATION_EXPIRED = "email_verification_expired",

  PASSWORD_RESET_REQUEST = "password_reset_request",
  PASSWORD_RESET = "password_reset",
  PASSWORD_RESET_FAILED = "password_reset_failed",
  PASSWORD_CHANGE = "password_change",
  PASSWORD_CHANGE_FAILED = "password_change_failed",

  SHIFT_CREATE = "shift_create",
  SHIFT_UPDATE = "shift_update",
  SHIFT_DELETE = "shift_delete",

  PHONE_VERIFICATION_REQUEST = "phone_verification_request",
  PHONE_VERIFICATION = "phone_verification",
  PHONE_VERIFICATION_FAILED = "phone_verification_failed",

  TWO_FA_ENABLED = "two_fa_enabled",
  TWO_FA_DISABLED = "two_fa_disabled",
  TWO_FA_STATUS_CHANGE = "two_fa_status_change",

  SYSTEM = "system",
  SYSTEM_ERROR = "system_error",
  SYSTEM_WARNING = "system_warning",
  SYSTEM_MAINTENANCE = "system_maintenance",

  SESSION_EXPIRED = "session_expired",
  SESSION_TERMINATED = "session_terminated",

  ROLE_ASSIGNED = "role_assigned",
  ROLE_REMOVED = "role_removed",
  ROLE_UPDATED = "role_updated",

  API_ACCESS_GRANTED = "api_access_granted",
  API_ACCESS_REVOKED = "api_access_revoked",
  API_KEY_GENERATED = "api_key_generated",

  DATA_EXPORT = "data_export",
  DATA_IMPORT = "data_import",

  ACCOUNT_LOCKED = "account_locked",
  ACCOUNT_UNLOCKED = "account_unlocked",
  ACCOUNT_SUSPENDED = "account_suspended",
  ACCOUNT_REACTIVATED = "account_reactivated",
}

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

// Activity Log Interface
export interface TradeActivityLogEntry {
  action: string;
  performedBy: string;
  performedAt: Date;
  details?: Record<string, any>;
}

// User Interface (minimal version, expand as needed)
export interface IUser {
  id: string;
  // Add other required user fields
}

// Main Trade Interface
export interface ITrade {
  id: string;
  tradeHash: string;
  platform: TradePlatform;
  status: TradeStatus;
  flagged: boolean;
  buyer_name: string;
  tradeStatus: string;
  ITrade: string;
  amount: number;
  accountId: string;
  cryptoAmountRequested: number;
  cryptoAmountTotal: number;
  feeCryptoAmount: number;
  feePercentage: number;
  sourceId: string;
  responderUsername: string;
  ownerUsername: string;
  paymentMethod: string;
  locationIso?: string;
  fiatCurrency: string;
  cryptoCurrencyCode: string;
  isActiveOffer: boolean;
  offerHash?: string;
  margin?: number;
  dollarRate?: number;
  btcRate?: number;
  btcAmount?: number;
  assignedPayer?: IUser;
  assignedAt?: Date;
  completedAt?: Date;
  notes?: string;
  platformMetadata?: Record<string, any>;
  activityLog?: TradeActivityLogEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITradeFilters {
  platform?: TradePlatform;
  status?: TradeStatus;
  startDate?: Date;
  endDate?: Date;
  paymentMethod?: string;
  fiatCurrency?: string;
  cryptoCurrencyCode?: string;
  assignedPayerId?: string;
  isActiveOffer?: boolean;
}

// Enum for notification type
export enum NotificationType {
  SYSTEM = "system",
  INDIVIDUAL = "individual",
}

// Enum for priority level
export enum PriorityLevel {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

// Interface for Notification entity
export interface INotification {
  id: string;
  user: User;
  title: string;
  description: string;
  type: "system" | "individual";
  relatedAccount?: User | null;
  read: boolean;
  priority: "high" | "medium" | "low";
  createdAt: Date;
  updatedAt: Date;
}

export enum ShiftStatus {
  ACTIVE = "active",
  ON_BREAK = "on_break",
  PENDING_APPROVAL = "pending_approval",
  APPROVED = "approved",
  REJECTED = "rejected",
  ENDED = "ended",
  FORCE_CLOSED = "force_closed",
}

// Enhanced Types
export interface VendorInfo {
  id: string;
  name: string;
  tradingVolume: number;
  status: "active" | "inactive";
  lastTrade?: string;
  successRate?: number;
}

export interface Trade {
  id: string;
  type: "buy" | "sell";
  amount: number;
  rate: number;
  status: "pending" | "completed" | "escalated";
  timestamp: string;
}

export interface WalletBalance {
  totalBalance: number;
  usdtBalance: number;
  excessCoins: number;
  capitalCoinLimit: number;
  lastExcessTime?: string;
  vendors?: VendorInfo[];
  averageRate?: number;
}

export interface Account {
  id: string;
  name: string;
  balances: WalletBalance;
  status: "active" | "error";
  trades?: {
    pending: number;
    completed: number;
    escalated: number;
    history: Trade[];
  };
  vendors?: VendorInfo[];
}
