'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _get = function () {
  function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } }

  return get;
}();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _object = require('object.assign');

var _object2 = _interopRequireDefault(_object);

var _arrayPrototype = require('array.prototype.flat');

var _arrayPrototype2 = _interopRequireDefault(_arrayPrototype);

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

var _has = require('has');

var _has2 = _interopRequireDefault(_has);

var _Utils = require('./Utils');

var _getAdapter = require('./getAdapter');

var _getAdapter2 = _interopRequireDefault(_getAdapter);

var _Debug = require('./Debug');

var _RSTTraversal = require('./RSTTraversal');

var _selectors = require('./selectors');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var NODE = (0, _Utils.sym)('__node__');
var NODES = (0, _Utils.sym)('__nodes__');
var RENDERER = (0, _Utils.sym)('__renderer__');
var UNRENDERED = (0, _Utils.sym)('__unrendered__');
var ROOT = (0, _Utils.sym)('__root__');
var OPTIONS = (0, _Utils.sym)('__options__');
var SET_STATE = (0, _Utils.sym)('__setState__');
var ROOT_NODES = (0, _Utils.sym)('__rootNodes__');
var CHILD_CONTEXT = (0, _Utils.sym)('__childContext__');
var WRAPPING_COMPONENT = (0, _Utils.sym)('__wrappingComponent__');
var PRIMARY_WRAPPER = (0, _Utils.sym)('__primaryWrapper__');
var ROOT_FINDER = (0, _Utils.sym)('__rootFinder__');
var PROVIDER_VALUES = (0, _Utils.sym)('__providerValues__');

/**
 * Finds all nodes in the current wrapper nodes' render trees that match the provided predicate
 * function.
 *
 * @param {ShallowWrapper} wrapper
 * @param {Function} predicate
 * @param {Function} filter
 * @returns {ShallowWrapper}
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
 * @param {ShallowWrapper} wrapper
 * @param {Function} predicate
 * @returns {ShallowWrapper}
 */
function filterWhereUnwrapped(wrapper, predicate) {
  return wrapper.wrap(wrapper.getNodesInternal().filter(predicate).filter(Boolean));
}

/**
 * Ensure options passed to ShallowWrapper are valid. Throws otherwise.
 * @param {Object} options
 */
function validateOptions(options) {
  var lifecycleExperimental = options.lifecycleExperimental,
      disableLifecycleMethods = options.disableLifecycleMethods,
      enableComponentDidUpdateOnSetState = options.enableComponentDidUpdateOnSetState,
      supportPrevContextArgumentOfComponentDidUpdate = options.supportPrevContextArgumentOfComponentDidUpdate,
      lifecycles = options.lifecycles;

  if (typeof lifecycleExperimental !== 'undefined' && typeof lifecycleExperimental !== 'boolean') {
    throw new Error('lifecycleExperimental must be either true or false if provided');
  }

  if (typeof disableLifecycleMethods !== 'undefined' && typeof disableLifecycleMethods !== 'boolean') {
    throw new Error('disableLifecycleMethods must be either true or false if provided');
  }

  if (lifecycleExperimental != null && disableLifecycleMethods != null && lifecycleExperimental === disableLifecycleMethods) {
    throw new Error('lifecycleExperimental and disableLifecycleMethods cannot be set to the same value');
  }

  if (typeof enableComponentDidUpdateOnSetState !== 'undefined' && lifecycles.componentDidUpdate && lifecycles.componentDidUpdate.onSetState !== enableComponentDidUpdateOnSetState) {
    throw new TypeError('the legacy enableComponentDidUpdateOnSetState option should be matched by `lifecycles: { componentDidUpdate: { onSetState: true } }`, for compatibility');
  }

  if (typeof supportPrevContextArgumentOfComponentDidUpdate !== 'undefined' && lifecycles.componentDidUpdate && lifecycles.componentDidUpdate.prevContext !== supportPrevContextArgumentOfComponentDidUpdate) {
    throw new TypeError('the legacy supportPrevContextArgumentOfComponentDidUpdate option should be matched by `lifecycles: { componentDidUpdate: { prevContext: true } }`, for compatibility');
  }
}

function getAdapterLifecycles(_ref) {
  var options = _ref.options;
  var _options$lifecycles = options.lifecycles,
      lifecycles = _options$lifecycles === undefined ? {} : _options$lifecycles,
      enableComponentDidUpdateOnSetState = options.enableComponentDidUpdateOnSetState,
      supportPrevContextArgumentOfComponentDidUpdate = options.supportPrevContextArgumentOfComponentDidUpdate;


  var hasLegacySetStateArg = typeof enableComponentDidUpdateOnSetState !== 'undefined';
  var hasLegacyPrevContextArg = typeof supportPrevContextArgumentOfComponentDidUpdate !== 'undefined';
  var componentDidUpdate = hasLegacySetStateArg || hasLegacyPrevContextArg ? (0, _object2['default'])({}, hasLegacySetStateArg && {
    onSetState: !!enableComponentDidUpdateOnSetState
  }, hasLegacyPrevContextArg && {
    prevContext: !!supportPrevContextArgumentOfComponentDidUpdate
  }) : null;
  var originalGDSFP = lifecycles.getDerivedStateFromProps;

  var getDerivedStateFromProps = originalGDSFP ? {
    hasShouldComponentUpdateBug: !!originalGDSFP.hasShouldComponentUpdateBug
  } : false;

  return (0, _object2['default'])({}, lifecycles, {
    setState: (0, _object2['default'])({}, lifecycles.setState),
    getChildContext: (0, _object2['default'])({
      calledByRenderer: true
    }, lifecycles.getChildContext)
  }, componentDidUpdate && { componentDidUpdate: componentDidUpdate }, {
    getDerivedStateFromProps: getDerivedStateFromProps
  });
}

function getRootNode(node) {
  if (node.nodeType === 'host') {
    return node;
  }
  return node.rendered;
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
  if (!Array.isArray(nodes)) {
    (0, _Utils.privateSet)(wrapper, NODE, nodes);
    (0, _Utils.privateSet)(wrapper, NODES, [nodes]);
  } else {
    (0, _Utils.privateSet)(wrapper, NODE, nodes[0]);
    (0, _Utils.privateSet)(wrapper, NODES, nodes);
  }
  (0, _Utils.privateSet)(wrapper, 'length', wrapper[NODES].length);
}

function pureComponentShouldComponentUpdate(prevProps, props, prevState, state) {
  return !(0, _Utils.shallowEqual)(prevProps, props) || !(0, _Utils.shallowEqual)(prevState, state);
}

function isPureComponent(instance) {
  return instance && instance.isPureReactComponent;
}

function getChildContext(node, hierarchy, renderer) {
  var instance = node.instance,
      Component = node.type;

  var componentName = (0, _Utils.displayNameOfNode)(node);
  // Warn like react if childContextTypes is not defined:
  // https://github.com/facebook/react/blob/1454a8be03794f5e0b23a7e7696cbbbdcf8b0f5d/packages/react-dom/src/server/ReactPartialRenderer.js#L639-L646
  if (_typeof(Component.childContextTypes) !== 'object') {
    // eslint-disable-next-line no-console
    console.warn(String(componentName) + '.getChildContext(): childContextTypes must be defined in order to use getChildContext().');
    return {};
  }
  // Check childContextTypes like react:
  // https://github.com/facebook/react/blob/1454a8be03794f5e0b23a7e7696cbbbdcf8b0f5d/packages/react-dom/src/server/ReactPartialRenderer.js#L630-L637
  var childContext = instance.getChildContext();
  Object.keys(childContext).forEach(function (key) {
    if (!(key in Component.childContextTypes)) {
      throw new Error(String(componentName) + '.getChildContext(): key "' + String(key) + '" is not defined in childContextTypes.');
    }
  });
  if (typeof renderer.checkPropTypes === 'function') {
    renderer.checkPropTypes(Component.childContextTypes, childContext, 'child context', hierarchy);
  }
  return childContext;
}

function spyOnGetChildContextInitialRender(nodes, adapter) {
  if (!(0, _Utils.isCustomComponentElement)(nodes, adapter) || !nodes.type.prototype || typeof nodes.type.prototype.getChildContext !== 'function') {
    return null;
  }

  return (0, _Utils.spyMethod)(nodes.type.prototype, 'getChildContext');
}

function privateSetChildContext(adapter, wrapper, instance, renderedNode, getChildContextSpy) {
  var renderer = wrapper[RENDERER];
  // We only support parent-based context.
  if (adapter.options.legacyContextMode !== 'parent') {
    return;
  }
  if (getChildContextSpy) {
    (0, _Utils.privateSet)(wrapper, CHILD_CONTEXT, getChildContextSpy.getLastReturnValue());
    getChildContextSpy.restore();
  } else if (typeof instance.getChildContext === 'function') {
    // If there's no spy but getChildContext is a function, that means our renderer
    // is not going to call it for us, so we need to call it ourselves.
    var nodeHierarchy = [wrapper[NODE]].concat(nodeParents(wrapper, wrapper[NODE]));
    var childContext = getChildContext(renderedNode, nodeHierarchy, renderer);
    (0, _Utils.privateSet)(wrapper, CHILD_CONTEXT, childContext);
  } else {
    (0, _Utils.privateSet)(wrapper, CHILD_CONTEXT, null);
  }
}

function mockSCUIfgDSFPReturnNonNull(node, state) {
  var getDerivedStateFromProps = node.type.getDerivedStateFromProps;


  if (typeof getDerivedStateFromProps === 'function') {
    // we try to fix a React shallow renderer bug here.
    // (facebook/react#14607, which has been fixed in react 16.8):
    // when gDSFP return derived state, it will set instance state in shallow renderer before SCU,
    // this will cause `this.state` in sCU be the updated state, which is wrong behavior.
    // so we have to wrap sCU to pass the old state to original sCU.
    var instance = node.instance;

    var _spyMethod = (0, _Utils.spyMethod)(instance, 'shouldComponentUpdate', function (originalSCU) {
      return function () {
        function shouldComponentUpdate() {
          instance.state = state;

          for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          var sCUResult = originalSCU.apply(instance, args);
          var nextState = args[1];

          instance.state = nextState;
          restore();
          return sCUResult;
        }

        return shouldComponentUpdate;
      }();
    }),
        restore = _spyMethod.restore;
  }
}

/**
 * Recursively dive()s every custom component in a wrapper until
 * the target component is found.
 *
 * @param {ShallowWrapper} wrapper A ShallowWrapper to search
 * @param {ComponentType} target A react custom component that, when found, will end recursion
 * @param {Adapter} adapter An Enzyme adapter
 * @returns {ShallowWrapper|undefined} A ShallowWrapper for the target, or
 *  undefined if it can't be found
 */
function deepRender(wrapper, target, adapter) {
  var node = wrapper[NODE];
  var element = node && adapter.nodeToElement(node);
  if (wrapper.type() === target) {
    return wrapper.dive();
  }
  if (element && (0, _Utils.isCustomComponentElement)(element, adapter)) {
    return deepRender(wrapper.dive(), target, adapter);
  }
  var children = wrapper.children();
  for (var i = 0; i < children.length; i += 1) {
    var found = deepRender(children.at(i), target, adapter);
    if (typeof found !== 'undefined') {
      return found;
    }
  }
  return undefined;
}

/**
 * Deep-renders the `wrappingComponent` and returns the context that should
 * be accessible to the primary wrapper.
 *
 * @param {WrappingComponentWrapper} wrapper The `WrappingComponentWrapper` for a
 *  `wrappingComponent`
 * @param {Adapter} adapter An Enzyme adapter
 * @returns {object} An object containing an object of legacy context values and a Map of
 *  `createContext()` Provider values.
 */
function getContextFromWrappingComponent(wrapper, adapter) {
  var rootFinder = deepRender(wrapper, wrapper[ROOT_FINDER], adapter);
  if (!rootFinder) {
    throw new Error('`wrappingComponent` must render its children!');
  }
  return {
    legacyContext: rootFinder[OPTIONS].context,
    providerValues: rootFinder[PROVIDER_VALUES]
  };
}

/**
 * Makes options specifically for `ShallowWrapper`. Most of the logic here is around rendering
 * a `wrappingComponent` (if one was provided) and adding the child context of that component
 * to `options.context`.
 *
 * @param {ReactElement} nodes the nodes passed to `ShallowWrapper`
 * @param {ShallowWrapper} root this `ShallowWrapper`'s parent. If this is passed, options are
 *  not transformed.
 * @param {*} passedOptions the options passed to `ShallowWrapper`.
 * @param {*} wrapper the `ShallowWrapper` itself
 * @returns {Object} the decorated and transformed options
 */
function makeShallowOptions(nodes, root, passedOptions, wrapper) {
  var options = (0, _Utils.makeOptions)(passedOptions);
  var adapter = (0, _getAdapter2['default'])(passedOptions);
  (0, _Utils.privateSet)(options, PROVIDER_VALUES, passedOptions[PROVIDER_VALUES]);
  if (root || !(0, _Utils.isCustomComponent)(options.wrappingComponent, adapter)) {
    return options;
  }
  if (typeof adapter.wrapWithWrappingComponent !== 'function') {
    throw new TypeError('your adapter does not support `wrappingComponent`. Try upgrading it!');
  }

  var _adapter$wrapWithWrap = adapter.wrapWithWrappingComponent(nodes, options),
      wrappedNode = _adapter$wrapWithWrap.node,
      RootFinder = _adapter$wrapWithWrap.RootFinder;
  // eslint-disable-next-line no-use-before-define


  var wrappingComponent = new WrappingComponentWrapper(wrappedNode, wrapper, RootFinder);

  var _getContextFromWrappi = getContextFromWrappingComponent(wrappingComponent, adapter),
      wrappingComponentLegacyContext = _getContextFromWrappi.legacyContext,
      wrappingComponentProviderValues = _getContextFromWrappi.providerValues;

  (0, _Utils.privateSet)(wrapper, WRAPPING_COMPONENT, wrappingComponent);
  return (0, _object2['default'])({}, options, _defineProperty({
    context: (0, _object2['default'])({}, options.context, wrappingComponentLegacyContext)
  }, PROVIDER_VALUES, wrappingComponentProviderValues));
}

/**
 * @class ShallowWrapper
 */

