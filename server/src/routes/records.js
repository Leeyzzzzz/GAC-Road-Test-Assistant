const express = require('express');
const router = express.Router();
const { getRecordsBySession, getRecordById, createRecord, updateRecord } = require('../models/queries');

// GET /api/records?session_id= - list records
router.get('/', (req, res) => {
  const sessionId = req.query.session_id;
  if (!sessionId) {
    return res.status(400).json({ error: 'session_id 必填' });
  }
  const records = getRecordsBySession(Number(sessionId));
  res.json(records);
});

// POST /api/records - create record
router.post('/', (req, res) => {
  const { session_id } = req.body;
  if (!session_id) {
    return res.status(400).json({ error: 'session_id 必填' });
  }
  const record = createRecord(req.body);
  res.status(201).json(record);
});

// GET /api/records/:id
router.get('/:id', (req, res) => {
  const record = getRecordById(Number(req.params.id));
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }
  res.json(record);
});

// PUT /api/records/:id - update record
router.put('/:id', (req, res) => {
  const record = updateRecord(Number(req.params.id), req.body);
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }
  res.json(record);
});

module.exports = router;
