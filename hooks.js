/**
 * Created by cleverdou on 2020/2/26.
 */
'use strict';

import {useDispatch, useSelector, shallowEqual} from 'react-redux';
import {useRef} from 'react'

export function useModelDispatch(models={}) {
  const dispatch = useDispatch();
  const prevModels = useRef(null);
  const result = useRef(null);
  if (!shallowEqual(prevModels.current, models)) {
    result.current = Object.keys(models).reduce((dispatchs, key) => {
      dispatchs[key] = dispatch[models[key].namespace];
      return dispatchs;
    }, {});
  }
  prevModels.current = models;
  return result.current;
}

export function useModelSelector(models, selector, equalityFn) {
  return useSelector(
      (state) => selector(Object.keys(models).reduce((_state, key) => {
        _state[key] = state[models[key].namespace];
        return _state;
      }, {})), equalityFn || shallowEqual);
}


