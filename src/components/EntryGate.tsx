"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { hasEnteredThisSession } from "@/lib/entry-session";

type Props = {
  children: ReactNode;
};

/** 未从开场页进入本会话时，拦回 `/`，避免真题壳闪一下。 */
export function EntryGate({ children }: Props) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!hasEnteredThisSession()) {
      router.replace("/");
      return;
    }
    setAllowed(true);
  }, [router]);

  if (!allowed) {
    return <div className="entry-gate entry-gate--boot" aria-hidden />;
  }

  return children;
}
