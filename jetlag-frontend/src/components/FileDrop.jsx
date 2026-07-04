import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Trash2 } from 'lucide-react';

import { ACCEPTED_IMAGE_INPUT, ACCEPTED_IMAGE_TYPES } from '../constants/app';
import { analyzeBrowserImage } from '../inference/browserVision';

const ACCEPTED_IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|heic|heif)$/i;

function isAcceptedImageCandidate(file) {
  if (!file) return false;
  if (ACCEPTED_IMAGE_TYPES.has(file.type)) return true;
  if (file.type?.startsWith('image/') && file.type !== 'image/svg+xml') return true;
  return ACCEPTED_IMAGE_EXTENSIONS.test(file.name || '');
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
    if (!isAcceptedImageCandidate(nextFile)) {
      onError('请上传手机照片或 JPG、PNG、WEBP、HEIC 图片。');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setProcessing(true);
    onError('');
    try {
      const { file: compressed, features } = await analyzeBrowserImage(nextFile, id);
      onChange(compressed, features);

      if (features.safetyGate !== 'pass') {
        const { lightLevel, clarity } = features.observedFeatures;
        onError(`${title}${lightLevel}、${clarity}，已接收，可继续生成；结果页会标记为建议复核。`);
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
        capture={id === 'palm' ? 'environment' : 'user'}
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
