import React from 'react';
import {render} from 'react-dom';
import routes from './routes.jsx'
import { createStore, combineReducers } from 'redux'
import { Provider } from 'react-redux'


const userInitialState = {
  userName: 'Anonymous'
}


function userReducer (state = userInitialState, action) {
	switch(action.type){
		case 'UPDATE_USER' : {
		 return {
		   ...state, 
		   userName: action.userName
		 }
		}
		default : {
		 return state
		}
	}
}

const reducers = combineReducers({
 userReducer
});

const store = createStore(reducers);


render(
	  <Provider store={store}>
	    {routes}
	  </Provider>
	  , document.getElementById('app')
	);

console.log('Hello World');
export default store