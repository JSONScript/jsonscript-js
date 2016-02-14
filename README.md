# jsonscript-js

JavaScript interpreter for [JSONScript](https://github.com/JSONScript/jsonscript)

It is work in progress.


## Install

```
npm install jsonscript-js
```

## Getting started

Sequential execution of script commands:

```javascript
var JSONScript = require('jsonscript-js');
var js = JSONScript();

js.addExecutor('router', getRouter());

var script = [
  {
    $exec: 'router',
    $args: { path: '/resource/1' }
  },
  {
    $exec: 'router',
    $method: 'put',
    $args: { path: '/resource/1', body: { test: 'test' } }
  }
];

js.evaluate(script).then(function (res) {
  console.log(res);
  /**
   *  [
   *    { responce: 'loaded /resource/1' },
   *    { responce: 'updated /resource/1 with {"test":"test"}' }
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
  res1: {
    $exec: 'router',
    $method: 'get',
    $args: { path: '/resource/1' }
  },
  res2: {
    $exec: 'router',
    $method: 'get',
    $args: { path: '/resource/2' }
  }
};

js.evaluate(script).then(function (res) {
  console.log(res);
  /**
   *  {
   *    res1: { responce: 'loaded /resource/1' },
   *    res2: { responce: 'loaded /resource/2' }
   *  }
   */
});
```

In example above the second request is sent in parallel, without waiting for the response from the first request.
