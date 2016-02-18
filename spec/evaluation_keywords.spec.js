'use strict';

var JSONScript = require('../lib/jsonscript');
var assert = require('assert');
var Ajv = require('ajv');


describe('evaluation keywords', function() {
  var js;

  before(function() {
    js = JSONScript();
  });

  describe('keyword validateAsync', function() {
    var validate;

    beforeEach(function() {
      var schema = {
        properties: {
          foo: {
            validateAsync: {
              type: 'string'
            }
          }
        }
      };

      validate = js.ajv.compile(schema);
    });

    it('should validate data', function() {
      assert(validate({ foo: 'bar' }));
      assert.strictEqual(validate.errors, null);

      assert(!validate({ foo: 1 }));
      assert.equal(validate.errors.length, 1);
    });

    it('should validate data in promise', function() {
      var validData = {
        foo: Promise.resolve('bar')
      };

      assert(validate(validData));
      assert.strictEqual(validate.errors, null);
      var p1 = validData.foo.then(function (res) {
        assert.equal(res, 'bar');
      });

      var invalidData = {
        foo: Promise.resolve(1)
      };

      assert(validate(invalidData));
      assert.strictEqual(validate.errors, null);

      var p2 = invalidData.foo.then(
        function(res) {
          throw new Error('data should be invalid')
        },
        function(e) {
          assert(e instanceof Ajv.ValidationError);
          assert.equal(e.errors.length, 1);
        }
      );

      return Promise.all([ p1, p2 ]);
    });
  });


  describe('keyword objectToAsync', function() {
    var validate;

    beforeEach(function() {
      var schema = {
        properties: {
          obj: { objectToAsync: true }
        }
      };

      validate = js.ajv.compile(schema);
    });

    it('should leave object as is if there are no promises', function() {
      var obj = { a: 1, b: 2, c: 3 };
      var data = { obj: obj };
      assert(validate.call({ js: js }, data));
      assert.strictEqual(validate.errors, null);
      assert.equal(data.obj, obj);
      assert.deepEqual(data.obj, obj);
    });

    it('should merge promises in properties in a single promise', function() {
      var obj = {
        a: 1,
        b: Promise.resolve(2),
        c: Promise.resolve(3),
        d: 4
      };
      var data = { obj: obj };
      assert(validate.call({ js: js }, data));
      assert.strictEqual(validate.errors, null);

      return data.obj.then(function (res) {
        assert.deepEqual(res, { a: 1, b: 2, c: 3, d: 4 });
      });
    });
  });


  describe('keyword itemsSerial', function() {
    it('should merge promises in items sequentially and return a single promise', function() {
      var schema = {
        properties: {
          arr: {
            itemsSerial: { objectToAsync: true }
          }
        }
      };

      var validate = js.ajv.compile(schema);

      var arr = [
        { a: 1, b: Promise.resolve(2) },
        { c: 3, d: Promise.resolve(4) }
      ];

      var data = { arr: arr };
      assert(validate.call({ js: js }, data));
      assert.strictEqual(validate.errors, null);

      return data.arr.then(function (res) {
        assert.deepEqual(res, [
          { a: 1, b: 2 },
          { c: 3, d: 4 }
        ]);
      });
    });

    it('should merge promises in items sequentially and return a single promise with recursive schema', function() {
      var schema = {
        properties: {
          arr: {
            objectToAsync: true,
            itemsSerial: { $ref: '#/properties/arr' }
          }
        }
      };

      var validate = js.ajv.compile(schema);

      var arr = [
        { a: 1, b: Promise.resolve(2) },
        { c: 3, d: Promise.resolve(4) }
      ];

      var data = { arr: arr };
      assert(validate.call({ js: js }, data));
      assert.strictEqual(validate.errors, null);

      var p1 = data.arr.then(function (res) {
        assert.deepEqual(res, [
          { a: 1, b: 2 },
          { c: 3, d: 4 }
        ]);
      });

      var arr = [
        [ { a: 1 }, { b: Promise.resolve(2) } ],
        [ { c: 3 }, { d: Promise.resolve(4) } ]
      ];

      var data = { arr: arr };
      assert(validate.call({ js: js }, data));
      assert.strictEqual(validate.errors, null);

      var p2 = data.arr.then(function (res) {
        assert.deepEqual(res, [
          [ { a: 1 }, { b: 2 } ],
          [ { c: 3 }, { d: 4 } ]
        ]);
      });

      return Promise.all([ p1, p2 ]);
    });
  });
});
