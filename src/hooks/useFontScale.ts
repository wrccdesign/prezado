import { useEffect, useState } from "react";

export type FontScale = "default" | "large" | "larger";

const STORAGE_KEY = "honorifico-font-scale";
const SCALE_CLASSES: Record<FontScale, string> = {
  default: "font-scale-default",
  large: "font-scale-large",
  larger: "font-scale-larger",
};

const isFontScale = (value: string | null): value is FontScale =>
  value === "default" || value === "large" || value === "larger";

export function applyFontScale(scale: FontScale) {
  const root = document.documentElement;
  root.classList.remove(...Object.values(SCALE_CLASSES));
  root.classList.add(SCALE_CLASSES[scale]);
}

export function getStoredFontScale(): FontScale {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isFontScale(stored) ? stored : "default";
}

export function useFontScale() {
  const [scale, setScaleState] = useState<FontScale>(() => getStoredFontScale());

  useEffect(() => {
    applyFontScale(scale);
  }, [scale]);

  const setScale = (nextScale: FontScale) => {
    window.localStorage.setItem(STORAGE_KEY, nextScale);
    applyFontScale(nextScale);
    setScaleState(nextScale);
  };

  return { scale, setScale };
}