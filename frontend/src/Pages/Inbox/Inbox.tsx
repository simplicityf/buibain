import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  Badge,
  IconButton,
  InputBase,
  Paper,
  useTheme,
  alpha,
  useMediaQuery,
  Drawer,
} from "@mui/material";
import {
  Send as SendIcon,
  Menu as MenuIcon,
  MoreVert as MoreVertIcon,
  AttachFile as AttachFileIcon,
  Chat as ChatIcon,
  Message as MessageIcon,
  Delete,
} from "@mui/icons-material";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Attachment, Chat, Message } from "../../lib/interface";
import {
  createMessage,
  deleteChat,
  getAllChats,
  getSingleChat,
} from "../../api/chats";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUserContext } from "../../Components/ContextProvider";
import io from "socket.io-client";
import Loading from "../../Components/Loading";
import {
  Description as FileIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  PictureAsPdf,
  TableChart,
  Code,
} from "@mui/icons-material";

const messageValidation = Yup.object({
  message: Yup.string().required(),
});

const notificationSound = new Audio("/message.mp3");
const Inbox: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [chats, setChats] = useState<Chat[] | null>(null);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const messageContainerRef = useRef<HTMLDivElement | null>(null);
  const { onlineUsers, setOnlineUsers } = useUserContext();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<any>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useUserContext();
  const [params] = useSearchParams();
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Initialize socket connection
  useEffect(() => {
    // socketRef.current = io("http://localhost:7001");
    socketRef.current = io("https://r845fh.bibuain.ng");

    // Join with user ID when socket connects
    if (user?.id) {
      socketRef.current.emit("join", user.id);
    }

    // Listen for online users updates
    socketRef.current.on("onlineUsers", (users: string[]) => {
      setOnlineUsers(users);
    });

    // Listen for individual user status updates
    socketRef.current.on("userStatusUpdate", ({ userId, status }: any) => {
      setOnlineUsers((prev: any) =>
        status === "online"
          ? [...prev, userId]
          : prev.filter((id: any) => id !== userId)
      );
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("userStatusUpdate", {
          userId: user?.id,
          status: "offline",
        });
        socketRef.current.disconnect();
      }
    };
  }, [user?.id]);

  useEffect(() => {
    if (selectedChat) {
      socketRef.current.emit("joinChat", selectedChat.id);

      socketRef.current.on("newMessage", (newMessage: Message) => {
        if (newMessage.sender.id !== user?.id) {
          notificationSound.play();
        }
        setMessages((prevMessages) =>
          prevMessages ? [...prevMessages, newMessage] : [newMessage]
        );
      });

      return () => {
        socketRef.current.emit("leaveChat", selectedChat.id);
        socketRef.current.off("newMessage");
      };
    }
  }, [selectedChat]);

  useEffect(() => {
    const fetchChatData = async () => {
      const chatId = params.get("chatId");
      if (chatId) {
        const data = await getSingleChat(chatId as string);
        if (data?.success) {
          setSelectedChat(data.data);
        }
      } else {
        setSelectedChat(null);
      }
    };
    fetchChatData();
    const fetchChats = async () => {
      const data = await getAllChats();
      if (data?.success) {
        setChats(data.data);
      } else {
        setChats([]);
      }
    };
    fetchChats();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  console.log(messages);
  const handleChatSelect = async (chat: Chat) => {
    setLoading(true);
    setSelectedChat(chat);
    try {
      const response = await getSingleChat(chat.id);
      if (response?.success) {
        setMessages(response.data.messages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      setMessages([]);
    }
    setLoading(false);
    if (isMobile) handleDrawerToggle();
  };

  if (user === null) {
    return;
  }
  if (loading) return <Loading />;

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon />;
    if (type === "application/pdf") return <PictureAsPdf />;
    if (type === "text/csv") return <TableChart />;
    if (type.includes("javascript") || type.includes("typescript"))
      return <Code />;
    return <FileIcon />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const AttachmentPreview = ({ attachment }: { attachment: Attachment }) => {
    const theme = useTheme();
    const isImage = attachment.type.startsWith("image/");

    if (isImage) {
      return (
        <Box sx={{ mt: 1, mb: 1, maxWidth: "100%" }}>
          <img
            src={`https://r845fh.bibuain.ng${attachment.url}`}
            alt={attachment.name}
            style={{
              maxWidth: "100%",
              maxHeight: "200px",
              borderRadius: "4px",
              objectFit: "contain",
            }}
          />
        </Box>
      );
    }

    return (
      <Box
        sx={{
          mt: 1,
          mb: 1,
          display: "flex",
          alignItems: "center",
          p: 1,
          borderRadius: 1,
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.04)",
        }}
      >
        <Box sx={{ mr: 1 }}>{getFileIcon(attachment.type)}</Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" noWrap>
            {attachment.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatFileSize(attachment.size)}
          </Typography>
        </Box>
        <IconButton
          size="small"
          component="a"
          href={`https://r845fh.bibuain.ng${attachment.url}`}
          download
          sx={{ ml: 1 }}
        >
          <DownloadIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  };

  const ChatsList = () => (
    <Box
      sx={{
        width: { xs: "100%", md: 300 },
        height: "80vh",
        borderRight: `1px solid ${theme.palette.divider}`,
        bgcolor: "background.paper",
      }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Messages
        </Typography>
      </Box>
      <Box sx={{ overflow: "auto", height: "calc(100% - 64px)" }}>
        {chats?.length === 0 && (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <ChatIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
            <Typography color="text.secondary">No chats available</Typography>
          </Box>
        )}
        {chats?.length !== 0 &&
          chats !== null &&
          chats.map((chat) => (
            <Box
              key={chat.id}
              onClick={() => handleChatSelect(chat)}
              sx={{
                p: 2,
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                },
                bgcolor:
                  chat?.id === chat.id
                    ? alpha(theme.palette.primary.main, 0.08)
                    : "transparent",
              }}
            >
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                variant="dot"
                sx={{
                  "& .MuiBadge-badge": {
                    backgroundColor: onlineUsers.includes(
                      chat?.participants?.find((p) => p.id !== user?.id)?.id ||
                        "sdf"
                    )
                      ? "#44b700"
                      : "#ccc",
                  },
                }}
              >
                <Avatar
                  src={chat.participants.find((p) => p.id !== user?.id)?.avatar}
                >
                  {chat.participants
                    .filter((c) => c.id !== user?.id)
                    .map((participant) => participant.fullName.charAt(0))
                    .join("")}
                </Avatar>
              </Badge>
              <Box sx={{ ml: 2, flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
                  {chat.participants
                    .filter((c) => c.id !== user?.id)
                    .map((participant) => participant.fullName)}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {"No messages yet"}
                </Typography>
              </Box>
            </Box>
          ))}
      </Box>
    </Box>
  );

  const DefaultChatWindow = () => (
    <Box
      sx={{
        height: "80vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "#f5f5f5",
      }}
    >
      <MessageIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
      <Typography variant="h6" color="text.secondary">
        Select a chat to start messaging
      </Typography>
    </Box>
  );

  const ChatWindow = () => {
    if (!selectedChat) {
      return <DefaultChatWindow />;
    }

    return (
      <Box
        sx={{
          height: "80vh",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.primary.main, 0.04),
          }}
        >
          {isMobile && (
            <IconButton
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            variant="dot"
            sx={{
              "& .MuiBadge-badge": {
                backgroundColor: onlineUsers.includes(
                  selectedChat?.participants?.find((p) => p.id !== user?.id)
                    ?.id || "sdf"
                )
                  ? "#44b700"
                  : "#ccc",
              },
            }}
          >
            <Avatar
              src={
                selectedChat.participants.find((p) => p.id !== user?.id)?.avatar
              }
            >
              {selectedChat.participants
                .filter((c) => c.id !== user?.id)
                .map((participant) => participant.fullName.charAt(0))
                .join("")}
            </Avatar>
          </Badge>
          <Box sx={{ ml: 2, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {selectedChat.participants
                .filter((c) => c.id !== user?.id)
                .map((participant) => participant.fullName)
                .join("")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {onlineUsers.includes(
                selectedChat?.participants?.find((p) => p.id !== user?.id)
                  ?.id || "sdf"
              )
                ? "Online"
                : "Offline"}
            </Typography>
          </Box>
          <IconButton
            onClick={async () => {
              const cfs = window.confirm("Do you want to delete this Chat?");
              if (!cfs) {
                return;
              }
              const data = await deleteChat(selectedChat.id);
              if (data?.success) {
                setSelectedChat(null);
              }
            }}
          >
            <Delete className="text-red-500" />
          </IconButton>
        </Box>

        <Box
          ref={messageContainerRef} // Assign the ref here
          sx={{
            flex: 1,
            overflow: "auto",
            p: 2,
            bgcolor: "#f5f5f5",
            height: "100%",
          }}
        >
          {loading ? (
            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Typography color="text.secondary">
                Loading messages...
              </Typography>
            </Box>
          ) : messages?.length === 0 ? (
            <Box sx={{ textAlign: "center", mt: 2, minHeight: "80vh" }}>
              <MessageIcon
                sx={{ fontSize: 40, color: "text.secondary", mb: 1 }}
              />
              <Typography color="text.secondary">
                Send a message to start the conversation
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                flex: 1,
                position: "relative",
                // height: "100%",
                overflow: "auto",
                p: 2,
                bgcolor: "#f5f5f5",
                minHeight: "80vh",
              }}
            >
              {messages?.map((msg) => (
                <Box
                  key={msg.id}
                  sx={{
                    display: "flex",
                    justifyContent:
                      msg.sender?.id === user?.id ? "flex-end" : "flex-start",
                    mb: 2,
                  }}
                >
                  {msg.sender.id !== user?.id && (
                    <Avatar
                      src={
                        selectedChat.participants.find(
                          (p) => p.id === msg.sender.id
                        )?.avatar
                      }
                      sx={{ width: 32, height: 32, mr: 1 }}
                    >
                      {selectedChat.participants
                        .find((p) => p.id === msg.sender.id)
                        ?.fullName.charAt(0)}
                    </Avatar>
                  )}
                  <Box
                    sx={{
                      maxWidth: "70%",
                      p: 2,
                      bgcolor:
                        msg.sender.id === user?.id
                          ? theme.palette.primary.main
                          : "white",
                      color: msg.sender.id === user?.id ? "white" : "inherit",
                      borderRadius: 2,
                      boxShadow: 1,
                    }}
                  >
                    {msg.content && (
                      <Typography variant="body1">{msg.content}</Typography>
                    )}

                    {msg.attachments &&
                      msg.attachments.map((attachment, index) => (
                        <AttachmentPreview
                          key={`${msg.id}-attachment-${index}`}
                          attachment={attachment}
                        />
                      ))}
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        mt: 0.5,
                        opacity: 0.7,
                        color:
                          msg.sender.id === user?.id
                            ? "inherit"
                            : "text.secondary",
                      }}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          <Formik
            initialValues={{ message: "" }}
            validationSchema={messageValidation}
            onSubmit={async (values, { resetForm }) => {
              try {
                const formData = new FormData();
                formData.append("content", values.message);
                if (selectedFile) {
                  formData.append("file", selectedFile);
                }

                const data = await createMessage(formData, selectedChat.id);
                if (data?.success) {
                  if (messages !== null) {
                    const updatedMessages = [...messages, data.data];
                    setMessages(updatedMessages);
                  } else {
                    setMessages([data.data]);
                  }
                  resetForm();
                  setSelectedFile(null);
                }
              } catch (error) {
                console.error("Error in onSubmit handler:", error);
              }
            }}
          >
            {({ values, handleChange, handleSubmit }) => (
              <Form>
                <Paper
                  sx={{
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    borderTop: `1px solid ${theme.palette.divider}`,
                    position: "relative",
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                  <IconButton onClick={() => fileInputRef.current?.click()}>
                    <AttachFileIcon
                      color={selectedFile ? "primary" : "inherit"}
                    />
                  </IconButton>
                  {selectedFile && (
                    <Typography variant="caption" sx={{ mr: 1 }}>
                      {selectedFile.name}
                      <IconButton
                        size="small"
                        onClick={() => setSelectedFile(null)}
                        sx={{ ml: 0.5 }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Typography>
                  )}
                  <InputBase
                    fullWidth
                    placeholder="Type a message"
                    name="message"
                    value={values.message}
                    onChange={handleChange}
                    sx={{ flex: 1 }}
                  />
                  <IconButton
                    type="submit"
                    color="primary"
                    disabled={!values.message && !selectedFile}
                  >
                    <SendIcon />
                  </IconButton>
                </Paper>
              </Form>
            )}
          </Formik>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ display: "flex", height: "max-content" }}>
      {!isMobile ? (
        <ChatsList />
      ) : (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          sx={{
            "& .MuiDrawer-paper": { width: 300 },
          }}
        >
          <ChatsList />
        </Drawer>
      )}

      <Box sx={{ flex: 1 }}>
        <ChatWindow />
      </Box>
    </Box>
  );
};

export default Inbox;
