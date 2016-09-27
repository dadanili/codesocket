//File contains the route setup to be exported to be used by App.js
import React from 'react';
import { Router, Route, hashHistory, IndexRoute } from 'react-router';
import axios from 'axios';
import Home from './home/container';
import DocContainer from './doc/container';

var routes = (
  <Router history={hashHistory}>
    <Route path='/' component={Home}>
      <Route path='/doc' component={DocContainer} />
    </Route>
  </Router>
)

export default routes;