module.exports = {
  definition: {
    info: {
      // API informations (required)
      title: "ERDDAP Proxy API", // Title (required)
      version: "0.0.1", // Version (required)
      description:
        "Proxy API to process and serve ERDDAP, buoy telemetry, and BreathePVD data", // Description (optional)
    },
    basePath: "/", // Base path (optional),
  },
  apis: ["app/routes/**/*.js"],
};
