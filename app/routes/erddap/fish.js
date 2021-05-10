const express = require("express");
const router = express.Router();

const { cacheMiddleware } = require("@/middleware/cache");
const mcache = require("memory-cache");

const aq = require("arquero");
const op = aq.op;

const { getFishData } = require("@/clients/erddap");

const YSI_DATASET_ID = "fish_trawl_79f9_f9fd_5a43";
const TEMP_DATASET_ID = "fish_trawl_79f9_f9fd_5a42"
const CATCH_DATASET_ID = "fish_trawl_3ce2_fedf_6833";

// HELPER FUNCTIONS

const getCoordinates = async () => {
  // TODO: figure out how to get the coordinates for whale rock and fox island
  // might be able to use `getBuoyCoordinates`, but might not
  return [{station_name : "Whale Rock", longitude: -71.4208, latitude: 41.4395}, {station_name : "Fox Island", longitude: -71.4186, latitude: 41.5542} ]; 
};

const getSpecies = async (coordinates) => {
  const sites = coordinates.map((row) => row.station_name);
  const rawData = await getFishData({ sites, datasetId: CATCH_DATASET_ID});
  return rawData

  // TODO: fill this in - for fish by year and location, think about data format/any 
  // calculated fields that might be needed, use arquero as needed to reshape data, 
  // also maybe if it makes sense to get all data at once or we need to have query variables
  // also whether to include the temp and other data here, or have that be a separate route/query
};

// const getMetrics = async (coordinates) => {
//   const sites = coordinates.map((row) => row.station_name);
//   const rawData_temp = await getDAData({ sites, datasetId: TEMP_DATASET_ID});
//   const rawData_etc = await getDAData({ sites, datasetId: YSI_DATASET_ID});
//   // TODO: fill this in - for fish by year and location, think about data format/any 
//   // calculated fields that might be needed, use arquero as needed to reshape data, 
//   // also maybe if it makes sense to get all data at once or we need to have query variables
//   // also whether to include the temp and other data here, or have that be a separate route/query
// };

// ROUTES

/**
 * @swagger
 * /erddap/fish/coordinates:
 *   get:
 *     description: Get Fish Trawl Survey Locations ERDDAP
 *     parameters:
 *     responses:
 *       200:
 *         description: Success! New content is now available.
 *
 */
router.get("/coordinates", cacheMiddleware, async (req, res) => {
  const result = await getCoordinates();
  res.send(result);
});

/**
 * @swagger
 * /erddap/fish/samples:
 *   get:
 *     description: Get Fish Trawl Catch Samples from ERDDAP
 *     parameters:
 *     responses:
 *       200:
 *         description: Success! New content is now available.
 *
 */
router.get("/samples", cacheMiddleware, async (req, res) => {
  const coordinates = mcache.get(`__express__/erddap/fish/coordinates`) ?? await getCoordinates();
  let data = await getSpecies(coordinates);
  res.send(data);
});

/**
 * @swagger
 * /erddap/fish/coordinates:
 *   get:
 *     description: Get Fish Trawl Survey Locations ERDDAP
 *     parameters:
 *     responses:
 *       200:
 *         description: Success! New content is now available.
 *
 */
// router.get("/metrics", cacheMiddleware, async (req, res) => {
//   const result = await getCoordinates();
//   res.send(result);
// });

module.exports = {
  getCoordinates,
  getSpecies,
  router,
};
