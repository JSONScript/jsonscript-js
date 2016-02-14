'use strict';

var fs = require('fs');
var doT = require('dot');

var templates = {};


module.exports = function generateSchema(schemaName, instructions) {
  var template = getSchemaTemplate(schemaName);
  var schemaStr = template({ instructions: instructions });
  return JSON.parse(schemaStr);
}


function getSchemaTemplate(schemaName) {
  var tmpl = templates[schemaName];
  if (tmpl) return tmpl;
  var fileName = __dirname + '/../node_modules/jsonscript/schema/' + schemaName + '.json.dot';
  var templateStr = fs.readFileSync(fileName, 'utf8');
  tmpl = templates[schemaName] = doT.compile(templateStr);
  return tmpl;
}
