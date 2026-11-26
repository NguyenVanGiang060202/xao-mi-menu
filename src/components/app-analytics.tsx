"use client";

import { useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { initTrackingOptOut, isTrackingOptedOut } from "@/lib/tracking-optout";

export function AppAnalytics() {
  useEffect(() => {
    initTrackingOptOut();
  }, []);

  return (
    <Analytics
      beforeSend={(event) => {
        if (isTrackingOptedOut()) {
          // Bỏ qua không gửi sự kiện lên Vercel Analytics nếu thiết bị đã bật chế độ loại trừ hoặc là Admin
          return null;
        }
        return event;
      }}
    />
  );
}
