/**
 * Created by cleverdou on 2019-05-29.
 */

'use strict';

import create from './src';
import invariant from 'invariant';
import {NAMESPACE_SEP} from './src/constants';
// eslint-disable-next-line import/no-namespace
import * as sagaEffects from 'redux-saga/effects';
import isPlainObject from 'is-plain-object';

export {useModelDispatch,useModelSelector} from './hooks'

//todo 待删除
function commonMergeReducer(state, action) {
  if (!Object.prototype.hasOwnProperty.call(action, 'payload')) {
    return state;
  }
  const payload = action.payload;
  if (Object.prototype.toString.call(state) === '[object Object]') {
    invariant(Object.prototype.toString.call(payload) === '[object Object]',
        'The payload must be an object if the shape of state is object');
    return Object.assign({}, state, payload);
  }
  return state;
}

function getEffects(effects) {
  if (isPlainObject(effects)) {
    return effects;
  }
  if (typeof effects === 'function') {
    effects = new effects();
  }
  let _effects = {...effects};
  while (effects) {
    const prototypeObject = Object.getPrototypeOf(effects);
    if (!prototypeObject || prototypeObject.constructor === ModelEffects) {
      break;
    }
    const keys = Object.getOwnPropertyNames(prototypeObject);
    for (const key of keys) {
      if (key !== 'constructor') {
        _effects[key] = prototypeObject[key];
      }
    }
    effects = effects.__proto__;
  }
  return _effects;
}

export default function(options) {

  const app = create(options);
  const actionTypes = {};

  const $put = function(action) {
    return sagaEffects.put(action);
  };

  const $putResolve = function(action) {
    return sagaEffects.putResolve(action);
  };

  function createDispatches(namespace, key, store) {
    store.dispatch[namespace][key] = function(payload, meta) {
      return store.dispatch(
          {meta, payload, type: `${namespace}${NAMESPACE_SEP}${key}`});
    };
    store.dispatch[namespace][key].toString = function() {
      return `${namespace}${NAMESPACE_SEP}${key}`;
    };
  }

  function createPuts(namespace, key) {
    $put[namespace][key] = function(payload, meta) {
      return sagaEffects.put(
          {meta, payload, type: `${namespace}${NAMESPACE_SEP}${key}`});
    };
    $put[namespace][key].toString = function() {
      return `${namespace}${NAMESPACE_SEP}${key}`;
    };
    $putResolve[namespace][key] = function(payload, meta) {
      return sagaEffects.putResolve(
          {meta, payload, type: `${namespace}${NAMESPACE_SEP}${key}`});
    };
    $putResolve[namespace][key].toString = function() {
      return `${namespace}${NAMESPACE_SEP}${key}`;
    };
  }

  function createModel(model, store) {
    return function(m) {
      let effects = getEffects(m.effects);
      const _m = {...m, effects};

      if (store) {
        store.dispatch[_m.namespace] = store.dispatch[_m.namespace] || {};
      } else {
        actionTypes[_m.namespace] = [];
      }
      $put[_m.namespace] = $put[_m.namespace] || {};
      $putResolve[_m.namespace] = $putResolve[_m.namespace] || {};

      let _reducers;
      if (Array.isArray(_m.reducers)) {
        _m.reducers = [..._m.reducers];
        _m.reducers[0] = _reducers = _m.reducers[0] ? {..._m.reducers[0]} : {};
      } else {
        _m.reducers = _reducers = _m.reducers ? {..._m.reducers} : {};
      }
      for (const key in _reducers) {
        if (Object.prototype.hasOwnProperty.call(_reducers, key)) {
          const _reducer = _reducers[key];
          _reducers[key] = function(state, action) {
            return _reducer(state, action.payload, action.meta);
          };
          if (store) {
            createDispatches(_m.namespace, key, store);
          } else {
            actionTypes[_m.namespace].push(key);
          }
          createPuts(_m.namespace, key);
        }
      }

      if (_m.effects) {
        for (const key in _m.effects) {
          if (Object.prototype.hasOwnProperty.call(_m.effects, key)) {
            invariant(!Object.prototype.hasOwnProperty.call(_reducers, key),
                `[app.model] effects and reducers in '${_m.namespace}' model has the same key '${key}'`);
            _reducers['return$' + key] = commonMergeReducer;
            if (store) {
              createDispatches(_m.namespace, key, store);
            } else {
              actionTypes[_m.namespace].push(key);
            }
            createPuts(_m.namespace, key);
            let effect = _m.effects[key];
            if (Array.isArray(effect)) {
              effect = _m.effects[key][0];
            }
            // const _effect = function(...args) {
            //   const action = args[0];
            //   args.shift();
            //   if (!bindEffect) {
            //     bindEffect = effect.bind(
            //         {put: $put, putResolve: $putResolve, ...$put[_m.namespace]});
            //   }
            //   return bindEffect(action.payload, action.meta, ...args);
            // };
            if (Array.isArray(effect)) {
              _m.effects[key][0] = effect.bind($put[_m.namespace]);
            } else {
              _m.effects[key] = effect.bind($put[_m.namespace]);
            }
          }
        }
      }
      $put[_m.namespace].getState = function(selector) {
        return sagaEffects.select(selector);
      };
      $put[_m.namespace].getModelState = function(models, selector) {
        return sagaEffects.select((state) => selector(Object.keys(models).reduce((_state, key) => {
          _state[key] = state[models[key].namespace];
          return _state;
        }, {})));
      };
      $put[_m.namespace].createModelPut = function(models) {
        return Object.keys(models).reduce((puts, key) => {
          puts[key] = $put[models[key].namespace];
          return puts;
        }, {});
      };
      model(_m);
    };
  }

  const model = app.model.bind(app);
  const start = app.start.bind(app);

  app.model = createModel(model, undefined);

  // eslint-disable-next-line react/display-name
  app.start = () => {
    start();
    const store = app._store;
    const injectModel = app.model;

    app.model = createModel(injectModel, store);

    for (const namespace in actionTypes) {
      if (Object.prototype.hasOwnProperty.call(actionTypes, namespace)) {
        store.dispatch[namespace] = store.dispatch[namespace] || {};
        const types = actionTypes[namespace];
        const length = types.length;
        for (let i = 0; i < length; i++) {
          createDispatches(namespace, types[i], store);
        }
      }
    }
    return store;
  };

  if (!global.registered) {
    options.models &&
    options.models.forEach(model => app.model(model));
  }
  global.registered = true;
  return app;
}


export function createModel(m) {
  return m;
}
