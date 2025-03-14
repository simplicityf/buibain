import React, { useEffect, useState } from "react";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  styled,
  Container,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Divider,
  Avatar,
  Paper,
  IconButton,
} from "@mui/material";
import {
  AccessTime as Clock,
  Warning as AlertTriangle,
  CheckCircle,
  PauseCircle,
  Archive,
  AccountBalance as Bank,
  Flag as FlagIcon,
  ErrorOutline,
  ThumbUp,
  ThumbDown,
  TrendingDown,
  AttachFile,
  Send as SendIcon,
  AccountBalance,
  Payment,
  Person,
} from "@mui/icons-material";
import { format } from "date-fns";
import EscalateTrade from "../Payer/EscalateTrade";
import { useUserContext } from "../../Components/ContextProvider";
import { IBank, ITrade } from "../../lib/interface";
import { getFundedBanks } from "../../api/bank";
import Loading from "../../Components/Loading";
import {
  getPayerTrade,
  getTradeDetails,
  markTradeAsPaid,
  sendTradeMessage,
} from "../../api/trade";
import ClockedAlt from "../../Components/ClockedAlt";
import toast from "react-hot-toast";
import { successStyles } from "../../lib/constants";
import { CreditCardIcon } from "lucide-react";
import { gridColumnsTotalWidthSelector } from "@mui/x-data-grid";

// Interface definitions
interface Author {
  id?: string;
  name?: string;
  bank_account?: any;
  is_buyer?: boolean;
  is_owner?: boolean;
}

interface Message {
  id: string;
  text?: string;
  author: Author;
  timestamp: string;
  type: string;
  payload?: any[];
}

interface Attachment {
  author: string;
  image_hash: string;
}

// Styled components
const MessageContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  marginBottom: theme.spacing(2),
  gap: theme.spacing(1),
}));

const MessageBubble = styled(Paper)(
  ({ theme, isAuthor }: { theme?: any; isAuthor: any }) => ({
    padding: theme.spacing(1.5),
    maxWidth: "70%",
    borderRadius: theme.spacing(2),
    backgroundColor: isAuthor
      ? theme.palette.primary.light
      : theme.palette.grey[100],
    color: isAuthor
      ? theme.palette.primary.contrastText
      : theme.palette.text.primary,
  })
);

const ChatInput = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const StyledCard = styled(Card)(({ theme }) => ({
  height: "100%",
  borderRadius: theme.shape.borderRadius,
}));

const InfoLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: "0.875rem",
  marginBottom: theme.spacing(0.5),
}));

const StatusChip = styled(Chip)(
  ({ theme, status }: { theme?: any; status: string }) => {
    const getStatusColor = () => {
      switch (status) {
        case "overpayment":
          return { bg: "#FEF3C7", color: "#D97706" };
        case "negative":
          return { bg: "#FEE2E2", color: "#DC2626" };
        case "good":
          return { bg: "#D1FAE5", color: "#059669" };
        case "bad_rate":
          return { bg: "#FFE4E6", color: "#E11D48" };
        default:
          return { bg: "#F3F4F6", color: "#6B7280" };
      }
    };

    const colors = getStatusColor();
    return {
      backgroundColor: colors.bg,
      color: colors.color,
      fontWeight: 600,
      "& .MuiChip-icon": {
        color: colors.color,
      },
    };
  }
);

