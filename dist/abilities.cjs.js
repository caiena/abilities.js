'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

require('core-js/modules/es6.object.assign');
require('core-js/modules/web.dom.iterable');
require('core-js/modules/es6.regexp.to-string');
var _classCallCheck = _interopDefault(require('@babel/runtime/helpers/classCallCheck'));
var _createClass = _interopDefault(require('@babel/runtime/helpers/createClass'));
require('core-js/modules/es7.symbol.async-iterator');
require('core-js/modules/es6.symbol');
require('core-js/modules/es6.function.name');
var _typeof = _interopDefault(require('@babel/runtime/helpers/typeof'));
require('core-js/modules/es6.array.iterator');
require('core-js/modules/es6.object.keys');
var _regeneratorRuntime = _interopDefault(require('@babel/runtime/regenerator'));
require('regenerator-runtime/runtime');
var _asyncToGenerator = _interopDefault(require('@babel/runtime/helpers/asyncToGenerator'));
var _possibleConstructorReturn = _interopDefault(require('@babel/runtime/helpers/possibleConstructorReturn'));
var _getPrototypeOf = _interopDefault(require('@babel/runtime/helpers/getPrototypeOf'));
var _inherits = _interopDefault(require('@babel/runtime/helpers/inherits'));

function ForbiddenError(message) {var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  Error.call(this);
  this.constructor = ForbiddenError;
  this.subject = options.subject;
  this.subjectName = options.subjectName;
  this.action = options.action;
  this.field = options.field;
  this.message = message || "Cannot execute \"".concat(this.action, "\" on \"").concat(this.subjectName, "\"");

  if (typeof Error.captureStackTrace === 'function') {
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  } else {
    this.stack = new Error(this.message).stack;
  }
}

ForbiddenError.prototype = Object.create(Error.prototype);

function isObject(value) {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false;
  }

  var prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.getPrototypeOf({});
}

function wrapArray(value) {
  return Array.isArray(value) ? value : [value];
}

function getSubjectName(subject) {
  if (!subject || typeof subject === 'string') {
    return subject;
  }

  var Type = _typeof(subject) === 'object' ? subject.constructor : subject;

  return Type.modelName || Type.name;
}

function clone(object) {
  return JSON.parse(JSON.stringify(object));
}

function get(obj, key) {
  // TODO: support some kind of get() method?
  // return typeof obj.get === 'function' ? obj.get(key) : obj[key]
  return obj[key];
}


function isPartiallyEqual(target, obj) {
  return Object.keys(obj).every(function (key) {return get(target, key) === obj[key];});
}


function getConditionFn(condition) {
  return function (target) {return isPartiallyEqual(target, condition);};
}var 



Rule = /*#__PURE__*/function () {
  function Rule(params) {var _this = this;_classCallCheck(this, Rule);
    this.actions = params.actions || params.action;
    this.subject = params.subject;
    this.fields = !params.fields || params.fields.length === 0 ?
    undefined :
    wrapArray(params.fields);
    this.inverted = !!params.inverted;
    this.condition = params.condition;
    // this._matches = this.condition ? sift(this.condition) : undefined
    this.reason = params.reason;

    if (this.condition == null) {// null or undefined
      this._matches = undefined;
    } else if (isObject(this.condition)) {
      this._matches = getConditionFn(this.condition);
    } else if (typeof this.condition === 'function') {
      this._matches = function (target, fields) {return _this.condition(target, fields);}; // fn (object, fields) => boolean
    } else {
      throw Error("Unsupported type for condition: ".concat(_typeof(this.condition)));
    }
  }_createClass(Rule, [{ key: "matches", value: function matches(

    target) {
      if (!this._matches) return true;
      if (typeof target === 'string') return !this.inverted;

      return this._matches(target);
    } }, { key: "isRelevantFor", value: function isRelevantFor(

    target, field) {
      if (!this.fields) return true;
      if (!field) return !this.inverted;

      return this.fields.indexOf(field) !== -1;
    } }]);return Rule;}();

