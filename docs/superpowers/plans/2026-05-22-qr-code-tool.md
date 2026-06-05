# QR 码工具 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 纯客户端二维码生成 + 解码工具，支持文本/URL / WiFi / vCard 三种内容类型。

**架构:** useQR hook 管理全部状态，QrGenerator / QrScanner 两个组件分 Tab 渲染，page.tsx 做 Tab 容器。零后端依赖。

**Tech Stack:** Next.js 15 App Router, TypeScript strict, `qrcode` (生成), `qr-scanner` (解码), Lucide icons

---

### Task 0: 安装依赖

**Files:**
- Modify: `package.json` (dependencies)

- [ ] **安装 qrcode 和 qr-scanner**

```bash
npm install qrcode qr-scanner
npm install -D @types/qrcode
```

- [ ] **验证安装**

```bash
npx tsc --noEmit --strict 2>&1 | head -5
```

---

### Task 1: 创建类型定义

**Files:**
- Create: `src/types/qr.ts`

- [ ] **创建类型文件**

```ts
export type QRGeneratorType = "text" | "wifi" | "vcard";

export interface WifiConfig {
  ssid: string;
  password: string;
  encryption: "WPA" | "WPA2" | "WEP" | "none";
}

export interface VCardConfig {
  name: string;
  tel: string;
  email: string;
  org: string;
}

export interface QRGeneratorState {
  type: QRGeneratorType;
  text: string;
  wifi: WifiConfig;
  vcard: VCardConfig;
  qrDataUrl: string | null;
  error: string | null;
}

export interface QRScannerState {
  scannedText: string | null;
  scanning: boolean;
  error: string | null;
}
```

- [ ] **在 `src/types/index.ts` 中重导出**

添加到文件末尾:
```ts
export type { QRGeneratorType, WifiConfig, VCardConfig, QRGeneratorState, QRScannerState } from "./qr";
```

---

### Task 2: 创建 useQR hook

**Files:**
- Create: `src/hooks/useQR.ts`

Hook 管理生成和扫描两个独立的状态块。

- [ ] **创建 hook**

```ts
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import QRCode from "qrcode";
import QrScanner from "qr-scanner";
import type {
  QRGeneratorType,
  WifiConfig,
  VCardConfig,
} from "@/types/qr";

function buildQrContent(
  type: QRGeneratorType,
  text: string,
  wifi: WifiConfig,
  vcard: VCardConfig,
): string {
  switch (type) {
    case "text":
      return text;
    case "wifi": {
      const enc = wifi.encryption === "none" ? "" : `T:${wifi.encryption};`;
      const pwd = wifi.password ? `P:${wifi.password};` : "";
      return `WIFI:${enc}S:${wifi.ssid};${pwd};`;
    }
    case "vcard": {
      const parts = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        vcard.name ? `FN:${vcard.name}` : "",
        vcard.tel ? `TEL:${vcard.tel}` : "",
        vcard.email ? `EMAIL:${vcard.email}` : "",
        vcard.org ? `ORG:${vcard.org}` : "",
        "END:VCARD",
      ];
      return parts.filter(Boolean).join("\n");
    }
  }
}

export function useQR() {
  // Generator state
  const [genType, setGenType] = useState<QRGeneratorType>("text");
  const [text, setText] = useState("");
  const [wifi, setWifi] = useState<WifiConfig>({ ssid: "", password: "", encryption: "WPA2" });
  const [vcard, setVcard] = useState<VCardConfig>({ name: "", tel: "", email: "", org: "" });
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const genTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Scanner state
  const [scannedText, setScannedText] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Auto-generate on input change (debounced)
  useEffect(() => {
    if (genTimerRef.current) clearTimeout(genTimerRef.current);

    const content = buildQrContent(genType, text, wifi, vcard);
    if (!content || (genType === "text" && !text.trim())) {
      setQrDataUrl(null);
      setGenError(null);
      return;
    }

    genTimerRef.current = setTimeout(async () => {
      try {
        setGenError(null);
        const url = await QRCode.toDataURL(content, {
          width: 280,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
          errorCorrectionLevel: "M",
        });
        setQrDataUrl(url);
      } catch {
        setGenError("生成失败，请检查输入内容");
      }
    }, 300);

    return () => {
      if (genTimerRef.current) clearTimeout(genTimerRef.current);
    };
  }, [genType, text, wifi, vcard]);

  // Scan image
  const scanImage = useCallback(async (file: File) => {
    setScanning(true);
    setScanError(null);
    setScannedText(null);
    try {
      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true,
      });
      setScannedText(result.data);
    } catch {
      setScanError("无法识别二维码，请尝试其他图片");
    } finally {
      setScanning(false);
    }
  }, []);

  const resetGenerator = useCallback(() => {
    setGenType("text");
    setText("");
    setWifi({ ssid: "", password: "", encryption: "WPA2" });
    setVcard({ name: "", tel: "", email: "", org: "" });
    setQrDataUrl(null);
    setGenError(null);
  }, []);

  const resetScanner = useCallback(() => {
    setScannedText(null);
    setScanError(null);
  }, []);

  return {
    // Generator
    genType, setGenType: (t: QRGeneratorType) => { resetScanner(); setGenType(t); },
    text, setText,
    wifi, setWifi,
    vcard, setVcard,
    qrDataUrl,
    genError,
    resetGenerator,
    // Scanner
    scannedText,
    scanning,
    scanError,
    scanImage,
    resetScanner,
  };
}
```

