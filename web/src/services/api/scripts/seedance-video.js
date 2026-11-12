/**
 * Seedance（奥创）：创建视频任务并轮询结果。
 * M4A / MP4 参考音频会转换为 WAV，避免 audio/mp4 类型冲突。
 * @param {string} prompt - 已包含系统提示词。
 * @param {string[]} images - 参考图 dataURL 数组。
 * @param {Function} getImageUrls - 按原顺序获取参考图公网 URL。
 * @param {File[]} videos - 参考视频。
 * @param {File[]} audios - 参考音频。
 * @param {object} params - 空值使用服务端默认值。
 * @param {string} params.mode - frames / reference。
 * @param {number|string} params.seconds - 时长，秒。
 * @param {string} params.size - 输出尺寸。
 * @param {string} params.resolution - 分辨率。
 * @param {string} params.ratio - 比例，优先于 size。
 * @param {string} params.quality - 面板已按当前模型映射的接口档位值，直接发送。
 * @param {boolean} params.generateAudio - 是否生成声音。
 * @param {boolean} params.watermark - 水印。
 * @param {string} model - 默认 seedance-2-0-9tu-special。
 * @param {string} baseUrl - 渠道地址。
 * @param {string} apiKey - 渠道密钥。
 * @param {Function} request - 原始 HTTP 请求方法。
 * @param {Function} poll - 轮询方法。
 * @param {AbortSignal} signal - 停止等待不会撤销服务端任务。
 * @returns {Promise<{url: string}>}
 */
