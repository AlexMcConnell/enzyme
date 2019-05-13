'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function unimplementedError(methodName, classname) {
  return new Error(String(methodName) + ' is a required method of ' + String(classname) + ', but was not implemented.');
}

var EnzymeAdapter = function () {
  function EnzymeAdapter() {
    _classCallCheck(this, EnzymeAdapter);

    this.options = {};
  }

  // Provided a bag of options, return an `EnzymeRenderer`. Some options can be implementation
  // specific, like `attach` etc. for React, but not part of this interface explicitly.
  // eslint-disable-next-line class-methods-use-this, no-unused-vars


  _createClass(EnzymeAdapter, [{
    key: 'createRenderer',
    value: function () {
      function createRenderer(options) {
        throw unimplementedError('createRenderer', 'EnzymeAdapter');
      }

      return createRenderer;
    }()

    // converts an RSTNode to the corresponding JSX Pragma Element. This will be needed
    // in order to implement the `Wrapper.mount()` and `Wrapper.shallow()` methods, but should
    // be pretty straightforward for people to implement.
    // eslint-disable-next-line class-methods-use-this, no-unused-vars

  }, {
    key: 'nodeToElement',
    value: function () {
      function nodeToElement(node) {
        throw unimplementedError('nodeToElement', 'EnzymeAdapter');
      }

      return nodeToElement;
    }()

    // eslint-disable-next-line class-methods-use-this, no-unused-vars

  }, {
    key: 'isValidElement',
    value: function () {
      function isValidElement(element) {
        throw unimplementedError('isValidElement', 'EnzymeAdapter');
      }

      return isValidElement;
    }()

    // eslint-disable-next-line class-methods-use-this, no-unused-vars

  }, {
    key: 'createElement',
    value: function () {
      function createElement(type, props) {
        throw unimplementedError('createElement', 'EnzymeAdapter');
      }

      return createElement;
    }()

    // eslint-disable-next-line class-methods-use-this

  }, {
    key: 'invokeSetStateCallback',
    value: function () {
      function invokeSetStateCallback(instance, callback) {
        callback.call(instance);
      }

      return invokeSetStateCallback;
    }()
  }]);

  return EnzymeAdapter;
}();

EnzymeAdapter.MODES = {
  STRING: 'string',
  MOUNT: 'mount',
  SHALLOW: 'shallow'
};

