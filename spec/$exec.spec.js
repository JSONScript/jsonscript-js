'use strict';

var JSONScript = require('../lib/jsonscript');
var assert = require('assert');
var testutil = require('./testutil');
var shouldBeError = testutil.shouldBeError;
var routers = require('./routers');


describe('$exec instruction - call to external executor', function() {
  var js;

  before(function() {
    js = JSONScript();
    js.addExecutor('router1', routers.router1);
    js.addExecutor('router2', routers.router2);
  });


  it('should evaluate $exec script', function() {
    var script = {
      $exec: 'router1',
      $args: { path: '/resource' }
    };

    return js.evaluate(script).then(function (res) {
      assert.equal(res, 'you requested /resource from router1');
    });
  });

  it('should throw if executor is unknown', function() {
    var script = {
      $exec: 'router_unknown',
      $args: { path: '/resource' }
    };

    return shouldBeError(js.evaluate(script), 'unknown executor router_unknown');
  });

  it('should throw if executor is not a function and no $method is speciafied', function() {
    var script = {
      $exec: 'router2',
      $args: { path: '/resource' }
    };

    return shouldBeError(js.evaluate(script), 'executor router2 is not a function');
  });

  it('should throw error if executor has no $method', function() {
    var script = {
      $exec: 'router1',
      $method: 'put',
      $args: { path: '/resource', body: { test: 'test' } }
    };

    return shouldBeError(js.evaluate(script), 'unknown method put of executor router1');
  });

  it('should be able to use another instruction as part of arguments', function() {
    var script = {
      $exec: 'router1',
      $method: 'post',
      $args: { path: '/resource', body: { $data: '/object' } }
    };

    var data = {
      object: { test: 'test' }
    };

    return js.evaluate(script, data).then(function (res) {
      assert.equal(res, 'you posted {"test":"test"} to /resource at router1');
    });
  });

  it('should be able to use another scripts as the value of any keyword', function() {
    var script = {
      $exec: { $data: '/router' },
      $method: { $data: '/method' },
      $args: { $data: '/args' }
    };

    var data = {
      router: 'router1',
      method: 'post',
      args: { path: '/resource', body: { test: 'test' } }
    };

    return js.evaluate(script, data).then(function (res) {
      assert.equal(res, 'you posted {"test":"test"} to /resource at router1');
    });
  });
});
