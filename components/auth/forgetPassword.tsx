"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";

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

const FORM_SCHEMA = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

type FormSchemaType = z.infer<typeof FORM_SCHEMA>;

const ForgetPasswordComponent = () => {
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FORM_SCHEMA),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: FormSchemaType) => {
    console.log("Password reset requested for:", data.email);
    // Handle password reset logic here (e.g., API call)
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Forgot Password?</h1>
        <p className="text-muted-foreground mt-2">
          No worries, we&apos;ll send you reset instructions.
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
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">
            Send Reset Email
          </Button>
        </form>
      </Form>
    </>
  );
};

export default ForgetPasswordComponent;
