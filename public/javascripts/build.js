
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("visionmedia-page.js/index.js", Function("exports, require, module",
"\n\
;(function(){\n\
\n\
  /**\n\
   * Perform initial dispatch.\n\
   */\n\
\n\
  var dispatch = true;\n\
\n\
  /**\n\
   * Base path.\n\
   */\n\
\n\
  var base = '';\n\
\n\
  /**\n\
   * Running flag.\n\
   */\n\
\n\
  var running;\n\
\n\
  /**\n\
   * Register `path` with callback `fn()`,\n\
   * or route `path`, or `page.start()`.\n\
   *\n\
   *   page(fn);\n\
   *   page('*', fn);\n\
   *   page('/user/:id', load, user);\n\
   *   page('/user/' + user.id, { some: 'thing' });\n\
   *   page('/user/' + user.id);\n\
   *   page();\n\
   *\n\
   * @param {String|Function} path\n\
   * @param {Function} fn...\n\
   * @api public\n\
   */\n\
\n\
  function page(path, fn) {\n\
    // <callback>\n\
    if ('function' == typeof path) {\n\
      return page('*', path);\n\
    }\n\
\n\
    // route <path> to <callback ...>\n\
    if ('function' == typeof fn) {\n\
      var route = new Route(path);\n\
      for (var i = 1; i < arguments.length; ++i) {\n\
        page.callbacks.push(route.middleware(arguments[i]));\n\
      }\n\
    // show <path> with [state]\n\
    } else if ('string' == typeof path) {\n\
      page.show(path, fn);\n\
    // start [options]\n\
    } else {\n\
      page.start(path);\n\
    }\n\
  }\n\
\n\
  /**\n\
   * Callback functions.\n\
   */\n\
\n\
  page.callbacks = [];\n\
\n\
  /**\n\
   * Get or set basepath to `path`.\n\
   *\n\
   * @param {String} path\n\
   * @api public\n\
   */\n\
\n\
  page.base = function(path){\n\
    if (0 == arguments.length) return base;\n\
    base = path;\n\
  };\n\
\n\
  /**\n\
   * Bind with the given `options`.\n\
   *\n\
   * Options:\n\
   *\n\
   *    - `click` bind to click events [true]\n\
   *    - `popstate` bind to popstate [true]\n\
   *    - `dispatch` perform initial dispatch [true]\n\
   *\n\
   * @param {Object} options\n\
   * @api public\n\
   */\n\
\n\
  page.start = function(options){\n\
    options = options || {};\n\
    if (running) return;\n\
    running = true;\n\
    if (false === options.dispatch) dispatch = false;\n\
    if (false !== options.popstate) window.addEventListener('popstate', onpopstate, false);\n\
    if (false !== options.click) window.addEventListener('click', onclick, false);\n\
    if (!dispatch) return;\n\
    var url = location.pathname + location.search + location.hash;\n\
    page.replace(url, null, true, dispatch);\n\
  };\n\
\n\
  /**\n\
   * Unbind click and popstate event handlers.\n\
   *\n\
   * @api public\n\
   */\n\
\n\
  page.stop = function(){\n\
    running = false;\n\
    removeEventListener('click', onclick, false);\n\
    removeEventListener('popstate', onpopstate, false);\n\
  };\n\
\n\
  /**\n\
   * Show `path` with optional `state` object.\n\
   *\n\
   * @param {String} path\n\
   * @param {Object} state\n\
   * @param {Boolean} dispatch\n\
   * @return {Context}\n\
   * @api public\n\
   */\n\
\n\
  page.show = function(path, state, dispatch){\n\
    var ctx = new Context(path, state);\n\
    if (false !== dispatch) page.dispatch(ctx);\n\
    if (!ctx.unhandled) ctx.pushState();\n\
    return ctx;\n\
  };\n\
\n\
  /**\n\
   * Replace `path` with optional `state` object.\n\
   *\n\
   * @param {String} path\n\
   * @param {Object} state\n\
   * @return {Context}\n\
   * @api public\n\
   */\n\
\n\
  page.replace = function(path, state, init, dispatch){\n\
    var ctx = new Context(path, state);\n\
    ctx.init = init;\n\
    if (null == dispatch) dispatch = true;\n\
    if (dispatch) page.dispatch(ctx);\n\
    ctx.save();\n\
    return ctx;\n\
  };\n\
\n\
  /**\n\
   * Dispatch the given `ctx`.\n\
   *\n\
   * @param {Object} ctx\n\
   * @api private\n\
   */\n\
\n\
  page.dispatch = function(ctx){\n\
    var i = 0;\n\
\n\
    function next() {\n\
      var fn = page.callbacks[i++];\n\
      if (!fn) return unhandled(ctx);\n\
      fn(ctx, next);\n\
    }\n\
\n\
    next();\n\
  };\n\
\n\
  /**\n\
   * Unhandled `ctx`. When it's not the initial\n\
   * popstate then redirect. If you wish to handle\n\
   * 404s on your own use `page('*', callback)`.\n\
   *\n\
   * @param {Context} ctx\n\
   * @api private\n\
   */\n\
\n\
  function unhandled(ctx) {\n\
    var current = window.location.pathname + window.location.search;\n\
    if (current == ctx.canonicalPath) return;\n\
    page.stop();\n\
    ctx.unhandled = true;\n\
    window.location = ctx.canonicalPath;\n\
  }\n\
\n\
  /**\n\
   * Initialize a new \"request\" `Context`\n\
   * with the given `path` and optional initial `state`.\n\
   *\n\
   * @param {String} path\n\
   * @param {Object} state\n\
   * @api public\n\
   */\n\
\n\
  function Context(path, state) {\n\
    if ('/' == path[0] && 0 != path.indexOf(base)) path = base + path;\n\
    var i = path.indexOf('?');\n\
\n\
    this.canonicalPath = path;\n\
    this.path = path.replace(base, '') || '/';\n\
\n\
    this.title = document.title;\n\
    this.state = state || {};\n\
    this.state.path = path;\n\
    this.querystring = ~i ? path.slice(i + 1) : '';\n\
    this.pathname = ~i ? path.slice(0, i) : path;\n\
    this.params = [];\n\
\n\
    // fragment\n\
    this.hash = '';\n\
    if (!~this.path.indexOf('#')) return;\n\
    var parts = this.path.split('#');\n\
    this.path = parts[0];\n\
    this.hash = parts[1] || '';\n\
    this.querystring = this.querystring.split('#')[0];\n\
  }\n\
\n\
  /**\n\
   * Expose `Context`.\n\
   */\n\
\n\
  page.Context = Context;\n\
\n\
  /**\n\
   * Push state.\n\
   *\n\
   * @api private\n\
   */\n\
\n\
  Context.prototype.pushState = function(){\n\
    history.pushState(this.state, this.title, this.canonicalPath);\n\
  };\n\
\n\
  /**\n\
   * Save the context state.\n\
   *\n\
   * @api public\n\
   */\n\
\n\
  Context.prototype.save = function(){\n\
    history.replaceState(this.state, this.title, this.canonicalPath);\n\
  };\n\
\n\
  /**\n\
   * Initialize `Route` with the given HTTP `path`,\n\
   * and an array of `callbacks` and `options`.\n\
   *\n\
   * Options:\n\
   *\n\
   *   - `sensitive`    enable case-sensitive routes\n\
   *   - `strict`       enable strict matching for trailing slashes\n\
   *\n\
   * @param {String} path\n\
   * @param {Object} options.\n\
   * @api private\n\
   */\n\
\n\
  function Route(path, options) {\n\
    options = options || {};\n\
    this.path = path;\n\
    this.method = 'GET';\n\
    this.regexp = pathtoRegexp(path\n\
      , this.keys = []\n\
      , options.sensitive\n\
      , options.strict);\n\
  }\n\
\n\
  /**\n\
   * Expose `Route`.\n\
   */\n\
\n\
  page.Route = Route;\n\
\n\
  /**\n\
   * Return route middleware with\n\
   * the given callback `fn()`.\n\
   *\n\
   * @param {Function} fn\n\
   * @return {Function}\n\
   * @api public\n\
   */\n\
\n\
  Route.prototype.middleware = function(fn){\n\
    var self = this;\n\
    return function(ctx, next){\n\
      if (self.match(ctx.path, ctx.params)) return fn(ctx, next);\n\
      next();\n\
    };\n\
  };\n\
\n\
  /**\n\
   * Check if this route matches `path`, if so\n\
   * populate `params`.\n\
   *\n\
   * @param {String} path\n\
   * @param {Array} params\n\
   * @return {Boolean}\n\
   * @api private\n\
   */\n\
\n\
  Route.prototype.match = function(path, params){\n\
    var keys = this.keys\n\
      , qsIndex = path.indexOf('?')\n\
      , pathname = ~qsIndex ? path.slice(0, qsIndex) : path\n\
      , m = this.regexp.exec(pathname);\n\
\n\
    if (!m) return false;\n\
\n\
    for (var i = 1, len = m.length; i < len; ++i) {\n\
      var key = keys[i - 1];\n\
\n\
      var val = 'string' == typeof m[i]\n\
        ? decodeURIComponent(m[i])\n\
        : m[i];\n\
\n\
      if (key) {\n\
        params[key.name] = undefined !== params[key.name]\n\
          ? params[key.name]\n\
          : val;\n\
      } else {\n\
        params.push(val);\n\
      }\n\
    }\n\
\n\
    return true;\n\
  };\n\
\n\
  /**\n\
   * Normalize the given path string,\n\
   * returning a regular expression.\n\
   *\n\
   * An empty array should be passed,\n\
   * which will contain the placeholder\n\
   * key names. For example \"/user/:id\" will\n\
   * then contain [\"id\"].\n\
   *\n\
   * @param  {String|RegExp|Array} path\n\
   * @param  {Array} keys\n\
   * @param  {Boolean} sensitive\n\
   * @param  {Boolean} strict\n\
   * @return {RegExp}\n\
   * @api private\n\
   */\n\
\n\
  function pathtoRegexp(path, keys, sensitive, strict) {\n\
    if (path instanceof RegExp) return path;\n\
    if (path instanceof Array) path = '(' + path.join('|') + ')';\n\
    path = path\n\
      .concat(strict ? '' : '/?')\n\
      .replace(/\\/\\(/g, '(?:/')\n\
      .replace(/(\\/)?(\\.)?:(\\w+)(?:(\\(.*?\\)))?(\\?)?/g, function(_, slash, format, key, capture, optional){\n\
        keys.push({ name: key, optional: !! optional });\n\
        slash = slash || '';\n\
        return ''\n\
          + (optional ? '' : slash)\n\
          + '(?:'\n\
          + (optional ? slash : '')\n\
          + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'\n\
          + (optional || '');\n\
      })\n\
      .replace(/([\\/.])/g, '\\\\$1')\n\
      .replace(/\\*/g, '(.*)');\n\
    return new RegExp('^' + path + '$', sensitive ? '' : 'i');\n\
  }\n\
\n\
  /**\n\
   * Handle \"populate\" events.\n\
   */\n\
\n\
  function onpopstate(e) {\n\
    if (e.state) {\n\
      var path = e.state.path;\n\
      page.replace(path, e.state);\n\
    }\n\
  }\n\
\n\
  /**\n\
   * Handle \"click\" events.\n\
   */\n\
\n\
  function onclick(e) {\n\
    if (1 != which(e)) return;\n\
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;\n\
    if (e.defaultPrevented) return;\n\
\n\
    // ensure link\n\
    var el = e.target;\n\
    while (el && 'A' != el.nodeName) el = el.parentNode;\n\
    if (!el || 'A' != el.nodeName) return;\n\
\n\
    // ensure non-hash for the same path\n\
    var link = el.getAttribute('href');\n\
    if (el.pathname == location.pathname && (el.hash || '#' == link)) return;\n\
\n\
    // check target\n\
    if (el.target) return;\n\
\n\
    // x-origin\n\
    if (!sameOrigin(el.href)) return;\n\
\n\
    // rebuild path\n\
    var path = el.pathname + el.search + (el.hash || '');\n\
\n\
    // same page\n\
    var orig = path + el.hash;\n\
\n\
    path = path.replace(base, '');\n\
    if (base && orig == path) return;\n\
\n\
    e.preventDefault();\n\
    page.show(orig);\n\
  }\n\
\n\
  /**\n\
   * Event button.\n\
   */\n\
\n\
  function which(e) {\n\
    e = e || window.event;\n\
    return null == e.which\n\
      ? e.button\n\
      : e.which;\n\
  }\n\
\n\
  /**\n\
   * Check if `href` is the same origin.\n\
   */\n\
\n\
  function sameOrigin(href) {\n\
    var origin = location.protocol + '//' + location.hostname;\n\
    if (location.port) origin += ':' + location.port;\n\
    return 0 == href.indexOf(origin);\n\
  }\n\
\n\
  /**\n\
   * Expose `page`.\n\
   */\n\
\n\
  if ('undefined' == typeof module) {\n\
    window.page = page;\n\
  } else {\n\
    module.exports = page;\n\
  }\n\
\n\
})();\n\
//@ sourceURL=visionmedia-page.js/index.js"
));
require.register("visionmedia-node-querystring/index.js", Function("exports, require, module",
"/**\n\
 * Object#toString() ref for stringify().\n\
 */\n\
\n\
var toString = Object.prototype.toString;\n\
\n\
/**\n\
 * Object#hasOwnProperty ref\n\
 */\n\
\n\
var hasOwnProperty = Object.prototype.hasOwnProperty;\n\
\n\
/**\n\
 * see issue #70\n\
 */\n\
var isRestorableProto = (function () {\n\
  var o;\n\
\n\
  if (!Object.create) return false;\n\
\n\
  o = Object.create(null);\n\
  o.__proto__ = Object.prototype;\n\
\n\
  return o.hasOwnProperty === hasOwnProperty;\n\
})();\n\
\n\
/**\n\
 * Array#indexOf shim.\n\
 */\n\
\n\
var indexOf = typeof Array.prototype.indexOf === 'function'\n\
  ? function(arr, el) { return arr.indexOf(el); }\n\
  : function(arr, el) {\n\
      for (var i = 0; i < arr.length; i++) {\n\
        if (arr[i] === el) return i;\n\
      }\n\
      return -1;\n\
    };\n\
\n\
/**\n\
 * Array.isArray shim.\n\
 */\n\
\n\
var isArray = Array.isArray || function(arr) {\n\
  return toString.call(arr) == '[object Array]';\n\
};\n\
\n\
/**\n\
 * Object.keys shim.\n\
 */\n\
\n\
var objectKeys = Object.keys || function(obj) {\n\
  var ret = [];\n\
  for (var key in obj) {\n\
    if (obj.hasOwnProperty(key)) {\n\
      ret.push(key);\n\
    }\n\
  }\n\
  return ret;\n\
};\n\
\n\
/**\n\
 * Array#forEach shim.\n\
 */\n\
\n\
var forEach = typeof Array.prototype.forEach === 'function'\n\
  ? function(arr, fn) { return arr.forEach(fn); }\n\
  : function(arr, fn) {\n\
      for (var i = 0; i < arr.length; i++) fn(arr[i]);\n\
    };\n\
\n\
/**\n\
 * Array#reduce shim.\n\
 */\n\
\n\
var reduce = function(arr, fn, initial) {\n\
  if (typeof arr.reduce === 'function') return arr.reduce(fn, initial);\n\
  var res = initial;\n\
  for (var i = 0; i < arr.length; i++) res = fn(res, arr[i]);\n\
  return res;\n\
};\n\
\n\
/**\n\
 * Create a nullary object if possible\n\
 */\n\
\n\
function createObject() {\n\
  return isRestorableProto\n\
    ? Object.create(null)\n\
    : {};\n\
}\n\
\n\
/**\n\
 * Cache non-integer test regexp.\n\
 */\n\
\n\
var isint = /^[0-9]+$/;\n\
\n\
function promote(parent, key) {\n\
  if (parent[key].length == 0) return parent[key] = createObject();\n\
  var t = createObject();\n\
  for (var i in parent[key]) {\n\
    if (hasOwnProperty.call(parent[key], i)) {\n\
      t[i] = parent[key][i];\n\
    }\n\
  }\n\
  parent[key] = t;\n\
  return t;\n\
}\n\
\n\
function parse(parts, parent, key, val) {\n\
  var part = parts.shift();\n\
  // end\n\
  if (!part) {\n\
    if (isArray(parent[key])) {\n\
      parent[key].push(val);\n\
    } else if ('object' == typeof parent[key]) {\n\
      parent[key] = val;\n\
    } else if ('undefined' == typeof parent[key]) {\n\
      parent[key] = val;\n\
    } else {\n\
      parent[key] = [parent[key], val];\n\
    }\n\
    // array\n\
  } else {\n\
    var obj = parent[key] = parent[key] || [];\n\
    if (']' == part) {\n\
      if (isArray(obj)) {\n\
        if ('' != val) obj.push(val);\n\
      } else if ('object' == typeof obj) {\n\
        obj[objectKeys(obj).length] = val;\n\
      } else {\n\
        obj = parent[key] = [parent[key], val];\n\
      }\n\
      // prop\n\
    } else if (~indexOf(part, ']')) {\n\
      part = part.substr(0, part.length - 1);\n\
      if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);\n\
      parse(parts, obj, part, val);\n\
      // key\n\
    } else {\n\
      if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);\n\
      parse(parts, obj, part, val);\n\
    }\n\
  }\n\
}\n\
\n\
/**\n\
 * Merge parent key/val pair.\n\
 */\n\
\n\
function merge(parent, key, val){\n\
  if (~indexOf(key, ']')) {\n\
    var parts = key.split('[')\n\
      , len = parts.length\n\
      , last = len - 1;\n\
    parse(parts, parent, 'base', val);\n\
    // optimize\n\
  } else {\n\
    if (!isint.test(key) && isArray(parent.base)) {\n\
      var t = createObject();\n\
      for (var k in parent.base) t[k] = parent.base[k];\n\
      parent.base = t;\n\
    }\n\
    set(parent.base, key, val);\n\
  }\n\
\n\
  return parent;\n\
}\n\
\n\
/**\n\
 * Compact sparse arrays.\n\
 */\n\
\n\
function compact(obj) {\n\
  if ('object' != typeof obj) return obj;\n\
\n\
  if (isArray(obj)) {\n\
    var ret = [];\n\
\n\
    for (var i in obj) {\n\
      if (hasOwnProperty.call(obj, i)) {\n\
        ret.push(obj[i]);\n\
      }\n\
    }\n\
\n\
    return ret;\n\
  }\n\
\n\
  for (var key in obj) {\n\
    obj[key] = compact(obj[key]);\n\
  }\n\
\n\
  return obj;\n\
}\n\
\n\
/**\n\
 * Restore Object.prototype.\n\
 * see pull-request #58\n\
 */\n\
\n\
function restoreProto(obj) {\n\
  if (!isRestorableProto) return obj;\n\
  if (isArray(obj)) return obj;\n\
  if (obj && 'object' != typeof obj) return obj;\n\
\n\
  for (var key in obj) {\n\
    if (hasOwnProperty.call(obj, key)) {\n\
      obj[key] = restoreProto(obj[key]);\n\
    }\n\
  }\n\
\n\
  obj.__proto__ = Object.prototype;\n\
  return obj;\n\
}\n\
\n\
/**\n\
 * Parse the given obj.\n\
 */\n\
\n\
function parseObject(obj){\n\
  var ret = { base: {} };\n\
\n\
  forEach(objectKeys(obj), function(name){\n\
    merge(ret, name, obj[name]);\n\
  });\n\
\n\
  return compact(ret.base);\n\
}\n\
\n\
/**\n\
 * Parse the given str.\n\
 */\n\
\n\
function parseString(str){\n\
  var ret = reduce(String(str).split('&'), function(ret, pair){\n\
    var eql = indexOf(pair, '=')\n\
      , brace = lastBraceInKey(pair)\n\
      , key = pair.substr(0, brace || eql)\n\
      , val = pair.substr(brace || eql, pair.length)\n\
      , val = val.substr(indexOf(val, '=') + 1, val.length);\n\
\n\
    // ?foo\n\
    if ('' == key) key = pair, val = '';\n\
    if ('' == key) return ret;\n\
\n\
    return merge(ret, decode(key), decode(val));\n\
  }, { base: createObject() }).base;\n\
\n\
  return restoreProto(compact(ret));\n\
}\n\
\n\
/**\n\
 * Parse the given query `str` or `obj`, returning an object.\n\
 *\n\
 * @param {String} str | {Object} obj\n\
 * @return {Object}\n\
 * @api public\n\
 */\n\
\n\
exports.parse = function(str){\n\
  if (null == str || '' == str) return {};\n\
  return 'object' == typeof str\n\
    ? parseObject(str)\n\
    : parseString(str);\n\
};\n\
\n\
/**\n\
 * Turn the given `obj` into a query string\n\
 *\n\
 * @param {Object} obj\n\
 * @return {String}\n\
 * @api public\n\
 */\n\
\n\
var stringify = exports.stringify = function(obj, prefix) {\n\
  if (isArray(obj)) {\n\
    return stringifyArray(obj, prefix);\n\
  } else if ('[object Object]' == toString.call(obj)) {\n\
    return stringifyObject(obj, prefix);\n\
  } else if ('string' == typeof obj) {\n\
    return stringifyString(obj, prefix);\n\
  } else {\n\
    return prefix + '=' + encodeURIComponent(String(obj));\n\
  }\n\
};\n\
\n\
/**\n\
 * Stringify the given `str`.\n\
 *\n\
 * @param {String} str\n\
 * @param {String} prefix\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function stringifyString(str, prefix) {\n\
  if (!prefix) throw new TypeError('stringify expects an object');\n\
  return prefix + '=' + encodeURIComponent(str);\n\
}\n\
\n\
/**\n\
 * Stringify the given `arr`.\n\
 *\n\
 * @param {Array} arr\n\
 * @param {String} prefix\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function stringifyArray(arr, prefix) {\n\
  var ret = [];\n\
  if (!prefix) throw new TypeError('stringify expects an object');\n\
  for (var i = 0; i < arr.length; i++) {\n\
    ret.push(stringify(arr[i], prefix + '[' + i + ']'));\n\
  }\n\
  return ret.join('&');\n\
}\n\
\n\
/**\n\
 * Stringify the given `obj`.\n\
 *\n\
 * @param {Object} obj\n\
 * @param {String} prefix\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function stringifyObject(obj, prefix) {\n\
  var ret = []\n\
    , keys = objectKeys(obj)\n\
    , key;\n\
\n\
  for (var i = 0, len = keys.length; i < len; ++i) {\n\
    key = keys[i];\n\
    if ('' == key) continue;\n\
    if (null == obj[key]) {\n\
      ret.push(encodeURIComponent(key) + '=');\n\
    } else {\n\
      ret.push(stringify(obj[key], prefix\n\
        ? prefix + '[' + encodeURIComponent(key) + ']'\n\
        : encodeURIComponent(key)));\n\
    }\n\
  }\n\
\n\
  return ret.join('&');\n\
}\n\
\n\
/**\n\
 * Set `obj`'s `key` to `val` respecting\n\
 * the weird and wonderful syntax of a qs,\n\
 * where \"foo=bar&foo=baz\" becomes an array.\n\
 *\n\
 * @param {Object} obj\n\
 * @param {String} key\n\
 * @param {String} val\n\
 * @api private\n\
 */\n\
\n\
function set(obj, key, val) {\n\
  var v = obj[key];\n\
  if (undefined === v) {\n\
    obj[key] = val;\n\
  } else if (isArray(v)) {\n\
    v.push(val);\n\
  } else {\n\
    obj[key] = [v, val];\n\
  }\n\
}\n\
\n\
/**\n\
 * Locate last brace in `str` within the key.\n\
 *\n\
 * @param {String} str\n\
 * @return {Number}\n\
 * @api private\n\
 */\n\
\n\
function lastBraceInKey(str) {\n\
  var len = str.length\n\
    , brace\n\
    , c;\n\
  for (var i = 0; i < len; ++i) {\n\
    c = str[i];\n\
    if (']' == c) brace = false;\n\
    if ('[' == c) brace = true;\n\
    if ('=' == c && !brace) return i;\n\
  }\n\
}\n\
\n\
/**\n\
 * Decode `str`.\n\
 *\n\
 * @param {String} str\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function decode(str) {\n\
  try {\n\
    return decodeURIComponent(str.replace(/\\+/g, ' '));\n\
  } catch (err) {\n\
    return str;\n\
  }\n\
}\n\
//@ sourceURL=visionmedia-node-querystring/index.js"
));
require.register("lodash-lodash/index.js", Function("exports, require, module",
"module.exports = require('./dist/lodash.compat.js');//@ sourceURL=lodash-lodash/index.js"
));
require.register("lodash-lodash/dist/lodash.compat.js", Function("exports, require, module",
"/**\n\
 * @license\n\
 * Lo-Dash 2.2.1 (Custom Build) <http://lodash.com/>\n\
 * Build: `lodash -o ./dist/lodash.compat.js`\n\
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>\n\
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>\n\
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors\n\
 * Available under MIT license <http://lodash.com/license>\n\
 */\n\
;(function() {\n\
\n\
  /** Used as a safe reference for `undefined` in pre ES5 environments */\n\
  var undefined;\n\
\n\
  /** Used to pool arrays and objects used internally */\n\
  var arrayPool = [],\n\
      objectPool = [];\n\
\n\
  /** Used to generate unique IDs */\n\
  var idCounter = 0;\n\
\n\
  /** Used internally to indicate various things */\n\
  var indicatorObject = {};\n\
\n\
  /** Used to prefix keys to avoid issues with `__proto__` and properties on `Object.prototype` */\n\
  var keyPrefix = +new Date + '';\n\
\n\
  /** Used as the size when optimizations are enabled for large arrays */\n\
  var largeArraySize = 75;\n\
\n\
  /** Used as the max size of the `arrayPool` and `objectPool` */\n\
  var maxPoolSize = 40;\n\
\n\
  /** Used to detect and test whitespace */\n\
  var whitespace = (\n\
    // whitespace\n\
    ' \\t\\x0B\\f\\xA0\\ufeff' +\n\
\n\
    // line terminators\n\
    '\\n\
\\r\\u2028\\u2029' +\n\
\n\
    // unicode category \"Zs\" space separators\n\
    '\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000'\n\
  );\n\
\n\
  /** Used to match empty string literals in compiled template source */\n\
  var reEmptyStringLeading = /\\b__p \\+= '';/g,\n\
      reEmptyStringMiddle = /\\b(__p \\+=) '' \\+/g,\n\
      reEmptyStringTrailing = /(__e\\(.*?\\)|\\b__t\\)) \\+\\n\
'';/g;\n\
\n\
  /**\n\
   * Used to match ES6 template delimiters\n\
   * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-7.8.6\n\
   */\n\
  var reEsTemplate = /\\$\\{([^\\\\}]*(?:\\\\.[^\\\\}]*)*)\\}/g;\n\
\n\
  /** Used to match regexp flags from their coerced string values */\n\
  var reFlags = /\\w*$/;\n\
\n\
  /** Used to detected named functions */\n\
  var reFuncName = /^function[ \\n\
\\r\\t]+\\w/;\n\
\n\
  /** Used to match \"interpolate\" template delimiters */\n\
  var reInterpolate = /<%=([\\s\\S]+?)%>/g;\n\
\n\
  /** Used to match leading whitespace and zeros to be removed */\n\
  var reLeadingSpacesAndZeros = RegExp('^[' + whitespace + ']*0+(?=.$)');\n\
\n\
  /** Used to ensure capturing order of template delimiters */\n\
  var reNoMatch = /($^)/;\n\
\n\
  /** Used to detect functions containing a `this` reference */\n\
  var reThis = /\\bthis\\b/;\n\
\n\
  /** Used to match unescaped characters in compiled string literals */\n\
  var reUnescapedString = /['\\n\
\\r\\t\\u2028\\u2029\\\\]/g;\n\
\n\
  /** Used to assign default `context` object properties */\n\
  var contextProps = [\n\
    'Array', 'Boolean', 'Date', 'Error', 'Function', 'Math', 'Number', 'Object',\n\
    'RegExp', 'String', '_', 'attachEvent', 'clearTimeout', 'isFinite', 'isNaN',\n\
    'parseInt', 'setImmediate', 'setTimeout'\n\
  ];\n\
\n\
  /** Used to fix the JScript [[DontEnum]] bug */\n\
  var shadowedProps = [\n\
    'constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable',\n\
    'toLocaleString', 'toString', 'valueOf'\n\
  ];\n\
\n\
  /** Used to make template sourceURLs easier to identify */\n\
  var templateCounter = 0;\n\
\n\
  /** `Object#toString` result shortcuts */\n\
  var argsClass = '[object Arguments]',\n\
      arrayClass = '[object Array]',\n\
      boolClass = '[object Boolean]',\n\
      dateClass = '[object Date]',\n\
      errorClass = '[object Error]',\n\
      funcClass = '[object Function]',\n\
      numberClass = '[object Number]',\n\
      objectClass = '[object Object]',\n\
      regexpClass = '[object RegExp]',\n\
      stringClass = '[object String]';\n\
\n\
  /** Used to identify object classifications that `_.clone` supports */\n\
  var cloneableClasses = {};\n\
  cloneableClasses[funcClass] = false;\n\
  cloneableClasses[argsClass] = cloneableClasses[arrayClass] =\n\
  cloneableClasses[boolClass] = cloneableClasses[dateClass] =\n\
  cloneableClasses[numberClass] = cloneableClasses[objectClass] =\n\
  cloneableClasses[regexpClass] = cloneableClasses[stringClass] = true;\n\
\n\
  /** Used as an internal `_.debounce` options object */\n\
  var debounceOptions = {\n\
    'leading': false,\n\
    'maxWait': 0,\n\
    'trailing': false\n\
  };\n\
\n\
  /** Used as the property descriptor for `__bindData__` */\n\
  var descriptor = {\n\
    'configurable': false,\n\
    'enumerable': false,\n\
    'value': null,\n\
    'writable': false\n\
  };\n\
\n\
  /** Used as the data object for `iteratorTemplate` */\n\
  var iteratorData = {\n\
    'args': '',\n\
    'array': null,\n\
    'bottom': '',\n\
    'firstArg': '',\n\
    'init': '',\n\
    'keys': null,\n\
    'loop': '',\n\
    'shadowedProps': null,\n\
    'support': null,\n\
    'top': '',\n\
    'useHas': false\n\
  };\n\
\n\
  /** Used to determine if values are of the language type Object */\n\
  var objectTypes = {\n\
    'boolean': false,\n\
    'function': true,\n\
    'object': true,\n\
    'number': false,\n\
    'string': false,\n\
    'undefined': false\n\
  };\n\
\n\
  /** Used to escape characters for inclusion in compiled string literals */\n\
  var stringEscapes = {\n\
    '\\\\': '\\\\',\n\
    \"'\": \"'\",\n\
    '\\n\
': 'n',\n\
    '\\r': 'r',\n\
    '\\t': 't',\n\
    '\\u2028': 'u2028',\n\
    '\\u2029': 'u2029'\n\
  };\n\
\n\
  /** Used as a reference to the global object */\n\
  var root = (objectTypes[typeof window] && window) || this;\n\
\n\
  /** Detect free variable `exports` */\n\
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;\n\
\n\
  /** Detect free variable `module` */\n\
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;\n\
\n\
  /** Detect the popular CommonJS extension `module.exports` */\n\
  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;\n\
\n\
  /** Detect free variable `global` from Node.js or Browserified code and use it as `root` */\n\
  var freeGlobal = objectTypes[typeof global] && global;\n\
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {\n\
    root = freeGlobal;\n\
  }\n\
\n\
  /*--------------------------------------------------------------------------*/\n\
\n\
  /**\n\
   * The base implementation of `_.indexOf` without support for binary searches\n\
   * or `fromIndex` constraints.\n\
   *\n\
   * @private\n\
   * @param {Array} array The array to search.\n\
   * @param {*} value The value to search for.\n\
   * @param {number} [fromIndex=0] The index to search from.\n\
   * @returns {number} Returns the index of the matched value or `-1`.\n\
   */\n\
  function baseIndexOf(array, value, fromIndex) {\n\
    var index = (fromIndex || 0) - 1,\n\
        length = array ? array.length : 0;\n\
\n\
    while (++index < length) {\n\
      if (array[index] === value) {\n\
        return index;\n\
      }\n\
    }\n\
    return -1;\n\
  }\n\
\n\
  /**\n\
   * An implementation of `_.contains` for cache objects that mimics the return\n\
   * signature of `_.indexOf` by returning `0` if the value is found, else `-1`.\n\
   *\n\
   * @private\n\
   * @param {Object} cache The cache object to inspect.\n\
   * @param {*} value The value to search for.\n\
   * @returns {number} Returns `0` if `value` is found, else `-1`.\n\
   */\n\
  function cacheIndexOf(cache, value) {\n\
    var type = typeof value;\n\
    cache = cache.cache;\n\
\n\
    if (type == 'boolean' || value == null) {\n\
      return cache[value] ? 0 : -1;\n\
    }\n\
    if (type != 'number' && type != 'string') {\n\
      type = 'object';\n\
    }\n\
    var key = type == 'number' ? value : keyPrefix + value;\n\
    cache = (cache = cache[type]) && cache[key];\n\
\n\
    return type == 'object'\n\
      ? (cache && baseIndexOf(cache, value) > -1 ? 0 : -1)\n\
      : (cache ? 0 : -1);\n\
  }\n\
\n\
  /**\n\
   * Adds a given value to the corresponding cache object.\n\
   *\n\
   * @private\n\
   * @param {*} value The value to add to the cache.\n\
   */\n\
  function cachePush(value) {\n\
    var cache = this.cache,\n\
        type = typeof value;\n\
\n\
    if (type == 'boolean' || value == null) {\n\
      cache[value] = true;\n\
    } else {\n\
      if (type != 'number' && type != 'string') {\n\
        type = 'object';\n\
      }\n\
      var key = type == 'number' ? value : keyPrefix + value,\n\
          typeCache = cache[type] || (cache[type] = {});\n\
\n\
      if (type == 'object') {\n\
        (typeCache[key] || (typeCache[key] = [])).push(value);\n\
      } else {\n\
        typeCache[key] = true;\n\
      }\n\
    }\n\
  }\n\
\n\
  /**\n\
   * Used by `_.max` and `_.min` as the default callback when a given\n\
   * collection is a string value.\n\
   *\n\
   * @private\n\
   * @param {string} value The character to inspect.\n\
   * @returns {number} Returns the code unit of given character.\n\
   */\n\
  function charAtCallback(value) {\n\
    return value.charCodeAt(0);\n\
  }\n\
\n\
  /**\n\
   * Used by `sortBy` to compare transformed `collection` elements, stable sorting\n\
   * them in ascending order.\n\
   *\n\
   * @private\n\
   * @param {Object} a The object to compare to `b`.\n\
   * @param {Object} b The object to compare to `a`.\n\
   * @returns {number} Returns the sort order indicator of `1` or `-1`.\n\
   */\n\
  function compareAscending(a, b) {\n\
    var ac = a.criteria,\n\
        bc = b.criteria;\n\
\n\
    // ensure a stable sort in V8 and other engines\n\
    // http://code.google.com/p/v8/issues/detail?id=90\n\
    if (ac !== bc) {\n\
      if (ac > bc || typeof ac == 'undefined') {\n\
        return 1;\n\
      }\n\
      if (ac < bc || typeof bc == 'undefined') {\n\
        return -1;\n\
      }\n\
    }\n\
    // The JS engine embedded in Adobe applications like InDesign has a buggy\n\
    // `Array#sort` implementation that causes it, under certain circumstances,\n\
    // to return the same value for `a` and `b`.\n\
    // See https://github.com/jashkenas/underscore/pull/1247\n\
    return a.index - b.index;\n\
  }\n\
\n\
  /**\n\
   * Creates a cache object to optimize linear searches of large arrays.\n\
   *\n\
   * @private\n\
   * @param {Array} [array=[]] The array to search.\n\
   * @returns {null|Object} Returns the cache object or `null` if caching should not be used.\n\
   */\n\
  function createCache(array) {\n\
    var index = -1,\n\
        length = array.length,\n\
        first = array[0],\n\
        mid = array[(length / 2) | 0],\n\
        last = array[length - 1];\n\
\n\
    if (first && typeof first == 'object' &&\n\
        mid && typeof mid == 'object' && last && typeof last == 'object') {\n\
      return false;\n\
    }\n\
    var cache = getObject();\n\
    cache['false'] = cache['null'] = cache['true'] = cache['undefined'] = false;\n\
\n\
    var result = getObject();\n\
    result.array = array;\n\
    result.cache = cache;\n\
    result.push = cachePush;\n\
\n\
    while (++index < length) {\n\
      result.push(array[index]);\n\
    }\n\
    return result;\n\
  }\n\
\n\
  /**\n\
   * Used by `template` to escape characters for inclusion in compiled\n\
   * string literals.\n\
   *\n\
   * @private\n\
   * @param {string} match The matched character to escape.\n\
   * @returns {string} Returns the escaped character.\n\
   */\n\
  function escapeStringChar(match) {\n\
    return '\\\\' + stringEscapes[match];\n\
  }\n\
\n\
  /**\n\
   * Gets an array from the array pool or creates a new one if the pool is empty.\n\
   *\n\
   * @private\n\
   * @returns {Array} The array from the pool.\n\
   */\n\
  function getArray() {\n\
    return arrayPool.pop() || [];\n\
  }\n\
\n\
  /**\n\
   * Gets an object from the object pool or creates a new one if the pool is empty.\n\
   *\n\
   * @private\n\
   * @returns {Object} The object from the pool.\n\
   */\n\
  function getObject() {\n\
    return objectPool.pop() || {\n\
      'array': null,\n\
      'cache': null,\n\
      'criteria': null,\n\
      'false': false,\n\
      'index': 0,\n\
      'null': false,\n\
      'number': null,\n\
      'object': null,\n\
      'push': null,\n\
      'string': null,\n\
      'true': false,\n\
      'undefined': false,\n\
      'value': null\n\
    };\n\
  }\n\
\n\
  /**\n\
   * Checks if `value` is a DOM node in IE < 9.\n\
   *\n\
   * @private\n\
   * @param {*} value The value to check.\n\
   * @returns {boolean} Returns `true` if the `value` is a DOM node, else `false`.\n\
   */\n\
  function isNode(value) {\n\
    // IE < 9 presents DOM nodes as `Object` objects except they have `toString`\n\
    // methods that are `typeof` \"string\" and still can coerce nodes to strings\n\
    return typeof value.toString != 'function' && typeof (value + '') == 'string';\n\
  }\n\
\n\
  /**\n\
   * A no-operation function.\n\
   *\n\
   * @private\n\
   */\n\
  function noop() {\n\
    // no operation performed\n\
  }\n\
\n\
  /**\n\
   * Releases the given array back to the array pool.\n\
   *\n\
   * @private\n\
   * @param {Array} [array] The array to release.\n\
   */\n\
  function releaseArray(array) {\n\
    array.length = 0;\n\
    if (arrayPool.length < maxPoolSize) {\n\
      arrayPool.push(array);\n\
    }\n\
  }\n\
\n\
  /**\n\
   * Releases the given object back to the object pool.\n\
   *\n\
   * @private\n\
   * @param {Object} [object] The object to release.\n\
   */\n\
  function releaseObject(object) {\n\
    var cache = object.cache;\n\
    if (cache) {\n\
      releaseObject(cache);\n\
    }\n\
    object.array = object.cache = object.criteria = object.object = object.number = object.string = object.value = null;\n\
    if (objectPool.length < maxPoolSize) {\n\
      objectPool.push(object);\n\
    }\n\
  }\n\
\n\
  /**\n\
   * Slices the `collection` from the `start` index up to, but not including,\n\
   * the `end` index.\n\
   *\n\
   * Note: This function is used instead of `Array#slice` to support node lists\n\
   * in IE < 9 and to ensure dense arrays are returned.\n\
   *\n\
   * @private\n\
   * @param {Array|Object|string} collection The collection to slice.\n\
   * @param {number} start The start index.\n\
   * @param {number} end The end index.\n\
   * @returns {Array} Returns the new array.\n\
   */\n\
  function slice(array, start, end) {\n\
    start || (start = 0);\n\
    if (typeof end == 'undefined') {\n\
      end = array ? array.length : 0;\n\
    }\n\
    var index = -1,\n\
        length = end - start || 0,\n\
        result = Array(length < 0 ? 0 : length);\n\
\n\
    while (++index < length) {\n\
      result[index] = array[start + index];\n\
    }\n\
    return result;\n\
  }\n\
\n\
  /*--------------------------------------------------------------------------*/\n\
\n\
  /**\n\
   * Create a new `lodash` function using the given context object.\n\
   *\n\
   * @static\n\
   * @memberOf _\n\
   * @category Utilities\n\
   * @param {Object} [context=root] The context object.\n\
   * @returns {Function} Returns the `lodash` function.\n\
   */\n\
  function runInContext(context) {\n\
    // Avoid issues with some ES3 environments that attempt to use values, named\n\
    // after built-in constructors like `Object`, for the creation of literals.\n\
    // ES5 clears this up by stating that literals must use built-in constructors.\n\
    // See http://es5.github.io/#x11.1.5.\n\
    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;\n\
\n\
    /** Native constructor references */\n\
    var Array = context.Array,\n\
        Boolean = context.Boolean,\n\
        Date = context.Date,\n\
        Error = context.Error,\n\
        Function = context.Function,\n\
        Math = context.Math,\n\
        Number = context.Number,\n\
        Object = context.Object,\n\
        RegExp = context.RegExp,\n\
        String = context.String,\n\
        TypeError = context.TypeError;\n\
\n\
    /**\n\
     * Used for `Array` method references.\n\
     *\n\
     * Normally `Array.prototype` would suffice, however, using an array literal\n\
     * avoids issues in Narwhal.\n\
     */\n\
    var arrayRef = [];\n\
\n\
    /** Used for native method references */\n\
    var errorProto = Error.prototype,\n\
        objectProto = Object.prototype,\n\
        stringProto = String.prototype;\n\
\n\
    /** Used to restore the original `_` reference in `noConflict` */\n\
    var oldDash = context._;\n\
\n\
    /** Used to detect if a method is native */\n\
    var reNative = RegExp('^' +\n\
      String(objectProto.valueOf)\n\
        .replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')\n\
        .replace(/valueOf|for [^\\]]+/g, '.+?') + '$'\n\
    );\n\
\n\
    /** Native method shortcuts */\n\
    var ceil = Math.ceil,\n\
        clearTimeout = context.clearTimeout,\n\
        floor = Math.floor,\n\
        fnToString = Function.prototype.toString,\n\
        getPrototypeOf = reNative.test(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,\n\
        hasOwnProperty = objectProto.hasOwnProperty,\n\
        now = reNative.test(now = Date.now) && now || function() { return +new Date; },\n\
        push = arrayRef.push,\n\
        propertyIsEnumerable = objectProto.propertyIsEnumerable,\n\
        setImmediate = context.setImmediate,\n\
        setTimeout = context.setTimeout,\n\
        splice = arrayRef.splice,\n\
        toString = objectProto.toString,\n\
        unshift = arrayRef.unshift;\n\
\n\
    var defineProperty = (function() {\n\
      try {\n\
        var o = {},\n\
            func = reNative.test(func = Object.defineProperty) && func,\n\
            result = func(o, o, o) && func;\n\
      } catch(e) { }\n\
      return result;\n\
    }());\n\
\n\
    /* Native method shortcuts for methods with the same name as other `lodash` methods */\n\
    var nativeBind = reNative.test(nativeBind = toString.bind) && nativeBind,\n\
        nativeCreate = reNative.test(nativeCreate = Object.create) && nativeCreate,\n\
        nativeIsArray = reNative.test(nativeIsArray = Array.isArray) && nativeIsArray,\n\
        nativeIsFinite = context.isFinite,\n\
        nativeIsNaN = context.isNaN,\n\
        nativeKeys = reNative.test(nativeKeys = Object.keys) && nativeKeys,\n\
        nativeMax = Math.max,\n\
        nativeMin = Math.min,\n\
        nativeParseInt = context.parseInt,\n\
        nativeRandom = Math.random;\n\
\n\
    /** Detect various environments */\n\
    var isIeOpera = reNative.test(context.attachEvent),\n\
        isV8 = nativeBind && !/\\n\
|true/.test(nativeBind + isIeOpera);\n\
\n\
    /** Used to lookup a built-in constructor by [[Class]] */\n\
    var ctorByClass = {};\n\
    ctorByClass[arrayClass] = Array;\n\
    ctorByClass[boolClass] = Boolean;\n\
    ctorByClass[dateClass] = Date;\n\
    ctorByClass[funcClass] = Function;\n\
    ctorByClass[objectClass] = Object;\n\
    ctorByClass[numberClass] = Number;\n\
    ctorByClass[regexpClass] = RegExp;\n\
    ctorByClass[stringClass] = String;\n\
\n\
    /** Used to avoid iterating non-enumerable properties in IE < 9 */\n\
    var nonEnumProps = {};\n\
    nonEnumProps[arrayClass] = nonEnumProps[dateClass] = nonEnumProps[numberClass] = { 'constructor': true, 'toLocaleString': true, 'toString': true, 'valueOf': true };\n\
    nonEnumProps[boolClass] = nonEnumProps[stringClass] = { 'constructor': true, 'toString': true, 'valueOf': true };\n\
    nonEnumProps[errorClass] = nonEnumProps[funcClass] = nonEnumProps[regexpClass] = { 'constructor': true, 'toString': true };\n\
    nonEnumProps[objectClass] = { 'constructor': true };\n\
\n\
    (function() {\n\
      var length = shadowedProps.length;\n\
      while (length--) {\n\
        var prop = shadowedProps[length];\n\
        for (var className in nonEnumProps) {\n\
          if (hasOwnProperty.call(nonEnumProps, className) && !hasOwnProperty.call(nonEnumProps[className], prop)) {\n\
            nonEnumProps[className][prop] = false;\n\
          }\n\
        }\n\
      }\n\
    }());\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Creates a `lodash` object which wraps the given value to enable intuitive\n\
     * method chaining.\n\
     *\n\
     * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:\n\
     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,\n\
     * and `unshift`\n\
     *\n\
     * Chaining is supported in custom builds as long as the `value` method is\n\
     * implicitly or explicitly included in the build.\n\
     *\n\
     * The chainable wrapper functions are:\n\
     * `after`, `assign`, `bind`, `bindAll`, `bindKey`, `chain`, `compact`,\n\
     * `compose`, `concat`, `countBy`, `create`, `createCallback`, `curry`,\n\
     * `debounce`, `defaults`, `defer`, `delay`, `difference`, `filter`, `flatten`,\n\
     * `forEach`, `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`,\n\
     * `functions`, `groupBy`, `indexBy`, `initial`, `intersection`, `invert`,\n\
     * `invoke`, `keys`, `map`, `max`, `memoize`, `merge`, `min`, `object`, `omit`,\n\
     * `once`, `pairs`, `partial`, `partialRight`, `pick`, `pluck`, `pull`, `push`,\n\
     * `range`, `reject`, `remove`, `rest`, `reverse`, `shuffle`, `slice`, `sort`,\n\
     * `sortBy`, `splice`, `tap`, `throttle`, `times`, `toArray`, `transform`,\n\
     * `union`, `uniq`, `unshift`, `unzip`, `values`, `where`, `without`, `wrap`,\n\
     * and `zip`\n\
     *\n\
     * The non-chainable wrapper functions are:\n\
     * `clone`, `cloneDeep`, `contains`, `escape`, `every`, `find`, `findIndex`,\n\
     * `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `has`, `identity`,\n\
     * `indexOf`, `isArguments`, `isArray`, `isBoolean`, `isDate`, `isElement`,\n\
     * `isEmpty`, `isEqual`, `isFinite`, `isFunction`, `isNaN`, `isNull`, `isNumber`,\n\
     * `isObject`, `isPlainObject`, `isRegExp`, `isString`, `isUndefined`, `join`,\n\
     * `lastIndexOf`, `mixin`, `noConflict`, `parseInt`, `pop`, `random`, `reduce`,\n\
     * `reduceRight`, `result`, `shift`, `size`, `some`, `sortedIndex`, `runInContext`,\n\
     * `template`, `unescape`, `uniqueId`, and `value`\n\
     *\n\
     * The wrapper functions `first` and `last` return wrapped values when `n` is\n\
     * provided, otherwise they return unwrapped values.\n\
     *\n\
     * Explicit chaining can be enabled by using the `_.chain` method.\n\
     *\n\
     * @name _\n\
     * @constructor\n\
     * @category Chaining\n\
     * @param {*} value The value to wrap in a `lodash` instance.\n\
     * @returns {Object} Returns a `lodash` instance.\n\
     * @example\n\
     *\n\
     * var wrapped = _([1, 2, 3]);\n\
     *\n\
     * // returns an unwrapped value\n\
     * wrapped.reduce(function(sum, num) {\n\
     *   return sum + num;\n\
     * });\n\
     * // => 6\n\
     *\n\
     * // returns a wrapped value\n\
     * var squares = wrapped.map(function(num) {\n\
     *   return num * num;\n\
     * });\n\
     *\n\
     * _.isArray(squares);\n\
     * // => false\n\
     *\n\
     * _.isArray(squares.value());\n\
     * // => true\n\
     */\n\
    function lodash(value) {\n\
      // don't wrap if already wrapped, even if wrapped by a different `lodash` constructor\n\
      return (value && typeof value == 'object' && !isArray(value) && hasOwnProperty.call(value, '__wrapped__'))\n\
       ? value\n\
       : new lodashWrapper(value);\n\
    }\n\
\n\
    /**\n\
     * A fast path for creating `lodash` wrapper objects.\n\
     *\n\
     * @private\n\
     * @param {*} value The value to wrap in a `lodash` instance.\n\
     * @param {boolean} chainAll A flag to enable chaining for all methods\n\
     * @returns {Object} Returns a `lodash` instance.\n\
     */\n\
    function lodashWrapper(value, chainAll) {\n\
      this.__chain__ = !!chainAll;\n\
      this.__wrapped__ = value;\n\
    }\n\
    // ensure `new lodashWrapper` is an instance of `lodash`\n\
    lodashWrapper.prototype = lodash.prototype;\n\
\n\
    /**\n\
     * An object used to flag environments features.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Object\n\
     */\n\
    var support = lodash.support = {};\n\
\n\
    (function() {\n\
      var ctor = function() { this.x = 1; },\n\
          object = { '0': 1, 'length': 1 },\n\
          props = [];\n\
\n\
      ctor.prototype = { 'valueOf': 1, 'y': 1 };\n\
      for (var prop in new ctor) { props.push(prop); }\n\
      for (prop in arguments) { }\n\
\n\
      /**\n\
       * Detect if an `arguments` object's [[Class]] is resolvable (all but Firefox < 4, IE < 9).\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.argsClass = toString.call(arguments) == argsClass;\n\
\n\
      /**\n\
       * Detect if `arguments` objects are `Object` objects (all but Narwhal and Opera < 10.5).\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.argsObject = arguments.constructor == Object && !(arguments instanceof Array);\n\
\n\
      /**\n\
       * Detect if `name` or `message` properties of `Error.prototype` are\n\
       * enumerable by default. (IE < 9, Safari < 5.1)\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.enumErrorProps = propertyIsEnumerable.call(errorProto, 'message') || propertyIsEnumerable.call(errorProto, 'name');\n\
\n\
      /**\n\
       * Detect if `prototype` properties are enumerable by default.\n\
       *\n\
       * Firefox < 3.6, Opera > 9.50 - Opera < 11.60, and Safari < 5.1\n\
       * (if the prototype or a property on the prototype has been set)\n\
       * incorrectly sets a function's `prototype` property [[Enumerable]]\n\
       * value to `true`.\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.enumPrototypes = propertyIsEnumerable.call(ctor, 'prototype');\n\
\n\
      /**\n\
       * Detect if `Function#bind` exists and is inferred to be fast (all but V8).\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.fastBind = nativeBind && !isV8;\n\
\n\
      /**\n\
       * Detect if functions can be decompiled by `Function#toString`\n\
       * (all but PS3 and older Opera mobile browsers & avoided in Windows 8 apps).\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.funcDecomp = !reNative.test(context.WinRTError) && reThis.test(runInContext);\n\
\n\
      /**\n\
       * Detect if `Function#name` is supported (all but IE).\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.funcNames = typeof Function.name == 'string';\n\
\n\
      /**\n\
       * Detect if `arguments` object indexes are non-enumerable\n\
       * (Firefox < 4, IE < 9, PhantomJS, Safari < 5.1).\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.nonEnumArgs = prop != 0;\n\
\n\
      /**\n\
       * Detect if properties shadowing those on `Object.prototype` are non-enumerable.\n\
       *\n\
       * In IE < 9 an objects own properties, shadowing non-enumerable ones, are\n\
       * made non-enumerable as well (a.k.a the JScript [[DontEnum]] bug).\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.nonEnumShadows = !/valueOf/.test(props);\n\
\n\
      /**\n\
       * Detect if own properties are iterated after inherited properties (all but IE < 9).\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.ownLast = props[0] != 'x';\n\
\n\
      /**\n\
       * Detect if `Array#shift` and `Array#splice` augment array-like objects correctly.\n\
       *\n\
       * Firefox < 10, IE compatibility mode, and IE < 9 have buggy Array `shift()`\n\
       * and `splice()` functions that fail to remove the last element, `value[0]`,\n\
       * of array-like objects even though the `length` property is set to `0`.\n\
       * The `shift()` method is buggy in IE 8 compatibility mode, while `splice()`\n\
       * is buggy regardless of mode in IE < 9 and buggy in compatibility mode in IE 9.\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.spliceObjects = (arrayRef.splice.call(object, 0, 1), !object[0]);\n\
\n\
      /**\n\
       * Detect lack of support for accessing string characters by index.\n\
       *\n\
       * IE < 8 can't access characters by index and IE 8 can only access\n\
       * characters by index on string literals.\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.unindexedChars = ('x'[0] + Object('x')[0]) != 'xx';\n\
\n\
      /**\n\
       * Detect if a DOM node's [[Class]] is resolvable (all but IE < 9)\n\
       * and that the JS engine errors when attempting to coerce an object to\n\
       * a string without a `toString` function.\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      try {\n\
        support.nodeClass = !(toString.call(document) == objectClass && !({ 'toString': 0 } + ''));\n\
      } catch(e) {\n\
        support.nodeClass = true;\n\
      }\n\
    }(1));\n\
\n\
    /**\n\
     * By default, the template delimiters used by Lo-Dash are similar to those in\n\
     * embedded Ruby (ERB). Change the following template settings to use alternative\n\
     * delimiters.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Object\n\
     */\n\
    lodash.templateSettings = {\n\
\n\
      /**\n\
       * Used to detect `data` property values to be HTML-escaped.\n\
       *\n\
       * @memberOf _.templateSettings\n\
       * @type RegExp\n\
       */\n\
      'escape': /<%-([\\s\\S]+?)%>/g,\n\
\n\
      /**\n\
       * Used to detect code to be evaluated.\n\
       *\n\
       * @memberOf _.templateSettings\n\
       * @type RegExp\n\
       */\n\
      'evaluate': /<%([\\s\\S]+?)%>/g,\n\
\n\
      /**\n\
       * Used to detect `data` property values to inject.\n\
       *\n\
       * @memberOf _.templateSettings\n\
       * @type RegExp\n\
       */\n\
      'interpolate': reInterpolate,\n\
\n\
      /**\n\
       * Used to reference the data object in the template text.\n\
       *\n\
       * @memberOf _.templateSettings\n\
       * @type string\n\
       */\n\
      'variable': '',\n\
\n\
      /**\n\
       * Used to import variables into the compiled template.\n\
       *\n\
       * @memberOf _.templateSettings\n\
       * @type Object\n\
       */\n\
      'imports': {\n\
\n\
        /**\n\
         * A reference to the `lodash` function.\n\
         *\n\
         * @memberOf _.templateSettings.imports\n\
         * @type Function\n\
         */\n\
        '_': lodash\n\
      }\n\
    };\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * The template used to create iterator functions.\n\
     *\n\
     * @private\n\
     * @param {Object} data The data object used to populate the text.\n\
     * @returns {string} Returns the interpolated text.\n\
     */\n\
    var iteratorTemplate = function(obj) {\n\
\n\
      var __p = 'var index, iterable = ' +\n\
      (obj.firstArg) +\n\
      ', result = ' +\n\
      (obj.init) +\n\
      ';\\n\
if (!iterable) return result;\\n\
' +\n\
      (obj.top) +\n\
      ';';\n\
       if (obj.array) {\n\
      __p += '\\n\
var length = iterable.length; index = -1;\\n\
if (' +\n\
      (obj.array) +\n\
      ') {  ';\n\
       if (support.unindexedChars) {\n\
      __p += '\\n\
  if (isString(iterable)) {\\n\
    iterable = iterable.split(\\'\\')\\n\
  }  ';\n\
       }\n\
      __p += '\\n\
  while (++index < length) {\\n\
    ' +\n\
      (obj.loop) +\n\
      ';\\n\
  }\\n\
}\\n\
else {  ';\n\
       } else if (support.nonEnumArgs) {\n\
      __p += '\\n\
  var length = iterable.length; index = -1;\\n\
  if (length && isArguments(iterable)) {\\n\
    while (++index < length) {\\n\
      index += \\'\\';\\n\
      ' +\n\
      (obj.loop) +\n\
      ';\\n\
    }\\n\
  } else {  ';\n\
       }\n\
\n\
       if (support.enumPrototypes) {\n\
      __p += '\\n\
  var skipProto = typeof iterable == \\'function\\';\\n\
  ';\n\
       }\n\
\n\
       if (support.enumErrorProps) {\n\
      __p += '\\n\
  var skipErrorProps = iterable === errorProto || iterable instanceof Error;\\n\
  ';\n\
       }\n\
\n\
          var conditions = [];    if (support.enumPrototypes) { conditions.push('!(skipProto && index == \"prototype\")'); }    if (support.enumErrorProps)  { conditions.push('!(skipErrorProps && (index == \"message\" || index == \"name\"))'); }\n\
\n\
       if (obj.useHas && obj.keys) {\n\
      __p += '\\n\
  var ownIndex = -1,\\n\
      ownProps = objectTypes[typeof iterable] && keys(iterable),\\n\
      length = ownProps ? ownProps.length : 0;\\n\
\\n\
  while (++ownIndex < length) {\\n\
    index = ownProps[ownIndex];\\n\
';\n\
          if (conditions.length) {\n\
      __p += '    if (' +\n\
      (conditions.join(' && ')) +\n\
      ') {\\n\
  ';\n\
       }\n\
      __p +=\n\
      (obj.loop) +\n\
      ';    ';\n\
       if (conditions.length) {\n\
      __p += '\\n\
    }';\n\
       }\n\
      __p += '\\n\
  }  ';\n\
       } else {\n\
      __p += '\\n\
  for (index in iterable) {\\n\
';\n\
          if (obj.useHas) { conditions.push(\"hasOwnProperty.call(iterable, index)\"); }    if (conditions.length) {\n\
      __p += '    if (' +\n\
      (conditions.join(' && ')) +\n\
      ') {\\n\
  ';\n\
       }\n\
      __p +=\n\
      (obj.loop) +\n\
      ';    ';\n\
       if (conditions.length) {\n\
      __p += '\\n\
    }';\n\
       }\n\
      __p += '\\n\
  }    ';\n\
       if (support.nonEnumShadows) {\n\
      __p += '\\n\
\\n\
  if (iterable !== objectProto) {\\n\
    var ctor = iterable.constructor,\\n\
        isProto = iterable === (ctor && ctor.prototype),\\n\
        className = iterable === stringProto ? stringClass : iterable === errorProto ? errorClass : toString.call(iterable),\\n\
        nonEnum = nonEnumProps[className];\\n\
      ';\n\
       for (k = 0; k < 7; k++) {\n\
      __p += '\\n\
    index = \\'' +\n\
      (obj.shadowedProps[k]) +\n\
      '\\';\\n\
    if ((!(isProto && nonEnum[index]) && hasOwnProperty.call(iterable, index))';\n\
              if (!obj.useHas) {\n\
      __p += ' || (!nonEnum[index] && iterable[index] !== objectProto[index])';\n\
       }\n\
      __p += ') {\\n\
      ' +\n\
      (obj.loop) +\n\
      ';\\n\
    }      ';\n\
       }\n\
      __p += '\\n\
  }    ';\n\
       }\n\
\n\
       }\n\
\n\
       if (obj.array || support.nonEnumArgs) {\n\
      __p += '\\n\
}';\n\
       }\n\
      __p +=\n\
      (obj.bottom) +\n\
      ';\\n\
return result';\n\
\n\
      return __p\n\
    };\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * The base implementation of `_.clone` without argument juggling or support\n\
     * for `thisArg` binding.\n\
     *\n\
     * @private\n\
     * @param {*} value The value to clone.\n\
     * @param {boolean} [deep=false] Specify a deep clone.\n\
     * @param {Function} [callback] The function to customize cloning values.\n\
     * @param {Array} [stackA=[]] Tracks traversed source objects.\n\
     * @param {Array} [stackB=[]] Associates clones with source counterparts.\n\
     * @returns {*} Returns the cloned value.\n\
     */\n\
    function baseClone(value, deep, callback, stackA, stackB) {\n\
      if (callback) {\n\
        var result = callback(value);\n\
        if (typeof result != 'undefined') {\n\
          return result;\n\
        }\n\
      }\n\
      // inspect [[Class]]\n\
      var isObj = isObject(value);\n\
      if (isObj) {\n\
        var className = toString.call(value);\n\
        if (!cloneableClasses[className] || (!support.nodeClass && isNode(value))) {\n\
          return value;\n\
        }\n\
        var ctor = ctorByClass[className];\n\
        switch (className) {\n\
          case boolClass:\n\
          case dateClass:\n\
            return new ctor(+value);\n\
\n\
          case numberClass:\n\
          case stringClass:\n\
            return new ctor(value);\n\
\n\
          case regexpClass:\n\
            result = ctor(value.source, reFlags.exec(value));\n\
            result.lastIndex = value.lastIndex;\n\
            return result;\n\
        }\n\
      } else {\n\
        return value;\n\
      }\n\
      var isArr = isArray(value);\n\
      if (deep) {\n\
        // check for circular references and return corresponding clone\n\
        var initedStack = !stackA;\n\
        stackA || (stackA = getArray());\n\
        stackB || (stackB = getArray());\n\
\n\
        var length = stackA.length;\n\
        while (length--) {\n\
          if (stackA[length] == value) {\n\
            return stackB[length];\n\
          }\n\
        }\n\
        result = isArr ? ctor(value.length) : {};\n\
      }\n\
      else {\n\
        result = isArr ? slice(value) : assign({}, value);\n\
      }\n\
      // add array properties assigned by `RegExp#exec`\n\
      if (isArr) {\n\
        if (hasOwnProperty.call(value, 'index')) {\n\
          result.index = value.index;\n\
        }\n\
        if (hasOwnProperty.call(value, 'input')) {\n\
          result.input = value.input;\n\
        }\n\
      }\n\
      // exit for shallow clone\n\
      if (!deep) {\n\
        return result;\n\
      }\n\
      // add the source value to the stack of traversed objects\n\
      // and associate it with its clone\n\
      stackA.push(value);\n\
      stackB.push(result);\n\
\n\
      // recursively populate clone (susceptible to call stack limits)\n\
      (isArr ? baseEach : forOwn)(value, function(objValue, key) {\n\
        result[key] = baseClone(objValue, deep, callback, stackA, stackB);\n\
      });\n\
\n\
      if (initedStack) {\n\
        releaseArray(stackA);\n\
        releaseArray(stackB);\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.create` without support for assigning\n\
     * properties to the created object.\n\
     *\n\
     * @private\n\
     * @param {Object} prototype The object to inherit from.\n\
     * @returns {Object} Returns the new object.\n\
     */\n\
    function baseCreate(prototype, properties) {\n\
      return isObject(prototype) ? nativeCreate(prototype) : {};\n\
    }\n\
    // fallback for browsers without `Object.create`\n\
    if (!nativeCreate) {\n\
      baseCreate = function(prototype) {\n\
        if (isObject(prototype)) {\n\
          noop.prototype = prototype;\n\
          var result = new noop;\n\
          noop.prototype = null;\n\
        }\n\
        return result || {};\n\
      };\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.createCallback` without support for creating\n\
     * \"_.pluck\" or \"_.where\" style callbacks.\n\
     *\n\
     * @private\n\
     * @param {*} [func=identity] The value to convert to a callback.\n\
     * @param {*} [thisArg] The `this` binding of the created callback.\n\
     * @param {number} [argCount] The number of arguments the callback accepts.\n\
     * @returns {Function} Returns a callback function.\n\
     */\n\
    function baseCreateCallback(func, thisArg, argCount) {\n\
      if (typeof func != 'function') {\n\
        return identity;\n\
      }\n\
      // exit early for no `thisArg` or already bound by `Function#bind`\n\
      if (typeof thisArg == 'undefined' || !('prototype' in func)) {\n\
        return func;\n\
      }\n\
      var bindData = func.__bindData__;\n\
      if (typeof bindData == 'undefined') {\n\
        if (support.funcNames) {\n\
          bindData = !func.name;\n\
        }\n\
        bindData = bindData || !support.funcDecomp;\n\
        if (!bindData) {\n\
          var source = fnToString.call(func);\n\
          if (!support.funcNames) {\n\
            bindData = !reFuncName.test(source);\n\
          }\n\
          if (!bindData) {\n\
            // checks if `func` references the `this` keyword and stores the result\n\
            bindData = reThis.test(source);\n\
            setBindData(func, bindData);\n\
          }\n\
        }\n\
      }\n\
      // exit early if there are no `this` references or `func` is bound\n\
      if (bindData === false || (bindData !== true && bindData[1] & 1)) {\n\
        return func;\n\
      }\n\
      switch (argCount) {\n\
        case 1: return function(value) {\n\
          return func.call(thisArg, value);\n\
        };\n\
        case 2: return function(a, b) {\n\
          return func.call(thisArg, a, b);\n\
        };\n\
        case 3: return function(value, index, collection) {\n\
          return func.call(thisArg, value, index, collection);\n\
        };\n\
        case 4: return function(accumulator, value, index, collection) {\n\
          return func.call(thisArg, accumulator, value, index, collection);\n\
        };\n\
      }\n\
      return bind(func, thisArg);\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.flatten` without support for callback\n\
     * shorthands or `thisArg` binding.\n\
     *\n\
     * @private\n\
     * @param {Array} array The array to flatten.\n\
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.\n\
     * @param {boolean} [isArgArrays=false] A flag to restrict flattening to arrays and `arguments` objects.\n\
     * @param {number} [fromIndex=0] The index to start from.\n\
     * @returns {Array} Returns a new flattened array.\n\
     */\n\
    function baseFlatten(array, isShallow, isArgArrays, fromIndex) {\n\
      var index = (fromIndex || 0) - 1,\n\
          length = array ? array.length : 0,\n\
          result = [];\n\
\n\
      while (++index < length) {\n\
        var value = array[index];\n\
\n\
        if (value && typeof value == 'object' && typeof value.length == 'number'\n\
            && (isArray(value) || isArguments(value))) {\n\
          // recursively flatten arrays (susceptible to call stack limits)\n\
          if (!isShallow) {\n\
            value = baseFlatten(value, isShallow, isArgArrays);\n\
          }\n\
          var valIndex = -1,\n\
              valLength = value.length,\n\
              resIndex = result.length;\n\
\n\
          result.length += valLength;\n\
          while (++valIndex < valLength) {\n\
            result[resIndex++] = value[valIndex];\n\
          }\n\
        } else if (!isArgArrays) {\n\
          result.push(value);\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.isEqual`, without support for `thisArg` binding,\n\
     * that allows partial \"_.where\" style comparisons.\n\
     *\n\
     * @private\n\
     * @param {*} a The value to compare.\n\
     * @param {*} b The other value to compare.\n\
     * @param {Function} [callback] The function to customize comparing values.\n\
     * @param {Function} [isWhere=false] A flag to indicate performing partial comparisons.\n\
     * @param {Array} [stackA=[]] Tracks traversed `a` objects.\n\
     * @param {Array} [stackB=[]] Tracks traversed `b` objects.\n\
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.\n\
     */\n\
    function baseIsEqual(a, b, callback, isWhere, stackA, stackB) {\n\
      // used to indicate that when comparing objects, `a` has at least the properties of `b`\n\
      if (callback) {\n\
        var result = callback(a, b);\n\
        if (typeof result != 'undefined') {\n\
          return !!result;\n\
        }\n\
      }\n\
      // exit early for identical values\n\
      if (a === b) {\n\
        // treat `+0` vs. `-0` as not equal\n\
        return a !== 0 || (1 / a == 1 / b);\n\
      }\n\
      var type = typeof a,\n\
          otherType = typeof b;\n\
\n\
      // exit early for unlike primitive values\n\
      if (a === a &&\n\
          !(a && objectTypes[type]) &&\n\
          !(b && objectTypes[otherType])) {\n\
        return false;\n\
      }\n\
      // exit early for `null` and `undefined` avoiding ES3's Function#call behavior\n\
      // http://es5.github.io/#x15.3.4.4\n\
      if (a == null || b == null) {\n\
        return a === b;\n\
      }\n\
      // compare [[Class]] names\n\
      var className = toString.call(a),\n\
          otherClass = toString.call(b);\n\
\n\
      if (className == argsClass) {\n\
        className = objectClass;\n\
      }\n\
      if (otherClass == argsClass) {\n\
        otherClass = objectClass;\n\
      }\n\
      if (className != otherClass) {\n\
        return false;\n\
      }\n\
      switch (className) {\n\
        case boolClass:\n\
        case dateClass:\n\
          // coerce dates and booleans to numbers, dates to milliseconds and booleans\n\
          // to `1` or `0` treating invalid dates coerced to `NaN` as not equal\n\
          return +a == +b;\n\
\n\
        case numberClass:\n\
          // treat `NaN` vs. `NaN` as equal\n\
          return (a != +a)\n\
            ? b != +b\n\
            // but treat `+0` vs. `-0` as not equal\n\
            : (a == 0 ? (1 / a == 1 / b) : a == +b);\n\
\n\
        case regexpClass:\n\
        case stringClass:\n\
          // coerce regexes to strings (http://es5.github.io/#x15.10.6.4)\n\
          // treat string primitives and their corresponding object instances as equal\n\
          return a == String(b);\n\
      }\n\
      var isArr = className == arrayClass;\n\
      if (!isArr) {\n\
        // unwrap any `lodash` wrapped values\n\
        if (hasOwnProperty.call(a, '__wrapped__ ') || hasOwnProperty.call(b, '__wrapped__')) {\n\
          return baseIsEqual(a.__wrapped__ || a, b.__wrapped__ || b, callback, isWhere, stackA, stackB);\n\
        }\n\
        // exit for functions and DOM nodes\n\
        if (className != objectClass || (!support.nodeClass && (isNode(a) || isNode(b)))) {\n\
          return false;\n\
        }\n\
        // in older versions of Opera, `arguments` objects have `Array` constructors\n\
        var ctorA = !support.argsObject && isArguments(a) ? Object : a.constructor,\n\
            ctorB = !support.argsObject && isArguments(b) ? Object : b.constructor;\n\
\n\
        // non `Object` object instances with different constructors are not equal\n\
        if (ctorA != ctorB &&\n\
              !(isFunction(ctorA) && ctorA instanceof ctorA && isFunction(ctorB) && ctorB instanceof ctorB) &&\n\
              ('constructor' in a && 'constructor' in b)\n\
            ) {\n\
          return false;\n\
        }\n\
      }\n\
      // assume cyclic structures are equal\n\
      // the algorithm for detecting cyclic structures is adapted from ES 5.1\n\
      // section 15.12.3, abstract operation `JO` (http://es5.github.io/#x15.12.3)\n\
      var initedStack = !stackA;\n\
      stackA || (stackA = getArray());\n\
      stackB || (stackB = getArray());\n\
\n\
      var length = stackA.length;\n\
      while (length--) {\n\
        if (stackA[length] == a) {\n\
          return stackB[length] == b;\n\
        }\n\
      }\n\
      var size = 0;\n\
      result = true;\n\
\n\
      // add `a` and `b` to the stack of traversed objects\n\
      stackA.push(a);\n\
      stackB.push(b);\n\
\n\
      // recursively compare objects and arrays (susceptible to call stack limits)\n\
      if (isArr) {\n\
        length = a.length;\n\
        size = b.length;\n\
\n\
        // compare lengths to determine if a deep comparison is necessary\n\
        result = size == a.length;\n\
        if (!result && !isWhere) {\n\
          return result;\n\
        }\n\
        // deep compare the contents, ignoring non-numeric properties\n\
        while (size--) {\n\
          var index = length,\n\
              value = b[size];\n\
\n\
          if (isWhere) {\n\
            while (index--) {\n\
              if ((result = baseIsEqual(a[index], value, callback, isWhere, stackA, stackB))) {\n\
                break;\n\
              }\n\
            }\n\
          } else if (!(result = baseIsEqual(a[size], value, callback, isWhere, stackA, stackB))) {\n\
            break;\n\
          }\n\
        }\n\
        return result;\n\
      }\n\
      // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`\n\
      // which, in this case, is more costly\n\
      forIn(b, function(value, key, b) {\n\
        if (hasOwnProperty.call(b, key)) {\n\
          // count the number of properties.\n\
          size++;\n\
          // deep compare each property value.\n\
          return (result = hasOwnProperty.call(a, key) && baseIsEqual(a[key], value, callback, isWhere, stackA, stackB));\n\
        }\n\
      });\n\
\n\
      if (result && !isWhere) {\n\
        // ensure both objects have the same number of properties\n\
        forIn(a, function(value, key, a) {\n\
          if (hasOwnProperty.call(a, key)) {\n\
            // `size` will be `-1` if `a` has more properties than `b`\n\
            return (result = --size > -1);\n\
          }\n\
        });\n\
      }\n\
      if (initedStack) {\n\
        releaseArray(stackA);\n\
        releaseArray(stackB);\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.merge` without argument juggling or support\n\
     * for `thisArg` binding.\n\
     *\n\
     * @private\n\
     * @param {Object} object The destination object.\n\
     * @param {Object} source The source object.\n\
     * @param {Function} [callback] The function to customize merging properties.\n\
     * @param {Array} [stackA=[]] Tracks traversed source objects.\n\
     * @param {Array} [stackB=[]] Associates values with source counterparts.\n\
     */\n\
    function baseMerge(object, source, callback, stackA, stackB) {\n\
      (isArray(source) ? forEach : forOwn)(source, function(source, key) {\n\
        var found,\n\
            isArr,\n\
            result = source,\n\
            value = object[key];\n\
\n\
        if (source && ((isArr = isArray(source)) || isPlainObject(source))) {\n\
          // avoid merging previously merged cyclic sources\n\
          var stackLength = stackA.length;\n\
          while (stackLength--) {\n\
            if ((found = stackA[stackLength] == source)) {\n\
              value = stackB[stackLength];\n\
              break;\n\
            }\n\
          }\n\
          if (!found) {\n\
            var isShallow;\n\
            if (callback) {\n\
              result = callback(value, source);\n\
              if ((isShallow = typeof result != 'undefined')) {\n\
                value = result;\n\
              }\n\
            }\n\
            if (!isShallow) {\n\
              value = isArr\n\
                ? (isArray(value) ? value : [])\n\
                : (isPlainObject(value) ? value : {});\n\
            }\n\
            // add `source` and associated `value` to the stack of traversed objects\n\
            stackA.push(source);\n\
            stackB.push(value);\n\
\n\
            // recursively merge objects and arrays (susceptible to call stack limits)\n\
            if (!isShallow) {\n\
              baseMerge(value, source, callback, stackA, stackB);\n\
            }\n\
          }\n\
        }\n\
        else {\n\
          if (callback) {\n\
            result = callback(value, source);\n\
            if (typeof result == 'undefined') {\n\
              result = source;\n\
            }\n\
          }\n\
          if (typeof result != 'undefined') {\n\
            value = result;\n\
          }\n\
        }\n\
        object[key] = value;\n\
      });\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.random` without argument juggling or support\n\
     * for returning floating-point numbers.\n\
     *\n\
     * @private\n\
     * @param {number} min The minimum possible value.\n\
     * @param {number} max The maximum possible value.\n\
     * @returns {number} Returns a random number.\n\
     */\n\
    function baseRandom(min, max) {\n\
      return min + floor(nativeRandom() * (max - min + 1));\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.uniq` without support for callback shorthands\n\
     * or `thisArg` binding.\n\
     *\n\
     * @private\n\
     * @param {Array} array The array to process.\n\
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.\n\
     * @param {Function} [callback] The function called per iteration.\n\
     * @returns {Array} Returns a duplicate-value-free array.\n\
     */\n\
    function baseUniq(array, isSorted, callback) {\n\
      var index = -1,\n\
          indexOf = getIndexOf(),\n\
          length = array ? array.length : 0,\n\
          result = [];\n\
\n\
      var isLarge = !isSorted && length >= largeArraySize && indexOf === baseIndexOf,\n\
          seen = (callback || isLarge) ? getArray() : result;\n\
\n\
      if (isLarge) {\n\
        var cache = createCache(seen);\n\
        if (cache) {\n\
          indexOf = cacheIndexOf;\n\
          seen = cache;\n\
        } else {\n\
          isLarge = false;\n\
          seen = callback ? seen : (releaseArray(seen), result);\n\
        }\n\
      }\n\
      while (++index < length) {\n\
        var value = array[index],\n\
            computed = callback ? callback(value, index, array) : value;\n\
\n\
        if (isSorted\n\
              ? !index || seen[seen.length - 1] !== computed\n\
              : indexOf(seen, computed) < 0\n\
            ) {\n\
          if (callback || isLarge) {\n\
            seen.push(computed);\n\
          }\n\
          result.push(value);\n\
        }\n\
      }\n\
      if (isLarge) {\n\
        releaseArray(seen.array);\n\
        releaseObject(seen);\n\
      } else if (callback) {\n\
        releaseArray(seen);\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates a function that aggregates a collection, creating an object composed\n\
     * of keys generated from the results of running each element of the collection\n\
     * through a callback. The given `setter` function sets the keys and values\n\
     * of the composed object.\n\
     *\n\
     * @private\n\
     * @param {Function} setter The setter function.\n\
     * @returns {Function} Returns the new aggregator function.\n\
     */\n\
    function createAggregator(setter) {\n\
      return function(collection, callback, thisArg) {\n\
        var result = {};\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
\n\
        if (isArray(collection)) {\n\
          var index = -1,\n\
              length = collection.length;\n\
\n\
          while (++index < length) {\n\
            var value = collection[index];\n\
            setter(result, value, callback(value, index, collection), collection);\n\
          }\n\
        } else {\n\
          baseEach(collection, function(value, key, collection) {\n\
            setter(result, value, callback(value, key, collection), collection);\n\
          });\n\
        }\n\
        return result;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Creates a function that, when called, either curries or invokes `func`\n\
     * with an optional `this` binding and partially applied arguments.\n\
     *\n\
     * @private\n\
     * @param {Function|string} func The function or method name to reference.\n\
     * @param {number} bitmask The bitmask of method flags to compose.\n\
     *  The bitmask may be composed of the following flags:\n\
     *  1 - `_.bind`\n\
     *  2 - `_.bindKey`\n\
     *  4 - `_.curry`\n\
     *  8 - `_.curry` (bound)\n\
     *  16 - `_.partial`\n\
     *  32 - `_.partialRight`\n\
     * @param {Array} [partialArgs] An array of arguments to prepend to those\n\
     *  provided to the new function.\n\
     * @param {Array} [partialRightArgs] An array of arguments to append to those\n\
     *  provided to the new function.\n\
     * @param {*} [thisArg] The `this` binding of `func`.\n\
     * @param {number} [arity] The arity of `func`.\n\
     * @returns {Function} Returns the new bound function.\n\
     */\n\
    function createBound(func, bitmask, partialArgs, partialRightArgs, thisArg, arity) {\n\
      var isBind = bitmask & 1,\n\
          isBindKey = bitmask & 2,\n\
          isCurry = bitmask & 4,\n\
          isCurryBound = bitmask & 8,\n\
          isPartial = bitmask & 16,\n\
          isPartialRight = bitmask & 32,\n\
          key = func;\n\
\n\
      if (!isBindKey && !isFunction(func)) {\n\
        throw new TypeError;\n\
      }\n\
      if (isPartial && !partialArgs.length) {\n\
        bitmask &= ~16;\n\
        isPartial = partialArgs = false;\n\
      }\n\
      if (isPartialRight && !partialRightArgs.length) {\n\
        bitmask &= ~32;\n\
        isPartialRight = partialRightArgs = false;\n\
      }\n\
      var bindData = func && func.__bindData__;\n\
      if (bindData && bindData !== true) {\n\
        bindData = bindData.slice();\n\
\n\
        // set `thisBinding` is not previously bound\n\
        if (isBind && !(bindData[1] & 1)) {\n\
          bindData[4] = thisArg;\n\
        }\n\
        // set if previously bound but not currently (subsequent curried functions)\n\
        if (!isBind && bindData[1] & 1) {\n\
          bitmask |= 8;\n\
        }\n\
        // set curried arity if not yet set\n\
        if (isCurry && !(bindData[1] & 4)) {\n\
          bindData[5] = arity;\n\
        }\n\
        // append partial left arguments\n\
        if (isPartial) {\n\
          push.apply(bindData[2] || (bindData[2] = []), partialArgs);\n\
        }\n\
        // append partial right arguments\n\
        if (isPartialRight) {\n\
          push.apply(bindData[3] || (bindData[3] = []), partialRightArgs);\n\
        }\n\
        // merge flags\n\
        bindData[1] |= bitmask;\n\
        return createBound.apply(null, bindData);\n\
      }\n\
      // use `Function#bind` if it exists and is fast\n\
      // (in V8 `Function#bind` is slower except when partially applied)\n\
      if (isBind && !(isBindKey || isCurry || isPartialRight) &&\n\
          (support.fastBind || (nativeBind && isPartial))) {\n\
        if (isPartial) {\n\
          var args = [thisArg];\n\
          push.apply(args, partialArgs);\n\
        }\n\
        var bound = isPartial\n\
          ? nativeBind.apply(func, args)\n\
          : nativeBind.call(func, thisArg);\n\
      }\n\
      else {\n\
        bound = function() {\n\
          // `Function#bind` spec\n\
          // http://es5.github.io/#x15.3.4.5\n\
          var args = arguments,\n\
              thisBinding = isBind ? thisArg : this;\n\
\n\
          if (isCurry || isPartial || isPartialRight) {\n\
            args = slice(args);\n\
            if (isPartial) {\n\
              unshift.apply(args, partialArgs);\n\
            }\n\
            if (isPartialRight) {\n\
              push.apply(args, partialRightArgs);\n\
            }\n\
            if (isCurry && args.length < arity) {\n\
              bitmask |= 16 & ~32;\n\
              return createBound(func, (isCurryBound ? bitmask : bitmask & ~3), args, null, thisArg, arity);\n\
            }\n\
          }\n\
          if (isBindKey) {\n\
            func = thisBinding[key];\n\
          }\n\
          if (this instanceof bound) {\n\
            // ensure `new bound` is an instance of `func`\n\
            thisBinding = baseCreate(func.prototype);\n\
\n\
            // mimic the constructor's `return` behavior\n\
            // http://es5.github.io/#x13.2.2\n\
            var result = func.apply(thisBinding, args);\n\
            return isObject(result) ? result : thisBinding;\n\
          }\n\
          return func.apply(thisBinding, args);\n\
        };\n\
      }\n\
      setBindData(bound, slice(arguments));\n\
      return bound;\n\
    }\n\
\n\
    /**\n\
     * Creates compiled iteration functions.\n\
     *\n\
     * @private\n\
     * @param {...Object} [options] The compile options object(s).\n\
     * @param {string} [options.array] Code to determine if the iterable is an array or array-like.\n\
     * @param {boolean} [options.useHas] Specify using `hasOwnProperty` checks in the object loop.\n\
     * @param {Function} [options.keys] A reference to `_.keys` for use in own property iteration.\n\
     * @param {string} [options.args] A comma separated string of iteration function arguments.\n\
     * @param {string} [options.top] Code to execute before the iteration branches.\n\
     * @param {string} [options.loop] Code to execute in the object loop.\n\
     * @param {string} [options.bottom] Code to execute after the iteration branches.\n\
     * @returns {Function} Returns the compiled function.\n\
     */\n\
    function createIterator() {\n\
      // data properties\n\
      iteratorData.shadowedProps = shadowedProps;\n\
\n\
      // iterator options\n\
      iteratorData.array = iteratorData.bottom = iteratorData.loop = iteratorData.top = '';\n\
      iteratorData.init = 'iterable';\n\
      iteratorData.useHas = true;\n\
\n\
      // merge options into a template data object\n\
      for (var object, index = 0; object = arguments[index]; index++) {\n\
        for (var key in object) {\n\
          iteratorData[key] = object[key];\n\
        }\n\
      }\n\
      var args = iteratorData.args;\n\
      iteratorData.firstArg = /^[^,]+/.exec(args)[0];\n\
\n\
      // create the function factory\n\
      var factory = Function(\n\
          'baseCreateCallback, errorClass, errorProto, hasOwnProperty, ' +\n\
          'indicatorObject, isArguments, isArray, isString, keys, objectProto, ' +\n\
          'objectTypes, nonEnumProps, stringClass, stringProto, toString',\n\
        'return function(' + args + ') {\\n\
' + iteratorTemplate(iteratorData) + '\\n\
}'\n\
      );\n\
\n\
      // return the compiled function\n\
      return factory(\n\
        baseCreateCallback, errorClass, errorProto, hasOwnProperty,\n\
        indicatorObject, isArguments, isArray, isString, iteratorData.keys, objectProto,\n\
        objectTypes, nonEnumProps, stringClass, stringProto, toString\n\
      );\n\
    }\n\
\n\
    /**\n\
     * Used by `escape` to convert characters to HTML entities.\n\
     *\n\
     * @private\n\
     * @param {string} match The matched character to escape.\n\
     * @returns {string} Returns the escaped character.\n\
     */\n\
    function escapeHtmlChar(match) {\n\
      return htmlEscapes[match];\n\
    }\n\
\n\
    /**\n\
     * Gets the appropriate \"indexOf\" function. If the `_.indexOf` method is\n\
     * customized, this method returns the custom method, otherwise it returns\n\
     * the `baseIndexOf` function.\n\
     *\n\
     * @private\n\
     * @returns {Function} Returns the \"indexOf\" function.\n\
     */\n\
    function getIndexOf() {\n\
      var result = (result = lodash.indexOf) === indexOf ? baseIndexOf : result;\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Sets `this` binding data on a given function.\n\
     *\n\
     * @private\n\
     * @param {Function} func The function to set data on.\n\
     * @param {*} value The value to set.\n\
     */\n\
    var setBindData = !defineProperty ? noop : function(func, value) {\n\
      descriptor.value = value;\n\
      defineProperty(func, '__bindData__', descriptor);\n\
    };\n\
\n\
    /**\n\
     * A fallback implementation of `isPlainObject` which checks if a given value\n\
     * is an object created by the `Object` constructor, assuming objects created\n\
     * by the `Object` constructor have no inherited enumerable properties and that\n\
     * there are no `Object.prototype` extensions.\n\
     *\n\
     * @private\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.\n\
     */\n\
    function shimIsPlainObject(value) {\n\
      var ctor,\n\
          result;\n\
\n\
      // avoid non Object objects, `arguments` objects, and DOM elements\n\
      if (!(value && toString.call(value) == objectClass) ||\n\
          (ctor = value.constructor, isFunction(ctor) && !(ctor instanceof ctor)) ||\n\
          (!support.argsClass && isArguments(value)) ||\n\
          (!support.nodeClass && isNode(value))) {\n\
        return false;\n\
      }\n\
      // IE < 9 iterates inherited properties before own properties. If the first\n\
      // iterated property is an object's own property then there are no inherited\n\
      // enumerable properties.\n\
      if (support.ownLast) {\n\
        forIn(value, function(value, key, object) {\n\
          result = hasOwnProperty.call(object, key);\n\
          return false;\n\
        });\n\
        return result !== false;\n\
      }\n\
      // In most environments an object's own properties are iterated before\n\
      // its inherited properties. If the last iterated property is an object's\n\
      // own property then there are no inherited enumerable properties.\n\
      forIn(value, function(value, key) {\n\
        result = key;\n\
      });\n\
      return typeof result == 'undefined' || hasOwnProperty.call(value, result);\n\
    }\n\
\n\
    /**\n\
     * Used by `unescape` to convert HTML entities to characters.\n\
     *\n\
     * @private\n\
     * @param {string} match The matched character to unescape.\n\
     * @returns {string} Returns the unescaped character.\n\
     */\n\
    function unescapeHtmlChar(match) {\n\
      return htmlUnescapes[match];\n\
    }\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Checks if `value` is an `arguments` object.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is an `arguments` object, else `false`.\n\
     * @example\n\
     *\n\
     * (function() { return _.isArguments(arguments); })(1, 2, 3);\n\
     * // => true\n\
     *\n\
     * _.isArguments([1, 2, 3]);\n\
     * // => false\n\
     */\n\
    function isArguments(value) {\n\
      return value && typeof value == 'object' && typeof value.length == 'number' &&\n\
        toString.call(value) == argsClass || false;\n\
    }\n\
    // fallback for browsers that can't detect `arguments` objects by [[Class]]\n\
    if (!support.argsClass) {\n\
      isArguments = function(value) {\n\
        return value && typeof value == 'object' && typeof value.length == 'number' &&\n\
          hasOwnProperty.call(value, 'callee') || false;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is an array.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is an array, else `false`.\n\
     * @example\n\
     *\n\
     * (function() { return _.isArray(arguments); })();\n\
     * // => false\n\
     *\n\
     * _.isArray([1, 2, 3]);\n\
     * // => true\n\
     */\n\
    var isArray = nativeIsArray || function(value) {\n\
      return value && typeof value == 'object' && typeof value.length == 'number' &&\n\
        toString.call(value) == arrayClass || false;\n\
    };\n\
\n\
    /**\n\
     * A fallback implementation of `Object.keys` which produces an array of the\n\
     * given object's own enumerable property names.\n\
     *\n\
     * @private\n\
     * @type Function\n\
     * @param {Object} object The object to inspect.\n\
     * @returns {Array} Returns an array of property names.\n\
     */\n\
    var shimKeys = createIterator({\n\
      'args': 'object',\n\
      'init': '[]',\n\
      'top': 'if (!(objectTypes[typeof object])) return result',\n\
      'loop': 'result.push(index)'\n\
    });\n\
\n\
    /**\n\
     * Creates an array composed of the own enumerable property names of an object.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to inspect.\n\
     * @returns {Array} Returns an array of property names.\n\
     * @example\n\
     *\n\
     * _.keys({ 'one': 1, 'two': 2, 'three': 3 });\n\
     * // => ['one', 'two', 'three'] (property order is not guaranteed across environments)\n\
     */\n\
    var keys = !nativeKeys ? shimKeys : function(object) {\n\
      if (!isObject(object)) {\n\
        return [];\n\
      }\n\
      if ((support.enumPrototypes && typeof object == 'function') ||\n\
          (support.nonEnumArgs && object.length && isArguments(object))) {\n\
        return shimKeys(object);\n\
      }\n\
      return nativeKeys(object);\n\
    };\n\
\n\
    /** Reusable iterator options shared by `each`, `forIn`, and `forOwn` */\n\
    var eachIteratorOptions = {\n\
      'args': 'collection, callback, thisArg',\n\
      'top': \"callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3)\",\n\
      'array': \"typeof length == 'number'\",\n\
      'keys': keys,\n\
      'loop': 'if (callback(iterable[index], index, collection) === false) return result'\n\
    };\n\
\n\
    /** Reusable iterator options for `assign` and `defaults` */\n\
    var defaultsIteratorOptions = {\n\
      'args': 'object, source, guard',\n\
      'top':\n\
        'var args = arguments,\\n\
' +\n\
        '    argsIndex = 0,\\n\
' +\n\
        \"    argsLength = typeof guard == 'number' ? 2 : args.length;\\n\
\" +\n\
        'while (++argsIndex < argsLength) {\\n\
' +\n\
        '  iterable = args[argsIndex];\\n\
' +\n\
        '  if (iterable && objectTypes[typeof iterable]) {',\n\
      'keys': keys,\n\
      'loop': \"if (typeof result[index] == 'undefined') result[index] = iterable[index]\",\n\
      'bottom': '  }\\n\
}'\n\
    };\n\
\n\
    /** Reusable iterator options for `forIn` and `forOwn` */\n\
    var forOwnIteratorOptions = {\n\
      'top': 'if (!objectTypes[typeof iterable]) return result;\\n\
' + eachIteratorOptions.top,\n\
      'array': false\n\
    };\n\
\n\
    /**\n\
     * Used to convert characters to HTML entities:\n\
     *\n\
     * Though the `>` character is escaped for symmetry, characters like `>` and `/`\n\
     * don't require escaping in HTML and have no special meaning unless they're part\n\
     * of a tag or an unquoted attribute value.\n\
     * http://mathiasbynens.be/notes/ambiguous-ampersands (under \"semi-related fun fact\")\n\
     */\n\
    var htmlEscapes = {\n\
      '&': '&amp;',\n\
      '<': '&lt;',\n\
      '>': '&gt;',\n\
      '\"': '&quot;',\n\
      \"'\": '&#39;'\n\
    };\n\
\n\
    /** Used to convert HTML entities to characters */\n\
    var htmlUnescapes = invert(htmlEscapes);\n\
\n\
    /** Used to match HTML entities and HTML characters */\n\
    var reEscapedHtml = RegExp('(' + keys(htmlUnescapes).join('|') + ')', 'g'),\n\
        reUnescapedHtml = RegExp('[' + keys(htmlEscapes).join('') + ']', 'g');\n\
\n\
    /**\n\
     * A function compiled to iterate `arguments` objects, arrays, objects, and\n\
     * strings consistenly across environments, executing the callback for each\n\
     * element in the collection. The callback is bound to `thisArg` and invoked\n\
     * with three arguments; (value, index|key, collection). Callbacks may exit\n\
     * iteration early by explicitly returning `false`.\n\
     *\n\
     * @private\n\
     * @type Function\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array|Object|string} Returns `collection`.\n\
     */\n\
    var baseEach = createIterator(eachIteratorOptions);\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Assigns own enumerable properties of source object(s) to the destination\n\
     * object. Subsequent sources will overwrite property assignments of previous\n\
     * sources. If a callback is provided it will be executed to produce the\n\
     * assigned values. The callback is bound to `thisArg` and invoked with two\n\
     * arguments; (objectValue, sourceValue).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @alias extend\n\
     * @category Objects\n\
     * @param {Object} object The destination object.\n\
     * @param {...Object} [source] The source objects.\n\
     * @param {Function} [callback] The function to customize assigning values.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns the destination object.\n\
     * @example\n\
     *\n\
     * _.assign({ 'name': 'fred' }, { 'employer': 'slate' });\n\
     * // => { 'name': 'fred', 'employer': 'slate' }\n\
     *\n\
     * var defaults = _.partialRight(_.assign, function(a, b) {\n\
     *   return typeof a == 'undefined' ? b : a;\n\
     * });\n\
     *\n\
     * var object = { 'name': 'barney' };\n\
     * defaults(object, { 'name': 'fred', 'employer': 'slate' });\n\
     * // => { 'name': 'barney', 'employer': 'slate' }\n\
     */\n\
    var assign = createIterator(defaultsIteratorOptions, {\n\
      'top':\n\
        defaultsIteratorOptions.top.replace(';',\n\
          ';\\n\
' +\n\
          \"if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {\\n\
\" +\n\
          '  var callback = baseCreateCallback(args[--argsLength - 1], args[argsLength--], 2);\\n\
' +\n\
          \"} else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {\\n\
\" +\n\
          '  callback = args[--argsLength];\\n\
' +\n\
          '}'\n\
        ),\n\
      'loop': 'result[index] = callback ? callback(result[index], iterable[index]) : iterable[index]'\n\
    });\n\
\n\
    /**\n\
     * Creates a clone of `value`. If `deep` is `true` nested objects will also\n\
     * be cloned, otherwise they will be assigned by reference. If a callback\n\
     * is provided it will be executed to produce the cloned values. If the\n\
     * callback returns `undefined` cloning will be handled by the method instead.\n\
     * The callback is bound to `thisArg` and invoked with one argument; (value).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to clone.\n\
     * @param {boolean} [deep=false] Specify a deep clone.\n\
     * @param {Function} [callback] The function to customize cloning values.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the cloned value.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * var shallow = _.clone(characters);\n\
     * shallow[0] === characters[0];\n\
     * // => true\n\
     *\n\
     * var deep = _.clone(characters, true);\n\
     * deep[0] === characters[0];\n\
     * // => false\n\
     *\n\
     * _.mixin({\n\
     *   'clone': _.partialRight(_.clone, function(value) {\n\
     *     return _.isElement(value) ? value.cloneNode(false) : undefined;\n\
     *   })\n\
     * });\n\
     *\n\
     * var clone = _.clone(document.body);\n\
     * clone.childNodes.length;\n\
     * // => 0\n\
     */\n\
    function clone(value, deep, callback, thisArg) {\n\
      // allows working with \"Collections\" methods without using their `index`\n\
      // and `collection` arguments for `deep` and `callback`\n\
      if (typeof deep != 'boolean' && deep != null) {\n\
        thisArg = callback;\n\
        callback = deep;\n\
        deep = false;\n\
      }\n\
      return baseClone(value, deep, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));\n\
    }\n\
\n\
    /**\n\
     * Creates a deep clone of `value`. If a callback is provided it will be\n\
     * executed to produce the cloned values. If the callback returns `undefined`\n\
     * cloning will be handled by the method instead. The callback is bound to\n\
     * `thisArg` and invoked with one argument; (value).\n\
     *\n\
     * Note: This method is loosely based on the structured clone algorithm. Functions\n\
     * and DOM nodes are **not** cloned. The enumerable properties of `arguments` objects and\n\
     * objects created by constructors other than `Object` are cloned to plain `Object` objects.\n\
     * See http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to deep clone.\n\
     * @param {Function} [callback] The function to customize cloning values.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the deep cloned value.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * var deep = _.cloneDeep(characters);\n\
     * deep[0] === characters[0];\n\
     * // => false\n\
     *\n\
     * var view = {\n\
     *   'label': 'docs',\n\
     *   'node': element\n\
     * };\n\
     *\n\
     * var clone = _.cloneDeep(view, function(value) {\n\
     *   return _.isElement(value) ? value.cloneNode(true) : undefined;\n\
     * });\n\
     *\n\
     * clone.node == view.node;\n\
     * // => false\n\
     */\n\
    function cloneDeep(value, callback, thisArg) {\n\
      return baseClone(value, true, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));\n\
    }\n\
\n\
    /**\n\
     * Creates an object that inherits from the given `prototype` object. If a\n\
     * `properties` object is provided its own enumerable properties are assigned\n\
     * to the created object.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} prototype The object to inherit from.\n\
     * @param {Object} [properties] The properties to assign to the object.\n\
     * @returns {Object} Returns the new object.\n\
     * @example\n\
     *\n\
     * function Shape() {\n\
     *   this.x = 0;\n\
     *   this.y = 0;\n\
     * }\n\
     *\n\
     * function Circle() {\n\
     *   Shape.call(this);\n\
     * }\n\
     *\n\
     * Circle.prototype = _.create(Shape.prototype, { 'constructor': Circle });\n\
     *\n\
     * var circle = new Circle;\n\
     * circle instanceof Circle;\n\
     * // => true\n\
     *\n\
     * circle instanceof Shape;\n\
     * // => true\n\
     */\n\
    function create(prototype, properties) {\n\
      var result = baseCreate(prototype);\n\
      return properties ? assign(result, properties) : result;\n\
    }\n\
\n\
    /**\n\
     * Assigns own enumerable properties of source object(s) to the destination\n\
     * object for all destination properties that resolve to `undefined`. Once a\n\
     * property is set, additional defaults of the same property will be ignored.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Objects\n\
     * @param {Object} object The destination object.\n\
     * @param {...Object} [source] The source objects.\n\
     * @param- {Object} [guard] Allows working with `_.reduce` without using its\n\
     *  `key` and `object` arguments as sources.\n\
     * @returns {Object} Returns the destination object.\n\
     * @example\n\
     *\n\
     * var object = { 'name': 'barney' };\n\
     * _.defaults(object, { 'name': 'fred', 'employer': 'slate' });\n\
     * // => { 'name': 'barney', 'employer': 'slate' }\n\
     */\n\
    var defaults = createIterator(defaultsIteratorOptions);\n\
\n\
    /**\n\
     * This method is like `_.findIndex` except that it returns the key of the\n\
     * first element that passes the callback check, instead of the element itself.\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to search.\n\
     * @param {Function|Object|string} [callback=identity] The function called per\n\
     *  iteration. If a property name or object is provided it will be used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.\n\
     * @example\n\
     *\n\
     * var characters = {\n\
     *   'barney': {  'age': 36, 'blocked': false },\n\
     *   'fred': {    'age': 40, 'blocked': true },\n\
     *   'pebbles': { 'age': 1,  'blocked': false }\n\
     * };\n\
     *\n\
     * _.findKey(characters, function(chr) {\n\
     *   return chr.age < 40;\n\
     * });\n\
     * // => 'barney' (property order is not guaranteed across environments)\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.findKey(characters, { 'age': 1 });\n\
     * // => 'pebbles'\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.findKey(characters, 'blocked');\n\
     * // => 'fred'\n\
     */\n\
    function findKey(object, callback, thisArg) {\n\
      var result;\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      forOwn(object, function(value, key, object) {\n\
        if (callback(value, key, object)) {\n\
          result = key;\n\
          return false;\n\
        }\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.findKey` except that it iterates over elements\n\
     * of a `collection` in the opposite order.\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to search.\n\
     * @param {Function|Object|string} [callback=identity] The function called per\n\
     *  iteration. If a property name or object is provided it will be used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.\n\
     * @example\n\
     *\n\
     * var characters = {\n\
     *   'barney': {  'age': 36, 'blocked': true },\n\
     *   'fred': {    'age': 40, 'blocked': false },\n\
     *   'pebbles': { 'age': 1,  'blocked': true }\n\
     * };\n\
     *\n\
     * _.findLastKey(characters, function(chr) {\n\
     *   return chr.age < 40;\n\
     * });\n\
     * // => returns `pebbles`, assuming `_.findKey` returns `barney`\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.findLastKey(characters, { 'age': 40 });\n\
     * // => 'fred'\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.findLastKey(characters, 'blocked');\n\
     * // => 'pebbles'\n\
     */\n\
    function findLastKey(object, callback, thisArg) {\n\
      var result;\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      forOwnRight(object, function(value, key, object) {\n\
        if (callback(value, key, object)) {\n\
          result = key;\n\
          return false;\n\
        }\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Iterates over own and inherited enumerable properties of an object,\n\
     * executing the callback for each property. The callback is bound to `thisArg`\n\
     * and invoked with three arguments; (value, key, object). Callbacks may exit\n\
     * iteration early by explicitly returning `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Objects\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns `object`.\n\
     * @example\n\
     *\n\
     * function Shape() {\n\
     *   this.x = 0;\n\
     *   this.y = 0;\n\
     * }\n\
     *\n\
     * Shape.prototype.move = function(x, y) {\n\
     *   this.x += x;\n\
     *   this.y += y;\n\
     * };\n\
     *\n\
     * _.forIn(new Shape, function(value, key) {\n\
     *   console.log(key);\n\
     * });\n\
     * // => logs 'x', 'y', and 'move' (property order is not guaranteed across environments)\n\
     */\n\
    var forIn = createIterator(eachIteratorOptions, forOwnIteratorOptions, {\n\
      'useHas': false\n\
    });\n\
\n\
    /**\n\
     * This method is like `_.forIn` except that it iterates over elements\n\
     * of a `collection` in the opposite order.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns `object`.\n\
     * @example\n\
     *\n\
     * function Shape() {\n\
     *   this.x = 0;\n\
     *   this.y = 0;\n\
     * }\n\
     *\n\
     * Shape.prototype.move = function(x, y) {\n\
     *   this.x += x;\n\
     *   this.y += y;\n\
     * };\n\
     *\n\
     * _.forInRight(new Shape, function(value, key) {\n\
     *   console.log(key);\n\
     * });\n\
     * // => logs 'move', 'y', and 'x' assuming `_.forIn ` logs 'x', 'y', and 'move'\n\
     */\n\
    function forInRight(object, callback, thisArg) {\n\
      var pairs = [];\n\
\n\
      forIn(object, function(value, key) {\n\
        pairs.push(key, value);\n\
      });\n\
\n\
      var length = pairs.length;\n\
      callback = baseCreateCallback(callback, thisArg, 3);\n\
      while (length--) {\n\
        if (callback(pairs[length--], pairs[length], object) === false) {\n\
          break;\n\
        }\n\
      }\n\
      return object;\n\
    }\n\
\n\
    /**\n\
     * Iterates over own enumerable properties of an object, executing the callback\n\
     * for each property. The callback is bound to `thisArg` and invoked with three\n\
     * arguments; (value, key, object). Callbacks may exit iteration early by\n\
     * explicitly returning `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Objects\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns `object`.\n\
     * @example\n\
     *\n\
     * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {\n\
     *   console.log(key);\n\
     * });\n\
     * // => logs '0', '1', and 'length' (property order is not guaranteed across environments)\n\
     */\n\
    var forOwn = createIterator(eachIteratorOptions, forOwnIteratorOptions);\n\
\n\
    /**\n\
     * This method is like `_.forOwn` except that it iterates over elements\n\
     * of a `collection` in the opposite order.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns `object`.\n\
     * @example\n\
     *\n\
     * _.forOwnRight({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {\n\
     *   console.log(key);\n\
     * });\n\
     * // => logs 'length', '1', and '0' assuming `_.forOwn` logs '0', '1', and 'length'\n\
     */\n\
    function forOwnRight(object, callback, thisArg) {\n\
      var props = keys(object),\n\
          length = props.length;\n\
\n\
      callback = baseCreateCallback(callback, thisArg, 3);\n\
      while (length--) {\n\
        var key = props[length];\n\
        if (callback(object[key], key, object) === false) {\n\
          break;\n\
        }\n\
      }\n\
      return object;\n\
    }\n\
\n\
    /**\n\
     * Creates a sorted array of property names of all enumerable properties,\n\
     * own and inherited, of `object` that have function values.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias methods\n\
     * @category Objects\n\
     * @param {Object} object The object to inspect.\n\
     * @returns {Array} Returns an array of property names that have function values.\n\
     * @example\n\
     *\n\
     * _.functions(_);\n\
     * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]\n\
     */\n\
    function functions(object) {\n\
      var result = [];\n\
      forIn(object, function(value, key) {\n\
        if (isFunction(value)) {\n\
          result.push(key);\n\
        }\n\
      });\n\
      return result.sort();\n\
    }\n\
\n\
    /**\n\
     * Checks if the specified object `property` exists and is a direct property,\n\
     * instead of an inherited property.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to check.\n\
     * @param {string} property The property to check for.\n\
     * @returns {boolean} Returns `true` if key is a direct property, else `false`.\n\
     * @example\n\
     *\n\
     * _.has({ 'a': 1, 'b': 2, 'c': 3 }, 'b');\n\
     * // => true\n\
     */\n\
    function has(object, property) {\n\
      return object ? hasOwnProperty.call(object, property) : false;\n\
    }\n\
\n\
    /**\n\
     * Creates an object composed of the inverted keys and values of the given object.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to invert.\n\
     * @returns {Object} Returns the created inverted object.\n\
     * @example\n\
     *\n\
     *  _.invert({ 'first': 'fred', 'second': 'barney' });\n\
     * // => { 'fred': 'first', 'barney': 'second' }\n\
     */\n\
    function invert(object) {\n\
      var index = -1,\n\
          props = keys(object),\n\
          length = props.length,\n\
          result = {};\n\
\n\
      while (++index < length) {\n\
        var key = props[index];\n\
        result[object[key]] = key;\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is a boolean value.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is a boolean value, else `false`.\n\
     * @example\n\
     *\n\
     * _.isBoolean(null);\n\
     * // => false\n\
     */\n\
    function isBoolean(value) {\n\
      return value === true || value === false ||\n\
        value && typeof value == 'object' && toString.call(value) == boolClass || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is a date.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is a date, else `false`.\n\
     * @example\n\
     *\n\
     * _.isDate(new Date);\n\
     * // => true\n\
     */\n\
    function isDate(value) {\n\
      return value && typeof value == 'object' && toString.call(value) == dateClass || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is a DOM element.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is a DOM element, else `false`.\n\
     * @example\n\
     *\n\
     * _.isElement(document.body);\n\
     * // => true\n\
     */\n\
    function isElement(value) {\n\
      return value && value.nodeType === 1 || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is empty. Arrays, strings, or `arguments` objects with a\n\
     * length of `0` and objects with no own enumerable properties are considered\n\
     * \"empty\".\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Array|Object|string} value The value to inspect.\n\
     * @returns {boolean} Returns `true` if the `value` is empty, else `false`.\n\
     * @example\n\
     *\n\
     * _.isEmpty([1, 2, 3]);\n\
     * // => false\n\
     *\n\
     * _.isEmpty({});\n\
     * // => true\n\
     *\n\
     * _.isEmpty('');\n\
     * // => true\n\
     */\n\
    function isEmpty(value) {\n\
      var result = true;\n\
      if (!value) {\n\
        return result;\n\
      }\n\
      var className = toString.call(value),\n\
          length = value.length;\n\
\n\
      if ((className == arrayClass || className == stringClass ||\n\
          (support.argsClass ? className == argsClass : isArguments(value))) ||\n\
          (className == objectClass && typeof length == 'number' && isFunction(value.splice))) {\n\
        return !length;\n\
      }\n\
      forOwn(value, function() {\n\
        return (result = false);\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Performs a deep comparison between two values to determine if they are\n\
     * equivalent to each other. If a callback is provided it will be executed\n\
     * to compare values. If the callback returns `undefined` comparisons will\n\
     * be handled by the method instead. The callback is bound to `thisArg` and\n\
     * invoked with two arguments; (a, b).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} a The value to compare.\n\
     * @param {*} b The other value to compare.\n\
     * @param {Function} [callback] The function to customize comparing values.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.\n\
     * @example\n\
     *\n\
     * var object = { 'name': 'fred' };\n\
     * var copy = { 'name': 'fred' };\n\
     *\n\
     * object == copy;\n\
     * // => false\n\
     *\n\
     * _.isEqual(object, copy);\n\
     * // => true\n\
     *\n\
     * var words = ['hello', 'goodbye'];\n\
     * var otherWords = ['hi', 'goodbye'];\n\
     *\n\
     * _.isEqual(words, otherWords, function(a, b) {\n\
     *   var reGreet = /^(?:hello|hi)$/i,\n\
     *       aGreet = _.isString(a) && reGreet.test(a),\n\
     *       bGreet = _.isString(b) && reGreet.test(b);\n\
     *\n\
     *   return (aGreet || bGreet) ? (aGreet == bGreet) : undefined;\n\
     * });\n\
     * // => true\n\
     */\n\
    function isEqual(a, b, callback, thisArg) {\n\
      return baseIsEqual(a, b, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 2));\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is, or can be coerced to, a finite number.\n\
     *\n\
     * Note: This is not the same as native `isFinite` which will return true for\n\
     * booleans and empty strings. See http://es5.github.io/#x15.1.2.5.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is finite, else `false`.\n\
     * @example\n\
     *\n\
     * _.isFinite(-101);\n\
     * // => true\n\
     *\n\
     * _.isFinite('10');\n\
     * // => true\n\
     *\n\
     * _.isFinite(true);\n\
     * // => false\n\
     *\n\
     * _.isFinite('');\n\
     * // => false\n\
     *\n\
     * _.isFinite(Infinity);\n\
     * // => false\n\
     */\n\
    function isFinite(value) {\n\
      return nativeIsFinite(value) && !nativeIsNaN(parseFloat(value));\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is a function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is a function, else `false`.\n\
     * @example\n\
     *\n\
     * _.isFunction(_);\n\
     * // => true\n\
     */\n\
    function isFunction(value) {\n\
      return typeof value == 'function';\n\
    }\n\
    // fallback for older versions of Chrome and Safari\n\
    if (isFunction(/x/)) {\n\
      isFunction = function(value) {\n\
        return typeof value == 'function' && toString.call(value) == funcClass;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is the language type of Object.\n\
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is an object, else `false`.\n\
     * @example\n\
     *\n\
     * _.isObject({});\n\
     * // => true\n\
     *\n\
     * _.isObject([1, 2, 3]);\n\
     * // => true\n\
     *\n\
     * _.isObject(1);\n\
     * // => false\n\
     */\n\
    function isObject(value) {\n\
      // check if the value is the ECMAScript language type of Object\n\
      // http://es5.github.io/#x8\n\
      // and avoid a V8 bug\n\
      // http://code.google.com/p/v8/issues/detail?id=2291\n\
      return !!(value && objectTypes[typeof value]);\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is `NaN`.\n\
     *\n\
     * Note: This is not the same as native `isNaN` which will return `true` for\n\
     * `undefined` and other non-numeric values. See http://es5.github.io/#x15.1.2.4.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is `NaN`, else `false`.\n\
     * @example\n\
     *\n\
     * _.isNaN(NaN);\n\
     * // => true\n\
     *\n\
     * _.isNaN(new Number(NaN));\n\
     * // => true\n\
     *\n\
     * isNaN(undefined);\n\
     * // => true\n\
     *\n\
     * _.isNaN(undefined);\n\
     * // => false\n\
     */\n\
    function isNaN(value) {\n\
      // `NaN` as a primitive is the only value that is not equal to itself\n\
      // (perform the [[Class]] check first to avoid errors with some host objects in IE)\n\
      return isNumber(value) && value != +value;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is `null`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is `null`, else `false`.\n\
     * @example\n\
     *\n\
     * _.isNull(null);\n\
     * // => true\n\
     *\n\
     * _.isNull(undefined);\n\
     * // => false\n\
     */\n\
    function isNull(value) {\n\
      return value === null;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is a number.\n\
     *\n\
     * Note: `NaN` is considered a number. See http://es5.github.io/#x8.5.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is a number, else `false`.\n\
     * @example\n\
     *\n\
     * _.isNumber(8.4 * 5);\n\
     * // => true\n\
     */\n\
    function isNumber(value) {\n\
      return typeof value == 'number' ||\n\
        value && typeof value == 'object' && toString.call(value) == numberClass || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is an object created by the `Object` constructor.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.\n\
     * @example\n\
     *\n\
     * function Shape() {\n\
     *   this.x = 0;\n\
     *   this.y = 0;\n\
     * }\n\
     *\n\
     * _.isPlainObject(new Shape);\n\
     * // => false\n\
     *\n\
     * _.isPlainObject([1, 2, 3]);\n\
     * // => false\n\
     *\n\
     * _.isPlainObject({ 'x': 0, 'y': 0 });\n\
     * // => true\n\
     */\n\
    var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function(value) {\n\
      if (!(value && toString.call(value) == objectClass) || (!support.argsClass && isArguments(value))) {\n\
        return false;\n\
      }\n\
      var valueOf = value.valueOf,\n\
          objProto = typeof valueOf == 'function' && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);\n\
\n\
      return objProto\n\
        ? (value == objProto || getPrototypeOf(value) == objProto)\n\
        : shimIsPlainObject(value);\n\
    };\n\
\n\
    /**\n\
     * Checks if `value` is a regular expression.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is a regular expression, else `false`.\n\
     * @example\n\
     *\n\
     * _.isRegExp(/fred/);\n\
     * // => true\n\
     */\n\
    function isRegExp(value) {\n\
      return value && objectTypes[typeof value] && toString.call(value) == regexpClass || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is a string.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is a string, else `false`.\n\
     * @example\n\
     *\n\
     * _.isString('fred');\n\
     * // => true\n\
     */\n\
    function isString(value) {\n\
      return typeof value == 'string' ||\n\
        value && typeof value == 'object' && toString.call(value) == stringClass || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is `undefined`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is `undefined`, else `false`.\n\
     * @example\n\
     *\n\
     * _.isUndefined(void 0);\n\
     * // => true\n\
     */\n\
    function isUndefined(value) {\n\
      return typeof value == 'undefined';\n\
    }\n\
\n\
    /**\n\
     * Recursively merges own enumerable properties of the source object(s), that\n\
     * don't resolve to `undefined` into the destination object. Subsequent sources\n\
     * will overwrite property assignments of previous sources. If a callback is\n\
     * provided it will be executed to produce the merged values of the destination\n\
     * and source properties. If the callback returns `undefined` merging will\n\
     * be handled by the method instead. The callback is bound to `thisArg` and\n\
     * invoked with two arguments; (objectValue, sourceValue).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The destination object.\n\
     * @param {...Object} [source] The source objects.\n\
     * @param {Function} [callback] The function to customize merging properties.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns the destination object.\n\
     * @example\n\
     *\n\
     * var names = {\n\
     *   'characters': [\n\
     *     { 'name': 'barney' },\n\
     *     { 'name': 'fred' }\n\
     *   ]\n\
     * };\n\
     *\n\
     * var ages = {\n\
     *   'characters': [\n\
     *     { 'age': 36 },\n\
     *     { 'age': 40 }\n\
     *   ]\n\
     * };\n\
     *\n\
     * _.merge(names, ages);\n\
     * // => { 'characters': [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred', 'age': 40 }] }\n\
     *\n\
     * var food = {\n\
     *   'fruits': ['apple'],\n\
     *   'vegetables': ['beet']\n\
     * };\n\
     *\n\
     * var otherFood = {\n\
     *   'fruits': ['banana'],\n\
     *   'vegetables': ['carrot']\n\
     * };\n\
     *\n\
     * _.merge(food, otherFood, function(a, b) {\n\
     *   return _.isArray(a) ? a.concat(b) : undefined;\n\
     * });\n\
     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot] }\n\
     */\n\
    function merge(object) {\n\
      var args = arguments,\n\
          length = 2;\n\
\n\
      if (!isObject(object)) {\n\
        return object;\n\
      }\n\
      // allows working with `_.reduce` and `_.reduceRight` without using\n\
      // their `index` and `collection` arguments\n\
      if (typeof args[2] != 'number') {\n\
        length = args.length;\n\
      }\n\
      if (length > 3 && typeof args[length - 2] == 'function') {\n\
        var callback = baseCreateCallback(args[--length - 1], args[length--], 2);\n\
      } else if (length > 2 && typeof args[length - 1] == 'function') {\n\
        callback = args[--length];\n\
      }\n\
      var sources = slice(arguments, 1, length),\n\
          index = -1,\n\
          stackA = getArray(),\n\
          stackB = getArray();\n\
\n\
      while (++index < length) {\n\
        baseMerge(object, sources[index], callback, stackA, stackB);\n\
      }\n\
      releaseArray(stackA);\n\
      releaseArray(stackB);\n\
      return object;\n\
    }\n\
\n\
    /**\n\
     * Creates a shallow clone of `object` excluding the specified properties.\n\
     * Property names may be specified as individual arguments or as arrays of\n\
     * property names. If a callback is provided it will be executed for each\n\
     * property of `object` omitting the properties the callback returns truey\n\
     * for. The callback is bound to `thisArg` and invoked with three arguments;\n\
     * (value, key, object).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The source object.\n\
     * @param {Function|...string|string[]} [callback] The properties to omit or the\n\
     *  function called per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns an object without the omitted properties.\n\
     * @example\n\
     *\n\
     * _.omit({ 'name': 'fred', 'age': 40 }, 'age');\n\
     * // => { 'name': 'fred' }\n\
     *\n\
     * _.omit({ 'name': 'fred', 'age': 40 }, function(value) {\n\
     *   return typeof value == 'number';\n\
     * });\n\
     * // => { 'name': 'fred' }\n\
     */\n\
    function omit(object, callback, thisArg) {\n\
      var indexOf = getIndexOf(),\n\
          isFunc = typeof callback == 'function',\n\
          result = {};\n\
\n\
      if (isFunc) {\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
      } else {\n\
        var props = baseFlatten(arguments, true, false, 1);\n\
      }\n\
      forIn(object, function(value, key, object) {\n\
        if (isFunc\n\
              ? !callback(value, key, object)\n\
              : indexOf(props, key) < 0\n\
            ) {\n\
          result[key] = value;\n\
        }\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates a two dimensional array of an object's key-value pairs,\n\
     * i.e. `[[key1, value1], [key2, value2]]`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to inspect.\n\
     * @returns {Array} Returns new array of key-value pairs.\n\
     * @example\n\
     *\n\
     * _.pairs({ 'barney': 36, 'fred': 40 });\n\
     * // => [['barney', 36], ['fred', 40]] (property order is not guaranteed across environments)\n\
     */\n\
    function pairs(object) {\n\
      var index = -1,\n\
          props = keys(object),\n\
          length = props.length,\n\
          result = Array(length);\n\
\n\
      while (++index < length) {\n\
        var key = props[index];\n\
        result[index] = [key, object[key]];\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates a shallow clone of `object` composed of the specified properties.\n\
     * Property names may be specified as individual arguments or as arrays of\n\
     * property names. If a callback is provided it will be executed for each\n\
     * property of `object` picking the properties the callback returns truey\n\
     * for. The callback is bound to `thisArg` and invoked with three arguments;\n\
     * (value, key, object).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The source object.\n\
     * @param {Function|...string|string[]} [callback] The function called per\n\
     *  iteration or property names to pick, specified as individual property\n\
     *  names or arrays of property names.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns an object composed of the picked properties.\n\
     * @example\n\
     *\n\
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, 'name');\n\
     * // => { 'name': 'fred' }\n\
     *\n\
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, function(value, key) {\n\
     *   return key.charAt(0) != '_';\n\
     * });\n\
     * // => { 'name': 'fred' }\n\
     */\n\
    function pick(object, callback, thisArg) {\n\
      var result = {};\n\
      if (typeof callback != 'function') {\n\
        var index = -1,\n\
            props = baseFlatten(arguments, true, false, 1),\n\
            length = isObject(object) ? props.length : 0;\n\
\n\
        while (++index < length) {\n\
          var key = props[index];\n\
          if (key in object) {\n\
            result[key] = object[key];\n\
          }\n\
        }\n\
      } else {\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
        forIn(object, function(value, key, object) {\n\
          if (callback(value, key, object)) {\n\
            result[key] = value;\n\
          }\n\
        });\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * An alternative to `_.reduce` this method transforms `object` to a new\n\
     * `accumulator` object which is the result of running each of its elements\n\
     * through a callback, with each callback execution potentially mutating\n\
     * the `accumulator` object. The callback is bound to `thisArg` and invoked\n\
     * with four arguments; (accumulator, value, key, object). Callbacks may exit\n\
     * iteration early by explicitly returning `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Array|Object} object The object to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [accumulator] The custom accumulator value.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the accumulated value.\n\
     * @example\n\
     *\n\
     * var squares = _.transform([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function(result, num) {\n\
     *   num *= num;\n\
     *   if (num % 2) {\n\
     *     return result.push(num) < 3;\n\
     *   }\n\
     * });\n\
     * // => [1, 9, 25]\n\
     *\n\
     * var mapped = _.transform({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {\n\
     *   result[key] = num * 3;\n\
     * });\n\
     * // => { 'a': 3, 'b': 6, 'c': 9 }\n\
     */\n\
    function transform(object, callback, accumulator, thisArg) {\n\
      var isArr = isArray(object);\n\
      if (accumulator == null) {\n\
        if (isArr) {\n\
          accumulator = [];\n\
        } else {\n\
          var ctor = object && object.constructor,\n\
              proto = ctor && ctor.prototype;\n\
\n\
          accumulator = baseCreate(proto);\n\
        }\n\
      }\n\
      if (callback) {\n\
        callback = baseCreateCallback(callback, thisArg, 4);\n\
        (isArr ? baseEach : forOwn)(object, function(value, index, object) {\n\
          return callback(accumulator, value, index, object);\n\
        });\n\
      }\n\
      return accumulator;\n\
    }\n\
\n\
    /**\n\
     * Creates an array composed of the own enumerable property values of `object`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to inspect.\n\
     * @returns {Array} Returns an array of property values.\n\
     * @example\n\
     *\n\
     * _.values({ 'one': 1, 'two': 2, 'three': 3 });\n\
     * // => [1, 2, 3] (property order is not guaranteed across environments)\n\
     */\n\
    function values(object) {\n\
      var index = -1,\n\
          props = keys(object),\n\
          length = props.length,\n\
          result = Array(length);\n\
\n\
      while (++index < length) {\n\
        result[index] = object[props[index]];\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Creates an array of elements from the specified indexes, or keys, of the\n\
     * `collection`. Indexes may be specified as individual arguments or as arrays\n\
     * of indexes.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {...(number|number[]|string|string[])} [index] The indexes of `collection`\n\
     *   to retrieve, specified as individual indexes or arrays of indexes.\n\
     * @returns {Array} Returns a new array of elements corresponding to the\n\
     *  provided indexes.\n\
     * @example\n\
     *\n\
     * _.at(['a', 'b', 'c', 'd', 'e'], [0, 2, 4]);\n\
     * // => ['a', 'c', 'e']\n\
     *\n\
     * _.at(['fred', 'barney', 'pebbles'], 0, 2);\n\
     * // => ['fred', 'pebbles']\n\
     */\n\
    function at(collection) {\n\
      var args = arguments,\n\
          index = -1,\n\
          props = baseFlatten(args, true, false, 1),\n\
          length = (args[2] && args[2][args[1]] === collection) ? 1 : props.length,\n\
          result = Array(length);\n\
\n\
      if (support.unindexedChars && isString(collection)) {\n\
        collection = collection.split('');\n\
      }\n\
      while(++index < length) {\n\
        result[index] = collection[props[index]];\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Checks if a given value is present in a collection using strict equality\n\
     * for comparisons, i.e. `===`. If `fromIndex` is negative, it is used as the\n\
     * offset from the end of the collection.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias include\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {*} target The value to check for.\n\
     * @param {number} [fromIndex=0] The index to search from.\n\
     * @returns {boolean} Returns `true` if the `target` element is found, else `false`.\n\
     * @example\n\
     *\n\
     * _.contains([1, 2, 3], 1);\n\
     * // => true\n\
     *\n\
     * _.contains([1, 2, 3], 1, 2);\n\
     * // => false\n\
     *\n\
     * _.contains({ 'name': 'fred', 'age': 40 }, 'fred');\n\
     * // => true\n\
     *\n\
     * _.contains('pebbles', 'ur');\n\
     * // => true\n\
     */\n\
    function contains(collection, target, fromIndex) {\n\
      var index = -1,\n\
          indexOf = getIndexOf(),\n\
          length = collection ? collection.length : 0,\n\
          result = false;\n\
\n\
      fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex) || 0;\n\
      if (isArray(collection)) {\n\
        result = indexOf(collection, target, fromIndex) > -1;\n\
      } else if (typeof length == 'number') {\n\
        result = (isString(collection) ? collection.indexOf(target, fromIndex) : indexOf(collection, target, fromIndex)) > -1;\n\
      } else {\n\
        baseEach(collection, function(value) {\n\
          if (++index >= fromIndex) {\n\
            return !(result = value === target);\n\
          }\n\
        });\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates an object composed of keys generated from the results of running\n\
     * each element of `collection` through the callback. The corresponding value\n\
     * of each key is the number of times the key was returned by the callback.\n\
     * The callback is bound to `thisArg` and invoked with three arguments;\n\
     * (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns the composed aggregate object.\n\
     * @example\n\
     *\n\
     * _.countBy([4.3, 6.1, 6.4], function(num) { return Math.floor(num); });\n\
     * // => { '4': 1, '6': 2 }\n\
     *\n\
     * _.countBy([4.3, 6.1, 6.4], function(num) { return this.floor(num); }, Math);\n\
     * // => { '4': 1, '6': 2 }\n\
     *\n\
     * _.countBy(['one', 'two', 'three'], 'length');\n\
     * // => { '3': 2, '5': 1 }\n\
     */\n\
    var countBy = createAggregator(function(result, value, key) {\n\
      (hasOwnProperty.call(result, key) ? result[key]++ : result[key] = 1);\n\
    });\n\
\n\
    /**\n\
     * Checks if the given callback returns truey value for **all** elements of\n\
     * a collection. The callback is bound to `thisArg` and invoked with three\n\
     * arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias all\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {boolean} Returns `true` if all elements passed the callback check,\n\
     *  else `false`.\n\
     * @example\n\
     *\n\
     * _.every([true, 1, null, 'yes']);\n\
     * // => false\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.every(characters, 'age');\n\
     * // => true\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.every(characters, { 'age': 36 });\n\
     * // => false\n\
     */\n\
    function every(collection, callback, thisArg) {\n\
      var result = true;\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
\n\
      if (isArray(collection)) {\n\
        var index = -1,\n\
            length = collection.length;\n\
\n\
        while (++index < length) {\n\
          if (!(result = !!callback(collection[index], index, collection))) {\n\
            break;\n\
          }\n\
        }\n\
      } else {\n\
        baseEach(collection, function(value, index, collection) {\n\
          return (result = !!callback(value, index, collection));\n\
        });\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Iterates over elements of a collection, returning an array of all elements\n\
     * the callback returns truey for. The callback is bound to `thisArg` and\n\
     * invoked with three arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias select\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a new array of elements that passed the callback check.\n\
     * @example\n\
     *\n\
     * var evens = _.filter([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });\n\
     * // => [2, 4, 6]\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36, 'blocked': false },\n\
     *   { 'name': 'fred',   'age': 40, 'blocked': true }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.filter(characters, 'blocked');\n\
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.filter(characters, { 'age': 36 });\n\
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]\n\
     */\n\
    function filter(collection, callback, thisArg) {\n\
      var result = [];\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
\n\
      if (isArray(collection)) {\n\
        var index = -1,\n\
            length = collection.length;\n\
\n\
        while (++index < length) {\n\
          var value = collection[index];\n\
          if (callback(value, index, collection)) {\n\
            result.push(value);\n\
          }\n\
        }\n\
      } else {\n\
        baseEach(collection, function(value, index, collection) {\n\
          if (callback(value, index, collection)) {\n\
            result.push(value);\n\
          }\n\
        });\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Iterates over elements of a collection, returning the first element that\n\
     * the callback returns truey for. The callback is bound to `thisArg` and\n\
     * invoked with three arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias detect, findWhere\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the found element, else `undefined`.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'age': 36, 'blocked': false },\n\
     *   { 'name': 'fred',    'age': 40, 'blocked': true },\n\
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }\n\
     * ];\n\
     *\n\
     * _.find(characters, function(chr) {\n\
     *   return chr.age < 40;\n\
     * });\n\
     * // => { 'name': 'barney', 'age': 36, 'blocked': false }\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.find(characters, { 'age': 1 });\n\
     * // =>  { 'name': 'pebbles', 'age': 1, 'blocked': false }\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.find(characters, 'blocked');\n\
     * // => { 'name': 'fred', 'age': 40, 'blocked': true }\n\
     */\n\
    function find(collection, callback, thisArg) {\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
\n\
      if (isArray(collection)) {\n\
        var index = -1,\n\
            length = collection.length;\n\
\n\
        while (++index < length) {\n\
          var value = collection[index];\n\
          if (callback(value, index, collection)) {\n\
            return value;\n\
          }\n\
        }\n\
      } else {\n\
        var result;\n\
        baseEach(collection, function(value, index, collection) {\n\
          if (callback(value, index, collection)) {\n\
            result = value;\n\
            return false;\n\
          }\n\
        });\n\
        return result;\n\
      }\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.find` except that it iterates over elements\n\
     * of a `collection` from right to left.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the found element, else `undefined`.\n\
     * @example\n\
     *\n\
     * _.findLast([1, 2, 3, 4], function(num) {\n\
     *   return num % 2 == 1;\n\
     * });\n\
     * // => 3\n\
     */\n\
    function findLast(collection, callback, thisArg) {\n\
      var result;\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      forEachRight(collection, function(value, index, collection) {\n\
        if (callback(value, index, collection)) {\n\
          result = value;\n\
          return false;\n\
        }\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Iterates over elements of a collection, executing the callback for each\n\
     * element. The callback is bound to `thisArg` and invoked with three arguments;\n\
     * (value, index|key, collection). Callbacks may exit iteration early by\n\
     * explicitly returning `false`.\n\
     *\n\
     * Note: As with other \"Collections\" methods, objects with a `length` property\n\
     * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`\n\
     * may be used for object iteration.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias each\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array|Object|string} Returns `collection`.\n\
     * @example\n\
     *\n\
     * _([1, 2, 3]).forEach(function(num) { console.log(num); }).join(',');\n\
     * // => logs each number and returns '1,2,3'\n\
     *\n\
     * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { console.log(num); });\n\
     * // => logs each number and returns the object (property order is not guaranteed across environments)\n\
     */\n\
    function forEach(collection, callback, thisArg) {\n\
      if (callback && typeof thisArg == 'undefined' && isArray(collection)) {\n\
        var index = -1,\n\
            length = collection.length;\n\
\n\
        while (++index < length) {\n\
          if (callback(collection[index], index, collection) === false) {\n\
            break;\n\
          }\n\
        }\n\
      } else {\n\
        baseEach(collection, callback, thisArg);\n\
      }\n\
      return collection;\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.forEach` except that it iterates over elements\n\
     * of a `collection` from right to left.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias eachRight\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array|Object|string} Returns `collection`.\n\
     * @example\n\
     *\n\
     * _([1, 2, 3]).forEachRight(function(num) { console.log(num); }).join(',');\n\
     * // => logs each number from right to left and returns '3,2,1'\n\
     */\n\
    function forEachRight(collection, callback, thisArg) {\n\
      var iterable = collection,\n\
          length = collection ? collection.length : 0;\n\
\n\
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);\n\
      if (isArray(collection)) {\n\
        while (length--) {\n\
          if (callback(collection[length], length, collection) === false) {\n\
            break;\n\
          }\n\
        }\n\
      } else {\n\
        if (typeof length != 'number') {\n\
          var props = keys(collection);\n\
          length = props.length;\n\
        } else if (support.unindexedChars && isString(collection)) {\n\
          iterable = collection.split('');\n\
        }\n\
        baseEach(collection, function(value, key, collection) {\n\
          key = props ? props[--length] : --length;\n\
          return callback(iterable[key], key, collection);\n\
        });\n\
      }\n\
      return collection;\n\
    }\n\
\n\
    /**\n\
     * Creates an object composed of keys generated from the results of running\n\
     * each element of a collection through the callback. The corresponding value\n\
     * of each key is an array of the elements responsible for generating the key.\n\
     * The callback is bound to `thisArg` and invoked with three arguments;\n\
     * (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns the composed aggregate object.\n\
     * @example\n\
     *\n\
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return Math.floor(num); });\n\
     * // => { '4': [4.2], '6': [6.1, 6.4] }\n\
     *\n\
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return this.floor(num); }, Math);\n\
     * // => { '4': [4.2], '6': [6.1, 6.4] }\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.groupBy(['one', 'two', 'three'], 'length');\n\
     * // => { '3': ['one', 'two'], '5': ['three'] }\n\
     */\n\
    var groupBy = createAggregator(function(result, value, key) {\n\
      (hasOwnProperty.call(result, key) ? result[key] : result[key] = []).push(value);\n\
    });\n\
\n\
    /**\n\
     * Creates an object composed of keys generated from the results of running\n\
     * each element of the collection through the given callback. The corresponding\n\
     * value of each key is the last element responsible for generating the key.\n\
     * The callback is bound to `thisArg` and invoked with three arguments;\n\
     * (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns the composed aggregate object.\n\
     * @example\n\
     *\n\
     * var keys = [\n\
     *   { 'dir': 'left', 'code': 97 },\n\
     *   { 'dir': 'right', 'code': 100 }\n\
     * ];\n\
     *\n\
     * _.indexBy(keys, 'dir');\n\
     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }\n\
     *\n\
     * _.indexBy(keys, function(key) { return String.fromCharCode(key.code); });\n\
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }\n\
     *\n\
     * _.indexBy(characters, function(key) { this.fromCharCode(key.code); }, String);\n\
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }\n\
     */\n\
    var indexBy = createAggregator(function(result, value, key) {\n\
      result[key] = value;\n\
    });\n\
\n\
    /**\n\
     * Invokes the method named by `methodName` on each element in the `collection`\n\
     * returning an array of the results of each invoked method. Additional arguments\n\
     * will be provided to each invoked method. If `methodName` is a function it\n\
     * will be invoked for, and `this` bound to, each element in the `collection`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|string} methodName The name of the method to invoke or\n\
     *  the function invoked per iteration.\n\
     * @param {...*} [arg] Arguments to invoke the method with.\n\
     * @returns {Array} Returns a new array of the results of each invoked method.\n\
     * @example\n\
     *\n\
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');\n\
     * // => [[1, 5, 7], [1, 2, 3]]\n\
     *\n\
     * _.invoke([123, 456], String.prototype.split, '');\n\
     * // => [['1', '2', '3'], ['4', '5', '6']]\n\
     */\n\
    function invoke(collection, methodName) {\n\
      var args = slice(arguments, 2),\n\
          index = -1,\n\
          isFunc = typeof methodName == 'function',\n\
          length = collection ? collection.length : 0,\n\
          result = Array(typeof length == 'number' ? length : 0);\n\
\n\
      forEach(collection, function(value) {\n\
        result[++index] = (isFunc ? methodName : value[methodName]).apply(value, args);\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates an array of values by running each element in the collection\n\
     * through the callback. The callback is bound to `thisArg` and invoked with\n\
     * three arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias collect\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a new array of the results of each `callback` execution.\n\
     * @example\n\
     *\n\
     * _.map([1, 2, 3], function(num) { return num * 3; });\n\
     * // => [3, 6, 9]\n\
     *\n\
     * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { return num * 3; });\n\
     * // => [3, 6, 9] (property order is not guaranteed across environments)\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.map(characters, 'name');\n\
     * // => ['barney', 'fred']\n\
     */\n\
    function map(collection, callback, thisArg) {\n\
      var index = -1,\n\
          length = collection ? collection.length : 0,\n\
          result = Array(typeof length == 'number' ? length : 0);\n\
\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      if (isArray(collection)) {\n\
        while (++index < length) {\n\
          result[index] = callback(collection[index], index, collection);\n\
        }\n\
      } else {\n\
        baseEach(collection, function(value, key, collection) {\n\
          result[++index] = callback(value, key, collection);\n\
        });\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Retrieves the maximum value of a collection. If the collection is empty or\n\
     * falsey `-Infinity` is returned. If a callback is provided it will be executed\n\
     * for each value in the collection to generate the criterion by which the value\n\
     * is ranked. The callback is bound to `thisArg` and invoked with three\n\
     * arguments; (value, index, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the maximum value.\n\
     * @example\n\
     *\n\
     * _.max([4, 2, 8, 6]);\n\
     * // => 8\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * _.max(characters, function(chr) { return chr.age; });\n\
     * // => { 'name': 'fred', 'age': 40 };\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.max(characters, 'age');\n\
     * // => { 'name': 'fred', 'age': 40 };\n\
     */\n\
    function max(collection, callback, thisArg) {\n\
      var computed = -Infinity,\n\
          result = computed;\n\
\n\
      if (!callback && isArray(collection)) {\n\
        var index = -1,\n\
            length = collection.length;\n\
\n\
        while (++index < length) {\n\
          var value = collection[index];\n\
          if (value > result) {\n\
            result = value;\n\
          }\n\
        }\n\
      } else {\n\
        callback = (!callback && isString(collection))\n\
          ? charAtCallback\n\
          : lodash.createCallback(callback, thisArg, 3);\n\
\n\
        baseEach(collection, function(value, index, collection) {\n\
          var current = callback(value, index, collection);\n\
          if (current > computed) {\n\
            computed = current;\n\
            result = value;\n\
          }\n\
        });\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Retrieves the minimum value of a collection. If the collection is empty or\n\
     * falsey `Infinity` is returned. If a callback is provided it will be executed\n\
     * for each value in the collection to generate the criterion by which the value\n\
     * is ranked. The callback is bound to `thisArg` and invoked with three\n\
     * arguments; (value, index, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the minimum value.\n\
     * @example\n\
     *\n\
     * _.min([4, 2, 8, 6]);\n\
     * // => 2\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * _.min(characters, function(chr) { return chr.age; });\n\
     * // => { 'name': 'barney', 'age': 36 };\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.min(characters, 'age');\n\
     * // => { 'name': 'barney', 'age': 36 };\n\
     */\n\
    function min(collection, callback, thisArg) {\n\
      var computed = Infinity,\n\
          result = computed;\n\
\n\
      if (!callback && isArray(collection)) {\n\
        var index = -1,\n\
            length = collection.length;\n\
\n\
        while (++index < length) {\n\
          var value = collection[index];\n\
          if (value < result) {\n\
            result = value;\n\
          }\n\
        }\n\
      } else {\n\
        callback = (!callback && isString(collection))\n\
          ? charAtCallback\n\
          : lodash.createCallback(callback, thisArg, 3);\n\
\n\
        baseEach(collection, function(value, index, collection) {\n\
          var current = callback(value, index, collection);\n\
          if (current < computed) {\n\
            computed = current;\n\
            result = value;\n\
          }\n\
        });\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Retrieves the value of a specified property from all elements in the collection.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {string} property The property to pluck.\n\
     * @returns {Array} Returns a new array of property values.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * _.pluck(characters, 'name');\n\
     * // => ['barney', 'fred']\n\
     */\n\
    var pluck = map;\n\
\n\
    /**\n\
     * Reduces a collection to a value which is the accumulated result of running\n\
     * each element in the collection through the callback, where each successive\n\
     * callback execution consumes the return value of the previous execution. If\n\
     * `accumulator` is not provided the first element of the collection will be\n\
     * used as the initial `accumulator` value. The callback is bound to `thisArg`\n\
     * and invoked with four arguments; (accumulator, value, index|key, collection).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias foldl, inject\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [accumulator] Initial value of the accumulator.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the accumulated value.\n\
     * @example\n\
     *\n\
     * var sum = _.reduce([1, 2, 3], function(sum, num) {\n\
     *   return sum + num;\n\
     * });\n\
     * // => 6\n\
     *\n\
     * var mapped = _.reduce({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {\n\
     *   result[key] = num * 3;\n\
     *   return result;\n\
     * }, {});\n\
     * // => { 'a': 3, 'b': 6, 'c': 9 }\n\
     */\n\
    function reduce(collection, callback, accumulator, thisArg) {\n\
      var noaccum = arguments.length < 3;\n\
      callback = baseCreateCallback(callback, thisArg, 4);\n\
\n\
      if (isArray(collection)) {\n\
        var index = -1,\n\
            length = collection.length;\n\
\n\
        if (noaccum) {\n\
          accumulator = collection[++index];\n\
        }\n\
        while (++index < length) {\n\
          accumulator = callback(accumulator, collection[index], index, collection);\n\
        }\n\
      } else {\n\
        baseEach(collection, function(value, index, collection) {\n\
          accumulator = noaccum\n\
            ? (noaccum = false, value)\n\
            : callback(accumulator, value, index, collection)\n\
        });\n\
      }\n\
      return accumulator;\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.reduce` except that it iterates over elements\n\
     * of a `collection` from right to left.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias foldr\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [accumulator] Initial value of the accumulator.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the accumulated value.\n\
     * @example\n\
     *\n\
     * var list = [[0, 1], [2, 3], [4, 5]];\n\
     * var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);\n\
     * // => [4, 5, 2, 3, 0, 1]\n\
     */\n\
    function reduceRight(collection, callback, accumulator, thisArg) {\n\
      var noaccum = arguments.length < 3;\n\
      callback = baseCreateCallback(callback, thisArg, 4);\n\
      forEachRight(collection, function(value, index, collection) {\n\
        accumulator = noaccum\n\
          ? (noaccum = false, value)\n\
          : callback(accumulator, value, index, collection);\n\
      });\n\
      return accumulator;\n\
    }\n\
\n\
    /**\n\
     * The opposite of `_.filter` this method returns the elements of a\n\
     * collection that the callback does **not** return truey for.\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a new array of elements that failed the callback check.\n\
     * @example\n\
     *\n\
     * var odds = _.reject([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });\n\
     * // => [1, 3, 5]\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36, 'blocked': false },\n\
     *   { 'name': 'fred',   'age': 40, 'blocked': true }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.reject(characters, 'blocked');\n\
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.reject(characters, { 'age': 36 });\n\
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]\n\
     */\n\
    function reject(collection, callback, thisArg) {\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      return filter(collection, function(value, index, collection) {\n\
        return !callback(value, index, collection);\n\
      });\n\
    }\n\
\n\
    /**\n\
     * Retrieves a random element or `n` random elements from a collection.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to sample.\n\
     * @param {number} [n] The number of elements to sample.\n\
     * @param- {Object} [guard] Allows working with functions, like `_.map`,\n\
     *  without using their `key` and `object` arguments as sources.\n\
     * @returns {Array} Returns the random sample(s) of `collection`.\n\
     * @example\n\
     *\n\
     * _.sample([1, 2, 3, 4]);\n\
     * // => 2\n\
     *\n\
     * _.sample([1, 2, 3, 4], 2);\n\
     * // => [3, 1]\n\
     */\n\
    function sample(collection, n, guard) {\n\
      if (collection && typeof collection.length != 'number') {\n\
        collection = values(collection);\n\
      } else if (support.unindexedChars && isString(collection)) {\n\
        collection = collection.split('');\n\
      }\n\
      if (n == null || guard) {\n\
        return collection ? collection[baseRandom(0, collection.length - 1)] : undefined;\n\
      }\n\
      var result = shuffle(collection);\n\
      result.length = nativeMin(nativeMax(0, n), result.length);\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates an array of shuffled values, using a version of the Fisher-Yates\n\
     * shuffle. See http://en.wikipedia.org/wiki/Fisher-Yates_shuffle.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to shuffle.\n\
     * @returns {Array} Returns a new shuffled collection.\n\
     * @example\n\
     *\n\
     * _.shuffle([1, 2, 3, 4, 5, 6]);\n\
     * // => [4, 1, 6, 3, 5, 2]\n\
     */\n\
    function shuffle(collection) {\n\
      var index = -1,\n\
          length = collection ? collection.length : 0,\n\
          result = Array(typeof length == 'number' ? length : 0);\n\
\n\
      forEach(collection, function(value) {\n\
        var rand = baseRandom(0, ++index);\n\
        result[index] = result[rand];\n\
        result[rand] = value;\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Gets the size of the `collection` by returning `collection.length` for arrays\n\
     * and array-like objects or the number of own enumerable properties for objects.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to inspect.\n\
     * @returns {number} Returns `collection.length` or number of own enumerable properties.\n\
     * @example\n\
     *\n\
     * _.size([1, 2]);\n\
     * // => 2\n\
     *\n\
     * _.size({ 'one': 1, 'two': 2, 'three': 3 });\n\
     * // => 3\n\
     *\n\
     * _.size('pebbles');\n\
     * // => 5\n\
     */\n\
    function size(collection) {\n\
      var length = collection ? collection.length : 0;\n\
      return typeof length == 'number' ? length : keys(collection).length;\n\
    }\n\
\n\
    /**\n\
     * Checks if the callback returns a truey value for **any** element of a\n\
     * collection. The function returns as soon as it finds a passing value and\n\
     * does not iterate over the entire collection. The callback is bound to\n\
     * `thisArg` and invoked with three arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias any\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {boolean} Returns `true` if any element passed the callback check,\n\
     *  else `false`.\n\
     * @example\n\
     *\n\
     * _.some([null, 0, 'yes', false], Boolean);\n\
     * // => true\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36, 'blocked': false },\n\
     *   { 'name': 'fred',   'age': 40, 'blocked': true }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.some(characters, 'blocked');\n\
     * // => true\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.some(characters, { 'age': 1 });\n\
     * // => false\n\
     */\n\
    function some(collection, callback, thisArg) {\n\
      var result;\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
\n\
      if (isArray(collection)) {\n\
        var index = -1,\n\
            length = collection.length;\n\
\n\
        while (++index < length) {\n\
          if ((result = callback(collection[index], index, collection))) {\n\
            break;\n\
          }\n\
        }\n\
      } else {\n\
        baseEach(collection, function(value, index, collection) {\n\
          return !(result = callback(value, index, collection));\n\
        });\n\
      }\n\
      return !!result;\n\
    }\n\
\n\
    /**\n\
     * Creates an array of elements, sorted in ascending order by the results of\n\
     * running each element in a collection through the callback. This method\n\
     * performs a stable sort, that is, it will preserve the original sort order\n\
     * of equal elements. The callback is bound to `thisArg` and invoked with\n\
     * three arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a new array of sorted elements.\n\
     * @example\n\
     *\n\
     * _.sortBy([1, 2, 3], function(num) { return Math.sin(num); });\n\
     * // => [3, 1, 2]\n\
     *\n\
     * _.sortBy([1, 2, 3], function(num) { return this.sin(num); }, Math);\n\
     * // => [3, 1, 2]\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.sortBy(['banana', 'strawberry', 'apple'], 'length');\n\
     * // => ['apple', 'banana', 'strawberry']\n\
     */\n\
    function sortBy(collection, callback, thisArg) {\n\
      var index = -1,\n\
          length = collection ? collection.length : 0,\n\
          result = Array(typeof length == 'number' ? length : 0);\n\
\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      forEach(collection, function(value, key, collection) {\n\
        var object = result[++index] = getObject();\n\
        object.criteria = callback(value, key, collection);\n\
        object.index = index;\n\
        object.value = value;\n\
      });\n\
\n\
      length = result.length;\n\
      result.sort(compareAscending);\n\
      while (length--) {\n\
        var object = result[length];\n\
        result[length] = object.value;\n\
        releaseObject(object);\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Converts the `collection` to an array.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to convert.\n\
     * @returns {Array} Returns the new converted array.\n\
     * @example\n\
     *\n\
     * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);\n\
     * // => [2, 3, 4]\n\
     */\n\
    function toArray(collection) {\n\
      if (collection && typeof collection.length == 'number') {\n\
        return (support.unindexedChars && isString(collection))\n\
          ? collection.split('')\n\
          : slice(collection);\n\
      }\n\
      return values(collection);\n\
    }\n\
\n\
    /**\n\
     * Performs a deep comparison of each element in a `collection` to the given\n\
     * `properties` object, returning an array of all elements that have equivalent\n\
     * property values.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Object} properties The object of property values to filter by.\n\
     * @returns {Array} Returns a new array of elements that have the given properties.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36, 'pets': ['hoppy'] },\n\
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }\n\
     * ];\n\
     *\n\
     * _.where(characters, { 'age': 36 });\n\
     * // => [{ 'name': 'barney', 'age': 36, 'pets': ['hoppy'] }]\n\
     *\n\
     * _.where(characters, { 'pets': ['dino'] });\n\
     * // => [{ 'name': 'fred', 'age': 40, 'pets': ['baby puss', 'dino'] }]\n\
     */\n\
    var where = filter;\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Creates an array with all falsey values removed. The values `false`, `null`,\n\
     * `0`, `\"\"`, `undefined`, and `NaN` are all falsey.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to compact.\n\
     * @returns {Array} Returns a new array of filtered values.\n\
     * @example\n\
     *\n\
     * _.compact([0, 1, false, 2, '', 3]);\n\
     * // => [1, 2, 3]\n\
     */\n\
    function compact(array) {\n\
      var index = -1,\n\
          length = array ? array.length : 0,\n\
          result = [];\n\
\n\
      while (++index < length) {\n\
        var value = array[index];\n\
        if (value) {\n\
          result.push(value);\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates an array excluding all values of the provided arrays using strict\n\
     * equality for comparisons, i.e. `===`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to process.\n\
     * @param {...Array} [array] The arrays of values to exclude.\n\
     * @returns {Array} Returns a new array of filtered values.\n\
     * @example\n\
     *\n\
     * _.difference([1, 2, 3, 4, 5], [5, 2, 10]);\n\
     * // => [1, 3, 4]\n\
     */\n\
    function difference(array) {\n\
      var index = -1,\n\
          indexOf = getIndexOf(),\n\
          length = array ? array.length : 0,\n\
          seen = baseFlatten(arguments, true, true, 1),\n\
          result = [];\n\
\n\
      var isLarge = length >= largeArraySize && indexOf === baseIndexOf;\n\
\n\
      if (isLarge) {\n\
        var cache = createCache(seen);\n\
        if (cache) {\n\
          indexOf = cacheIndexOf;\n\
          seen = cache;\n\
        } else {\n\
          isLarge = false;\n\
        }\n\
      }\n\
      while (++index < length) {\n\
        var value = array[index];\n\
        if (indexOf(seen, value) < 0) {\n\
          result.push(value);\n\
        }\n\
      }\n\
      if (isLarge) {\n\
        releaseObject(seen);\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.find` except that it returns the index of the first\n\
     * element that passes the callback check, instead of the element itself.\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to search.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {number} Returns the index of the found element, else `-1`.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'age': 36, 'blocked': false },\n\
     *   { 'name': 'fred',    'age': 40, 'blocked': true },\n\
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }\n\
     * ];\n\
     *\n\
     * _.findIndex(characters, function(chr) {\n\
     *   return chr.age < 20;\n\
     * });\n\
     * // => 2\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.findIndex(characters, { 'age': 36 });\n\
     * // => 0\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.findIndex(characters, 'blocked');\n\
     * // => 1\n\
     */\n\
    function findIndex(array, callback, thisArg) {\n\
      var index = -1,\n\
          length = array ? array.length : 0;\n\
\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      while (++index < length) {\n\
        if (callback(array[index], index, array)) {\n\
          return index;\n\
        }\n\
      }\n\
      return -1;\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.findIndex` except that it iterates over elements\n\
     * of a `collection` from right to left.\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to search.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {number} Returns the index of the found element, else `-1`.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'age': 36, 'blocked': true },\n\
     *   { 'name': 'fred',    'age': 40, 'blocked': false },\n\
     *   { 'name': 'pebbles', 'age': 1,  'blocked': true }\n\
     * ];\n\
     *\n\
     * _.findLastIndex(characters, function(chr) {\n\
     *   return chr.age > 30;\n\
     * });\n\
     * // => 1\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.findLastIndex(characters, { 'age': 36 });\n\
     * // => 0\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.findLastIndex(characters, 'blocked');\n\
     * // => 2\n\
     */\n\
    function findLastIndex(array, callback, thisArg) {\n\
      var length = array ? array.length : 0;\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      while (length--) {\n\
        if (callback(array[length], length, array)) {\n\
          return length;\n\
        }\n\
      }\n\
      return -1;\n\
    }\n\
\n\
    /**\n\
     * Gets the first element or first `n` elements of an array. If a callback\n\
     * is provided elements at the beginning of the array are returned as long\n\
     * as the callback returns truey. The callback is bound to `thisArg` and\n\
     * invoked with three arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias head, take\n\
     * @category Arrays\n\
     * @param {Array} array The array to query.\n\
     * @param {Function|Object|number|string} [callback] The function called\n\
     *  per element or the number of elements to return. If a property name or\n\
     *  object is provided it will be used to create a \"_.pluck\" or \"_.where\"\n\
     *  style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the first element(s) of `array`.\n\
     * @example\n\
     *\n\
     * _.first([1, 2, 3]);\n\
     * // => 1\n\
     *\n\
     * _.first([1, 2, 3], 2);\n\
     * // => [1, 2]\n\
     *\n\
     * _.first([1, 2, 3], function(num) {\n\
     *   return num < 3;\n\
     * });\n\
     * // => [1, 2]\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },\n\
     *   { 'name': 'fred',    'blocked': false, 'employer': 'slate' },\n\
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.first(characters, 'blocked');\n\
     * // => [{ 'name': 'barney', 'blocked': true, 'employer': 'slate' }]\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.pluck(_.first(characters, { 'employer': 'slate' }), 'name');\n\
     * // => ['barney', 'fred']\n\
     */\n\
    function first(array, callback, thisArg) {\n\
      var n = 0,\n\
          length = array ? array.length : 0;\n\
\n\
      if (typeof callback != 'number' && callback != null) {\n\
        var index = -1;\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
        while (++index < length && callback(array[index], index, array)) {\n\
          n++;\n\
        }\n\
      } else {\n\
        n = callback;\n\
        if (n == null || thisArg) {\n\
          return array ? array[0] : undefined;\n\
        }\n\
      }\n\
      return slice(array, 0, nativeMin(nativeMax(0, n), length));\n\
    }\n\
\n\
    /**\n\
     * Flattens a nested array (the nesting can be to any depth). If `isShallow`\n\
     * is truey, the array will only be flattened a single level. If a callback\n\
     * is provided each element of the array is passed through the callback before\n\
     * flattening. The callback is bound to `thisArg` and invoked with three\n\
     * arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to flatten.\n\
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a new flattened array.\n\
     * @example\n\
     *\n\
     * _.flatten([1, [2], [3, [[4]]]]);\n\
     * // => [1, 2, 3, 4];\n\
     *\n\
     * _.flatten([1, [2], [3, [[4]]]], true);\n\
     * // => [1, 2, 3, [[4]]];\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 30, 'pets': ['hoppy'] },\n\
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.flatten(characters, 'pets');\n\
     * // => ['hoppy', 'baby puss', 'dino']\n\
     */\n\
    function flatten(array, isShallow, callback, thisArg) {\n\
      // juggle arguments\n\
      if (typeof isShallow != 'boolean' && isShallow != null) {\n\
        thisArg = callback;\n\
        callback = !(thisArg && thisArg[isShallow] === array) ? isShallow : null;\n\
        isShallow = false;\n\
      }\n\
      if (callback != null) {\n\
        array = map(array, callback, thisArg);\n\
      }\n\
      return baseFlatten(array, isShallow);\n\
    }\n\
\n\
    /**\n\
     * Gets the index at which the first occurrence of `value` is found using\n\
     * strict equality for comparisons, i.e. `===`. If the array is already sorted\n\
     * providing `true` for `fromIndex` will run a faster binary search.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to search.\n\
     * @param {*} value The value to search for.\n\
     * @param {boolean|number} [fromIndex=0] The index to search from or `true`\n\
     *  to perform a binary search on a sorted array.\n\
     * @returns {number} Returns the index of the matched value or `-1`.\n\
     * @example\n\
     *\n\
     * _.indexOf([1, 2, 3, 1, 2, 3], 2);\n\
     * // => 1\n\
     *\n\
     * _.indexOf([1, 2, 3, 1, 2, 3], 2, 3);\n\
     * // => 4\n\
     *\n\
     * _.indexOf([1, 1, 2, 2, 3, 3], 2, true);\n\
     * // => 2\n\
     */\n\
    function indexOf(array, value, fromIndex) {\n\
      if (typeof fromIndex == 'number') {\n\
        var length = array ? array.length : 0;\n\
        fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex || 0);\n\
      } else if (fromIndex) {\n\
        var index = sortedIndex(array, value);\n\
        return array[index] === value ? index : -1;\n\
      }\n\
      return baseIndexOf(array, value, fromIndex);\n\
    }\n\
\n\
    /**\n\
     * Gets all but the last element or last `n` elements of an array. If a\n\
     * callback is provided elements at the end of the array are excluded from\n\
     * the result as long as the callback returns truey. The callback is bound\n\
     * to `thisArg` and invoked with three arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to query.\n\
     * @param {Function|Object|number|string} [callback=1] The function called\n\
     *  per element or the number of elements to exclude. If a property name or\n\
     *  object is provided it will be used to create a \"_.pluck\" or \"_.where\"\n\
     *  style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a slice of `array`.\n\
     * @example\n\
     *\n\
     * _.initial([1, 2, 3]);\n\
     * // => [1, 2]\n\
     *\n\
     * _.initial([1, 2, 3], 2);\n\
     * // => [1]\n\
     *\n\
     * _.initial([1, 2, 3], function(num) {\n\
     *   return num > 1;\n\
     * });\n\
     * // => [1]\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },\n\
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },\n\
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.initial(characters, 'blocked');\n\
     * // => [{ 'name': 'barney',  'blocked': false, 'employer': 'slate' }]\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.pluck(_.initial(characters, { 'employer': 'na' }), 'name');\n\
     * // => ['barney', 'fred']\n\
     */\n\
    function initial(array, callback, thisArg) {\n\
      var n = 0,\n\
          length = array ? array.length : 0;\n\
\n\
      if (typeof callback != 'number' && callback != null) {\n\
        var index = length;\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
        while (index-- && callback(array[index], index, array)) {\n\
          n++;\n\
        }\n\
      } else {\n\
        n = (callback == null || thisArg) ? 1 : callback || n;\n\
      }\n\
      return slice(array, 0, nativeMin(nativeMax(0, length - n), length));\n\
    }\n\
\n\
    /**\n\
     * Creates an array of unique values present in all provided arrays using\n\
     * strict equality for comparisons, i.e. `===`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {...Array} [array] The arrays to inspect.\n\
     * @returns {Array} Returns an array of composite values.\n\
     * @example\n\
     *\n\
     * _.intersection([1, 2, 3], [101, 2, 1, 10], [2, 1]);\n\
     * // => [1, 2]\n\
     */\n\
    function intersection(array) {\n\
      var args = arguments,\n\
          argsLength = args.length,\n\
          argsIndex = -1,\n\
          caches = getArray(),\n\
          index = -1,\n\
          indexOf = getIndexOf(),\n\
          length = array ? array.length : 0,\n\
          result = [],\n\
          seen = getArray();\n\
\n\
      while (++argsIndex < argsLength) {\n\
        var value = args[argsIndex];\n\
        caches[argsIndex] = indexOf === baseIndexOf &&\n\
          (value ? value.length : 0) >= largeArraySize &&\n\
          createCache(argsIndex ? args[argsIndex] : seen);\n\
      }\n\
      outer:\n\
      while (++index < length) {\n\
        var cache = caches[0];\n\
        value = array[index];\n\
\n\
        if ((cache ? cacheIndexOf(cache, value) : indexOf(seen, value)) < 0) {\n\
          argsIndex = argsLength;\n\
          (cache || seen).push(value);\n\
          while (--argsIndex) {\n\
            cache = caches[argsIndex];\n\
            if ((cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value)) < 0) {\n\
              continue outer;\n\
            }\n\
          }\n\
          result.push(value);\n\
        }\n\
      }\n\
      while (argsLength--) {\n\
        cache = caches[argsLength];\n\
        if (cache) {\n\
          releaseObject(cache);\n\
        }\n\
      }\n\
      releaseArray(caches);\n\
      releaseArray(seen);\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Gets the last element or last `n` elements of an array. If a callback is\n\
     * provided elements at the end of the array are returned as long as the\n\
     * callback returns truey. The callback is bound to `thisArg` and invoked\n\
     * with three arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to query.\n\
     * @param {Function|Object|number|string} [callback] The function called\n\
     *  per element or the number of elements to return. If a property name or\n\
     *  object is provided it will be used to create a \"_.pluck\" or \"_.where\"\n\
     *  style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the last element(s) of `array`.\n\
     * @example\n\
     *\n\
     * _.last([1, 2, 3]);\n\
     * // => 3\n\
     *\n\
     * _.last([1, 2, 3], 2);\n\
     * // => [2, 3]\n\
     *\n\
     * _.last([1, 2, 3], function(num) {\n\
     *   return num > 1;\n\
     * });\n\
     * // => [2, 3]\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },\n\
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },\n\
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.pluck(_.last(characters, 'blocked'), 'name');\n\
     * // => ['fred', 'pebbles']\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.last(characters, { 'employer': 'na' });\n\
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]\n\
     */\n\
    function last(array, callback, thisArg) {\n\
      var n = 0,\n\
          length = array ? array.length : 0;\n\
\n\
      if (typeof callback != 'number' && callback != null) {\n\
        var index = length;\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
        while (index-- && callback(array[index], index, array)) {\n\
          n++;\n\
        }\n\
      } else {\n\
        n = callback;\n\
        if (n == null || thisArg) {\n\
          return array ? array[length - 1] : undefined;\n\
        }\n\
      }\n\
      return slice(array, nativeMax(0, length - n));\n\
    }\n\
\n\
    /**\n\
     * Gets the index at which the last occurrence of `value` is found using strict\n\
     * equality for comparisons, i.e. `===`. If `fromIndex` is negative, it is used\n\
     * as the offset from the end of the collection.\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to search.\n\
     * @param {*} value The value to search for.\n\
     * @param {number} [fromIndex=array.length-1] The index to search from.\n\
     * @returns {number} Returns the index of the matched value or `-1`.\n\
     * @example\n\
     *\n\
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);\n\
     * // => 4\n\
     *\n\
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);\n\
     * // => 1\n\
     */\n\
    function lastIndexOf(array, value, fromIndex) {\n\
      var index = array ? array.length : 0;\n\
      if (typeof fromIndex == 'number') {\n\
        index = (fromIndex < 0 ? nativeMax(0, index + fromIndex) : nativeMin(fromIndex, index - 1)) + 1;\n\
      }\n\
      while (index--) {\n\
        if (array[index] === value) {\n\
          return index;\n\
        }\n\
      }\n\
      return -1;\n\
    }\n\
\n\
    /**\n\
     * Removes all provided values from the given array using strict equality for\n\
     * comparisons, i.e. `===`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to modify.\n\
     * @param {...*} [value] The values to remove.\n\
     * @returns {Array} Returns `array`.\n\
     * @example\n\
     *\n\
     * var array = [1, 2, 3, 1, 2, 3];\n\
     * _.pull(array, 2, 3);\n\
     * console.log(array);\n\
     * // => [1, 1]\n\
     */\n\
    function pull(array) {\n\
      var args = arguments,\n\
          argsIndex = 0,\n\
          argsLength = args.length,\n\
          length = array ? array.length : 0;\n\
\n\
      while (++argsIndex < argsLength) {\n\
        var index = -1,\n\
            value = args[argsIndex];\n\
        while (++index < length) {\n\
          if (array[index] === value) {\n\
            splice.call(array, index--, 1);\n\
            length--;\n\
          }\n\
        }\n\
      }\n\
      return array;\n\
    }\n\
\n\
    /**\n\
     * Creates an array of numbers (positive and/or negative) progressing from\n\
     * `start` up to but not including `end`. If `start` is less than `stop` a\n\
     * zero-length range is created unless a negative `step` is specified.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {number} [start=0] The start of the range.\n\
     * @param {number} end The end of the range.\n\
     * @param {number} [step=1] The value to increment or decrement by.\n\
     * @returns {Array} Returns a new range array.\n\
     * @example\n\
     *\n\
     * _.range(4);\n\
     * // => [0, 1, 2, 3]\n\
     *\n\
     * _.range(1, 5);\n\
     * // => [1, 2, 3, 4]\n\
     *\n\
     * _.range(0, 20, 5);\n\
     * // => [0, 5, 10, 15]\n\
     *\n\
     * _.range(0, -4, -1);\n\
     * // => [0, -1, -2, -3]\n\
     *\n\
     * _.range(1, 4, 0);\n\
     * // => [1, 1, 1]\n\
     *\n\
     * _.range(0);\n\
     * // => []\n\
     */\n\
    function range(start, end, step) {\n\
      start = +start || 0;\n\
      step = typeof step == 'number' ? step : (+step || 1);\n\
\n\
      if (end == null) {\n\
        end = start;\n\
        start = 0;\n\
      }\n\
      // use `Array(length)` so engines, like Chakra and V8, avoid slower modes\n\
      // http://youtu.be/XAqIpGU8ZZk#t=17m25s\n\
      var index = -1,\n\
          length = nativeMax(0, ceil((end - start) / (step || 1))),\n\
          result = Array(length);\n\
\n\
      while (++index < length) {\n\
        result[index] = start;\n\
        start += step;\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Removes all elements from an array that the callback returns truey for\n\
     * and returns an array of removed elements. The callback is bound to `thisArg`\n\
     * and invoked with three arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to modify.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a new array of removed elements.\n\
     * @example\n\
     *\n\
     * var array = [1, 2, 3, 4, 5, 6];\n\
     * var evens = _.remove(array, function(num) { return num % 2 == 0; });\n\
     *\n\
     * console.log(array);\n\
     * // => [1, 3, 5]\n\
     *\n\
     * console.log(evens);\n\
     * // => [2, 4, 6]\n\
     */\n\
    function remove(array, callback, thisArg) {\n\
      var index = -1,\n\
          length = array ? array.length : 0,\n\
          result = [];\n\
\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      while (++index < length) {\n\
        var value = array[index];\n\
        if (callback(value, index, array)) {\n\
          result.push(value);\n\
          splice.call(array, index--, 1);\n\
          length--;\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The opposite of `_.initial` this method gets all but the first element or\n\
     * first `n` elements of an array. If a callback function is provided elements\n\
     * at the beginning of the array are excluded from the result as long as the\n\
     * callback returns truey. The callback is bound to `thisArg` and invoked\n\
     * with three arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias drop, tail\n\
     * @category Arrays\n\
     * @param {Array} array The array to query.\n\
     * @param {Function|Object|number|string} [callback=1] The function called\n\
     *  per element or the number of elements to exclude. If a property name or\n\
     *  object is provided it will be used to create a \"_.pluck\" or \"_.where\"\n\
     *  style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a slice of `array`.\n\
     * @example\n\
     *\n\
     * _.rest([1, 2, 3]);\n\
     * // => [2, 3]\n\
     *\n\
     * _.rest([1, 2, 3], 2);\n\
     * // => [3]\n\
     *\n\
     * _.rest([1, 2, 3], function(num) {\n\
     *   return num < 3;\n\
     * });\n\
     * // => [3]\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },\n\
     *   { 'name': 'fred',    'blocked': false,  'employer': 'slate' },\n\
     *   { 'name': 'pebbles', 'blocked': true, 'employer': 'na' }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.pluck(_.rest(characters, 'blocked'), 'name');\n\
     * // => ['fred', 'pebbles']\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.rest(characters, { 'employer': 'slate' });\n\
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]\n\
     */\n\
    function rest(array, callback, thisArg) {\n\
      if (typeof callback != 'number' && callback != null) {\n\
        var n = 0,\n\
            index = -1,\n\
            length = array ? array.length : 0;\n\
\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
        while (++index < length && callback(array[index], index, array)) {\n\
          n++;\n\
        }\n\
      } else {\n\
        n = (callback == null || thisArg) ? 1 : nativeMax(0, callback);\n\
      }\n\
      return slice(array, n);\n\
    }\n\
\n\
    /**\n\
     * Uses a binary search to determine the smallest index at which a value\n\
     * should be inserted into a given sorted array in order to maintain the sort\n\
     * order of the array. If a callback is provided it will be executed for\n\
     * `value` and each element of `array` to compute their sort ranking. The\n\
     * callback is bound to `thisArg` and invoked with one argument; (value).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to inspect.\n\
     * @param {*} value The value to evaluate.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {number} Returns the index at which `value` should be inserted\n\
     *  into `array`.\n\
     * @example\n\
     *\n\
     * _.sortedIndex([20, 30, 50], 40);\n\
     * // => 2\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.sortedIndex([{ 'x': 20 }, { 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');\n\
     * // => 2\n\
     *\n\
     * var dict = {\n\
     *   'wordToNumber': { 'twenty': 20, 'thirty': 30, 'fourty': 40, 'fifty': 50 }\n\
     * };\n\
     *\n\
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {\n\
     *   return dict.wordToNumber[word];\n\
     * });\n\
     * // => 2\n\
     *\n\
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {\n\
     *   return this.wordToNumber[word];\n\
     * }, dict);\n\
     * // => 2\n\
     */\n\
    function sortedIndex(array, value, callback, thisArg) {\n\
      var low = 0,\n\
          high = array ? array.length : low;\n\
\n\
      // explicitly reference `identity` for better inlining in Firefox\n\
      callback = callback ? lodash.createCallback(callback, thisArg, 1) : identity;\n\
      value = callback(value);\n\
\n\
      while (low < high) {\n\
        var mid = (low + high) >>> 1;\n\
        (callback(array[mid]) < value)\n\
          ? low = mid + 1\n\
          : high = mid;\n\
      }\n\
      return low;\n\
    }\n\
\n\
    /**\n\
     * Creates an array of unique values, in order, of the provided arrays using\n\
     * strict equality for comparisons, i.e. `===`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {...Array} [array] The arrays to inspect.\n\
     * @returns {Array} Returns an array of composite values.\n\
     * @example\n\
     *\n\
     * _.union([1, 2, 3], [101, 2, 1, 10], [2, 1]);\n\
     * // => [1, 2, 3, 101, 10]\n\
     */\n\
    function union(array) {\n\
      return baseUniq(baseFlatten(arguments, true, true));\n\
    }\n\
\n\
    /**\n\
     * Creates a duplicate-value-free version of an array using strict equality\n\
     * for comparisons, i.e. `===`. If the array is sorted, providing\n\
     * `true` for `isSorted` will use a faster algorithm. If a callback is provided\n\
     * each element of `array` is passed through the callback before uniqueness\n\
     * is computed. The callback is bound to `thisArg` and invoked with three\n\
     * arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias unique\n\
     * @category Arrays\n\
     * @param {Array} array The array to process.\n\
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a duplicate-value-free array.\n\
     * @example\n\
     *\n\
     * _.uniq([1, 2, 1, 3, 1]);\n\
     * // => [1, 2, 3]\n\
     *\n\
     * _.uniq([1, 1, 2, 2, 3], true);\n\
     * // => [1, 2, 3]\n\
     *\n\
     * _.uniq(['A', 'b', 'C', 'a', 'B', 'c'], function(letter) { return letter.toLowerCase(); });\n\
     * // => ['A', 'b', 'C']\n\
     *\n\
     * _.uniq([1, 2.5, 3, 1.5, 2, 3.5], function(num) { return this.floor(num); }, Math);\n\
     * // => [1, 2.5, 3]\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');\n\
     * // => [{ 'x': 1 }, { 'x': 2 }]\n\
     */\n\
    function uniq(array, isSorted, callback, thisArg) {\n\
      // juggle arguments\n\
      if (typeof isSorted != 'boolean' && isSorted != null) {\n\
        thisArg = callback;\n\
        callback = !(thisArg && thisArg[isSorted] === array) ? isSorted : null;\n\
        isSorted = false;\n\
      }\n\
      if (callback != null) {\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
      }\n\
      return baseUniq(array, isSorted, callback);\n\
    }\n\
\n\
    /**\n\
     * Creates an array excluding all provided values using strict equality for\n\
     * comparisons, i.e. `===`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to filter.\n\
     * @param {...*} [value] The values to exclude.\n\
     * @returns {Array} Returns a new array of filtered values.\n\
     * @example\n\
     *\n\
     * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);\n\
     * // => [2, 3, 4]\n\
     */\n\
    function without(array) {\n\
      return difference(array, slice(arguments, 1));\n\
    }\n\
\n\
    /**\n\
     * Creates an array of grouped elements, the first of which contains the first\n\
     * elements of the given arrays, the second of which contains the second\n\
     * elements of the given arrays, and so on.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias unzip\n\
     * @category Arrays\n\
     * @param {...Array} [array] Arrays to process.\n\
     * @returns {Array} Returns a new array of grouped elements.\n\
     * @example\n\
     *\n\
     * _.zip(['fred', 'barney'], [30, 40], [true, false]);\n\
     * // => [['fred', 30, true], ['barney', 40, false]]\n\
     */\n\
    function zip() {\n\
      var array = arguments.length > 1 ? arguments : arguments[0],\n\
          index = -1,\n\
          length = array ? max(pluck(array, 'length')) : 0,\n\
          result = Array(length < 0 ? 0 : length);\n\
\n\
      while (++index < length) {\n\
        result[index] = pluck(array, index);\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates an object composed from arrays of `keys` and `values`. Provide\n\
     * either a single two dimensional array, i.e. `[[key1, value1], [key2, value2]]`\n\
     * or two arrays, one of `keys` and one of corresponding `values`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias object\n\
     * @category Arrays\n\
     * @param {Array} keys The array of keys.\n\
     * @param {Array} [values=[]] The array of values.\n\
     * @returns {Object} Returns an object composed of the given keys and\n\
     *  corresponding values.\n\
     * @example\n\
     *\n\
     * _.zipObject(['fred', 'barney'], [30, 40]);\n\
     * // => { 'fred': 30, 'barney': 40 }\n\
     */\n\
    function zipObject(keys, values) {\n\
      var index = -1,\n\
          length = keys ? keys.length : 0,\n\
          result = {};\n\
\n\
      while (++index < length) {\n\
        var key = keys[index];\n\
        if (values) {\n\
          result[key] = values[index];\n\
        } else if (key) {\n\
          result[key[0]] = key[1];\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Creates a function that executes `func`, with  the `this` binding and\n\
     * arguments of the created function, only after being called `n` times.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {number} n The number of times the function must be called before\n\
     *  `func` is executed.\n\
     * @param {Function} func The function to restrict.\n\
     * @returns {Function} Returns the new restricted function.\n\
     * @example\n\
     *\n\
     * var saves = ['profile', 'settings'];\n\
     *\n\
     * var done = _.after(saves.length, function() {\n\
     *   console.log('Done saving!');\n\
     * });\n\
     *\n\
     * _.forEach(saves, function(type) {\n\
     *   asyncSave({ 'type': type, 'complete': done });\n\
     * });\n\
     * // => logs 'Done saving!', after all saves have completed\n\
     */\n\
    function after(n, func) {\n\
      if (!isFunction(func)) {\n\
        throw new TypeError;\n\
      }\n\
      return function() {\n\
        if (--n < 1) {\n\
          return func.apply(this, arguments);\n\
        }\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Creates a function that, when called, invokes `func` with the `this`\n\
     * binding of `thisArg` and prepends any additional `bind` arguments to those\n\
     * provided to the bound function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to bind.\n\
     * @param {*} [thisArg] The `this` binding of `func`.\n\
     * @param {...*} [arg] Arguments to be partially applied.\n\
     * @returns {Function} Returns the new bound function.\n\
     * @example\n\
     *\n\
     * var func = function(greeting) {\n\
     *   return greeting + ' ' + this.name;\n\
     * };\n\
     *\n\
     * func = _.bind(func, { 'name': 'fred' }, 'hi');\n\
     * func();\n\
     * // => 'hi fred'\n\
     */\n\
    function bind(func, thisArg) {\n\
      return arguments.length > 2\n\
        ? createBound(func, 17, slice(arguments, 2), null, thisArg)\n\
        : createBound(func, 1, null, null, thisArg);\n\
    }\n\
\n\
    /**\n\
     * Binds methods of an object to the object itself, overwriting the existing\n\
     * method. Method names may be specified as individual arguments or as arrays\n\
     * of method names. If no method names are provided all the function properties\n\
     * of `object` will be bound.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Object} object The object to bind and assign the bound methods to.\n\
     * @param {...string} [methodName] The object method names to\n\
     *  bind, specified as individual method names or arrays of method names.\n\
     * @returns {Object} Returns `object`.\n\
     * @example\n\
     *\n\
     * var view = {\n\
     *  'label': 'docs',\n\
     *  'onClick': function() { console.log('clicked ' + this.label); }\n\
     * };\n\
     *\n\
     * _.bindAll(view);\n\
     * jQuery('#docs').on('click', view.onClick);\n\
     * // => logs 'clicked docs', when the button is clicked\n\
     */\n\
    function bindAll(object) {\n\
      var funcs = arguments.length > 1 ? baseFlatten(arguments, true, false, 1) : functions(object),\n\
          index = -1,\n\
          length = funcs.length;\n\
\n\
      while (++index < length) {\n\
        var key = funcs[index];\n\
        object[key] = createBound(object[key], 1, null, null, object);\n\
      }\n\
      return object;\n\
    }\n\
\n\
    /**\n\
     * Creates a function that, when called, invokes the method at `object[key]`\n\
     * and prepends any additional `bindKey` arguments to those provided to the bound\n\
     * function. This method differs from `_.bind` by allowing bound functions to\n\
     * reference methods that will be redefined or don't yet exist.\n\
     * See http://michaux.ca/articles/lazy-function-definition-pattern.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Object} object The object the method belongs to.\n\
     * @param {string} key The key of the method.\n\
     * @param {...*} [arg] Arguments to be partially applied.\n\
     * @returns {Function} Returns the new bound function.\n\
     * @example\n\
     *\n\
     * var object = {\n\
     *   'name': 'fred',\n\
     *   'greet': function(greeting) {\n\
     *     return greeting + ' ' + this.name;\n\
     *   }\n\
     * };\n\
     *\n\
     * var func = _.bindKey(object, 'greet', 'hi');\n\
     * func();\n\
     * // => 'hi fred'\n\
     *\n\
     * object.greet = function(greeting) {\n\
     *   return greeting + 'ya ' + this.name + '!';\n\
     * };\n\
     *\n\
     * func();\n\
     * // => 'hiya fred!'\n\
     */\n\
    function bindKey(object, key) {\n\
      return arguments.length > 2\n\
        ? createBound(key, 19, slice(arguments, 2), null, object)\n\
        : createBound(key, 3, null, null, object);\n\
    }\n\
\n\
    /**\n\
     * Creates a function that is the composition of the provided functions,\n\
     * where each function consumes the return value of the function that follows.\n\
     * For example, composing the functions `f()`, `g()`, and `h()` produces `f(g(h()))`.\n\
     * Each function is executed with the `this` binding of the composed function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {...Function} [func] Functions to compose.\n\
     * @returns {Function} Returns the new composed function.\n\
     * @example\n\
     *\n\
     * var realNameMap = {\n\
     *   'pebbles': 'penelope'\n\
     * };\n\
     *\n\
     * var format = function(name) {\n\
     *   name = realNameMap[name.toLowerCase()] || name;\n\
     *   return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();\n\
     * };\n\
     *\n\
     * var greet = function(formatted) {\n\
     *   return 'Hiya ' + formatted + '!';\n\
     * };\n\
     *\n\
     * var welcome = _.compose(greet, format);\n\
     * welcome('pebbles');\n\
     * // => 'Hiya Penelope!'\n\
     */\n\
    function compose() {\n\
      var funcs = arguments,\n\
          length = funcs.length;\n\
\n\
      while (length--) {\n\
        if (!isFunction(funcs[length])) {\n\
          throw new TypeError;\n\
        }\n\
      }\n\
      return function() {\n\
        var args = arguments,\n\
            length = funcs.length;\n\
\n\
        while (length--) {\n\
          args = [funcs[length].apply(this, args)];\n\
        }\n\
        return args[0];\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Produces a callback bound to an optional `thisArg`. If `func` is a property\n\
     * name the created callback will return the property value for a given element.\n\
     * If `func` is an object the created callback will return `true` for elements\n\
     * that contain the equivalent object properties, otherwise it will return `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {*} [func=identity] The value to convert to a callback.\n\
     * @param {*} [thisArg] The `this` binding of the created callback.\n\
     * @param {number} [argCount] The number of arguments the callback accepts.\n\
     * @returns {Function} Returns a callback function.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * // wrap to create custom callback shorthands\n\
     * _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {\n\
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);\n\
     *   return !match ? func(callback, thisArg) : function(object) {\n\
     *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];\n\
     *   };\n\
     * });\n\
     *\n\
     * _.filter(characters, 'age__gt38');\n\
     * // => [{ 'name': 'fred', 'age': 40 }]\n\
     */\n\
    function createCallback(func, thisArg, argCount) {\n\
      var type = typeof func;\n\
      if (func == null || type == 'function') {\n\
        return baseCreateCallback(func, thisArg, argCount);\n\
      }\n\
      // handle \"_.pluck\" style callback shorthands\n\
      if (type != 'object') {\n\
        return function(object) {\n\
          return object[func];\n\
        };\n\
      }\n\
      var props = keys(func),\n\
          key = props[0],\n\
          a = func[key];\n\
\n\
      // handle \"_.where\" style callback shorthands\n\
      if (props.length == 1 && a === a && !isObject(a)) {\n\
        // fast path the common case of providing an object with a single\n\
        // property containing a primitive value\n\
        return function(object) {\n\
          var b = object[key];\n\
          return a === b && (a !== 0 || (1 / a == 1 / b));\n\
        };\n\
      }\n\
      return function(object) {\n\
        var length = props.length,\n\
            result = false;\n\
\n\
        while (length--) {\n\
          if (!(result = baseIsEqual(object[props[length]], func[props[length]], null, true))) {\n\
            break;\n\
          }\n\
        }\n\
        return result;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Creates a function which accepts one or more arguments of `func` that when\n\
     * invoked either executes `func` returning its result, if all `func` arguments\n\
     * have been provided, or returns a function that accepts one or more of the\n\
     * remaining `func` arguments, and so on. The arity of `func` can be specified\n\
     * if `func.length` is not sufficient.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to curry.\n\
     * @param {number} [arity=func.length] The arity of `func`.\n\
     * @returns {Function} Returns the new curried function.\n\
     * @example\n\
     *\n\
     * var curried = _.curry(function(a, b, c) {\n\
     *   console.log(a + b + c);\n\
     * });\n\
     *\n\
     * curried(1)(2)(3);\n\
     * // => 6\n\
     *\n\
     * curried(1, 2)(3);\n\
     * // => 6\n\
     *\n\
     * curried(1, 2, 3);\n\
     * // => 6\n\
     */\n\
    function curry(func, arity) {\n\
      arity = typeof arity == 'number' ? arity : (+arity || func.length);\n\
      return createBound(func, 4, null, null, null, arity);\n\
    }\n\
\n\
    /**\n\
     * Creates a function that will delay the execution of `func` until after\n\
     * `wait` milliseconds have elapsed since the last time it was invoked.\n\
     * Provide an options object to indicate that `func` should be invoked on\n\
     * the leading and/or trailing edge of the `wait` timeout. Subsequent calls\n\
     * to the debounced function will return the result of the last `func` call.\n\
     *\n\
     * Note: If `leading` and `trailing` options are `true` `func` will be called\n\
     * on the trailing edge of the timeout only if the the debounced function is\n\
     * invoked more than once during the `wait` timeout.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to debounce.\n\
     * @param {number} wait The number of milliseconds to delay.\n\
     * @param {Object} [options] The options object.\n\
     * @param {boolean} [options.leading=false] Specify execution on the leading edge of the timeout.\n\
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be delayed before it's called.\n\
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.\n\
     * @returns {Function} Returns the new debounced function.\n\
     * @example\n\
     *\n\
     * // avoid costly calculations while the window size is in flux\n\
     * var lazyLayout = _.debounce(calculateLayout, 150);\n\
     * jQuery(window).on('resize', lazyLayout);\n\
     *\n\
     * // execute `sendMail` when the click event is fired, debouncing subsequent calls\n\
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {\n\
     *   'leading': true,\n\
     *   'trailing': false\n\
     * });\n\
     *\n\
     * // ensure `batchLog` is executed once after 1 second of debounced calls\n\
     * var source = new EventSource('/stream');\n\
     * source.addEventListener('message', _.debounce(batchLog, 250, {\n\
     *   'maxWait': 1000\n\
     * }, false);\n\
     */\n\
    function debounce(func, wait, options) {\n\
      var args,\n\
          maxTimeoutId,\n\
          result,\n\
          stamp,\n\
          thisArg,\n\
          timeoutId,\n\
          trailingCall,\n\
          lastCalled = 0,\n\
          maxWait = false,\n\
          trailing = true;\n\
\n\
      if (!isFunction(func)) {\n\
        throw new TypeError;\n\
      }\n\
      wait = nativeMax(0, wait) || 0;\n\
      if (options === true) {\n\
        var leading = true;\n\
        trailing = false;\n\
      } else if (isObject(options)) {\n\
        leading = options.leading;\n\
        maxWait = 'maxWait' in options && (nativeMax(wait, options.maxWait) || 0);\n\
        trailing = 'trailing' in options ? options.trailing : trailing;\n\
      }\n\
      var delayed = function() {\n\
        var remaining = wait - (now() - stamp);\n\
        if (remaining <= 0) {\n\
          if (maxTimeoutId) {\n\
            clearTimeout(maxTimeoutId);\n\
          }\n\
          var isCalled = trailingCall;\n\
          maxTimeoutId = timeoutId = trailingCall = undefined;\n\
          if (isCalled) {\n\
            lastCalled = now();\n\
            result = func.apply(thisArg, args);\n\
          }\n\
        } else {\n\
          timeoutId = setTimeout(delayed, remaining);\n\
        }\n\
      };\n\
\n\
      var maxDelayed = function() {\n\
        if (timeoutId) {\n\
          clearTimeout(timeoutId);\n\
        }\n\
        maxTimeoutId = timeoutId = trailingCall = undefined;\n\
        if (trailing || (maxWait !== wait)) {\n\
          lastCalled = now();\n\
          result = func.apply(thisArg, args);\n\
        }\n\
      };\n\
\n\
      return function() {\n\
        args = arguments;\n\
        stamp = now();\n\
        thisArg = this;\n\
        trailingCall = trailing && (timeoutId || !leading);\n\
\n\
        if (maxWait === false) {\n\
          var leadingCall = leading && !timeoutId;\n\
        } else {\n\
          if (!maxTimeoutId && !leading) {\n\
            lastCalled = stamp;\n\
          }\n\
          var remaining = maxWait - (stamp - lastCalled);\n\
          if (remaining <= 0) {\n\
            if (maxTimeoutId) {\n\
              maxTimeoutId = clearTimeout(maxTimeoutId);\n\
            }\n\
            lastCalled = stamp;\n\
            result = func.apply(thisArg, args);\n\
          }\n\
          else if (!maxTimeoutId) {\n\
            maxTimeoutId = setTimeout(maxDelayed, remaining);\n\
          }\n\
        }\n\
        if (!timeoutId && wait !== maxWait) {\n\
          timeoutId = setTimeout(delayed, wait);\n\
        }\n\
        if (leadingCall) {\n\
          result = func.apply(thisArg, args);\n\
        }\n\
        return result;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Defers executing the `func` function until the current call stack has cleared.\n\
     * Additional arguments will be provided to `func` when it is invoked.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to defer.\n\
     * @param {...*} [arg] Arguments to invoke the function with.\n\
     * @returns {number} Returns the timer id.\n\
     * @example\n\
     *\n\
     * _.defer(function() { console.log('deferred'); });\n\
     * // returns from the function before 'deferred' is logged\n\
     */\n\
    function defer(func) {\n\
      if (!isFunction(func)) {\n\
        throw new TypeError;\n\
      }\n\
      var args = slice(arguments, 1);\n\
      return setTimeout(function() { func.apply(undefined, args); }, 1);\n\
    }\n\
    // use `setImmediate` if available in Node.js\n\
    if (isV8 && moduleExports && typeof setImmediate == 'function') {\n\
      defer = function(func) {\n\
        if (!isFunction(func)) {\n\
          throw new TypeError;\n\
        }\n\
        return setImmediate.apply(context, arguments);\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Executes the `func` function after `wait` milliseconds. Additional arguments\n\
     * will be provided to `func` when it is invoked.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to delay.\n\
     * @param {number} wait The number of milliseconds to delay execution.\n\
     * @param {...*} [arg] Arguments to invoke the function with.\n\
     * @returns {number} Returns the timer id.\n\
     * @example\n\
     *\n\
     * var log = _.bind(console.log, console);\n\
     * _.delay(log, 1000, 'logged later');\n\
     * // => 'logged later' (Appears after one second.)\n\
     */\n\
    function delay(func, wait) {\n\
      if (!isFunction(func)) {\n\
        throw new TypeError;\n\
      }\n\
      var args = slice(arguments, 2);\n\
      return setTimeout(function() { func.apply(undefined, args); }, wait);\n\
    }\n\
\n\
    /**\n\
     * Creates a function that memoizes the result of `func`. If `resolver` is\n\
     * provided it will be used to determine the cache key for storing the result\n\
     * based on the arguments provided to the memoized function. By default, the\n\
     * first argument provided to the memoized function is used as the cache key.\n\
     * The `func` is executed with the `this` binding of the memoized function.\n\
     * The result cache is exposed as the `cache` property on the memoized function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to have its output memoized.\n\
     * @param {Function} [resolver] A function used to resolve the cache key.\n\
     * @returns {Function} Returns the new memoizing function.\n\
     * @example\n\
     *\n\
     * var fibonacci = _.memoize(function(n) {\n\
     *   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);\n\
     * });\n\
     *\n\
     * fibonacci(9)\n\
     * // => 34\n\
     *\n\
     * var data = {\n\
     *   'fred': { 'name': 'fred', 'age': 40 },\n\
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }\n\
     * };\n\
     *\n\
     * // modifying the result cache\n\
     * var get = _.memoize(function(name) { return data[name]; }, _.identity);\n\
     * get('pebbles');\n\
     * // => { 'name': 'pebbles', 'age': 1 }\n\
     *\n\
     * get.cache.pebbles.name = 'penelope';\n\
     * get('pebbles');\n\
     * // => { 'name': 'penelope', 'age': 1 }\n\
     */\n\
    function memoize(func, resolver) {\n\
      if (!isFunction(func)) {\n\
        throw new TypeError;\n\
      }\n\
      var memoized = function() {\n\
        var cache = memoized.cache,\n\
            key = resolver ? resolver.apply(this, arguments) : keyPrefix + arguments[0];\n\
\n\
        return hasOwnProperty.call(cache, key)\n\
          ? cache[key]\n\
          : (cache[key] = func.apply(this, arguments));\n\
      }\n\
      memoized.cache = {};\n\
      return memoized;\n\
    }\n\
\n\
    /**\n\
     * Creates a function that is restricted to execute `func` once. Repeat calls to\n\
     * the function will return the value of the first call. The `func` is executed\n\
     * with the `this` binding of the created function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to restrict.\n\
     * @returns {Function} Returns the new restricted function.\n\
     * @example\n\
     *\n\
     * var initialize = _.once(createApplication);\n\
     * initialize();\n\
     * initialize();\n\
     * // `initialize` executes `createApplication` once\n\
     */\n\
    function once(func) {\n\
      var ran,\n\
          result;\n\
\n\
      if (!isFunction(func)) {\n\
        throw new TypeError;\n\
      }\n\
      return function() {\n\
        if (ran) {\n\
          return result;\n\
        }\n\
        ran = true;\n\
        result = func.apply(this, arguments);\n\
\n\
        // clear the `func` variable so the function may be garbage collected\n\
        func = null;\n\
        return result;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Creates a function that, when called, invokes `func` with any additional\n\
     * `partial` arguments prepended to those provided to the new function. This\n\
     * method is similar to `_.bind` except it does **not** alter the `this` binding.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to partially apply arguments to.\n\
     * @param {...*} [arg] Arguments to be partially applied.\n\
     * @returns {Function} Returns the new partially applied function.\n\
     * @example\n\
     *\n\
     * var greet = function(greeting, name) { return greeting + ' ' + name; };\n\
     * var hi = _.partial(greet, 'hi');\n\
     * hi('fred');\n\
     * // => 'hi fred'\n\
     */\n\
    function partial(func) {\n\
      return createBound(func, 16, slice(arguments, 1));\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.partial` except that `partial` arguments are\n\
     * appended to those provided to the new function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to partially apply arguments to.\n\
     * @param {...*} [arg] Arguments to be partially applied.\n\
     * @returns {Function} Returns the new partially applied function.\n\
     * @example\n\
     *\n\
     * var defaultsDeep = _.partialRight(_.merge, _.defaults);\n\
     *\n\
     * var options = {\n\
     *   'variable': 'data',\n\
     *   'imports': { 'jq': $ }\n\
     * };\n\
     *\n\
     * defaultsDeep(options, _.templateSettings);\n\
     *\n\
     * options.variable\n\
     * // => 'data'\n\
     *\n\
     * options.imports\n\
     * // => { '_': _, 'jq': $ }\n\
     */\n\
    function partialRight(func) {\n\
      return createBound(func, 32, null, slice(arguments, 1));\n\
    }\n\
\n\
    /**\n\
     * Creates a function that, when executed, will only call the `func` function\n\
     * at most once per every `wait` milliseconds. Provide an options object to\n\
     * indicate that `func` should be invoked on the leading and/or trailing edge\n\
     * of the `wait` timeout. Subsequent calls to the throttled function will\n\
     * return the result of the last `func` call.\n\
     *\n\
     * Note: If `leading` and `trailing` options are `true` `func` will be called\n\
     * on the trailing edge of the timeout only if the the throttled function is\n\
     * invoked more than once during the `wait` timeout.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to throttle.\n\
     * @param {number} wait The number of milliseconds to throttle executions to.\n\
     * @param {Object} [options] The options object.\n\
     * @param {boolean} [options.leading=true] Specify execution on the leading edge of the timeout.\n\
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.\n\
     * @returns {Function} Returns the new throttled function.\n\
     * @example\n\
     *\n\
     * // avoid excessively updating the position while scrolling\n\
     * var throttled = _.throttle(updatePosition, 100);\n\
     * jQuery(window).on('scroll', throttled);\n\
     *\n\
     * // execute `renewToken` when the click event is fired, but not more than once every 5 minutes\n\
     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {\n\
     *   'trailing': false\n\
     * }));\n\
     */\n\
    function throttle(func, wait, options) {\n\
      var leading = true,\n\
          trailing = true;\n\
\n\
      if (!isFunction(func)) {\n\
        throw new TypeError;\n\
      }\n\
      if (options === false) {\n\
        leading = false;\n\
      } else if (isObject(options)) {\n\
        leading = 'leading' in options ? options.leading : leading;\n\
        trailing = 'trailing' in options ? options.trailing : trailing;\n\
      }\n\
      debounceOptions.leading = leading;\n\
      debounceOptions.maxWait = wait;\n\
      debounceOptions.trailing = trailing;\n\
\n\
      return debounce(func, wait, debounceOptions);\n\
    }\n\
\n\
    /**\n\
     * Creates a function that provides `value` to the wrapper function as its\n\
     * first argument. Additional arguments provided to the function are appended\n\
     * to those provided to the wrapper function. The wrapper is executed with\n\
     * the `this` binding of the created function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {*} value The value to wrap.\n\
     * @param {Function} wrapper The wrapper function.\n\
     * @returns {Function} Returns the new function.\n\
     * @example\n\
     *\n\
     * var p = _.wrap(_.escape, function(func, text) {\n\
     *   return '<p>' + func(text) + '</p>';\n\
     * });\n\
     *\n\
     * p('Fred, Wilma, & Pebbles');\n\
     * // => '<p>Fred, Wilma, &amp; Pebbles</p>'\n\
     */\n\
    function wrap(value, wrapper) {\n\
      return createBound(wrapper, 16, [value]);\n\
    }\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Converts the characters `&`, `<`, `>`, `\"`, and `'` in `string` to their\n\
     * corresponding HTML entities.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {string} string The string to escape.\n\
     * @returns {string} Returns the escaped string.\n\
     * @example\n\
     *\n\
     * _.escape('Fred, Wilma, & Pebbles');\n\
     * // => 'Fred, Wilma, &amp; Pebbles'\n\
     */\n\
    function escape(string) {\n\
      return string == null ? '' : String(string).replace(reUnescapedHtml, escapeHtmlChar);\n\
    }\n\
\n\
    /**\n\
     * This method returns the first argument provided to it.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {*} value Any value.\n\
     * @returns {*} Returns `value`.\n\
     * @example\n\
     *\n\
     * var object = { 'name': 'fred' };\n\
     * _.identity(object) === object;\n\
     * // => true\n\
     */\n\
    function identity(value) {\n\
      return value;\n\
    }\n\
\n\
    /**\n\
     * Adds function properties of a source object to the `lodash` function and\n\
     * chainable wrapper.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {Object} object The object of function properties to add to `lodash`.\n\
     * @param {Object} object The object of function properties to add to `lodash`.\n\
     * @example\n\
     *\n\
     * _.mixin({\n\
     *   'capitalize': function(string) {\n\
     *     return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();\n\
     *   }\n\
     * });\n\
     *\n\
     * _.capitalize('fred');\n\
     * // => 'Fred'\n\
     *\n\
     * _('fred').capitalize();\n\
     * // => 'Fred'\n\
     */\n\
    function mixin(object, source) {\n\
      var ctor = object,\n\
          isFunc = !source || isFunction(ctor);\n\
\n\
      if (!source) {\n\
        ctor = lodashWrapper;\n\
        source = object;\n\
        object = lodash;\n\
      }\n\
      forEach(functions(source), function(methodName) {\n\
        var func = object[methodName] = source[methodName];\n\
        if (isFunc) {\n\
          ctor.prototype[methodName] = function() {\n\
            var value = this.__wrapped__,\n\
                args = [value];\n\
\n\
            push.apply(args, arguments);\n\
            var result = func.apply(object, args);\n\
            if (value && typeof value == 'object' && value === result) {\n\
              return this;\n\
            }\n\
            result = new ctor(result);\n\
            result.__chain__ = this.__chain__;\n\
            return result;\n\
          };\n\
        }\n\
      });\n\
    }\n\
\n\
    /**\n\
     * Reverts the '_' variable to its previous value and returns a reference to\n\
     * the `lodash` function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @returns {Function} Returns the `lodash` function.\n\
     * @example\n\
     *\n\
     * var lodash = _.noConflict();\n\
     */\n\
    function noConflict() {\n\
      context._ = oldDash;\n\
      return this;\n\
    }\n\
\n\
    /**\n\
     * Converts the given value into an integer of the specified radix.\n\
     * If `radix` is `undefined` or `0` a `radix` of `10` is used unless the\n\
     * `value` is a hexadecimal, in which case a `radix` of `16` is used.\n\
     *\n\
     * Note: This method avoids differences in native ES3 and ES5 `parseInt`\n\
     * implementations. See http://es5.github.io/#E.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {string} value The value to parse.\n\
     * @param {number} [radix] The radix used to interpret the value to parse.\n\
     * @returns {number} Returns the new integer value.\n\
     * @example\n\
     *\n\
     * _.parseInt('08');\n\
     * // => 8\n\
     */\n\
    var parseInt = nativeParseInt(whitespace + '08') == 8 ? nativeParseInt : function(value, radix) {\n\
      // Firefox < 21 and Opera < 15 follow the ES3 specified implementation of `parseInt`\n\
      return nativeParseInt(isString(value) ? value.replace(reLeadingSpacesAndZeros, '') : value, radix || 0);\n\
    };\n\
\n\
    /**\n\
     * Produces a random number between `min` and `max` (inclusive). If only one\n\
     * argument is provided a number between `0` and the given number will be\n\
     * returned. If `floating` is truey or either `min` or `max` are floats a\n\
     * floating-point number will be returned instead of an integer.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {number} [min=0] The minimum possible value.\n\
     * @param {number} [max=1] The maximum possible value.\n\
     * @param {boolean} [floating=false] Specify returning a floating-point number.\n\
     * @returns {number} Returns a random number.\n\
     * @example\n\
     *\n\
     * _.random(0, 5);\n\
     * // => an integer between 0 and 5\n\
     *\n\
     * _.random(5);\n\
     * // => also an integer between 0 and 5\n\
     *\n\
     * _.random(5, true);\n\
     * // => a floating-point number between 0 and 5\n\
     *\n\
     * _.random(1.2, 5.2);\n\
     * // => a floating-point number between 1.2 and 5.2\n\
     */\n\
    function random(min, max, floating) {\n\
      var noMin = min == null,\n\
          noMax = max == null;\n\
\n\
      if (floating == null) {\n\
        if (typeof min == 'boolean' && noMax) {\n\
          floating = min;\n\
          min = 1;\n\
        }\n\
        else if (!noMax && typeof max == 'boolean') {\n\
          floating = max;\n\
          noMax = true;\n\
        }\n\
      }\n\
      if (noMin && noMax) {\n\
        max = 1;\n\
      }\n\
      min = +min || 0;\n\
      if (noMax) {\n\
        max = min;\n\
        min = 0;\n\
      } else {\n\
        max = +max || 0;\n\
      }\n\
      if (floating || min % 1 || max % 1) {\n\
        var rand = nativeRandom();\n\
        return nativeMin(min + (rand * (max - min + parseFloat('1e-' + ((rand +'').length - 1)))), max);\n\
      }\n\
      return baseRandom(min, max);\n\
    }\n\
\n\
    /**\n\
     * Resolves the value of `property` on `object`. If `property` is a function\n\
     * it will be invoked with the `this` binding of `object` and its result returned,\n\
     * else the property value is returned. If `object` is falsey then `undefined`\n\
     * is returned.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {Object} object The object to inspect.\n\
     * @param {string} property The property to get the value of.\n\
     * @returns {*} Returns the resolved value.\n\
     * @example\n\
     *\n\
     * var object = {\n\
     *   'cheese': 'crumpets',\n\
     *   'stuff': function() {\n\
     *     return 'nonsense';\n\
     *   }\n\
     * };\n\
     *\n\
     * _.result(object, 'cheese');\n\
     * // => 'crumpets'\n\
     *\n\
     * _.result(object, 'stuff');\n\
     * // => 'nonsense'\n\
     */\n\
    function result(object, property) {\n\
      if (object) {\n\
        var value = object[property];\n\
        return isFunction(value) ? object[property]() : value;\n\
      }\n\
    }\n\
\n\
    /**\n\
     * A micro-templating method that handles arbitrary delimiters, preserves\n\
     * whitespace, and correctly escapes quotes within interpolated code.\n\
     *\n\
     * Note: In the development build, `_.template` utilizes sourceURLs for easier\n\
     * debugging. See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl\n\
     *\n\
     * For more information on precompiling templates see:\n\
     * http://lodash.com/#custom-builds\n\
     *\n\
     * For more information on Chrome extension sandboxes see:\n\
     * http://developer.chrome.com/stable/extensions/sandboxingEval.html\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {string} text The template text.\n\
     * @param {Object} data The data object used to populate the text.\n\
     * @param {Object} [options] The options object.\n\
     * @param {RegExp} [options.escape] The \"escape\" delimiter.\n\
     * @param {RegExp} [options.evaluate] The \"evaluate\" delimiter.\n\
     * @param {Object} [options.imports] An object to import into the template as local variables.\n\
     * @param {RegExp} [options.interpolate] The \"interpolate\" delimiter.\n\
     * @param {string} [sourceURL] The sourceURL of the template's compiled source.\n\
     * @param {string} [variable] The data object variable name.\n\
     * @returns {Function|string} Returns a compiled function when no `data` object\n\
     *  is given, else it returns the interpolated text.\n\
     * @example\n\
     *\n\
     * // using the \"interpolate\" delimiter to create a compiled template\n\
     * var compiled = _.template('hello <%= name %>');\n\
     * compiled({ 'name': 'fred' });\n\
     * // => 'hello fred'\n\
     *\n\
     * // using the \"escape\" delimiter to escape HTML in data property values\n\
     * _.template('<b><%- value %></b>', { 'value': '<script>' });\n\
     * // => '<b>&lt;script&gt;</b>'\n\
     *\n\
     * // using the \"evaluate\" delimiter to generate HTML\n\
     * var list = '<% _.forEach(people, function(name) { %><li><%- name %></li><% }); %>';\n\
     * _.template(list, { 'people': ['fred', 'barney'] });\n\
     * // => '<li>fred</li><li>barney</li>'\n\
     *\n\
     * // using the ES6 delimiter as an alternative to the default \"interpolate\" delimiter\n\
     * _.template('hello ${ name }', { 'name': 'pebbles' });\n\
     * // => 'hello pebbles'\n\
     *\n\
     * // using the internal `print` function in \"evaluate\" delimiters\n\
     * _.template('<% print(\"hello \" + name); %>!', { 'name': 'barney' });\n\
     * // => 'hello barney!'\n\
     *\n\
     * // using a custom template delimiters\n\
     * _.templateSettings = {\n\
     *   'interpolate': /{{([\\s\\S]+?)}}/g\n\
     * };\n\
     *\n\
     * _.template('hello {{ name }}!', { 'name': 'mustache' });\n\
     * // => 'hello mustache!'\n\
     *\n\
     * // using the `imports` option to import jQuery\n\
     * var list = '<% $.each(people, function(name) { %><li><%- name %></li><% }); %>';\n\
     * _.template(list, { 'people': ['fred', 'barney'] }, { 'imports': { '$': jQuery } });\n\
     * // => '<li>fred</li><li>barney</li>'\n\
     *\n\
     * // using the `sourceURL` option to specify a custom sourceURL for the template\n\
     * var compiled = _.template('hello <%= name %>', null, { 'sourceURL': '/basic/greeting.jst' });\n\
     * compiled(data);\n\
     * // => find the source of \"greeting.jst\" under the Sources tab or Resources panel of the web inspector\n\
     *\n\
     * // using the `variable` option to ensure a with-statement isn't used in the compiled template\n\
     * var compiled = _.template('hi <%= data.name %>!', null, { 'variable': 'data' });\n\
     * compiled.source;\n\
     * // => function(data) {\n\
     *   var __t, __p = '', __e = _.escape;\n\
     *   __p += 'hi ' + ((__t = ( data.name )) == null ? '' : __t) + '!';\n\
     *   return __p;\n\
     * }\n\
     *\n\
     * // using the `source` property to inline compiled templates for meaningful\n\
     * // line numbers in error messages and a stack trace\n\
     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\\\n\
     *   var JST = {\\\n\
     *     \"main\": ' + _.template(mainText).source + '\\\n\
     *   };\\\n\
     * ');\n\
     */\n\
    function template(text, data, options) {\n\
      // based on John Resig's `tmpl` implementation\n\
      // http://ejohn.org/blog/javascript-micro-templating/\n\
      // and Laura Doktorova's doT.js\n\
      // https://github.com/olado/doT\n\
      var settings = lodash.templateSettings;\n\
      text = String(text || '');\n\
\n\
      // avoid missing dependencies when `iteratorTemplate` is not defined\n\
      options = defaults({}, options, settings);\n\
\n\
      var imports = defaults({}, options.imports, settings.imports),\n\
          importsKeys = keys(imports),\n\
          importsValues = values(imports);\n\
\n\
      var isEvaluating,\n\
          index = 0,\n\
          interpolate = options.interpolate || reNoMatch,\n\
          source = \"__p += '\";\n\
\n\
      // compile the regexp to match each delimiter\n\
      var reDelimiters = RegExp(\n\
        (options.escape || reNoMatch).source + '|' +\n\
        interpolate.source + '|' +\n\
        (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +\n\
        (options.evaluate || reNoMatch).source + '|$'\n\
      , 'g');\n\
\n\
      text.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {\n\
        interpolateValue || (interpolateValue = esTemplateValue);\n\
\n\
        // escape characters that cannot be included in string literals\n\
        source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);\n\
\n\
        // replace delimiters with snippets\n\
        if (escapeValue) {\n\
          source += \"' +\\n\
__e(\" + escapeValue + \") +\\n\
'\";\n\
        }\n\
        if (evaluateValue) {\n\
          isEvaluating = true;\n\
          source += \"';\\n\
\" + evaluateValue + \";\\n\
__p += '\";\n\
        }\n\
        if (interpolateValue) {\n\
          source += \"' +\\n\
((__t = (\" + interpolateValue + \")) == null ? '' : __t) +\\n\
'\";\n\
        }\n\
        index = offset + match.length;\n\
\n\
        // the JS engine embedded in Adobe products requires returning the `match`\n\
        // string in order to produce the correct `offset` value\n\
        return match;\n\
      });\n\
\n\
      source += \"';\\n\
\";\n\
\n\
      // if `variable` is not specified, wrap a with-statement around the generated\n\
      // code to add the data object to the top of the scope chain\n\
      var variable = options.variable,\n\
          hasVariable = variable;\n\
\n\
      if (!hasVariable) {\n\
        variable = 'obj';\n\
        source = 'with (' + variable + ') {\\n\
' + source + '\\n\
}\\n\
';\n\
      }\n\
      // cleanup code by stripping empty strings\n\
      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)\n\
        .replace(reEmptyStringMiddle, '$1')\n\
        .replace(reEmptyStringTrailing, '$1;');\n\
\n\
      // frame code as the function body\n\
      source = 'function(' + variable + ') {\\n\
' +\n\
        (hasVariable ? '' : variable + ' || (' + variable + ' = {});\\n\
') +\n\
        \"var __t, __p = '', __e = _.escape\" +\n\
        (isEvaluating\n\
          ? ', __j = Array.prototype.join;\\n\
' +\n\
            \"function print() { __p += __j.call(arguments, '') }\\n\
\"\n\
          : ';\\n\
'\n\
        ) +\n\
        source +\n\
        'return __p\\n\
}';\n\
\n\
      // Use a sourceURL for easier debugging.\n\
      // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl\n\
      var sourceURL = '\\n\
/*\\n\
//# sourceURL=' + (options.sourceURL || '/lodash/template/source[' + (templateCounter++) + ']') + '\\n\
*/';\n\
\n\
      try {\n\
        var result = Function(importsKeys, 'return ' + source + sourceURL).apply(undefined, importsValues);\n\
      } catch(e) {\n\
        e.source = source;\n\
        throw e;\n\
      }\n\
      if (data) {\n\
        return result(data);\n\
      }\n\
      // provide the compiled function's source by its `toString` method, in\n\
      // supported environments, or the `source` property as a convenience for\n\
      // inlining compiled templates during the build process\n\
      result.source = source;\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Executes the callback `n` times, returning an array of the results\n\
     * of each callback execution. The callback is bound to `thisArg` and invoked\n\
     * with one argument; (index).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {number} n The number of times to execute the callback.\n\
     * @param {Function} callback The function called per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns an array of the results of each `callback` execution.\n\
     * @example\n\
     *\n\
     * var diceRolls = _.times(3, _.partial(_.random, 1, 6));\n\
     * // => [3, 6, 4]\n\
     *\n\
     * _.times(3, function(n) { mage.castSpell(n); });\n\
     * // => calls `mage.castSpell(n)` three times, passing `n` of `0`, `1`, and `2` respectively\n\
     *\n\
     * _.times(3, function(n) { this.cast(n); }, mage);\n\
     * // => also calls `mage.castSpell(n)` three times\n\
     */\n\
    function times(n, callback, thisArg) {\n\
      n = (n = +n) > -1 ? n : 0;\n\
      var index = -1,\n\
          result = Array(n);\n\
\n\
      callback = baseCreateCallback(callback, thisArg, 1);\n\
      while (++index < n) {\n\
        result[index] = callback(index);\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The inverse of `_.escape` this method converts the HTML entities\n\
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` in `string` to their\n\
     * corresponding characters.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {string} string The string to unescape.\n\
     * @returns {string} Returns the unescaped string.\n\
     * @example\n\
     *\n\
     * _.unescape('Fred, Barney &amp; Pebbles');\n\
     * // => 'Fred, Barney & Pebbles'\n\
     */\n\
    function unescape(string) {\n\
      return string == null ? '' : String(string).replace(reEscapedHtml, unescapeHtmlChar);\n\
    }\n\
\n\
    /**\n\
     * Generates a unique ID. If `prefix` is provided the ID will be appended to it.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {string} [prefix] The value to prefix the ID with.\n\
     * @returns {string} Returns the unique ID.\n\
     * @example\n\
     *\n\
     * _.uniqueId('contact_');\n\
     * // => 'contact_104'\n\
     *\n\
     * _.uniqueId();\n\
     * // => '105'\n\
     */\n\
    function uniqueId(prefix) {\n\
      var id = ++idCounter;\n\
      return String(prefix == null ? '' : prefix) + id;\n\
    }\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Creates a `lodash` object that wraps the given value with explicit\n\
     * method chaining enabled.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Chaining\n\
     * @param {*} value The value to wrap.\n\
     * @returns {Object} Returns the wrapper object.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'age': 36 },\n\
     *   { 'name': 'fred',    'age': 40 },\n\
     *   { 'name': 'pebbles', 'age': 1 }\n\
     * ];\n\
     *\n\
     * var youngest = _.chain(characters)\n\
     *     .sortBy('age')\n\
     *     .map(function(chr) { return chr.name + ' is ' + chr.age; })\n\
     *     .first()\n\
     *     .value();\n\
     * // => 'pebbles is 1'\n\
     */\n\
    function chain(value) {\n\
      value = new lodashWrapper(value);\n\
      value.__chain__ = true;\n\
      return value;\n\
    }\n\
\n\
    /**\n\
     * Invokes `interceptor` with the `value` as the first argument and then\n\
     * returns `value`. The purpose of this method is to \"tap into\" a method\n\
     * chain in order to perform operations on intermediate results within\n\
     * the chain.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Chaining\n\
     * @param {*} value The value to provide to `interceptor`.\n\
     * @param {Function} interceptor The function to invoke.\n\
     * @returns {*} Returns `value`.\n\
     * @example\n\
     *\n\
     * _([1, 2, 3, 4])\n\
     *  .tap(function(array) { array.pop(); })\n\
     *  .reverse()\n\
     *  .value();\n\
     * // => [3, 2, 1]\n\
     */\n\
    function tap(value, interceptor) {\n\
      interceptor(value);\n\
      return value;\n\
    }\n\
\n\
    /**\n\
     * Enables explicit method chaining on the wrapper object.\n\
     *\n\
     * @name chain\n\
     * @memberOf _\n\
     * @category Chaining\n\
     * @returns {*} Returns the wrapper object.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * // without explicit chaining\n\
     * _(characters).first();\n\
     * // => { 'name': 'barney', 'age': 36 }\n\
     *\n\
     * // with explicit chaining\n\
     * _(characters).chain()\n\
     *   .first()\n\
     *   .pick('age')\n\
     *   .value()\n\
     * // => { 'age': 36 }\n\
     */\n\
    function wrapperChain() {\n\
      this.__chain__ = true;\n\
      return this;\n\
    }\n\
\n\
    /**\n\
     * Produces the `toString` result of the wrapped value.\n\
     *\n\
     * @name toString\n\
     * @memberOf _\n\
     * @category Chaining\n\
     * @returns {string} Returns the string result.\n\
     * @example\n\
     *\n\
     * _([1, 2, 3]).toString();\n\
     * // => '1,2,3'\n\
     */\n\
    function wrapperToString() {\n\
      return String(this.__wrapped__);\n\
    }\n\
\n\
    /**\n\
     * Extracts the wrapped value.\n\
     *\n\
     * @name valueOf\n\
     * @memberOf _\n\
     * @alias value\n\
     * @category Chaining\n\
     * @returns {*} Returns the wrapped value.\n\
     * @example\n\
     *\n\
     * _([1, 2, 3]).valueOf();\n\
     * // => [1, 2, 3]\n\
     */\n\
    function wrapperValueOf() {\n\
      return this.__wrapped__;\n\
    }\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    // add functions that return wrapped values when chaining\n\
    lodash.after = after;\n\
    lodash.assign = assign;\n\
    lodash.at = at;\n\
    lodash.bind = bind;\n\
    lodash.bindAll = bindAll;\n\
    lodash.bindKey = bindKey;\n\
    lodash.chain = chain;\n\
    lodash.compact = compact;\n\
    lodash.compose = compose;\n\
    lodash.countBy = countBy;\n\
    lodash.create = create;\n\
    lodash.createCallback = createCallback;\n\
    lodash.curry = curry;\n\
    lodash.debounce = debounce;\n\
    lodash.defaults = defaults;\n\
    lodash.defer = defer;\n\
    lodash.delay = delay;\n\
    lodash.difference = difference;\n\
    lodash.filter = filter;\n\
    lodash.flatten = flatten;\n\
    lodash.forEach = forEach;\n\
    lodash.forEachRight = forEachRight;\n\
    lodash.forIn = forIn;\n\
    lodash.forInRight = forInRight;\n\
    lodash.forOwn = forOwn;\n\
    lodash.forOwnRight = forOwnRight;\n\
    lodash.functions = functions;\n\
    lodash.groupBy = groupBy;\n\
    lodash.indexBy = indexBy;\n\
    lodash.initial = initial;\n\
    lodash.intersection = intersection;\n\
    lodash.invert = invert;\n\
    lodash.invoke = invoke;\n\
    lodash.keys = keys;\n\
    lodash.map = map;\n\
    lodash.max = max;\n\
    lodash.memoize = memoize;\n\
    lodash.merge = merge;\n\
    lodash.min = min;\n\
    lodash.omit = omit;\n\
    lodash.once = once;\n\
    lodash.pairs = pairs;\n\
    lodash.partial = partial;\n\
    lodash.partialRight = partialRight;\n\
    lodash.pick = pick;\n\
    lodash.pluck = pluck;\n\
    lodash.pull = pull;\n\
    lodash.range = range;\n\
    lodash.reject = reject;\n\
    lodash.remove = remove;\n\
    lodash.rest = rest;\n\
    lodash.shuffle = shuffle;\n\
    lodash.sortBy = sortBy;\n\
    lodash.tap = tap;\n\
    lodash.throttle = throttle;\n\
    lodash.times = times;\n\
    lodash.toArray = toArray;\n\
    lodash.transform = transform;\n\
    lodash.union = union;\n\
    lodash.uniq = uniq;\n\
    lodash.values = values;\n\
    lodash.where = where;\n\
    lodash.without = without;\n\
    lodash.wrap = wrap;\n\
    lodash.zip = zip;\n\
    lodash.zipObject = zipObject;\n\
\n\
    // add aliases\n\
    lodash.collect = map;\n\
    lodash.drop = rest;\n\
    lodash.each = forEach;\n\
    lodash.eachRight = forEachRight;\n\
    lodash.extend = assign;\n\
    lodash.methods = functions;\n\
    lodash.object = zipObject;\n\
    lodash.select = filter;\n\
    lodash.tail = rest;\n\
    lodash.unique = uniq;\n\
    lodash.unzip = zip;\n\
\n\
    // add functions to `lodash.prototype`\n\
    mixin(lodash);\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    // add functions that return unwrapped values when chaining\n\
    lodash.clone = clone;\n\
    lodash.cloneDeep = cloneDeep;\n\
    lodash.contains = contains;\n\
    lodash.escape = escape;\n\
    lodash.every = every;\n\
    lodash.find = find;\n\
    lodash.findIndex = findIndex;\n\
    lodash.findKey = findKey;\n\
    lodash.findLast = findLast;\n\
    lodash.findLastIndex = findLastIndex;\n\
    lodash.findLastKey = findLastKey;\n\
    lodash.has = has;\n\
    lodash.identity = identity;\n\
    lodash.indexOf = indexOf;\n\
    lodash.isArguments = isArguments;\n\
    lodash.isArray = isArray;\n\
    lodash.isBoolean = isBoolean;\n\
    lodash.isDate = isDate;\n\
    lodash.isElement = isElement;\n\
    lodash.isEmpty = isEmpty;\n\
    lodash.isEqual = isEqual;\n\
    lodash.isFinite = isFinite;\n\
    lodash.isFunction = isFunction;\n\
    lodash.isNaN = isNaN;\n\
    lodash.isNull = isNull;\n\
    lodash.isNumber = isNumber;\n\
    lodash.isObject = isObject;\n\
    lodash.isPlainObject = isPlainObject;\n\
    lodash.isRegExp = isRegExp;\n\
    lodash.isString = isString;\n\
    lodash.isUndefined = isUndefined;\n\
    lodash.lastIndexOf = lastIndexOf;\n\
    lodash.mixin = mixin;\n\
    lodash.noConflict = noConflict;\n\
    lodash.parseInt = parseInt;\n\
    lodash.random = random;\n\
    lodash.reduce = reduce;\n\
    lodash.reduceRight = reduceRight;\n\
    lodash.result = result;\n\
    lodash.runInContext = runInContext;\n\
    lodash.size = size;\n\
    lodash.some = some;\n\
    lodash.sortedIndex = sortedIndex;\n\
    lodash.template = template;\n\
    lodash.unescape = unescape;\n\
    lodash.uniqueId = uniqueId;\n\
\n\
    // add aliases\n\
    lodash.all = every;\n\
    lodash.any = some;\n\
    lodash.detect = find;\n\
    lodash.findWhere = find;\n\
    lodash.foldl = reduce;\n\
    lodash.foldr = reduceRight;\n\
    lodash.include = contains;\n\
    lodash.inject = reduce;\n\
\n\
    forOwn(lodash, function(func, methodName) {\n\
      if (!lodash.prototype[methodName]) {\n\
        lodash.prototype[methodName] = function() {\n\
          var args = [this.__wrapped__],\n\
              chainAll = this.__chain__;\n\
\n\
          push.apply(args, arguments);\n\
          var result = func.apply(lodash, args);\n\
          return chainAll\n\
            ? new lodashWrapper(result, chainAll)\n\
            : result;\n\
        };\n\
      }\n\
    });\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    // add functions capable of returning wrapped and unwrapped values when chaining\n\
    lodash.first = first;\n\
    lodash.last = last;\n\
    lodash.sample = sample;\n\
\n\
    // add aliases\n\
    lodash.take = first;\n\
    lodash.head = first;\n\
\n\
    forOwn(lodash, function(func, methodName) {\n\
      var callbackable = methodName !== 'sample';\n\
      if (!lodash.prototype[methodName]) {\n\
        lodash.prototype[methodName]= function(n, guard) {\n\
          var chainAll = this.__chain__,\n\
              result = func(this.__wrapped__, n, guard);\n\
\n\
          return !chainAll && (n == null || (guard && !(callbackable && typeof n == 'function')))\n\
            ? result\n\
            : new lodashWrapper(result, chainAll);\n\
        };\n\
      }\n\
    });\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * The semantic version number.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type string\n\
     */\n\
    lodash.VERSION = '2.2.1';\n\
\n\
    // add \"Chaining\" functions to the wrapper\n\
    lodash.prototype.chain = wrapperChain;\n\
    lodash.prototype.toString = wrapperToString;\n\
    lodash.prototype.value = wrapperValueOf;\n\
    lodash.prototype.valueOf = wrapperValueOf;\n\
\n\
    // add `Array` functions that return unwrapped values\n\
    baseEach(['join', 'pop', 'shift'], function(methodName) {\n\
      var func = arrayRef[methodName];\n\
      lodash.prototype[methodName] = function() {\n\
        var chainAll = this.__chain__,\n\
            result = func.apply(this.__wrapped__, arguments);\n\
\n\
        return chainAll\n\
          ? new lodashWrapper(result, chainAll)\n\
          : result;\n\
      };\n\
    });\n\
\n\
    // add `Array` functions that return the wrapped value\n\
    baseEach(['push', 'reverse', 'sort', 'unshift'], function(methodName) {\n\
      var func = arrayRef[methodName];\n\
      lodash.prototype[methodName] = function() {\n\
        func.apply(this.__wrapped__, arguments);\n\
        return this;\n\
      };\n\
    });\n\
\n\
    // add `Array` functions that return new wrapped values\n\
    baseEach(['concat', 'slice', 'splice'], function(methodName) {\n\
      var func = arrayRef[methodName];\n\
      lodash.prototype[methodName] = function() {\n\
        return new lodashWrapper(func.apply(this.__wrapped__, arguments), this.__chain__);\n\
      };\n\
    });\n\
\n\
    // avoid array-like object bugs with `Array#shift` and `Array#splice`\n\
    // in IE < 9, Firefox < 10, Narwhal, and RingoJS\n\
    if (!support.spliceObjects) {\n\
      baseEach(['pop', 'shift', 'splice'], function(methodName) {\n\
        var func = arrayRef[methodName],\n\
            isSplice = methodName == 'splice';\n\
\n\
        lodash.prototype[methodName] = function() {\n\
          var chainAll = this.__chain__,\n\
              value = this.__wrapped__,\n\
              result = func.apply(value, arguments);\n\
\n\
          if (value.length === 0) {\n\
            delete value[0];\n\
          }\n\
          return (chainAll || isSplice)\n\
            ? new lodashWrapper(result, chainAll)\n\
            : result;\n\
        };\n\
      });\n\
    }\n\
\n\
    return lodash;\n\
  }\n\
\n\
  /*--------------------------------------------------------------------------*/\n\
\n\
  // expose Lo-Dash\n\
  var _ = runInContext();\n\
\n\
  // some AMD build optimizers, like r.js, check for condition patterns like the following:\n\
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {\n\
    // Expose Lo-Dash to the global object even when an AMD loader is present in\n\
    // case Lo-Dash was injected by a third-party script and not intended to be\n\
    // loaded as a module. The global assignment can be reverted in the Lo-Dash\n\
    // module by its `noConflict()` method.\n\
    root._ = _;\n\
\n\
    // define as an anonymous module so, through path mapping, it can be\n\
    // referenced as the \"underscore\" module\n\
    define(function() {\n\
      return _;\n\
    });\n\
  }\n\
  // check for `exports` after `define` in case a build optimizer adds an `exports` object\n\
  else if (freeExports && freeModule) {\n\
    // in Node.js or RingoJS\n\
    if (moduleExports) {\n\
      (freeModule.exports = _)._ = _;\n\
    }\n\
    // in Narwhal or Rhino -require\n\
    else {\n\
      freeExports._ = _;\n\
    }\n\
  }\n\
  else {\n\
    // in a browser or Rhino\n\
    root._ = _;\n\
  }\n\
}.call(this));\n\
//@ sourceURL=lodash-lodash/dist/lodash.compat.js"
));
require.register("dworthen-webrtc-adapter/index.js", Function("exports, require, module",
"module.exports = (function() {\n\
  \n\
\n\
  var RTCPeerConnection = null;\n\
  var getUserMedia = null;\n\
  var attachMediaStream = null;\n\
  var reattachMediaStream = null;\n\
  var webrtcDetectedBrowser = null;\n\
\n\
  if (navigator.mozGetUserMedia) {\n\
    console.log(\"This appears to be Firefox\");\n\
\n\
    webrtcDetectedBrowser = \"firefox\";\n\
\n\
    // The RTCPeerConnection object.\n\
    RTCPeerConnection = mozRTCPeerConnection;\n\
\n\
    // The RTCSessionDescription object.\n\
    RTCSessionDescription = mozRTCSessionDescription;\n\
\n\
    // The RTCIceCandidate object.\n\
    RTCIceCandidate = mozRTCIceCandidate;\n\
\n\
    // Get UserMedia (only difference is the prefix).\n\
    // Code from Adam Barth.\n\
    getUserMedia = navigator.mozGetUserMedia.bind(navigator);\n\
\n\
    // Attach a media stream to an element.\n\
    attachMediaStream = function(element, stream) {\n\
      console.log(\"Attaching media stream\");\n\
      element.mozSrcObject = stream;\n\
      element.play();\n\
    };\n\
\n\
    reattachMediaStream = function(to, from) {\n\
      console.log(\"Reattaching media stream\");\n\
      to.mozSrcObject = from.mozSrcObject;\n\
      to.play();\n\
    };\n\
\n\
    // Fake get{Video,Audio}Tracks\n\
    MediaStream.prototype.getVideoTracks = function() {\n\
      return [];\n\
    };\n\
\n\
    MediaStream.prototype.getAudioTracks = function() {\n\
      return [];\n\
    };\n\
  } else if (navigator.webkitGetUserMedia) {\n\
    console.log(\"This appears to be Chrome\");\n\
\n\
    webrtcDetectedBrowser = \"chrome\";\n\
\n\
    // The RTCPeerConnection object.\n\
    RTCPeerConnection = webkitRTCPeerConnection;\n\
    \n\
    // Get UserMedia (only difference is the prefix).\n\
    // Code from Adam Barth.\n\
    getUserMedia = navigator.webkitGetUserMedia.bind(navigator);\n\
\n\
    // Attach a media stream to an element.\n\
    attachMediaStream = function(element, stream) {\n\
      element.src = webkitURL.createObjectURL(stream);\n\
    };\n\
\n\
    reattachMediaStream = function(to, from) {\n\
      to.src = from.src;\n\
    };\n\
\n\
    // The representation of tracks in a stream is changed in M26.\n\
    // Unify them for earlier Chrome versions in the coexisting period.\n\
    if (!webkitMediaStream.prototype.getVideoTracks) {\n\
      webkitMediaStream.prototype.getVideoTracks = function() {\n\
        return this.videoTracks;\n\
      };\n\
      webkitMediaStream.prototype.getAudioTracks = function() {\n\
        return this.audioTracks;\n\
      };\n\
    }\n\
\n\
    // New syntax of getXXXStreams method in M26.\n\
    if (!webkitRTCPeerConnection.prototype.getLocalStreams) {\n\
      webkitRTCPeerConnection.prototype.getLocalStreams = function() {\n\
        return this.localStreams;\n\
      };\n\
      webkitRTCPeerConnection.prototype.getRemoteStreams = function() {\n\
        return this.remoteStreams;\n\
      };\n\
    }\n\
  } else {\n\
    console.log(\"Browser does not appear to be WebRTC-capable\");\n\
  }\n\
\n\
  return {\n\
    RTCPeerConnection : RTCPeerConnection,\n\
    getUserMedia : getUserMedia,\n\
    attachMediaStream : attachMediaStream,\n\
    reattachMediaStream : reattachMediaStream,\n\
    webrtcDetectedBrowser : webrtcDetectedBrowser\n\
  }\n\
\n\
}());\n\
//@ sourceURL=dworthen-webrtc-adapter/index.js"
));
require.register("dtao-lazy.js/lazy.js", Function("exports, require, module",
"/*\n\
 * @name Lazy.js\n\
 *\n\
 * @fileOverview\n\
 * Lazy.js is a lazy evaluation library for JavaScript.\n\
 *\n\
 * This has been done before. For examples see:\n\
 *\n\
 * - [wu.js](http://fitzgen.github.io/wu.js/)\n\
 * - [Linq.js](http://linqjs.codeplex.com/)\n\
 * - [from.js](https://github.com/suckgamoni/fromjs/)\n\
 * - [IxJS](http://rx.codeplex.com/)\n\
 * - [sloth.js](http://rfw.name/sloth.js/)\n\
 *\n\
 * However, at least at present, Lazy.js is faster (on average) than any of\n\
 * those libraries. It is also more complete, with nearly all of the\n\
 * functionality of [Underscore](http://underscorejs.org/) and\n\
 * [Lo-Dash](http://lodash.com/).\n\
 *\n\
 * Finding your way around the code\n\
 * --------------------------------\n\
 *\n\
 * At the heart of Lazy.js is the {@link Sequence} object. You create an initial\n\
 * sequence using {@link Lazy}, which can accept an array, object, or string.\n\
 * You can then \"chain\" together methods from this sequence, creating a new\n\
 * sequence with each call.\n\
 *\n\
 * Here's an example:\n\
 *\n\
 *     var data = getReallyBigArray();\n\
 *\n\
 *     var statistics = Lazy(data)\n\
 *       .map(transform)\n\
 *       .filter(validate)\n\
 *       .reduce(aggregate);\n\
 *\n\
 * {@link Sequence} is the foundation of other, more specific sequence types.\n\
 *\n\
 * An {@link ArrayLikeSequence} provides indexed access to its elements.\n\
 *\n\
 * An {@link ObjectLikeSequence} consists of key/value pairs.\n\
 *\n\
 * A {@link StringLikeSequence} is like a string (duh): actually, it is an\n\
 * {@link ArrayLikeSequence} whose elements happen to be characters.\n\
 *\n\
 * An {@link AsyncSequence} is special: it iterates over its elements\n\
 * asynchronously (so calling `each` generally begins an asynchronous loop and\n\
 * returns immediately).\n\
 *\n\
 * For more information\n\
 * --------------------\n\
 *\n\
 * I wrote a blog post that explains a little bit more about Lazy.js, which you\n\
 * can read [here](http://philosopherdeveloper.com/posts/introducing-lazy-js.html).\n\
 *\n\
 * You can also [create an issue on GitHub](https://github.com/dtao/lazy.js/issues)\n\
 * if you have any issues with the library. I work through them eventually.\n\
 *\n\
 * [@dtao](https://github.com/dtao)\n\
 */\n\
\n\
(function(context) {\n\
  /**\n\
   * The `Sequence` object provides a unified API encapsulating the notion of\n\
   * zero or more consecutive elements in a collection, stream, etc.\n\
   *\n\
   * Lazy evaluation\n\
   * ---------------\n\
   *\n\
   * Generally speaking, creating a sequence should not be an expensive operation,\n\
   * and should not iterate over an underlying source or trigger any side effects.\n\
   * This means that chaining together methods that return sequences incurs only\n\
   * the cost of creating the `Sequence` objects themselves and not the cost of\n\
   * iterating an underlying data source multiple times.\n\
   *\n\
   * The following code, for example, creates 4 sequences and does nothing with\n\
   * `source`:\n\
   *\n\
   *     var seq = Lazy(source) // 1st sequence\n\
   *       .map(func)           // 2nd\n\
   *       .filter(pred)        // 3rd\n\
   *       .reverse();          // 4th\n\
   *\n\
   * Lazy's convention is to hold off on iterating or otherwise *doing* anything\n\
   * (aside from creating `Sequence` objects) until you call `each`:\n\
   *\n\
   *     seq.each(function(x) { console.log(x); });\n\
   *\n\
   * Defining custom sequences\n\
   * -------------------------\n\
   *\n\
   * Defining your own type of sequence is relatively simple:\n\
   *\n\
   * 1. Pass a *method name* and an object containing *function overrides* to\n\
   *    {@link Sequence.define}. If the object includes a function called `init`,\n\
   *    this function will be called upon initialization of a sequence of this\n\
   *    type. The function **must at least accept a `parent` parameter as its\n\
   *    first argument**, which will be set to the underlying parent sequence.\n\
   * 2. The object should include at least either a `getIterator` method or an\n\
   *    `each` method. The former supports both asynchronous and synchronous\n\
   *    iteration, but is slightly more cumbersome to implement. The latter\n\
   *    supports synchronous iteration and can be automatically implemented in\n\
   *    terms of the former. You can also implement both to optimize performance.\n\
   *    For more info, see {@link Iterator} and {@link AsyncSequence}.\n\
   *\n\
   * As a trivial example, the following code defines a new type of sequence\n\
   * called `SampleSequence` which randomly may or may not include each element\n\
   * from its parent.\n\
   *\n\
   *     var SampleSequence = Lazy.Sequence.define(\"sample\", {\n\
   *       each: function(fn) {\n\
   *         return this.parent.each(function(e) {\n\
   *           // 50/50 chance of including this element.\n\
   *           if (Math.random() > 0.5) {\n\
   *             return fn(e);\n\
   *           }\n\
   *         });\n\
   *       }\n\
   *     });\n\
   *\n\
   * (Of course, the above could also easily have been implemented using\n\
   * {@link #filter} instead of creating a custom sequence. But I *did* say this\n\
   * was a trivial example, to be fair.)\n\
   *\n\
   * Now it will be possible to create this type of sequence from any parent\n\
   * sequence by calling the method name you specified. In other words, you can\n\
   * now do this:\n\
   *\n\
   *     Lazy(arr).sample();\n\
   *     Lazy(arr).map(func).sample();\n\
   *     Lazy(arr).map(func).filter(pred).sample();\n\
   *\n\
   * Etc., etc.\n\
   *\n\
   * Note: The reason the `init` function needs to accept a `parent` parameter as\n\
   * its first argument (as opposed to Lazy handling that by default) has to do\n\
   * with performance, which is a top priority for this library. While the logic\n\
   * to do this automatically is possible to implement, it is not as efficient as\n\
   * requiring custom sequence types to do it themselves.\n\
   *\n\
   * @constructor\n\
   */\n\
  function Sequence() {}\n\
\n\
  /**\n\
   * Create a new constructor function for a type inheriting from `Sequence`.\n\
   *\n\
   * @param {string|Array.<string>} methodName The name(s) of the method(s) to be\n\
   *     used for constructing the new sequence. The method will be attached to\n\
   *     the `Sequence` prototype so that it can be chained with any other\n\
   *     sequence methods, like {@link #map}, {@link #filter}, etc.\n\
   * @param {Object} overrides An object containing function overrides for this\n\
   *     new sequence type.\n\
   * @returns {Function} A constructor for a new type inheriting from `Sequence`.\n\
   *\n\
   * @example\n\
   * // This sequence type logs every element to the console\n\
   * // as it iterates over it.\n\
   * var VerboseSequence = Sequence.define(\"verbose\", {\n\
   *   each: function(fn) {\n\
   *     return this.parent.each(function(e, i) {\n\
   *       console.log(e);\n\
   *       return fn(e, i);\n\
   *     });\n\
   *   }\n\
   * });\n\
   *\n\
   * Lazy([1, 2, 3]).verbose().toArray();\n\
   * // (logs the numbers 1, 2, and 3 to the console)\n\
   */\n\
  Sequence.define = function(methodName, overrides) {\n\
    if (!overrides || (!overrides.getIterator && !overrides.each)) {\n\
      throw \"A custom sequence must implement *at least* getIterator or each!\";\n\
    }\n\
\n\
    // Define a constructor that sets this sequence's parent to the first argument\n\
    // and (optionally) applies any additional initialization logic.\n\
\n\
    /** @constructor */\n\
    var init = overrides.init;\n\
    var ctor = init ? function(var_args) {\n\
                        this.parent = arguments[0];\n\
                        init.apply(this, arguments);\n\
                      } :\n\
                      function(var_args) {\n\
                        this.parent = arguments[0];\n\
                      };\n\
\n\
    // Make this type inherit from Sequence.\n\
    ctor.prototype = new Sequence();\n\
\n\
    // Attach overrides to the new Sequence type's prototype.\n\
    delete overrides.init;\n\
    for (var name in overrides) {\n\
      ctor.prototype[name] = overrides[name];\n\
    }\n\
\n\
    // Expose the constructor as a chainable method so that we can do:\n\
    // Lazy(...).map(...).filter(...).blah(...);\n\
    var methodNames = typeof methodName === 'string' ? [methodName] : methodName;\n\
    for (var i = 0; i < methodNames.length; ++i) {\n\
      /**\n\
       * @skip\n\
       * @suppress {checkTypes}\n\
       */\n\
      switch ((init && init.length) || 0) {\n\
        case 0:\n\
          Sequence.prototype[methodNames[i]] = function() {\n\
            return new ctor(this);\n\
          };\n\
          break;\n\
\n\
        case 1:\n\
          Sequence.prototype[methodNames[i]] = function(arg1) {\n\
            return new ctor(this, arg1);\n\
          };\n\
          break;\n\
\n\
        case 2:\n\
          Sequence.prototype[methodNames[i]] = function(arg1, arg2) {\n\
            return new ctor(this, arg1, arg2);\n\
          };\n\
          break;\n\
\n\
        case 3:\n\
          Sequence.prototype[methodNames[i]] = function(arg1, arg2, arg3) {\n\
            return new ctor(this, arg1, arg2, arg3);\n\
          };\n\
          break;\n\
\n\
        default:\n\
          throw 'Really need more than three arguments? https://github.com/dtao/lazy.js/issues/new';\n\
      }\n\
    }\n\
\n\
    return ctor;\n\
  };\n\
\n\
  /**\n\
   * Creates an array snapshot of a sequence.\n\
   *\n\
   * Note that for indefinite sequences, this method may raise an exception or\n\
   * (worse) cause the environment to hang.\n\
   *\n\
   * @returns {Array} An array containing the current contents of the sequence.\n\
   *\n\
   * @examples\n\
   * Lazy([1, 2, 3]).toArray() // => [1, 2, 3]\n\
   */\n\
  Sequence.prototype.toArray = function() {\n\
    var array = [];\n\
    this.each(function(e) {\n\
      array.push(e);\n\
    });\n\
\n\
    return array;\n\
  };\n\
\n\
  /**\n\
   * Creates an object from a sequence of key/value pairs.\n\
   *\n\
   * @returns {Object} An object with keys and values corresponding to the pairs\n\
   *     of elements in the sequence.\n\
   *\n\
   * @examples\n\
   * var details = [\n\
   *   [\"first\", \"Dan\"],\n\
   *   [\"last\", \"Tao\"],\n\
   *   [\"age\", 29]\n\
   * ];\n\
   *\n\
   * Lazy(details).toObject() // => { first: \"Dan\", last: \"Tao\", age: 29 }\n\
   */\n\
  Sequence.prototype.toObject = function() {\n\
    var object = {};\n\
    this.each(function(e) {\n\
      object[e[0]] = e[1];\n\
    });\n\
\n\
    return object;\n\
  };\n\
\n\
  /**\n\
   * Iterates over this sequence and executes a function for every element.\n\
   *\n\
   * @param {Function} fn The function to call on each element in the sequence.\n\
   *     Return false from the function to end the iteration.\n\
   *\n\
   * @examples\n\
   * Lazy(['fizz', 'buzz']).each(function(str) { console.log(str); });\n\
   */\n\
  Sequence.prototype.each = function(fn) {\n\
    var iterator = this.getIterator(),\n\
        i = -1;\n\
\n\
    while (iterator.moveNext()) {\n\
      if (fn(iterator.current(), ++i) === false) {\n\
        return false;\n\
      }\n\
    }\n\
\n\
    return true;\n\
  };\n\
\n\
  /**\n\
   * Alias for {@link Sequence#each}.\n\
   */\n\
  Sequence.prototype.forEach = function(fn) {\n\
    return this.each(fn);\n\
  };\n\
\n\
  /**\n\
   * Creates a new sequence whose values are calculated by passing this sequence's\n\
   * elements through some mapping function.\n\
   *\n\
   * @function map\n\
   * @memberOf Sequence\n\
   * @instance\n\
   * @aka collect\n\
   *\n\
   * @param {Function} mapFn The mapping function used to project this sequence's\n\
   *     elements onto a new sequence.\n\
   * @returns {Sequence} The new sequence.\n\
   *\n\
   * @examples\n\
   * function increment(x) { return x + 1; }\n\
   *\n\
   * Lazy([]).map(increment)        // => []\n\
   * Lazy([1, 2, 3]).map(increment) // => [2, 3, 4]\n\
   *\n\
   * @benchmarks\n\
   * function increment(x) { return x + 1; }\n\
   *\n\
   * var smArr = Lazy.range(10).toArray(),\n\
   *     lgArr = Lazy.range(100).toArray();\n\
   *\n\
   * Lazy(smArr).map(increment).each(Lazy.noop) // lazy - 10 elements\n\
   * Lazy(lgArr).map(increment).each(Lazy.noop) // lazy - 100 elements\n\
   * _.each(_.map(smArr, increment), Lazy.noop) // lodash - 10 elements\n\
   * _.each(_.map(lgArr, increment), Lazy.noop) // lodash - 100 elements\n\
   */\n\
  Sequence.prototype.map = function(mapFn) {\n\
    if (typeof mapFn === \"string\") {\n\
      return this.pluck(mapFn);\n\
    }\n\
\n\
    return new MappedSequence(this, mapFn);\n\
  };\n\
\n\
  /**\n\
   * Alias for {@link Sequence#map}.\n\
   *\n\
   * @function collect\n\
   * @memberOf Sequence\n\
   * @instance\n\
   */\n\
  Sequence.prototype.collect = Sequence.prototype.map;\n\
\n\
  /**\n\
   * Creates a new sequence whose values are calculated by accessing the specified\n\
   * property from each element in this sequence.\n\
   *\n\
   * @param {string} propertyName The name of the property to access for every\n\
   *     element in this sequence.\n\
   * @returns {Sequence} The new sequence.\n\
   *\n\
   * @examples\n\
   * var people = [\n\
   *   { first: \"Dan\", last: \"Tao\" },\n\
   *   { first: \"Bob\", last: \"Smith\" }\n\
   * ];\n\
   *\n\
   * Lazy(people).pluck(\"last\") // => [\"Tao\", \"Smith\"]\n\
   */\n\
  Sequence.prototype.pluck = function(propertyName) {\n\
    return this.map(function(e) {\n\
      return e[propertyName];\n\
    });\n\
  };\n\
\n\
  /**\n\
   * Creates a new sequence whose values are calculated by invoking the specified\n\
   * function on each element in this sequence.\n\
   *\n\
   * @param {string} methodName The name of the method to invoke for every element\n\
   *     in this sequence.\n\
   * @returns {Sequence} The new sequence.\n\
   *\n\
   * @examples\n\
   * function Person(first, last) {\n\
   *   this.fullName = function() {\n\
   *     return first + \" \" + last;\n\
   *   };\n\
   * }\n\
   *\n\
   * var people = [\n\
   *   new Person(\"Dan\", \"Tao\"),\n\
   *   new Person(\"Bob\", \"Smith\")\n\
   * ];\n\
   *\n\
   * Lazy(people).invoke(\"fullName\") // => [\"Dan Tao\", \"Bob Smith\"]\n\
   */\n\
  Sequence.prototype.invoke = function(methodName) {\n\
    return this.map(function(e) {\n\
      return e[methodName]();\n\
    });\n\
  };\n\
\n\
  /**\n\
   * Creates a new sequence whose values are the elements of this sequence which\n\
   * satisfy the specified predicate.\n\
   *\n\
   * @function filter\n\
   * @memberOf Sequence\n\
   * @instance\n\
   * @aka select\n\
   *\n\
   * @param {Function} filterFn The predicate to call on each element in this\n\
   *     sequence, which returns true if the element should be included.\n\
   * @returns {Sequence} The new sequence.\n\
   *\n\
   * @examples\n\
   * function isEven(x) { return x % 2 === 0; }\n\
   *\n\
   * var numbers = [1, 2, 3, 4, 5, 6];\n\
   *\n\
   * Lazy(numbers).select(isEven) // => [2, 4, 6]\n\
   *\n\
   * @benchmarks\n\
   * function isEven(x) { return x % 2 === 0; }\n\
   *\n\
   * var smArr = Lazy.range(10).toArray(),\n\
   *     lgArr = Lazy.range(100).toArray();\n\
   *\n\
   * Lazy(smArr).select(isEven).each(Lazy.noop) // lazy - 10 elements\n\
   * Lazy(lgArr).select(isEven).each(Lazy.noop) // lazy - 100 elements\n\
   * _.each(_.select(smArr, isEven), Lazy.noop) // lodash - 10 elements\n\
   * _.each(_.select(lgArr, isEven), Lazy.noop) // lodash - 100 elements\n\
   */\n\
  Sequence.prototype.select = function(filterFn) {\n\
    return new FilteredSequence(this, createCallback(filterFn));\n\
  };\n\
\n\
  /**\n\
   * Alias for {@link Sequence#select}.\n\
   *\n\
   * @function filter\n\
   * @memberOf Sequence\n\
   * @instance\n\
   */\n\
  Sequence.prototype.filter = Sequence.prototype.select;\n\
\n\
  /**\n\
   * Creates a new sequence whose values exclude the elements of this sequence\n\
   * identified by the specified predicate.\n\
   *\n\
   * @param {Function} rejectFn The predicate to call on each element in this\n\
   *     sequence, which returns true if the element should be omitted.\n\
   * @returns {Sequence} The new sequence.\n\
   *\n\
   * @examples\n\
   * function isEven(x) { return x % 2 === 0; }\n\
   *\n\
   * Lazy([1, 2, 3, 4, 5]).reject(isEven) // => [1, 3, 5]\n\
   */\n\
  Sequence.prototype.reject = function(rejectFn) {\n\
    return this.filter(function(e) {\n\
      return !rejectFn(e);\n\
    });\n\
  };\n\
\n\
  /**\n\
   * Creates a new sequence whose values are the elements of this sequence with\n\
   * property names and values matching those of the specified object.\n\
   *\n\
   * @param {Object} properties The properties that should be found on every\n\
   *     element that is to be included in this sequence.\n\
   * @returns {Sequence} The new sequence.\n\
   *\n\
   * @examples\n\
   * var people = [\n\
   *   { first: \"Dan\", last: \"Tao\" },\n\
   *   { first: \"Bob\", last: \"Smith\" }\n\
   * ];\n\
   *\n\
   * Lazy(people).where({ first: \"Dan\" }) // => [{ first: \"Dan\", last: \"Tao\" }]\n\
   *\n\
   * @benchmarks\n\
   * var animals = [\"dog\", \"cat\", \"mouse\", \"horse\", \"pig\", \"snake\"];\n\
   *\n\
   * Lazy(animals).where({ length: 3 }).each(Lazy.noop) // lazy\n\
   * _.each(_.where(animals, { length: 3 }), Lazy.noop) // lodash\n\
   */\n\
  Sequence.prototype.where = function(properties) {\n\
    return this.filter(function(e) {\n\
      for (var p in properties) {\n\
        if (e[p] !== properties[p]) {\n\
          return false;\n\
        }\n\
      }\n\
      return true;\n\
    });\n\
  };\n\
\n\
  /**\n\
   * Creates a new sequence with the same elements as this one, but to be iterated\n\
   * in the opposite order.\n\
   *\n\
   * Note that in some (but not all) cases, the only way to create such a sequence\n\
   * may require iterating the entire underlying source when `each` is called.\n\
   *\n\
   * @returns {Sequence} The new sequence.\n\
   *\n\
   * @examples\n\
   * var alphabet = \"abcdefghijklmnopqrstuvwxyz\";\n\
   *\n\
   * Lazy(alphabet).reverse() // => \"zxywvutsrqponmlkjihgfedcba\".split(\"\")\n\
   */\n\
  var ReversedSequence = Sequence.define(\"reverse\", {\n\
    each: function(fn) {\n\
      var parentArray = this.parent.toArray(),\n\
          i = parentArray.length;\n\
      while (--i >= 0) {\n\
        if (fn(parentArray[i]) === false) {\n\
          break;\n\
        }\n\
      }\n\
    }\n\
  });\n\
\n\
  /**\n\
   * Creates a new sequence with all of the elements of this one, plus those of\n\
   * the given array(s).\n\
   *\n\
   * @param {...*} var_args One or more values (or arrays of values) to use for\n\
   *     additional items after this sequence.\n\
   * @returns {Sequence} The new sequence.\n\
   *\n\
   * @examples\n\
   * var left  = [1, 2, 3];\n\
   * var right = [4, 5, 6];\n\
   *\n\
   * Lazy(left).concat(right)  // => [1, 2, 3, 4, 5, 6]\n\
   */\n\
  Sequence.prototype.concat = function(var_args) {\n\
    return new ConcatenatedSequence(this, Array.prototype.slice.call(arguments, 0));\n\
  };\n\
\n\
  /**\n\
   * Creates a new sequence comprising the first N elements from this sequence, OR\n\
   * (if N is `undefined`) simply returns the first element of this sequence.\n\
   *\n\
   * @param {number=} count The number of elements to take from this sequence. If\n\
   *     this value exceeds the length of the sequence, the resulting sequence\n\
   *     will be essentially the same as this one.\n\
   * @returns {*} The new sequence (or the first element from this sequence if\n\
   *     no count was given).\n\
   *\n\
   * @examples\n\
   * function powerOfTwo(exp) {\n\
   *   return Math.pow(2, exp);\n\
   * }\n\
   *\n\
   * Lazy.generate(powerOfTwo).first()          // => 1\n\
   * Lazy.generate(powerOfTwo).first(5)         // => [1, 2, 4, 8, 16]\n\
   * Lazy.generate(powerOfTwo).skip(2).first()  // => 4\n\
   * Lazy.generate(powerOfTwo).skip(2).first(2) // => [4, 8]\n\
   */\n\
  Sequence.prototype.first = function(count) {\n\
    if (typeof count === \"undefined\") {\n\
      return getFirst(this);\n\
    }\n\
\n\
    return new TakeSequence(this, count);\n\
  };\n\
\n\
  /**\n\
   * Alias for {@link Sequence#first}.\n\
   *\n\
   * @function head\n\
   * @memberOf Sequence\n\
   * @instance\n\
   */\n\
  Sequence.prototype.head = Sequence.prototype.first;\n\
\n\
  /**\n\
   * Alias for {@link Sequence#first}.\n\
   *\n\
   * @function take\n\
   * @memberOf Sequence\n\
   * @instance\n\
   */\n\
  Sequence.prototype.take = Sequence.prototype.first;\n\
\n\
  /**\n\
   * Creates a new sequence comprising the elements from the head of this sequence\n\
   * that satisfy some predicate. Once an element is encountered that doesn't\n\
   * satisfy the predicate, iteration will stop.\n\
   *\n\
   * @param {Function} predicate\n\
   * @returns {Sequence} The new sequence\n\
   *\n\
   * @examples\n\
   * function lessThan(x) {\n\
   *   return function(y) {\n\
   *     return y < x;\n\
   *   };\n\
   * }\n\
   *\n\
   * Lazy([1, 2, 3, 4]).takeWhile(lessThan(3)) // => [1, 2]\n\
   * Lazy([1, 2, 3, 4]).takeWhile(lessThan(0)) // => []\n\
   */\n\
  Sequence.prototype.takeWhile = function(predicate) {\n\
    return new TakeWhileSequence(this, predicate);\n\
  };\n\
\n\
  /**\n\
   * Creates a new sequence comprising all but the last N elements of this\n\
   * sequence.\n\
   *\n\
   * @param {number=} count The number of items to omit from the end of the\n\
   *     sequence (defaults to 1).\n\
   * @returns {Sequence} The new sequence.\n\
   *\n\
   * @examples\n\
   * Lazy([1, 2, 3, 4]).initial()  // => [1, 2, 3]\n\
   * Lazy([1, 2, 3, 4]).initial(2) // => [1, 2]\n\
   */\n\
  Sequence.prototype.initial = function(count) {\n\
    if (typeof count === \"undefined\") {\n\
      count = 1;\n\
    }\n\
    return this.take(this.length() - count);\n\
  };\n\
\n\
  /**\n\
   * Creates a new sequence comprising the last N elements of this sequence, OR\n\
   * (if N is `undefined`) simply returns the last element of this sequence.\n\
   *\n\
   * @param {number=} count The number of items to take from the end of the\n\
   *     sequence.\n\
   * @returns {*} The new sequence (or the last element from this sequence\n\
   *     if no count was given).\n\
   *\n\
   * @examples\n\
   * Lazy([1, 2, 3]).last()  // => 3\n\
   * Lazy([1, 2, 3]).last(2) // => [2, 3]\n\
   */\n\
  Sequence.prototype.last = function(count) {\n\
    if (typeof count === \"undefined\") {\n\
      return this.reverse().first();\n\
    }\n\
    return this.reverse().take(count).reverse();\n\
  };\n\
\n\
  /**\n\
   * Returns the first element in this sequence with property names and values\n\
   * matching those of the specified object.\n\
   *\n\
   * @param {Object} properties The properties that should be found on some\n\
   *     element in this sequence.\n\
   * @returns {*} The found element, or `undefined` if none exists in this\n\
   *     sequence.\n\
   *\n\
   * @examples\n\
   * var words = [\"foo\", \"bar\"];\n\
   *\n\
   * Lazy(words).findWhere({ 0: \"f\" }); // => \"foo\"\n\
   * Lazy(words).findWhere({ 0: \"z\" }); // => undefined\n\
   */\n\
  Sequence.prototype.findWhere = function(properties) {\n\
    return this.where(properties).first();\n\
  };\n\
\n\
  /**\n\
   * Creates a new sequence comprising all but the first N elements of this\n\
   * sequence.\n\
   *\n\
   * @param {number=} count The number of items to omit from the beginning of the\n\
   *     sequence (defaults to 1).\n\
   * @returns {Sequence} The new sequence.\n\
   *\n\
   * @example\n\
   * var numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];\n\
   * var lastFive = Lazy(numbers).rest(5);\n\
   * // #=> sequence: (6, 7, 8, 9, 10)\n\
   */\n\
  var DropSequence = Sequence.define([\"drop\", \"skip\", \"tail\", \"rest\"], {\n\
    init: function(parent, count) {\n\
      this.count = typeof count === \"number\" ? count : 1;\n\
    },\n\
\n\
    each: function(fn) {\n\
      var self = this,\n\
          i = 0;\n\
      self.parent.each(function(e) {\n\
        if (i++ < self.count) { return; }\n\
        return fn(e);\n\
      });\n\
    }\n\
  });\n\
\n\
  /**\n\
   * Creates a new sequence comprising the elements from this sequence *after*\n\
   * those that satisfy some predicate. The sequence starts with the first\n\
   * element that does not match the predicate.\n\
   *\n\
   * @param {Function} predicate\n\
   * @returns {Sequence} The new sequence\n\
   */\n\
  Sequence.prototype.dropWhile = Sequence.prototype.skipWhile = function(predicate) {\n\
    return new DropWhileSequence(this, predicate);\n\
  };\n\
\n\
  /**\n\
   * Creates a new sequence with the same elements as this one, but ordered\n\
   * according to the values returned by the specified function.\n\
   *\n\
   * @param {Function} sortFn The function to call on the elements in this\n\
   *     sequence, in order to sort them.\n\
   * @returns {Sequence} The new sequence.\n\
   *\n\
   * @examples\n\
   * function population(country) {\n\
   *   return country.pop;\n\
   * }\n\
   *\n\
   * function area(country) {\n\
   *   return country.sqkm;\n\
   * }\n\
   *\n\
   * var countries = [\n\
   *   { name: \"USA\", pop: 320000000, sqkm: 9600000 },\n\
   *   { name: \"Brazil\", pop: 194000000, sqkm: 8500000 },\n\
   *   { name: \"Nigeria\", pop: 174000000, sqkm: 924000 },\n\
   *   { name: \"China\", pop: 1350000000, sqkm: 9700000 },\n\
   *   { name: \"Russia\", pop: 143000000, sqkm: 17000000 },\n\
   *   { name: \"Australia\", pop: 23000000, sqkm: 7700000 }\n\
   * ];\n\
   *\n\
   * Lazy(countries).sortBy(population).last(3).pluck('name') // => [\"Brazil\", \"USA\", \"China\"]\n\
   * Lazy(countries).sortBy(area).last(3).pluck('name')       // => [\"USA\", \"China\", \"Russia\"]\n\
   *\n\
   * @benchmarks\n\
   * var randoms = Lazy.generate(Math.random).take(100).toArray();\n\
   *\n\
   * Lazy(randoms).sortBy(Lazy.identity).each(Lazy.noop) // lazy\n\
   * _.each(_.sortBy(randoms, Lazy.identity), Lazy.noop) // lodash\n\
   */\n\
  Sequence.prototype.sortBy = function(sortFn) {\n\
    return new SortedSequence(this, sortFn);\n\
  };\n\
\n\
  /**\n\
   * Creates a new sequence comprising the elements in this one, grouped\n\
   * together according to some key. The elements of the new sequence are pairs\n\
   * of the form `[key, values]` where `values` is an array containing all of\n\
   * the elements in this sequence with the same key.\n\
   *\n\
   * @param {Function|string} keyFn The function to call on the elements in this\n\
   *     sequence to obtain a key by which to group them, or a string representing\n\
   *     a parameter to read from all the elements in this sequence.\n\
   * @returns {Sequence} The new sequence.\n\
   *\n\
   * @examples\n\
   * function oddOrEven(x) {\n\
   *   return x % 2 === 0 ? 'even' : 'odd';\n\
   * }\n\
   *\n\
   * var numbers = [1, 2, 3, 4, 5];\n\
   *\n\
   * Lazy(numbers).groupBy(oddOrEven) // => [[\"odd\", [1, 3, 5]], [\"even\", [2, 4]]]\n\
   */\n\
  Sequence.prototype.groupBy = function(keyFn) {\n\
    return new GroupedSequence(this, keyFn);\n\
  };\n\
\n\
  /**\n\
   * Creates a new sequence containing the unique keys of all the elements in\n\
   * this sequence, each paired with a number representing the number of times\n\
   * that key appears in the sequence.\n\
   *\n\
   * @param {Function} keyFn The function to call on the elements in this\n\
   *     sequence to obtain a key by which to count them.\n\
   * @returns {Sequence} The new sequence.\n\
   *\n\
   * @examples\n\
   * function oddOrEven(x) {\n\
   *   return x % 2 === 0 ? 'even' : 'odd';\n\
   * }\n\
   *\n\
   * var numbers = [1, 2, 3, 4, 5];\n\
   *\n\
   * Lazy(numbers).countBy(oddOrEven) // => [[\"odd\", 3], [\"even\", 2]]\n\
   */\n\
  Sequence.prototype.countBy = function(keyFn) {\n\
    return new CountedSequence(this, keyFn);\n\
  };\n\
\n\
  /**\n\
   * Creates a new sequence with every unique element from this one appearing\n\
   * exactly once (i.e., with duplicates removed).\n\
   *\n\
   * @returns {Sequence} The new sequence.\n\
   *\n\
   * @examples\n\
   * Lazy([1, 2, 2, 3, 3, 3]).uniq() // => [1, 2, 3]\n\
   *\n\
   * @benchmarks\n\
   * function randomOf(array) {\n\
   *   return function() {\n\
   *     return array[Math.floor(Math.random() * array.length)];\n\
   *   };\n\
   * }\n\
   *\n\
   * var mostUnique = Lazy.generate(randomOf(_.range(100)), 100).toArray(),\n\
   *     someUnique = Lazy.generate(randomOf(_.range(50)), 100).toArray(),\n\
   *     mostDupes  = Lazy.generate(randomOf(_.range(5)), 100).toArray();\n\
   *\n\
   * Lazy(mostUnique).uniq().each(Lazy.noop) // lazy - mostly unique elements\n\
   * Lazy(someUnique).uniq().each(Lazy.noop) // lazy - some unique elements\n\
   * Lazy(mostDupes).uniq().each(Lazy.noop)  // lazy - mostly duplicate elements\n\
   * _.each(_.uniq(mostUnique), Lazy.noop)   // lodash - mostly unique elements\n\
   * _.each(_.uniq(someUnique), Lazy.noop)   // lodash - some unique elements\n\
   * _.each(_.uniq(mostDupes), Lazy.noop)    // lodash - mostly duplicate elements\n\
   */\n\
  Sequence.prototype.uniq = function(keyFn) {\n\
    return new UniqueSequence(this, createCallback(keyFn));\n\
  };\n\
\n\
  /**\n\
   * Alias for {@link Sequence#uniq}.\n\
   *\n\
   * @function unique\n\
   * @memberOf Sequence\n\
   * @instance\n\
   */\n\
  Sequence.prototype.unique = Sequence.prototype.uniq;\n\
\n\
  /**\n\
   * Creates a new sequence by combining the elements from this sequence with\n\
   * corresponding elements from the specified array(s).\n\
   *\n\
   * @param {...Array} var_args One or more arrays of elements to combine with\n\
   *     those of this sequence.\n\
   * @returns {Sequence} The new sequence.\n\
   *\n\
   * @examples\n\
   * Lazy([1, 2]).zip([3, 4]) // => [[1, 3], [2, 4]]\n\
   *\n\
   * @benchmarks\n\
   * var smArrL = Lazy.range(10).toArray(),\n\
   *     smArrR = Lazy.range(10, 20).toArray(),\n\
   *     lgArrL = Lazy.range(100).toArray(),\n\
   *     lgArrR = Lazy.range(100, 200).toArray();\n\
   *\n\
   * Lazy(smArrL).zip(smArrR).each(Lazy.noop) // lazy - zipping 10-element arrays\n\
   * Lazy(lgArrL).zip(lgArrR).each(Lazy.noop) // lazy - zipping 100-element arrays\n\
   * _.each(_.zip(smArrL, smArrR), Lazy.noop) // lodash - zipping 10-element arrays\n\
   * _.each(_.zip(lgArrL, lgArrR), Lazy.noop) // lodash - zipping 100-element arrays\n\
   */\n\
  Sequence.prototype.zip = function(var_args) {\n\
    if (arguments.length === 1) {\n\
      return new SimpleZippedSequence(this, (/** @type {Array} */ var_args));\n\
    } else {\n\
      return new ZippedSequence(this, Array.prototype.slice.call(arguments, 0));\n\
    }\n\
  };\n\
\n\
  /**\n\
   * Creates a new sequence with the same elements as this one, in a randomized\n\
   * order.\n\
   *\n\
   * @returns {Sequence} The new sequence.\n\
   *\n\
   * @examples\n\
   * Lazy([1, 2, 3, 4, 5]).shuffle() // => [2, 3, 5, 4, 1]\n\
   */\n\
  Sequence.prototype.shuffle = function() {\n\
    return new ShuffledSequence(this);\n\
  };\n\
\n\
  /**\n\
   * Creates a new sequence with every element from this sequence, and with arrays\n\
   * exploded so that a sequence of arrays (of arrays) becomes a flat sequence of\n\
   * values.\n\
   *\n\
   * @returns {Sequence} The new sequence.\n\
   *\n\
   * @examples\n\
   * Lazy([1, [2, 3], [4, [5]]]).flatten() // => [1, 2, 3, 4, 5]\n\
   */\n\
  Sequence.prototype.flatten = function() {\n\
    return new FlattenedSequence(this);\n\
  };\n\
\n\
  /**\n\
   * Creates a new sequence with the same elements as this one, except for all\n\
   * falsy values (`false`, `0`, `\"\"`, `null`, and `undefined`).\n\
   *\n\
   * @returns {Sequence} The new sequence.\n\
   *\n\
   * @examples\n\
   * Lazy([\"foo\", null, \"bar\", undefined]).compact() // => [\"foo\", \"bar\"]\n\
   */\n\
  Sequence.prototype.compact = function() {\n\
    return this.filter(function(e) { return !!e; });\n\
  };\n\
\n\
  /**\n\
   * Creates a new sequence with all the elements of this sequence that are not\n\
   * also among the specified arguments.\n\
   *\n\
   * @param {...*} var_args The values, or array(s) of values, to be excluded from the\n\
   *     resulting sequence.\n\
   * @returns {Sequence} The new sequence.\n\
   *\n\
   * @examples\n\
   * Lazy([1, 2, 3, 4, 5]).without(2, 3)   // => [1, 4, 5]\n\
   * Lazy([1, 2, 3, 4, 5]).without([4, 5]) // => [1, 2, 3]\n\
   */\n\
  Sequence.prototype.without = function(var_args) {\n\
    return new WithoutSequence(this, Array.prototype.slice.call(arguments, 0));\n\
  };\n\
\n\
  /**\n\
   * Alias for {@link Sequence#without}.\n\
   *\n\
   * @function difference\n\
   * @memberOf Sequence\n\
   * @instance\n\
   */\n\
  Sequence.prototype.difference = Sequence.prototype.without;\n\
\n\
  /**\n\
   * Creates a new sequence with all the unique elements either in this sequence\n\
   * or among the specified arguments.\n\
   *\n\
   * @param {...*} var_args The values, or array(s) of values, to be additionally\n\
   *     included in the resulting sequence.\n\
   * @returns {Sequence} The new sequence.\n\
   *\n\
   * @examples\n\
   * Lazy([\"foo\", \"bar\"]).union([])             // => [\"foo\", \"bar\"]\n\
   * Lazy([\"foo\", \"bar\"]).union([\"bar\", \"baz\"]) // => [\"foo\", \"bar\", \"baz\"]\n\
   */\n\
  Sequence.prototype.union = function(var_args) {\n\
    return this.concat(var_args).uniq();\n\
  };\n\
\n\
  /**\n\
   * Creates a new sequence with all the elements of this sequence that also\n\
   * appear among the specified arguments.\n\
   *\n\
   * @param {...*} var_args The values, or array(s) of values, in which elements\n\
   *     from this sequence must also be included to end up in the resulting sequence.\n\
   * @returns {Sequence} The new sequence.\n\
   *\n\
   * @examples\n\
   * Lazy([\"foo\", \"bar\"]).intersection([])             // => []\n\
   * Lazy([\"foo\", \"bar\"]).intersection([\"bar\", \"baz\"]) // => [\"bar\"]\n\
   */\n\
  Sequence.prototype.intersection = function(var_args) {\n\
    if (arguments.length === 1 && arguments[0] instanceof Array) {\n\
      return new SimpleIntersectionSequence(this, (/** @type {Array} */ var_args));\n\
    } else {\n\
      return new IntersectionSequence(this, Array.prototype.slice.call(arguments, 0));\n\
    }\n\
  };\n\
\n\
  /**\n\
   * Checks whether every element in this sequence satisfies a given predicate.\n\
   *\n\
   * @param {Function} predicate A function to call on (potentially) every element\n\
   *     in this sequence.\n\
   * @returns {boolean} True if `predicate` returns true for every element in the\n\
   *     sequence (or the sequence is empty). False if `predicate` returns false\n\
   *     for at least one element.\n\
   *\n\
   * @examples\n\
   * function isEven(x) { return x % 2 === 0; }\n\
   * function isPositive(x) { return x > 0; }\n\
   *\n\
   * var numbers = [1, 2, 3, 4, 5];\n\
   *\n\
   * Lazy(numbers).every(isEven)     // => false\n\
   * Lazy(numbers).every(isPositive) // => true\n\
   */\n\
  Sequence.prototype.every = function(predicate) {\n\
    var success = true;\n\
    this.each(function(e, i) {\n\
      if (!predicate(e, i)) {\n\
        success = false;\n\
        return false;\n\
      }\n\
    });\n\
    return success;\n\
  };\n\
\n\
  /**\n\
   * Alias for {@link Sequence#every}.\n\
   *\n\
   * @function all\n\
   * @memberOf Sequence\n\
   * @instance\n\
   */\n\
  Sequence.prototype.all = Sequence.prototype.every;\n\
\n\
  /**\n\
   * Checks whether at least one element in this sequence satisfies a given\n\
   * predicate (or, if no predicate is specified, whether the sequence contains at\n\
   * least one element).\n\
   *\n\
   * @param {Function=} predicate A function to call on (potentially) every element\n\
   *     in this sequence.\n\
   * @returns {boolean} True if `predicate` returns true for at least one element\n\
   *     in the sequence. False if `predicate` returns false for every element (or\n\
   *     the sequence is empty).\n\
   *\n\
   * @examples\n\
   * function isEven(x) { return x % 2 === 0; }\n\
   * function isNegative(x) { return x < 0; }\n\
   *\n\
   * var numbers = [1, 2, 3, 4, 5];\n\
   *\n\
   * Lazy(numbers).some(isEven)     // => true\n\
   * Lazy(numbers).some(isNegative) // => false\n\
   */\n\
  Sequence.prototype.some = function(predicate) {\n\
    if (!predicate) {\n\
      predicate = function() { return true; };\n\
    }\n\
\n\
    var success = false;\n\
    this.each(function(e) {\n\
      if (predicate(e)) {\n\
        success = true;\n\
        return false;\n\
      }\n\
    });\n\
    return success;\n\
  };\n\
\n\
  /**\n\
   * Alias for {@link Sequence#some}.\n\
   *\n\
   * @function any\n\
   * @memberOf Sequence\n\
   * @instance\n\
   */\n\
  Sequence.prototype.any = Sequence.prototype.some;\n\
\n\
  /**\n\
   * Checks whether the sequence has no elements.\n\
   *\n\
   * @returns {boolean} True if the sequence is empty, false if it contains at\n\
   *     least one element.\n\
   *\n\
   * @examples\n\
   * Lazy([]).isEmpty()        // => true\n\
   * Lazy([1, 2, 3]).isEmpty() // => false\n\
   */\n\
  Sequence.prototype.isEmpty = function() {\n\
    return !this.any();\n\
  };\n\
\n\
  /**\n\
   * Performs (at worst) a linear search from the head of this sequence,\n\
   * returning the first index at which the specified value is found.\n\
   *\n\
   * @param {*} value The element to search for in the sequence.\n\
   * @returns {number} The index within this sequence where the given value is\n\
   *     located, or -1 if the sequence doesn't contain the value.\n\
   *\n\
   * @examples\n\
   * function reciprocal(x) { return 1 / x; }\n\
   *\n\
   * Lazy([\"foo\", \"bar\", \"baz\"]).indexOf(\"bar\")   // => 1\n\
   * Lazy([1, 2, 3]).indexOf(4)                   // => -1\n\
   * Lazy([1, 2, 3]).map(reciprocal).indexOf(0.5) // => 1\n\
   */\n\
  Sequence.prototype.indexOf = function(value) {\n\
    var index = 0;\n\
    var foundIndex = -1;\n\
    this.each(function(e) {\n\
      if (e === value) {\n\
        foundIndex = index;\n\
        return false;\n\
      }\n\
      ++index;\n\
    });\n\
    return foundIndex;\n\
  };\n\
\n\
  /**\n\
   * Performs (at worst) a linear search from the tail of this sequence,\n\
   * returning the last index at which the specified value is found.\n\
   *\n\
   * @param {*} value The element to search for in the sequence.\n\
   * @returns {number} The last index within this sequence where the given value\n\
   *     is located, or -1 if the sequence doesn't contain the value.\n\
   *\n\
   * @examples\n\
   * Lazy([\"a\", \"b\", \"c\", \"b\", \"a\"]).lastIndexOf(\"b\") // => 3\n\
   * Lazy([1, 2, 3]).lastIndexOf(0)                   // => -1\n\
   */\n\
  Sequence.prototype.lastIndexOf = function(value) {\n\
    var index = this.reverse().indexOf(value);\n\
    if (index !== -1) {\n\
      index = this.length() - index - 1;\n\
    }\n\
    return index;\n\
  };\n\
\n\
  /**\n\
   * Performs a binary search of this sequence, returning the lowest index where\n\
   * the given value is either found, or where it belongs (if it is not already\n\
   * in the sequence).\n\
   *\n\
   * This method assumes the sequence is in sorted order and will fail\n\
   * otherwise.\n\
   *\n\
   * @param {*} value The element to search for in the sequence.\n\
   * @returns {number} An index within this sequence where the given value is\n\
   *     located, or where it belongs in sorted order.\n\
   *\n\
   * @examples\n\
   * Lazy([1, 3, 6, 9]).sortedIndex(3) // => 1\n\
   * Lazy([1, 3, 6, 9]).sortedIndex(7) // => 3\n\
   */\n\
  Sequence.prototype.sortedIndex = function(value) {\n\
    var lower = 0;\n\
    var upper = this.length();\n\
    var i;\n\
\n\
    while (lower < upper) {\n\
      i = (lower + upper) >>> 1;\n\
      if (compare(this.get(i), value) === -1) {\n\
        lower = i + 1;\n\
      } else {\n\
        upper = i;\n\
      }\n\
    }\n\
    return lower;\n\
  };\n\
\n\
  /**\n\
   * Checks whether the given value is in this sequence.\n\
   *\n\
   * @param {*} value The element to search for in the sequence.\n\
   * @returns {boolean} True if the sequence contains the value, false if not.\n\
   *\n\
   * @examples\n\
   * var numbers = [5, 10, 15, 20];\n\
   *\n\
   * Lazy(numbers).contains(15) // => true\n\
   * Lazy(numbers).contains(13) // => false\n\
   */\n\
  Sequence.prototype.contains = function(value) {\n\
    return this.indexOf(value) !== -1;\n\
  };\n\
\n\
  /**\n\
   * Aggregates a sequence into a single value according to some accumulator\n\
   * function.\n\
   *\n\
   * @param {Function} aggregator The function through which to pass every element\n\
   *     in the sequence. For every element, the function will be passed the total\n\
   *     aggregated result thus far and the element itself, and should return a\n\
   *     new aggregated result.\n\
   * @param {*=} memo The starting value to use for the aggregated result\n\
   *     (defaults to the first element in the sequence).\n\
   * @returns {*} The result of the aggregation.\n\
   *\n\
   * @examples\n\
   * function multiply(x, y) { return x * y; }\n\
   *\n\
   * var numbers = [1, 2, 3, 4];\n\
   *\n\
   * Lazy(numbers).reduce(multiply)    // => 24\n\
   * Lazy(numbers).reduce(multiply, 5) // => 120\n\
   */\n\
  Sequence.prototype.reduce = function(aggregator, memo) {\n\
    if (arguments.length < 2) {\n\
      return this.tail().reduce(aggregator, this.head());\n\
    }\n\
\n\
    this.each(function(e, i) {\n\
      memo = aggregator(memo, e, i);\n\
    });\n\
    return memo;\n\
  };\n\
\n\
  /**\n\
   * Alias for {@link Sequence#reduce}.\n\
   *\n\
   * @function inject\n\
   * @memberOf Sequence\n\
   * @instance\n\
   */\n\
  Sequence.prototype.inject = Sequence.prototype.reduce;\n\
\n\
  /**\n\
   * Alias for {@link Sequence#reduce}.\n\
   *\n\
   * @function foldl\n\
   * @memberOf Sequence\n\
   * @instance\n\
   */\n\
  Sequence.prototype.foldl = Sequence.prototype.reduce;\n\
\n\
  /**\n\
   * Aggregates a sequence, from the tail, into a single value according to some\n\
   * accumulator function.\n\
   *\n\
   * @param {Function} aggregator The function through which to pass every element\n\
   *     in the sequence. For every element, the function will be passed the total\n\
   *     aggregated result thus far and the element itself, and should return a\n\
   *     new aggregated result.\n\
   * @param {*} memo The starting value to use for the aggregated result.\n\
   * @returns {*} The result of the aggregation.\n\
   *\n\
   * @examples\n\
   * function append(s1, s2) {\n\
   *   return s1 + s2;\n\
   * }\n\
   *\n\
   * Lazy(\"abcde\").reduceRight(append) // => \"edcba\"\n\
   */\n\
  Sequence.prototype.reduceRight = function(aggregator, memo) {\n\
    if (arguments.length < 2) {\n\
      return this.initial(1).reduceRight(aggregator, this.last());\n\
    }\n\
\n\
    // This bothers me... but frankly, calling reverse().reduce() is potentially\n\
    // going to eagerly evaluate the sequence anyway; so it's really not an issue.\n\
    var i = this.length() - 1;\n\
    return this.reverse().reduce(function(m, e) {\n\
      return aggregator(m, e, i--);\n\
    }, memo);\n\
  };\n\
\n\
  /**\n\
   * Alias for {@link Sequence#reduceRight}.\n\
   *\n\
   * @function foldr\n\
   * @memberOf Sequence\n\
   * @instance\n\
   */\n\
  Sequence.prototype.foldr = Sequence.prototype.reduceRight;\n\
\n\
  /**\n\
   * Seaches for the first element in the sequence satisfying a given predicate.\n\
   *\n\
   * @param {Function} predicate A function to call on (potentially) every element\n\
   *     in the sequence.\n\
   * @returns {*} The first element in the sequence for which `predicate` returns\n\
   *     `true`, or `undefined` if no such element is found.\n\
   *\n\
   * @examples\n\
   * function divisibleBy3(x) {\n\
   *   return x % 3 === 0;\n\
   * }\n\
   *\n\
   * function isNegative(x) {\n\
   *   return x < 0;\n\
   * }\n\
   *\n\
   * var numbers = [5, 6, 7, 8, 9, 10];\n\
   *\n\
   * Lazy(numbers).find(divisibleBy3) // => 6\n\
   * Lazy(numbers).find(isNegative)   // => undefined\n\
   */\n\
  Sequence.prototype.find = function(predicate) {\n\
    return this.filter(predicate).first();\n\
  };\n\
\n\
  /**\n\
   * Alias for {@link Sequence#find}.\n\
   *\n\
   * @function detect\n\
   * @memberOf Sequence\n\
   * @instance\n\
   */\n\
  Sequence.prototype.detect = Sequence.prototype.find;\n\
\n\
  /**\n\
   * Gets the minimum value in the sequence.\n\
   *\n\
   * @param {Function=} valueFn The function by which the value for comparison is\n\
   *     calculated for each element in the sequence.\n\
   * @returns {*} The element with the lowest value in the sequence, or\n\
   *     `Infinity` if the sequence is empty.\n\
   *\n\
   * @examples\n\
   * function negate(x) { return x * -1; }\n\
   *\n\
   * Lazy([]).min()                       // => Infinity\n\
   * Lazy([6, 18, 2, 49, 34]).min()       // => 2\n\
   * Lazy([6, 18, 2, 49, 34]).min(negate) // => 49\n\
   */\n\
  Sequence.prototype.min = function(valueFn) {\n\
    var leastValue = Infinity, least;\n\
\n\
    if (typeof valueFn !== \"undefined\") {\n\
      valueFn = createCallback(valueFn);\n\
\n\
      this.each(function(e) {\n\
        var value = valueFn(e);\n\
        if (value < leastValue) {\n\
          leastValue = value;\n\
          least = e;\n\
        }\n\
      });\n\
\n\
      return least;\n\
\n\
    } else {\n\
      this.each(function(e) {\n\
        if (e < leastValue) {\n\
          leastValue = e;\n\
        }\n\
      });\n\
\n\
      return leastValue;\n\
    }\n\
  };\n\
\n\
  /**\n\
   * Gets the maximum value in the sequence.\n\
   *\n\
   * @param {Function=} valueFn The function by which the value for comparison is\n\
   *     calculated for each element in the sequence.\n\
   * @returns {*} The element with the highest value in the sequence, or\n\
   *     `-Infinity` if the sequence is empty.\n\
   *\n\
   * @examples\n\
   * function reverseDigits(x) {\n\
   *   return Number(String(x).split('').reverse().join(''));\n\
   * }\n\
   *\n\
   * Lazy([]).max()                              // => -Infinity\n\
   * Lazy([6, 18, 2, 48, 29]).max()              // => 48\n\
   * Lazy([6, 18, 2, 48, 29]).max(reverseDigits) // => 29\n\
   */\n\
  Sequence.prototype.max = function(valueFn) {\n\
    var greatestValue = -Infinity, greatest;\n\
\n\
    if (typeof valueFn !== \"undefined\") {\n\
      valueFn = createCallback(valueFn);\n\
\n\
      this.each(function(e) {\n\
        var value = valueFn(e);\n\
        if (value > greatestValue) {\n\
          greatestValue = value;\n\
          greatest = e;\n\
        }\n\
      });\n\
\n\
      return greatest;\n\
\n\
    } else {\n\
      this.each(function(e) {\n\
        if (e > greatestValue) {\n\
          greatestValue = e;\n\
        }\n\
      });\n\
\n\
      return greatestValue;\n\
    }\n\
  };\n\
\n\
  /**\n\
   * Gets the sum of the values in the sequence.\n\
   *\n\
   * @param {Function=} valueFn The function used to select the values that will\n\
   *     be summed up.\n\
   * @returns {*} The sum.\n\
   *\n\
   * @examples\n\
   * Lazy([]).sum()           // => 0\n\
   * Lazy([1, 2, 3, 4]).sum() // => 10\n\
   */\n\
  Sequence.prototype.sum = function(valueFn) {\n\
    if (typeof valueFn !== \"undefined\") {\n\
      valueFn = createCallback(valueFn);\n\
      return this.reduce(function(sum, element) {\n\
        return sum += valueFn(element);\n\
      }, 0);\n\
\n\
    } else {\n\
      return this.reduce(function(sum, value) {\n\
        return sum += value;\n\
      }, 0);\n\
    }\n\
  };\n\
\n\
  /**\n\
   * Creates a string from joining together all of the elements in this sequence,\n\
   * separated by the given delimiter.\n\
   *\n\
   * @param {string=} delimiter The separator to insert between every element from\n\
   *     this sequence in the resulting string (defaults to `\",\"`).\n\
   * @returns {string} The delimited string.\n\
   *\n\
   * @examples\n\
   * Lazy([6, 29, 1984]).join(\"/\") // => \"6/29/1984\"\n\
   */\n\
  Sequence.prototype.join = function(delimiter) {\n\
    delimiter = typeof delimiter === \"string\" ? delimiter : \",\";\n\
\n\
    var str = \"\";\n\
    this.each(function(e) {\n\
      if (str.length > 0) {\n\
        str += delimiter;\n\
      }\n\
      str += e;\n\
    });\n\
    return str;\n\
  };\n\
\n\
  /**\n\
   * Alias for {@link Sequence#join}.\n\
   *\n\
   * @function toString\n\
   * @memberOf Sequence\n\
   * @instance\n\
   */\n\
  Sequence.prototype.toString = Sequence.prototype.join;\n\
\n\
  /**\n\
   * Creates a sequence, with the same elements as this one, that will be iterated\n\
   * over asynchronously when calling `each`.\n\
   *\n\
   * @param {number=} interval The approximate period, in milliseconds, that\n\
   *     should elapse between each element in the resulting sequence. Omitting\n\
   *     this argument will result in the fastest possible asynchronous iteration.\n\
   * @returns {AsyncSequence} The new asynchronous sequence.\n\
   *\n\
   * @example\n\
   * Lazy([1, 2, 3]).async(1000).each(function(x) {\n\
   *   console.log(x);\n\
   * });\n\
   * // (logs the numbers 1, 2, and 3 to the console, one second apart)\n\
   */\n\
  Sequence.prototype.async = function(interval) {\n\
    return new AsyncSequence(this, interval);\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function MappedSequence(parent, mapFn) {\n\
    this.parent = parent;\n\
    this.mapFn  = mapFn;\n\
  }\n\
\n\
  MappedSequence.prototype = new Sequence();\n\
\n\
  MappedSequence.prototype.each = function(fn) {\n\
    var mapFn = this.mapFn;\n\
    return this.parent.each(function(e, i) {\n\
      return fn(mapFn(e, i), i);\n\
    });\n\
  };\n\
\n\
  /**\n\
   * A CachingSequence is a `Sequence` that (probably) must fully evaluate the\n\
   * underlying sequence when {@link #each} is called. For this reason, it\n\
   * provides a {@link #cache} method to fully populate an array that can then be\n\
   * referenced internally.\n\
   *\n\
   * Frankly, I question the wisdom in this sequence type and think I will\n\
   * probably refactor this out in the near future. Most likely I will replace it\n\
   * with something like an 'IteratingSequence' which must expose a 'getIterator'\n\
   * and not provide {@link #get} or {@link #length} at all. But we'll see.\n\
   *\n\
   * @constructor\n\
   */\n\
  function CachingSequence() {}\n\
\n\
  CachingSequence.prototype = new Sequence();\n\
\n\
  /**\n\
   * Create a new constructor function for a type inheriting from\n\
   * `CachingSequence`.\n\
   *\n\
   * @param {Function} ctor The constructor function.\n\
   * @returns {Function} A constructor for a new type inheriting from\n\
   *     `CachingSequence`.\n\
   */\n\
  CachingSequence.inherit = function(ctor) {\n\
    ctor.prototype = new CachingSequence();\n\
    return ctor;\n\
  };\n\
\n\
  /**\n\
   * Fully evaluates the sequence and returns a cached result.\n\
   *\n\
   * @returns {Array} The cached array, fully populated with the elements in this\n\
   *     sequence.\n\
   */\n\
  CachingSequence.prototype.cache = function() {\n\
    if (!this.cached) {\n\
      this.cached = this.toArray();\n\
    }\n\
    return this.cached;\n\
  };\n\
\n\
  /**\n\
   * For internal use only.\n\
   */\n\
  CachingSequence.prototype.get = function(i) {\n\
    return this.cache()[i];\n\
  };\n\
\n\
  /**\n\
   * For internal use only.\n\
   */\n\
  CachingSequence.prototype.length = function() {\n\
    return this.cache().length;\n\
  };\n\
\n\
  /**\n\
   * Fully evaluates the sequence and returns an iterator.\n\
   *\n\
   * @returns {Iterator} An iterator to iterate over the fully-evaluated sequence.\n\
   */\n\
  CachingSequence.prototype.getIterator = function() {\n\
    return Lazy(this.cache()).getIterator();\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function FilteredSequence(parent, filterFn) {\n\
    this.parent   = parent;\n\
    this.filterFn = filterFn;\n\
  }\n\
\n\
  FilteredSequence.prototype = new Sequence();\n\
\n\
  FilteredSequence.prototype.getIterator = function() {\n\
    return new FilteringIterator(this.parent, this.filterFn);\n\
  };\n\
\n\
  FilteredSequence.prototype.each = function(fn) {\n\
    var filterFn = this.filterFn;\n\
\n\
    return this.parent.each(function(e, i) {\n\
      if (filterFn(e, i)) {\n\
        return fn(e, i);\n\
      }\n\
    });\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function ConcatenatedSequence(parent, arrays) {\n\
    this.parent = parent;\n\
    this.arrays = arrays;\n\
  }\n\
\n\
  ConcatenatedSequence.prototype = new Sequence();\n\
\n\
  ConcatenatedSequence.prototype.each = function(fn) {\n\
    var done = false,\n\
        i = 0;\n\
\n\
    this.parent.each(function(e) {\n\
      if (fn(e, i++) === false) {\n\
        done = true;\n\
        return false;\n\
      }\n\
    });\n\
\n\
    if (!done) {\n\
      Lazy(this.arrays).flatten().each(function(e) {\n\
        if (fn(e, i++) === false) {\n\
          return false;\n\
        }\n\
      });\n\
    }\n\
  };\n\
\n\
  var TakeSequence = CachingSequence.inherit(function(parent, count) {\n\
    this.parent = parent;\n\
    this.count  = count;\n\
  });\n\
\n\
  TakeSequence.prototype.each = function(fn) {\n\
    var self = this,\n\
        i = 0;\n\
    self.parent.each(function(e) {\n\
      var result;\n\
      if (i < self.count) { result = fn(e, i); }\n\
      if (++i >= self.count) { return false; }\n\
      return result;\n\
    });\n\
  };\n\
\n\
  var TakeWhileSequence = CachingSequence.inherit(function(parent, predicate) {\n\
    this.parent    = parent;\n\
    this.predicate = predicate;\n\
  });\n\
\n\
  TakeWhileSequence.prototype.each = function(fn) {\n\
    var predicate = this.predicate;\n\
\n\
    this.parent.each(function(e) {\n\
      return predicate(e) && fn(e);\n\
    });\n\
  };\n\
\n\
  var DropWhileSequence = CachingSequence.inherit(function(parent, predicate) {\n\
    this.parent    = parent;\n\
    this.predicate = predicate;\n\
  });\n\
\n\
  DropWhileSequence.prototype.each = function(fn) {\n\
    var predicate = this.predicate,\n\
        done      = false;\n\
\n\
    this.parent.each(function(e) {\n\
      if (!done) {\n\
        if (predicate(e)) {\n\
          return;\n\
        }\n\
\n\
        done = true;\n\
      }\n\
\n\
      return fn(e);\n\
    });\n\
  };\n\
\n\
  var SortedSequence = CachingSequence.inherit(function(parent, sortFn) {\n\
    this.parent = parent;\n\
    this.sortFn = sortFn;\n\
  });\n\
\n\
  SortedSequence.prototype.each = function(fn) {\n\
    var sortFn = this.sortFn,\n\
        sorted = this.parent.toArray(),\n\
        i = -1;\n\
\n\
    sorted.sort(function(x, y) { return compare(x, y, sortFn); });\n\
\n\
    while (++i < sorted.length) {\n\
      if (fn(sorted[i], i) === false) {\n\
        break;\n\
      }\n\
    }\n\
  };\n\
\n\
  var ShuffledSequence = CachingSequence.inherit(function(parent) {\n\
    this.parent = parent;\n\
  });\n\
\n\
  ShuffledSequence.prototype.each = function(fn) {\n\
    var shuffled = this.parent.toArray(),\n\
        floor = Math.floor,\n\
        random = Math.random,\n\
        j = 0;\n\
\n\
    for (var i = shuffled.length - 1; i > 0; --i) {\n\
      swap(shuffled, i, floor(random() * i) + 1);\n\
      if (fn(shuffled[i], j++) === false) {\n\
        return;\n\
      }\n\
    }\n\
    fn(shuffled[0], j);\n\
  };\n\
\n\
  var GroupedSequence = CachingSequence.inherit(function(parent, keyFn) {\n\
    keyFn = createCallback(keyFn);\n\
\n\
    this.each = function(fn) {\n\
      var grouped = {};\n\
      parent.each(function(e) {\n\
        var key = keyFn(e);\n\
        if (!grouped[key]) {\n\
          grouped[key] = [e];\n\
        } else {\n\
          grouped[key].push(e);\n\
        }\n\
      });\n\
      for (var key in grouped) {\n\
        if (fn([key, grouped[key]]) === false) {\n\
          break;\n\
        }\n\
      }\n\
    };\n\
  });\n\
\n\
  var CountedSequence = CachingSequence.inherit(function(parent, keyFn) {\n\
    keyFn = createCallback(keyFn);\n\
\n\
    this.each = function(fn) {\n\
      var grouped = {};\n\
      parent.each(function(e) {\n\
        var key = keyFn(e);\n\
        if (!grouped[key]) {\n\
          grouped[key] = 1;\n\
        } else {\n\
          grouped[key] += 1;\n\
        }\n\
      });\n\
      for (var key in grouped) {\n\
        fn([key, grouped[key]]);\n\
      }\n\
    };\n\
  });\n\
\n\
  var UniqueSequence = CachingSequence.inherit(function(parent, keyFn) {\n\
    this.parent = parent;\n\
    this.keyFn  = keyFn;\n\
  });\n\
\n\
  UniqueSequence.prototype.each = function(fn) {\n\
    var cache = new Set(),\n\
        keyFn = this.keyFn,\n\
        i     = 0;\n\
\n\
    this.parent.each(function(e) {\n\
      if (cache.add(keyFn(e))) {\n\
        return fn(e, i++);\n\
      }\n\
    });\n\
  };\n\
\n\
  var FlattenedSequence = CachingSequence.inherit(function(parent) {\n\
    this.parent = parent;\n\
  });\n\
\n\
  FlattenedSequence.prototype.each = function(fn) {\n\
    var index = 0,\n\
        done  = false;\n\
\n\
    var recurseVisitor = function(e) {\n\
      if (done) {\n\
        return false;\n\
      }\n\
\n\
      if (e instanceof Sequence) {\n\
        e.each(function(seq) {\n\
          if (recurseVisitor(seq) === false) {\n\
            done = true;\n\
            return false;\n\
          }\n\
        });\n\
\n\
      } else if (e instanceof Array) {\n\
        return forEach(e, recurseVisitor);\n\
\n\
      } else {\n\
        return fn(e, index++);\n\
      }\n\
    };\n\
\n\
    this.parent.each(recurseVisitor);\n\
  };\n\
\n\
  var WithoutSequence = CachingSequence.inherit(function(parent, values) {\n\
    this.parent = parent;\n\
    this.values = values;\n\
  });\n\
\n\
  WithoutSequence.prototype.each = function(fn) {\n\
    var set = createSet(this.values),\n\
        i = 0;\n\
    this.parent.each(function(e) {\n\
      if (!set.contains(e)) {\n\
        return fn(e, i++);\n\
      }\n\
    });\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function SimpleIntersectionSequence(parent, array) {\n\
    this.parent = parent;\n\
    this.array  = array;\n\
    this.each   = getEachForIntersection(array);\n\
  }\n\
\n\
  SimpleIntersectionSequence.prototype = new Sequence();\n\
\n\
  SimpleIntersectionSequence.prototype.eachMemoizerCache = function(fn) {\n\
    var iterator = new UniqueMemoizer(Lazy(this.array).getIterator()),\n\
        i = 0;\n\
\n\
    this.parent.each(function(e) {\n\
      if (iterator.contains(e)) {\n\
        return fn(e, i++);\n\
      }\n\
    });\n\
  };\n\
\n\
  SimpleIntersectionSequence.prototype.eachArrayCache = function(fn) {\n\
    var array = this.array,\n\
        find  = contains,\n\
        i = 0;\n\
\n\
    this.parent.each(function(e) {\n\
      if (find(array, e)) {\n\
        return fn(e, i++);\n\
      }\n\
    });\n\
  };\n\
\n\
  function getEachForIntersection(source) {\n\
    if (source.length < 40) {\n\
      return SimpleIntersectionSequence.prototype.eachArrayCache;\n\
    } else {\n\
      return SimpleIntersectionSequence.prototype.eachMemoizerCache;\n\
    }\n\
  }\n\
\n\
  var IntersectionSequence = CachingSequence.inherit(function(parent, arrays) {\n\
    this.parent = parent;\n\
    this.arrays = arrays;\n\
  });\n\
\n\
  IntersectionSequence.prototype.each = function(fn) {\n\
    var sets = Lazy(this.arrays).map(function(values) {\n\
      return new UniqueMemoizer(Lazy(values).getIterator());\n\
    });\n\
\n\
    var setIterator = new UniqueMemoizer(sets.getIterator()),\n\
        i = 0;\n\
\n\
    this.parent.each(function(e) {\n\
      var includedInAll = true;\n\
      setIterator.each(function(set) {\n\
        if (!set.contains(e)) {\n\
          includedInAll = false;\n\
          return false;\n\
        }\n\
      });\n\
\n\
      if (includedInAll) {\n\
        return fn(e, i++);\n\
      }\n\
    });\n\
  };\n\
\n\
  /**\n\
   * An optimized version of {@link ZippedSequence}, when zipping a sequence with\n\
   * only one array.\n\
   *\n\
   * @param {Sequence} parent The underlying sequence.\n\
   * @param {Array} array The array with which to zip the sequence.\n\
   * @constructor\n\
   */\n\
  function SimpleZippedSequence(parent, array) {\n\
    this.parent = parent;\n\
    this.array  = array;\n\
  }\n\
\n\
  SimpleZippedSequence.prototype = new Sequence();\n\
\n\
  SimpleZippedSequence.prototype.each = function(fn) {\n\
    var array = this.array;\n\
    this.parent.each(function(e, i) {\n\
      return fn([e, array[i]], i);\n\
    });\n\
  };\n\
\n\
  var ZippedSequence = CachingSequence.inherit(function(parent, arrays) {\n\
    this.parent = parent;\n\
    this.arrays = arrays;\n\
  });\n\
\n\
  ZippedSequence.prototype.each = function(fn) {\n\
    var arrays = this.arrays,\n\
        i = 0;\n\
    this.parent.each(function(e) {\n\
      var group = [e];\n\
      for (var j = 0; j < arrays.length; ++j) {\n\
        if (arrays[j].length > i) {\n\
          group.push(arrays[j][i]);\n\
        }\n\
      }\n\
      return fn(group, i++);\n\
    });\n\
  };\n\
\n\
  /**\n\
   * The Iterator object provides an API for iterating over a sequence.\n\
   *\n\
   * @param {ArrayLikeSequence=} sequence The sequence to iterate over.\n\
   * @constructor\n\
   */\n\
  function Iterator(sequence) {\n\
    this.sequence = sequence;\n\
    this.index = -1;\n\
  }\n\
\n\
  /**\n\
   * Gets the current item this iterator is pointing to.\n\
   *\n\
   * @returns {*} The current item.\n\
   */\n\
  Iterator.prototype.current = function() {\n\
    return this.sequence.get(this.index);\n\
  };\n\
\n\
  /**\n\
   * Moves the iterator to the next item in a sequence, if possible.\n\
   *\n\
   * @returns {boolean} True if the iterator is able to move to a new item, or else\n\
   *     false.\n\
   */\n\
  Iterator.prototype.moveNext = function() {\n\
    if (this.index >= this.sequence.length() - 1) {\n\
      return false;\n\
    }\n\
\n\
    ++this.index;\n\
    return true;\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function FilteringIterator(sequence, filterFn) {\n\
    this.iterator = sequence.getIterator();\n\
    this.filterFn = filterFn;\n\
  }\n\
\n\
  FilteringIterator.prototype.current = function() {\n\
    return this.value;\n\
  };\n\
\n\
  FilteringIterator.prototype.moveNext = function() {\n\
    var iterator = this.iterator,\n\
        filterFn = this.filterFn,\n\
        value;\n\
\n\
    while (iterator.moveNext()) {\n\
      value = iterator.current();\n\
      if (filterFn(value)) {\n\
        this.value = value;\n\
        return true;\n\
      }\n\
    }\n\
\n\
    this.value = undefined;\n\
    return false;\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   * @param {string|StringLikeSequence} source\n\
   */\n\
  function CharIterator(source) {\n\
    this.source = source;\n\
    this.index = -1;\n\
  }\n\
\n\
  CharIterator.prototype = new Iterator();\n\
\n\
  CharIterator.prototype.current = function() {\n\
    return this.source.charAt(this.index);\n\
  };\n\
\n\
  CharIterator.prototype.moveNext = function() {\n\
    return (++this.index < this.source.length);\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function StringMatchIterator(source, pattern) {\n\
    this.source = source;\n\
\n\
    // clone the RegExp\n\
    this.pattern = eval(\"\" + pattern + (!pattern.global ? \"g\" : \"\"));\n\
  }\n\
\n\
  StringMatchIterator.prototype.current = function() {\n\
    return this.match[0];\n\
  };\n\
\n\
  StringMatchIterator.prototype.moveNext = function() {\n\
    return !!(this.match = this.pattern.exec(this.source));\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function SplitWithRegExpIterator(source, pattern) {\n\
    this.source = source;\n\
\n\
    // clone the RegExp\n\
    this.pattern = eval(\"\" + pattern + (!pattern.global ? \"g\" : \"\"));\n\
  }\n\
\n\
  SplitWithRegExpIterator.prototype.current = function() {\n\
    return this.source.substring(this.start, this.end);\n\
  };\n\
\n\
  SplitWithRegExpIterator.prototype.moveNext = function() {\n\
    if (!this.pattern) {\n\
      return false;\n\
    }\n\
\n\
    var match = this.pattern.exec(this.source);\n\
\n\
    if (match) {\n\
      this.start = this.nextStart ? this.nextStart : 0;\n\
      this.end = match.index;\n\
      this.nextStart = match.index + match[0].length;\n\
      return true;\n\
\n\
    } else if (this.pattern) {\n\
      this.start = this.nextStart;\n\
      this.end = undefined;\n\
      this.nextStart = undefined;\n\
      this.pattern = undefined;\n\
      return true;\n\
    }\n\
\n\
    return false;\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function SplitWithStringIterator(source, delimiter) {\n\
    this.source = source;\n\
    this.delimiter = delimiter;\n\
  }\n\
\n\
  SplitWithStringIterator.prototype.current = function() {\n\
    return this.source.substring(this.leftIndex, this.rightIndex);\n\
  };\n\
\n\
  SplitWithStringIterator.prototype.moveNext = function() {\n\
    if (!this.finished) {\n\
      this.leftIndex = typeof this.leftIndex !== \"undefined\" ?\n\
        this.rightIndex + this.delimiter.length :\n\
        0;\n\
      this.rightIndex = this.source.indexOf(this.delimiter, this.leftIndex);\n\
    }\n\
\n\
    if (this.rightIndex === -1) {\n\
      this.finished = true;\n\
      this.rightIndex = undefined;\n\
      return true;\n\
    }\n\
\n\
    return !this.finished;\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function UniqueMemoizer(iterator) {\n\
    this.iterator     = iterator;\n\
    this.set          = new Set();\n\
    this.memo         = [];\n\
    this.currentValue = undefined;\n\
  }\n\
\n\
  UniqueMemoizer.prototype = new Iterator();\n\
\n\
  UniqueMemoizer.prototype.current = function() {\n\
    return this.currentValue;\n\
  };\n\
\n\
  UniqueMemoizer.prototype.moveNext = function() {\n\
    var iterator = this.iterator,\n\
        set = this.set,\n\
        memo = this.memo,\n\
        current;\n\
\n\
    while (iterator.moveNext()) {\n\
      current = iterator.current();\n\
      if (set.add(current)) {\n\
        memo.push(current);\n\
        this.currentValue = current;\n\
        return true;\n\
      }\n\
    }\n\
    return false;\n\
  };\n\
\n\
  UniqueMemoizer.prototype.each = function(fn) {\n\
    var memo = this.memo,\n\
        length = memo.length,\n\
        i = -1;\n\
\n\
    while (++i < length) {\n\
      if (fn(memo[i], i) === false) {\n\
        return false;\n\
      }\n\
    }\n\
\n\
    while (this.moveNext()) {\n\
      if (fn(this.currentValue, i++) === false) {\n\
        break;\n\
      }\n\
    }\n\
  };\n\
\n\
  UniqueMemoizer.prototype.contains = function(e) {\n\
    if (this.set.contains(e)) {\n\
      return true;\n\
    }\n\
\n\
    while (this.moveNext()) {\n\
      if (this.currentValue === e) {\n\
        return true;\n\
      }\n\
    }\n\
\n\
    return false;\n\
  };\n\
\n\
  /**\n\
   * An `ArrayLikeSequence` is a {@link Sequence} that provides random access to\n\
   * its elements. This extends the API for iterating with the additional methods\n\
   * {@link #get} and {@link #length}, allowing a sequence to act as a \"view\" into\n\
   * a collection or other indexed data source.\n\
   *\n\
   * Defining custom array-like sequences\n\
   * ------------------------------------\n\
   *\n\
   * Creating a custom `ArrayLikeSequence` is essentially the same as creating a\n\
   * custom {@link Sequence}. You just have a couple more methods you need to\n\
   * implement: `get` and (optionally) `length`.\n\
   *\n\
   * Here's an example. Let's define a sequence type called `OffsetSequence` that\n\
   * offsets each of its parent's elements by a set distance, and circles back to\n\
   * the beginning after reaching the end. **Remember**: the initialization\n\
   * function you pass to {@link #define} should always accept a `parent` as its\n\
   * first parameter.\n\
   *\n\
   *     var OffsetSequence = ArrayLikeSequence.define(\"offset\", function(parent, offset) {\n\
   *       this.offset = offset;\n\
   *     });\n\
   *\n\
   *     OffsetSequence.prototype.get = function(i) {\n\
   *       return this.parent.get((i + this.offset) % this.parent.length());\n\
   *     };\n\
   *\n\
   * It's worth noting a couple of things here.\n\
   *\n\
   * First, Lazy's default implementation of `length` simply returns the parent's\n\
   * length. In this case, since an `OffsetSequence` will always have the same\n\
   * number of elements as its parent, that implementation is fine; so we don't\n\
   * need to override it.\n\
   *\n\
   * Second, the default implementation of `each` uses `get` and `length` to\n\
   * essentially create a `for` loop, which is fine here. If you want to implement\n\
   * `each` your own way, you can do that; but in most cases (as here), you can\n\
   * probably just stick with the default.\n\
   *\n\
   * So we're already done, after only implementing `get`! Pretty slick, huh?\n\
   *\n\
   * Now the `offset` method will be chainable from any `ArrayLikeSequence`. So\n\
   * for example:\n\
   *\n\
   *     Lazy([1, 2, 3]).map(trans).offset(3);\n\
   *\n\
   * ...will work, but:\n\
   *\n\
   *     Lazy([1, 2, 3]).filter(pred).offset(3);\n\
   *\n\
   * ...will not.\n\
   *\n\
   * (Also, as with the example provided for defining custom {@link Sequence}\n\
   * types, this example really could have been implemented using a function\n\
   * already available as part of Lazy.js: in this case, {@link Sequence#map}.)\n\
   *\n\
   * @constructor\n\
   */\n\
  function ArrayLikeSequence() {}\n\
\n\
  ArrayLikeSequence.prototype = new Sequence();\n\
\n\
  ArrayLikeSequence.define = function(methodName, init) {\n\
    // Define a constructor that sets this sequence's parent to the first argument\n\
    // and (optionally) applies any additional initialization logic.\n\
\n\
    /** @constructor */\n\
    var ctor = init ? function(var_args) {\n\
                        this.parent = arguments[0];\n\
                        init.apply(this, arguments);\n\
                      } :\n\
                      function(var_args) {\n\
                        this.parent = arguments[0];\n\
                      };\n\
\n\
    // Make this type inherit from ArrayLikeSequence.\n\
    ctor.prototype = new ArrayLikeSequence();\n\
\n\
    // Expose the constructor as a chainable method so that we can do:\n\
    // Lazy(...).map(...).blah(...);\n\
    /** @skip\n\
      * @suppress {checkTypes} */\n\
    ArrayLikeSequence.prototype[methodName] = function(x, y, z) {\n\
      return new ctor(this, x, y, z);\n\
    };\n\
\n\
    return ctor;\n\
  };\n\
\n\
  /**\n\
   * Returns the element at the specified index.\n\
   *\n\
   * @param {number} i The index to access.\n\
   * @returns {*} The element.\n\
   *\n\
   * @examples\n\
   * function increment(x) { return x + 1; }\n\
   *\n\
   * Lazy([1, 2, 3]).get(1)                // => 2\n\
   * Lazy([1, 2, 3]).get(-1)               // => undefined\n\
   * Lazy([1, 2, 3]).map(increment).get(1) // => 3\n\
   */\n\
  ArrayLikeSequence.prototype.get = function(i) {\n\
    return this.parent.get(i);\n\
  };\n\
\n\
  /**\n\
   * Returns the length of the sequence.\n\
   *\n\
   * @returns {number} The length.\n\
   *\n\
   * @examples\n\
   * function increment(x) { return x + 1; }\n\
   *\n\
   * Lazy([]).length()                       // => 0\n\
   * Lazy([1, 2, 3]).length()                // => 3\n\
   * Lazy([1, 2, 3]).map(increment).length() // => 3\n\
   */\n\
  ArrayLikeSequence.prototype.length = function() {\n\
    return this.parent.length();\n\
  };\n\
\n\
  /**\n\
   * Creates an iterator object with two methods, `moveNext` -- returning true or\n\
   * false -- and `current` -- returning the current value.\n\
   *\n\
   * This method is used when asynchronously iterating over sequences. Any type\n\
   * inheriting from `Sequence` must implement this method or it can't support\n\
   * asynchronous iteration.\n\
   *\n\
   * @returns {Iterator} An iterator object.\n\
   *\n\
   * @example\n\
   * var iterator = Lazy([1, 2]).getIterator();\n\
   *\n\
   * iterator.moveNext();\n\
   * // => true\n\
   *\n\
   * iterator.current();\n\
   * // => 1\n\
   *\n\
   * iterator.moveNext();\n\
   * // => true\n\
   *\n\
   * iterator.current();\n\
   * // => 2\n\
   *\n\
   * iterator.moveNext();\n\
   * // => false\n\
   */\n\
  ArrayLikeSequence.prototype.getIterator = function() {\n\
    return new Iterator(this);\n\
  };\n\
\n\
  /**\n\
   * An optimized version of {@link Sequence#each}.\n\
   */\n\
  ArrayLikeSequence.prototype.each = function(fn) {\n\
    var length = this.length(),\n\
        i = -1;\n\
    while (++i < length) {\n\
      if (fn(this.get(i), i) === false) {\n\
        break;\n\
      }\n\
    }\n\
  };\n\
\n\
  /**\n\
   * An optimized version of {@link Sequence#map}, which creates an\n\
   * `ArrayLikeSequence` so that the result still provides random access.\n\
   *\n\
   * @returns {ArrayLikeSequence} The new array-like sequence.\n\
   */\n\
  ArrayLikeSequence.prototype.map = function(mapFn) {\n\
    if (typeof mapFn === 'string') {\n\
      return this.pluck(mapFn);\n\
    }\n\
\n\
    return new IndexedMappedSequence(this, mapFn);\n\
  };\n\
\n\
  ArrayLikeSequence.prototype.collect = ArrayLikeSequence.prototype.map;\n\
\n\
  /**\n\
   * An optimized version of {@link Sequence#select}.\n\
   */\n\
  ArrayLikeSequence.prototype.select = function(filterFn) {\n\
    return new IndexedFilteredSequence(this, createCallback(filterFn));\n\
  };\n\
\n\
  ArrayLikeSequence.prototype.filter = ArrayLikeSequence.prototype.select;\n\
\n\
  /**\n\
   * An optimized version of {@link Sequence#reverse}, which creates an\n\
   * `ArrayLikeSequence` so that the result still provides random access.\n\
   */\n\
  ArrayLikeSequence.prototype.reverse = function() {\n\
    return new IndexedReversedSequence(this);\n\
  };\n\
\n\
  /**\n\
   * An optimized version of {@link Sequence#first}, which creates an\n\
   * `ArrayLikeSequence` so that the result still provides random access.\n\
   *\n\
   * @param {number=} count\n\
   */\n\
  ArrayLikeSequence.prototype.first = function(count) {\n\
    if (typeof count === \"undefined\") {\n\
      return this.get(0);\n\
    }\n\
\n\
    return new IndexedTakeSequence(this, count);\n\
  };\n\
\n\
  ArrayLikeSequence.prototype.head =\n\
  ArrayLikeSequence.prototype.take =\n\
  ArrayLikeSequence.prototype.first;\n\
\n\
  /**\n\
   * An optimized version of {@link Sequence#rest}, which creates an\n\
   * `ArrayLikeSequence` so that the result still provides random access.\n\
   *\n\
   * @param {number=} count\n\
   */\n\
  ArrayLikeSequence.prototype.rest = function(count) {\n\
    return new IndexedDropSequence(this, count);\n\
  };\n\
\n\
  ArrayLikeSequence.prototype.tail =\n\
  ArrayLikeSequence.prototype.drop = ArrayLikeSequence.prototype.rest;\n\
\n\
  /**\n\
   * An optimized version of {@link Sequence#concat}.\n\
   *\n\
   * @param {...*} var_args\n\
   */\n\
  ArrayLikeSequence.prototype.concat = function(var_args) {\n\
    if (arguments.length === 1 && arguments[0] instanceof Array) {\n\
      return new IndexedConcatenatedSequence(this, (/** @type {Array} */ var_args));\n\
    } else {\n\
      return Sequence.prototype.concat.apply(this, arguments);\n\
    }\n\
  }\n\
\n\
  /**\n\
   * An optimized version of {@link Sequence#uniq}.\n\
   */\n\
  ArrayLikeSequence.prototype.uniq = function(keyFn) {\n\
    return new IndexedUniqueSequence(this, createCallback(keyFn));\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function IndexedMappedSequence(parent, mapFn) {\n\
    this.parent = parent;\n\
    this.mapFn  = mapFn;\n\
  }\n\
\n\
  IndexedMappedSequence.prototype = new ArrayLikeSequence();\n\
\n\
  IndexedMappedSequence.prototype.get = function(i) {\n\
    if (i < 0 || i >= this.parent.length()) {\n\
      return undefined;\n\
    }\n\
\n\
    return this.mapFn(this.parent.get(i), i);\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function IndexedFilteredSequence(parent, filterFn) {\n\
    this.parent   = parent;\n\
    this.filterFn = filterFn;\n\
  }\n\
\n\
  IndexedFilteredSequence.prototype = new FilteredSequence();\n\
\n\
  IndexedFilteredSequence.prototype.each = function(fn) {\n\
    var parent = this.parent,\n\
        filterFn = this.filterFn,\n\
        length = this.parent.length(),\n\
        i = -1,\n\
        e;\n\
\n\
    while (++i < length) {\n\
      e = parent.get(i);\n\
      if (filterFn(e, i) && fn(e, i) === false) {\n\
        break;\n\
      }\n\
    }\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function IndexedReversedSequence(parent) {\n\
    this.parent = parent;\n\
  }\n\
\n\
  IndexedReversedSequence.prototype = new ArrayLikeSequence();\n\
\n\
  IndexedReversedSequence.prototype.get = function(i) {\n\
    return this.parent.get(this.length() - i - 1);\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function IndexedTakeSequence(parent, count) {\n\
    this.parent = parent;\n\
    this.count  = count;\n\
  }\n\
\n\
  IndexedTakeSequence.prototype = new ArrayLikeSequence();\n\
\n\
  IndexedTakeSequence.prototype.length = function() {\n\
    var parentLength = this.parent.length();\n\
    return this.count <= parentLength ? this.count : parentLength;\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function IndexedDropSequence(parent, count) {\n\
    this.parent = parent;\n\
    this.count  = typeof count === \"number\" ? count : 1;\n\
  }\n\
\n\
  IndexedDropSequence.prototype = new ArrayLikeSequence();\n\
\n\
  IndexedDropSequence.prototype.get = function(i) {\n\
    return this.parent.get(this.count + i);\n\
  };\n\
\n\
  IndexedDropSequence.prototype.length = function() {\n\
    var parentLength = this.parent.length();\n\
    return this.count <= parentLength ? parentLength - this.count : 0;\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function IndexedConcatenatedSequence(parent, other) {\n\
    this.parent = parent;\n\
    this.other  = other;\n\
  }\n\
\n\
  IndexedConcatenatedSequence.prototype = new ArrayLikeSequence();\n\
\n\
  IndexedConcatenatedSequence.prototype.get = function(i) {\n\
    var parentLength = this.parent.length();\n\
    if (i < parentLength) {\n\
      return this.parent.get(i);\n\
    } else {\n\
      return this.other[i - parentLength];\n\
    }\n\
  };\n\
\n\
  IndexedConcatenatedSequence.prototype.length = function() {\n\
    return this.parent.length() + this.other.length;\n\
  };\n\
\n\
  /**\n\
   * @param {ArrayLikeSequence} parent\n\
   * @constructor\n\
   */\n\
  function IndexedUniqueSequence(parent, keyFn) {\n\
    this.parent = parent;\n\
    this.each   = getEachForParent(parent);\n\
    this.keyFn  = keyFn;\n\
  }\n\
\n\
  IndexedUniqueSequence.prototype = new Sequence();\n\
\n\
  IndexedUniqueSequence.prototype.eachArrayCache = function(fn) {\n\
    // Basically the same implementation as w/ the set, but using an array because\n\
    // it's cheaper for smaller sequences.\n\
    var parent = this.parent,\n\
        keyFn  = this.keyFn,\n\
        length = parent.length(),\n\
        cache  = [],\n\
        find   = contains,\n\
        key, value,\n\
        i = -1,\n\
        j = 0;\n\
\n\
    while (++i < length) {\n\
      value = parent.get(i);\n\
      key = keyFn(value);\n\
      if (!find(cache, key)) {\n\
        cache.push(key);\n\
        if (fn(value, j++) === false) {\n\
          return false;\n\
        }\n\
      }\n\
    }\n\
  };\n\
\n\
  IndexedUniqueSequence.prototype.eachSetCache = UniqueSequence.prototype.each;\n\
\n\
  function getEachForParent(parent) {\n\
    if (parent.length() < 100) {\n\
      return IndexedUniqueSequence.prototype.eachArrayCache;\n\
    } else {\n\
      return UniqueSequence.prototype.each;\n\
    }\n\
  }\n\
\n\
  /**\n\
   * ArrayWrapper is the most basic {@link Sequence}. It directly wraps an array\n\
   * and implements the same methods as {@link ArrayLikeSequence}, but more\n\
   * efficiently.\n\
   *\n\
   * @constructor\n\
   */\n\
  function ArrayWrapper(source) {\n\
    this.source = source;\n\
  }\n\
\n\
  ArrayWrapper.prototype = new ArrayLikeSequence();\n\
\n\
  /**\n\
   * Returns the element at the specified index in the source array.\n\
   *\n\
   * @param {number} i The index to access.\n\
   * @returns {*} The element.\n\
   */\n\
  ArrayWrapper.prototype.get = function(i) {\n\
    return this.source[i];\n\
  };\n\
\n\
  /**\n\
   * Returns the length of the source array.\n\
   *\n\
   * @returns {number} The length.\n\
   */\n\
  ArrayWrapper.prototype.length = function() {\n\
    return this.source.length;\n\
  };\n\
\n\
  /**\n\
   * An optimized version of {@link Sequence#each}.\n\
   */\n\
  ArrayWrapper.prototype.each = function(fn) {\n\
    var source = this.source,\n\
        length = source.length,\n\
        i = -1;\n\
\n\
    while (++i < length) {\n\
      if (fn(source[i], i) === false) {\n\
        break;\n\
      }\n\
    }\n\
  };\n\
\n\
  /**\n\
   * An optimized version of {@link Sequence#map}.\n\
   */\n\
  ArrayWrapper.prototype.map =\n\
  ArrayWrapper.prototype.collect = function(mapFn) {\n\
    if (typeof mapFn === 'string') {\n\
      return this.pluck(mapFn);\n\
    }\n\
\n\
    return new MappedArrayWrapper(this.source, mapFn);\n\
  };\n\
\n\
  /**\n\
   * An optimized version of {@link Sequence#filter}.\n\
   */\n\
  ArrayWrapper.prototype.filter =\n\
  ArrayWrapper.prototype.select = function(filterFn) {\n\
    return new FilteredArrayWrapper(this, createCallback(filterFn));\n\
  };\n\
\n\
  /**\n\
   * An optimized version of {@link Sequence#uniq}.\n\
   */\n\
  ArrayWrapper.prototype.uniq =\n\
  ArrayWrapper.prototype.unique = function(keyFn) {\n\
    return new UniqueArrayWrapper(this, createCallback(keyFn));\n\
  };\n\
\n\
  /**\n\
   * An optimized version of {@link ArrayLikeSequence#concat}.\n\
   *\n\
   * @param {...*} var_args\n\
   */\n\
  ArrayWrapper.prototype.concat = function(var_args) {\n\
    if (arguments.length === 1 && arguments[0] instanceof Array) {\n\
      return new ConcatArrayWrapper(this.source, (/** @type {Array} */ var_args));\n\
    } else {\n\
      return ArrayLikeSequence.prototype.concat.apply(this, arguments);\n\
    }\n\
  };\n\
\n\
  /**\n\
   * An optimized version of {@link Sequence#toArray}.\n\
   */\n\
  ArrayWrapper.prototype.toArray = function() {\n\
    return this.source.slice(0);\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function MappedArrayWrapper(source, mapFn) {\n\
    this.source = source;\n\
    this.mapFn  = mapFn;\n\
  }\n\
\n\
  MappedArrayWrapper.prototype = new ArrayLikeSequence();\n\
\n\
  MappedArrayWrapper.prototype.get = function(i) {\n\
    if (i < 0 || i >= this.source.length) {\n\
      return undefined;\n\
    }\n\
\n\
    return this.mapFn(this.source[i]);\n\
  };\n\
\n\
  MappedArrayWrapper.prototype.length = function() {\n\
    return this.source.length;\n\
  };\n\
\n\
  MappedArrayWrapper.prototype.each = function(fn) {\n\
    var source = this.source,\n\
        length = this.source.length,\n\
        mapFn  = this.mapFn,\n\
        i = -1;\n\
    while (++i < length) {\n\
      if (fn(mapFn(source[i], i), i) === false) {\n\
        return;\n\
      }\n\
    }\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function FilteredArrayWrapper(parent, filterFn) {\n\
    this.parent   = parent;\n\
    this.filterFn = filterFn;\n\
  }\n\
\n\
  FilteredArrayWrapper.prototype = new FilteredSequence();\n\
\n\
  FilteredArrayWrapper.prototype.each = function(fn) {\n\
    var source = this.parent.source,\n\
        filterFn = this.filterFn,\n\
        length = source.length,\n\
        i = -1,\n\
        e;\n\
\n\
    while (++i < length) {\n\
      e = source[i];\n\
      if (filterFn(e, i) && fn(e, i) === false) {\n\
        break;\n\
      }\n\
    }\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function UniqueArrayWrapper(parent, keyFn) {\n\
    this.parent = parent;\n\
    this.each   = getEachForSource(parent.source);\n\
    this.keyFn  = createCallback(keyFn);\n\
  }\n\
\n\
  UniqueArrayWrapper.prototype = new CachingSequence();\n\
\n\
  UniqueArrayWrapper.prototype.eachNoCache = function(fn) {\n\
    var source = this.parent.source,\n\
        keyFn  = this.keyFn,\n\
        length = source.length,\n\
        find   = containsBefore,\n\
        value,\n\
\n\
        // Yes, this is hideous.\n\
        // Trying to get performance first, will refactor next!\n\
        i = -1,\n\
        k = 0;\n\
\n\
    while (++i < length) {\n\
      value = source[i];\n\
      if (!find(source, value, i, keyFn) && fn(value, k++) === false) {\n\
        return false;\n\
      }\n\
    }\n\
  };\n\
\n\
  UniqueArrayWrapper.prototype.eachArrayCache = function(fn) {\n\
    // Basically the same implementation as w/ the set, but using an array because\n\
    // it's cheaper for smaller sequences.\n\
    var source = this.parent.source,\n\
        keyFn  = this.keyFn,\n\
        length = source.length,\n\
        cache  = [],\n\
        find   = contains,\n\
        key, value,\n\
        i = -1,\n\
        j = 0;\n\
\n\
    while (++i < length) {\n\
      value = source[i];\n\
      key = keyFn(value);\n\
      if (!find(cache, key)) {\n\
        cache.push(key);\n\
        if (fn(value, j++) === false) {\n\
          return false;\n\
        }\n\
      }\n\
    }\n\
  };\n\
\n\
  UniqueArrayWrapper.prototype.eachSetCache = UniqueSequence.prototype.each;\n\
\n\
  /**\n\
   * My latest findings here...\n\
   *\n\
   * So I hadn't really given the set-based approach enough credit. The main issue\n\
   * was that my Set implementation was totally not optimized at all. After pretty\n\
   * heavily optimizing it (just take a look; it's a monstrosity now!), it now\n\
   * becomes the fastest option for much smaller values of N.\n\
   */\n\
  function getEachForSource(source) {\n\
    if (source.length < 40) {\n\
      return UniqueArrayWrapper.prototype.eachNoCache;\n\
    } else if (source.length < 100) {\n\
      return UniqueArrayWrapper.prototype.eachArrayCache;\n\
    } else {\n\
      return UniqueSequence.prototype.each;\n\
    }\n\
  }\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function ConcatArrayWrapper(source, other) {\n\
    this.source = source;\n\
    this.other  = other;\n\
  }\n\
\n\
  ConcatArrayWrapper.prototype = new ArrayLikeSequence();\n\
\n\
  ConcatArrayWrapper.prototype.get = function(i) {\n\
    var sourceLength = this.source.length;\n\
\n\
    if (i < sourceLength) {\n\
      return this.source[i];\n\
    } else {\n\
      return this.other[i - sourceLength];\n\
    }\n\
  };\n\
\n\
  ConcatArrayWrapper.prototype.length = function() {\n\
    return this.source.length + this.other.length;\n\
  };\n\
\n\
  ConcatArrayWrapper.prototype.each = function(fn) {\n\
    var source = this.source,\n\
        sourceLength = source.length,\n\
        other = this.other,\n\
        otherLength = other.length,\n\
        i = 0,\n\
        j = -1;\n\
\n\
    while (++j < sourceLength) {\n\
      if (fn(source[j], i++) === false) {\n\
        return false;\n\
      }\n\
    }\n\
\n\
    j = -1;\n\
    while (++j < otherLength) {\n\
      if (fn(other[j], i++) === false) {\n\
        return false;\n\
      }\n\
    }\n\
  };\n\
\n\
  /**\n\
   * An `ObjectLikeSequence` object represents a sequence of key/value pairs.\n\
   *\n\
   * So, this one is arguably the least... good... of the sequence types right\n\
   * now. A bunch of methods are implemented already, and they basically \"work\";\n\
   * but the problem is I haven't quite made up my mind exactly how they *should*\n\
   * work, to be consistent and useful.\n\
   *\n\
   * Here are a couple of issues (there are others):\n\
   *\n\
   * 1. For iterating over an object, there is currently *not* a good way to do it\n\
   *    asynchronously (that I know of). The best approach is to call\n\
   *    `Object.keys` and then iterate over *those* asynchronously; but this of\n\
   *    course eagerly iterates over the object's keys (though maybe that's not\n\
   *    a really big deal).\n\
   * 2. In terms of method chaining, it is a bit unclear how that should work.\n\
   *    Iterating over an `ObjectLikeSequence` with {@link ObjectLikeSequence#each}\n\
   *    passes `(value, key)` to the given function; but what about the result of\n\
   *    {@link Sequence#map}, {@link Sequence#filter}, etc.? I've flip-flopped\n\
   *    between thinking they should return object-like sequences or regular\n\
   *    sequences.\n\
   *\n\
   * Expect this section to be updated for a coming version of Lazy.js, when I\n\
   * will hopefully have figured this stuff out.\n\
   *\n\
   * @constructor\n\
   */\n\
  function ObjectLikeSequence() {}\n\
\n\
  ObjectLikeSequence.prototype = new Sequence();\n\
\n\
  /**\n\
   * Gets the element at the specified key in this sequence.\n\
   *\n\
   * @param {string} key The key.\n\
   * @returns {*} The element.\n\
   *\n\
   * @example\n\
   * Lazy({ foo: \"bar\" }).get(\"foo\");\n\
   * // => \"bar\"\n\
   */\n\
  ObjectLikeSequence.prototype.get = function(key) {\n\
    return this.parent.get(key);\n\
  };\n\
\n\
  /**\n\
   * Returns a {@link Sequence} whose elements are the keys of this object-like\n\
   * sequence.\n\
   *\n\
   * @returns {Sequence} The sequence based on this sequence's keys.\n\
   *\n\
   * @examples\n\
   * Lazy({ hello: \"hola\", goodbye: \"hasta luego\" }).keys() // => [\"hello\", \"goodbye\"]\n\
   */\n\
  ObjectLikeSequence.prototype.keys = function() {\n\
    return this.map(function(v, k) { return k; });\n\
  };\n\
\n\
  /**\n\
   * Returns a {@link Sequence} whose elements are the values of this object-like\n\
   * sequence.\n\
   *\n\
   * @returns {Sequence} The sequence based on this sequence's values.\n\
   *\n\
   * @examples\n\
   * Lazy({ hello: \"hola\", goodbye: \"hasta luego\" }).values() // => [\"hola\", \"hasta luego\"]\n\
   */\n\
  ObjectLikeSequence.prototype.values = function() {\n\
    return this.map(function(v, k) { return v; });\n\
  };\n\
\n\
  /**\n\
   * Returns an `ObjectLikeSequence` whose elements are the combination of this\n\
   * sequence and another object. In the case of a key appearing in both this\n\
   * sequence and the given object, the other object's value will override the\n\
   * one in this sequence.\n\
   *\n\
   * @param {Object} other The other object to assign to this sequence.\n\
   * @returns {ObjectLikeSequence} A new sequence comprising elements from this\n\
   *     sequence plus the contents of `other`.\n\
   *\n\
   * @examples\n\
   * Lazy({ \"uno\": 1, \"dos\": 2 }).assign({ \"tres\": 3 }) // => { uno: 1, dos: 2, tres: 3 }\n\
   * Lazy({ foo: \"bar\" }).assign({ foo: \"baz\" });       // => { foo: \"baz\" }\n\
   */\n\
  ObjectLikeSequence.prototype.assign = function(other) {\n\
    return new AssignSequence(this, other);\n\
  };\n\
\n\
  /**\n\
   * Alias for {@link ObjectLikeSequence#assign}.\n\
   *\n\
   * @function extend\n\
   * @memberOf ObjectLikeSequence\n\
   * @instance\n\
   */\n\
  ObjectLikeSequence.prototype.extend = ObjectLikeSequence.prototype.assign;\n\
\n\
  /**\n\
   * Returns an `ObjectLikeSequence` whose elements are the combination of this\n\
   * sequence and a 'default' object. In the case of a key appearing in both this\n\
   * sequence and the given object, this sequence's value will override the\n\
   * default object's.\n\
   *\n\
   * @param {Object} defaults The 'default' object to use for missing keys in this\n\
   *     sequence.\n\
   * @returns {ObjectLikeSequence} A new sequence comprising elements from this\n\
   *     sequence supplemented by the contents of `defaults`.\n\
   *\n\
   * @examples\n\
   * Lazy({ name: \"Dan\" }).defaults({ name: \"User\", password: \"passw0rd\" }) // => { name: \"Dan\", password: \"passw0rd\" }\n\
   */\n\
  ObjectLikeSequence.prototype.defaults = function(defaults) {\n\
    return new DefaultsSequence(this, defaults);\n\
  };\n\
\n\
  /**\n\
   * Returns an `ObjectLikeSequence` whose values are this sequence's keys, and\n\
   * whose keys are this sequence's values.\n\
   *\n\
   * @returns {ObjectLikeSequence} A new sequence comprising the inverted keys and\n\
   *     values from this sequence.\n\
   *\n\
   * @examples\n\
   * Lazy({ first: \"Dan\", last: \"Tao\" }).invert() // => { Dan: \"first\", Tao: \"last\" }\n\
   */\n\
  ObjectLikeSequence.prototype.invert = function() {\n\
    return new InvertedSequence(this);\n\
  };\n\
\n\
  /**\n\
   * Creates a {@link Sequence} consisting of the keys from this sequence whose\n\
   *     values are functions.\n\
   *\n\
   * @returns {Sequence} The new sequence.\n\
   *\n\
   * @examples\n\
   * var dog = {\n\
   *   name: \"Fido\",\n\
   *   breed: \"Golden Retriever\",\n\
   *   bark: function() { console.log(\"Woof!\"); },\n\
   *   wagTail: function() { console.log(\"TODO: implement robotic dog interface\"); }\n\
   * };\n\
   *\n\
   * Lazy(dog).functions() // => [\"bark\", \"wagTail\"]\n\
   */\n\
  ObjectLikeSequence.prototype.functions = function() {\n\
    return this\n\
      .filter(function(v, k) { return typeof(v) === \"function\"; })\n\
      .map(function(v, k) { return k; });\n\
  };\n\
\n\
  /**\n\
   * Alias for {@link ObjectLikeSequence#functions}.\n\
   *\n\
   * @function methods\n\
   * @memberOf ObjectLikeSequence\n\
   * @instance\n\
   */\n\
  ObjectLikeSequence.prototype.methods = ObjectLikeSequence.prototype.functions;\n\
\n\
  /**\n\
   * Creates an `ObjectLikeSequence` consisting of the key/value pairs from this\n\
   * sequence whose keys are included in the given array of property names.\n\
   *\n\
   * @param {Array} properties An array of the properties to \"pick\" from this\n\
   *     sequence.\n\
   * @returns {ObjectLikeSequence} The new sequence.\n\
   *\n\
   * @examples\n\
   * var players = {\n\
   *   \"who\": \"first\",\n\
   *   \"what\": \"second\",\n\
   *   \"i don't know\": \"third\"\n\
   * };\n\
   *\n\
   * Lazy(players).pick([\"who\", \"what\"]) // => { who: \"first\", what: \"second\" }\n\
   */\n\
  ObjectLikeSequence.prototype.pick = function(properties) {\n\
    return new PickSequence(this, properties);\n\
  };\n\
\n\
  /**\n\
   * Creates an `ObjectLikeSequence` consisting of the key/value pairs from this\n\
   * sequence excluding those with the specified keys.\n\
   *\n\
   * @param {Array} properties An array of the properties to *omit* from this\n\
   *     sequence.\n\
   * @returns {ObjectLikeSequence} The new sequence.\n\
   *\n\
   * @examples\n\
   * var players = {\n\
   *   \"who\": \"first\",\n\
   *   \"what\": \"second\",\n\
   *   \"i don't know\": \"third\"\n\
   * };\n\
   *\n\
   * Lazy(players).omit([\"who\", \"what\"]) // => { \"i don't know\": \"third\" }\n\
   */\n\
  ObjectLikeSequence.prototype.omit = function(properties) {\n\
    return new OmitSequence(this, properties);\n\
  };\n\
\n\
  /**\n\
   * Creates an array from the key/value pairs in this sequence.\n\
   *\n\
   * @returns {Array} An array of `[key, value]` elements.\n\
   *\n\
   * @examples\n\
   * var colorCodes = {\n\
   *   red: \"#f00\",\n\
   *   green: \"#0f0\",\n\
   *   blue: \"#00f\"\n\
   * };\n\
   *\n\
   * Lazy(colorCodes).toArray() // => [[\"red\", \"#f00\"], [\"green\", \"#0f0\"], [\"blue\", \"#00f\"]]\n\
   */\n\
  ObjectLikeSequence.prototype.toArray = function() {\n\
    return this.map(function(v, k) { return [k, v]; }).toArray();\n\
  };\n\
\n\
  /**\n\
   * Alias for {@link ObjectLikeSequence#toArray}.\n\
   *\n\
   * @function pairs\n\
   * @memberOf ObjectLikeSequence\n\
   * @instance\n\
   */\n\
  ObjectLikeSequence.prototype.pairs = ObjectLikeSequence.prototype.toArray;\n\
\n\
  /**\n\
   * Creates an object with the key/value pairs from this sequence.\n\
   *\n\
   * @returns {Object} An object with the same key/value pairs as this sequence.\n\
   *\n\
   * @examples\n\
   * var colorCodes = {\n\
   *   red: \"#f00\",\n\
   *   green: \"#0f0\",\n\
   *   blue: \"#00f\"\n\
   * };\n\
   *\n\
   * Lazy(colorCodes).toObject() // => { red: \"#f00\", green: \"#0f0\", blue: \"#00f\" }\n\
   */\n\
  ObjectLikeSequence.prototype.toObject = function() {\n\
    return this.map(function(v, k) { return [k, v]; }).toObject();\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function AssignSequence(parent, other) {\n\
    this.parent = parent;\n\
    this.other  = other;\n\
  }\n\
\n\
  AssignSequence.prototype = new ObjectLikeSequence();\n\
\n\
  AssignSequence.prototype.each = function(fn) {\n\
    var merged = new Set(),\n\
        done   = false;\n\
\n\
    Lazy(this.other).each(function(value, key) {\n\
      if (fn(value, key) === false) {\n\
        done = true;\n\
        return false;\n\
      }\n\
\n\
      merged.add(key);\n\
    });\n\
\n\
    if (!done) {\n\
      this.parent.each(function(value, key) {\n\
        if (!merged.contains(key) && fn(value, key) === false) {\n\
          return false;\n\
        }\n\
      });\n\
    }\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function DefaultsSequence(parent, defaults) {\n\
    this.parent   = parent;\n\
    this.defaults = defaults;\n\
  }\n\
\n\
  DefaultsSequence.prototype = new ObjectLikeSequence();\n\
\n\
  DefaultsSequence.prototype.each = function(fn) {\n\
    var merged = new Set(),\n\
        done   = false;\n\
\n\
    this.parent.each(function(value, key) {\n\
      if (fn(value, key) === false) {\n\
        done = true;\n\
        return false;\n\
      }\n\
\n\
      if (typeof value !== \"undefined\") {\n\
        merged.add(key);\n\
      }\n\
    });\n\
\n\
    if (!done) {\n\
      Lazy(this.defaults).each(function(value, key) {\n\
        if (!merged.contains(key) && fn(value, key) === false) {\n\
          return false;\n\
        }\n\
      });\n\
    }\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function InvertedSequence(parent) {\n\
    this.parent = parent;\n\
  }\n\
\n\
  InvertedSequence.prototype = new ObjectLikeSequence();\n\
\n\
  InvertedSequence.prototype.each = function(fn) {\n\
    this.parent.each(function(value, key) {\n\
      return fn(key, value);\n\
    });\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function PickSequence(parent, properties) {\n\
    this.parent     = parent;\n\
    this.properties = properties;\n\
  }\n\
\n\
  PickSequence.prototype = new ObjectLikeSequence();\n\
\n\
  PickSequence.prototype.each = function(fn) {\n\
    var inArray    = contains,\n\
        properties = this.properties;\n\
\n\
    this.parent.each(function(value, key) {\n\
      if (inArray(properties, key)) {\n\
        return fn(value, key);\n\
      }\n\
    });\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function OmitSequence(parent, properties) {\n\
    this.parent     = parent;\n\
    this.properties = properties;\n\
  }\n\
\n\
  OmitSequence.prototype = new ObjectLikeSequence();\n\
\n\
  OmitSequence.prototype.each = function(fn) {\n\
    var inArray    = contains,\n\
        properties = this.properties;\n\
\n\
    this.parent.each(function(value, key) {\n\
      if (!inArray(properties, key)) {\n\
        return fn(value, key);\n\
      }\n\
    });\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function ObjectWrapper(source) {\n\
    this.source = source;\n\
  }\n\
\n\
  ObjectWrapper.prototype = new ObjectLikeSequence();\n\
\n\
  ObjectWrapper.prototype.get = function(key) {\n\
    return this.source[key];\n\
  };\n\
\n\
  ObjectWrapper.prototype.each = function(fn) {\n\
    var source = this.source,\n\
        key;\n\
\n\
    for (key in source) {\n\
      if (fn(source[key], key) === false) {\n\
        return;\n\
      }\n\
    }\n\
  };\n\
\n\
  /**\n\
   * A `StringLikeSequence` represents a sequence of characters.\n\
   *\n\
   * TODO: The idea for this prototype is to be able to do things like represent\n\
   * \"substrings\" without actually allocating new strings. Right now that\n\
   * isn't implemented at all, though (every method assumes an actual string as\n\
   * `source`).\n\
   *\n\
   * @constructor\n\
   */\n\
  function StringLikeSequence() {}\n\
\n\
  StringLikeSequence.prototype = new ArrayLikeSequence();\n\
\n\
  /**\n\
   * Returns an {@link Iterator} that will step over each character in this\n\
   * sequence one by one.\n\
   *\n\
   * @returns {Iterator} The iterator.\n\
   */\n\
  StringLikeSequence.prototype.getIterator = function() {\n\
    return new CharIterator(this.source);\n\
  };\n\
\n\
  /**\n\
   * Returns the character at the given index of this string, or the empty string\n\
   * if the specified index lies outside the bounds of the string.\n\
   *\n\
   * @param {number} i The index of this sequence.\n\
   * @returns {string} The character at the specified index.\n\
   *\n\
   * @examples\n\
   * Lazy(\"foo\").charAt(0)  // => \"f\"\n\
   * Lazy(\"foo\").charAt(-1) // => \"\"\n\
   */\n\
  StringLikeSequence.prototype.charAt = function(i) {\n\
    return this.get(i);\n\
  };\n\
\n\
  /**\n\
   * @name get\n\
   *\n\
   * Returns the character at the given index of this stream.\n\
   * @example:\n\
   * Lazy(\"foo\")\n\
   *   .map(function(c) { return c.toUpperCase(); })\n\
   *   .get(0);\n\
   * // => \"F\"\n\
   */\n\
\n\
  /**\n\
   * See {@link Sequence#each}.\n\
   */\n\
  StringLikeSequence.prototype.each = function(fn) {\n\
    var source = this.source,\n\
        length = source.length,\n\
        i = -1;\n\
\n\
    while (++i < length) {\n\
      if (fn(source.charAt(i)) === false) {\n\
        break;\n\
      }\n\
    }\n\
  };\n\
\n\
  /**\n\
   * Creates a {@link Sequence} comprising all of the matches for the specified\n\
   * pattern in the underlying string.\n\
   *\n\
   * @param {RegExp} pattern The pattern to match.\n\
   * @returns {Sequence} A sequence of all the matches.\n\
   *\n\
   * @examples\n\
   * Lazy(\"abracadabra\").match(/a[bcd]/) // => [\"ab\", \"ac\", \"ad\", \"ab\"]\n\
   * Lazy(\"fee fi fo fum\").match(/\\w+/)  // => [\"fee\", \"fi\", \"fo\", \"fum\"]\n\
   * Lazy(\"hello\").match(/xyz/)          // => []\n\
   */\n\
  StringLikeSequence.prototype.match = function(pattern) {\n\
    return new StringMatchSequence(this.source, pattern);\n\
  };\n\
\n\
  /**\n\
   * Creates a {@link Sequence} comprising all of the substrings of this string\n\
   * separated by the given delimiter, which can be either a string or a regular\n\
   * expression.\n\
   *\n\
   * @param {string|RegExp} delimiter The delimiter to use for recognizing\n\
   *     substrings.\n\
   * @returns {Sequence} A sequence of all the substrings separated by the given\n\
   *     delimiter.\n\
   *\n\
   * @examples\n\
   * Lazy(\"foo\").split(\"\")                      // => [\"f\", \"o\", \"o\"]\n\
   * Lazy(\"yo dawg\").split(\" \")                 // => [\"yo\", \"dawg\"]\n\
   * Lazy(\"bah bah\\tblack  sheep\").split(/\\s+/) // => [\"bah\", \"bah\", \"black\", \"sheep\"]\n\
   */\n\
  StringLikeSequence.prototype.split = function(delimiter) {\n\
    return new SplitStringSequence(this.source, delimiter);\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function StringMatchSequence(source, pattern) {\n\
    this.source = source;\n\
    this.pattern = pattern;\n\
  }\n\
\n\
  StringMatchSequence.prototype = new Sequence();\n\
\n\
  StringMatchSequence.prototype.each = function(fn) {\n\
    var iterator = this.getIterator();\n\
    while (iterator.moveNext()) {\n\
      if (fn(iterator.current()) === false) {\n\
        return;\n\
      }\n\
    }\n\
  };\n\
\n\
  StringMatchSequence.prototype.getIterator = function() {\n\
    return new StringMatchIterator(this.source, this.pattern);\n\
  };\n\
\n\
  /**\n\
   * @constructor\n\
   */\n\
  function SplitStringSequence(source, pattern) {\n\
    this.source = source;\n\
    this.pattern = pattern;\n\
  }\n\
\n\
  SplitStringSequence.prototype = new Sequence();\n\
\n\
  SplitStringSequence.prototype.each = function(fn) {\n\
    var iterator = this.getIterator();\n\
    while (iterator.moveNext()) {\n\
      if (fn(iterator.current()) === false) {\n\
        break;\n\
      }\n\
    }\n\
  };\n\
\n\
  SplitStringSequence.prototype.getIterator = function() {\n\
    if (this.pattern instanceof RegExp) {\n\
      if (this.pattern.source === \"\" || this.pattern.source === \"(?:)\") {\n\
        return new CharIterator(this.source);\n\
      } else {\n\
        return new SplitWithRegExpIterator(this.source, this.pattern);\n\
      }\n\
    } else if (this.pattern === \"\") {\n\
      return new CharIterator(this.source);\n\
    } else {\n\
      return new SplitWithStringIterator(this.source, this.pattern);\n\
    }\n\
  };\n\
\n\
  /**\n\
   * Wraps a string exposing {@link #match} and {@link #split} methods that return\n\
   * {@link Sequence} objects instead of arrays, improving on the efficiency of\n\
   * JavaScript's built-in `String#split` and `String.match` methods and\n\
   * supporting asynchronous iteration.\n\
   *\n\
   * @param {string} source The string to wrap.\n\
   * @constructor\n\
   */\n\
  function StringWrapper(source) {\n\
    this.source = source;\n\
  }\n\
\n\
  StringWrapper.prototype = new StringLikeSequence();\n\
\n\
  StringWrapper.prototype.get = function(i) {\n\
    return this.source.charAt(i);\n\
  };\n\
\n\
  StringWrapper.prototype.length = function() {\n\
    return this.source.length;\n\
  };\n\
\n\
  /**\n\
   * A GeneratedSequence does not wrap an in-memory colllection but rather\n\
   * determines its elements on-the-fly during iteration according to a generator\n\
   * function.\n\
   *\n\
   * @constructor\n\
   * @param {function(number):*} generatorFn A function which accepts an index\n\
   *     and returns a value for the element at that position in the sequence.\n\
   * @param {number=} length The length of the sequence. If this argument is\n\
   *     omitted, the sequence will go on forever.\n\
   */\n\
  function GeneratedSequence(generatorFn, length) {\n\
    this.get = generatorFn;\n\
    this.fixedLength = length;\n\
  }\n\
\n\
  GeneratedSequence.prototype = new Sequence();\n\
\n\
  /**\n\
   * Returns the length of this sequence.\n\
   *\n\
   * @returns {number} The length, or `undefined` if this is an indefinite\n\
   *     sequence.\n\
   */\n\
  GeneratedSequence.prototype.length = function() {\n\
    return this.fixedLength;\n\
  };\n\
\n\
  /**\n\
   * See {@link Sequence#each}.\n\
   */\n\
  GeneratedSequence.prototype.each = function(fn) {\n\
    var generatorFn = this.get,\n\
        length = this.fixedLength,\n\
        i = 0;\n\
    while (typeof length === \"undefined\" || i < length) {\n\
      if (fn(generatorFn(i++)) === false) {\n\
        break;\n\
      }\n\
    }\n\
  };\n\
\n\
  /**\n\
   * See {@link Sequence#getIterator}\n\
   */\n\
  GeneratedSequence.prototype.getIterator = function() {\n\
    return new GeneratedIterator(this);\n\
  };\n\
\n\
  /**\n\
   * Iterates over a generated sequence. (This allows generated sequences to be\n\
   * iterated asynchronously.)\n\
   *\n\
   * @param {GeneratedSequence} sequence The generated sequence to iterate over.\n\
   * @constructor\n\
   */\n\
  function GeneratedIterator(sequence) {\n\
    this.sequence     = sequence;\n\
    this.index        = 0;\n\
    this.currentValue = null;\n\
  }\n\
\n\
  GeneratedIterator.prototype.current = function() {\n\
    return this.currentValue;\n\
  };\n\
\n\
  GeneratedIterator.prototype.moveNext = function() {\n\
    var sequence = this.sequence;\n\
\n\
    if (typeof sequence.fixedLength === \"number\" && this.index >= sequence.fixedLength) {\n\
      return false;\n\
    }\n\
\n\
    this.currentValue = sequence.get(this.index++);\n\
    return true;\n\
  };\n\
\n\
  /**\n\
   * An `AsyncSequence` iterates over its elements asynchronously when\n\
   * {@link #each} is called.\n\
   *\n\
   * Returning values\n\
   * ----------------\n\
   *\n\
   * Because of its asynchronous nature, an `AsyncSequence` cannot be used in the\n\
   * same way as other sequences for functions that return values directly (e.g.,\n\
   * `reduce`, `max`, `any`, even `toArray`).\n\
   *\n\
   * The plan is to eventually implement all of these methods differently for\n\
   * `AsyncSequence`: instead of returning values, they will accept a callback and\n\
   * pass a result to the callback once iteration has been completed (or an error\n\
   * is raised). But that isn't done yet.\n\
   *\n\
   * Defining custom asynchronous sequences\n\
   * --------------------------------------\n\
   *\n\
   * There are plenty of ways to define an asynchronous sequence. Here's one.\n\
   *\n\
   * 1. First, implement an {@link Iterator}. This is an object whose prototype\n\
   *    has the methods {@link Iterator#moveNext} (which returns a `boolean`) and\n\
   *    {@link current} (which returns the current value).\n\
   * 2. Next, create a simple wrapper that inherits from `AsyncSequence`, whose\n\
   *    `getIterator` function returns an instance of the iterator type you just\n\
   *    defined.\n\
   *\n\
   * The default implementation for {@link #each} on an `AsyncSequence` is to\n\
   * create an iterator and then asynchronously call {@link Iterator#moveNext}\n\
   * (using `setImmediate`, if available, otherwise `setTimeout`) until the iterator\n\
   * can't move ahead any more.\n\
   *\n\
   * @param {Sequence} parent A {@link Sequence} to wrap, to expose asynchronous\n\
   *     iteration.\n\
   * @param {number=} interval How many milliseconds should elapse between each\n\
   *     element when iterating over this sequence. If this argument is omitted,\n\
   *     asynchronous iteration will be executed as fast as possible.\n\
   * @constructor\n\
   */\n\
  function AsyncSequence(parent, interval) {\n\
    if (parent instanceof AsyncSequence) {\n\
      throw \"Sequence is already asynchronous!\";\n\
    }\n\
\n\
    this.parent = parent;\n\
    this.onNextCallback = getOnNextCallback(interval);\n\
    this.cancelCallback = getCancelCallback();\n\
  }\n\
\n\
  AsyncSequence.prototype = new Sequence();\n\
\n\
  /**\n\
   * An asynchronous version of {@link Sequence#each}.\n\
   *\n\
   * @param {Function} fn The function to invoke asynchronously on each element in\n\
   *     the sequence one by one.\n\
   * @returns {{cancel: Function, onError: Function}} An object providing the\n\
   *     ability to cancel the asynchronous iteration (by calling `cancel()`) as\n\
   *     well as handle any errors with a callback (set with `onError()`).\n\
   */\n\
  AsyncSequence.prototype.each = function(fn) {\n\
    var iterator = this.parent.getIterator(),\n\
        onNextCallback = this.onNextCallback,\n\
        cancelCallback = this.cancelCallback;\n\
\n\
    var handle = {\n\
      id: null,\n\
\n\
      cancel: function() {\n\
        if (handle.id) {\n\
          cancelCallback(handle.id);\n\
          handle.id = null;\n\
        }\n\
      },\n\
\n\
      onError: function(callback) {\n\
        handle.errorCallback = callback;\n\
      },\n\
\n\
      errorCallback: function(error) {}\n\
    };\n\
\n\
    if (iterator.moveNext()) {\n\
      handle.id = onNextCallback(function iterate() {\n\
        try {\n\
          if (fn(iterator.current()) !== false && iterator.moveNext()) {\n\
            handle.id = onNextCallback(iterate);\n\
          }\n\
        } catch (e) {\n\
          handle.errorCallback(e);\n\
        }\n\
      });\n\
    }\n\
\n\
    return handle;\n\
  };\n\
\n\
  function getOnNextCallback(interval) {\n\
    if (typeof interval === \"undefined\") {\n\
      if (typeof context.setImmediate === \"function\") {\n\
        return context.setImmediate;\n\
      }\n\
    }\n\
\n\
    interval = interval || 0;\n\
    return function(fn) {\n\
      return setTimeout(fn, interval);\n\
    };\n\
  }\n\
\n\
  function getCancelCallback(interval) {\n\
    if (typeof interval === \"undefined\") {\n\
      if (typeof context.clearImmediate === \"function\") {\n\
        return context.clearImmediate;\n\
      }\n\
    }\n\
\n\
    return context.clearTimeout;\n\
  }\n\
\n\
  /**\n\
   * A StreamLikeSequence comprises a sequence of 'chunks' of data, which are\n\
   * typically multiline strings.\n\
   *\n\
   * @constructor\n\
   */\n\
  function StreamLikeSequence() {}\n\
\n\
  StreamLikeSequence.prototype = new Sequence();\n\
\n\
  StreamLikeSequence.prototype.lines = function() {\n\
    return new LinesSequence(this);\n\
  };\n\
\n\
  /**\n\
   * A sequence of lines (segments of a larger string or string-like sequence\n\
   * delimited by line breaks).\n\
   *\n\
   * @constructor\n\
   */\n\
  function LinesSequence(parent) {\n\
    this.parent = parent;\n\
  };\n\
\n\
  LinesSequence.prototype = new Sequence();\n\
\n\
  LinesSequence.prototype.each = function(fn) {\n\
    var done = false;\n\
    this.parent.each(function(chunk) {\n\
      Lazy(chunk).split(\"\\n\
\").each(function(line) {\n\
        if (fn(line) === false) {\n\
          done = true;\n\
          return false;\n\
        }\n\
      });\n\
\n\
      return !done;\n\
    });\n\
  };\n\
\n\
  /**\n\
   * A StreamingHttpSequence is a `StreamLikeSequence` comprising the chunks of\n\
   * data that are streamed in response to an HTTP request.\n\
   *\n\
   * @param {string} url The URL of the HTTP request.\n\
   * @constructor\n\
   */\n\
  function StreamingHttpSequence(url) {\n\
    this.url = url;\n\
  };\n\
\n\
  StreamingHttpSequence.prototype = new StreamLikeSequence();\n\
\n\
  StreamingHttpSequence.prototype.each = function(fn) {\n\
    var request = new XMLHttpRequest(),\n\
        index   = 0,\n\
        aborted = false;\n\
\n\
    request.open(\"GET\", this.url);\n\
\n\
    var listener = function(data) {\n\
      if (!aborted) {\n\
        data = request.responseText.substring(index);\n\
        if (fn(data) === false) {\n\
          request.removeEventListener(\"progress\", listener, false);\n\
          request.abort();\n\
          aborted = true;\n\
        }\n\
        index += data.length;\n\
      }\n\
    };\n\
\n\
    request.addEventListener(\"progress\", listener, false);\n\
\n\
    request.send();\n\
  };\n\
\n\
  /**\n\
   * Wraps an object and returns a {@link Sequence}.\n\
   *\n\
   * - For **arrays**, Lazy will create a sequence comprising the elements in\n\
   *   the array (an {@link ArrayLikeSequence}).\n\
   * - For **objects**, Lazy will create a sequence of key/value pairs\n\
   *   (an {@link ObjectLikeSequence}).\n\
   * - For **strings**, Lazy will create a sequence of characters (a\n\
   *   {@link StringLikeSequence}).\n\
   *\n\
   * @param {Array|Object|string} source An array, object, or string to wrap.\n\
   * @returns {Sequence} The wrapped lazy object.\n\
   *\n\
   * @example\n\
   * var fromArray = Lazy([1, 2, 4]);\n\
   * // => Lazy.ArrayLikeSequence\n\
   *\n\
   * var fromObject = Lazy({ foo: \"bar\" });\n\
   * // => Lazy.ObjectLikeSequence\n\
   *\n\
   * var fromString = Lazy(\"hello, world!\");\n\
   * // => Lazy.StringLikeSequence\n\
   */\n\
  var Lazy = function(source) {\n\
    if (source instanceof Array) {\n\
      return new ArrayWrapper(source);\n\
    } else if (typeof source === \"string\") {\n\
      return new StringWrapper(source);\n\
    } else if (source instanceof Sequence) {\n\
      return source;\n\
    }\n\
    return new ObjectWrapper(source);\n\
  };\n\
\n\
  /**\n\
   * Creates a {@link GeneratedSequence} using the specified generator function\n\
   * and (optionally) length.\n\
   *\n\
   * @param {function(number):*} generatorFn The function used to generate the\n\
   *     sequence. This function accepts an index as a parameter and should return\n\
   *     a value for that index in the resulting sequence.\n\
   * @param {number=} length The length of the sequence, for sequences with a\n\
   *     definite length.\n\
   * @returns {GeneratedSequence} The generated sequence.\n\
   *\n\
   * @example\n\
   * var randomNumbers = Lazy.generate(Math.random);\n\
   * // => sequence: (0.4838115070015192, 0.637410914292559, ...)\n\
   *\n\
   * randomNumbers.length();\n\
   * // => undefined\n\
   *\n\
   * var countingNumbers = Lazy.generate(function(i) { return i + 1; }, 10);\n\
   * // => sequence: (1, 2, ..., 10)\n\
   *\n\
   * countingNumbers.length();\n\
   * // => 10\n\
   */\n\
  Lazy.generate = function(generatorFn, length) {\n\
    return new GeneratedSequence(generatorFn, length);\n\
  };\n\
\n\
  /**\n\
   * Creates a sequence from a given starting value, up to a specified stopping\n\
   * value, incrementing by a given step.\n\
   *\n\
   * @returns {GeneratedSequence} The sequence defined by the given ranges.\n\
   *\n\
   * @examples\n\
   * Lazy.range(10)       // => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]\n\
   * Lazy.range(1, 11)    // => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]\n\
   * Lazy.range(2, 10, 2) // => [2, 4, 6, 8]\n\
   */\n\
  Lazy.range = function() {\n\
    var start = arguments.length > 1 ? arguments[0] : 0,\n\
        stop  = arguments.length > 1 ? arguments[1] : arguments[0],\n\
        step  = arguments.length > 2 ? arguments[2] : 1;\n\
    return this.generate(function(i) { return start + (step * i); })\n\
      .take(Math.floor((stop - start) / step));\n\
  };\n\
\n\
  /**\n\
   * Creates a sequence consisting of the given value repeated a specified number\n\
   * of times.\n\
   *\n\
   * @param {*} value The value to repeat.\n\
   * @param {number=} count The number of times the value should be repeated in\n\
   *     the sequence. If this argument is omitted, the value will repeat forever.\n\
   * @returns {GeneratedSequence} The sequence containing the repeated value.\n\
   *\n\
   * @example\n\
   * var hihihi = Lazy.repeat(\"hi\", 3);\n\
   * // => sequence: (\"hi\", \"hi\", \"hi\")\n\
   *\n\
   * var foreverYoung = Lazy.repeat(\"young\");\n\
   * // => sequence: (\"young\", \"young\", ...)\n\
   */\n\
  Lazy.repeat = function(value, count) {\n\
    return Lazy.generate(function() { return value; }, count);\n\
  };\n\
\n\
  Lazy.Sequence = Sequence;\n\
  Lazy.ArrayLikeSequence = ArrayLikeSequence;\n\
  Lazy.ObjectLikeSequence = ObjectLikeSequence;\n\
  Lazy.StringLikeSequence = StringLikeSequence;\n\
  Lazy.GeneratedSequence = GeneratedSequence;\n\
  Lazy.AsyncSequence = AsyncSequence;\n\
\n\
  /*** Useful utility methods ***/\n\
\n\
  Lazy.noop     = function(e) {};\n\
  Lazy.identity = function(x) { return x; };\n\
\n\
  /**\n\
   * Creates a callback... you know, Lo-Dash style.\n\
   *\n\
   * - for functions, just returns the function\n\
   * - for strings, returns a pluck-style callback\n\
   * - for objects, returns a where-style callback\n\
   *\n\
   * @param {Function|string|Object} A function, string, or object to convert to a callback.\n\
   * @returns {Function} The callback function.\n\
   */\n\
  function createCallback(callback) {\n\
    switch (typeof callback) {\n\
      case \"function\":\n\
        return callback;\n\
\n\
      case \"string\":\n\
        return function(e) {\n\
          return e[callback];\n\
        };\n\
\n\
      case \"object\":\n\
        return function(e) {\n\
          return Lazy(callback).all(function(value, key) {\n\
            return e[key] === value;\n\
          });\n\
        };\n\
\n\
      case \"undefined\":\n\
        return function(e) {\n\
          return e;\n\
        };\n\
\n\
      default:\n\
        throw \"Don't know how to make a callback from a \" + typeof callback + \"!\";\n\
    }\n\
  }\n\
\n\
  /**\n\
   * Creates a Set containing the specified values.\n\
   *\n\
   * @param {...Array} values One or more array(s) of values used to populate the\n\
   *     set.\n\
   * @returns {Set} A new set containing the values passed in.\n\
   */\n\
  function createSet(values) {\n\
    var set = new Set();\n\
    Lazy(values || []).flatten().each(function(e) {\n\
      set.add(e);\n\
    });\n\
    return set;\n\
  };\n\
\n\
  /**\n\
   * Compares two elements for sorting purposes.\n\
   *\n\
   * @param {*} x The left element to compare.\n\
   * @param {*} y The right element to compare.\n\
   * @param {Function=} fn An optional function to call on each element, to get\n\
   *     the values to compare.\n\
   * @returns {number} 1 if x > y, -1 if x < y, or 0 if x and y are equal.\n\
   */\n\
  function compare(x, y, fn) {\n\
    if (typeof fn === \"function\") {\n\
      return compare(fn(x), fn(y));\n\
    }\n\
\n\
    if (x === y) {\n\
      return 0;\n\
    }\n\
\n\
    return x > y ? 1 : -1;\n\
  }\n\
\n\
  /**\n\
   * Iterates over every element in an array.\n\
   *\n\
   * @param {Array} array The array.\n\
   * @param {Function} fn The function to call on every element, which can return\n\
   *     false to stop the iteration early.\n\
   * @returns {boolean} True if every element in the entire sequence was iterated,\n\
   *     otherwise false.\n\
   */\n\
  function forEach(array, fn) {\n\
    var i = -1,\n\
        len = array.length;\n\
\n\
    while (++i < len) {\n\
      if (fn(array[i]) === false) {\n\
        return false;\n\
      }\n\
    }\n\
\n\
    return true;\n\
  }\n\
\n\
  /**\n\
   * Iterates over every individual element in an array of arrays (of arrays...).\n\
   *\n\
   * @param {Array} array The outermost array.\n\
   * @param {Function} fn The function to call on every element, which can return\n\
   *     false to stop the iteration early.\n\
   * @param {Array=} index An optional counter container, to keep track of the\n\
   *     current index.\n\
   * @returns {boolean} True if every element in the entire sequence was iterated,\n\
   *     otherwise false.\n\
   */\n\
  function recursiveForEach(array, fn, index) {\n\
    // It's easier to ensure this is initialized than to add special handling\n\
    // in case it isn't.\n\
    index = index || [0];\n\
\n\
    var i = -1;\n\
    while (++i < array.length) {\n\
      if (array[i] instanceof Array) {\n\
        if (recursiveForEach(array[i], fn, index) === false) {\n\
          return false;\n\
        }\n\
      } else {\n\
        if (fn(array[i], index[0]++) === false) {\n\
          return false;\n\
        }\n\
      }\n\
    }\n\
    return true;\n\
  }\n\
\n\
  function getFirst(sequence) {\n\
    var result;\n\
    sequence.each(function(e) {\n\
      result = e;\n\
      return false;\n\
    });\n\
    return result;\n\
  }\n\
\n\
  function contains(array, element) {\n\
    var i = -1,\n\
        length = array.length;\n\
\n\
    while (++i < length) {\n\
      if (array[i] === element) {\n\
        return true;\n\
      }\n\
    }\n\
    return false;\n\
  }\n\
\n\
  function containsBefore(array, element, index, keyFn) {\n\
    keyFn = keyFn || function(x) { return x; };\n\
\n\
    var i = -1;\n\
\n\
    while (++i < index) {\n\
      if (keyFn(array[i]) === keyFn(element)) {\n\
        return true;\n\
      }\n\
    }\n\
    return false;\n\
  }\n\
\n\
  function swap(array, i, j) {\n\
    var temp = array[i];\n\
    array[i] = array[j];\n\
    array[j] = temp;\n\
  }\n\
\n\
  function indent(depth) {\n\
    return new Array(depth).join(\"  \");\n\
  }\n\
\n\
  /**\n\
   * A collection of unique elements.\n\
   *\n\
   * @constructor\n\
   */\n\
  function Set() {\n\
    this.table = {};\n\
  }\n\
\n\
  /**\n\
   * Attempts to add a unique value to the set.\n\
   *\n\
   * @param {*} value The value to add.\n\
   * @returns {boolean} True if the value was added to the set (meaning an equal\n\
   *     value was not already present), or else false.\n\
   */\n\
  Set.prototype.add = function(value) {\n\
    var table = this.table,\n\
        type  = typeof value,\n\
\n\
        // only applies for strings\n\
        firstChar,\n\
\n\
        // only applies for objects\n\
        objects;\n\
\n\
    switch (type) {\n\
      case \"number\":\n\
      case \"boolean\":\n\
      case \"undefined\":\n\
        if (!table[value]) {\n\
          table[value] = true;\n\
          return true;\n\
        }\n\
        return false;\n\
\n\
      case \"string\":\n\
        // Essentially, escape the first character if it could possibly collide\n\
        // with a number, boolean, or undefined (or a string that happens to start\n\
        // with the escape character!), OR if it could override a special property\n\
        // such as '__proto__' or 'constructor'.\n\
        firstChar = value.charAt(0);\n\
        if (\"_ftc@\".indexOf(firstChar) >= 0 || (firstChar >= \"0\" && firstChar <= \"9\")) {\n\
          value = \"@\" + value;\n\
        }\n\
        if (!table[value]) {\n\
          table[value] = true;\n\
          return true;\n\
        }\n\
        return false;\n\
\n\
      default:\n\
        // For objects and functions, we can't really do anything other than store\n\
        // them in an array and do a linear search for reference equality.\n\
        objects = this.objects;\n\
        if (!objects) {\n\
          objects = this.objects = [];\n\
        }\n\
        if (!contains(objects, value)) {\n\
          objects.push(value);\n\
          return true;\n\
        }\n\
        return false;\n\
    }\n\
  };\n\
\n\
  /**\n\
   * Checks whether the set contains a value.\n\
   *\n\
   * @param {*} value The value to check for.\n\
   * @returns {boolean} True if the set contains the value, or else false.\n\
   */\n\
  Set.prototype.contains = function(value) {\n\
    var type = typeof value,\n\
\n\
        // only applies for strings\n\
        firstChar;\n\
\n\
    switch (type) {\n\
      case \"number\":\n\
      case \"boolean\":\n\
      case \"undefined\":\n\
        return !!this.table[value];\n\
\n\
      case \"string\":\n\
        // Essentially, escape the first character if it could possibly collide\n\
        // with a number, boolean, or undefined (or a string that happens to start\n\
        // with the escape character!), OR if it could override a special property\n\
        // such as '__proto__' or 'constructor'.\n\
        firstChar = value.charAt(0);\n\
        if (\"_ftc@\".indexOf(firstChar) >= 0 || (firstChar >= \"0\" && firstChar <= \"9\")) {\n\
          value = \"@\" + value;\n\
        }\n\
        return !!this.table[value];\n\
\n\
      default:\n\
        // For objects and functions, we can't really do anything other than store\n\
        // them in an array and do a linear search for reference equality.\n\
        return this.objects && contains(this.objects, value);\n\
    }\n\
  };\n\
\n\
  /*** Exposing Lazy to the world ***/\n\
\n\
  // For Node.js\n\
  if (typeof module === \"object\") {\n\
    module.exports = Lazy;\n\
\n\
  // For browsers\n\
  } else {\n\
    context.Lazy = Lazy;\n\
  }\n\
\n\
}(typeof global !== \"undefined\" ? global : this));\n\
//@ sourceURL=dtao-lazy.js/lazy.js"
));
require.register("dtao-lazy.js/lazy.dom.js", Function("exports, require, module",
"(function(window) {\n\
\n\
  var Lazy = window.Lazy;\n\
\n\
  function NodeSequence(source) {\n\
    this.source = source;\n\
  }\n\
\n\
  NodeSequence.prototype = new Lazy.ArrayLikeSequence();\n\
\n\
  NodeSequence.prototype.get = function(i) {\n\
    return this.source[i];\n\
  };\n\
\n\
  NodeSequence.prototype.length = function() {\n\
    return this.source.length;\n\
  };\n\
\n\
  NodeSequence.prototype.flatten = function() {\n\
    return new FlattenedNodeSequence(this.source);\n\
  };\n\
\n\
  function FlattenedNodeSequence(source) {\n\
    this.source = source;\n\
  }\n\
\n\
  FlattenedNodeSequence.prototype = new Lazy.Sequence();\n\
\n\
  /**\n\
   * Iterates over all of a DOM node's descendents (its children, and their\n\
   * children, etc.) and executes a function for each descendent.\n\
   *\n\
   * @param {function(Node):*} fn The function to call on each descendent.\n\
   */\n\
  FlattenedNodeSequence.prototype.each = function(fn) {\n\
    var i    = 0,\n\
        done = false;\n\
\n\
    Lazy(this.source).each(function(child) {\n\
      if (fn(child, i++) === false) {\n\
        return false;\n\
      }\n\
\n\
      Lazy(child.children).flatten().each(function(descendent) {\n\
        if (fn(descendent, i++) === false) {\n\
          done = true;\n\
          return false;\n\
        }\n\
      });\n\
\n\
      if (done) {\n\
        return false;\n\
      }\n\
    });\n\
  };\n\
\n\
  function EventSequence(element, eventName) {\n\
    this.element = element;\n\
    this.eventName = eventName;\n\
  }\n\
\n\
  EventSequence.prototype = new Lazy.Sequence();\n\
\n\
  /**\n\
   * Handles every event in this sequence.\n\
   *\n\
   * @param {function(Event):*} fn The function to call on each event in the\n\
   *     sequence. Return false from the function to stop handling the events.\n\
   */\n\
  EventSequence.prototype.each = function(fn) {\n\
    var element = this.element,\n\
        eventName = this.eventName;\n\
\n\
    var listener = function(e) {\n\
      if (fn(e) === false) {\n\
        element.removeEventListener(eventName, listener);\n\
      }\n\
    };\n\
\n\
    this.element.addEventListener(this.eventName, listener);\n\
  };\n\
\n\
  /**\n\
   * Creates a {@link Sequence} from the specified DOM events triggered on the\n\
   * given element. This sequence works asynchronously, so synchronous methods\n\
   * such as {@code indexOf}, {@code any}, and {@code toArray} won't work.\n\
   *\n\
   * @param {Element} element The DOM element to capture events from.\n\
   * @param {string} eventName The name of the event type (e.g., 'keypress')\n\
   *     that will make up this sequence.\n\
   * @return {Sequence} The sequence of events.\n\
   */\n\
  Lazy.events = function(element, eventName) {\n\
    return new EventSequence(element, eventName);\n\
  };\n\
\n\
  var OriginalLazy = Lazy;\n\
\n\
  /*\n\
   * Assuming someone does:\n\
   * <script src=\"lazy.js\"></script>\n\
   * <script src=\"lazy.dom.js\"></script>\n\
   *\n\
   * Then they should be able to write:\n\
   * Lazy(source)\n\
   *\n\
   * Where `source` can be a:\n\
   * - Array\n\
   * - Object\n\
   * - String\n\
   * - NodeList or HTMLCollection\n\
   *\n\
   * This function provides the last one, and then falls back to the original\n\
   * 'Lazy' which provides the first three.\n\
   */\n\
  Lazy = function(source) {\n\
    if (source instanceof NodeList || source instanceof HTMLCollection) {\n\
      return new NodeSequence(source);\n\
    } else {\n\
      return OriginalLazy(source);\n\
    }\n\
  };\n\
\n\
  /*\n\
   * Attach all of the same properties that Lazy already had.\n\
   *\n\
   * TODO: Think of a better approach here. This is really hacky.\n\
   */\n\
  for (var prop in OriginalLazy) {\n\
    if (OriginalLazy.hasOwnProperty(prop)) {\n\
      Lazy[prop] = OriginalLazy[prop];\n\
    }\n\
  }\n\
\n\
  window.Lazy = Lazy;\n\
\n\
}(window));\n\
//@ sourceURL=dtao-lazy.js/lazy.dom.js"
));
require.register("dtao-lazy.js/lazy.node.js", Function("exports, require, module",
"var fs     = require(\"fs\");\n\
var http   = require(\"http\");\n\
var os     = require(\"os\");\n\
var Stream = require(\"stream\");\n\
var URL    = require(\"url\");\n\
\n\
// The starting point is everything that works in any environment (browser OR\n\
// Node.js)\n\
var Lazy = require(\"./lazy.js\");\n\
\n\
/**\n\
 * @constructor\n\
 */\n\
function StreamedSequence(stream) {\n\
  this.stream = stream;\n\
}\n\
\n\
StreamedSequence.prototype = new Lazy.Sequence();\n\
\n\
StreamedSequence.prototype.openStream = function(callback) {\n\
  this.stream.resume();\n\
  callback(this.stream);\n\
};\n\
\n\
/**\n\
 * Handles every chunk of data in this sequence.\n\
 *\n\
 * @param {function(string):*} fn The function to call on each chunk of data as\n\
 *     it's read from the stream. Return false from the function to stop reading\n\
 *     the stream.\n\
 */\n\
StreamedSequence.prototype.each = function(fn) {\n\
  var encoding = this.encoding || \"utf-8\";\n\
\n\
  this.openStream(function(stream) {\n\
    var listener = function(e) {\n\
      if (fn(e) === false) {\n\
        stream.removeListener(\"data\", listener);\n\
      }\n\
    };\n\
\n\
    stream.setEncoding(encoding);\n\
    stream.on(\"data\", listener);\n\
  });\n\
};\n\
\n\
function StreamedLineSequence(parent) {\n\
  this.parent = parent;\n\
}\n\
\n\
StreamedLineSequence.prototype = new Lazy.Sequence();\n\
\n\
/**\n\
 * Handles every line of data in the underlying file.\n\
 *\n\
 * @param {function(string):*} fn The function to call on each line of data as\n\
 *     it's read from the file. Return false from the function to stop reading\n\
 *     the file.\n\
 */\n\
StreamedLineSequence.prototype.each = function(fn) {\n\
  var i = 0;\n\
\n\
  this.parent.each(function(data) {\n\
    var finished = false;\n\
\n\
    // TODO: I'm pretty sure there's a bug here: if/when the buffer ends in the\n\
    // middle of a line, this will artificially split that line in two. I'll\n\
    // come back to this later.\n\
    Lazy(data).split(os.EOL || \"\\n\
\").each(function(line) {\n\
      if (fn(line, i++) === false) {\n\
        finished = true;\n\
        return false;\n\
      }\n\
    });\n\
\n\
    if (finished) {\n\
      return false;\n\
    }\n\
  });\n\
};\n\
\n\
/**\n\
 * Creates a {@link Sequence} of lines as they are read from a file.\n\
 *\n\
 * @return {Sequence} A sequence comprising the lines in the underlying file, as\n\
 *     they are read.\n\
 */\n\
StreamedSequence.prototype.lines = function() {\n\
  return new StreamedLineSequence(this);\n\
};\n\
\n\
function FileStreamSequence(path, encoding) {\n\
  this.path = path;\n\
  this.encoding = encoding;\n\
}\n\
\n\
FileStreamSequence.prototype = new StreamedSequence();\n\
\n\
FileStreamSequence.prototype.openStream = function(callback) {\n\
  var stream = fs.createReadStream(this.path, { autoClose: true });\n\
  callback(stream);\n\
};\n\
\n\
/**\n\
 * Creates a {@link Sequence} from a file stream, whose elements are chunks of\n\
 * data as the stream is read. This sequence works asynchronously, so\n\
 * synchronous methods such as {@code indexOf}, {@code any}, and {@code toArray}\n\
 * won't work.\n\
 *\n\
 * @param {string} path A path to a file.\n\
 * @param {string} encoding The text encoding of the file (e.g., \"utf-8\").\n\
 * @return {Sequence} The streamed sequence.\n\
 */\n\
Lazy.readFile = function(path, encoding) {\n\
  return new FileStreamSequence(path, encoding);\n\
};\n\
\n\
function HttpStreamSequence(url, encoding) {\n\
  this.url = url;\n\
  this.encoding = encoding;\n\
}\n\
\n\
HttpStreamSequence.prototype = new StreamedSequence();\n\
\n\
HttpStreamSequence.prototype.openStream = function(callback) {\n\
  http.get(URL.parse(this.url), callback);\n\
};\n\
\n\
/**\n\
 * Creates a {@link Sequence} from an HTTP stream, whose elements are chunks of\n\
 * data as the stream is read. This sequence works asynchronously, so\n\
 * synchronous methods such as {@code indexOf}, {@code any}, and {@code toArray}\n\
 * won't work.\n\
 *\n\
 * @param {string} url The URL for the HTTP request.\n\
 * @return {Sequence} The streamed sequence.\n\
 */\n\
Lazy.makeHttpRequest = function(url) {\n\
  return new HttpStreamSequence(url);\n\
};\n\
\n\
/*\n\
 * Assuming someone does:\n\
 * var Lazy = require(\"lazy.js\");\n\
 *\n\
 * Then they should be able to write:\n\
 * Lazy(source)\n\
 *\n\
 * Where `source` can be a:\n\
 * - Array\n\
 * - Object\n\
 * - String\n\
 * - Stream\n\
 *\n\
 * This function provides the last one, and then falls back to the original\n\
 * 'Lazy' which provides the first three.\n\
 */\n\
module.exports = function(source) {\n\
  if (source instanceof Stream) {\n\
    return new StreamedSequence(source);\n\
  } else {\n\
    return Lazy(source);\n\
  }\n\
};\n\
\n\
/*\n\
 * Attach all of the same properties that Lazy already had.\n\
 *\n\
 * TODO: Think of a better approach here. This is really hacky.\n\
 */\n\
for (var prop in Lazy) {\n\
  if (Lazy.hasOwnProperty(prop)) {\n\
    module.exports[prop] = Lazy[prop];\n\
  }\n\
}\n\
//@ sourceURL=dtao-lazy.js/lazy.node.js"
));
require.register("gcps/index.js", Function("exports, require, module",
"module.exports = function() {\n\
  _ = require('lodash');\n\
  page = require('page');\n\
  qs = require('querystring');\n\
};\n\
//@ sourceURL=gcps/index.js"
));





require.alias("visionmedia-page.js/index.js", "gcps/deps/page/index.js");
require.alias("visionmedia-page.js/index.js", "page/index.js");

require.alias("visionmedia-node-querystring/index.js", "gcps/deps/querystring/index.js");
require.alias("visionmedia-node-querystring/index.js", "querystring/index.js");

require.alias("lodash-lodash/index.js", "gcps/deps/lodash/index.js");
require.alias("lodash-lodash/dist/lodash.compat.js", "gcps/deps/lodash/dist/lodash.compat.js");
require.alias("lodash-lodash/index.js", "lodash/index.js");

require.alias("dworthen-webrtc-adapter/index.js", "gcps/deps/webrtc-adapter/index.js");
require.alias("dworthen-webrtc-adapter/index.js", "webrtc-adapter/index.js");

require.alias("dtao-lazy.js/lazy.js", "gcps/deps/lazy.js/lazy.js");
require.alias("dtao-lazy.js/lazy.dom.js", "gcps/deps/lazy.js/lazy.dom.js");
require.alias("dtao-lazy.js/lazy.node.js", "gcps/deps/lazy.js/lazy.node.js");
require.alias("dtao-lazy.js/lazy.js", "gcps/deps/lazy.js/index.js");
require.alias("dtao-lazy.js/lazy.js", "lazy.js/index.js");
require.alias("dtao-lazy.js/lazy.js", "dtao-lazy.js/index.js");
require.alias("gcps/index.js", "gcps/index.js");