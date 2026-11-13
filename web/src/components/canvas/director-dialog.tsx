import { useEffect, useRef, useState } from "react";
import { App, Button, Modal, Select, Spin } from "antd";
import { useParams } from "react-router-dom";
import { Clapperboard, ImagePlus, Video } from "lucide-react";
import { nanoid } from "nanoid";
import { canvasThemes } from "@/lib/canvas-theme";
import { fitNodeSize } from "@/lib/canvas/canvas-node-size";
import { imageMetadata, videoMetadata } from "@/lib/canvas/canvas-node-factory";
import { uploadImage } from "@/services/image-storage";
import { uploadMediaFile } from "@/services/file-storage";
import { useDirectorStore } from "@/stores/canvas/use-director-store";
import { useThemeStore } from "@/stores/use-theme-store";
import { CanvasNodeType } from "@/types/canvas";
import type { CanvasNodeContext } from "@/types/canvas-plugin";

type Reply = Record<string, unknown>;
type Pending = { action: string; resolve: (data: Reply) => void; reject: (error: Error) => void };

export function DirectorDialog() {
    const context = useDirectorStore((s) => s.context);
    const { id } = useParams();
    useEffect(() => () => useDirectorStore.getState().close(), [id]);
    return context ? <DirectorEditor key={context.node.id} context={context} /> : null;
}

