'use strict';

module.exports = PendingRef;


/**
 * Class to store unresolved reference and callbacks
 * @param {String} jsonPointer JSON-pointer of the reference
 */
function PendingRef(jsonPointer) {
  this.jsonPointer = jsonPointer;
  this.callbacks = [];
}


PendingRef.prototype.addCallback = addCallback;
PendingRef.prototype.resolve = resolve;


/**
 * add callback to pending reference
 * @this  PendingRef
 * @param {Function} callback it will be called when ther eference is resolved
 */
function addCallback(callback) {
  this.callbacks.push(callback);
}


/**
 * call all callbacks when reference is resolved
 * @this PendingRef
 */
function resolve() {
  for (var i=0; i<this.callbacks.length; i++)
    this.callbacks[i]();
}
