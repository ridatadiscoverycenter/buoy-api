const utils = require("@/utils");
const common = require("@/routes/erddap/common");
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
};

module.exports = {
  updateCache,
};
