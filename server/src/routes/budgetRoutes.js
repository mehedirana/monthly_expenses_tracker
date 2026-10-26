
const express = require("express");
const router = express.Router();

const {
  getBudget,
  saveBudget,
} = require("../controllers/budgetController");

router.get("/", getBudget);
router.put("/", saveBudget);

module.exports = router;
