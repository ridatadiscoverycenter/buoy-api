const express = require('express');
const router = express.Router();
const utils = require('@/utils');
const common = require('@/routes/erddap/common');
const { cacheMiddleware } = require('@/middleware/cache');

const DATASET_ID = 'model_data_77bb_15c2_6ab3';

/**
 * @swagger
 * /erddap/model/query:
 *   get:
 *     description: Get Data from ERDDAP
 *     parameters:
 *      - name: datasetId
 *        in: query
 *        description: Dataset ID in ERDDAP.
 *        required: true
 *        type: string
 *      - name: ids
 *        in: query
 *        description: Buoy IDs, comma separated
 *        required: true
 *        type: string
 *      - name: variable
 *        in: query
 *        description: Measurement Variable
 *        required: true
 *        type: string
 *      - name: start
 *        in: query
 *        description: Start Time
 *        required: true
 *        type: string
 *      - name: end
 *        in: query
 *        description: End Time
 *        required: true
 *        type: string
 *      - name: numPoints
 *        in: query
 *        description: max number of points to return
 *        required: false
 *        type: integer
 *     responses:
 *       200:
 *         description: Success! New content is now available.
 *
 */

// Ex:  http://localhost:8080/erddap/model/query?datasetId=combined_e784_bee5_492e&ids=bid2,bid3&variable=WaterTempSurface&start=2010-07-01T12:00:00Z&end=2010-07-05T12:00:00Z

router.get('/query', (req, res) => {
  const ids = req.query.ids.split(',');
  const datasetId = req.query.datasetId ?? DATASET_ID;
  const payload = {
    ids,
    datasetId,
    variable: req.query.variable,
    start: req.query.start,
    end: req.query.end,
  };

  return common.queryErddapBuoys(payload, req.query.numPoints);
});

/**
 * @swagger
 * /erddap/model/coordinates:
 *   get:
 *     description: Get Buoy Coordinates from ERDDAP
 *     parameters:
 *     responses:
 *       200:
 *         description: Success! New content is now available.
 *
 */

// Ex:  http://localhost:8080/erddap/model/coordinates?ids=bid2,bid3

router.get('/coordinates', async (req, res) => {
  const data = await common.getBuoyCoordinates(DATASET_ID);
  res.send(data);
});

/**
 * @swagger
 * /erddap/model/summary:
 *   get:
 *     description: Get Buoy Coordinates from ERDDAP
 *     responses:
 *       200:
 *         description: Success! New content is now available.
 *
 */

// Ex:  http://localhost:8080/erddap/model/summary

router.get('/summary', cacheMiddleware, async (req, res) => {
  res.send(await common.getSummary(DATASET_ID));
});

module.exports = router;
