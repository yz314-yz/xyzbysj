import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Trash2 } from 'lucide-react';

import { ACCEPTED_IMAGE_INPUT, ACCEPTED_IMAGE_TYPES } from '../constants/app';

const MAX_DIMENSION = 1080;
const JPEG_QUALITY = 0.8;
const BRIGHTNESS_THRESHOLD = 60;

/**
 * 将图片压缩至 MAX_DIMENSION 内，输出 JPEG blob。
 * 同时计算平均亮度（0-255），用于光线不足检测。
 */
function compressAndAnalyze(file) {
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
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // 亮度检测：采样中心区域像素的平均亮度
      let brightness = 128;
      try {
        const sampleSize = Math.min(64, width, height);
        const sx = Math.floor((width - sampleSize) / 2);
        const sy = Math.floor((height - sampleSize) / 2);
        const imageData = ctx.getImageData(sx, sy, sampleSize, sampleSize);
        let total = 0;
        for (let i = 0; i < imageData.data.length; i += 4) {
          // 使用感知亮度公式
          total += 0.299 * imageData.data[i] + 0.587 * imageData.data[i + 1] + 0.114 * imageData.data[i + 2];
        }
        brightness = total / (sampleSize * sampleSize);
      } catch {
        // 跨域或其它异常时跳过亮度检测
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
          resolve({ file: compressed, brightness });
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

export function FileDrop({ id, title, hint, icon: Icon, file, onChange, onRemove, onError }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  async function selectFile(nextFile) {
    if (!nextFile) return;
    if (!ACCEPTED_IMAGE_TYPES.has(nextFile.type)) {
      onError('仅支持 JPG、PNG 或 WEBP 图片。');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setProcessing(true);
    onError('');
    try {
      const { file: compressed, brightness } = await compressAndAnalyze(nextFile);
      onChange(compressed);

      if (brightness < BRIGHTNESS_THRESHOLD) {
        onError('⚠️ 检测到图片光线偏暗，请在光线充足处重新拍摄以获得更准确的分析。');
      }
    } catch (error) {
      onError(error.message || '图片处理失败，请重试。');
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPicker();
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0] || null);
  }

  return (
    <div
      className={`drop ${file ? 'is-ready' : ''} ${isDragging ? 'is-dragging' : ''} ${processing ? 'is-processing' : ''}`}
      role="button"
      tabIndex={0}
      onClick={processing ? undefined : openPicker}
      onKeyDown={processing ? undefined : handleKeyDown}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        id={id}
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept={ACCEPTED_IMAGE_INPUT}
        onChange={(event) => selectFile(event.target.files?.[0] || null)}
      />
      <div className="drop-media">
        {previewUrl ? (
          <img src={previewUrl} alt={`${title}预览`} />
        ) : (
          <span className="drop-icon">
            <Icon size={22} />
          </span>
        )}
      </div>
      <strong>{title}</strong>
      <small>{processing ? '压缩处理中…' : file ? file.name : hint}</small>
      {file && !processing && (
        <b>
          <Check size={14} /> 已压缩记录
        </b>
      )}
      {file && !processing && (
        <button
          className="drop-remove"
          type="button"
          aria-label={`移除${title}`}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
            if (inputRef.current) inputRef.current.value = '';
          }}
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}
