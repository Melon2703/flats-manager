"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function CurrentMonth({ loading }: { loading: string }) {
  const router = useRouter();
  useEffect(() => {
    const date = new Date();
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const url = new URL(window.location.href);
    url.searchParams.set("month", month);
    router.replace(`${url.pathname}${url.search}${url.hash}`);
  }, [router]);
  return (
    <p className="month-resolving" role="status">
      {loading}
    </p>
  );
}
