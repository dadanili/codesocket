import React, { PropTypes } from 'react'
import { Router, Route, hashHistory, IndexRoute, Link } from 'react-router'
import { connect } from 'react-redux'
import NavContainer from '../nav/container'

const Home = (props) => {
  return (
    <div>
      <NavContainer/>
      <main>
        {props.children}
      </main>
    </div>
    )
}

export default Home;
