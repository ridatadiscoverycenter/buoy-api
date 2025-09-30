const express = require("express");
const router = express.Router();
const ash = require("express-async-handler");

const {
  getLatestRecord,
  getRecordsSince,
  getRecordsRange,
  getHourlyRecordsRange,
} = require("@/clients/breathepvd.js");

SENSOR_IDS = [
  "250",
  "254",
  "258",
  "261",
  "264",
  "267",
  "270",
  "274",
  "276",
  "251",
  "252",
  "255",
  "257",
  "259",
  "262",
  "263",
  "272",
  "266",
  "269",
  "265",
  "268",
  "256",
  "260",
];
PM_IDS = ["00810", "00811", "00812"];

const getTimestampVar = (table) => {
  return table === "sensor" ? "local_timestamp" : "timestamp_local";
};

const getVariables = (table) => {
  return table === "sensor" ?  ['co2_corrected_avg_t_drift_applied', 'co_corrected'] : ['pm1', 'pm25', 'pm10'];
};
const RANGES = {
  lastone: () => (sensor, table, timestampVar, variables) =>
    getLatestRecord(sensor, table, timestampVar, variables),
  lastday: () => (sensor, table, timestampVar, variables) =>
    getRecordsSince(sensor, table, timestampVar, 1, variables),
  lastweek: () => (sensor, table, timestampVar, variables) =>
    getRecordsSince(sensor, table, timestampVar, 2, variables),
  range: (req) => {
    const startDate = new Date(req.query.start);
    const endDate = req.query.end ? new Date(req.query.end) : new Date();
    return (sensor, table, timestampVar, variables) => getRecordsRange(
      sensor,
      table,
      timestampVar,
      startDate,
      endDate,
      variables,
    );
  },
  hourly: (req) => {
    const startDate = new Date(req.query.start);
    const endDate = req.query.end ? new Date(req.query.end) : new Date();
    return (sensor, table, timestampVar, variables) => getHourlyRecordsRange(
      sensor,
      table,
      timestampVar,
      startDate,
      endDate,
      variables,
    );
  },
};

// make sure the url matches sensors we know about

router.param("range", (req, res, next, range) => {
  const queryFn = RANGES[range];
  if (queryFn) {
    req.queryFn = queryFn(req);
    next();
  } else {
    next(new Error("unknown query range type"));
  }
});

// swagger for QuantAQ PM data
/**
 * @swagger
 * /breathepvd/pm/{sensor_id}/{range}:
 *   get:
 *     description: Get the BreathePVD records for this buoy and table type over the requested range
 *     parameters:
 *       - in: path
 *         name: sensor_id
 *         required: true
 *         description: Data source
 *         type: string
 *         enum:
 *           - '00810'
 *           - '00811'
 *           - '00812'
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
 *           - hourly
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

// Ex:  http://localhost:8088/breathepvd/pm/lastone
router.get(
  "/:table/:sensor_id/:range",
  ash(async (req, res) => {
    const result = await req.queryFn(
      req.params.table,
      req.params.sensor_id,
      getTimestampVar(req.params.table),
      getVariables(req.params.table)
    );
    res.send(result);
  })
);

// Swagger route for sensor data
/**
 * @swagger
 * /breathepvd/sensor/{sensor}/{range}:
 *   get:
 *     description: Get the BreathePVD records for this buoy and table type over the requested range
 *     parameters:
 *       - in: path
 *         name: sensor
 *         required: true
 *         description: The ID of the sensor to query
 *         type: string
 *         enum:
 *           - '250'
 *           - '254'
 *           - '258'
 *           - '261'
 *           - '264'
 *           - '267'
 *           - '270'
 *           - '274'
 *           - '276'
 *           - '251'
 *           - '252'
 *           - '255'
 *           - '257'
 *           - '259'
 *           - '262'
 *           - '263'
 *           - '272'
 *           - '266'
 *           - '269'
 *           - '265'
 *           - '268'
 *           - '256'
 *           - '260'
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
 *           - hourly
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

// Ex:  http://localhost:8088/breathepvd/sensor/Bs152202/lastone
router.get(
  "/:table/:sensor_id/:range",
  ash(async (req, res) => {
    const result = await req.queryFn(
      req.params.table,
      req.params.sensor,
      getTimestampVar(req.params.table),
      getVariables(req.params.table)
    );
    res.send(result);
  })
);

module.exports = router;
