const mcache = require("memory-cache");

const cacheMiddleware = (req, res, next) => {
  let key = "__express__" + req.originalUrl || req.url;
  let timeout = 60 * 60 * 24 * 1000; // one day of milliseconds
  console.log(key);
  let cachedBody = mcache.get(key);
  if (cachedBody) {
    res.send(cachedBody);
  } else {
    res.sendResponse = res.send;
    res.send = (body) => {
      mcache.put(key, body, timeout);
      res.sendResponse(body);
    };
    next();
  }
};

module.exports = { cacheMiddleware };
