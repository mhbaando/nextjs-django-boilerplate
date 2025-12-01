"use client";
import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { useMutation } from "@tanstack/react-query";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2 } from "lucide-react";
import {
  showErrorToast,
  showSuccessToast,
} from "@/components/ui/notifications";
import { validateVerificationParamsAction } from "@/lib/verification";

const FORM_SCHEMA = z.object({
  otp: z.string().min(6, {
    message: "Your one-time password must be 6 characters.",
  }),
});

type FormSchemaType = z.infer<typeof FORM_SCHEMA>;

interface VerifyOtpError {
  error?: string;
  message?: string;
  status: number;
  ok: boolean;
  url: string | null;
}

const VerifyOtpComponent: React.FC = () => {
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FORM_SCHEMA),
    defaultValues: {
      otp: "",
    },
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string | null>(null);
  const [callbackUrl, setCallbackUrl] = useState<string>("/");

  useEffect(() => {
    const validateSession = async () => {
      const token = searchParams.get("token");

      if (!token) {
        showErrorToast({
          message: "Missing verification token",
        });
        router.replace("/sign-in");
        return;
      }

      // We use our server action to securely validate the token
      const result = await validateVerificationParamsAction(token, "otp");

      if (!result.valid || !result.email) {
        showErrorToast({
          message: result.error || "Invalid or expired verification link",
        });
        router.replace("/sign-in");
        return;
      }

      // On success, we set the email and callback URL
      setEmail(result.email);
      if (result.callbackUrl) {
        setCallbackUrl(result.callbackUrl);
      }
    };

    validateSession();
  }, [searchParams, router]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormSchemaType) => {
      if (!email) throw new Error("Email is required");

      const res = await signIn("otp", {
        email: email,
        otp_code: data.otp,
        redirect: false,
      });

      if (res?.error) throw res;
      return res;
    },

    onSuccess: () => {
      showSuccessToast({
        message: "OTP verified successfully!",
      });

      // Redirect to the callback URL or home page
      router.push(callbackUrl);
    },
    onError: async (error: VerifyOtpError) => {
      // Parse the error.error if it's a JSON string (this is where NextAuth stores the error)
      let parsedError: {
        error?: boolean;
        message?: string;
      } | null = null;

      if (error.error) {
        try {
          parsedError = JSON.parse(error.error);
        } catch {
          // If parsing fails, use the string as is
          parsedError = { message: error.error };
        }
      }

      showErrorToast({
        message:
          parsedError?.message ||
          error.error ||
          error.message ||
          "Failed to verify OTP",
      });
    },
  });

  const onSubmit = (data: FormSchemaType) => {
    mutate(data);
  };

  const { handleSubmit, control } = form;

  return (
    <Form {...form}>
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Check your email</h1>
        <p className="text-muted-foreground mt-2">
          We&apos;ve sent a 6-digit code to {email || "your email"}
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={control}
          name="otp"
          render={({ field }) => (
            <FormItem className="flex flex-col items-center">
              <FormControl>
                <InputOTP maxLength={6} {...field}>
                  <InputOTPGroup className="gap-4">
                    <InputOTPSlot
                      index={0}
                      className="h-11 rounded-md border"
                    />
                    <InputOTPSlot
                      index={1}
                      className="h-11 rounded-md border"
                    />
                    <InputOTPSlot
                      index={2}
                      className="h-11 rounded-md border"
                    />
                    <InputOTPSlot
                      index={3}
                      className="h-11 rounded-md border"
                    />
                    <InputOTPSlot
                      index={4}
                      className="h-11 rounded-md border"
                    />
                    <InputOTPSlot
                      index={5}
                      className="h-11 rounded-md border"
                    />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending || !email}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify OTP"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default VerifyOtpComponent;
