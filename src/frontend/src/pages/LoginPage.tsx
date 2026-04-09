import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2, Phone, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useActor, waitForActor } from "../hooks/useActor";
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

  const { actor, isFetching: actorLoading } = useActor();
  const isConnecting = actorLoading && !actor;

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
          "This mobile number is not registered. Please contact the admin.",
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
        let userName = mobile === ADMIN_MOBILE ? "Administrator" : mobile;
        try {
          const resolvedActor = await waitForActor(() => actor, 8000);
          const fetchedName = await resolvedActor.getUserName(mobile);
          if (fetchedName?.trim()) {
            userName = fetchedName;
          }
        } catch {
          // fallback to mobile if fetch fails
        }
        onLogin(mobile, mobile === ADMIN_MOBILE, userName);
      } else {
        setError("Invalid OTP. Please try again.");
      }
    } catch {
      setError("Verification failed. Please try again.");
    }
  };

  const handleBack = () => {
    setStep("mobile");
    setOtpInput("");
    setGeneratedOtp("");
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-primary">
      {/* Background gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.52 0.18 50) 0%, oklch(0.65 0.2 75) 50%, oklch(0.78 0.18 90) 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg bg-primary-foreground/20">
            <ShieldCheck className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary-foreground">
            CustomerHub
          </h1>
          <p className="mt-1.5 text-sm text-primary-foreground/80">
            {step === "mobile"
              ? "Enter your mobile number to sign in"
              : "A one-time code has been generated for you"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-2xl p-6 space-y-5">
          {/* Connecting state */}
          {isConnecting && (
            <div
              className="flex items-center gap-2 text-sm text-muted-foreground justify-center py-1"
              data-ocid="login.connecting-indicator"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Connecting to server…</span>
            </div>
          )}

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
                    disabled={generateOtp.isPending}
                    aria-describedby={error ? "login-error" : undefined}
                  />
                </div>
                {mobile.length > 0 && mobile.length < 10 && (
                  <p className="text-xs text-muted-foreground">
                    {mobile.length}/10 digits entered
                  </p>
                )}
              </div>

              {error && (
                <p
                  id="login-error"
                  className="text-destructive text-sm font-medium"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <Button
                data-ocid="login.get-otp.button"
                className="w-full font-semibold text-primary-foreground"
                style={{
                  background:
                    "linear-gradient(90deg, oklch(0.52 0.18 50), oklch(0.65 0.2 75))",
                }}
                onClick={handleGetOtp}
                disabled={
                  generateOtp.isPending || mobile.length !== 10 || isConnecting
                }
              >
                {generateOtp.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating OTP…
                  </span>
                ) : isConnecting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting…
                  </span>
                ) : (
                  "Get OTP →"
                )}
              </Button>
            </>
          ) : (
            <>
              {/* OTP Display Box */}
              <div
                className="rounded-xl p-4 text-center border-2 border-primary/40 bg-accent"
                data-ocid="login.otp-display-box"
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Your OTP Code
                </p>
                <p
                  className="text-4xl font-bold tracking-[0.35em] text-primary"
                  data-ocid="login.otp-display"
                >
                  {generatedOtp}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Copy this code and enter it in the field below
                </p>
              </div>

              {/* OTP Input */}
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
                    placeholder="Enter the code shown above"
                    value={otpInput}
                    onChange={(e) => {
                      setOtpInput(e.target.value);
                      setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                    className="pl-9"
                    disabled={verifyOtp.isPending}
                    autoFocus
                    aria-describedby={error ? "otp-error" : undefined}
                  />
                </div>
              </div>

              {error && (
                <p
                  id="otp-error"
                  className="text-destructive text-sm font-medium"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <Button
                data-ocid="login.verify.button"
                className="w-full font-semibold text-primary-foreground"
                style={{
                  background:
                    "linear-gradient(90deg, oklch(0.52 0.18 50), oklch(0.65 0.2 75))",
                }}
                onClick={handleVerify}
                disabled={verifyOtp.isPending || !otpInput.trim()}
              >
                {verifyOtp.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying…
                  </span>
                ) : (
                  "Verify & Sign In"
                )}
              </Button>

              <button
                type="button"
                data-ocid="login.back.button"
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                onClick={handleBack}
              >
                ← Change mobile number
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6 text-primary-foreground/70">
          © {new Date().getFullYear()} My Customer Data Entry. Built with love
          using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
