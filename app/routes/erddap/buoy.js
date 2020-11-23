const express = require('express');
const _ = require('lodash');
const router = express.Router();
const { getMultiBuoyGeoJsonData, getBuoysCoordinates } = require('@/clients/erddap');
const utils = require('@/utils');
const buoys = require('@/routes/erddap/utils');
const { cacheMiddleware } = require('@/middleware/cache');
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

// Ex:  http://localhost:3004/erddap/buoy/query?datasetId=combined_e784_bee5_492e&ids=bid2,bid3&variable=WaterTempSurface&start=2010-07-01T12:00:00Z&end=2010-07-05T12:00:00Z

router.get('/query', (req, res) => {
  const ids = req.query.ids.split(',');
  const variable = req.query.variable;
  const payload = {
    ids,
    datasetId: req.query.datasetId,
    variable,
    start: req.query.start,
    end: req.query.end,
  };
  const numPoints = req.query.numPoints || 1000;

  return Promise.all(getMultiBuoyGeoJsonData(payload)).then((response) => {
    const data = response.map((datum) => {
      if (datum.hasOwnProperty('data')) {
        let processed = datum.data.features.map((feature) => {
          const date = new Date(feature.properties.time);
          feature.properties.time = date;
          return feature.properties;
        });

        // TODO: to filter or not to filter?
        // let filtered = processed.filter((arr) => arr[variable] !== null);

        return utils.downsample(processed, numPoints, variable);
      } else {
        return [];
      }
    });

    res.send(data.reduce((a, b) => a.concat(b), []));
  });
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

// Ex:  http://localhost:3004/erddap/buoy/coordinates?ids=bid2,bid3

router.get('/coordinates', (req, res) => {
  const ids = req.query.ids.split(',');
  return Promise.all(getBuoysCoordinates({ ids })).then((response) => {
    const data = response.map((buoy) => {
      return {
        latitude: buoy.data.features[0].geometry.coordinates[1],
        longitude: buoy.data.features[0].geometry.coordinates[0],
        buoyId: buoy.data.features[0].properties.station_name,
      };
    });
    res.send(data);
  });
});

router.get('/summary', cacheMiddleware, (req, res) => {
  const end = req.query.end;
  const ids = buoys.ids;
  const variable = buoys.variables.join(',');
  const payload = {
    ids, 
    variable, 
    datasetId: 'combined_e784_bee5_492e',
    start: '2000-07-01T12:00:00Z',
    end
  };
  return Promise.all(getMultiBuoyGeoJsonData(payload))
    .then(
      (response) => {
        const data = response.map((datum) => {
          console.log(datum);
          return datum.data?.features.map((feature) => {
            const date = new Date(feature.properties.time);
            feature.properties.time = date;
            return feature.properties;
          });
        });
        const init = data.map((data) =>
          data?.map((datum) => {
            const date = new Date(datum.time);
            datum.time = `${date.getFullYear()}_${date.getMonth() + 1}`;
            console.log(datum.time);
            return datum;
          })
        );
        const grouped = init
          .map((buoyData) => {
            const result = {
              [buoyData?.[0].station_name]: _.groupBy(buoyData, 'time')
            };
            return result;
          })
          .reduce((a, b) => Object.assign(a, b));
        const reduced = Object.keys(grouped).map((k) => {
          return Object.keys(grouped[k]).map((date) => {
            const result = grouped[k][date]
              .map((obj) => {
                const newObj = {};
                buoys.variables.forEach((v) => {
                  newObj[v] = obj[v] ? 1 : 0;
                });
                return newObj;
              })
              .reduce((a, b) => {
                const newObj = {};
                buoys.variables.forEach((v) => (newObj[v] = a[v] + b[v]));
                newObj.date = new Date(date.replace('_', '/') + '/01');
                newObj.station = k;
                return newObj;
              });
            return result;
          });
        });
        const final = reduced.reduce((a, b) => a.concat(b));
        res.send(final);
      })
    .catch(err => console.log(err));
});

module.exports = router;
