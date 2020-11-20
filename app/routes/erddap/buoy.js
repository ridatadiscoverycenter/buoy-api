const express = require('express');
const router = express.Router();
const { getMultiBuoyGeoJsonData, getBuoysCoordinates } = require('../../clients/erddap');
const utils = require('../../utils');
/**
 * @swagger
 * /erddap/buoy/query:
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
 *        type: datetime
 *      - name: end
 *        in: query
 *        description: End Time
 *        required: true
 *        type: datetime
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

// Ex:  http://localhost:3004/erddap/buoy/query?datasetId=combined_e784_bee5_492e&ids=bid2&variable=WaterTempSurface&start=2010-07-01T12:00:00Z&end=2010-07-05T12:00:00Z

router.get('/query', (req, res) => {
  const ids = req.query.ids.split(',');
  const variable = req.query.variable;
  const payload = {
    ids,
    datasetId: req.query.datasetId,
    variable,
    start: req.query.start,
    end: req.query.end
  };
  const numPoints = req.query.numPoints || 1000;

  return Promise.all(getMultiBuoyGeoJsonData(payload)).then(
    (response) => {
      // console.log(response);
      const data = response.map((datum) => {
        let processed = datum.data.features.map((feature) => {
          const date = new Date(feature.properties.time);
          feature.properties.time = date;
          return feature.properties;
        });

        let filtered = processed.filter((arr) => arr[variable] !== null);

        if (filtered.length > numPoints) {
          filtered = utils.downsample(filtered, numPoints, variable);
        };

        return filtered;
      });

      res.send(data.reduce((a, b) => a.concat(b), []));
    }
  );

});

/**
 * @swagger
 * /erddap/buoy/coordinates:
 *   get:
 *     description: Get Buoy Coordinates from ERDDAP
 *     parameters:
 *      - name: ids
 *        in: query
 *        description: Buoy IDs, comma separated
 *        required: true
 *        type: string
 *     responses:
 *       200:
 *         description: Success! New content is now available.
 *
 */

// Ex:  http://localhost:3004/erddap/buoy/coordinates?ids=bid2

router.get('/coordinates', (req, res) => {
  const ids = req.query.ids.split(',');
  return Promise.all(getBuoysCoordinates({ids})).then(
    (response) => {
      const data = response.map((buoy) => {
        return {
          latitude: buoy.data.features[0].geometry.coordinates[1],
          longitude: buoy.data.features[0].geometry.coordinates[0],
          buoyId: buoy.data.features[0].properties.station_name
        };
      });
      res.send(data);
    }
  );

});

module.exports = router;