function DirectorEditor({ context }: { context: CanvasNodeContext }) {
    const { message } = App.useApp();
    const themeName = useThemeStore((s) => s.theme);
    const theme = canvasThemes[themeName];
    const iframe = useRef<HTMLIFrameElement>(null);
    const pending = useRef(new Map<string, Pending>());
    const [ready, setReady] = useState(false);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState("");
    const [quality, setQuality] = useState("720p");
    const [fps, setFps] = useState(30);
    const [src] = useState(() => `${import.meta.env.BASE_URL}director-desk/?${new URLSearchParams({ instanceId: context.node.id, theme: themeName, hostOrigin: window.location.origin })}`);
    const active = () => useDirectorStore.getState().context === context && Boolean(context.getNode(context.node.id));
    const send = (type: string, payload?: unknown) => iframe.current?.contentWindow?.postMessage({ type, payload }, window.location.origin);
    const request = (action: string, options?: Reply) => new Promise<Reply>((resolve, reject) => {
        const requestId = nanoid();
        pending.current.set(requestId, { action, resolve, reject });
        send("storyai:director-desk:request", { requestId, action, options });
    });

    async function insertMedia(result: Reply, video = false) {
        if (!active()) return;
        if (video ? !(result.blob instanceof Blob) : typeof result.dataUrl !== "string" || !result.dataUrl.startsWith("data:image/")) throw new Error("导演台未返回有效素材");
        const metadata = video ? videoMetadata(await uploadMediaFile(result.blob as Blob, "video")) : imageMetadata(await uploadImage(result.dataUrl as string));
        if (!active()) return;
        const source = context.getNode(context.node.id)!;
        const size = fitNodeSize(metadata.naturalWidth || 1280, metadata.naturalHeight || 720);
        const existing = context.getDownstream();
        const y = existing.reduce((bottom, node) => Math.max(bottom, node.position.y + node.height + 32), source.position.y);
        const nodeId = nanoid();
        context.applyOps([
            { type: "add_node", id: nodeId, nodeType: video ? CanvasNodeType.Video : CanvasNodeType.Image, title: typeof result.fileName === "string" ? result.fileName : "导演台参考素材", position: { x: source.position.x + source.width + 80, y }, ...size, metadata },
            { type: "connect_nodes", fromNodeId: source.id, toNodeId: nodeId },
        ]);
    }

    useEffect(() => {
        let initialized = false;
        let captures = Promise.resolve();
        const report = (failure: unknown) => { if (active()) setError(failure instanceof Error ? failure.message : String(failure)); };
        const receive = (event: MessageEvent) => {
            if (event.origin !== window.location.origin || event.source !== iframe.current?.contentWindow || !active()) return;
            const data = event.data;
            if (!data || typeof data !== "object") return;
            if (data.type === "storyai:director-desk-ready" && !initialized) {
                initialized = true;
                iframe.current?.contentWindow?.postMessage({ type: "xingcheng:director-init", project: context.getNode(context.node.id)?.metadata.directorProject }, window.location.origin);
            } else if (data.type === "xingcheng:director-initialized") {
                void request("capabilities.get").then((capabilities) => {
                    if (!Array.isArray(capabilities.actions) || !capabilities.actions.includes("export.frame") || !capabilities.actions.includes("export.video")) throw new Error("导演台缺少素材导出能力");
                    if (active()) setReady(true);
                }).catch(report);
            } else if (data.type === "xingcheng:director-project" && data.project && typeof data.project === "object") {
                context.updateMetadata({ directorProject: data.project });
            } else if (data.type === "xingcheng:director-error") {
                report(data.message);
            } else if (data.type === "storyai:director-desk-close") {
                useDirectorStore.getState().close();
            } else if (data.type === "storyai:director-desk:response") {
                const reply = data.payload;
                const item = pending.current.get(reply?.requestId);
                if (!item || reply.protocolVersion !== 1 || item.action !== reply.action) return;
                pending.current.delete(reply.requestId);
                if (reply.ok && reply.data && typeof reply.data === "object") item.resolve(reply.data);
                else item.reject(new Error(reply.error?.message || "导演台请求失败"));
            } else if (data.type === "storyai:director-desk-captures-sent" && Array.isArray(data.payload?.captures)) {
                captures = captures.then(async () => {
                    for (const capture of data.payload.captures) await insertMedia(capture);
                    if (active()) message.success("截图已添加到画布");
                }).catch(report);
            }
        };
        window.addEventListener("message", receive);
        return () => {
            window.removeEventListener("message", receive);
            pending.current.forEach((item) => item.reject(new Error("导演台已关闭")));
            pending.current.clear();
        };
    }, [context, message]);

    async function exportMedia(position: "current" | "first" | "last" | "video") {
        setBusy(position);
        setError("");
        try {
            const video = position === "video";
            const fileName = video ? "导演台预演.mp4" : `${{ current: "当前帧", first: "首帧", last: "尾帧" }[position]}.png`;
            const result = await request(video ? "export.video" : "export.frame", { position, quality, fps, fileName });
            await insertMedia(result, video);
            if (active()) message.success("参考素材已添加到画布，可连接到视频生成节点");
        } catch (failure) {
            if (active()) setError(failure instanceof Error ? failure.message : "导出失败");
        } finally {
            if (active()) setBusy("");
        }
    }

    return (
        <Modal open title={null} footer={null} closable={false} keyboard={false} maskClosable={false} width="100vw" style={{ top: 0, paddingBottom: 0, maxWidth: "100vw" }} styles={{ container: { padding: 0, borderRadius: 0, background: theme.canvas.background } }}>
            <div className="flex h-dvh flex-col" data-canvas-no-zoom data-canvas-shortcuts-ignore onKeyDown={(event) => event.stopPropagation()} style={{ color: theme.node.text }}>
                <header className="flex flex-wrap items-center gap-2 px-4 py-2">
                    <Clapperboard className="size-5" /><strong className="mr-3 text-sm">3D 导演台</strong>
                    <Select aria-label="导出清晰度" size="small" value={quality} onChange={setQuality} disabled={Boolean(busy)} options={[{ value: "720p" }, { value: "1080p" }]} />
                    <Select aria-label="视频帧率" size="small" value={fps} onChange={setFps} disabled={Boolean(busy)} options={[24, 30, 60].map((value) => ({ value, label: `${value} 帧/秒` }))} />
                    {([['current', '当前帧'], ['first', '首帧'], ['last', '尾帧']] as const).map(([position, label]) => <Button type="text" key={position} icon={<ImagePlus className="size-4" />} disabled={!ready || Boolean(busy)} loading={busy === position} onClick={() => void exportMedia(position)}>{label}到画布</Button>)}
                    <Button type="text" icon={<Video className="size-4" />} disabled={!ready || Boolean(busy)} loading={busy === "video"} onClick={() => void exportMedia("video")}>预演视频到画布</Button>
                    <span className="ml-auto text-xs" style={{ color: theme.node.muted }}>{busy ? "正在导出，关闭窗口会停止接收本次结果" : "工程自动保存于当前浏览器"}</span>
                    <Button type="text" onClick={() => useDirectorStore.getState().close()}>返回画布</Button>
                </header>
                {error ? <div role="alert" className="px-5 py-2 text-sm">{error}。可返回画布后重新打开。</div> : !ready ? <div className="flex items-center gap-2 px-5 py-2 text-sm"><Spin size="small" />正在加载导演台…</div> : null}
                <iframe ref={iframe} src={src} title="星程画布 3D 导演台" className="min-h-0 w-full flex-1 border-0" allow="fullscreen" />
            </div>
        </Modal>
    );
}
