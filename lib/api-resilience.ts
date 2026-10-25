import { NextResponse } from "next/server";

export type ApiVersion = "v1" | "v2";

export interface ApiVersionOptions {
  version: ApiVersion;
  deprecated?: boolean;
  sunsetDate?: string;
}

export function getApiVersionInfo(version: ApiVersion = "v1"): ApiVersionOptions {
  if (version === "v1") {
    return {
      version: "v1",
      deprecated: false,
    };
  }
  return {
    version,
    deprecated: false,
  };
}

export function applyApiVersionHeaders(
  res: NextResponse,
  options: ApiVersionOptions
): NextResponse {
  res.headers.set("X-API-Version", options.version);
  if (options.deprecated) {
    res.headers.set("Deprecation", "true");
    if (options.sunsetDate) {
      res.headers.set("Sunset", options.sunsetDate);
    }
  }
  return res;
}

// ===== GRACEFUL DEGRADATION MODE =====
let degradationModeActive = false;

export function isDegradationActive(): boolean {
  return degradationModeActive;
}

export function setDegradationMode(active: boolean) {
  degradationModeActive = active;
}
