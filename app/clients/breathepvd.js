const mysql = require("mysql2");
var SqlString = require("sqlstring");
const util = require("util");

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.BREATHEPVD_MYSQL_HOST,
  user: process.env.BREATHEPVD_MYSQL_USER,
  password: process.env.BREATHEPVD_MYSQL_PASSWORD,
  database: process.env.BREATHEPVD_MYSQL_DATABASE,
  timezone: "Z",
});

const query = util.promisify(pool.query).bind(pool);

const ALL_COLUMNS = ["*"];
const getColumns = (variables = ALL_COLUMNS) => {
  // note - this is okay because this code is the only source of variable names - this would
  // be bad if we allowed user defined variables here
  return (columns = variables.map((variable) => SqlString.raw(variable)));
};

const getLatestRecord = async (sensor, table, timestampVar, variables) => {
  const columns = getColumns(variables);
  return await query(`SELECT ? FROM ?? ORDER BY ?? desc LIMIT 1`, [
    columns,
    `${sensor}_${table}`,
    timestampVar,
  ]);
};

const getRecordsSince = async (
  sensor,
  table,
  timestampVar,
  daysAgo,
  variables
) => {
  const columns = getColumns(variables);
  return await query(
    `SELECT ? FROM ?? WHERE ?? >= DATE_SUB(NOW(), interval ? day)`,
    [columns, `${sensor}_${table}`, timestampVar, daysAgo]
  );
};

const getRecordsRange = async (
  sensor,
  table,
  timestampVar,
  startDate,
  endDate,
  variables
) => {
  const columns = getColumns(variables);
  return await query(`SELECT ? FROM ?? WHERE ?? >= ? and ?? < ?`, [
    columns,
    `${sensor}_${table}`,
    timestampVar,
    startDate,
    timestampVar,
    endDate,
  ]);
};

module.exports = {
  getLatestRecord,
  getRecordsSince,
  getRecordsRange,
};
