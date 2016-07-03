'use strict';

var JSONScript = require('../lib/jsonscript');
var assert = require('assert');


describe('jsonscript', function() {
  var js;

  before(function() {
    js = new JSONScript;
  });

  describe('method validate', function() {
    it('should validate script', function() {
      var script = [
        { $exec: 'test', $method: 'doit', $args: 1 },
        { $exec: 'test', $method: 'doit', $args: 2 }
      ];

      assert(js.validate(script));
      assert.strictEqual(js.validate.errors, null);
    });
  });


  describe('method addExecutor', function() {
    it('should throw if executor is already defined', function() {
      assert.throws(function() {
        js.addExecutor('calc', {});
      });
    });
  });
});
