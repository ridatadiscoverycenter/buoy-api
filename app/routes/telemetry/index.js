const express = require("express");
const router = express.Router();
const ash = require("express-async-handler");

const {
  getLatestRecord,
  getRecordsSince,
  getRecordsRange,
} = require("@/clients/telemetry.js");

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
const RANGES = {
  lastone: () => (bid, table, variables) =>
    getLatestRecord(bid, table, variables),
  lastday: () => (bid, table, variables) =>
    getRecordsSince(bid, table, 1, variables),
  lastweek: () => (bid, table, variables) =>
    getRecordsSince(bid, table, 7, variables),
  range: (req) => {
    const startDate = new Date(req.query.start);
    const endDate = req.query.end ? new Date(req.query.end) : new Date();
    return (bid, table, variables) =>
      getRecordsRange(bid, table, startDate, endDate, variables);
  },
};
const CORE_METRICS = {
  ECO: ["ecoReadingRaw",
   "ecoFDOM",
   "ecoStart"],
  Hydrocat: [
    "hydrocatTemperature",
    "hydrocatConductivity",
    "hydrocatDissOxygen",
    "hydrocatSalinity",
    "hydrocatFluorescence",
    "hydrocatTurbidity",
    "hydrocatPH",
    "hydrocatStartTime"],
  Hydrocycle: [
  "CAPO4",
  "QCflag",
  "Bubbleflag",
  "COVflag",
  "Lowsigflag",
  "OoRflag",
  "Mixingflag",
  "Calflag",
  "Hydrocyclestart"]
  SUNA: ["sunaNitrateMicroMol",
  "sunaStart"],
  MetData: [
    "avgWindSpeed",
    "avgWindDir",
    "gustWindSpeed",
    "gustWindDir",
    "maximetTemperature",
    "maximetPressure",
    "maximetHumidity",
    "maximetPrecipitation",
    "maximetSolar",
    "maximetStart"],
  PAR: ["PARcalibrated",
  "parStart"],
};

// make sure the url matches tables and buoys we know about
router.param("buoyId", (req, res, next, buoyId) => {
  if (BUOY_IDS.includes(buoyId)) {
    next();
  } else {
    next(new Error("unknown Buoy ID"));
  }
});

router.param("tableType", (req, res, next, tableType) => {
  // CoreMetrics has a dedicated route, we don't want an unknown error, but it's also not
  // a table
  if (TABLE_TYPES.includes(tableType) || tableType === "CoreMetrics") {
    next();
  } else {
    next(new Error("unknown Table Type"));
  }
});

router.param("range", (req, res, next, range) => {
  const queryFn = RANGES[range];
  if (queryFn) {
    req.queryFn = queryFn(req);
    next();
  } else {
    next(new Error("unknown query range type"));
  }
});

/**
 * @swagger
 * /telemetry/{buoyId}/CoreMetrics/{range}:
 *   get:
 *     description: Get the core metrics telemetry records for this buoy and table type over the requested range
 *     parameters:
 *       - in: path
 *         name: buoyId
 *         required: true
 *         description: The ID of the buoy to query
 *         type: string
 *         enum:
 *           - Buoy-620
 *           - Buoy-720
 *           - Castle_Hill
 *       - in: path
 *         name: range
 *         required: true
 *         description: The type of date range to query
 *         type: string
 *         enum:
 *           - lastone
 *           - lastday
 *           - lastweek
 *           - range
 *       - in: query
 *         name: start
 *         required: false
 *         description: The start date of a `range` query
 *         type: string
 *         format: date
 *       - in: query
 *         name: end
 *         required: false
 *         description: The end date of a `range` query. Defaults to the current date if not included.
 *         type: string
 *         format: date
 *     responses:
 *       200:
 *         description: Success! New content is now available.
 *
 */

// Ex:  http://localhost:8088/telemetry/Buoy-620/CoreMetrics/lastone
router.get(
  "/:buoyId/CoreMetrics/:range",
  ash(async (req, res) => {
    const results = await Promise.all(
      Object.entries(CORE_METRICS).map(async ([table, vars]) => ({
        [table]: await req.queryFn(req.params.buoyId, table, [
          "TmStamp",
          ...vars,
        ]),
      }))
    );
    // merge the results into one object
    const result = results.reduce((a, b) => ({ ...a, ...b }), {});
    res.send(result);
  })
);

/**
 * @swagger
 * /telemetry/{buoyId}/{tableType}/{range}:
 *   get:
 *     description: Get the telemetry records for this buoy and table type over the requested range
 *     parameters:
 *       - in: path
 *         name: buoyId
 *         required: true
 *         description: The ID of the buoy to query
 *         type: string
 *         enum:
 *           - Buoy-620
 *           - Buoy-720
 *           - Castle_Hill
 *       - in: path
 *         name: tableType
 *         required: true
 *         description: The table to retrieve data from
 *         type: string
 *         enum:
 *           - Debug
 *           - ECO
 *           - GPSData
 *           - Hydrocat
 *           - Hydrocycle
 *           - MetData
 *           - PAR
 *           - Power
 *           - RAS
 *           - SUNA
 *           - System
 *           - gsmInfo
 *       - in: path
 *         name: range
 *         required: true
 *         description: The type of date range to query
 *         type: string
 *         enum:
 *           - lastone
 *           - lastday
 *           - lastweek
 *           - range
 *       - in: query
 *         name: start
 *         required: false
 *         description: The start date of a `range` query
 *         type: string
 *         format: date
 *       - in: query
 *         name: end
 *         required: false
 *         description: The end date of a `range` query. Defaults to the current date if not included.
 *         type: string
 *         format: date
 *     responses:
 *       200:
 *         description: Success! New content is now available.
 *
 */

// Ex:  http://localhost:8088/telemetry/Buoy-620/System/lastone
router.get(
  "/:buoyId/:tableType/:range",
  ash(async (req, res) => {
    const result = await req.queryFn(req.params.buoyId, req.params.tableType);
    res.send(result);
  })
);

module.exports = router;
