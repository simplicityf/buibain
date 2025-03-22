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

/**
 * Get real rates for a given platform.
 * For both Paxful and Noones, if the stored rate is falsy, fetch a live rate from the platform.
 * An optional serviceInstance is passed for Noones.
 */
// Helper to compute live rates (already provided)
async function getRealRatesForPlatform(
  platform: string,
  serviceInstance?: NoonesService | PaxfulService
): Promise<{
  btc_usdt: number;
  btc_ngn: number;
  usdt_ngn: number;
}> {
  const ratesRepository = dbConnect.getRepository(Rates);
  const ratesAll = await ratesRepository.find();
  if (ratesAll.length === 0) {
    throw new Error("Rates not set");
  }
  const rates = ratesAll[0];

  if (platform === "noones") {
    // Use DB rate if available; otherwise get live rate from Noones.
    const liveRate = rates.noonesRate
      ? rates.noonesRate
      : serviceInstance
        ? await (serviceInstance as NoonesService).getBitcoinPrice()
        : undefined;
    if (liveRate === undefined) {
      throw new Error("Noones live rate is undefined");
    }
    console.log("Noones Rates:", liveRate, rates.sellingPrice, rates.usdtNgnRate);
    return {
      btc_usdt: liveRate, // Noones BTC/USDT
      btc_ngn: Number(rates.sellingPrice), // Common BTC/NGN benchmark
      usdt_ngn: Number(rates.usdtNgnRate), // USDT/NGN rate
    };
  } else if (platform === "paxful") {
    // Use DB rate if available; otherwise get live rate from Paxful.
    const liveRate = rates.paxfulRate
      ? rates.paxfulRate
      : await paxfulService.getBitcoinPrice();
    console.log("Paxful Rates:", liveRate, rates.sellingPrice, rates.usdtNgnRate);
    return {
      btc_usdt: liveRate,
      btc_ngn: Number(rates.sellingPrice),
      usdt_ngn: Number(rates.usdtNgnRate),
    };
  }
  throw new Error("Unsupported platform");
}

/**
 * Controller to update existing offers.
 * This endpoint iterates over offers that already exist (identified by offer_hash)
 * and sends a request to the update endpoint.
 */
