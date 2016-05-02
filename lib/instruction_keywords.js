'use strict';

var pointer = require('json-pointer');
var util = require('./util');
var PendingRef = require('./pending');

module.exports = {
  eval$exec: eval$exec,
  eval$ref: eval$ref,
  eval$data: eval$data,
  eval$if: eval$if,
  eval$delay: eval$delay,
  eval$func: eval$func,
  eval$call: eval$call,
  eval$quote: eval$quote
};


/**
 * execute external executor/method
 * @this   Evaluation
 * @param  {Object} params instruction keywords ($exec, $method, $args)
 * @return {Promise|Any} result
 */
function eval$exec(params) {
  var $exec = params.$exec;
  var $method = params.$method;
  var executor = this.js._executors[$exec];
  if (!executor) throw new Error('unknown executor ' + $exec);
  if ($method) {
    if (typeof executor[$method] != 'function')
      throw new Error('unknown method ' + $method + ' of executor ' + $exec);
    return util.toPromise(executor[$method](params.$args));
  }
  if (typeof executor != 'function')
    throw new Error('executor ' + $exec + ' is not a function');
  return util.toPromise(executor(params.$args));
}


/**
 * resolve reference to the current script
 * @this   Evaluation
 * @param  {Object} params   instruction keywords ($ref)
 * @param  {String} dataPath current path (JSON pointer)
 * @return {Promise|Any} reolved reference
 */
function eval$ref(params, dataPath) {
  dataPath = dataPath.replace(this.refPrefixRegexp, '');
  var $ref = params.$ref;
  if ($ref.indexOf('0/') == 0) throw new Error('Cannot reference the same $ref instruction or child');

  var pathParsed = pointer.parse(dataPath);
  var absPointerParsed = util.toAbsolutePointer($ref, pathParsed);
  // N# pointer returns property/index
  if (typeof absPointerParsed == 'string') return absPointerParsed;

  if (!absPointerParsed) absPointerParsed = pointer.parse($ref);

  var i = 0; // find the root to be evaluated
  while (i < pathParsed.length
          && pathParsed[i] == absPointerParsed[i]) i++;
  if (i == pathParsed.length) throw new Error('Cannot reference the same $ref instruction or child');

  var rootPointerParsed = absPointerParsed.slice(0, i+1);
  var rootPointer = pointer.compile(rootPointerParsed);
  var pointerFromRoot = pointer.compile(absPointerParsed.slice(i+1));

  if (this.evaluatedRefs[rootPointer])
    return getRefValue(this.script, rootPointer, pointerFromRoot);

  var self = this;
  var pendingRef = self.pendingRefs[rootPointer]
    = self.pendingRefs[rootPointer] || new PendingRef(rootPointer);
  return new Promise(function (resolve, reject) {
    pendingRef.addCallback(function () {
      resolve(getRefValue(self.script, rootPointer, pointerFromRoot));
    });
  });
}


function getRefValue(obj, rootPointer, pointerFromRoot) {
  var root = pointer.get(obj, rootPointer);
  if (root && typeof root.then == 'function') {
    return root.then(function(rootValue) {
      return pointer.get(rootValue, pointerFromRoot);
    });
  }

  return pointer.get(root, pointerFromRoot);
}


/**
 * resolve reference to the data object
 * @this   Evaluation
 * @param  {Object} params instruction keywords ($data)
 * @return {Any} data value
 */
function eval$data(params) {
  var $data = params.$data;
  if ($data[0] == '#') $data = decodeURIComponent($data.slice(1));
  return pointer.get(this.data, $data);
}


/**
 * conditional evaluation
 * @this   Evaluation
 * @param  {Object} params instruction keywords ($if, $then, $else)
 * @return {Script|Any} script to be evaluated
 */
function eval$if(params) {
  var script = params.$if
              ? params.$then
              : typeof params.$else == 'undefined' ? null : params.$else;
  return isScript(script)
          ? new this.js.Script(script)
          : script;
}


/**
 * delayed evaluation
 * @this   Evaluation
 * @param  {Object} params instruction keywords ($delay, $wait)
 * @return {Script|Promise} script to be evaluated or asynchronous value
 */
function eval$delay(params) {
  var value = new Promise(function (resolve, reject) {
    setTimeout(function() {
      resolve(params.$delay);
    }, params.$wait);
  });
  return isScript(params.$delay)
          ? new this.js.Script(value)
          : value;
}


/**
 * Function definition
 * @this   Evaluation
 * @param  {Object} params instruction keywords ($func, $name, $args)
 * @return {Function} Function that returns synchronous/asynchronous value
 */
function eval$func(params) {
  var self = this;
  if (typeof params.$func == 'string') {
    if (Object.keys(params).length > 1)
      throw new Error('reference to function "' + params.$func + '" has other properties');
    return Promise.resolve(this.getFunc(params.$func));
  }

  var valid = this.js.validate(params.$func);
  var argNames, argValidate;
  if (valid) {
    if (params.$name) this.functions[params.$name] = func;
    if (params.$args) {
      argValidate = {};
      argNames = params.$args.map(function (arg) {
        if (typeof arg == 'string') return arg;
        var name = Object.keys(arg)[0];
        argValidate[name] = self.ajv.compile(arg[name]);
        return name;
      });
    }
    return Promise.resolve(func);
  }
  throw new this.ajv.ValidationError(this.js.validate.errors);

  function func() {
    var data = argNames ? prepareArguments(arguments) : self.data;
    var script = JSON.parse(JSON.stringify(params.$func));
    return self.js.evaluate(script, data);
  }

  function prepareArguments(args) {
    var data = {};
    for (var i=0; i<args.length; i++) {
      data[i] = args[i];
      var argName = argNames[i];
      if (argName) {
        data[argName] = args[i];
        var validate = argValidate[argName];
        if (validate && !validate(args[i]))
          throw new self.ajv.ValidationError(validate.errors);
      }
    }
    return data;
  }
}


/**
 * Function definition
 * @this   Evaluation
 * @param  {Object} params instruction keywords ($call, $args)
 * @return {any}    result of the function call
 */
function eval$call(params) {
  var func = typeof params.$call == 'string'
              ? this.getFunc(params.$call)
              : params.$call;
  // TODO params.$args is object
  return Promise.resolve(func.apply(null, params.$args));
}


function eval$quote(params) {
  return Promise.resolve(params.$quote);
}


function isScript(value) {
  return value && typeof value == 'object';
}
