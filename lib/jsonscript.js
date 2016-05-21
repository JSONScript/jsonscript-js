'use strict';

var util = require('./util');
var Ajv = require('ajv');
var Evaluation = require('./evaluation');
var generateSchema = require('./generate_schema');
var coreInstructions = require('jsonscript/instructions');
var coreMacros = require('jsonscript/macros');
var evaluationKeywords = require('./evaluation_keywords');
var instructionKeywords = require('./instruction_keywords');
var coreExecutors = require('./executors');
var compileExpandJsMacro = require('./expand_macro');

module.exports = JSONScript;


function JSONScript(opts) {
  if (!(this instanceof JSONScript)) return new JSONScript(opts);
  this._opts = util.copy(opts);
  this._instructions = [];
  this._macros = [];
  this._evalKeywords = {};
  // TODO use addExecutor method
  this._executors = util.copy(this._opts.executors);
  this._util = util;
  this.ajv = Ajv({ v5: true, jsonPointers: true, passContext: true });
  this.Script = Script;

  addAjvKeywords.call(this);
  addCoreInstructions.call(this);
  addCoreExecutors.call(this);
  addCoreMacros.call(this);
  generateSchemas.call(this);
}


JSONScript.prototype.validate = validateScript;
JSONScript.prototype.expandMacros = expandMacros;
JSONScript.prototype.evaluate = evaluateScript;
JSONScript.prototype.addInstruction = addInstruction;
JSONScript.prototype.addExecutor = addExecutor;
JSONScript.prototype.addMacro = addMacro;


/**
 * validates script
 * @this   JSONScript
 * @param  {Any} script script can be any allowed value
 * @return {Boolean} validation result
 */
function validateScript(script) {
  var valid = this._validate(script);
  validateScript.errors = this._validate.errors;
  return valid;
}


/**
 * expands macros in the script
 * @this   JSONScript
 * @param  {Any} script any JSONScript script with macros
 * @param  {Any} data   data instance that can be referenced from the script
 * @return {Any} evaluation result
 */
function expandMacros(script) {
  var valid = this._expandMacros(script);
  return valid;
}


/**
 * evaluates script
 * @this   JSONScript
 * @param  {Any} script any valid script
 * @param  {Any} data   data instance that can be referenced from the script
 * @param  {Boolean} shouldExpandMacros true by default, pass false to skip macro expansion
 * @return {Any} evaluation result
 */
function evaluateScript(script, data, shouldExpandMacros) {
  if (shouldExpandMacros !== false)
    this.expandMacros(script);
  var wrapped = { script: script };
  var valid;
  try {
    valid = this._evaluate.call(new Evaluation(this, script, data, '/script'), wrapped);
  } catch(e) {
    return Promise.reject(e);
  }
  if (!valid) return Promise.reject(new Ajv.ValidationError(this._evaluate.errors));
  script = wrapped.script;
  if (script && typeof script.then == 'function') return script;
  return Promise.resolve(script);
}


/**
 * add JSONScript instruction to the interpreter
 * @this  JSONScript
 * @param {Object}   definition         instruction definition, should be valid according to the schema http://www.json-script.com/schema/instruction.json#
 * @param {Function} keywordFunc        function to implement the instruction, accepts instruction object and dataPath as parameter, should return sync/async value or Script instance
 * @param {Boolean}  _regenerateSchemas pass false to prevent regenerating the schemas, can be used when multiple instructions are added
 */
function addInstruction(definition, keywordFunc, _regenerateSchemas) {
  var valid = this._validateInstruction(definition);
  if (!valid) throw new Ajv.ValidationError(this._validateInstruction.errors);
  // TODO check instruction is unique
  this._instructions.push(definition);
  var keyword = definition.evaluate.validatorKeyword;
  this._evalKeywords[keyword] = keywordFunc;
  addAjvKeyword.call(this, keyword, 'object', true);
  if (_regenerateSchemas !== false) generateSchemas();
}


/**
 * add JSONScript macro to the interpreter
 * @this  JSONScript
 * @param {Object}   definition         macro definition, should be valid according to the schema http://www.json-script.com/schema/macro.json#
 * @param {Boolean}  _regenerateSchemas pass false to prevent regenerating the schemas, can be used when multiple macros are added
 */
