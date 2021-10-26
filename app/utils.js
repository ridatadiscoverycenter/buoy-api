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
const downsample = (
  data,
  numPoints,
  variables,
  start,
  end,
  downsampleDataset
) => {
  let downsampled = false;

  if (data.length === 0) {
    return { data, downsampled };
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  const timeInterval = new Date("2020-01-02") - new Date("2020-01-01"); // one day
  const times = aq.table({
    time: op.sequence(startDate, endDate, timeInterval),
  });

  let full_dt = aq
    .from(data)
    .fold(variables, { as: ["variable", "value"] })
    .orderby("station_name", "variable", "time")
    .reify();

  if (!downsampleDataset) {
    // a couple datasets are already sparesly sampled, so we bail out early
    return { data: full_dt.objects(), downsampled };
  }

  let stations = full_dt.groupby("station_name", "buoyId").count().objects();

  let dsets = stations.map(({ station_name, buoyId }) => {
    let vsets = variables.map((v) => {
      let dt = full_dt.filter(
        `d => d.station_name === "${station_name}" && d.variable === "${v}"`
      );

      dt = dt
        .join_full(times, "time")
        .impute({
          station_name: `() => "${station_name}"`,
          variable: `() => "${v}"`,
          buoyId: `() => "${buoyId}"`,
          value: () => null,
        })
        .orderby("time")
        .reify();

      if (dt.numRows() <= numPoints) {
        return dt.objects();
      }

      downsampled = true;

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
        .rollup({ value: op.mean("value") })
        .impute({ value: () => null });

      if (dt_hr.numRows() <= numPoints) {
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
        .rollup({ value: op.mean("value") })
        .impute({ value: () => null });

      if (dt_qtr.numRows() <= numPoints) {
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
        .impute({ value: () => null })
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

  return { data: dsets.reduce((acc, val) => acc.concat(val), []), downsampled };
};

const jsonTableToObjects = (table) => {
  return table.rows.map((row) => {
    let res = {};
    for (const [i, key] of table.columnNames.entries()) res[key] = row[i];
    return res;
  });
};

const humanizeSnakeCase = (v) => {
  let nextUpper = true;
  let res = "";
  for (let c of v) {
    if (nextUpper) {
      res += c.toUpperCase();
      nextUpper = false;
    } else if (c === "_") {
      res += " ";
      nextUpper = true;
    } else {
      res += c;
    }
  }
  return res;
};

module.exports = {
  downsample,
  jsonTableToObjects,
  humanizeSnakeCase,
};
