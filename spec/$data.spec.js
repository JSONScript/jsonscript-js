'use strict';

var JSONScript = require('../lib/jsonscript');
var assert = require('assert');
var testutil = require('./testutil');
var shouldBeError = testutil.shouldBeError;
var routers = require('./routers');


describe('$data instruction - access data passed to the script', function() {
  var js;

  before(function() {
    js = JSONScript();
    js.addExecutor('router', routers.router1);
  });

  var data = {
    '': 'abc',
    foo: 1,
    '~bar': {
      '/baz': 2,
      '%quux': 3
    }
  };

  it('should return part of data by reference/JSON-pointer from data object passed to script evaluation', function() {
    return Promise.all([
      test({ $data: '' }, data),
      test({ $data: '/' }, data['']),
      test({ $data: '/foo' }, data.foo),
      test({ $data: '/~0bar' }, data['~bar']),
      test({ $data: '/~0bar/~1baz' }, data['~bar']['/baz']),
      test({ $data: '/~0bar/%quux' }, data['~bar']['%quux']),
      test({ $data: '#' }, data),
      test({ $data: '#/' }, data['']),
      test({ $data: '#/foo' }, data.foo),
      test({ $data: '#/~0bar' }, data['~bar']),
      test({ $data: '#/~0bar/~1baz' }, data['~bar']['/baz']),
      test({ $data: '#/~0bar/%25quux' }, data['~bar']['%quux'])
    ]);

    function test(script, expectedResult) {
      return js.evaluate(script, data).then(function (res) {
        assert.strictEqual(res, expectedResult);
        assert.deepEqual(res, expectedResult);
      });
    };
  });

  it('should throw error if invalid JSON pointer is used', function() {
    return shouldBeError(js.evaluate({ $data: 'foo' }, data),
      'validation failed', ['should match format "json-pointer"']);
  });

  it('should throw error if path does not exist in data', function() {
    return Promise.all([
      shouldBeError(js.evaluate({ $data: '/abc' }, data), 'Invalid reference token: abc'),
      shouldBeError(js.evaluate({ $data: '/foo/bar' }, data), 'Invalid reference token: bar')
    ]);
  });

  it('should correctly resolve $data if JSON pointer is another $data instruction', function() {
    var data = {
      foo: 'bar',
      pointer: '/foo'
    };

    var script = { $data: { $data: '/pointer' } };

    return js.evaluate(script, data).then(function (res) {
      assert.equal(res, 'bar');
    });
  });
});