---

### Task 3: 创建 QrGenerator 组件

**Files:**
- Create: `src/components/qr/QrGenerator.tsx`

- [ ] **创建组件文件**

```tsx
"use client";

import { useRef } from "react";
import { Download } from "lucide-react";
import type { QRGeneratorType, WifiConfig, VCardConfig } from "@/types/qr";

interface QrGeneratorProps {
  genType: QRGeneratorType;
  onTypeChange: (t: QRGeneratorType) => void;
  text: string;
  onTextChange: (v: string) => void;
  wifi: WifiConfig;
  onWifiChange: (v: WifiConfig) => void;
  vcard: VCardConfig;
  onVcardChange: (v: VCardConfig) => void;
  qrDataUrl: string | null;
  genError: string | null;
}

const TYPE_OPTIONS: { value: QRGeneratorType; label: string }[] = [
  { value: "text", label: "文本 / URL" },
  { value: "wifi", label: "WiFi" },
  { value: "vcard", label: "名片" },
];

export function QrGenerator({
  genType, onTypeChange,
  text, onTextChange,
  wifi, onWifiChange,
  vcard, onVcardChange,
  qrDataUrl, genError,
}: QrGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qrcode-${genType}-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Type selector */}
      <div className="flex gap-2">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onTypeChange(opt.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              genType === opt.value
                ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
                : "bg-white/5 text-[var(--color-foreground-muted)] hover:bg-white/10"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="space-y-4">
        {genType === "text" && (
          <textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="输入文本或网址…"
            rows={4}
            className="w-full rounded-xl bg-white/5 border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)] resize-none focus:outline-none focus:border-[var(--color-accent)]/40"
          />
        )}

        {genType === "wifi" && (
          <>
            <input
              value={wifi.ssid}
              onChange={(e) => onWifiChange({ ...wifi, ssid: e.target.value })}
              placeholder="WiFi 名称 (SSID)"
              className="w-full rounded-xl bg-white/5 border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)] focus:outline-none focus:border-[var(--color-accent)]/40"
            />
            <input
              value={wifi.password}
              onChange={(e) => onWifiChange({ ...wifi, password: e.target.value })}
              placeholder="密码（可选）"
              type="password"
              className="w-full rounded-xl bg-white/5 border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)] focus:outline-none focus:border-[var(--color-accent)]/40"
            />
            <select
              value={wifi.encryption}
              onChange={(e) => onWifiChange({ ...wifi, encryption: e.target.value as WifiConfig["encryption"] })}
              className="w-full rounded-xl bg-white/5 border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-accent)]/40"
            >
              <option value="WPA2">WPA2</option>
              <option value="WPA">WPA</option>
              <option value="WEP">WEP</option>
              <option value="none">无加密</option>
            </select>
          </>
        )}

        {genType === "vcard" && (
          <>
            <input
              value={vcard.name}
              onChange={(e) => onVcardChange({ ...vcard, name: e.target.value })}
              placeholder="姓名"
              className="w-full rounded-xl bg-white/5 border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)] focus:outline-none focus:border-[var(--color-accent)]/40"
            />
            <input
              value={vcard.tel}
              onChange={(e) => onVcardChange({ ...vcard, tel: e.target.value })}
              placeholder="电话"
              className="w-full rounded-xl bg-white/5 border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)] focus:outline-none focus:border-[var(--color-accent)]/40"
            />
            <input
              value={vcard.email}
              onChange={(e) => onVcardChange({ ...vcard, email: e.target.value })}
              placeholder="邮箱"
              type="email"
              className="w-full rounded-xl bg-white/5 border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)] focus:outline-none focus:border-[var(--color-accent)]/40"
            />
            <input
              value={vcard.org}
              onChange={(e) => onVcardChange({ ...vcard, org: e.target.value })}
              placeholder="公司"
              className="w-full rounded-xl bg-white/5 border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)] focus:outline-none focus:border-[var(--color-accent)]/40"
            />
          </>
        )}
      </div>

      {/* Error */}
      {genError && (
        <div className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm">
          {genError}
        </div>
      )}

      {/* QR Preview */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center justify-center w-72 h-72 rounded-2xl bg-white border border-[var(--color-border)] overflow-hidden">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="二维码"
              className="w-64 h-64"
              ref={canvasRef as any}
            />
          ) : (
            <span className="text-sm text-[var(--color-foreground-subtle)] px-4 text-center">
              输入内容后自动生成
            </span>
          )}
        </div>

        {qrDataUrl && (
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] text-sm font-medium hover:bg-[var(--color-accent)]/25 transition-colors"
          >
            <Download className="size-4" />
            下载 PNG
          </button>
        )}
      </div>
    </div>
  );
}
```

