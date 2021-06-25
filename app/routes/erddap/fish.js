const express = require("express");
const router = express.Router();

const utils = require("@/utils");
const { cacheMiddleware } = require("@/middleware/cache");
const mcache = require("memory-cache");

const aq = require("arquero");
const op = aq.op;

const { getFishData } = require("@/clients/erddap");

const YSI_DATASET_ID = "fish_trawl_79f9_f9fd_5a43";
const TEMP_DATASET_ID = "fish_trawl_79f9_f9fd_5a42";
const CATCH_DATASET_ID = "fish_trawl_3ce2_fedf_6833";

// HELPER FUNCTIONS

const getCoordinates = async () => {
  return [
    { station_name: "Whale Rock", longitude: -71.4208, latitude: 41.4395 },
    { station_name: "Fox Island", longitude: -71.4186, latitude: 41.5542 },
  ];
};

const getSpecies = async (coordinates) => {
  const sites = coordinates.map((row) => row.station_name);
  const rawData = await getFishData({ sites, datasetId: CATCH_DATASET_ID });
  const dt = aq.from(rawData);

  const fish_list = aq.from(rawData).columnNames();
  fish_list.splice(fish_list.indexOf("Station"), 1);
  fish_list.splice(fish_list.indexOf("Year"), 1);

  let final_fish = [];
  let newTable = [];
  for (index in fish_list) {
    const species = fish_list[index];
    newTable = dt.select(species, "Station", "Year");

    let processed = newTable.objects().map((row) => {
      const title = utils.humanizeSnakeCase(species);
      const station = row.Station;
      const year = row.Year;
      const abun = row[species];
      return { species, title, station, year, abun };
    });
    newTable = aq.from(processed);

    if (final_fish.length === 0) {
      final_fish = newTable;
    } else {
      final_fish = final_fish.concat(newTable);
    }
  }

  return final_fish.objects();
};

const getTemps = async (coordinates) => {
  const sites = coordinates.map((row) => row.station_name);
  const rawTemps = await getFishData({ sites, datasetId: TEMP_DATASET_ID });
  let temps = aq
    .from(rawTemps)
    .fold(["Surface_Temperature", "Bottom_Temperature"], {
      as: ["key", "temp"],
    })
    .derive({
      year_month: (d) =>
        op.utcdatetime(op.utcyear(d.time), op.utcmonth(d.time)),
      level: (d) => op.split(d.key, "_", 1)[0],
      month: (d) => op.utcmonth(d.time),
    })
    .groupby(["Station", "year_month", "level", "month"])
    .rollup({ mean_temp: op.mean("temp") });

  const meanTemps = temps
    .groupby(["Station", "level", "month"])
    .rollup({ monthly_mean: op.mean("mean_temp") });

  temps = temps.join(meanTemps).derive({ delta: d => d.mean_temp - d.monthly_mean}).objects();
  return temps;
};

const getMonthlyTemps = (temps) => {
  const meanTemps = aq
    .from(temps)
    .derive({ month: (d) => op.utcmonth(d.year_month) })
    .groupby(["Station", "level", "month"])
    .rollup({ mean_temp: op.mean("mean_temp") })
    .objects();
  return meanTemps;
};

const getMetrics = async (coordinates) => {
  const sites = coordinates.map((row) => row.station_name);
  const metrics = await getFishData({ sites, datasetId: YSI_DATASET_ID });
  return metrics;
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
 * /erddap/fish/species:
 *   get:
 *     description: Get Fish Trawl Catch Species from ERDDAP
 *     parameters:
 *     responses:
 *       200:
 *         description: Success! New content is now available.
 *
 */
router.get("/species", cacheMiddleware, async (req, res) => {
  const coordinates =
    mcache.get(`__express__/erddap/fish/coordinates`) ??
    (await getCoordinates());
  let data = await getSpecies(coordinates);
  res.send(data);
});

/**
 * @swagger
 * /erddap/fish/metrics:
 *   get:
 *     description: Get Fish Trawl Survey Water Metrics from ERDDAP
 *     parameters:
 *     responses:
 *       200:
 *         description: Success! New content is now available.
 *
 */
router.get("/metrics", cacheMiddleware, async (req, res) => {
  const coordinates = mcache.get(`__express__/erddap/fish/coordinates`);
  const result = await getMetrics(coordinates);
  res.send(result);
});

/**
 * @swagger
 * /erddap/fish/temps:
 *   get:
 *     description: Get Fish Trawl Survey Water Temps from ERDDAP
 *     parameters:
 *     responses:
 *       200:
 *         description: Success! New content is now available.
 *
 */
router.get("/temps", cacheMiddleware, async (req, res) => {
  const coordinates = mcache.get(`__express__/erddap/fish/coordinates`);
  const result = await getTemps(coordinates);
  res.send(result);
});

module.exports = {
  getCoordinates,
  getSpecies,
  getMetrics,
  getTemps,
  router,
};
