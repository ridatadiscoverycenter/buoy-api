require("module-alias/register");
require("dotenv").config();
const express = require("express");
const logger = require("morgan");
const createError = require("http-errors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const swaggerOptions = require("@/swaggerDef");
const { updateCache } = require("@/init");

const app = express();
const port = 8080;

const specs = swaggerJsdoc(swaggerOptions);

app.use(logger("dev"));
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

const erddapRouter = require("./routes/erddap/index");
app.use("/erddap", erddapRouter);

// initialize cache and set timer to update it every day
const cacheTimeout = 60 * 60 * 24 * 1000; // one day of milliseconds
updateCache(cacheTimeout);
setInterval(() => updateCache(cacheTimeout), cacheTimeout);

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
