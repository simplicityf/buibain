import { Request, Response, NextFunction } from "express";
import { UserRequest } from "../middlewares/authenticate";
import dbConnect from "../config/database";
import { Trade, TradeStatus } from "../models/trades";
import { Rates } from "../models/rates";
import { Account, ForexPlatform } from "../models/accounts";
import { NoonesService } from "../config/noones";
import paxfulService, { PaxfulService } from "../config/paxful";
import { BinanceService } from "../config/binance";
import ErrorHandler from "../utils/errorHandler";
import { EscalatedTrade } from "../models/escalatedTrades";
import { User, UserType } from "../models/user";
import { Not } from "typeorm";

interface PlatformServices {
  noones: NoonesService[];
  paxful: PaxfulService[];
  binance: BinanceService[];
}

interface WalletBalance {
  currency: string;
  name: string;
  balance: number;
  type: string;
}

interface PlatformService {
  platform: string;
  label: string;
  accountId: string;
  getBalance(): Promise<any>;
}

/**
 * Initialize platform services with accounts from your database.
 */
async function initializePlatformServices(): Promise<PlatformServices> {
  const accountRepo = dbConnect.getRepository(Account);
  const accounts = await accountRepo.find();

  const services: PlatformServices = {
    noones: [],
    paxful: [],
    binance: [],
  };

  for (const account of accounts) {
    const decryptedKey = account.api_key;
    const decryptedSecret = account.api_secret;

    switch (account.platform) {
      case "noones":
        services.noones.push(
          new NoonesService({
            apiKey: decryptedKey,
            apiSecret: decryptedSecret,
            accountId: account.id,
            label: account.account_username,
          })
        );
        break;
      case "paxful":
        services.paxful.push(
          new PaxfulService({
            clientId: decryptedKey,
            clientSecret: decryptedSecret,
            accountId: account.id,
            label: account.account_username,
          })
        );
        break;
      case "binance":
        services.binance.push(
          new BinanceService({
            apiKey: decryptedKey,
            apiSecret: decryptedSecret,
            accountId: account.id,
            label: account.account_username,
          })
        );
        break;
    }
  }

  return services;
}

// Helper function: aggregateLiveTrades
const aggregateLiveTrades = async (): Promise<any[]> => {
  const services = await initializePlatformServices();
  let liveTrades: any[] = [];

  // Fetch trades from Paxful
  for (const service of services.paxful) {
    try {
      const paxfulTrades = await service.listActiveTrades();
      liveTrades = liveTrades.concat(
        paxfulTrades.map((trade: any) => ({
          ...trade,
          platform: "paxful",
          accountId: service.accountId,
        }))
      );
    } catch (error) {
      console.error(
        `Error fetching Paxful trades for account ${service.accountId}:`,
        error
      );
    }
  }

  // Fetch trades from Noones
  for (const service of services.noones) {
    try {
      const noonesTrades = await service.listActiveTrades();
      liveTrades = liveTrades.concat(
        noonesTrades.map((trade: any) => ({
          ...trade,
          platform: "noones",
          accountId: service.accountId,
        }))
      );
    } catch (error) {
      console.error(
        `Error fetching Noones trades for account ${service.accountId}:`,
        error
      );
    }
  }

  // Filter for trades that are unassigned (e.g. status "PENDING")
  return liveTrades.filter((trade) => trade.status === "PENDING");
};

/**
 * GET live trades (aggregated from Paxful and Noones)
 */
