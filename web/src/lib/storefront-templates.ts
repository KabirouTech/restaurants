export type StorefrontTemplate = "classic" | "bistro" | "catering" | "restaurant";

type SubscriptionPlan = "free" | "premium" | "enterprise" | string | null | undefined;

export interface StorefrontTemplateOption {
  id: StorefrontTemplate;
  name: string;
  summary: string;
  audience: string;
  badge: string;
  priceLabel: string;
  premiumOnly: boolean;
  previewClassName: string;
  previewSurfaceClassName: string;
  previewPrimaryClassName: string;
  previewSecondaryClassName: string;
}

export const DEFAULT_STOREFRONT_TEMPLATE: StorefrontTemplate = "classic";

export const STOREFRONT_TEMPLATE_OPTIONS: StorefrontTemplateOption[] = [
  {
    id: "classic",
    name: "Starter Fresh",
    summary: "Clean, modern storefront for any food business.",
    audience: "All businesses",
    badge: "Starter",
    priceLabel: "Included",
    premiumOnly: false,
    previewClassName: "from-amber-100 via-orange-100 to-white",
    previewSurfaceClassName: "bg-white/90",
    previewPrimaryClassName: "bg-emerald-600",
    previewSecondaryClassName: "bg-emerald-100",
  },
  {
    id: "bistro",
    name: "Midnight Chef",
    summary: "Dark cinematic layout inspired by premium restaurant brands.",
    audience: "Restaurants & chefs",
    badge: "Premium",
    priceLabel: "Premium",
    premiumOnly: true,
    previewClassName: "from-zinc-950 via-slate-900 to-orange-950",
    previewSurfaceClassName: "bg-zinc-900/95",
    previewPrimaryClassName: "bg-orange-500",
    previewSecondaryClassName: "bg-zinc-700",
  },
  {
    id: "catering",
    name: "Organic Market",
    summary: "Fresh green merchandising style with strong product highlights.",
    audience: "Caterers & food shops",
    badge: "Premium",
    priceLabel: "Premium",
    premiumOnly: true,
    previewClassName: "from-lime-100 via-emerald-100 to-teal-50",
    previewSurfaceClassName: "bg-lime-50/95",
    previewPrimaryClassName: "bg-emerald-700",
    previewSecondaryClassName: "bg-lime-200",
  },
  {
    id: "restaurant",
    name: "Amber Grill",
    summary: "Warm luxury style with strong hero storytelling and contrast.",
    audience: "Premium restaurants",
    badge: "Premium",
    priceLabel: "Premium",
    premiumOnly: true,
    previewClassName: "from-amber-200 via-orange-200 to-stone-100",
    previewSurfaceClassName: "bg-amber-50/95",
    previewPrimaryClassName: "bg-orange-700",
    previewSecondaryClassName: "bg-amber-300",
  },
];

export function isStorefrontTemplate(value: unknown): value is StorefrontTemplate {
  return typeof value === "string" && STOREFRONT_TEMPLATE_OPTIONS.some((template) => template.id === value);
}

export function isPremiumStorefrontTemplate(template: StorefrontTemplate): boolean {
  const option = STOREFRONT_TEMPLATE_OPTIONS.find((entry) => entry.id === template);
  return option?.premiumOnly === true;
}

export function canUseStorefrontTemplate(plan: SubscriptionPlan, template: StorefrontTemplate): boolean {
  if (!isPremiumStorefrontTemplate(template)) return true;
  return plan === "premium" || plan === "enterprise";
}

export function resolveStorefrontTemplate(
  templateFromSettings: unknown,
  plan: SubscriptionPlan
): StorefrontTemplate {
  const template = isStorefrontTemplate(templateFromSettings)
    ? templateFromSettings
    : DEFAULT_STOREFRONT_TEMPLATE;

  if (!canUseStorefrontTemplate(plan, template)) {
    return DEFAULT_STOREFRONT_TEMPLATE;
  }

  return template;
}
