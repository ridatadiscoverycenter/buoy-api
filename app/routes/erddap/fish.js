const express = require("express");
const router = express.Router();

const utils = require("@/utils");
const { cacheMiddleware } = require("@/middleware/cache");

const fs = require("fs");
const mcache = require("memory-cache");
const aq = require("arquero");
const op = aq.op;

const { getFishData } = require("@/clients/erddap");

const YSI_DATASET_ID = "fish_trawl_79f9_f9fd_5a43";
const TEMP_DATASET_ID = "fish_trawl_79f9_f9fd_5a42";
const CATCH_DATASET_ID = "fish_trawl_3ce2_fedf_6833";
const COORDINATES = [
  { station_name: "Whale Rock", longitude: -71.4208, latitude: 41.4395 },
  { station_name: "Fox Island", longitude: -71.4186, latitude: 41.5542 },
];

// HELPER FUNCTIONS

const getSpecies = async () => {
  const rawData = await getFishData({ datasetId: CATCH_DATASET_ID });
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
      let title = utils.humanizeSnakeCase(species);

      // make data titles match the uri website
      if (title === "Alosa Spp") {
        title = "Alewife";
      } else if (title === "Longhorned Sculpin") {
        title = "Longhorn Sculpin";
      } else if (title === "Long Finned Squid") {
        title = "Longfin Squid";
      } else if (title === "Sea Star") {
        title = "Starfish";
      } else if (title === "Spider Crab") {
        title = "Spider Crabs";
      } else if (title === "Windowpane") {
        title = "Windowpane Flounder";
      }
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

const getTemps = async () => {
  const rawTemps = await getFishData({ datasetId: TEMP_DATASET_ID });
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

  temps = temps
    .join(meanTemps)
    .derive({ delta: (d) => d.mean_temp - d.monthly_mean })
    .objects();
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
router.get("/coordinates", (req, res) => {
  res.send(COORDINATES);
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
  let data = await getSpecies();
  res.send(data);
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
  const result = await getTemps();
  res.send(result);
});

/**
 * @swagger
 * /erddap/fish/info/:species:
 *   get:
 *     description: Get Fish information for a given species
 *     parameters:
 *     responses:
 *       200:
 *         description: Success! New content is now available.
 *
 */
router.get("/info/:species", cacheMiddleware, (req, res) => {
  try {
    const data = fs.readFileSync(`data/fish/${req.params.species}.json`);
    res.send(JSON.parse(data));
  } catch (e) {
    console.log(e);
    res.send({});
  }
});

module.exports = {
  getSpecies,
  getMetrics,
  getTemps,
  router,
};
