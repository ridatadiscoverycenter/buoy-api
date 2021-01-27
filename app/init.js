const utils = require("@/utils");
const common = require("@/routes/erddap/common");
const mcache = require("memory-cache");

const updateCache = async () => {
  const end = new Date().toISOString(); // now
  const keyBase = `__express__/erddap`;
  Object.entries(common.datasetMap).map(async ([src, datasetId]) => {
    const body = await common.getSummary(datasetId);
    mcache.put(`${keyBase}/${src}/summary`, body);
    console.log(`cache for ${src} complete`);
  });
};

module.exports = {
  updateCache,
};
