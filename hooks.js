/**
 * Created by cleverdou on 2020/2/26.
 */
'use strict';

import {useDispatch, useSelector, shallowEqual} from 'react-redux';

export function useModelDispatch(models) {
  const dispatch = useDispatch();
  return Object.keys(models).reduce((dispatchs, key) => {
    dispatchs[key] = dispatch[models[key].namespace];
    return dispatchs;
  }, {});
}

export function useModelState(models, selector, equalityFn) {
  return useSelector(
      (state) => selector(Object.keys(models).reduce((_state, key) => {
        _state[key] = state[models[key].namespace];
        return _state;
      }, {})), equalityFn || shallowEqual);
}


