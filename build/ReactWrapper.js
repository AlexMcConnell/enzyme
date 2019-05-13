'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _object = require('object.assign');

var _object2 = _interopRequireDefault(_object);

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

var _arrayPrototype = require('array.prototype.flat');

var _arrayPrototype2 = _interopRequireDefault(_arrayPrototype);

var _has = require('has');

var _has2 = _interopRequireDefault(_has);

var _Utils = require('./Utils');

var _getAdapter = require('./getAdapter');

var _getAdapter2 = _interopRequireDefault(_getAdapter);

var _Debug = require('./Debug');

var _RSTTraversal = require('./RSTTraversal');

var _selectors = require('./selectors');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var NODE = (0, _Utils.sym)('__node__');
var NODES = (0, _Utils.sym)('__nodes__');
var RENDERER = (0, _Utils.sym)('__renderer__');
var UNRENDERED = (0, _Utils.sym)('__unrendered__');
var ROOT = (0, _Utils.sym)('__root__');
var OPTIONS = (0, _Utils.sym)('__options__');
var ROOT_NODES = (0, _Utils.sym)('__rootNodes__');
var WRAPPING_COMPONENT = (0, _Utils.sym)('__wrappingComponent__');
var LINKED_ROOTS = (0, _Utils.sym)('__linkedRoots__');
var UPDATED_BY = (0, _Utils.sym)('__updatedBy__');

/**
 * Finds all nodes in the current wrapper nodes' render trees that match the provided predicate
 * function.
 *
 * @param {ReactWrapper} wrapper
 * @param {Function} predicate
 * @param {Function} filter
 * @returns {ReactWrapper}
 */
function findWhereUnwrapped(wrapper, predicate) {
  var filter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _RSTTraversal.treeFilter;

  return wrapper.flatMap(function (n) {
    return filter(n.getNodeInternal(), predicate);
  });
}

/**
 * Returns a new wrapper instance with only the nodes of the current wrapper instance that match
 * the provided predicate function.
 *
 * @param {ReactWrapper} wrapper
 * @param {Function} predicate
 * @returns {ReactWrapper}
 */
function filterWhereUnwrapped(wrapper, predicate) {
  return wrapper.wrap(wrapper.getNodesInternal().filter(predicate).filter(Boolean));
}

function getRootNodeInternal(wrapper) {
  if (wrapper[ROOT].length !== 1) {
    throw new Error('getRootNodeInternal(wrapper) can only be called when wrapper wraps one node');
  }
  if (wrapper[ROOT] !== wrapper) {
    return wrapper[ROOT_NODES][0];
  }
  return wrapper[ROOT][NODE];
}

function nodeParents(wrapper, node) {
  return (0, _RSTTraversal.parentsOfNode)(node, getRootNodeInternal(wrapper));
}

function privateSetNodes(wrapper, nodes) {
  if (!nodes) {
    (0, _Utils.privateSet)(wrapper, NODE, null);
    (0, _Utils.privateSet)(wrapper, NODES, []);
  } else if (!Array.isArray(nodes)) {
    (0, _Utils.privateSet)(wrapper, NODE, nodes);
    (0, _Utils.privateSet)(wrapper, NODES, [nodes]);
  } else {
    (0, _Utils.privateSet)(wrapper, NODE, nodes[0]);
    (0, _Utils.privateSet)(wrapper, NODES, nodes);
  }
  (0, _Utils.privateSet)(wrapper, 'length', wrapper[NODES].length);
}

/**
 * @class ReactWrapper
 */

