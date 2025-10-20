import React from "react";
import { GlobalPaymentHub } from "../components/payments/GlobalPaymentHub";

// Safe re-export wrapper to avoid any build conflicts
export default function GlobalPaymentsSafe() {
  return <GlobalPaymentHub />;
}
