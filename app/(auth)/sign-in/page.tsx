import SignInComponent from "@/components/auth/signIn";
import { Metadata } from "next";

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