async function generateSeedanceVideo({
  prompt, images = [], getImageUrls, videos = [], audios = [],
  params: { mode, seconds, size, resolution, ratio, quality, generateAudio, watermark } = {},
  model, baseUrl, apiKey, request, poll, signal,
}) {
  const modelName = String(model || "seedance-2-0-9tu-special").trim();
  if (!String(prompt || "").trim()) throw new Error("请填写视频提示词。");
  if (!baseUrl || !apiKey) throw new Error("请配置渠道地址和 API Key。");
  const root = String(baseUrl).trim().replace(/\/+$/, "").replace(/\/v1$/i, "");
  const authorization = { Authorization: `Bearer ${apiKey}` };

  function checkAbort() {
    if (signal?.aborted) throw new DOMException("已停止等待视频生成。", "AbortError");
  }
  function errorMessage(error) {
    if (typeof error === "string") return error;
    return error?.message || JSON.stringify(error) || "接口请求失败";
  }
  async function call(method, path, data) {
    checkAbort();
    const result = await request({
      method, url: `${root}/v1${path}`,
      headers: data instanceof FormData ? authorization : { ...authorization, "Content-Type": "application/json" },
      ...(data !== undefined ? { data } : {}), signal,
    });
    checkAbort();
    if (result?.error) throw new Error(errorMessage(result.error));
    return result;
  }

  const details = await call("get", `/skills/models/${encodeURIComponent(modelName)}`);
  if (!Array.isArray(details?.params)) throw new Error("无法读取模型参数表，请检查模型名称和渠道配置。");
  const fields = new Map(details.params.map((field) => [field.name, field]));
  const body = { model: modelName, prompt: String(prompt) };

  function setParameter(names, value) {
    if (value === undefined || value === null || value === "") return;
    const name = names.find((candidate) => fields.has(candidate));
    if (!name) return;
    const field = fields.get(name);
    if (field.options?.length) {
      const option = field.options.find((item) => String(item.value).toLowerCase() === String(value).toLowerCase());
      if (!option) throw new Error(`${field.label || name} 不支持 ${value}，可选值：` + field.options.map((item) => item.value).join("、"));
      value = option.value;
    }
    if (field.type === "number") {
      value = Number(value);
      if (!Number.isFinite(value)) throw new Error(`${field.label || name} 必须是有效数字。`);
      if (field.min != null && value < Number(field.min)) throw new Error(`${field.label || name} 不能小于 ${field.min}。`);
      if (field.max != null && value > Number(field.max)) throw new Error(`${field.label || name} 不能大于 ${field.max}。`);
    }
    body[name] = value;
  }
  if (seconds !== undefined && seconds !== null && seconds !== "") {
    const duration = Number(seconds);
    if (!Number.isFinite(duration) || duration <= 0) throw new Error("视频时长必须是大于 0 的数字。");
    setParameter(["duration", "seconds"], duration);
  }
  let aspectRatio = ratio;
  if (!aspectRatio && size) {
    const dimensions = String(size).match(/^(\d+)\s*[x×]\s*(\d+)$/i);
    if (dimensions) {
      const width = Number(dimensions[1]);
      const height = Number(dimensions[2]);
      if (width > 0 && height > 0) {
        const gcd = (a, b) => b ? gcd(b, a % b) : a;
        const divisor = gcd(width, height);
        aspectRatio = `${width / divisor}:${height / divisor}`;
      }
    } else if (/^\d+:\d+$/.test(String(size))) aspectRatio = String(size);
  }
  setParameter(["size"], size);
  setParameter(["resolution"], resolution);
  setParameter(["aspect_ratio", "ratio"], aspectRatio);
  setParameter(["quality"], quality);
  setParameter(["generate_audio", "generateAudio"], generateAudio);
  setParameter(["watermark"], watermark);

  const referenceMode = mode === "reference" || images.length > 2 || videos.length > 0 || audios.length > 0;
  const modeCandidates = referenceMode
    ? ["reference", "reference-to-video", "全能参考", "参考生视频"]
    : images.length
      ? [...(images.length === 2 ? ["first-last", "first-last-frame", "first-last-frames", "首尾帧"] : []), "first-frame", "image-to-video", "图生视频"]
      : ["text-to-video", "文生视频"];
  const modeField = fields.get("mode");
  if (modeField?.options?.length) {
    const selected = modeCandidates.map((candidate) => modeField.options.find((option) => String(option.value).toLowerCase() === candidate.toLowerCase())).find(Boolean);
    if (!selected) throw new Error("该型号不支持当前生成模式，可选值：" + modeField.options.map((item) => item.value).join("、"));
    body.mode = selected.value;
  } else if (referenceMode) body.mode = "reference";

  function validateReferences(name, files) {
    if (!files.length) return;
    const field = fields.get(name);
    if (!field) throw new Error(`该型号的参数表未声明支持 ${name} 参考素材。`);
    const limit = field.max_items_by_mode?.[body.mode] ?? field.max_items;
    if (limit != null && files.length > Number(limit)) throw new Error(`${field.label || name} 最多支持 ${limit} 个素材。`);
  }
  function validateUpload(name, file) {
    const modelLimit = Number(fields.get(name)?.max_bytes);
    const maxBytes = Math.min(modelLimit > 0 ? modelLimit : Infinity, 50 * 1024 * 1024);
    if (file.size > maxBytes) throw new Error(`${file.name || "参考素材"} 超过允许大小（最多 ${(maxBytes / 1024 / 1024).toFixed(1)} MB）。`);
  }
  validateReferences("images", images);
  validateReferences("videos", videos);
  validateReferences("audios", audios);

  // 沿用原脚本的 PCM WAV 转换，不能只修改 MIME 或后缀。
  async function audioToWav(file) {
    checkAbort();
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextClass) throw new Error("当前环境无法转换 M4A/MP4 音频，请先转成 MP3 或 WAV 再上传。");
    const context = new AudioContextClass();
    let audio;
    try {
      audio = await context.decodeAudioData(await file.arrayBuffer());
    } catch {
      checkAbort();
      throw new Error(`${file.name || "参考音频"} 解码失败，请先转成 MP3 或 WAV 再上传。`);
    } finally {
      await context.close().catch(() => {});
    }
    checkAbort();
    const channels = audio.numberOfChannels;
    const samples = audio.length;
    const dataSize = samples * channels * 2;
    validateUpload("audios", { name: `${file.name || "参考音频"} 转换后的 WAV`, size: 44 + dataSize });
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    function writeText(offset, text) {
      for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
    }
    writeText(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeText(8, "WAVE");
    writeText(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, audio.sampleRate, true);
    view.setUint32(28, audio.sampleRate * channels * 2, true);
    view.setUint16(32, channels * 2, true);
    view.setUint16(34, 16, true);
    writeText(36, "data");
    view.setUint32(40, dataSize, true);
    const channelData = Array.from({ length: channels }, (_, index) => audio.getChannelData(index));
    let offset = 44;
    for (let i = 0; i < samples; i++) {
      for (let channel = 0; channel < channels; channel++) {
        const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
        view.setInt16(offset, Math.round(sample * (sample < 0 ? 32768 : 32767)), true);
        offset += 2;
      }
    }
    const filename = (file.name || "reference").replace(/\.[^.]+$/, "") + ".wav";
    return new File([buffer], filename, { type: "audio/wav" });
  }
  async function uploadFiles(files, kind) {
    const urls = [];
    for (const file of files) {
      checkAbort();
      let uploadFile = file;
      if (kind === "audios" && (/^audio\/(?:mp4|m4a|x-m4a)(?:;|$)/i.test(file.type || "") || /\.(?:m4a|mp4)$/i.test(file.name || ""))) uploadFile = await audioToWav(file);
      validateUpload(kind, uploadFile);
      const form = new FormData();
      form.append("file", uploadFile);
      const uploaded = await call("post", "/files", form);
      if (!/^https?:\/\//i.test(String(uploaded?.url || ""))) throw new Error(`${file.name || "参考素材"} 上传后未返回公网 URL。`);
      urls.push(uploaded.url);
    }
    return urls;
  }
  if (images.length) {
    if (typeof getImageUrls !== "function") throw new Error("当前运行环境未提供 getImageUrls。");
    const urls = await getImageUrls();
    checkAbort();
    if (!Array.isArray(urls) || urls.length !== images.length || urls.some((url) => !/^https?:\/\//i.test(String(url)))) throw new Error("参考图公网链接不完整，请检查图片上传配置。");
    if (referenceMode) body.images = urls;
    else {
      body.image_url = urls[0];
      if (urls[1]) body.end_image_url = urls[1];
    }
  }
  if (videos.length) body.videos = await uploadFiles(videos, "videos");
  if (audios.length) body.audios = await uploadFiles(audios, "audios");
  const task = await call("post", "/videos/generations", body);
  const taskId = task?.task_id || task?.id;
  if (!taskId) throw new Error("创建视频任务后未返回 task_id。");
  try {
    return await poll(
      () => call("get", `/tasks/${encodeURIComponent(taskId)}`),
      (state) => {
        checkAbort();
        if (state.status === "failed") throw new Error(state.error ? errorMessage(state.error) : state.error_class || "Seedance 视频生成失败");
        if (state.status === "completed") {
          if (state.cdn_pending === true) return null;
          const url = state.output_url || state.result_url;
          if (!url) throw new Error("任务已完成，但未返回视频地址。");
          return { url };
        }
        if (state.is_final === true) throw new Error(`任务已结束，状态：${state.status || "未知"}。`);
        return null;
      },
      { intervalMs: 3000, timeoutMs: 30 * 60 * 1000 },
    );
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(`${error?.message || "查询视频任务失败"}；任务 ID：${taskId}。请先查询原任务状态，再决定是否重新提交。`);
  }
}

return await generateSeedanceVideo({ prompt, images, getImageUrls, videos, audios, params, model, baseUrl, apiKey, request, poll, signal });
