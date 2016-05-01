'use strict';

module.exports = Evaluation;


function Evaluation(js, script, data, refPrefix) {
  this.js = js;
  this.ajv = js.ajv;
  this.script = script;
  this.data = data;
  this.refPrefix = refPrefix;
  this.refPrefixRegexp = new RegExp('^' + refPrefix);
  this.evaluatedRefs = {};
  this.pendingRefs = {};
  this.functions = {};
}


Evaluation.prototype.getFunc = getFunc;


/**
 * retrieves previously defined script function by name
 * @this   Evaluation
 * @param  {String} name function name
 * @return {Function} function
 */
function getFunc(name) {
  var func = this.functions[name];
  if (func) return func;
  throw new Error('unknown function "' + name + '"');
}
