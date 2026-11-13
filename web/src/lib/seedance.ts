import i18n from "@/i18n";
import { modelOptionName, resolveModelChannel, type AiConfig } from "@/stores/use-config-store";
import { parseVideoResolution } from "@/lib/media-size";

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

// Display-only rules from the channel's /v1/logical-models; never rewrite generation parameters.
const perRequestModels: Record<string, { seconds: string[]; resolutions: string[]; notice: string }> = {
    "seedance-2-0-special": { seconds: ["15"], resolutions: ["480", "720"], notice: "special" },
    "seedance-2-0-9tu-special": { seconds: ["5", "10", "15"], resolutions: ["720"], notice: "nineStandard" },
    "seedance-2-0-manju-special": { seconds: ["5", "10", "15"], resolutions: ["720"], notice: "manju" },
};

export function seedanceBillingReminder(config: AiConfig, model = config.model) {
    const name = modelOptionName(model).toLowerCase();
    const rule = perRequestModels[name];
    if (!rule) return null;
    try {
        if (new URL(resolveModelChannel(config, model).baseUrl).hostname !== "cy.token6688.com") return null;
    } catch {
        return null;
    }
    const nineFast = name === "seedance-2-0-9tu-special" && selectedSeedanceTier(model, config.videoTier) === "fast";
    const seconds = nineFast ? ["10", "15"] : rule.seconds;
    const currentSeconds = String(Number(config.videoSeconds || "6"));
    const resolution = parseVideoResolution(config.vquality);
    const problems = [];
    if (!seconds.includes(currentSeconds)) problems.push(i18n.t("seedanceBilling.invalidSeconds", { value: currentSeconds, options: seconds.join(" / ") }));
    if (!rule.resolutions.includes(resolution)) problems.push(i18n.t("seedanceBilling.invalidResolution", { value: resolution, options: rule.resolutions.map((value) => `${value}p`).join(" / ") }));
    return { notice: i18n.t(`seedanceBilling.${nineFast ? "nineFast" : rule.notice}`), problems };
}
