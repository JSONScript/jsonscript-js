'use strict';

var pointer = require('json-pointer');


module.exports = {
  copy: copy,
  objectToPromise: objectToPromise,
  promiseMapSerial: promiseMapSerial,
  toAbsolutePointer: toAbsolutePointer
};


function copy(o, to) {
  if (!o) return {};
  to = to || {};
  for (var key in o) to[key] = o[key];
  return to;
}


function objectToPromise(obj) {
  var isPromise, promises;
  for (var key in obj) {
    var value = obj[key];
    if (value && typeof value.then == 'function')
      defer(value, key);
  }
  if (!promises) return obj;
  var results = {};
  for (var key in obj)
    results[key] = isPromise[key] ? undefined : obj[key];

  if (promises.length == 1) return promises[0];
  return Promise.all(promises).then(function() { return results; });

  function defer(p, key) {
    isPromise = isPromise || {};
    isPromise[key] = true;
    p = p.then(function (res) {
      results[key] = res;
      return results;
    });
    if (!promises) promises = [p];
    else promises.push(p);
  }
}


function promiseMapSerial(arr, func, thisArg) {
  var results = Array(arr.length);
  var start = 0;
  return map();

  function map() {
    for (var i=start; i<arr.length; i++) {
      var item = arr[i];
      if (item && typeof item.then == 'function') {
        return item.then(function (itemRes) {
          var value = func.call(thisArg, itemRes, i);
          if (value && typeof value.then == 'function')
            return value.then(mapRest(i));
          else
            return mapRest(i)(value);
        });
      } else {
        var value = func.call(thisArg, item, i);
        if (value && typeof value.then == 'function')
          return value.then(mapRest(i));
        else
          results[i] = value;
      }
    }
    return results;
  }

  function mapRest(i) {
    return function (res) {
      results[i] = res;
      start = i+1;
      return start == arr.length ? results : map();
    };
  }
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
  var up = +matches[1];
  var jsonPointer = matches[2];
  if (jsonPointer == '#') {
    var lvl = base.length;
    if (up >= lvl) throw new Error('Cannot access property/index ' + up + ' levels up, current level is ' + lvl);
    return base[lvl - up]; // resolved pointer value
  } else {
    var parsedPointer = pointer.parse(jsonPointer);
    if (up > 0) base = base.slice(0, -up);
    return base.concat(parsedPointer); // parsed absolute pointer as array
  }
}
