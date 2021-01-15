const utils = require('@/utils');
const buoys = require('@/routes/erddap/utils');
const mcache = require('memory-cache');

const updateCache = async () => {
  const end = new Date().toISOString(); // now
  const key = `__express__/erddap/buoy/summary`;
  const ids = buoys.ids;
  const variable = buoys.variables.join(',');
  console.log(`initialize cache for ${key}`);

  const payload = {
    ids,
    variable,
    datasetId: 'combined_e784_bee5_492e',
    start: '2000-07-01T12:00:00Z',
    end
  };

  const body = await utils.summarize(payload);
  mcache.put(key, body);
  console.log(`cache for ${key} complete`);
};

module.exports = {
  updateCache
};
