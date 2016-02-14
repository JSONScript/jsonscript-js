'use strict';

module.exports = {
  callExec: callExec,
  getRef: getRef,
  getData: getData
};


function callExec(params) {
  var $exec = params.$exec;
  var $method = params.$method;
  var executor = this._executors[$exec];
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


function getData(params, script, data) {

}