module.exports = EnzymeAdapter;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Fbnp5bWVBZGFwdGVyLmpzIl0sIm5hbWVzIjpbInVuaW1wbGVtZW50ZWRFcnJvciIsIm1ldGhvZE5hbWUiLCJjbGFzc25hbWUiLCJFcnJvciIsIkVuenltZUFkYXB0ZXIiLCJvcHRpb25zIiwibm9kZSIsImVsZW1lbnQiLCJ0eXBlIiwicHJvcHMiLCJpbnN0YW5jZSIsImNhbGxiYWNrIiwiY2FsbCIsIk1PREVTIiwiU1RSSU5HIiwiTU9VTlQiLCJTSEFMTE9XIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsU0FBU0Esa0JBQVQsQ0FBNEJDLFVBQTVCLEVBQXdDQyxTQUF4QyxFQUFtRDtBQUNqRCxTQUFPLElBQUlDLEtBQUosUUFBYUYsVUFBYix5Q0FBbURDLFNBQW5ELGlDQUFQO0FBQ0Q7O0lBRUtFLGE7QUFDSiwyQkFBYztBQUFBOztBQUNaLFNBQUtDLE9BQUwsR0FBZSxFQUFmO0FBQ0Q7O0FBRUQ7QUFDQTtBQUNBOzs7Ozs7OEJBQ2VBLE8sRUFBUztBQUN0QixjQUFNTCxtQkFBbUIsZ0JBQW5CLEVBQXFDLGVBQXJDLENBQU47QUFDRDs7Ozs7QUFFRDtBQUNBO0FBQ0E7QUFDQTs7Ozs7NkJBQ2NNLEksRUFBTTtBQUNsQixjQUFNTixtQkFBbUIsZUFBbkIsRUFBb0MsZUFBcEMsQ0FBTjtBQUNEOzs7OztBQUVEOzs7Ozs4QkFDZU8sTyxFQUFTO0FBQ3RCLGNBQU1QLG1CQUFtQixnQkFBbkIsRUFBcUMsZUFBckMsQ0FBTjtBQUNEOzs7OztBQUVEOzs7Ozs2QkFDY1EsSSxFQUFNQyxLLEVBQW9CO0FBQ3RDLGNBQU1ULG1CQUFtQixlQUFuQixFQUFvQyxlQUFwQyxDQUFOO0FBQ0Q7Ozs7O0FBRUQ7Ozs7O3NDQUN1QlUsUSxFQUFVQyxRLEVBQVU7QUFDekNBLGlCQUFTQyxJQUFULENBQWNGLFFBQWQ7QUFDRDs7Ozs7Ozs7O0FBR0hOLGNBQWNTLEtBQWQsR0FBc0I7QUFDcEJDLFVBQVEsUUFEWTtBQUVwQkMsU0FBTyxPQUZhO0FBR3BCQyxXQUFTO0FBSFcsQ0FBdEI7O0FBTUFDLE9BQU9DLE9BQVAsR0FBaUJkLGFBQWpCIiwiZmlsZSI6IkVuenltZUFkYXB0ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiB1bmltcGxlbWVudGVkRXJyb3IobWV0aG9kTmFtZSwgY2xhc3NuYW1lKSB7XG4gIHJldHVybiBuZXcgRXJyb3IoYCR7bWV0aG9kTmFtZX0gaXMgYSByZXF1aXJlZCBtZXRob2Qgb2YgJHtjbGFzc25hbWV9LCBidXQgd2FzIG5vdCBpbXBsZW1lbnRlZC5gKTtcbn1cblxuY2xhc3MgRW56eW1lQWRhcHRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMub3B0aW9ucyA9IHt9O1xuICB9XG5cbiAgLy8gUHJvdmlkZWQgYSBiYWcgb2Ygb3B0aW9ucywgcmV0dXJuIGFuIGBFbnp5bWVSZW5kZXJlcmAuIFNvbWUgb3B0aW9ucyBjYW4gYmUgaW1wbGVtZW50YXRpb25cbiAgLy8gc3BlY2lmaWMsIGxpa2UgYGF0dGFjaGAgZXRjLiBmb3IgUmVhY3QsIGJ1dCBub3QgcGFydCBvZiB0aGlzIGludGVyZmFjZSBleHBsaWNpdGx5LlxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY2xhc3MtbWV0aG9kcy11c2UtdGhpcywgbm8tdW51c2VkLXZhcnNcbiAgY3JlYXRlUmVuZGVyZXIob3B0aW9ucykge1xuICAgIHRocm93IHVuaW1wbGVtZW50ZWRFcnJvcignY3JlYXRlUmVuZGVyZXInLCAnRW56eW1lQWRhcHRlcicpO1xuICB9XG5cbiAgLy8gY29udmVydHMgYW4gUlNUTm9kZSB0byB0aGUgY29ycmVzcG9uZGluZyBKU1ggUHJhZ21hIEVsZW1lbnQuIFRoaXMgd2lsbCBiZSBuZWVkZWRcbiAgLy8gaW4gb3JkZXIgdG8gaW1wbGVtZW50IHRoZSBgV3JhcHBlci5tb3VudCgpYCBhbmQgYFdyYXBwZXIuc2hhbGxvdygpYCBtZXRob2RzLCBidXQgc2hvdWxkXG4gIC8vIGJlIHByZXR0eSBzdHJhaWdodGZvcndhcmQgZm9yIHBlb3BsZSB0byBpbXBsZW1lbnQuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjbGFzcy1tZXRob2RzLXVzZS10aGlzLCBuby11bnVzZWQtdmFyc1xuICBub2RlVG9FbGVtZW50KG5vZGUpIHtcbiAgICB0aHJvdyB1bmltcGxlbWVudGVkRXJyb3IoJ25vZGVUb0VsZW1lbnQnLCAnRW56eW1lQWRhcHRlcicpO1xuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNsYXNzLW1ldGhvZHMtdXNlLXRoaXMsIG5vLXVudXNlZC12YXJzXG4gIGlzVmFsaWRFbGVtZW50KGVsZW1lbnQpIHtcbiAgICB0aHJvdyB1bmltcGxlbWVudGVkRXJyb3IoJ2lzVmFsaWRFbGVtZW50JywgJ0VuenltZUFkYXB0ZXInKTtcbiAgfVxuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjbGFzcy1tZXRob2RzLXVzZS10aGlzLCBuby11bnVzZWQtdmFyc1xuICBjcmVhdGVFbGVtZW50KHR5cGUsIHByb3BzLCAuLi5jaGlsZHJlbikge1xuICAgIHRocm93IHVuaW1wbGVtZW50ZWRFcnJvcignY3JlYXRlRWxlbWVudCcsICdFbnp5bWVBZGFwdGVyJyk7XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY2xhc3MtbWV0aG9kcy11c2UtdGhpc1xuICBpbnZva2VTZXRTdGF0ZUNhbGxiYWNrKGluc3RhbmNlLCBjYWxsYmFjaykge1xuICAgIGNhbGxiYWNrLmNhbGwoaW5zdGFuY2UpO1xuICB9XG59XG5cbkVuenltZUFkYXB0ZXIuTU9ERVMgPSB7XG4gIFNUUklORzogJ3N0cmluZycsXG4gIE1PVU5UOiAnbW91bnQnLFxuICBTSEFMTE9XOiAnc2hhbGxvdycsXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVuenltZUFkYXB0ZXI7XG4iXX0=
//# sourceMappingURL=EnzymeAdapter.js.map