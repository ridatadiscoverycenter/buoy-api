const aq = require("arquero");
const op = aq.op;

// downsample the buoy points to approximately the desired number of points
const downsample = (data, numPoints, variable) => {
  let dt = aq.from(data);
  let dt_hr = dt
    .derive({
      dt_hr: (d) =>
        op.datetime(
          op.year(d.time),
          op.month(d.time),
          op.date(d.time),
          op.hours(d.time)
        ),
    })
    .groupby("station_name", "dt_hr")
    .rollup({ variable: op.mean(variable) });

  if (dt_hr.numRows() < numPoints) {
    return dt_hr.select({ variable, 'station_name': 'station_name', dt_hr: "time" }).objects();
  } else {
    return dt
      .derive({
        dt_day: (d) =>
          op.datetime(op.year(d.time), op.month(d.time), op.date(d.time)),
      })
      .groupby("station_name", "dt_day")
      .rollup({ variable: op.mean(variable) })
      .select({ variable, 'station_name': 'station_name', dt_day: "time" })
      .objects();
  }
};

module.exports = {
  downsample,
};
