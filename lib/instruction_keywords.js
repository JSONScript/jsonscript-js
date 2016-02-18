'use strict';

var pointer = require('json-pointer');
var getJst = require('./get_jst');

module.exports = {
  callExec: callExec,
  getRef: getRef,
  getData: getData
};


function callExec(params) {
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


function getRef(params, script, data) {

}


function getData(params) {
  var $data = params.$data;
  if ($data[0] == '#') $data = decodeURIComponent($data.slice(1));
  return pointer.get(this.data, $data);
}
