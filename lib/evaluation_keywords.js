'use strict';

var getJst = require('./get_jst');


module.exports = {
  inlineInstruction: getJst('instruction_keyword'),
  validateAsync: getJst('validate_async'),
  itemsSerial: getJst('items_serial'),
  resolvePendingRefs: resolvePendingRefs
};


function resolvePendingRefs(data, dataPath) {
  this.evaluated[dataPath] = true;
  var refs = this.pendingRefs;
  for (var i=0; i<refs.length; i++) {
    var ref = refs[i];
    if (isInside(ref, dataPath)) resolveRef(ref);
  }
}
