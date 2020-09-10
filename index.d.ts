declare module 'dva' {
  import {
    Reducer,
    Action,
    AnyAction,
    ReducersMapObject,
    MiddlewareAPI,
    StoreEnhancer,
    bindActionCreators,
    Store,
  } from 'redux';

  export interface Dispatch<A extends Action = AnyAction> {
    <T extends A>(action: T): Promise<any> | T;
  }

  export interface onActionFunc {
    (api: MiddlewareAPI<any>): void;
  }

  export interface ReducerEnhancer {
    (reducer: Reducer<any>): Reducer<any>;
  }

  export interface Hooks {
    onError?: (
      e: Error,
      dispatch: Dispatch<any>,
      extension: {key: string; effectArgs: any[]},
    ) => void;
    _handleActions?: any;
    onAction?: onActionFunc | onActionFunc[];
    onStateChange?: () => void;
    onReducer?: ReducerEnhancer;
    onEffect?: (
      effect: (...args: any[]) => Generator,
      sagaEffect: EffectsCommandMap,
      model: ModelConfig,
      actionType: string,
    ) => void;
    onHmr?: () => void;
    extraReducers?: ReducersMapObject;
    extraEnhancers?: StoreEnhancer<any>[];
  }

  export type DvaOption = Hooks & {
    namespacePrefixWarning?: boolean;
    initialState?: Object;
    history?: Object;
  };

  export interface EffectsCommandMap {
    put: <A extends AnyAction>(action: A) => any;
    call: Function;
    select: Function;
    take: Function;
    cancel: Function;
    [key: string]: any;
  }

  export type EffectType = 'takeEvery' | 'takeLatest' | 'watcher' | 'throttle';
  export type Subscription = (api: SubscriptionAPI, done: Function) => void;
  export type ReducersMapObjectWithEnhancer = [
    ReducersMapObject,
    ReducerEnhancer,
  ];

  export interface SubscriptionAPI {
    dispatch: Dispatch<any>;
  }

  export interface SubscriptionsMapObject {
    [key: string]: Subscription;
  }

  export interface RouterAPI {
    app: DvaInstance;
  }

  export interface Router {
    (api?: RouterAPI): JSX.Element | Object;
  }

  export interface DvaInstance {
    /**
     * Register an object of hooks on the application.
     *
     * @param hooks
     */
    use: (hooks: Hooks) => void;

    /**
     * Register a model.
     *
     * @param model
     */
    model: (model: ModelConfig) => void;

    /**
     * Unregister a model.
     *
     * @param namespace
     */
    unmodel: (namespace: string) => void;

    /**
     * Config router. Takes a function with arguments { history, dispatch },
     * and expects router config. It use the same api as react-router,
     * return jsx elements or JavaScript Object for dynamic routing.
     *
     * @param router
     */
    router: (router: Router) => void;

    /**
     * Start the application. Selector is optional. If no selector
     * arguments, it will return a function that return JSX elements.
     *
     * @param selector
     */
    start: (selector?: HTMLElement | string) => any;

    _store: Store;
  }

  export default function dva(opts?: DvaOption): DvaInstance;

  export {bindActionCreators};

  // export interface Model {
  //   namespace: string;
  //   state?: any;
  //   reducers?: ReducersMapObject | ReducersMapObjectWithEnhancer;
  //   effects?: EffectsMapObject;
  //   subscriptions?: SubscriptionsMapObject;
  // }
  // export type RematchDispatch<
  //   M extends Models | void = void
  // > = (M extends Models
  //   ? ExtractRematchDispatchersFromModels<M>
  //   : {
  //       [key: string]: {
  //         [key: string]: RematchDispatcherAsync;
  //       };
  //     }) &
  //   (RematchDispatcher | RematchDispatcherAsync) &
  //   (Redux.Dispatch<any>); // for library compatability
}

declare module 'dva' {
  /*
   * Type definitions for Rematch v1.1.0
   * Project: Rematch
   * Definitions by:
   * Shawn McKay https://github.com/shmck
   * Bruno Lemos https://github.com/brunolemos
   */

  import * as Redux from 'redux';
  import {PutEffect, SelectEffect} from 'redux-saga/effects';

  export type ExtractRematchStateFromModels<M extends Models> = {
    [modelKey in keyof M]: M[modelKey]['state'];
  };

  export type RematchRootState<
    M extends Models
  > = ExtractRematchStateFromModels<M>;

