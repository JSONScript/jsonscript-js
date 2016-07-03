'use strict';

var jsonScriptTest = require('jsonscript-test');
var JSONScript = require('../lib/jsonscript');
var executors = require('./executors');
var Ajv = require('ajv');
var assert = require('assert');

var instances = [
  new JSONScript({ executors: executors }),
  new JSONScript({ executors: executors, strict: true }) ];


jsonScriptTest(instances, {
  // only: ['$delay'],
  description: 'JSONScript evaluation tests',
  suites: {
    'JSONScript test suite': '../node_modules/jsonscript-test-suite/tests/{**/,}*.json',
    'Additional tests': './tests/{**/,}*.json'
  },
  afterEach: assertValidationErrors,
  cwd: __dirname
});


function assertValidationErrors(res) {
  if (res.passed && res.test.error && res.test.validationErrors) {
    var e = res.error;
    assert(e instanceof Ajv.ValidationError);
    var errors = e.errors.map(function(err) { return err.message; });
    assert.deepEqual(errors, res.test.validationErrors);
  }
}
