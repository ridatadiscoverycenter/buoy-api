const mysql = require("mysql");
const util = require("util");

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.BUOY_TELEMETRY_MYSQL_HOST,
  user: process.env.BUOY_TELEMETRY_MYSQL_USER,
  password: process.env.BUOY_TELEMETRY_MYSQL_PASSWORD,
  database: process.env.BUOY_TELEMETRY_MYSQL_DATABASE,
});

const query = util.promisify(pool.query).bind(pool);

const getLatestRecord = async (buoyId, tableType) => {
  return await query(
    `SELECT * FROM \`${buoyId}_${tableType}\` ORDER BY TmStamp desc LIMIT 1`
  );
};

const getRecordsSince = async (buoyId, tableType, startDt) => {
  return await query(
    `SELECT * FROM \`${buoyId}_${tableType}\` WHERE TmStamp >= ?`,
    [startDt]
  );
};

module.exports = {
  getLatestRecord,
  getRecordsSince,
};
