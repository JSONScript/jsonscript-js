'use strict';

module.exports = {
  getNum: getArg('number'),
  getStr: getArg('string'),
  getBool: getArg('boolean')
};


function getArg(argType) {
  return function(args, i, opName) {
    var arg = args[i];
    if (typeof arg != argType)
      throw new Error('operation ' + opName + ' expects ' + argType + 's');
    return arg;
  };
}
