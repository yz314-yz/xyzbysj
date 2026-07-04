const MAX_DIMENSION = 1080;
const JPEG_QUALITY = 0.8;
const DARK_THRESHOLD = 60;
const BLUR_THRESHOLD = 9;

const SCOPE_LABELS = {
  tongue: '舌像',
  face: '面相',
  palm: '手相',
};

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function classifyLight(brightness) {
  if (brightness < DARK_THRESHOLD) return '光线偏暗';
  if (brightness > 220) return '光线偏亮';
  return '光线可用';
}

function classifyClarity(sharpness) {
  if (sharpness < BLUR_THRESHOLD) return '清晰度偏低';
  if (sharpness > 24) return '纹理清晰';
  return '清晰度可用';
}

function rgbToHsv({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max * 255;
  return { h, s, v };
}

function classifyColorTone({ r, g, b }, scope) {
  const hsv = rgbToHsv({ r, g, b });
  const warmth = r - b;
  const saturationHint = Math.max(r, g, b) - Math.min(r, g, b);

  if (scope === 'tongue') {
    if (hsv.h > 200 && hsv.h < 300 && hsv.s > 0.12) return '舌色暗沉';
    if (saturationHint < 18 && r > 150) return '舌色淡白';
    if (r < 105 && g < 105 && b < 105) return '舌色暗沉';
    if (warmth > 28 && r > 125) {
      if (hsv.v < 130 && hsv.s > 0.3) return '舌红少津';
      return '舌红';
    }
    return '舌色平和';
  }

  if (scope === 'face') {
    if (r < 105 && g < 105 && b < 110) return '面部暗沉';
    if (saturationHint < 16 && r > 148) return '面色少华';
    if (warmth > 34) {
      if (hsv.s > 0.25 && hsv.v > 170) return '面部潮红';
      return '面部暖色';
    }
    return '面色平和';
  }

  if (scope === 'palm') {
    if (r < 105 && g < 105 && b < 110) return '掌色暗沉';
    if (saturationHint < 16 && r > 148) return '掌色淡';
    if (warmth > 32) {
      if (hsv.s > 0.28) return '掌色红点';
      return '掌色偏红';
    }
    return '掌色平和';
  }

  return warmth > 26 ? '暖色倾向' : '色调平和';
}

function computeImageMetrics(ctx, width, height) {
  const sampleSize = Math.min(96, width, height);
  const sx = Math.max(0, Math.floor((width - sampleSize) / 2));
  const sy = Math.max(0, Math.floor((height - sampleSize) / 2));
  const imageData = ctx.getImageData(sx, sy, sampleSize, sampleSize);
  const { data } = imageData;
  let totalBrightness = 0;
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let sharpnessTotal = 0;
  let sharpnessCount = 0;

  for (let y = 0; y < sampleSize; y += 1) {
    for (let x = 0; x < sampleSize; x += 1) {
      const index = (y * sampleSize + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      totalBrightness += gray;
      totalR += r;
      totalG += g;
      totalB += b;

      if (x + 1 < sampleSize) {
        const next = index + 4;
        const nextGray = 0.299 * data[next] + 0.587 * data[next + 1] + 0.114 * data[next + 2];
        sharpnessTotal += Math.abs(gray - nextGray);
        sharpnessCount += 1;
      }
      if (y + 1 < sampleSize) {
        const next = index + sampleSize * 4;
        const nextGray = 0.299 * data[next] + 0.587 * data[next + 1] + 0.114 * data[next + 2];
        sharpnessTotal += Math.abs(gray - nextGray);
        sharpnessCount += 1;
      }
    }
  }

  const pixelCount = sampleSize * sampleSize;
  return {
    brightness: totalBrightness / pixelCount,
    sharpness: sharpnessCount ? sharpnessTotal / sharpnessCount : 0,
    averageColor: {
      r: totalR / pixelCount,
      g: totalG / pixelCount,
      b: totalB / pixelCount,
    },
  };
}

function buildFeaturePayload({ scope, width, height, sourceType, sourceSize, metrics }) {
  const lightLevel = classifyLight(metrics.brightness);
  const clarity = classifyClarity(metrics.sharpness);
  const colorTone = classifyColorTone(metrics.averageColor, scope);
  const imageQuality = lightLevel === '光线可用' && clarity !== '清晰度偏低' ? 'good' : 'needs_review';
  const confidence = imageQuality === 'good' ? 0.76 : 0.58;
  const scopeLabel = SCOPE_LABELS[scope] || '图像';
  const featureText = [scopeLabel, lightLevel, clarity, colorTone].join('，');

  return {
    engine: 'browser-lightweight-v1',
    modelBacked: false,
    modelKind: 'canvas-quality-color-heuristic',
    runtime: 'visitor-browser',
    analysisScope: scope,
    imageQuality,
    safetyGate: imageQuality === 'good' ? 'pass' : 'review',
    confidence,
    observedFeatures: {
      lightLevel,
      clarity,
      colorTone,
    },
    metrics: {
      width,
      height,
      brightness: round(metrics.brightness),
      sharpness: round(metrics.sharpness),
      averageColor: {
        r: round(metrics.averageColor.r),
        g: round(metrics.averageColor.g),
        b: round(metrics.averageColor.b),
      },
      sourceType,
      sourceSize,
    },
    featureText,
    capturedAt: new Date().toISOString(),
  };
}

export function analyzeBrowserImage(file, scope) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height / width) * MAX_DIMENSION);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width / height) * MAX_DIMENSION);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('浏览器无法读取图片，请更换设备或浏览器重试。'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      let metrics;
      try {
        metrics = computeImageMetrics(ctx, width, height);
      } catch {
        metrics = {
          brightness: 128,
          sharpness: 16,
          averageColor: { r: 128, g: 128, b: 128 },
        };
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('图片压缩失败，请更换图片重试。'));
            return;
          }

          const compressed = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          resolve({
            file: compressed,
            features: buildFeaturePayload({
              scope,
              width,
              height,
              sourceType: file.type,
              sourceSize: file.size,
              metrics,
            }),
          });
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败，请确认文件未损坏。'));
    };

    img.src = url;
  });
}
