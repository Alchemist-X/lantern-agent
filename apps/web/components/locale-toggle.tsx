"use client";

import { useLocale } from "../lib/locale-context";

export function LocaleToggle() {
  const { locale, toggleLocale } = useLocale();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className="dash-locale-toggle"
      aria-label={locale === "en" ? "Switch to Chinese" : "Switch to English"}
      title={locale === "en" ? "切换到中文" : "Switch to English"}
    >
      {locale === "en" ? "中文" : "EN"}
    </button>
  );
}
