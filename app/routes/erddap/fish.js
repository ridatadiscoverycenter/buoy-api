const express = require("express");
const router = express.Router();

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
  // TODO: figure out how to get the coordinates for whale rock and fox island
  // might be able to use `getBuoyCoordinates`, but might not
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
    const fish = fish_list[index];
    newTable = dt.select(`${fish}`, "Station", "Year");

    let processed = newTable.objects().map((row) => {
      const species = `${fish}`;
      const station = row.Station;
      const year = (row.Year);
      const abun = row[fish];
      const date = new Date(row.Year, 0)
      return { species, station, year, date, abun };
    });
    newTable = aq.from(processed);

    if (final_fish.length == 0) {
      final_fish = newTable;
    } else {
      final_fish = final_fish.concat(newTable);
    }
  }

  return final_fish.objects();
};

const getTemps = async (coordinates) => {
  const sites = coordinates.map((row) => row.station_name);
  const rawData_temp = await getFishData({ sites, datasetId: TEMP_DATASET_ID });
  let dt_fi = aq.from(rawData_temp).filter((d) => d.Station == "Fox Island");
  let dt_wr = aq.from(rawData_temp).filter((d) => d.Station == "Whale Rock");

  return { "Fox Island": dt_fi.objects(), "Whale Rock": dt_wr.objects() };
};

const getMetrics = async (coordinates) => {
  const sites = coordinates.map((row) => row.station_name);
  const rawData_temp = await getFishData({ sites, datasetId: YSI_DATASET_ID });
  let dt_fi = aq.from(rawData_temp).filter((d) => d.Station == "Fox Island");
  let dt_wr = aq.from(rawData_temp).filter((d) => d.Station == "Whale Rock");

  return { "Fox Island": dt_fi.objects(), "Whale Rock": dt_wr.objects() };
};

// const getMetrics = async (coordinates) => {
//   const sites = coordinates.map((row) => row.station_name);
//   const rawData_temp = await getFishData({ sites, datasetId: TEMP_DATASET_ID});
//   const rawData_etc = await getFishData({ sites, datasetId: YSI_DATASET_ID});
//   var i;
//   let temp_table = {"Fox Island":[], "Whale Rock": [] }
//   for (i = 1959; i < 2018; i++){
//     let year_i = i.toString()
//     let dt_fi = aq.from(rawData_temp).params({year: year_i}).filter((d,$) => (op.includes(d.time, $.year) && d.Station == "Fox Island"))
//     dt_fi = dt_fi.rollup({avg_st: d => op.mean(d.Surface_Temperature), avg_bt: d => op.mean(d.Bottom_Temperature)})
//     dt_fi = dt_fi.derive({year :`d => ${year_i}`})

//     let dt_wr = aq.from(rawData_temp).params({year: year_i}).filter((d,$) => (op.includes(d.time, $.year) && d.Station == "Whale Rock"))
//     dt_wr = dt_wr.rollup({avg_st: d => op.mean(d.Surface_Temperature), avg_bt: d => op.mean(d.Bottom_Temperature)})
//     dt_wr = dt_wr.derive({year :`d => ${year_i}`})

//     temp_table["Fox Island"].push(dt_fi.objects()[0])
//     temp_table["Whale Rock"].push(dt_wr.objects()[0])

//   }

//   return temp_table
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
router.get("/species", cacheMiddleware, async (req, res) => {
  const coordinates =
    mcache.get(`__express__/erddap/fish/coordinates`) ??
    (await getCoordinates());
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
router.get("/metrics", cacheMiddleware, async (req, res) => {
  const coordinates = mcache.get(`__express__/erddap/fish/coordinates`);
  const result = await getMetrics(coordinates);
  res.send(result);
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
