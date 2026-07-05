import { MessageCircle, Send } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { sendChatMessage } from '../services/api';

export function ChatPanel({ result, token }) {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const threadRef = useRef(null);
  const abortRef = useRef(null);
  const hasResult = useMemo(() => result.sevenDayPlan?.length > 0, [result.sevenDayPlan?.length]);

  // 卸载时取消进行中的请求
  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    const thread = threadRef.current;
    if (!thread) return undefined;
    const raf = window.requestAnimationFrame(() => {
      if (typeof thread.scrollTo === 'function') {
        thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
      } else {
        thread.scrollTop = thread.scrollHeight;
      }
    });
    return () => window.cancelAnimationFrame(raf);
  }, [messages.length, loading]);

  async function submit(event) {
    event.preventDefault();
    const content = question.trim();
    if (!content || !hasResult || loading) return;

    const userMessage = { role: 'user', content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setQuestion('');
    setLoading(true);

    // 取消上一次未完成的请求
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const payload = await sendChatMessage({
        question: content,
        result,
        messages: messages.slice(-6),
      }, token, controller.signal);
      const assistantMessage = {
        role: 'assistant',
        content: payload.data.reply,
        offline: payload.data.available === false,
      };
      setMessages((current) => [...current, assistantMessage]);
      if (assistantMessage.offline) toast('当前为离线演示模式，AI 对话暂不可用。');
    } catch (error) {
      if (error.name === 'AbortError') return; // 卸载或被新请求取代，静默忽略
      const assistantMessage = {
        role: 'assistant',
        content: error.message || 'AI 对话暂不可用，请稍后再试。',
        offline: true,
      };
      setMessages((current) => [...current, assistantMessage]);
      toast.error(assistantMessage.content);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(false);
    }
  }

  return (
    <section className="panel chat-panel" id="chat">
      <div className="section-title">
        <MessageCircle size={20} />
        <h2>AI 养生问答</h2>
        <span>{hasResult ? '当前方案上下文' : '等待方案'}</span>
      </div>

      <div className="chat-thread" aria-live="polite" ref={threadRef}>
        {!messages.length && (
          <div className="chat-empty">
            {hasResult
              ? '可围绕当前体质方向、七日计划和执行细节追问。'
              : '生成七日方案后，对话助手会读取当前方案作为上下文。'}
          </div>
        )}
        {messages.map((message, index) => (
          <article
            className={`chat-message is-${message.role}${message.offline ? ' is-offline' : ''}`}
            key={`${message.role}-${index}-${message.content.slice(0, 12)}`}
          >
            <strong>{message.role === 'user' ? '我' : '助手'}</strong>
            <p>{message.content}</p>
          </article>
        ))}
      </div>

      <form className="chat-form" onSubmit={submit}>
        <input
          aria-label="养生追问"
          disabled={!hasResult || loading}
          maxLength={500}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={hasResult ? '例如：晚餐怎么安排更合适？' : '请先生成方案'}
          value={question}
        />
        <button className="ghost" type="submit" disabled={!hasResult || !question.trim() || loading}>
          <Send size={16} /> {loading ? '发送中' : '发送'}
        </button>
      </form>
    </section>
  );
}
