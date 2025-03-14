import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Settings,
  BarChart2,
  Clock,
  DollarSign,
  Wallet,
  AlertCircle,
  FileText,
  CreditCard,
  Filter,
  History as HistoryIcon,
  Edit,
  Trash2,
  Clock as ClockIcon,
  Download,
  ChevronDown,
  BarChart,
} from "lucide-react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
} from "@mui/material";
import {
  getCurrentRates,
  getRaterRates,
  setRaterRates,
  turnOffAllOffers,
  turnOnAllOffers,
  updateOffersMargin,
} from "../../api/trade";
import Loading from "../../Components/Loading";
import MarketCard from "../../Components/MarketCard";
import FilterDialog from "../../Components/FilterDialog";
import toast from "react-hot-toast";
import { successStyles } from "../../lib/constants";
import ClockedAlt from "../../Components/ClockedAlt";
import { useUserContext } from "../../Components/ContextProvider";

const RaterDashboard = () => {
  // State Management
  const [isOnOffer, setIsOnOffer] = useState(true);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [editFilterDialogOpen, setEditFilterDialogOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const { user } = useUserContext();
  const [loading, setLoading] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [confirmOnOpen, setConfirmOnOpen] = useState(false);
  const [confirmOffOpen, setConfirmOffOpen] = useState(false);
  const [loadingOn, setLoadingOn] = useState(false);
  const [loadingOff, setLoadingOff] = useState(false);

  // Add these functions for handling offer states
  const handleTurnOnOffers = async () => {
    setLoadingOn(true);
    try {
      await turnOnAllOffers();
    } catch (error) {
    } finally {
      setLoadingOn(false);
      setConfirmOnOpen(false);
    }
  };

  const handleTurnOffOffers = async () => {
    setLoadingOff(true);
    try {
      const data = await turnOffAllOffers();
    } finally {
      setLoadingOff(false);
      setConfirmOffOpen(false);
    }
  };

  // Rate States
  const [rates, setRates] = useState({
    noonesRate: "",
    paxfulRate: "",
    binanceRate: "",
    binanceBtcNgn: "",
  });

  const [markup2, setMarkup2] = useState("");
  const [usdtNgnRate, setUsdtNgnRate] = useState("");
  const [calculatedRates, setCalculatedRates] = useState({
    sellingPrice: 0,
    paxfulCostPrice: 0,
    noonesCostPrice: 0,
    paxfulMarkup1: 0,
    noonesMarkup1: 0,
  });

  const calculateRates = () => {
    try {
      const binanceBtcUsdt = parseFloat(rates.binanceRate) || 0;
      const paxfulBtcUsdt = parseFloat(rates.paxfulRate) || 0;
      const noonesBtcUsdt = parseFloat(rates.noonesRate) || 0;
      const usdtNgn = parseFloat(usdtNgnRate) || 0;
      const markup2Value = parseFloat(markup2) || 0;

      // Calculate Selling Price: SELLING PRICE = BINANCE(BTC/USDT) X USDT NGN
      const sellingPrice = binanceBtcUsdt * usdtNgn;

      // Calculate Markup 1 for Paxful (Rule 1)
      // IF BINANCE < PAXFUL: PAXFUL MARKUP 1 = (PAXFUL(BTC/USDT) – BINANCE(BTC/USDT)) X USDT/NGN
      // ELSE PAXFULMARKUP 1 = 0
      const paxfulMarkup1 =
        binanceBtcUsdt < paxfulBtcUsdt
          ? (paxfulBtcUsdt - binanceBtcUsdt) * usdtNgn
          : 0;

      // Calculate Markup 1 for Noones (Rule 2)
      // IF BINANCE < NOONES: NOONESMARKUP 1 = (NOONES(BTC/USDT) – BINANCE(BTC/USDT)) X USDT/NGN
      // ELSE NOONESMARKUP 1 = 0
      const noonesMarkup1 =
        binanceBtcUsdt < noonesBtcUsdt
          ? (noonesBtcUsdt - binanceBtcUsdt) * usdtNgn
          : 0;

      // Calculate Cost Prices: COST PRICE = SELLING PRICE – MARKUP 1 – MARKUP 2
      const paxfulCostPrice = sellingPrice - paxfulMarkup1 - markup2Value;
      const noonesCostPrice = sellingPrice - noonesMarkup1 - markup2Value;

      setCalculatedRates({
        sellingPrice,
        paxfulCostPrice,
        noonesCostPrice,
        paxfulMarkup1,
        noonesMarkup1,
      });
    } catch (error) {
      console.error("Error calculating rates:", error);
      toast.error("Error calculating rates. Please check your inputs.");
    }
  };

  // Effect to recalculate rates whenever inputs change
  useEffect(() => {
    if (rates.binanceRate && usdtNgnRate && markup2) {
      calculateRates();
    }
  }, [rates, usdtNgnRate, markup2]);

  useEffect(() => {
    let interval;
    if (autoUpdate) {
      interval = setInterval(() => {
        fetchRates();
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [autoUpdate]);

  // Save rate settings to backend
  const saveRateSettings = async () => {
    try {
      const response = { success: true };
      await setRaterRates(
        calculatedRates.sellingPrice,
        calculatedRates.noonesCostPrice,
        calculatedRates.paxfulCostPrice,
        usdtNgnRate,
        markup2
      );

      if (response.success) {
        const paxfulMargin =
          ((calculatedRates.sellingPrice - calculatedRates.paxfulCostPrice) /
            calculatedRates.paxfulCostPrice) *
          100;

        const noonesMargin =
          ((calculatedRates.sellingPrice - calculatedRates.noonesCostPrice) /
            calculatedRates.noonesCostPrice) *
          100;
        const data = await updateOffersMargin(paxfulMargin, noonesMargin);
        toast.success("Rates saved successfully!", successStyles);
      } else {
      }
    } catch (error) {
      console.error("Error saving rate settings:", error);
    }
  };

  // Fetch current rates from backend
  const fetchRates = async () => {
    try {
      const [currentRates, raterRates] = await Promise.all([
        getCurrentRates(),
        getRaterRates(),
      ]);

      if (currentRates?.success) {
        setRates(currentRates.data);
      }

      if (raterRates?.success) {
        setMarkup2(raterRates.data.markup2);
        setUsdtNgnRate(raterRates.data.usdtNgnRate);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching rates:", error);
      toast.error("Error fetching rates");
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchRates();
  }, []);

  if (loading) return <Loading />;

  if (!user.clockedIn && user.userType !== "admin") {
    return <ClockedAlt />;
  }
  return (
    <div className="min-h-screen p-3 lg:p-3 space-y-6">
      {/* Market Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MarketCard
          platform="Binance"
          rate={rates?.binanceRate}
          change={2.34}
          lastUpdate="2m ago"
          logo="/binance.jpg"
          bgColor="bg-yellow-100"
          rate2={calculatedRates.sellingPrice}
        />
        <MarketCard
          platform="Paxful"
          rate={rates?.paxfulRate}
          change={-1.12}
          lastUpdate="1m ago"
          logo="/paxful.jpg"
          rate2={calculatedRates?.paxfulCostPrice}
          bgColor="bg-blue-100"
        />
        <MarketCard
          platform="Noones"
          rate={rates?.noonesRate}
          rate2={calculatedRates?.noonesCostPrice}
          change={0.87}
          lastUpdate="3m ago"
          logo="/noones.png"
          bgColor="bg-purple-100"
        />
      </div>
      {/* Rate Settings and Analysis Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rate Settings Card */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F8BC08]/10 flex items-center justify-center">
                <BarChart2 className="w-5 h-5 text-[#F8BC08]" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Rate Settings
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-500">Auto Update</span>
                  <div className="font-semibold text-gray-900">
                    {autoUpdate ? "Enabled" : "Disabled"}
                  </div>
                </div>
                <Switch
                  checked={autoUpdate}
                  onChange={(e) => setAutoUpdate(e.target.checked)}
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-500">
                    Selling Price (NGN)
                  </span>
                  <div className="font-semibold text-gray-900">
                    ₦{calculatedRates.sellingPrice.toLocaleString()}
                  </div>
                </div>
                <DollarSign className="w-5 h-5 text-[#F8BC08]" />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg flex flex-col gap-4">
              <TextField
                fullWidth
                label="Markup 2 (NAIRA)"
                variant="outlined"
                type="number"
                value={Number(markup2).toFixed(0)}
                onChange={(e) => setMarkup2(e.target.value)}
              />

              <TextField
                fullWidth
                label="USDT/NGN Rate"
                variant="outlined"
                type="number"
                value={Number(usdtNgnRate).toFixed(0)}
                onChange={(e) => setUsdtNgnRate(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-5 rounded-xl border mt-4 border-gray-100 flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="contained"
                onClick={saveRateSettings}
                sx={{
                  bgcolor: "#F8BC08",
                  "&:hover": { bgcolor: "#C6980C" },
                }}
              >
                Save Settings
              </Button>
            </div>
          </div>
          <Button
            variant="contained"
            onClick={() => setConfirmOnOpen(true)}
            sx={{
              bgcolor: "#4CAF50",
              "&:hover": { bgcolor: "#388E3C" },
              ml: 1,
            }}
            disabled={loadingOn}
          >
            {loadingOn ? "Processing..." : "Turn On Offers"}
          </Button>
          <Button
            variant="contained"
            onClick={() => setConfirmOffOpen(true)}
            sx={{
              bgcolor: "#F44336",
              "&:hover": { bgcolor: "#D32F2F" },
              ml: 1,
            }}
            disabled={loadingOff}
          >
            {loadingOff ? "Processing..." : "Turn Off Offers"}
          </Button>
        </div>

        {/* Cost Price Analysis Card */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#F8BC08]/10 flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-[#F8BC08]" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Cost Price Analysis
            </h2>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
              <div className="text-sm text-gray-500 mb-2">
                Platform Markup 1
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Paxful Markup 1</span>
                  <span className="text-sm font-medium">
                    ₦{calculatedRates.paxfulMarkup1.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Noones Markup 1</span>
                  <span className="text-sm font-medium">
                    ₦{calculatedRates.noonesMarkup1.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
              <div className="text-sm text-gray-500 mb-2">Cost Prices</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Paxful Cost Price
                  </span>
                  <span className="text-sm font-medium">
                    ₦{calculatedRates.paxfulCostPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Noones Cost Price
                  </span>
                  <span className="text-sm font-medium">
                    ₦{calculatedRates.noonesCostPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="text-sm text-gray-500 mb-1">Markup 2</div>
                <div className="font-semibold">
                  ₦{parseFloat(markup2).toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="text-sm text-gray-500 mb-1">USDT/NGN Rate</div>
                <div className="font-semibold">
                  ₦₦{parseFloat(usdtNgnRate).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <FilterDialog
        filterDialogOpen={filterDialogOpen}
        setFilterDialogOpen={setFilterDialogOpen}
      />
      <Dialog
        open={editFilterDialogOpen}
        onClose={() => setEditFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <div className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-[#F8BC08]" />
            <span>Edit Filter</span>
          </div>
        </DialogTitle>
        <DialogContent>
          <div className="mt-4 space-y-4">
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              value={selectedFilter?.username || ""}
              onChange={(e) =>
                setSelectedFilter({
                  ...selectedFilter,
                  username: e.target.value,
                })
              }
            />
            <TextField
              fullWidth
              label="Account Details"
              variant="outlined"
              value={selectedFilter?.accountDetails || ""}
              onChange={(e) =>
                setSelectedFilter({
                  ...selectedFilter,
                  accountDetails: e.target.value,
                })
              }
            />
            <FormControl fullWidth>
              <InputLabel>Filter Reason</InputLabel>
              <Select
                label="Filter Reason"
                value={selectedFilter?.reason || ""}
                onChange={(e) =>
                  setSelectedFilter({
                    ...selectedFilter,
                    reason: e.target.value,
                  })
                }
              >
                <MenuItem value="overpayment">Overpayment</MenuItem>
                <MenuItem value="negative">Negative Feedback</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions className="p-4">
          <Button
            onClick={() => setEditFilterDialogOpen(false)}
            sx={{ color: "gray" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setEditFilterDialogOpen(false);
              setSelectedFilter(null);
            }}
            sx={{
              bgcolor: "#F8BC08",
              "&:hover": { bgcolor: "#C6980C" },
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={confirmOnOpen}
        onClose={() => setConfirmOnOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Offer Activation</DialogTitle>
        <DialogContent>
          <div className="mt-4">
            Are you sure you want to turn ON all offers?
          </div>
        </DialogContent>
        <DialogActions className="p-4">
          <Button
            onClick={() => setConfirmOnOpen(false)}
            sx={{ color: "gray" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleTurnOnOffers}
            sx={{ bgcolor: "#4CAF50", "&:hover": { bgcolor: "#388E3C" } }}
            disabled={loadingOn}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmOffOpen}
        onClose={() => setConfirmOffOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Offer Deactivation</DialogTitle>
        <DialogContent>
          <div className="mt-4">
            Are you sure you want to turn OFF all offers?
          </div>
        </DialogContent>
        <DialogActions className="p-4">
          <Button
            onClick={() => setConfirmOffOpen(false)}
            sx={{ color: "gray" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleTurnOffOffers}
            sx={{ bgcolor: "#F44336", "&:hover": { bgcolor: "#D32F2F" } }}
            disabled={loadingOff}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default RaterDashboard;
