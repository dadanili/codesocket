import React, { PropTypes } from 'react'
import { Router, Route, hashHistory, IndexRoute, Link } from 'react-router'
import { connect } from 'react-redux'
import EditorContainer from '../editor/container';
import VideoContainer from '../video/container';
import ConsoleContainer from '../console/container';

const DocContainer = (props) => {
  return(
    <div>
      <div className="body-container">
        <div><VideoContainer /></div>
        <div><EditorContainer /></div>
        <div><ConsoleContainer /></div>
      </div>
    </div>
  )
}

export default DocContainer;
