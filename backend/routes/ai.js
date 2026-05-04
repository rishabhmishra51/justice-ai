const router = require('express').Router();
const axios  = require('axios');
const OpenAI = require('openai');
const { Groq } = require('groq-sdk');
const auth   = require('../middleware/auth');
const { Case, Evidence } = require('../models');

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || process.env.AI_MODEL || 'claude-sonnet-4-20250514';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
const GROQ_MODEL = process.env.GROQ_MODEL || 'groq/compound';

let groq = null;
let openai = null;

// Initialize Groq (PRIMARY)
if (process.env.GROQ_API_KEY) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  console.log('✅ Groq API initialized');
}

// Initialize OpenAI (FALLBACK)
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log('✅ OpenAI API initialized');
}

async function callLLM(systemPrompt, userMessage) {
  const errors = [];

  // Priority 1: Groq (Fastest & Most Cost-Effective)
  if (groq) {
    try {
      console.log(`⚡ Calling Groq with model: ${GROQ_MODEL}`);
      const message = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        model: GROQ_MODEL,
        temperature: 0.2,
        max_tokens: 1024
      });
      const result = message.choices?.[0]?.message?.content || '';
      if (result) return result;
    } catch (error) {
      console.error('❌ Groq Error:', error.message);
      errors.push(`Groq: ${error.message}`);
    }
  }

  // Priority 2: OpenAI (Fast & Reliable)
  if (openai) {
    try {
      console.log(`🤖 Calling OpenAI with model: ${OPENAI_MODEL}`);
      const result = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
        max_tokens: 1500,
        temperature: 0.2
      });
      const answer = result.choices?.[0]?.message?.content || '';
      if (answer) return answer;
    } catch (error) {
      console.error('❌ OpenAI Error:', error.message);
      errors.push(`OpenAI: ${error.message}`);
    }
  }

  // Priority 3: Claude/Anthropic (Fallback only if others fail)
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      console.log(`🤖 Calling Claude with model: ${CLAUDE_MODEL}`);
      const response = await axios.post(ANTHROPIC_API, {
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      }, {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      });
      const result = response.data.content?.[0]?.text || response.data?.completion || '';
      if (result) return result;
    } catch (error) {
      console.error('❌ Anthropic Error:', error.response?.data || error.message);
      errors.push(`Anthropic: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // All providers failed
  const errorMsg = errors.length > 0 ? errors.join(' | ') : 'No AI provider configured';
  throw new Error(`All AI providers failed: ${errorMsg}`);
}

// Health check for AI service
router.get('/health', (req, res) => {
  const status = {
    groq: !!groq,
    groq_model: GROQ_MODEL,
    openai: !!openai,
    openai_model: OPENAI_MODEL,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    claude_model: CLAUDE_MODEL,
    primary_provider: groq ? 'Groq' : openai ? 'OpenAI' : 'Anthropic'
  };
  res.json({ success: true, ...status });
});

// Summarize a legal case
router.post('/summarize/case/:caseId', auth, async (req, res) => {
  try {
    const c = await Case.findByPk(req.params.caseId, { include: [Evidence] });
    if (!c) return res.status(404).json({ success: false, message: 'Case not found' });

    const caseText = `
CASE: ${c.case_number} - ${c.title}
Status: ${c.status} | Priority: ${c.priority} | Jurisdiction: ${c.jurisdiction || 'N/A'}
Category: ${c.category || 'N/A'}
Filed: ${c.filed_date || 'N/A'}

Description:
${c.description || 'No description provided'}

Evidence (${c.Evidence?.length || 0} items):
${c.Evidence?.map(e => `- ${e.title} (${e.type}): ${e.description || ''}`).join('\n') || 'None'}

Verdict: ${c.verdict || 'Pending'}
    `.trim();

    const summary = await callLLM(
      'You are a legal AI assistant for Justice AI. Provide a concise, structured summary of legal cases. Focus on key facts, evidence strength, and investigation insights. Be professional and objective.',
      `Please provide a comprehensive legal summary of this case:\n\n${caseText}`
    );

    // Save summary to case
    await c.update({ ai_summary: summary });

    res.json({ success: true, summary, case_id: req.params.caseId });
  } catch (err) {
    console.error('❌ Case Summarization Error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'AI service error',
      error: process.env.NODE_ENV === 'development' ? err.toString() : undefined
    });
  }
});

// Summarize a text document
router.post('/summarize/document', auth, async (req, res) => {
  try {
    const { text, type = 'legal document' } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Text required' });

    const summary = await callLLM(
      'You are a legal AI assistant. Summarize legal documents clearly and concisely, extracting key information, dates, parties involved, and critical legal points.',
      `Summarize this ${type}:\n\n${text}`
    );

    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.response?.data?.error?.message || err.message });
  }
});

// Legal Q&A
router.post('/query', auth, async (req, res) => {
  try {
    const { question, context, case_id } = req.body;
    if (!question) return res.status(400).json({ success: false, message: 'Question required' });

    let systemContext = '';
    if (case_id) {
      const c = await Case.findByPk(case_id, { include: [Evidence] });
      if (c) {
        // Limit case context to prevent request size issues
        const evidenceTitles = c.Evidence?.slice(0, 3).map(e => e.title).join(', ') || 'None';
        systemContext = `\n\nCase: ${c.case_number} - ${c.title}\nStatus: ${c.status}\nEvidence: ${evidenceTitles}`;
      }
    }

    const answer = await callLLM(
      'You are Justice AI, a legal assistant. Answer questions about law accurately and professionally.',
      context ? `Context: ${context}\n\nQuestion: ${question}` : question
    );

    res.json({ success: true, answer, question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.response?.data?.error?.message || err.message });
  }
});

// Analyze evidence
router.post('/analyze/evidence/:evidenceId', auth, async (req, res) => {
  try {
    const e = await Evidence.findByPk(req.params.evidenceId);
    if (!e) return res.status(404).json({ success: false, message: 'Evidence not found' });

    const analysis = await callLLM(
      'You are a forensic AI analyst. Analyze evidence items for legal proceedings, assessing relevance, reliability, and investigative value.',
      `Analyze this evidence item:\nTitle: ${e.title}\nType: ${e.type}\nDescription: ${e.description}\nCollected by: ${e.collected_by}\nChain of custody: ${e.chain_of_custody || 'Not documented'}`
    );

    res.json({ success: true, analysis, evidence_id: req.params.evidenceId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Generate investigation report
router.post('/report/:caseId', auth, async (req, res) => {
  try {
    const c = await Case.findByPk(req.params.caseId, { include: [Evidence] });
    if (!c) return res.status(404).json({ success: false, message: 'Case not found' });

    const prompt = `Generate a formal investigation report for:
Case Number: ${c.case_number}
Title: ${c.title}
Status: ${c.status}
Priority: ${c.priority}
Jurisdiction: ${c.jurisdiction}
Description: ${c.description}
Evidence Count: ${c.Evidence?.length || 0}
Evidence: ${c.Evidence?.map(e => `${e.title} (${e.type})`).join(', ')}
Current Verdict: ${c.verdict || 'Pending'}

Include: Executive Summary, Key Findings, Evidence Analysis, Recommendations, and Next Steps.`;

    const report = await callLLM(
      'You are a senior legal analyst. Generate comprehensive, professional investigation reports following standard legal documentation practices.',
      prompt
    );

    res.json({ success: true, report, case_number: c.case_number });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
