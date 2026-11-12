import axios from "axios";

import i18n from "@/i18n";
import { buildApiUrl, resolveModelRequestConfig, resolveModelScript, type AiConfig, type ModelCapability } from "@/stores/use-config-store";
import type { ReferenceImage } from "@/types/image";
import type { ReferenceAudio, ReferenceVideo } from "@/types/media";
import { imageRequestParams } from "./image";
import { videoRequestParams } from "./video";

export type PricingReferences = { referenceImages?: ReferenceImage[]; referenceVideos?: ReferenceVideo[]; referenceAudios?: ReferenceAudio[] };
export type PriceEstimate = {
    effective_total_rmb: number;
    max_effective_total_rmb?: number;
    required_freeze_rmb?: number;
    billing_mode?: string;
    price_basis?: { output_rmb?: number; reference_media_rmb?: number };
    param_adjustments?: Array<{ param: string; requested: unknown; applied: unknown; reason: string }>;
};

export function supportsPriceEstimate(baseUrl: string) {
    try {
        return new URL(baseUrl).hostname === "cy.token6688.com";
    } catch {
        return false;
    }
}

/** One actual generation request; callers multiply by the number of independent requests. */
export function preparePriceEstimate(config: AiConfig, mode: ModelCapability, references: PricingReferences = {}) {
    const channel = resolveModelRequestConfig(config, config.model);
    if (!supportsPriceEstimate(channel.baseUrl) || (mode !== "image" && mode !== "video")) return null;
    const fail = (key: string) => ({ problem: i18n.t(`pricing.${key}`) });
    if (!channel.apiKey.trim()) return fail("missingKey");
    if (resolveModelScript(config, config.model)) return fail("scriptUnsupported");
    if (channel.apiFormat !== "openai") return fail("protocolUnsupported");
    const images = references.referenceImages || [];
    const videos = mode === "video" ? references.referenceVideos || [] : [];
    const audios = mode === "video" ? references.referenceAudios || [] : [];
    const imageUrls = images.map((image) => image.url || image.dataUrl);
    const videoUrls = videos.map((video) => video.url);
    const audioUrls = audios.map((audio) => audio.url);
    if ([...imageUrls, ...videoUrls, ...audioUrls].some((url) => !/^https?:\/\//i.test(url))) return fail("publicReferencesRequired");
    if (videos.some((video) => !Number.isFinite(video.durationMs) || !video.durationMs || video.durationMs < 0)) return fail("durationRequired");
    try {
        const params = mode === "image" ? { ...imageRequestParams(channel), n: 1 } : videoRequestParams(channel, images.length);
        return {
            problem: "",
            url: buildApiUrl(channel.baseUrl, "/pricing-estimate"),
            apiKey: channel.apiKey,
            body: {
                model: channel.model,
                modality: mode,
                strategy: "balanced",
                params: {
                    ...params,
                    ...(imageUrls.length ? { images: imageUrls } : {}),
                    ...(videoUrls.length ? { videos: videoUrls, video_total_duration_sec: videos.reduce((total, video) => total + video.durationMs! / 1000, 0) } : {}),
                    ...(audioUrls.length ? { audios: audioUrls } : {}),
                },
            },
        };
    } catch (error) {
        return { problem: error instanceof Error ? error.message : i18n.t("pricing.unavailable") };
    }
}

export async function fetchPriceEstimate(url: string, apiKey: string, body: unknown, signal: AbortSignal): Promise<PriceEstimate> {
    try {
        const { data } = await axios.post<PriceEstimate>(url, body, { headers: { Authorization: `Bearer ${apiKey}` }, signal });
        if (!data || typeof data.effective_total_rmb !== "number" || !Number.isFinite(data.effective_total_rmb) || data.effective_total_rmb < 0) throw new Error(i18n.t("pricing.invalidResponse"));
        return data;
    } catch (error) {
        if (axios.isCancel(error)) throw error;
        // Do not expose Axios config (which contains the key) or provider HTML in the UI.
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 429) throw new Error(i18n.t("pricing.rateLimited"));
            throw new Error(i18n.t("pricing.requestFailed", { status: error.response?.status || i18n.t("pricing.network") }));
        }
        throw error;
    }
}
