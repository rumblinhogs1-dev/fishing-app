import { useState, useRef, useEffect } from 'react';
import { getApiKey, hasEnvKey, API_URL, fetchWithRetry, extractJSON, getResponseText } from '../../utils/gemini';
import { buildCatchSummary } from '../../utils/insightsCompute';
import styles from '../Insights.module.css';

const SUGGESTED = [
  'What patterns do you see in my fishing data?',
  'What should I fish for this weekend?',
  'Which lure should I try next?',
  'Where am I most likely to catch my next PB?',
  "What's my biggest weakness as an angler?",
];

export default function AICoachTab({ catches }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage(text) {
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const key = getApiKey();
      if (!key?.trim() && !hasEnvKey()) {
        throw new Error('API key is required. Sign in or add your Gemini key in settings.');
      }

      const summary = buildCatchSummary(catches);
      const systemPrompt = `You are an expert AI fishing coach analyzing a specific angler's personal catch data. Use the data below to give personalized, actionable advice. Be specific — reference their actual species, locations, lures, and patterns. Keep responses concise (2-4 paragraphs). Use a friendly, knowledgeable tone.

${summary}

Today's date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`;

      const conversationHistory = messages.concat(userMsg).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

      // Add system prompt as the first user message context
      const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'I have your catch data loaded and ready to analyze. What would you like to know?' }] },
        ...conversationHistory,
      ];

      const res = await fetchWithRetry(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }, key);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API error ${res.status}`);
      }

      const json = await res.json();
      const answer = getResponseText(json) || 'No response received.';

      setMessages((prev) => [...prev, { role: 'assistant', text: answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>AI Fishing Coach</h3>
      <p className={styles.coachIntro}>
        Ask questions about your fishing data and get personalized advice based on your catch history.
      </p>

      {messages.length === 0 && (
        <div className={styles.suggestedQuestions}>
          {SUGGESTED.map((q) => (
            <button key={q} className={styles.suggestedBtn} onClick={() => sendMessage(q)}>
              {q}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className={styles.chatMessages} ref={scrollRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`${styles.chatBubble} ${msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAI}`}>
              {msg.text}
            </div>
          ))}
          {loading && (
            <div className={`${styles.chatBubble} ${styles.chatBubbleAI}`}>
              <span className={styles.typingDots}>Analyzing your data...</span>
            </div>
          )}
        </div>
      )}

      <div className={styles.chatInputRow}>
        <input
          type="text"
          className={styles.chatInput}
          placeholder="Ask about your fishing data..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
          disabled={loading}
        />
        <button
          className={styles.chatSendBtn}
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
