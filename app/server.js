require("module-alias/register");
fs = require('fs');
const express = require("express");
const logger = require("morgan");
const createError = require("http-errors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const swaggerOptions = require("@/swaggerDef");
const { updateCache } = require("@/init");

const app = express();
const port = 8088;

//set up the logger
var accessLogStream = fs.createWriteStream(__dirname + '/access.log', {flags: 'a'})
app.use(logger('combined',  {"stream": accessLogStream}));
const specs = swaggerJsdoc(swaggerOptions);

app.use(logger("[:date[web]] :method :url :status :res[content-length] - :remote-addr - :response-time ms"));
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

const erddapRouter = require("./routes/erddap/index");
app.use("/erddap", erddapRouter);

const telemetryRouter = require("./routes/telemetry/index");
app.use("/telemetry", telemetryRouter);

const breathePvdRouter = require("./routes/breathepvd/index");
app.use("/breathepvd", breathePvdRouter);

// initialize cache and set timer to update it every day
const cacheTimeout = 60 * 60 * 24 * 1000; // one day of milliseconds
updateCache(cacheTimeout);
// start refreshing 10 seconds before timeout
setInterval(() => updateCache(cacheTimeout), cacheTimeout - 10000);

app.use(function (_req, _res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, _next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({ error: err.message });
});

app.listen(port, () => console.log(`RIDDC API listening on port ${port}!`));

module.exports = app;
