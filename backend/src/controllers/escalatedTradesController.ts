import { Request, Response } from "express";
import dbConnect from "../config/database";
import { EscalatedTrade, TradeStatus } from "../models/escalatedTrades";
import { User, UserType } from "../models/user";
import { Chat } from "../models/chats";
import { Trade } from "../models/trades";
import { validationResult } from "express-validator";
import { PaxfulService } from "../config/paxful";
import { NoonesService } from "../config/noones";
import { Account } from "../models/accounts";

export async function escalateTrade(
  req: Request,
  res: Response
): Promise<Response> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    tradeId,
    escalatedById,
    assignedPayerId,
    complaint,
    tradeHash,
    platform,
    amount,
  } = req.body;
  console.log(req.body);
  try {
    const tradeRepo = dbConnect.getRepository(Trade);

    const trade = await tradeRepo.findOne({ where: { id: tradeId } });

    if (!complaint || !tradeId || !tradeHash) {
      return res.status(400).json({ message: "In complete details" });
    }
    if (!trade) {
      return res.status(404).json({ message: "Trade not found." });
    }

    const escalatedTradeRepo = dbConnect.getRepository(EscalatedTrade);
    const existingEscalation = await escalatedTradeRepo.findOne({
      where: { trade: { id: tradeId } },
    });

    if (existingEscalation) {
      return res
        .status(400)
        .json({ message: "This trade is already escalated." });
    }

    const userRepo = dbConnect.getRepository(User);
    const ccUser = await userRepo.findOne({ where: { userType: UserType.CC } });
    const payer = await userRepo.findOne({ where: { id: assignedPayerId } });
    const escalatedBy = await userRepo.findOne({
      where: { id: escalatedById },
    });

    if (!ccUser || !payer || !escalatedBy) {
      return res
        .status(404)
        .json({ message: "Invalid user details provided." });
    }

    const newEscalation = escalatedTradeRepo.create({
      trade,
      assignedCcAgent: ccUser,
      assignedPayer: payer,
      escalatedBy,
      amount,
      platform,
    });

    await escalatedTradeRepo.save(newEscalation);

    return res.status(201).json({
      data: newEscalation,
      message: "Trade escalated successfully.",
      success: true,
    });
  } catch (error) {
    console.error("Error escalating trade:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
}

export async function deleteTrade(
  req: Request,
  res: Response
): Promise<Response> {
  const { id } = req.params;

  try {
    const tradeRepo = dbConnect.getRepository(EscalatedTrade);
    const trade = await tradeRepo.findOne({
      where: { id },
      relations: ["chat"],
    });

    if (!trade) {
      return res.status(404).json({ message: "Trade not found." });
    }

    if (trade.chat) {
      const chatRepo = dbConnect.getRepository(Chat);
      await chatRepo.remove(trade.chat);
    }

    await tradeRepo.remove(trade);
    return res
      .status(200)
      .json({ message: "Trade and associated data deleted successfully." });
  } catch (error) {
    console.error("Error deleting trade:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
}

export async function getAllTrades(
  req: Request,
  res: Response
): Promise<Response> {
  const { status } = req.query;

  try {
    const tradeRepo = dbConnect.getRepository(EscalatedTrade);
    const query = tradeRepo
      .createQueryBuilder("trade")
      .leftJoinAndSelect("trade.chat", "chat")
      .leftJoinAndSelect("trade.trade", "trade")
      .leftJoinAndSelect("trade.assignedPayer", "payer")
      .leftJoinAndSelect("trade.escalatedBy", "escalatedBy");

    let trades;
    if (status && Object.values(TradeStatus).includes(status as TradeStatus)) {
      query.andWhere("trade.status = :status", { status });
      trades = await query.getMany();
    } else {
      trades = await tradeRepo.find({
        relations: ["trade", "chat", "assignedPayer", "escalatedBy"],
      });
    }

    return res.status(200).json({ data: trades.reverse(), success: true });
  } catch (error) {
    console.error("Error fetching trades:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
}

export async function getTradeById(
  req: Request,
  res: Response
): Promise<Response> {
  const { id } = req.params;

  try {
    const tradeRepo = dbConnect.getRepository(EscalatedTrade);
    const accountRepo = dbConnect.getRepository(Account);
    const trade = await tradeRepo.findOne({
      where: { id },
      relations: [
        "chat",
        "chat.messages",
        "chat.messages.sender",
        "assignedCcAgent",
        "assignedPayer",
        "escalatedBy",
        "trade",
      ],
    });

    if (!trade) {
      return res.status(404).json({ message: "Trade not found." });
    }

    // Fetch the account associated with the trade
    const account = await accountRepo.findOne({
      where: {
        account_username: trade.trade.platformMetadata?.accountUsername,
      },
    });
    if (!account) {
      return res
        .status(404)
        .json({ message: "Account not found for this trade." });
    }

    let service;
    switch (account.platform) {
      case "noones": {
        service = new NoonesService({
          apiKey: account.api_key,
          apiSecret: account.api_secret,
        });
        break;
      }
      case "paxful": {
        service = new PaxfulService({
          clientId: account.api_key,
          clientSecret: account.api_secret,
        });
        break;
      }
      default: {
        return res.status(400).json({ message: "Unsupported platform." });
      }
    }

    const tradeHash = trade.trade.tradeHash;
    const { messages, attachments } = await service.getTradeChat(tradeHash);

    return res
      .status(200)
      .json({
        success: true,
        data: { trade, tradeChat: messages, attachments },
      });
  } catch (error) {
    console.error("Error fetching trade by ID:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
}

export async function updateTrade(
  req: Request,
  res: Response
): Promise<Response> {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const tradeRepo = dbConnect.getRepository(EscalatedTrade);
    const trade = await tradeRepo.findOne({ where: { id } });

    if (!trade) {
      return res.status(404).json({ message: "Trade not found." });
    }

    Object.assign(trade, updateData);
    await tradeRepo.save(trade);

    return res.status(200).json(trade);
  } catch (error) {
    console.error("Error updating trade:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
}
