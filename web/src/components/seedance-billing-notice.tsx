import { Info, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import { seedanceBillingReminder } from "@/lib/seedance";
import type { AiConfig } from "@/stores/use-config-store";

export function SeedanceBillingNotice({ config, model = config.model }: { config: AiConfig; model?: string }) {
    const { t } = useTranslation();
    const reminder = seedanceBillingReminder(config, model);
    if (!reminder) return null;
    const Icon = reminder.problems.length ? TriangleAlert : Info;
    return (
        <div role="status" className="flex items-start gap-1.5 py-1 text-xs leading-relaxed" onMouseDown={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
            <Icon className="mt-0.5 size-3.5 shrink-0 opacity-70" aria-hidden="true" />
            <div className="min-w-0 space-y-1">
                <p className="opacity-75">{reminder.notice}</p>
                {reminder.problems.length ? <p className="font-medium">{reminder.problems.join(" ")}{t("seedanceBilling.manualAdjustment")}</p> : null}
            </div>
        </div>
    );
}
