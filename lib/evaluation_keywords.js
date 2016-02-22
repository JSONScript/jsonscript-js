'use strict';

var getJst = require('./get_jst');


module.exports = {
  inlineInstruction: getJst('instruction_keyword'),
  validateAsync: getJst('validate_async'),
  itemsSerial: getJst('items_serial'),
  resolvePendingRefs: resolvePendingRefs
};


/**
 * Validation function for custom validation keyword resolvePendingRefs.
 * It marks the current path as evaluated and resolves pending references.
 * @this   Evaluation
 * @param  {Object} data     Current script, not used
 * @param  {String} dataPath Current data path (JSON pointer)
 * @return {Boolean} validation result
 */
function resolvePendingRefs(data, dataPath) {
  dataPath = dataPath.replace(/^\/script/, '');
  this.evaluatedRefs[dataPath] = true;
  var ref = this.pendingRefs[dataPath];
  if (ref) ref.resolve();
  return true;
}
