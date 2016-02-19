'use strict';

var JSONScript = require('../lib/jsonscript');
var assert = require('assert');
var testutil = require('./testutil');
var shouldBeError = testutil.shouldBeError;
var executors = require('./executors');


describe('$if instruction - conditional evaluation', function() {
  var js;

  before(function() {
    js = JSONScript();
    js.addExecutor('router1', executors.router1);
    js.addExecutor('router2', executors.router2);
    js.addExecutor('async', function (value) { return Promise.resolve(value); });
  });

  var data = {
    cond1: true,
    cond2: false,
    notBoolean: 1,
    then: 'foo',
    else: 'bar',
    thenRouter: 'router1',
    elseRouter: 'router2'
  };


  it('should allow for $if/$then/$else to be asynchronous', function() {
    return Promise.all([
      test({
        $if: { $exec: 'async', $args: true },
        $then: 'foo',
        $else: 'bar'
      }, 'foo'),
      test({
        $if: { $exec: 'async', $args: false },
        $then: 'foo',
        $else: 'bar'
      }, 'bar'),
      test({
        $if: { $exec: 'async', $args: false },
        $then: 'foo'
      }, null),
      test({
        $if: true,
        $then: { $exec: 'async', $args: 'foo' },
        $else: { $exec: 'async', $args: 'bar' }
      }, 'foo'),
      test({
        $if: false,
        $then: { $exec: 'async', $args: 'foo' },
        $else: { $exec: 'async', $args: 'bar' }
      }, 'bar'),
      test({
        $if: false,
        $then: { $exec: 'async', $args: 'foo' }
      }, null),
      test({
        $if: { $exec: 'async', $args: true },
        $then: { $exec: 'async', $args: 'foo' },
        $else: { $exec: 'async', $args: 'bar' }
      }, 'foo'),
      test({
        $if: { $exec: 'async', $args: false },
        $then: { $exec: 'async', $args: 'foo' },
        $else: { $exec: 'async', $args: 'bar' }
      }, 'bar'),
      test({
        $if: { $exec: 'async', $args: false },
        $then: { $exec: 'async', $args: 'foo' }
      }, null)
    ]);
  });


  it('should throw error if $if is not boolean', function() {
    return Promise.all([
      shouldBeError(js.evaluate({ $if: { $exec: 'async', $args: 1 }, $then: 'foo' }, data),
        'validation failed', ['should be boolean']),
      shouldBeError(js.evaluate({ $if: { $data: { $exec: 'async', $args: '/notBoolean' } }, $then: 'foo' }, data),
        'validation failed', ['should be boolean'])
    ]);
  });


  function test(script, expectedResult) {
    return js.evaluate(script, data).then(function (res) {
      assert.strictEqual(res, expectedResult);
      if (expectedResult) assert.deepEqual(res, expectedResult);
    });
  };
});