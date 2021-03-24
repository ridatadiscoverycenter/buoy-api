const {
  getMultiBuoyGeoJsonData,
  getBuoysCoordinates,
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
  return response.map((buoy) => {
    buoy.buoyId = buoy.station_name;
    buoy.station_name = stationMap[buoy.buoyId];
    return buoy;
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
  return res.map((row) => {
    row.buoyId = row.station_name;
    row.station_name = `${stationMap[row.buoyId]} (${row.buoyId})`;
    return row;
  });
};

const getVariables = async (datasetId) => {
  let vars = await getBuoyVariables(datasetId);
  return vars.sort();
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
