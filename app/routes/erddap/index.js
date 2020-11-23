const express = require('express');
const router = express.Router();

const buoyRouter = require('@/routes/erddap/buoy');
router.use('/buoy', buoyRouter);

module.exports = router;
