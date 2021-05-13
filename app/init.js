const utils = require("@/utils");
const common = require("@/routes/erddap/common");
const da = require("@/routes/erddap/da");
const fish = require("@/routes/erddap/fish");
const mcache = require("memory-cache");

const updateCache = async (timeout) => {
  const end = new Date().toISOString(); // now
  const keyBase = `__express__/erddap`;
  Object.entries(common.datasetMap).map(async ([src, datasetId]) => {
    const summary = await common.getSummary(src);
    mcache.put(`${keyBase}/${src}/summary`, summary, timeout);
    const coords = await common.getBuoyCoordinates(datasetId);
    mcache.put(`${keyBase}/${src}/coordinates`, coords, timeout);
    const variables = await common.getVariables(datasetId);
    mcache.put(`${keyBase}/${src}/variables`, variables, timeout);
    console.log(`cache for ${src} complete`);
  });

  // const daCoordinates = await da.getCoordinates();
  // mcache.put(`${keyBase}/da/coordinates`, daCoordinates, timeout);
  // const daSamples = await da.getSamples(daCoordinates);
  // mcache.put(`${keyBase}/da/samples`, daSamples, timeout);

  // TODO: review if this initialization of the cache is correct
  const fishCoordinates = await fish.getCoordinates();
  mcache.put(`${keyBase}/fish/coordinates`, fishCoordinates, timeout);
  const fishSamples = await fish.getSpecies(fishCoordinates);
  mcache.put(`${keyBase}/fish/samples`, fishSamples, timeout);
  const fishMetrics = await fish.getMetrics(fishCoordinates);
  mcache.put(`${keyBase}/fish/metrics`, fishMetrics, timeout);
  const fishTemps = await fish.getTemps(fishCoordinates);
  mcache.put(`${keyBase}/fish/temps`, fishTemps, timeout);
};

module.exports = {
  updateCache,
};
