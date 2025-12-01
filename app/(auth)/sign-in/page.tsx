import SignInComponent from "@/components/auth/signIn";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your account",
};

export default function Page() {
  return (
    <div className="w-full h-full">
      <SignInComponent />
    </div>
  );
}
