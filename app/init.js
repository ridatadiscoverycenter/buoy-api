const utils = require('@/utils');
const buoys = require('@/routes/erddap/common');
const mcache = require('memory-cache');

const updateCache = async () => {
  const end = new Date().toISOString(); // now
  const keyBase = `__express__/erddap`;
  const initMap = {
    buoy: 'combined_e784_bee5_492e',
    model: 'model_data_77bb_15c2_6ab3'
  }
  Object.entries(initMap).map(async ([src, datasetId]) => {
    const body = await buoys.getSummary(datasetId);
    mcache.put(`${keyBase}/${src}/summary`, body);
    console.log(`cache for ${src} complete`);
  });
};

module.exports = {
  updateCache
};