var ReactWrapper = function () {
  function ReactWrapper(nodes, root) {
    var passedOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, ReactWrapper);

    if (!global.window && !global.document) {
      throw new Error('It looks like you called `mount()` without a global document being loaded.');
    }
    var options = (0, _Utils.makeOptions)(passedOptions);

    if (!root) {
      var adapter = (0, _getAdapter2['default'])(options);
      if (!adapter.isValidElement(nodes)) {
        throw new TypeError('ReactWrapper can only wrap valid elements');
      }

      var renderer = adapter.createRenderer((0, _object2['default'])({ mode: 'mount' }, options));
      (0, _Utils.privateSet)(this, RENDERER, renderer);
      renderer.render(nodes, options.context);
      (0, _Utils.privateSet)(this, ROOT, this);
      privateSetNodes(this, this[RENDERER].getNode());
      (0, _Utils.privateSet)(this, OPTIONS, options);
      (0, _Utils.privateSet)(this, LINKED_ROOTS, []);

      if ((0, _Utils.isCustomComponent)(options.wrappingComponent, adapter)) {
        if (typeof this[RENDERER].getWrappingComponentRenderer !== 'function') {
          throw new TypeError('your adapter does not support `wrappingComponent`. Try upgrading it!');
        }

        // eslint-disable-next-line no-use-before-define
        (0, _Utils.privateSet)(this, WRAPPING_COMPONENT, new WrappingComponentWrapper(this, this[RENDERER].getWrappingComponentRenderer()));
        this[LINKED_ROOTS].push(this[WRAPPING_COMPONENT]);
      }
    } else {
      (0, _Utils.privateSet)(this, RENDERER, root[RENDERER]);
      (0, _Utils.privateSet)(this, ROOT, root);
      privateSetNodes(this, nodes);
      (0, _Utils.privateSet)(this, ROOT_NODES, root[NODES]);
      (0, _Utils.privateSet)(this, OPTIONS, root[OPTIONS]);
      (0, _Utils.privateSet)(this, LINKED_ROOTS, []);
    }
    (0, _Utils.privateSet)(this, UNRENDERED, nodes);
    (0, _Utils.privateSet)(this, UPDATED_BY, null);
  }

  /**
   * Returns the root wrapper
   *
   * @return {ReactWrapper}
   */


  _createClass(ReactWrapper, [{
    key: 'root',
    value: function () {
      function root() {
        return this[ROOT];
      }

      return root;
    }()

    /**
     * Returns the wrapped component.
     *
     * @return {ReactComponent}
     */

  }, {
    key: 'getNodeInternal',
    value: function () {
      function getNodeInternal() {
        if (this.length !== 1) {
          throw new Error('ReactWrapper::getNode() can only be called when wrapping one node');
        }
        return this[NODES][0];
      }

      return getNodeInternal;
    }()

    /**
     * Returns the the wrapped components.
     *
     * @return {Array<ReactComponent>}
     */

  }, {
    key: 'getNodesInternal',
    value: function () {
      function getNodesInternal() {
        return this[NODES];
      }

      return getNodesInternal;
    }()

    /**
     * Returns the wrapped ReactElement.
     *
     * @return {ReactElement}
     */

  }, {
    key: 'getElement',
    value: function () {
      function getElement() {
        var _this = this;

        return this.single('getElement', function () {
          return (0, _getAdapter2['default'])(_this[OPTIONS]).nodeToElement(_this[NODE]);
        });
      }

      return getElement;
    }()

    /**
     * Returns the wrapped ReactElements.
     *
     * @return {Array<ReactElement>}
     */

  }, {
    key: 'getElements',
    value: function () {
      function getElements() {
        return this[NODES].map((0, _getAdapter2['default'])(this[OPTIONS]).nodeToElement);
      }

      return getElements;
    }()

    // eslint-disable-next-line class-methods-use-this

  }, {
    key: 'getNode',
    value: function () {
      function getNode() {
        throw new Error('ReactWrapper::getNode() is no longer supported. Use ReactWrapper::instance() instead');
      }

      return getNode;
    }()

    // eslint-disable-next-line class-methods-use-this

  }, {
    key: 'getNodes',
    value: function () {
      function getNodes() {
        throw new Error('ReactWrapper::getNodes() is no longer supported.');
      }

      return getNodes;
    }()

    /**
     * Returns the outer most DOMComponent of the current wrapper.
     *
     * NOTE: can only be called on a wrapper of a single node.
     *
     * @returns {DOMComponent}
     */

  }, {
    key: 'getDOMNode',
    value: function () {
      function getDOMNode() {
        var adapter = (0, _getAdapter2['default'])(this[OPTIONS]);
        return this.single('getDOMNode', function (n) {
          return adapter.nodeToHostNode(n, true);
        });
      }

      return getDOMNode;
    }()

    /**
     * If the root component contained a ref, you can access it here and get the relevant
     * react component instance or HTML element instance.
     *
     * NOTE: can only be called on a wrapper instance that is also the root instance.
     *
     * @param {String} refname
     * @returns {ReactComponent | HTMLElement}
     */

  }, {
    key: 'ref',
    value: function () {
      function ref(refname) {
        if (this[ROOT] !== this) {
          throw new Error('ReactWrapper::ref(refname) can only be called on the root');
        }
        return this.instance().refs[refname];
      }

      return ref;
    }()

    /**
     * Returns the wrapper's underlying instance.
     *
     * Example:
     * ```
     * const wrapper = mount(<MyComponent />);
     * const inst = wrapper.instance();
     * expect(inst).to.be.instanceOf(MyComponent);
     * ```
     * @returns {ReactComponent|DOMComponent}
     */

  }, {
    key: 'instance',
    value: function () {
      function instance() {
        var _this2 = this;

        return this.single('instance', function () {
          return _this2[NODE].instance;
        });
      }

      return instance;
    }()

    /**
     * If a `wrappingComponent` was passed in `options`, this methods returns a `ReactWrapper` around
     * the rendered `wrappingComponent`. This `ReactWrapper` can be used to update the
     * `wrappingComponent`'s props, state, etc.
     *
     * @returns ReactWrapper
     */

  }, {
    key: 'getWrappingComponent',
    value: function () {
      function getWrappingComponent() {
        if (this[ROOT] !== this) {
          throw new Error('ReactWrapper::getWrappingComponent() can only be called on the root');
        }
        if (!this[OPTIONS].wrappingComponent) {
          throw new Error('ReactWrapper::getWrappingComponent() can only be called on a wrapper that was originally passed a `wrappingComponent` option');
        }
        return this[WRAPPING_COMPONENT];
      }

      return getWrappingComponent;
    }()

    /**
     * Forces a re-render. Useful to run before checking the render output if something external
     * may be updating the state of the component somewhere.
     *
     * NOTE: no matter what instance this is called on, it will always update the root.
     *
     * @returns {ReactWrapper}
     */

  }, {
    key: 'update',
    value: function () {
      function update() {
        var _this3 = this;

        var root = this[ROOT];
        if (this !== root) {
          return root.update();
        }
        privateSetNodes(this, this[RENDERER].getNode());
        this[LINKED_ROOTS].forEach(function (linkedRoot) {
          if (linkedRoot !== _this3[UPDATED_BY]) {
            /* eslint-disable no-param-reassign */
            // Only update a linked it root if it is not the originator of our update().
            // This is needed to prevent infinite recursion when there is a bi-directional
            // link between two roots.
            linkedRoot[UPDATED_BY] = _this3;
            try {
              linkedRoot.update();
            } finally {
              linkedRoot[UPDATED_BY] = null;
            }
          }
        });
        return this;
      }

      return update;
    }()

    /**
     * A method that unmounts the component. This can be used to simulate a component going through
     * and unmount/mount lifecycle.
     *
     * @returns {ReactWrapper}
     */

  }, {
    key: 'unmount',
    value: function () {
      function unmount() {
        var _this4 = this;

        if (this[ROOT] !== this) {
          throw new Error('ReactWrapper::unmount() can only be called on the root');
        }
        this.single('unmount', function () {
          _this4[RENDERER].unmount();
          _this4.update();
        });
        return this;
      }

      return unmount;
    }()

    /**
     * A method that re-mounts the component, if it is not currently mounted.
     * This can be used to simulate a component going through
     * an unmount/mount lifecycle.
     *
     * @returns {ReactWrapper}
     */

  }, {
    key: 'mount',
    value: function () {
      function mount() {
        var _this5 = this;

        if (this[ROOT] !== this) {
          throw new Error('ReactWrapper::mount() can only be called on the root');
        }
        this[RENDERER].render(this[UNRENDERED], this[OPTIONS].context, function () {
          return _this5.update();
        });
        return this;
      }

      return mount;
    }()

    /**
     * A method that sets the props of the root component, and re-renders. Useful for when you are
     * wanting to test how the component behaves over time with changing props. Calling this, for
     * instance, will call the `componentWillReceiveProps` lifecycle method.
     *
     * Similar to `setState`, this method accepts a props object and will merge it in with the already
     * existing props.
     *
     * NOTE: can only be called on a wrapper instance that is also the root instance.
     *
     * @param {Object} props object
     * @param {Function} cb - callback function
     * @returns {ReactWrapper}
     */

  }, {
    key: 'setProps',
    value: function () {
      function setProps(props) {
        var _this6 = this;

        var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

        if (this[ROOT] !== this) {
          throw new Error('ReactWrapper::setProps() can only be called on the root');
        }
        if (arguments.length > 1 && typeof callback !== 'function') {
          throw new TypeError('ReactWrapper::setProps() expects a function as its second argument');
        }
        var adapter = (0, _getAdapter2['default'])(this[OPTIONS]);
        this[UNRENDERED] = (0, _Utils.cloneElement)(adapter, this[UNRENDERED], props);
        this[RENDERER].render(this[UNRENDERED], null, function () {
          _this6.update();
          if (callback) {
            callback();
          }
        });
        return this;
      }

      return setProps;
    }()

    /**
     * A method to invoke `setState` on the root component instance similar to how you might in the
     * definition of the component, and re-renders.  This method is useful for testing your component
     * in hard to achieve states, however should be used sparingly. If possible, you should utilize
     * your component's external API in order to get it into whatever state you want to test, in order
     * to be as accurate of a test as possible. This is not always practical, however.
     *
     * NOTE: can only be called on a wrapper instance that is also the root instance.
     *
     * @param {Object} state to merge
     * @param {Function} cb - callback function
     * @returns {ReactWrapper}
     */

  }, {
    key: 'setState',
    value: function () {
      function setState(state) {
        var _this7 = this;

        var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

        if (this.instance() === null || this.getNodeInternal().nodeType !== 'class') {
          throw new Error('ReactWrapper::setState() can only be called on class components');
        }
        if (arguments.length > 1 && typeof callback !== 'function') {
          throw new TypeError('ReactWrapper::setState() expects a function as its second argument');
        }
        this.instance().setState(state, function () {
          _this7.update();
          if (callback) {
            var adapter = (0, _getAdapter2['default'])(_this7[OPTIONS]);
            var instance = _this7.instance();
            if (adapter.invokeSetStateCallback) {
              adapter.invokeSetStateCallback(instance, callback);
            } else {
              callback.call(instance);
            }
          }
        });
        return this;
      }

      return setState;
    }()

    /**
     * A method that sets the context of the root component, and re-renders. Useful for when you are
     * wanting to test how the component behaves over time with changing contexts.
     *
     * NOTE: can only be called on a wrapper instance that is also the root instance.
     *
     * @param {Object} context object
     * @returns {ReactWrapper}
     */

  }, {
    key: 'setContext',
    value: function () {
      function setContext(context) {
        var _this8 = this;

        if (this[ROOT] !== this) {
          throw new Error('ReactWrapper::setContext() can only be called on the root');
        }
        if (!this[OPTIONS].context) {
          throw new Error('ReactWrapper::setContext() can only be called on a wrapper that was originally passed a context option');
        }
        this[RENDERER].render(this[UNRENDERED], context, function () {
          return _this8.update();
        });
        return this;
      }

      return setContext;
    }()

    /**
     * Whether or not a given react element exists in the mount render tree.
     *
     * Example:
     * ```
     * const wrapper = mount(<MyComponent />);
     * expect(wrapper.contains(<div className="foo bar" />)).to.equal(true);
     * ```
     *
     * @param {ReactElement|Array<ReactElement>} nodeOrNodes
     * @returns {Boolean}
     */

  }, {
    key: 'contains',
    value: function () {
      function contains(nodeOrNodes) {
        var adapter = (0, _getAdapter2['default'])(this[OPTIONS]);

        var predicate = Array.isArray(nodeOrNodes) ? function (other) {
          return (0, _Utils.containsChildrenSubArray)(_Utils.nodeEqual, other, nodeOrNodes.map(function (node) {
            return adapter.elementToNode(node);
          }));
        } : function (other) {
          return (0, _Utils.nodeEqual)(adapter.elementToNode(nodeOrNodes), other);
        };

        return findWhereUnwrapped(this, predicate).length > 0;
      }

      return contains;
    }()

    /**
     * Whether or not a given react element exists in the current render tree.
     * It will determine if one of the wrappers element "looks like" the expected
     * element by checking if all props of the expected element are present
     * on the wrappers element and equals to each other.
     *
     * Example:
     * ```
     * // MyComponent outputs <div><div class="foo">Hello</div></div>
     * const wrapper = mount(<MyComponent />);
     * expect(wrapper.containsMatchingElement(<div>Hello</div>)).to.equal(true);
     * ```
     *
     * @param {ReactElement} node
     * @returns {Boolean}
     */

  }, {
    key: 'containsMatchingElement',
    value: function () {
      function containsMatchingElement(node) {
        var rstNode = (0, _getAdapter2['default'])(this[OPTIONS]).elementToNode(node);
        var predicate = function () {
          function predicate(other) {
            return (0, _Utils.nodeMatches)(rstNode, other, function (a, b) {
              return a <= b;
            });
          }

          return predicate;
        }();
        return findWhereUnwrapped(this, predicate).length > 0;
      }

      return containsMatchingElement;
    }()

    /**
     * Whether or not all the given react elements exists in the current render tree.
     * It will determine if one of the wrappers element "looks like" the expected
     * element by checking if all props of the expected element are present
     * on the wrappers element and equals to each other.
     *
     * Example:
     * ```
     * const wrapper = mount(<MyComponent />);
     * expect(wrapper.containsAllMatchingElements([
     *   <div>Hello</div>,
     *   <div>Goodbye</div>,
     * ])).to.equal(true);
     * ```
     *
     * @param {Array<ReactElement>} nodes
     * @returns {Boolean}
     */

  }, {
    key: 'containsAllMatchingElements',
    value: function () {
      function containsAllMatchingElements(nodes) {
        var _this9 = this;

        if (!Array.isArray(nodes)) {
          throw new TypeError('nodes should be an Array');
        }

        return nodes.every(function (node) {
          return _this9.containsMatchingElement(node);
        });
      }

      return containsAllMatchingElements;
    }()

    /**
     * Whether or not one of the given react elements exists in the current render tree.
     * It will determine if one of the wrappers element "looks like" the expected
     * element by checking if all props of the expected element are present
     * on the wrappers element and equals to each other.
     *
     * Example:
     * ```
     * const wrapper = mount(<MyComponent />);
     * expect(wrapper.containsAnyMatchingElements([
     *   <div>Hello</div>,
     *   <div>Goodbye</div>,
     * ])).to.equal(true);
     * ```
     *
     * @param {Array<ReactElement>} nodes
     * @returns {Boolean}
     */

  }, {
    key: 'containsAnyMatchingElements',
    value: function () {
      function containsAnyMatchingElements(nodes) {
        var _this10 = this;

        return Array.isArray(nodes) && nodes.some(function (node) {
          return _this10.containsMatchingElement(node);
        });
      }

      return containsAnyMatchingElements;
    }()

    /**
     * Whether or not a given react element exists in the render tree.
     *
     * Example:
     * ```
     * const wrapper = mount(<MyComponent />);
     * expect(wrapper.contains(<div className="foo bar" />)).to.equal(true);
     * ```
     *
     * @param {ReactElement} node
     * @returns {Boolean}
     */

  }, {
    key: 'equals',
    value: function () {
      function equals(node) {
        var _this11 = this;

        return this.single('equals', function () {
          return (0, _Utils.nodeEqual)(_this11.getNodeInternal(), node);
        });
      }

      return equals;
    }()

    /**
     * Whether or not a given react element matches the render tree.
     * Match is based on the expected element and not on wrapper root node.
     * It will determine if the wrapper root node "looks like" the expected
     * element by checking if all props of the expected element are present
     * on the wrapper root node and equals to each other.
     *
     * Example:
     * ```
     * // MyComponent outputs <div class="foo">Hello</div>
     * const wrapper = mount(<MyComponent />);
     * expect(wrapper.matchesElement(<div>Hello</div>)).to.equal(true);
     * ```
     *
     * @param {ReactElement} node
     * @returns {Boolean}
     */

  }, {
    key: 'matchesElement',
    value: function () {
      function matchesElement(node) {
        var _this12 = this;

        return this.single('matchesElement', function () {
          var adapter = (0, _getAdapter2['default'])(_this12[OPTIONS]);
          var rstNode = adapter.elementToNode(node);
          return (0, _Utils.nodeMatches)(rstNode, _this12.getNodeInternal(), function (a, b) {
            return a <= b;
          });
        });
      }

      return matchesElement;
    }()

    /**
     * Finds every node in the render tree of the current wrapper that matches the provided selector.
     *
     * @param {EnzymeSelector} selector
     * @returns {ReactWrapper}
     */

  }, {
    key: 'find',
    value: function () {
      function find(selector) {
        return this.wrap((0, _selectors.reduceTreesBySelector)(selector, this.getNodesInternal()));
      }

      return find;
    }()

    /**
     * Returns whether or not current node matches a provided selector.
     *
     * NOTE: can only be called on a wrapper of a single node.
     *
     * @param {EnzymeSelector} selector
     * @returns {boolean}
     */

  }, {
    key: 'is',
    value: function () {
      function is(selector) {
        var predicate = (0, _selectors.buildPredicate)(selector);
        return this.single('is', function (n) {
          return predicate(n);
        });
      }

      return is;
    }()

    /**
     * Returns true if the component rendered nothing, i.e., null or false.
     *
     * @returns {boolean}
     */

  }, {
    key: 'isEmptyRender',
    value: function () {
      function isEmptyRender() {
        var nodes = this.getNodeInternal();

        return (0, _Utils.renderedDive)(nodes);
      }

      return isEmptyRender;
    }()

    /**
     * Returns a new wrapper instance with only the nodes of the current wrapper instance that match
     * the provided predicate function.
     *
     * @param {Function} predicate
     * @returns {ReactWrapper}
     */

  }, {
    key: 'filterWhere',
    value: function () {
      function filterWhere(predicate) {
        var _this13 = this;

        return filterWhereUnwrapped(this, function (n) {
          return predicate(_this13.wrap(n));
        });
      }

      return filterWhere;
    }()

    /**
     * Returns a new wrapper instance with only the nodes of the current wrapper instance that match
     * the provided selector.
     *
     * @param {EnzymeSelector} selector
     * @returns {ReactWrapper}
     */

  }, {
    key: 'filter',
    value: function () {
      function filter(selector) {
        var predicate = (0, _selectors.buildPredicate)(selector);
        return filterWhereUnwrapped(this, predicate);
      }

      return filter;
    }()

    /**
     * Returns a new wrapper instance with only the nodes of the current wrapper that did not match
     * the provided selector. Essentially the inverse of `filter`.
     *
     * @param {EnzymeSelector} selector
     * @returns {ReactWrapper}
     */

  }, {
    key: 'not',
    value: function () {
      function not(selector) {
        var predicate = (0, _selectors.buildPredicate)(selector);
        return filterWhereUnwrapped(this, function (n) {
          return !predicate(n);
        });
      }

      return not;
    }()

    /**
     * Returns a string of the rendered text of the current render tree.  This function should be
     * looked at with skepticism if being used to test what the actual HTML output of the component
     * will be. If that is what you would like to test, use enzyme's `render` function instead.
     *
     * NOTE: can only be called on a wrapper of a single node.
     *
     * @returns {String}
     */

  }, {
    key: 'text',
    value: function () {
      function text() {
        var adapter = (0, _getAdapter2['default'])(this[OPTIONS]);
        return this.single('text', function (n) {
          return (0, _RSTTraversal.getTextFromHostNodes)(n, adapter);
        });
      }

      return text;
    }()

    /**
     * Returns the HTML of the node.
     *
     * NOTE: can only be called on a wrapper of a single node.
     *
     * @returns {String}
     */

  }, {
    key: 'html',
    value: function () {
      function html() {
        var adapter = (0, _getAdapter2['default'])(this[OPTIONS]);
        return this.single('html', function (n) {
          return (0, _RSTTraversal.getHTMLFromHostNodes)(n, adapter);
        });
      }

      return html;
    }()

    /**
     * Returns the current node rendered to HTML and wrapped in a CheerioWrapper.
     *
     * NOTE: can only be called on a wrapper of a single node.
     *
     * @returns {CheerioWrapper}
     */

  }, {
    key: 'render',
    value: function () {
      function render() {
        var html = this.html();
        return html === null ? (0, _cheerio2['default'])() : _cheerio2['default'].load('')(html);
      }

      return render;
    }()

    /**
     * Used to simulate events. Pass an eventname and (optionally) event arguments. This method of
     * testing events should be met with some skepticism.
     *
     * @param {String} event
     * @param {Object} mock (optional)
     * @returns {ReactWrapper}
     */

  }, {
    key: 'simulate',
    value: function () {
      function simulate(event) {
        var _this14 = this;

        var mock = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        return this.single('simulate', function (n) {
          _this14[RENDERER].simulateEvent(n, event, mock);
          _this14[ROOT].update();
          return _this14;
        });
      }

      return simulate;
    }()

    /**
     * Used to simulate throwing a rendering error. Pass an error to throw.
     *
     * @param {String} error
     * @returns {ReactWrapper}
     */

  }, {
    key: 'simulateError',
    value: function () {
      function simulateError(error) {
        var _this15 = this;

        if (this[ROOT] === this) {
          throw new Error('ReactWrapper::simulateError() may not be called on the root');
        }

        return this.single('simulateError', function (thisNode) {
          if (thisNode.nodeType === 'host') {
            throw new Error('ReactWrapper::simulateError() can only be called on custom components');
          }

          var renderer = _this15[RENDERER];
          if (typeof renderer.simulateError !== 'function') {
            throw new TypeError('your adapter does not support `simulateError`. Try upgrading it!');
          }

          var rootNode = getRootNodeInternal(_this15);
          var nodeHierarchy = [thisNode].concat(nodeParents(_this15, thisNode));
          renderer.simulateError(nodeHierarchy, rootNode, error);

          _this15[ROOT].update();
          return _this15;
        });
      }

      return simulateError;
    }()

    /**
     * Returns the props hash for the root node of the wrapper.
     *
     * NOTE: can only be called on a wrapper of a single node.
     *
     * @returns {Object}
     */

  }, {
    key: 'props',
    value: function () {
      function props() {
        return this.single('props', _RSTTraversal.propsOfNode);
      }

      return props;
    }()

    /**
     * Returns the state hash for the root node of the wrapper. Optionally pass in a prop name and it
     * will return just that value.
     *
     * NOTE: can only be called on a wrapper of a single node.
     *
     * @param {String} name (optional)
     * @returns {*}
     */

  }, {
    key: 'state',
    value: function () {
      function state(name) {
        var _this16 = this;

        var thisNode = this[ROOT] === this ? this[RENDERER].getNode() : this.getNodeInternal();
        if (this.instance() === null || thisNode.nodeType !== 'class') {
          throw new Error('ReactWrapper::state() can only be called on class components');
        }
        var _state = this.single('state', function () {
          return _this16.instance().state;
        });
        if (typeof name !== 'undefined') {
          if (_state == null) {
            throw new TypeError('ReactWrapper::state("' + String(name) + '") requires that `state` not be `null` or `undefined`');
          }
          return _state[name];
        }
        return _state;
      }

      return state;
    }()

    /**
     * Returns the context hash for the root node of the wrapper.
     * Optionally pass in a prop name and it will return just that value.
     *
     * NOTE: can only be called on a wrapper of a single node.
     *
     * @param {String} name (optional)
     * @returns {*}
     */

  }, {
    key: 'context',
    value: function () {
      function context(name) {
        var _this17 = this;

        if (this[ROOT] !== this) {
          throw new Error('ReactWrapper::context() can only be called on the root');
        }
        var instance = this.single('context', function () {
          return _this17.instance();
        });
        if (instance === null) {
          throw new Error('ReactWrapper::context() can only be called on components with instances');
        }
        var _context = instance.context;
        if (typeof name !== 'undefined') {
          return _context[name];
        }
        return _context;
      }

      return context;
    }()

    /**
     * Returns a new wrapper with all of the children of the current wrapper.
     *
     * @param {EnzymeSelector} [selector]
     * @returns {ReactWrapper}
     */

  }, {
    key: 'children',
    value: function () {
      function children(selector) {
        var allChildren = this.flatMap(function (n) {
          return (0, _RSTTraversal.childrenOfNode)(n.getNodeInternal()).filter(function (x) {
            return (typeof x === 'undefined' ? 'undefined' : _typeof(x)) === 'object';
          });
        });
        return selector ? allChildren.filter(selector) : allChildren;
      }

      return children;
    }()

    /**
     * Returns a new wrapper with a specific child
     *
     * @param {Number} [index]
     * @returns {ReactWrapper}
     */

  }, {
    key: 'childAt',
    value: function () {
      function childAt(index) {
        var _this18 = this;

        return this.single('childAt', function () {
          return _this18.children().at(index);
        });
      }

      return childAt;
    }()

    /**
     * Returns a wrapper around all of the parents/ancestors of the wrapper. Does not include the node
     * in the current wrapper.
     *
     * NOTE: can only be called on a wrapper of a single node.
     *
     * @param {EnzymeSelector} [selector]
     * @returns {ReactWrapper}
     */

  }, {
    key: 'parents',
    value: function () {
      function parents(selector) {
        var _this19 = this;

        return this.single('parents', function (n) {
          var allParents = _this19.wrap(nodeParents(_this19, n));
          return selector ? allParents.filter(selector) : allParents;
        });
      }

      return parents;
    }()

    /**
     * Returns a wrapper around the immediate parent of the current node.
     *
     * @returns {ReactWrapper}
     */

  }, {
    key: 'parent',
    value: function () {
      function parent() {
        return this.flatMap(function (n) {
          return [n.parents().get(0)];
        });
      }

      return parent;
    }()

    /**
     *
     * @param {EnzymeSelector} selector
     * @returns {ReactWrapper}
     */

  }, {
    key: 'closest',
    value: function () {
      function closest(selector) {
        if (this.is(selector)) {
          return this;
        }
        var matchingAncestors = this.parents().filter(selector);
        return matchingAncestors.length > 0 ? matchingAncestors.first() : this.findWhere(function () {
          return false;
        });
      }

      return closest;
    }()

    /**
     * Returns the value of  prop with the given name of the root node.
     *
     * @param {String} propName
     * @returns {*}
     */

  }, {
    key: 'prop',
    value: function () {
      function prop(propName) {
        return this.props()[propName];
      }

      return prop;
    }()

    /**
     * Used to invoke a function prop.
     * Will invoke an function prop and return its value.
     *
     * @param {String} propName
     * @returns {Any}
     */

  }, {
    key: 'invoke',
    value: function () {
      function invoke(propName) {
        var _this20 = this;

        return this.single('invoke', function () {
          var handler = _this20.prop(propName);
          if (typeof handler !== 'function') {
            throw new TypeError('ReactWrapper::invoke() requires the name of a prop whose value is a function');
          }
          return function () {
            var response = handler.apply(undefined, arguments);
            _this20[ROOT].update();
            return response;
          };
        });
      }

      return invoke;
    }()

    /**
     * Returns a wrapper of the node rendered by the provided render prop.
     *
     * @param {String} propName
     * @returns {Function}
     */

  }, {
    key: 'renderProp',
    value: function () {
      function renderProp(propName) {
        var _this21 = this;

        var adapter = (0, _getAdapter2['default'])(this[OPTIONS]);
        if (typeof adapter.wrap !== 'function') {
          throw new RangeError('your adapter does not support `wrap`. Try upgrading it!');
        }

        return this.single('renderProp', function (n) {
          if (n.nodeType === 'host') {
            throw new TypeError('ReactWrapper::renderProp() can only be called on custom components');
          }
          if (typeof propName !== 'string') {
            throw new TypeError('ReactWrapper::renderProp(): `propName` must be a string');
          }
          var props = _this21.props();
          if (!(0, _has2['default'])(props, propName)) {
            throw new Error('ReactWrapper::renderProp(): no prop called \u201C' + String(propName) + '\u201C found');
          }
          var propValue = props[propName];
          if (typeof propValue !== 'function') {
            throw new TypeError('ReactWrapper::renderProp(): expected prop \u201C' + String(propName) + '\u201C to contain a function, but it holds \u201C' + (typeof propValue === 'undefined' ? 'undefined' : _typeof(propValue)) + '\u201C');
          }

          return function () {
            var element = propValue.apply(undefined, arguments);
            var wrapped = adapter.wrap(element);
            return _this21.wrap(wrapped, null, _this21[OPTIONS]);
          };
        });
      }

      return renderProp;
    }()

    /**
     * Returns the key assigned to the current node.
     *
     * @returns {String}
     */

  }, {
    key: 'key',
    value: function () {
      function key() {
        return this.single('key', function (n) {
          return n.key === undefined ? null : n.key;
        });
      }

      return key;
    }()

    /**
     * Returns the type of the root node of this wrapper. If it's a composite component, this will be
     * the component constructor. If it's native DOM node, it will be a string.
     *
     * @returns {String|Function}
     */

  }, {
    key: 'type',
    value: function () {
      function type() {
        return this.single('type', function (n) {
          return (0, _Utils.typeOfNode)(n);
        });
      }

      return type;
    }()

    /**
     * Returns the name of the root node of this wrapper.
     *
     * In order of precedence => type.displayName -> type.name -> type.
     *
     * @returns {String}
     */

  }, {
    key: 'name',
    value: function () {
      function name() {
        var adapter = (0, _getAdapter2['default'])(this[OPTIONS]);
        return this.single('name', function (n) {
          return adapter.displayNameOfNode ? adapter.displayNameOfNode(n) : (0, _Utils.displayNameOfNode)(n);
        });
      }

      return name;
    }()

    /**
     * Returns whether or not the current root node has the given class name or not.
     *
     * NOTE: can only be called on a wrapper of a single node.
     *
     * @param {String} className
     * @returns {Boolean}
     */

  }, {
    key: 'hasClass',
    value: function () {
      function hasClass(className) {
        if (typeof className === 'string' && className.indexOf('.') !== -1) {
          // eslint-disable-next-line no-console
          console.warn('It looks like you\'re calling `ReactWrapper::hasClass()` with a CSS selector. hasClass() expects a class name, not a CSS selector.');
        }
        return this.single('hasClass', function (n) {
          return (0, _RSTTraversal.hasClassName)(n, className);
        });
      }

      return hasClass;
    }()

    /**
     * Iterates through each node of the current wrapper and executes the provided function with a
     * wrapper around the corresponding node passed in as the first argument.
     *
     * @param {Function} fn
     * @returns {ReactWrapper}
     */

  }, {
    key: 'forEach',
    value: function () {
      function forEach(fn) {
        var _this22 = this;

        this.getNodesInternal().forEach(function (n, i) {
          return fn.call(_this22, _this22.wrap(n), i);
        });
        return this;
      }

      return forEach;
    }()

    /**
     * Maps the current array of nodes to another array. Each node is passed in as a `ReactWrapper`
     * to the map function.
     *
     * @param {Function} fn
     * @returns {Array}
     */

  }, {
    key: 'map',
    value: function () {
      function map(fn) {
        var _this23 = this;

        return this.getNodesInternal().map(function (n, i) {
          return fn.call(_this23, _this23.wrap(n), i);
        });
      }

      return map;
    }()

    /**
     * Reduces the current array of nodes to another array.
     * Each node is passed in as a `ShallowWrapper` to the reducer function.
     *
     * @param {Function} fn - the reducer function
     * @param {*} initialValue - the initial value
     * @returns {*}
     */

  }, {
    key: 'reduce',
    value: function () {
      function reduce(fn) {
        var _this24 = this;

        var initialValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

        if (arguments.length > 1) {
          return this.getNodesInternal().reduce(function (accum, n, i) {
            return fn.call(_this24, accum, _this24.wrap(n), i);
          }, initialValue);
        }
        return this.getNodesInternal().reduce(function (accum, n, i) {
          return fn.call(_this24, i === 1 ? _this24.wrap(accum) : accum, _this24.wrap(n), i);
        });
      }

      return reduce;
    }()

    /**
     * Reduces the current array of nodes to another array, from right to left. Each node is passed
     * in as a `ShallowWrapper` to the reducer function.
     *
     * @param {Function} fn - the reducer function
     * @param {*} initialValue - the initial value
     * @returns {*}
     */

  }, {
    key: 'reduceRight',
    value: function () {
      function reduceRight(fn) {
        var _this25 = this;

        var initialValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

        if (arguments.length > 1) {
          return this.getNodesInternal().reduceRight(function (accum, n, i) {
            return fn.call(_this25, accum, _this25.wrap(n), i);
          }, initialValue);
        }
        return this.getNodesInternal().reduceRight(function (accum, n, i) {
          return fn.call(_this25, i === 1 ? _this25.wrap(accum) : accum, _this25.wrap(n), i);
        });
      }

      return reduceRight;
    }()

    /**
     * Returns a new wrapper with a subset of the nodes of the original wrapper, according to the
     * rules of `Array#slice`.
     *
     * @param {Number} begin
     * @param {Number} end
     * @returns {ShallowWrapper}
     */

  }, {
    key: 'slice',
    value: function () {
      function slice(begin, end) {
        return this.wrap(this.getNodesInternal().slice(begin, end));
      }

      return slice;
    }()

    /**
     * Returns whether or not any of the nodes in the wrapper match the provided selector.
     *
     * @param {EnzymeSelector} selector
     * @returns {Boolean}
     */

  }, {
    key: 'some',
    value: function () {
      function some(selector) {
        if (this[ROOT] === this) {
          throw new Error('ReactWrapper::some() can not be called on the root');
        }
        var predicate = (0, _selectors.buildPredicate)(selector);
        return this.getNodesInternal().some(predicate);
      }

      return some;
    }()

    /**
     * Returns whether or not any of the nodes in the wrapper pass the provided predicate function.
     *
     * @param {Function} predicate
     * @returns {Boolean}
     */

  }, {
    key: 'someWhere',
    value: function () {
      function someWhere(predicate) {
        var _this26 = this;

        return this.getNodesInternal().some(function (n, i) {
          return predicate.call(_this26, _this26.wrap(n), i);
        });
      }

      return someWhere;
    }()

    /**
     * Returns whether or not all of the nodes in the wrapper match the provided selector.
     *
     * @param {EnzymeSelector} selector
     * @returns {Boolean}
     */

  }, {
    key: 'every',
    value: function () {
      function every(selector) {
        var predicate = (0, _selectors.buildPredicate)(selector);
        return this.getNodesInternal().every(predicate);
      }

      return every;
    }()

    /**
     * Returns whether or not any of the nodes in the wrapper pass the provided predicate function.
     *
     * @param {Function} predicate
     * @returns {Boolean}
     */

  }, {
    key: 'everyWhere',
    value: function () {
      function everyWhere(predicate) {
        var _this27 = this;

        return this.getNodesInternal().every(function (n, i) {
          return predicate.call(_this27, _this27.wrap(n), i);
        });
      }

      return everyWhere;
    }()

    /**
     * Utility method used to create new wrappers with a mapping function that returns an array of
     * nodes in response to a single node wrapper. The returned wrapper is a single wrapper around
     * all of the mapped nodes flattened (and de-duplicated).
     *
     * @param {Function} fn
     * @returns {ReactWrapper}
     */

  }, {
    key: 'flatMap',
    value: function () {
      function flatMap(fn) {
        var _this28 = this;

        var nodes = this.getNodesInternal().map(function (n, i) {
          return fn.call(_this28, _this28.wrap(n), i);
        });
        var flattened = (0, _arrayPrototype2['default'])(nodes, 1);
        return this.wrap(flattened.filter(Boolean));
      }

      return flatMap;
    }()

    /**
     * Finds all nodes in the current wrapper nodes' render trees that match the provided predicate
     * function.
     *
     * @param {Function} predicate
     * @returns {ReactWrapper}
     */

  }, {
    key: 'findWhere',
    value: function () {
      function findWhere(predicate) {
        var _this29 = this;

        return findWhereUnwrapped(this, function (n) {
          var node = _this29.wrap(n);
          return node.length > 0 && predicate(node);
        });
      }

      return findWhere;
    }()

    /**
     * Returns the node at a given index of the current wrapper.
     *
     * @param {Number} index
     * @returns {ReactElement}
     */

  }, {
    key: 'get',
    value: function () {
      function get(index) {
        return this.getElements()[index];
      }

      return get;
    }()

    /**
     * Returns a wrapper around the node at a given index of the current wrapper.
     *
     * @param {Number} index
     * @returns {ReactWrapper}
     */

  }, {
    key: 'at',
    value: function () {
      function at(index) {
        var nodes = this.getNodesInternal();
        if (index < nodes.length) {
          return this.wrap(nodes[index]);
        }
        return this.wrap([]);
      }

      return at;
    }()

    /**
     * Returns a wrapper around the first node of the current wrapper.
     *
     * @returns {ReactWrapper}
     */

  }, {
    key: 'first',
    value: function () {
      function first() {
        return this.at(0);
      }

      return first;
    }()

    /**
     * Returns a wrapper around the last node of the current wrapper.
     *
     * @returns {ReactWrapper}
     */

  }, {
    key: 'last',
    value: function () {
      function last() {
        return this.at(this.length - 1);
      }

      return last;
    }()

    /**
     * Delegates to exists()
     *
     * @returns {boolean}
     */

  }, {
    key: 'isEmpty',
    value: function () {
      function isEmpty() {
        // eslint-disable-next-line no-console
        console.warn('Enzyme::Deprecated method isEmpty() called, use exists() instead.');
        return !this.exists();
      }

      return isEmpty;
    }()

    /**
     * Returns true if the current wrapper has nodes. False otherwise.
     * If called with a selector it returns `.find(selector).exists()` instead.
     *
     * @param {EnzymeSelector} selector (optional)
     * @returns {boolean}
     */

  }, {
    key: 'exists',
    value: function () {
      function exists() {
        var selector = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

        return arguments.length > 0 ? this.find(selector).exists() : this.length > 0;
      }

      return exists;
    }()

    /**
     * Utility method that throws an error if the current instance has a length other than one.
     * This is primarily used to enforce that certain methods are only run on a wrapper when it is
     * wrapping a single node.
     *
     * @param {Function} fn
     * @returns {*}
     */

  }, {
    key: 'single',
    value: function () {
      function single(name, fn) {
        var fnName = typeof name === 'string' ? name : 'unknown';
        var callback = typeof fn === 'function' ? fn : name;
        if (this.length !== 1) {
          throw new Error('Method \u201C' + fnName + '\u201D is meant to be run on 1 node. ' + String(this.length) + ' found instead.');
        }
        return callback.call(this, this.getNodeInternal());
      }

      return single;
    }()

    /**
     * Helpful utility method to create a new wrapper with the same root as the current wrapper, with
     * any nodes passed in as the first parameter automatically wrapped.
     *
     * @param {ReactWrapper|ReactElement|Array<ReactElement>} node
     * @returns {ReactWrapper}
     */

  }, {
    key: 'wrap',
    value: function () {
      function wrap(node) {
        var root = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this[ROOT];

        if (node instanceof ReactWrapper) {
          return node;
        }

        for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          args[_key - 2] = arguments[_key];
        }

        return new (Function.prototype.bind.apply(ReactWrapper, [null].concat([node, root], args)))();
      }

      return wrap;
    }()

    /**
     * Returns an HTML-like string of the shallow render for debugging purposes.
     *
     * @param {Object} [options] - Property bag of additional options.
     * @param {boolean} [options.ignoreProps] - if true, props are omitted from the string.
     * @param {boolean} [options.verbose] - if true, arrays and objects to be verbosely printed.
     * @returns {String}
     */

  }, {
    key: 'debug',
    value: function () {
      function debug() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        return (0, _Debug.debugNodes)(this.getNodesInternal(), options);
      }

      return debug;
    }()

    /**
     * Invokes intercepter and returns itself. intercepter is called with itself.
     * This is helpful when debugging nodes in method chains.
     * @param fn
     * @returns {ReactWrapper}
     */

  }, {
    key: 'tap',
    value: function () {
      function tap(intercepter) {
        intercepter(this);
        return this;
      }

      return tap;
    }()

    /**
     * Detaches the react tree from the DOM. Runs `ReactDOM.unmountComponentAtNode()` under the hood.
     *
     * This method will most commonly be used as a "cleanup" method if you decide to use the
     * `attachTo` option in `mount(node, options)`.
     *
     * The method is intentionally not "fluent" (in that it doesn't return `this`) because you should
     * not be doing anything with this wrapper after this method is called.
     */

  }, {
    key: 'detach',
    value: function () {
      function detach() {
        if (this[ROOT] !== this) {
          throw new Error('ReactWrapper::detach() can only be called on the root');
        }
        if (!this[OPTIONS].attachTo) {
          throw new Error('ReactWrapper::detach() can only be called on when the `attachTo` option was passed into `mount()`.');
        }
        this[RENDERER].unmount();
      }

      return detach;
    }()

    /**
     * Strips out all the not host-nodes from the list of nodes
     *
     * This method is useful if you want to check for the presence of host nodes
     * (actually rendered HTML elements) ignoring the React nodes.
     */

  }, {
    key: 'hostNodes',
    value: function () {
      function hostNodes() {
        return this.filterWhere(function (n) {
          return typeof n.type() === 'string';
        });
      }

      return hostNodes;
    }()
  }]);

  return ReactWrapper;
}();