var PRIVATE_FIELD = typeof Symbol !== 'undefined' ? Symbol('private') : "__".concat(Date.now());
var ALIASES = {
  crud: ['create', 'read', 'update', 'delete'] };



function hasAction(action, actions) {
  return action === actions || Array.isArray(actions) && actions.indexOf(action) !== -1;
}var 


Ability = /*#__PURE__*/function () {_createClass(Ability, null, [{ key: "addAlias", value: function addAlias(
    alias, actions) {
      if (alias === 'manage' || hasAction('manage', actions)) {
        throw new Error('Cannot add alias for "manage" action because it represents any action');
      }

      if (hasAction(alias, actions)) {
        throw new Error("Attempt to alias action to itself: ".concat(alias, " -> ").concat(actions.toString()));
      }

      ALIASES[alias] = actions;
      return this;
    } }]);

  function Ability(rules) {var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},_ref$RuleType = _ref.RuleType,RuleType = _ref$RuleType === void 0 ? Rule : _ref$RuleType,_ref$subjectName = _ref.subjectName,subjectName = _ref$subjectName === void 0 ? getSubjectName : _ref$subjectName;_classCallCheck(this, Ability);
    this.__private = {
      RuleType: RuleType,
      subjectName: subjectName,
      originalRules: rules || [],
      hasPerFieldRules: false,
      indexedRules: Object.create(null),
      mergedRules: Object.create(null),
      events: {},
      aliases: clone(ALIASES) };

    this.update(rules);
  }_createClass(Ability, [{ key: "update", value: function update(









    rules) {
      if (!Array.isArray(rules)) {
        return this;
      }

      var payload = { rules: rules, ability: this };

      this.emit('update', payload);
      this.__private.originalRules = rules.slice(0);
      this.__private.mergedRules = Object.create(null);

      var index = this.buildIndexFor(rules);

      this.__private.indexedRules = index.rules;
      this.__private.hasPerFieldRules = index.hasPerFieldRules;

      this.emit('updated', payload);

      return this;
    } }, { key: "buildIndexFor", value: function buildIndexFor(

    rules) {
      var indexedRules = Object.create(null);var
      RuleType = this.__private.RuleType;
      var isAllInverted = true;
      var hasPerFieldRules = false;

      for (var i = 0; i < rules.length; i++) {
        var rule = new RuleType(rules[i]);
        var actions = this.expandActions(rule.actions);
        var subjects = wrapArray(rule.subject);
        var priority = rules.length - i - 1;

        isAllInverted = !!(isAllInverted && rule.inverted);

        if (!hasPerFieldRules && rule.fields) {
          hasPerFieldRules = true;
        }

        // for (let k = 0; k < subjects.length; k++) {
        //   const subject = subjects[k]
        var _iteratorNormalCompletion = true;var _didIteratorError = false;var _iteratorError = undefined;try {for (var _iterator = subjects[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {var subject = _step.value;
            indexedRules[subject] = indexedRules[subject] || Object.create(null);

            // for (let j = 0; j < actions.length; j++) {
            //   const action = actions[j]
            var _iteratorNormalCompletion2 = true;var _didIteratorError2 = false;var _iteratorError2 = undefined;try {for (var _iterator2 = actions[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {var action = _step2.value;
                indexedRules[subject][action] = indexedRules[subject][action] || Object.create(null);
                indexedRules[subject][action][priority] = rule;
              }} catch (err) {_didIteratorError2 = true;_iteratorError2 = err;} finally {try {if (!_iteratorNormalCompletion2 && _iterator2.return != null) {_iterator2.return();}} finally {if (_didIteratorError2) {throw _iteratorError2;}}}
          }} catch (err) {_didIteratorError = true;_iteratorError = err;} finally {try {if (!_iteratorNormalCompletion && _iterator.return != null) {_iterator.return();}} finally {if (_didIteratorError) {throw _iteratorError;}}}
      }

      return {
        isAllInverted: isAllInverted,
        hasPerFieldRules: hasPerFieldRules,
        rules: indexedRules };

    } }, { key: "expandActions", value: function expandActions(

    rawActions) {var
      aliases = this.__private.aliases;
      var actions = wrapArray(rawActions);
      var i = 0;

      while (i < actions.length) {
        var action = actions[i++];

        if (aliases.hasOwnProperty(action)) {
          actions = actions.concat(aliases[action]);
        }
      }

      return actions;
    } }, { key: "can", value: function can(





    action, subject, field) {
      if (field && typeof field !== 'string') {
        // eslint-disable-next-line
        throw new Error('[abilities]: Ability.can(action, subject, field) expects 3rd parameter (field) to be a string.');
      }

      var rule = this.relevantRuleFor(action, subject, field);

      return !!rule && !rule.inverted;
    } }, { key: "relevantRuleFor", value: function relevantRuleFor(

    action, subject, field) {
      var rules = this.rulesFor(action, subject, field);

      for (var i = 0; i < rules.length; i++) {
        if (rules[i].matches(subject)) {
          return rules[i];
        }
      }

      return null;
    } }, { key: "possibleRulesFor", value: function possibleRulesFor(

    action, subject) {
      var subjectName = this.__private.subjectName(subject);var
      mergedRules = this.__private.mergedRules;
      var key = "".concat(subjectName, "_").concat(action);

      if (!mergedRules[key]) {
        mergedRules[key] = this.mergeRulesFor(action, subjectName);
      }

      return mergedRules[key];
    } }, { key: "mergeRulesFor", value: function mergeRulesFor(

    action, subjectName) {var
      indexedRules = this.__private.indexedRules;
      var mergedRules = [subjectName, 'all'].reduce(function (rules, subjectType) {
        var subjectRules = indexedRules[subjectType];

        if (!subjectRules) {
          return rules;
        }

        return Object.assign(rules, subjectRules[action], subjectRules.manage);
      }, []);

      // TODO: think whether there is a better way to prioritize rules
      // or convert sparse array to regular one
      return mergedRules.filter(Boolean);
    } }, { key: "rulesFor", value: function rulesFor(

    action, subject, field) {
      var rules = this.possibleRulesFor(action, subject);

      if (!this.__private.hasPerFieldRules) {
        return rules;
      }

      return rules.filter(function (rule) {return rule.isRelevantFor(subject, field);});
    } }, { key: "cannot", value: function cannot()

    {
      return !this.can.apply(this, arguments);
    } }, { key: "throwUnlessCan", value: function throwUnlessCan()

    {for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {args[_key] = arguments[_key];}
      var rule = this.relevantRuleFor.apply(this, args);

      if (!rule || rule.inverted) {var
        action = args[0],subject = args[1],field = args[2];
        var subjectName = this.__private.subjectName(subject);

        throw new ForbiddenError(rule ? rule.reason : null, {
          action: action,
          subjectName: subjectName,
          subject: subject,
          field: field });

      }
    } }, { key: "on", value: function on(

    event, handler) {var
      events = this.__private.events;
      var isAttached = true;

      if (!events[event]) {
        events[event] = [];
      }

      events[event].push(handler);

      return function () {
        if (isAttached) {
          var index = events[event].indexOf(handler);
          events[event].splice(index, 1);
          isAttached = false;
        }
      };
    } }, { key: "emit", value: function emit(

    event, payload) {
      var handlers = this.__private.events[event];

      if (handlers) {
        handlers.slice(0).forEach(function (handler) {return handler(payload);});
      }
    } }, { key: "__private", get: function get() {return this[PRIVATE_FIELD];}, set: function set(val) {return this[PRIVATE_FIELD] = val;} }, { key: "rules", get: function get() {return this.__private.originalRules;} }]);return Ability;}();

var 


AsyncAbility = /*#__PURE__*/function (_Ability) {_inherits(AsyncAbility, _Ability);function AsyncAbility() {_classCallCheck(this, AsyncAbility);return _possibleConstructorReturn(this, _getPrototypeOf(AsyncAbility).apply(this, arguments));}_createClass(AsyncAbility, [{ key: "relevantRuleFor",

    // override
    // - async
    value: function () {var _relevantRuleFor = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(action, subject, field) {var rules, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, rule;return _regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:
                rules = this.rulesFor(action, subject, field);_iteratorNormalCompletion = true;_didIteratorError = false;_iteratorError = undefined;_context.prev = 4;_iterator =

                rules[Symbol.iterator]();case 6:if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {_context.next = 15;break;}rule = _step.value;_context.next = 10;return (
                  rule.matches(subject));case 10:if (!_context.sent) {_context.next = 12;break;}return _context.abrupt("return",
                rule);case 12:_iteratorNormalCompletion = true;_context.next = 6;break;case 15:_context.next = 21;break;case 17:_context.prev = 17;_context.t0 = _context["catch"](4);_didIteratorError = true;_iteratorError = _context.t0;case 21:_context.prev = 21;_context.prev = 22;if (!_iteratorNormalCompletion && _iterator.return != null) {_iterator.return();}case 24:_context.prev = 24;if (!_didIteratorError) {_context.next = 27;break;}throw _iteratorError;case 27:return _context.finish(24);case 28:return _context.finish(21);case 29:return _context.abrupt("return",



                null);case 30:case "end":return _context.stop();}}}, _callee, this, [[4, 17, 21, 29], [22,, 24, 28]]);}));function relevantRuleFor(_x, _x2, _x3) {return _relevantRuleFor.apply(this, arguments);}return relevantRuleFor;}()


    // override
    // - async
  }, { key: "can", value: function () {var _can = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(action, subject, field) {var rule;return _regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:if (!(
                field && typeof field !== 'string')) {_context2.next = 2;break;}throw (

                  new Error('[abilities]: Ability.can(action, subject, field) expects 3rd parameter (field) to be a string.'));case 2:_context2.next = 4;return (


                  this.relevantRuleFor(action, subject, field));case 4:rule = _context2.sent;return _context2.abrupt("return",

                !!rule && !rule.inverted);case 6:case "end":return _context2.stop();}}}, _callee2, this);}));function can(_x4, _x5, _x6) {return _can.apply(this, arguments);}return can;}()



    // override
    // - async
  }, { key: "cannot", value: function () {var _cannot = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3() {var can,_args3 = arguments;return _regeneratorRuntime.wrap(function _callee3$(_context3) {while (1) {switch (_context3.prev = _context3.next) {case 0:_context3.next = 2;return (
                  this.can.apply(this, _args3));case 2:can = _context3.sent;return _context3.abrupt("return",

                !can);case 4:case "end":return _context3.stop();}}}, _callee3, this);}));function cannot() {return _cannot.apply(this, arguments);}return cannot;}()


    // override
    // - async
  }, { key: "throwUnlessCan", value: function () {var _throwUnlessCan = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4() {var _len,args,_key,rule,action,subject,field,subjectName,_args4 = arguments;return _regeneratorRuntime.wrap(function _callee4$(_context4) {while (1) {switch (_context4.prev = _context4.next) {case 0:for (_len = _args4.length, args = new Array(_len), _key = 0; _key < _len; _key++) {args[_key] = _args4[_key];}_context4.next = 3;return (
                  this.relevantRuleFor.apply(this, args));case 3:rule = _context4.sent;if (!(

                !rule || rule.inverted)) {_context4.next = 8;break;}
                action = args[0], subject = args[1], field = args[2];
                subjectName = this.__private.subjectName(subject);throw (

                  new ForbiddenError(rule ? rule.reason : null, {
                    action: action,
                    subjectName: subjectName,
                    subject: subject,
                    field: field }));case 8:case "end":return _context4.stop();}}}, _callee4, this);}));function throwUnlessCan() {return _throwUnlessCan.apply(this, arguments);}return throwUnlessCan;}() }]);return AsyncAbility;}(Ability);

