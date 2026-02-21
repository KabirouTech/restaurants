import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string;
  className?: string;
}

function LogoMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { box: "h-7 w-7", text: "text-[9px]" },
    md: { box: "h-9 w-9", text: "text-[11px]" },
    lg: { box: "h-11 w-11", text: "text-sm" },
  };

  const s = sizes[size];

  return (
    <div
      className={cn(
        s.box,
        "shrink-0 flex items-center justify-center bg-gradient-to-br from-[#e67e22] to-[#8B4513]"
      )}
      style={{ borderRadius: "60% 35% 50% 40% / 40% 60% 30% 55%", transform: "rotate(-8deg)" }}
    >
      <span
        className={cn(s.text, "font-extrabold text-white leading-none")}
        style={{ transform: "rotate(8deg)", letterSpacing: "-0.03em" }}
      >
        rOS
      </span>
    </div>
  );
}

export function Logo({ size = "md", showText = true, href = "/", className }: LogoProps) {
  const content = (
    <span className={cn("flex items-center gap-2.5 group", className)}>
      <LogoMark size={size} />
      {showText && (
        <span className={cn(
          "font-serif font-bold tracking-tight",
          size === "sm" && "text-base",
          size === "md" && "text-lg",
          size === "lg" && "text-xl",
        )}>
          Restaurant<span className="text-primary">OS</span>
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

export { LogoMark };
