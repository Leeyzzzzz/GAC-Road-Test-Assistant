const express = require('express');
const router = express.Router();
const { getAllProjects, getProjectById, createProject } = require('../models/queries');

// GET /api/projects - list all projects
router.get('/', (req, res) => {
  const projects = getAllProjects();
  res.json(projects);
});

// POST /api/projects - create project
router.post('/', (req, res) => {
  const { name, tech_lead } = req.body;
  if (!name) {
    return res.status(400).json({ error: '项目名称必填' });
  }
  const project = createProject({ name, tech_lead });
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

module.exports = router;
