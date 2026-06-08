// Run: node scripts/gen-qr.mjs <url> [output-path]
import QRCode from 'qrcode';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const url = process.argv[2];
const out = resolve(process.argv[3] || 'weixin-qr.png');

if (!url) {
  console.error('Usage: node scripts/gen-qr.mjs <url> [output-path]');
  process.exit(1);
}

QRCode.toFile(out, url, {
  type: 'png',
  width: 600,
  margin: 2,
  color: { dark: '#000000', light: '#ffffff' }
}).then(() => {
  console.log(`QR code saved to: ${out}`);
}).catch(err => {
  console.error('Failed to generate QR code:', err);
  process.exit(1);
});