var PRIVATE_FIELD$1 = typeof Symbol !== 'undefined' ? Symbol('private') : "__".concat(Date.now());

function isStringOrNonEmptyArray(value) {
  return ![].concat(value).some(function (item) {return typeof item !== 'string';});
}var 


RuleBuilder = /*#__PURE__*/function () {
  function RuleBuilder(rule) {_classCallCheck(this, RuleBuilder);
    this.rule = rule;
  }_createClass(RuleBuilder, [{ key: "because", value: function because(

    reason) {
      this.rule.reason = reason;
      return this;
    } }]);return RuleBuilder;}();var 



AbilityBuilder = /*#__PURE__*/function () {_createClass(AbilityBuilder, null, [{ key: "define", value: function define(
    dsl) {var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var builder = new this();
      var result = dsl(builder.can.bind(builder), builder.cannot.bind(builder));

      var AbilityClass = options.async ? AsyncAbility : Ability;
      var buildAbility = function buildAbility() {return new AbilityClass(builder.rules, options);};

      return result && typeof result.then === 'function' ?
      result.then(buildAbility) :
      buildAbility();
    } }, { key: "extract", value: function extract()

    {
      var builder = new this();

      return {
        can: builder.can.bind(builder),
        cannot: builder.cannot.bind(builder),
        rules: builder.rules };

    } }]);

  function AbilityBuilder() {var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},_ref$subjectName = _ref.subjectName,subjectName = _ref$subjectName === void 0 ? getSubjectName : _ref$subjectName;_classCallCheck(this, AbilityBuilder);
    this.rules = [];
    this.__private = {
      subjectName: subjectName };

  }_createClass(AbilityBuilder, [{ key: "can", value: function can(










    actions, subject, fieldsOrCondition, condition) {
      if (!isStringOrNonEmptyArray(actions)) {
        throw new TypeError('AbilityBuilder#can expects the first parameter to be an action or array of actions');
      }

      var subjectName = [].concat(subject).map(this.__private.subjectName);

      if (!isStringOrNonEmptyArray(subjectName)) {
        throw new TypeError('AbilityBuilder#can expects the second argument to be a subject name/type or an array of subject names/types');
      }

      var rule = { actions: actions, subject: subjectName };

      if (Array.isArray(fieldsOrCondition) || typeof fieldsOrCondition === 'string') {
        rule.fields = fieldsOrCondition;
      }

      // old code: replaced by below if/else
      // if (isObject(condition) || !rule.fields && isObject(fieldsOrCondition)) {
      //   rule.condition = condition || fieldsOrCondition
      // }
      if (!rule.fields && (isObject(fieldsOrCondition) || typeof fieldsOrCondition === 'function')) {
        rule.condition = fieldsOrCondition;
      } else if (condition) {
        rule.condition = condition;
      }


      this.rules.push(rule);

      return new RuleBuilder(rule);
    } }, { key: "cannot", value: function cannot()

    {
      var builder = this.can.apply(this, arguments);
      builder.rule.inverted = true;

      return builder;
    } }, { key: "__private", get: function get() {return this[PRIVATE_FIELD$1];}, set: function set(val) {return this[PRIVATE_FIELD$1] = val;} }]);return AbilityBuilder;}();

