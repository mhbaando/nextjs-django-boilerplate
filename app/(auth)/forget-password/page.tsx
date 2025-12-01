import ForgetPasswordComponent from "@/components/auth/forgetPassword";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your password, follow the instructions below.",
};

export default function Page() {
  return (
    <div className="w-full h-full">
      <ForgetPasswordComponent />
    </div>
  );
}
