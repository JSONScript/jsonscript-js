'use strict';

var pointer = require('json-pointer');
var getJst = require('./get_jst');

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


function eval$ref(params, script, data) {

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
