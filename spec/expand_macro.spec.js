'use strict';

var JSONScript = require('../lib/jsonscript');
var executors = require('./executors');
var assert = require('assert');
var Ajv = require('ajv');


describe('macros', function() {
  var js;

  before(function() {
    js = new JSONScript;
  });


  describe('expandJsMacro keyword', function() {
    it('should expand macro according to rule', function() {
      var validate = js.ajv.compile({
        "expandJsMacro": {
          "description": "executor call with method",
          "pattern": {
            "^\\$\\$([^\\.]+)\\.([^\\.]+)$": 1
          },
          "script": {
            "$exec": "$1",
            "$method": "$2",
            "$args": 1
          }
        }
      });

      var script = { "$$router.get": { "path": "/resource/1" } };

      validate(script);

      assert.deepEqual(script, {
        "$exec": "router",
        "$method": "get",
        "$args": { "path": "/resource/1" }
      });
    });
  });


  describe('expandMacros method', function() {
    it('should expand macros in properties', function() {
      var script = {
        "res1": { "$$router1.get": { "path": "/resource/1" } },
        "res2": { "$$router1.get": { "path": "/resource/2" } }
      };

      js.expandMacros(script);

      assert.deepEqual(script, {
        "res1": {
          "$exec": "router1",
          "$method": "get",
          "$args": { "path": "/resource/1" }
        },
        "res2": {
          "$exec": "router1",
          "$method": "get",
          "$args": { "path": "/resource/2" }
        }
      });
    });


    it('should expand macros in items', function() {
      var script = [
        { "$$router1": { "method": "get", "path": "/resource/1" } },
        { "$$router1.get": { "path": "/resource/2" } }
      ];

      js.expandMacros(script);

      assert.deepEqual(script, [
        {
          "$exec": "router1",
          "$args": { "method": "get", "path": "/resource/1" }
        },
        {
          "$exec": "router1",
          "$method": "get",
          "$args": { "path": "/resource/2" }
        }
      ]);
    });


    it('should expand macros in items inside properties', function() {
      var script = {
        "res1": [
          { "$$router1.get": { "path": "/resource/1" } },
          { "$$router1.put": { "path": "/resource/1", "data": "test1" } }
        ],
        "res2": [
          { "$$router1.get": { "path": "/resource/2" } },
          { "$$router1.put": { "path": "/resource/2", "data": "test2" } }
        ]
      };

      js.expandMacros(script);

      assert.deepEqual(script, {
        "res1": [
          {
            "$exec": "router1",
            "$method": "get",
            "$args": { "path": "/resource/1" }
          },
          {
            "$exec": "router1",
            "$method": "put",
            "$args": { "path": "/resource/1", "data": "test1" }
          }
        ],
        "res2": [
          {
            "$exec": "router1",
            "$method": "get",
            "$args": { "path": "/resource/2" }
          },
          {
            "$exec": "router1",
            "$method": "put",
            "$args": { "path": "/resource/2", "data": "test2" }
          }
        ]
      });
    });


    it('should expand macro inside macro', function() {
      var script = {
        "$$calc.equal": [
          { "$$router1.get": { "path": { "$data": "/path" } } },
          "you requested /resource/1 from router1"
        ]
      };

      js.expandMacros(script);

      assert.deepEqual(script, {
        "$exec": "calc",
        "$method": "equal",
        "$args": [
          {
            "$exec": "router1",
            "$method": "get",
            "$args": {
              "path": { "$data": "/path" }
            }
          },
          "you requested /resource/1 from router1"
        ]
      });
    });
  });


  describe('expand function call', function() {
    it('should expand to $call instruction', function() {
      var script = {
        "res1": { "$#myfunc": [ 1 ] },
        "res2": { "$#myfunc": [ 2 ] }
      };

      js.expandMacros(script);

      assert.deepEqual(script, {
        "res1": {
          "$call": "myfunc",
          "$args": [ 1 ]
        },
        "res2": {
          "$call": "myfunc",
          "$args": [ 2 ]
        }
      });
    });
  });


  describe('expand calculations', function() {
    it('should expand to $calc instruction', function() {
      var script = [
        { "$+": [ 1, 2 ] },
        { "$-": [ 2, 1 ] },
        { "$*": [ 1, 2 ] },
        { "$/": [ 2, 1 ] }
      ];

      js.expandMacros(script);

      assert.deepEqual(script, [
        {
          "$exec": "calc",
          "$method": "add",
          "$args": [ 1, 2 ]
        },
        {
          "$exec": "calc",
          "$method": "subtract",
          "$args": [ 2, 1 ]
        },
        {
          "$exec": "calc",
          "$method": "multiply",
          "$args": [ 1, 2 ]
        },
        {
          "$exec": "calc",
          "$method": "divide",
          "$args": [ 2, 1 ]
        }
      ]);
    });
  });
});
