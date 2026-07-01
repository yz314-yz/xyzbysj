import { useEffect } from 'react';
import toast from 'react-hot-toast';

import { API_BASE } from '../services/api';

/**
 * 订阅后端子午流注 SSE 流，收到时辰提醒时弹出 toast。
 * 仅在浏览器环境且有 API_BASE 时连接；连接失败静默降级，不影响主功能。
 */
export function useMeridianStream() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return undefined;

    let source;
    try {
      source = new EventSource(`${API_BASE}/api/v1/meridian-stream`);
    } catch {
      return undefined;
    }

    source.addEventListener('connected', () => {
      // 连接成功，不打扰用户
    });

    source.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'meridian-reminder' && payload.meridian) {
          const m = payload.meridian;
          toast(
            `⏰ ${m.name} · ${m.meridian}当令：${m.advice}`,
            { duration: 8000, icon: '🫧' }
          );
        }
      } catch {
        // 忽略无法解析的消息
      }
    });

    source.onerror = () => {
      // 连接断开或失败，静默关闭，不重试（避免控制台刷屏）
      source?.close();
    };

    return () => source?.close();
  }, []);
}
