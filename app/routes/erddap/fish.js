const express = require("express");
const router = express.Router();

const { cacheMiddleware } = require("@/middleware/cache");
const mcache = require("memory-cache");

const aq = require("arquero");
const op = aq.op;

const { getFishData } = require("@/clients/erddap");

const YSI_DATASET_ID = "";
const TEMP_DATASET_ID = ""
const CATCH_DATASET_ID = "";

// HELPER FUNCTIONS

const getCoordinates = async () => {
  // TODO: figure out how to get the coordinates for whale rock and fox island
  // might be able to use `getBuoyCoordinates`, but might not
  return [];
};

const getSamples = async () => {
  // TODO: fill this in - for fish by year and location, think about data format/any 
  // calculated fields that might be needed, use arquero as needed to reshape data, 
  // also maybe if it makes sense to get all data at once or we need to have query variables
  // also whether to include the temp and other data here, or have that be a separate route/query
};

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
  let data = await getSamples(coordinates);
  res.send(data);
});

module.exports = {
  getCoordinates,
  getSamples,
  router,
};
