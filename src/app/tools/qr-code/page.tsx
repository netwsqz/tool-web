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
