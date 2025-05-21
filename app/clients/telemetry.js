const mysql = require("mysql2");
var SqlString = require("sqlstring");
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

const ALL_COLUMNS = ["*"];
const getColumns = (variables = ALL_COLUMNS) => {
  return variables.map((variable) => SqlString.raw(variable)).join(', ');
};

const getLatestRecord = async (buoyId, tableType, variables) => {
  const columns = getColumns(variables);
  const tableName = SqlString.escapeId(`${buoyId}_${tableType}`);
  
  try {
    var result = await query(`SELECT ${columns} FROM ${tableName} ORDER BY TmStamp desc LIMIT 1`);
    console.log(result);
    return result;
  } catch (error) {
    console.error(error);
    throw new Error(`Unable to retrieve latest ${tableType} record for buoy ${buoyId}.`);
  }  
};

const getRecordsSince = async (buoyId, tableType, daysAgo, variables) => {
  const columns = getColumns(variables);
  const tableName = SqlString.escapeId(`${buoyId}_${tableType}`);
  
  return await query(
    `SELECT ${columns} FROM ${tableName} WHERE TmStamp >= DATE_SUB(NOW(), interval ? day)`,
    [daysAgo]
  );
};

const getRecordsRange = async (
  buoyId,
  tableType,
  startDate,
  endDate,
  variables
) => {
  const columns = getColumns(variables);
  const tableName = SqlString.escapeId(`${buoyId}_${tableType}`);
  
  return await query(`SELECT ${columns} FROM ${tableName} WHERE TmStamp >= ? AND TmStamp < ?`, [
    startDate,
    endDate,
  ]);
};

module.exports = {
  getLatestRecord,
  getRecordsSince,
  getRecordsRange,
};