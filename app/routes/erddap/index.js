const express = require('express');
const router = express.Router();

const buoyRouter = require('./buoy');
router.use('/buoy', buoyRouter);

module.exports = router;
