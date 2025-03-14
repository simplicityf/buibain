import React, {
  useState,
  FormEvent,
  ClipboardEvent,
  ChangeEvent,
  KeyboardEvent,
  useEffect,
} from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MdLockOutline } from "react-icons/md";
import { handleApiError, verify2fa } from "../api/user";
import { useUserContext } from "../Components/ContextProvider";
import { ResInterface } from "../lib/interface";
import { BASE_URL, loadingStyles, successStyles } from "../lib/constants";
import axios from "axios";

const TwoFactorAuth: React.FC = () => {
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [email, setEmail] = useState<string>("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { setUser, user } = useUserContext();
  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    const newCode = [...code];

    if (/^\d$/.test(value) || value === "") {
      newCode[index] = value;
      setCode(newCode);
      if (value && index < 5) {
        (
          document.getElementById(`code-${index + 1}`) as HTMLInputElement
        )?.focus();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    const newCode = [...code];
    if (e.key === "Backspace" && index > 0 && !code[index]) {
      newCode[index - 1] = "";
      setCode(newCode);
      (
        document.getElementById(`code-${index - 1}`) as HTMLInputElement
      )?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasteData = e.clipboardData.getData("text").trim();
    if (pasteData.length === 6 && /^\d{6}$/.test(pasteData)) {
      setCode(pasteData.split(""));
      (document.getElementById(`code-5`) as HTMLInputElement)?.focus();
    }
    e.preventDefault();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (code.join("").length < 6) {
      return toast.error("Incomplete Code!");
    }
    setLoading(true);
    try {
      toast.loading("Verify 2FA...", loadingStyles);
      const res: ResInterface = await axios.post(
        `${BASE_URL}/user/verify-2fa`,
        { twoFaCode: code.join(""), email },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      toast.dismiss();
      toast.success(res.data.message, successStyles);
      setUser(res.data.data);
      navigate("/");
    } catch (error) {
      toast.dismiss();
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user !== null) {
      navigate("/");
      return;
    }
    const email = searchParams.get("email");
    if (!email) {
      navigate("/login");
      return;
    } else {
      setEmail(email);
    }
  }, []);
  return (
    <div className="w-[100vw] min-h-[100vh] flex flex-col md:flex-row justify-between items-center bg-white">
      <div
        className="w-full md:w-[40%] h-max md:h-[100vh] gradient-background flex flex-col justify-between items-center"
        style={{
          borderRadius: "30px",
          borderTopLeftRadius: "0px",
          borderBottomLeftRadius: "0px",
        }}
      >
        <div className="w-max h-full flex justify-center items-center">
          <img
            src="/logo.png"
            alt="Bibuain Logo"
            className="h-[200px] sm:h-[300px] object-cover object-center z-[1000]"
          />
        </div>
      </div>

      <div className="w-[60%] h-full flex justify-center items-center p-[20px]">
        <div className="flex flex-col items-center gap-[30px]">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <MdLockOutline className="text-[50px] text-primary2 bg-[#F5F5F54D] border border-gray-700/10 rounded-full p-1" />
              <div className="flex gap-1">
                <div
                  className="bg-primary w-[10px] h-[10px] cursor-pointer rounded-full"
                  onClick={() => navigate("/login")}
                ></div>
                <div className="bg-primary2 w-[10px] h-[10px] rounded-full"></div>
              </div>
            </div>
            <div className="w-[22rem] h-max flex justify-center items-center flex-col">
              <div className="font-bold uppercase text-[30px] text-center w-[20rem]">
                Two Factor Authentication
              </div>
              <div className="text-text2 font-primary ">
                Enter the code sent on your mail
              </div>
            </div>
          </div>

          <form
            className="flex flex-col items-center w-[20rem] gap-[20px]"
            onSubmit={handleSubmit}
          >
            <div className="flex justify-center mb-6">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-12 mx-2 text-center text-2xl border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                />
              ))}
            </div>
            <button
              disabled={loading}
              type="submit"
              className="button-gradient w-full h-[3rem] rounded-md text-white font-semibold text-[20px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Next"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuth;
