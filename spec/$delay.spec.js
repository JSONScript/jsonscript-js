'use strict';

var JSONScript = require('../lib/jsonscript');
var assert = require('assert');
var testutil = require('./testutil');
var getPromise = testutil.getPromise;
var shouldBeError = testutil.shouldBeError;
var executors = require('./executors');


describe('$delay instruction - delayed evaluation', function() {
  var js, callsResolutions;

  before(function() {
    js = JSONScript();
    js.addExecutor('router1', executors.router1);
  });

  beforeEach(function() {
    callsResolutions = getPromise.callsResolutions = [];
  });

  it('should delay $wait milliseconds', function (){
    var result;

    var script = {
      $delay: { $exec: 'router1', $method: 'get', $args: { path: '/resource' } },
      $wait: 50
    };

    js.evaluate(script).then(function (_res) {
      result = _res;
    });

    return delay()
    .then(function() {
      assertNoCalls();
      assert.strictEqual(result, undefined);
      return delay(25);
    })
    .then(function() {
      assertNoCalls();
      assert.strictEqual(result, undefined);
      return delay(30);
    })
    .then(function() {
      assertCallsResoltion(1);
      assert.strictEqual(result, undefined);
      return delay(20); // assumes $exec delay of 20ms
    })
    .then(function() {
      assertCallsResoltion(2);
      assert.strictEqual(result, 'you requested /resource from router1');
    })
  });


  function assertNoCalls() {
    assertCallsResoltion(0);
  }

  function assertCallsResoltion(count) {
    assert.equal(callsResolutions.length, count);
  }

  function delay(wait) {
    return new Promise(function (resolve, reject) {
      setTimeout(function() {
        resolve();
      }, wait);
    });
  }
});
