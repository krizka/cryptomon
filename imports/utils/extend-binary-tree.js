import { BinarySearchTree } from 'dsjslib';

BinarySearchTree.prototype.minNode = function (min) {
    min = min || this.root;
    if (!min) return;
    while (min.leftChild) {
        min = min.leftChild;
    }
    return min;
};

BinarySearchTree.prototype.maxNode = function (max) {
    max = max || this.root;
    if (!max) return;
    while (max.rightChild) {
        max = max.rightChild;
    }
    return max;
};
BinarySearchTree.prototype.successorNode = function (node) {
    if (!node) return null;
    if (node.rightChild) return this.minNode(node.rightChild);
    var n = node;
    while (n && n.isRightChild()) {
        n = n.parent;
    }
    return n.parent;
};
BinarySearchTree.prototype.predecessorNode = function (node) {
    if (!node) return null;
    if (node.leftChild) return this.maxNode(node.leftChild);
    var n = node;
    while (n && n.isLeftChild()) {
        n = n.parent;
    }
    return n.parent;
};


BinarySearchTree.prototype.getClosest = function (key, node) {
    if (typeof key === 'undefined' || key === null) return null;
    if (typeof node === "undefined") node = this.root;
    var compFn = this._compFn;
    return recFind(key, node);

    function recFind(key, node) {
        if (!node) return null;
        let cmp = compFn(node, key);
        if (cmp < 0) return node.leftChild ? recFind(key, node.leftChild) : node;
        if (cmp > 0) return node.rightChild ? recFind(key, node.rightChild) : node;
        if (cmp === 0) return node;
    }
};
