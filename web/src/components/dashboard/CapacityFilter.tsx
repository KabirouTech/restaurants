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
  { value: "this-week", label: "Cette Semaine" },
  { value: "last-week", label: "Semaine Dernière" },
  { value: "next-week", label: "Semaine Prochaine" },
] as const;

export function CapacityFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("capacityRange") || "this-week";
  const currentLabel = OPTIONS.find((o) => o.value === current)?.label || "Cette Semaine";

  function handleSelect(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "this-week") {
      params.delete("capacityRange");
    } else {
      params.set("capacityRange", value);
    }
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "/dashboard", { scroll: false });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center text-sm text-muted-foreground font-medium hover:text-primary cursor-pointer transition-colors outline-none">
        {currentLabel} <ChevronDown className="h-4 w-4 ml-1" />
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