  export type ExtractRematchDispatcherAsyncFromEffect<
    E
  > = E extends () => Generator<infer T, infer R>
    ? RematchDispatcherAsync<void, void, R>
    : E extends (payload: infer P) => Generator<infer T, infer R>
    ? RematchDispatcherAsync<P, void, R>
    : E extends (payload: infer P, meta: infer M) => Generator<infer T, infer R>
    ? RematchDispatcherAsync<P, M, R>
    : RematchDispatcherAsync<any, any, any>;

  export type ExtractRematchPutAsyncFromEffect<E> = E extends () => Generator
    ? RematchPut<void, void>
    : E extends (payload: infer P) => Generator
    ? RematchPut<P, void>
    : E extends (payload: infer P, meta: infer M) => Generator
    ? RematchPut<P, M>
    : RematchPut<any, any>;

  export type ExtractRematchDispatchersFromEffectsObject<
    effects extends ModelEffects
  > = {
    [effectKey in keyof effects]: ExtractRematchDispatcherAsyncFromEffect<
      effects[effectKey]
    >;
  };

  export type ExtractRematchPutsFromEffectsObject<
    effects extends ModelEffects
  > = {
    [effectKey in keyof effects]: ExtractRematchPutAsyncFromEffect<
      effects[effectKey]
    >;
  };

  export type ExtractRematchDispatchersFromEffects<
    effects extends ModelConfig['effects']
  > = effects extends (...args: any[]) => infer R
    ? R extends ModelEffects
      ? ExtractRematchDispatchersFromEffectsObject<R>
      : {}
    : effects extends ModelEffects
    ? ExtractRematchDispatchersFromEffectsObject<effects>
    : {};

  export type ExtractRematchPutsFromEffects<
    effects extends ModelConfig['effects']
  > = effects extends (...args: any[]) => infer R
    ? R extends ModelEffects
      ? ExtractRematchPutsFromEffectsObject<R>
      : {}
    : effects extends ModelEffects
    ? ExtractRematchPutsFromEffectsObject<effects>
    : {};

  export type ExtractRematchDispatcherFromReducer<R> = R extends () => any
    ? RematchDispatcher<void, void>
    : R extends (state: infer S) => infer S | void
    ? RematchDispatcher<void, void>
    : R extends (state: infer S, payload: infer P) => infer S | void
    ? RematchDispatcher<P, void>
    : R extends (
        state: infer S,
        payload: infer P,
        meta: infer M,
      ) => infer S | void
    ? RematchDispatcher<P, M>
    : RematchDispatcher<any, any>;

  export type ExtractRematchPutFromReducer<R> = R extends () => any
    ? RematchPut<void, void>
    : R extends (state: infer S) => infer S | void
    ? RematchPut<void, void>
    : R extends (state: infer S, payload: infer P) => infer S | void
    ? RematchPut<P, void>
    : R extends (
        state: infer S,
        payload: infer P,
        meta: infer M,
      ) => infer S | void
    ? RematchPut<P, M>
    : RematchPut<any, any>;

  export type ExtractRematchDispatchersFromReducersObject<
    reducers extends ModelReducers<any>
  > = {
    [reducerKey in keyof reducers]: ExtractRematchDispatcherFromReducer<
      reducers[reducerKey]
    >;
  };
  export type ExtractRematchPutsFromReducersObject<
    reducers extends ModelReducers<any>
  > = {
    [reducerKey in keyof reducers]: ExtractRematchPutFromReducer<
      reducers[reducerKey]
    >;
  };

  export type ExtractRematchDispatchersFromReducers<
    reducers extends ModelConfig['reducers']
  > = ExtractRematchDispatchersFromReducersObject<reducers & {}>;

  export type ExtractRematchPutsFromReducers<
    reducers extends ModelConfig['reducers']
  > = ExtractRematchPutsFromReducersObject<reducers & {}>;

  export type ExtractRematchDispatchersFromModel<
    M extends ModelConfig
  > = ExtractRematchDispatchersFromReducers<M['reducers']> &
    ExtractRematchDispatchersFromEffects<M['effects'] & {}>;

  export type ExtractRematchPutsFromModel<
    M extends ModelConfig
  > = ExtractRematchPutsFromReducers<M['reducers']> &
    ExtractRematchPutsFromEffects<M['effects'] & {}>;

  export type ExtractRematchDispatchersFromModels<M extends Models> = {
    [modelKey in keyof M]: ExtractRematchDispatchersFromModel<M[modelKey]>;
  };