var 


AsyncAbilityBuilder = /*#__PURE__*/function (_AbilityBuilder) {_inherits(AsyncAbilityBuilder, _AbilityBuilder);function AsyncAbilityBuilder() {_classCallCheck(this, AsyncAbilityBuilder);return _possibleConstructorReturn(this, _getPrototypeOf(AsyncAbilityBuilder).apply(this, arguments));}_createClass(AsyncAbilityBuilder, null, [{ key: "define", value: function define(
    dsl) {var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var builder = new this();
      var result = dsl(builder.can.bind(builder), builder.cannot.bind(builder));

      var AbilityClass = AsyncAbility;
      var buildAbility = function buildAbility() {return new AbilityClass(builder.rules, options);};

      return result && typeof result.then === 'function' ?
      result.then(buildAbility) :
      buildAbility();
    } }]);return AsyncAbilityBuilder;}(AbilityBuilder);

// import { Ability }        from './ability'

exports.Ability = Ability;
exports.AsyncAbility = AsyncAbility;
exports.Rule = Rule;
exports.AbilityBuilder = AbilityBuilder;
exports.RuleBuilder = RuleBuilder;
exports.AsyncAbilityBuilder = AsyncAbilityBuilder;
exports.ForbiddenError = ForbiddenError;
//# sourceMappingURL=abilities.cjs.js.map
