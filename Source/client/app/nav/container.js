import React, { PropTypes } from 'react'
import { Router, Route, hashHistory, IndexRoute, Link } from 'react-router'
import { connect } from 'react-redux'
import NavPresentation from './presentation'
import axios from 'axios'

class NavContainer extends React.Component {

  static propTypes = {
  };

  // componentWillMount() {
  // } 

  componentDidMount() {
    //console.log('it hit componentDidMount =====>', this.state.user, this.props);
  }
  addDoc() {
    console.log('==================props', this.props)
    var name = prompt('What\'s your name?');
    this.props.dispatch({
      type: 'UPDATE_USER', 
      userName: name
    });

    // axios.get()
    hashHistory.push('/doc');
  }

  render() {
    return(
      <div>
        <div className="body-container">
          <NavPresentation addDoc={this.addDoc.bind(this)} userName={this.props.userName}/>
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

export default connect(mapStateToProps)(NavContainer)
