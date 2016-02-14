'use strict';

var JSONScript = require('../lib/jsonscript');
var assert = require('assert');
var Ajv = require('ajv');
var getPromise = require('./testutil').getPromise;


describe('script evaluation', function() {
  var js, callsResolutions;

  before(function() {
    js = JSONScript();
    js.addExecutor('router', router);
  });

  beforeEach(function(){
    callsResolutions = getPromise.callsResolutions = [];
  });

  function router(args) {
    return router.get(args);
  }

  router.get = function(args) {
    var path = args.path;
    callsResolutions.push({ call: 'get: ' + path });
    var result = path
                  ? 'you requested ' + path
                  : new Error('path not specified');
    return getPromise(result, 10);
  }

  router.post = function(args) {
    var path = args.path;
    var body = args.body;
    callsResolutions.push({ call: 'post: ' + path });
    var result = path && body
                  ? 'you posted ' + JSON.stringify(body) + ' to ' + path
                  : new Error('path or body not specified');
    return getPromise(result, 10);
  }


  it('should evaluate router.get script', function() {
    var script = {
      $exec: 'router',
      $args: { path: '/resource' }
    };

    return js.evaluate(script).then(function (res) {
      assert.equal(res, 'you requested /resource');
    });
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
