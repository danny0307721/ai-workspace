"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type DateFormat = "mdy" | "dmy" | "iso";
export type FontSize = "small" | "standard" | "large";
export type TableDensity = "comfortable" | "compact";

type AppSettings = {
  dateFormat: DateFormat;
  fontSize: FontSize;
  tableDensity: TableDensity;
};

type SettingsContextValue = {
  settings: AppSettings;
  updateSetting: <Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) => void;
  resetSettings: () => void;
};

const storageKey = "ledger-ai-settings";
const defaultSettings: AppSettings = {
  dateFormat: "mdy",
  fontSize: "standard",
  tableDensity: "comfortable",
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function readSettings(): AppSettings {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? "null") as Partial<AppSettings> | null;
    if (!stored) return defaultSettings;
    return {
      dateFormat: stored.dateFormat === "dmy" || stored.dateFormat === "iso" ? stored.dateFormat : "mdy",
      fontSize: stored.fontSize === "small" || stored.fontSize === "large" ? stored.fontSize : "standard",
      tableDensity: stored.tableDensity === "compact" ? "compact" : "comfortable",
    };
  } catch {
    return defaultSettings;
  }
}

export function formatLedgerDate(value: string | Date, format: DateFormat) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  if (format === "iso") return `${year}-${month}-${day}`;
  return format === "dmy" ? `${day}/${month}/${year}` : `${month}/${day}/${year}`;
}

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSettings(readSettings());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.fontSize = settings.fontSize;
    document.documentElement.dataset.tableDensity = settings.tableDensity;
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings));
    } catch {
      // Settings still apply for this session if storage is unavailable.
    }
  }, [ready, settings]);

  function updateSetting<Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function resetSettings() {
    setSettings(defaultSettings);
  }

  return <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>{children}</SettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useAppSettings must be used within AppSettingsProvider");
  return context;
}