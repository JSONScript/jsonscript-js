'use strict';

var getPromise = require('./testutil').getPromise;

var router2 = {};

module.exports = {
  router1: router1,
  router2: router2
};

function router1(args) {
  return router1.get(args);
}

router1.get = makeGet('router1');
router1.post = makePost('router1');

router2.get = makeGet('router2');
router2.post = makePost('router2');


function makeGet(routerName) {
  return function get(args) {
    var path = args.path;
    getPromise.callsResolutions.push({ call: 'get: ' + path });
    var result = path
                  ? 'you requested ' + path + ' from ' + routerName
                  : new Error(routerName + ': path not specified');
    return getPromise(result, 10);
  };
}


function makePost(routerName) {
  return function post(args) {
    var path = args.path;
    var body = args.body;
    getPromise.callsResolutions.push({ call: 'post: ' + path });
    var result = path && body
                  ? 'you posted ' + JSON.stringify(body) + ' to ' + path + ' at ' + routerName
                  : new Error(routerName + ': path or body not specified');
    return getPromise(result, 10);
  };
}
