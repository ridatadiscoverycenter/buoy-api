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
  // note - this is okay because this code is the only source of variable names - this would
  // be bad if we allowed user defined variables here
  try {
  var cols = (columns = variables.map((variable) => SqlString.raw(variable)));
  console.log(cols);
  } catch (error) {
    console.error(error);
    throw new Error(`Unable to get columns.`);
  }
};

const getLatestRecord = async (buoyId, tableType, variables) => {
  const columns = getColumns(variables);
  try {
    var result = await query(`SELECT ? FROM ?? ORDER BY TmStamp desc LIMIT 1`, [
    columns,
    `${buoyId}_${tableType}`,
  ]);
    console.log(result);
  } catch (error) {
    console.error(error);
    throw new Error(`Unable to retrieve latest ${tableType} record for buoy ${buoyId}.`);
  }  
};

const getRecordsSince = async (buoyId, tableType, daysAgo, variables) => {
  const columns = getColumns(variables);
  return await query(
    `SELECT ? FROM ?? WHERE TmStamp >= DATE_SUB(NOW(), interval ? day)`,
    [columns, `${buoyId}_${tableType}`, daysAgo]
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
  return await query(`SELECT ? FROM ?? WHERE TmStamp >= ? AND TmStamp < ?`, [
    columns,
    `${buoyId}_${tableType}`,
    startDate,
    endDate,
  ]);
};

module.exports = {
  getLatestRecord,
  getRecordsSince,
  getRecordsRange,
};
