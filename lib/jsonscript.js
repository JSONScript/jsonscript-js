'use strict';

var util = require('./util');
var Ajv = require('ajv');
var Evaluation = require('./evaluation');
var generateSchema = require('./generate_schema');
var instructions = require('jsonscript/instructions');
var evaluationKeywords = require('./evaluation_keywords');
var instructionKeywords = require('./instruction_keywords');

module.exports = JSONScript;


function JSONScript(opts) {
  if (!(this instanceof JSONScript)) return new JSONScript(opts);
  this._opts = util.copy(opts);
  this._instructions = [];
  this._evalKeywords = {};
  this._executors = util.copy(this._opts.executors);
  this._util = util;
  this.ajv = Ajv({ passContext: true, v5: true });
  this.Script = Script;
  addAjvKeywords.call(this);
  addCoreInstructions.call(this);
}


JSONScript.prototype.validate = validateScript;
JSONScript.prototype.evaluate = evaluateScript;
JSONScript.prototype.addInstruction = addInstruction;
JSONScript.prototype.addExecutor = addExecutor;


function validateScript(script) {
  var valid = this._validate(script);
  validateScript.errors = this._validate.errors;
  return valid;
}


function evaluateScript(script, data) {
  var wrapped = { script: script };
  var valid;
  try {
    valid = this._evaluate.call(new Evaluation(this, data), wrapped);
  } catch(e) {
    return Promise.reject(e);
  }
  if (!valid) return Promise.reject(new Ajv.ValidationError(this._evaluate.errors));
  script = wrapped.script;
  if (script && typeof script.then == 'function') return script;
  return Promise.resolve(script);
}


function addInstruction(definition, keywordFunc, regenerateSchemas) {
  var valid = this._validateInstruction(definition);
  if (!valid) throw new Ajv.ValidationError(this._validateInstruction.errors);
  // TODO check instruction is unique
  this._instructions.push(definition);
  var keyword = definition.evaluate.validatorKeyword;
  this._evalKeywords[keyword] = keywordFunc;
  addAjvKeyword.call(this, keyword, 'object', true);
  if (regenerateSchemas !== false) generateSchemas();
}


function addExecutor(name, executor) {
  // TODO check duplicates, show warnings
  // ? TODO whitelist methods?
  this._executors[name] = executor;
}


function addAjvKeywords() {
  var self = this;
  addAjvKeyword.call(this, 'validateAsync', undefined);
  addAjvKeyword.call(this, 'itemsSerial', 'array');
  this._evalKeywords.objectToAsync = util.objectToPromise;
  addAjvKeyword.call(this, 'objectToAsync', 'object', true);
}


function addAjvKeyword(keyword, types, inlineInstruction) {
  var inlineFunc = evaluationKeywords[inlineInstruction ? 'inlineInstruction' : keyword];
  this.ajv.addKeyword(keyword, {
    type: types,
    inline: inlineFunc,
    statements: true,
    errors: 'full'
  });
} 


function addCoreInstructions() {
  this._validateInstruction = this.ajv.compile(require('jsonscript/schema/instruction.json'));
  instructions.forEach(function (inst) {
    this.addInstruction(inst, instructionKeywords[inst.evaluate.validatorKeyword], false);
  }, this);
  generateSchemas.call(this);
}


function generateSchemas() {
  this.ajv.addMetaSchema(_generate.call(this, 'evaluate_metaschema'));
  this._validate = this.ajv.compile(_generate.call(this, 'schema'));
  this._evaluate = this.ajv.compile(_generate.call(this, 'evaluate'));
  console.log(this._validate.toString().length, this._evaluate.toString().length);
}


function _generate(schemaName) {
  var schema = generateSchema(schemaName, this._instructions);
  this.ajv.removeSchema(schema.id);
  return schema;
}


function Script(script) {
  this.script = script;
}
