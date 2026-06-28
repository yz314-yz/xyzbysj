import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Trash2 } from 'lucide-react';

import { ACCEPTED_IMAGE_INPUT, ACCEPTED_IMAGE_TYPES } from '../constants/app';

export function FileDrop({ id, title, hint, icon: Icon, file, onChange, onRemove, onError }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function selectFile(nextFile) {
    if (!nextFile) return;
    if (!ACCEPTED_IMAGE_TYPES.has(nextFile.type)) {
      onError('仅支持 JPG、PNG 或 WEBP 图片。');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    onError('');
    onChange(nextFile);
    if (inputRef.current) inputRef.current.value = '';
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
      className={`drop ${file ? 'is-ready' : ''} ${isDragging ? 'is-dragging' : ''}`}
      role="button"
      tabIndex={0}
      onClick={openPicker}
      onKeyDown={handleKeyDown}
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
      <small>{file ? file.name : hint}</small>
      {file && (
        <b>
          <Check size={14} /> 已记录
        </b>
      )}
      {file && (
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