/**
 * A *special* "root" wrapper that represents the component passed as `wrappingComponent`.
 * It is linked to the primary root such that updates to it will update the primary,
 * and vice versa.
 *
 * @class WrappingComponentWrapper
 */


var WrappingComponentWrapper = function (_ReactWrapper) {
  _inherits(WrappingComponentWrapper, _ReactWrapper);

  /* eslint-disable class-methods-use-this */
  function WrappingComponentWrapper(root, renderer) {
    _classCallCheck(this, WrappingComponentWrapper);

    var _this30 = _possibleConstructorReturn(this, (WrappingComponentWrapper.__proto__ || Object.getPrototypeOf(WrappingComponentWrapper)).call(this, renderer.getNode(), root));

    (0, _Utils.privateSet)(_this30, ROOT, _this30);
    (0, _Utils.privateSet)(_this30, RENDERER, renderer);
    _this30[LINKED_ROOTS].push(root);
    return _this30;
  }

  _createClass(WrappingComponentWrapper, [{
    key: 'getWrappingComponent',
    value: function () {
      function getWrappingComponent() {
        throw new TypeError('ReactWrapper::getWrappingComponent() can only be called on the root');
      }

      return getWrappingComponent;
    }()
  }]);

  return WrappingComponentWrapper;
}(ReactWrapper);

if (_Utils.ITERATOR_SYMBOL) {
  Object.defineProperty(ReactWrapper.prototype, _Utils.ITERATOR_SYMBOL, {
    configurable: true,
    value: function () {
      function iterator() {
        var _ref;

        var iter = this[NODES][_Utils.ITERATOR_SYMBOL]();
        var adapter = (0, _getAdapter2['default'])(this[OPTIONS]);
        return _ref = {}, _defineProperty(_ref, _Utils.ITERATOR_SYMBOL, function () {
          return this;
        }), _defineProperty(_ref, 'next', function () {
          function next() {
            var next = iter.next();
            if (next.done) {
              return { done: true };
            }
            return {
              done: false,
              value: adapter.nodeToElement(next.value)
            };
          }

          return next;
        }()), _ref;
      }

      return iterator;
    }()
  });
}

function privateWarning(prop, extraMessage) {
  Object.defineProperty(ReactWrapper.prototype, prop, {
    get: function () {
      function get() {
        throw new Error('\n        Attempted to access ReactWrapper::' + String(prop) + ', which was previously a private property on\n        Enzyme ReactWrapper instances, but is no longer and should not be relied upon.\n        ' + String(extraMessage) + '\n      ');
      }

      return get;
    }(),

    enumerable: false,
    configurable: false
  });
}

privateWarning('node', 'Consider using the getElement() method instead.');
privateWarning('nodes', 'Consider using the getElements() method instead.');
privateWarning('renderer', '');
privateWarning('options', '');
privateWarning('complexSelector', '');

