'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.buildPredicate = buildPredicate;
exports.reduceTreeBySelector = reduceTreeBySelector;
exports.reduceTreesBySelector = reduceTreesBySelector;

var _rstSelectorParser = require('rst-selector-parser');

var _object = require('object.values');

var _object2 = _interopRequireDefault(_object);

var _arrayPrototype = require('array.prototype.flat');

var _arrayPrototype2 = _interopRequireDefault(_arrayPrototype);

var _objectIs = require('object-is');

var _objectIs2 = _interopRequireDefault(_objectIs);

var _has = require('has');

var _has2 = _interopRequireDefault(_has);

var _byConstructor = require('html-element-map/byConstructor');

var _byConstructor2 = _interopRequireDefault(_byConstructor);

var _RSTTraversal = require('./RSTTraversal');

var _Utils = require('./Utils');

var _getAdapter = require('./getAdapter');

var _getAdapter2 = _interopRequireDefault(_getAdapter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

// our CSS selector parser instance
var parser = (0, _rstSelectorParser.createParser)();

// Combinators that allow you to chance selectors
var CHILD = 'childCombinator';
var ADJACENT_SIBLING = 'adjacentSiblingCombinator';
var GENERAL_SIBLING = 'generalSiblingCombinator';
var DESCENDANT = 'descendantCombinator';

// Selectors for targeting elements
var SELECTOR = 'selector';
var TYPE_SELECTOR = 'typeSelector';
var CLASS_SELECTOR = 'classSelector';
var ID_SELECTOR = 'idSelector';
var UNIVERSAL_SELECTOR = 'universalSelector';
var ATTRIBUTE_PRESENCE = 'attributePresenceSelector';
var ATTRIBUTE_VALUE = 'attributeValueSelector';
// @TODO we dont support these, throw if they are used
var PSEUDO_CLASS = 'pseudoClassSelector';
var PSEUDO_ELEMENT = 'pseudoElementSelector';

var EXACT_ATTRIBUTE_OPERATOR = '=';
var WHITELIST_ATTRIBUTE_OPERATOR = '~=';
var HYPHENATED_ATTRIBUTE_OPERATOR = '|=';
var PREFIX_ATTRIBUTE_OPERATOR = '^=';
var SUFFIX_ATTRIBUTE_OPERATOR = '$=';
var SUBSTRING_ATTRIBUTE_OPERATOR = '*=';

function unique(arr) {
  return [].concat(_toConsumableArray(new Set(arr)));
}

/**
 * Calls reduce on a array of nodes with the passed
 * function, returning only unique results.
 * @param {Function} fn
 * @param {Array<Node>} nodes
 */
function uniqueReduce(fn, nodes) {
  return unique(nodes.reduce(fn, []));
}

/**
 * Takes a CSS selector and returns a set of tokens parsed
 * by scalpel.
 * @param {String} selector
 */
function safelyGenerateTokens(selector) {
  try {
    return parser.parse(selector);
  } catch (err) {
    throw new Error('Failed to parse selector: ' + String(selector));
  }
}

function matchAttributeSelector(node, token) {
  var operator = token.operator,
      value = token.value,
      name = token.name;

  var nodeProps = (0, _Utils.propsOfNode)(node);
  var descriptor = Object.getOwnPropertyDescriptor(nodeProps, name);
  if (descriptor && descriptor.get) {
    return false;
  }
  var nodePropValue = nodeProps[name];
  if (typeof nodePropValue === 'undefined') {
    return false;
  }
  if (token.type === ATTRIBUTE_PRESENCE) {
    return (0, _has2['default'])(nodeProps, token.name);
  }
  // Only the exact value operator ("=") can match non-strings
  if (typeof nodePropValue !== 'string' || typeof value !== 'string') {
    if (operator !== EXACT_ATTRIBUTE_OPERATOR) {
      return false;
    }
  }
  switch (operator) {
    /**
     * Represents an element with the att attribute whose value is exactly "val".
     * @example
     * [attr="val"] matches attr="val"
     */
    case EXACT_ATTRIBUTE_OPERATOR:
      return (0, _objectIs2['default'])(nodePropValue, value);
    /**
     * Represents an element with the att attribute whose value is a whitespace-separated
     * list of words, one of which is exactly
     * @example
     *  [rel~="copyright"] matches rel="copyright other"
     */
    case WHITELIST_ATTRIBUTE_OPERATOR:
      return nodePropValue.split(' ').indexOf(value) !== -1;
    /**
     * Represents an element with the att attribute, its value either being exactly the
     * value or beginning with the value immediately followed by "-"
     * @example
     * [hreflang|="en"] matches hreflang="en-US"
     */
    case HYPHENATED_ATTRIBUTE_OPERATOR:
      return nodePropValue === value || nodePropValue.startsWith(String(value) + '-');
    /**
     * Represents an element with the att attribute whose value begins with the prefix value.
     * If the value is the empty string then the selector does not represent anything.
     * @example
     * [type^="image"] matches type="imageobject"
     */
    case PREFIX_ATTRIBUTE_OPERATOR:
      return value === '' ? false : nodePropValue.slice(0, value.length) === value;
    /**
     * Represents an element with the att attribute whose value ends with the suffix value.
     * If the value is the empty string then the selector does not represent anything.
     * @example
     * [type$="image"] matches type="imageobject"
     */
    case SUFFIX_ATTRIBUTE_OPERATOR:
      return value === '' ? false : nodePropValue.slice(-value.length) === value;
    /**
     * Represents an element with the att attribute whose value contains at least one
     * instance of the value. If value is the empty string then the
     * selector does not represent anything.
     * @example
     * [title*="hello"] matches title="well hello there"
     */
    case SUBSTRING_ATTRIBUTE_OPERATOR:
      return value === '' ? false : nodePropValue.indexOf(value) !== -1;
    default:
      throw new Error('Enzyme::Selector: Unknown attribute selector operator "' + String(operator) + '"');
  }
}

function matchPseudoSelector(node, token, root) {
  var name = token.name,
      parameters = token.parameters;

  if (name === 'not') {
    // eslint-disable-next-line no-use-before-define
    return parameters.every(function (selector) {
      return reduceTreeBySelector(selector, node).length === 0;
    });
  }
  if (name === 'empty') {
    return (0, _RSTTraversal.treeFilter)(node, function (n) {
      return n !== node;
    }).length === 0;
  }
  if (name === 'first-child') {
    var _findParentNode = (0, _RSTTraversal.findParentNode)(root, node),
        rendered = _findParentNode.rendered;

    var _rendered = _slicedToArray(rendered, 1),
        firstChild = _rendered[0];

    return firstChild === node;
  }
  if (name === 'last-child') {
    var _findParentNode2 = (0, _RSTTraversal.findParentNode)(root, node),
        _rendered2 = _findParentNode2.rendered;

    return _rendered2[_rendered2.length - 1] === node;
  }
  if (name === 'focus') {
    if (typeof document === 'undefined') {
      throw new Error('Enzyme::Selector does not support the ":focus" pseudo-element without a global `document`.');
    }
    var adapter = (0, _getAdapter2['default'])();
    /* eslint-env browser */
    return document.activeElement && adapter.nodeToHostNode(node) === document.activeElement;
  }

  throw new TypeError('Enzyme::Selector does not support the "' + String(token.name) + '" pseudo-element or pseudo-class selectors.');
}

/**
 * Takes a node and a token and determines if the node
 * matches the predicate defined by the token.
 * @param {Node} node
 * @param {Token} token
 */
function nodeMatchesToken(node, token, root) {
  if (node === null || typeof node === 'string') {
    return false;
  }
  switch (token.type) {
    /**
     * Match every node
     * @example '*' matches every node
     */
    case UNIVERSAL_SELECTOR:
      return true;
    /**
     * Match against the className prop
     * @example '.active' matches <div className='active' />
     */
    case CLASS_SELECTOR:
      return (0, _RSTTraversal.hasClassName)(node, token.name);
    /**
     * Simple type matching
     * @example 'div' matches <div />
     */
    case TYPE_SELECTOR:
      return (0, _Utils.nodeHasType)(node, token.name);
    /**
     * Match against the `id` prop
     * @example '#nav' matches <ul id="nav" />
     */
    case ID_SELECTOR:
      return (0, _RSTTraversal.nodeHasId)(node, token.name);
    /**
     * Matches if an attribute is present, regardless
     * of its value
     * @example '[disabled]' matches <a disabled />
     */
    case ATTRIBUTE_PRESENCE:
      return matchAttributeSelector(node, token);
    /**
     * Matches if an attribute is present with the
     * provided value
     * @example '[data-foo=foo]' matches <div data-foo="foo" />
     */
    case ATTRIBUTE_VALUE:
      return matchAttributeSelector(node, token);
    case PSEUDO_ELEMENT:
    case PSEUDO_CLASS:
      return matchPseudoSelector(node, token, root);
    default:
      throw new Error('Unknown token type: ' + String(token.type));
  }
}

/**
 * Returns a predicate function that checks if a
 * node matches every token in the body of a selector
 * token.
 * @param {Token} token
 */
function buildPredicateFromToken(token, root) {
  return function (node) {
    return token.body.every(function (bodyToken) {
      return nodeMatchesToken(node, bodyToken, root);
    });
  };
}

/**
 * Returns whether a parsed selector is a complex selector, which
 * is defined as a selector that contains combinators.
 * @param {Array<Token>} tokens
 */
function isComplexSelector(tokens) {
  return tokens.some(function (token) {
    return token.type !== SELECTOR;
  });
}

/**
 * Takes a component constructor, object, or string representing
 * a simple selector and returns a predicate function that can
 * be applied to a single node.
 * @param {EnzymeSelector} selector
 */
function buildPredicate(selector) {
  // If the selector is a string, parse it as a simple CSS selector
  if (typeof selector === 'string') {
    var tokens = safelyGenerateTokens(selector);
    if (isComplexSelector(tokens)) {
      throw new TypeError('This method does not support complex CSS selectors');
    }
    // Simple selectors only have a single selector token
    return buildPredicateFromToken(tokens[0]);
  }

  // If the selector is an element type, check if the node's type matches
  var adapter = (0, _getAdapter2['default'])();
  var isElementType = adapter.isValidElementType ? adapter.isValidElementType(selector) : typeof selector === 'function';
  if (isElementType) {
    return function (node) {
      return node && node.type === selector;
    };
  }
  // If the selector is an non-empty object, treat the keys/values as props
  if ((typeof selector === 'undefined' ? 'undefined' : _typeof(selector)) === 'object') {
    if (!Array.isArray(selector) && selector !== null && Object.keys(selector).length > 0) {
      var hasUndefinedValues = (0, _object2['default'])(selector).some(function (value) {
        return typeof value === 'undefined';
      });
      if (hasUndefinedValues) {
        throw new TypeError('Enzyme::Props can’t have `undefined` values. Try using ‘findWhere()’ instead.');
      }
      return function (node) {
        return (0, _RSTTraversal.nodeMatchesObjectProps)(node, selector);
      };
    }
    throw new TypeError('Enzyme::Selector does not support an array, null, or empty object as a selector');
  }

  throw new TypeError('Enzyme::Selector expects a string, object, or valid element type (Component Constructor)');
}

/**
 * Matches only nodes which are adjacent siblings (direct next sibling)
 * against a predicate, returning those that match.
 * @param {Array<Node>} nodes
 * @param {Function} predicate
 * @param {Node} root
 */
function matchAdjacentSiblings(nodes, predicate, root) {
  return nodes.reduce(function (matches, node) {
    var parent = (0, _RSTTraversal.findParentNode)(root, node);
    // If there's no parent, there's no siblings
    if (!parent) {
      return matches;
    }
    var parentChildren = (0, _RSTTraversal.childrenOfNode)(parent);
    var nodeIndex = parentChildren.indexOf(node);
    var adjacentSibling = parentChildren[nodeIndex + 1];
    // No sibling
    if (!adjacentSibling) {
      return matches;
    }
    if (predicate(adjacentSibling)) {
      matches.push(adjacentSibling);
    }
    return matches;
  }, []);
}

/**
 * Matches only nodes which are general siblings (any sibling *after*)
 * against a predicate, returning those that match.
 * @param {Array<Node>} nodes
 * @param {Function} predicate
 * @param {Node} root
 */
function matchGeneralSibling(nodes, predicate, root) {
  return uniqueReduce(function (matches, node) {
    var parent = (0, _RSTTraversal.findParentNode)(root, node);
    if (!parent) {
      return matches;
    }
    var parentChildren = (0, _RSTTraversal.childrenOfNode)(parent);
    var nodeIndex = parentChildren.indexOf(node);
    var youngerSiblings = parentChildren.slice(nodeIndex + 1);
    return matches.concat(youngerSiblings.filter(predicate));
  }, nodes);
}

/**
 * Matches only nodes which are direct children (not grandchildren, etc.)
 * against a predicate, returning those that match.
 * @param {Array<Node>} nodes
 * @param {Function} predicate
 */
function matchDirectChild(nodes, predicate) {
  return uniqueReduce(function (matches, node) {
    return matches.concat((0, _RSTTraversal.childrenOfNode)(node).filter(predicate));
  }, nodes);
}

/**
 * Matches all descendant nodes against a predicate,
 * returning those that match.
 * @param {Array<Node>} nodes
 * @param {Function} predicate
 */
function matchDescendant(nodes, predicate) {
  return uniqueReduce(function (matches, node) {
    return matches.concat((0, _RSTTraversal.treeFilter)(node, predicate));
  }, (0, _arrayPrototype2['default'])(nodes.map(_RSTTraversal.childrenOfNode)));
}

/**
 * Takes an RST and reduces it to a set of nodes matching
 * the selector. The selector can be a simple selector, which
 * is handled by `buildPredicate`, or a complex CSS selector which
 * reduceTreeBySelector parses and reduces the tree based on the combinators.
 *
 * @param {EnzymeSelector} selector
 * @param {RSTNode} root
 */
function reduceTreeBySelector(selector, root) {
  if (typeof selector !== 'string') {
    var elements = (0, _byConstructor2['default'])(selector);
    if (elements.length > 0) {
      return (0, _arrayPrototype2['default'])(elements.map(function (x) {
        return reduceTreeBySelector(x.tag, root);
      }));

      // when https://github.com/aweary/rst-selector-parser/issues/15 is resolved
      // const htmlTagNames = elements.map(x => x.tag).join(', ');
      // return reduceTreeBySelector(htmlTagNames, root);
    }
  }

  if (typeof selector === 'function' || (typeof selector === 'undefined' ? 'undefined' : _typeof(selector)) === 'object') {
    return (0, _RSTTraversal.treeFilter)(root, buildPredicate(selector));
  }

  var results = [];
  if (typeof selector === 'string') {
    var tokens = safelyGenerateTokens(selector);
    var index = 0;
    while (index < tokens.length) {
      var token = tokens[index];
      /**
       * There are two types of tokens in a CSS selector:
       *
       * 1. Selector tokens. These target nodes directly, like
       *    type or attribute selectors. These are easy to apply
       *    because we can traverse the tree and return only
       *    the nodes that match the predicate.
       *
       * 2. Combinator tokens. These tokens chain together
       *    selector nodes. For example > for children, or +
       *    for adjacent siblings. These are harder to match
       *    as we have to track where in the tree we are
       *    to determine if a selector node applies or not.
       */
      if (token.type === SELECTOR) {
        var predicate = buildPredicateFromToken(token, root);
        results = results.concat((0, _RSTTraversal.treeFilter)(root, predicate));
      } else {
        // We can assume there always all previously matched tokens since selectors
        // cannot start with combinators.
        var type = token.type;
        // We assume the next token is a selector, so move the index
        // forward and build the predicate.

        index += 1;
        var _predicate = buildPredicateFromToken(tokens[index], root);
        // We match against only the nodes which have already been matched,
        // since a combinator is meant to refine a previous selector.
        switch (type) {
          // The + combinator
          case ADJACENT_SIBLING:
            results = matchAdjacentSiblings(results, _predicate, root);
            break;
          // The ~ combinator
          case GENERAL_SIBLING:
            results = matchGeneralSibling(results, _predicate, root);
            break;
          // The > combinator
          case CHILD:
            results = matchDirectChild(results, _predicate);
            break;
          // The ' ' (whitespace) combinator
          case DESCENDANT:
            {
              results = matchDescendant(results, _predicate);
              break;
            }
          default:
            throw new Error('Unknown combinator selector: ' + String(type));
        }
      }
      index += 1;
    }
  } else {
    throw new TypeError('Enzyme::Selector expects a string, object, or Component Constructor');
  }
  return results;
}

function reduceTreesBySelector(selector, roots) {
  var results = roots.map(function (n) {
    return reduceTreeBySelector(selector, n);
  });
  return unique((0, _arrayPrototype2['default'])(results, 1));
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zZWxlY3RvcnMuanMiXSwibmFtZXMiOlsiYnVpbGRQcmVkaWNhdGUiLCJyZWR1Y2VUcmVlQnlTZWxlY3RvciIsInJlZHVjZVRyZWVzQnlTZWxlY3RvciIsInBhcnNlciIsIkNISUxEIiwiQURKQUNFTlRfU0lCTElORyIsIkdFTkVSQUxfU0lCTElORyIsIkRFU0NFTkRBTlQiLCJTRUxFQ1RPUiIsIlRZUEVfU0VMRUNUT1IiLCJDTEFTU19TRUxFQ1RPUiIsIklEX1NFTEVDVE9SIiwiVU5JVkVSU0FMX1NFTEVDVE9SIiwiQVRUUklCVVRFX1BSRVNFTkNFIiwiQVRUUklCVVRFX1ZBTFVFIiwiUFNFVURPX0NMQVNTIiwiUFNFVURPX0VMRU1FTlQiLCJFWEFDVF9BVFRSSUJVVEVfT1BFUkFUT1IiLCJXSElURUxJU1RfQVRUUklCVVRFX09QRVJBVE9SIiwiSFlQSEVOQVRFRF9BVFRSSUJVVEVfT1BFUkFUT1IiLCJQUkVGSVhfQVRUUklCVVRFX09QRVJBVE9SIiwiU1VGRklYX0FUVFJJQlVURV9PUEVSQVRPUiIsIlNVQlNUUklOR19BVFRSSUJVVEVfT1BFUkFUT1IiLCJ1bmlxdWUiLCJhcnIiLCJTZXQiLCJ1bmlxdWVSZWR1Y2UiLCJmbiIsIm5vZGVzIiwicmVkdWNlIiwic2FmZWx5R2VuZXJhdGVUb2tlbnMiLCJzZWxlY3RvciIsInBhcnNlIiwiZXJyIiwiRXJyb3IiLCJtYXRjaEF0dHJpYnV0ZVNlbGVjdG9yIiwibm9kZSIsInRva2VuIiwib3BlcmF0b3IiLCJ2YWx1ZSIsIm5hbWUiLCJub2RlUHJvcHMiLCJkZXNjcmlwdG9yIiwiT2JqZWN0IiwiZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIiwiZ2V0Iiwibm9kZVByb3BWYWx1ZSIsInR5cGUiLCJzcGxpdCIsImluZGV4T2YiLCJzdGFydHNXaXRoIiwic2xpY2UiLCJsZW5ndGgiLCJtYXRjaFBzZXVkb1NlbGVjdG9yIiwicm9vdCIsInBhcmFtZXRlcnMiLCJldmVyeSIsIm4iLCJyZW5kZXJlZCIsImZpcnN0Q2hpbGQiLCJkb2N1bWVudCIsImFkYXB0ZXIiLCJhY3RpdmVFbGVtZW50Iiwibm9kZVRvSG9zdE5vZGUiLCJUeXBlRXJyb3IiLCJub2RlTWF0Y2hlc1Rva2VuIiwiYnVpbGRQcmVkaWNhdGVGcm9tVG9rZW4iLCJib2R5IiwiYm9keVRva2VuIiwiaXNDb21wbGV4U2VsZWN0b3IiLCJ0b2tlbnMiLCJzb21lIiwiaXNFbGVtZW50VHlwZSIsImlzVmFsaWRFbGVtZW50VHlwZSIsIkFycmF5IiwiaXNBcnJheSIsImtleXMiLCJoYXNVbmRlZmluZWRWYWx1ZXMiLCJtYXRjaEFkamFjZW50U2libGluZ3MiLCJwcmVkaWNhdGUiLCJtYXRjaGVzIiwicGFyZW50IiwicGFyZW50Q2hpbGRyZW4iLCJub2RlSW5kZXgiLCJhZGphY2VudFNpYmxpbmciLCJwdXNoIiwibWF0Y2hHZW5lcmFsU2libGluZyIsInlvdW5nZXJTaWJsaW5ncyIsImNvbmNhdCIsImZpbHRlciIsIm1hdGNoRGlyZWN0Q2hpbGQiLCJtYXRjaERlc2NlbmRhbnQiLCJtYXAiLCJjaGlsZHJlbk9mTm9kZSIsImVsZW1lbnRzIiwieCIsInRhZyIsInJlc3VsdHMiLCJpbmRleCIsInJvb3RzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O1FBbVFnQkEsYyxHQUFBQSxjO1FBcUhBQyxvQixHQUFBQSxvQjtRQStFQUMscUIsR0FBQUEscUI7O0FBdmNoQjs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0FBUUE7O0FBQ0E7Ozs7Ozs7O0FBQ0E7QUFDQSxJQUFNQyxTQUFTLHNDQUFmOztBQUVBO0FBQ0EsSUFBTUMsUUFBUSxpQkFBZDtBQUNBLElBQU1DLG1CQUFtQiwyQkFBekI7QUFDQSxJQUFNQyxrQkFBa0IsMEJBQXhCO0FBQ0EsSUFBTUMsYUFBYSxzQkFBbkI7O0FBRUE7QUFDQSxJQUFNQyxXQUFXLFVBQWpCO0FBQ0EsSUFBTUMsZ0JBQWdCLGNBQXRCO0FBQ0EsSUFBTUMsaUJBQWlCLGVBQXZCO0FBQ0EsSUFBTUMs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RUFBeUNvRSxLQUF6QyxFQUFnRDtBQUNyRCxNQUFNRixVQUFVRSxNQUFNUCxHQUFOLENBQVU7QUFBQSxXQUFLM0YscUJBQXFCOEIsUUFBckIsRUFBK0IwQixDQUEvQixDQUFMO0FBQUEsR0FBVixDQUFoQjtBQUNBLFNBQU9sQyxPQUFPLGlDQUFLMEUsT0FBTCxFQUFjLENBQWQsQ0FBUCxDQUFQO0FBQ0QiLCJmaWxlIjoic2VsZWN0b3JzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3JlYXRlUGFyc2VyIH0gZnJvbSAncnN0LXNlbGVjdG9yLXBhcnNlcic7XG5pbXBvcnQgdmFsdWVzIGZyb20gJ29iamVjdC52YWx1ZXMnO1xuaW1wb3J0IGZsYXQgZnJvbSAnYXJyYXkucHJvdG90eXBlLmZsYXQnO1xuaW1wb3J0IGlzIGZyb20gJ29iamVjdC1pcyc7XG5pbXBvcnQgaGFzIGZyb20gJ2hhcyc7XG5pbXBvcnQgZWxlbWVudHNCeUNvbnN0cnVjdG9yIGZyb20gJ2h0bWwtZWxlbWVudC1tYXAvYnlDb25zdHJ1Y3Rvcic7XG5pbXBvcnQge1xuICB0cmVlRmlsdGVyLFxuICBub2RlSGFzSWQsXG4gIGZpbmRQYXJlbnROb2RlLFxuICBub2RlTWF0Y2hlc09iamVjdFByb3BzLFxuICBjaGlsZHJlbk9mTm9kZSxcbiAgaGFzQ2xhc3NOYW1lLFxufSBmcm9tICcuL1JTVFRyYXZlcnNhbCc7XG5pbXBvcnQgeyBub2RlSGFzVHlwZSwgcHJvcHNPZk5vZGUgfSBmcm9tICcuL1V0aWxzJztcbmltcG9ydCBnZXRBZGFwdGVyIGZyb20gJy4vZ2V0QWRhcHRlcic7XG4vLyBvdXIgQ1NTIHNlbGVjdG9yIHBhcnNlciBpbnN0YW5jZVxuY29uc3QgcGFyc2VyID0gY3JlYXRlUGFyc2VyKCk7XG5cbi8vIENvbWJpbmF0b3JzIHRoYXQgYWxsb3cgeW91IHRvIGNoYW5jZSBzZWxlY3RvcnNcbmNvbnN0IENISUxEID0gJ2NoaWxkQ29tYmluYXRvcic7XG5jb25zdCBBREpBQ0VOVF9TSUJMSU5HID0gJ2FkamFjZW50U2libGluZ0NvbWJpbmF0b3InO1xuY29uc3QgR0VORVJBTF9TSUJMSU5HID0gJ2dlbmVyYWxTaWJsaW5nQ29tYmluYXRvcic7XG5jb25zdCBERVNDRU5EQU5UID0gJ2Rlc2NlbmRhbnRDb21iaW5hdG9yJztcblxuLy8gU2VsZWN0b3JzIGZvciB0YXJnZXRpbmcgZWxlbWVudHNcbmNvbnN0IFNFTEVDVE9SID0gJ3NlbGVjdG9yJztcbmNvbnN0IFRZUEVfU0VMRUNUT1IgPSAndHlwZVNlbGVjdG9yJztcbmNvbnN0IENMQVNTX1NFTEVDVE9SID0gJ2NsYXNzU2VsZWN0b3InO1xuY29uc3QgSURfU0VMRUNUT1IgPSAnaWRTZWxlY3Rvcic7XG5jb25zdCBVTklWRVJTQUxfU0VMRUNUT1IgPSAndW5pdmVyc2FsU2VsZWN0b3InO1xuY29uc3QgQVRUUklCVVRFX1BSRVNFTkNFID0gJ2F0dHJpYnV0ZVByZXNlbmNlU2VsZWN0b3InO1xuY29uc3QgQVRUUklCVVRFX1ZBTFVFID0gJ2F0dHJpYnV0ZVZhbHVlU2VsZWN0b3InO1xuLy8gQFRPRE8gd2UgZG9udCBzdXBwb3J0IHRoZXNlLCB0aHJvdyBpZiB0aGV5IGFyZSB1c2VkXG5jb25zdCBQU0VVRE9fQ0xBU1MgPSAncHNldWRvQ2xhc3NTZWxlY3Rvcic7XG5jb25zdCBQU0VVRE9fRUxFTUVOVCA9ICdwc2V1ZG9FbGVtZW50U2VsZWN0b3InO1xuXG5jb25zdCBFWEFDVF9BVFRSSUJVVEVfT1BFUkFUT1IgPSAnPSc7XG5jb25zdCBXSElURUxJU1RfQVRUUklCVVRFX09QRVJBVE9SID0gJ349JztcbmNvbnN0IEhZUEhFTkFURURfQVRUUklCVVRFX09QRVJBVE9SID0gJ3w9JztcbmNvbnN0IFBSRUZJWF9BVFRSSUJVVEVfT1BFUkFUT1IgPSAnXj0nO1xuY29uc3QgU1VGRklYX0FUVFJJQlVURV9PUEVSQVRPUiA9ICckPSc7XG5jb25zdCBTVUJTVFJJTkdfQVRUUklCVVRFX09QRVJBVE9SID0gJyo9JztcblxuZnVuY3Rpb24gdW5pcXVlKGFycikge1xuICByZXR1cm4gWy4uLm5ldyBTZXQoYXJyKV07XG59XG5cbi8qKlxuICogQ2FsbHMgcmVkdWNlIG9uIGEgYXJyYXkgb2Ygbm9kZXMgd2l0aCB0aGUgcGFzc2VkXG4gKiBmdW5jdGlvbiwgcmV0dXJuaW5nIG9ubHkgdW5pcXVlIHJlc3VsdHMuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHBhcmFtIHtBcnJheTxOb2RlPn0gbm9kZXNcbiAqL1xuZnVuY3Rpb24gdW5pcXVlUmVkdWNlKGZuLCBub2Rlcykge1xuICByZXR1cm4gdW5pcXVlKG5vZGVzLnJlZHVjZShmbiwgW10pKTtcbn1cblxuLyoqXG4gKiBUYWtlcyBhIENTUyBzZWxlY3RvciBhbmQgcmV0dXJucyBhIHNldCBvZiB0b2tlbnMgcGFyc2VkXG4gKiBieSBzY2FscGVsLlxuICogQHBhcmFtIHtTdHJpbmd9IHNlbGVjdG9yXG4gKi9cbmZ1bmN0aW9uIHNhZmVseUdlbmVyYXRlVG9rZW5zKHNlbGVjdG9yKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHBhcnNlci5wYXJzZShzZWxlY3Rvcik7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIHBhcnNlIHNlbGVjdG9yOiAke3NlbGVjdG9yfWApO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1hdGNoQXR0cmlidXRlU2VsZWN0b3Iobm9kZSwgdG9rZW4pIHtcbiAgY29uc3QgeyBvcGVyYXRvciwgdmFsdWUsIG5hbWUgfSA9IHRva2VuO1xuICBjb25zdCBub2RlUHJvcHMgPSBwcm9wc09mTm9kZShub2RlKTtcbiAgY29uc3QgZGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iobm9kZVByb3BzLCBuYW1lKTtcbiAgaWYgKGRlc2NyaXB0b3IgJiYgZGVzY3JpcHRvci5nZXQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3Qgbm9kZVByb3BWYWx1ZSA9IG5vZGVQcm9wc1tuYW1lXTtcbiAgaWYgKHR5cGVvZiBub2RlUHJvcFZhbHVlID09PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodG9rZW4udHlwZSA9PT0gQVRUUklCVVRFX1BSRVNFTkNFKSB7XG4gICAgcmV0dXJuIGhhcyhub2RlUHJvcHMsIHRva2VuLm5hbWUpO1xuICB9XG4gIC8vIE9ubHkgdGhlIGV4YWN0IHZhbHVlIG9wZXJhdG9yIChcIj1cIikgY2FuIG1hdGNoIG5vbi1zdHJpbmdzXG4gIGlmICh0eXBlb2Ygbm9kZVByb3BWYWx1ZSAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykge1xuICAgIGlmIChvcGVyYXRvciAhPT0gRVhBQ1RfQVRUUklCVVRFX09QRVJBVE9SKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHN3aXRjaCAob3BlcmF0b3IpIHtcbiAgICAvKipcbiAgICAgKiBSZXByZXNlbnRzIGFuIGVsZW1lbnQgd2l0aCB0aGUgYXR0IGF0dHJpYnV0ZSB3aG9zZSB2YWx1ZSBpcyBleGFjdGx5IFwidmFsXCIuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBbYXR0cj1cInZhbFwiXSBtYXRjaGVzIGF0dHI9XCJ2YWxcIlxuICAgICAqL1xuICAgIGNhc2UgRVhBQ1RfQVRUUklCVVRFX09QRVJBVE9SOlxuICAgICAgcmV0dXJuIGlzKG5vZGVQcm9wVmFsdWUsIHZhbHVlKTtcbiAgICAvKipcbiAgICAgKiBSZXByZXNlbnRzIGFuIGVsZW1lbnQgd2l0aCB0aGUgYXR0IGF0dHJpYnV0ZSB3aG9zZSB2YWx1ZSBpcyBhIHdoaXRlc3BhY2Utc2VwYXJhdGVkXG4gICAgICogbGlzdCBvZiB3b3Jkcywgb25lIG9mIHdoaWNoIGlzIGV4YWN0bHlcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqICBbcmVsfj1cImNvcHlyaWdodFwiXSBtYXRjaGVzIHJlbD1cImNvcHlyaWdodCBvdGhlclwiXG4gICAgICovXG4gICAgY2FzZSBXSElURUxJU1RfQVRUUklCVVRFX09QRVJBVE9SOlxuICAgICAgcmV0dXJuIG5vZGVQcm9wVmFsdWUuc3BsaXQoJyAnKS5pbmRleE9mKHZhbHVlKSAhPT0gLTE7XG4gICAgLyoqXG4gICAgICogUmVwcmVzZW50cyBhbiBlbGVtZW50IHdpdGggdGhlIGF0dCBhdHRyaWJ1dGUsIGl0cyB2YWx1ZSBlaXRoZXIgYmVpbmcgZXhhY3RseSB0aGVcbiAgICAgKiB2YWx1ZSBvciBiZWdpbm5pbmcgd2l0aCB0aGUgdmFsdWUgaW1tZWRpYXRlbHkgZm9sbG93ZWQgYnkgXCItXCJcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIFtocmVmbGFuZ3w9XCJlblwiXSBtYXRjaGVzIGhyZWZsYW5nPVwiZW4tVVNcIlxuICAgICAqL1xuICAgIGNhc2UgSFlQSEVOQVRFRF9BVFRSSUJVVEVfT1BFUkFUT1I6XG4gICAgICByZXR1cm4gbm9kZVByb3BWYWx1ZSA9PT0gdmFsdWUgfHwgbm9kZVByb3BWYWx1ZS5zdGFydHNXaXRoKGAke3ZhbHVlfS1gKTtcbiAgICAvKipcbiAgICAgKiBSZXByZXNlbnRzIGFuIGVsZW1lbnQgd2l0aCB0aGUgYXR0IGF0dHJpYnV0ZSB3aG9zZSB2YWx1ZSBiZWdpbnMgd2l0aCB0aGUgcHJlZml4IHZhbHVlLlxuICAgICAqIElmIHRoZSB2YWx1ZSBpcyB0aGUgZW1wdHkgc3RyaW5nIHRoZW4gdGhlIHNlbGVjdG9yIGRvZXMgbm90IHJlcHJlc2VudCBhbnl0aGluZy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIFt0eXBlXj1cImltYWdlXCJdIG1hdGNoZXMgdHlwZT1cImltYWdlb2JqZWN0XCJcbiAgICAgKi9cbiAgICBjYXNlIFBSRUZJWF9BVFRSSUJVVEVfT1BFUkFUT1I6XG4gICAgICByZXR1cm4gdmFsdWUgPT09ICcnID8gZmFsc2UgOiBub2RlUHJvcFZhbHVlLnNsaWNlKDAsIHZhbHVlLmxlbmd0aCkgPT09IHZhbHVlO1xuICAgIC8qKlxuICAgICAqIFJlcHJlc2VudHMgYW4gZWxlbWVudCB3aXRoIHRoZSBhdHQgYXR0cmlidXRlIHdob3NlIHZhbHVlIGVuZHMgd2l0aCB0aGUgc3VmZml4IHZhbHVlLlxuICAgICAqIElmIHRoZSB2YWx1ZSBpcyB0aGUgZW1wdHkgc3RyaW5nIHRoZW4gdGhlIHNlbGVjdG9yIGRvZXMgbm90IHJlcHJlc2VudCBhbnl0aGluZy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIFt0eXBlJD1cImltYWdlXCJdIG1hdGNoZXMgdHlwZT1cImltYWdlb2JqZWN0XCJcbiAgICAgKi9cbiAgICBjYXNlIFNVRkZJWF9BVFRSSUJVVEVfT1BFUkFUT1I6XG4gICAgICByZXR1cm4gdmFsdWUgPT09ICcnID8gZmFsc2UgOiBub2RlUHJvcFZhbHVlLnNsaWNlKC12YWx1ZS5sZW5ndGgpID09PSB2YWx1ZTtcbiAgICAvKipcbiAgICAgKiBSZXByZXNlbnRzIGFuIGVsZW1lbnQgd2l0aCB0aGUgYXR0IGF0dHJpYnV0ZSB3aG9zZSB2YWx1ZSBjb250YWlucyBhdCBsZWFzdCBvbmVcbiAgICAgKiBpbnN0YW5jZSBvZiB0aGUgdmFsdWUuIElmIHZhbHVlIGlzIHRoZSBlbXB0eSBzdHJpbmcgdGhlbiB0aGVcbiAgICAgKiBzZWxlY3RvciBkb2VzIG5vdCByZXByZXNlbnQgYW55dGhpbmcuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBbdGl0bGUqPVwiaGVsbG9cIl0gbWF0Y2hlcyB0aXRsZT1cIndlbGwgaGVsbG8gdGhlcmVcIlxuICAgICAqL1xuICAgIGNhc2UgU1VCU1RSSU5HX0FUVFJJQlVURV9PUEVSQVRPUjpcbiAgICAgIHJldHVybiB2YWx1ZSA9PT0gJycgPyBmYWxzZSA6IG5vZGVQcm9wVmFsdWUuaW5kZXhPZih2YWx1ZSkgIT09IC0xO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEVuenltZTo6U2VsZWN0b3I6IFVua25vd24gYXR0cmlidXRlIHNlbGVjdG9yIG9wZXJhdG9yIFwiJHtvcGVyYXRvcn1cImApO1xuICB9XG59XG5cblxuZnVuY3Rpb24gbWF0Y2hQc2V1ZG9TZWxlY3Rvcihub2RlLCB0b2tlbiwgcm9vdCkge1xuICBjb25zdCB7IG5hbWUsIHBhcmFtZXRlcnMgfSA9IHRva2VuO1xuICBpZiAobmFtZSA9PT0gJ25vdCcpIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdXNlLWJlZm9yZS1kZWZpbmVcbiAgICByZXR1cm4gcGFyYW1ldGVycy5ldmVyeShzZWxlY3RvciA9PiByZWR1Y2VUcmVlQnlTZWxlY3RvcihzZWxlY3Rvciwgbm9kZSkubGVuZ3RoID09PSAwKTtcbiAgfVxuICBpZiAobmFtZSA9PT0gJ2VtcHR5Jykge1xuICAgIHJldHVybiB0cmVlRmlsdGVyKG5vZGUsIG4gPT4gbiAhPT0gbm9kZSkubGVuZ3RoID09PSAwO1xuICB9XG4gIGlmIChuYW1lID09PSAnZmlyc3QtY2hpbGQnKSB7XG4gICAgY29uc3QgeyByZW5kZXJlZCB9ID0gZmluZFBhcmVudE5vZGUocm9vdCwgbm9kZSk7XG4gICAgY29uc3QgW2ZpcnN0Q2hpbGRdID0gcmVuZGVyZWQ7XG4gICAgcmV0dXJuIGZpcnN0Q2hpbGQgPT09IG5vZGU7XG4gIH1cbiAgaWYgKG5hbWUgPT09ICdsYXN0LWNoaWxkJykge1xuICAgIGNvbnN0IHsgcmVuZGVyZWQgfSA9IGZpbmRQYXJlbnROb2RlKHJvb3QsIG5vZGUpO1xuICAgIHJldHVybiByZW5kZXJlZFtyZW5kZXJlZC5sZW5ndGggLSAxXSA9PT0gbm9kZTtcbiAgfVxuICBpZiAobmFtZSA9PT0gJ2ZvY3VzJykge1xuICAgIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0VuenltZTo6U2VsZWN0b3IgZG9lcyBub3Qgc3VwcG9ydCB0aGUgXCI6Zm9jdXNcIiBwc2V1ZG8tZWxlbWVudCB3aXRob3V0IGEgZ2xvYmFsIGBkb2N1bWVudGAuJyk7XG4gICAgfVxuICAgIGNvbnN0IGFkYXB0ZXIgPSBnZXRBZGFwdGVyKCk7XG4gICAgLyogZXNsaW50LWVudiBicm93c2VyICovXG4gICAgcmV0dXJuIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgJiYgYWRhcHRlci5ub2RlVG9Ib3N0Tm9kZShub2RlKSA9PT0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoYEVuenltZTo6U2VsZWN0b3IgZG9lcyBub3Qgc3VwcG9ydCB0aGUgXCIke3Rva2VuLm5hbWV9XCIgcHNldWRvLWVsZW1lbnQgb3IgcHNldWRvLWNsYXNzIHNlbGVjdG9ycy5gKTtcbn1cblxuLyoqXG4gKiBUYWtlcyBhIG5vZGUgYW5kIGEgdG9rZW4gYW5kIGRldGVybWluZXMgaWYgdGhlIG5vZGVcbiAqIG1hdGNoZXMgdGhlIHByZWRpY2F0ZSBkZWZpbmVkIGJ5IHRoZSB0b2tlbi5cbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZVxuICogQHBhcmFtIHtUb2tlbn0gdG9rZW5cbiAqL1xuZnVuY3Rpb24gbm9kZU1hdGNoZXNUb2tlbihub2RlLCB0b2tlbiwgcm9vdCkge1xuICBpZiAobm9kZSA9PT0gbnVsbCB8fCB0eXBlb2Ygbm9kZSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgc3dpdGNoICh0b2tlbi50eXBlKSB7XG4gICAgLyoqXG4gICAgICogTWF0Y2ggZXZlcnkgbm9kZVxuICAgICAqIEBleGFtcGxlICcqJyBtYXRjaGVzIGV2ZXJ5IG5vZGVcbiAgICAgKi9cbiAgICBjYXNlIFVOSVZFUlNBTF9TRUxFQ1RPUjpcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIC8qKlxuICAgICAqIE1hdGNoIGFnYWluc3QgdGhlIGNsYXNzTmFtZSBwcm9wXG4gICAgICogQGV4YW1wbGUgJy5hY3RpdmUnIG1hdGNoZXMgPGRpdiBjbGFzc05hbWU9J2FjdGl2ZScgLz5cbiAgICAgKi9cbiAgICBjYXNlIENMQVNTX1NFTEVDVE9SOlxuICAgICAgcmV0dXJuIGhhc0NsYXNzTmFtZShub2RlLCB0b2tlbi5uYW1lKTtcbiAgICAvKipcbiAgICAgKiBTaW1wbGUgdHlwZSBtYXRjaGluZ1xuICAgICAqIEBleGFtcGxlICdkaXYnIG1hdGNoZXMgPGRpdiAvPlxuICAgICAqL1xuICAgIGNhc2UgVFlQRV9TRUxFQ1RPUjpcbiAgICAgIHJldHVybiBub2RlSGFzVHlwZShub2RlLCB0b2tlbi5uYW1lKTtcbiAgICAvKipcbiAgICAgKiBNYXRjaCBhZ2FpbnN0IHRoZSBgaWRgIHByb3BcbiAgICAgKiBAZXhhbXBsZSAnI25hdicgbWF0Y2hlcyA8dWwgaWQ9XCJuYXZcIiAvPlxuICAgICAqL1xuICAgIGNhc2UgSURfU0VMRUNUT1I6XG4gICAgICByZXR1cm4gbm9kZUhhc0lkKG5vZGUsIHRva2VuLm5hbWUpO1xuICAgIC8qKlxuICAgICAqIE1hdGNoZXMgaWYgYW4gYXR0cmlidXRlIGlzIHByZXNlbnQsIHJlZ2FyZGxlc3NcbiAgICAgKiBvZiBpdHMgdmFsdWVcbiAgICAgKiBAZXhhbXBsZSAnW2Rpc2FibGVkXScgbWF0Y2hlcyA8YSBkaXNhYmxlZCAvPlxuICAgICAqL1xuICAgIGNhc2UgQVRUUklCVVRFX1BSRVNFTkNFOlxuICAgICAgcmV0dXJuIG1hdGNoQXR0cmlidXRlU2VsZWN0b3Iobm9kZSwgdG9rZW4pO1xuICAgIC8qKlxuICAgICAqIE1hdGNoZXMgaWYgYW4gYXR0cmlidXRlIGlzIHByZXNlbnQgd2l0aCB0aGVcbiAgICAgKiBwcm92aWRlZCB2YWx1ZVxuICAgICAqIEBleGFtcGxlICdbZGF0YS1mb289Zm9vXScgbWF0Y2hlcyA8ZGl2IGRhdGEtZm9vPVwiZm9vXCIgLz5cbiAgICAgKi9cbiAgICBjYXNlIEFUVFJJQlVURV9WQUxVRTpcbiAgICAgIHJldHVybiBtYXRjaEF0dHJpYnV0ZVNlbGVjdG9yKG5vZGUsIHRva2VuKTtcbiAgICBjYXNlIFBTRVVET19FTEVNRU5UOlxuICAgIGNhc2UgUFNFVURPX0NMQVNTOlxuICAgICAgcmV0dXJuIG1hdGNoUHNldWRvU2VsZWN0b3Iobm9kZSwgdG9rZW4sIHJvb3QpO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gdG9rZW4gdHlwZTogJHt0b2tlbi50eXBlfWApO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhIHByZWRpY2F0ZSBmdW5jdGlvbiB0aGF0IGNoZWNrcyBpZiBhXG4gKiBub2RlIG1hdGNoZXMgZXZlcnkgdG9rZW4gaW4gdGhlIGJvZHkgb2YgYSBzZWxlY3RvclxuICogdG9rZW4uXG4gKiBAcGFyYW0ge1Rva2VufSB0b2tlblxuICovXG5mdW5jdGlvbiBidWlsZFByZWRpY2F0ZUZyb21Ub2tlbih0b2tlbiwgcm9vdCkge1xuICByZXR1cm4gbm9kZSA9PiB0b2tlbi5ib2R5LmV2ZXJ5KGJvZHlUb2tlbiA9PiBub2RlTWF0Y2hlc1Rva2VuKG5vZGUsIGJvZHlUb2tlbiwgcm9vdCkpO1xufVxuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBhIHBhcnNlZCBzZWxlY3RvciBpcyBhIGNvbXBsZXggc2VsZWN0b3IsIHdoaWNoXG4gKiBpcyBkZWZpbmVkIGFzIGEgc2VsZWN0b3IgdGhhdCBjb250YWlucyBjb21iaW5hdG9ycy5cbiAqIEBwYXJhbSB7QXJyYXk8VG9rZW4+fSB0b2tlbnNcbiAqL1xuZnVuY3Rpb24gaXNDb21wbGV4U2VsZWN0b3IodG9rZW5zKSB7XG4gIHJldHVybiB0b2tlbnMuc29tZSh0b2tlbiA9PiB0b2tlbi50eXBlICE9PSBTRUxFQ1RPUik7XG59XG5cblxuLyoqXG4gKiBUYWtlcyBhIGNvbXBvbmVudCBjb25zdHJ1Y3Rvciwgb2JqZWN0LCBvciBzdHJpbmcgcmVwcmVzZW50aW5nXG4gKiBhIHNpbXBsZSBzZWxlY3RvciBhbmQgcmV0dXJucyBhIHByZWRpY2F0ZSBmdW5jdGlvbiB0aGF0IGNhblxuICogYmUgYXBwbGllZCB0byBhIHNpbmdsZSBub2RlLlxuICogQHBhcmFtIHtFbnp5bWVTZWxlY3Rvcn0gc2VsZWN0b3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkUHJlZGljYXRlKHNlbGVjdG9yKSB7XG4gIC8vIElmIHRoZSBzZWxlY3RvciBpcyBhIHN0cmluZywgcGFyc2UgaXQgYXMgYSBzaW1wbGUgQ1NTIHNlbGVjdG9yXG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdzdHJpbmcnKSB7XG4gICAgY29uc3QgdG9rZW5zID0gc2FmZWx5R2VuZXJhdGVUb2tlbnMoc2VsZWN0b3IpO1xuICAgIGlmIChpc0NvbXBsZXhTZWxlY3Rvcih0b2tlbnMpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGlzIG1ldGhvZCBkb2VzIG5vdCBzdXBwb3J0IGNvbXBsZXggQ1NTIHNlbGVjdG9ycycpO1xuICAgIH1cbiAgICAvLyBTaW1wbGUgc2VsZWN0b3JzIG9ubHkgaGF2ZSBhIHNpbmdsZSBzZWxlY3RvciB0b2tlblxuICAgIHJldHVybiBidWlsZFByZWRpY2F0ZUZyb21Ub2tlbih0b2tlbnNbMF0pO1xuICB9XG5cbiAgLy8gSWYgdGhlIHNlbGVjdG9yIGlzIGFuIGVsZW1lbnQgdHlwZSwgY2hlY2sgaWYgdGhlIG5vZGUncyB0eXBlIG1hdGNoZXNcbiAgY29uc3QgYWRhcHRlciA9IGdldEFkYXB0ZXIoKTtcbiAgY29uc3QgaXNFbGVtZW50VHlwZSA9IGFkYXB0ZXIuaXNWYWxpZEVsZW1lbnRUeXBlXG4gICAgPyBhZGFwdGVyLmlzVmFsaWRFbGVtZW50VHlwZShzZWxlY3RvcilcbiAgICA6IHR5cGVvZiBzZWxlY3RvciA9PT0gJ2Z1bmN0aW9uJztcbiAgaWYgKGlzRWxlbWVudFR5cGUpIHtcbiAgICByZXR1cm4gbm9kZSA9PiBub2RlICYmIG5vZGUudHlwZSA9PT0gc2VsZWN0b3I7XG4gIH1cbiAgLy8gSWYgdGhlIHNlbGVjdG9yIGlzIGFuIG5vbi1lbXB0eSBvYmplY3QsIHRyZWF0IHRoZSBrZXlzL3ZhbHVlcyBhcyBwcm9wc1xuICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnb2JqZWN0Jykge1xuICAgIGlmICghQXJyYXkuaXNBcnJheShzZWxlY3RvcikgJiYgc2VsZWN0b3IgIT09IG51bGwgJiYgT2JqZWN0LmtleXMoc2VsZWN0b3IpLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGhhc1VuZGVmaW5lZFZhbHVlcyA9IHZhbHVlcyhzZWxlY3Rvcikuc29tZSh2YWx1ZSA9PiB0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKTtcbiAgICAgIGlmIChoYXNVbmRlZmluZWRWYWx1ZXMpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRW56eW1lOjpQcm9wcyBjYW7igJl0IGhhdmUgYHVuZGVmaW5lZGAgdmFsdWVzLiBUcnkgdXNpbmcg4oCYZmluZFdoZXJlKCnigJkgaW5zdGVhZC4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBub2RlID0+IG5vZGVNYXRjaGVzT2JqZWN0UHJvcHMobm9kZSwgc2VsZWN0b3IpO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFbnp5bWU6OlNlbGVjdG9yIGRvZXMgbm90IHN1cHBvcnQgYW4gYXJyYXksIG51bGwsIG9yIGVtcHR5IG9iamVjdCBhcyBhIHNlbGVjdG9yJyk7XG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFbnp5bWU6OlNlbGVjdG9yIGV4cGVjdHMgYSBzdHJpbmcsIG9iamVjdCwgb3IgdmFsaWQgZWxlbWVudCB0eXBlIChDb21wb25lbnQgQ29uc3RydWN0b3IpJyk7XG59XG5cbi8qKlxuICogTWF0Y2hlcyBvbmx5IG5vZGVzIHdoaWNoIGFyZSBhZGphY2VudCBzaWJsaW5ncyAoZGlyZWN0IG5leHQgc2libGluZylcbiAqIGFnYWluc3QgYSBwcmVkaWNhdGUsIHJldHVybmluZyB0aG9zZSB0aGF0IG1hdGNoLlxuICogQHBhcmFtIHtBcnJheTxOb2RlPn0gbm9kZXNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWRpY2F0ZVxuICogQHBhcmFtIHtOb2RlfSByb290XG4gKi9cbmZ1bmN0aW9uIG1hdGNoQWRqYWNlbnRTaWJsaW5ncyhub2RlcywgcHJlZGljYXRlLCByb290KSB7XG4gIHJldHVybiBub2Rlcy5yZWR1Y2UoKG1hdGNoZXMsIG5vZGUpID0+IHtcbiAgICBjb25zdCBwYXJlbnQgPSBmaW5kUGFyZW50Tm9kZShyb290LCBub2RlKTtcbiAgICAvLyBJZiB0aGVyZSdzIG5vIHBhcmVudCwgdGhlcmUncyBubyBzaWJsaW5nc1xuICAgIGlmICghcGFyZW50KSB7XG4gICAgICByZXR1cm4gbWF0Y2hlcztcbiAgICB9XG4gICAgY29uc3QgcGFyZW50Q2hpbGRyZW4gPSBjaGlsZHJlbk9mTm9kZShwYXJlbnQpO1xuICAgIGNvbnN0IG5vZGVJbmRleCA9IHBhcmVudENoaWxkcmVuLmluZGV4T2Yobm9kZSk7XG4gICAgY29uc3QgYWRqYWNlbnRTaWJsaW5nID0gcGFyZW50Q2hpbGRyZW5bbm9kZUluZGV4ICsgMV07XG4gICAgLy8gTm8gc2libGluZ1xuICAgIGlmICghYWRqYWNlbnRTaWJsaW5nKSB7XG4gICAgICByZXR1cm4gbWF0Y2hlcztcbiAgICB9XG4gICAgaWYgKHByZWRpY2F0ZShhZGphY2VudFNpYmxpbmcpKSB7XG4gICAgICBtYXRjaGVzLnB1c2goYWRqYWNlbnRTaWJsaW5nKTtcbiAgICB9XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH0sIFtdKTtcbn1cblxuLyoqXG4gKiBNYXRjaGVzIG9ubHkgbm9kZXMgd2hpY2ggYXJlIGdlbmVyYWwgc2libGluZ3MgKGFueSBzaWJsaW5nICphZnRlciopXG4gKiBhZ2FpbnN0IGEgcHJlZGljYXRlLCByZXR1cm5pbmcgdGhvc2UgdGhhdCBtYXRjaC5cbiAqIEBwYXJhbSB7QXJyYXk8Tm9kZT59IG5vZGVzXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkaWNhdGVcbiAqIEBwYXJhbSB7Tm9kZX0gcm9vdFxuICovXG5mdW5jdGlvbiBtYXRjaEdlbmVyYWxTaWJsaW5nKG5vZGVzLCBwcmVkaWNhdGUsIHJvb3QpIHtcbiAgcmV0dXJuIHVuaXF1ZVJlZHVjZSgobWF0Y2hlcywgbm9kZSkgPT4ge1xuICAgIGNvbnN0IHBhcmVudCA9IGZpbmRQYXJlbnROb2RlKHJvb3QsIG5vZGUpO1xuICAgIGlmICghcGFyZW50KSB7XG4gICAgICByZXR1cm4gbWF0Y2hlcztcbiAgICB9XG4gICAgY29uc3QgcGFyZW50Q2hpbGRyZW4gPSBjaGlsZHJlbk9mTm9kZShwYXJlbnQpO1xuICAgIGNvbnN0IG5vZGVJbmRleCA9IHBhcmVudENoaWxkcmVuLmluZGV4T2Yobm9kZSk7XG4gICAgY29uc3QgeW91bmdlclNpYmxpbmdzID0gcGFyZW50Q2hpbGRyZW4uc2xpY2Uobm9kZUluZGV4ICsgMSk7XG4gICAgcmV0dXJuIG1hdGNoZXMuY29uY2F0KHlvdW5nZXJTaWJsaW5ncy5maWx0ZXIocHJlZGljYXRlKSk7XG4gIH0sIG5vZGVzKTtcbn1cblxuLyoqXG4gKiBNYXRjaGVzIG9ubHkgbm9kZXMgd2hpY2ggYXJlIGRpcmVjdCBjaGlsZHJlbiAobm90IGdyYW5kY2hpbGRyZW4sIGV0Yy4pXG4gKiBhZ2FpbnN0IGEgcHJlZGljYXRlLCByZXR1cm5pbmcgdGhvc2UgdGhhdCBtYXRjaC5cbiAqIEBwYXJhbSB7QXJyYXk8Tm9kZT59IG5vZGVzXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkaWNhdGVcbiAqL1xuZnVuY3Rpb24gbWF0Y2hEaXJlY3RDaGlsZChub2RlcywgcHJlZGljYXRlKSB7XG4gIHJldHVybiB1bmlxdWVSZWR1Y2UoXG4gICAgKG1hdGNoZXMsIG5vZGUpID0+IG1hdGNoZXMuY29uY2F0KGNoaWxkcmVuT2ZOb2RlKG5vZGUpLmZpbHRlcihwcmVkaWNhdGUpKSxcbiAgICBub2RlcyxcbiAgKTtcbn1cblxuLyoqXG4gKiBNYXRjaGVzIGFsbCBkZXNjZW5kYW50IG5vZGVzIGFnYWluc3QgYSBwcmVkaWNhdGUsXG4gKiByZXR1cm5pbmcgdGhvc2UgdGhhdCBtYXRjaC5cbiAqIEBwYXJhbSB7QXJyYXk8Tm9kZT59IG5vZGVzXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkaWNhdGVcbiAqL1xuZnVuY3Rpb24gbWF0Y2hEZXNjZW5kYW50KG5vZGVzLCBwcmVkaWNhdGUpIHtcbiAgcmV0dXJuIHVuaXF1ZVJlZHVjZShcbiAgICAobWF0Y2hlcywgbm9kZSkgPT4gbWF0Y2hlcy5jb25jYXQodHJlZUZpbHRlcihub2RlLCBwcmVkaWNhdGUpKSxcbiAgICBmbGF0KG5vZGVzLm1hcChjaGlsZHJlbk9mTm9kZSkpLFxuICApO1xufVxuXG4vKipcbiAqIFRha2VzIGFuIFJTVCBhbmQgcmVkdWNlcyBpdCB0byBhIHNldCBvZiBub2RlcyBtYXRjaGluZ1xuICogdGhlIHNlbGVjdG9yLiBUaGUgc2VsZWN0b3IgY2FuIGJlIGEgc2ltcGxlIHNlbGVjdG9yLCB3aGljaFxuICogaXMgaGFuZGxlZCBieSBgYnVpbGRQcmVkaWNhdGVgLCBvciBhIGNvbXBsZXggQ1NTIHNlbGVjdG9yIHdoaWNoXG4gKiByZWR1Y2VUcmVlQnlTZWxlY3RvciBwYXJzZXMgYW5kIHJlZHVjZXMgdGhlIHRyZWUgYmFzZWQgb24gdGhlIGNvbWJpbmF0b3JzLlxuICpcbiAqIEBwYXJhbSB7RW56eW1lU2VsZWN0b3J9IHNlbGVjdG9yXG4gKiBAcGFyYW0ge1JTVE5vZGV9IHJvb3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZHVjZVRyZWVCeVNlbGVjdG9yKHNlbGVjdG9yLCByb290KSB7XG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgIT09ICdzdHJpbmcnKSB7XG4gICAgY29uc3QgZWxlbWVudHMgPSBlbGVtZW50c0J5Q29uc3RydWN0b3Ioc2VsZWN0b3IpO1xuICAgIGlmIChlbGVtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm4gZmxhdChlbGVtZW50cy5tYXAoeCA9PiByZWR1Y2VUcmVlQnlTZWxlY3Rvcih4LnRhZywgcm9vdCkpKTtcblxuICAgICAgLy8gd2hlbiBodHRwczovL2dpdGh1Yi5jb20vYXdlYXJ5L3JzdC1zZWxlY3Rvci1wYXJzZXIvaXNzdWVzLzE1IGlzIHJlc29sdmVkXG4gICAgICAvLyBjb25zdCBodG1sVGFnTmFtZXMgPSBlbGVtZW50cy5tYXAoeCA9PiB4LnRhZykuam9pbignLCAnKTtcbiAgICAgIC8vIHJldHVybiByZWR1Y2VUcmVlQnlTZWxlY3RvcihodG1sVGFnTmFtZXMsIHJvb3QpO1xuICAgIH1cbiAgfVxuXG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIHNlbGVjdG9yID09PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiB0cmVlRmlsdGVyKHJvb3QsIGJ1aWxkUHJlZGljYXRlKHNlbGVjdG9yKSk7XG4gIH1cblxuICBsZXQgcmVzdWx0cyA9IFtdO1xuICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnc3RyaW5nJykge1xuICAgIGNvbnN0IHRva2VucyA9IHNhZmVseUdlbmVyYXRlVG9rZW5zKHNlbGVjdG9yKTtcbiAgICBsZXQgaW5kZXggPSAwO1xuICAgIHdoaWxlIChpbmRleCA8IHRva2Vucy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHRva2VuID0gdG9rZW5zW2luZGV4XTtcbiAgICAgIC8qKlxuICAgICAgICogVGhlcmUgYXJlIHR3byB0eXBlcyBvZiB0b2tlbnMgaW4gYSBDU1Mgc2VsZWN0b3I6XG4gICAgICAgKlxuICAgICAgICogMS4gU2VsZWN0b3IgdG9rZW5zLiBUaGVzZSB0YXJnZXQgbm9kZXMgZGlyZWN0bHksIGxpa2VcbiAgICAgICAqICAgIHR5cGUgb3IgYXR0cmlidXRlIHNlbGVjdG9ycy4gVGhlc2UgYXJlIGVhc3kgdG8gYXBwbHlcbiAgICAgICAqICAgIGJlY2F1c2Ugd2UgY2FuIHRyYXZlcnNlIHRoZSB0cmVlIGFuZCByZXR1cm4gb25seVxuICAgICAgICogICAgdGhlIG5vZGVzIHRoYXQgbWF0Y2ggdGhlIHByZWRpY2F0ZS5cbiAgICAgICAqXG4gICAgICAgKiAyLiBDb21iaW5hdG9yIHRva2Vucy4gVGhlc2UgdG9rZW5zIGNoYWluIHRvZ2V0aGVyXG4gICAgICAgKiAgICBzZWxlY3RvciBub2Rlcy4gRm9yIGV4YW1wbGUgPiBmb3IgY2hpbGRyZW4sIG9yICtcbiAgICAgICAqICAgIGZvciBhZGphY2VudCBzaWJsaW5ncy4gVGhlc2UgYXJlIGhhcmRlciB0byBtYXRjaFxuICAgICAgICogICAgYXMgd2UgaGF2ZSB0byB0cmFjayB3aGVyZSBpbiB0aGUgdHJlZSB3ZSBhcmVcbiAgICAgICAqICAgIHRvIGRldGVybWluZSBpZiBhIHNlbGVjdG9yIG5vZGUgYXBwbGllcyBvciBub3QuXG4gICAgICAgKi9cbiAgICAgIGlmICh0b2tlbi50eXBlID09PSBTRUxFQ1RPUikge1xuICAgICAgICBjb25zdCBwcmVkaWNhdGUgPSBidWlsZFByZWRpY2F0ZUZyb21Ub2tlbih0b2tlbiwgcm9vdCk7XG4gICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmNvbmNhdCh0cmVlRmlsdGVyKHJvb3QsIHByZWRpY2F0ZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gV2UgY2FuIGFzc3VtZSB0aGVyZSBhbHdheXMgYWxsIHByZXZpb3VzbHkgbWF0Y2hlZCB0b2tlbnMgc2luY2Ugc2VsZWN0b3JzXG4gICAgICAgIC8vIGNhbm5vdCBzdGFydCB3aXRoIGNvbWJpbmF0b3JzLlxuICAgICAgICBjb25zdCB7IHR5cGUgfSA9IHRva2VuO1xuICAgICAgICAvLyBXZSBhc3N1bWUgdGhlIG5leHQgdG9rZW4gaXMgYSBzZWxlY3Rvciwgc28gbW92ZSB0aGUgaW5kZXhcbiAgICAgICAgLy8gZm9yd2FyZCBhbmQgYnVpbGQgdGhlIHByZWRpY2F0ZS5cbiAgICAgICAgaW5kZXggKz0gMTtcbiAgICAgICAgY29uc3QgcHJlZGljYXRlID0gYnVpbGRQcmVkaWNhdGVGcm9tVG9rZW4odG9rZW5zW2luZGV4XSwgcm9vdCk7XG4gICAgICAgIC8vIFdlIG1hdGNoIGFnYWluc3Qgb25seSB0aGUgbm9kZXMgd2hpY2ggaGF2ZSBhbHJlYWR5IGJlZW4gbWF0Y2hlZCxcbiAgICAgICAgLy8gc2luY2UgYSBjb21iaW5hdG9yIGlzIG1lYW50IHRvIHJlZmluZSBhIHByZXZpb3VzIHNlbGVjdG9yLlxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAvLyBUaGUgKyBjb21iaW5hdG9yXG4gICAgICAgICAgY2FzZSBBREpBQ0VOVF9TSUJMSU5HOlxuICAgICAgICAgICAgcmVzdWx0cyA9IG1hdGNoQWRqYWNlbnRTaWJsaW5ncyhyZXN1bHRzLCBwcmVkaWNhdGUsIHJvb3QpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgLy8gVGhlIH4gY29tYmluYXRvclxuICAgICAgICAgIGNhc2UgR0VORVJBTF9TSUJMSU5HOlxuICAgICAgICAgICAgcmVzdWx0cyA9IG1hdGNoR2VuZXJhbFNpYmxpbmcocmVzdWx0cywgcHJlZGljYXRlLCByb290KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIC8vIFRoZSA+IGNvbWJpbmF0b3JcbiAgICAgICAgICBjYXNlIENISUxEOlxuICAgICAgICAgICAgcmVzdWx0cyA9IG1hdGNoRGlyZWN0Q2hpbGQocmVzdWx0cywgcHJlZGljYXRlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIC8vIFRoZSAnICcgKHdoaXRlc3BhY2UpIGNvbWJpbmF0b3JcbiAgICAgICAgICBjYXNlIERFU0NFTkRBTlQ6IHtcbiAgICAgICAgICAgIHJlc3VsdHMgPSBtYXRjaERlc2NlbmRhbnQocmVzdWx0cywgcHJlZGljYXRlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGNvbWJpbmF0b3Igc2VsZWN0b3I6ICR7dHlwZX1gKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaW5kZXggKz0gMTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRW56eW1lOjpTZWxlY3RvciBleHBlY3RzIGEgc3RyaW5nLCBvYmplY3QsIG9yIENvbXBvbmVudCBDb25zdHJ1Y3RvcicpO1xuICB9XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVkdWNlVHJlZXNCeVNlbGVjdG9yKHNlbGVjdG9yLCByb290cykge1xuICBjb25zdCByZXN1bHRzID0gcm9vdHMubWFwKG4gPT4gcmVkdWNlVHJlZUJ5U2VsZWN0b3Ioc2VsZWN0b3IsIG4pKTtcbiAgcmV0dXJuIHVuaXF1ZShmbGF0KHJlc3VsdHMsIDEpKTtcbn1cbiJdfQ==
//# sourceMappingURL=selectors.js.map