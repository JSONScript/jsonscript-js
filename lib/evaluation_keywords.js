'use strict';

var getJst = require('./get_jst');


module.exports = {
  inlineInstruction: getJst('instruction_keyword'),
  validateAsync: getJst('validate_async'),
  itemsSerial: getJst('items_serial')
};
