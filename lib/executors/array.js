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
  var result = Array.isArray(args)
                ? args[0].map(args[1])
                : args.data.map(args.iterator);
  return Promise.all(result).then(function (items) {
    return items.every(function (item) {
      return item === true;
    });
  });
}


function arraySome(args) {
  var result = Array.isArray(args)
                ? args[0].map(args[1])
                : args.data.map(args.iterator);
  return Promise.all(result).then(function (items) {
    return items.some(function (item) {
      return item === true;
    });
  });
}


function arrayFilter(args) {
  var data, iterator;
  if (Array.isArray(args)) {
    data = args[0];
    iterator = args[1];
  } else {
    data = args.data;
    iterator = args.iterator;
  }
  var result = data.map(iterator);
  return Promise.all(result).then(function (items) {
    return data.filter(function (val, i) {
      return items[i] === true;
    });
  });
}
