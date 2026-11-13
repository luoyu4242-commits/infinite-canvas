import { useState } from "react";
import { Alert, Button, Form, Input, theme } from "antd";
import { ArrowLeft, ArrowRight, Frame, Image, LockKeyhole, Mail, MoveUpRight, Play, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useThemeStore } from "@/stores/use-theme-store";

type AccountFields = { name?: string; email: string; password: string; confirmPassword?: string };

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
    const registering = mode === "register";
    const { token } = theme.useToken();
    const currentTheme = useThemeStore((state) => state.theme);
    const setTheme = useThemeStore((state) => state.setTheme);
    const [submitted, setSubmitted] = useState(false);
    const [form] = Form.useForm<AccountFields>();

    // Replace this handler with the agreed authentication API when the account service is connected.
    // Never persist passwords or create a local session for an unverified account.
    const submit = () => {
        setSubmitted(true);
        form.resetFields(["password", "confirmPassword"]);
    };

    return (
        <main className="min-h-dvh bg-background text-foreground" style={{ color: token.colorText }}>
            <header className="flex items-center justify-between gap-4 px-6 py-6 sm:px-10 lg:px-14">
                <Link to="/" className="flex items-center gap-3 font-medium tracking-tight" aria-label="星程画布首页">
                    <img src={`${import.meta.env.BASE_URL}xingcheng-logo.png`} alt="" className="size-7 shrink-0 object-contain mix-blend-multiply dark:invert dark:mix-blend-screen" />
                    <span>星程画布</span>
                </Link>
                <div className="flex items-center gap-5">
                    <Link to="/canvas" className="inline-flex items-center gap-1.5 text-xs transition-opacity hover:opacity-60" style={{ color: token.colorTextSecondary }}>
                        返回创作台 <ArrowRight className="size-3.5" />
                    </Link>
                    <AnimatedThemeToggler theme={currentTheme} onThemeChange={setTheme} className="inline-flex size-8 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 [&_svg]:size-4" aria-label={currentTheme === "dark" ? "切换浅色主题" : "切换深色主题"} />
                </div>
            </header>

            <div className="mx-auto grid max-w-[1440px] lg:min-h-[calc(100dvh-100px)] lg:grid-cols-[1.15fr_1fr]">
                <section className="relative hidden flex-col justify-between overflow-hidden px-14 pb-12 pt-10 lg:flex xl:px-20" aria-label="创作空间介绍">
                    <div>
                        <p className="mb-7 flex items-center gap-3 text-xs tracking-[0.2em]" style={{ color: token.colorTextSecondary }}><span className="h-px w-8 bg-current" /> 一个空间，无限可能</p>
                        <h1 className="text-[clamp(3rem,4.5vw,5rem)] leading-[1.25] tracking-tight" style={{ fontFamily: '"Noto Serif SC", "Source Han Serif SC", "Songti SC", SimSun, serif' }}>
                            让灵感，<br /><span className="pl-12">自由发生。</span>
                        </h1>
                        <p className="mt-7 max-w-sm text-sm leading-7" style={{ color: token.colorTextSecondary }}>从一句想法，到一张图、一段影像。<br />在画布上连接每一步，找到属于你的表达。</p>
                    </div>

                    <div className="relative my-10 h-[260px] max-w-[500px]" aria-hidden="true">
                        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `radial-gradient(${token.colorTextQuaternary} 1px, transparent 1px)`, backgroundSize: "18px 18px", maskImage: "radial-gradient(ellipse, black 35%, transparent 75%)" }} />
                        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 500 260" fill="none" preserveAspectRatio="none">
                            <path d="M120 90 C195 90 125 178 220 178 M325 178 C410 178 330 70 415 70" stroke={token.colorTextQuaternary} strokeWidth="1.5" strokeDasharray="4 5" />
                        </svg>
                        <div className="absolute left-0 top-4 w-[164px] -rotate-6 rounded-lg border p-4" style={{ background: token.colorBgContainer, borderColor: token.colorBorderSecondary }}>
                            <span className="text-[10px] tracking-[0.15em]" style={{ color: token.colorTextTertiary }}>01 / 灵感</span>
                            <p className="mb-4 mt-3 text-sm leading-6">一片安静的山野，<br />风穿过绿色的梦。</p>
                            <span className="block h-px w-8" style={{ background: token.colorBorder }} />
                        </div>
                        <div className="absolute bottom-0 left-[34%] w-[185px] rotate-3 overflow-hidden rounded-lg border" style={{ borderColor: token.colorBorderSecondary, background: token.colorBgContainer }}>
                            <div className="relative h-[128px] overflow-hidden bg-[#ced7c6]">
                                <div className="absolute left-6 top-5 size-8 rounded-full bg-[#f6f0da]" />
                                <div className="absolute -bottom-16 -left-8 h-36 w-60 -rotate-[22deg] rounded-[50%] bg-[#8f9e82]" />
                                <div className="absolute -bottom-24 -right-12 h-40 w-60 rotate-[22deg] rounded-[50%] bg-[#586e55]" />
                                <Image className="absolute right-3 top-3 size-4 text-[#586e55]" />
                            </div>
                            <div className="flex items-center justify-between px-3 py-2.5 text-[10px]" style={{ color: token.colorTextSecondary }}><span>02 / 画面</span><Frame className="size-3.5" /></div>
                        </div>
                        <div className="absolute right-0 top-5 flex size-[96px] rotate-6 flex-col items-center justify-center gap-3 rounded-lg border" style={{ background: token.colorBgContainer, borderColor: token.colorBorderSecondary }}>
                            <Play className="size-5" strokeWidth={1.3} /><span className="text-[10px]" style={{ color: token.colorTextSecondary }}>03 / 影像</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between border-t pt-5 text-xs" style={{ color: token.colorTextTertiary, borderColor: token.colorBorderSecondary }}><span>文字 · 图像 · 视频 · 画布</span><MoveUpRight className="size-4" /></div>
                </section>

                <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:border-l lg:py-12" style={{ borderColor: token.colorBorderSecondary }}>
                    <div className="w-full max-w-[380px]">
                        <div className="mb-10">
                            <span className="text-[11px] tracking-[0.18em]" style={{ color: token.colorTextTertiary }}>{registering ? "开启新的创作旅程" : "回到你的创作空间"}</span>
                            <h2 className="mb-3 mt-4 text-3xl font-medium tracking-tight">{registering ? "创建你的账号" : "欢迎回来"}</h2>
                            <p className="text-sm" style={{ color: token.colorTextSecondary }}>{registering ? "已经有账号？" : "还没有账号？"} <Link to={registering ? "/login" : "/register"} className="ml-1 border-b border-current pb-0.5 font-medium" style={{ color: token.colorText }}>{registering ? "前往登录" : "立即注册"}</Link></p>
                        </div>

                        <Form<AccountFields> form={form} layout="vertical" requiredMark={false} onFinish={submit} onValuesChange={() => setSubmitted(false)}>
                            {registering ? <Form.Item name="name" label="昵称" rules={[{ required: true, whitespace: true, message: "请输入昵称" }]}><Input size="large" prefix={<UserRound className="mr-2 size-4" style={{ color: token.colorTextTertiary }} />} placeholder="怎么称呼你" autoComplete="nickname" /></Form.Item> : null}
                            <Form.Item name="email" label="邮箱" rules={[{ required: true, message: "请输入邮箱" }, { type: "email", message: "请输入有效的邮箱地址" }]}>
                                <Input size="large" prefix={<Mail className="mr-2 size-4" style={{ color: token.colorTextTertiary }} />} placeholder="name@example.com" autoComplete="email" inputMode="email" />
                            </Form.Item>
                            <Form.Item name="password" label="密码" rules={[{ required: true, whitespace: true, message: "请输入密码" }]}>
                                <Input.Password size="large" prefix={<LockKeyhole className="mr-2 size-4" style={{ color: token.colorTextTertiary }} />} placeholder={registering ? "设置你的密码" : "输入密码"} autoComplete={registering ? "new-password" : "current-password"} />
                            </Form.Item>
                            {registering ? <Form.Item name="confirmPassword" label="确认密码" dependencies={["password"]} rules={[{ required: true, message: "请再次输入密码" }, ({ getFieldValue }) => ({ validator: (_, value) => !value || value === getFieldValue("password") ? Promise.resolve() : Promise.reject(new Error("两次输入的密码不一致")) })]}>
                                <Input.Password size="large" prefix={<LockKeyhole className="mr-2 size-4" style={{ color: token.colorTextTertiary }} />} placeholder="再次输入密码" autoComplete="new-password" />
                            </Form.Item> : null}
                            <div className="mb-6" role="status" aria-live="polite">
                                {submitted ? <Alert type="info" showIcon title={registering ? "注册服务暂未开放" : "登录服务暂未开放"} description="你仍然可以直接进入创作台，当前填写的密码不会保存。" /> : <p className="text-xs leading-5" style={{ color: token.colorTextTertiary }}>账号服务即将开放，现阶段可直接进入创作台使用。</p>}
                            </div>
                            <Button htmlType="submit" type="primary" size="large" block icon={<ArrowRight className="size-4" />} iconPlacement="end">{registering ? "注册" : "登录"}</Button>
                        </Form>

                        <div className="mt-8 border-t pt-6" style={{ borderColor: token.colorBorderSecondary }}>
                            <Link to="/canvas" className="flex items-center justify-center gap-2 text-sm transition-opacity hover:opacity-60" style={{ color: token.colorTextSecondary }}><ArrowLeft className="size-3.5" /> 先去创作，稍后再说</Link>
                            <p className="mt-4 text-center text-xs leading-5" style={{ color: token.colorTextTertiary }}>项目与素材保存在当前浏览器中。</p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
