const {
  getMultiBuoyGeoJsonData,
  getBuoysCoordinates,
  getBuoyVariables,
  getSummaryData,
  getSummaryMeanData,
} = require("@/clients/erddap");
const utils = require("@/utils");

const datasetMap = {
  buoy: "combined_e784_bee5_492e",
  mabuoy: "ma_buoy_data_a6c9_12eb_1ec5",
  model: "osom_v2_0585_f867_db94",
  plankton: "plankton_time_series_7615_c513_ef8e",
  "telemetry-raw": "buoy_telemetry_0ffe_2dc0_916e",
};
const summaryUnitMap = {
  buoy: "month",
  mabuoy: "month",
  model: "year",
  plankton: "month",
  "telemetry-raw": "day",
};
const downsampleDataset = {
  plankton: false,
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
  bid101: "Cole",
  bid102: "Taunton",

  // Real-time buoys below this line
  "Buoy-720": "Potowomut",
  "Buoy-620": "Conanicut",
  Castle_Hill: "Castle Hill",
};

const queryErddapBuoys = async (payload, rawNumPoints, dataset) => {
  const numPoints = rawNumPoints ?? 1000;

  const res = await getMultiBuoyGeoJsonData(payload);

  let processed = res.data.features.map((feature) => {
    const date = new Date(feature.properties.time);
    feature.properties.time = date;
    feature.properties.buoyId = feature.properties.station_name;
    feature.properties.station_name = stationMap[feature.properties.buoyId];
    return feature.properties;
  });

  return utils.downsample(
    processed,
    numPoints,
    payload.variables,
    payload.start,
    payload.end,
    downsampleDataset[dataset] ?? true
  );
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

const getSummaryMean = async (source) => {
  const datasetId = datasetMap[source];
  const variables = await getBuoyVariables(datasetId);
  const res = await getSummaryMeanData(
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
  const variables = await getBuoyVariables(datasetId);
  variables.sort();
  return variables;
};

module.exports = {
  queryErddapBuoys,
  getBuoyCoordinates,
  getSummary,
  getSummaryMean,
  getVariables,
  stationMap,
  datasetMap,
  summaryUnitMap,
};
