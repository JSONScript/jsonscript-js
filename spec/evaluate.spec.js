'use strict';

var JSONScript = require('../lib/jsonscript');
var assert = require('assert');
var testutil = require('./testutil');
var getPromise = testutil.getPromise;
var shouldBeError = testutil.shouldBeError;
var routers = require('./routers');


describe('script evaluation', function() {
  var js, callsResolutions;

  before(function() {
    js = JSONScript();
    js.addExecutor('router', routers.router1);
  });

  beforeEach(function(){
    callsResolutions = getPromise.callsResolutions = [];
  });


  it('should evaluate parallel execution', function() {
    var script = {
      a: {
        $exec: 'router',
        $args: { path: '/resource' }
      },
      b: {
        $exec: 'router',
        $method: 'post',
        $args: { path: '/resource', body: { test: 'test' } }
      }
    };

    return js.evaluate(script).then(function (res) {
      assert.deepEqual(res, {
        a: 'you requested /resource',
        b: 'you posted {"test":"test"} to /resource'
      });

      assert.deepEqual(callsResolutions, [
        { call: 'get: /resource' },
        { call: 'post: /resource' },
        { res: 'you requested /resource' },
        { res: 'you posted {"test":"test"} to /resource' }
      ]);
    });
  });

  it('should evaluate sequential execution', function() {
    var script = [
      {
        $exec: 'router',
        $args: { path: '/resource' }
      },
      {
        $exec: 'router',
        $method: 'post',
        $args: { path: '/resource', body: { test: 'test' } }
      }
    ];

    return js.evaluate(script).then(function (res) {
      assert.deepEqual(res, [
        'you requested /resource',
        'you posted {"test":"test"} to /resource'
      ]);

      assert.deepEqual(callsResolutions, [
        { call: 'get: /resource' },
        { res: 'you requested /resource' },
        { call: 'post: /resource' },
        { res: 'you posted {"test":"test"} to /resource' }
      ]);
    });
  });  
});
