import { Metadata } from "next";
import VerifyOtpComponent from "@/components/auth/verifyOtp";
export const metadata: Metadata = {
  title: "Verify OTP",
  description: "Verify OTP to access your account",
};

export default function Page() {
  return (
    <div className="w-full h-full">
      <VerifyOtpComponent />
    </div>
  );
}
