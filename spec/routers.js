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

router1.get = router2.get = get;
router1.post = router2.post = post;


function get(args) {
  var path = args.path;
  getPromise.callsResolutions.push({ call: 'get: ' + path });
  var result = path
                ? 'you requested ' + path
                : new Error('path not specified');
  return getPromise(result, 10);
}


function post(args) {
  var path = args.path;
  var body = args.body;
  getPromise.callsResolutions.push({ call: 'post: ' + path });
  var result = path && body
                ? 'you posted ' + JSON.stringify(body) + ' to ' + path
                : new Error('path or body not specified');
  return getPromise(result, 10);
}
