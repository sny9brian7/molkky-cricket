const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = chunk('IHDR', ihdrData);

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idatData = zlib.deflateSync(raw, { level: 9 });
  const idat = chunk('IDAT', idatData);
  const iend = chunk('IEND', Buffer.alloc(0));
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function lerp(a, b, t) { return a + (b - a) * t; }

/* 簡易ボックスブラー(横→縦)を数回繰り返すことでガウシアンブラーに近い
   「ぼかし」効果を作る。外部ライブラリなしで実装するための割り切り。 */
function boxBlurPass(rgba, width, height, radius) {
  const temp = Buffer.alloc(rgba.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, count = 0;
      for (let dx = -radius; dx <= radius; dx++) {
        const xx = x + dx;
        if (xx < 0 || xx >= width) continue;
        const idx = (y * width + xx) * 4;
        r += rgba[idx]; g += rgba[idx + 1]; b += rgba[idx + 2]; count++;
      }
      const idx = (y * width + x) * 4;
      temp[idx] = Math.round(r / count);
      temp[idx + 1] = Math.round(g / count);
      temp[idx + 2] = Math.round(b / count);
      temp[idx + 3] = 255;
    }
  }
  const out = Buffer.alloc(rgba.length);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let r = 0, g = 0, b = 0, count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) continue;
        const idx = (yy * width + x) * 4;
        r += temp[idx]; g += temp[idx + 1]; b += temp[idx + 2]; count++;
      }
      const idx = (y * width + x) * 4;
      out[idx] = Math.round(r / count);
      out[idx + 1] = Math.round(g / count);
      out[idx + 2] = Math.round(b / count);
      out[idx + 3] = 255;
    }
  }
  return out;
}

function blur(rgba, width, height, radius, iterations) {
  let buf = rgba;
  for (let i = 0; i < iterations; i++) buf = boxBlurPass(buf, width, height, radius);
  return buf;
}

function drawIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size * 0.36; // 上2/3に同心円、下1/3を文字エリアに残す
  const circleR = size * 0.30;

  const white = [255, 255, 255];
  // ホーム画面の6つのメニュー色を、色相の順に並べた虹色(中心→外周)
  const ringColors = [
    [249, 115, 22],  // レビュー(オレンジ)
    [245, 158, 11],  // システム設定(アンバー)
    [16, 185, 129],  // ノーマル対戦(緑)
    [6, 182, 212],   // カスタム対戦(シアン)
    [139, 92, 246],  // 対戦履歴(紫)
    [236, 72, 153],  // ルール解説(ピンク、最外周)
  ];

  const bandWidth = circleR / ringColors.length;
  const gapRatio = 0.12; // 各リングの境目に入れる白い隙間の割合

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.sqrt(dx * dx + dy * dy);

      let rgb = white;
      if (r <= circleR) {
        const bandIndex = Math.min(ringColors.length - 1, Math.floor(r / bandWidth));
        const posInBand = (r - bandIndex * bandWidth) / bandWidth; // 0..1
        if (posInBand > gapRatio) rgb = ringColors[bandIndex];
      }

      const idx = (y * size + x) * 4;
      rgba[idx] = rgb[0];
      rgba[idx + 1] = rgb[1];
      rgba[idx + 2] = rgb[2];
      rgba[idx + 3] = 255;
    }
  }

  const blurRadius = Math.max(1, Math.round(size * 0.012));
  return blur(rgba, size, size, blurRadius, 3);
}

/* このスクリプトは同心円+ぼかしの「土台」だけを描く。
   文字(「モルクリ！」)は gen-icons-add-text.ps1 が
   System.Drawingでこの土台の上に合成する。 */
const outDir = path.join(__dirname, '..', 'icons');
for (const size of [192, 512]) {
  const rgba = drawIcon(size);
  const png = encodePNG(size, size, rgba);
  fs.writeFileSync(path.join(outDir, `icon-${size}-base.png`), png);
  console.log(`wrote icon-${size}-base.png (${png.length} bytes)`);
}
