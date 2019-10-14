/**
 * Created by cleverdou on 2019-05-29.
 */
'use strict';

import create from './src'
import invariant from 'invariant'
import { NAMESPACE_SEP } from "./src/constants";
// eslint-disable-next-line import/no-namespace
import * as sagaEffects from 'redux-saga/effects';

function commonMergeReducer(state, action) {
  if (!Object.prototype.hasOwnProperty.call(action, 'payload')) {
    return state;
  }
  const payload = action.payload;
  if (Object.prototype.toString.call(state) === '[object Object]') {
    invariant(Object.prototype.toString.call(payload) === '[object Object]', 'The payload must be an object if the shape of state is object');
    return Object.assign({}, state, payload);
  }
  return state;
}


export default function (options) {

  const actionTypes = {};

  const $put = function put(action) {
    return sagaEffects.put(action);
  };

  $put.resolve = sagaEffects.put.resolve;

  function createDispatches(namespace, key, store) {
    store.dispatch[namespace][key] = function (payload, others) {
      return store.dispatch({ ...others, payload, type: `${namespace}${NAMESPACE_SEP}${key}` });
    };
    store.dispatch[namespace][key].toString = function () {
      return `${namespace}${NAMESPACE_SEP}${key}`
    }
  }

  function createPuts(namespace, key) {
    $put[namespace][key] = function (payload, others) {
      return sagaEffects.put({ ...others, payload, type: `${namespace}${NAMESPACE_SEP}${key}` });
    };
    $put[namespace][key].toString = function () {
      return `${namespace}${NAMESPACE_SEP}${key}`
    };
    $put[namespace][key].resolve = function (payload, others) {
      return sagaEffects.put.resolve({ ...others, payload, type: `${namespace}${NAMESPACE_SEP}${key}` });
    };
  }

  function createModel(model, store) {
    return function (m) {
      let effects;
      if (typeof m.effects === 'function') {
        effects = m.effects(sagaEffects);
      } else {
        effects = m.effects;
      }
      const _m = { ...m, effects };
      if (store) {
        store.dispatch[_m.namespace] = store.dispatch[_m.namespace] || {};
      } else {
        actionTypes[_m.namespace] = [];
      }
      $put[_m.namespace] = $put[_m.namespace] || {};
      _m.reducers = _m.reducers ? { ..._m.reducers } : {};
      if (_m.reducers) {
        for (const key in _m.reducers) {
          if (Object.prototype.hasOwnProperty.call(_m.reducers, key)) {
            if (store) {
              createDispatches(_m.namespace, key, store);
            } else {
              actionTypes[_m.namespace].push(key);
            }
            createPuts(_m.namespace, key)
          }
        }
      }
      if (_m.effects) {
        for (const key in _m.effects) {
          if (Object.prototype.hasOwnProperty.call(_m.effects, key)) {
            _m.reducers["set_" + key] = commonMergeReducer;
            if (store) {
              createDispatches(_m.namespace, key, store);
            } else {
              actionTypes[_m.namespace].push(key);
            }
            createPuts(_m.namespace, key)
          }
        }
      }
      if (typeof m.effects === 'function') {
        _m.effects = m.effects({ ...sagaEffects, put: $put });
      }
      model(_m);
    };
  }


  const app = create(options);
  const model = app.model.bind(app);
  const start = app.start.bind(app);

  app.use({
    onEffect(effect, { put }, model, actionType) {
      const { namespace } = model;

      return function* (...args) {

        if (args.length > 0 && args[0].__dva_resolve) {
          const resolve = args[0].__dva_resolve;
          const reject = args[0].__dva_reject;
          let payload;
          args[0].__dva_resolve = function (ret) {
            payload = ret;
            resolve(ret);
          };
          args[0].__dva_reject = function (error) {
            reject(error);
          };
          yield effect(...args);
          if (payload !== undefined) {
            yield put({
              type: actionType.replace(namespace + '/', namespace + '/set_'),
              payload
            });
          }
        } else {
          yield effect(...args)
        }
      };
    }
  });


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
    return store
  };


  if (!global.registered) options.models && options.models.forEach(model => app.model(model));
  global.registered = true;
  return app
}
