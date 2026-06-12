const express = require("express");
const { listModules } = require("../services/moduleRegistry");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    modules: listModules()
  });
});

module.exports = router;
