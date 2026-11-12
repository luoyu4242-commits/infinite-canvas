import i18n from "@/i18n";
import { modelOptionName } from "@/stores/use-config-store";

export const seedanceTiers = ["mini", "fast", "standard"] as const;
export type SeedanceTier = (typeof seedanceTiers)[number];

// Values verified against /v1/logical-models param_schema.quality; display names are not API values.
const models: Record<string, { defaultTier: SeedanceTier; values: Partial<Record<SeedanceTier, string>> }> = {
    "seedance-2-0-official": { defaultTier: "mini", values: { mini: "mini", fast: "fast", standard: "标准" } },
    "seedance-2-0-promo": { defaultTier: "fast", values: { mini: "mini", fast: "fast", standard: "标准" } },
    "seedance-2-0-special": { defaultTier: "mini", values: { mini: "标准", fast: "快速", standard: "高清" } },
    "seedance-2-0-9tu-special": { defaultTier: "fast", values: { fast: "Fast", standard: "标准" } },
};

export function seedanceTierConfig(model: string) {
    return models[modelOptionName(model).toLowerCase()];
}

export function selectedSeedanceTier(model: string, tier: string) {
    return tier || seedanceTierConfig(model)?.defaultTier || "";
}

export function seedanceTierLabel(model: string, tier: string) {
    return seedanceTierConfig(model) ? i18n.t(`settingsPanels.video.tiers.${selectedSeedanceTier(model, tier)}`) : "";
}

export function seedanceQuality(model: string, tier: string) {
    const definition = seedanceTierConfig(model);
    if (!definition) return undefined;
    const value = definition.values[selectedSeedanceTier(model, tier) as SeedanceTier];
    if (!value) throw new Error(i18n.t("settingsPanels.video.tierUnavailable"));
    return value;
}
