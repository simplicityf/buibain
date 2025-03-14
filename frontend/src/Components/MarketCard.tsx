import { Refresh } from "@mui/icons-material";
import { AlertCircle } from "lucide-react";

const MarketCard = ({
  platform,
  rate,
  change,
  lastUpdate,
  logo,
  bgColor,
  rate2,
}: {
  platform: string;
  rate: string;
  change: number;
  lastUpdate: string;
  logo: string;
  bgColor: string;
  rate2?: number;
}) => (
  <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300">
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
        <div
          className={`w-[100px] h-12 rounded-lg flex items-center justify-center`}
        >
          <img
            src={logo}
            alt={platform}
            className="w-max h-max object-cover object-center"
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{platform}</h3>
          <div className="flex items-center text-sm text-gray-500">
            BTC/USDT
            <AlertCircle className="w-3 h-3 ml-1 text-blue-500" />
          </div>
        </div>
      </div>

      <button className="p-2 rounded-lg bg-[#F8BC08]/10 hover:bg-blue-100 transition-colors">
        <Refresh className="w-4 h-4 text-[#F8BC08]" />
      </button>
    </div>

    <div className="bg-gray-50 p-5 rounded-xl flex justify-start items-start gap-3 flex-col border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-900">
        ${Number(rate).toLocaleString()}
      </h2>
      <div>
        <h2 className="text-xl font-bold text-gray-700">
          ₦ {Number(rate2 || 0).toLocaleString()}{" "}
          <span className="text-[14px]">BTC/NGN</span>
        </h2>
      </div>
    </div>
  </div>
);

export default MarketCard;
