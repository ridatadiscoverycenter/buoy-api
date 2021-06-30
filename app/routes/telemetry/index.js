const express = require("express");
const router = express.Router();
const { getLatestRecord, getRecordsSince } = require("@/clients/telemetry.js");

const BUOY_IDS = ["Buoy-620", "Buoy-720", "Castle_Hill"];
const TABLE_TYPES = [
  "Debug",
  "ECO",
  "GPSData",
  "Hydrocat",
  "Hydrocycle",
  "MetData",
  "PAR",
  "Power",
  "RAS",
  "SUNA",
  "System",
  "gsmInfo",
];

// make sure the url matches tables and buoys we know about
router.param("buoyId", (req, res, next, buoyId) => {
  if (BUOY_IDS.includes(buoyId)) {
    next();
  } else {
    next(new Error("unknown Buoy ID"));
  }
});

router.param("tableType", (req, res, next, tableType) => {
  if (TABLE_TYPES.includes(tableType)) {
    next();
  } else {
    next(new Error("unknown Table Type"));
  }
});

/**
 * @swagger
 * /telemetry/:buoyId/:tableType/lastone:
 *   get:
 *     description: Get the last telemetry record for this buoy and table type
 *     parameters:
 *     responses:
 *       200:
 *         description: Success! New content is now available.
 *
 */

// Ex:  http://localhost:8088/telemetry/Buoy-620/System/lastone
router.get("/:buoyId/:tableType/lastone", async (req, res) => {
  const result = await getLatestRecord(req.params.buoyId, req.params.tableType);
  res.send(result);
});

/**
 * @swagger
 * /telemetry/:buoyId/:tableType/lastday:
 *   get:
 *     description: Get the last day of telemetry records for this buoy and table type
 *     parameters:
 *     responses:
 *       200:
 *         description: Success! New content is now available.
 *
 */

// Ex:  http://localhost:8088/telemetry/Buoy-620/System/lastday
router.get("/:buoyId/:tableType/lastday", async (req, res) => {
  const startDt = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const result = await getRecordsSince(
    req.params.buoyId,
    req.params.tableType,
    startDt
  );
  res.send(result);
});

/**
 * @swagger
 * /telemetry/:buoyId/:tableType/lastweek:
 *   get:
 *     description: Get the last week of telemetry records for this buoy and table type
 *     parameters:
 *     responses:
 *       200:
 *         description: Success! New content is now available.
 *
 */

// Ex:  http://localhost:8088/telemetry/Buoy-620/System/lastweek
router.get("/:buoyId/:tableType/lastweek", async (req, res) => {
  const startDt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const result = await getRecordsSince(
    req.params.buoyId,
    req.params.tableType,
    startDt
  );
  res.send(result);
});

module.exports = router;