export const getLiveTrades = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const unassignedTrades = await aggregateLiveTrades();
    return res.status(200).json({
      success: true,
      data: unassignedTrades,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all available payers (users with role PAYER who are currently clockedIn)
 */
const getAvailablePayers = async (): Promise<User[]> => {
  const userRepository = dbConnect.getRepository(User);
  const payers = await userRepository.find({
    where: { userType: UserType.PAYER, clockedIn: true },
    order: { createdAt: "ASC" },
  });
  return payers;
};

/**
 * Round-robin assignment: Distribute all live (unassigned) trades among available payers.
 */

export const assignLiveTrades = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get unassigned live trades.
    const liveTrades = await aggregateLiveTrades();
    if (!liveTrades || liveTrades.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No unassigned live trades found.",
      });
    }

    // Get available payers (role PAYER, clockedIn true).
    const availablePayers = await getAvailablePayers();
    if (availablePayers.length === 0) {
      return next(new ErrorHandler("No available payers found", 400));
    }

    // Retrieve platform services.
    const services = await initializePlatformServices();
    const tradeRepository = dbConnect.getRepository(Trade);
    const assignedTrades: Trade[] = [];
    let payerIndex = 0;

    // Iterate over each live trade.
    for (const tradeData of liveTrades) {
      // Use round-robin assignment.
      const payer = availablePayers[payerIndex];
      payerIndex = (payerIndex + 1) % availablePayers.length;

      // Check if trade is already assigned.
      const existingTrade = await tradeRepository.findOne({
        where: { tradeHash: tradeData.trade_hash },
      });
      if (existingTrade) continue;

      // Only fetch trade details and chat for platforms that support it.

      let tradeDetails = null;
      let tradeChat = null;

      if (tradeData.platform === "noones" || tradeData.platform === "paxful") {
        const platformKey = tradeData.platform as keyof PlatformServices;
        // Narrow the service type to NoonesService or PaxfulService.
        const platformService = services[platformKey]?.find(
          (s: any) => s.accountId === tradeData.accountId
        ) as (NoonesService | PaxfulService) | undefined;

        if (platformService) {
          tradeDetails = await platformService.getTradeDetails(tradeData.trade_hash);
          tradeChat = await platformService.getTradeChat(tradeData.trade_hash);
        }
      }

      // Create a new Trade record.
      let trade = tradeRepository.create({
        tradeHash: tradeData.trade_hash,
        platform: tradeData.platform,
        amount: tradeData.amount,
        status: TradeStatus.ASSIGNED,
        assignedPayerId: payer.id,
        assignedAt: new Date(),
        accountId: tradeData.accountId,
      });
      trade = await tradeRepository.save(trade);
      assignedTrades.push(trade);
    }

    return res.status(200).json({
      success: true,
      message: "Live trades assigned to available payers using round-robin strategy.",
      data: assignedTrades,
    });
  } catch (error) {
    return next(error);
  }
};


/**
 * Fetch trade details (including chat) based on stored trade data.
 * Instead of manually inputting tradeHash, platform, and accountId,
 * this endpoint uses the trade record (identified by tradeId) to retrieve those details.
 */
export const fetchTradeDetailsById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tradeId } = req.params;
    const tradeRepository = dbConnect.getRepository(Trade);
    const trade = await tradeRepository.findOne({ where: { id: tradeId } });
    if (!trade) {
      return next(new ErrorHandler("Trade not found", 404));
    }
    // Destructure stored values from the trade record.
    const { tradeHash, platform, accountId } = trade;
    const services = await initializePlatformServices();
    let tradeDetails, tradeChat;

    switch (platform) {
      case "noones": {
        const service = services.noones.find((s) => s.accountId === accountId);
        if (!service) return next(new ErrorHandler("Noones account not found", 404));
        tradeDetails = await service.getTradeDetails(tradeHash);
        tradeChat = await service.getTradeChat(tradeHash);
        break;
      }
      case "paxful": {
        const service = services.paxful.find((s) => s.accountId === accountId);
        if (!service) return next(new ErrorHandler("Paxful account not found", 404));
        tradeDetails = await service.getTradeDetails(tradeHash);
        // Assuming paxful returns { data: { trade: ... } }
        tradeDetails = tradeDetails.data.trade;
        tradeChat = await service.getTradeChat(tradeHash);
        break;
      }
      default:
        return next(new ErrorHandler("Unsupported platform", 400));
    }

    return res.status(200).json({
      success: true,
      data: { tradeDetails, tradeChat },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET Currency Rates
 */
export const getCurrencyRates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const services = await initializePlatformServices();

    const rates: {
      noonesRate?: number;
      binanceRate?: any;
      paxfulRate?: number;
    } = {};

    // Get Noones rate
    if (services.noones.length > 0) {
      try {
        const rate = await services.noones[0].getBitcoinPrice();
        rates.noonesRate = rate;
      } catch (error) {
        console.error("Error fetching Noones rate:", error);
      }
    }

    if (services.binance.length > 0) {
      try {
        const { btcUsdt } = await services.binance[0].fetchAllRates();
        rates.binanceRate = btcUsdt.price;
        console.log("Binance rate: ", rates.binanceRate);
      } catch (error) {
        console.error("Error fetching Binance rate:", error);
      }
    }

    const paxfulRate = await paxfulService.getBitcoinPrice();
    rates.paxfulRate = paxfulRate;
    console.log("Paxful rate: ", rates.paxfulRate);
    if (Object.keys(rates).length === 0) {
      return next(new ErrorHandler("Failed to fetch rates from any platform", 500));
    }

    return res.status(200).json({ data: { ...rates }, success: true });
  } catch (error: any) {
    console.log(error.message);
    return next(error);
  }
};

