const express = require("express");
const router = express.Router();

const buoyRouter = require("@/routes/erddap/buoy");
router.use(buoyRouter);

const da = require("@/routes/erddap/da");
router.use("/da", da.router);

module.exports = router;
