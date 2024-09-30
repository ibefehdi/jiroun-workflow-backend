// routes/workflows.js
const express = require('express');
const router = express.Router();
const Workflow = require('../models/workflowSchema');

// Create a new workflow
router.post('/', async (req, res) => {
    try {
        const { name, requestType, steps } = req.body;

        const workflow = new Workflow({
            name,
            requestType,
            steps,
        });

        const savedWorkflow = await workflow.save();
        res.status(201).json(savedWorkflow);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// routes/workflows.js (continued)

// Get all workflows
router.get('/', async (req, res) => {
    try {
        const workflows = await Workflow.find();
        res.status(200).json(workflows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const workflow = await Workflow.findById(req.params.id);
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        res.status(200).json(workflow);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
module.exports = router;
