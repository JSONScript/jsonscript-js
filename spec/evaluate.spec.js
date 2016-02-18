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
    js.addExecutor('router1', routers.router1);
  });

  beforeEach(function(){
    callsResolutions = getPromise.callsResolutions = [];
  });


  it('should evaluate parallel execution', function() {
    var script = {
      a: {
        $exec: 'router1',
        $args: { path: '/resource' }
      },
      b: {
        $exec: 'router1',
        $method: 'post',
        $args: { path: '/resource', body: { test: 'test' } }
      }
    };

    return js.evaluate(script).then(function (res) {
      assert.deepEqual(res, {
        a: 'you requested /resource from router1',
        b: 'you posted {"test":"test"} to /resource at router1'
      });

      assert.deepEqual(callsResolutions, [
        { call: 'get: /resource' },
        { call: 'post: /resource' },
        { res: 'you requested /resource from router1' },
        { res: 'you posted {"test":"test"} to /resource at router1' }
      ]);
    });
  });

  it('should evaluate sequential execution', function() {
    var script = [
      {
        $exec: 'router1',
        $args: { path: '/resource' }
      },
      {
        $exec: 'router1',
        $method: 'post',
        $args: { path: '/resource', body: { test: 'test' } }
      }
    ];

    return js.evaluate(script).then(function (res) {
      assert.deepEqual(res, [
        'you requested /resource from router1',
        'you posted {"test":"test"} to /resource at router1'
      ]);

      assert.deepEqual(callsResolutions, [
        { call: 'get: /resource' },
        { res: 'you requested /resource from router1' },
        { call: 'post: /resource' },
        { res: 'you posted {"test":"test"} to /resource at router1' }
      ]);
    });
  });  
});
