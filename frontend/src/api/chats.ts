import { ResInterface } from "../lib/interface";
import { api, handleApiError } from "./user";
import toast from "react-hot-toast";
import { loadingStyles, successStyles } from "../lib/constants";

export const createChat = async (participants: string[]) => {
  try {
    const res: ResInterface = await api.post("/chat/create", { participants });

    return res;
  } catch (error) {
    handleApiError(error);
  }
};

export const getAllChats = async () => {
  try {
    const res: ResInterface = await api.get("/chat/all");
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

export const getSingleChat = async (id: string) => {
  try {
    const res: ResInterface = await api.get(`/chat/${id}`);

    return res;
  } catch (error) {
    handleApiError(error);
  }
};

export const createMessage = async (content: any, chatId: string) => {
  try {
    content.append("chatId", chatId);
    console.log();
    const res: ResInterface = await api.post("/message/create", content, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res;
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteChat = async (chatId: string) => {
  try {
    toast.loading("Deleting chat...", loadingStyles);
    const res: ResInterface = await api.delete(`/chat/${chatId}`);
    toast.dismiss();
    toast.success(res.message, successStyles);
    return res;
  } catch (error) {
    toast.dismiss();
    handleApiError(error);
  }
};
