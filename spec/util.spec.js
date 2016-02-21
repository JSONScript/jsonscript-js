'use strict';

var util = require('../lib/util');
var assert = require('assert');
var getPromise = require('./testutil').getPromise;
var pointer = require('json-pointer');


describe('util', function() {
  describe('objectToPromise', function() {
    var objectToPromise = util.objectToPromise;

    it('should return the same object if there are no promises', function() {
      var obj = { a: 1, b: 2 };
      var result = objectToPromise(obj);
      assert.deepEqual(result, obj);
      assert.equal(result, obj);
    });

    it('should return promise resolving to object without promises (if object has one promise)', function() {
      var obj = {
        a: 1,
        b: Promise.resolve(2),
        c: 3
      };
      var result = objectToPromise(obj);
      return result.then(function (res) {
        assert.deepEqual(res, { a: 1, b: 2, c: 3 });
      });
    });

    it('should return promise resolving to object without promises (if object has many promises)', function() {
      var obj = {
        a: 1,
        b: Promise.resolve(2),
        c: Promise.resolve(3)
      };
      var result = objectToPromise(obj);
      return result.then(function (res) {
        assert.deepEqual(res, { a: 1, b: 2, c: 3 });
      });
    });
  });


  describe('promiseMapSerial', function() {
    var promiseMapSerial = util.promiseMapSerial;
    var callsResolutions;

    beforeEach(function() {
      callsResolutions = getPromise.callsResolutions = [];
    });

    describe('map function is synchronous', function() {
      function syncMapper(data) {
        callsResolutions.push({ call: data });
        return data * 10;
      }

      it('should map array without promises synchronously', function() {
        var arr = [1, 2, 3];
        var result = promiseMapSerial(arr, syncMapper);
        assert.deepEqual(result, [10, 20, 30]);
        assert.deepEqual(callsResolutions, [{ call: 1 }, { call: 2 }, { call: 3 }]);
      });

      it('should return promise resolving to array without promises (if array has one promise)', function() {
        var arr = [
          1,
          getPromise(2),
          3
        ];
        var result = promiseMapSerial(arr, syncMapper);
        return result.then(function (res) {
          assert.deepEqual(res, [10, 20, 30]);
          assert.deepEqual(callsResolutions, [
            { call: 1 },
            { res: 2 },
            { call: 2 },
            { call: 3 }
          ]);
        });
      });

      it('should return promise resolving to array without promises (if array has many promises resolving in oorder)', function() {
        var arr = [
          1,
          getPromise(2, 20),
          getPromise(3, 40)
        ];
        var result = promiseMapSerial(arr, syncMapper);
        return result.then(function (res) {
          assert.deepEqual(res, [10, 20, 30]);
          assert.deepEqual(callsResolutions, [
            { call: 1 },
            { res: 2 },
            { call: 2},
            { res: 3 },
            { call: 3 }
          ]);
        });
      });

      it('should return promise resolving to array without promises (if array has many promises NOT resolving in order)', function() {
        var arr = [
          1,
          getPromise(2, 40),
          getPromise(3, 20)
        ];
        var result = promiseMapSerial(arr, syncMapper);
        return result.then(function (res) {
          assert.deepEqual(res, [10, 20, 30]);
          assert.deepEqual(callsResolutions, [
            { call: 1 },
            { res: 3 },
            { res: 2 },
            { call: 2},
            { call: 3 }
          ]);
        });
      });


      it('should return promise resolving to array without promises (if array has many promises NOT resolving in order)', function() {
        var arr = [
          getPromise(1),
          getPromise(2),
          getPromise(3)
        ];
        var result = promiseMapSerial(arr, syncMapper);
        return result.then(function (res) {
          assert.deepEqual(res, [10, 20, 30]);
          // assert.deepEqual(callsResolutions, [
          //   { call: 1 },
          //   { res: 3 },
          //   { res: 2 },
          //   { call: 2},
          //   { call: 3 }
          // ]);
        });
      });
    });

    describe('map function returns promise', function() {
      function asyncMapper(data) {
        callsResolutions.push({ call: data });
        return getPromise(data * 10);
      }

      it('should map array without promises sequentially (waiting for previous result)', function() {
        var arr = [1, 2, 3];
        var result = promiseMapSerial(arr, asyncMapper);
        return result.then(function (res) {
          assert.deepEqual(res, [10, 20, 30]);
          assert.deepEqual(callsResolutions, [
            { call: 1 },
            { res: 10 },
            { call: 2 },
            { res: 20 },
            { call: 3 },
            { res: 30 }
          ]);
        });
      });

      it('should return promise resolving to array without promises (if array has one promise)', function() {
        var arr = [
          1,
          getPromise(2),
          3
        ];
        var result = promiseMapSerial(arr, asyncMapper);
        return result.then(function (res) {
          assert.deepEqual(res, [10, 20, 30]);
          assert.deepEqual(callsResolutions, [
            { call: 1 },
            { res: 2 },
            { res: 10 },
            { call: 2 },
            { res: 20 },
            { call: 3 },
            { res: 30 }
          ]);
        });
      });

      it('should return promise resolving to array without promises (if array has one promise)', function() {
        var arr = [
          1,
          getPromise(2, 10),
          getPromise(3, 20)
        ];
        var result = promiseMapSerial(arr, asyncMapper);
        return result.then(function (res) {
          assert.deepEqual(res, [10, 20, 30]);
          assert.deepEqual(callsResolutions, [
            { call: 1 },
            { res: 10 },
            { res: 2 },
            { call: 2 },
            { res: 20 },
            { res: 3 },
            { call: 3 },
            { res: 30 }
          ]);
        });
      });
    });


    describe('map function can return promise or value', function() {
      function mapper(data) {
        callsResolutions.push({ call: data });
        if (data <= 2) return getPromise(data * 10, 20);
        if (data <= 4) return data * 10;
        if (data % 2) return getPromise(data * 10, 10);
        return data * 10;
      }

      it('should call mapper in order regardless of what it returns when array has no promises', function() {
        var arr = [ 1, 2, 3, 4, 5, 6, 7 ];
        var result = promiseMapSerial(arr, mapper);
        return result.then(function (res) {
          assert.deepEqual(res, [10, 20, 30, 40, 50, 60, 70]);
          assert.deepEqual(callsResolutions, [
            { call: 1 },
            { res: 10 },
            { call: 2 },
            { res: 20 },
            { call: 3 },
            { call: 4 },
            { call: 5 },
            { res: 50 },
            { call: 6 },
            { call: 7 },
            { res: 70 }
          ]);
        });
      });


      it('should call mapper in order when array has promises', function() {
        var arr = [
          1,
          getPromise(2, 30),
          3,
          getPromise(4, 50),
          5,
          getPromise(6, 70),
          getPromise(7, 90)
        ];
        var result = promiseMapSerial(arr, mapper);
        return result.then(function (res) {
          assert.deepEqual(res, [10, 20, 30, 40, 50, 60, 70]);
          assert.deepEqual(callsResolutions, [
            { call: 1 },
            { res: 10 },
            { res: 2 },
            { call: 2 },
            { res: 4 },
            { res: 20 },
            { call: 3 },
            { call: 4 },
            { call: 5 },
            { res: 50 },
            { res: 6 },
            { call: 6 },
            { res: 7 },
            { call: 7 },
            { res: 70 }
          ]);
        });
      });
    });
  });


  describe('toAbsolutePointer', function() {
    var base = pointer.parse('/foo/bar');

    it('should return property/index for N# pointer', function() {
      var absPntr = util.toAbsolutePointer('0#', base);
      assert.equal(absPntr, 'bar');

      var absPntr = util.toAbsolutePointer('1#', base);
      assert.equal(absPntr, 'foo');
    });

    it('should throw if N# points outside of the object', function() {
      assert.throws(function() {
        util.toAbsolutePointer('2#', base);
      }, /Cannot access property\/index 2 levels up, current level is 2/);

      assert.throws(function() {
        util.toAbsolutePointer('3#', base);
      }, /Cannot access property\/index 3 levels up, current level is 2/);
    });

    it('should return absolute parsed pointer', function() {
      var absPntr = util.toAbsolutePointer('1/baz', base);
      assert.deepEqual(absPntr, ['foo','baz']);

      var absPntr = util.toAbsolutePointer('1/baz/~0abc/~1def', base);
      assert.deepEqual(absPntr, ['foo','baz', '~abc', '/def']);

      var absPntr = util.toAbsolutePointer('2/baz/quux', base);
      assert.deepEqual(absPntr, ['baz', 'quux']);

      var absPntr = util.toAbsolutePointer('0/baz', base);
      assert.deepEqual(absPntr, ['foo', 'bar', 'baz']);
    });

    it('should trhow if N/... points outside of object', function() {
      assert.throws(function() {
        util.toAbsolutePointer('3/baz', base);
      }, /Cannot reference script 3 levels up, current level is 2/);
    });
  });
});
