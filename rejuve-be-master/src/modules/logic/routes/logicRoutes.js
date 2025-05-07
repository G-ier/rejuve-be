const express = require('express');
const router = express.Router();

// Import the LogicController class
const LogicController = require('../controllers/logicController');
const logicController = new LogicController();
// The authMiddleware is now applied globally in the server configuration

// Orders routes
router.post('/orders', async (req, res) => {
  await logicController.createOrder(req, res);
});

router.get('/orders/:userId', async (req, res) => {
  await logicController.listOrdersByPatient(req, res);
});

router.post('/orders/shipping-address', async (req, res) => {
  await logicController.createAddress(req, res);
});

// Offerings routes
router.get('/offerings', async (req, res) => {
  await logicController.listOfferings(req, res);
});

router.post('/offerings/store-card', async (req, res) => {
  await logicController.storeCard(req, res);
});

router.post('/offerings/subscribe', async (req, res) => {
  await logicController.subscribeToPlan(req, res);
});

router.post('/offerings/payment-cards', async (req, res) => {
  await logicController.getPaymentCards(req, res);
});

router.post('/offerings/package-selections', async (req, res) => {
  await logicController.getUserPackageSelections(req, res);
});

// Clients routes - ALIST
router.post('/clients/create', async (req, res) => {
  await logicController.createClient(req, res);
});

router.get('/clients/user-groups', async (req, res) => {
  await logicController.retrieveUserGroups(req, res);
});

// Forms routes - ALIST
router.post('/forms/answer/upload', async (req, res) => {
  await logicController.uploadFormAnswers(req, res);
});

// Users routes
router.post('/users/create-entry', async (req, res) => {
  await logicController.createEntry(req, res);
});

router.get('/users/check-eligibility/:id', async (req, res) => {
  await logicController.checkEligibility(req, res);
});

// Composite routes
router.post('/flow/complete-questionnaire', async (req, res) => {
  await logicController.completeQuestionnaire(req, res);
});

module.exports = router; 