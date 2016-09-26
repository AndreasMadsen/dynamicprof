'use strict';

const dump = require('./dump.js');

const ns2s = 1e-9;

//
// Flatten datastructure
//
function Flatten(data) {
  const root = new Node(data.root);

  // Construct map of all nodes
  const nodes = new Map([[0, root]]);
  for (const node of data.nodes) {
    nodes.set(node.uid, new Node(node));
  }

  // Cross reference children and parents
  for (const node of nodes.values()) {
    node.parent = node.parent === null ? null : nodes.get(node.parent);
    node.children = node.children.map((uid) => nodes.get(uid));
  }

  // To calculate the node.total value all children must be processed,
  // so walk backward from leafs to root.
  // TODO: Because the nodecore uid are created in an incrementing order
  // one could construct post-order walkthough of the DAG by simply looping
  // from `max(uids)` to 0. However `async_hook` (not nodecore) extends
  // the uids with negative values, so that is not possibol right now.
  // In the future when only nodecore is used, this can be simplified.
  backwardDAGWalk(nodes, (node) => node.updateTotal());

  this.tree = root;
  this.allNodes = this.nodes();

  this.total = data.total * ns2s;
  this.version = data.version;
}

function backwardDAGWalk(nodes, handler) {
  // Create a queue of all nodes whos children have been processed,
  // and create a counter for all other nodes counting how many children
  // that needs to be processed
  const childCounter = new Map();
  const nodeQueue = new Set();

  // Initialize the counter and queue
  for (const node of nodes.values()) {
    if (node.children.length === 0) {
      nodeQueue.add(node);
    } else {
      childCounter.set(node.id, node.children.length);
    }
  }

  // Process nodes whos children have been processed, until there are no
  // more nodes.
  for (const node of nodeQueue.values()) {
    handler(node);

    // The root node doesn't have any children, so skip the backward walk
    if (node.parent === null) continue;

    // the number of children that has not been processed
    const missingChildren = childCounter.get(node.parent.id) - 1;

    if (missingChildren === 0) {
      // parent is ready to be processed, so add to queue
      nodeQueue.add(node.parent);
      childCounter.delete(node.parent.id);
    } else {
      childCounter.set(node.parent.id, missingChildren);
    }
  }
}

function Node(node) {
  // Meta
  this.id = node.uid; // d3 id, doesn't change
  this.parent = node.parent; // will be replaced by a Node reference
  this.collapsed = false;

  // Info
  this.name = node.name;
  this.stack = node.stack;
  this.unrefed = node.unrefed;

  // Convert init time
  this.init = node.init * ns2s;

  // If the node wasn't destroyed set the destroy time to the total lifetime
  this.destroy = (node.destroy === null) ? dump.total * ns2s : node.destroy * ns2s;

  // Convert before and after time
  this.before = node.before.map((v) => v * ns2s);
  this.after = node.after.map((v) => v * ns2s);
  // Total time, including all children will be updated.
  this.total = 0;

  // top position, will be updated
  this.index = NaN;
  this.top = NaN;

   // will be replaced by a list of Node references
  this.children = node.children;
}

Node.prototype.updateTotal = function () {
  // Update total, to be the max of the childrens total and the after time
  // of this node.
  this.total = this.destroy;
  for (const child of this.children) {
    this.total = Math.max(this.total, child.total);
  }
};

Node.prototype.setIndex = function (index) {
  this.index = index;
  this.top = index + 0.5;
};

Node.prototype.toggleCollapsed = function () {
  this.collapsed = !this.collapsed;
};

Flatten.prototype.nodes = function () {
  // Flatten out the nodes, removed children of collapsed nodes and calculate
  // index.
  const nodes = [];

  // This is implemented as an non-recursive preorder walker, to prevent
  // stack overflow.
  const stack = [this.tree];
  while (stack.length > 0) {
    const node = stack.pop();
    node.setIndex(nodes.length);
    nodes.push(node);
    if (!node.collapsed) stack.push(...node.children.slice(0).reverse());
  }

  return nodes;
};

Flatten.prototype._calcInitDeltas = function () {
  return this.allNodes.map(function (node) {
    return { 'time': node.init, 'delta': +1 };
  });
};

Flatten.prototype._calcAfterDeltas = function () {
  return this.allNodes.map(function (node) {
    return { 'time': node.destroy, 'delta': -1 };
  });
};

Flatten.prototype.overview = function () {
  // This will give an overview of the concurrency in the process timespan.

  // Create an array of deltas
  const deltas = this._calcInitDeltas()
    .concat(this._calcAfterDeltas())
    .sort(function (a, b) {
      return a.time - b.time;
    });

  // Now do a communicative sum of the deltas
  let concurrency = 0;
  return deltas.map(function (change) {
    concurrency += change.delta;

    return {
      'time': change.time,
      'concurrency': concurrency
    };
  });
};

module.exports = new Flatten(dump);
