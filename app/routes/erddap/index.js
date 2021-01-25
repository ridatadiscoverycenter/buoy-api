const express = require("express");
const router = express.Router();

const buoyRouter = require("@/routes/erddap/buoy");
router.use("/buoy", buoyRouter);

const modelRouter = require("@/routes/erddap/model");
router.use("/model", modelRouter);

module.exports = router;
