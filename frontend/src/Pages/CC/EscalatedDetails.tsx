import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Button,
  TextField,
  Chip,
  IconButton,
  Badge,
  Tooltip,
  Divider,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  FormControl,
  InputLabel,
  InputBase,
  useTheme,
} from "@mui/material";
import {
  AttachFile,
  Send,
  Schedule,
  Assignment,
  Timeline,
  NotificationsActive,
  ArrowBack,
  Add,
  Image,
  FileCopy,
  Chat,
  AttachFileOutlined,
  PictureAsPdf,
  TableChart,
} from "@mui/icons-material";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getEscalatedTradeById } from "../../api/escalatedTrade";
import Loading from "../../Components/Loading";
import { Form, Formik } from "formik";
import {
  Code,
  Delete,
  DownloadIcon,
  FileIcon,
  ImageIcon,
  SendIcon,
} from "lucide-react";
import { createMessage } from "../../api/chats";
import { Attachment, Message } from "../../lib/interface";
import { getAllUsers } from "../../api/admin";
import toast from "react-hot-toast";
import { errorStyles } from "../../lib/constants";
import { reAssignTrade } from "../../api/trade";

const DEFAULT_AVATAR = "/default.png";

const EscalatedDetails: React.FC = () => {
  const [newMessage, setNewMessage] = useState("");
  const [reminderOpen, setReminderOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [escalatedTrade, setEscalatedTrade] = useState<any>({});
  const [ccs, setCCs] = useState([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const theme = useTheme();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { tradeId } = useParams();

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
          {attachment.url}
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
          target="_blank"
          href={`http://localhost:7001${attachment.url}`}
          download
          sx={{ ml: 1 }}
        >
          <DownloadIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  };

  const navigate = useNavigate();
  useEffect(() => {
    const esId = tradeId;
    const fetch = async () => {
      try {
        if (esId) {
          const data = await getEscalatedTradeById(esId);
          const ccData = await getAllUsers("userType=payer");
          if (data?.success) {
            setEscalatedTrade(data.data.trade);
            setMessages(data.data.tradeChat);
            setAttachments(data.data.attachments);
          } else {
            navigate("/customer-support");
            return;
          }
          if (ccData.success) {
            setCCs(ccData.data);
          }
        } else {
          // navigate("/customer-support");
          // return;
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  console.log(messages);
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

  const handleReAssign = async () => {
    if (!selectedUser) {
      toast.error("Please select a user", errorStyles);
      return;
    }

    const data = await reAssignTrade(escalatedTrade.trade.id, selectedUser);
    if (data.success) {
      setAssignDialogOpen(false);
    }
  };

  if (loading) return <Loading />;
  return (
    <Box className="flex h-[80vh] bg-gray-50">
      <Box className="w-2/5 flex flex-col h-full border-r border-gray-200">
        <Box className="p-6 bg-white border-b border-gray-200">
          <Box className="flex items-center justify-between">
            <Box className="flex items-center gap-3">
              <IconButton
                sx={{ "&:hover": { bgcolor: "rgba(248, 188, 8, 0.1)" } }}
              >
                <Link to={"/customer-support"}>
                  <ArrowBack sx={{ color: "text.primary" }} />
                </Link>
              </IconButton>
              <Box>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 600, color: "text.primary" }}
                >
                  Trade Details
                </Typography>
              </Box>
              <Button
                variant="outlined"
                sx={{
                  width: "max-content",
                  borderColor: "primary.main",
                  color: "primary.main",
                  "&:hover": {
                    borderColor: "secondary.main",
                    color: "secondary.main",
                  },
                  fontSize: "12px",
                }}
                onClick={() => setAssignDialogOpen(true)}
              >
                Re-assign Trade
              </Button>
            </Box>
          </Box>
        </Box>

        <Box className="flex-1 p-6 overflow-y-auto scroll-bar">
          {/* Trade Info Card */}
          <Paper
            elevation={0}
            className="p-6 mb-6"
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Box className="flex justify-between items-start mb-6">
              <Box>
                <Typography
                  variant="overline"
                  sx={{ color: "text.secondary", letterSpacing: 1 }}
                >
                  Trade ID
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: "text.primary" }}
                >
                  {escalatedTrade?.trade?.tradeHash}
                </Typography>
              </Box>
              <Box className="flex gap-2">
                <Chip
                  label={`$${escalatedTrade.amount}`}
                  sx={{
                    bgcolor: "primary.main",
                    color: "white",
                    fontWeight: 600,
                  }}
                  size="small"
                />
              </Box>
            </Box>

            <Divider sx={{ mb: 4 }} />

            <Box className="grid gap-6">
              {/* Platform & Status */}
              <Box className="grid grid-cols-2 gap-4">
                <Box>
                  <Typography
                    variant="overline"
                    sx={{
                      color: "text.secondary",
                      letterSpacing: 1,
                      display: "block",
                      mb: 1,
                    }}
                  >
                    Platform
                  </Typography>
                  <Typography
                    variant="body1"
                    className="capitalize"
                    sx={{ fontWeight: 500, color: "text.primary" }}
                  >
                    {escalatedTrade.platform}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="overline"
                    sx={{
                      color: "text.secondary",
                      letterSpacing: 1,
                      display: "block",
                      mb: 1,
                    }}
                  >
                    Status
                  </Typography>
                  <Chip
                    label={escalatedTrade.status}
                    sx={{
                      bgcolor: "#FEF3C7",
                      color: "#D97706",
                      fontWeight: 600,
                    }}
                    size="small"
                  />
                </Box>
              </Box>

              {/* Escalated By */}
              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    color: "text.secondary",
                    letterSpacing: 1,
                    display: "block",
                    mb: 1,
                  }}
                >
                  Escalated By
                </Typography>
                <Box className="flex items-center gap-2">
                  <Avatar
                    src={escalatedTrade?.escalatedBy?.avatar}
                    sx={{ width: 40, height: 40, border: "1px solid beige" }}
                  />
                  <Box>
                    <Typography sx={{ fontWeight: 500, color: "text.primary" }}>
                      {escalatedTrade?.escalatedBy?.fullName}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      {escalatedTrade.escalatedBy.userType}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Complaint */}
              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    color: "text.secondary",
                    letterSpacing: 1,
                    display: "block",
                    mb: 1,
                  }}
                >
                  Complaint
                </Typography>
                <Typography variant="body1" sx={{ color: "text.primary" }}>
                  {escalatedTrade.complaint}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    color: "text.secondary",
                    letterSpacing: 1,
                    display: "block",
                    mb: 2,
                  }}
                >
                  Attachments
                </Typography>
                <Box className="flex gap-2 flex-wrap">
                  {attachments.map((attachment, index) => (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{
                        p: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        cursor: "pointer",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <Box className="flex items-center gap-2">
                        {attachment.type.startsWith("image/") ? (
                          <Image color="primary" />
                        ) : (
                          <FileCopy color="primary" />
                        )}
                        <Typography variant="body2">
                          {attachment.name}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                  {attachments.length === 0 && (
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      No attachments found
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Typography
              variant="h6"
              className="mb-6"
              sx={{
                fontWeight: 600,
                color: "text.primary",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Timeline sx={{ fontSize: 20 }} />
              Activity Timeline
            </Typography>
            <Box className="space-y-6">
              {escalatedTrade?.activityLog?.map((item, index) => (
                <Box
                  key={index}
                  className="relative pl-6"
                  sx={{
                    borderLeft: "2px solid",
                    borderColor: "primary.main",
                    "&:last-child": {
                      pb: 0,
                    },
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: "-5px",
                      top: 0,
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      bgcolor:
                        item.details?.priority === "High"
                          ? "error.main"
                          : "primary.main",
                    },
                  }}
                >
                  <Box className="flex items-center gap-2 mb-1">
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {new Date(item.performedAt).toLocaleTimeString()}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 600, color: "text.primary", mb: 0.5 }}
                  >
                    {item.action}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", mb: 1 }}
                  >
                    {item.details?.description || "No description available"}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    By {item.performedBy}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col bg-white">
        <Box className="px-6 py-4 border-b border-gray-200">
          <Box className="flex justify-between items-center">
            <Box className="flex items-center gap-2">
              <Avatar
                src={escalatedTrade?.escalatedBy?.avatar}
                sx={{ width: 40, height: 40, border: "1px solid beige" }}
              />
              <Box>
                <Typography sx={{ fontWeight: 500, color: "text.primary" }}>
                  {escalatedTrade?.escalatedBy?.fullName}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {escalatedTrade.escalatedBy.userType}
                </Typography>
              </Box>
            </Box>{" "}
            {/* <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Re-assign Payer</InputLabel>
              <Select
                value=""
                label="Re-assign Payer"
                onChange={() => setAssignDialogOpen(true)}
                sx={{ width: 200 }}
              >
                {ccs.map((cc) => (
                  <MenuItem key={cc.id} value={cc.id}>
                    {cc.fullName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl> */}
            <Box className="flex gap-2">
              <Tooltip title="Set Reminder">
                <IconButton
                  sx={{ "&:hover": { bgcolor: "rgba(248, 188, 8, 0.1)" } }}
                >
                  <Schedule sx={{ color: "text.primary" }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Assign Case">
                <IconButton
                  sx={{ "&:hover": { bgcolor: "rgba(248, 188, 8, 0.1)" } }}
                >
                  <Assignment sx={{ color: "text.primary" }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Notifications">
                <IconButton
                  sx={{ "&:hover": { bgcolor: "rgba(248, 188, 8, 0.1)" } }}
                >
                  <Badge badgeContent={2} color="error">
                    <NotificationsActive sx={{ color: "text.primary" }} />
                  </Badge>
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {/* Enhanced Messages Area */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mt: 2,
            maxHeight: "500px",
            overflowY: "auto",
            borderRadius: 3,
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Trade Chat
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {messages.map((message: any) => (
              <Box
                key={message.id}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                  justifyContent:
                    message.type === "msg" ? "flex-start" : "center",
                }}
              >
                {message.type === "msg" && (
                  <Avatar
                    src={message.author?.avatarUrl || DEFAULT_AVATAR}
                    alt={message.author?.userName || "Unknown"}
                    sx={{ width: 40, height: 40 }}
                  />
                )}
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    backgroundColor:
                      message.type === "paxful_message" ? "#d1ecf1" : "#f0f0f0",
                    maxWidth: "70%",
                    textAlign:
                      message.type === "paxful_message" ? "center" : "left",
                  }}
                >
                  {message.type === "paxful_message" && (
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color="primary"
                    >
                      System Message
                    </Typography>
                  )}
                  <Typography variant="body2" fontWeight="bold">
                    {message.author || "Anonymous"}
                  </Typography>
                  <p
                    dangerouslySetInnerHTML={{
                      __html: typeof message.text === "string" && message.text,
                    }}
                  >
                    {}
                  </p>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(
                      parseInt(message.timestamp) * 1000
                    ).toLocaleString()}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </Box>
        </Paper>

        <Box sx={{ p: 2, borderTop: "1px solid #ddd", mt: 2 }}>
          <Formik
            initialValues={{ message: "" }}
            onSubmit={async (values, { resetForm }) => {
              try {
                const newMessage = {
                  id: Math.random().toString(),
                  text: values.message,
                  author: { userName: "You", avatarUrl: DEFAULT_AVATAR },
                  timestamp: (Date.now() / 1000).toString(),
                  type: "msg",
                };
                setMessages([...messages, newMessage]);
                resetForm();
                setSelectedFile(null);
              } catch (error) {
                console.error("Error sending message:", error);
              }
            }}
          >
            {({ values, handleChange }) => (
              <Form>
                <Paper
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 2,
                    borderRadius: 3,
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) =>
                      setSelectedFile(e.target.files?.[0] || null)
                    }
                    style={{ display: "none" }}
                  />
                  <IconButton onClick={() => fileInputRef.current?.click()}>
                    <AttachFileOutlined
                      color={selectedFile ? "primary" : "inherit"}
                    />
                  </IconButton>
                  {selectedFile && (
                    <Typography variant="caption" sx={{ mr: 1 }}>
                      {selectedFile.name}
                      <IconButton
                        size="small"
                        onClick={() => setSelectedFile(null)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Typography>
                  )}
                  <InputBase
                    fullWidth
                    placeholder="Type a message..."
                    name="message"
                    value={values.message}
                    onChange={handleChange}
                    sx={{ flex: 1, ml: 1 }}
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

        {/* Reminder Dialog */}
        <Dialog
          open={reminderOpen}
          onClose={() => setReminderOpen(false)}
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 2,
              padding: 2,
              boxShadow: 3,
              backgroundColor: "background.paper",
              border: "1px solid #E0E0E0",
            },
          }}
        >
          <DialogTitle
            sx={{ fontWeight: 600, color: "text.primary", fontSize: "1.2rem" }}
          >
            Set Reminder
          </DialogTitle>
          <DialogContent sx={{ backgroundColor: "background.default", py: 3 }}>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel sx={{ fontWeight: 500 }}>
                Reminder Interval
              </InputLabel>
              <Select
                value="30"
                label="Reminder Interval"
                sx={{
                  backgroundColor: "white",
                  borderRadius: 1,
                  boxShadow: 1,
                  "& .MuiSelect-icon": {
                    color: "primary.main",
                  },
                }}
              >
                <MenuItem value="15">Every 15 minutes</MenuItem>
                <MenuItem value="30">Every 30 minutes</MenuItem>
                <MenuItem value="60">Every hour</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions
            sx={{ display: "flex", justifyContent: "space-between", px: 3 }}
          >
            <Button
              onClick={() => setReminderOpen(false)}
              sx={{
                backgroundColor: "transparent",
                color: "text.secondary",
                "&:hover": { backgroundColor: "transparent" },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => setReminderOpen(false)}
              sx={{
                backgroundColor: "primary.main",
                color: "white",
                fontWeight: 600,
                "&:hover": { backgroundColor: "primary.dark" },
              }}
            >
              Set Reminder
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={assignDialogOpen}
          onClose={() => setAssignDialogOpen(false)}
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 2,
              padding: 0,
              boxShadow: 3,
              width: 400,
              backgroundColor: "background.paper",
              border: "1px solid #E0E0E0",
            },
          }}
        >
          <DialogTitle
            sx={{ fontWeight: 600, color: "text.primary", fontSize: "1.2rem" }}
          >
            Assign Case
          </DialogTitle>
          <DialogContent sx={{ backgroundColor: "background.default", py: 3 }}>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel sx={{ fontWeight: 500 }}>Select Agent</InputLabel>
              <Select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                label="Select Agent"
                sx={{
                  backgroundColor: "white",
                  borderRadius: 1,
                  boxShadow: 1,
                  "& .MuiSelect-icon": {
                    color: "primary.main",
                  },
                }}
              >
                {ccs.map((cc) => (
                  <MenuItem key={cc.id} value={cc.id}>
                    {cc.fullName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions
            sx={{ display: "flex", justifyContent: "space-between", px: 3 }}
          >
            <Button
              onClick={() => setAssignDialogOpen(false)}
              sx={{
                backgroundColor: "transparent",
                color: "text.secondary",
                "&:hover": { backgroundColor: "transparent" },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleReAssign}
              sx={{
                backgroundColor: "primary.main",
                color: "white",
                fontWeight: 600,
                "&:hover": { backgroundColor: "primary.dark" },
              }}
            >
              Assign
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default EscalatedDetails;
