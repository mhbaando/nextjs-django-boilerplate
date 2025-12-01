"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { changePassword } from "@/actions/auth/login";
import { showErrorToast, showSuccessToast } from "../ui/notifications";
import { useSearchParams, useRouter } from "next/navigation";
import { validateVerificationParamsAction } from "@/lib/verification";

const FORM_SCHEMA = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: "Current password is required." }),
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter.",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter.",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number." })
      .regex(/[^A-Za-z0-9]/, {
        message: "Password must contain at least one special character.",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type FormSchemaType = z.infer<typeof FORM_SCHEMA>;

const ChangePasswordComponent = () => {
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FORM_SCHEMA),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [callbackUrl, setCallbackUrl] = useState<string>("/");
  const searchParams = useSearchParams();
  const watchedNewPassword = form.watch("newPassword");

  useEffect(() => {
    let strength = 0;
    if (watchedNewPassword) {
      if (watchedNewPassword.length >= 8) strength += 25;
      if (/[A-Z]/.test(watchedNewPassword)) strength += 25;
      if (/[0-9]/.test(watchedNewPassword)) strength += 25;
      if (/[^A-Za-z0-9]/.test(watchedNewPassword)) strength += 25;
    }
    setPasswordStrength(strength);
  }, [watchedNewPassword]);

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
      const result = await validateVerificationParamsAction(
        token,
        "password_change",
      );

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

      const res = await changePassword({
        email: email,
        current_password: data.currentPassword,
        new_password: data.newPassword,
      });

      if (res.error)
        throw new Error(res.message || "Failed to change password");
      return res;
    },

    onSuccess: () => {
      showSuccessToast({
        message: "Your password has been successfully changed.",
      });

      router.push(callbackUrl);
    },
    onError: (error: Error) => {
      showErrorToast({
        message: error.message || "Failed to change password",
      });
    },
  });

  const onSubmit = (data: FormSchemaType) => {
    mutate(data);
    // Handle change password logic here (e.g., API call)
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Change Password</h1>
        <p className="text-muted-foreground mt-2">
          Choose a new password for your account.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      autoComplete="current-password"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      autoComplete="new-password"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {watchedNewPassword && (
            <div className="space-y-2">
              <Progress value={passwordStrength} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Password Strength:{" "}
                {passwordStrength < 50
                  ? "Weak"
                  : passwordStrength < 75
                    ? "Medium"
                    : "Strong"}
              </p>
            </div>
          )}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Changing Password..." : "Change Password"}
          </Button>
        </form>
      </Form>
    </>
  );
};

export default ChangePasswordComponent;
