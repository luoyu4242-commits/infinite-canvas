import { Clapperboard } from "lucide-react";
import { useDirectorStore } from "@/stores/canvas/use-director-store";
import type { CanvasNodeDefinition } from "@/types/canvas-plugin";

export const directorNode: CanvasNodeDefinition = {
    type: "xingcheng:director",
    title: "3D 导演台",
    description: "角色摆位、运镜预演，参考帧和视频回到画布",
    icon: <Clapperboard className="size-5" />,
    defaultSize: { width: 340, height: 220 },
    hidePanel: true,
    onDoubleClick: (context) => { useDirectorStore.getState().open(context); return true; },
    Content: ({ ctx }) => (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-5 text-center" style={{ color: ctx.theme.node.text }}>
            <Clapperboard className="size-10 opacity-65" />
            <div className="text-sm font-medium">{ctx.node.title}</div>
            <p className="text-xs" style={{ color: ctx.theme.node.muted }}>摆放角色与场景，规划机位和运动轨迹</p>
            <button type="button" className="rounded px-3 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/10" onPointerDown={(event) => event.stopPropagation()} onClick={() => useDirectorStore.getState().open(ctx)}>打开导演台</button>
        </div>
    ),
};