function addMacro(definition, _regenerateSchemas) {
  var valid = this._validateMacro(definition);
  if (!valid) {
    console.log('*****', definition, this._validateMacro.errors);
    throw new Ajv.ValidationError(this._validateMacro.errors);
  }
  // TODO check macro is unique
  this._macros.push(definition);
  if (_regenerateSchemas !== false) generateSchemas();
}


/**
 * add external executor to JSONScript interpreter
 * @this  JSONScript
 * @param {String}          name     executor name to use in $exec keyword
 * @param {Object|Function} executor executor object or function
 */
function addExecutor(name, executor) {
  // TODO check duplicates, show warnings
  // ? TODO whitelist methods?
  this._executors[name] = executor;
}


/**
 * private function to add Ajv keywords that are used in the schema that evaluates scripts
 * @this JSONScript
 */
function addAjvKeywords() {
  addAjvKeyword.call(this, 'validateAsync');
  addAjvKeyword.call(this, 'itemsSerial', 'array');
  this._evalKeywords.objectToAsync = util.objectToPromise;
  this._evalKeywords.valueToAsync = util.toPromise;
  addAjvKeyword.call(this, 'objectToAsync', 'object', true);
  addAjvKeyword.call(this, 'valueToAsync', undefined, true);
  this.ajv.addKeyword('resolvePendingRefs', {
    validate: evaluationKeywords.resolvePendingRefs,
    schema: false
  });
  this.ajv.addKeyword('expandJsMacro', {
    compile: compileExpandJsMacro
  });
}


/**
 * private function to add Ajv keyword that is used for instruction/script evaluation
 * @this  JSONScript
 * @param {String}               keyword           custom validation keyword
 * @param {String|Array<String>} types             type(s) that the keyword applies for
 * @param {Boolean}              inlineInstruction true to use evaluationKeywords.inlineInstruction as keyword function, otherwise evaluationKeywords[keyword] is used
 */
function addAjvKeyword(keyword, types, inlineInstruction) {
  var inlineFunc = evaluationKeywords[inlineInstruction ? 'inlineInstruction' : keyword];
  this.ajv.addKeyword(keyword, {
    type: types,
    inline: inlineFunc,
    statements: true,
    errors: 'full'
  });
}


/**
 * private function to add all standard JSONScript instructions to the interpreter
 * @this JSONScript
 */
function addCoreInstructions() {
  this._validateInstruction = this.ajv.compile(require('jsonscript/schema/instruction.json'));
  coreInstructions.forEach(function (inst) {
    this.addInstruction(inst, instructionKeywords[inst.evaluate.validatorKeyword], false);
  }, this);
}


/**
 * private function to add pre-defined executors
 * @this JSONScript
 */
function addCoreExecutors() {
  for (var name in coreExecutors)
    this.addExecutor(name, coreExecutors[name]);
}


/**
 * private function to add all core JSONScript macros to the interpreter
 * @this JSONScript
 */
function addCoreMacros() {
  this._validateMacro = this.ajv.compile(require('jsonscript/schema/macro.json'));
  coreMacros.forEach(function (macro) {
    this.addMacro(macro, false);
  }, this);
}


/**
 * private function to regenerate validation and evaluation schemas, called when an instruction is added
 * @this JSONScript
 */
function generateSchemas() {
  // this.ajv.addMetaSchema(_generate.call(this, 'evaluate_metaschema'));
  this._validate = this.ajv.compile(_generate.call(this, 'schema'));
  this._expandMacros = this.ajv.compile(_generate.call(this, 'expand_macros'));
  this._evaluate = this.ajv.compile(_generate.call(this, 'evaluate'));
  // console.log(this._validate.toString().length, this._evaluate.toString().length);
}


/**
 * private function to generate one of schemas used by the interpreter
 * @this JSONScript
 * @param  {String} schemaName schema name
 * @return {Object} generated schema object
 */
function _generate(schemaName) {
  var schema = generateSchema(schemaName, this._instructions, this._macros, this._opts.strict);
  this.ajv.removeSchema(schema.id);
  return schema;
}


/**
 * Constructor for Script object. Instructions can return the instance (as "new this.js.Script(script)") if the returned value is a script that should be evaluated
 * @param {Any} script any valid script
 */
function Script(script) {
  this.script = script;
}
