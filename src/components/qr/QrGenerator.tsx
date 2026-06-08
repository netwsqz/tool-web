"use client";

import { useState } from "react";
import { Download, ChevronDown } from "lucide-react";
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
  const [openSelect, setOpenSelect] = useState(false);
  const encryptionOptions: { value: WifiConfig["encryption"]; label: string }[] = [
    { value: "WPA2", label: "WPA2" },
    { value: "WPA", label: "WPA" },
    { value: "WEP", label: "WEP" },
    { value: "none", label: "无加密" },
  ];

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
                : "bg-black/5 text-[var(--color-foreground-muted)] hover:bg-black/10"
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
            className="w-full rounded-xl bg-black/5 border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)] resize-none focus:outline-none focus:border-[var(--color-accent)]/40"
          />
        )}

        {genType === "wifi" && (
          <>
            <input
              value={wifi.ssid}
              onChange={(e) => onWifiChange({ ...wifi, ssid: e.target.value })}
              placeholder="WiFi 名称 (SSID)"
              aria-label="WiFi 名称"
              className="w-full rounded-xl bg-black/5 border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)] focus:outline-none focus:border-[var(--color-accent)]/40"
            />
            <input
              value={wifi.password}
              onChange={(e) => onWifiChange({ ...wifi, password: e.target.value })}
              placeholder="密码（可选）"
              type="password"
              aria-label="WiFi 密码"
              className="w-full rounded-xl bg-black/5 border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)] focus:outline-none focus:border-[var(--color-accent)]/40"
            />
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenSelect(!openSelect)}
                onBlur={() => setOpenSelect(false)}
                className="w-full flex items-center justify-between rounded-xl bg-black/5 border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-accent)]/40"
              >
                <span>{encryptionOptions.find((o) => o.value === wifi.encryption)?.label}</span>
                <ChevronDown className={`size-4 text-[var(--color-foreground-muted)] transition-transform ${openSelect ? "rotate-180" : ""}`} />
              </button>
              {openSelect && (
                <div className="absolute z-10 mt-1 w-full rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shadow-lg overflow-hidden">
                  {encryptionOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onWifiChange({ ...wifi, encryption: opt.value });
                        setOpenSelect(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        wifi.encryption === opt.value
                          ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
                          : "text-[var(--color-foreground)] hover:bg-black/5"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {genType === "vcard" && (
          <>
            <input
              value={vcard.name}
              onChange={(e) => onVcardChange({ ...vcard, name: e.target.value })}
              placeholder="姓名"
              aria-label="姓名"
              className="w-full rounded-xl bg-black/5 border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)] focus:outline-none focus:border-[var(--color-accent)]/40"
            />
            <input
              value={vcard.tel}
              onChange={(e) => onVcardChange({ ...vcard, tel: e.target.value })}
              placeholder="电话"
              aria-label="电话"
              className="w-full rounded-xl bg-black/5 border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)] focus:outline-none focus:border-[var(--color-accent)]/40"
            />
            <input
              value={vcard.email}
              onChange={(e) => onVcardChange({ ...vcard, email: e.target.value })}
              placeholder="邮箱"
              type="email"
              aria-label="邮箱"
              className="w-full rounded-xl bg-black/5 border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)] focus:outline-none focus:border-[var(--color-accent)]/40"
            />
            <input
              value={vcard.org}
              onChange={(e) => onVcardChange({ ...vcard, org: e.target.value })}
              placeholder="公司"
              aria-label="公司"
              className="w-full rounded-xl bg-black/5 border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)] focus:outline-none focus:border-[var(--color-accent)]/40"
            />
          </>
        )}
      </div>

      {/* Error */}
      {genError && (
        <div className="px-4 py-2 rounded-xl bg-[var(--color-destructive)]/20 text-[var(--color-destructive)] text-sm">
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
