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
const getAvgColumns = (variables) => {
  // note - this is okay because this code is the only source of variable names - this would
  // be bad if we allowed user defined variables here
    return (columns = variables.map((variable) =>
      SqlString.raw(`AVG( ${variable} ) as ${variable}`)
    ));
};
const getGroupColumns = (variables) => {
  return (columns = variables.map((variable) =>
    SqlString.raw(`MIN( ${variable} ) as ${variable}`)
  ))
}

const deriveUtcTimestamp = (value) => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return null;
  }

  return date.toISOString();
};

const attachUtcTimestamp = (rows, primaryKey, fallbackKey) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return rows;
  }

  return rows.map((row) => {
    const timestampValue =
      (primaryKey && row[primaryKey]) ||
      (fallbackKey && row[fallbackKey]);

    const utcTimestamp = deriveUtcTimestamp(timestampValue);
    if (!utcTimestamp) {
      return row;
    }

    // Filter out timestamp fields and date_format columns
    const cleanedRow = Object.keys(row).reduce((acc, key) => {
      // Skip the original timestamp fields and any date_format columns
      if (key === primaryKey || key === fallbackKey || key.startsWith('date_format(')) {
        return acc;
      }
      acc[key] = row[key];
      return acc;
    }, {});
    
    return {
      ...cleanedRow,
      timestamp_utc: utcTimestamp,
    };
  });
};

const getLatestRecord = async (sensor, table, timestampVar, variables) => {
  // Ensure timestamp is included without duplicating
  const allVars = variables.includes(timestampVar) 
    ? variables 
    : [...variables, timestampVar];
  const columns = getColumns(allVars);
  const rows = await query(`SELECT ? FROM ?? ORDER BY ?? desc LIMIT 1`, [
    columns,
    `${table}_${sensor}`,
    timestampVar,
  ]);

  return attachUtcTimestamp(rows, timestampVar);
};

const getRecordsSince = async (
  sensor,
  table,
  timestampVar,
  daysAgo,
  variables
) => {
  // Ensure timestamp is included without duplicating
  const allVars = variables.includes(timestampVar) 
    ? variables 
    : [...variables, timestampVar];
  const columns = getColumns(allVars);
  const rows = await query(
    `SELECT ? FROM ?? WHERE ?? >= DATE_SUB(NOW(), interval ? day)`,
    [columns, `${table}_${sensor}`, timestampVar, daysAgo]
  );

  return attachUtcTimestamp(rows, timestampVar);
};

const getRecordsRange = async (
  sensor,
  table,
  timestampVar,
  startDate,
  endDate,
  variables
) => {
  // Ensure timestamp is included without duplicating
  const allVars = variables.includes(timestampVar) 
    ? variables 
    : [...variables, timestampVar];
  const columns = getColumns(allVars);
  const rows = await query(`SELECT ? FROM ?? WHERE ?? >= ? and ?? < ?`, [
    columns,
    `${table}_${sensor}`,
    timestampVar,
    startDate,
    timestampVar,
    endDate,
  ]);

  return attachUtcTimestamp(rows, timestampVar);
};

const getHourlyRecordsRange = async (
  sensor,
  table,
  timestampVar,
  startDate,
  endDate,
  variables,
  groupVariables
) => {
  const columns = getAvgColumns(variables);
  const groupColumns = getGroupColumns(groupVariables)
  const rows = await query(
    `SELECT MIN( ?? ) as timestamp, date_format(??, '%Y-%m-%d %H'), ?, ?
    FROM ?? 
    WHERE ?? >= ? and ?? < ?
    GROUP BY date_format(??, '%Y-%m-%d %H')`,
    [
      timestampVar,
      timestampVar,
      groupColumns,
      columns,
      `${table}_${sensor}`,
      timestampVar,
      startDate,
      timestampVar,
      endDate,
      timestampVar,
    ]
  );

  // Adds a derived UTC timestamp for clients expecting ISO strings.
  return attachUtcTimestamp(rows, "timestamp", timestampVar);
};
module.exports = {
  getLatestRecord,
  getRecordsSince,
  getRecordsRange,
  getHourlyRecordsRange,
};