---

### Task 4: 创建 QrScanner 组件

**Files:**
- Create: `src/components/qr/QrScanner.tsx`

- [ ] **创建组件文件**

```tsx
"use client";

import { useRef, useState } from "react";
import { Upload, Copy, Check } from "lucide-react";

interface QrScannerProps {
  scanning: boolean;
  scannedText: string | null;
  scanError: string | null;
  onScan: (file: File) => void;
  onReset: () => void;
}

export function QrScanner({ scanning, scannedText, scanError, onScan, onReset }: QrScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    onReset();
    onScan(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleCopy = async () => {
    if (!scannedText) return;
    await navigator.clipboard.writeText(scannedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Drop zone or result */}
      {!scannedText && !scanError && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-3 py-16 rounded-2xl border-2 border-dashed border-[var(--color-border)] cursor-pointer transition-colors hover:border-[var(--color-accent)]/40 ${
            scanning ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          {scanning ? (
            <div className="size-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <div className="size-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center">
                <Upload className="size-6 text-[var(--color-accent)]" />
              </div>
              <p className="text-sm text-[var(--color-foreground-muted)]">
                点击或拖拽上传二维码图片
              </p>
              <p className="text-xs text-[var(--color-foreground-subtle)]">
                支持 PNG / JPG / WebP
              </p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      {/* Scan error */}
      {scanError && (
        <div className="flex flex-col items-center gap-4 py-12 rounded-2xl border border-[var(--color-border)]">
          <div className="size-12 rounded-xl bg-red-500/20 flex items-center justify-center">
            <Upload className="size-6 text-red-400" />
          </div>
          <p className="text-sm text-red-400">{scanError}</p>
          <button
            type="button"
            onClick={() => { onReset(); inputRef.current?.click(); }}
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            重新选择
          </button>
        </div>
      )}

      {/* Scan result */}
      {scannedText && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white/5 border border-[var(--color-border)] p-4">
            <p className="text-xs text-[var(--color-foreground-subtle)] mb-2">解码结果</p>
            <p className="text-sm text-[var(--color-foreground)] break-all select-all whitespace-pre-wrap">
              {scannedText}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] text-sm font-medium hover:bg-[var(--color-accent)]/25 transition-colors"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "已复制" : "复制"}
            </button>
            <button
              type="button"
              onClick={() => { onReset(); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 text-[var(--color-foreground-muted)] text-sm hover:bg-white/10 transition-colors"
            >
              继续扫描
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Task 5: 创建页面

**Files:**
- Create: `src/app/tools/qr-code/page.tsx`

- [ ] **创建页面**

```tsx
"use client";

