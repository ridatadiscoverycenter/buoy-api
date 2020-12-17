const utils = require('@/utils');
const buoys = require('@/routes/erddap/utils');
const mcache = require('memory-cache');

const initialCache = async () => {
  const end = '2015-07-01T12:00:00Z';
  const initKey = `__express__/erddap/buoy/summary?end=${end}`;
  const ids = buoys.ids;
  const variable = buoys.variables.join(',');
  console.log(`initialize cache for ${initKey}`);

  const payload = {
    ids, 
    variable, 
    datasetId: 'combined_e784_bee5_492e',
    start: '2000-07-01T12:00:00Z',
    end
  };

  const body = await utils.summarize(payload);
  mcache.put(initKey, body);
  console.log(`cache for ${initKey} complete`);
};

module.exports = {
  initialCache
};
