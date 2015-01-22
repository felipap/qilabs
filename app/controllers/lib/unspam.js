// adapted from connect-ratelimit

var clients   = {},
    whitelist,
    blacklist,
    end       = false,
    config    = {
      whitelist: {
        totalRequests: 5000,
        every:         60 * 60 * 1000
      },
      blacklist: {
        totalRequests: 0,
        every:         0
      },
      normal: {
        totalRequests: 500,
        every:         60 * 60 * 1000
      }
    };


var limiter = function (options) {
  var categories;

  if (!options){
    options = {};
  }

  whitelist   = options.whitelist || [];
  blacklist   = options.blacklist || [];
  end         = options.end       || end;

  categories = options.categories || options.catagories;
  if (categories){
    deepExtend(config, categories);
  }

  return middleware;
};

function middleware (req, res, next) {
  var name   = req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      type   = getClientType(name),
      client = clients[name];

  res.ratelimit = {
    clients: clients,
    exceeded: false
  };

  if (req.url === '/favicon.ico') {
    next();
    return;
  };

  if (!client) {
    clients[name] = client = new Client(name, type, config[type].every);
  }

  res.setHeader('X-RateLimit-Limit', config[type].totalRequests);
  res.setHeader('X-RateLimit-Remaining', config[type].totalRequests - client.ticks);

  res.ratelimit.exceeded = !ok(client);
  res.ratelimit.client   = client;

  if (ok(client)) {
    client.ticks++;
    next();
  }
  else if (end === false) {
    next();
  }
  else {
    res.statusCode = 429;
    res.end('Rate limit exceded.');
  }
}

function Client (name, type, resetIn) {
  var name   = name;

  this.name  = name;
  this.type  = type;
  this.ticks = 1;

  setTimeout(function () {
    delete clients[name];
  }, resetIn);
}

function ok (client) {
  if (client.type === 'whitelist') {
    return client.ticks <= config.whitelist.totalRequests;
  }
  if (client.type === 'blacklist') {
    return client.ticks <= config.blacklist.totalRequests;
  }
  if (client.type === 'normal') {
    return client.ticks <= config.normal.totalRequests;
  }
}

function getClientType (name) {
  if (whitelist.indexOf(name) > -1) {
    return 'whitelist';
  }
  if (blacklist.indexOf(name) > -1) {
    return 'blacklist';
  }
  return 'normal';
}

function deepExtend (destination, source) {
  var property;

  for (property in source) {
    if (source[property] && source[property].constructor &&
     source[property].constructor === Object) {
      destination[property] = destination[property] || {};
      deepExtend(destination[property], source[property]);
    } else {
      destination[property] = source[property];
    }
  }
  return destination;
}

module.exports = function (req, res, next) {

  if (!req.session._unspam) {
    req.session._unspam = {}
  }

  var opts = {
    // whitelist: ['127.0.0.1'],
    categories: {
      normal: {
        totalRequests: 30,
        every: 30 * 1000,
      }
    }
  };
  limiter(opts)(req, res, function () {
    if (res.ratelimit.exceeded) {
      return res.status(429).endJSON({
        error: true,
        limitError: true,
        message: 'Limite de requisições exceedido.',
      })
    }
    next()
  })
}

module.exports.limit = function (key, ms) {
  // Identify calls to this controller
  if (!ms) {
    ms = key;
    key = ~~(Math.random()*1000000)/1 // Assuming it's not going to collide
  }
  return function (req, res, next) {
    if (!req.session._unspam) {
      throw "Unspam middleware not used.";
    }

    if (!req.session._unspam[key]) {
      req.session._unspam[key] = Date.now()
    } else if (req.session._unspam[key]+ms < Date.now()) {
      // console.log('req.session._unspam[key]+ms', req.session._unspam[key]+ms, Date.now())
      req.session._unspam[key] = Date.now()
    } else {
      // req.session._unspam[key] = Date.now() // Refresh limit?
      // console.log("LIMIT", new Date(req.session._unspam[key]+ms), new Date())
      res.status(429).endJSON({ error: true, limitError: true, message: "Espere um pouco para realizar essa ação." })
      return
    }
    next()
  }
}