var ShallowWrapper = function () {
  function ShallowWrapper(nodes, root) {
    var _this = this;

    var passedOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, ShallowWrapper);

    validateOptions(passedOptions);

    var options = makeShallowOptions(nodes, root, passedOptions, this);
    var adapter = (0, _getAdapter2['default'])(options);
    var lifecycles = getAdapterLifecycles(adapter);

    // mounting a ShallowRender component
    if (!root) {
      if (!adapter.isValidElement(nodes)) {
        throw new TypeError('ShallowWrapper can only wrap valid elements');
      }

      var getChildContextSpy = lifecycles.getChildContext.calledByRenderer ? spyOnGetChildContextInitialRender(nodes, adapter) : null;
      (0, _Utils.privateSet)(this, ROOT, this);
      (0, _Utils.privateSet)(this, UNRENDERED, nodes);
      var renderer = adapter.createRenderer((0, _object2['default'])({ mode: 'shallow' }, options));
      (0, _Utils.privateSet)(this, RENDERER, renderer);
      var providerValues = new Map(options[PROVIDER_VALUES] || []);
      this[RENDERER].render(nodes, options.context, { providerValues: providerValues });
      var renderedNode = this[RENDERER].getNode();
      privateSetNodes(this, getRootNode(renderedNode));
      (0, _Utils.privateSet)(this, OPTIONS, options);
      (0, _Utils.privateSet)(this, PROVIDER_VALUES, providerValues);

      var instance = renderedNode.instance;

      if (instance && !options.disableLifecycleMethods) {
        // Ensure to call componentDidUpdate when instance.setState is called
        if (lifecycles.componentDidUpdate.onSetState && !instance[SET_STATE]) {
          (0, _Utils.privateSet)(instance, SET_STATE, instance.setState);
          instance.setState = function (updater) {
            var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
            return _this.setState.apply(_this, _toConsumableArray(callback == null ? [updater] : [updater, callback]));
          };
        }

        if (typeof instance.componentDidMount === 'function') {
          this[RENDERER].batchedUpdates(function () {
            instance.componentDidMount();
          });
        }
        privateSetChildContext(adapter, this, instance, renderedNode, getChildContextSpy);
      }
      // creating a child component through enzyme's ShallowWrapper APIs.
    } else {
      (0, _Utils.privateSet)(this, ROOT, root);
      (0, _Utils.privateSet)(this, UNRENDERED, null);
      (0, _Utils.privateSet)(this, RENDERER, root[RENDERER]);
      privateSetNodes(this, nodes);
      (0, _Utils.privateSet)(this, OPTIONS, root[OPTIONS]);
      (0, _Utils.privateSet)(this, ROOT_NODES, root[NODES]);
      (0, _Utils.privateSet)(this, PROVIDER_VALUES, null);
    }
  }

  /**
   * Returns the root wrapper
   *
   * @return {ShallowWrapper}
   */


  _createClass(ShallowWrapper, [{
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
          throw new Error('ShallowWrapper::getNode() can only be called when wrapping one node');
        }
        if (this[ROOT] === this) {
          this.update();
        }
        return this[NODE];
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
        if (this[ROOT] === this && this.length === 1) {
          this.update();
        }
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
        var _this2 = this;

        return this.single('getElement', function (n) {
          return (0, _getAdapter2['default'])(_this2[OPTIONS]).nodeToElement(n);
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
        return this.getNodesInternal().map((0, _getAdapter2['default'])(this[OPTIONS]).nodeToElement);
      }

      return getElements;
    }()

    // eslint-disable-next-line class-methods-use-this

  }, {
    key: 'getNode',
    value: function () {
      function getNode() {
        throw new Error('ShallowWrapper::getNode() is no longer supported. Use ShallowWrapper::getElement() instead');
      }

      return getNode;
    }()

    // eslint-disable-next-line class-methods-use-this

  }, {
    key: 'getNodes',
    value: function () {
      function getNodes() {
        throw new Error('ShallowWrapper::getNodes() is no longer supported. Use ShallowWrapper::getElements() instead');
      }

      return getNodes;
    }()

    /**
     * Gets the instance of the component being rendered as the root node passed into `shallow()`.
     *
     * NOTE: can only be called on a wrapper instance that is also the root instance.
     *
     * Example:
     * ```
     * const wrapper = shallow(<MyComponent />);
     * const inst = wrapper.instance();
     * expect(inst).to.be.instanceOf(MyComponent);
     * ```
     * @returns {ReactComponent}
     */

  }, {
    key: 'instance',
    value: function () {
      function instance() {
        if (this[ROOT] !== this) {
          throw new Error('ShallowWrapper::instance() can only be called on the root');
        }
        return this[RENDERER].getNode().instance;
      }

      return instance;
    }()

    /**
     * If a `wrappingComponent` was passed in `options`, this methods returns a `ShallowWrapper`
     * around the rendered `wrappingComponent`. This `ShallowWrapper` can be used to update the
     * `wrappingComponent`'s props, state, etc.
     *
     * @returns ShallowWrapper
     */

  }, {
    key: 'getWrappingComponent',
    value: function () {
      function getWrappingComponent() {
        if (this[ROOT] !== this) {
          throw new Error('ShallowWrapper::getWrappingComponent() can only be called on the root');
        }
        if (!this[OPTIONS].wrappingComponent) {
          throw new Error('ShallowWrapper::getWrappingComponent() can only be called on a wrapper that was originally passed a `wrappingComponent` option');
        }
        return this[WRAPPING_COMPONENT];
      }

      return getWrappingComponent;
    }()

    /**
     * Forces a re-render. Useful to run before checking the render output if something external
     * may be updating the state of the component somewhere.
     *
     * NOTE: can only be called on a wrapper instance that is also the root instance.
     *
     * @returns {ShallowWrapper}
     */

  }, {
    key: 'update',
    value: function () {
      function update() {
        if (this[ROOT] !== this) {
          throw new Error('ShallowWrapper::update() can only be called on the root');
        }
        if (this.length !== 1) {
          throw new Error('ShallowWrapper::update() can only be called when wrapping one node');
        }
        privateSetNodes(this, getRootNode(this[RENDERER].getNode()));
        return this;
      }

      return update;
    }()

    /**
     * A method that unmounts the component. This can be used to simulate a component going through
     * and unmount/mount lifecycle.
     * @returns {ShallowWrapper}
     */

  }, {
    key: 'unmount',
    value: function () {
      function unmount() {
        this[RENDERER].unmount();
        if (this[ROOT][WRAPPING_COMPONENT]) {
          this[ROOT][WRAPPING_COMPONENT].unmount();
        }
        return this;
      }

      return unmount;
    }()

    /**
     * A method is for re-render with new props and context.
     * This calls componentDidUpdate method if disableLifecycleMethods is not enabled.
     *
     * NOTE: can only be called on a wrapper instance that is also the root instance.
     *
     * @param {Object} props
     * @param {Object} context
     * @returns {ShallowWrapper}
     */

  }, {
    key: 'rerender',
    value: function () {
      function rerender(props, context) {
        var _this3 = this;

        var adapter = (0, _getAdapter2['default'])(this[OPTIONS]);
        this.single('rerender', function () {
          (0, _Utils.withSetStateAllowed)(function () {
            // NOTE(lmr): In react 16, instances will be null for SFCs, but
            // rerendering with props/context is still a valid thing to do. In
            // this case, state will be undefined, but props/context will exist.
            var node = _this3[RENDERER].getNode();
            var instance = node.instance || {};
            var type = node.type || {};
            var state = instance.state;

            var prevProps = instance.props || _this3[UNRENDERED].props;
            var prevContext = instance.context || _this3[OPTIONS].context;
            var nextContext = context || prevContext;
            if (context) {
              _this3[OPTIONS] = (0, _object2['default'])({}, _this3[OPTIONS], { context: nextContext });
            }
            _this3[RENDERER].batchedUpdates(function () {
              // When shouldComponentUpdate returns false we shouldn't call componentDidUpdate.
              // so we spy shouldComponentUpdate to get the result.
              var lifecycles = getAdapterLifecycles(adapter);
              var shouldRender = true;
              var shouldComponentUpdateSpy = void 0;
              var getChildContextSpy = void 0;
              if (!_this3[OPTIONS].disableLifecycleMethods && instance) {
                if (typeof instance.shouldComponentUpdate === 'function') {
                  var gDSFP = lifecycles.getDerivedStateFromProps;

                  if (gDSFP && gDSFP.hasShouldComponentUpdateBug) {
                    mockSCUIfgDSFPReturnNonNull(node, state);
                  }
                  shouldComponentUpdateSpy = (0, _Utils.spyMethod)(instance, 'shouldComponentUpdate');
                }
                if (lifecycles.getChildContext.calledByRenderer && typeof instance.getChildContext === 'function') {
                  getChildContextSpy = (0, _Utils.spyMethod)(instance, 'getChildContext');
                }
              }
              if (!shouldComponentUpdateSpy && isPureComponent(instance)) {
                shouldRender = pureComponentShouldComponentUpdate(prevProps, props, state, instance.state);
              }
              if (props) _this3[UNRENDERED] = (0, _Utils.cloneElement)(adapter, _this3[UNRENDERED], props);
              _this3[RENDERER].render(_this3[UNRENDERED], nextContext, {
                providerValues: _this3[PROVIDER_VALUES]
              });
              if (shouldComponentUpdateSpy) {
                shouldRender = shouldComponentUpdateSpy.getLastReturnValue();
                shouldComponentUpdateSpy.restore();
              }
              if (shouldRender && !_this3[OPTIONS].disableLifecycleMethods && instance) {
                privateSetChildContext(adapter, _this3, instance, node, getChildContextSpy);
                if (lifecycles.getSnapshotBeforeUpdate) {
                  var snapshot = void 0;
                  if (typeof instance.getSnapshotBeforeUpdate === 'function') {
                    snapshot = instance.getSnapshotBeforeUpdate(prevProps, state);
                  }
                  if (lifecycles.componentDidUpdate && typeof instance.componentDidUpdate === 'function' && (!state || (0, _Utils.shallowEqual)(state, _this3.instance().state) || typeof type.getDerivedStateFromProps === 'function')) {
                    instance.componentDidUpdate(prevProps, state, snapshot);
                  }
                } else if (lifecycles.componentDidUpdate && typeof instance.componentDidUpdate === 'function') {
                  if (lifecycles.componentDidUpdate.prevContext) {
                    instance.componentDidUpdate(prevProps, state, prevContext);
                  } else if (!state || (0, _Utils.shallowEqual)(_this3.instance().state, state)) {
                    instance.componentDidUpdate(prevProps, state);
                  }
                }
                // If it doesn't need to rerender, update only its props.
              } else if (!(0, _Utils.shallowEqual)(props, instance.props)) {
                instance.props = (Object.freeze || Object)((0, _object2['default'])({}, instance.props, props));
              }
              _this3.update();
            });
          });
        });
        return this;
      }

      return rerender;
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
     * @returns {ShallowWrapper}
     */

  }, {
    key: 'setProps',
    value: function () {
      function setProps(props) {
        var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

        if (this[ROOT] !== this) {
          throw new Error('ShallowWrapper::setProps() can only be called on the root');
        }
        if (arguments.length > 1 && typeof callback !== 'function') {
          throw new TypeError('ReactWrapper::setProps() expects a function as its second argument');
        }
        this.rerender(props);
        if (callback) {
          callback();
        }
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
     * @returns {ShallowWrapper}
     */

  }, {
    key: 'setState',
    value: function () {
      function setState(state) {
        var _this4 = this;

        var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

        if (this[ROOT] !== this) {
          throw new Error('ShallowWrapper::setState() can only be called on the root');
        }
        if (this.instance() === null || this[RENDERER].getNode().nodeType !== 'class') {
          throw new Error('ShallowWrapper::setState() can only be called on class components');
        }
        if (arguments.length > 1 && typeof callback !== 'function') {
          throw new TypeError('ReactWrapper::setState() expects a function as its second argument');
        }

        this.single('setState', function () {
          (0, _Utils.withSetStateAllowed)(function () {
            var adapter = (0, _getAdapter2['default'])(_this4[OPTIONS]);

            var lifecycles = getAdapterLifecycles(adapter);

            var node = _this4[RENDERER].getNode();
            var instance = node.instance;

            var prevProps = instance.props;
            var prevState = instance.state;
            var prevContext = instance.context;

            var statePayload = typeof state === 'function' ? state.call(instance, prevState, prevProps) : state;

            // returning null or undefined prevents the update in React 16+
            // https://github.com/facebook/react/pull/12756
            var maybeHasUpdate = !lifecycles.setState.skipsComponentDidUpdateOnNullish || statePayload != null;

            // When shouldComponentUpdate returns false we shouldn't call componentDidUpdate.
            // so we spy shouldComponentUpdate to get the result.
            var shouldComponentUpdateSpy = void 0;
            var getChildContextSpy = void 0;
            var shouldRender = true;
            if (!_this4[OPTIONS].disableLifecycleMethods && instance) {
              if (lifecycles.componentDidUpdate && lifecycles.componentDidUpdate.onSetState && typeof instance.shouldComponentUpdate === 'function') {
                var gDSFP = lifecycles.getDerivedStateFromProps;

                if (gDSFP && gDSFP.hasShouldComponentUpdateBug) {
                  mockSCUIfgDSFPReturnNonNull(node, state);
                }
                shouldComponentUpdateSpy = (0, _Utils.spyMethod)(instance, 'shouldComponentUpdate');
              }
              if (lifecycles.getChildContext.calledByRenderer && typeof instance.getChildContext === 'function') {
                getChildContextSpy = (0, _Utils.spyMethod)(instance, 'getChildContext');
              }
            }
            if (!shouldComponentUpdateSpy && isPureComponent(instance)) {
              shouldRender = pureComponentShouldComponentUpdate(prevProps, instance.props, prevState, (0, _object2['default'])({}, prevState, statePayload));
            }

            // We don't pass the setState callback here
            // to guarantee to call the callback after finishing the render
            if (instance[SET_STATE]) {
              instance[SET_STATE](statePayload);
            } else {
              instance.setState(statePayload);
            }
            if (shouldComponentUpdateSpy) {
              shouldRender = shouldComponentUpdateSpy.getLastReturnValue();
              shouldComponentUpdateSpy.restore();
            }
            if (maybeHasUpdate && shouldRender && !_this4[OPTIONS].disableLifecycleMethods) {
              privateSetChildContext(adapter, _this4, instance, node, getChildContextSpy);
              if (lifecycles.componentDidUpdate && lifecycles.componentDidUpdate.onSetState) {
                if (lifecycles.getSnapshotBeforeUpdate && typeof instance.getSnapshotBeforeUpdate === 'function') {
                  var snapshot = instance.getSnapshotBeforeUpdate(prevProps, prevState);
                  if (typeof instance.componentDidUpdate === 'function') {
                    instance.componentDidUpdate(prevProps, prevState, snapshot);
                  }
                } else if (typeof instance.componentDidUpdate === 'function') {
                  if (lifecycles.componentDidUpdate.prevContext) {
                    instance.componentDidUpdate(prevProps, prevState, prevContext);
                  } else {
                    instance.componentDidUpdate(prevProps, prevState);
                  }
                }
              }
            }
            _this4.update();
            // call the setState callback
            if (callback) {
              if (adapter.invokeSetStateCallback) {
                adapter.invokeSetStateCallback(instance, callback);
              } else {
                callback.call(instance);
              }
            }
          });
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
     * @returns {ShallowWrapper}
     */

  }, {
    key: 'setContext',
    value: function () {
      function setContext(context) {
        if (this[ROOT] !== this) {
          throw new Error('ShallowWrapper::setContext() can only be called on the root');
        }
        if (!this[OPTIONS].context) {
          throw new Error('ShallowWrapper::setContext() can only be called on a wrapper that was originally passed a context option');
        }
        return this.rerender(null, context);
      }

      return setContext;
    }()

    /**
     * Whether or not a given react element exists in the shallow render tree.
     *
     * Example:
     * ```
     * const wrapper = shallow(<MyComponent />);
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
        if (!(0, _Utils.isReactElementAlike)(nodeOrNodes, adapter)) {
          throw new Error('ShallowWrapper::contains() can only be called with a ReactElement (or an array of them), a string, or a number as an argument.');
        }
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
     * Whether or not a given react element exists in the shallow render tree.
     * Match is based on the expected element and not on wrappers element.
     * It will determine if one of the wrappers element "looks like" the expected
     * element by checking if all props of the expected element are present
     * on the wrappers element and equals to each other.
     *
     * Example:
     * ```
     * // MyComponent outputs <div><div class="foo">Hello</div></div>
     * const wrapper = shallow(<MyComponent />);
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
        var adapter = (0, _getAdapter2['default'])(this[OPTIONS]);
        var rstNode = adapter.elementToNode(node);
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
     * Whether or not all the given react elements exists in the shallow render tree.
     * Match is based on the expected element and not on wrappers element.
     * It will determine if one of the wrappers element "looks like" the expected
     * element by checking if all props of the expected element are present
     * on the wrappers element and equals to each other.
     *
     * Example:
     * ```
     * const wrapper = shallow(<MyComponent />);
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
        var _this5 = this;

        if (!Array.isArray(nodes)) {
          throw new TypeError('nodes should be an Array');
        }

        return nodes.every(function (node) {
          return _this5.containsMatchingElement(node);
        });
      }

      return containsAllMatchingElements;
    }()

    /**
     * Whether or not one of the given react elements exists in the shallow render tree.
     * Match is based on the expected element and not on wrappers element.
     * It will determine if one of the wrappers element "looks like" the expected
     * element by checking if all props of the expected element are present
     * on the wrappers element and equals to each other.
     *
     * Example:
     * ```
     * const wrapper = shallow(<MyComponent />);
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
        var _this6 = this;

        return Array.isArray(nodes) && nodes.some(function (node) {
          return _this6.containsMatchingElement(node);
        });
      }

      return containsAnyMatchingElements;
    }()

    /**
     * Whether or not a given react element exists in the render tree.
     *
     * Example:
     * ```
     * const wrapper = shallow(<MyComponent />);
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
        var _this7 = this;

        return this.single('equals', function () {
          return (0, _Utils.nodeEqual)(_this7.getNodeInternal(), node);
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
     * const wrapper = shallow(<MyComponent />);
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
        var _this8 = this;

        return this.single('matchesElement', function () {
          var adapter = (0, _getAdapter2['default'])(_this8[OPTIONS]);
          var rstNode = adapter.elementToNode(node);
          return (0, _Utils.nodeMatches)(rstNode, _this8.getNodeInternal(), function (a, b) {
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
     * @returns {ShallowWrapper}
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
        var nodes = this.getNodesInternal();

        return nodes.every(function (n) {
          return (0, _Utils.isEmptyValue)(n);
        });
      }

      return isEmptyRender;
    }()

    /**
     * Returns a new wrapper instance with only the nodes of the current wrapper instance that match
     * the provided predicate function. The predicate should receive a wrapped node as its first
     * argument.
     *
     * @param {Function} predicate
     * @returns {ShallowWrapper}
     */

  }, {
    key: 'filterWhere',
    value: function () {
      function filterWhere(predicate) {
        var _this9 = this;

        return filterWhereUnwrapped(this, function (n) {
          return predicate(_this9.wrap(n));
        });
      }

      return filterWhere;
    }()

    /**
     * Returns a new wrapper instance with only the nodes of the current wrapper instance that match
     * the provided selector.
     *
     * @param {EnzymeSelector} selector
     * @returns {ShallowWrapper}
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
     * @returns {ShallowWrapper}
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
        return this.single('text', _RSTTraversal.getTextFromNode);
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
        var _this10 = this;

        return this.single('html', function (n) {
          if (_this10.type() === null) return null;
          var adapter = (0, _getAdapter2['default'])(_this10[OPTIONS]);
          var renderer = adapter.createRenderer((0, _object2['default'])({}, _this10[OPTIONS], { mode: 'string' }));
          return renderer.render(adapter.nodeToElement(n));
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
        return this.type() === null ? (0, _cheerio2['default'])() : _cheerio2['default'].load('')(this.html());
      }

      return render;
    }()

    /**
     * Used to simulate events. Pass an eventname and (optionally) event arguments. This method of
     * testing events should be met with some skepticism.
     *
     * @param {String} event
     * @param {Array} args
     * @returns {ShallowWrapper}
     */

  }, {
    key: 'simulate',
    value: function () {
      function simulate(event) {
        var _this11 = this;

        for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
          args[_key2 - 1] = arguments[_key2];
        }

        return this.single('simulate', function (n) {
          var _RENDERER;

          (_RENDERER = _this11[RENDERER]).simulateEvent.apply(_RENDERER, [n, event].concat(args));
          _this11[ROOT].update();
          return _this11;
        });
      }

      return simulate;
    }()

    /**
     * Used to simulate throwing a rendering error. Pass an error to throw.
     *
     * @param {String} error
     * @returns {ShallowWrapper}
     */

  }, {
    key: 'simulateError',
    value: function () {
      function simulateError(error) {
        var _this12 = this;

        // in shallow, the "root" is the "rendered" thing.

        return this.single('simulateError', function (thisNode) {
          if (thisNode.nodeType === 'host') {
            throw new TypeError('ShallowWrapper::simulateError() can only be called on custom components');
          }

          var renderer = _this12[RENDERER];
          if (typeof renderer.simulateError !== 'function') {
            throw new TypeError('your adapter does not support `simulateError`. Try upgrading it!');
          }

          var rootNode = getRootNodeInternal(_this12);
          var nodeHierarchy = [thisNode].concat(nodeParents(_this12, thisNode));
          renderer.simulateError(nodeHierarchy, rootNode, error);

          return _this12;
        });
      }

      return simulateError;
    }()

    /**
     * Returns the props hash for the current node of the wrapper.
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
        var _this13 = this;

        if (this[ROOT] !== this) {
          throw new Error('ShallowWrapper::state() can only be called on the root');
        }
        if (this.instance() === null || this[RENDERER].getNode().nodeType !== 'class') {
          throw new Error('ShallowWrapper::state() can only be called on class components');
        }
        var _state = this.single('state', function () {
          return _this13.instance().state;
        });
        if (typeof name !== 'undefined') {
          if (_state == null) {
            throw new TypeError('ShallowWrapper::state("' + String(name) + '") requires that `state` not be `null` or `undefined`');
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
        var _this14 = this;

        if (this[ROOT] !== this) {
          throw new Error('ShallowWrapper::context() can only be called on the root');
        }
        if (!this[OPTIONS].context) {
          throw new Error('ShallowWrapper::context() can only be called on a wrapper that was originally passed a context option');
        }
        if (this.instance() === null) {
          throw new Error('ShallowWrapper::context() can only be called on wrapped nodes that have a non-null instance');
        }
        var _context = this.single('context', function () {
          return _this14.instance().context;
        });
        if (name) {
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
     * @returns {ShallowWrapper}
     */

  }, {
    key: 'children',
    value: function () {
      function children(selector) {
        var allChildren = this.flatMap(function (n) {
          return (0, _RSTTraversal.childrenOfNode)(n.getNodeInternal());
        });
        return selector ? allChildren.filter(selector) : allChildren;
      }

      return children;
    }()

    /**
     * Returns a new wrapper with a specific child
     *
     * @param {Number} [index]
     * @returns {ShallowWrapper}
     */

  }, {
    key: 'childAt',
    value: function () {
      function childAt(index) {
        var _this15 = this;

        return this.single('childAt', function () {
          return _this15.children().at(index);
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
     * @returns {ShallowWrapper}
     */

  }, {
    key: 'parents',
    value: function () {
      function parents(selector) {
        var _this16 = this;

        return this.single('parents', function (n) {
          var allParents = _this16.wrap(nodeParents(_this16, n));
          return selector ? allParents.filter(selector) : allParents;
        });
      }

      return parents;
    }()

    /**
     * Returns a wrapper around the immediate parent of the current node.
     *
     * @returns {ShallowWrapper}
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
     * @returns {ShallowWrapper}
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
     * Shallow renders the current node and returns a shallow wrapper around it.
     *
     * NOTE: can only be called on wrapper of a single node.
     *
     * @param {Object} options
     * @returns {ShallowWrapper}
     */

  }, {
    key: 'shallow',
    value: function () {
      function shallow(options) {
        var _this17 = this;

        return this.single('shallow', function (n) {
          return _this17.wrap((0, _getAdapter2['default'])(_this17[OPTIONS]).nodeToElement(n), null, options);
        });
      }

      return shallow;
    }()

    /**
     * Returns the value of prop with the given name of the current node.
     *
     * @param propName
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
        var _this18 = this;

        return this.single('invoke', function () {
          var handler = _this18.prop(propName);
          if (typeof handler !== 'function') {
            throw new TypeError('ShallowWrapper::invoke() requires the name of a prop whose value is a function');
          }
          return function () {
            var response = handler.apply(undefined, arguments);
            _this18[ROOT].update();
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
        var _this19 = this;

        var adapter = (0, _getAdapter2['default'])(this[OPTIONS]);
        if (typeof adapter.wrap !== 'function') {
          throw new RangeError('your adapter does not support `wrap`. Try upgrading it!');
        }

        return this.single('renderProp', function (n) {
          if (n.nodeType === 'host') {
            throw new TypeError('ShallowWrapper::renderProp() can only be called on custom components');
          }
          if (typeof propName !== 'string') {
            throw new TypeError('ShallowWrapper::renderProp(): `propName` must be a string');
          }
          var props = _this19.props();
          if (!(0, _has2['default'])(props, propName)) {
            throw new Error('ShallowWrapper::renderProp(): no prop called \u201C' + String(propName) + '\u201C found');
          }
          var propValue = props[propName];
          if (typeof propValue !== 'function') {
            throw new TypeError('ShallowWrapper::renderProp(): expected prop \u201C' + String(propName) + '\u201C to contain a function, but it holds \u201C' + (typeof propValue === 'undefined' ? 'undefined' : _typeof(propValue)) + '\u201C');
          }

          return function () {
            var element = propValue.apply(undefined, arguments);
            var wrapped = adapter.wrap(element);
            return _this19.wrap(wrapped, null, _this19[OPTIONS]);
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
     * Returns the type of the current node of this wrapper. If it's a composite component, this will
     * be the component constructor. If it's a native DOM node, it will be a string of the tag name.
     * If it's null, it will be null.
     *
     * @returns {String|Function|null}
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
     * Returns the name of the current node of this wrapper.
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
     * Returns whether or not the current node has the given class name or not.
     *
     * NOTE: can only be called on a wrapper of a single node.
     *
     * @param className
     * @returns {Boolean}
     */

  }, {
    key: 'hasClass',
    value: function () {
      function hasClass(className) {
        if (typeof className === 'string' && className.indexOf('.') !== -1) {
          // eslint-disable-next-line no-console
          console.warn('It looks like you\'re calling `ShallowWrapper::hasClass()` with a CSS selector. hasClass() expects a class name, not a CSS selector.');
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
     * @returns {ShallowWrapper}
     */

  }, {
    key: 'forEach',
    value: function () {
      function forEach(fn) {
        var _this20 = this;

        this.getNodesInternal().forEach(function (n, i) {
          return fn.call(_this20, _this20.wrap(n), i);
        });
        return this;
      }

      return forEach;
    }()

    /**
     * Maps the current array of nodes to another array. Each node is passed in as a `ShallowWrapper`
     * to the map function.
     *
     * @param {Function} fn
     * @returns {Array}
     */

  }, {
    key: 'map',
    value: function () {
      function map(fn) {
        var _this21 = this;

        return this.getNodesInternal().map(function (n, i) {
          return fn.call(_this21, _this21.wrap(n), i);
        });
      }

      return map;
    }()

    /**
     * Reduces the current array of nodes to a value. Each node is passed in as a `ShallowWrapper`
     * to the reducer function.
     *
     * @param {Function} fn - the reducer function
     * @param {*} initialValue - the initial value
     * @returns {*}
     */

  }, {
    key: 'reduce',
    value: function () {
      function reduce(fn) {
        var _this22 = this;

        var initialValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

        if (arguments.length > 1) {
          return this.getNodesInternal().reduce(function (accum, n, i) {
            return fn.call(_this22, accum, _this22.wrap(n), i);
          }, initialValue);
        }
        return this.getNodesInternal().reduce(function (accum, n, i) {
          return fn.call(_this22, i === 1 ? _this22.wrap(accum) : accum, _this22.wrap(n), i);
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
        var _this23 = this;

        var initialValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

        if (arguments.length > 1) {
          return this.getNodesInternal().reduceRight(function (accum, n, i) {
            return fn.call(_this23, accum, _this23.wrap(n), i);
          }, initialValue);
        }
        return this.getNodesInternal().reduceRight(function (accum, n, i) {
          return fn.call(_this23, i === 1 ? _this23.wrap(accum) : accum, _this23.wrap(n), i);
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
          throw new Error('ShallowWrapper::some() can not be called on the root');
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
        var _this24 = this;

        return this.getNodesInternal().some(function (n, i) {
          return predicate.call(_this24, _this24.wrap(n), i);
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
        var _this25 = this;

        return this.getNodesInternal().every(function (n, i) {
          return predicate.call(_this25, _this25.wrap(n), i);
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
     * @returns {ShallowWrapper}
     */

  }, {
    key: 'flatMap',
    value: function () {
      function flatMap(fn) {
        var _this26 = this;

        var nodes = this.getNodesInternal().map(function (n, i) {
          return fn.call(_this26, _this26.wrap(n), i);
        });
        var flattened = (0, _arrayPrototype2['default'])(nodes, 1);
        return this.wrap(flattened.filter(Boolean));
      }

      return flatMap;
    }()

    /**
     * Finds all nodes in the current wrapper nodes' render trees that match the provided predicate
     * function. The predicate function will receive the nodes inside a ShallowWrapper as its
     * first argument.
     *
     * @param {Function} predicate
     * @returns {ShallowWrapper}
     */

  }, {
    key: 'findWhere',
    value: function () {
      function findWhere(predicate) {
        var _this27 = this;

        return findWhereUnwrapped(this, function (n) {
          var node = _this27.wrap(n);
          return node.length > 0 && predicate(node);
        });
      }

      return findWhere;
    }()

    /**
     * Returns the node at a given index of the current wrapper.
     *
     * @param index
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
     * @param index
     * @returns {ShallowWrapper}
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
     * @returns {ShallowWrapper}
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
     * @returns {ShallowWrapper}
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
     * @param fn
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
     * @param node
     * @returns {ShallowWrapper}
     */

  }, {
    key: 'wrap',
    value: function () {
      function wrap(node) {
        var root = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this[ROOT];

        if (node instanceof ShallowWrapper) {
          return node;
        }

        for (var _len3 = arguments.length, args = Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
          args[_key3 - 2] = arguments[_key3];
        }

        return new (Function.prototype.bind.apply(ShallowWrapper, [null].concat([node, root], args)))();
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
     * @returns {ShallowWrapper}
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
     * Primarily useful for HOCs (higher-order components), this method may only be
     * run on a single, non-DOM node, and will return the node, shallow-rendered.
     *
     * @param {Object} options
     * @returns {ShallowWrapper}
     */

  }, {
    key: 'dive',
    value: function () {
      function dive() {
        var _this28 = this;

        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var adapter = (0, _getAdapter2['default'])(this[OPTIONS]);
        var name = 'dive';
        return this.single(name, function (n) {
          if (n && n.nodeType === 'host') {
            throw new TypeError('ShallowWrapper::' + name + '() can not be called on Host Components');
          }
          var el = (0, _getAdapter2['default'])(_this28[OPTIONS]).nodeToElement(n);
          if (!(0, _Utils.isCustomComponentElement)(el, adapter)) {
            throw new TypeError('ShallowWrapper::' + name + '() can only be called on components');
          }
          var childOptions = (0, _object2['default'])({}, _this28[OPTIONS], options, {
            context: options.context || (0, _object2['default'])({}, _this28[OPTIONS].context, _this28[ROOT][CHILD_CONTEXT])
          });
          (0, _Utils.privateSet)(childOptions, PROVIDER_VALUES, _this28[ROOT][PROVIDER_VALUES]);
          return _this28.wrap(el, null, childOptions);
        });
      }

      return dive;
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

  return ShallowWrapper;
}();

/**
 * Updates the context of the primary wrapper when the
 * `wrappingComponent` re-renders.
 */


function updatePrimaryRootContext(wrappingComponent) {
  var adapter = (0, _getAdapter2['default'])(wrappingComponent[OPTIONS]);
  var primaryWrapper = wrappingComponent[PRIMARY_WRAPPER];
  var primaryRenderer = primaryWrapper[RENDERER];
  var primaryNode = primaryRenderer.getNode();

  var _getContextFromWrappi2 = getContextFromWrappingComponent(wrappingComponent, adapter),
      legacyContext = _getContextFromWrappi2.legacyContext,
      providerValues = _getContextFromWrappi2.providerValues;

  var prevProviderValues = primaryWrapper[PROVIDER_VALUES];

  primaryWrapper.setContext((0, _object2['default'])({}, wrappingComponent[PRIMARY_WRAPPER][OPTIONS].context, legacyContext));
  primaryWrapper[PROVIDER_VALUES] = new Map([].concat(_toConsumableArray(prevProviderValues), _toConsumableArray(providerValues)));

  if (typeof adapter.isContextConsumer === 'function' && adapter.isContextConsumer(primaryNode.type)) {
    var Consumer = primaryNode.type;
    // Adapters with an `isContextConsumer` method will definitely have a `getProviderFromConsumer`
    // method.
    var Provider = adapter.getProviderFromConsumer(Consumer);
    var newValue = providerValues.get(Provider);
    var oldValue = prevProviderValues.get(Provider);

    // Use referential comparison like React
    if (newValue !== oldValue) {
      primaryWrapper.rerender();
    }
  }
}

/**
 * A *special* "root" wrapper that represents the component passed as `wrappingComponent`.
 * It is linked to the primary root such that updates to it will update the primary.
 *
 * @class WrappingComponentWrapper
 */

var WrappingComponentWrapper = function (_ShallowWrapper) {
  _inherits(WrappingComponentWrapper, _ShallowWrapper);

  function WrappingComponentWrapper(nodes, root, RootFinder) {
    _classCallCheck(this, WrappingComponentWrapper);

    var _this29 = _possibleConstructorReturn(this, (WrappingComponentWrapper.__proto__ || Object.getPrototypeOf(WrappingComponentWrapper)).call(this, nodes));

    (0, _Utils.privateSet)(_this29, PRIMARY_WRAPPER, root);
    (0, _Utils.privateSet)(_this29, ROOT_FINDER, RootFinder);
    return _this29;
  }

  /**
   * Like rerender() on ShallowWrapper, except it also does a "full render" of
   * itself and updates the primary ShallowWrapper's context.
   */


  _createClass(WrappingComponentWrapper, [{
    key: 'rerender',
    value: function () {
      function rerender() {
        var _get2;

        for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
          args[_key4] = arguments[_key4];
        }

        var result = (_get2 = _get(WrappingComponentWrapper.prototype.__proto__ || Object.getPrototypeOf(WrappingComponentWrapper.prototype), 'rerender', this)).call.apply(_get2, [this].concat(args));
        updatePrimaryRootContext(this);
        return result;
      }

      return rerender;
    }()

    /**
     * Like setState() on ShallowWrapper, except it also does a "full render" of
     * itself and updates the primary ShallowWrapper's context.
     */

  }, {
    key: 'setState',
    value: function () {
      function setState() {
        var _get3;

        for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
          args[_key5] = arguments[_key5];
        }

        var result = (_get3 = _get(WrappingComponentWrapper.prototype.__proto__ || Object.getPrototypeOf(WrappingComponentWrapper.prototype), 'setState', this)).call.apply(_get3, [this].concat(args));
        updatePrimaryRootContext(this);
        return result;
      }

      return setState;
    }()

    // eslint-disable-next-line class-methods-use-this

  }, {
    key: 'getWrappingComponent',
    value: function () {
      function getWrappingComponent() {
        throw new Error('ShallowWrapper::getWrappingComponent() can only be called on the root');
      }

      return getWrappingComponent;
    }()
  }]);

  return WrappingComponentWrapper;
}(ShallowWrapper);

if (_Utils.ITERATOR_SYMBOL) {
  Object.defineProperty(ShallowWrapper.prototype, _Utils.ITERATOR_SYMBOL, {
    configurable: true,
    value: function () {
      function iterator() {
        var _ref2;

        var iter = this.getNodesInternal()[_Utils.ITERATOR_SYMBOL]();
        var adapter = (0, _getAdapter2['default'])(this[OPTIONS]);
        return _ref2 = {}, _defineProperty(_ref2, _Utils.ITERATOR_SYMBOL, function () {
          return this;
        }), _defineProperty(_ref2, 'next', function () {
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
        }()), _ref2;
      }

      return iterator;
    }()
  });
}

function privateWarning(prop, extraMessage) {
  Object.defineProperty(ShallowWrapper.prototype, prop, {
    get: function () {
      function get() {
        throw new Error('\n        Attempted to access ShallowWrapper::' + String(prop) + ', which was previously a private property on\n        Enzyme ShallowWrapper instances, but is no longer and should not be relied upon.\n        ' + String(extraMessage) + '\n      ');
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

exports['default'] = ShallowWrapper;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9TaGFsbG93V3JhcHBlci5qcyJdLCJuYW1lcyI6WyJOT0RFIiwiTk9ERVMiLCJSRU5ERVJFUiIsIlVOUkVOREVSRUQiLCJST09UIiwiT1BUSU9OUyIsIlNFVF9TVEFURSIsIlJPT1RfTk9ERVMiLCJDSElMRF9DT05URVhUIiwiV1JBUFBJTkdfQ09NUE9ORU5UIiwiUFJJTUFSWV9XUkFQUEVSIiwiUk9PVF9GSU5ERVIiLCJQUk9WSURFUl9WQUxVRVMiLCJmaW5kV2hlcmVVbndyYXBwZWQiLCJ3cmFwcGVyIiwicHJlZGljYXRlIiwiZmlsdGVyIiwidHJlZUZpbHRlciIsImZsYXRNYXAiLCJuIiwiZ2V0Tm9kZUludGVybmFsIiwiZmlsdGVyV2hlcmVVbndyYXBwZWQiLCJ3cmFwIiwiZ2V0Tm9kZXNJbnRlcm5hbCIsIkJvb2xlYW4iLCJ2YWxpZGF0ZU9wdGlvbnMiLCJvcHRpb25zIiwibGlmZWN5Y2xlRXhwZXJpbWVudGFsIiwiZGlzYWJsZUxpZmVjeWNsZU1ldGhvZHMiLCJlbmFibGVDb21wb25lbnREaWRVcGRhdGVPblNldFN0YXRlIiwic3VwcG9ydFByZXZDb250ZXh0QXJndW1lbnRPZkNvbXBvbmVudERpZFVwZGF0ZSIsImxpZmVjeWNsZXMiLCJFcnJvciIsImNvbXBvbmVudERpZFVwZGF0ZSIsIm9uU2V0U3RhdGUiLCJUeXBlRXJyb3IiLCJwcmV2Q29udGV4dCIsImdldEFkYXB0ZXJMaWZlY3ljbGVzIiwiaGFzTGVnYWN5U2V0U3RhdGVBcmciLCJoYXNMZWdhY3lQcmV2Q29udGV4dEFyZyIsIm9yaWdpbmFsR0RTRlAiLCJnZXREZXJpdmVkU3RhdGVGcm9tUHJvcHMiLCJoYXNTaG91bGRDb21wb25lbnRVcGRhdGVCdWciLCJzZXRTdGF0ZSIsImdldENoaWxkQ29udGV4dCIsImNhbGxlZEJ5UmVuZGVyZXIiLCJnZXRSb290Tm9kZSIsIm5vZGUiLCJub2RlVHlwZSIsInJlbmRlcmVkIiwiZ2V0Um9vdE5vZGVJbnRlcm5hbCIsImxlbmd0aCIsIm5vZGVQYXJlbnRzIiwicHJpdmF0ZVNldE5vZGVzIiwibm9kZXMiLCJBcnJheSIsImlzQXJyYXkiLCJwdXJlQ29tcG9uZW50U2hvdWxkQ29tcG9uZW50VXBkYXRlIiwicHJldlByb3BzIiwicHJvcHMiLCJwcmV2U3RhdGUiLCJzdGF0ZSIsImlzUHVyZUNvbXBvbmVudCIsImluc3RhbmNlIiwiaXNQdXJlUmVhY3RDb21wb25lbnQiLCJoaWVyYXJjaHkiLCJyZW5kZXJlciIsIkNvbXBvbmVudCIsInR5cGUiLCJjb21wb25lbnROYW1lIiwiY2hpbGRDb250ZXh0VHlwZXMiLCJjb25zb2xlIiwid2FybiIsImNoaWxkQ29udGV4dCIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwia2V5IiwiY2hlY2tQcm9wVHlwZXMiLCJzcHlPbkdldENoaWxkQ29udGV4dEluaXRpYWxSZW5kZXIiLCJhZGFwdGVyIiwicHJvdG90eXBlIiwicHJpdmF0ZVNldENoaWxkQ29udGV4dCIsInJlbmRlcmVkTm9kZSIsImdldENoaWxkQ29udGV4dFNweSIsImxlZ2FjeUNvbnRleHRNb2RlIiwiZ2V0TGFzdFJldHVyblZhbHVlIiwicmVzdG9yZSIsIm5vZGVIaWVyYXJjaHkiLCJjb25jYXQiLCJtb2NrU0NVSWZnRFNGUFJldHVybk5vbk51bGwiLCJzaG91bGRDb21wb25lbnRVcGRhdGUiLCJhcmdzIiwic0NVUmVzdWx0Iiwib3JpZ2luYWxTQ1UiLCJhcHBseSIsIm5leHRTdGF0ZSIsImRlZXBSZW5kZXIiLCJ0YXJnZXQiLCJlbGVtZW50Iiwibm9kZVRvRWxlbWVudCIsImRpdmUiLCJjaGlsZHJlbiIsImkiLCJmb3VuZCIsImF0IiwidW5kZWZpbmVkIiwiZ2V0Q29udGV4dEZyb21XcmFwcGluZ0NvbXBvbmVudCIsInJvb3RGaW5kZXIiLCJsZWdhY3lDb250ZXh0IiwiY29udGV4dCIsInByb3ZpZGVyVmFsdWVzIiwibWFrZVNoYWxsb3dPcHRpb25zIiwicm9vdCIsInBhc3NlZE9wdGlvbnMiLCJ3cmFwcGluZ0NvbXBvbmVudCIsIndyYXBXaXRoV3JhcHBpbmdDb21wb25lbnQiLCJ3cmFwcGVkTm9kZSIsIlJvb3RGaW5kZXIiLCJXcmFwcGluZ0NvbXBvbmVudFdyYXBwZXIiLCJ3cmFwcGluZ0NvbXBvbmVudExlZ2FjeUNvbnRleHQiLCJ3cmFwcGluZ0NvbXBvbmVudFByb3ZpZGVyVmFsdWVzIiwiU2hhbGxvd1dyYXBwZXIiLCJpc1ZhbGlkRWxlbWVudCIsImNyZWF0ZVJlbmRlcmVyIiwibW9kZSIsIk1hcCIsInJlbmRlciIsImdldE5vZGUiLCJ1cGRhdGVyIiwiY2FsbGJhY2siLCJjb21wb25lbnREaWRNb3VudCIsImJhdGNoZWRVcGRhdGVzIiwidXBkYXRlIiwic2luZ2xlIiwibWFwIiwidW5tb3VudCIsIm5leHRDb250ZXh0Iiwic2hvdWxkUmVuZGVyIiwic2hvdWxkQ29tcG9uZW50VXBkYXRlU3B5IiwiZ0RTRlAiLCJnZXRTbmFwc2hvdEJlZm9yZVVwZGF0ZSIsInNuYXBzaG90IiwiZnJlZXplIiwiYXJndW1lbnRzIiwicmVyZW5kZXIiLCJzdGF0ZVBheWxvYWQiLCJjYWxsIiwibWF5YmVIYXNVcGRhdGUiLCJza2lwc0NvbXBvbmVudERpZFVwZGF0ZU9uTnVsbGlzaCIsImludm9rZVNldFN0YXRlQ2FsbGJhY2siLCJub2RlT3JOb2RlcyIsIm5vZGVFcXVhbCIsIm90aGVyIiwiZWxlbWVudFRvTm9kZSIsInJzdE5vZGUiLCJhIiwiYiIsImV2ZXJ5IiwiY29udGFpbnNNYXRjaGluZ0VsZW1lbnQiLCJzb21lIiwic2VsZWN0b3IiLCJnZXRUZXh0RnJvbU5vZGUiLCJjaGVlcmlvIiwibG9hZCIsImh0bWwiLCJldmVudCIsInNpbXVsYXRlRXZlbnQiLCJlcnJvciIsInRoaXNOb2RlIiwic2ltdWxhdGVFcnJvciIsInJvb3ROb2RlIiwicHJvcHNPZk5vZGUiLCJuYW1lIiwiX3N0YXRlIiwiX2NvbnRleHQiLCJhbGxDaGlsZHJlbiIsImluZGV4IiwiYWxsUGFyZW50cyIsInBhcmVudHMiLCJnZXQiLCJpcyIsIm1hdGNoaW5nQW5jZXN0b3JzIiwiZmlyc3QiLCJmaW5kV2hlcmUiLCJwcm9wTmFtZSIsImhhbmRsZXIiLCJwcm9wIiwicmVzcG9uc2UiLCJSYW5nZUVycm9yIiwicHJvcFZhbHVlIiwid3JhcHBlZCIsImRpc3BsYXlOYW1lT2ZOb2RlIiwiY2xhc3NOYW1lIiwiaW5kZXhPZiIsImZuIiwiaW5pdGlhbFZhbHVlIiwicmVkdWNlIiwiYWNjdW0iLCJyZWR1Y2VSaWdodCIsImJlZ2luIiwiZW5kIiwic2xpY2UiLCJmbGF0dGVuZWQiLCJnZXRFbGVtZW50cyIsImV4aXN0cyIsImZpbmQiLCJmbk5hbWUiLCJpbnRlcmNlcHRlciIsImVsIiwiY2hpbGRPcHRpb25zIiwiZmlsdGVyV2hlcmUiLCJ1cGRhdGVQcmltYXJ5Um9vdENvbnRleHQiLCJwcmltYXJ5V3JhcHBlciIsInByaW1hcnlSZW5kZXJlciIsInByaW1hcnlOb2RlIiwicHJldlByb3ZpZGVyVmFsdWVzIiwic2V0Q29udGV4dCIsImlzQ29udGV4dENvbnN1bWVyIiwiQ29uc3VtZXIiLCJQcm92aWRlciIsImdldFByb3ZpZGVyRnJvbUNvbnN1bWVyIiwibmV3VmFsdWUiLCJvbGRWYWx1ZSIsInJlc3VsdCIsIklURVJBVE9SX1NZTUJPTCIsImRlZmluZVByb3BlcnR5IiwiY29uZmlndXJhYmxlIiwidmFsdWUiLCJpdGVyYXRvciIsIml0ZXIiLCJuZXh0IiwiZG9uZSIsInByaXZhdGVXYXJuaW5nIiwiZXh0cmFNZXNzYWdlIiwiZW51bWVyYWJsZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQTs7QUFtQkE7Ozs7QUFDQTs7QUFDQTs7QUFRQTs7Ozs7Ozs7Ozs7Ozs7QUFFQSxJQUFNQSxPQUFPLGdCQUFJLFVBQUosQ0FBYjtBQUNBLElBQU1DLFFBQVEsZ0JBQUksV0FBSixDQUFkO0FBQ0EsSUFBTUMsV0FBVyxnQkFBSSxjQUFKLENBQWpCO0FBQ0EsSUFBTUMsYUFBYSxnQkFBSSxnQkFBSixDQUFuQjtBQUNBLElBQU1DLE9BQU8s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QUNrQzJKLElBRGxDLGdLQUdGK0MsWUFIRSxlQUFOO0FBS0Q7O0FBUG1EO0FBQUE7O0FBUXBEQyxnQkFBWSxLQVJ3QztBQVNwRFIsa0JBQWM7QUFUc0MsR0FBdEQ7QUFXRDs7QUFFRE0sZUFBZSxNQUFmLEVBQXVCLGlEQUF2QjtBQUNBQSxlQUFlLE9BQWYsRUFBd0Isa0RBQXhCO0FBQ0FBLGVBQWUsVUFBZixFQUEyQixFQUEzQjtBQUNBQSxlQUFlLFNBQWYsRUFBMEIsRUFBMUI7QUFDQUEsZUFBZSxpQkFBZixFQUFrQyxFQUFsQzs7cUJBRWUvRyxjIiwiZmlsZSI6IlNoYWxsb3dXcmFwcGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZsYXQgZnJvbSAnYXJyYXkucHJvdG90eXBlLmZsYXQnO1xuaW1wb3J0IGNoZWVyaW8gZnJvbSAnY2hlZXJpbyc7XG5pbXBvcnQgaGFzIGZyb20gJ2hhcyc7XG5cbmltcG9ydCB7XG4gIG5vZGVFcXVhbCxcbiAgbm9kZU1hdGNoZXMsXG4gIGNvbnRhaW5zQ2hpbGRyZW5TdWJBcnJheSxcbiAgd2l0aFNldFN0YXRlQWxsb3dlZCxcbiAgdHlwZU9mTm9kZSxcbiAgaXNSZWFjdEVsZW1lbnRBbGlrZSxcbiAgZGlzcGxheU5hbWVPZk5vZGUsXG4gIGlzQ3VzdG9tQ29tcG9uZW50LFxuICBpc0N1c3RvbUNvbXBvbmVudEVsZW1lbnQsXG4gIElURVJBVE9SX1NZTUJPTCxcbiAgbWFrZU9wdGlvbnMsXG4gIHN5bSxcbiAgcHJpdmF0ZVNldCxcbiAgY2xvbmVFbGVtZW50LFxuICBzcHlNZXRob2QsXG4gIHNoYWxsb3dFcXVhbCxcbiAgaXNFbXB0eVZhbHVlLFxufSBmcm9tICcuL1V0aWxzJztcbmltcG9ydCBnZXRBZGFwdGVyIGZyb20gJy4vZ2V0QWRhcHRlcic7XG5pbXBvcnQgeyBkZWJ1Z05vZGVzIH0gZnJvbSAnLi9EZWJ1Zyc7XG5pbXBvcnQge1xuICBwcm9wc09mTm9kZSxcbiAgZ2V0VGV4dEZyb21Ob2RlLFxuICBoYXNDbGFzc05hbWUsXG4gIGNoaWxkcmVuT2ZOb2RlLFxuICBwYXJlbnRzT2ZOb2RlLFxuICB0cmVlRmlsdGVyLFxufSBmcm9tICcuL1JTVFRyYXZlcnNhbCc7XG5pbXBvcnQgeyBidWlsZFByZWRpY2F0ZSwgcmVkdWNlVHJlZXNCeVNlbGVjdG9yIH0gZnJvbSAnLi9zZWxlY3RvcnMnO1xuXG5jb25zdCBOT0RFID0gc3ltKCdfX25vZGVfXycpO1xuY29uc3QgTk9ERVMgPSBzeW0oJ19fbm9kZXNfXycpO1xuY29uc3QgUkVOREVSRVIgPSBzeW0oJ19fcmVuZGVyZXJfXycpO1xuY29uc3QgVU5SRU5ERVJFRCA9IHN5bSgnX191bnJlbmRlcmVkX18nKTtcbmNvbnN0IFJPT1QgPSBzeW0oJ19fcm9vdF9fJyk7XG5jb25zdCBPUFRJT05TID0gc3ltKCdfX29wdGlvbnNfXycpO1xuY29uc3QgU0VUX1NUQVRFID0gc3ltKCdfX3NldFN0YXRlX18nKTtcbmNvbnN0IFJPT1RfTk9ERVMgPSBzeW0oJ19fcm9vdE5vZGVzX18nKTtcbmNvbnN0IENISUxEX0NPTlRFWFQgPSBzeW0oJ19fY2hpbGRDb250ZXh0X18nKTtcbmNvbnN0IFdSQVBQSU5HX0NPTVBPTkVOVCA9IHN5bSgnX193cmFwcGluZ0NvbXBvbmVudF9fJyk7XG5jb25zdCBQUklNQVJZX1dSQVBQRVIgPSBzeW0oJ19fcHJpbWFyeVdyYXBwZXJfXycpO1xuY29uc3QgUk9PVF9GSU5ERVIgPSBzeW0oJ19fcm9vdEZpbmRlcl9fJyk7XG5jb25zdCBQUk9WSURFUl9WQUxVRVMgPSBzeW0oJ19fcHJvdmlkZXJWYWx1ZXNfXycpO1xuXG4vKipcbiAqIEZpbmRzIGFsbCBub2RlcyBpbiB0aGUgY3VycmVudCB3cmFwcGVyIG5vZGVzJyByZW5kZXIgdHJlZXMgdGhhdCBtYXRjaCB0aGUgcHJvdmlkZWQgcHJlZGljYXRlXG4gKiBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0ge1NoYWxsb3dXcmFwcGVyfSB3cmFwcGVyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkaWNhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZpbHRlclxuICogQHJldHVybnMge1NoYWxsb3dXcmFwcGVyfVxuICovXG5mdW5jdGlvbiBmaW5kV2hlcmVVbndyYXBwZWQod3JhcHBlciwgcHJlZGljYXRlLCBmaWx0ZXIgPSB0cmVlRmlsdGVyKSB7XG4gIHJldHVybiB3cmFwcGVyLmZsYXRNYXAobiA9PiBmaWx0ZXIobi5nZXROb2RlSW50ZXJuYWwoKSwgcHJlZGljYXRlKSk7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIG5ldyB3cmFwcGVyIGluc3RhbmNlIHdpdGggb25seSB0aGUgbm9kZXMgb2YgdGhlIGN1cnJlbnQgd3JhcHBlciBpbnN0YW5jZSB0aGF0IG1hdGNoXG4gKiB0aGUgcHJvdmlkZWQgcHJlZGljYXRlIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7U2hhbGxvd1dyYXBwZXJ9IHdyYXBwZXJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWRpY2F0ZVxuICogQHJldHVybnMge1NoYWxsb3dXcmFwcGVyfVxuICovXG5mdW5jdGlvbiBmaWx0ZXJXaGVyZVVud3JhcHBlZCh3cmFwcGVyLCBwcmVkaWNhdGUpIHtcbiAgcmV0dXJuIHdyYXBwZXIud3JhcCh3cmFwcGVyLmdldE5vZGVzSW50ZXJuYWwoKS5maWx0ZXIocHJlZGljYXRlKS5maWx0ZXIoQm9vbGVhbikpO1xufVxuXG4vKipcbiAqIEVuc3VyZSBvcHRpb25zIHBhc3NlZCB0byBTaGFsbG93V3JhcHBlciBhcmUgdmFsaWQuIFRocm93cyBvdGhlcndpc2UuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICovXG5mdW5jdGlvbiB2YWxpZGF0ZU9wdGlvbnMob3B0aW9ucykge1xuICBjb25zdCB7XG4gICAgbGlmZWN5Y2xlRXhwZXJpbWVudGFsLFxuICAgIGRpc2FibGVMaWZlY3ljbGVNZXRob2RzLFxuICAgIGVuYWJsZUNvbXBvbmVudERpZFVwZGF0ZU9uU2V0U3RhdGUsXG4gICAgc3VwcG9ydFByZXZDb250ZXh0QXJndW1lbnRPZkNvbXBvbmVudERpZFVwZGF0ZSxcbiAgICBsaWZlY3ljbGVzLFxuICB9ID0gb3B0aW9ucztcbiAgaWYgKHR5cGVvZiBsaWZlY3ljbGVFeHBlcmltZW50YWwgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBsaWZlY3ljbGVFeHBlcmltZW50YWwgIT09ICdib29sZWFuJykge1xuICAgIHRocm93IG5ldyBFcnJvcignbGlmZWN5Y2xlRXhwZXJpbWVudGFsIG11c3QgYmUgZWl0aGVyIHRydWUgb3IgZmFsc2UgaWYgcHJvdmlkZWQnKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgZGlzYWJsZUxpZmVjeWNsZU1ldGhvZHMgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBkaXNhYmxlTGlmZWN5Y2xlTWV0aG9kcyAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdkaXNhYmxlTGlmZWN5Y2xlTWV0aG9kcyBtdXN0IGJlIGVpdGhlciB0cnVlIG9yIGZhbHNlIGlmIHByb3ZpZGVkJyk7XG4gIH1cblxuICBpZiAoXG4gICAgbGlmZWN5Y2xlRXhwZXJpbWVudGFsICE9IG51bGxcbiAgICAmJiBkaXNhYmxlTGlmZWN5Y2xlTWV0aG9kcyAhPSBudWxsXG4gICAgJiYgbGlmZWN5Y2xlRXhwZXJpbWVudGFsID09PSBkaXNhYmxlTGlmZWN5Y2xlTWV0aG9kc1xuICApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2xpZmVjeWNsZUV4cGVyaW1lbnRhbCBhbmQgZGlzYWJsZUxpZmVjeWNsZU1ldGhvZHMgY2Fubm90IGJlIHNldCB0byB0aGUgc2FtZSB2YWx1ZScpO1xuICB9XG5cbiAgaWYgKFxuICAgIHR5cGVvZiBlbmFibGVDb21wb25lbnREaWRVcGRhdGVPblNldFN0YXRlICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIGxpZmVjeWNsZXMuY29tcG9uZW50RGlkVXBkYXRlXG4gICAgJiYgbGlmZWN5Y2xlcy5jb21wb25lbnREaWRVcGRhdGUub25TZXRTdGF0ZSAhPT0gZW5hYmxlQ29tcG9uZW50RGlkVXBkYXRlT25TZXRTdGF0ZVxuICApIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCd0aGUgbGVnYWN5IGVuYWJsZUNvbXBvbmVudERpZFVwZGF0ZU9uU2V0U3RhdGUgb3B0aW9uIHNob3VsZCBiZSBtYXRjaGVkIGJ5IGBsaWZlY3ljbGVzOiB7IGNvbXBvbmVudERpZFVwZGF0ZTogeyBvblNldFN0YXRlOiB0cnVlIH0gfWAsIGZvciBjb21wYXRpYmlsaXR5Jyk7XG4gIH1cblxuICBpZiAoXG4gICAgdHlwZW9mIHN1cHBvcnRQcmV2Q29udGV4dEFyZ3VtZW50T2ZDb21wb25lbnREaWRVcGRhdGUgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgbGlmZWN5Y2xlcy5jb21wb25lbnREaWRVcGRhdGVcbiAgICAmJiBsaWZlY3ljbGVzLmNvbXBvbmVudERpZFVwZGF0ZS5wcmV2Q29udGV4dCAhPT0gc3VwcG9ydFByZXZDb250ZXh0QXJndW1lbnRPZkNvbXBvbmVudERpZFVwZGF0ZVxuICApIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCd0aGUgbGVnYWN5IHN1cHBvcnRQcmV2Q29udGV4dEFyZ3VtZW50T2ZDb21wb25lbnREaWRVcGRhdGUgb3B0aW9uIHNob3VsZCBiZSBtYXRjaGVkIGJ5IGBsaWZlY3ljbGVzOiB7IGNvbXBvbmVudERpZFVwZGF0ZTogeyBwcmV2Q29udGV4dDogdHJ1ZSB9IH1gLCBmb3IgY29tcGF0aWJpbGl0eScpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldEFkYXB0ZXJMaWZlY3ljbGVzKHsgb3B0aW9ucyB9KSB7XG4gIGNvbnN0IHtcbiAgICBsaWZlY3ljbGVzID0ge30sXG4gICAgZW5hYmxlQ29tcG9uZW50RGlkVXBkYXRlT25TZXRTdGF0ZSxcbiAgICBzdXBwb3J0UHJldkNvbnRleHRBcmd1bWVudE9mQ29tcG9uZW50RGlkVXBkYXRlLFxuICB9ID0gb3B0aW9ucztcblxuICBjb25zdCBoYXNMZWdhY3lTZXRTdGF0ZUFyZyA9IHR5cGVvZiBlbmFibGVDb21wb25lbnREaWRVcGRhdGVPblNldFN0YXRlICE9PSAndW5kZWZpbmVkJztcbiAgY29uc3QgaGFzTGVnYWN5UHJldkNvbnRleHRBcmcgPSB0eXBlb2Ygc3VwcG9ydFByZXZDb250ZXh0QXJndW1lbnRPZkNvbXBvbmVudERpZFVwZGF0ZSAhPT0gJ3VuZGVmaW5lZCc7XG4gIGNvbnN0IGNvbXBvbmVudERpZFVwZGF0ZSA9IGhhc0xlZ2FjeVNldFN0YXRlQXJnIHx8IGhhc0xlZ2FjeVByZXZDb250ZXh0QXJnXG4gICAgPyB7XG4gICAgICAuLi4oaGFzTGVnYWN5U2V0U3RhdGVBcmcgJiYge1xuICAgICAgICBvblNldFN0YXRlOiAhIWVuYWJsZUNvbXBvbmVudERpZFVwZGF0ZU9uU2V0U3RhdGUsXG4gICAgICB9KSxcbiAgICAgIC4uLihoYXNMZWdhY3lQcmV2Q29udGV4dEFyZyAmJiB7XG4gICAgICAgIHByZXZDb250ZXh0OiAhIXN1cHBvcnRQcmV2Q29udGV4dEFyZ3VtZW50T2ZDb21wb25lbnREaWRVcGRhdGUsXG4gICAgICB9KSxcbiAgICB9XG4gICAgOiBudWxsO1xuICBjb25zdCB7IGdldERlcml2ZWRTdGF0ZUZyb21Qcm9wczogb3JpZ2luYWxHRFNGUCB9ID0gbGlmZWN5Y2xlcztcbiAgY29uc3QgZ2V0RGVyaXZlZFN0YXRlRnJvbVByb3BzID0gb3JpZ2luYWxHRFNGUCA/IHtcbiAgICBoYXNTaG91bGRDb21wb25lbnRVcGRhdGVCdWc6ICEhb3JpZ2luYWxHRFNGUC5oYXNTaG91bGRDb21wb25lbnRVcGRhdGVCdWcsXG4gIH0gOiBmYWxzZTtcblxuICByZXR1cm4ge1xuICAgIC4uLmxpZmVjeWNsZXMsXG4gICAgc2V0U3RhdGU6IHtcbiAgICAgIC4uLmxpZmVjeWNsZXMuc2V0U3RhdGUsXG4gICAgfSxcbiAgICBnZXRDaGlsZENvbnRleHQ6IHtcbiAgICAgIGNhbGxlZEJ5UmVuZGVyZXI6IHRydWUsXG4gICAgICAuLi5saWZlY3ljbGVzLmdldENoaWxkQ29udGV4dCxcbiAgICB9LFxuICAgIC4uLihjb21wb25lbnREaWRVcGRhdGUgJiYgeyBjb21wb25lbnREaWRVcGRhdGUgfSksXG4gICAgZ2V0RGVyaXZlZFN0YXRlRnJvbVByb3BzLFxuICB9O1xufVxuXG5mdW5jdGlvbiBnZXRSb290Tm9kZShub2RlKSB7XG4gIGlmIChub2RlLm5vZGVUeXBlID09PSAnaG9zdCcpIHtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuICByZXR1cm4gbm9kZS5yZW5kZXJlZDtcbn1cblxuZnVuY3Rpb24gZ2V0Um9vdE5vZGVJbnRlcm5hbCh3cmFwcGVyKSB7XG4gIGlmICh3cmFwcGVyW1JPT1RdLmxlbmd0aCAhPT0gMSkge1xuICAgIHRocm93IG5ldyBFcnJvcignZ2V0Um9vdE5vZGVJbnRlcm5hbCh3cmFwcGVyKSBjYW4gb25seSBiZSBjYWxsZWQgd2hlbiB3cmFwcGVyIHdyYXBzIG9uZSBub2RlJyk7XG4gIH1cbiAgaWYgKHdyYXBwZXJbUk9PVF0gIT09IHdyYXBwZXIpIHtcbiAgICByZXR1cm4gd3JhcHBlcltST09UX05PREVTXVswXTtcbiAgfVxuICByZXR1cm4gd3JhcHBlcltST09UXVtOT0RFXTtcbn1cblxuZnVuY3Rpb24gbm9kZVBhcmVudHMod3JhcHBlciwgbm9kZSkge1xuICByZXR1cm4gcGFyZW50c09mTm9kZShub2RlLCBnZXRSb290Tm9kZUludGVybmFsKHdyYXBwZXIpKTtcbn1cblxuZnVuY3Rpb24gcHJpdmF0ZVNldE5vZGVzKHdyYXBwZXIsIG5vZGVzKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShub2RlcykpIHtcbiAgICBwcml2YXRlU2V0KHdyYXBwZXIsIE5PREUsIG5vZGVzKTtcbiAgICBwcml2YXRlU2V0KHdyYXBwZXIsIE5PREVTLCBbbm9kZXNdKTtcbiAgfSBlbHNlIHtcbiAgICBwcml2YXRlU2V0KHdyYXBwZXIsIE5PREUsIG5vZGVzWzBdKTtcbiAgICBwcml2YXRlU2V0KHdyYXBwZXIsIE5PREVTLCBub2Rlcyk7XG4gIH1cbiAgcHJpdmF0ZVNldCh3cmFwcGVyLCAnbGVuZ3RoJywgd3JhcHBlcltOT0RFU10ubGVuZ3RoKTtcbn1cblxuZnVuY3Rpb24gcHVyZUNvbXBvbmVudFNob3VsZENvbXBvbmVudFVwZGF0ZShwcmV2UHJvcHMsIHByb3BzLCBwcmV2U3RhdGUsIHN0YXRlKSB7XG4gIHJldHVybiAhc2hhbGxvd0VxdWFsKHByZXZQcm9wcywgcHJvcHMpIHx8ICFzaGFsbG93RXF1YWwocHJldlN0YXRlLCBzdGF0ZSk7XG59XG5cbmZ1bmN0aW9uIGlzUHVyZUNvbXBvbmVudChpbnN0YW5jZSkge1xuICByZXR1cm4gaW5zdGFuY2UgJiYgaW5zdGFuY2UuaXNQdXJlUmVhY3RDb21wb25lbnQ7XG59XG5cbmZ1bmN0aW9uIGdldENoaWxkQ29udGV4dChub2RlLCBoaWVyYXJjaHksIHJlbmRlcmVyKSB7XG4gIGNvbnN0IHsgaW5zdGFuY2UsIHR5cGU6IENvbXBvbmVudCB9ID0gbm9kZTtcbiAgY29uc3QgY29tcG9uZW50TmFtZSA9IGRpc3BsYXlOYW1lT2ZOb2RlKG5vZGUpO1xuICAvLyBXYXJuIGxpa2UgcmVhY3QgaWYgY2hpbGRDb250ZXh0VHlwZXMgaXMgbm90IGRlZmluZWQ6XG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9ibG9iLzE0NTRhOGJlMDM3OTRmNWUwYjIzYTdlNzY5NmNiYmJkY2Y4YjBmNWQvcGFja2FnZXMvcmVhY3QtZG9tL3NyYy9zZXJ2ZXIvUmVhY3RQYXJ0aWFsUmVuZGVyZXIuanMjTDYzOS1MNjQ2XG4gIGlmICh0eXBlb2YgQ29tcG9uZW50LmNoaWxkQ29udGV4dFR5cGVzICE9PSAnb2JqZWN0Jykge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS53YXJuKFxuICAgICAgYCR7Y29tcG9uZW50TmFtZX0uZ2V0Q2hpbGRDb250ZXh0KCk6IGNoaWxkQ29udGV4dFR5cGVzIG11c3QgYmUgZGVmaW5lZCBpbiBvcmRlciB0byB1c2UgZ2V0Q2hpbGRDb250ZXh0KCkuYCxcbiAgICApO1xuICAgIHJldHVybiB7fTtcbiAgfVxuICAvLyBDaGVjayBjaGlsZENvbnRleHRUeXBlcyBsaWtlIHJlYWN0OlxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvYmxvYi8xNDU0YThiZTAzNzk0ZjVlMGIyM2E3ZTc2OTZjYmJiZGNmOGIwZjVkL3BhY2thZ2VzL3JlYWN0LWRvbS9zcmMvc2VydmVyL1JlYWN0UGFydGlhbFJlbmRlcmVyLmpzI0w2MzAtTDYzN1xuICBjb25zdCBjaGlsZENvbnRleHQgPSBpbnN0YW5jZS5nZXRDaGlsZENvbnRleHQoKTtcbiAgT2JqZWN0LmtleXMoY2hpbGRDb250ZXh0KS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICBpZiAoIShrZXkgaW4gQ29tcG9uZW50LmNoaWxkQ29udGV4dFR5cGVzKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgJHtjb21wb25lbnROYW1lfS5nZXRDaGlsZENvbnRleHQoKToga2V5IFwiJHtrZXl9XCIgaXMgbm90IGRlZmluZWQgaW4gY2hpbGRDb250ZXh0VHlwZXMuYCxcbiAgICAgICk7XG4gICAgfVxuICB9KTtcbiAgaWYgKHR5cGVvZiByZW5kZXJlci5jaGVja1Byb3BUeXBlcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJlbmRlcmVyLmNoZWNrUHJvcFR5cGVzKENvbXBvbmVudC5jaGlsZENvbnRleHRUeXBlcywgY2hpbGRDb250ZXh0LCAnY2hpbGQgY29udGV4dCcsIGhpZXJhcmNoeSk7XG4gIH1cbiAgcmV0dXJuIGNoaWxkQ29udGV4dDtcbn1cblxuZnVuY3Rpb24gc3B5T25HZXRDaGlsZENvbnRleHRJbml0aWFsUmVuZGVyKG5vZGVzLCBhZGFwdGVyKSB7XG4gIGlmIChcbiAgICAhaXNDdXN0b21Db21wb25lbnRFbGVtZW50KG5vZGVzLCBhZGFwdGVyKVxuICAgIHx8ICFub2Rlcy50eXBlLnByb3RvdHlwZVxuICAgIHx8IHR5cGVvZiBub2Rlcy50eXBlLnByb3RvdHlwZS5nZXRDaGlsZENvbnRleHQgIT09ICdmdW5jdGlvbidcbiAgKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gc3B5TWV0aG9kKG5vZGVzLnR5cGUucHJvdG90eXBlLCAnZ2V0Q2hpbGRDb250ZXh0Jyk7XG59XG5cbmZ1bmN0aW9uIHByaXZhdGVTZXRDaGlsZENvbnRleHQoYWRhcHRlciwgd3JhcHBlciwgaW5zdGFuY2UsIHJlbmRlcmVkTm9kZSwgZ2V0Q2hpbGRDb250ZXh0U3B5KSB7XG4gIGNvbnN0IHJlbmRlcmVyID0gd3JhcHBlcltSRU5ERVJFUl07XG4gIC8vIFdlIG9ubHkgc3VwcG9ydCBwYXJlbnQtYmFzZWQgY29udGV4dC5cbiAgaWYgKGFkYXB0ZXIub3B0aW9ucy5sZWdhY3lDb250ZXh0TW9kZSAhPT0gJ3BhcmVudCcpIHsgcmV0dXJuOyB9XG4gIGlmIChnZXRDaGlsZENvbnRleHRTcHkpIHtcbiAgICBwcml2YXRlU2V0KHdyYXBwZXIsIENISUxEX0NPTlRFWFQsIGdldENoaWxkQ29udGV4dFNweS5nZXRMYXN0UmV0dXJuVmFsdWUoKSk7XG4gICAgZ2V0Q2hpbGRDb250ZXh0U3B5LnJlc3RvcmUoKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgaW5zdGFuY2UuZ2V0Q2hpbGRDb250ZXh0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gSWYgdGhlcmUncyBubyBzcHkgYnV0IGdldENoaWxkQ29udGV4dCBpcyBhIGZ1bmN0aW9uLCB0aGF0IG1lYW5zIG91ciByZW5kZXJlclxuICAgIC8vIGlzIG5vdCBnb2luZyB0byBjYWxsIGl0IGZvciB1cywgc28gd2UgbmVlZCB0byBjYWxsIGl0IG91cnNlbHZlcy5cbiAgICBjb25zdCBub2RlSGllcmFyY2h5ID0gW3dyYXBwZXJbTk9ERV1dLmNvbmNhdChub2RlUGFyZW50cyh3cmFwcGVyLCB3cmFwcGVyW05PREVdKSk7XG4gICAgY29uc3QgY2hpbGRDb250ZXh0ID0gZ2V0Q2hpbGRDb250ZXh0KHJlbmRlcmVkTm9kZSwgbm9kZUhpZXJhcmNoeSwgcmVuZGVyZXIpO1xuICAgIHByaXZhdGVTZXQod3JhcHBlciwgQ0hJTERfQ09OVEVYVCwgY2hpbGRDb250ZXh0KTtcbiAgfSBlbHNlIHtcbiAgICBwcml2YXRlU2V0KHdyYXBwZXIsIENISUxEX0NPTlRFWFQsIG51bGwpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1vY2tTQ1VJZmdEU0ZQUmV0dXJuTm9uTnVsbChub2RlLCBzdGF0ZSkge1xuICBjb25zdCB7IGdldERlcml2ZWRTdGF0ZUZyb21Qcm9wcyB9ID0gbm9kZS50eXBlO1xuXG4gIGlmICh0eXBlb2YgZ2V0RGVyaXZlZFN0YXRlRnJvbVByb3BzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gd2UgdHJ5IHRvIGZpeCBhIFJlYWN0IHNoYWxsb3cgcmVuZGVyZXIgYnVnIGhlcmUuXG4gICAgLy8gKGZhY2Vib29rL3JlYWN0IzE0NjA3LCB3aGljaCBoYXMgYmVlbiBmaXhlZCBpbiByZWFjdCAxNi44KTpcbiAgICAvLyB3aGVuIGdEU0ZQIHJldHVybiBkZXJpdmVkIHN0YXRlLCBpdCB3aWxsIHNldCBpbnN0YW5jZSBzdGF0ZSBpbiBzaGFsbG93IHJlbmRlcmVyIGJlZm9yZSBTQ1UsXG4gICAgLy8gdGhpcyB3aWxsIGNhdXNlIGB0aGlzLnN0YXRlYCBpbiBzQ1UgYmUgdGhlIHVwZGF0ZWQgc3RhdGUsIHdoaWNoIGlzIHdyb25nIGJlaGF2aW9yLlxuICAgIC8vIHNvIHdlIGhhdmUgdG8gd3JhcCBzQ1UgdG8gcGFzcyB0aGUgb2xkIHN0YXRlIHRvIG9yaWdpbmFsIHNDVS5cbiAgICBjb25zdCB7IGluc3RhbmNlIH0gPSBub2RlO1xuICAgIGNvbnN0IHsgcmVzdG9yZSB9ID0gc3B5TWV0aG9kKFxuICAgICAgaW5zdGFuY2UsXG4gICAgICAnc2hvdWxkQ29tcG9uZW50VXBkYXRlJyxcbiAgICAgIG9yaWdpbmFsU0NVID0+IGZ1bmN0aW9uIHNob3VsZENvbXBvbmVudFVwZGF0ZSguLi5hcmdzKSB7XG4gICAgICAgIGluc3RhbmNlLnN0YXRlID0gc3RhdGU7XG4gICAgICAgIGNvbnN0IHNDVVJlc3VsdCA9IG9yaWdpbmFsU0NVLmFwcGx5KGluc3RhbmNlLCBhcmdzKTtcbiAgICAgICAgY29uc3QgWywgbmV4dFN0YXRlXSA9IGFyZ3M7XG4gICAgICAgIGluc3RhbmNlLnN0YXRlID0gbmV4dFN0YXRlO1xuICAgICAgICByZXN0b3JlKCk7XG4gICAgICAgIHJldHVybiBzQ1VSZXN1bHQ7XG4gICAgICB9LFxuICAgICk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZWN1cnNpdmVseSBkaXZlKClzIGV2ZXJ5IGN1c3RvbSBjb21wb25lbnQgaW4gYSB3cmFwcGVyIHVudGlsXG4gKiB0aGUgdGFyZ2V0IGNvbXBvbmVudCBpcyBmb3VuZC5cbiAqXG4gKiBAcGFyYW0ge1NoYWxsb3dXcmFwcGVyfSB3cmFwcGVyIEEgU2hhbGxvd1dyYXBwZXIgdG8gc2VhcmNoXG4gKiBAcGFyYW0ge0NvbXBvbmVudFR5cGV9IHRhcmdldCBBIHJlYWN0IGN1c3RvbSBjb21wb25lbnQgdGhhdCwgd2hlbiBmb3VuZCwgd2lsbCBlbmQgcmVjdXJzaW9uXG4gKiBAcGFyYW0ge0FkYXB0ZXJ9IGFkYXB0ZXIgQW4gRW56eW1lIGFkYXB0ZXJcbiAqIEByZXR1cm5zIHtTaGFsbG93V3JhcHBlcnx1bmRlZmluZWR9IEEgU2hhbGxvd1dyYXBwZXIgZm9yIHRoZSB0YXJnZXQsIG9yXG4gKiAgdW5kZWZpbmVkIGlmIGl0IGNhbid0IGJlIGZvdW5kXG4gKi9cbmZ1bmN0aW9uIGRlZXBSZW5kZXIod3JhcHBlciwgdGFyZ2V0LCBhZGFwdGVyKSB7XG4gIGNvbnN0IG5vZGUgPSB3cmFwcGVyW05PREVdO1xuICBjb25zdCBlbGVtZW50ID0gbm9kZSAmJiBhZGFwdGVyLm5vZGVUb0VsZW1lbnQobm9kZSk7XG4gIGlmICh3cmFwcGVyLnR5cGUoKSA9PT0gdGFyZ2V0KSB7XG4gICAgcmV0dXJuIHdyYXBwZXIuZGl2ZSgpO1xuICB9XG4gIGlmIChlbGVtZW50ICYmIGlzQ3VzdG9tQ29tcG9uZW50RWxlbWVudChlbGVtZW50LCBhZGFwdGVyKSkge1xuICAgIHJldHVybiBkZWVwUmVuZGVyKHdyYXBwZXIuZGl2ZSgpLCB0YXJnZXQsIGFkYXB0ZXIpO1xuICB9XG4gIGNvbnN0IGNoaWxkcmVuID0gd3JhcHBlci5jaGlsZHJlbigpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgY29uc3QgZm91bmQgPSBkZWVwUmVuZGVyKGNoaWxkcmVuLmF0KGkpLCB0YXJnZXQsIGFkYXB0ZXIpO1xuICAgIGlmICh0eXBlb2YgZm91bmQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gZm91bmQ7XG4gICAgfVxuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogRGVlcC1yZW5kZXJzIHRoZSBgd3JhcHBpbmdDb21wb25lbnRgIGFuZCByZXR1cm5zIHRoZSBjb250ZXh0IHRoYXQgc2hvdWxkXG4gKiBiZSBhY2Nlc3NpYmxlIHRvIHRoZSBwcmltYXJ5IHdyYXBwZXIuXG4gKlxuICogQHBhcmFtIHtXcmFwcGluZ0NvbXBvbmVudFdyYXBwZXJ9IHdyYXBwZXIgVGhlIGBXcmFwcGluZ0NvbXBvbmVudFdyYXBwZXJgIGZvciBhXG4gKiAgYHdyYXBwaW5nQ29tcG9uZW50YFxuICogQHBhcmFtIHtBZGFwdGVyfSBhZGFwdGVyIEFuIEVuenltZSBhZGFwdGVyXG4gKiBAcmV0dXJucyB7b2JqZWN0fSBBbiBvYmplY3QgY29udGFpbmluZyBhbiBvYmplY3Qgb2YgbGVnYWN5IGNvbnRleHQgdmFsdWVzIGFuZCBhIE1hcCBvZlxuICogIGBjcmVhdGVDb250ZXh0KClgIFByb3ZpZGVyIHZhbHVlcy5cbiAqL1xuZnVuY3Rpb24gZ2V0Q29udGV4dEZyb21XcmFwcGluZ0NvbXBvbmVudCh3cmFwcGVyLCBhZGFwdGVyKSB7XG4gIGNvbnN0IHJvb3RGaW5kZXIgPSBkZWVwUmVuZGVyKHdyYXBwZXIsIHdyYXBwZXJbUk9PVF9GSU5ERVJdLCBhZGFwdGVyKTtcbiAgaWYgKCFyb290RmluZGVyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdgd3JhcHBpbmdDb21wb25lbnRgIG11c3QgcmVuZGVyIGl0cyBjaGlsZHJlbiEnKTtcbiAgfVxuICByZXR1cm4ge1xuICAgIGxlZ2FjeUNvbnRleHQ6IHJvb3RGaW5kZXJbT1BUSU9OU10uY29udGV4dCxcbiAgICBwcm92aWRlclZhbHVlczogcm9vdEZpbmRlcltQUk9WSURFUl9WQUxVRVNdLFxuICB9O1xufVxuXG4vKipcbiAqIE1ha2VzIG9wdGlvbnMgc3BlY2lmaWNhbGx5IGZvciBgU2hhbGxvd1dyYXBwZXJgLiBNb3N0IG9mIHRoZSBsb2dpYyBoZXJlIGlzIGFyb3VuZCByZW5kZXJpbmdcbiAqIGEgYHdyYXBwaW5nQ29tcG9uZW50YCAoaWYgb25lIHdhcyBwcm92aWRlZCkgYW5kIGFkZGluZyB0aGUgY2hpbGQgY29udGV4dCBvZiB0aGF0IGNvbXBvbmVudFxuICogdG8gYG9wdGlvbnMuY29udGV4dGAuXG4gKlxuICogQHBhcmFtIHtSZWFjdEVsZW1lbnR9IG5vZGVzIHRoZSBub2RlcyBwYXNzZWQgdG8gYFNoYWxsb3dXcmFwcGVyYFxuICogQHBhcmFtIHtTaGFsbG93V3JhcHBlcn0gcm9vdCB0aGlzIGBTaGFsbG93V3JhcHBlcmAncyBwYXJlbnQuIElmIHRoaXMgaXMgcGFzc2VkLCBvcHRpb25zIGFyZVxuICogIG5vdCB0cmFuc2Zvcm1lZC5cbiAqIEBwYXJhbSB7Kn0gcGFzc2VkT3B0aW9ucyB0aGUgb3B0aW9ucyBwYXNzZWQgdG8gYFNoYWxsb3dXcmFwcGVyYC5cbiAqIEBwYXJhbSB7Kn0gd3JhcHBlciB0aGUgYFNoYWxsb3dXcmFwcGVyYCBpdHNlbGZcbiAqIEByZXR1cm5zIHtPYmplY3R9IHRoZSBkZWNvcmF0ZWQgYW5kIHRyYW5zZm9ybWVkIG9wdGlvbnNcbiAqL1xuZnVuY3Rpb24gbWFrZVNoYWxsb3dPcHRpb25zKG5vZGVzLCByb290LCBwYXNzZWRPcHRpb25zLCB3cmFwcGVyKSB7XG4gIGNvbnN0IG9wdGlvbnMgPSBtYWtlT3B0aW9ucyhwYXNzZWRPcHRpb25zKTtcbiAgY29uc3QgYWRhcHRlciA9IGdldEFkYXB0ZXIocGFzc2VkT3B0aW9ucyk7XG4gIHByaXZhdGVTZXQob3B0aW9ucywgUFJPVklERVJfVkFMVUVTLCBwYXNzZWRPcHRpb25zW1BST1ZJREVSX1ZBTFVFU10pO1xuICBpZiAocm9vdCB8fCAhaXNDdXN0b21Db21wb25lbnQob3B0aW9ucy53cmFwcGluZ0NvbXBvbmVudCwgYWRhcHRlcikpIHtcbiAgICByZXR1cm4gb3B0aW9ucztcbiAgfVxuICBpZiAodHlwZW9mIGFkYXB0ZXIud3JhcFdpdGhXcmFwcGluZ0NvbXBvbmVudCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3lvdXIgYWRhcHRlciBkb2VzIG5vdCBzdXBwb3J0IGB3cmFwcGluZ0NvbXBvbmVudGAuIFRyeSB1cGdyYWRpbmcgaXQhJyk7XG4gIH1cbiAgY29uc3QgeyBub2RlOiB3cmFwcGVkTm9kZSwgUm9vdEZpbmRlciB9ID0gYWRhcHRlci53cmFwV2l0aFdyYXBwaW5nQ29tcG9uZW50KG5vZGVzLCBvcHRpb25zKTtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVzZS1iZWZvcmUtZGVmaW5lXG4gIGNvbnN0IHdyYXBwaW5nQ29tcG9uZW50ID0gbmV3IFdyYXBwaW5nQ29tcG9uZW50V3JhcHBlcih3cmFwcGVkTm9kZSwgd3JhcHBlciwgUm9vdEZpbmRlcik7XG4gIGNvbnN0IHtcbiAgICBsZWdhY3lDb250ZXh0OiB3cmFwcGluZ0NvbXBvbmVudExlZ2FjeUNvbnRleHQsXG4gICAgcHJvdmlkZXJWYWx1ZXM6IHdyYXBwaW5nQ29tcG9uZW50UHJvdmlkZXJWYWx1ZXMsXG4gIH0gPSBnZXRDb250ZXh0RnJvbVdyYXBwaW5nQ29tcG9uZW50KHdyYXBwaW5nQ29tcG9uZW50LCBhZGFwdGVyKTtcbiAgcHJpdmF0ZVNldCh3cmFwcGVyLCBXUkFQUElOR19DT01QT05FTlQsIHdyYXBwaW5nQ29tcG9uZW50KTtcbiAgcmV0dXJuIHtcbiAgICAuLi5vcHRpb25zLFxuICAgIGNvbnRleHQ6IHtcbiAgICAgIC4uLm9wdGlvbnMuY29udGV4dCxcbiAgICAgIC4uLndyYXBwaW5nQ29tcG9uZW50TGVnYWN5Q29udGV4dCxcbiAgICB9LFxuICAgIFtQUk9WSURFUl9WQUxVRVNdOiB3cmFwcGluZ0NvbXBvbmVudFByb3ZpZGVyVmFsdWVzLFxuICB9O1xufVxuXG5cbi8qKlxuICogQGNsYXNzIFNoYWxsb3dXcmFwcGVyXG4gKi9cbmNsYXNzIFNoYWxsb3dXcmFwcGVyIHtcbiAgY29uc3RydWN0b3Iobm9kZXMsIHJvb3QsIHBhc3NlZE9wdGlvbnMgPSB7fSkge1xuICAgIHZhbGlkYXRlT3B0aW9ucyhwYXNzZWRPcHRpb25zKTtcblxuICAgIGNvbnN0IG9wdGlvbnMgPSBtYWtlU2hhbGxvd09wdGlvbnMobm9kZXMsIHJvb3QsIHBhc3NlZE9wdGlvbnMsIHRoaXMpO1xuICAgIGNvbnN0IGFkYXB0ZXIgPSBnZXRBZGFwdGVyKG9wdGlvbnMpO1xuICAgIGNvbnN0IGxpZmVjeWNsZXMgPSBnZXRBZGFwdGVyTGlmZWN5Y2xlcyhhZGFwdGVyKTtcblxuICAgIC8vIG1vdW50aW5nIGEgU2hhbGxvd1JlbmRlciBjb21wb25lbnRcbiAgICBpZiAoIXJvb3QpIHtcbiAgICAgIGlmICghYWRhcHRlci5pc1ZhbGlkRWxlbWVudChub2RlcykpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignU2hhbGxvd1dyYXBwZXIgY2FuIG9ubHkgd3JhcCB2YWxpZCBlbGVtZW50cycpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBnZXRDaGlsZENvbnRleHRTcHkgPSBsaWZlY3ljbGVzLmdldENoaWxkQ29udGV4dC5jYWxsZWRCeVJlbmRlcmVyXG4gICAgICAgID8gc3B5T25HZXRDaGlsZENvbnRleHRJbml0aWFsUmVuZGVyKG5vZGVzLCBhZGFwdGVyKVxuICAgICAgICA6IG51bGw7XG4gICAgICBwcml2YXRlU2V0KHRoaXMsIFJPT1QsIHRoaXMpO1xuICAgICAgcHJpdmF0ZVNldCh0aGlzLCBVTlJFTkRFUkVELCBub2Rlcyk7XG4gICAgICBjb25zdCByZW5kZXJlciA9IGFkYXB0ZXIuY3JlYXRlUmVuZGVyZXIoeyBtb2RlOiAnc2hhbGxvdycsIC4uLm9wdGlvbnMgfSk7XG4gICAgICBwcml2YXRlU2V0KHRoaXMsIFJFTkRFUkVSLCByZW5kZXJlcik7XG4gICAgICBjb25zdCBwcm92aWRlclZhbHVlcyA9IG5ldyBNYXAob3B0aW9uc1tQUk9WSURFUl9WQUxVRVNdIHx8IFtdKTtcbiAgICAgIHRoaXNbUkVOREVSRVJdLnJlbmRlcihub2Rlcywgb3B0aW9ucy5jb250ZXh0LCB7IHByb3ZpZGVyVmFsdWVzIH0pO1xuICAgICAgY29uc3QgcmVuZGVyZWROb2RlID0gdGhpc1tSRU5ERVJFUl0uZ2V0Tm9kZSgpO1xuICAgICAgcHJpdmF0ZVNldE5vZGVzKHRoaXMsIGdldFJvb3ROb2RlKHJlbmRlcmVkTm9kZSkpO1xuICAgICAgcHJpdmF0ZVNldCh0aGlzLCBPUFRJT05TLCBvcHRpb25zKTtcbiAgICAgIHByaXZhdGVTZXQodGhpcywgUFJPVklERVJfVkFMVUVTLCBwcm92aWRlclZhbHVlcyk7XG5cbiAgICAgIGNvbnN0IHsgaW5zdGFuY2UgfSA9IHJlbmRlcmVkTm9kZTtcbiAgICAgIGlmIChpbnN0YW5jZSAmJiAhb3B0aW9ucy5kaXNhYmxlTGlmZWN5Y2xlTWV0aG9kcykge1xuICAgICAgICAvLyBFbnN1cmUgdG8gY2FsbCBjb21wb25lbnREaWRVcGRhdGUgd2hlbiBpbnN0YW5jZS5zZXRTdGF0ZSBpcyBjYWxsZWRcbiAgICAgICAgaWYgKGxpZmVjeWNsZXMuY29tcG9uZW50RGlkVXBkYXRlLm9uU2V0U3RhdGUgJiYgIWluc3RhbmNlW1NFVF9TVEFURV0pIHtcbiAgICAgICAgICBwcml2YXRlU2V0KGluc3RhbmNlLCBTRVRfU1RBVEUsIGluc3RhbmNlLnNldFN0YXRlKTtcbiAgICAgICAgICBpbnN0YW5jZS5zZXRTdGF0ZSA9ICh1cGRhdGVyLCBjYWxsYmFjayA9IHVuZGVmaW5lZCkgPT4gdGhpcy5zZXRTdGF0ZShcbiAgICAgICAgICAgIC4uLihjYWxsYmFjayA9PSBudWxsID8gW3VwZGF0ZXJdIDogW3VwZGF0ZXIsIGNhbGxiYWNrXSksXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgaW5zdGFuY2UuY29tcG9uZW50RGlkTW91bnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICB0aGlzW1JFTkRFUkVSXS5iYXRjaGVkVXBkYXRlcygoKSA9PiB7XG4gICAgICAgICAgICBpbnN0YW5jZS5jb21wb25lbnREaWRNb3VudCgpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHByaXZhdGVTZXRDaGlsZENvbnRleHQoYWRhcHRlciwgdGhpcywgaW5zdGFuY2UsIHJlbmRlcmVkTm9kZSwgZ2V0Q2hpbGRDb250ZXh0U3B5KTtcbiAgICAgIH1cbiAgICAvLyBjcmVhdGluZyBhIGNoaWxkIGNvbXBvbmVudCB0aHJvdWdoIGVuenltZSdzIFNoYWxsb3dXcmFwcGVyIEFQSXMuXG4gICAgfSBlbHNlIHtcbiAgICAgIHByaXZhdGVTZXQodGhpcywgUk9PVCwgcm9vdCk7XG4gICAgICBwcml2YXRlU2V0KHRoaXMsIFVOUkVOREVSRUQsIG51bGwpO1xuICAgICAgcHJpdmF0ZVNldCh0aGlzLCBSRU5ERVJFUiwgcm9vdFtSRU5ERVJFUl0pO1xuICAgICAgcHJpdmF0ZVNldE5vZGVzKHRoaXMsIG5vZGVzKTtcbiAgICAgIHByaXZhdGVTZXQodGhpcywgT1BUSU9OUywgcm9vdFtPUFRJT05TXSk7XG4gICAgICBwcml2YXRlU2V0KHRoaXMsIFJPT1RfTk9ERVMsIHJvb3RbTk9ERVNdKTtcbiAgICAgIHByaXZhdGVTZXQodGhpcywgUFJPVklERVJfVkFMVUVTLCBudWxsKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcm9vdCB3cmFwcGVyXG4gICAqXG4gICAqIEByZXR1cm4ge1NoYWxsb3dXcmFwcGVyfVxuICAgKi9cbiAgcm9vdCgpIHtcbiAgICByZXR1cm4gdGhpc1tST09UXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB3cmFwcGVkIGNvbXBvbmVudC5cbiAgICpcbiAgICogQHJldHVybiB7UmVhY3RDb21wb25lbnR9XG4gICAqL1xuICBnZXROb2RlSW50ZXJuYWwoKSB7XG4gICAgaWYgKHRoaXMubGVuZ3RoICE9PSAxKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NoYWxsb3dXcmFwcGVyOjpnZXROb2RlKCkgY2FuIG9ubHkgYmUgY2FsbGVkIHdoZW4gd3JhcHBpbmcgb25lIG5vZGUnKTtcbiAgICB9XG4gICAgaWYgKHRoaXNbUk9PVF0gPT09IHRoaXMpIHtcbiAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzW05PREVdO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHRoZSB3cmFwcGVkIGNvbXBvbmVudHMuXG4gICAqXG4gICAqIEByZXR1cm4ge0FycmF5PFJlYWN0Q29tcG9uZW50Pn1cbiAgICovXG4gIGdldE5vZGVzSW50ZXJuYWwoKSB7XG4gICAgaWYgKHRoaXNbUk9PVF0gPT09IHRoaXMgJiYgdGhpcy5sZW5ndGggPT09IDEpIHtcbiAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzW05PREVTXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB3cmFwcGVkIFJlYWN0RWxlbWVudC5cbiAgICpcbiAgICogQHJldHVybiB7UmVhY3RFbGVtZW50fVxuICAgKi9cbiAgZ2V0RWxlbWVudCgpIHtcbiAgICByZXR1cm4gdGhpcy5zaW5nbGUoJ2dldEVsZW1lbnQnLCBuID0+IGdldEFkYXB0ZXIodGhpc1tPUFRJT05TXSkubm9kZVRvRWxlbWVudChuKSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgd3JhcHBlZCBSZWFjdEVsZW1lbnRzLlxuICAgKlxuICAgKiBAcmV0dXJuIHtBcnJheTxSZWFjdEVsZW1lbnQ+fVxuICAgKi9cbiAgZ2V0RWxlbWVudHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Tm9kZXNJbnRlcm5hbCgpLm1hcChnZXRBZGFwdGVyKHRoaXNbT1BUSU9OU10pLm5vZGVUb0VsZW1lbnQpO1xuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNsYXNzLW1ldGhvZHMtdXNlLXRoaXNcbiAgZ2V0Tm9kZSgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1NoYWxsb3dXcmFwcGVyOjpnZXROb2RlKCkgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZC4gVXNlIFNoYWxsb3dXcmFwcGVyOjpnZXRFbGVtZW50KCkgaW5zdGVhZCcpO1xuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNsYXNzLW1ldGhvZHMtdXNlLXRoaXNcbiAgZ2V0Tm9kZXMoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdTaGFsbG93V3JhcHBlcjo6Z2V0Tm9kZXMoKSBpcyBubyBsb25nZXIgc3VwcG9ydGVkLiBVc2UgU2hhbGxvd1dyYXBwZXI6OmdldEVsZW1lbnRzKCkgaW5zdGVhZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGluc3RhbmNlIG9mIHRoZSBjb21wb25lbnQgYmVpbmcgcmVuZGVyZWQgYXMgdGhlIHJvb3Qgbm9kZSBwYXNzZWQgaW50byBgc2hhbGxvdygpYC5cbiAgICpcbiAgICogTk9URTogY2FuIG9ubHkgYmUgY2FsbGVkIG9uIGEgd3JhcHBlciBpbnN0YW5jZSB0aGF0IGlzIGFsc28gdGhlIHJvb3QgaW5zdGFuY2UuXG4gICAqXG4gICAqIEV4YW1wbGU6XG4gICAqIGBgYFxuICAgKiBjb25zdCB3cmFwcGVyID0gc2hhbGxvdyg8TXlDb21wb25lbnQgLz4pO1xuICAgKiBjb25zdCBpbnN0ID0gd3JhcHBlci5pbnN0YW5jZSgpO1xuICAgKiBleHBlY3QoaW5zdCkudG8uYmUuaW5zdGFuY2VPZihNeUNvbXBvbmVudCk7XG4gICAqIGBgYFxuICAgKiBAcmV0dXJucyB7UmVhY3RDb21wb25lbnR9XG4gICAqL1xuICBpbnN0YW5jZSgpIHtcbiAgICBpZiAodGhpc1tST09UXSAhPT0gdGhpcykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTaGFsbG93V3JhcHBlcjo6aW5zdGFuY2UoKSBjYW4gb25seSBiZSBjYWxsZWQgb24gdGhlIHJvb3QnKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNbUkVOREVSRVJdLmdldE5vZGUoKS5pbnN0YW5jZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJZiBhIGB3cmFwcGluZ0NvbXBvbmVudGAgd2FzIHBhc3NlZCBpbiBgb3B0aW9uc2AsIHRoaXMgbWV0aG9kcyByZXR1cm5zIGEgYFNoYWxsb3dXcmFwcGVyYFxuICAgKiBhcm91bmQgdGhlIHJlbmRlcmVkIGB3cmFwcGluZ0NvbXBvbmVudGAuIFRoaXMgYFNoYWxsb3dXcmFwcGVyYCBjYW4gYmUgdXNlZCB0byB1cGRhdGUgdGhlXG4gICAqIGB3cmFwcGluZ0NvbXBvbmVudGAncyBwcm9wcywgc3RhdGUsIGV0Yy5cbiAgICpcbiAgICogQHJldHVybnMgU2hhbGxvd1dyYXBwZXJcbiAgICovXG4gIGdldFdyYXBwaW5nQ29tcG9uZW50KCkge1xuICAgIGlmICh0aGlzW1JPT1RdICE9PSB0aGlzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NoYWxsb3dXcmFwcGVyOjpnZXRXcmFwcGluZ0NvbXBvbmVudCgpIGNhbiBvbmx5IGJlIGNhbGxlZCBvbiB0aGUgcm9vdCcpO1xuICAgIH1cbiAgICBpZiAoIXRoaXNbT1BUSU9OU10ud3JhcHBpbmdDb21wb25lbnQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU2hhbGxvd1dyYXBwZXI6OmdldFdyYXBwaW5nQ29tcG9uZW50KCkgY2FuIG9ubHkgYmUgY2FsbGVkIG9uIGEgd3JhcHBlciB0aGF0IHdhcyBvcmlnaW5hbGx5IHBhc3NlZCBhIGB3cmFwcGluZ0NvbXBvbmVudGAgb3B0aW9uJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzW1dSQVBQSU5HX0NPTVBPTkVOVF07XG4gIH1cblxuICAvKipcbiAgICogRm9yY2VzIGEgcmUtcmVuZGVyLiBVc2VmdWwgdG8gcnVuIGJlZm9yZSBjaGVja2luZyB0aGUgcmVuZGVyIG91dHB1dCBpZiBzb21ldGhpbmcgZXh0ZXJuYWxcbiAgICogbWF5IGJlIHVwZGF0aW5nIHRoZSBzdGF0ZSBvZiB0aGUgY29tcG9uZW50IHNvbWV3aGVyZS5cbiAgICpcbiAgICogTk9URTogY2FuIG9ubHkgYmUgY2FsbGVkIG9uIGEgd3JhcHBlciBpbnN0YW5jZSB0aGF0IGlzIGFsc28gdGhlIHJvb3QgaW5zdGFuY2UuXG4gICAqXG4gICAqIEByZXR1cm5zIHtTaGFsbG93V3JhcHBlcn1cbiAgICovXG4gIHVwZGF0ZSgpIHtcbiAgICBpZiAodGhpc1tST09UXSAhPT0gdGhpcykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTaGFsbG93V3JhcHBlcjo6dXBkYXRlKCkgY2FuIG9ubHkgYmUgY2FsbGVkIG9uIHRoZSByb290Jyk7XG4gICAgfVxuICAgIGlmICh0aGlzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTaGFsbG93V3JhcHBlcjo6dXBkYXRlKCkgY2FuIG9ubHkgYmUgY2FsbGVkIHdoZW4gd3JhcHBpbmcgb25lIG5vZGUnKTtcbiAgICB9XG4gICAgcHJpdmF0ZVNldE5vZGVzKHRoaXMsIGdldFJvb3ROb2RlKHRoaXNbUkVOREVSRVJdLmdldE5vZGUoKSkpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgbWV0aG9kIHRoYXQgdW5tb3VudHMgdGhlIGNvbXBvbmVudC4gVGhpcyBjYW4gYmUgdXNlZCB0byBzaW11bGF0ZSBhIGNvbXBvbmVudCBnb2luZyB0aHJvdWdoXG4gICAqIGFuZCB1bm1vdW50L21vdW50IGxpZmVjeWNsZS5cbiAgICogQHJldHVybnMge1NoYWxsb3dXcmFwcGVyfVxuICAgKi9cbiAgdW5tb3VudCgpIHtcbiAgICB0aGlzW1JFTkRFUkVSXS51bm1vdW50KCk7XG4gICAgaWYgKHRoaXNbUk9PVF1bV1JBUFBJTkdfQ09NUE9ORU5UXSkge1xuICAgICAgdGhpc1tST09UXVtXUkFQUElOR19DT01QT05FTlRdLnVubW91bnQoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQSBtZXRob2QgaXMgZm9yIHJlLXJlbmRlciB3aXRoIG5ldyBwcm9wcyBhbmQgY29udGV4dC5cbiAgICogVGhpcyBjYWxscyBjb21wb25lbnREaWRVcGRhdGUgbWV0aG9kIGlmIGRpc2FibGVMaWZlY3ljbGVNZXRob2RzIGlzIG5vdCBlbmFibGVkLlxuICAgKlxuICAgKiBOT1RFOiBjYW4gb25seSBiZSBjYWxsZWQgb24gYSB3cmFwcGVyIGluc3RhbmNlIHRoYXQgaXMgYWxzbyB0aGUgcm9vdCBpbnN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHByb3BzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0XG4gICAqIEByZXR1cm5zIHtTaGFsbG93V3JhcHBlcn1cbiAgICovXG4gIHJlcmVuZGVyKHByb3BzLCBjb250ZXh0KSB7XG4gICAgY29uc3QgYWRhcHRlciA9IGdldEFkYXB0ZXIodGhpc1tPUFRJT05TXSk7XG4gICAgdGhpcy5zaW5nbGUoJ3JlcmVuZGVyJywgKCkgPT4ge1xuICAgICAgd2l0aFNldFN0YXRlQWxsb3dlZCgoKSA9PiB7XG4gICAgICAgIC8vIE5PVEUobG1yKTogSW4gcmVhY3QgMTYsIGluc3RhbmNlcyB3aWxsIGJlIG51bGwgZm9yIFNGQ3MsIGJ1dFxuICAgICAgICAvLyByZXJlbmRlcmluZyB3aXRoIHByb3BzL2NvbnRleHQgaXMgc3RpbGwgYSB2YWxpZCB0aGluZyB0byBkby4gSW5cbiAgICAgICAgLy8gdGhpcyBjYXNlLCBzdGF0ZSB3aWxsIGJlIHVuZGVmaW5lZCwgYnV0IHByb3BzL2NvbnRleHQgd2lsbCBleGlzdC5cbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXNbUkVOREVSRVJdLmdldE5vZGUoKTtcbiAgICAgICAgY29uc3QgaW5zdGFuY2UgPSBub2RlLmluc3RhbmNlIHx8IHt9O1xuICAgICAgICBjb25zdCB0eXBlID0gbm9kZS50eXBlIHx8IHt9O1xuICAgICAgICBjb25zdCB7IHN0YXRlIH0gPSBpbnN0YW5jZTtcbiAgICAgICAgY29uc3QgcHJldlByb3BzID0gaW5zdGFuY2UucHJvcHMgfHwgdGhpc1tVTlJFTkRFUkVEXS5wcm9wcztcbiAgICAgICAgY29uc3QgcHJldkNvbnRleHQgPSBpbnN0YW5jZS5jb250ZXh0IHx8IHRoaXNbT1BUSU9OU10uY29udGV4dDtcbiAgICAgICAgY29uc3QgbmV4dENvbnRleHQgPSBjb250ZXh0IHx8IHByZXZDb250ZXh0O1xuICAgICAgICBpZiAoY29udGV4dCkge1xuICAgICAgICAgIHRoaXNbT1BUSU9OU10gPSB7IC4uLnRoaXNbT1BUSU9OU10sIGNvbnRleHQ6IG5leHRDb250ZXh0IH07XG4gICAgICAgIH1cbiAgICAgICAgdGhpc1tSRU5ERVJFUl0uYmF0Y2hlZFVwZGF0ZXMoKCkgPT4ge1xuICAgICAgICAgIC8vIFdoZW4gc2hvdWxkQ29tcG9uZW50VXBkYXRlIHJldHVybnMgZmFsc2Ugd2Ugc2hvdWxkbid0IGNhbGwgY29tcG9uZW50RGlkVXBkYXRlLlxuICAgICAgICAgIC8vIHNvIHdlIHNweSBzaG91bGRDb21wb25lbnRVcGRhdGUgdG8gZ2V0IHRoZSByZXN1bHQuXG4gICAgICAgICAgY29uc3QgbGlmZWN5Y2xlcyA9IGdldEFkYXB0ZXJMaWZlY3ljbGVzKGFkYXB0ZXIpO1xuICAgICAgICAgIGxldCBzaG91bGRSZW5kZXIgPSB0cnVlO1xuICAgICAgICAgIGxldCBzaG91bGRDb21wb25lbnRVcGRhdGVTcHk7XG4gICAgICAgICAgbGV0IGdldENoaWxkQ29udGV4dFNweTtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAhdGhpc1tPUFRJT05TXS5kaXNhYmxlTGlmZWN5Y2xlTWV0aG9kc1xuICAgICAgICAgICAgJiYgaW5zdGFuY2VcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaW5zdGFuY2Uuc2hvdWxkQ29tcG9uZW50VXBkYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHsgZ2V0RGVyaXZlZFN0YXRlRnJvbVByb3BzOiBnRFNGUCB9ID0gbGlmZWN5Y2xlcztcbiAgICAgICAgICAgICAgaWYgKGdEU0ZQICYmIGdEU0ZQLmhhc1Nob3VsZENvbXBvbmVudFVwZGF0ZUJ1Zykge1xuICAgICAgICAgICAgICAgIG1vY2tTQ1VJZmdEU0ZQUmV0dXJuTm9uTnVsbChub2RlLCBzdGF0ZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc2hvdWxkQ29tcG9uZW50VXBkYXRlU3B5ID0gc3B5TWV0aG9kKGluc3RhbmNlLCAnc2hvdWxkQ29tcG9uZW50VXBkYXRlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGxpZmVjeWNsZXMuZ2V0Q2hpbGRDb250ZXh0LmNhbGxlZEJ5UmVuZGVyZXJcbiAgICAgICAgICAgICAgJiYgdHlwZW9mIGluc3RhbmNlLmdldENoaWxkQ29udGV4dCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGdldENoaWxkQ29udGV4dFNweSA9IHNweU1ldGhvZChpbnN0YW5jZSwgJ2dldENoaWxkQ29udGV4dCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIXNob3VsZENvbXBvbmVudFVwZGF0ZVNweSAmJiBpc1B1cmVDb21wb25lbnQoaW5zdGFuY2UpKSB7XG4gICAgICAgICAgICBzaG91bGRSZW5kZXIgPSBwdXJlQ29tcG9uZW50U2hvdWxkQ29tcG9uZW50VXBkYXRlKFxuICAgICAgICAgICAgICBwcmV2UHJvcHMsXG4gICAgICAgICAgICAgIHByb3BzLFxuICAgICAgICAgICAgICBzdGF0ZSxcbiAgICAgICAgICAgICAgaW5zdGFuY2Uuc3RhdGUsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocHJvcHMpIHRoaXNbVU5SRU5ERVJFRF0gPSBjbG9uZUVsZW1lbnQoYWRhcHRlciwgdGhpc1tVTlJFTkRFUkVEXSwgcHJvcHMpO1xuICAgICAgICAgIHRoaXNbUkVOREVSRVJdLnJlbmRlcih0aGlzW1VOUkVOREVSRURdLCBuZXh0Q29udGV4dCwge1xuICAgICAgICAgICAgcHJvdmlkZXJWYWx1ZXM6IHRoaXNbUFJPVklERVJfVkFMVUVTXSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAoc2hvdWxkQ29tcG9uZW50VXBkYXRlU3B5KSB7XG4gICAgICAgICAgICBzaG91bGRSZW5kZXIgPSBzaG91bGRDb21wb25lbnRVcGRhdGVTcHkuZ2V0TGFzdFJldHVyblZhbHVlKCk7XG4gICAgICAgICAgICBzaG91bGRDb21wb25lbnRVcGRhdGVTcHkucmVzdG9yZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBzaG91bGRSZW5kZXJcbiAgICAgICAgICAgICYmICF0aGlzW09QVElPTlNdLmRpc2FibGVMaWZlY3ljbGVNZXRob2RzXG4gICAgICAgICAgICAmJiBpbnN0YW5jZVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgcHJpdmF0ZVNldENoaWxkQ29udGV4dChhZGFwdGVyLCB0aGlzLCBpbnN0YW5jZSwgbm9kZSwgZ2V0Q2hpbGRDb250ZXh0U3B5KTtcbiAgICAgICAgICAgIGlmIChsaWZlY3ljbGVzLmdldFNuYXBzaG90QmVmb3JlVXBkYXRlKSB7XG4gICAgICAgICAgICAgIGxldCBzbmFwc2hvdDtcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpbnN0YW5jZS5nZXRTbmFwc2hvdEJlZm9yZVVwZGF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIHNuYXBzaG90ID0gaW5zdGFuY2UuZ2V0U25hcHNob3RCZWZvcmVVcGRhdGUocHJldlByb3BzLCBzdGF0ZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIGxpZmVjeWNsZXMuY29tcG9uZW50RGlkVXBkYXRlXG4gICAgICAgICAgICAgICAgJiYgdHlwZW9mIGluc3RhbmNlLmNvbXBvbmVudERpZFVwZGF0ZSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgICAgICYmIChcbiAgICAgICAgICAgICAgICAgICFzdGF0ZVxuICAgICAgICAgICAgICAgICAgfHwgc2hhbGxvd0VxdWFsKHN0YXRlLCB0aGlzLmluc3RhbmNlKCkuc3RhdGUpXG4gICAgICAgICAgICAgICAgICB8fCB0eXBlb2YgdHlwZS5nZXREZXJpdmVkU3RhdGVGcm9tUHJvcHMgPT09ICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGluc3RhbmNlLmNvbXBvbmVudERpZFVwZGF0ZShwcmV2UHJvcHMsIHN0YXRlLCBzbmFwc2hvdCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgIGxpZmVjeWNsZXMuY29tcG9uZW50RGlkVXBkYXRlXG4gICAgICAgICAgICAgICYmIHR5cGVvZiBpbnN0YW5jZS5jb21wb25lbnREaWRVcGRhdGUgPT09ICdmdW5jdGlvbidcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBpZiAobGlmZWN5Y2xlcy5jb21wb25lbnREaWRVcGRhdGUucHJldkNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICBpbnN0YW5jZS5jb21wb25lbnREaWRVcGRhdGUocHJldlByb3BzLCBzdGF0ZSwgcHJldkNvbnRleHQpO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFzdGF0ZSB8fCBzaGFsbG93RXF1YWwodGhpcy5pbnN0YW5jZSgpLnN0YXRlLCBzdGF0ZSkpIHtcbiAgICAgICAgICAgICAgICBpbnN0YW5jZS5jb21wb25lbnREaWRVcGRhdGUocHJldlByb3BzLCBzdGF0ZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAvLyBJZiBpdCBkb2Vzbid0IG5lZWQgdG8gcmVyZW5kZXIsIHVwZGF0ZSBvbmx5IGl0cyBwcm9wcy5cbiAgICAgICAgICB9IGVsc2UgaWYgKCFzaGFsbG93RXF1YWwocHJvcHMsIGluc3RhbmNlLnByb3BzKSkge1xuICAgICAgICAgICAgaW5zdGFuY2UucHJvcHMgPSAoT2JqZWN0LmZyZWV6ZSB8fCBPYmplY3QpKHsgLi4uaW5zdGFuY2UucHJvcHMsIC4uLnByb3BzIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgbWV0aG9kIHRoYXQgc2V0cyB0aGUgcHJvcHMgb2YgdGhlIHJvb3QgY29tcG9uZW50LCBhbmQgcmUtcmVuZGVycy4gVXNlZnVsIGZvciB3aGVuIHlvdSBhcmVcbiAgICogd2FudGluZyB0byB0ZXN0IGhvdyB0aGUgY29tcG9uZW50IGJlaGF2ZXMgb3ZlciB0aW1lIHdpdGggY2hhbmdpbmcgcHJvcHMuIENhbGxpbmcgdGhpcywgZm9yXG4gICAqIGluc3RhbmNlLCB3aWxsIGNhbGwgdGhlIGBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzYCBsaWZlY3ljbGUgbWV0aG9kLlxuICAgKlxuICAgKiBTaW1pbGFyIHRvIGBzZXRTdGF0ZWAsIHRoaXMgbWV0aG9kIGFjY2VwdHMgYSBwcm9wcyBvYmplY3QgYW5kIHdpbGwgbWVyZ2UgaXQgaW4gd2l0aCB0aGUgYWxyZWFkeVxuICAgKiBleGlzdGluZyBwcm9wcy5cbiAgICpcbiAgICogTk9URTogY2FuIG9ubHkgYmUgY2FsbGVkIG9uIGEgd3JhcHBlciBpbnN0YW5jZSB0aGF0IGlzIGFsc28gdGhlIHJvb3QgaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyBvYmplY3RcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBjYWxsYmFjayBmdW5jdGlvblxuICAgKiBAcmV0dXJucyB7U2hhbGxvd1dyYXBwZXJ9XG4gICAqL1xuICBzZXRQcm9wcyhwcm9wcywgY2FsbGJhY2sgPSB1bmRlZmluZWQpIHtcbiAgICBpZiAodGhpc1tST09UXSAhPT0gdGhpcykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTaGFsbG93V3JhcHBlcjo6c2V0UHJvcHMoKSBjYW4gb25seSBiZSBjYWxsZWQgb24gdGhlIHJvb3QnKTtcbiAgICB9XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignUmVhY3RXcmFwcGVyOjpzZXRQcm9wcygpIGV4cGVjdHMgYSBmdW5jdGlvbiBhcyBpdHMgc2Vjb25kIGFyZ3VtZW50Jyk7XG4gICAgfVxuICAgIHRoaXMucmVyZW5kZXIocHJvcHMpO1xuICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgY2FsbGJhY2soKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQSBtZXRob2QgdG8gaW52b2tlIGBzZXRTdGF0ZWAgb24gdGhlIHJvb3QgY29tcG9uZW50IGluc3RhbmNlIHNpbWlsYXIgdG8gaG93IHlvdSBtaWdodCBpbiB0aGVcbiAgICogZGVmaW5pdGlvbiBvZiB0aGUgY29tcG9uZW50LCBhbmQgcmUtcmVuZGVycy4gIFRoaXMgbWV0aG9kIGlzIHVzZWZ1bCBmb3IgdGVzdGluZyB5b3VyIGNvbXBvbmVudFxuICAgKiBpbiBoYXJkIHRvIGFjaGlldmUgc3RhdGVzLCBob3dldmVyIHNob3VsZCBiZSB1c2VkIHNwYXJpbmdseS4gSWYgcG9zc2libGUsIHlvdSBzaG91bGQgdXRpbGl6ZVxuICAgKiB5b3VyIGNvbXBvbmVudCdzIGV4dGVybmFsIEFQSSBpbiBvcmRlciB0byBnZXQgaXQgaW50byB3aGF0ZXZlciBzdGF0ZSB5b3Ugd2FudCB0byB0ZXN0LCBpbiBvcmRlclxuICAgKiB0byBiZSBhcyBhY2N1cmF0ZSBvZiBhIHRlc3QgYXMgcG9zc2libGUuIFRoaXMgaXMgbm90IGFsd2F5cyBwcmFjdGljYWwsIGhvd2V2ZXIuXG4gICAqXG4gICAqIE5PVEU6IGNhbiBvbmx5IGJlIGNhbGxlZCBvbiBhIHdyYXBwZXIgaW5zdGFuY2UgdGhhdCBpcyBhbHNvIHRoZSByb290IGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gc3RhdGUgdG8gbWVyZ2VcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBjYWxsYmFjayBmdW5jdGlvblxuICAgKiBAcmV0dXJucyB7U2hhbGxvd1dyYXBwZXJ9XG4gICAqL1xuICBzZXRTdGF0ZShzdGF0ZSwgY2FsbGJhY2sgPSB1bmRlZmluZWQpIHtcbiAgICBpZiAodGhpc1tST09UXSAhPT0gdGhpcykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTaGFsbG93V3JhcHBlcjo6c2V0U3RhdGUoKSBjYW4gb25seSBiZSBjYWxsZWQgb24gdGhlIHJvb3QnKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuaW5zdGFuY2UoKSA9PT0gbnVsbCB8fCB0aGlzW1JFTkRFUkVSXS5nZXROb2RlKCkubm9kZVR5cGUgIT09ICdjbGFzcycpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU2hhbGxvd1dyYXBwZXI6OnNldFN0YXRlKCkgY2FuIG9ubHkgYmUgY2FsbGVkIG9uIGNsYXNzIGNvbXBvbmVudHMnKTtcbiAgICB9XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignUmVhY3RXcmFwcGVyOjpzZXRTdGF0ZSgpIGV4cGVjdHMgYSBmdW5jdGlvbiBhcyBpdHMgc2Vjb25kIGFyZ3VtZW50Jyk7XG4gICAgfVxuXG4gICAgdGhpcy5zaW5nbGUoJ3NldFN0YXRlJywgKCkgPT4ge1xuICAgICAgd2l0aFNldFN0YXRlQWxsb3dlZCgoKSA9PiB7XG4gICAgICAgIGNvbnN0IGFkYXB0ZXIgPSBnZXRBZGFwdGVyKHRoaXNbT1BUSU9OU10pO1xuXG4gICAgICAgIGNvbnN0IGxpZmVjeWNsZXMgPSBnZXRBZGFwdGVyTGlmZWN5Y2xlcyhhZGFwdGVyKTtcblxuICAgICAgICBjb25zdCBub2RlID0gdGhpc1tSRU5ERVJFUl0uZ2V0Tm9kZSgpO1xuICAgICAgICBjb25zdCB7IGluc3RhbmNlIH0gPSBub2RlO1xuICAgICAgICBjb25zdCBwcmV2UHJvcHMgPSBpbnN0YW5jZS5wcm9wcztcbiAgICAgICAgY29uc3QgcHJldlN0YXRlID0gaW5zdGFuY2Uuc3RhdGU7XG4gICAgICAgIGNvbnN0IHByZXZDb250ZXh0ID0gaW5zdGFuY2UuY29udGV4dDtcblxuICAgICAgICBjb25zdCBzdGF0ZVBheWxvYWQgPSB0eXBlb2Ygc3RhdGUgPT09ICdmdW5jdGlvbidcbiAgICAgICAgICA/IHN0YXRlLmNhbGwoaW5zdGFuY2UsIHByZXZTdGF0ZSwgcHJldlByb3BzKVxuICAgICAgICAgIDogc3RhdGU7XG5cbiAgICAgICAgLy8gcmV0dXJuaW5nIG51bGwgb3IgdW5kZWZpbmVkIHByZXZlbnRzIHRoZSB1cGRhdGUgaW4gUmVhY3QgMTYrXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9wdWxsLzEyNzU2XG4gICAgICAgIGNvbnN0IG1heWJlSGFzVXBkYXRlID0gIWxpZmVjeWNsZXMuc2V0U3RhdGUuc2tpcHNDb21wb25lbnREaWRVcGRhdGVPbk51bGxpc2hcbiAgICAgICAgICB8fCBzdGF0ZVBheWxvYWQgIT0gbnVsbDtcblxuICAgICAgICAvLyBXaGVuIHNob3VsZENvbXBvbmVudFVwZGF0ZSByZXR1cm5zIGZhbHNlIHdlIHNob3VsZG4ndCBjYWxsIGNvbXBvbmVudERpZFVwZGF0ZS5cbiAgICAgICAgLy8gc28gd2Ugc3B5IHNob3VsZENvbXBvbmVudFVwZGF0ZSB0byBnZXQgdGhlIHJlc3VsdC5cbiAgICAgICAgbGV0IHNob3VsZENvbXBvbmVudFVwZGF0ZVNweTtcbiAgICAgICAgbGV0IGdldENoaWxkQ29udGV4dFNweTtcbiAgICAgICAgbGV0IHNob3VsZFJlbmRlciA9IHRydWU7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAhdGhpc1tPUFRJT05TXS5kaXNhYmxlTGlmZWN5Y2xlTWV0aG9kc1xuICAgICAgICAgICYmIGluc3RhbmNlXG4gICAgICAgICkge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIGxpZmVjeWNsZXMuY29tcG9uZW50RGlkVXBkYXRlXG4gICAgICAgICAgICAmJiBsaWZlY3ljbGVzLmNvbXBvbmVudERpZFVwZGF0ZS5vblNldFN0YXRlXG4gICAgICAgICAgICAmJiB0eXBlb2YgaW5zdGFuY2Uuc2hvdWxkQ29tcG9uZW50VXBkYXRlID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zdCB7IGdldERlcml2ZWRTdGF0ZUZyb21Qcm9wczogZ0RTRlAgfSA9IGxpZmVjeWNsZXM7XG4gICAgICAgICAgICBpZiAoZ0RTRlAgJiYgZ0RTRlAuaGFzU2hvdWxkQ29tcG9uZW50VXBkYXRlQnVnKSB7XG4gICAgICAgICAgICAgIG1vY2tTQ1VJZmdEU0ZQUmV0dXJuTm9uTnVsbChub2RlLCBzdGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzaG91bGRDb21wb25lbnRVcGRhdGVTcHkgPSBzcHlNZXRob2QoaW5zdGFuY2UsICdzaG91bGRDb21wb25lbnRVcGRhdGUnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgbGlmZWN5Y2xlcy5nZXRDaGlsZENvbnRleHQuY2FsbGVkQnlSZW5kZXJlclxuICAgICAgICAgICAgJiYgdHlwZW9mIGluc3RhbmNlLmdldENoaWxkQ29udGV4dCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgICkge1xuICAgICAgICAgICAgZ2V0Q2hpbGRDb250ZXh0U3B5ID0gc3B5TWV0aG9kKGluc3RhbmNlLCAnZ2V0Q2hpbGRDb250ZXh0Jyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghc2hvdWxkQ29tcG9uZW50VXBkYXRlU3B5ICYmIGlzUHVyZUNvbXBvbmVudChpbnN0YW5jZSkpIHtcbiAgICAgICAgICBzaG91bGRSZW5kZXIgPSBwdXJlQ29tcG9uZW50U2hvdWxkQ29tcG9uZW50VXBkYXRlKFxuICAgICAgICAgICAgcHJldlByb3BzLFxuICAgICAgICAgICAgaW5zdGFuY2UucHJvcHMsXG4gICAgICAgICAgICBwcmV2U3RhdGUsXG4gICAgICAgICAgICB7IC4uLnByZXZTdGF0ZSwgLi4uc3RhdGVQYXlsb2FkIH0sXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdlIGRvbid0IHBhc3MgdGhlIHNldFN0YXRlIGNhbGxiYWNrIGhlcmVcbiAgICAgICAgLy8gdG8gZ3VhcmFudGVlIHRvIGNhbGwgdGhlIGNhbGxiYWNrIGFmdGVyIGZpbmlzaGluZyB0aGUgcmVuZGVyXG4gICAgICAgIGlmIChpbnN0YW5jZVtTRVRfU1RBVEVdKSB7XG4gICAgICAgICAgaW5zdGFuY2VbU0VUX1NUQVRFXShzdGF0ZVBheWxvYWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGluc3RhbmNlLnNldFN0YXRlKHN0YXRlUGF5bG9hZCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNob3VsZENvbXBvbmVudFVwZGF0ZVNweSkge1xuICAgICAgICAgIHNob3VsZFJlbmRlciA9IHNob3VsZENvbXBvbmVudFVwZGF0ZVNweS5nZXRMYXN0UmV0dXJuVmFsdWUoKTtcbiAgICAgICAgICBzaG91bGRDb21wb25lbnRVcGRhdGVTcHkucmVzdG9yZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChcbiAgICAgICAgICBtYXliZUhhc1VwZGF0ZVxuICAgICAgICAgICYmIHNob3VsZFJlbmRlclxuICAgICAgICAgICYmICF0aGlzW09QVElPTlNdLmRpc2FibGVMaWZlY3ljbGVNZXRob2RzXG4gICAgICAgICkge1xuICAgICAgICAgIHByaXZhdGVTZXRDaGlsZENvbnRleHQoYWRhcHRlciwgdGhpcywgaW5zdGFuY2UsIG5vZGUsIGdldENoaWxkQ29udGV4dFNweSk7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgbGlmZWN5Y2xlcy5jb21wb25lbnREaWRVcGRhdGVcbiAgICAgICAgICAgICYmIGxpZmVjeWNsZXMuY29tcG9uZW50RGlkVXBkYXRlLm9uU2V0U3RhdGVcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgbGlmZWN5Y2xlcy5nZXRTbmFwc2hvdEJlZm9yZVVwZGF0ZVxuICAgICAgICAgICAgICAmJiB0eXBlb2YgaW5zdGFuY2UuZ2V0U25hcHNob3RCZWZvcmVVcGRhdGUgPT09ICdmdW5jdGlvbidcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBjb25zdCBzbmFwc2hvdCA9IGluc3RhbmNlLmdldFNuYXBzaG90QmVmb3JlVXBkYXRlKHByZXZQcm9wcywgcHJldlN0YXRlKTtcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpbnN0YW5jZS5jb21wb25lbnREaWRVcGRhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBpbnN0YW5jZS5jb21wb25lbnREaWRVcGRhdGUocHJldlByb3BzLCBwcmV2U3RhdGUsIHNuYXBzaG90KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgaW5zdGFuY2UuY29tcG9uZW50RGlkVXBkYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgIGlmIChsaWZlY3ljbGVzLmNvbXBvbmVudERpZFVwZGF0ZS5wcmV2Q29udGV4dCkge1xuICAgICAgICAgICAgICAgIGluc3RhbmNlLmNvbXBvbmVudERpZFVwZGF0ZShwcmV2UHJvcHMsIHByZXZTdGF0ZSwgcHJldkNvbnRleHQpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGluc3RhbmNlLmNvbXBvbmVudERpZFVwZGF0ZShwcmV2UHJvcHMsIHByZXZTdGF0ZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICAgICAgLy8gY2FsbCB0aGUgc2V0U3RhdGUgY2FsbGJhY2tcbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgaWYgKGFkYXB0ZXIuaW52b2tlU2V0U3RhdGVDYWxsYmFjaykge1xuICAgICAgICAgICAgYWRhcHRlci5pbnZva2VTZXRTdGF0ZUNhbGxiYWNrKGluc3RhbmNlLCBjYWxsYmFjayk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwoaW5zdGFuY2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQSBtZXRob2QgdGhhdCBzZXRzIHRoZSBjb250ZXh0IG9mIHRoZSByb290IGNvbXBvbmVudCwgYW5kIHJlLXJlbmRlcnMuIFVzZWZ1bCBmb3Igd2hlbiB5b3UgYXJlXG4gICAqIHdhbnRpbmcgdG8gdGVzdCBob3cgdGhlIGNvbXBvbmVudCBiZWhhdmVzIG92ZXIgdGltZSB3aXRoIGNoYW5naW5nIGNvbnRleHRzLlxuICAgKlxuICAgKiBOT1RFOiBjYW4gb25seSBiZSBjYWxsZWQgb24gYSB3cmFwcGVyIGluc3RhbmNlIHRoYXQgaXMgYWxzbyB0aGUgcm9vdCBpbnN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHQgb2JqZWN0XG4gICAqIEByZXR1cm5zIHtTaGFsbG93V3JhcHBlcn1cbiAgICovXG4gIHNldENvbnRleHQoY29udGV4dCkge1xuICAgIGlmICh0aGlzW1JPT1RdICE9PSB0aGlzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NoYWxsb3dXcmFwcGVyOjpzZXRDb250ZXh0KCkgY2FuIG9ubHkgYmUgY2FsbGVkIG9uIHRoZSByb290Jyk7XG4gICAgfVxuICAgIGlmICghdGhpc1tPUFRJT05TXS5jb250ZXh0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NoYWxsb3dXcmFwcGVyOjpzZXRDb250ZXh0KCkgY2FuIG9ubHkgYmUgY2FsbGVkIG9uIGEgd3JhcHBlciB0aGF0IHdhcyBvcmlnaW5hbGx5IHBhc3NlZCBhIGNvbnRleHQgb3B0aW9uJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnJlcmVuZGVyKG51bGwsIGNvbnRleHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IGEgZ2l2ZW4gcmVhY3QgZWxlbWVudCBleGlzdHMgaW4gdGhlIHNoYWxsb3cgcmVuZGVyIHRyZWUuXG4gICAqXG4gICAqIEV4YW1wbGU6XG4gICAqIGBgYFxuICAgKiBjb25zdCB3cmFwcGVyID0gc2hhbGxvdyg8TXlDb21wb25lbnQgLz4pO1xuICAgKiBleHBlY3Qod3JhcHBlci5jb250YWlucyg8ZGl2IGNsYXNzTmFtZT1cImZvbyBiYXJcIiAvPikpLnRvLmVxdWFsKHRydWUpO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtSZWFjdEVsZW1lbnR8QXJyYXk8UmVhY3RFbGVtZW50Pn0gbm9kZU9yTm9kZXNcbiAgICogQHJldHVybnMge0Jvb2xlYW59XG4gICAqL1xuICBjb250YWlucyhub2RlT3JOb2Rlcykge1xuICAgIGNvbnN0IGFkYXB0ZXIgPSBnZXRBZGFwdGVyKHRoaXNbT1BUSU9OU10pO1xuICAgIGlmICghaXNSZWFjdEVsZW1lbnRBbGlrZShub2RlT3JOb2RlcywgYWRhcHRlcikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU2hhbGxvd1dyYXBwZXI6OmNvbnRhaW5zKCkgY2FuIG9ubHkgYmUgY2FsbGVkIHdpdGggYSBSZWFjdEVsZW1lbnQgKG9yIGFuIGFycmF5IG9mIHRoZW0pLCBhIHN0cmluZywgb3IgYSBudW1iZXIgYXMgYW4gYXJndW1lbnQuJyk7XG4gICAgfVxuICAgIGNvbnN0IHByZWRpY2F0ZSA9IEFycmF5LmlzQXJyYXkobm9kZU9yTm9kZXMpXG4gICAgICA/IG90aGVyID0+IGNvbnRhaW5zQ2hpbGRyZW5TdWJBcnJheShcbiAgICAgICAgbm9kZUVxdWFsLFxuICAgICAgICBvdGhlcixcbiAgICAgICAgbm9kZU9yTm9kZXMubWFwKG5vZGUgPT4gYWRhcHRlci5lbGVtZW50VG9Ob2RlKG5vZGUpKSxcbiAgICAgIClcbiAgICAgIDogb3RoZXIgPT4gbm9kZUVxdWFsKGFkYXB0ZXIuZWxlbWVudFRvTm9kZShub2RlT3JOb2RlcyksIG90aGVyKTtcblxuICAgIHJldHVybiBmaW5kV2hlcmVVbndyYXBwZWQodGhpcywgcHJlZGljYXRlKS5sZW5ndGggPiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IGEgZ2l2ZW4gcmVhY3QgZWxlbWVudCBleGlzdHMgaW4gdGhlIHNoYWxsb3cgcmVuZGVyIHRyZWUuXG4gICAqIE1hdGNoIGlzIGJhc2VkIG9uIHRoZSBleHBlY3RlZCBlbGVtZW50IGFuZCBub3Qgb24gd3JhcHBlcnMgZWxlbWVudC5cbiAgICogSXQgd2lsbCBkZXRlcm1pbmUgaWYgb25lIG9mIHRoZSB3cmFwcGVycyBlbGVtZW50IFwibG9va3MgbGlrZVwiIHRoZSBleHBlY3RlZFxuICAgKiBlbGVtZW50IGJ5IGNoZWNraW5nIGlmIGFsbCBwcm9wcyBvZiB0aGUgZXhwZWN0ZWQgZWxlbWVudCBhcmUgcHJlc2VudFxuICAgKiBvbiB0aGUgd3JhcHBlcnMgZWxlbWVudCBhbmQgZXF1YWxzIHRvIGVhY2ggb3RoZXIuXG4gICAqXG4gICAqIEV4YW1wbGU6XG4gICAqIGBgYFxuICAgKiAvLyBNeUNvbXBvbmVudCBvdXRwdXRzIDxkaXY+PGRpdiBjbGFzcz1cImZvb1wiPkhlbGxvPC9kaXY+PC9kaXY+XG4gICAqIGNvbnN0IHdyYXBwZXIgPSBzaGFsbG93KDxNeUNvbXBvbmVudCAvPik7XG4gICAqIGV4cGVjdCh3cmFwcGVyLmNvbnRhaW5zTWF0Y2hpbmdFbGVtZW50KDxkaXY+SGVsbG88L2Rpdj4pKS50by5lcXVhbCh0cnVlKTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7UmVhY3RFbGVtZW50fSBub2RlXG4gICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgKi9cbiAgY29udGFpbnNNYXRjaGluZ0VsZW1lbnQobm9kZSkge1xuICAgIGNvbnN0IGFkYXB0ZXIgPSBnZXRBZGFwdGVyKHRoaXNbT1BUSU9OU10pO1xuICAgIGNvbnN0IHJzdE5vZGUgPSBhZGFwdGVyLmVsZW1lbnRUb05vZGUobm9kZSk7XG4gICAgY29uc3QgcHJlZGljYXRlID0gb3RoZXIgPT4gbm9kZU1hdGNoZXMocnN0Tm9kZSwgb3RoZXIsIChhLCBiKSA9PiBhIDw9IGIpO1xuICAgIHJldHVybiBmaW5kV2hlcmVVbndyYXBwZWQodGhpcywgcHJlZGljYXRlKS5sZW5ndGggPiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IGFsbCB0aGUgZ2l2ZW4gcmVhY3QgZWxlbWVudHMgZXhpc3RzIGluIHRoZSBzaGFsbG93IHJlbmRlciB0cmVlLlxuICAgKiBNYXRjaCBpcyBiYXNlZCBvbiB0aGUgZXhwZWN0ZWQgZWxlbWVudCBhbmQgbm90IG9uIHdyYXBwZXJzIGVsZW1lbnQuXG4gICAqIEl0IHdpbGwgZGV0ZXJtaW5lIGlmIG9uZSBvZiB0aGUgd3JhcHBlcnMgZWxlbWVudCBcImxvb2tzIGxpa2VcIiB0aGUgZXhwZWN0ZWRcbiAgICogZWxlbWVudCBieSBjaGVja2luZyBpZiBhbGwgcHJvcHMgb2YgdGhlIGV4cGVjdGVkIGVsZW1lbnQgYXJlIHByZXNlbnRcbiAgICogb24gdGhlIHdyYXBwZXJzIGVsZW1lbnQgYW5kIGVxdWFscyB0byBlYWNoIG90aGVyLlxuICAgKlxuICAgKiBFeGFtcGxlOlxuICAgKiBgYGBcbiAgICogY29uc3Qgd3JhcHBlciA9IHNoYWxsb3coPE15Q29tcG9uZW50IC8+KTtcbiAgICogZXhwZWN0KHdyYXBwZXIuY29udGFpbnNBbGxNYXRjaGluZ0VsZW1lbnRzKFtcbiAgICogICA8ZGl2PkhlbGxvPC9kaXY+LFxuICAgKiAgIDxkaXY+R29vZGJ5ZTwvZGl2PixcbiAgICogXSkpLnRvLmVxdWFsKHRydWUpO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtBcnJheTxSZWFjdEVsZW1lbnQ+fSBub2Rlc1xuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICovXG4gIGNvbnRhaW5zQWxsTWF0Y2hpbmdFbGVtZW50cyhub2Rlcykge1xuICAgIGlmICghQXJyYXkuaXNBcnJheShub2RlcykpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ25vZGVzIHNob3VsZCBiZSBhbiBBcnJheScpO1xuICAgIH1cblxuICAgIHJldHVybiBub2Rlcy5ldmVyeShub2RlID0+IHRoaXMuY29udGFpbnNNYXRjaGluZ0VsZW1lbnQobm9kZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IG9uZSBvZiB0aGUgZ2l2ZW4gcmVhY3QgZWxlbWVudHMgZXhpc3RzIGluIHRoZSBzaGFsbG93IHJlbmRlciB0cmVlLlxuICAgKiBNYXRjaCBpcyBiYXNlZCBvbiB0aGUgZXhwZWN0ZWQgZWxlbWVudCBhbmQgbm90IG9uIHdyYXBwZXJzIGVsZW1lbnQuXG4gICAqIEl0IHdpbGwgZGV0ZXJtaW5lIGlmIG9uZSBvZiB0aGUgd3JhcHBlcnMgZWxlbWVudCBcImxvb2tzIGxpa2VcIiB0aGUgZXhwZWN0ZWRcbiAgICogZWxlbWVudCBieSBjaGVja2luZyBpZiBhbGwgcHJvcHMgb2YgdGhlIGV4cGVjdGVkIGVsZW1lbnQgYXJlIHByZXNlbnRcbiAgICogb24gdGhlIHdyYXBwZXJzIGVsZW1lbnQgYW5kIGVxdWFscyB0byBlYWNoIG90aGVyLlxuICAgKlxuICAgKiBFeGFtcGxlOlxuICAgKiBgYGBcbiAgICogY29uc3Qgd3JhcHBlciA9IHNoYWxsb3coPE15Q29tcG9uZW50IC8+KTtcbiAgICogZXhwZWN0KHdyYXBwZXIuY29udGFpbnNBbnlNYXRjaGluZ0VsZW1lbnRzKFtcbiAgICogICA8ZGl2PkhlbGxvPC9kaXY+LFxuICAgKiAgIDxkaXY+R29vZGJ5ZTwvZGl2PixcbiAgICogXSkpLnRvLmVxdWFsKHRydWUpO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtBcnJheTxSZWFjdEVsZW1lbnQ+fSBub2Rlc1xuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICovXG4gIGNvbnRhaW5zQW55TWF0Y2hpbmdFbGVtZW50cyhub2Rlcykge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KG5vZGVzKSAmJiBub2Rlcy5zb21lKG5vZGUgPT4gdGhpcy5jb250YWluc01hdGNoaW5nRWxlbWVudChub2RlKSk7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgYSBnaXZlbiByZWFjdCBlbGVtZW50IGV4aXN0cyBpbiB0aGUgcmVuZGVyIHRyZWUuXG4gICAqXG4gICAqIEV4YW1wbGU6XG4gICAqIGBgYFxuICAgKiBjb25zdCB3cmFwcGVyID0gc2hhbGxvdyg8TXlDb21wb25lbnQgLz4pO1xuICAgKiBleHBlY3Qod3JhcHBlci5jb250YWlucyg8ZGl2IGNsYXNzTmFtZT1cImZvbyBiYXJcIiAvPikpLnRvLmVxdWFsKHRydWUpO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtSZWFjdEVsZW1lbnR9IG5vZGVcbiAgICogQHJldHVybnMge0Jvb2xlYW59XG4gICAqL1xuICBlcXVhbHMobm9kZSkge1xuICAgIHJldHVybiB0aGlzLnNpbmdsZSgnZXF1YWxzJywgKCkgPT4gbm9kZUVxdWFsKHRoaXMuZ2V0Tm9kZUludGVybmFsKCksIG5vZGUpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCBhIGdpdmVuIHJlYWN0IGVsZW1lbnQgbWF0Y2hlcyB0aGUgcmVuZGVyIHRyZWUuXG4gICAqIE1hdGNoIGlzIGJhc2VkIG9uIHRoZSBleHBlY3RlZCBlbGVtZW50IGFuZCBub3Qgb24gd3JhcHBlciByb290IG5vZGUuXG4gICAqIEl0IHdpbGwgZGV0ZXJtaW5lIGlmIHRoZSB3cmFwcGVyIHJvb3Qgbm9kZSBcImxvb2tzIGxpa2VcIiB0aGUgZXhwZWN0ZWRcbiAgICogZWxlbWVudCBieSBjaGVja2luZyBpZiBhbGwgcHJvcHMgb2YgdGhlIGV4cGVjdGVkIGVsZW1lbnQgYXJlIHByZXNlbnRcbiAgICogb24gdGhlIHdyYXBwZXIgcm9vdCBub2RlIGFuZCBlcXVhbHMgdG8gZWFjaCBvdGhlci5cbiAgICpcbiAgICogRXhhbXBsZTpcbiAgICogYGBgXG4gICAqIC8vIE15Q29tcG9uZW50IG91dHB1dHMgPGRpdiBjbGFzcz1cImZvb1wiPkhlbGxvPC9kaXY+XG4gICAqIGNvbnN0IHdyYXBwZXIgPSBzaGFsbG93KDxNeUNvbXBvbmVudCAvPik7XG4gICAqIGV4cGVjdCh3cmFwcGVyLm1hdGNoZXNFbGVtZW50KDxkaXY+SGVsbG88L2Rpdj4pKS50by5lcXVhbCh0cnVlKTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7UmVhY3RFbGVtZW50fSBub2RlXG4gICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgKi9cbiAgbWF0Y2hlc0VsZW1lbnQobm9kZSkge1xuICAgIHJldHVybiB0aGlzLnNpbmdsZSgnbWF0Y2hlc0VsZW1lbnQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBhZGFwdGVyID0gZ2V0QWRhcHRlcih0aGlzW09QVElPTlNdKTtcbiAgICAgIGNvbnN0IHJzdE5vZGUgPSBhZGFwdGVyLmVsZW1lbnRUb05vZGUobm9kZSk7XG4gICAgICByZXR1cm4gbm9kZU1hdGNoZXMocnN0Tm9kZSwgdGhpcy5nZXROb2RlSW50ZXJuYWwoKSwgKGEsIGIpID0+IGEgPD0gYik7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmluZHMgZXZlcnkgbm9kZSBpbiB0aGUgcmVuZGVyIHRyZWUgb2YgdGhlIGN1cnJlbnQgd3JhcHBlciB0aGF0IG1hdGNoZXMgdGhlIHByb3ZpZGVkIHNlbGVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0ge0VuenltZVNlbGVjdG9yfSBzZWxlY3RvclxuICAgKiBAcmV0dXJucyB7U2hhbGxvd1dyYXBwZXJ9XG4gICAqL1xuICBmaW5kKHNlbGVjdG9yKSB7XG4gICAgcmV0dXJuIHRoaXMud3JhcChyZWR1Y2VUcmVlc0J5U2VsZWN0b3Ioc2VsZWN0b3IsIHRoaXMuZ2V0Tm9kZXNJbnRlcm5hbCgpKSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIG9yIG5vdCBjdXJyZW50IG5vZGUgbWF0Y2hlcyBhIHByb3ZpZGVkIHNlbGVjdG9yLlxuICAgKlxuICAgKiBOT1RFOiBjYW4gb25seSBiZSBjYWxsZWQgb24gYSB3cmFwcGVyIG9mIGEgc2luZ2xlIG5vZGUuXG4gICAqXG4gICAqIEBwYXJhbSB7RW56eW1lU2VsZWN0b3J9IHNlbGVjdG9yXG4gICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgKi9cbiAgaXMoc2VsZWN0b3IpIHtcbiAgICBjb25zdCBwcmVkaWNhdGUgPSBidWlsZFByZWRpY2F0ZShzZWxlY3Rvcik7XG4gICAgcmV0dXJuIHRoaXMuc2luZ2xlKCdpcycsIG4gPT4gcHJlZGljYXRlKG4pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIGNvbXBvbmVudCByZW5kZXJlZCBub3RoaW5nLCBpLmUuLCBudWxsIG9yIGZhbHNlLlxuICAgKlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICovXG4gIGlzRW1wdHlSZW5kZXIoKSB7XG4gICAgY29uc3Qgbm9kZXMgPSB0aGlzLmdldE5vZGVzSW50ZXJuYWwoKTtcblxuICAgIHJldHVybiBub2Rlcy5ldmVyeShuID0+IGlzRW1wdHlWYWx1ZShuKSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIG5ldyB3cmFwcGVyIGluc3RhbmNlIHdpdGggb25seSB0aGUgbm9kZXMgb2YgdGhlIGN1cnJlbnQgd3JhcHBlciBpbnN0YW5jZSB0aGF0IG1hdGNoXG4gICAqIHRoZSBwcm92aWRlZCBwcmVkaWNhdGUgZnVuY3Rpb24uIFRoZSBwcmVkaWNhdGUgc2hvdWxkIHJlY2VpdmUgYSB3cmFwcGVkIG5vZGUgYXMgaXRzIGZpcnN0XG4gICAqIGFyZ3VtZW50LlxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkaWNhdGVcbiAgICogQHJldHVybnMge1NoYWxsb3dXcmFwcGVyfVxuICAgKi9cbiAgZmlsdGVyV2hlcmUocHJlZGljYXRlKSB7XG4gICAgcmV0dXJuIGZpbHRlcldoZXJlVW53cmFwcGVkKHRoaXMsIG4gPT4gcHJlZGljYXRlKHRoaXMud3JhcChuKSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBuZXcgd3JhcHBlciBpbnN0YW5jZSB3aXRoIG9ubHkgdGhlIG5vZGVzIG9mIHRoZSBjdXJyZW50IHdyYXBwZXIgaW5zdGFuY2UgdGhhdCBtYXRjaFxuICAgKiB0aGUgcHJvdmlkZWQgc2VsZWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB7RW56eW1lU2VsZWN0b3J9IHNlbGVjdG9yXG4gICAqIEByZXR1cm5zIHtTaGFsbG93V3JhcHBlcn1cbiAgICovXG4gIGZpbHRlcihzZWxlY3Rvcikge1xuICAgIGNvbnN0IHByZWRpY2F0ZSA9IGJ1aWxkUHJlZGljYXRlKHNlbGVjdG9yKTtcbiAgICByZXR1cm4gZmlsdGVyV2hlcmVVbndyYXBwZWQodGhpcywgcHJlZGljYXRlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgbmV3IHdyYXBwZXIgaW5zdGFuY2Ugd2l0aCBvbmx5IHRoZSBub2RlcyBvZiB0aGUgY3VycmVudCB3cmFwcGVyIHRoYXQgZGlkIG5vdCBtYXRjaFxuICAgKiB0aGUgcHJvdmlkZWQgc2VsZWN0b3IuIEVzc2VudGlhbGx5IHRoZSBpbnZlcnNlIG9mIGBmaWx0ZXJgLlxuICAgKlxuICAgKiBAcGFyYW0ge0VuenltZVNlbGVjdG9yfSBzZWxlY3RvclxuICAgKiBAcmV0dXJucyB7U2hhbGxvd1dyYXBwZXJ9XG4gICAqL1xuICBub3Qoc2VsZWN0b3IpIHtcbiAgICBjb25zdCBwcmVkaWNhdGUgPSBidWlsZFByZWRpY2F0ZShzZWxlY3Rvcik7XG4gICAgcmV0dXJuIGZpbHRlcldoZXJlVW53cmFwcGVkKHRoaXMsIG4gPT4gIXByZWRpY2F0ZShuKSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHN0cmluZyBvZiB0aGUgcmVuZGVyZWQgdGV4dCBvZiB0aGUgY3VycmVudCByZW5kZXIgdHJlZS4gIFRoaXMgZnVuY3Rpb24gc2hvdWxkIGJlXG4gICAqIGxvb2tlZCBhdCB3aXRoIHNrZXB0aWNpc20gaWYgYmVpbmcgdXNlZCB0byB0ZXN0IHdoYXQgdGhlIGFjdHVhbCBIVE1MIG91dHB1dCBvZiB0aGUgY29tcG9uZW50XG4gICAqIHdpbGwgYmUuIElmIHRoYXQgaXMgd2hhdCB5b3Ugd291bGQgbGlrZSB0byB0ZXN0LCB1c2UgZW56eW1lJ3MgYHJlbmRlcmAgZnVuY3Rpb24gaW5zdGVhZC5cbiAgICpcbiAgICogTk9URTogY2FuIG9ubHkgYmUgY2FsbGVkIG9uIGEgd3JhcHBlciBvZiBhIHNpbmdsZSBub2RlLlxuICAgKlxuICAgKiBAcmV0dXJucyB7U3RyaW5nfVxuICAgKi9cbiAgdGV4dCgpIHtcbiAgICByZXR1cm4gdGhpcy5zaW5nbGUoJ3RleHQnLCBnZXRUZXh0RnJvbU5vZGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIEhUTUwgb2YgdGhlIG5vZGUuXG4gICAqXG4gICAqIE5PVEU6IGNhbiBvbmx5IGJlIGNhbGxlZCBvbiBhIHdyYXBwZXIgb2YgYSBzaW5nbGUgbm9kZS5cbiAgICpcbiAgICogQHJldHVybnMge1N0cmluZ31cbiAgICovXG4gIGh0bWwoKSB7XG4gICAgcmV0dXJuIHRoaXMuc2luZ2xlKCdodG1sJywgKG4pID0+IHtcbiAgICAgIGlmICh0aGlzLnR5cGUoKSA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gICAgICBjb25zdCBhZGFwdGVyID0gZ2V0QWRhcHRlcih0aGlzW09QVElPTlNdKTtcbiAgICAgIGNvbnN0IHJlbmRlcmVyID0gYWRhcHRlci5jcmVhdGVSZW5kZXJlcih7IC4uLnRoaXNbT1BUSU9OU10sIG1vZGU6ICdzdHJpbmcnIH0pO1xuICAgICAgcmV0dXJuIHJlbmRlcmVyLnJlbmRlcihhZGFwdGVyLm5vZGVUb0VsZW1lbnQobikpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGN1cnJlbnQgbm9kZSByZW5kZXJlZCB0byBIVE1MIGFuZCB3cmFwcGVkIGluIGEgQ2hlZXJpb1dyYXBwZXIuXG4gICAqXG4gICAqIE5PVEU6IGNhbiBvbmx5IGJlIGNhbGxlZCBvbiBhIHdyYXBwZXIgb2YgYSBzaW5nbGUgbm9kZS5cbiAgICpcbiAgICogQHJldHVybnMge0NoZWVyaW9XcmFwcGVyfVxuICAgKi9cbiAgcmVuZGVyKCkge1xuICAgIHJldHVybiB0aGlzLnR5cGUoKSA9PT0gbnVsbCA/IGNoZWVyaW8oKSA6IGNoZWVyaW8ubG9hZCgnJykodGhpcy5odG1sKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gc2ltdWxhdGUgZXZlbnRzLiBQYXNzIGFuIGV2ZW50bmFtZSBhbmQgKG9wdGlvbmFsbHkpIGV2ZW50IGFyZ3VtZW50cy4gVGhpcyBtZXRob2Qgb2ZcbiAgICogdGVzdGluZyBldmVudHMgc2hvdWxkIGJlIG1ldCB3aXRoIHNvbWUgc2tlcHRpY2lzbS5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gICAqIEBwYXJhbSB7QXJyYXl9IGFyZ3NcbiAgICogQHJldHVybnMge1NoYWxsb3dXcmFwcGVyfVxuICAgKi9cbiAgc2ltdWxhdGUoZXZlbnQsIC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5zaW5nbGUoJ3NpbXVsYXRlJywgKG4pID0+IHtcbiAgICAgIHRoaXNbUkVOREVSRVJdLnNpbXVsYXRlRXZlbnQobiwgZXZlbnQsIC4uLmFyZ3MpO1xuICAgICAgdGhpc1tST09UXS51cGRhdGUoKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gc2ltdWxhdGUgdGhyb3dpbmcgYSByZW5kZXJpbmcgZXJyb3IuIFBhc3MgYW4gZXJyb3IgdG8gdGhyb3cuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBlcnJvclxuICAgKiBAcmV0dXJucyB7U2hhbGxvd1dyYXBwZXJ9XG4gICAqL1xuICBzaW11bGF0ZUVycm9yKGVycm9yKSB7XG4gICAgLy8gaW4gc2hhbGxvdywgdGhlIFwicm9vdFwiIGlzIHRoZSBcInJlbmRlcmVkXCIgdGhpbmcuXG5cbiAgICByZXR1cm4gdGhpcy5zaW5nbGUoJ3NpbXVsYXRlRXJyb3InLCAodGhpc05vZGUpID0+IHtcbiAgICAgIGlmICh0aGlzTm9kZS5ub2RlVHlwZSA9PT0gJ2hvc3QnKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1NoYWxsb3dXcmFwcGVyOjpzaW11bGF0ZUVycm9yKCkgY2FuIG9ubHkgYmUgY2FsbGVkIG9uIGN1c3RvbSBjb21wb25lbnRzJyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlbmRlcmVyID0gdGhpc1tSRU5ERVJFUl07XG4gICAgICBpZiAodHlwZW9mIHJlbmRlcmVyLnNpbXVsYXRlRXJyb3IgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigneW91ciBhZGFwdGVyIGRvZXMgbm90IHN1cHBvcnQgYHNpbXVsYXRlRXJyb3JgLiBUcnkgdXBncmFkaW5nIGl0IScpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByb290Tm9kZSA9IGdldFJvb3ROb2RlSW50ZXJuYWwodGhpcyk7XG4gICAgICBjb25zdCBub2RlSGllcmFyY2h5ID0gW3RoaXNOb2RlXS5jb25jYXQobm9kZVBhcmVudHModGhpcywgdGhpc05vZGUpKTtcbiAgICAgIHJlbmRlcmVyLnNpbXVsYXRlRXJyb3Iobm9kZUhpZXJhcmNoeSwgcm9vdE5vZGUsIGVycm9yKTtcblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcHJvcHMgaGFzaCBmb3IgdGhlIGN1cnJlbnQgbm9kZSBvZiB0aGUgd3JhcHBlci5cbiAgICpcbiAgICogTk9URTogY2FuIG9ubHkgYmUgY2FsbGVkIG9uIGEgd3JhcHBlciBvZiBhIHNpbmdsZSBub2RlLlxuICAgKlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgKi9cbiAgcHJvcHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuc2luZ2xlKCdwcm9wcycsIHByb3BzT2ZOb2RlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBzdGF0ZSBoYXNoIGZvciB0aGUgcm9vdCBub2RlIG9mIHRoZSB3cmFwcGVyLiBPcHRpb25hbGx5IHBhc3MgaW4gYSBwcm9wIG5hbWUgYW5kIGl0XG4gICAqIHdpbGwgcmV0dXJuIGp1c3QgdGhhdCB2YWx1ZS5cbiAgICpcbiAgICogTk9URTogY2FuIG9ubHkgYmUgY2FsbGVkIG9uIGEgd3JhcHBlciBvZiBhIHNpbmdsZSBub2RlLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAob3B0aW9uYWwpXG4gICAqIEByZXR1cm5zIHsqfVxuICAgKi9cbiAgc3RhdGUobmFtZSkge1xuICAgIGlmICh0aGlzW1JPT1RdICE9PSB0aGlzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NoYWxsb3dXcmFwcGVyOjpzdGF0ZSgpIGNhbiBvbmx5IGJlIGNhbGxlZCBvbiB0aGUgcm9vdCcpO1xuICAgIH1cbiAgICBpZiAodGhpcy5pbnN0YW5jZSgpID09PSBudWxsIHx8IHRoaXNbUkVOREVSRVJdLmdldE5vZGUoKS5ub2RlVHlwZSAhPT0gJ2NsYXNzJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTaGFsbG93V3JhcHBlcjo6c3RhdGUoKSBjYW4gb25seSBiZSBjYWxsZWQgb24gY2xhc3MgY29tcG9uZW50cycpO1xuICAgIH1cbiAgICBjb25zdCBfc3RhdGUgPSB0aGlzLnNpbmdsZSgnc3RhdGUnLCAoKSA9PiB0aGlzLmluc3RhbmNlKCkuc3RhdGUpO1xuICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGlmIChfc3RhdGUgPT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBTaGFsbG93V3JhcHBlcjo6c3RhdGUoXCIke25hbWV9XCIpIHJlcXVpcmVzIHRoYXQgXFxgc3RhdGVcXGAgbm90IGJlIFxcYG51bGxcXGAgb3IgXFxgdW5kZWZpbmVkXFxgYCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gX3N0YXRlW25hbWVdO1xuICAgIH1cbiAgICByZXR1cm4gX3N0YXRlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNvbnRleHQgaGFzaCBmb3IgdGhlIHJvb3Qgbm9kZSBvZiB0aGUgd3JhcHBlci5cbiAgICogT3B0aW9uYWxseSBwYXNzIGluIGEgcHJvcCBuYW1lIGFuZCBpdCB3aWxsIHJldHVybiBqdXN0IHRoYXQgdmFsdWUuXG4gICAqXG4gICAqIE5PVEU6IGNhbiBvbmx5IGJlIGNhbGxlZCBvbiBhIHdyYXBwZXIgb2YgYSBzaW5nbGUgbm9kZS5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJucyB7Kn1cbiAgICovXG4gIGNvbnRleHQobmFtZSkge1xuICAgIGlmICh0aGlzW1JPT1RdICE9PSB0aGlzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NoYWxsb3dXcmFwcGVyOjpjb250ZXh0KCkgY2FuIG9ubHkgYmUgY2FsbGVkIG9uIHRoZSByb290Jyk7XG4gICAgfVxuICAgIGlmICghdGhpc1tPUFRJT05TXS5jb250ZXh0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NoYWxsb3dXcmFwcGVyOjpjb250ZXh0KCkgY2FuIG9ubHkgYmUgY2FsbGVkIG9uIGEgd3JhcHBlciB0aGF0IHdhcyBvcmlnaW5hbGx5IHBhc3NlZCBhIGNvbnRleHQgb3B0aW9uJyk7XG4gICAgfVxuICAgIGlmICh0aGlzLmluc3RhbmNlKCkgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU2hhbGxvd1dyYXBwZXI6OmNvbnRleHQoKSBjYW4gb25seSBiZSBjYWxsZWQgb24gd3JhcHBlZCBub2RlcyB0aGF0IGhhdmUgYSBub24tbnVsbCBpbnN0YW5jZScpO1xuICAgIH1cbiAgICBjb25zdCBfY29udGV4dCA9IHRoaXMuc2luZ2xlKCdjb250ZXh0JywgKCkgPT4gdGhpcy5pbnN0YW5jZSgpLmNvbnRleHQpO1xuICAgIGlmIChuYW1lKSB7XG4gICAgICByZXR1cm4gX2NvbnRleHRbbmFtZV07XG4gICAgfVxuICAgIHJldHVybiBfY29udGV4dDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgbmV3IHdyYXBwZXIgd2l0aCBhbGwgb2YgdGhlIGNoaWxkcmVuIG9mIHRoZSBjdXJyZW50IHdyYXBwZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7RW56eW1lU2VsZWN0b3J9IFtzZWxlY3Rvcl1cbiAgICogQHJldHVybnMge1NoYWxsb3dXcmFwcGVyfVxuICAgKi9cbiAgY2hpbGRyZW4oc2VsZWN0b3IpIHtcbiAgICBjb25zdCBhbGxDaGlsZHJlbiA9IHRoaXMuZmxhdE1hcChuID0+IGNoaWxkcmVuT2ZOb2RlKG4uZ2V0Tm9kZUludGVybmFsKCkpKTtcbiAgICByZXR1cm4gc2VsZWN0b3IgPyBhbGxDaGlsZHJlbi5maWx0ZXIoc2VsZWN0b3IpIDogYWxsQ2hpbGRyZW47XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIG5ldyB3cmFwcGVyIHdpdGggYSBzcGVjaWZpYyBjaGlsZFxuICAgKlxuICAgKiBAcGFyYW0ge051bWJlcn0gW2luZGV4XVxuICAgKiBAcmV0dXJucyB7U2hhbGxvd1dyYXBwZXJ9XG4gICAqL1xuICBjaGlsZEF0KGluZGV4KSB7XG4gICAgcmV0dXJuIHRoaXMuc2luZ2xlKCdjaGlsZEF0JywgKCkgPT4gdGhpcy5jaGlsZHJlbigpLmF0KGluZGV4KSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHdyYXBwZXIgYXJvdW5kIGFsbCBvZiB0aGUgcGFyZW50cy9hbmNlc3RvcnMgb2YgdGhlIHdyYXBwZXIuIERvZXMgbm90IGluY2x1ZGUgdGhlIG5vZGVcbiAgICogaW4gdGhlIGN1cnJlbnQgd3JhcHBlci5cbiAgICpcbiAgICogTk9URTogY2FuIG9ubHkgYmUgY2FsbGVkIG9uIGEgd3JhcHBlciBvZiBhIHNpbmdsZSBub2RlLlxuICAgKlxuICAgKiBAcGFyYW0ge0VuenltZVNlbGVjdG9yfSBbc2VsZWN0b3JdXG4gICAqIEByZXR1cm5zIHtTaGFsbG93V3JhcHBlcn1cbiAgICovXG4gIHBhcmVudHMoc2VsZWN0b3IpIHtcbiAgICByZXR1cm4gdGhpcy5zaW5nbGUoJ3BhcmVudHMnLCAobikgPT4ge1xuICAgICAgY29uc3QgYWxsUGFyZW50cyA9IHRoaXMud3JhcChub2RlUGFyZW50cyh0aGlzLCBuKSk7XG4gICAgICByZXR1cm4gc2VsZWN0b3IgPyBhbGxQYXJlbnRzLmZpbHRlcihzZWxlY3RvcikgOiBhbGxQYXJlbnRzO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB3cmFwcGVyIGFyb3VuZCB0aGUgaW1tZWRpYXRlIHBhcmVudCBvZiB0aGUgY3VycmVudCBub2RlLlxuICAgKlxuICAgKiBAcmV0dXJucyB7U2hhbGxvd1dyYXBwZXJ9XG4gICAqL1xuICBwYXJlbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZmxhdE1hcChuID0+IFtuLnBhcmVudHMoKS5nZXQoMCldKTtcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0ge0VuenltZVNlbGVjdG9yfSBzZWxlY3RvclxuICAgKiBAcmV0dXJucyB7U2hhbGxvd1dyYXBwZXJ9XG4gICAqL1xuICBjbG9zZXN0KHNlbGVjdG9yKSB7XG4gICAgaWYgKHRoaXMuaXMoc2VsZWN0b3IpKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgY29uc3QgbWF0Y2hpbmdBbmNlc3RvcnMgPSB0aGlzLnBhcmVudHMoKS5maWx0ZXIoc2VsZWN0b3IpO1xuICAgIHJldHVybiBtYXRjaGluZ0FuY2VzdG9ycy5sZW5ndGggPiAwID8gbWF0Y2hpbmdBbmNlc3RvcnMuZmlyc3QoKSA6IHRoaXMuZmluZFdoZXJlKCgpID0+IGZhbHNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaGFsbG93IHJlbmRlcnMgdGhlIGN1cnJlbnQgbm9kZSBhbmQgcmV0dXJucyBhIHNoYWxsb3cgd3JhcHBlciBhcm91bmQgaXQuXG4gICAqXG4gICAqIE5PVEU6IGNhbiBvbmx5IGJlIGNhbGxlZCBvbiB3cmFwcGVyIG9mIGEgc2luZ2xlIG5vZGUuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAqIEByZXR1cm5zIHtTaGFsbG93V3JhcHBlcn1cbiAgICovXG4gIHNoYWxsb3cob3B0aW9ucykge1xuICAgIHJldHVybiB0aGlzLnNpbmdsZSgnc2hhbGxvdycsIG4gPT4gKFxuICAgICAgdGhpcy53cmFwKGdldEFkYXB0ZXIodGhpc1tPUFRJT05TXSkubm9kZVRvRWxlbWVudChuKSwgbnVsbCwgb3B0aW9ucylcbiAgICApKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB2YWx1ZSBvZiBwcm9wIHdpdGggdGhlIGdpdmVuIG5hbWUgb2YgdGhlIGN1cnJlbnQgbm9kZS5cbiAgICpcbiAgICogQHBhcmFtIHByb3BOYW1lXG4gICAqIEByZXR1cm5zIHsqfVxuICAgKi9cbiAgcHJvcChwcm9wTmFtZSkge1xuICAgIHJldHVybiB0aGlzLnByb3BzKClbcHJvcE5hbWVdO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gaW52b2tlIGEgZnVuY3Rpb24gcHJvcC5cbiAgICogV2lsbCBpbnZva2UgYW4gZnVuY3Rpb24gcHJvcCBhbmQgcmV0dXJuIGl0cyB2YWx1ZS5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHByb3BOYW1lXG4gICAqIEByZXR1cm5zIHtBbnl9XG4gICAqL1xuICBpbnZva2UocHJvcE5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5zaW5nbGUoJ2ludm9rZScsICgpID0+IHtcbiAgICAgIGNvbnN0IGhhbmRsZXIgPSB0aGlzLnByb3AocHJvcE5hbWUpO1xuICAgICAgaWYgKHR5cGVvZiBoYW5kbGVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1NoYWxsb3dXcmFwcGVyOjppbnZva2UoKSByZXF1aXJlcyB0aGUgbmFtZSBvZiBhIHByb3Agd2hvc2UgdmFsdWUgaXMgYSBmdW5jdGlvbicpO1xuICAgICAgfVxuICAgICAgcmV0dXJuICguLi5hcmdzKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gaGFuZGxlciguLi5hcmdzKTtcbiAgICAgICAgdGhpc1tST09UXS51cGRhdGUoKTtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgd3JhcHBlciBvZiB0aGUgbm9kZSByZW5kZXJlZCBieSB0aGUgcHJvdmlkZWQgcmVuZGVyIHByb3AuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wTmFtZVxuICAgKiBAcmV0dXJucyB7RnVuY3Rpb259XG4gICAqL1xuICByZW5kZXJQcm9wKHByb3BOYW1lKSB7XG4gICAgY29uc3QgYWRhcHRlciA9IGdldEFkYXB0ZXIodGhpc1tPUFRJT05TXSk7XG4gICAgaWYgKHR5cGVvZiBhZGFwdGVyLndyYXAgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCd5b3VyIGFkYXB0ZXIgZG9lcyBub3Qgc3VwcG9ydCBgd3JhcGAuIFRyeSB1cGdyYWRpbmcgaXQhJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuc2luZ2xlKCdyZW5kZXJQcm9wJywgKG4pID0+IHtcbiAgICAgIGlmIChuLm5vZGVUeXBlID09PSAnaG9zdCcpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignU2hhbGxvd1dyYXBwZXI6OnJlbmRlclByb3AoKSBjYW4gb25seSBiZSBjYWxsZWQgb24gY3VzdG9tIGNvbXBvbmVudHMnKTtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgcHJvcE5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1NoYWxsb3dXcmFwcGVyOjpyZW5kZXJQcm9wKCk6IGBwcm9wTmFtZWAgbXVzdCBiZSBhIHN0cmluZycpO1xuICAgICAgfVxuICAgICAgY29uc3QgcHJvcHMgPSB0aGlzLnByb3BzKCk7XG4gICAgICBpZiAoIWhhcyhwcm9wcywgcHJvcE5hbWUpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgU2hhbGxvd1dyYXBwZXI6OnJlbmRlclByb3AoKTogbm8gcHJvcCBjYWxsZWQg4oCcJHtwcm9wTmFtZX3igJwgZm91bmRgKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHByb3BWYWx1ZSA9IHByb3BzW3Byb3BOYW1lXTtcbiAgICAgIGlmICh0eXBlb2YgcHJvcFZhbHVlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYFNoYWxsb3dXcmFwcGVyOjpyZW5kZXJQcm9wKCk6IGV4cGVjdGVkIHByb3Ag4oCcJHtwcm9wTmFtZX3igJwgdG8gY29udGFpbiBhIGZ1bmN0aW9uLCBidXQgaXQgaG9sZHMg4oCcJHt0eXBlb2YgcHJvcFZhbHVlfeKAnGApO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IHByb3BWYWx1ZSguLi5hcmdzKTtcbiAgICAgICAgY29uc3Qgd3JhcHBlZCA9IGFkYXB0ZXIud3JhcChlbGVtZW50KTtcbiAgICAgICAgcmV0dXJuIHRoaXMud3JhcCh3cmFwcGVkLCBudWxsLCB0aGlzW09QVElPTlNdKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUga2V5IGFzc2lnbmVkIHRvIHRoZSBjdXJyZW50IG5vZGUuXG4gICAqXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9XG4gICAqL1xuICBrZXkoKSB7XG4gICAgcmV0dXJuIHRoaXMuc2luZ2xlKCdrZXknLCBuID0+IChuLmtleSA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IG4ua2V5KSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgdHlwZSBvZiB0aGUgY3VycmVudCBub2RlIG9mIHRoaXMgd3JhcHBlci4gSWYgaXQncyBhIGNvbXBvc2l0ZSBjb21wb25lbnQsIHRoaXMgd2lsbFxuICAgKiBiZSB0aGUgY29tcG9uZW50IGNvbnN0cnVjdG9yLiBJZiBpdCdzIGEgbmF0aXZlIERPTSBub2RlLCBpdCB3aWxsIGJlIGEgc3RyaW5nIG9mIHRoZSB0YWcgbmFtZS5cbiAgICogSWYgaXQncyBudWxsLCBpdCB3aWxsIGJlIG51bGwuXG4gICAqXG4gICAqIEByZXR1cm5zIHtTdHJpbmd8RnVuY3Rpb258bnVsbH1cbiAgICovXG4gIHR5cGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuc2luZ2xlKCd0eXBlJywgbiA9PiB0eXBlT2ZOb2RlKG4pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBuYW1lIG9mIHRoZSBjdXJyZW50IG5vZGUgb2YgdGhpcyB3cmFwcGVyLlxuICAgKlxuICAgKiBJbiBvcmRlciBvZiBwcmVjZWRlbmNlID0+IHR5cGUuZGlzcGxheU5hbWUgLT4gdHlwZS5uYW1lIC0+IHR5cGUuXG4gICAqXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9XG4gICAqL1xuICBuYW1lKCkge1xuICAgIGNvbnN0IGFkYXB0ZXIgPSBnZXRBZGFwdGVyKHRoaXNbT1BUSU9OU10pO1xuICAgIHJldHVybiB0aGlzLnNpbmdsZSgnbmFtZScsIG4gPT4gKFxuICAgICAgYWRhcHRlci5kaXNwbGF5TmFtZU9mTm9kZSA/IGFkYXB0ZXIuZGlzcGxheU5hbWVPZk5vZGUobikgOiBkaXNwbGF5TmFtZU9mTm9kZShuKVxuICAgICkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgd2hldGhlciBvciBub3QgdGhlIGN1cnJlbnQgbm9kZSBoYXMgdGhlIGdpdmVuIGNsYXNzIG5hbWUgb3Igbm90LlxuICAgKlxuICAgKiBOT1RFOiBjYW4gb25seSBiZSBjYWxsZWQgb24gYSB3cmFwcGVyIG9mIGEgc2luZ2xlIG5vZGUuXG4gICAqXG4gICAqIEBwYXJhbSBjbGFzc05hbWVcbiAgICogQHJldHVybnMge0Jvb2xlYW59XG4gICAqL1xuICBoYXNDbGFzcyhjbGFzc05hbWUpIHtcbiAgICBpZiAodHlwZW9mIGNsYXNzTmFtZSA9PT0gJ3N0cmluZycgJiYgY2xhc3NOYW1lLmluZGV4T2YoJy4nKSAhPT0gLTEpIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICBjb25zb2xlLndhcm4oJ0l0IGxvb2tzIGxpa2UgeW91XFwncmUgY2FsbGluZyBgU2hhbGxvd1dyYXBwZXI6Omhhc0NsYXNzKClgIHdpdGggYSBDU1Mgc2VsZWN0b3IuIGhhc0NsYXNzKCkgZXhwZWN0cyBhIGNsYXNzIG5hbWUsIG5vdCBhIENTUyBzZWxlY3Rvci4nKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuc2luZ2xlKCdoYXNDbGFzcycsIG4gPT4gaGFzQ2xhc3NOYW1lKG4sIGNsYXNzTmFtZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEl0ZXJhdGVzIHRocm91Z2ggZWFjaCBub2RlIG9mIHRoZSBjdXJyZW50IHdyYXBwZXIgYW5kIGV4ZWN1dGVzIHRoZSBwcm92aWRlZCBmdW5jdGlvbiB3aXRoIGFcbiAgICogd3JhcHBlciBhcm91bmQgdGhlIGNvcnJlc3BvbmRpbmcgbm9kZSBwYXNzZWQgaW4gYXMgdGhlIGZpcnN0IGFyZ3VtZW50LlxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICAgKiBAcmV0dXJucyB7U2hhbGxvd1dyYXBwZXJ9XG4gICAqL1xuICBmb3JFYWNoKGZuKSB7XG4gICAgdGhpcy5nZXROb2Rlc0ludGVybmFsKCkuZm9yRWFjaCgobiwgaSkgPT4gZm4uY2FsbCh0aGlzLCB0aGlzLndyYXAobiksIGkpKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBNYXBzIHRoZSBjdXJyZW50IGFycmF5IG9mIG5vZGVzIHRvIGFub3RoZXIgYXJyYXkuIEVhY2ggbm9kZSBpcyBwYXNzZWQgaW4gYXMgYSBgU2hhbGxvd1dyYXBwZXJgXG4gICAqIHRvIHRoZSBtYXAgZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gICAqIEByZXR1cm5zIHtBcnJheX1cbiAgICovXG4gIG1hcChmbikge1xuICAgIHJldHVybiB0aGlzLmdldE5vZGVzSW50ZXJuYWwoKS5tYXAoKG4sIGkpID0+IGZuLmNhbGwodGhpcywgdGhpcy53cmFwKG4pLCBpKSk7XG4gIH1cblxuICAvKipcbiAgICogUmVkdWNlcyB0aGUgY3VycmVudCBhcnJheSBvZiBub2RlcyB0byBhIHZhbHVlLiBFYWNoIG5vZGUgaXMgcGFzc2VkIGluIGFzIGEgYFNoYWxsb3dXcmFwcGVyYFxuICAgKiB0byB0aGUgcmVkdWNlciBmdW5jdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gLSB0aGUgcmVkdWNlciBmdW5jdGlvblxuICAgKiBAcGFyYW0geyp9IGluaXRpYWxWYWx1ZSAtIHRoZSBpbml0aWFsIHZhbHVlXG4gICAqIEByZXR1cm5zIHsqfVxuICAgKi9cbiAgcmVkdWNlKGZuLCBpbml0aWFsVmFsdWUgPSB1bmRlZmluZWQpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldE5vZGVzSW50ZXJuYWwoKS5yZWR1Y2UoXG4gICAgICAgIChhY2N1bSwgbiwgaSkgPT4gZm4uY2FsbCh0aGlzLCBhY2N1bSwgdGhpcy53cmFwKG4pLCBpKSxcbiAgICAgICAgaW5pdGlhbFZhbHVlLFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZ2V0Tm9kZXNJbnRlcm5hbCgpLnJlZHVjZSgoYWNjdW0sIG4sIGkpID0+IGZuLmNhbGwoXG4gICAgICB0aGlzLFxuICAgICAgaSA9PT0gMSA/IHRoaXMud3JhcChhY2N1bSkgOiBhY2N1bSxcbiAgICAgIHRoaXMud3JhcChuKSxcbiAgICAgIGksXG4gICAgKSk7XG4gIH1cblxuICAvKipcbiAgICogUmVkdWNlcyB0aGUgY3VycmVudCBhcnJheSBvZiBub2RlcyB0byBhbm90aGVyIGFycmF5LCBmcm9tIHJpZ2h0IHRvIGxlZnQuIEVhY2ggbm9kZSBpcyBwYXNzZWRcbiAgICogaW4gYXMgYSBgU2hhbGxvd1dyYXBwZXJgIHRvIHRoZSByZWR1Y2VyIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAtIHRoZSByZWR1Y2VyIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7Kn0gaW5pdGlhbFZhbHVlIC0gdGhlIGluaXRpYWwgdmFsdWVcbiAgICogQHJldHVybnMgeyp9XG4gICAqL1xuICByZWR1Y2VSaWdodChmbiwgaW5pdGlhbFZhbHVlID0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXROb2Rlc0ludGVybmFsKCkucmVkdWNlUmlnaHQoXG4gICAgICAgIChhY2N1bSwgbiwgaSkgPT4gZm4uY2FsbCh0aGlzLCBhY2N1bSwgdGhpcy53cmFwKG4pLCBpKSxcbiAgICAgICAgaW5pdGlhbFZhbHVlLFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZ2V0Tm9kZXNJbnRlcm5hbCgpLnJlZHVjZVJpZ2h0KChhY2N1bSwgbiwgaSkgPT4gZm4uY2FsbChcbiAgICAgIHRoaXMsXG4gICAgICBpID09PSAxID8gdGhpcy53cmFwKGFjY3VtKSA6IGFjY3VtLFxuICAgICAgdGhpcy53cmFwKG4pLFxuICAgICAgaSxcbiAgICApKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgbmV3IHdyYXBwZXIgd2l0aCBhIHN1YnNldCBvZiB0aGUgbm9kZXMgb2YgdGhlIG9yaWdpbmFsIHdyYXBwZXIsIGFjY29yZGluZyB0byB0aGVcbiAgICogcnVsZXMgb2YgYEFycmF5I3NsaWNlYC5cbiAgICpcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGJlZ2luXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBlbmRcbiAgICogQHJldHVybnMge1NoYWxsb3dXcmFwcGVyfVxuICAgKi9cbiAgc2xpY2UoYmVnaW4sIGVuZCkge1xuICAgIHJldHVybiB0aGlzLndyYXAodGhpcy5nZXROb2Rlc0ludGVybmFsKCkuc2xpY2UoYmVnaW4sIGVuZCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgd2hldGhlciBvciBub3QgYW55IG9mIHRoZSBub2RlcyBpbiB0aGUgd3JhcHBlciBtYXRjaCB0aGUgcHJvdmlkZWQgc2VsZWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB7RW56eW1lU2VsZWN0b3J9IHNlbGVjdG9yXG4gICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgKi9cbiAgc29tZShzZWxlY3Rvcikge1xuICAgIGlmICh0aGlzW1JPT1RdID09PSB0aGlzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NoYWxsb3dXcmFwcGVyOjpzb21lKCkgY2FuIG5vdCBiZSBjYWxsZWQgb24gdGhlIHJvb3QnKTtcbiAgICB9XG4gICAgY29uc3QgcHJlZGljYXRlID0gYnVpbGRQcmVkaWNhdGUoc2VsZWN0b3IpO1xuICAgIHJldHVybiB0aGlzLmdldE5vZGVzSW50ZXJuYWwoKS5zb21lKHByZWRpY2F0ZSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIG9yIG5vdCBhbnkgb2YgdGhlIG5vZGVzIGluIHRoZSB3cmFwcGVyIHBhc3MgdGhlIHByb3ZpZGVkIHByZWRpY2F0ZSBmdW5jdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZGljYXRlXG4gICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgKi9cbiAgc29tZVdoZXJlKHByZWRpY2F0ZSkge1xuICAgIHJldHVybiB0aGlzLmdldE5vZGVzSW50ZXJuYWwoKS5zb21lKChuLCBpKSA9PiBwcmVkaWNhdGUuY2FsbCh0aGlzLCB0aGlzLndyYXAobiksIGkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHdoZXRoZXIgb3Igbm90IGFsbCBvZiB0aGUgbm9kZXMgaW4gdGhlIHdyYXBwZXIgbWF0Y2ggdGhlIHByb3ZpZGVkIHNlbGVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0ge0VuenltZVNlbGVjdG9yfSBzZWxlY3RvclxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICovXG4gIGV2ZXJ5KHNlbGVjdG9yKSB7XG4gICAgY29uc3QgcHJlZGljYXRlID0gYnVpbGRQcmVkaWNhdGUoc2VsZWN0b3IpO1xuICAgIHJldHVybiB0aGlzLmdldE5vZGVzSW50ZXJuYWwoKS5ldmVyeShwcmVkaWNhdGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgd2hldGhlciBvciBub3QgYW55IG9mIHRoZSBub2RlcyBpbiB0aGUgd3JhcHBlciBwYXNzIHRoZSBwcm92aWRlZCBwcmVkaWNhdGUgZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWRpY2F0ZVxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICovXG4gIGV2ZXJ5V2hlcmUocHJlZGljYXRlKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Tm9kZXNJbnRlcm5hbCgpLmV2ZXJ5KChuLCBpKSA9PiBwcmVkaWNhdGUuY2FsbCh0aGlzLCB0aGlzLndyYXAobiksIGkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVdGlsaXR5IG1ldGhvZCB1c2VkIHRvIGNyZWF0ZSBuZXcgd3JhcHBlcnMgd2l0aCBhIG1hcHBpbmcgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGFuIGFycmF5IG9mXG4gICAqIG5vZGVzIGluIHJlc3BvbnNlIHRvIGEgc2luZ2xlIG5vZGUgd3JhcHBlci4gVGhlIHJldHVybmVkIHdyYXBwZXIgaXMgYSBzaW5nbGUgd3JhcHBlciBhcm91bmRcbiAgICogYWxsIG9mIHRoZSBtYXBwZWQgbm9kZXMgZmxhdHRlbmVkIChhbmQgZGUtZHVwbGljYXRlZCkuXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gICAqIEByZXR1cm5zIHtTaGFsbG93V3JhcHBlcn1cbiAgICovXG4gIGZsYXRNYXAoZm4pIHtcbiAgICBjb25zdCBub2RlcyA9IHRoaXMuZ2V0Tm9kZXNJbnRlcm5hbCgpLm1hcCgobiwgaSkgPT4gZm4uY2FsbCh0aGlzLCB0aGlzLndyYXAobiksIGkpKTtcbiAgICBjb25zdCBmbGF0dGVuZWQgPSBmbGF0KG5vZGVzLCAxKTtcbiAgICByZXR1cm4gdGhpcy53cmFwKGZsYXR0ZW5lZC5maWx0ZXIoQm9vbGVhbikpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmRzIGFsbCBub2RlcyBpbiB0aGUgY3VycmVudCB3cmFwcGVyIG5vZGVzJyByZW5kZXIgdHJlZXMgdGhhdCBtYXRjaCB0aGUgcHJvdmlkZWQgcHJlZGljYXRlXG4gICAqIGZ1bmN0aW9uLiBUaGUgcHJlZGljYXRlIGZ1bmN0aW9uIHdpbGwgcmVjZWl2ZSB0aGUgbm9kZXMgaW5zaWRlIGEgU2hhbGxvd1dyYXBwZXIgYXMgaXRzXG4gICAqIGZpcnN0IGFyZ3VtZW50LlxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkaWNhdGVcbiAgICogQHJldHVybnMge1NoYWxsb3dXcmFwcGVyfVxuICAgKi9cbiAgZmluZFdoZXJlKHByZWRpY2F0ZSkge1xuICAgIHJldHVybiBmaW5kV2hlcmVVbndyYXBwZWQodGhpcywgKG4pID0+IHtcbiAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLndyYXAobik7XG4gICAgICByZXR1cm4gbm9kZS5sZW5ndGggPiAwICYmIHByZWRpY2F0ZShub2RlKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBub2RlIGF0IGEgZ2l2ZW4gaW5kZXggb2YgdGhlIGN1cnJlbnQgd3JhcHBlci5cbiAgICpcbiAgICogQHBhcmFtIGluZGV4XG4gICAqIEByZXR1cm5zIHtSZWFjdEVsZW1lbnR9XG4gICAqL1xuICBnZXQoaW5kZXgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRFbGVtZW50cygpW2luZGV4XTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgd3JhcHBlciBhcm91bmQgdGhlIG5vZGUgYXQgYSBnaXZlbiBpbmRleCBvZiB0aGUgY3VycmVudCB3cmFwcGVyLlxuICAgKlxuICAgKiBAcGFyYW0gaW5kZXhcbiAgICogQHJldHVybnMge1NoYWxsb3dXcmFwcGVyfVxuICAgKi9cbiAgYXQoaW5kZXgpIHtcbiAgICBjb25zdCBub2RlcyA9IHRoaXMuZ2V0Tm9kZXNJbnRlcm5hbCgpO1xuICAgIGlmIChpbmRleCA8IG5vZGVzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHRoaXMud3JhcChub2Rlc1tpbmRleF0pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy53cmFwKFtdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgd3JhcHBlciBhcm91bmQgdGhlIGZpcnN0IG5vZGUgb2YgdGhlIGN1cnJlbnQgd3JhcHBlci5cbiAgICpcbiAgICogQHJldHVybnMge1NoYWxsb3dXcmFwcGVyfVxuICAgKi9cbiAgZmlyc3QoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXQoMCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHdyYXBwZXIgYXJvdW5kIHRoZSBsYXN0IG5vZGUgb2YgdGhlIGN1cnJlbnQgd3JhcHBlci5cbiAgICpcbiAgICogQHJldHVybnMge1NoYWxsb3dXcmFwcGVyfVxuICAgKi9cbiAgbGFzdCgpIHtcbiAgICByZXR1cm4gdGhpcy5hdCh0aGlzLmxlbmd0aCAtIDEpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGVnYXRlcyB0byBleGlzdHMoKVxuICAgKlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICovXG4gIGlzRW1wdHkoKSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICBjb25zb2xlLndhcm4oJ0VuenltZTo6RGVwcmVjYXRlZCBtZXRob2QgaXNFbXB0eSgpIGNhbGxlZCwgdXNlIGV4aXN0cygpIGluc3RlYWQuJyk7XG4gICAgcmV0dXJuICF0aGlzLmV4aXN0cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgY3VycmVudCB3cmFwcGVyIGhhcyBub2Rlcy4gRmFsc2Ugb3RoZXJ3aXNlLlxuICAgKiBJZiBjYWxsZWQgd2l0aCBhIHNlbGVjdG9yIGl0IHJldHVybnMgYC5maW5kKHNlbGVjdG9yKS5leGlzdHMoKWAgaW5zdGVhZC5cbiAgICpcbiAgICogQHBhcmFtIHtFbnp5bWVTZWxlY3Rvcn0gc2VsZWN0b3IgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICovXG4gIGV4aXN0cyhzZWxlY3RvciA9IG51bGwpIHtcbiAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA+IDAgPyB0aGlzLmZpbmQoc2VsZWN0b3IpLmV4aXN0cygpIDogdGhpcy5sZW5ndGggPiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIFV0aWxpdHkgbWV0aG9kIHRoYXQgdGhyb3dzIGFuIGVycm9yIGlmIHRoZSBjdXJyZW50IGluc3RhbmNlIGhhcyBhIGxlbmd0aCBvdGhlciB0aGFuIG9uZS5cbiAgICogVGhpcyBpcyBwcmltYXJpbHkgdXNlZCB0byBlbmZvcmNlIHRoYXQgY2VydGFpbiBtZXRob2RzIGFyZSBvbmx5IHJ1biBvbiBhIHdyYXBwZXIgd2hlbiBpdCBpc1xuICAgKiB3cmFwcGluZyBhIHNpbmdsZSBub2RlLlxuICAgKlxuICAgKiBAcGFyYW0gZm5cbiAgICogQHJldHVybnMgeyp9XG4gICAqL1xuICBzaW5nbGUobmFtZSwgZm4pIHtcbiAgICBjb25zdCBmbk5hbWUgPSB0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycgPyBuYW1lIDogJ3Vua25vd24nO1xuICAgIGNvbnN0IGNhbGxiYWNrID0gdHlwZW9mIGZuID09PSAnZnVuY3Rpb24nID8gZm4gOiBuYW1lO1xuICAgIGlmICh0aGlzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBNZXRob2Qg4oCcJHtmbk5hbWV94oCdIGlzIG1lYW50IHRvIGJlIHJ1biBvbiAxIG5vZGUuICR7dGhpcy5sZW5ndGh9IGZvdW5kIGluc3RlYWQuYCk7XG4gICAgfVxuICAgIHJldHVybiBjYWxsYmFjay5jYWxsKHRoaXMsIHRoaXMuZ2V0Tm9kZUludGVybmFsKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBmdWwgdXRpbGl0eSBtZXRob2QgdG8gY3JlYXRlIGEgbmV3IHdyYXBwZXIgd2l0aCB0aGUgc2FtZSByb290IGFzIHRoZSBjdXJyZW50IHdyYXBwZXIsIHdpdGhcbiAgICogYW55IG5vZGVzIHBhc3NlZCBpbiBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyIGF1dG9tYXRpY2FsbHkgd3JhcHBlZC5cbiAgICpcbiAgICogQHBhcmFtIG5vZGVcbiAgICogQHJldHVybnMge1NoYWxsb3dXcmFwcGVyfVxuICAgKi9cbiAgd3JhcChub2RlLCByb290ID0gdGhpc1tST09UXSwgLi4uYXJncykge1xuICAgIGlmIChub2RlIGluc3RhbmNlb2YgU2hhbGxvd1dyYXBwZXIpIHtcbiAgICAgIHJldHVybiBub2RlO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFNoYWxsb3dXcmFwcGVyKG5vZGUsIHJvb3QsIC4uLmFyZ3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gSFRNTC1saWtlIHN0cmluZyBvZiB0aGUgc2hhbGxvdyByZW5kZXIgZm9yIGRlYnVnZ2luZyBwdXJwb3Nlcy5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIFByb3BlcnR5IGJhZyBvZiBhZGRpdGlvbmFsIG9wdGlvbnMuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuaWdub3JlUHJvcHNdIC0gaWYgdHJ1ZSwgcHJvcHMgYXJlIG9taXR0ZWQgZnJvbSB0aGUgc3RyaW5nLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnZlcmJvc2VdIC0gaWYgdHJ1ZSwgYXJyYXlzIGFuZCBvYmplY3RzIHRvIGJlIHZlcmJvc2VseSBwcmludGVkLlxuICAgKiBAcmV0dXJucyB7U3RyaW5nfVxuICAgKi9cbiAgZGVidWcob3B0aW9ucyA9IHt9KSB7XG4gICAgcmV0dXJuIGRlYnVnTm9kZXModGhpcy5nZXROb2Rlc0ludGVybmFsKCksIG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEludm9rZXMgaW50ZXJjZXB0ZXIgYW5kIHJldHVybnMgaXRzZWxmLiBpbnRlcmNlcHRlciBpcyBjYWxsZWQgd2l0aCBpdHNlbGYuXG4gICAqIFRoaXMgaXMgaGVscGZ1bCB3aGVuIGRlYnVnZ2luZyBub2RlcyBpbiBtZXRob2QgY2hhaW5zLlxuICAgKiBAcGFyYW0gZm5cbiAgICogQHJldHVybnMge1NoYWxsb3dXcmFwcGVyfVxuICAgKi9cbiAgdGFwKGludGVyY2VwdGVyKSB7XG4gICAgaW50ZXJjZXB0ZXIodGhpcyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogUHJpbWFyaWx5IHVzZWZ1bCBmb3IgSE9DcyAoaGlnaGVyLW9yZGVyIGNvbXBvbmVudHMpLCB0aGlzIG1ldGhvZCBtYXkgb25seSBiZVxuICAgKiBydW4gb24gYSBzaW5nbGUsIG5vbi1ET00gbm9kZSwgYW5kIHdpbGwgcmV0dXJuIHRoZSBub2RlLCBzaGFsbG93LXJlbmRlcmVkLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgKiBAcmV0dXJucyB7U2hhbGxvd1dyYXBwZXJ9XG4gICAqL1xuICBkaXZlKG9wdGlvbnMgPSB7fSkge1xuICAgIGNvbnN0IGFkYXB0ZXIgPSBnZXRBZGFwdGVyKHRoaXNbT1BUSU9OU10pO1xuICAgIGNvbnN0IG5hbWUgPSAnZGl2ZSc7XG4gICAgcmV0dXJuIHRoaXMuc2luZ2xlKG5hbWUsIChuKSA9PiB7XG4gICAgICBpZiAobiAmJiBuLm5vZGVUeXBlID09PSAnaG9zdCcpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgU2hhbGxvd1dyYXBwZXI6OiR7bmFtZX0oKSBjYW4gbm90IGJlIGNhbGxlZCBvbiBIb3N0IENvbXBvbmVudHNgKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGVsID0gZ2V0QWRhcHRlcih0aGlzW09QVElPTlNdKS5ub2RlVG9FbGVtZW50KG4pO1xuICAgICAgaWYgKCFpc0N1c3RvbUNvbXBvbmVudEVsZW1lbnQoZWwsIGFkYXB0ZXIpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYFNoYWxsb3dXcmFwcGVyOjoke25hbWV9KCkgY2FuIG9ubHkgYmUgY2FsbGVkIG9uIGNvbXBvbmVudHNgKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGNoaWxkT3B0aW9ucyA9IHtcbiAgICAgICAgLi4udGhpc1tPUFRJT05TXSxcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgY29udGV4dDogb3B0aW9ucy5jb250ZXh0IHx8IHtcbiAgICAgICAgICAuLi50aGlzW09QVElPTlNdLmNvbnRleHQsXG4gICAgICAgICAgLi4udGhpc1tST09UXVtDSElMRF9DT05URVhUXSxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgICBwcml2YXRlU2V0KGNoaWxkT3B0aW9ucywgUFJPVklERVJfVkFMVUVTLCB0aGlzW1JPT1RdW1BST1ZJREVSX1ZBTFVFU10pO1xuICAgICAgcmV0dXJuIHRoaXMud3JhcChlbCwgbnVsbCwgY2hpbGRPcHRpb25zKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdHJpcHMgb3V0IGFsbCB0aGUgbm90IGhvc3Qtbm9kZXMgZnJvbSB0aGUgbGlzdCBvZiBub2Rlc1xuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBpcyB1c2VmdWwgaWYgeW91IHdhbnQgdG8gY2hlY2sgZm9yIHRoZSBwcmVzZW5jZSBvZiBob3N0IG5vZGVzXG4gICAqIChhY3R1YWxseSByZW5kZXJlZCBIVE1MIGVsZW1lbnRzKSBpZ25vcmluZyB0aGUgUmVhY3Qgbm9kZXMuXG4gICAqL1xuICBob3N0Tm9kZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZmlsdGVyV2hlcmUobiA9PiB0eXBlb2Ygbi50eXBlKCkgPT09ICdzdHJpbmcnKTtcbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIGNvbnRleHQgb2YgdGhlIHByaW1hcnkgd3JhcHBlciB3aGVuIHRoZVxuICogYHdyYXBwaW5nQ29tcG9uZW50YCByZS1yZW5kZXJzLlxuICovXG5mdW5jdGlvbiB1cGRhdGVQcmltYXJ5Um9vdENvbnRleHQod3JhcHBpbmdDb21wb25lbnQpIHtcbiAgY29uc3QgYWRhcHRlciA9IGdldEFkYXB0ZXIod3JhcHBpbmdDb21wb25lbnRbT1BUSU9OU10pO1xuICBjb25zdCBwcmltYXJ5V3JhcHBlciA9IHdyYXBwaW5nQ29tcG9uZW50W1BSSU1BUllfV1JBUFBFUl07XG4gIGNvbnN0IHByaW1hcnlSZW5kZXJlciA9IHByaW1hcnlXcmFwcGVyW1JFTkRFUkVSXTtcbiAgY29uc3QgcHJpbWFyeU5vZGUgPSBwcmltYXJ5UmVuZGVyZXIuZ2V0Tm9kZSgpO1xuICBjb25zdCB7XG4gICAgbGVnYWN5Q29udGV4dCxcbiAgICBwcm92aWRlclZhbHVlcyxcbiAgfSA9IGdldENvbnRleHRGcm9tV3JhcHBpbmdDb21wb25lbnQod3JhcHBpbmdDb21wb25lbnQsIGFkYXB0ZXIpO1xuICBjb25zdCBwcmV2UHJvdmlkZXJWYWx1ZXMgPSBwcmltYXJ5V3JhcHBlcltQUk9WSURFUl9WQUxVRVNdO1xuXG4gIHByaW1hcnlXcmFwcGVyLnNldENvbnRleHQoe1xuICAgIC4uLndyYXBwaW5nQ29tcG9uZW50W1BSSU1BUllfV1JBUFBFUl1bT1BUSU9OU10uY29udGV4dCxcbiAgICAuLi5sZWdhY3lDb250ZXh0LFxuICB9KTtcbiAgcHJpbWFyeVdyYXBwZXJbUFJPVklERVJfVkFMVUVTXSA9IG5ldyBNYXAoWy4uLnByZXZQcm92aWRlclZhbHVlcywgLi4ucHJvdmlkZXJWYWx1ZXNdKTtcblxuICBpZiAodHlwZW9mIGFkYXB0ZXIuaXNDb250ZXh0Q29uc3VtZXIgPT09ICdmdW5jdGlvbicgJiYgYWRhcHRlci5pc0NvbnRleHRDb25zdW1lcihwcmltYXJ5Tm9kZS50eXBlKSkge1xuICAgIGNvbnN0IENvbnN1bWVyID0gcHJpbWFyeU5vZGUudHlwZTtcbiAgICAvLyBBZGFwdGVycyB3aXRoIGFuIGBpc0NvbnRleHRDb25zdW1lcmAgbWV0aG9kIHdpbGwgZGVmaW5pdGVseSBoYXZlIGEgYGdldFByb3ZpZGVyRnJvbUNvbnN1bWVyYFxuICAgIC8vIG1ldGhvZC5cbiAgICBjb25zdCBQcm92aWRlciA9IGFkYXB0ZXIuZ2V0UHJvdmlkZXJGcm9tQ29uc3VtZXIoQ29uc3VtZXIpO1xuICAgIGNvbnN0IG5ld1ZhbHVlID0gcHJvdmlkZXJWYWx1ZXMuZ2V0KFByb3ZpZGVyKTtcbiAgICBjb25zdCBvbGRWYWx1ZSA9IHByZXZQcm92aWRlclZhbHVlcy5nZXQoUHJvdmlkZXIpO1xuXG4gICAgLy8gVXNlIHJlZmVyZW50aWFsIGNvbXBhcmlzb24gbGlrZSBSZWFjdFxuICAgIGlmIChuZXdWYWx1ZSAhPT0gb2xkVmFsdWUpIHtcbiAgICAgIHByaW1hcnlXcmFwcGVyLnJlcmVuZGVyKCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQSAqc3BlY2lhbCogXCJyb290XCIgd3JhcHBlciB0aGF0IHJlcHJlc2VudHMgdGhlIGNvbXBvbmVudCBwYXNzZWQgYXMgYHdyYXBwaW5nQ29tcG9uZW50YC5cbiAqIEl0IGlzIGxpbmtlZCB0byB0aGUgcHJpbWFyeSByb290IHN1Y2ggdGhhdCB1cGRhdGVzIHRvIGl0IHdpbGwgdXBkYXRlIHRoZSBwcmltYXJ5LlxuICpcbiAqIEBjbGFzcyBXcmFwcGluZ0NvbXBvbmVudFdyYXBwZXJcbiAqL1xuY2xhc3MgV3JhcHBpbmdDb21wb25lbnRXcmFwcGVyIGV4dGVuZHMgU2hhbGxvd1dyYXBwZXIge1xuICBjb25zdHJ1Y3Rvcihub2Rlcywgcm9vdCwgUm9vdEZpbmRlcikge1xuICAgIHN1cGVyKG5vZGVzKTtcbiAgICBwcml2YXRlU2V0KHRoaXMsIFBSSU1BUllfV1JBUFBFUiwgcm9vdCk7XG4gICAgcHJpdmF0ZVNldCh0aGlzLCBST09UX0ZJTkRFUiwgUm9vdEZpbmRlcik7XG4gIH1cblxuICAvKipcbiAgICogTGlrZSByZXJlbmRlcigpIG9uIFNoYWxsb3dXcmFwcGVyLCBleGNlcHQgaXQgYWxzbyBkb2VzIGEgXCJmdWxsIHJlbmRlclwiIG9mXG4gICAqIGl0c2VsZiBhbmQgdXBkYXRlcyB0aGUgcHJpbWFyeSBTaGFsbG93V3JhcHBlcidzIGNvbnRleHQuXG4gICAqL1xuICByZXJlbmRlciguLi5hcmdzKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gc3VwZXIucmVyZW5kZXIoLi4uYXJncyk7XG4gICAgdXBkYXRlUHJpbWFyeVJvb3RDb250ZXh0KHRoaXMpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogTGlrZSBzZXRTdGF0ZSgpIG9uIFNoYWxsb3dXcmFwcGVyLCBleGNlcHQgaXQgYWxzbyBkb2VzIGEgXCJmdWxsIHJlbmRlclwiIG9mXG4gICAqIGl0c2VsZiBhbmQgdXBkYXRlcyB0aGUgcHJpbWFyeSBTaGFsbG93V3JhcHBlcidzIGNvbnRleHQuXG4gICAqL1xuICBzZXRTdGF0ZSguLi5hcmdzKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gc3VwZXIuc2V0U3RhdGUoLi4uYXJncyk7XG4gICAgdXBkYXRlUHJpbWFyeVJvb3RDb250ZXh0KHRoaXMpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY2xhc3MtbWV0aG9kcy11c2UtdGhpc1xuICBnZXRXcmFwcGluZ0NvbXBvbmVudCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1NoYWxsb3dXcmFwcGVyOjpnZXRXcmFwcGluZ0NvbXBvbmVudCgpIGNhbiBvbmx5IGJlIGNhbGxlZCBvbiB0aGUgcm9vdCcpO1xuICB9XG59XG5cbmlmIChJVEVSQVRPUl9TWU1CT0wpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNoYWxsb3dXcmFwcGVyLnByb3RvdHlwZSwgSVRFUkFUT1JfU1lNQk9MLCB7XG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBpdGVyYXRvcigpIHtcbiAgICAgIGNvbnN0IGl0ZXIgPSB0aGlzLmdldE5vZGVzSW50ZXJuYWwoKVtJVEVSQVRPUl9TWU1CT0xdKCk7XG4gICAgICBjb25zdCBhZGFwdGVyID0gZ2V0QWRhcHRlcih0aGlzW09QVElPTlNdKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIFtJVEVSQVRPUl9TWU1CT0xdKCkgeyByZXR1cm4gdGhpczsgfSxcbiAgICAgICAgbmV4dCgpIHtcbiAgICAgICAgICBjb25zdCBuZXh0ID0gaXRlci5uZXh0KCk7XG4gICAgICAgICAgaWYgKG5leHQuZG9uZSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgZG9uZTogdHJ1ZSB9O1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZG9uZTogZmFsc2UsXG4gICAgICAgICAgICB2YWx1ZTogYWRhcHRlci5ub2RlVG9FbGVtZW50KG5leHQudmFsdWUpLFxuICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgIH0sXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBwcml2YXRlV2FybmluZyhwcm9wLCBleHRyYU1lc3NhZ2UpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNoYWxsb3dXcmFwcGVyLnByb3RvdHlwZSwgcHJvcCwge1xuICAgIGdldCgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgXG4gICAgICAgIEF0dGVtcHRlZCB0byBhY2Nlc3MgU2hhbGxvd1dyYXBwZXI6OiR7cHJvcH0sIHdoaWNoIHdhcyBwcmV2aW91c2x5IGEgcHJpdmF0ZSBwcm9wZXJ0eSBvblxuICAgICAgICBFbnp5bWUgU2hhbGxvd1dyYXBwZXIgaW5zdGFuY2VzLCBidXQgaXMgbm8gbG9uZ2VyIGFuZCBzaG91bGQgbm90IGJlIHJlbGllZCB1cG9uLlxuICAgICAgICAke2V4dHJhTWVzc2FnZX1cbiAgICAgIGApO1xuICAgIH0sXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgfSk7XG59XG5cbnByaXZhdGVXYXJuaW5nKCdub2RlJywgJ0NvbnNpZGVyIHVzaW5nIHRoZSBnZXRFbGVtZW50KCkgbWV0aG9kIGluc3RlYWQuJyk7XG5wcml2YXRlV2FybmluZygnbm9kZXMnLCAnQ29uc2lkZXIgdXNpbmcgdGhlIGdldEVsZW1lbnRzKCkgbWV0aG9kIGluc3RlYWQuJyk7XG5wcml2YXRlV2FybmluZygncmVuZGVyZXInLCAnJyk7XG5wcml2YXRlV2FybmluZygnb3B0aW9ucycsICcnKTtcbnByaXZhdGVXYXJuaW5nKCdjb21wbGV4U2VsZWN0b3InLCAnJyk7XG5cbmV4cG9ydCBkZWZhdWx0IFNoYWxsb3dXcmFwcGVyO1xuIl19
//# sourceMappingURL=ShallowWrapper.js.map