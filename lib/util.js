'use strict';

var pointer = require('json-pointer');


module.exports = {
  copy: copy,
  objectToPromise: objectToPromise,
  promiseMapSerial: promiseMapSerial,
  isPromise: isPromise,
  toPromise: toPromise,
  toAbsolutePointer: toAbsolutePointer
};


function copy(o, to) {
  if (!o) return {};
  to = to || {};
  for (var key in o) to[key] = o[key];
  return to;
}


function objectToPromise(obj) {
  var promises = [];
  var results = {};
  for (var key in obj) {
    var value = obj[key];
    if (isPromise(value)) {
      results[key] = undefined;
      defer(value, key);
    } else {
      results[key] = value;
    }
  }

  return promises.length
          ? Promise.all(promises).then(function() { return results; })
          : Promise.resolve(obj);

  function defer(p, _key) {
    p = p.then(function (res) {
      results[_key] = res;
    });
    promises.push(p);
  }
}


function promiseMapSerial(arr, func, thisArg) {
  var results = Array(arr.length);
  var pos = 0;
  return map();

  function map() {
    var item = toPromise(arr[pos]);
    return item.then(function (itemRes) {
      return func.call(thisArg, itemRes, pos);
    })
    .then(function (value) {
      results[pos++] = value;
      return pos == arr.length ? results : map();
    });
  }
}


function isPromise(value) {
  return value && typeof value.then == 'function';
}


function toPromise(value) {
  return isPromise(value) ? value : Promise.resolve(value);
}


var RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
/**
 * converts relative JSON-pointer to an absolute JSON-pointer
 * @param  {String} relativePointer   relative JSON-pointer
 * @param  {Array<String>} basePointerParsed current base JSON-pointer parsed to segments and unescaped
 * @return {Array<String>} absolute JSON-pointer
 */
function toAbsolutePointer(relativePointer, basePointerParsed) {
  var base = basePointerParsed;
  var matches = relativePointer.match(RELATIVE_JSON_POINTER);
  if (!matches) return;
  var lvl = base.length;
  var up = +matches[1];
  var jsonPointer = matches[2];
  if (jsonPointer == '#') {
    if (up >= lvl) throw new Error('Cannot access property/index ' + up + ' levels up, current level is ' + lvl);
    return base[lvl-up-1]; // resolved pointer value
  }

  if (up > lvl) throw new Error('Cannot reference script ' + up + ' levels up, current level is ' + lvl);
  var parsedPointer = pointer.parse(jsonPointer);
  if (up > 0) base = base.slice(0, -up);
  return base.concat(parsedPointer); // parsed absolute pointer as array
}