/**
 * Get trade details from any platform.
 * (Legacy endpoint expecting tradeHash, platform, accountId in the body.)
 * Consider using fetchTradeDetailsById instead.
 */
export const getTradeDetails = async (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tradeHash, platform, accountId } = req.body;

    if (!platform || !tradeHash || !accountId) {
      return next(
        new ErrorHandler("Platform, trade hash, and account ID are required", 400)
      );
    }

    const services = await initializePlatformServices();
    let trade;
    let tradeChat;

    switch (platform) {
      case "noones": {
        const service = services.noones.find((s) => s.accountId === accountId);
        if (!service) {
          return next(new ErrorHandler("Account not found", 404));
        }
        trade = await service.getTradeDetails(tradeHash);
        tradeChat = await service.getTradeChat(tradeHash);
        break;
      }
      case "paxful": {
        const service = services.paxful.find((s) => s.accountId === accountId);
        if (!service) {
          return next(new ErrorHandler("Account not found", 404));
        }
        trade = await service.getTradeDetails(tradeHash);
        trade = trade.data.trade;
        tradeChat = await service.getTradeChat(tradeHash);
        break;
      }
      default:
        return next(new ErrorHandler("Unsupported platform", 400));
    }

    if (!trade) {
      return next(new ErrorHandler("No trade found", 404));
    }

    return res.status(200).json({
      success: true,
      data: { trade, tradeChat },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Send message in trade chat.
 */
export const sendTradeChatMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tradeId } = req.params;
    const { content } = req.body;
    if (!tradeId || !content) {
      return next(new ErrorHandler("Trade ID and content are required", 400));
    }

    const tradeRepository = dbConnect.getRepository(Trade);
    const trade = await tradeRepository.findOne({ where: { id: tradeId } });
    if (!trade) {
      return next(new ErrorHandler("Trade not found", 404));
    }

    // Binance does not support sending trade messages.
    if (trade.platform === "binance") {
      return next(new ErrorHandler("Binance does not support sending trade messages", 400));
    }

    const services = await initializePlatformServices();
    const platformService = services[trade.platform]?.find(
      (s) => s.accountId === trade.accountId
    );
    if (!platformService) {
      return next(new ErrorHandler("Platform service not found", 404));
    }

    await platformService.sendTradeMessage(trade.tradeHash, content);
    return res.status(200).json({
      success: true,
      message: "Message posted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get wallet balances.
 */
export const getWalletBalances = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accountRepository = dbConnect.getRepository(Account);
    const accounts = await accountRepository.find({
      where: { status: "active" },
    });

    const services: PlatformService[] = [];
    const balances: Record<string, any> = {};

    for (const account of accounts) {
      try {
        switch (account.platform) {
          case "noones":
            services.push({
              platform: "noones",
              label: account.account_username,
              accountId: account.id,
              getBalance: async () => {
                const service = new NoonesService({
                  apiKey: account.api_key,
                  apiSecret: account.api_secret,
                  label: account.account_username,
                });
                await service.initialize();
                return service.getWalletBalances();
              },
            });
            break;
          case "paxful":
            services.push({
              platform: "paxful",
              label: account.account_username,
              accountId: account.id,
              getBalance: async () => {
                const service = new PaxfulService({
                  clientId: account.api_key,
                  clientSecret: account.api_secret,
                  label: account.account_username,
                });
                return [
                  {
                    currency: "BTC",
                    name: "Bitcoin",
                    balance: await service.getWalletBalance(),
                    type: "crypto",
                  },
                ];
              },
            });
            break;
          case "binance":
            services.push({
              platform: "binance",
              label: account.account_username,
              accountId: account.id,
              getBalance: async () => {
                const service = new BinanceService({
                  apiKey: account.api_key,
                  apiSecret: account.api_secret,
                  label: account.account_username,
                });
                const balance = await service.getBTCBalance();
                return [
                  {
                    currency: "BTC",
                    name: "Bitcoin",
                    balance: await service.getBTCBalance(),
                    type: "crypto",
                  },
                ];
              },
            });
            break;
        }
      } catch (error) {
        console.error(`Error initializing service for account ${account.id}:`, error);
        balances[account.id] = {
          error: "Service initialization failed",
          platform: account.platform,
          label: account.account_username,
        };
      }
    }

    await Promise.all(
      services.map(async (service) => {
        try {
          const balance = await service.getBalance();
          balances[service.accountId] = {
            platform: service.platform,
            label: service.label,
            balances: balance,
          };
        } catch (error) {
          console.error(`Error fetching balance for ${service.label}:`, error);
          balances[service.accountId] = {
            error: "Failed to fetch balance",
            platform: service.platform,
            label: service.label,
          };
        }
      })
    );

    const transformedBalances: Record<string, any> = {};
    for (const [accountId, balanceData] of Object.entries(balances)) {
      if (balanceData.error) {
        transformedBalances[accountId] = balanceData;
        continue;
      }
      transformedBalances[accountId] = {
        balances: balanceData.balances.map((balance: WalletBalance) => ({
          currency: balance.currency,
          name: balance.name,
          balance: balance.balance,
          type: balance.type,
        })),
        platform: balanceData.platform,
        label: balanceData.label,
      };
    }

    return res.status(200).json({
      success: true,
      data: transformedBalances,
    });
  } catch (error) {
    console.error("Unexpected error in getWalletBalances:", error);
    return next(error);
  }
};

/**
 * Controller to manually set or update rates.
 */
export const setOrUpdateRates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { noonesRate, paxfulRate, sellingPrice, usdtNgnRate, markup2 } = req.body;

    if (!noonesRate || !paxfulRate || !sellingPrice || !usdtNgnRate || !markup2) {
      return next(new ErrorHandler("All rates (noonesRate, paxfulRate, sellingPrice, usdtNgnRate, markup2) are required", 400));
    }

    const ratesRepository = dbConnect.getRepository(Rates);
    let ratesAll = await ratesRepository.find();
    let rates = ratesAll.length > 0 ? ratesAll[0] : null;

    if (!rates) {
      rates = new Rates();
      rates.costPriceNoones = noonesRate;
      rates.costPricePaxful = paxfulRate;
      rates.sellingPrice = sellingPrice;
      rates.usdtNgnRate = usdtNgnRate;
      rates.markup2 = markup2;
      await ratesRepository.save(rates);

      return res.status(201).json({
        success: true,
        message: "Rates set successfully",
        data: rates,
      });
    } else {
      rates.costPriceNoones = noonesRate;
      rates.costPricePaxful = paxfulRate;
      rates.sellingPrice = sellingPrice;
      rates.usdtNgnRate = usdtNgnRate;
      rates.markup2 = markup2;
      await ratesRepository.save(rates);

      return res.status(200).json({
        success: true,
        message: "Rates updated successfully",
        data: rates,
      });
    }
  } catch (error) {
    return next(error);
  }
};

