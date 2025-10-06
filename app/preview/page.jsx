"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function PreviewPage() {
  const searchParams = useSearchParams();
  const previewUrl = decodeURIComponent(searchParams.get("preview_url") || "");

  useEffect(() => {
    if (previewUrl) {
      // Immediate redirect (no UI)
      window.location.replace(previewUrl);
    }
  }, [previewUrl]);

  // Nothing visible on screen
  return null;
}
