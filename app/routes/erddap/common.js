const {
  getMultiBuoyGeoJsonData,
  getBuoysCoordinates,
  getBuoyIds,
  getBuoyVariables,
  getSummaryData,
} = require("@/clients/erddap");
const utils = require("@/utils");

const stationMap = {
  bid2: "N. Prudence",
  bid3: "Conimicut Pt",
  bid4: "Upper Bay Winter Station",
  bid5: "Bullocks Reach",
  bid6: "Mnt. View",
  bid7: "Quonset Pt",
  bid8: "Mnt. Hope Bay",
  bid9: "Poppasquash Pt",
  bid10: "Sally Rock",
  bid13: "Unknown",
  bid15: "Greenwich Bay",
  bid16: "Unknown",
  bid17: "GSO Dock",
  bid21: "Station II",
};

const queryErddapBuoys = async (payload, rawNumPoints) => {
  const numPoints = rawNumPoints ?? 1000;

  const res = await getMultiBuoyGeoJsonData(payload);

  console.log(res.data);

  let processed = res.data.features.map((feature) => {
    const date = new Date(feature.properties.time);
    feature.properties.time = date;
    feature.properties.buoyId = feature.properties.station_name;
    feature.properties.station_name = stationMap[feature.properties.buoyId];
    return feature.properties;
  });

  // TODO: to filter or not to filter?
  // let filtered = processed.filter((arr) => arr[variable] !== null);

  return utils.downsample(processed, numPoints, payload.variable);
};

const getBuoyCoordinates = async (datasetId) => {
  const response = await getBuoysCoordinates(datasetId);
  const rows = response.data.table.rows;
  return rows.map((buoy) => {
    return {
      latitude: buoy[2],
      longitude: buoy[1],
      buoyId: buoy[0],
      station_name: stationMap[buoy[0]],
    };
  });
};

const getSummary = async (datasetId) => {
  const variables = await getBuoyVariables(datasetId);
  const res = await getSummaryData(datasetId, variables);
  const data = res.data.table;
  return data.rows.map((row) => {
    let res = {};
    for (const [i, key] of data.columnNames.entries()) res[key] = row[i];
    return res;
  });
};

module.exports = {
  queryErddapBuoys,
  getBuoyCoordinates,
  getSummary,
  stationMap,
};