/**
 * GET Rates.
 */
export const getRates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ratesRepository = dbConnect.getRepository(Rates);
    const ratesAll = await ratesRepository.find();
    if (ratesAll.length === 0) {
      return res.status(200).json({
        success: true,
        data: {},
      });
    }
    const rates = ratesAll[0];
    return res.status(200).json({
      success: true,
      message: "Rates fetched successfully",
      data: rates,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get payer's assigned trade.
 */
export const getPayerTrade = async (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const tradeRepository = dbConnect.getRepository(Trade);
    const assignedTrade = await tradeRepository.findOne({
      where: {
        assignedPayerId: id,
        status: TradeStatus.ASSIGNED,
      },
      relations: {
        assignedPayer: true,
      },
      order: {
        assignedAt: "DESC",
      },
    });

    if (!assignedTrade) {
      return res.status(404).json({
        success: false,
        message: "No active trade found for this payer",
      });
    }

    if (!assignedTrade.assignedPayer) {
      const reloadedTrade = await tradeRepository.findOne({
        where: { id: assignedTrade.id },
        relations: ["assignedPayer"],
        select: [
          "id",
          "tradeHash",
          "platform",
          "status",
          "tradeStatus",
          "amount",
          "cryptoAmountRequested",
          "cryptoAmountTotal",
          "feeCryptoAmount",
          "feePercentage",
          "sourceId",
          "responderUsername",
          "ownerUsername",
          "paymentMethod",
          "locationIso",
          "fiatCurrency",
          "cryptoCurrencyCode",
          "isActiveOffer",
          "offerHash",
          "margin",
          "btcRate",
          "dollarRate",
          "btcAmount",
          "assignedAt",
          "completedAt",
          "notes",
          "platformMetadata",
          "activityLog",
        ],
      });

      if (!reloadedTrade?.assignedPayer) {
        console.error(`Failed to load assignedPayer relation for trade ${assignedTrade.id}`);
        return next(new ErrorHandler("Error loading trade details: Missing assigned payer information", 500));
      }

      return res.status(200).json({
        success: true,
        data: {
          ...reloadedTrade,
          platformMetadata: {
            ...reloadedTrade.platformMetadata,
            sensitiveData: undefined,
          },
        },
      });
    }

    const sanitizedTrade = {
      ...assignedTrade,
      platformMetadata: {
        ...assignedTrade.platformMetadata,
        sensitiveData: undefined,
      },
    };

    return res.status(200).json({
      success: true,
      data: sanitizedTrade,
    });
  } catch (error) {
    console.error("Error in getPayerTrade:", error);
    return next(new ErrorHandler("Error retrieving trade details", 500));
  }
};

/**
 * Mark a trade as paid and send a chat message (message provided by user) to notify the vendor.
 */
export const markTradeAsPaid = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tradeId } = req.params;
    const { message } = req.body;
    if (!tradeId || !message) {
      return next(new ErrorHandler("Trade ID and message are required", 400));
    }

    const tradeRepository = dbConnect.getRepository(Trade);
    const trade = await tradeRepository.findOne({ where: { id: tradeId } });
    if (!trade) {
      return next(new ErrorHandler("Trade not found", 404));
    }

    // If the platform is Binance, which does not support these actions, return an error.
    if (trade.platform === "binance") {
      return next(new ErrorHandler("Binance does not support marking trades as paid", 400));
    }

    const services = await initializePlatformServices();
    const platformService = services[trade.platform]?.find(
      (s) => s.accountId === trade.accountId
    );
    if (!platformService) {
      return next(new ErrorHandler("Platform service not found", 404));
    }

    // Call the platform-specific methods.
    await platformService.markTradeAsPaid(trade.tradeHash);
    await platformService.sendTradeMessage(trade.tradeHash, message);

    return res.status(200).json({
      success: true,
      message: "Trade marked as paid and vendor notified successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get dashboard stats.
 */
export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tradeRepository = dbConnect.getRepository(Trade);
    const escalatedTradeRepository = dbConnect.getRepository(EscalatedTrade);

    const currentlyAssigned = await tradeRepository.count({
      where: { status: TradeStatus.ASSIGNED },
    });

    const notYetAssigned = await tradeRepository.count({
      where: { status: TradeStatus.PENDING },
    });

    const escalated = await escalatedTradeRepository.count({});

    const paidButNotMarked = await tradeRepository.count({
      where: { status: TradeStatus.COMPLETED, completedAt: undefined },
    });

    const totalTradesNGN = await tradeRepository
      .createQueryBuilder("trade")
      .select("SUM(trade.amount)", "totalNGN")
      .where("trade.status = :status", { status: TradeStatus.COMPLETED })
      .getRawOne();

    const totalTradesBTC = await tradeRepository
      .createQueryBuilder("trade")
      .select("SUM(trade.cryptoAmountTotal)", "totalBTC")
      .where("trade.status = :status", { status: TradeStatus.COMPLETED })
      .getRawOne();

    const averageResponseTime = await tradeRepository
      .createQueryBuilder("trade")
      .select("AVG(EXTRACT(EPOCH FROM (trade.completedAt - trade.assignedAt)))", "averageResponseTime")
      .where("trade.status = :status", { status: TradeStatus.COMPLETED })
      .andWhere("trade.completedAt IS NOT NULL")
      .andWhere("trade.assignedAt IS NOT NULL")
      .getRawOne();

    const stats = {
      currentlyAssigned,
      notYetAssigned,
      escalated,
      paidButNotMarked,
      totalTradesNGN: totalTradesNGN.totalNGN || 0,
      totalTradesBTC: totalTradesBTC.totalBTC || 0,
      averageResponseTime: averageResponseTime.averageResponseTime || 0,
    };

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get completed paid trades with pagination.
 */
export const getCompletedPaidTrades = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tradeRepository = dbConnect.getRepository(Trade);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query = tradeRepository
      .createQueryBuilder("trade")
      .where({
        status: TradeStatus.COMPLETED,
        tradeStatus: "Paid",
      })
      .leftJoinAndSelect("trade.assignedPayer", "assignedPayer")
      .orderBy("trade.completedAt", "DESC")
      .skip(skip)
      .take(limit);

    const [trades, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: {
        trades,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error: any) {
    return next(new ErrorHandler(`Error retrieving completed trades: ${error.message}`, 500));
  }
};


export const updateOffersMargin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { paxfulMargin, noonesMargin } = req.body;

    if (typeof paxfulMargin !== "number" || typeof noonesMargin !== "number") {
      return next(new ErrorHandler("Margin values must be valid numbers", 400));
    }

    const services = await initializePlatformServices();

    // Fetch all offers from both platforms
    const noonesOffers = await fetchAllOffers(services.noones);
    const paxfulOffers = await fetchAllOffers(services.paxful);
    const allOffers = [...noonesOffers, ...paxfulOffers];

    console.log("Fetched offers:", allOffers);

    // Filter offers to process only BTC/USD offers
    const btcUsdOffers = allOffers.filter((offer) => {
      return offer.crypto_currency_code === "BTC";
    });

    if (btcUsdOffers.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No BTC/USD offers found to update",
        data: [],
      });
    }

    // Process each offer: Copy details & Create USDT Offer
    const updateResults = await Promise.all(
      btcUsdOffers.map(async (offer) => {
        try {
          let margin: number;
          let serviceInstance: NoonesService | PaxfulService | undefined;

          if (offer.platform === "noones") {
            margin = noonesMargin;
            serviceInstance = services.noones.find(
              (s) => s.accountId === offer.accountId
            );
          } else if (offer.platform === "paxful") {
            margin = paxfulMargin;
            serviceInstance = services.paxful.find(
              (s) => s.accountId === offer.accountId
            );
          } else {
            throw new Error("Unsupported platform");
          }

          if (!serviceInstance) {
            throw new Error(`${offer.platform} account service not found`);
          }

          // Create a new USDT offer based on the copied details
          const newOffer = await serviceInstance.createOffer({
            margin: margin,
            currency: offer.fiat_currency_code,
            offer_cap: {
              range_max: offer.max_amount,
              range_min: offer.min_amount,
            },
            offer_terms: offer.offer_terms,
            payment_method: offer.payment_method,
            payment_window: offer.payment_window,
            payment_country: offer.payment_country,
            offer_type_field: offer.offer_type, // "buy" or "sell"
            crypto_currency: "usdt", // Set to USDT
            is_fixed_price: offer.is_fixed_price || false,
            predefined_amount: offer.predefined_amount || undefined,
          });

          return {
            id: offer.id,
            platform: offer.platform,
            success: true,
          };
        } catch (error: any) {
          return {
            id: offer.id,
            platform: offer.platform,
            success: false,
            error: error.message,
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      message: "Margin update and USDT offer creation completed",
      data: updateResults,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Fetch all active offers from a list of services.
 */
async function fetchAllOffers(
  services: NoonesService[] | PaxfulService[]
): Promise<any[]> {
  const allOffers: any[] = [];

  for (const service of services) {
    try {
      let offers: any[] = [];

      if (service instanceof NoonesService) {
        offers = await service.listActiveOffers();
        offers = offers.map((offer) => ({
          ...offer,
          platform: "noones",
          accountId: service.accountId,
        }));
      } else if (service instanceof PaxfulService) {
        offers = await service.listOffers({ status: "active" });
        offers = offers.map((offer) => ({
          ...offer,
          platform: "paxful",
          accountId: service.accountId,
        }));
      }

      allOffers.push(...offers);
    } catch (error) {
      console.error(
        `Error fetching offers for service ${service.label}:`,
        error
      );
    }
  }

  return allOffers;
}

export const turnOffAllOffers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const services = await initializePlatformServices();
    let count = 0;

    for (const service of [...services.paxful, ...services.noones]) {
      await service.turnOffAllOffers();
    }
    return res.status(200).json({
      success: true,
      message: `Turned off  offers on all platforms`,
    });
  } catch (error) {
    return next(error);
  }
};

export const turnOnAllOffers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const services = await initializePlatformServices();
    let count = 0;

    for (const service of [...services.noones, ...services.paxful]) {
      await service.turnOnAllOffers();
    }

    return res.status(200).json({
      success: true,
      message: `Turned on offers on all platforms`,
    });
  } catch (error) {
    return next(error);
  }
};

// Controller for  re assigning a trade

export const reassignTrade = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tradeId } = req.params;
    const { userId } = req.body;
    if (!tradeId || !userId) {
      return next(new ErrorHandler("Trade ID and User ID are required", 400));
    }

    const tradeRepository = dbConnect.getRepository(Trade);
    const trade = await tradeRepository.findOne({ where: { id: tradeId }, relations: ["assignedPayer"] });
    if (!trade) {
      return next(new ErrorHandler("Trade not found", 404));
    }
    if (trade.status === TradeStatus.COMPLETED || trade.status === TradeStatus.CANCELLED) {
      return next(new ErrorHandler("This trade cannot be reassigned", 400));
    }

    const userRepository = dbConnect.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user || user.userType !== UserType.PAYER) {
      return next(new ErrorHandler("Invalid user. Only payers can be assigned the trade", 400));
    }
    if (trade.assignedPayerId === userId) {
      return next(new ErrorHandler("The trade is already assigned to this user", 400));
    }

    trade.assignedPayerId = userId;
    trade.assignedAt = new Date();
    trade.status = TradeStatus.ASSIGNED;

    await tradeRepository.save(trade);
    return res.status(200).json({ success: true, message: "Trade reassigned successfully", data: trade });
  } catch (error) {
    return next(error);
  }
};

export const getAllTrades = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tradeRepository = dbConnect.getRepository(Trade);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [trades, total] = await tradeRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: "DESC" },
    });

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: { trades, pagination: { total, totalPages, currentPage: page, itemsPerPage: limit } },
    });
  } catch (error: any) {
    return next(new ErrorHandler(`Error retrieving trades: ${error.message}`, 500));
  }
};

export const getUnfinishedTrades = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tradeRepository = dbConnect.getRepository(Trade);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Example: return trades that are not completed or not marked as "Paid"
    const [trades, total] = await tradeRepository.findAndCount({
      where: { status: Not(TradeStatus.COMPLETED) },
      skip,
      take: limit,
      order: { createdAt: "DESC" },
    });

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: { trades, pagination: { total, totalPages, currentPage: page, itemsPerPage: limit } },
    });
  } catch (error: any) {
    return next(new ErrorHandler(`Error retrieving unfinished trades: ${error.message}`, 500));
  }
};

