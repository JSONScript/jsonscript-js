'use strict';

var jsonScriptTest = require('jsonscript-test');
var JSONScript = require('../lib/jsonscript');
var executors = require('./executors');
var Ajv = require('ajv');
var assert = require('assert');

var instances = [ new JSONScript, new JSONScript({ strict: true }) ];

instances.forEach(function (js) {
  js.addExecutor('func1', executors.func1);
  js.addExecutor('router1', executors.router1);
  js.addExecutor('router2', executors.router2);
});


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
