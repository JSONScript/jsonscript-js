'use strict';

module.exports = {
  getPromise: getPromise
};


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


getPromise.callsResolutions = [];
