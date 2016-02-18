'use strict';

var fs = require('fs');
var doT = require('dot');
var definitions = getFile('definitions.def');


module.exports = function getJst(fileName) {
  var jst = getFile(fileName + '.jst');
  return doT.compile(jst, { definitions: definitions });
}


function getFile(fileNameExt) {
  fileNameExt = __dirname + '/jst/' + fileNameExt;
  return fs.readFileSync(fileNameExt, 'utf8');
}