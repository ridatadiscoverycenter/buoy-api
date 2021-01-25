const axios = require("axios");

const erddapClient = axios.create({
  baseURL: "https://pricaimcit.services.brown.edu/erddap/tabledap",
  withCredentials: false,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

const baseVariables = ["time", "latitude", "longitude", "station_name"];

const getMultiBuoyGeoJsonData = ({ ids, variable, start, end, datasetId }) => {
  const idString = `~"(${ids.join("|")})"`;
  return getSingleBuoyGeoJsonData({
    idString,
    variable,
    start,
    end,
    datasetId,
  });
};

const getSingleBuoyGeoJsonData = ({
  id,
  idString,
  variable,
  start,
  end,
  datasetId,
}) => {
  const startDate = start ?? "2003-01-01T12:00:00Z";
  const endDate = end ?? "2012-12-31T12:00:00Z";
  idString = idString ?? `"${id}"`;
  return erddapClient
    .get(
      `/${datasetId}.geoJson?${variable},${baseVariables.join(
        ","
      )}&station_name=${idString}&time>=${startDate}&time<=${endDate}`
    )
    .then((res) => res)
    .catch((err) => {
      console.log(err);
      throw err;
    });
};

const getSummaryData = (datasetId, variables) => {
  return erddapClient.get(
    `/${datasetId}.json?${variables.join(
      ","
    )},station_name,time&orderByCount("station_name,time/1month")`
  );
};

const getBuoysCoordinates = (datasetId) => {
  return erddapClient.get(
    `/${datasetId}.json?station_name,longitude,latitude&distinct()`
  );
};

const getBuoyIds = async (datasetId) => {
  const res = await erddapClient.get(
    `/${datasetId}.json?station_name&distinct()`
  );
  return res.data.table.rows;
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

module.exports = {
  getMultiBuoyGeoJsonData,
  getSingleBuoyGeoJsonData,
  getBuoysCoordinates,
  getBuoyIds,
  getBuoyVariables,
  getSummaryData,
};
