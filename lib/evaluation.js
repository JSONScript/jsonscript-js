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
