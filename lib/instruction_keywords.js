'use strict';

var pointer = require('json-pointer');
var util = require('./util');
var PendingRef = require('./pending');

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
  dataPath = dataPath.replace(this.refPrefixRegexp, '');
  var $ref = params.$ref;
  if ($ref.indexOf('0/') == 0) throw new Error('Cannot reference the same $ref instruction or child');

  var pathParsed = pointer.parse(dataPath)
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

  if (this.evaluatedRefs[rootPointer]) {
    return getRefValue(this.script, rootPointer, pointerFromRoot);
  } else {
    var self = this;
    var pendingRef = self.pendingRefs[rootPointer]
      = self.pendingRefs[rootPointer] || new PendingRef(rootPointer);
    return new Promise(function (resolve, reject) {
      pendingRef.addCallback(function () {
        resolve(getRefValue(self.script, rootPointer, pointerFromRoot));
      });
    });
  }
}


function getRefValue(obj, rootPointer, pointerFromRoot) {
  var root = pointer.get(obj, rootPointer);
  if (root && typeof root.then == 'function') {
    return root.then(function(rootValue) {
      return pointer.get(rootValue, pointerFromRoot);
    });
  } else {
    return pointer.get(root, pointerFromRoot);
  }
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
