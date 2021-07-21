const axios = require("axios");
const utils = require("@/utils");

const erddapClient = axios.create({
  baseURL:
    process.env.BUOY_API_ERDDAP_URL ??
    "https://pricaimcit.services.brown.edu/erddap/tabledap",
  withCredentials: false,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

const baseVariables = ["time", "latitude", "longitude", "station_name"];

const getMultiBuoyGeoJsonData = ({ ids, variables, start, end, datasetId }) => {
  const idString = `~"(${ids.join("|")})"`;
  return getSingleBuoyGeoJsonData({
    idString,
    variables,
    start,
    end,
    datasetId,
  });
};

const getSingleBuoyGeoJsonData = ({
  id,
  idString,
  variables,
  start,
  end,
  datasetId,
}) => {
  const startDate = start ?? "2003-01-01T12:00:00Z";
  const endDate = end ?? "2012-12-31T12:00:00Z";
  idString = idString ?? `"${id}"`;
  return erddapClient
    .get(
      `/${datasetId}.geoJson?${variables.join(",")},${baseVariables.join(
        ","
      )}&station_name=${idString}&time>=${startDate}&time<=${endDate}`
    )
    .then((res) => res)
    .catch((err) => {
      throw err;
    });
};

const getSummaryData = async (datasetId, variables, timeUnit) => {
  const res = await erddapClient.get(
    `/${datasetId}.json?${variables.join(
      ","
    )},station_name,time&orderByCount("station_name,time/${timeUnit}")`
  );
  return utils.jsonTableToObjects(res.data.table);
};

const getBuoysCoordinates = async (datasetId) => {
  const res = await erddapClient.get(
    `/${datasetId}.json?station_name,longitude,latitude&distinct()`
  );
  return utils.jsonTableToObjects(res.data.table);
};

const getBuoyVariables = async (datasetId) => {
  let vars = [];
  const res = await erddapClient.get(`/${datasetId}.dds`);
  const rows = res.data.split("\n").map((row) => {
    let line = row.trim();
    if (line.endsWith(";") && !line.includes("}")) {
      let defn = line.substring(0, line.length - 1).split(" ")[1];
      if (!baseVariables.includes(defn)) {
        vars.push(defn);
      }
    }
  });

  return vars;
};

const getDAData = async ({ sites, datasetId }) => {
  const siteString = `~"(${sites.join("|")})"`;
  const res = await erddapClient.get(
    `/${datasetId}.json?time,Site,pDA_ng_Lseawater_1ngL_LOQ&Site=${siteString}`
  );
  return utils.jsonTableToObjects(res.data.table);
};

const getFishData = async ({ datasetId }) => {
  console.log(datasetId);
  // get fish data from erddap, minimal processing here
  const res = await erddapClient.get(`/${datasetId}.json`);
  return utils.jsonTableToObjects(res.data.table);
};

module.exports = {
  getMultiBuoyGeoJsonData,
  getSingleBuoyGeoJsonData,
  getBuoysCoordinates,
  getBuoyVariables,
  getSummaryData,
  getDAData,
  getFishData,
};
