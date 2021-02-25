const {
  getMultiBuoyGeoJsonData,
  getBuoysCoordinates,
  getBuoyIds,
  getBuoyVariables,
  getSummaryData,
} = require("@/clients/erddap");
const utils = require("@/utils");

const datasetMap = {
  buoy: "combined_e784_bee5_492e",
  model: "model_data_77bb_15c2_6ab3",
  plankton: "plankton_time_series_7615_c513_ef8e",
};
const summaryUnitMap = {
  buoy: "month",
  model: "year",
  plankton: "month",
};

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
  bid13: "Phillipsdale",
  bid15: "Greenwich Bay",
  bid16: "Potters Cove",
  bid17: "GSO Dock",
  bid21: "Station II",
};

const queryErddapBuoys = async (payload, rawNumPoints) => {
  const numPoints = rawNumPoints ?? 1000;

  let res;
  try {
    res = await getMultiBuoyGeoJsonData(payload);
  } catch (e) {
    console.log(e.config.url);
    console.log(e.response.data);
    return [];
  }

  let processed = res.data.features.map((feature) => {
    const date = new Date(feature.properties.time);
    feature.properties.time = date;
    feature.properties.buoyId = feature.properties.station_name;
    feature.properties.station_name = stationMap[feature.properties.buoyId];
    return feature.properties;
  });

  return utils.downsample(processed, numPoints, payload.variables);
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

const getSummary = async (source) => {
  const datasetId = datasetMap[source];
  const variables = await getBuoyVariables(datasetId);
  const res = await getSummaryData(
    datasetId,
    variables,
    summaryUnitMap[source]
  );
  const data = res.data.table;
  return data.rows.map((row) => {
    let res = {};
    for (const [i, key] of data.columnNames.entries()) res[key] = row[i];
    res.buoyId = res.station_name;
    res.station_name = `${stationMap[res.buoyId]} (${res.buoyId})`;
    return res;
  });
};

const getVariables = (datasetId) => {
  return getBuoyVariables(datasetId).then((res) => res.sort());
};

module.exports = {
  queryErddapBuoys,
  getBuoyCoordinates,
  getSummary,
  getVariables,
  stationMap,
  datasetMap,
  summaryUnitMap,
};
