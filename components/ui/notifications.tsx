"use client";

import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";

interface ToastOptions {
  title?: string;
  message: string;
}

/**
 * Displays a success toast notification.
 * @param {ToastOptions} options - The options for the toast.
 * @param {string} [options.title="Success"] - The title of the toast.
 * @param {string} options.message - The main message of the toast.
 */
export const showSuccessToast = ({ title = "Success", message }: ToastOptions) => {
  toast.success(title, {
    description: message,
    icon: <CheckCircle className="h-5 w-5" />,
    duration: 3000,
  });
};

/**
 * Displays an error toast notification.
 * @param {ToastOptions} options - The options for the toast.
 * @param {string} [options.title="Error"] - The title of the toast.
 * @param {string} options.message - The main message of the toast.
 */
export const showErrorToast = ({ title = "Error", message }: ToastOptions) => {
  toast.error(title, {
    description: message,
    icon: <XCircle className="h-5 w-5" />,
    duration: 5000,
  });
};
