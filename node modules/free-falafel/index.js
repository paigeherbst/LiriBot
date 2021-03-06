(function() {
var parse = typeof(module)=='undefined' ? window.esprima.parse : require('esprima').parse;
var objectKeys = Object.keys || function (obj) {
    var keys = [];
    for (var key in obj) keys.push(key);
    return keys;
};
var forEach = function (xs, fn) {
    if (xs.forEach) return xs.forEach(fn);
    for (var i = 0; i < xs.length; i++) {
        fn.call(xs, xs[i], i, xs);
    }
};

var isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

var falafel = function (src, opts, fn, breadthFirstFn) {
    if (typeof opts === 'function') {
        breadthFirstFn = fn;
        fn = opts;
        opts = {};
    }
    if (typeof src === 'object') {
        opts = src;
        src = opts.source;
        delete opts.source;
    }
    src = src || opts.source;
    opts.range = true;
    if (typeof src !== 'string') { src = String(src); }
    if (!breadthFirstFn) { breadthFirstFn = function(){}; }
    
    var ast = opts.ast || parse(src, opts);
    delete opts.ast;
    
    var result = {
        chunks : src.split(''),
        toString : function () { return result.chunks.join(''); },
        inspect : function () { return result.toString(); }
    };
    var index = 0;

    (function walk (node, parent) {
        insertHelpers(node, parent, result.chunks);
        breadthFirstFn(node);
        insertHelpers2(node, parent, result.chunks);
        forEach(objectKeys(node), function (key) {
            if (key === 'parent') { return; }
            var child = node[key];
            if (isArray(child)) {
                forEach(child, function (c) {
                    if (c && typeof c.type === 'string') {
                        walk(c, node);
                    }
                });
            }
            else if (child && typeof child.type === 'string') {
                insertHelpers(child, node, result.chunks);
                walk(child, node);
            }
        });
        fn(node);
    })(ast, undefined);

    return result;
};
 
function insertHelpers (node, parent, chunks) {
    if (!node.range) return;
    
    node.parent = parent;
    
    node.source = function () {
        return chunks.slice(
            node.range[0], node.range[1]
        ).join('');
    };
}

function insertHelpers2 (node, parent, chunks) {
    if (node.update && typeof node.update === 'object') {
        var prev = node.update;
        forEach(objectKeys(prev), function (key) {
            update[key] = prev[key];
        });
        node.update = update;
    }
    else {
        node.update = update;
    }
    
    function update (s) {
        chunks[node.range[0]] = s;
        for (var i = node.range[0] + 1; i < node.range[1]; i++) {
            chunks[i] = '';
        }
    };
}

//export
if(typeof(module)==='undefined') { window.falafel = falafel; }
else { module.exports = falafel; }

})();