exports['default'] = ReactWrapper;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9SZWFjdFdyYXBwZXIuanMiXSwibmFtZXMiOlsiTk9ERSIsIk5PREVTIiwiUkVOREVSRVIiLCJVTlJFTkRFUkVEIiwiUk9PVCIsIk9QVElPTlMiLCJST09UX05PREVTIiwiV1JBUFBJTkdfQ09NUE9ORU5UIiwiTElOS0VEX1JPT1RTIiwiVVBEQVRFRF9CWSIsImZpbmRXaGVyZVVud3JhcHBlZCIsIndyYXBwZXIiLCJwcmVkaWNhdGUiLCJmaWx0ZXIiLCJ0cmVlRmlsdGVyIiwiZmxhdE1hcCIsIm4iLCJnZXROb2RlSW50ZXJuYWwiLCJmaWx0ZXJXaGVyZVVud3JhcHBlZCIsIndyYXAiLCJnZXROb2Rlc0ludGVybmFsIiwiQm9vbGVhbiIsImdldFJvb3ROb2RlSW50ZXJuYWwiLCJsZW5ndGgiLCJFcnJvciIsIm5vZGVQYXJlbnRzIiwibm9kZSIsInByaXZhdGVTZXROb2RlcyIsIm5vZGVzIiwiQXJyYXkiLCJpc0FycmF5IiwiUmVhY3RXcmFwcGVyIiwicm9vdCIsInBhc3NlZE9wdGlvbnMiLCJnbG9iYWwiLCJ3aW5kb3ciLCJkb2N1bWVudCIsIm9wdGlvbnMiLCJhZGFwdGVyIiwiaXNWYWxpZEVsZW1lbnQiLCJUeXBlRXJyb3IiLCJyZW5kZXJlciIsImNyZWF0ZVJlbmRlcmVyIiwibW9kZSIsInJlbmRlciIsImNvbnRleHQiLCJnZXROb2RlIiwid3JhcHBpbmdDb21wb25lbnQiLCJnZXRXcmFwcGluZ0NvbXBvbmVudFJlbmRlcmVyIiwiV3JhcHBpbmdDb21wb25lbnRXcmFwcGVyIiwicHVzaCIsInNpbmdsZSIsIm5vZGVUb0VsZW1lbnQiLCJtYXAiLCJub2RlVG9Ib3N0Tm9kZSIsInJlZm5hbWUiLCJpbnN0YW5jZSIsInJlZnMiLCJ1cGRhdGUiLCJmb3JFYWNoIiwibGlua2VkUm9vdCIsInVubW91bnQiLCJwcm9wcyIsImNhbGxiYWNrIiwidW5kZWZpbmVkIiwiYXJndW1lbnRzIiwic3RhdGUiLCJub2RlVHlwZSIsInNldFN0YXRlIiwiaW52b2tlU2V0U3RhdGVDYWxsYmFjayIsImNhbGwiLCJub2RlT3JOb2RlcyIsIm5vZGVFcXVhbCIsIm90aGVyIiwiZWxlbWVudFRvTm9kZSIsInJzdE5vZGUiLCJhIiwiYiIsImV2ZXJ5IiwiY29udGFpbnNNYXRjaGluZ0VsZW1lbnQiLCJzb21lIiwic2VsZWN0b3IiLCJodG1sIiwiY2hlZXJpbyIsImxvYWQiLCJldmVudCIsIm1vY2siLCJzaW11bGF0ZUV2ZW50IiwiZXJyb3IiLCJ0aGlzTm9kZSIsInNpbXVsYXRlRXJyb3IiLCJyb290Tm9kZSIsIm5vZGVIaWVyYXJjaHkiLCJjb25jYXQiLCJwcm9wc09mTm9kZSIsIm5hbWUiLCJfc3RhdGUiLCJfY29udGV4dCIsImFsbENoaWxkcmVuIiwieCIsImluZGV4IiwiY2hpbGRyZW4iLCJhdCIsImFsbFBhcmVudHMiLCJwYXJlbnRzIiwiZ2V0IiwiaXMiLCJtYXRjaGluZ0FuY2VzdG9ycyIsImZpcnN0IiwiZmluZFdoZXJlIiwicHJvcE5hbWUiLCJoYW5kbGVyIiwicHJvcCIsInJlc3BvbnNlIiwiUmFuZ2VFcnJvciIsInByb3BWYWx1ZSIsImVsZW1lbnQiLCJ3cmFwcGVkIiwia2V5IiwiZGlzcGxheU5hbWVPZk5vZGUiLCJjbGFzc05hbWUiLCJpbmRleE9mIiwiY29uc29sZSIsIndhcm4iLCJmbiIsImkiLCJpbml0aWFsVmFsdWUiLCJyZWR1Y2UiLCJhY2N1bSIsInJlZHVjZVJpZ2h0IiwiYmVnaW4iLCJlbmQiLCJzbGljZSIsImZsYXR0ZW5lZCIsImdldEVsZW1lbnRzIiwiZXhpc3RzIiwiZmluZCIsImZuTmFtZSIsImFyZ3MiLCJpbnRlcmNlcHRlciIsImF0dGFjaFRvIiwiZmlsdGVyV2hlcmUiLCJ0eXBlIiwiSVRFUkFUT1JfU1lNQk9MIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJwcm90b3R5cGUiLCJjb25maWd1cmFibGUiLCJ2YWx1ZSIsIml0ZXJhdG9yIiwiaXRlciIsIm5leHQiLCJkb25lIiwicHJpdmF0ZVdhcm5pbmciLCJleHRyYU1lc3NhZ2Ui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QyxRQUFoQjtBQUFBO0FBRjZELEdBQS9EO0FBb0JEOztBQUVELFNBQVNJLGNBQVQsQ0FBd0J6QyxJQUF4QixFQUE4QjBDLFlBQTlCLEVBQTRDO0FBQzFDVixTQUFPQyxjQUFQLENBQXNCbEgsYUFBYW1ILFNBQW5DLEVBQThDbEMsSUFBOUMsRUFBb0Q7QUFDbERQLE9BRGtEO0FBQUEscUJBQzVDO0FBQ0osY0FBTSxJQUFJakYsS0FBSix5REFDZ0N3RixJQURoQyw4SkFHRjBDLFlBSEUsZUFBTjtBQUtEOztBQVBpRDtBQUFBOztBQVFsREMsZ0JBQVksS0FSc0M7QUFTbERSLGtCQUFjO0FBVG9DLEdBQXBEO0FBV0Q7O0FBRURNLGVBQWUsTUFBZixFQUF1QixpREFBdkI7QUFDQUEsZUFBZSxPQUFmLEVBQXdCLGtEQUF4QjtBQUNBQSxlQUFlLFVBQWYsRUFBMkIsRUFBM0I7QUFDQUEsZUFBZSxTQUFmLEVBQTBCLEVBQTFCO0FBQ0FBLGVBQWUsaUJBQWYsRUFBa0MsRUFBbEM7O3FCQUVlMUgsWSIsImZpbGUiOiJSZWFjdFdyYXBwZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2hlZXJpbyBmcm9tICdjaGVlcmlvJztcbmltcG9ydCBmbGF0IGZyb20gJ2FycmF5LnByb3RvdHlwZS5mbGF0JztcbmltcG9ydCBoYXMgZnJvbSAnaGFzJztcblxuaW1wb3J0IHtcbiAgY29udGFpbnNDaGlsZHJlblN1YkFycmF5LFxuICB0eXBlT2ZOb2RlLFxuICBkaXNwbGF5TmFtZU9mTm9kZSxcbiAgSVRFUkFUT1JfU1lNQk9MLFxuICBub2RlRXF1YWwsXG4gIG5vZGVNYXRjaGVzLFxuICBtYWtlT3B0aW9ucyxcbiAgc3ltLFxuICBwcml2YXRlU2V0LFxuICBjbG9uZUVsZW1lbnQsXG4gIHJlbmRlcmVkRGl2ZSxcbiAgaXNDdXN0b21Db21wb25lbnQsXG59IGZyb20gJy4vVXRpbHMnO1xuaW1wb3J0IGdldEFkYXB0ZXIgZnJvbSAnLi9nZXRBZGFwdGVyJztcbmltcG9ydCB7IGRlYnVnTm9kZXMgfSBmcm9tICcuL0RlYnVnJztcbmltcG9ydCB7XG4gIHByb3BzT2ZOb2RlLFxuICBoYXNDbGFzc05hbWUsXG4gIGNoaWxkcmVuT2ZOb2RlLFxuICBwYXJlbnRzT2ZOb2RlLFxuICB0cmVlRmlsdGVyLFxuICBnZXRUZXh0RnJvbUhvc3ROb2RlcyxcbiAgZ2V0SFRNTEZyb21Ib3N0Tm9kZXMsXG59IGZyb20gJy4vUlNUVHJhdmVyc2FsJztcblxuaW1wb3J0IHsgYnVpbGRQcmVkaWNhdGUsIHJlZHVjZVRyZWVzQnlTZWxlY3RvciB9IGZyb20gJy4vc2VsZWN0b3JzJztcblxuY29uc3QgTk9ERSA9IHN5bSgnX19ub2RlX18nKTtcbmNvbnN0IE5PREVTID0gc3ltKCdfX25vZGVzX18nKTtcbmNvbnN0IFJFTkRFUkVSID0gc3ltKCdfX3JlbmRlcmVyX18nKTtcbmNvbnN0IFVOUkVOREVSRUQgPSBzeW0oJ19fdW5yZW5kZXJlZF9fJyk7XG5jb25zdCBST09UID0gc3ltKCdfX3Jvb3RfXycpO1xuY29uc3QgT1BUSU9OUyA9IHN5bSgnX19vcHRpb25zX18nKTtcbmNvbnN0IFJPT1RfTk9ERVMgPSBzeW0oJ19fcm9vdE5vZGVzX18nKTtcbmNvbnN0IFdSQVBQSU5HX0NPTVBPTkVOVCA9IHN5bSgnX193cmFwcGluZ0NvbXBvbmVudF9fJyk7XG5jb25zdCBMSU5LRURfUk9PVFMgPSBzeW0oJ19fbGlua2VkUm9vdHNfXycpO1xuY29uc3QgVVBEQVRFRF9CWSA9IHN5bSgnX191cGRhdGVkQnlfXycpO1xuXG4vKipcbiAqIEZpbmRzIGFsbCBub2RlcyBpbiB0aGUgY3VycmVudCB3cmFwcGVyIG5vZGVzJyByZW5kZXIgdHJlZXMgdGhhdCBtYXRjaCB0aGUgcHJvdmlkZWQgcHJlZGljYXRlXG4gKiBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0ge1JlYWN0V3JhcHBlcn0gd3JhcHBlclxuICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZGljYXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmaWx0ZXJcbiAqIEByZXR1cm5zIHtSZWFjdFdyYXBwZXJ9XG4gKi9cbmZ1bmN0aW9uIGZpbmRXaGVyZVVud3JhcHBlZCh3cmFwcGVyLCBwcmVkaWNhdGUsIGZpbHRlciA9IHRyZWVGaWx0ZXIpIHtcbiAgcmV0dXJuIHdyYXBwZXIuZmxhdE1hcChuID0+IGZpbHRlcihuLmdldE5vZGVJbnRlcm5hbCgpLCBwcmVkaWNhdGUpKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmV3IHdyYXBwZXIgaW5zdGFuY2Ugd2l0aCBvbmx5IHRoZSBub2RlcyBvZiB0aGUgY3VycmVudCB3cmFwcGVyIGluc3RhbmNlIHRoYXQgbWF0Y2hcbiAqIHRoZSBwcm92aWRlZCBwcmVkaWNhdGUgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHtSZWFjdFdyYXBwZXJ9IHdyYXBwZXJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWRpY2F0ZVxuICogQHJldHVybnMge1JlYWN0V3JhcHBlcn1cbiAqL1xuZnVuY3Rpb24gZmlsdGVyV2hlcmVVbndyYXBwZWQod3JhcHBlciwgcHJlZGljYXRlKSB7XG4gIHJldHVybiB3cmFwcGVyLndyYXAod3JhcHBlci5nZXROb2Rlc0ludGVybmFsKCkuZmlsdGVyKHByZWRpY2F0ZSkuZmlsdGVyKEJvb2xlYW4pKTtcbn1cblxuZnVuY3Rpb24gZ2V0Um9vdE5vZGVJbnRlcm5hbCh3cmFwcGVyKSB7XG4gIGlmICh3cmFwcGVyW1JPT1RdLmxlbmd0aCAhPT0gMSkge1xuICAgIHRocm93IG5ldyBFcnJvcignZ2V0Um9vdE5vZGVJbnRlcm5hbCh3cmFwcGVyKSBjYW4gb25seSBiZSBjYWxsZWQgd2hlbiB3cmFwcGVyIHdyYXBzIG9uZSBub2RlJyk7XG4gIH1cbiAgaWYgKHdyYXBwZXJbUk9PVF0gIT09IHdyYXBwZXIpIHtcbiAgICByZXR1cm4gd3JhcHBlcltST09UX05PREVTXVswXTtcbiAgfVxuICByZXR1cm4gd3JhcHBlcltST09UXVtOT0RFXTtcbn1cblxuZnVuY3Rpb24gbm9kZVBhcmVudHMod3JhcHBlciwgbm9kZSkge1xuICByZXR1cm4gcGFyZW50c09mTm9kZShub2RlLCBnZXRSb290Tm9kZUludGVybmFsKHdyYXBwZXIpKTtcbn1cblxuZnVuY3Rpb24gcHJpdmF0ZVNldE5vZGVzKHdyYXBwZXIsIG5vZGVzKSB7XG4gIGlmICghbm9kZXMpIHtcbiAgICBwcml2YXRlU2V0KHdyYXBwZXIsIE5PREUsIG51bGwpO1xuICAgIHByaXZhdGVTZXQod3JhcHBlciwgTk9ERVMsIFtdKTtcbiAgfSBlbHNlIGlmICghQXJyYXkuaXNBcnJheShub2RlcykpIHtcbiAgICBwcml2YXRlU2V0KHdyYXBwZXIsIE5PREUsIG5vZGVzKTtcbiAgICBwcml2YXRlU2V0KHdyYXBwZXIsIE5PREVTLCBbbm9kZXNdKTtcbiAgfSBlbHNlIHtcbiAgICBwcml2YXRlU2V0KHdyYXBwZXIsIE5PREUsIG5vZGVzWzBdKTtcbiAgICBwcml2YXRlU2V0KHdyYXBwZXIsIE5PREVTLCBub2Rlcyk7XG4gIH1cbiAgcHJpdmF0ZVNldCh3cmFwcGVyLCAnbGVuZ3RoJywgd3JhcHBlcltOT0RFU10ubGVuZ3RoKTtcbn1cblxuLyoqXG4gKiBAY2xhc3MgUmVhY3RXcmFwcGVyXG4gKi9cbmNsYXNzIFJlYWN0V3JhcHBlciB7XG4gIGNvbnN0cnVjdG9yKG5vZGVzLCByb290LCBwYXNzZWRPcHRpb25zID0ge30pIHtcbiAgICBpZiAoIWdsb2JhbC53aW5kb3cgJiYgIWdsb2JhbC5kb2N1bWVudCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJdCBsb29rcyBsaWtlIHlvdSBjYWxsZWQgYG1vdW50KClgIHdpdGhvdXQgYSBnbG9iYWwgZG9jdW1lbnQgYmVpbmcgbG9hZGVkLicpO1xuICAgIH1cbiAgICBjb25zdCBvcHRpb25zID0gbWFrZU9wdGlvbnMocGFzc2VkT3B0aW9ucyk7XG5cbiAgICBpZiAoIXJvb3QpIHtcbiAgICAgIGNvbnN0IGFkYXB0ZXIgPSBnZXRBZGFwdGVyKG9wdGlvbnMpO1xuICAgICAgaWYgKCFhZGFwdGVyLmlzVmFsaWRFbGVtZW50KG5vZGVzKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdSZWFjdFdyYXBwZXIgY2FuIG9ubHkgd3JhcCB2YWxpZCBlbGVtZW50cycpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZW5kZXJlciA9IGFkYXB0ZXIuY3JlYXRlUmVuZGVyZXIoeyBtb2RlOiAnbW91bnQnLCAuLi5vcHRpb25zIH0pO1xuICAgICAgcHJpdmF0ZVNldCh0aGlzLCBSRU5ERVJFUiwgcmVuZGVyZXIpO1xuICAgICAgcmVuZGVyZXIucmVuZGVyKG5vZGVzLCBvcHRpb25zLmNvbnRleHQpO1xuICAgICAgcHJpdmF0ZVNldCh0aGlzLCBST09ULCB0aGlzKTtcbiAgICAgIHByaXZhdGVTZXROb2Rlcyh0aGlzLCB0aGlzW1JFTkRFUkVSXS5nZXROb2RlKCkpO1xuICAgICAgcHJpdmF0ZVNldCh0aGlzLCBPUFRJT05TLCBvcHRpb25zKTtcbiAgICAgIHByaXZhdGVTZXQodGhpcywgTElOS0VEX1JPT1RTLCBbXSk7XG5cbiAgICAgIGlmIChpc0N1c3RvbUNvbXBvbmVudChvcHRpb25zLndyYXBwaW5nQ29tcG9uZW50LCBhZGFwdGVyKSkge1xuICAgICAgICBpZiAodHlwZW9mIHRoaXNbUkVOREVSRVJdLmdldFdyYXBwaW5nQ29tcG9uZW50UmVuZGVyZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCd5b3VyIGFkYXB0ZXIgZG9lcyBub3Qgc3VwcG9ydCBgd3JhcHBpbmdDb21wb25lbnRgLiBUcnkgdXBncmFkaW5nIGl0IScpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVzZS1iZWZvcmUtZGVmaW5lXG4gICAgICAgIHByaXZhdGVTZXQodGhpcywgV1JBUFBJTkdfQ09NUE9ORU5ULCBuZXcgV3JhcHBpbmdDb21wb25lbnRXcmFwcGVyKFxuICAgICAgICAgIHRoaXMsIHRoaXNbUkVOREVSRVJdLmdldFdyYXBwaW5nQ29tcG9uZW50UmVuZGVyZXIoKSxcbiAgICAgICAgKSk7XG4gICAgICAgIHRoaXNbTElOS0VEX1JPT1RTXS5wdXNoKHRoaXNbV1JBUFBJTkdfQ09NUE9ORU5UXSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHByaXZhdGVTZXQodGhpcywgUkVOREVSRVIsIHJvb3RbUkVOREVSRVJdKTtcbiAgICAgIHByaXZhdGVTZXQodGhpcywgUk9PVCwgcm9vdCk7XG4gICAgICBwcml2YXRlU2V0Tm9kZXModGhpcywgbm9kZXMpO1xuICAgICAgcHJpdmF0ZVNldCh0aGlzLCBST09UX05PREVTLCByb290W05PREVTXSk7XG4gICAgICBwcml2YXRlU2V0KHRoaXMsIE9QVElPTlMsIHJvb3RbT1BUSU9OU10pO1xuICAgICAgcHJpdmF0ZVNldCh0aGlzLCBMSU5LRURfUk9PVFMsIFtdKTtcbiAgICB9XG4gICAgcHJpdmF0ZVNldCh0aGlzLCBVTlJFTkRFUkVELCBub2Rlcyk7XG4gICAgcHJpdmF0ZVNldCh0aGlzLCBVUERBVEVEX0JZLCBudWxsKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSByb290IHdyYXBwZXJcbiAgICpcbiAgICogQHJldHVybiB7UmVhY3RXcmFwcGVyfVxuICAgKi9cbiAgcm9vdCgpIHtcbiAgICByZXR1cm4gdGhpc1tST09UXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB3cmFwcGVkIGNvbXBvbmVudC5cbiAgICpcbiAgICogQHJldHVybiB7UmVhY3RDb21wb25lbnR9XG4gICAqL1xuICBnZXROb2RlSW50ZXJuYWwoKSB7XG4gICAgaWYgKHRoaXMubGVuZ3RoICE9PSAxKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlYWN0V3JhcHBlcjo6Z2V0Tm9kZSgpIGNhbiBvbmx5IGJlIGNhbGxlZCB3aGVuIHdyYXBwaW5nIG9uZSBub2RlJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzW05PREVTXVswXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB0aGUgd3JhcHBlZCBjb21wb25lbnRzLlxuICAgKlxuICAgKiBAcmV0dXJuIHtBcnJheTxSZWFjdENvbXBvbmVudD59XG4gICAqL1xuICBnZXROb2Rlc0ludGVybmFsKCkge1xuICAgIHJldHVybiB0aGlzW05PREVTXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB3cmFwcGVkIFJlYWN0RWxlbWVudC5cbiAgICpcbiAgICogQHJldHVybiB7UmVhY3RFbGVtZW50fVxuICAgKi9cbiAgZ2V0RWxlbWVudCgpIHtcbiAgICByZXR1cm4gdGhpcy5zaW5nbGUoJ2dldEVsZW1lbnQnLCAoKSA9PiBnZXRBZGFwdGVyKHRoaXNbT1BUSU9OU10pLm5vZGVUb0VsZW1lbnQodGhpc1tOT0RFXSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHdyYXBwZWQgUmVhY3RFbGVtZW50cy5cbiAgICpcbiAgICogQHJldHVybiB7QXJyYXk8UmVhY3RFbGVtZW50Pn1cbiAgICovXG4gIGdldEVsZW1lbnRzKCkge1xuICAgIHJldHVybiB0aGlzW05PREVTXS5tYXAoZ2V0QWRhcHRlcih0aGlzW09QVElPTlNdKS5ub2RlVG9FbGVtZW50KTtcbiAgfVxuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjbGFzcy1tZXRob2RzLXVzZS10aGlzXG4gIGdldE5vZGUoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdSZWFjdFdyYXBwZXI6OmdldE5vZGUoKSBpcyBubyBsb25nZXIgc3VwcG9ydGVkLiBVc2UgUmVhY3RXcmFwcGVyOjppbnN0YW5jZSgpIGluc3RlYWQnKTtcbiAgfVxuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjbGFzcy1tZXRob2RzLXVzZS10aGlzXG4gIGdldE5vZGVzKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignUmVhY3RXcmFwcGVyOjpnZXROb2RlcygpIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQuJyk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgb3V0ZXIgbW9zdCBET01Db21wb25lbnQgb2YgdGhlIGN1cnJlbnQgd3JhcHBlci5cbiAgICpcbiAgICogTk9URTogY2FuIG9ubHkgYmUgY2FsbGVkIG9uIGEgd3JhcHBlciBvZiBhIHNpbmdsZSBub2RlLlxuICAgKlxuICAgKiBAcmV0dXJucyB7RE9NQ29tcG9uZW50fVxuICAgKi9cbiAgZ2V0RE9NTm9kZSgpIHtcbiAgICBjb25zdCBhZGFwdGVyID0gZ2V0QWRhcHRlcih0aGlzW09QVElPTlNdKTtcbiAgICByZXR1cm4gdGhpcy5zaW5nbGUoJ2dldERPTU5vZGUnLCBuID0+IGFkYXB0ZXIubm9kZVRvSG9zdE5vZGUobiwgdHJ1ZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIElmIHRoZSByb290IGNvbXBvbmVudCBjb250YWluZWQgYSByZWYsIHlvdSBjYW4gYWNjZXNzIGl0IGhlcmUgYW5kIGdldCB0aGUgcmVsZXZhbnRcbiAgICogcmVhY3QgY29tcG9uZW50IGluc3RhbmNlIG9yIEhUTUwgZWxlbWVudCBpbnN0YW5jZS5cbiAgICpcbiAgICogTk9URTogY2FuIG9ubHkgYmUgY2FsbGVkIG9uIGEgd3JhcHBlciBpbnN0YW5jZSB0aGF0IGlzIGFsc28gdGhlIHJvb3QgaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSByZWZuYW1lXG4gICAqIEByZXR1cm5zIHtSZWFjdENvbXBvbmVudCB8IEhUTUxFbGVtZW50fVxuICAgKi9cbiAgcmVmKHJlZm5hbWUpIHtcbiAgICBpZiAodGhpc1tST09UXSAhPT0gdGhpcykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZWFjdFdyYXBwZXI6OnJlZihyZWZuYW1lKSBjYW4gb25seSBiZSBjYWxsZWQgb24gdGhlIHJvb3QnKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuaW5zdGFuY2UoKS5yZWZzW3JlZm5hbWVdO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHdyYXBwZXIncyB1bmRlcmx5aW5nIGluc3RhbmNlLlxuICAgKlxuICAgKiBFeGFtcGxlOlxuICAgKiBgYGBcbiAgICogY29uc3Qgd3JhcHBlciA9IG1vdW50KDxNeUNvbXBvbmVudCAvPik7XG4gICAqIGNvbnN0IGluc3QgPSB3cmFwcGVyLmluc3RhbmNlKCk7XG4gICAqIGV4cGVjdChpbnN0KS50by5iZS5pbnN0YW5jZU9mKE15Q29tcG9uZW50KTtcbiAgICogYGBgXG4gICAqIEByZXR1cm5zIHtSZWFjdENvbXBvbmVudHxET01Db21wb25lbnR9XG4gICAqL1xuICBpbnN0YW5jZSgpIHtcbiAgICByZXR1cm4gdGhpcy5zaW5nbGUoJ2luc3RhbmNlJywgKCkgPT4gdGhpc1tOT0RFXS5pbnN0YW5jZSk7XG4gIH1cblxuICAvKipcbiAgICogSWYgYSBgd3JhcHBpbmdDb21wb25lbnRgIHdhcyBwYXNzZWQgaW4gYG9wdGlvbnNgLCB0aGlzIG1ldGhvZHMgcmV0dXJucyBhIGBSZWFjdFdyYXBwZXJgIGFyb3VuZFxuICAgKiB0aGUgcmVuZGVyZWQgYHdyYXBwaW5nQ29tcG9uZW50YC4gVGhpcyBgUmVhY3RXcmFwcGVyYCBjYW4gYmUgdXNlZCB0byB1cGRhdGUgdGhlXG4gICAqIGB3cmFwcGluZ0NvbXBvbmVudGAncyBwcm9wcywgc3RhdGUsIGV0Yy5cbiAgICpcbiAgICogQHJldHVybnMgUmVhY3RXcmFwcGVyXG4gICAqL1xuICBnZXRXcmFwcGluZ0NvbXBvbmVudCgpIHtcbiAgICBpZiAodGhpc1tST09UXSAhPT0gdGhpcykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZWFjdFdyYXBwZXI6OmdldFdyYXBwaW5nQ29tcG9uZW50KCkgY2FuIG9ubHkgYmUgY2FsbGVkIG9uIHRoZSByb290Jyk7XG4gICAgfVxuICAgIGlmICghdGhpc1tPUFRJT05TXS53cmFwcGluZ0NvbXBvbmVudCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZWFjdFdyYXBwZXI6OmdldFdyYXBwaW5nQ29tcG9uZW50KCkgY2FuIG9ubHkgYmUgY2FsbGVkIG9uIGEgd3JhcHBlciB0aGF0IHdhcyBvcmlnaW5hbGx5IHBhc3NlZCBhIGB3cmFwcGluZ0NvbXBvbmVudGAgb3B0aW9uJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzW1dSQVBQSU5HX0NPTVBPTkVOVF07XG4gIH1cblxuICAvKipcbiAgICogRm9yY2VzIGEgcmUtcmVuZGVyLiBVc2VmdWwgdG8gcnVuIGJlZm9yZSBjaGVja2luZyB0aGUgcmVuZGVyIG91dHB1dCBpZiBzb21ldGhpbmcgZXh0ZXJuYWxcbiAgICogbWF5IGJlIHVwZGF0aW5nIHRoZSBzdGF0ZSBvZiB0aGUgY29tcG9uZW50IHNvbWV3aGVyZS5cbiAgICpcbiAgICogTk9URTogbm8gbWF0dGVyIHdoYXQgaW5zdGFuY2UgdGhpcyBpcyBjYWxsZWQgb24sIGl0IHdpbGwgYWx3YXlzIHVwZGF0ZSB0aGUgcm9vdC5cbiAgICpcbiAgICogQHJldHVybnMge1JlYWN0V3JhcHBlcn1cbiAgICovXG4gIHVwZGF0ZSgpIHtcbiAgICBjb25zdCByb290ID0gdGhpc1tST09UXTtcbiAgICBpZiAodGhpcyAhPT0gcm9vdCkge1xuICAgICAgcmV0dXJuIHJvb3QudXBkYXRlKCk7XG4gICAgfVxuICAgIHByaXZhdGVTZXROb2Rlcyh0aGlzLCB0aGlzW1JFTkRFUkVSXS5nZXROb2RlKCkpO1xuICAgIHRoaXNbTElOS0VEX1JPT1RTXS5mb3JFYWNoKChsaW5rZWRSb290KSA9PiB7XG4gICAgICBpZiAobGlua2VkUm9vdCAhPT0gdGhpc1tVUERBVEVEX0JZXSkge1xuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1wYXJhbS1yZWFzc2lnbiAqL1xuICAgICAgICAvLyBPbmx5IHVwZGF0ZSBhIGxpbmtlZCBpdCByb290IGlmIGl0IGlzIG5vdCB0aGUgb3JpZ2luYXRvciBvZiBvdXIgdXBkYXRlKCkuXG4gICAgICAgIC8vIFRoaXMgaXMgbmVlZGVkIHRvIHByZXZlbnQgaW5maW5pdGUgcmVjdXJzaW9uIHdoZW4gdGhlcmUgaXMgYSBiaS1kaXJlY3Rpb25hbFxuICAgICAgICAvLyBsaW5rIGJldHdlZW4gdHdvIHJvb3RzLlxuICAgICAgICBsaW5rZWRSb290W1VQREFURURfQlldID0gdGhpcztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBsaW5rZWRSb290LnVwZGF0ZSgpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIGxpbmtlZFJvb3RbVVBEQVRFRF9CWV0gPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQSBtZXRob2QgdGhhdCB1bm1vdW50cyB0aGUgY29tcG9uZW50LiBUaGlzIGNhbiBiZSB1c2VkIHRvIHNpbXVsYXRlIGEgY29tcG9uZW50IGdvaW5nIHRocm91Z2hcbiAgICogYW5kIHVubW91bnQvbW91bnQgbGlmZWN5Y2xlLlxuICAgKlxuICAgKiBAcmV0dXJucyB7UmVhY3RXcmFwcGVyfVxuICAgKi9cbiAgdW5tb3VudCgpIHtcbiAgICBpZiAodGhpc1tST09UXSAhPT0gdGhpcykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZWFjdFdyYXBwZXI6OnVubW91bnQoKSBjYW4gb25seSBiZSBjYWxsZWQgb24gdGhlIHJvb3QnKTtcbiAgICB9XG4gICAgdGhpcy5zaW5nbGUoJ3VubW91bnQnLCAoKSA9PiB7XG4gICAgICB0aGlzW1JFTkRFUkVSXS51bm1vdW50KCk7XG4gICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgbWV0aG9kIHRoYXQgcmUtbW91bnRzIHRoZSBjb21wb25lbnQsIGlmIGl0IGlzIG5vdCBjdXJyZW50bHkgbW91bnRlZC5cbiAgICogVGhpcyBjYW4gYmUgdXNlZCB0byBzaW11bGF0ZSBhIGNvbXBvbmVudCBnb2luZyB0aHJvdWdoXG4gICAqIGFuIHVubW91bnQvbW91bnQgbGlmZWN5Y2xlLlxuICAgKlxuICAgKiBAcmV0dXJucyB7UmVhY3RXcmFwcGVyfVxuICAgKi9cbiAgbW91bnQoKSB7XG4gICAgaWYgKHRoaXNbUk9PVF0gIT09IHRoaXMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUmVhY3RXcmFwcGVyOjptb3VudCgpIGNhbiBvbmx5IGJlIGNhbGxlZCBvbiB0aGUgcm9vdCcpO1xuICAgIH1cbiAgICB0aGlzW1JFTkRFUkVSXS5yZW5kZXIodGhpc1tVTlJFTkRFUkVEXSwgdGhpc1tPUFRJT05TXS5jb250ZXh0LCAoKSA9PiB0aGlzLnVwZGF0ZSgpKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBBIG1ldGhvZCB0aGF0IHNldHMgdGhlIHByb3BzIG9mIHRoZSByb290IGNvbXBvbmVudCwgYW5kIHJlLXJlbmRlcnMuIFVzZWZ1bCBmb3Igd2hlbiB5b3UgYXJlXG4gICAqIHdhbnRpbmcgdG8gdGVzdCBob3cgdGhlIGNvbXBvbmVudCBiZWhhdmVzIG92ZXIgdGltZSB3aXRoIGNoYW5naW5nIHByb3BzLiBDYWxsaW5nIHRoaXMsIGZvclxuICAgKiBpbnN0YW5jZSwgd2lsbCBjYWxsIHRoZSBgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wc2AgbGlmZWN5Y2xlIG1ldGhvZC5cbiAgICpcbiAgICogU2ltaWxhciB0byBgc2V0U3RhdGVgLCB0aGlzIG1ldGhvZCBhY2NlcHRzIGEgcHJvcHMgb2JqZWN0IGFuZCB3aWxsIG1lcmdlIGl0IGluIHdpdGggdGhlIGFscmVhZHlcbiAgICogZXhpc3RpbmcgcHJvcHMuXG4gICAqXG4gICAqIE5PVEU6IGNhbiBvbmx5IGJlIGNhbGxlZCBvbiBhIHdyYXBwZXIgaW5zdGFuY2UgdGhhdCBpcyBhbHNvIHRoZSByb290IGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gcHJvcHMgb2JqZWN0XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIC0gY2FsbGJhY2sgZnVuY3Rpb25cbiAgICogQHJldHVybnMge1JlYWN0V3JhcHBlcn1cbiAgICovXG4gIHNldFByb3BzKHByb3BzLCBjYWxsYmFjayA9IHVuZGVmaW5lZCkge1xuICAgIGlmICh0aGlzW1JPT1RdICE9PSB0aGlzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlYWN0V3JhcHBlcjo6c2V0UHJvcHMoKSBjYW4gb25seSBiZSBjYWxsZWQgb24gdGhlIHJvb3QnKTtcbiAgICB9XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignUmVhY3RXcmFwcGVyOjpzZXRQcm9wcygpIGV4cGVjdHMgYSBmdW5jdGlvbiBhcyBpdHMgc2Vjb25kIGFyZ3VtZW50Jyk7XG4gICAgfVxuICAgIGNvbnN0IGFkYXB0ZXIgPSBnZXRBZGFwdGVyKHRoaXNbT1BUSU9OU10pO1xuICAgIHRoaXNbVU5SRU5ERVJFRF0gPSBjbG9uZUVsZW1lbnQoYWRhcHRlciwgdGhpc1tVTlJFTkRFUkVEXSwgcHJvcHMpO1xuICAgIHRoaXNbUkVOREVSRVJdLnJlbmRlcih0aGlzW1VOUkVOREVSRURdLCBudWxsLCAoKSA9PiB7XG4gICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQSBtZXRob2QgdG8gaW52b2tlIGBzZXRTdGF0ZWAgb24gdGhlIHJvb3QgY29tcG9uZW50IGluc3RhbmNlIHNpbWlsYXIgdG8gaG93IHlvdSBtaWdodCBpbiB0aGVcbiAgICogZGVmaW5pdGlvbiBvZiB0aGUgY29tcG9uZW50LCBhbmQgcmUtcmVuZGVycy4gIFRoaXMgbWV0aG9kIGlzIHVzZWZ1bCBmb3IgdGVzdGluZyB5b3VyIGNvbXBvbmVudFxuICAgKiBpbiBoYXJkIHRvIGFjaGlldmUgc3RhdGVzLCBob3dldmVyIHNob3VsZCBiZSB1c2VkIHNwYXJpbmdseS4gSWYgcG9zc2libGUsIHlvdSBzaG91bGQgdXRpbGl6ZVxuICAgKiB5b3VyIGNvbXBvbmVudCdzIGV4dGVybmFsIEFQSSBpbiBvcmRlciB0byBnZXQgaXQgaW50byB3aGF0ZXZlciBzdGF0ZSB5b3Ugd2FudCB0byB0ZXN0LCBpbiBvcmRlclxuICAgKiB0byBiZSBhcyBhY2N1cmF0ZSBvZiBhIHRlc3QgYXMgcG9zc2libGUuIFRoaXMgaXMgbm90IGFsd2F5cyBwcmFjdGljYWwsIGhvd2V2ZXIuXG4gICAqXG4gICAqIE5PVEU6IGNhbiBvbmx5IGJlIGNhbGxlZCBvbiBhIHdyYXBwZXIgaW5zdGFuY2UgdGhhdCBpcyBhbHNvIHRoZSByb290IGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gc3RhdGUgdG8gbWVyZ2VcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBjYWxsYmFjayBmdW5jdGlvblxuICAgKiBAcmV0dXJucyB7UmVhY3RXcmFwcGVyfVxuICAgKi9cbiAgc2V0U3RhdGUoc3RhdGUsIGNhbGxiYWNrID0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKHRoaXMuaW5zdGFuY2UoKSA9PT0gbnVsbCB8fCB0aGlzLmdldE5vZGVJbnRlcm5hbCgpLm5vZGVUeXBlICE9PSAnY2xhc3MnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlYWN0V3JhcHBlcjo6c2V0U3RhdGUoKSBjYW4gb25seSBiZSBjYWxsZWQgb24gY2xhc3MgY29tcG9uZW50cycpO1xuICAgIH1cbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgdHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdSZWFjdFdyYXBwZXI6OnNldFN0YXRlKCkgZXhwZWN0cyBhIGZ1bmN0aW9uIGFzIGl0cyBzZWNvbmQgYXJndW1lbnQnKTtcbiAgICB9XG4gICAgdGhpcy5pbnN0YW5jZSgpLnNldFN0YXRlKHN0YXRlLCAoKSA9PiB7XG4gICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGFkYXB0ZXIgPSBnZXRBZGFwdGVyKHRoaXNbT1BUSU9OU10pO1xuICAgICAgICBjb25zdCBpbnN0YW5jZSA9IHRoaXMuaW5zdGFuY2UoKTtcbiAgICAgICAgaWYgKGFkYXB0ZXIuaW52b2tlU2V0U3RhdGVDYWxsYmFjaykge1xuICAgICAgICAgIGFkYXB0ZXIuaW52b2tlU2V0U3RhdGVDYWxsYmFjayhpbnN0YW5jZSwgY2FsbGJhY2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNhbGxiYWNrLmNhbGwoaW5zdGFuY2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQSBtZXRob2QgdGhhdCBzZXRzIHRoZSBjb250ZXh0IG9mIHRoZSByb290IGNvbXBvbmVudCwgYW5kIHJlLXJlbmRlcnMuIFVzZWZ1bCBmb3Igd2hlbiB5b3UgYXJlXG4gICAqIHdhbnRpbmcgdG8gdGVzdCBob3cgdGhlIGNvbXBvbmVudCBiZWhhdmVzIG92ZXIgdGltZSB3aXRoIGNoYW5naW5nIGNvbnRleHRzLlxuICAgKlxuICAgKiBOT1RFOiBjYW4gb25seSBiZSBjYWxsZWQgb24gYSB3cmFwcGVyIGluc3RhbmNlIHRoYXQgaXMgYWxzbyB0aGUgcm9vdCBpbnN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHQgb2JqZWN0XG4gICAqIEByZXR1cm5zIHtSZWFjdFdyYXBwZXJ9XG4gICAqL1xuICBzZXRDb250ZXh0KGNvbnRleHQpIHtcbiAgICBpZiAodGhpc1tST09UXSAhPT0gdGhpcykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZWFjdFdyYXBwZXI6OnNldENvbnRleHQoKSBjYW4gb25seSBiZSBjYWxsZWQgb24gdGhlIHJvb3QnKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzW09QVElPTlNdLmNvbnRleHQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUmVhY3RXcmFwcGVyOjpzZXRDb250ZXh0KCkgY2FuIG9ubHkgYmUgY2FsbGVkIG9uIGEgd3JhcHBlciB0aGF0IHdhcyBvcmlnaW5hbGx5IHBhc3NlZCBhIGNvbnRleHQgb3B0aW9uJyk7XG4gICAgfVxuICAgIHRoaXNbUkVOREVSRVJdLnJlbmRlcih0aGlzW1VOUkVOREVSRURdLCBjb250ZXh0LCAoKSA9PiB0aGlzLnVwZGF0ZSgpKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCBhIGdpdmVuIHJlYWN0IGVsZW1lbnQgZXhpc3RzIGluIHRoZSBtb3VudCByZW5kZXIgdHJlZS5cbiAgICpcbiAgICogRXhhbXBsZTpcbiAgICogYGBgXG4gICAqIGNvbnN0IHdyYXBwZXIgPSBtb3VudCg8TXlDb21wb25lbnQgLz4pO1xuICAgKiBleHBlY3Qod3JhcHBlci5jb250YWlucyg8ZGl2IGNsYXNzTmFtZT1cImZvbyBiYXJcIiAvPikpLnRvLmVxdWFsKHRydWUpO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtSZWFjdEVsZW1lbnR8QXJyYXk8UmVhY3RFbGVtZW50Pn0gbm9kZU9yTm9kZXNcbiAgICogQHJldHVybnMge0Jvb2xlYW59XG4gICAqL1xuICBjb250YWlucyhub2RlT3JOb2Rlcykge1xuICAgIGNvbnN0IGFkYXB0ZXIgPSBnZXRBZGFwdGVyKHRoaXNbT1BUSU9OU10pO1xuXG4gICAgY29uc3QgcHJlZGljYXRlID0gQXJyYXkuaXNBcnJheShub2RlT3JOb2RlcylcbiAgICAgID8gb3RoZXIgPT4gY29udGFpbnNDaGlsZHJlblN1YkFycmF5KFxuICAgICAgICBub2RlRXF1YWwsXG4gICAgICAgIG90aGVyLFxuICAgICAgICBub2RlT3JOb2Rlcy5tYXAobm9kZSA9PiBhZGFwdGVyLmVsZW1lbnRUb05vZGUobm9kZSkpLFxuICAgICAgKVxuICAgICAgOiBvdGhlciA9PiBub2RlRXF1YWwoYWRhcHRlci5lbGVtZW50VG9Ob2RlKG5vZGVPck5vZGVzKSwgb3RoZXIpO1xuXG4gICAgcmV0dXJuIGZpbmRXaGVyZVVud3JhcHBlZCh0aGlzLCBwcmVkaWNhdGUpLmxlbmd0aCA+IDA7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgYSBnaXZlbiByZWFjdCBlbGVtZW50IGV4aXN0cyBpbiB0aGUgY3VycmVudCByZW5kZXIgdHJlZS5cbiAgICogSXQgd2lsbCBkZXRlcm1pbmUgaWYgb25lIG9mIHRoZSB3cmFwcGVycyBlbGVtZW50IFwibG9va3MgbGlrZVwiIHRoZSBleHBlY3RlZFxuICAgKiBlbGVtZW50IGJ5IGNoZWNraW5nIGlmIGFsbCBwcm9wcyBvZiB0aGUgZXhwZWN0ZWQgZWxlbWVudCBhcmUgcHJlc2VudFxuICAgKiBvbiB0aGUgd3JhcHBlcnMgZWxlbWVudCBhbmQgZXF1YWxzIHRvIGVhY2ggb3RoZXIuXG4gICAqXG4gICAqIEV4YW1wbGU6XG4gICAqIGBgYFxuICAgKiAvLyBNeUNvbXBvbmVudCBvdXRwdXRzIDxkaXY+PGRpdiBjbGFzcz1cImZvb1wiPkhlbGxvPC9kaXY+PC9kaXY+XG4gICAqIGNvbnN0IHdyYXBwZXIgPSBtb3VudCg8TXlDb21wb25lbnQgLz4pO1xuICAgKiBleHBlY3Qod3JhcHBlci5jb250YWluc01hdGNoaW5nRWxlbWVudCg8ZGl2PkhlbGxvPC9kaXY+KSkudG8uZXF1YWwodHJ1ZSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge1JlYWN0RWxlbWVudH0gbm9kZVxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICovXG4gIGNvbnRhaW5zTWF0Y2hpbmdFbGVtZW50KG5vZGUpIHtcbiAgICBjb25zdCByc3ROb2RlID0gZ2V0QWRhcHRlcih0aGlzW09QVElPTlNdKS5lbGVtZW50VG9Ob2RlKG5vZGUpO1xuICAgIGNvbnN0IHByZWRpY2F0ZSA9IG90aGVyID0+IG5vZGVNYXRjaGVzKHJzdE5vZGUsIG90aGVyLCAoYSwgYikgPT4gYSA8PSBiKTtcbiAgICByZXR1cm4gZmluZFdoZXJlVW53cmFwcGVkKHRoaXMsIHByZWRpY2F0ZSkubGVuZ3RoID4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCBhbGwgdGhlIGdpdmVuIHJlYWN0IGVsZW1lbnRzIGV4aXN0cyBpbiB0aGUgY3VycmVudCByZW5kZXIgdHJlZS5cbiAgICogSXQgd2lsbCBkZXRlcm1pbmUgaWYgb25lIG9mIHRoZSB3cmFwcGVycyBlbGVtZW50IFwibG9va3MgbGlrZVwiIHRoZSBleHBlY3RlZFxuICAgKiBlbGVtZW50IGJ5IGNoZWNraW5nIGlmIGFsbCBwcm9wcyBvZiB0aGUgZXhwZWN0ZWQgZWxlbWVudCBhcmUgcHJlc2VudFxuICAgKiBvbiB0aGUgd3JhcHBlcnMgZWxlbWVudCBhbmQgZXF1YWxzIHRvIGVhY2ggb3RoZXIuXG4gICAqXG4gICAqIEV4YW1wbGU6XG4gICAqIGBgYFxuICAgKiBjb25zdCB3cmFwcGVyID0gbW91bnQoPE15Q29tcG9uZW50IC8+KTtcbiAgICogZXhwZWN0KHdyYXBwZXIuY29udGFpbnNBbGxNYXRjaGluZ0VsZW1lbnRzKFtcbiAgICogICA8ZGl2PkhlbGxvPC9kaXY+LFxuICAgKiAgIDxkaXY+R29vZGJ5ZTwvZGl2PixcbiAgICogXSkpLnRvLmVxdWFsKHRydWUpO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtBcnJheTxSZWFjdEVsZW1lbnQ+fSBub2Rlc1xuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICovXG4gIGNvbnRhaW5zQWxsTWF0Y2hpbmdFbGVtZW50cyhub2Rlcykge1xuICAgIGlmICghQXJyYXkuaXNBcnJheShub2RlcykpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ25vZGVzIHNob3VsZCBiZSBhbiBBcnJheScpO1xuICAgIH1cblxuICAgIHJldHVybiBub2Rlcy5ldmVyeShub2RlID0+IHRoaXMuY29udGFpbnNNYXRjaGluZ0VsZW1lbnQobm9kZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IG9uZSBvZiB0aGUgZ2l2ZW4gcmVhY3QgZWxlbWVudHMgZXhpc3RzIGluIHRoZSBjdXJyZW50IHJlbmRlciB0cmVlLlxuICAgKiBJdCB3aWxsIGRldGVybWluZSBpZiBvbmUgb2YgdGhlIHdyYXBwZXJzIGVsZW1lbnQgXCJsb29rcyBsaWtlXCIgdGhlIGV4cGVjdGVkXG4gICAqIGVsZW1lbnQgYnkgY2hlY2tpbmcgaWYgYWxsIHByb3BzIG9mIHRoZSBleHBlY3RlZCBlbGVtZW50IGFyZSBwcmVzZW50XG4gICAqIG9uIHRoZSB3cmFwcGVycyBlbGVtZW50IGFuZCBlcXVhbHMgdG8gZWFjaCBvdGhlci5cbiAgICpcbiAgICogRXhhbXBsZTpcbiAgICogYGBgXG4gICAqIGNvbnN0IHdyYXBwZXIgPSBtb3VudCg8TXlDb21wb25lbnQgLz4pO1xuICAgKiBleHBlY3Qod3JhcHBlci5jb250YWluc0FueU1hdGNoaW5nRWxlbWVudHMoW1xuICAgKiAgIDxkaXY+SGVsbG88L2Rpdj4sXG4gICAqICAgPGRpdj5Hb29kYnllPC9kaXY+LFxuICAgKiBdKSkudG8uZXF1YWwodHJ1ZSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge0FycmF5PFJlYWN0RWxlbWVudD59IG5vZGVzXG4gICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgKi9cbiAgY29udGFpbnNBbnlNYXRjaGluZ0VsZW1lbnRzKG5vZGVzKSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkobm9kZXMpICYmIG5vZGVzLnNvbWUobm9kZSA9PiB0aGlzLmNvbnRhaW5zTWF0Y2hpbmdFbGVtZW50KG5vZGUpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCBhIGdpdmVuIHJlYWN0IGVsZW1lbnQgZXhpc3RzIGluIHRoZSByZW5kZXIgdHJlZS5cbiAgICpcbiAgICogRXhhbXBsZTpcbiAgICogYGBgXG4gICAqIGNvbnN0IHdyYXBwZXIgPSBtb3VudCg8TXlDb21wb25lbnQgLz4pO1xuICAgKiBleHBlY3Qod3JhcHBlci5jb250YWlucyg8ZGl2IGNsYXNzTmFtZT1cImZvbyBiYXJcIiAvPikpLnRvLmVxdWFsKHRydWUpO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtSZWFjdEVsZW1lbnR9IG5vZGVcbiAgICogQHJldHVybnMge0Jvb2xlYW59XG4gICAqL1xuICBlcXVhbHMobm9kZSkge1xuICAgIHJldHVybiB0aGlzLnNpbmdsZSgnZXF1YWxzJywgKCkgPT4gbm9kZUVxdWFsKHRoaXMuZ2V0Tm9kZUludGVybmFsKCksIG5vZGUpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCBhIGdpdmVuIHJlYWN0IGVsZW1lbnQgbWF0Y2hlcyB0aGUgcmVuZGVyIHRyZWUuXG4gICAqIE1hdGNoIGlzIGJhc2VkIG9uIHRoZSBleHBlY3RlZCBlbGVtZW50IGFuZCBub3Qgb24gd3JhcHBlciByb290IG5vZGUuXG4gICAqIEl0IHdpbGwgZGV0ZXJtaW5lIGlmIHRoZSB3cmFwcGVyIHJvb3Qgbm9kZSBcImxvb2tzIGxpa2VcIiB0aGUgZXhwZWN0ZWRcbiAgICogZWxlbWVudCBieSBjaGVja2luZyBpZiBhbGwgcHJvcHMgb2YgdGhlIGV4cGVjdGVkIGVsZW1lbnQgYXJlIHByZXNlbnRcbiAgICogb24gdGhlIHdyYXBwZXIgcm9vdCBub2RlIGFuZCBlcXVhbHMgdG8gZWFjaCBvdGhlci5cbiAgICpcbiAgICogRXhhbXBsZTpcbiAgICogYGBgXG4gICAqIC8vIE15Q29tcG9uZW50IG91dHB1dHMgPGRpdiBjbGFzcz1cImZvb1wiPkhlbGxvPC9kaXY+XG4gICAqIGNvbnN0IHdyYXBwZXIgPSBtb3VudCg8TXlDb21wb25lbnQgLz4pO1xuICAgKiBleHBlY3Qod3JhcHBlci5tYXRjaGVzRWxlbWVudCg8ZGl2PkhlbGxvPC9kaXY+KSkudG8uZXF1YWwodHJ1ZSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge1JlYWN0RWxlbWVudH0gbm9kZVxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICovXG4gIG1hdGNoZXNFbGVtZW50KG5vZGUpIHtcbiAgICByZXR1cm4gdGhpcy5zaW5nbGUoJ21hdGNoZXNFbGVtZW50JywgKCkgPT4ge1xuICAgICAgY29uc3QgYWRhcHRlciA9IGdldEFkYXB0ZXIodGhpc1tPUFRJT05TXSk7XG4gICAgICBjb25zdCByc3ROb2RlID0gYWRhcHRlci5lbGVtZW50VG9Ob2RlKG5vZGUpO1xuICAgICAgcmV0dXJuIG5vZGVNYXRjaGVzKHJzdE5vZGUsIHRoaXMuZ2V0Tm9kZUludGVybmFsKCksIChhLCBiKSA9PiBhIDw9IGIpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmRzIGV2ZXJ5IG5vZGUgaW4gdGhlIHJlbmRlciB0cmVlIG9mIHRoZSBjdXJyZW50IHdyYXBwZXIgdGhhdCBtYXRjaGVzIHRoZSBwcm92aWRlZCBzZWxlY3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHtFbnp5bWVTZWxlY3Rvcn0gc2VsZWN0b3JcbiAgICogQHJldHVybnMge1JlYWN0V3JhcHBlcn1cbiAgICovXG4gIGZpbmQoc2VsZWN0b3IpIHtcbiAgICByZXR1cm4gdGhpcy53cmFwKHJlZHVjZVRyZWVzQnlTZWxlY3RvcihzZWxlY3RvciwgdGhpcy5nZXROb2Rlc0ludGVybmFsKCkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHdoZXRoZXIgb3Igbm90IGN1cnJlbnQgbm9kZSBtYXRjaGVzIGEgcHJvdmlkZWQgc2VsZWN0b3IuXG4gICAqXG4gICAqIE5PVEU6IGNhbiBvbmx5IGJlIGNhbGxlZCBvbiBhIHdyYXBwZXIgb2YgYSBzaW5nbGUgbm9kZS5cbiAgICpcbiAgICogQHBhcmFtIHtFbnp5bWVTZWxlY3Rvcn0gc2VsZWN0b3JcbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuICBpcyhzZWxlY3Rvcikge1xuICAgIGNvbnN0IHByZWRpY2F0ZSA9IGJ1aWxkUHJlZGljYXRlKHNlbGVjdG9yKTtcbiAgICByZXR1cm4gdGhpcy5zaW5nbGUoJ2lzJywgbiA9PiBwcmVkaWNhdGUobikpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgY29tcG9uZW50IHJlbmRlcmVkIG5vdGhpbmcsIGkuZS4sIG51bGwgb3IgZmFsc2UuXG4gICAqXG4gICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgKi9cbiAgaXNFbXB0eVJlbmRlcigpIHtcbiAgICBjb25zdCBub2RlcyA9IHRoaXMuZ2V0Tm9kZUludGVybmFsKCk7XG5cbiAgICByZXR1cm4gcmVuZGVyZWREaXZlKG5vZGVzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgbmV3IHdyYXBwZXIgaW5zdGFuY2Ugd2l0aCBvbmx5IHRoZSBub2RlcyBvZiB0aGUgY3VycmVudCB3cmFwcGVyIGluc3RhbmNlIHRoYXQgbWF0Y2hcbiAgICogdGhlIHByb3ZpZGVkIHByZWRpY2F0ZSBmdW5jdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZGljYXRlXG4gICAqIEByZXR1cm5zIHtSZWFjdFdyYXBwZXJ9XG4gICAqL1xuICBmaWx0ZXJXaGVyZShwcmVkaWNhdGUpIHtcbiAgICByZXR1cm4gZmlsdGVyV2hlcmVVbndyYXBwZWQodGhpcywgbiA9PiBwcmVkaWNhdGUodGhpcy53cmFwKG4pKSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIG5ldyB3cmFwcGVyIGluc3RhbmNlIHdpdGggb25seSB0aGUgbm9kZXMgb2YgdGhlIGN1cnJlbnQgd3JhcHBlciBpbnN0YW5jZSB0aGF0IG1hdGNoXG4gICAqIHRoZSBwcm92aWRlZCBzZWxlY3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHtFbnp5bWVTZWxlY3Rvcn0gc2VsZWN0b3JcbiAgICogQHJldHVybnMge1JlYWN0V3JhcHBlcn1cbiAgICovXG4gIGZpbHRlcihzZWxlY3Rvcikge1xuICAgIGNvbnN0IHByZWRpY2F0ZSA9IGJ1aWxkUHJlZGljYXRlKHNlbGVjdG9yKTtcbiAgICByZXR1cm4gZmlsdGVyV2hlcmVVbndyYXBwZWQodGhpcywgcHJlZGljYXRlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgbmV3IHdyYXBwZXIgaW5zdGFuY2Ugd2l0aCBvbmx5IHRoZSBub2RlcyBvZiB0aGUgY3VycmVudCB3cmFwcGVyIHRoYXQgZGlkIG5vdCBtYXRjaFxuICAgKiB0aGUgcHJvdmlkZWQgc2VsZWN0b3IuIEVzc2VudGlhbGx5IHRoZSBpbnZlcnNlIG9mIGBmaWx0ZXJgLlxuICAgKlxuICAgKiBAcGFyYW0ge0VuenltZVNlbGVjdG9yfSBzZWxlY3RvclxuICAgKiBAcmV0dXJucyB7UmVhY3RXcmFwcGVyfVxuICAgKi9cbiAgbm90KHNlbGVjdG9yKSB7XG4gICAgY29uc3QgcHJlZGljYXRlID0gYnVpbGRQcmVkaWNhdGUoc2VsZWN0b3IpO1xuICAgIHJldHVybiBmaWx0ZXJXaGVyZVVud3JhcHBlZCh0aGlzLCBuID0+ICFwcmVkaWNhdGUobikpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBzdHJpbmcgb2YgdGhlIHJlbmRlcmVkIHRleHQgb2YgdGhlIGN1cnJlbnQgcmVuZGVyIHRyZWUuICBUaGlzIGZ1bmN0aW9uIHNob3VsZCBiZVxuICAgKiBsb29rZWQgYXQgd2l0aCBza2VwdGljaXNtIGlmIGJlaW5nIHVzZWQgdG8gdGVzdCB3aGF0IHRoZSBhY3R1YWwgSFRNTCBvdXRwdXQgb2YgdGhlIGNvbXBvbmVudFxuICAgKiB3aWxsIGJlLiBJZiB0aGF0IGlzIHdoYXQgeW91IHdvdWxkIGxpa2UgdG8gdGVzdCwgdXNlIGVuenltZSdzIGByZW5kZXJgIGZ1bmN0aW9uIGluc3RlYWQuXG4gICAqXG4gICAqIE5PVEU6IGNhbiBvbmx5IGJlIGNhbGxlZCBvbiBhIHdyYXBwZXIgb2YgYSBzaW5nbGUgbm9kZS5cbiAgICpcbiAgICogQHJldHVybnMge1N0cmluZ31cbiAgICovXG4gIHRleHQoKSB7XG4gICAgY29uc3QgYWRhcHRlciA9IGdldEFkYXB0ZXIodGhpc1tPUFRJT05TXSk7XG4gICAgcmV0dXJuIHRoaXMuc2luZ2xlKCd0ZXh0JywgbiA9PiBnZXRUZXh0RnJvbUhvc3ROb2RlcyhuLCBhZGFwdGVyKSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgSFRNTCBvZiB0aGUgbm9kZS5cbiAgICpcbiAgICogTk9URTogY2FuIG9ubHkgYmUgY2FsbGVkIG9uIGEgd3JhcHBlciBvZiBhIHNpbmdsZSBub2RlLlxuICAgKlxuICAgKiBAcmV0dXJucyB7U3RyaW5nfVxuICAgKi9cbiAgaHRtbCgpIHtcbiAgICBjb25zdCBhZGFwdGVyID0gZ2V0QWRhcHRlcih0aGlzW09QVElPTlNdKTtcbiAgICByZXR1cm4gdGhpcy5zaW5nbGUoJ2h0bWwnLCBuID0+IGdldEhUTUxGcm9tSG9zdE5vZGVzKG4sIGFkYXB0ZXIpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IG5vZGUgcmVuZGVyZWQgdG8gSFRNTCBhbmQgd3JhcHBlZCBpbiBhIENoZWVyaW9XcmFwcGVyLlxuICAgKlxuICAgKiBOT1RFOiBjYW4gb25seSBiZSBjYWxsZWQgb24gYSB3cmFwcGVyIG9mIGEgc2luZ2xlIG5vZGUuXG4gICAqXG4gICAqIEByZXR1cm5zIHtDaGVlcmlvV3JhcHBlcn1cbiAgICovXG4gIHJlbmRlcigpIHtcbiAgICBjb25zdCBodG1sID0gdGhpcy5odG1sKCk7XG4gICAgcmV0dXJuIGh0bWwgPT09IG51bGwgPyBjaGVlcmlvKCkgOiBjaGVlcmlvLmxvYWQoJycpKGh0bWwpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gc2ltdWxhdGUgZXZlbnRzLiBQYXNzIGFuIGV2ZW50bmFtZSBhbmQgKG9wdGlvbmFsbHkpIGV2ZW50IGFyZ3VtZW50cy4gVGhpcyBtZXRob2Qgb2ZcbiAgICogdGVzdGluZyBldmVudHMgc2hvdWxkIGJlIG1ldCB3aXRoIHNvbWUgc2tlcHRpY2lzbS5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBtb2NrIChvcHRpb25hbClcbiAgICogQHJldHVybnMge1JlYWN0V3JhcHBlcn1cbiAgICovXG4gIHNpbXVsYXRlKGV2ZW50LCBtb2NrID0ge30pIHtcbiAgICByZXR1cm4gdGhpcy5zaW5nbGUoJ3NpbXVsYXRlJywgKG4pID0+IHtcbiAgICAgIHRoaXNbUkVOREVSRVJdLnNpbXVsYXRlRXZlbnQobiwgZXZlbnQsIG1vY2spO1xuICAgICAgdGhpc1tST09UXS51cGRhdGUoKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gc2ltdWxhdGUgdGhyb3dpbmcgYSByZW5kZXJpbmcgZXJyb3IuIFBhc3MgYW4gZXJyb3IgdG8gdGhyb3cuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBlcnJvclxuICAgKiBAcmV0dXJucyB7UmVhY3RXcmFwcGVyfVxuICAgKi9cbiAgc2ltdWxhdGVFcnJvcihlcnJvcikge1xuICAgIGlmICh0aGlzW1JPT1RdID09PSB0aGlzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlYWN0V3JhcHBlcjo6c2ltdWxhdGVFcnJvcigpIG1heSBub3QgYmUgY2FsbGVkIG9uIHRoZSByb290Jyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuc2luZ2xlKCdzaW11bGF0ZUVycm9yJywgKHRoaXNOb2RlKSA9PiB7XG4gICAgICBpZiAodGhpc05vZGUubm9kZVR5cGUgPT09ICdob3N0Jykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlYWN0V3JhcHBlcjo6c2ltdWxhdGVFcnJvcigpIGNhbiBvbmx5IGJlIGNhbGxlZCBvbiBjdXN0b20gY29tcG9uZW50cycpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZW5kZXJlciA9IHRoaXNbUkVOREVSRVJdO1xuICAgICAgaWYgKHR5cGVvZiByZW5kZXJlci5zaW11bGF0ZUVycm9yICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3lvdXIgYWRhcHRlciBkb2VzIG5vdCBzdXBwb3J0IGBzaW11bGF0ZUVycm9yYC4gVHJ5IHVwZ3JhZGluZyBpdCEnKTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgcm9vdE5vZGUgPSBnZXRSb290Tm9kZUludGVybmFsKHRoaXMpO1xuICAgICAgY29uc3Qgbm9kZUhpZXJhcmNoeSA9IFt0aGlzTm9kZV0uY29uY2F0KG5vZGVQYXJlbnRzKHRoaXMsIHRoaXNOb2RlKSk7XG4gICAgICByZW5kZXJlci5zaW11bGF0ZUVycm9yKG5vZGVIaWVyYXJjaHksIHJvb3ROb2RlLCBlcnJvcik7XG5cbiAgICAgIHRoaXNbUk9PVF0udXBkYXRlKCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwcm9wcyBoYXNoIGZvciB0aGUgcm9vdCBub2RlIG9mIHRoZSB3cmFwcGVyLlxuICAgKlxuICAgKiBOT1RFOiBjYW4gb25seSBiZSBjYWxsZWQgb24gYSB3cmFwcGVyIG9mIGEgc2luZ2xlIG5vZGUuXG4gICAqXG4gICAqIEByZXR1cm5zIHtPYmplY3R9XG4gICAqL1xuICBwcm9wcygpIHtcbiAgICByZXR1cm4gdGhpcy5zaW5nbGUoJ3Byb3BzJywgcHJvcHNPZk5vZGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHN0YXRlIGhhc2ggZm9yIHRoZSByb290IG5vZGUgb2YgdGhlIHdyYXBwZXIuIE9wdGlvbmFsbHkgcGFzcyBpbiBhIHByb3AgbmFtZSBhbmQgaXRcbiAgICogd2lsbCByZXR1cm4ganVzdCB0aGF0IHZhbHVlLlxuICAgKlxuICAgKiBOT1RFOiBjYW4gb25seSBiZSBjYWxsZWQgb24gYSB3cmFwcGVyIG9mIGEgc2luZ2xlIG5vZGUuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIChvcHRpb25hbClcbiAgICogQHJldHVybnMgeyp9XG4gICAqL1xuICBzdGF0ZShuYW1lKSB7XG4gICAgY29uc3QgdGhpc05vZGUgPSB0aGlzW1JPT1RdID09PSB0aGlzID8gdGhpc1tSRU5ERVJFUl0uZ2V0Tm9kZSgpIDogdGhpcy5nZXROb2RlSW50ZXJuYWwoKTtcbiAgICBpZiAodGhpcy5pbnN0YW5jZSgpID09PSBudWxsIHx8IHRoaXNOb2RlLm5vZGVUeXBlICE9PSAnY2xhc3MnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlYWN0V3JhcHBlcjo6c3RhdGUoKSBjYW4gb25seSBiZSBjYWxsZWQgb24gY2xhc3MgY29tcG9uZW50cycpO1xuICAgIH1cbiAgICBjb25zdCBfc3RhdGUgPSB0aGlzLnNpbmdsZSgnc3RhdGUnLCAoKSA9PiB0aGlzLmluc3RhbmNlKCkuc3RhdGUpO1xuICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGlmIChfc3RhdGUgPT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBSZWFjdFdyYXBwZXI6OnN0YXRlKFwiJHtuYW1lfVwiKSByZXF1aXJlcyB0aGF0IFxcYHN0YXRlXFxgIG5vdCBiZSBcXGBudWxsXFxgIG9yIFxcYHVuZGVmaW5lZFxcYGApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF9zdGF0ZVtuYW1lXTtcbiAgICB9XG4gICAgcmV0dXJuIF9zdGF0ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjb250ZXh0IGhhc2ggZm9yIHRoZSByb290IG5vZGUgb2YgdGhlIHdyYXBwZXIuXG4gICAqIE9wdGlvbmFsbHkgcGFzcyBpbiBhIHByb3AgbmFtZSBhbmQgaXQgd2lsbCByZXR1cm4ganVzdCB0aGF0IHZhbHVlLlxuICAgKlxuICAgKiBOT1RFOiBjYW4gb25seSBiZSBjYWxsZWQgb24gYSB3cmFwcGVyIG9mIGEgc2luZ2xlIG5vZGUuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIChvcHRpb25hbClcbiAgICogQHJldHVybnMgeyp9XG4gICAqL1xuICBjb250ZXh0KG5hbWUpIHtcbiAgICBpZiAodGhpc1tST09UXSAhPT0gdGhpcykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZWFjdFdyYXBwZXI6OmNvbnRleHQoKSBjYW4gb25seSBiZSBjYWxsZWQgb24gdGhlIHJvb3QnKTtcbiAgICB9XG4gICAgY29uc3QgaW5zdGFuY2UgPSB0aGlzLnNpbmdsZSgnY29udGV4dCcsICgpID0+IHRoaXMuaW5zdGFuY2UoKSk7XG4gICAgaWYgKGluc3RhbmNlID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlYWN0V3JhcHBlcjo6Y29udGV4dCgpIGNhbiBvbmx5IGJlIGNhbGxlZCBvbiBjb21wb25lbnRzIHdpdGggaW5zdGFuY2VzJyk7XG4gICAgfVxuICAgIGNvbnN0IF9jb250ZXh0ID0gaW5zdGFuY2UuY29udGV4dDtcbiAgICBpZiAodHlwZW9mIG5hbWUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gX2NvbnRleHRbbmFtZV07XG4gICAgfVxuICAgIHJldHVybiBfY29udGV4dDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgbmV3IHdyYXBwZXIgd2l0aCBhbGwgb2YgdGhlIGNoaWxkcmVuIG9mIHRoZSBjdXJyZW50IHdyYXBwZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7RW56eW1lU2VsZWN0b3J9IFtzZWxlY3Rvcl1cbiAgICogQHJldHVybnMge1JlYWN0V3JhcHBlcn1cbiAgICovXG4gIGNoaWxkcmVuKHNlbGVjdG9yKSB7XG4gICAgY29uc3QgYWxsQ2hpbGRyZW4gPSB0aGlzLmZsYXRNYXAobiA9PiBjaGlsZHJlbk9mTm9kZShuLmdldE5vZGVJbnRlcm5hbCgpKS5maWx0ZXIoeCA9PiB0eXBlb2YgeCA9PT0gJ29iamVjdCcpKTtcbiAgICByZXR1cm4gc2VsZWN0b3IgPyBhbGxDaGlsZHJlbi5maWx0ZXIoc2VsZWN0b3IpIDogYWxsQ2hpbGRyZW47XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIG5ldyB3cmFwcGVyIHdpdGggYSBzcGVjaWZpYyBjaGlsZFxuICAgKlxuICAgKiBAcGFyYW0ge051bWJlcn0gW2luZGV4XVxuICAgKiBAcmV0dXJucyB7UmVhY3RXcmFwcGVyfVxuICAgKi9cbiAgY2hpbGRBdChpbmRleCkge1xuICAgIHJldHVybiB0aGlzLnNpbmdsZSgnY2hpbGRBdCcsICgpID0+IHRoaXMuY2hpbGRyZW4oKS5hdChpbmRleCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB3cmFwcGVyIGFyb3VuZCBhbGwgb2YgdGhlIHBhcmVudHMvYW5jZXN0b3JzIG9mIHRoZSB3cmFwcGVyLiBEb2VzIG5vdCBpbmNsdWRlIHRoZSBub2RlXG4gICAqIGluIHRoZSBjdXJyZW50IHdyYXBwZXIuXG4gICAqXG4gICAqIE5PVEU6IGNhbiBvbmx5IGJlIGNhbGxlZCBvbiBhIHdyYXBwZXIgb2YgYSBzaW5nbGUgbm9kZS5cbiAgICpcbiAgICogQHBhcmFtIHtFbnp5bWVTZWxlY3Rvcn0gW3NlbGVjdG9yXVxuICAgKiBAcmV0dXJucyB7UmVhY3RXcmFwcGVyfVxuICAgKi9cbiAgcGFyZW50cyhzZWxlY3Rvcikge1xuICAgIHJldHVybiB0aGlzLnNpbmdsZSgncGFyZW50cycsIChuKSA9PiB7XG4gICAgICBjb25zdCBhbGxQYXJlbnRzID0gdGhpcy53cmFwKG5vZGVQYXJlbnRzKHRoaXMsIG4pKTtcbiAgICAgIHJldHVybiBzZWxlY3RvciA/IGFsbFBhcmVudHMuZmlsdGVyKHNlbGVjdG9yKSA6IGFsbFBhcmVudHM7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHdyYXBwZXIgYXJvdW5kIHRoZSBpbW1lZGlhdGUgcGFyZW50IG9mIHRoZSBjdXJyZW50IG5vZGUuXG4gICAqXG4gICAqIEByZXR1cm5zIHtSZWFjdFdyYXBwZXJ9XG4gICAqL1xuICBwYXJlbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZmxhdE1hcChuID0+IFtuLnBhcmVudHMoKS5nZXQoMCldKTtcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0ge0VuenltZVNlbGVjdG9yfSBzZWxlY3RvclxuICAgKiBAcmV0dXJucyB7UmVhY3RXcmFwcGVyfVxuICAgKi9cbiAgY2xvc2VzdChzZWxlY3Rvcikge1xuICAgIGlmICh0aGlzLmlzKHNlbGVjdG9yKSkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGNvbnN0IG1hdGNoaW5nQW5jZXN0b3JzID0gdGhpcy5wYXJlbnRzKCkuZmlsdGVyKHNlbGVjdG9yKTtcbiAgICByZXR1cm4gbWF0Y2hpbmdBbmNlc3RvcnMubGVuZ3RoID4gMCA/IG1hdGNoaW5nQW5jZXN0b3JzLmZpcnN0KCkgOiB0aGlzLmZpbmRXaGVyZSgoKSA9PiBmYWxzZSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgdmFsdWUgb2YgIHByb3Agd2l0aCB0aGUgZ2l2ZW4gbmFtZSBvZiB0aGUgcm9vdCBub2RlLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvcE5hbWVcbiAgICogQHJldHVybnMgeyp9XG4gICAqL1xuICBwcm9wKHByb3BOYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMoKVtwcm9wTmFtZV07XG4gIH1cblxuICAvKipcbiAgICogVXNlZCB0byBpbnZva2UgYSBmdW5jdGlvbiBwcm9wLlxuICAgKiBXaWxsIGludm9rZSBhbiBmdW5jdGlvbiBwcm9wIGFuZCByZXR1cm4gaXRzIHZhbHVlLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvcE5hbWVcbiAgICogQHJldHVybnMge0FueX1cbiAgICovXG4gIGludm9rZShwcm9wTmFtZSkge1xuICAgIHJldHVybiB0aGlzLnNpbmdsZSgnaW52b2tlJywgKCkgPT4ge1xuICAgICAgY29uc3QgaGFuZGxlciA9IHRoaXMucHJvcChwcm9wTmFtZSk7XG4gICAgICBpZiAodHlwZW9mIGhhbmRsZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignUmVhY3RXcmFwcGVyOjppbnZva2UoKSByZXF1aXJlcyB0aGUgbmFtZSBvZiBhIHByb3Agd2hvc2UgdmFsdWUgaXMgYSBmdW5jdGlvbicpO1xuICAgICAgfVxuICAgICAgcmV0dXJuICguLi5hcmdzKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gaGFuZGxlciguLi5hcmdzKTtcbiAgICAgICAgdGhpc1tST09UXS51cGRhdGUoKTtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgd3JhcHBlciBvZiB0aGUgbm9kZSByZW5kZXJlZCBieSB0aGUgcHJvdmlkZWQgcmVuZGVyIHByb3AuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wTmFtZVxuICAgKiBAcmV0dXJucyB7RnVuY3Rpb259XG4gICAqL1xuICByZW5kZXJQcm9wKHByb3BOYW1lKSB7XG4gICAgY29uc3QgYWRhcHRlciA9IGdldEFkYXB0ZXIodGhpc1tPUFRJT05TXSk7XG4gICAgaWYgKHR5cGVvZiBhZGFwdGVyLndyYXAgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCd5b3VyIGFkYXB0ZXIgZG9lcyBub3Qgc3VwcG9ydCBgd3JhcGAuIFRyeSB1cGdyYWRpbmcgaXQhJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuc2luZ2xlKCdyZW5kZXJQcm9wJywgKG4pID0+IHtcbiAgICAgIGlmIChuLm5vZGVUeXBlID09PSAnaG9zdCcpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignUmVhY3RXcmFwcGVyOjpyZW5kZXJQcm9wKCkgY2FuIG9ubHkgYmUgY2FsbGVkIG9uIGN1c3RvbSBjb21wb25lbnRzJyk7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIHByb3BOYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdSZWFjdFdyYXBwZXI6OnJlbmRlclByb3AoKTogYHByb3BOYW1lYCBtdXN0IGJlIGEgc3RyaW5nJyk7XG4gICAgICB9XG4gICAgICBjb25zdCBwcm9wcyA9IHRoaXMucHJvcHMoKTtcbiAgICAgIGlmICghaGFzKHByb3BzLCBwcm9wTmFtZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZWFjdFdyYXBwZXI6OnJlbmRlclByb3AoKTogbm8gcHJvcCBjYWxsZWQg4oCcJHtwcm9wTmFtZX3igJwgZm91bmRgKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHByb3BWYWx1ZSA9IHByb3BzW3Byb3BOYW1lXTtcbiAgICAgIGlmICh0eXBlb2YgcHJvcFZhbHVlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYFJlYWN0V3JhcHBlcjo6cmVuZGVyUHJvcCgpOiBleHBlY3RlZCBwcm9wIOKAnCR7cHJvcE5hbWV94oCcIHRvIGNvbnRhaW4gYSBmdW5jdGlvbiwgYnV0IGl0IGhvbGRzIOKAnCR7dHlwZW9mIHByb3BWYWx1ZX3igJxgKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICguLi5hcmdzKSA9PiB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBwcm9wVmFsdWUoLi4uYXJncyk7XG4gICAgICAgIGNvbnN0IHdyYXBwZWQgPSBhZGFwdGVyLndyYXAoZWxlbWVudCk7XG4gICAgICAgIHJldHVybiB0aGlzLndyYXAod3JhcHBlZCwgbnVsbCwgdGhpc1tPUFRJT05TXSk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGtleSBhc3NpZ25lZCB0byB0aGUgY3VycmVudCBub2RlLlxuICAgKlxuICAgKiBAcmV0dXJucyB7U3RyaW5nfVxuICAgKi9cbiAga2V5KCkge1xuICAgIHJldHVybiB0aGlzLnNpbmdsZSgna2V5JywgbiA9PiAobi5rZXkgPT09IHVuZGVmaW5lZCA/IG51bGwgOiBuLmtleSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHR5cGUgb2YgdGhlIHJvb3Qgbm9kZSBvZiB0aGlzIHdyYXBwZXIuIElmIGl0J3MgYSBjb21wb3NpdGUgY29tcG9uZW50LCB0aGlzIHdpbGwgYmVcbiAgICogdGhlIGNvbXBvbmVudCBjb25zdHJ1Y3Rvci4gSWYgaXQncyBuYXRpdmUgRE9NIG5vZGUsIGl0IHdpbGwgYmUgYSBzdHJpbmcuXG4gICAqXG4gICAqIEByZXR1cm5zIHtTdHJpbmd8RnVuY3Rpb259XG4gICAqL1xuICB0eXBlKCkge1xuICAgIHJldHVybiB0aGlzLnNpbmdsZSgndHlwZScsIG4gPT4gdHlwZU9mTm9kZShuKSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbmFtZSBvZiB0aGUgcm9vdCBub2RlIG9mIHRoaXMgd3JhcHBlci5cbiAgICpcbiAgICogSW4gb3JkZXIgb2YgcHJlY2VkZW5jZSA9PiB0eXBlLmRpc3BsYXlOYW1lIC0+IHR5cGUubmFtZSAtPiB0eXBlLlxuICAgKlxuICAgKiBAcmV0dXJucyB7U3RyaW5nfVxuICAgKi9cbiAgbmFtZSgpIHtcbiAgICBjb25zdCBhZGFwdGVyID0gZ2V0QWRhcHRlcih0aGlzW09QVElPTlNdKTtcbiAgICByZXR1cm4gdGhpcy5zaW5nbGUoJ25hbWUnLCBuID0+IChcbiAgICAgIGFkYXB0ZXIuZGlzcGxheU5hbWVPZk5vZGUgPyBhZGFwdGVyLmRpc3BsYXlOYW1lT2ZOb2RlKG4pIDogZGlzcGxheU5hbWVPZk5vZGUobilcbiAgICApKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBjdXJyZW50IHJvb3Qgbm9kZSBoYXMgdGhlIGdpdmVuIGNsYXNzIG5hbWUgb3Igbm90LlxuICAgKlxuICAgKiBOT1RFOiBjYW4gb25seSBiZSBjYWxsZWQgb24gYSB3cmFwcGVyIG9mIGEgc2luZ2xlIG5vZGUuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjbGFzc05hbWVcbiAgICogQHJldHVybnMge0Jvb2xlYW59XG4gICAqL1xuICBoYXNDbGFzcyhjbGFzc05hbWUpIHtcbiAgICBpZiAodHlwZW9mIGNsYXNzTmFtZSA9PT0gJ3N0cmluZycgJiYgY2xhc3NOYW1lLmluZGV4T2YoJy4nKSAhPT0gLTEpIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICBjb25zb2xlLndhcm4oJ0l0IGxvb2tzIGxpa2UgeW91XFwncmUgY2FsbGluZyBgUmVhY3RXcmFwcGVyOjpoYXNDbGFzcygpYCB3aXRoIGEgQ1NTIHNlbGVjdG9yLiBoYXNDbGFzcygpIGV4cGVjdHMgYSBjbGFzcyBuYW1lLCBub3QgYSBDU1Mgc2VsZWN0b3IuJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnNpbmdsZSgnaGFzQ2xhc3MnLCBuID0+IGhhc0NsYXNzTmFtZShuLCBjbGFzc05hbWUpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJdGVyYXRlcyB0aHJvdWdoIGVhY2ggbm9kZSBvZiB0aGUgY3VycmVudCB3cmFwcGVyIGFuZCBleGVjdXRlcyB0aGUgcHJvdmlkZWQgZnVuY3Rpb24gd2l0aCBhXG4gICAqIHdyYXBwZXIgYXJvdW5kIHRoZSBjb3JyZXNwb25kaW5nIG5vZGUgcGFzc2VkIGluIGFzIHRoZSBmaXJzdCBhcmd1bWVudC5cbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAgICogQHJldHVybnMge1JlYWN0V3JhcHBlcn1cbiAgICovXG4gIGZvckVhY2goZm4pIHtcbiAgICB0aGlzLmdldE5vZGVzSW50ZXJuYWwoKS5mb3JFYWNoKChuLCBpKSA9PiBmbi5jYWxsKHRoaXMsIHRoaXMud3JhcChuKSwgaSkpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIE1hcHMgdGhlIGN1cnJlbnQgYXJyYXkgb2Ygbm9kZXMgdG8gYW5vdGhlciBhcnJheS4gRWFjaCBub2RlIGlzIHBhc3NlZCBpbiBhcyBhIGBSZWFjdFdyYXBwZXJgXG4gICAqIHRvIHRoZSBtYXAgZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gICAqIEByZXR1cm5zIHtBcnJheX1cbiAgICovXG4gIG1hcChmbikge1xuICAgIHJldHVybiB0aGlzLmdldE5vZGVzSW50ZXJuYWwoKS5tYXAoKG4sIGkpID0+IGZuLmNhbGwodGhpcywgdGhpcy53cmFwKG4pLCBpKSk7XG4gIH1cblxuICAvKipcbiAgICogUmVkdWNlcyB0aGUgY3VycmVudCBhcnJheSBvZiBub2RlcyB0byBhbm90aGVyIGFycmF5LlxuICAgKiBFYWNoIG5vZGUgaXMgcGFzc2VkIGluIGFzIGEgYFNoYWxsb3dXcmFwcGVyYCB0byB0aGUgcmVkdWNlciBmdW5jdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gLSB0aGUgcmVkdWNlciBmdW5jdGlvblxuICAgKiBAcGFyYW0geyp9IGluaXRpYWxWYWx1ZSAtIHRoZSBpbml0aWFsIHZhbHVlXG4gICAqIEByZXR1cm5zIHsqfVxuICAgKi9cbiAgcmVkdWNlKGZuLCBpbml0aWFsVmFsdWUgPSB1bmRlZmluZWQpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldE5vZGVzSW50ZXJuYWwoKS5yZWR1Y2UoXG4gICAgICAgIChhY2N1bSwgbiwgaSkgPT4gZm4uY2FsbCh0aGlzLCBhY2N1bSwgdGhpcy53cmFwKG4pLCBpKSxcbiAgICAgICAgaW5pdGlhbFZhbHVlLFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZ2V0Tm9kZXNJbnRlcm5hbCgpLnJlZHVjZSgoYWNjdW0sIG4sIGkpID0+IGZuLmNhbGwoXG4gICAgICB0aGlzLFxuICAgICAgaSA9PT0gMSA/IHRoaXMud3JhcChhY2N1bSkgOiBhY2N1bSxcbiAgICAgIHRoaXMud3JhcChuKSxcbiAgICAgIGksXG4gICAgKSk7XG4gIH1cblxuICAvKipcbiAgICogUmVkdWNlcyB0aGUgY3VycmVudCBhcnJheSBvZiBub2RlcyB0byBhbm90aGVyIGFycmF5LCBmcm9tIHJpZ2h0IHRvIGxlZnQuIEVhY2ggbm9kZSBpcyBwYXNzZWRcbiAgICogaW4gYXMgYSBgU2hhbGxvd1dyYXBwZXJgIHRvIHRoZSByZWR1Y2VyIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAtIHRoZSByZWR1Y2VyIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7Kn0gaW5pdGlhbFZhbHVlIC0gdGhlIGluaXRpYWwgdmFsdWVcbiAgICogQHJldHVybnMgeyp9XG4gICAqL1xuICByZWR1Y2VSaWdodChmbiwgaW5pdGlhbFZhbHVlID0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXROb2Rlc0ludGVybmFsKCkucmVkdWNlUmlnaHQoXG4gICAgICAgIChhY2N1bSwgbiwgaSkgPT4gZm4uY2FsbCh0aGlzLCBhY2N1bSwgdGhpcy53cmFwKG4pLCBpKSxcbiAgICAgICAgaW5pdGlhbFZhbHVlLFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZ2V0Tm9kZXNJbnRlcm5hbCgpLnJlZHVjZVJpZ2h0KChhY2N1bSwgbiwgaSkgPT4gZm4uY2FsbChcbiAgICAgIHRoaXMsXG4gICAgICBpID09PSAxID8gdGhpcy53cmFwKGFjY3VtKSA6IGFjY3VtLFxuICAgICAgdGhpcy53cmFwKG4pLFxuICAgICAgaSxcbiAgICApKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgbmV3IHdyYXBwZXIgd2l0aCBhIHN1YnNldCBvZiB0aGUgbm9kZXMgb2YgdGhlIG9yaWdpbmFsIHdyYXBwZXIsIGFjY29yZGluZyB0byB0aGVcbiAgICogcnVsZXMgb2YgYEFycmF5I3NsaWNlYC5cbiAgICpcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGJlZ2luXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBlbmRcbiAgICogQHJldHVybnMge1NoYWxsb3dXcmFwcGVyfVxuICAgKi9cbiAgc2xpY2UoYmVnaW4sIGVuZCkge1xuICAgIHJldHVybiB0aGlzLndyYXAodGhpcy5nZXROb2Rlc0ludGVybmFsKCkuc2xpY2UoYmVnaW4sIGVuZCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgd2hldGhlciBvciBub3QgYW55IG9mIHRoZSBub2RlcyBpbiB0aGUgd3JhcHBlciBtYXRjaCB0aGUgcHJvdmlkZWQgc2VsZWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB7RW56eW1lU2VsZWN0b3J9IHNlbGVjdG9yXG4gICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgKi9cbiAgc29tZShzZWxlY3Rvcikge1xuICAgIGlmICh0aGlzW1JPT1RdID09PSB0aGlzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlYWN0V3JhcHBlcjo6c29tZSgpIGNhbiBub3QgYmUgY2FsbGVkIG9uIHRoZSByb290Jyk7XG4gICAgfVxuICAgIGNvbnN0IHByZWRpY2F0ZSA9IGJ1aWxkUHJlZGljYXRlKHNlbGVjdG9yKTtcbiAgICByZXR1cm4gdGhpcy5nZXROb2Rlc0ludGVybmFsKCkuc29tZShwcmVkaWNhdGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgd2hldGhlciBvciBub3QgYW55IG9mIHRoZSBub2RlcyBpbiB0aGUgd3JhcHBlciBwYXNzIHRoZSBwcm92aWRlZCBwcmVkaWNhdGUgZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWRpY2F0ZVxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICovXG4gIHNvbWVXaGVyZShwcmVkaWNhdGUpIHtcbiAgICByZXR1cm4gdGhpcy5nZXROb2Rlc0ludGVybmFsKCkuc29tZSgobiwgaSkgPT4gcHJlZGljYXRlLmNhbGwodGhpcywgdGhpcy53cmFwKG4pLCBpKSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIG9yIG5vdCBhbGwgb2YgdGhlIG5vZGVzIGluIHRoZSB3cmFwcGVyIG1hdGNoIHRoZSBwcm92aWRlZCBzZWxlY3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHtFbnp5bWVTZWxlY3Rvcn0gc2VsZWN0b3JcbiAgICogQHJldHVybnMge0Jvb2xlYW59XG4gICAqL1xuICBldmVyeShzZWxlY3Rvcikge1xuICAgIGNvbnN0IHByZWRpY2F0ZSA9IGJ1aWxkUHJlZGljYXRlKHNlbGVjdG9yKTtcbiAgICByZXR1cm4gdGhpcy5nZXROb2Rlc0ludGVybmFsKCkuZXZlcnkocHJlZGljYXRlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHdoZXRoZXIgb3Igbm90IGFueSBvZiB0aGUgbm9kZXMgaW4gdGhlIHdyYXBwZXIgcGFzcyB0aGUgcHJvdmlkZWQgcHJlZGljYXRlIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkaWNhdGVcbiAgICogQHJldHVybnMge0Jvb2xlYW59XG4gICAqL1xuICBldmVyeVdoZXJlKHByZWRpY2F0ZSkge1xuICAgIHJldHVybiB0aGlzLmdldE5vZGVzSW50ZXJuYWwoKS5ldmVyeSgobiwgaSkgPT4gcHJlZGljYXRlLmNhbGwodGhpcywgdGhpcy53cmFwKG4pLCBpKSk7XG4gIH1cblxuICAvKipcbiAgICogVXRpbGl0eSBtZXRob2QgdXNlZCB0byBjcmVhdGUgbmV3IHdyYXBwZXJzIHdpdGggYSBtYXBwaW5nIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhbiBhcnJheSBvZlxuICAgKiBub2RlcyBpbiByZXNwb25zZSB0byBhIHNpbmdsZSBub2RlIHdyYXBwZXIuIFRoZSByZXR1cm5lZCB3cmFwcGVyIGlzIGEgc2luZ2xlIHdyYXBwZXIgYXJvdW5kXG4gICAqIGFsbCBvZiB0aGUgbWFwcGVkIG5vZGVzIGZsYXR0ZW5lZCAoYW5kIGRlLWR1cGxpY2F0ZWQpLlxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICAgKiBAcmV0dXJucyB7UmVhY3RXcmFwcGVyfVxuICAgKi9cbiAgZmxhdE1hcChmbikge1xuICAgIGNvbnN0IG5vZGVzID0gdGhpcy5nZXROb2Rlc0ludGVybmFsKCkubWFwKChuLCBpKSA9PiBmbi5jYWxsKHRoaXMsIHRoaXMud3JhcChuKSwgaSkpO1xuICAgIGNvbnN0IGZsYXR0ZW5lZCA9IGZsYXQobm9kZXMsIDEpO1xuICAgIHJldHVybiB0aGlzLndyYXAoZmxhdHRlbmVkLmZpbHRlcihCb29sZWFuKSk7XG4gIH1cblxuICAvKipcbiAgICogRmluZHMgYWxsIG5vZGVzIGluIHRoZSBjdXJyZW50IHdyYXBwZXIgbm9kZXMnIHJlbmRlciB0cmVlcyB0aGF0IG1hdGNoIHRoZSBwcm92aWRlZCBwcmVkaWNhdGVcbiAgICogZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWRpY2F0ZVxuICAgKiBAcmV0dXJucyB7UmVhY3RXcmFwcGVyfVxuICAgKi9cbiAgZmluZFdoZXJlKHByZWRpY2F0ZSkge1xuICAgIHJldHVybiBmaW5kV2hlcmVVbndyYXBwZWQodGhpcywgKG4pID0+IHtcbiAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLndyYXAobik7XG4gICAgICByZXR1cm4gbm9kZS5sZW5ndGggPiAwICYmIHByZWRpY2F0ZShub2RlKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBub2RlIGF0IGEgZ2l2ZW4gaW5kZXggb2YgdGhlIGN1cnJlbnQgd3JhcHBlci5cbiAgICpcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGluZGV4XG4gICAqIEByZXR1cm5zIHtSZWFjdEVsZW1lbnR9XG4gICAqL1xuICBnZXQoaW5kZXgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRFbGVtZW50cygpW2luZGV4XTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgd3JhcHBlciBhcm91bmQgdGhlIG5vZGUgYXQgYSBnaXZlbiBpbmRleCBvZiB0aGUgY3VycmVudCB3cmFwcGVyLlxuICAgKlxuICAgKiBAcGFyYW0ge051bWJlcn0gaW5kZXhcbiAgICogQHJldHVybnMge1JlYWN0V3JhcHBlcn1cbiAgICovXG4gIGF0KGluZGV4KSB7XG4gICAgY29uc3Qgbm9kZXMgPSB0aGlzLmdldE5vZGVzSW50ZXJuYWwoKTtcbiAgICBpZiAoaW5kZXggPCBub2Rlcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiB0aGlzLndyYXAobm9kZXNbaW5kZXhdKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMud3JhcChbXSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHdyYXBwZXIgYXJvdW5kIHRoZSBmaXJzdCBub2RlIG9mIHRoZSBjdXJyZW50IHdyYXBwZXIuXG4gICAqXG4gICAqIEByZXR1cm5zIHtSZWFjdFdyYXBwZXJ9XG4gICAqL1xuICBmaXJzdCgpIHtcbiAgICByZXR1cm4gdGhpcy5hdCgwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgd3JhcHBlciBhcm91bmQgdGhlIGxhc3Qgbm9kZSBvZiB0aGUgY3VycmVudCB3cmFwcGVyLlxuICAgKlxuICAgKiBAcmV0dXJucyB7UmVhY3RXcmFwcGVyfVxuICAgKi9cbiAgbGFzdCgpIHtcbiAgICByZXR1cm4gdGhpcy5hdCh0aGlzLmxlbmd0aCAtIDEpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGVnYXRlcyB0byBleGlzdHMoKVxuICAgKlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICovXG4gIGlzRW1wdHkoKSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICBjb25zb2xlLndhcm4oJ0VuenltZTo6RGVwcmVjYXRlZCBtZXRob2QgaXNFbXB0eSgpIGNhbGxlZCwgdXNlIGV4aXN0cygpIGluc3RlYWQuJyk7XG4gICAgcmV0dXJuICF0aGlzLmV4aXN0cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgY3VycmVudCB3cmFwcGVyIGhhcyBub2Rlcy4gRmFsc2Ugb3RoZXJ3aXNlLlxuICAgKiBJZiBjYWxsZWQgd2l0aCBhIHNlbGVjdG9yIGl0IHJldHVybnMgYC5maW5kKHNlbGVjdG9yKS5leGlzdHMoKWAgaW5zdGVhZC5cbiAgICpcbiAgICogQHBhcmFtIHtFbnp5bWVTZWxlY3Rvcn0gc2VsZWN0b3IgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICovXG4gIGV4aXN0cyhzZWxlY3RvciA9IG51bGwpIHtcbiAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA+IDAgPyB0aGlzLmZpbmQoc2VsZWN0b3IpLmV4aXN0cygpIDogdGhpcy5sZW5ndGggPiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIFV0aWxpdHkgbWV0aG9kIHRoYXQgdGhyb3dzIGFuIGVycm9yIGlmIHRoZSBjdXJyZW50IGluc3RhbmNlIGhhcyBhIGxlbmd0aCBvdGhlciB0aGFuIG9uZS5cbiAgICogVGhpcyBpcyBwcmltYXJpbHkgdXNlZCB0byBlbmZvcmNlIHRoYXQgY2VydGFpbiBtZXRob2RzIGFyZSBvbmx5IHJ1biBvbiBhIHdyYXBwZXIgd2hlbiBpdCBpc1xuICAgKiB3cmFwcGluZyBhIHNpbmdsZSBub2RlLlxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICAgKiBAcmV0dXJucyB7Kn1cbiAgICovXG4gIHNpbmdsZShuYW1lLCBmbikge1xuICAgIGNvbnN0IGZuTmFtZSA9IHR5cGVvZiBuYW1lID09PSAnc3RyaW5nJyA/IG5hbWUgOiAndW5rbm93bic7XG4gICAgY29uc3QgY2FsbGJhY2sgPSB0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicgPyBmbiA6IG5hbWU7XG4gICAgaWYgKHRoaXMubGVuZ3RoICE9PSAxKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYE1ldGhvZCDigJwke2ZuTmFtZX3igJ0gaXMgbWVhbnQgdG8gYmUgcnVuIG9uIDEgbm9kZS4gJHt0aGlzLmxlbmd0aH0gZm91bmQgaW5zdGVhZC5gKTtcbiAgICB9XG4gICAgcmV0dXJuIGNhbGxiYWNrLmNhbGwodGhpcywgdGhpcy5nZXROb2RlSW50ZXJuYWwoKSk7XG4gIH1cblxuICAvKipcbiAgICogSGVscGZ1bCB1dGlsaXR5IG1ldGhvZCB0byBjcmVhdGUgYSBuZXcgd3JhcHBlciB3aXRoIHRoZSBzYW1lIHJvb3QgYXMgdGhlIGN1cnJlbnQgd3JhcHBlciwgd2l0aFxuICAgKiBhbnkgbm9kZXMgcGFzc2VkIGluIGFzIHRoZSBmaXJzdCBwYXJhbWV0ZXIgYXV0b21hdGljYWxseSB3cmFwcGVkLlxuICAgKlxuICAgKiBAcGFyYW0ge1JlYWN0V3JhcHBlcnxSZWFjdEVsZW1lbnR8QXJyYXk8UmVhY3RFbGVtZW50Pn0gbm9kZVxuICAgKiBAcmV0dXJucyB7UmVhY3RXcmFwcGVyfVxuICAgKi9cbiAgd3JhcChub2RlLCByb290ID0gdGhpc1tST09UXSwgLi4uYXJncykge1xuICAgIGlmIChub2RlIGluc3RhbmNlb2YgUmVhY3RXcmFwcGVyKSB7XG4gICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBSZWFjdFdyYXBwZXIobm9kZSwgcm9vdCwgLi4uYXJncyk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBIVE1MLWxpa2Ugc3RyaW5nIG9mIHRoZSBzaGFsbG93IHJlbmRlciBmb3IgZGVidWdnaW5nIHB1cnBvc2VzLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gUHJvcGVydHkgYmFnIG9mIGFkZGl0aW9uYWwgb3B0aW9ucy5cbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5pZ25vcmVQcm9wc10gLSBpZiB0cnVlLCBwcm9wcyBhcmUgb21pdHRlZCBmcm9tIHRoZSBzdHJpbmcuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudmVyYm9zZV0gLSBpZiB0cnVlLCBhcnJheXMgYW5kIG9iamVjdHMgdG8gYmUgdmVyYm9zZWx5IHByaW50ZWQuXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9XG4gICAqL1xuICBkZWJ1ZyhvcHRpb25zID0ge30pIHtcbiAgICByZXR1cm4gZGVidWdOb2Rlcyh0aGlzLmdldE5vZGVzSW50ZXJuYWwoKSwgb3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogSW52b2tlcyBpbnRlcmNlcHRlciBhbmQgcmV0dXJucyBpdHNlbGYuIGludGVyY2VwdGVyIGlzIGNhbGxlZCB3aXRoIGl0c2VsZi5cbiAgICogVGhpcyBpcyBoZWxwZnVsIHdoZW4gZGVidWdnaW5nIG5vZGVzIGluIG1ldGhvZCBjaGFpbnMuXG4gICAqIEBwYXJhbSBmblxuICAgKiBAcmV0dXJucyB7UmVhY3RXcmFwcGVyfVxuICAgKi9cbiAgdGFwKGludGVyY2VwdGVyKSB7XG4gICAgaW50ZXJjZXB0ZXIodGhpcyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogRGV0YWNoZXMgdGhlIHJlYWN0IHRyZWUgZnJvbSB0aGUgRE9NLiBSdW5zIGBSZWFjdERPTS51bm1vdW50Q29tcG9uZW50QXROb2RlKClgIHVuZGVyIHRoZSBob29kLlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCB3aWxsIG1vc3QgY29tbW9ubHkgYmUgdXNlZCBhcyBhIFwiY2xlYW51cFwiIG1ldGhvZCBpZiB5b3UgZGVjaWRlIHRvIHVzZSB0aGVcbiAgICogYGF0dGFjaFRvYCBvcHRpb24gaW4gYG1vdW50KG5vZGUsIG9wdGlvbnMpYC5cbiAgICpcbiAgICogVGhlIG1ldGhvZCBpcyBpbnRlbnRpb25hbGx5IG5vdCBcImZsdWVudFwiIChpbiB0aGF0IGl0IGRvZXNuJ3QgcmV0dXJuIGB0aGlzYCkgYmVjYXVzZSB5b3Ugc2hvdWxkXG4gICAqIG5vdCBiZSBkb2luZyBhbnl0aGluZyB3aXRoIHRoaXMgd3JhcHBlciBhZnRlciB0aGlzIG1ldGhvZCBpcyBjYWxsZWQuXG4gICAqL1xuICBkZXRhY2goKSB7XG4gICAgaWYgKHRoaXNbUk9PVF0gIT09IHRoaXMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUmVhY3RXcmFwcGVyOjpkZXRhY2goKSBjYW4gb25seSBiZSBjYWxsZWQgb24gdGhlIHJvb3QnKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzW09QVElPTlNdLmF0dGFjaFRvKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlYWN0V3JhcHBlcjo6ZGV0YWNoKCkgY2FuIG9ubHkgYmUgY2FsbGVkIG9uIHdoZW4gdGhlIGBhdHRhY2hUb2Agb3B0aW9uIHdhcyBwYXNzZWQgaW50byBgbW91bnQoKWAuJyk7XG4gICAgfVxuICAgIHRoaXNbUkVOREVSRVJdLnVubW91bnQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdHJpcHMgb3V0IGFsbCB0aGUgbm90IGhvc3Qtbm9kZXMgZnJvbSB0aGUgbGlzdCBvZiBub2Rlc1xuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBpcyB1c2VmdWwgaWYgeW91IHdhbnQgdG8gY2hlY2sgZm9yIHRoZSBwcmVzZW5jZSBvZiBob3N0IG5vZGVzXG4gICAqIChhY3R1YWxseSByZW5kZXJlZCBIVE1MIGVsZW1lbnRzKSBpZ25vcmluZyB0aGUgUmVhY3Qgbm9kZXMuXG4gICAqL1xuICBob3N0Tm9kZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZmlsdGVyV2hlcmUobiA9PiB0eXBlb2Ygbi50eXBlKCkgPT09ICdzdHJpbmcnKTtcbiAgfVxufVxuXG4vKipcbiAqIEEgKnNwZWNpYWwqIFwicm9vdFwiIHdyYXBwZXIgdGhhdCByZXByZXNlbnRzIHRoZSBjb21wb25lbnQgcGFzc2VkIGFzIGB3cmFwcGluZ0NvbXBvbmVudGAuXG4gKiBJdCBpcyBsaW5rZWQgdG8gdGhlIHByaW1hcnkgcm9vdCBzdWNoIHRoYXQgdXBkYXRlcyB0byBpdCB3aWxsIHVwZGF0ZSB0aGUgcHJpbWFyeSxcbiAqIGFuZCB2aWNlIHZlcnNhLlxuICpcbiAqIEBjbGFzcyBXcmFwcGluZ0NvbXBvbmVudFdyYXBwZXJcbiAqL1xuY2xhc3MgV3JhcHBpbmdDb21wb25lbnRXcmFwcGVyIGV4dGVuZHMgUmVhY3RXcmFwcGVyIHtcbiAgLyogZXNsaW50LWRpc2FibGUgY2xhc3MtbWV0aG9kcy11c2UtdGhpcyAqL1xuICBjb25zdHJ1Y3Rvcihyb290LCByZW5kZXJlcikge1xuICAgIHN1cGVyKHJlbmRlcmVyLmdldE5vZGUoKSwgcm9vdCk7XG5cbiAgICBwcml2YXRlU2V0KHRoaXMsIFJPT1QsIHRoaXMpO1xuICAgIHByaXZhdGVTZXQodGhpcywgUkVOREVSRVIsIHJlbmRlcmVyKTtcbiAgICB0aGlzW0xJTktFRF9ST09UU10ucHVzaChyb290KTtcbiAgfVxuXG4gIGdldFdyYXBwaW5nQ29tcG9uZW50KCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1JlYWN0V3JhcHBlcjo6Z2V0V3JhcHBpbmdDb21wb25lbnQoKSBjYW4gb25seSBiZSBjYWxsZWQgb24gdGhlIHJvb3QnKTtcbiAgfVxufVxuXG5pZiAoSVRFUkFUT1JfU1lNQk9MKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShSZWFjdFdyYXBwZXIucHJvdG90eXBlLCBJVEVSQVRPUl9TWU1CT0wsIHtcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGl0ZXJhdG9yKCkge1xuICAgICAgY29uc3QgaXRlciA9IHRoaXNbTk9ERVNdW0lURVJBVE9SX1NZTUJPTF0oKTtcbiAgICAgIGNvbnN0IGFkYXB0ZXIgPSBnZXRBZGFwdGVyKHRoaXNbT1BUSU9OU10pO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgW0lURVJBVE9SX1NZTUJPTF0oKSB7IHJldHVybiB0aGlzOyB9LFxuICAgICAgICBuZXh0KCkge1xuICAgICAgICAgIGNvbnN0IG5leHQgPSBpdGVyLm5leHQoKTtcbiAgICAgICAgICBpZiAobmV4dC5kb25lKSB7XG4gICAgICAgICAgICByZXR1cm4geyBkb25lOiB0cnVlIH07XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkb25lOiBmYWxzZSxcbiAgICAgICAgICAgIHZhbHVlOiBhZGFwdGVyLm5vZGVUb0VsZW1lbnQobmV4dC52YWx1ZSksXG4gICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgfSxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHByaXZhdGVXYXJuaW5nKHByb3AsIGV4dHJhTWVzc2FnZSkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUmVhY3RXcmFwcGVyLnByb3RvdHlwZSwgcHJvcCwge1xuICAgIGdldCgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgXG4gICAgICAgIEF0dGVtcHRlZCB0byBhY2Nlc3MgUmVhY3RXcmFwcGVyOjoke3Byb3B9LCB3aGljaCB3YXMgcHJldmlvdXNseSBhIHByaXZhdGUgcHJvcGVydHkgb25cbiAgICAgICAgRW56eW1lIFJlYWN0V3JhcHBlciBpbnN0YW5jZXMsIGJ1dCBpcyBubyBsb25nZXIgYW5kIHNob3VsZCBub3QgYmUgcmVsaWVkIHVwb24uXG4gICAgICAgICR7ZXh0cmFNZXNzYWdlfVxuICAgICAgYCk7XG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICB9KTtcbn1cblxucHJpdmF0ZVdhcm5pbmcoJ25vZGUnLCAnQ29uc2lkZXIgdXNpbmcgdGhlIGdldEVsZW1lbnQoKSBtZXRob2QgaW5zdGVhZC4nKTtcbnByaXZhdGVXYXJuaW5nKCdub2RlcycsICdDb25zaWRlciB1c2luZyB0aGUgZ2V0RWxlbWVudHMoKSBtZXRob2QgaW5zdGVhZC4nKTtcbnByaXZhdGVXYXJuaW5nKCdyZW5kZXJlcicsICcnKTtcbnByaXZhdGVXYXJuaW5nKCdvcHRpb25zJywgJycpO1xucHJpdmF0ZVdhcm5pbmcoJ2NvbXBsZXhTZWxlY3RvcicsICcnKTtcblxuZXhwb3J0IGRlZmF1bHQgUmVhY3RXcmFwcGVyO1xuIl19
//# sourceMappingURL=ReactWrapper.js.map