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
