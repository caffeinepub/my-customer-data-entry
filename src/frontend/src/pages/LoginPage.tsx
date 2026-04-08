import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Phone, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";
import { useGenerateOtp, useVerifyOtp } from "../hooks/useQueries";

interface LoginPageProps {
  onLogin: (mobile: string, isAdmin: boolean, userName: string) => void;
}

const ADMIN_MOBILE = "8128111699";

export function LoginPage({ onLogin }: LoginPageProps) {
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [error, setError] = useState("");

  const { actor } = useActor();
  const generateOtp = useGenerateOtp();
  const verifyOtp = useVerifyOtp();

  const handleGetOtp = async () => {
    setError("");
    if (!/^\d{10}$/.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    try {
      const result = await generateOtp.mutateAsync(mobile);
      if (result === "NOT_REGISTERED") {
        setError(
          "This mobile number is not registered. Please contact the admin to create your account.",
        );
        return;
      }
      setGeneratedOtp(result);
      setStep("otp");
    } catch {
      setError("Failed to generate OTP. Please try again.");
    }
  };

  const handleVerify = async () => {
    setError("");
    if (!otpInput.trim()) {
      setError("Please enter the OTP code.");
      return;
    }
    try {
      const valid = await verifyOtp.mutateAsync({ mobile, otp: otpInput });
      if (valid) {
        // Fetch the user's name from the backend
        let userName = mobile === ADMIN_MOBILE ? "Administrator" : mobile;
        try {
          const fetchedName = await actor?.getUserName(mobile);
          if (fetchedName?.trim()) {
            userName = fetchedName;
          }
        } catch {
          // fallback to mobile if fetch fails
        }
        onLogin(mobile, mobile === ADMIN_MOBILE, userName);
      } else {
        setError("Invalid OTP, please try again.");
      }
    } catch {
      setError("Verification failed. Please try again.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.52 0.18 50) 0%, oklch(0.65 0.2 75) 50%, oklch(0.78 0.18 90) 100%)",
      }}
    >
      <div className="w-full max-w-sm">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
            style={{ background: "oklch(1 0 0 / 0.2)" }}
          >
            <ShieldCheck className="w-8 h-8" style={{ color: "white" }} />
          </div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: "white" }}
          >
            CustomerHub
          </h1>
          <p className="mt-1 text-sm" style={{ color: "oklch(1 0 0 / 0.8)" }}>
            {step === "mobile"
              ? "Enter your mobile number to sign in"
              : "Enter the OTP to verify"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-xl p-6 space-y-5">
          {step === "mobile" ? (
            <>
              <div className="space-y-2">
                <Label
                  htmlFor="mobile-input"
                  className="text-foreground font-semibold"
                >
                  Mobile Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="mobile-input"
                    data-ocid="login.mobile.input"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={mobile}
                    onChange={(e) => {
                      setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
                      setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleGetOtp()}
                    className="pl-9"
                  />
                </div>
              </div>

              {error && (
                <p className="text-destructive text-sm font-medium">{error}</p>
              )}

              <Button
                data-ocid="login.get-otp.button"
                className="w-full font-semibold"
                style={{
                  background:
                    "linear-gradient(90deg, oklch(0.52 0.18 50), oklch(0.65 0.2 75))",
                  color: "white",
                }}
                onClick={handleGetOtp}
                disabled={generateOtp.isPending || mobile.length !== 10}
              >
                {generateOtp.isPending ? "Generating…" : "Get OTP →"}
              </Button>
            </>
          ) : (
            <>
              {/* OTP Display */}
              <div
                className="rounded-xl p-4 text-center border-2"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.95 0.06 75), oklch(0.92 0.08 65))",
                  borderColor: "oklch(0.72 0.18 55)",
                }}
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                  Your OTP code is:
                </p>
                <p
                  className="text-4xl font-bold tracking-[0.3em]"
                  style={{ color: "oklch(0.45 0.18 50)" }}
                  data-ocid="login.otp-display"
                >
                  {generatedOtp}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Copy this code and enter it below
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="otp-input"
                  className="text-foreground font-semibold"
                >
                  Enter OTP
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="otp-input"
                    data-ocid="login.otp.input"
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter the code above"
                    value={otpInput}
                    onChange={(e) => {
                      setOtpInput(e.target.value);
                      setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                    className="pl-9"
                  />
                </div>
              </div>

              {error && (
                <p className="text-destructive text-sm font-medium">{error}</p>
              )}

              <Button
                data-ocid="login.verify.button"
                className="w-full font-semibold"
                style={{
                  background:
                    "linear-gradient(90deg, oklch(0.52 0.18 50), oklch(0.65 0.2 75))",
                  color: "white",
                }}
                onClick={handleVerify}
                disabled={verifyOtp.isPending}
              >
                {verifyOtp.isPending ? "Verifying…" : "Verify & Sign In"}
              </Button>

              <button
                type="button"
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  setStep("mobile");
                  setOtpInput("");
                  setGeneratedOtp("");
                  setError("");
                }}
              >
                ← Change mobile number
              </button>
            </>
          )}
        </div>

        <p
          className="text-center text-xs mt-6"
          style={{ color: "oklch(1 0 0 / 0.7)" }}
        >
          © {new Date().getFullYear()} My Customer Data Entry
        </p>
      </div>
    </div>
  );
}
