// utils/workflowUtils.js
const Workflow = require('../models/workflowSchema');
const User = require('../models/userSchema');

async function getNextRecipient(request) {
    // Populate the workflow if not already populated
    if (!request.workflow.steps) {
        await request.populate('workflow');
    }

    const workflow = request.workflow;
    const nextStepNumber = request.currentStep + 1;

    const nextStep = workflow.steps.find(step => step.stepNumber === nextStepNumber);

    if (nextStep) {
        // Fetch users with the required role
        const recipients = await User.find({ occupation: nextStep.role });
        return recipients;
    } else {
        // Workflow is complete
        return null;
    }
}

module.exports = { getNextRecipient };
