'use strict';

var pointer = require('json-pointer');

module.exports = {
  eval$exec: eval$exec,
  eval$ref: eval$ref,
  eval$data: eval$data,
  eval$if: eval$if,
  eval$delay: eval$delay
};


function eval$exec(params) {
  var $exec = params.$exec;
  var $method = params.$method;
  var executor = this.js._executors[$exec];
  if (!executor) throw new Error('unknown executor ' + $exec);
  if ($method) {
    if (typeof executor[$method] != 'function')
      throw new Error('unknown method ' + $method + ' of executor ' + $exec);
    return executor[$method](params.$args);
  } else {
    if (typeof executor != 'function')
      throw new Error('executor ' + $exec + ' is not a function');
    return executor(params.$args);
  }
}


function eval$ref(params, dataPath) {
  var $ref = params.$ref;
  var dataPathParsed = pointer.parse(dataPath);

  var dataPathParsed;
  var matches = $ref.match(RELATIVE_JSON_POINTER);
  if (matches) {
    var up = +matches[1];
    var jsonPointer = matches[2];
    dataPathParsed = pointer.parse(dataPath);
    if (jsonPointer == '#') {
      var lvl = dataPathParsed.length;
      if (up >= lvl) throw new Error('Cannot access property/index ' + up + ' levels up, current level is ' + lvl);
      return dataPathParsed[lvl - up];
    } else if (up == 0) {
      throw new Error('$ref ' + $ref + ' cannot be resolved (inside current script ' + dataPath + ')')
    } else {
      refParsed = pointer.parse(jsonPointer);
      refParsed = dataPathParsed.slice(0, -up).concat(refParsed);
    }
  }

  $ref = convertToAbsolute($ref); // todo resolve "N#" refs

  if ($ref.length >= dataPath.length && $ref.indexOf(dataPath) == 0)
    throw new Error('$ref ' + $ref + ' cannot be resolved (inside current script ' + dataPath + ')')

  var ref = 
  if ()
  var dataPathParsed = pointer.parse(dataPath);
}


function eval$data(params) {
  var $data = params.$data;
  if ($data[0] == '#') $data = decodeURIComponent($data.slice(1));
  return pointer.get(this.data, $data);
}


function eval$if(params) {
  var script = params.$if
              ? params.$then
              : typeof params.$else == 'undefined' ? null : params.$else;
  return isScript(script)
          ? new this.js.Script(script)
          : script;
}


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


function isScript(value) {
  return value && typeof value == 'object'
}
