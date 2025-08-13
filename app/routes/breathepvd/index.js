const express = require("express");
const router = express.Router();
const ash = require("express-async-handler");

const {
  getLatestRecord,
  getRecordsSince,
  getRecordsRange,
} = require("@/clients/breathepvd.js");

SENSOR_IDS = [
  "Bs12202",
  "Bs22202",
  "Bs32202",
  "Bs42202",
  "Bs52202",
  "Bs62202",
  "Bs72202",
  "Bs82202",
  "Bs92202",
  "Bs102202",
  "Bs112202",
  "Bs122202",
  "Bs132202",
  "Bs142202",
  "Bs152202",
  "Bs162202",
  "Bs192202",
  "Bs172202",
  "Bs182202",
  "Bs232202",
  "Bs242202",
  "Bs212202",
  "Bs222202",
];
PM_IDS = ["00810", "00811", "00812"];

const getTimestampVar = (table) => {
  return table === "sensor" ? "local_timestamp" : "timestamp_local";
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
    return getRecordsRange(
      sensor,
      table,
      timestampVar,
      startDate,
      endDate,
      variables
    );
  },
};

// make sure the url matches sensors we know about

router.param("range", (req, res, next, range) => {
    console.log(req)
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
      getTimestampVar(req.params.table)
    );
    res.send(result);
  })
);

module.exports = router;
