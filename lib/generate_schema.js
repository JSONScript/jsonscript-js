'use strict';

var fs = require('fs');
var doT = require('dot');
var path = require('path');

var templates = {};


module.exports = function generateSchema(schemaName, instructions, strict) {
  var template = getSchemaTemplate(schemaName);
  var schemaStr = template({ instructions: instructions, strict: strict });
  return JSON.parse(schemaStr);
};


function getSchemaTemplate(schemaName) {
  var tmpl = templates[schemaName];
  if (tmpl) return tmpl;
  var fileName = path.join(__dirname, '..', 'node_modules', 'jsonscript', 'schema',  schemaName + '.json.dot');
  var templateStr = fs.readFileSync(fileName, 'utf8');
  tmpl = templates[schemaName] = doT.compile(templateStr);
  return tmpl;
}
