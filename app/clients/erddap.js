const axios = require("axios");
const utils = require("@/utils");

const erddapClient = axios.create({
  baseURL:
    process.env.BUOY_API_ERDDAP_URL ??
    "https://qa-erddap.riddc.brown.edu/erddap/tabledap",
  withCredentials: false,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

const baseVariables = ["time", "latitude", "longitude", "station_name"];

const nonDataVariables = [...baseVariables, "station_longname", "timezone"];

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
  const queryString = `/${datasetId}.geoJson?${variables.join(
    ","
  )},${baseVariables.join(
    ","
  )}&station_name=${idString}&time>=${startDate}&time<=${endDate}`;
  return erddapClient
    .get(queryString)
    .then((res) => res)
    .catch((error) => {
      if (error.response.status >= 400 && error.response.status < 500) {
        console.log(
          `Query "${queryString}" resulted in a 400 series error - returning []`
        );
        return { data: { features: [] } };
      } else {
        console.log(error);
        throw error;
      }
    });
};

const getSummaryData = async (datasetId, variables, timeUnit) => {
  const res = await erddapClient.get(
    `/${datasetId}.json?${variables
      .map((v) => v.name)
      .join(
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
  const vars = [];
  const ddsRes = await erddapClient.get(`/${datasetId}.dds`);
  const rows = ddsRes.data.split("\n").map((row) => {
    const line = row.trim();
    if (line.endsWith(";") && !line.includes("}")) {
      let defn = line.substring(0, line.length - 1).split(" ")[1];
      if (!nonDataVariables.includes(defn)) {
        vars.push(defn);
      }
    }
  });

  // getting the units out in an easily parsable manner without data or already knowing the units is surprisingly tricky.  This approach gets the variable names, then queries for 1 row of data with all of those variables in order to track down the units.
  const jsonRes = await erddapClient.get(
    `/${datasetId}.json?${vars.join(",")}&orderByLimit("1")`
  );

  const unitMap = new Map([
    ["per cent", "%"],
    ["degree_C", "°C"],
    ["data_qualifier", null],
  ]);

  const table = jsonRes.data.table;
  return table.columnNames.map((name, i) => ({
    name,
    units: unitMap.has(table.columnUnits[i])
      ? unitMap.get(table.columnUnits[i])
      : table.columnUnits[i],
  }));
};

const getBuoyTimeRange = async (datasetId) => {
  const jsonRes = await erddapClient.get(
    `/${datasetId}.json?time&orderByMinMax("time")`
  );
  const res = utils.jsonTableToObjects(jsonRes.data.table);
  return { min: res[0].time, max: res[1].time };
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
  getBuoyTimeRange,
  getDAData,
  getFishData,
};
