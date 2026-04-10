const express = require('express');
const router = express.Router();
const { getAllSessions, getSessionById, createSession, updateSession } = require('../models/queries');

// GET /api/sessions - list sessions (optional ?project_id= filter)
router.get('/', (req, res) => {
  const projectId = req.query.project_id ? Number(req.query.project_id) : null;
  const sessions = getAllSessions(projectId);
  res.json(sessions);
});

// POST /api/sessions - create session
router.post('/', (req, res) => {
  const { project_id, tester, test_date, vehicle_info, route } = req.body;
  if (!project_id || !tester || !test_date) {
    return res.status(400).json({ error: '项目ID、测试人员、测试日期必填' });
  }
  const session = createSession({ project_id, tester, test_date, vehicle_info, route });
  res.status(201).json(session);
});

// GET /api/sessions/:id
router.get('/:id', (req, res) => {
  const session = getSessionById(Number(req.params.id));
  if (!session) {
    return res.status(404).json({ error: '试验不存在' });
  }
  res.json(session);
});

// PUT /api/sessions/:id - update session
router.put('/:id', (req, res) => {
  const session = updateSession(Number(req.params.id), req.body);
  if (!session) {
    return res.status(404).json({ error: '试验不存在' });
  }
  res.json(session);
});

module.exports = router;
