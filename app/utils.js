const aq = require("arquero");
const op = aq.op;
const { getSingleBuoyGeoJsonData } = require("@/clients/erddap");

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
const downsample = (data, numPoints, variable) => {
  if (data.length <= numPoints) {
    return data;
  }
  let full_dt = aq.from(data);

  let stations = full_dt.groupby("station_name").count().objects();

  let dsets = stations.map((station) => {
    let dt = full_dt.filter(
      `d => d.station_name === "${station.station_name}"`
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
      .groupby("station_name", "dt_hr")
      .rollup({ variable: op.mean(variable) });

    if (dt_hr.numRows() < numPoints) {
      return dt_hr
        .select({ variable, station_name: "station_name", dt_hr: "time" })
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
      .groupby("station_name", "dt_qtr")
      .rollup({ variable: op.mean(variable) });

    if (dt_qtr.numRows() < numPoints) {
      return dt_qtr
        .select({ variable, station_name: "station_name", dt_qtr: "time" })
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
      .groupby("station_name", "dt_day")
      .rollup({ variable: op.mean(variable) })
      .select({ variable, station_name: "station_name", dt_day: "time" })
      .objects();
  });

  return dsets.reduce((acc, val) => acc.concat(val), []);
};

module.exports = {
  downsample,
};
