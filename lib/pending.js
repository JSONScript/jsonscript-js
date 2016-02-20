'use strict';

module.exports = PendingRef;


function PendingRef(ref, dataPath, callback) {
  this.ref = ref;
  this.dataPath = dataPath;
  this.callbacks = callback;
}


PendingRef.prototype.addCallback = addCallback;
PendingRef.prototype.resolve = resolve;


function addCallback(callback) {
  if (typeof this.callbacks == 'function')
    this.callbacks = [this.callbacks, callback];
  else
    this.callbacks.push(callbacks);
}


function resolve(value) {
  if (typeof this.callbacks == 'function')
    this.callbacks(value);
  else {
    for (var i=0; i<this.callbacks.length; i++)
      this.callbacks[i](value);
  }
}
