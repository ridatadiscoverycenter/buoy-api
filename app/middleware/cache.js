const mcache = require("memory-cache");

const cacheMiddleware = (req, res, next) => {
  let key = "__express__" + req.originalUrl || req.url;
  console.log(key);
  let cachedBody = mcache.get(key);
  if (cachedBody) {
    res.send(cachedBody);
  } else {
    res.sendResponse = res.send;
    res.send = (body) => {
      mcache.put(key, body);
      res.sendResponse(body);
    };
    next();
  }
};

module.exports = { cacheMiddleware };
