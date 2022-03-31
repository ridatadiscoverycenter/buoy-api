const express = require("express");
const router = express.Router();
const ash = require("express-async-handler");
const utils = require("@/utils");
const common = require("@/routes/erddap/common");
const { getBuoyTimeRange } = require("@/clients/erddap");
const { cacheMiddleware } = require("@/middleware/cache");
const mcache = require("memory-cache");

router.param("source", (req, res, next, source) => {
  const skip_sources = ["da", "fish"];
  req.datasetId = common.datasetMap[source];
  req.source = source;

  if (req.datasetId || skip_sources.includes(source)) {
    next();
  } else {
    next(
      new Error(
        "unknown erddap source, only buoy, telemetry-raw, model or plankton allowed"
      )
    );
  }
});

/**
 * @swagger
 * /erddap/{source}/query:
 *   get:
 *     description: Get Data from ERDDAP
 *     parameters:
 *       - in: path
 *         name: source
 *         required: true
 *         description: The type of buoy data to get
 *         type: string
 *         enum:
 *           - buoy
 *           - mabuoy
 *           - model
 *           - plankton
 *       - name: ids
 *         in: query
 *         description: Buoy IDs, comma separated
 *         required: true
 *         type: string
 *       - name: variables
 *         in: query
 *         description: Measurement Variables, comma separated
 *         required: true
 *         type: string
 *       - name: start
 *         in: query
 *         description: Start Time
 *         required: true
 *         type: string
 *         format: date
 *       - name: end
 *         in: query
 *         description: End Time
 *         required: true
 *         type: string
 *         format: date
 *       - name: numPoints
 *         in: query
 *         description: max number of points to return
 *         required: false
 *         type: integer
 *     responses:
 *       200:
 *         description: Success! New content is now available.
 *
 */

// Ex:  http://localhost:8080/erddap/buoy/query?ids=bid2,bid3&variable=WaterTempSurface&start=2010-07-01T12:00:00Z&end=2010-07-05T12:00:00Z

router.get(
  "/:source/query",
  ash(async (req, res) => {
    const ids = req.query.ids.split(",");

    // check variables queried exist for this dataset, short circuit if they don't
    const queryVariables = req.query.variables.split(",");
    const datasetVariables =
      mcache.get(`__express__/erddap/${req.params.source}/variables`) ??
      (await common.getVariables(req.datasetId));

    const variableNames = datasetVariables.map((variable) => variable.name);
    const variables = queryVariables.filter(
      (v) => !v.includes("Qualifiers") && variableNames.includes(v)
    );

    if (variables.length === 0) {
      return res.send({ data: [], downsampled: false });
    }

    const payload = {
      ids,
      datasetId: req.datasetId,
      variables,
      start: req.query.start,
      end: req.query.end,
    };

    const { data, downsampled } = await common.queryErddapBuoys(
      payload,
      req.query.numPoints,
      req.source
    );

    data.forEach((d) => {
      d.units = datasetVariables.find((v) => v.name === d.variable).units;
    });

    res.send({ data, downsampled });
  })
);

/**
 * @swagger
 * /erddap/{source}/coordinates:
 *   get:
 *     description: Get Buoy Coordinates from ERDDAP
 *     parameters:
 *       - in: path
 *         name: source
 *         required: true
 *         description: The type of buoy data to get
 *         type: string
 *         enum:
 *           - buoy
 *           - mabuoy
 *           - model
 *           - plankton
 *     responses:
 *       200:
 *         description: Success! New content is now available.
 *
 */

// Ex:  http://localhost:8080/erddap/buoy/coordinates?ids=bid2,bid3

router.get(
  "/:source/coordinates",
  cacheMiddleware,
  ash(async (req, res) => {
    const data = await common.getBuoyCoordinates(req.datasetId);
    res.send(data);
  })
);

/**
 * @swagger
 * /erddap/{source}/summary:
 *   get:
 *     description: Get data availability summary from ERDDAP
 *     parameters:
 *       - in: path
 *         name: source
 *         required: true
 *         description: The type of buoy data to get
 *         type: string
 *         enum:
 *           - buoy
 *           - mabuoy
 *           - model
 *           - plankton
 *     responses:
 *       200:
 *         description: Success! New content is now available.
 *
 */

// Ex:  http://localhost:8080/erddap/buoy/summary

router.get(
  "/:source/summary",
  cacheMiddleware,
  ash(async (req, res) => {
    res.send(await common.getSummary(req.params.source));
  })
);

/**
 * @swagger
 * /erddap/{source}/variables:
 *   get:
 *     description: Get Variables available for this source dataset
 *     parameters:
 *       - in: path
 *         name: source
 *         required: true
 *         description: The type of buoy data to get
 *         type: string
 *         enum:
 *           - buoy
 *           - mabuoy
 *           - model
 *           - plankton
 *     responses:
 *       200:
 *         description: Success! New content is now available.
 *
 */

// Ex:  http://localhost:8080/erddap/buoy/variables

router.get(
  "/:source/variables",
  cacheMiddleware,
  ash(async (req, res) => {
    const variables = await common.getVariables(req.datasetId);
    res.send(variables);
  })
);

router.get(
  "/:source/timerange",
  cacheMiddleware,
  ash(async (req, res) => {
    const range = await getBuoyTimeRange(req.datasetId);
    res.send(range);
  })
);

module.exports = router;
