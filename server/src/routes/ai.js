const express = require('express');
const router = express.Router();
const { speechToText, extractFields } = require('../services/ai-service');
const { getRecordById, updateRecord } = require('../models/queries');

// POST /api/ai/transcribe - speech to text
router.post('/transcribe', async (req, res) => {
  const { audio_url } = req.body;
  if (!audio_url) {
    return res.status(400).json({ error: 'audio_url 必填' });
  }
  try {
    const text = await speechToText(audio_url);
    res.json({ text });
  } catch (err) {
    console.error('Transcription error:', err.message);
    res.status(500).json({ error: '语音识别失败: ' + err.message });
  }
});

// POST /api/ai/extract - extract structured fields
router.post('/extract', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'text 必填' });
  }
  try {
    const fields = await extractFields(text);
    res.json(fields);
  } catch (err) {
    console.error('Extraction error:', err.message);
    res.status(500).json({ error: '结构化提取失败: ' + err.message });
  }
});

// POST /api/ai/process-record - full pipeline: transcribe + extract + update record
router.post('/process-record', async (req, res) => {
  const { record_id, audio_url } = req.body;
  if (!record_id) {
    return res.status(400).json({ error: 'record_id 必填' });
  }

  const record = getRecordById(record_id);
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }

  try {
    // Step 1: Speech to text (if audio_url provided)
    let rawText = record.raw_text;
    if (audio_url) {
      rawText = await speechToText(audio_url);
    }

    // Step 2: Extract structured fields
    const fields = rawText ? await extractFields(rawText) : {};

    // Step 3: Update record
    const updated = updateRecord(record_id, {
      raw_text: rawText,
      summary: fields.summary,
      problem_type: fields.problemType,
      severity: fields.severity,
      details: fields.details,
    });

    res.json(updated);
  } catch (err) {
    console.error('Process record error:', err.message);
    res.status(500).json({ error: 'AI 处理失败: ' + err.message });
  }
});

module.exports = router;
