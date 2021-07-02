const express = require("express");
const router = express.Router();

const { cacheMiddleware } = require("@/middleware/cache");
const mcache = require("memory-cache");

const aq = require("arquero");
const op = aq.op;

const { getBuoysCoordinates, getDAData } = require("@/clients/erddap");

const LOCATION_DATASET_ID = "da_3691_b8df_31d7";
const DA_DATASET_ID = "da_4566_36f0_124a";

// HELPER FUNCTIONS

const getCoordinates = async () => {
  return await getBuoysCoordinates(LOCATION_DATASET_ID);
};

const getSamples = async (coordinates) => {
  const sites = coordinates.map((row) => row.station_name);
  const rawData = await getDAData({ sites, datasetId: DA_DATASET_ID });

  let processed = rawData.map((row) => {
    const date = new Date(row.time);
    const station_name = row.Site;
    const pDA = row.pDA_ng_Lseawater_1ngL_LOQ;
    return { date, pDA, station_name };
  });

  let dt = aq.from(processed).filter((d) => d.pDA !== null);
  let stats = dt
    .rollup({ minDA: op.min("pDA"), maxDA: op.max("pDA") })
    .objects()[0];
  return dt
    .derive({
      normDA: `d => (d.pDA - ${stats.minDA}) / ${stats.maxDA - stats.minDA}`,
    })
    .objects();
};

// ROUTES

/**
 * @swagger
 * /erddap/da/coordinates:
 *   get:
 *     description: Get Domoic Acid Sample Locations ERDDAP
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
 * /erddap/da/samples:
 *   get:
 *     description: Get Domoic Acid Samples from ERDDAP
 *     parameters:
 *     responses:
 *       200:
 *         description: Success! New content is now available.
 *
 */
router.get("/samples", cacheMiddleware, async (req, res) => {
  const coordinates =
    mcache.get("__express__/erddap/da/coordinates") ?? (await getCoordinates());
  let data = await getSamples(coordinates);
  res.send(data);
});

module.exports = {
  getCoordinates,
  getSamples,
  router,
};
