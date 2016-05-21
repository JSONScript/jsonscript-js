'use strict';


module.exports = {
  map: arrayMap,
  every: arrayEvery,
  some: arraySome,
  filter: arrayFilter
};


function arrayMap(args) {
  var result = Array.isArray(args)
                ? args[0].map(args[1])
                : args.data.map(args.iterator);
  return Promise.all(result);
}


function arrayEvery(args) {
  return arrayMap(args).then(function (items) {
    return items.every(function (item) {
      return item === true;
    });
  });
}


function arraySome(args) {
  return arrayMap(args).then(function (items) {
    return items.some(function (item) {
      return item === true;
    });
  });
}


function arrayFilter(args) {
  return arrayMap(args).then(function (items) {
    var data = Array.isArray(args) ? args[0] : args.data;
    return data.filter(function (val, i) {
      return items[i] === true;
    });
  });
}
