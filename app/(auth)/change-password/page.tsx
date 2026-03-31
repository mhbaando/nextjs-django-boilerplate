import ChangePasswordComponent from "@/components/auth/change-password";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Change Password",
  description: "Reset your password, follow the instructions below.",
};

export default function Page() {
  return (
    <div className="w-full h-full">
      <ChangePasswordComponent />
    </div>
  );
}
