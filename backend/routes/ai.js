const router = require('express').Router();
const axios  = require('axios');
const OpenAI = require('openai');
const auth   = require('../middleware/auth');
const { Case, Evidence } = require('../models');

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = process.env.AI_MODEL || 'claude-sonnet-4-20250514';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function callLLM(systemPrompt, userMessage) {
  if (openai) {
    const result = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
      max_tokens: 1500,
      temperature: 0.2
    });
    return result.choices?.[0]?.message?.content || '';
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('No AI key configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.');
  }

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
  return response.data.content?.[0]?.text || response.data?.completion || '';
}

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
    console.error('AI Error:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'AI service error: ' + (err.response?.data?.error?.message || err.message) });
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
        systemContext = `\n\nCurrent Case Context:\nCase: ${c.case_number} - ${c.title}\nStatus: ${c.status}\nDescription: ${c.description}\nEvidence: ${c.Evidence?.map(e => e.title).join(', ')}`;
      }
    }

    const answer = await callLLM(
      `You are Justice AI, an intelligent legal assistant. Answer questions about legal cases, judicial procedures, and investigative analysis accurately and professionally. ${systemContext}`,
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
