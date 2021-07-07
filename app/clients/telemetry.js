const mysql = require("mysql2");
const util = require("util");

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.BUOY_TELEMETRY_MYSQL_HOST,
  user: process.env.BUOY_TELEMETRY_MYSQL_USER,
  password: process.env.BUOY_TELEMETRY_MYSQL_PASSWORD,
  database: process.env.BUOY_TELEMETRY_MYSQL_DATABASE,
  timezone: "Z",
});

const query = util.promisify(pool.query).bind(pool);

const getLatestRecord = async (buoyId, tableType) => {
  return await query(`SELECT * FROM ?? ORDER BY TmStamp desc LIMIT 1`, [
    `${buoyId}_${tableType}`,
  ]);
};

const getRecordsSince = async (buoyId, tableType, daysAgo) => {
  // return await query('select timestampadd(DAY, 1, now())')
  return await query(
    `SELECT * FROM ?? WHERE TmStamp >= DATE_SUB(NOW(), interval ? day)`,
    [`${buoyId}_${tableType}`, daysAgo]
  );
};

module.exports = {
  getLatestRecord,
  getRecordsSince,
};