const PayerDashboard = () => {
  const [selectedBank, setSelectedBank] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [avgTime, setAvgTime] = useState(180);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = React.useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [alertOpen, setAlertOpen] = useState(false);
  const [tradeStatus, setTradeStatus] = useState("good");
  const [open, setOpen] = useState<boolean>(false);
  const [paymentInfo, setPaymentInfo] = useState<any>({});
  const [assignedTrade, setAssignedTrade] = useState<ITrade | null>(null);
  const [fundedBanks, setFundedBanks] = useState<IBank[]>([]);
  const { user } = useUserContext();
  const [loading, setLoading] = useState<boolean>(true);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      // Create a temporary message object
      const tempMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        text: newMessage,
        author: {
          id: user?.id,
          name: user?.fullName,
          is_owner: true,
        },
        timestamp: new Date().toISOString(),
        type: "text",
      };

      setMessages((prevMessages) => [...prevMessages, tempMessage]);

      try {
        const data = await sendTradeMessage(
          assignedTrade.tradeHash,
          newMessage,
          assignedTrade.platform,
          assignedTrade.accountId
        );

        if (data?.success) {
          toast.success("Message Sent Successfully!", successStyles);
        } else {
          toast.error("Failed to send message.");
        }
      } catch (error) {
        toast.error("An error occurred while sending the message.");
        console.error(error);
      }

      setNewMessage("");
    }
  };

  console.log(messages);
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFlagSubmit = () => {
    setFlagDialogOpen(false);
    setAlertOpen(true);
  };

  const approveTrade = async () => {
    const cls = window.confirm("Do you want to mark this trade as paid?");
    if (!cls) return cls;
    const data = await markTradeAsPaid(
      assignedTrade.platform,
      assignedTrade.tradeHash,
      assignedTrade.accountId
    );
    if (data.success) {
      setAssignedTrade(null);
      setPaymentInfo(null);
      setMessages(null);
    }
  };
  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getFundedBanks();
        const tradeData = await getPayerTrade(user?.id || "");
        if (tradeData?.success) {
          setAssignedTrade(tradeData.data);
          const pInfo = await getTradeDetails(
            tradeData.data.platform,
            tradeData.data.tradeHash,
            tradeData.data.accountId
          );
          setPaymentInfo(pInfo.data.trade);
          setMessages(pInfo.data.tradeChat.messages);
          setAttachments(pInfo.data.tradeChat.attachments);
        }
        if (data?.success) {
          setFundedBanks(data.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  if (loading) return <Loading />;

  // if (!user.clockedIn && user.userType !== "admin") {
  //   return <ClockedAlt />;
  // }  // if (!user.clockedIn && user.userType !== "admin") {
  //   return <ClockedAlt />;
  // }

  return (
    <Box
      sx={{
        mt: 3,
        minHeight: "100vh",
        z: -1,
      }}
    >
      {assignedTrade?.flagged && (
        <div className="w-[1230px] right-0 h-[100vh] top-[0px]   bg-red-500/20 absolute z-[0]" />
      )}
      <Container maxWidth="xl">
        <Grid container spacing={3}>
          {/* Left Column */}
          {assignedTrade === null ? (
            <Grid item xs={12} lg={8}>
              <StyledCard>
                <CardContent sx={{ p: 4 }}>
                  {/* No Active Trade Content */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      minHeight: "400px",
                      py: 4,
                    }}
                  >
                    <PauseCircle
                      sx={{
                        fontSize: 80,
                        color: "text.secondary",
                        mb: 3,
                        opacity: 0.7,
                      }}
                    />
                    <Typography
                      variant="h5"
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      No Active Trade Assigned
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ maxWidth: 400, mb: 3 }}
                    >
                      You currently don't have any trades assigned. New trades
                      will appear here once they're allocated to you.
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<Clock />}
                        sx={{
                          borderColor: "divider",
                          color: "text.secondary",
                          "&:hover": {
                            borderColor: "primary.main",
                            backgroundColor: "primary.lighter",
                          },
                        }}
                      >
                        View History
                      </Button>
                      <Button
                        variant="contained"
                        sx={{
                          backgroundColor: "primary.main",
                          "&:hover": {
                            backgroundColor: "primary.dark",
                          },
                        }}
                      >
                        Refresh
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>
          ) : (
            <div className="w-full lg:w-2/3 z-[1] bg-white shadow-xl rounded-2xl p-8 space-y-8">
              {/* Header Section */}
              <div className="flex flex-wrap justify-between items-center">
                <h2 className="text-3xl font-extrabold text-gray-800">
                  Trade Details
                </h2>
                <div className="flex flex-wrap gap-4">
                  <>
                    {assignedTrade?.flagged ? (
                      <span className="px-4 py-2 bg-red-500 text-white rounded-md font-semibold">
                        BAD
                      </span>
                    ) : (
                      <span className="px-4 py-2 bg-green-500 text-white rounded-md font-semibold">
                        GOOD
                      </span>
                    )}
                  </>
                  <button
                    onClick={() => setFlagDialogOpen(true)}
                    className="flex items-center gap-2 border-2 border-yellow-500 text-yellow-600 font-bold px-4 py-2 rounded-lg hover:bg-yellow-500 hover:text-white transition-colors"
                  >
                    <FlagIcon />
                    Flag Issue
                  </button>
                  <button
                    onClick={() => setOpen(true)}
                    className="flex items-center gap-2 border-2 border-red-500 text-red-600 font-bold px-4 py-2 rounded-lg hover:bg-yellow-500 hover:text-white transition-colors"
                  >
                    <AlertTriangle />
                    Escalate
                  </button>
                </div>
              </div>

              {/* Trade Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Platform</p>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {assignedTrade?.platform?.toUpperCase()}
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">BTC Rate</p>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {assignedTrade?.btcRate?.toFixed(0)}
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Account</p>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {assignedTrade?.platformMetadata?.accountUsername || "N/A"}
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Dollar Rate</p>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {assignedTrade?.dollarRate?.toFixed(0)}
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Amount</p>
                  <h3 className="text-2xl font-bold text-blue-600">
                    {assignedTrade?.amount.toFixed(0)}
                  </h3>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Payment Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AccountBalance className="text-blue-600" />
                      <p className="text-sm text-gray-500">Bank Name</p>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {paymentInfo?.bank_accounts?.to?.bank_name || "N/A"}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CreditCardIcon className="text-blue-600" />
                      <p className="text-sm text-gray-500">Account Number</p>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {paymentInfo?.bank_accounts?.to?.account_number || "N/A"}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Person className="text-blue-600" />
                      <p className="text-sm text-gray-500">Account Holder</p>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {paymentInfo?.bank_accounts?.to?.holder_name || "N/A"}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Confirm Payment Button */}
              <button
                onClick={approveTrade}
                className="w-full flex items-center justify-center bg-blue-600 text-white text-xl font-bold py-3 rounded-lg shadow-lg hover:bg-blue-700 transform hover:-translate-y-1 transition"
              >
                <CheckCircle className="inline-block mr-2" />
                CONFIRM PAYMENT
              </button>
            </div>
          )}

          {/* Chat Section */}
          <Grid item xs={12} lg={4}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardContent sx={{ p: 2, flexGrow: 0 }}>
                <Typography variant="h6" gutterBottom>
                  Trade Chat
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {messages?.length} messages • {attachments?.length}{" "}
                  attachments
                </Typography>
              </CardContent>
              <Divider />

              <Box
                sx={{
                  flexGrow: 1,
                  overflowY: "auto",
                  overflowX: "hidden",
                  p: 2,
                  maxHeight: "400px",
                  "&::-webkit-scrollbar": {
                    width: "8px",
                  },
                  "&::-webkit-scrollbar-track": { background: "#f1f1f1" },
                  "&::-webkit-scrollbar-thumb": {
                    background: "#888",
                    borderRadius: "4px",
                  },
                }}
              >
                {messages &&
                  messages?.map((message) => (
                    <MessageContainer key={message.id}>
                      <Avatar
                        sx={{ width: 40, height: 40 }}
                        src={`https://i.pravatar.cc/150?u=${
                          message.author?.id || ""
                        }`}
                      >
                        {paymentInfo.buyer_name || "Anonymous"}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="subtitle2">
                            {paymentInfo.buyer_name || "Anonymous"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(
                              new Date(parseInt(message.timestamp) * 1000),
                              "MMM d, h:mm a"
                            )}
                          </Typography>
                        </Box>
                        <MessageBubble
                          isAuthor={
                            message.author?.id
                              ? message.author?.id
                              : "default_id" === user?.id
                          }
                          elevation={0}
                        >
                          <div
                            dangerouslySetInnerHTML={{
                              __html:
                                typeof message.text === "string"
                                  ? message.text
                                  : "",
                            }}
                          ></div>
                          {Array.isArray(message.payload) &&
                            message.payload.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                {message.payload.map((item, index) => (
                                  <Typography
                                    key={index}
                                    variant="caption"
                                    color="inherit"
                                  >
                                    {item}
                                  </Typography>
                                ))}
                              </Box>
                            )}
                        </MessageBubble>
                      </Box>
                    </MessageContainer>
                  ))}
                <div ref={messagesEndRef} />
              </Box>

              <ChatInput>
                <IconButton size="small">
                  <AttachFile />
                </IconButton>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  variant="outlined"
                  placeholder="Type a message..."
                  size="small"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <SendIcon />
                </IconButton>
              </ChatInput>
            </Card>
          </Grid>
        </Grid>

        {/* Flag Issue Dialog */}
        <Dialog open={flagDialogOpen} onClose={() => setFlagDialogOpen(false)}>
          <DialogTitle>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FlagIcon color="warning" />
              <Typography variant="h6">Flag Trade Issue</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Issue Type</InputLabel>
                <Select
                  value={tradeStatus}
                  onChange={(e) => setTradeStatus(e.target.value)}
                  label="Issue Type"
                >
                  <MenuItem value="overpayment">Overpayment</MenuItem>
                  <MenuItem value="negative">Negative Feedback</MenuItem>
                  <MenuItem value="bad_rate">Bad Rate</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Please provide details about the issue..."
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setFlagDialogOpen(false)}
              sx={{ color: "text.secondary" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={handleFlagSubmit}
              startIcon={<FlagIcon />}
            >
              Submit Flag
            </Button>
          </DialogActions>
        </Dialog>

        {/* Alert Snackbar */}
        <Snackbar
          open={alertOpen}
          autoHideDuration={6000}
          onClose={() => setAlertOpen(false)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={() => setAlertOpen(false)}
            severity="warning"
            variant="filled"
            sx={{
              width: "100%",
              "& .MuiAlert-icon": {
                color: "inherit",
              },
            }}
          >
            Trade issue has been flagged. Supervisors have been notified.
          </Alert>
        </Snackbar>
      </Container>

      {/* Escalate Trade Dialog */}
      <EscalateTrade
        open={open}
        onClose={() => setOpen(false)}
        escalateData={{
          platform: assignedTrade?.platform || "unknown",
          assignedPayerId: user?.id || "default_id",
          escalatedById: user?.id || "default_id",
          amount: Number(assignedTrade?.amount) || 0,
          tradeHash: assignedTrade?.tradeHash || "unknown",
          tradeId: assignedTrade?.id,
        }}
      />
    </Box>
  );
};

export default PayerDashboard;
