"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useProfile } from "@/features/profile/use-profile";

const SKIN_KEY = "chackers:piece-skin";
const COACH_KEY_PREFIX = "chackers:coach-usage";
const CHANGE_EVENT = "chackers:pro-change";

export const FREE_COACH_REPORT_LIMIT = 3;

export type PieceSkin = {
  id: "classic" | "neon" | "nomad" | "minimal";
  name: string;
  proOnly: boolean;
};

export const pieceSkins: PieceSkin[] = [
  { id: "classic", name: "Classic", proOnly: false },
  { id: "neon", name: "Neon", proOnly: true },
  { id: "nomad", name: "Nomad", proOnly: true },
  { id: "minimal", name: "Minimal", proOnly: true },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function coachUsageKey() {
  return `${COACH_KEY_PREFIX}:${todayKey()}`;
}

function readCoachUsage() {
  if (typeof window === "undefined") {
    return 0;
  }

  try {
    const value = Number(localStorage.getItem(coachUsageKey()) ?? 0);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  } catch {
    return 0;
  }
}

function readSkin(): PieceSkin["id"] {
  if (typeof window === "undefined") {
    return "classic";
  }

  try {
    const value = localStorage.getItem(SKIN_KEY);
    return pieceSkins.some((skin) => skin.id === value)
      ? (value as PieceSkin["id"])
      : "classic";
  } catch {
    return "classic";
  }
}

export function emitProAccessChange() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useProAccess() {
  const { profile } = useProfile();
  const isPro = Boolean(profile?.is_pro);
  const [coachReportsUsed, setCoachReportsUsed] = useState(() =>
    readCoachUsage(),
  );
  const [selectedSkin, setSelectedSkinState] =
    useState<PieceSkin["id"]>("classic");

  const refresh = useCallback(() => {
    const nextSkin = readSkin();

    setCoachReportsUsed(readCoachUsage());
    setSelectedSkinState(isPro || nextSkin === "classic" ? nextSkin : "classic");
  }, [isPro]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refresh();
    }, 0);

    function handleChange() {
      refresh();
    }

    window.addEventListener("storage", handleChange);
    window.addEventListener(CHANGE_EVENT, handleChange);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", handleChange);
      window.removeEventListener(CHANGE_EVENT, handleChange);
    };
  }, [refresh]);

  const coachReportsRemaining = isPro
    ? Infinity
    : Math.max(0, FREE_COACH_REPORT_LIMIT - coachReportsUsed);

  const canUseSkin = useCallback(
    (skinId: PieceSkin["id"]) => {
      const skin = pieceSkins.find((item) => item.id === skinId);
      return Boolean(skin && (!skin.proOnly || isPro));
    },
    [isPro],
  );

  const setSelectedSkin = useCallback(
    (skinId: PieceSkin["id"]) => {
      const nextSkin = canUseSkin(skinId) ? skinId : "classic";
      localStorage.setItem(SKIN_KEY, nextSkin);
      setSelectedSkinState(nextSkin);
      emitProAccessChange();
    },
    [canUseSkin],
  );

  const recordCoachReport = useCallback(() => {
    if (isPro) {
      return true;
    }

    const current = readCoachUsage();
    if (current >= FREE_COACH_REPORT_LIMIT) {
      setCoachReportsUsed(current);
      return false;
    }

    const next = current + 1;
    localStorage.setItem(coachUsageKey(), next.toString());
    setCoachReportsUsed(next);
    emitProAccessChange();
    return true;
  }, [isPro]);

  return useMemo(
    () => ({
      canUseSkin,
      coachReportsRemaining,
      coachReportsUsed,
      isPro,
      pieceSkins,
      proStartedAt: profile?.pro_started_at ?? null,
      recordCoachReport,
      selectedSkin,
      setSelectedSkin,
    }),
    [
      canUseSkin,
      coachReportsRemaining,
      coachReportsUsed,
      isPro,
      profile?.pro_started_at,
      recordCoachReport,
      selectedSkin,
      setSelectedSkin,
    ],
  );
}
