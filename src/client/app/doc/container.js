import React, { PropTypes } from 'react'
import { Router, Route, hashHistory, IndexRoute, Link } from 'react-router'
import { connect } from 'react-redux'
import EditorContainer from '../editor/container';
import VideoContainer from '../video/container';
import ConsoleContainer from '../console/container';

class DocContainer extends React.Component {

  constructor (props) {
    super(props);
  }

  componentWillMount() {
    console.log('room name', this.props.room)
    var socket = io();
    this.props.dispatch({
      type: 'UPDATE_SOCKET',
      socket: socket
    });
    console.log('will mount', this.props)
  // }
  // componentDidMount(){
    var room = this.props.room;
    // con
    if (room !== '') {
      // socket.emit('join room', room);
      console.log('BEFORE EMIT OPEN OR JOIN', room, this.props)
      socket.emit('open or join', room);
      console.log('Attempted to create or  join room', room);
    } else {
      var room = prompt('Enter a room name.');
      this.props.dispatch({
        type: 'UPDATE_ROOM', 
        room: room
      });
    }
  }

  render () {

    return (
      <div>
        <div className="body-container">
          <div className="row">
            <div className="col-sm-6"><EditorContainer /></div>
            <div className="col-sm-6">
              <VideoContainer />
              <ConsoleContainer /> 
            </div>
          </div>
          <div className="row">
            <div className="col-sm-12">
              <div className="text-center"></div>
            </div>
          </div>
        </div>
      </div>
    );

  }
}

//export default DocContainer;

function mapStateToProps(state) {
  return {
    userName: state.userReducer.userName,
    room: state.sessionReducer.room,
    socket: state.sessionReducer.socket
  }
}

 export default connect(mapStateToProps)(DocContainer)