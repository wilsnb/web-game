"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { RoomState } from "./room";

/**
 * Subscribes to a room's shared state via Supabase Realtime.
 *  - Loads the current state once on mount.
 *  - Then listens for Postgres changes on that room row and updates live.
 * Returns the latest shared state (or null while loading) + a connection flag.
 */
export function useRoom(code: string): {
  state: RoomState | null;
  connected: boolean;
} {
  const [state, setState] = useState<RoomState | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!code) return;
    const supabase = createSupabaseBrowserClient();
    let active = true;

    // 1. Initial load of the current shared state.
    supabase
      .from("rooms")
      .select("state")
      .eq("code", code)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data?.state) setState(data.state as RoomState);
      });

    // 2. Live updates: any change to this room row pushes the new state.
    const channel = supabase
      .channel(`room:${code}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `code=eq.${code}`,
        },
        (payload) => {
          const next = (payload.new as { state?: RoomState } | null)?.state;
          if (active && next) setState(next);
        }
      )
      .subscribe((status) => {
        if (active) setConnected(status === "SUBSCRIBED");
      });

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [code]);

  return { state, connected };
}
