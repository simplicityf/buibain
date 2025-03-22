import { useEffect, useState, useCallback, useMemo } from "react";
import { BarChart2, Edit, RefreshCw } from "lucide-react";
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
  CircularProgress,
} from "@mui/material";
import {
  getCurrentRates,
  getRaterRates,
  setRaterRates,
  turnOffAllOffers,
  turnOnAllOffers,
  updateOffersMargin,
  getOffersMargin, // new API call for margin data
} from "../../api/trade";
import Loading from "../../Components/Loading";
import MarketCard from "../../Components/MarketCard";
import FilterDialog from "../../Components/FilterDialog";
import toast from "react-hot-toast";
import { successStyles } from "../../lib/constants";
import { useUserContext } from "../../Components/ContextProvider";

// Define interface for filter object
interface FilterType {
  username: string;
  accountDetails: string;
  reason: string;
}

// Define interface for margin data from API
interface MarginData {
  crypto_currency?: string;
  platform?: string;
  margin: number;
}

const RaterDashboard = () => {
  // State Management
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [editFilterDialogOpen, setEditFilterDialogOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType | null>(null);
  const { user } = useUserContext();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);

  // Offers toggle state
  const [offersActive, setOffersActive] = useState(false);
  const [offersLoading, setOffersLoading] = useState(false);

  // New state for offer confirmation modal
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [pendingOfferValue, setPendingOfferValue] = useState(false);

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

  // New state for margin data
  const [marginData, setMarginData] = useState<MarginData[]>([]);
  const [marginLoading, setMarginLoading] = useState(false);

  const calculateRates = useCallback(() => {
    try {
      const binanceBtcUsdt = parseFloat(rates.binanceRate) || 0;
      const paxfulBtcUsdt = parseFloat(rates.paxfulRate) || 0;
      const noonesBtcUsdt = parseFloat(rates.noonesRate) || 0;
      const usdtNgn = parseFloat(usdtNgnRate) || 0;
      const markup2Value = parseFloat(markup2) || 0;

      // SELLING PRICE = BINANCE(BTC/USDT) x USDT NGN
      const sellingPrice = binanceBtcUsdt * usdtNgn;

      // Markup 1 calculations
      const paxfulMarkup1 =
        binanceBtcUsdt < paxfulBtcUsdt
          ? (paxfulBtcUsdt - binanceBtcUsdt) * usdtNgn
          : 0;
      const noonesMarkup1 =
        binanceBtcUsdt < noonesBtcUsdt
          ? (noonesBtcUsdt - binanceBtcUsdt) * usdtNgn
          : 0;

      // Cost Prices = SELLING PRICE – MARKUP 1 – MARKUP 2
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
  }, [rates, usdtNgnRate, markup2]);

  useEffect(() => {
    if (rates.binanceRate && usdtNgnRate && markup2) {
      calculateRates();
    }
  }, [rates, usdtNgnRate, markup2, calculateRates]);

  // Auto-update rates every 60 seconds if enabled
  useEffect(() => {
    let interval: number | undefined;
    if (autoUpdate) {
      interval = window.setInterval(() => {
        fetchRates();
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [autoUpdate]);

  const saveRateSettings = async () => {
    try {
      const response = await setRaterRates(
        calculatedRates.sellingPrice,
        calculatedRates.noonesCostPrice,
        calculatedRates.paxfulCostPrice,
        usdtNgnRate,
        markup2
      );
      if (response?.success) {
        const data = await updateOffersMargin();
        if (data && "success" in data && data.success) {
          toast.success("Rates saved successfully!", successStyles);
          toast.success("Margin updated successfully!", successStyles);
        } else {
          toast.error("Failed to update margin");
        }
      } else {
        toast.error("Failed to save rates");
      }
    } catch (error) {
      console.error("Error saving rate settings:", error);
    }
  };

  // Fetch current rates from backend
  const fetchRates = async () => {
    try {
      setRefreshing(true);
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
    } catch (error) {
      console.error("Error fetching rates:", error);
      toast.error("Error fetching rates");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Fetch offers margin data from backend with loading state
  const fetchMarginData = async () => {
    try {
      setMarginLoading(true);
      const res = await getOffersMargin();
      if (res?.success) {
        setMarginData(res.data);
      }
    } catch (error) {
      console.error("Error fetching margin data:", error);
      toast.error("Error fetching margin data");
    } finally {
      setMarginLoading(false);
    }
  };

  // Initial fetch for rates and margin data
  useEffect(() => {
    fetchRates();
    fetchMarginData();
  }, []);

  // Handler to open confirmation modal for offers toggle
  const handleOfferSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setPendingOfferValue(newValue);
    setOfferModalOpen(true);
  };

  // Confirm handler for the offer toggle
  const confirmOfferToggle = async () => {
    setOfferModalOpen(false);
    setOffersLoading(true);
    try {
      let response;
      if (offersActive) {
        // Currently active → turn OFF offers
        response = await turnOffAllOffers();
        if (response?.success) {
          toast.success("Offers turned off successfully", successStyles);
          setOffersActive(false);
        } else {
          toast.error("Failed to turn off offers");
        }
      } else {
        // Currently inactive → turn ON offers
        response = await turnOnAllOffers();
        if (response?.success) {
          toast.success("Offers turned on successfully", successStyles);
          setOffersActive(true);
        } else {
          toast.error("Failed to turn on offers");
        }
      }
    } catch (error) {
      toast.error("Error toggling offers");
      console.error(error);
    } finally {
      setOffersLoading(false);
    }
  };

  // Cancel handler for the offer toggle modal
  const cancelOfferToggle = () => {
    setOfferModalOpen(false);
  };

  // Group marginData by platform (paxful & noones) and crypto currency (BTC and USDT)
  const groupedMargins = useMemo(() => {
    const result: Record<string, { BTC?: number; USDT?: number }> = {};
    marginData.forEach((entry) => {
      const platform = entry.platform?.toLowerCase();
      if (!platform) return;
      if (!result[platform]) result[platform] = {};
      if (entry.crypto_currency?.toUpperCase() === "BTC") {
        result[platform].BTC = entry.margin;
      }
      if (entry.crypto_currency?.toUpperCase() === "USDT") {
        result[platform].USDT = entry.margin;
      }
    });
    return result;
  }, [marginData]);

  if (loading) return <Loading />;
  if (!user) return <Loading />;

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
          rate2={calculatedRates.paxfulCostPrice}
          bgColor="bg-blue-100"
        />
        <MarketCard
          platform="Noones"
          rate={rates?.noonesRate}
          rate2={calculatedRates.noonesCostPrice}
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
            <div className="flex items-center gap-2">
              <Button
                variant="contained"
                onClick={fetchRates}
                disabled={refreshing}
                className="flex items-center gap-2"
                sx={{
                  bgcolor: "#F8BC08",
                  "&:hover": { bgcolor: "#C6980C" },
                }}
              >
                {refreshing ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "Refresh"
                )}
              </Button>
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
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg flex flex-col gap-4">
              <TextField
                fullWidth
                label="Markup 2 (NAIRA)"
                variant="outlined"
                type="number"
                value={markup2}
                onChange={(e) => setMarkup2(e.target.value)}
              />
              <TextField
                fullWidth
                label="USDT/NGN Rate"
                variant="outlined"
                type="number"
                value={usdtNgnRate}
                onChange={(e) => setUsdtNgnRate(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-5 rounded-xl border mt-4 border-gray-100 flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="contained"
                onClick={saveRateSettings}
                sx={{ bgcolor: "#F8BC08", "&:hover": { bgcolor: "#C6980C" } }}
              >
                Save Settings
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm font-medium">Offers</span>
            <Switch
              checked={offersActive}
              onChange={handleOfferSwitchChange}
              disabled={offersLoading}
            />
            {offersLoading && <CircularProgress size={20} />}
          </div>
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
                  <span className="text-sm text-gray-600">
                    Paxful Markup 1
                  </span>
                  <span className="text-sm font-medium">
                    ₦{calculatedRates.paxfulMarkup1.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Noones Markup 1
                  </span>
                  <span className="text-sm font-medium">
                    ₦{calculatedRates.noonesMarkup1.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Borderless Responsive Table for Margin Data */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-sm text-gray-500">
                      Platforms
                    </th>
                    <th className="px-4 py-2 text-left text-sm text-gray-500">
                      Cost Prices
                    </th>
                    <th className="px-4 py-2 text-left text-sm text-gray-500">
                      M/BTC
                      <Button onClick={fetchMarginData} size="small">
                        {marginLoading ? <CircularProgress size={16} /> : <RefreshCw />}
                      </Button>
                    </th>
                    <th className="px-4 py-2 text-left text-sm text-gray-500">
                      M/USDT
                      <Button onClick={fetchMarginData} size="small">
                        {marginLoading ? <CircularProgress size={16} /> : <RefreshCw />}
                      </Button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Paxful Row */}
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-600">Paxful</td>
                    <td className="px-4 py-2 text-sm font-medium">
                      ₦{calculatedRates.paxfulCostPrice.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-sm font-medium">
                      {groupedMargins.paxful && groupedMargins.paxful.BTC !== undefined
                        ? groupedMargins.paxful.BTC
                        : "-"}%
                    </td>
                    <td className="px-4 py-2 text-sm font-medium">
                      {groupedMargins.paxful && groupedMargins.paxful.USDT !== undefined
                        ? groupedMargins.paxful.USDT
                        : "-"}%
                    </td>
                  </tr>
                  {/* Noones Row */}
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-600">Noones</td>
                    <td className="px-4 py-2 text-sm font-medium">
                      ₦{calculatedRates.noonesCostPrice.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-sm font-medium">
                      {groupedMargins.noones && groupedMargins.noones.BTC !== undefined
                        ? groupedMargins.noones.BTC
                        : "-"}%
                    </td>
                    <td className="px-4 py-2 text-sm font-medium">
                      {groupedMargins.noones && groupedMargins.noones.USDT !== undefined
                        ? groupedMargins.noones.USDT
                        : "-"}%
                    </td>
                  </tr>
                </tbody>
              </table>
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
                  ₦{parseFloat(usdtNgnRate).toLocaleString()}
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

      {/* Edit Filter Dialog */}
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
                  ...selectedFilter!,
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
                  ...selectedFilter!,
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
                    ...selectedFilter!,
                    reason: e.target.value as string,
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
          <Button onClick={() => setEditFilterDialogOpen(false)} sx={{ color: "gray" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setEditFilterDialogOpen(false);
              setSelectedFilter(null);
            }}
            sx={{ bgcolor: "#F8BC08", "&:hover": { bgcolor: "#C6980C" } }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Offer Confirmation Modal */}
      <Dialog open={offerModalOpen} onClose={cancelOfferToggle}>
        <DialogTitle>Confirm Offer Toggle</DialogTitle>
        <DialogContent>
          <p>
            Are you sure you want to turn offers {pendingOfferValue ? "ON" : "OFF"}?
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelOfferToggle} sx={{ color: "gray" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={confirmOfferToggle}
            sx={{ bgcolor: "#F8BC08", "&:hover": { bgcolor: "#C6980C" } }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default RaterDashboard;
