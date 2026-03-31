"use client";

import { useEffect, useState, Suspense } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, LogIn } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import z from "zod";

import {
  type DeviceInfoPayload,
  signInAction,
} from "@/actions/auth/signInAction";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  showErrorToast,
  showSuccessToast,
} from "@/components/ui/notifications";
import { getFullDeviceInfo } from "@/lib/deviceInfo";

const FORM_SCHEMA = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(100),
});

type FormSchemaType = z.infer<typeof FORM_SCHEMA>;

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FORM_SCHEMA),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfoPayload | null>(null);

  useEffect(() => {
    const loadDeviceInfo = async () => {
      const deviceData = await getFullDeviceInfo();

      const normalizedDeviceInfo: DeviceInfoPayload = {
        platform: deviceData.platform || "Browser",
        os: deviceData.os || "Unknown",
        device: deviceData.device || "Unknown",
        browser: deviceData.browser || "Unknown",
        ip: deviceData.ip_address || "",
        city: deviceData.city || "Unknown",
        country: deviceData.country || "Unknown",
      };

      setDeviceInfo(normalizedDeviceInfo);
    };

    loadDeviceInfo();
  }, []);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormSchemaType) => {
      if (!deviceInfo) {
        return {
          error: true as const,
          message: "Device information is still loading. Please try again.",
        };
      }

      return signInAction({
        ...data,
        deviceInfo,
        callbackUrl,
      });
    },

    onSuccess: (data) => {
      if (data.error) {
        showErrorToast({
          message: data.message,
        });
        return;
      }

      if ("changePasswordRequired" in data && data.changePasswordRequired) {
        router.push(data.redirectUrl);
        return;
      }

      if ("otpRequired" in data && data.otpRequired) {
        router.push(data.redirectUrl);
        return;
      }

      showSuccessToast({
        message: "You are now signed in.",
      });
      router.push(callbackUrl);
    },
  });

  const onSubmit = (data: FormSchemaType) => {
    mutate(data);
  };

  return (
    <>
      <div className="mb-5 flex w-full flex-col items-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="name@example.com"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Enter your email address</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input placeholder="••••••••" type="password" {...field} />
                </FormControl>
                <FormDescription>Enter your password</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !deviceInfo}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            {isPending
              ? "Signing In..."
              : !deviceInfo
                ? "Preparing device..."
                : "Sign In"}
          </Button>
        </form>
      </Form>
    </>
  );
}

export default SignInComponent;
