# ERDDAP Proxy API

Simple Node-Express API to fetch and process data from ERDDAP.

To install:
`npm install`

To run:
`npm run start`
`npm run dev` (if trying to connect to a local erddap instance, use `npm run dev:local` instead)

Linting:
`npm run prettify`

Listening on:
`localhost:8088`

Documentation:
`localhost:8088/api-docs`


## Buoy Telemetry

To connect to the buoy telemetry data, you'll need a `.env.dev` with the following.  Make a dump of the buoy data to load to a localhost mysql server and point the dev api to that.

```
BUOY_TELEMETRY_MYSQL_HOST=localhost
BUOY_TELEMETRY_MYSQL_USER=
BUOY_TELEMETRY_MYSQL_PASSWORD=
BUOY_TELEMETRY_MYSQL_DATABASE=buoy_telemetry
```

The built/deployed version uses the `.env` file with the same keys but with the service account.
