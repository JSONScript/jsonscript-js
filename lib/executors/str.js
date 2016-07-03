'use strict';

var getStr = require('./util').getStr;


module.exports = {
  concat: strConcat,
  slice: strSlice,
  pos: strPos,
  lower: strLower,
  upper: strUpper
};


function strConcat(args) {
  var result = '';
  for (var i=0; i<args.length; i++)
    result += getStr(args, i, 'concat');
  return result;
}


function strSlice(args) {
  var str = getStr(args, 0, 'slice');
  var begin = args[1];
  var end = args[2];
  if (typeof begin != 'number' || (typeof end != 'number' && typeof end != 'undefined'))
    throw new Error('operation slice expects numbers for the begin and end indices');
  return str.slice(begin, end);
}


function strPos(args) {
  var str = getStr(args, 0, 'pos');
  var substr = getStr(args, 1, 'pos');
  return str.indexOf(substr);
}


function strLower(arg) {
  if (typeof arg != 'string')
    throw new Error('operation lower expects string');
  return arg.toLowerCase();
}


function strUpper(arg) {
  if (typeof arg != 'string')
    throw new Error('operation upper expects string');
  return arg.toUpperCase();
}
