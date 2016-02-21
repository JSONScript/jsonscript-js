'use strict';

var getJst = require('./get_jst');


module.exports = {
  inlineInstruction: getJst('instruction_keyword'),
  validateAsync: getJst('validate_async'),
  itemsSerial: getJst('items_serial'),
  resolvePendingRefs: resolvePendingRefs
};


function resolvePendingRefs(data, dataPath) {
  dataPath = dataPath.replace(/^\/script/, '');
  this.evaluatedRefs[dataPath] = true;
  var ref = this.pendingRefs[dataPath];
  if (ref) ref.resolve();
  return true;
}
