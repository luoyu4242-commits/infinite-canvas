import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { fetchPriceEstimate, preparePriceEstimate, type PriceEstimate, type PricingReferences } from "@/services/api/pricing";
import { useConfigStore, type AiConfig, type ModelCapability } from "@/stores/use-config-store";

export function usePriceEstimate(config: AiConfig, mode: ModelCapability, references?: PricingReferences, paused = false) {
    const { t } = useTranslation();
    // Proxy changes must invalidate estimates even when the caller holds a node config snapshot.
    useConfigStore((state) => state.config.proxyEnabled);
    useConfigStore((state) => state.config.proxyUrl);
    const prepared = preparePriceEstimate(config, mode, references);
    const request = prepared && "body" in prepared ? JSON.stringify({ url: prepared.url, apiKey: prepared.apiKey, body: prepared.body, modelSchemaUrl: prepared.modelSchemaUrl, panelEstimate: prepared.panelEstimate }) : "";
    const [revision, setRevision] = useState(0);
    const identity = useMemo(() => ({ request, revision, paused }), [request, revision, paused]);
    const [result, setResult] = useState<{ identity: typeof identity; data?: PriceEstimate; error?: string }>();

    useEffect(() => {
        if (!identity.request || identity.paused) return;
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            const { url, apiKey, body, modelSchemaUrl } = JSON.parse(identity.request);
            void fetchPriceEstimate(url, apiKey, body, controller.signal, modelSchemaUrl).then(
                (data) => { if (!controller.signal.aborted) setResult({ identity, data }); },
                (error: unknown) => { if (!controller.signal.aborted) setResult({ identity, error: error instanceof Error ? error.message : t("pricing.unavailable") }); },
            );
        }, 500);
        return () => { window.clearTimeout(timer); controller.abort(); };
    }, [identity, t]);

    const current = result?.identity === identity ? result : undefined;
    return {
        visible: prepared !== null,
        panelEstimate: Boolean(prepared && "panelEstimate" in prepared && prepared.panelEstimate),
        data: current?.data,
        error: prepared?.problem || current?.error,
        loading: Boolean(request && !paused && !current),
        paused,
        canRefresh: Boolean(request && !paused),
        refresh: () => setRevision((value) => value + 1),
    };
}
