'use strict';


module.exports = {
  map: arrayMap,
  every: arrayMethod('every'),
  some: arrayMethod('some'),
  filter: arrayFilter
};


function arrayMap(args) {
  var result = Array.isArray(args)
                ? args[0].map(args[1])
                : args.data.map(args.iterator);
  return Promise.all(result);
}


function arrayMethod(method) {
  return function (args) {
    return arrayMap(args).then(function (items) {
      return items[method](function (item) {
        return item === true;
      });
    });
  };
}


function arrayFilter(args) {
  return arrayMap(args).then(function (items) {
    var data = Array.isArray(args) ? args[0] : args.data;
    return data.filter(function (val, i) {
      return items[i] === true;
    });
  });
}
