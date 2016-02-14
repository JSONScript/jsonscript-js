'use strict';

var assert = require('assert');

module.exports = {
  getPromise: getPromise,
  shouldBeError: shouldBeError
};


getPromise.callsResolutions = [];

function getPromise(value, delay) {
  return new Promise(function (resolve, reject) {
    setTimeout(function(){
      if (value instanceof Error) {
        getPromise.callsResolutions.push({ err: value });
        reject(value);
      } else {
        getPromise.callsResolutions.push({ res: value });
        resolve(value);
      }
    }, delay);
  });
}


function shouldBeError(p, message) {
  return p.then(
    function (res) { throw new Error('should have thrown error') },
    function (e) { assert.equal(e.message, message); }
  );
}
