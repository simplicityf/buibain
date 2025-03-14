"use strict";
// import { NextFunction, Response } from "express";
// import { UserRequest } from "middlewares/authenticate";
// import { Trade } from "../models/trades";
// import { getRepository } from "typeorm";
// import noonesApi from "config/noones";
// import { getPaxfulTradeChat } from "config/paxful";
// import ErrorHandler from "utils/errorHandler";
// export const getPayerTrade = async (
//   req: UserRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { id } = req.params;
//     const tradeRepository = getRepository(Trade);
//     const assignedTrade = await tradeRepository
//       .createQueryBuilder("trade")
//       .leftJoinAndSelect("trade.assignedPayer", "payer")
//       .where("trade.assigned_payer_id = :payerId", { payerId: id })
//       .getOne();
//     if (!assignedTrade) {
//       return res.status(404).json({
//         success: false,
//         message: "No active trade found for this payer",
//       });
//     }
//     // Double-check the assigned payer is properly loaded
//     if (!assignedTrade.assignedPayer) {
//       // Try to reload the relation
//       const reloadedTrade = await tradeRepository.findOne({
//         where: { id: assignedTrade.id },
//         relations: ["assignedPayer"],
//       });
//       if (!reloadedTrade?.assignedPayer) {
//         console.error(
//           `Failed to load assignedPayer relation for trade ${assignedTrade.id}`
//         );
//         return res.status(500).json({
//           success: false,
//           message: "Error loading trade details",
//         });
//       }
//       return res.json({
//         success: true,
//         data: reloadedTrade,
//       });
//     }
//     return res.json({
//       success: true,
//       data: assignedTrade,
//     });
//   } catch (error) {
//     console.error("Error in getPayerTrade:", error);
//     return next(error);
//   }
// };
