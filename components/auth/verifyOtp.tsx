"use client";

import { useEffect, useState, Suspense } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import z from "zod";

import { verifyOtpAction } from "@/actions/auth/verifyOtp";
import { getFullDeviceInfo, type DeviceInfo } from "@/lib/deviceInfo";
import { validateVerificationParamsAction } from "@/lib/verification";

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
import {
  showErrorToast,
  showSuccessToast,
} from "@/components/ui/notifications";

const FORM_SCHEMA = z.object({
  otp: z.string().min(6, {
    message: "Your one-time password must be 6 characters.",
  }),
});

type FormSchemaType = z.infer<typeof FORM_SCHEMA>;

interface OtpDeviceInfo {
  platform: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  city: string;
  country: string;
}

function VerifyOtpContent() {
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

  const [deviceInfo, setDeviceInfo] = useState<OtpDeviceInfo | null>(null);

  useEffect(() => {
    const loadDeviceInfo = async () => {
      const info: DeviceInfo = await getFullDeviceInfo();

      const transformedInfo: OtpDeviceInfo = {
        platform: info.platform || "Browser",
        device: info.device || "Unknown",
        browser: info.browser || "Unknown",
        os: info.os || "Unknown",
        ip: info.ip_address || "",
        city: info.city || "Unknown",
        country: info.country || "Unknown",
      };

      setDeviceInfo(transformedInfo);
    };

    loadDeviceInfo();
  }, []);

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
    mutationFn: async ({ otp }: { otp: string }) => {
      if (!email) {
        return {
          error: true as const,
          message: "Email is missing. Please restart sign-in.",
        };
      }

      if (!deviceInfo) {
        return {
          error: true as const,
          message: "Device information is still loading. Please try again.",
        };
      }

      return verifyOtpAction({
        email,
        code: otp,
        deviceInfo,
      });
    },

    onSuccess: (data) => {
      if (data.error) {
        showErrorToast({
          message: data.message,
        });
        return;
      }

      showSuccessToast({
        message: "OTP verified successfully!",
      });

      // Redirect to the callback URL or home page
      router.push(callbackUrl);
    },
    onError: (error: Error) => {
      showErrorToast({
        message: error.message || "Failed to verify OTP",
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
        <Button
          type="submit"
          className="w-full"
          disabled={isPending || !email || !deviceInfo}
        >
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
}

const VerifyOtpComponent = () => {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
};

export default VerifyOtpComponent;
