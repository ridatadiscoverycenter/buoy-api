const aq = require('arquero');
const op = aq.op;
const { getSingleBuoyGeoJsonData } = require('@/clients/erddap');


aq.addFunction('sixhours', (x) => {
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
const downsample = (data, numPoints, variable) => {
  if (data.length <= numPoints) {
    return data;
  }
  let dt = aq.from(data);

  // try aggregating to the hour
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
    .groupby('station_name', 'dt_hr')
    .rollup({ variable: op.mean(variable) });

  if (dt_hr.numRows() < numPoints) {
    return dt_hr
      .select({ variable, station_name: 'station_name', dt_hr: 'time' })
      .objects();
  }

  // try aggregating to the 6 hours
  let dt_qtr = dt
    .derive({
      dt_qtr: (d) =>
        op.datetime(
          op.year(d.time),
          op.month(d.time),
          op.date(d.time),
          op.sixhours(op.hours(d.time))
        ),
    })
    .groupby('station_name', 'dt_qtr')
    .rollup({ variable: op.mean(variable) });

  if (dt_qtr.numRows() < numPoints) {
    return dt_qtr
      .select({ variable, station_name: 'station_name', dt_qtr: 'time' })
      .objects();
  }

  // fallthrough to day aggregation
  return dt
    .derive({
      dt_day: (d) =>
        op.datetime(op.year(d.time), op.month(d.time), op.date(d.time)),
    })
    .groupby('station_name', 'dt_day')
    .rollup({ variable: op.mean(variable) })
    .select({ variable, station_name: 'station_name', dt_day: 'time' })
    .objects();
};

module.exports = {
  downsample,
};
