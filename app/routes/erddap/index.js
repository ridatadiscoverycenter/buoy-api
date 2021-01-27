const express = require("express");
const router = express.Router();

const buoyRouter = require("@/routes/erddap/buoy");
router.use(buoyRouter);

module.exports = router;
