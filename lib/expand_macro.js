'use strict';


module.exports = compileExpandJsMacroKeyword;


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
      var value = schema.script[inst];
      if (typeof value == 'string') {
        var matchNo = +value[1];
        var replacement = matches[matchNo];
        if (!replacement) throw new Error('macro expansion error (no match): ' + schema.description);
        data[inst] = replacement;
      } else if (value === keyValue) {
        data[inst] = macroValue;
      } else {
        throw new Error('macro expansion error (no value): ' + schema.description);
      }
    }

    return true;
  };
}
