const express = require("express");
const router = express.Router();
const ash = require("express-async-handler");

const {
  getLatestRecord,
  getRecordsSince,
  getRecordsRange,
} = require("@/clients/breathepvd.js");

const getTimestampVar = (table) => {
    return table === "sensordata" ? "local_timestamp" : "timestamp_local"
}

const RANGES = {
  lastone: () => (table, timestampVar, variables) =>
    getLatestRecord(table, timestampVar, variables),
  lastday: () => (table, timestampVar, variables) =>
    getRecordsSince(table, timestampVar, 1, variables),
  lastweek: () => (table, timestampVar, variables) =>
    getRecordsSince(table, timestampVar, 2, variables),
  range: (req) => {
    const startDate = new Date(req.query.start);
    const endDate = req.query.end ? new Date(req.query.end) : new Date();
    return getRecordsRange(table, timestampVar, startDate, endDate, variables);
  },
};

// TODO url checking for sensor
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
 * /breathepvd/{table}/{range}:
 *   get:
 *     description: Get the BreathePVD records for this buoy and table type over the requested range
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         description: Data source
 *         type: string
 *         enum:
 *         - pmdata
 *         - sensordata
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

// Ex:  http://localhost:8088/breathepvd/pmdata/lastone
router.get(
  "/:table/:range",
  ash(async (req, res) => {
    const result = await req.queryFn(
      req.params.table,
      getTimestampVar(req.params.table)
    );
    res.send(result);
  })
);

module.exports = router;