  export type ExtractRematchPutsFromModels<M extends Models> = {
    [modelKey in keyof M]: ExtractRematchPutsFromModel<M[modelKey]>;
  };

  export type RematchDispatcher<P = void, M = void> = [P] extends [void]
    ? () => Action<any, any>
    : [M] extends [void]
    ? (payload: P) => Action<P, void>
    : (payload: P, meta: M) => Action<P, M>;

  export type CommonPut<P = void, M = void> = [P] extends [void]
      ? () => PutEffect<Action<any, any>>
      : [M] extends [void]
          ? (payload: P) => PutEffect<Action<P, void>>
          : (payload: P, meta: M) => PutEffect<Action<P, M>>

  export type RematchPut<P = void, M = void> = CommonPut<P , M> & {resolve: CommonPut<P , M>};

  export type RematchDispatcherAsync<P = void, M = void, R = void> = [
    P,
  ] extends [void]
    ? () => Promise<R>
    : [M] extends [void]
    ? (payload: P) => Promise<R>
    : (payload: P, meta: M) => Promise<R>;

  // export type RematchDispatch<
  //   M extends Models | void = void
  // > = (M extends Models
  //   ? ExtractRematchDispatchersFromModels<M>
  //   : {
  //       [key: string]: {
  //         [key: string]: RematchDispatcher | RematchDispatcherAsync;
  //       };
  //     }) &
  //   Redux.Dispatch<any>; // for library compatability

  type SagaPut<M extends Models | void = void> = (M extends Models
    ? ExtractRematchPutsFromModels<M>
    : {
        [key: string]: {
          [key: string]: RematchPut;
        };
      }) &
    ((action: Action) => PutEffect<Action>); // for library compatability

  type Put<M extends Models | void = void> = {
    put: SagaPut<M>;
    putResolve: SagaPut<M>;
  };

  export type Puts<
    ME extends ModelEffects,
    MR extends ModelReducers | Models | void = void,
    M extends Models | void = void
  > = ME &
    (MR extends ModelReducers
      ? ExtractRematchPutsFromReducersObject<MR>
      : MR extends Models
      ? Put<MR>
      : void) &
    (M extends Models ? Put<M> : void);

  export function init<M extends Models>(
    config: InitConfig<M> | undefined,
  ): RematchStore<M>;

  export function useModelDispatch<M extends Models>(
    models: M,
  ): ExtractRematchDispatchersFromModels<M>;

  export function useModelSelector<M extends Models, TSelected>(
    models: M,
    selector: (state: {[k in keyof M]: M[k]['state']}) => TSelected,
    equalityFn?: (left: TSelected, right: TSelected) => boolean,
  ): TSelected;

  // export function getDispatch<M extends Models>(): RematchDispatch<M>;

  interface CreatedModel<
    E extends ModelEffects,
    R extends ModelReducers<S>,
    S = any
  > {
    namespace: string;
    state: S;
    reducers: R;
    effects: E;
  }

  type ThisModel<S> = {
    getState<TSelected>(selector: (state: S) => TSelected): SelectEffect;
    getModelState<M extends Models, TSelected>(
      models: M,
      selector: (state: {[k in keyof M]: M[k]['state']}) => TSelected,
    ): SelectEffect;
    createModelPut<M extends Models>(
        models: M,
    ): ExtractRematchPutsFromModels<M>;
  };

  interface ModelParam<E extends ModelEffects, R extends ModelReducers<S>, S> {
    namespace: string;
    state: S;
    reducers?: R;
    effects?: E &
      ThisType<
        ExtractRematchPutsFromReducers<R> &
          ExtractRematchPutsFromEffects<E> &
          ThisModel<S>
      >;
  }

  function createModel<E extends ModelEffects, R extends ModelReducers<S>, S>(
    model: ModelParam<E, R, S>,
  ): CreatedModel<E, R, S>;

  export interface RematchStore<
    M extends Models = Models,
    A extends Action = Action
  > extends Redux.Store<RematchRootState<M>, A> {
    name: string;

    replaceReducer(nextReducer: Redux.Reducer<RematchRootState<M>, A>): void;

    // dispatch: RematchDispatch<M>;

    getState(): RematchRootState<M>;

    model(model: Model): void;

    subscribe(listener: () => void): Redux.Unsubscribe;
  }

