"use client";

import { UAParser } from "ua-parser-js";

export interface DeviceInfo {
  platform: string;
  os: string;
  device: string;
  browser: string;
  tenant?: string;
  ip_address?: string;
  city?: string;
  country?: string;
}

function getClientDeviceInfo(): Pick<
  DeviceInfo,
  "platform" | "os" | "device" | "browser"
> {
  const parser = new UAParser(navigator.userAgent);
  const result = parser.getResult();

  return {
    platform: "Browser",
    os: result.os.name
      ? `${result.os.name} (${result.os.version || "unknown"})`
      : "Unknown",
    device:
      result.device.vendor ||
      result.device.model ||
      (result.device.type === "mobile" ? "Mobile" : "Desktop"),
    browser: result.browser.name
      ? `${result.browser.name} (${result.browser.version || ""})`
      : "Unknown",
  };
}

export async function getFullDeviceInfo(): Promise<DeviceInfo> {
  const client = getClientDeviceInfo();

  let server: Partial<DeviceInfo> = {};
  try {
    const res = await fetch("/api/device-info", {
      cache: "no-store",
    });
    server = await res.json();
  } catch {}

  return {
    ...client,
    ...server,
  } as DeviceInfo;
}
