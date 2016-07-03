# jsonscript-js

JavaScript interpreter for [JSONScript](https://github.com/JSONScript/jsonscript)

[![Build Status](https://travis-ci.org/JSONScript/jsonscript-js.svg?branch=master)](https://travis-ci.org/JSONScript/jsonscript-js)
[![npm version](https://badge.fury.io/js/jsonscript-js.svg)](https://www.npmjs.com/package/jsonscript-js)
[![Code Climate](https://codeclimate.com/github/JSONScript/jsonscript-js/badges/gpa.svg)](https://codeclimate.com/github/JSONScript/jsonscript-js)
[![Coverage Status](https://coveralls.io/repos/github/JSONScript/jsonscript-js/badge.svg?branch=master)](https://coveralls.io/github/JSONScript/jsonscript-js?branch=master)


## Install

```
npm install jsonscript-js
```

## Getting started

Sequential execution of script commands:

```javascript
var JSONScript = require('jsonscript-js');
var js = new JSONScript;

js.addExecutor('router', getRouter());

var script = [
  { '$$router': { path: '/resource/1' } },
  { '$$router.put': { path: '/resource/1', body: { test: 'test' } } }
];

js.evaluate(script).then(function (res) {
  console.log(res);
  /**
   *  [
   *    { response: 'loaded /resource/1' },
   *    { response: 'updated /resource/1 with {"test":"test"}' }
   *  ]
   */
});


function getRouter() {
  function router(args) {
    return router.get(args);
  }

  router.get = function (args) {
    var response = 'loaded ' + args.path;
    return Promise.resolve({ response: response });
  };

  router.put = function (args) {
    var body = JSON.stringify(args.body);
    var response = 'updated ' + args.path + ' with ' + body;
    return Promise.resolve({ response: response });
  };

  return router;
}
```

In the example above the second request is sent only after the first result is received, so you can both get the current resource value and and update it in one script call.


Parallel execution:

```javascript
var script = {
  res1: { '$$router.get': { path: '/resource/1' } },
  res2: { '$$router.get': { path: '/resource/2' } }
};

js.evaluate(script).then(function (res) {
  console.log(res);
  /**
   *  {
   *    res1: { response: 'loaded /resource/1' },
   *    res2: { response: 'loaded /resource/2' }
   *  }
   */
});
```

In the example above the second request is sent in parallel, without waiting for the response from the first request.


## API

##### new JSONScript(Object options) -&gt; Object

Create JSONScript interpreter instance.


##### .validate(Any script) -&gt; Boolean

Validate script. This method is called automatically before the script is evaluated.


##### .evaluate(Any script, Any data) -&gt; Promise<Any>

Evaluate script. Returns Promise that resolves to the script evaluation result or rejects in case of validation or executor error.


##### .addExecutor(String name, Function|Object executor)

Add executor to the interpreter. Can be an object or a function with methods.

This method throws exception if you use the name that is already used (including predefined executors `array`, `calc` and `str`).


##### .addInstruction(Object definition, Function func)

Define JSONScript instruction. Core instructions are added using this method too.

`definition` should be valid according to the [instruction schema](http://www.json-script.com/schema/instruction.json#).

`func` is the function used to evaluate instruction, it can return:

- Promise that resolves to the evaluation result
- instance of Script that can contain:
  - a script that should be evaluated
  - a Promise that resolves to a script (for delayed evaluation).

Class `Script` is available as the property of both the class and the instance of JSONScript interpreter.


##### .addMacro(Object definition)

Define macro. Core macros are added using this method too.

`definition` should be valid according to the [macro schema](http://www.json-script.com/schema/macro.json#).


## Language

See [JSONScript language documentation](https://github.com/JSONScript/jsonscript/blob/master/LANGUAGE.md) for more information.