  export type Action<P = any, M = any> = {
    type: string;
    payload?: P;
    meta?: M;
  };

  export type EnhancedReducer<S, P = object, M = object> = (
    state: S,
    payload: P,
    meta: M,
  ) => S;

  export type EnhancedReducers = {
    [key: string]: EnhancedReducer<any>;
  };

  export type ModelReducers<S = any> = {
    [key: string]: (state: S, payload?: any, meta?: any) => S | void;
  };

  export type Effect = (payload?: any, meta?: any) => Generator<any, any, any>;

  export type EffectWithType = [
    Effect,
    (
      | {
          type:
            | 'watcher'
            | 'takeLatest'
            | 'throttle'
            | 'takeLeading'
            | 'takeEvery';
          ms?: number;
        }
      | ((key: string, sagaWithOnEffect: (...args: any[]) => any) => any)
    ),
  ];

  export type ModelEffects = {
    [key: string]: Effect | EffectWithType;
  };

  export type Models = {
    [key: string]: ModelConfig;
  };

  export type ModelHook = (model: Model) => void;

  export type Validation = [boolean | undefined, string];

  export interface Model<S = any, SS = S> extends ModelConfig<S, SS> {
    name: string;
    reducers: ModelReducers<S>;
  }

  // export interface Model {
  //   namespace: string;
  //   state?: any;
  //   reducers?: ReducersMapObject | ReducersMapObjectWithEnhancer;
  //   effects?: EffectsMapObject;
  //   subscriptions?: SubscriptionsMapObject;
  // }

  export interface ModelConfig<S = any, SS = S> {
    namespace: string;
    state: S;
    // baseReducer?: (state: SS, action: Action) => SS;
    reducers?: ModelReducers<S>;
    effects?: ModelEffects;
  }

  export interface PluginFactory extends Plugin {
    create(plugin: Plugin): Plugin;
  }

  export interface Plugin<
    M extends Models = Models,
    A extends Action = Action
  > {
    config?: InitConfig<M>;
    onInit?: () => void;
    onStoreCreated?: (store: RematchStore<M, A>) => void;
    onModel?: ModelHook;
    middleware?: Middleware;

    // exposed
    exposed?: {
      [key: string]: any;
    };

    validate?(validations: Validation[]): void;

    storeDispatch?(action: Action, state: any): Redux.Dispatch<any> | undefined;

    storeGetState?(): any;

    // dispatch?: RematchDispatch<M>;
    effects?: Object;

    createDispatcher?(modelName: string, reducerName: string): void;
  }

  export interface RootReducers {
    [type: string]: Redux.Reducer<any, Action>;
  }

  export interface DevtoolOptions {
    disabled?: boolean;

    [key: string]: any;
  }

  export interface InitConfigRedux<S = any> {
    initialState?: S;
    reducers?: ModelReducers;
    enhancers?: Redux.StoreEnhancer<any>[];
    middlewares?: Middleware[];
    rootReducers?: RootReducers;
    combineReducers?: (
      reducers: Redux.ReducersMapObject,
    ) => Redux.Reducer<any, Action>;
    createStore?: Redux.StoreCreator;
    devtoolOptions?: DevtoolOptions;
  }

  export interface InitConfig<M extends Models = Models> {
    name?: string;
    models?: M;
    plugins?: Plugin[];
    redux?: InitConfigRedux;
  }

  export interface Config<M extends Models = Models> extends InitConfig {
    name: string;
    models: M;
    plugins: Plugin[];
    redux: ConfigRedux;
  }

  export interface Middleware<
    DispatchExt = {},
    S = any,
    D extends Redux.Dispatch = Redux.Dispatch
  > {
    (api: Redux.MiddlewareAPI<D, S>): (
      next: Redux.Dispatch<Action>,
    ) => (action: any, state?: any) => any;
  }

  export interface ConfigRedux {
    initialState?: any;
    reducers: ModelReducers;
    enhancers: Redux.StoreEnhancer<any>[];
    middlewares: Middleware[];
    rootReducers?: RootReducers;
    combineReducers?: (
      reducers: Redux.ReducersMapObject,
    ) => Redux.Reducer<any, Action>;
    createStore?: Redux.StoreCreator;
    devtoolOptions?: DevtoolOptions;
  }

  export interface RematchClass {
    config: Config;
    models: Model[];

    addModel(model: Model): void;
  }

  // global {
  //   interface Window {
  //     __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: any;
  //   }
  // }
}
