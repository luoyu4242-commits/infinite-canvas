import { Popover } from "antd";
import { Info, LoaderCircle, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { usePriceEstimate } from "@/hooks/use-price-estimate";
import type { PricingReferences } from "@/services/api/pricing";
import type { AiConfig, ModelCapability } from "@/stores/use-config-store";

export function GenerationPrice({ config, mode, references, count = 1, paused = false }: { config: AiConfig; mode: ModelCapability; references?: PricingReferences; count?: number; paused?: boolean }) {
    const { t, i18n } = useTranslation();
    const estimate = usePriceEstimate(config, mode, references, paused);
    if (!estimate.visible) return null;
    const money = (amount: number) => `${amount > 0 && amount < 0.000001 ? "<" : ""}${new Intl.NumberFormat(i18n.language, { style: "currency", currency: "CNY", maximumFractionDigits: 6 }).format(amount > 0 && amount < 0.000001 ? 0.000001 : amount)}`;
    const data = estimate.data;
    const rows = data ? [
        [t("pricing.single"), data.effective_total_rmb],
        [t("pricing.total", { count }), data.effective_total_rmb * count],
        [t("pricing.maximum"), data.max_effective_total_rmb === undefined ? undefined : data.max_effective_total_rmb * count],
        [t("pricing.freeze"), data.required_freeze_rmb === undefined ? undefined : data.required_freeze_rmb * count],
        [t("pricing.output"), data.price_basis?.output_rmb === undefined ? undefined : data.price_basis.output_rmb * count],
        [t("pricing.references"), data.price_basis?.reference_media_rmb === undefined ? undefined : data.price_basis.reference_media_rmb * count],
    ] as const : [];
    const details = (
        <div className="max-w-72 text-xs" onPointerDown={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}>
            {estimate.error ? <p>{estimate.error}</p> : null}
            <dl className="space-y-1.5">
                {rows.map(([label, amount]) => typeof amount === "number" && Number.isFinite(amount) && amount >= 0 ? <div key={label} className="flex justify-between gap-6"><dt className="opacity-65">{label}</dt><dd className="m-0 tabular-nums">{money(amount)}</dd></div> : null)}
            </dl>
            <p className="mt-2 opacity-65">{t("pricing.strategyNote")}</p>
            {data?.billing_mode === "token_metered" ? <p className="mt-2 opacity-65">{t("pricing.metered")}</p> : null}
            {Array.isArray(data?.param_adjustments) && data.param_adjustments.length ? <div className="mt-2"><p>{t("pricing.adjusted")}</p>{data.param_adjustments.map((item, index) => <p key={index} className="mt-1 break-words opacity-65">{item.param}: {JSON.stringify(item.requested)} → {JSON.stringify(item.applied)}</p>)}</div> : null}
        </div>
    );
    return (
        <div className="flex min-w-0 items-center gap-1 text-xs" onMouseDown={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
            <Popover content={details} trigger="click" placement="top" title={t("pricing.details")}>
                <button type="button" className="inline-flex min-w-0 cursor-pointer items-center gap-1.5 rounded px-1 py-1 text-left hover:bg-black/5 dark:hover:bg-white/10" aria-label={t("pricing.details")}>
                    {estimate.loading ? <LoaderCircle className="size-3 shrink-0 animate-spin" /> : <Info className="size-3 shrink-0 opacity-60" />}
                    <span aria-live="polite" className="truncate tabular-nums">{estimate.paused ? t("pricing.paused") : data ? t("pricing.estimate", { amount: money(data.effective_total_rmb * count) }) : t(estimate.loading ? "pricing.loading" : "pricing.unavailable")}</span>
                </button>
            </Popover>
            {estimate.canRefresh && !estimate.loading ? <button type="button" className="shrink-0 cursor-pointer rounded p-1 opacity-60 hover:bg-black/5 dark:hover:bg-white/10" onClick={estimate.refresh} aria-label={t("pricing.refresh")} title={t("pricing.refresh")}><RefreshCw className="size-3" /></button> : null}
        </div>
    );
}
