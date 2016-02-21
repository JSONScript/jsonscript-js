'use strict';

module.exports = PendingRef;


function PendingRef(rootPointer) {
  this.rootPointer = rootPointer;
  this.callbacks = [];
}


PendingRef.prototype.addCallback = addCallback;
PendingRef.prototype.resolve = resolve;


function addCallback(callback) {
  this.callbacks.push(callback);
}


function resolve(value) {
  for (var i=0; i<this.callbacks.length; i++)
    this.callbacks[i]();
}
