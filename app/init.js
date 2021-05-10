const utils = require("@/utils");
const common = require("@/routes/erddap/common");
const da = require("@/routes/erddap/da");
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

  const coordinates = await da.getCoordinates();
  mcache.put(`${keyBase}/da/coordinates`, coordinates, timeout);
  const samples = await da.getSamples(coordinates);
  mcache.put(`${keyBase}/da/samples`, samples, timeout);
  console.log(`cache for da complete`);
};

module.exports = {
  updateCache,
};
