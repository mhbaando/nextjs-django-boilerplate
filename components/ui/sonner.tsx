"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}

      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-red-500!",
          // Apply custom colors
          success: "!bg-[hsl(142,76%,95%)] !text-[hsl(142,76%,36%)] !border-[hsl(142,76%,85%)]",
          error: "!bg-[hsl(0,84%,95%)] text-red-500! !border-[hsl(0,84%,85%)]",
          info: "!bg-[hsl(221,91%,95%)] !text-[hsl(221,91%,46%)] !border-[hsl(221,91%,85%)]",
          warning: "!bg-[hsl(38,92%,95%)] !text-[hsl(38,92%,46%)] !border-[hsl(38,92%,85%)]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
