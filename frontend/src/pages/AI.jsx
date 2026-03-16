import { useState, useRef, useEffect } from 'react';
import { Brain, Send, FileText, Loader, Sparkles, MessageSquare } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function AIPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m Justice AI. I can help you analyze legal cases, summarize documents, answer legal queries, and generate investigation reports. What would you like to explore today?' }
  ]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [docText, setDocText]     = useState('');
  const [docSummary, setDocSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [tab, setTab]             = useState('chat');
  const bottomRef                 = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setLoading(true);
    try {
      const history = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
      const { data } = await api.post('/ai/query', { question, context: history });
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (e) {
      const errMsg = e.response?.data?.message?.includes('API') ? 
        '⚠️ AI service unavailable. Please configure your ANTHROPIC_API_KEY in the backend .env file.' :
        'Failed to get AI response. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
    } finally { setLoading(false); }
  };

  const summarizeDoc = async () => {
    if (!docText.trim()) return toast.error('Paste a document to summarize');
    setSummaryLoading(true);
    try {
      const { data } = await api.post('/ai/summarize/document', { text: docText });
      setDocSummary(data.summary);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Summarization failed');
    } finally { setSummaryLoading(false); }
  };

  const quickPrompts = [
    'What are the key elements of a criminal case?',
    'Explain the burden of proof in criminal law',
    'What is the difference between circumstantial and direct evidence?',
    'How does habeas corpus work in Indian law?',
  ];

  const tabStyle = (t) => ({
    padding: '8px 20px', borderRadius: '6px',
    fontFamily: 'var(--font-display)', fontSize: '0.82rem', fontWeight: 600,
    cursor: 'pointer', border: 'none',
    background: tab === t ? 'var(--accent-gold)' : 'transparent',
    color: tab === t ? '#0a0e1a' : 'var(--text-secondary)',
    transition: 'all 0.15s',
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-gold)', letterSpacing: '0.12em', marginBottom: 6 }}>◆ GENERATIVE AI MODULE</div>
        <h1 style={{ fontSize: '1.6rem' }}>AI Legal Analysis</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', width: 'fit-content', border: '1px solid var(--border)' }}>
        <button style={tabStyle('chat')} onClick={() => setTab('chat')}><MessageSquare size={13} style={{ display: 'inline', marginRight: 6 }} />Legal Q&amp;A</button>
        <button style={tabStyle('summarize')} onClick={() => setTab('summarize')}><FileText size={13} style={{ display: 'inline', marginRight: 6 }} />Summarize Document</button>
      </div>

      {tab === 'chat' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
          {/* Messages */}
          <div className="card" style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--accent-gold), #8b6914)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Brain size={16} color="#0a0e1a" />
                  </div>
                )}
                <div style={{
                  maxWidth: '70%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  background: msg.role === 'user' ? 'rgba(59,130,246,0.2)' : 'var(--bg-secondary)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
                  fontFamily: 'var(--font-body)', fontSize: '0.97rem', lineHeight: 1.7,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 700, color: 'white', fontSize: '0.8rem' }}>
                    U
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-gold), #8b6914)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={16} color="#0a0e1a" />
                </div>
                <div style={{ padding: '12px 18px', background: 'var(--bg-secondary)', borderRadius: '4px 16px 16px 16px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-gold)', animation: 'pulse 1.2s ease infinite', animationDelay: `${i * 0.2}s` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {quickPrompts.map(q => (
                <button key={q} className="btn btn-secondary btn-sm" style={{ fontSize: '0.78rem' }}
                  onClick={() => { setInput(q); }}>
                  <Sparkles size={11} /> {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              className="input" value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask anything about legal cases, laws, investigation procedures..."
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={sendMessage} disabled={loading || !input.trim()}>
              {loading ? <div className="loader" style={{ width: 16, height: 16 }} /> : <Send size={16} />}
            </button>
          </div>
        </div>
      )}

      {tab === 'summarize' && (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, minHeight: 0 }}>
          {/* Input */}
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: 12, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={15} color="var(--accent-gold)" /> Paste Legal Document
            </h3>
            <textarea
              className="input"
              value={docText}
              onChange={e => setDocText(e.target.value)}
              placeholder="Paste your legal document, FIR, judgment, or case file here..."
              style={{ flex: 1, resize: 'none', minHeight: 300, fontFamily: 'var(--font-body)', lineHeight: 1.7 }}
            />
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={summarizeDoc} disabled={summaryLoading || !docText}>
              {summaryLoading ? <><div className="loader" style={{ width: 16, height: 16 }} /> Analyzing...</> : <><Brain size={15} /> Summarize with AI</>}
            </button>
          </div>

          {/* Output */}
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: 12, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={15} color="var(--accent-gold)" /> AI Summary
            </h3>
            {docSummary ? (
              <div style={{ flex: 1, overflow: 'auto', fontFamily: 'var(--font-body)', fontSize: '0.97rem', lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                {docSummary}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text-muted)' }}>
                <Brain size={40} style={{ opacity: 0.2 }} />
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', textAlign: 'center' }}>
                  AI summary will appear here<br />after you paste a document and click Summarize
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
