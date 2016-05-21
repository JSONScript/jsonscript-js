'use strict';


module.exports = compileExpandJsMacroKeyword;


var next = {};
function compileExpandJsMacroKeyword(schema, parentSchema) {
  var keyPattern = Object.keys(schema.pattern)[0];
  var keyRegExp = new RegExp(keyPattern);
  var keyValue = schema.pattern[keyPattern];

  return function expandJsMacro(data, dataPath) {
    var keys = Object.keys(data);
    if (keys.length != 1) return false;
    var macroKey = keys[0];
    if (macroKey[0] != '$') return false;
    var matches = macroKey.match(keyRegExp);
    if (!matches) return false;
    var macroValue = data[macroKey];
    delete data[macroKey];

    for (var inst in schema.script) {
      var val = schema.script[inst];
      var repl = getKeyMatch(val);
      if (repl === next) repl = getValueMatch(val);
      if (repl === next) repl = getObjectMatch(val);
      data[inst] = repl === next ? val : repl;
    }

    return true;


    function getKeyMatch(value) {
      if (typeof value == 'string' && value.length == 2 && value[0] == '$') {
        var matchNo = +value[1];
        var replacement = matches[matchNo];
        if (!replacement) throw new Error('macro expansion error (no match): ' + schema.description);
        return replacement;
      }
      return next;
    }

    function getValueMatch(value) {
      if (value === keyValue) return macroValue;
      return next;
    }

    function getObjectMatch(value) {
      if (typeof value != 'object') return next;
      var valueKeys = Object.keys(value);
      if (valueKeys.length != 1) return next;
      var key = valueKeys[0];
      if (key.length != 2 || key[0] != '$') return next;
      var matchNo = +key[1];
      var replacementKey = matches[matchNo];
      var replacement = value[key][replacementKey];
      if (!replacement) throw new Error('macro expansion error (no match): ' + schema.description);
      return replacement;
    }
  };
}
