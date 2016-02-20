'use strict';

module.exports = Evaluation;


function Evaluation(js, data) {
  this.js = js;
  this.data = data;
  this.evaluated = {};
  this.pendingRefs = [];
}
