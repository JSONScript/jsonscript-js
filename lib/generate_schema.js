'use strict';

var fs = require('fs');
var doT = require('dot');
var path = require('path');

var templates = {};


module.exports = function generateSchema(schemaName, instructions, macros, strict) {
  var template = getSchemaTemplate(schemaName);
  var schemaStr = template({ instructions: instructions, macros: macros, strict: strict });
  return JSON.parse(schemaStr);
};


function getSchemaTemplate(schemaName) {
  var tmpl = templates[schemaName];
  if (tmpl) return tmpl;
  var moduleDir = path.dirname(require.resolve('jsonscript'));
  var fileName = path.join(moduleDir, 'schema',  schemaName + '.json.dot');
  var templateStr = fs.readFileSync(fileName, 'utf8');
  tmpl = templates[schemaName] = doT.compile(templateStr);
  return tmpl;
}
