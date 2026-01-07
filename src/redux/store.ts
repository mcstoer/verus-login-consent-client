import {createStore, applyMiddleware} from 'redux';
import thunk, {ThunkDispatch} from 'redux-thunk';
import rootReducer from './rootReducer';
import {AnyAction} from 'redux';

const store = createStore(rootReducer, applyMiddleware(thunk));

export default store;

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = ThunkDispatch<RootState, unknown, AnyAction>;