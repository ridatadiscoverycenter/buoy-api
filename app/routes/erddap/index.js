const express = require("express");
const router = express.Router();

const buoyRouter = require("@/routes/erddap/buoy");
router.use(buoyRouter);

const da = require("@/routes/erddap/da");
router.use("/da", da.router);

const fish = require("@/routes/erddap/fish");
router.use("/fish", fish.router);

module.exports = router;
