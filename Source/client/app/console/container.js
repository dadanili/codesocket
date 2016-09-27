import React, { PropTypes } from 'react'
import { Router, Route, hashHistory, IndexRoute, Link } from 'react-router'
import { connect } from 'react-redux'
import ConsolePresentation from './presentation'
import axios from 'axios'

class ConsoleContainer extends React.Component {

  static propTypes = {
  }

  componentDidMount() {
    var oldLog = console.log;
    console.log = function (message) {
        // DO MESSAGE HERE.
        var messageNode = document.createElement("P");
        var text = document.createTextNode(message);
        messageNode.appendChild(text);
        document.getElementById('test').appendChild(messageNode);

        oldLog.apply(console, arguments);
    };
  }
  runCode(e) {
    var theCode = document.getElementById('editor').value;
    eval(theCode);
  }

  render() {
    return(
      <div>
        <div className="body-container">
          <ConsolePresentation userName={this.props.userName} runCode={this.runCode.bind(this)}/>
        </div>
      </div>
    )
  }
}

function mapStateToProps(state){
  return {
    userName: state.userReducer.userName //<=== shouldnt have to do this...? 
  }
}

export default connect(mapStateToProps)(ConsoleContainer)
