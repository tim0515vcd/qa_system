"use client";

import {useLocale} from "next-intl";
import {usePathname, useRouter} from "@/i18n/navigation";
import {cn} from "@/lib/utils";

const locales = [
  {value: "zh-TW", label: "中"},
  {value: "en", label: "EN"},
] as const;

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="inline-flex rounded-xl border bg-white p-1 shadow-sm">
      {locales.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => router.replace(pathname, {locale: item.value})}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition",
            locale === item.value
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}