import { QrCode } from "lucide-react";
import { ToolLayout } from "@/components/ui/ToolLayout";
import { useQR } from "@/hooks/useQR";
import { QrGenerator } from "@/components/qr/QrGenerator";
import { QrScanner } from "@/components/qr/QrScanner";
import { useState } from "react";

type Tab = "generate" | "scan";

export default function QRCodePage() {
  const [tab, setTab] = useState<Tab>("generate");
  const qr = useQR();

  return (
    <ToolLayout
      title="二维码工具"
      description="生成二维码 · 扫码解码"
      icon={QrCode}
      maxWidth="md"
    >
      {/* Tab bar */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab("generate")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === "generate"
              ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
              : "bg-white/5 text-[var(--color-foreground-muted)] hover:bg-white/10"
          }`}
        >
          生成
        </button>
        <button
          type="button"
          onClick={() => setTab("scan")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === "scan"
              ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
              : "bg-white/5 text-[var(--color-foreground-muted)] hover:bg-white/10"
          }`}
        >
          扫描
        </button>
      </div>

      {/* Content */}
      {tab === "generate" ? (
        <QrGenerator
          genType={qr.genType}
          onTypeChange={qr.setGenType}
          text={qr.text}
          onTextChange={qr.setText}
          wifi={qr.wifi}
          onWifiChange={qr.setWifi}
          vcard={qr.vcard}
          onVcardChange={qr.setVcard}
          qrDataUrl={qr.qrDataUrl}
          genError={qr.genError}
        />
      ) : (
        <QrScanner
          scanning={qr.scanning}
          scannedText={qr.scannedText}
          scanError={qr.scanError}
          onScan={qr.scanImage}
          onReset={qr.resetScanner}
        />
      )}
    </ToolLayout>
  );
}
```

---

### Task 6: 注册工具 + 侧边栏图标

**Files:**
- Modify: `src/lib/tools.ts`
- Modify: `src/components/ui/Sidebar.tsx`

- [ ] **在 `src/lib/tools.ts` 中注册新工具**

添加到 `system` 分类下（在 metronome 后面）:
```ts
  {
    id: "qr-code",
    name: "二维码工具",
    description: "生成二维码 · 图片扫码解码",
    icon: "QrCode",
    path: "/tools/qr-code",
    status: "active",
    category: "system",
  },
```

- [ ] **在 `Sidebar.tsx` 中添加图标映射**

在 import 区域添加:
```tsx
import { ..., QrCode, ... } from "lucide-react";
```

在 iconMap 中添加:
```tsx
  QrCode,
```

---

### Task 7: 类型检查 + 验证

- [ ] **运行类型检查**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **运行 lint**

```bash
npx next lint
```

Expected: no errors

- [ ] **启用 dev server 确认页面可访问**

```bash
npm run dev
```

访问 `http://localhost:3000/tools/qr-code` 确认两个 Tab 正常工作。

- [ ] **测试生成流程**: 输入文本 → 实时生成二维码 → 下载 PNG
- [ ] **测试 WiFi 生成**: 填写 SSID/密码 → 生成 WiFi 二维码
- [ ] **测试名片生成**: 填写姓名/电话/邮箱/公司 → 生成 vCard 二维码
- [ ] **测试扫描**: 上传带二维码的图片 → 显示解码结果 → 复制
- [ ] **测试错误状态**: 上传非二维码图片 → 显示错误提示
