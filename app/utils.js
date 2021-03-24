const aq = require("arquero");
const op = aq.op;

aq.addFunction("utcsixhours", (x) => {
  if (x < 6) {
    return 3;
  } else if (x < 12) {
    return 9;
  } else if (x < 18) {
    return 15;
  } else {
    return 21;
  }
});

// downsample the buoy points to approximately the desired number of points
// TODO: have this handle multiple buoys in one pass
const downsample = (data, numPoints, variables) => {
  let full_dt = aq
    .from(data)
    .fold(variables, { as: ["variable", "value"] })
    .filter("d.value");

  if (full_dt.numRows <= numPoints) {
    return full_dt.objects();
  }

  let stations = full_dt.groupby("station_name").count().objects();

  let dsets = stations.map((station) => {
    let vsets = variables.map((v) => {
      let dt = full_dt.filter(
        `d => d.station_name === "${station.station_name}" && d.variable === "${v}"`
      );

      if (dt.numRows() < numPoints) {
        return dt.objects();
      }

      // try aggregating to the hour
      let dt_hr = dt
        .derive({
          dt_hr: (d) =>
            op.utcdatetime(
              op.utcyear(d.time),
              op.utcmonth(d.time),
              op.utcdate(d.time),
              op.utchours(d.time)
            ),
        })
        .groupby("station_name", "variable", "dt_hr")
        .rollup({ value: op.mean("value") });

      if (dt_hr.numRows() < numPoints) {
        return dt_hr
          .select({
            variable: "variable",
            value: "value",
            station_name: "station_name",
            dt_hr: "time",
          })
          .objects();
      }

      // try aggregating to the 6 hours
      let dt_qtr = dt
        .derive({
          dt_qtr: (d) =>
            op.utcdatetime(
              op.utcyear(d.time),
              op.utcmonth(d.time),
              op.utcdate(d.time),
              op.utcsixhours(op.utchours(d.time))
            ),
        })
        .groupby("station_name", "variable", "dt_qtr")
        .rollup({ value: op.mean("value") });

      if (dt_qtr.numRows() < numPoints) {
        return dt_qtr
          .select({
            variable: "variable",
            value: "value",
            station_name: "station_name",
            dt_qtr: "time",
          })
          .objects();
      }

      // fallthrough to day aggregation
      return dt
        .derive({
          dt_day: (d) =>
            op.utcdatetime(
              op.utcyear(d.time),
              op.utcmonth(d.time),
              op.utcdate(d.time)
            ),
        })
        .groupby("station_name", "variable", "dt_day")
        .rollup({ value: op.mean("value") })
        .select({
          variable: "variable",
          value: "value",
          station_name: "station_name",
          dt_day: "time",
        })
        .objects();
    });
    return vsets.reduce((acc, val) => acc.concat(val), []);
  });

  return dsets.reduce((acc, val) => acc.concat(val), []);
};

const jsonTableToObjects = (table) => {
  return table.rows.map((row) => {
    let res = {};
    for (const [i, key] of table.columnNames.entries()) res[key] = row[i];
    return res;
  });
};

module.exports = {
  downsample,
  jsonTableToObjects,
};
