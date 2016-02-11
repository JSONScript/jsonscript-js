'use strict';


var util = require('./util');
var Ajv = require('./ajv')
var validateFunc, evaluateFunc;
var ajv = getValidator();


module.exports = JSONScript;


function JSONScript(opts) {
  if (!(this instanceof JSONScript)) return new JSONScript(opts);
  this._opts = opts ? util.copy(opts) : {};
  this._functions = {};
  this._objects = {};
}


util.copy({
  validate: validateScript,
  evaluate: evaluateScript,
  addFunction: addFunction,
  addObject: addObject
}, JSONScript.prototype);


function getValidator() {
  var ajv = Ajv({ allErrors: true, v5: true });
  // ajv.addKeyword();
  validateFunc = ajv.compile(require('jsonscript/schema/schema'));
  ajv.addMetaSchema(require('jsonscript/schema/evaluate_metaschema'));
  evaluateFunc = ajv.compile(require('jsonscript/schema/evaluate'));
  return ajv;
}


function validateScript(script) {
  var valid = validateFunc(script);
  return { valid: valid, errors: validateFunc.errors };
}


function evaluateScript(script) {

}


function addFunction(name, definition) {

}


function addObject(name, definition) {

}
