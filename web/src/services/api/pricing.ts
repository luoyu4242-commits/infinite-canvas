import axios from "axios";

import i18n from "@/i18n";
import { buildApiUrl, resolveModelRequestConfig, resolveModelScript, type AiConfig, type ModelCapability } from "@/stores/use-config-store";
import type { ReferenceImage } from "@/types/image";
import type { ReferenceAudio, ReferenceVideo } from "@/types/media";
import { imageRequestParams } from "./image";
import { videoPluginParams, videoRequestParams } from "./video";

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

/** One panel-configured generation request; custom scripts may change the actual request. */
export function preparePriceEstimate(config: AiConfig, mode: ModelCapability, references: PricingReferences = {}) {
    const channel = resolveModelRequestConfig(config, config.model);
    if (!supportsPriceEstimate(channel.baseUrl) || (mode !== "image" && mode !== "video")) return null;
    const fail = (key: string) => ({ problem: i18n.t(`pricing.${key}`) });
    if (!channel.apiKey.trim()) return fail("missingKey");
    const script = resolveModelScript(config, config.model);
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
        const seedance = mode === "video" && channel.model.startsWith("seedance-");
        const params = mode === "image" ? { ...imageRequestParams(channel), n: 1 } : seedance
            ? seedancePriceParams(channel, images.length, Boolean(videos.length || audios.length))
            : videoRequestParams(channel, images.length);
        return {
            problem: "",
            panelEstimate: Boolean(script),
            modelSchemaUrl: seedance ? buildApiUrl(channel.baseUrl, `/skills/models/${encodeURIComponent(channel.model)}`) : undefined,
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

type EstimateBody = { model: string; modality: string; strategy: string; params: Record<string, unknown> };
type ModelParameter = { name: string; options?: Array<{ value: string | number | boolean }> };

function seedancePriceParams(config: AiConfig, imageCount: number, hasReferenceMedia: boolean) {
    const video = videoPluginParams(config, imageCount);
    const referenceMode = video.mode === "reference" || hasReferenceMedia;
    return {
        duration: Number(video.seconds),
        resolution: video.resolution,
        aspect_ratio: video.ratio,
        quality: video.quality,
        generate_audio: video.generateAudio,
        watermark: video.watermark,
        mode: referenceMode ? "reference" : imageCount === 2 ? "first-last" : imageCount ? "first-frame" : "text-to-video",
    };
}

export async function fetchPriceEstimate(url: string, apiKey: string, body: EstimateBody, signal: AbortSignal, modelSchemaUrl?: string): Promise<PriceEstimate> {
    try {
        const options = { headers: { Authorization: `Bearer ${apiKey}` }, signal };
        if (modelSchemaUrl) {
            // Mirror the Seedance template's declared parameters, defaults and option values.
            const { data: model } = await axios.get<{ params: ModelParameter[] }>(modelSchemaUrl, options);
            if (!Array.isArray(model?.params)) throw new Error(i18n.t("pricing.invalidModelSchema"));
            const fields = new Map(model.params.map((field) => [field.name, field]));
            const params: Record<string, unknown> = {};
            for (const [name, value] of Object.entries(body.params)) {
                if (value === undefined || value === null || value === "") continue;
                if (name === "video_total_duration_sec") { params[name] = value; continue; }
                const field = fields.get(name);
                if (!field && Array.isArray(value) && value.length) throw new Error(i18n.t("pricing.invalidParameter", { param: name, value: i18n.t("pricing.referenceMedia") }));
                if (!field) continue;
                if (!field.options?.length) { params[name] = value; continue; }
                const candidates = name === "mode" && value === "first-last" ? ["first-last", "first-last-frame", "first-last-frames", "首尾帧", "first-frame", "image-to-video", "图生视频"] : [value];
                const selected = candidates.map((candidate) => field.options!.find((item) => String(item.value).toLowerCase() === String(candidate).toLowerCase())).find(Boolean);
                if (!selected) throw new Error(i18n.t("pricing.invalidParameter", { param: name, value: String(value) }));
                params[name] = selected.value;
            }
            body = { ...body, params };
        }
        const { data } = await axios.post<PriceEstimate>(url, body, options);
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
