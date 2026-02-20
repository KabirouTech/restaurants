"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const OPTIONS = [
  { value: "this-month", label: "Ce Mois" },
  { value: "last-month", label: "Mois Dernier" },
  { value: "this-week", label: "Cette Semaine" },
] as const;

export function RevenueFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("revenueRange") || "this-month";
  const currentLabel = OPTIONS.find((o) => o.value === current)?.label || "Ce Mois";

  function handleSelect(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "this-month") {
      params.delete("revenueRange");
    } else {
      params.set("revenueRange", value);
    }
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "/dashboard", { scroll: false });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center text-xs text-muted-foreground font-medium hover:text-primary cursor-pointer transition-colors outline-none">
        {currentLabel} <ChevronDown className="h-3 w-3 ml-0.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={current === opt.value ? "font-bold text-primary" : ""}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
