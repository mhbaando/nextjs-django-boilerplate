import { Suspense } from "react";
import ChangePasswordComponent from "@/components/auth/change-password";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Change Password",
  description: "Reset your password, follow the instructions below.",
};

function ChangePasswordPageContent() {
  return (
    <div className="w-full h-full">
      <ChangePasswordComponent />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ChangePasswordPageContent />
    </Suspense>
  );
}
