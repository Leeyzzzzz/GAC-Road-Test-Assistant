const express = require('express');
const router = express.Router();
const {
  getAllProjects,
  getArchivedProjects,
  getProjectById,
  createProject,
  updateProject,
  archiveProject,
  restoreProject,
  deleteProject,
} = require('../models/queries');

// GET /api/projects - list active projects
router.get('/', (req, res) => {
  const projects = getAllProjects();
  res.json(projects);
});

// GET /api/projects/archived - list archived projects
router.get('/archived', (req, res) => {
  const projects = getArchivedProjects();
  res.json(projects);
});

// POST /api/projects - create project
router.post('/', (req, res) => {
  const { name, code, tech_lead } = req.body;
  if (!name || !code) {
    return res.status(400).json({ error: '项目名称、项目编号必填' });
  }
  const project = createProject({ name, code, tech_lead });
  res.status(201).json(project);
});

// GET /api/projects/:id
router.get('/:id', (req, res) => {
  const project = getProjectById(Number(req.params.id));
  if (!project) {
    return res.status(404).json({ error: '项目不存在' });
  }
  res.json(project);
});

// PUT /api/projects/:id - update project
router.put('/:id', (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) {
    return res.status(400).json({ error: '项目名称、项目编号必填' });
  }

  const project = updateProject(Number(req.params.id), req.body);
  if (!project) {
    return res.status(404).json({ error: '项目不存在' });
  }
  res.json(project);
});

// PUT /api/projects/:id/archive
router.put('/:id/archive', (req, res) => {
  const project = archiveProject(Number(req.params.id));
  if (!project) {
    return res.status(404).json({ error: '项目不存在' });
  }
  res.json(project);
});

// PUT /api/projects/:id/restore
router.put('/:id/restore', (req, res) => {
  const project = restoreProject(Number(req.params.id));
  if (!project) {
    return res.status(404).json({ error: '项目不存在' });
  }
  res.json(project);
});

// DELETE /api/projects/:id
router.delete('/:id', (req, res) => {
  const deleted = deleteProject(Number(req.params.id));
  if (!deleted) {
    return res.status(404).json({ error: '项目不存在' });
  }
  res.json({ success: true });
});

module.exports = router;