export const updateOffers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Initialize services and fetch existing offers
    const services = await initializePlatformServices();
    const noonesOffers = await fetchAllOffers(services.noones);
    const paxfulOffers = await fetchAllOffers(services.paxful);
    const allOffers = [...noonesOffers, ...paxfulOffers];

    // Now filter offers that already have an offer_hash and are either USDT or BTC offers.
    const offersToUpdate = allOffers.filter(
      (offer) =>
        offer.offer_hash &&
        (offer.crypto_currency_code === "USDT" || offer.crypto_currency_code === "BTC")
    );

    if (offersToUpdate.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No existing USDT or BTC offers found to update",
        data: [],
      });
    }

    const updateResults = await Promise.all(
      offersToUpdate.map(async (offer) => {
        try {
          let serviceInstance: NoonesService | PaxfulService | undefined;
          let platformRates: {
            btc_usdt: number;
            btc_ngn: number;
            usdt_ngn: number;
          };
          let computedMargin: number;

          if (offer.platform === "noones") {
            serviceInstance = services.noones.find((s) => s.accountId === offer.accountId);
            if (!serviceInstance) throw new Error("Noones account service not found");
            platformRates = await getRealRatesForPlatform("noones", serviceInstance);
          } else if (offer.platform === "paxful") {
            serviceInstance = services.paxful.find((s) => s.accountId === offer.accountId);
            if (!serviceInstance) throw new Error("Paxful account service not found");
            platformRates = await getRealRatesForPlatform("paxful");
          } else {
            throw new Error("Unsupported platform");
          }

          const { btc_usdt, btc_ngn, usdt_ngn } = platformRates;
          if (!btc_usdt || !btc_ngn || !usdt_ngn || btc_ngn === 0) {
            throw new Error(
              `Invalid rates: btc_usdt=${btc_usdt}, btc_ngn=${btc_ngn}, usdt_ngn=${usdt_ngn}`
            );
          }

          // Compute margin based on the crypto currency of the offer
          if (offer.crypto_currency_code === "USDT") {
            // Existing formula for USDT offers:
            computedMargin = ((btc_usdt * usdt_ngn / btc_ngn) - 1) * 100;
          } else if (offer.crypto_currency_code === "BTC") {
            // For BTC offers, we compute the margin using an inverse calculation.
            // (Adjust the formula as needed to suit your requirements.)
            computedMargin = ((btc_ngn / (btc_usdt * usdt_ngn)) - 1) * 100;
          } else {
            throw new Error(`Unsupported crypto currency: ${offer.crypto_currency_code}`);
          }

          // Validate and format margin
          if (isNaN(computedMargin) || computedMargin === null || computedMargin === undefined) {
            throw new Error(`Invalid computed margin: ${computedMargin}`);
          }

          console.log(`[${offer.platform}] Raw computed margin for ${offer.crypto_currency_code}:`, computedMargin);

          // Format margin (if Paxful expects a percentage like -3.00 instead of -300, adjust accordingly)
          computedMargin = parseFloat(computedMargin.toFixed(2));
          const marginNumber = Number(computedMargin);

          if (marginNumber < -99.99 || marginNumber > 99.99) {
            throw new Error(`Margin out of allowed range: ${marginNumber}`);
          }
          
          console.log(`[${offer.platform}] Updating ${offer.crypto_currency_code} offer with margin:`, marginNumber);

          let updateResult: any;
          if (offer.platform === "noones") {
            updateResult = await (serviceInstance as NoonesService).updateOffer(
              offer.offer_hash,
              marginNumber
            );
            console.log(`[${offer.platform}] Updated offer:`, updateResult);
          } else if (offer.platform === "paxful") {
            updateResult = await (serviceInstance as PaxfulService).updateOffer(
              offer.offer_hash,
              marginNumber
            );
            console.log(`[${offer.platform}] Updated offer:`, updateResult);
          }

          return {
            id: offer.id,
            platform: offer.platform,
            crypto_currency: offer.crypto_currency_code,
            success: true,
            margin: marginNumber,
            offer: updateResult,
          };
        } catch (error: any) {
          return {
            id: offer.id,
            platform: offer.platform,
            crypto_currency: offer.crypto_currency_code,
            success: false,
            error: error.message,
          };
        }
      })
    );

    return res.status(200).json({
      success: updateResults.every((result) => result.success === true),
      message: "Offer update process completed",
      data: updateResults,
    });
  } catch (error) {
    console.error("Error in updateOffers:", error);
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
        // Log raw response from Noones to help diagnose empty responses.
        console.log("Noones raw offers:", offers);
        offers = offers.map((offer) => ({
          ...offer,
          margin:
            offer.margin !== undefined ? offer.margin : offer.offerMargin,
          platform: "noones",
          accountId: service.accountId,
        }));
      } else if (service instanceof PaxfulService) {
        offers = await service.listOffers({ status: "active" });
        offers = offers.map((offer) => ({
          ...offer,
          margin: offer.margin,
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

    for (const service of [...services.paxful, ...services.noones]) {
      await service.turnOffAllOffers();
    }
    return res.status(200).json({
      success: true,
      message: `Turned off offers on all platforms`,
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

export const getOffersMargin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const services = await initializePlatformServices();

    // Fetch offers from both platforms
    const noonesOffers = await fetchAllOffers(services.noones);
    const paxfulOffers = await fetchAllOffers(services.paxful);
    const allOffers = [...noonesOffers, ...paxfulOffers];

    // Filter offers to include only USDT and BTC
    const filteredOffers = allOffers.filter(
      (offer) =>
        offer.crypto_currency_code === "USDT" ||
        offer.crypto_currency_code === "BTC"
    );

    // Group offers by platform then by crypto currency
    // For each platform, we only want one margin offer per crypto currency type.
    const grouped: Record<
      string,
      Record<string, { id: string; platform: string; crypto_currency: string; margin: number }>
    > = {};

    filteredOffers.forEach((offer) => {
      const { platform, crypto_currency_code } = offer;
      if (!grouped[platform]) {
        grouped[platform] = {};
      }
      // Only add one entry for each crypto currency type if it hasn't been added yet.
      if (!grouped[platform][crypto_currency_code]) {
        grouped[platform][crypto_currency_code] = {
          id: offer.id,
          platform: platform,
          crypto_currency: crypto_currency_code,
          margin: offer.margin,
        };
      }
    });

    // Format response as an object with keys for each platform, each containing an array of one margin per crypto currency.
    const responseData = [
      ...Object.values(grouped.noones || {}),
      ...Object.values(grouped.paxful || {}),
    ];    

    return res.status(200).json({
      success: true,
      message: "Margin data fetched successfully",
      data: responseData,
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
        console.log("Noones rate: ", rates.noonesRate);
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
 * Round-robin assignment: Distribute live (unassigned) trades among available payers.
 */
// export const assignLiveTrades = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     // If dummy mode is enabled via query parameter or env variable, use dummy data.
//     const useDummy =
//       req.query.useDummy === "true" ||
//       process.env.USE_DUMMY_LIVE_TRADES === "true";
//     const liveTrades = useDummy ? getDummyLiveTrades() : await aggregateLiveTrades();

//     if (!liveTrades || liveTrades.length === 0) {
//       return res.status(200).json({
//         success: true,
//         message: "No unassigned live trades found.",
//       });
//     }

//     // Get available payers (users with role PAYER and clockedIn true).
//     const availablePayers = await getAvailablePayers();
//     if (availablePayers.length === 0) {
//       return next(new ErrorHandler("No available payers found", 400));
//     }

//     // Retrieve platform services for further processing.
//     const services = await initializePlatformServices();
//     const tradeRepository = dbConnect.getRepository(Trade);
//     const assignedTrades: any[] = [];
//     let payerIndex = 0;

//     // Iterate over each live trade.
//     for (const tradeData of liveTrades) {
//       // Round-robin assignment.
//       const payer = availablePayers[payerIndex];
//       payerIndex = (payerIndex + 1) % availablePayers.length;

//       // Check if the trade is already assigned.
//       const existingTrade = await tradeRepository.findOne({
//         where: { tradeHash: tradeData.trade_hash },
//       });
//       if (existingTrade) continue;

//       // For platforms that support fetching additional vendor details.
//       let tradeDetails = null;
//       let tradeChat = null;
//       if (tradeData.platform === "noones" || tradeData.platform === "paxful") {
//         type PlatformKey = "noones" | "paxful";
//         const platformKey = tradeData.platform as PlatformKey;
//         const platformService = services[platformKey]?.find((s: any) => s.accountId === tradeData.accountId);
//         if (platformService) {
//           tradeDetails = await platformService.getTradeDetails(tradeData.trade_hash);
//           if (platformService.getTradeChat) {
//             tradeChat = await platformService.getTradeChat(tradeData.trade_hash);
//           }
//         }
//       }

//       // Create a new Trade record with default values for required fields.
//       let trade = tradeRepository.create({
//         tradeHash: tradeData.trade_hash,
//         platform: tradeData.platform,
//         amount: tradeData.amount,
//         status: TradeStatus.ASSIGNED,
//         tradeStatus: "Assigned", // default value
//         assignedPayerId: payer.id,
//         assignedAt: new Date(),
//         accountId: tradeData.accountId,
//         // Set defaults for numeric fields.
//         cryptoAmountRequested: 0,
//         cryptoAmountTotal: 0,
//         feeCryptoAmount: 0,
//         feePercentage: 0,
//         // Set defaults for required string fields.
//         sourceId: "dummySource",
//         responderUsername: "dummyResponder",
//         ownerUsername: "dummyOwner",
//         paymentMethod: "dummyMethod",
//         fiatCurrency: "NGN",
//         cryptoCurrencyCode: "BTC",
//       });
//       trade = await tradeRepository.save(trade);

//       // Push an object containing the saved trade, fetched details, chat, and the assigned payer's info.
//       assignedTrades.push({
//         trade,
//         tradeDetails,
//         tradeChat,
//         payer: {
//           id: payer.id,
//           fullName: payer.fullName,
//           email: payer.email, // if needed
//         },
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Live trades assigned to available payers using round-robin strategy.",
//       data: assignedTrades,
//     });
//   } catch (error) {
//     return next(error);
//   }
// };

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
    const { platform, tradeHash, accountId } = req.params;
    console.log("Received Params:", { platform, tradeHash, accountId });

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

    if (
      noonesRate === undefined ||
      paxfulRate === undefined ||
      sellingPrice === undefined ||
      usdtNgnRate === undefined ||
      markup2 === undefined
    ) {
      return next(
        new ErrorHandler(
          "All rates (noonesRate, paxfulRate, sellingPrice, usdtNgnRate, markup2) are required",
          400
        )
      );
    }

    const ratesRepository = dbConnect.getRepository(Rates);
    const ratesAll = await ratesRepository.find();
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
        success: true,  // ✅ Added success field
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
        success: true,  // ✅ Added success field
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

