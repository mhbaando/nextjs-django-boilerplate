"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { generateVerificationToken } from "@/lib/verification";
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
import { useMutation } from "@tanstack/react-query";
import { signIn } from "next-auth/react";
import { Loader2, LogIn } from "lucide-react";
import {
  showErrorToast,
  showSuccessToast,
} from "@/components/ui/notifications";
import { useRouter, useSearchParams } from "next/navigation";

const FORM_SCHEMA = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(100),
});

type FormSchemaType = z.infer<typeof FORM_SCHEMA>;

interface SignInError {
  error?: string;
  message?: string;
  status: number;
  ok: boolean;
  url: string | null;
}

const SignInComponent = () => {
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

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormSchemaType) => {
      const res = await signIn("login", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (res?.error) throw res;
      return res;
    },

    onSuccess: () => {
      showSuccessToast({
        message: "You have been successfully signed in.",
      });
      router.push(callbackUrl);
    },
    onError: async (error: SignInError) => {
      // Parse the error.error if it's a JSON string (this is where NextAuth stores the error)
      let parsedError: {
        error?: boolean;
        change_password_required?: boolean;
        otp_required?: boolean;
        message?: string;
        email?: string;
      } | null = null;

      if (error.error) {
        try {
          parsedError = JSON.parse(error.error);
        } catch {
          // If parsing fails, use the string as is
          parsedError = { message: error.error };
        }
      }

      if (parsedError?.change_password_required) {
        const token = await generateVerificationToken(
          "password_change",
          parsedError.email!,
          callbackUrl,
        );
        // Redirect with secure token
        const redirectUrl = `/change-password?token=${encodeURIComponent(token)}`;
        console.log("Redirecting to:", redirectUrl);

        // Try router.push first, with fallback to window.location
        router.push(redirectUrl);

        // Fallback in case router.push doesn't work
        setTimeout(() => {
          if (window.location.pathname !== "/change-password") {
            window.location.href = redirectUrl;
          }
        }, 100);
        return;
      }

      if (parsedError?.otp_required) {
        const token = await generateVerificationToken(
          "otp",
          parsedError.email!,
          callbackUrl,
        );
        // Redirect to OTP verification page
        const redirectUrl = `/verify-otp?token=${encodeURIComponent(token)}`;
        console.log("Redirecting to:", redirectUrl);

        // Try router.push first, with fallback to window.location
        router.push(redirectUrl);

        // Fallback in case router.push doesn't work
        setTimeout(() => {
          if (window.location.pathname !== "/verify-otp") {
            window.location.href = redirectUrl;
          }
        }, 100);
        return;
      }

      console.log(error);
      showErrorToast({
        message:
          parsedError?.message ||
          error.error ||
          error.message ||
          "An error occurred.",
      });
    },
  });
  const onSubmit = (data: FormSchemaType) => {
    mutate(data);
  };

  return (
    <>
      <div className="w-full flex items-center  flex-col mb-5">
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

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            {isPending ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </Form>
    </>
  );
};

export default SignInComponent;
