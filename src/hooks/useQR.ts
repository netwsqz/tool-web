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
    genType,
    setGenType: (t: QRGeneratorType) => { resetScanner(); setGenType(t); },
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
