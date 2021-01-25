/* istanbul ignore next */
// This file is an example, it's not functionally used by the module.This

const host = `${process.env.HOST}:${process.env.PORT}`;

module.exports = {
  definition: {
    info: {
      // API informations (required)
      title: "ERDDAP Proxy API", // Title (required)
      version: "0.0.1", // Version (required)
      description: "Proxy API to process and serve ERDDAP data", // Description (optional)
    },
    host, // Host (optional)
    basePath: "/", // Base path (optional),
  },
  apis: ["app/routes/**/*.js"],
};
