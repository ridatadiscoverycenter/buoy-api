const axios = require('axios');

const erddapClient = axios.create({
  baseURL: 'https://pricaimcit.services.brown.edu/erddap/tabledap',
  withCredentials: false,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});
  
const getMultiBuoyGeoJsonData = ({ ids, variable, start, end , datasetId}) => {
  const startDate = start ?? '2003-01-01T12:00:00Z';
  const endDate = end ?? '2012-12-31T12:00:00Z';
  const promiseArray = ids.map((id) => {
    return erddapClient.get(
      `/${datasetId}.geoJson?${variable},time,latitude,longitude,station_name&station_name="${id}"&time>=${startDate}&time<=${endDate}`
    );
  });
  return promiseArray;
};

module.exports = {
  getMultiBuoyGeoJsonData
};