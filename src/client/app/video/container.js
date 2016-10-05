import React, { PropTypes } from 'react'
import { Router, Route, hashHistory, IndexRoute, Link } from 'react-router'
import { connect } from 'react-redux'
import VideoPresentation from './presentation'
import axios from 'axios'

class VideoContainer extends React.Component {
  constructor(props) {
    super(props);
  }
  // static propTypes = {
  // }
  componentWillUnmount () {
    console.log('video will unmount');

    // console.log(this.props.pc)
    
    if(this.props.pc && this.props.pc.signalingState !== 'closed') {
      this.props.pc.close();
    }
    this.props.socket.emit('message', 'bye');
    this.props.socket.disconnect();
    this.props.dispatch({
      type: 'UPDATE_SOCKET',
      socket: null
    });
  }
  componentDidMount() {
    var isChannelReady = false;
    var isInitiator = false;
    var isStarted = false;
    var localStream;
    var pc;
    var remoteStream;
    var turnReady;
    var context = this;

    var pcConfig = {
      'iceServers': [{
        'url': 'stun:stun.l.google.com:19302'
      }]
    };

    // Set up audio and video regardless of what devices are present.
    var sdpConstraints = {
      'mandatory': {
        'OfferToReceiveAudio': true,
        'OfferToReceiveVideo': true
      }
    };

    /////////////////////////////////////////////

    //var room = 'foo';
    // Could prompt for room name:
    //room = prompt('Enter room name:');
    var room = this.props.room;

    document.querySelector('#room-name').innerHTML = 'Welcome to room: ' + JSON.stringify(room);
    var socket = this.props.socket;
    //var socket = this.props.socket;
    console.log('socket inside video container', socket);
    //var socket = io.connect('/' + room);

    if (room !== '') {
      socket.emit('create or join', room);
      console.log('Attempted to create or  join room', room);
    }

    socket.on('created', function(room) {
      console.log('Created room ' + room);
      isInitiator = true;
      console.log('i am initiator?', isInitiator)
    });

    socket.on('full', function(room) {
      console.log('Room ' + room + ' is full');
    });

    socket.on('join', function (room){
      console.log('Another peer made a request to join room ' + room);
      console.log('This peer is the initiator of room ' + room + '!');
      isChannelReady = true;
    });

    socket.on('joined', function(room) {
      console.log('joined: ' + room);
      isChannelReady = true;
    });

    socket.on('log', function(array) {
      console.log.apply(console, array);
    });

    ////////////////////////////////////////////////

    function sendMessage(message) {
      console.log('Client sending message: ', message);
      socket.emit('message', message);
    }

    // This client receives a message
    socket.on('message', function(message) {
      console.log('Client received message:', message);

      if (message === 'got user media') {
        maybeStart();
      } else if (message.type === 'offer') {
        if (!isInitiator && !isStarted) {
          maybeStart();
        }
        pc.setRemoteDescription(new RTCSessionDescription(message));
        doAnswer();
      } else if (message.type === 'answer' && isStarted) {
        pc.setRemoteDescription(new RTCSessionDescription(message));
      } else if (message.type === 'candidate' && isStarted) {
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: message.label,
          candidate: message.candidate
        });
        pc.addIceCandidate(candidate);
      } else if (message === 'bye' && isStarted) {
        console.log('handling remote hangup!!!!!!!');
        handleRemoteHangup();
        isInitiator = true;
      }
    });

    ////////////////////////////////////////////////////

    var localVideo = document.querySelector('#localVideo');
    var remoteVideo = document.querySelector('#remoteVideo');


      navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      })
      .then(gotStream)
      .catch(function(e) {
        alert('getUserMedia() error: ' + e.name);
      });

    function gotStream(stream) {
      console.log('Adding local stream.');
      localVideo.src = window.URL.createObjectURL(stream);
      localStream = stream;
      sendMessage('got user media');
      if (isInitiator) {
        maybeStart();
      }
    }

    var constraints = {
      video: true
    };

    console.log('Getting user media with constraints', constraints);

    // if (location.hostname !== 'localhost') {
    //   requestTurn(
    //     'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
    //   );
    // }

    function maybeStart() {
      console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
      if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
        console.log('>>>>>> creating peer connection');
        createPeerConnection();
        pc.addStream(localStream);
        isStarted = true;
        console.log('isInitiator', isInitiator);
        if (isInitiator) {
          console.log('before do call')
          doCall();
        }
      }
    }

    window.onbeforeunload = function() {
      sendMessage('bye');
    };

    /////////////////////////////////////////////////////////

    function createPeerConnection() {
      try {
        pc = new RTCPeerConnection(null);
        pc.onicecandidate = handleIceCandidate;
        pc.onaddstream = handleRemoteStreamAdded;
        pc.onremovestream = handleRemoteStreamRemoved;
        console.log('Created RTCPeerConnnection');
        context.props.dispatch({
              type: 'UPDATE_PC', 
              pc: pc
        });
      } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.');
        return;
      }
    }

    function handleIceCandidate(event) {
      console.log('icecandidate event: ', event);
      if (event.candidate) {
        sendMessage({
          type: 'candidate',
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate,
          theRoom: room
        });
      } else {
        console.log('End of candidates.');
      }
    }

    function handleRemoteStreamAdded(event) {
      console.log('Remote stream added.');
      remoteVideo.src = window.URL.createObjectURL(event.stream);
      remoteStream = event.stream;
    }

    function handleCreateOfferError(event) {
      console.log('createOffer() error: ', event);
    }

    function doCall() {
      console.log('Sending offer to peer');
      pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
    }

    function doAnswer() {
      console.log('Sending answer to peer.');
      pc.createAnswer().then(
        setLocalAndSendMessage,
        onCreateSessionDescriptionError
      );
    }

    function setLocalAndSendMessage(sessionDescription) {
      // Set Opus as the preferred codec in SDP if Opus is present.
      //  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
      pc.setLocalDescription(sessionDescription);
      console.log('setLocalAndSendMessage sending message', sessionDescription);
      sendMessage(sessionDescription);
    }

    function onCreateSessionDescriptionError(error) {
      //trace('Failed to create session description: ' + error.toString());
    }

    function requestTurn(turnURL) {
      var turnExists = false;
      for (var i in pcConfig.iceServers) {
        if (pcConfig.iceServers[i].url.substr(0, 5) === 'turn:') {
          turnExists = true;
          turnReady = true;
          break;
        }
      }
      if (!turnExists) {
        console.log('Getting TURN server from ', turnURL);
        // No TURN server. Get one from computeengineondemand.appspot.com:
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4 && xhr.status === 200) {
            var turnServer = JSON.parse(xhr.responseText);
            console.log('Got TURN server: ', turnServer);
            pcConfig.iceServers.push({
              'url': 'turn:' + turnServer.username + '@' + turnServer.turn,
              'credential': turnServer.password
            });
            turnReady = true;
          }
        };
        xhr.open('GET', turnURL, true);
        xhr.send();
      }
    }

    function handleRemoteStreamAdded(event) {
      console.log('Remote stream added.');
      remoteVideo.src = window.URL.createObjectURL(event.stream);
      remoteStream = event.stream;
    }

    function handleRemoteStreamRemoved(event) {
      console.log('Remote stream removed. Event: ', event);
    }

    function hangup() {
      console.log('Hanging up.');
      stop();
      sendMessage('bye');
    }

    function handleRemoteHangup() {
      console.log('Session terminated.');
      stop();
      isInitiator = false;
    }

    function stop() {
      isStarted = false;
      // isAudioMuted = false;
      // isVideoMuted = false;
      pc.close();
      pc = null;
    }

    ///////////////////////////////////////////

    // Set Opus as the default audio codec if it's present.
    function preferOpus(sdp) {
      var sdpLines = sdp.split('\r\n');
      var mLineIndex;
      // Search for m line.
      for (var i = 0; i < sdpLines.length; i++) {
        if (sdpLines[i].search('m=audio') !== -1) {
          mLineIndex = i;
          break;
        }
      }
      if (mLineIndex === null) {
        return sdp;
      }

      // If Opus is available, set it as the default in m line.
      for (i = 0; i < sdpLines.length; i++) {
        if (sdpLines[i].search('opus/48000') !== -1) {
          var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
          if (opusPayload) {
            sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex],
              opusPayload);
          }
          break;
        }
      }

      // Remove CN in m line and sdp.
      sdpLines = removeCN(sdpLines, mLineIndex);

      sdp = sdpLines.join('\r\n');
      return sdp;
    }

    function extractSdp(sdpLine, pattern) {
      var result = sdpLine.match(pattern);
      return result && result.length === 2 ? result[1] : null;
    }

    // Set the selected codec to the first in m line.
    function setDefaultCodec(mLine, payload) {
      var elements = mLine.split(' ');
      var newLine = [];
      var index = 0;
      for (var i = 0; i < elements.length; i++) {
        if (index === 3) { // Format of media starts from the fourth.
          newLine[index++] = payload; // Put target payload to the first.
        }
        if (elements[i] !== payload) {
          newLine[index++] = elements[i];
        }
      }
      return newLine.join(' ');
    }

    // Strip CN from sdp before CN constraints is ready.
    function removeCN(sdpLines, mLineIndex) {
      var mLineElements = sdpLines[mLineIndex].split(' ');
      // Scan from end for the convenience of removing an item.
      for (var i = sdpLines.length - 1; i >= 0; i--) {
        var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
        if (payload) {
          var cnPos = mLineElements.indexOf(payload);
          if (cnPos !== -1) {
            // Remove CN payload from m line.
            mLineElements.splice(cnPos, 1);
          }
          // Remove CN line in sdp
          sdpLines.splice(i, 1);
        }
      }

      sdpLines[mLineIndex] = mLineElements.join(' ');
      return sdpLines;
    }

    // var callVideoButton = document.querySelector('#call-video');
    // callVideoButton.onclick = function() {
    //   isInitiator = true;
    //   isChannelReady = true;
    //   isStarted = false;
    //   sendMessage('got user media' + room);
    //   // if (!isInitiator) {
    //   maybeStart();
    //   // }

    //   //if (isInitiator) {
    //     //maybeStart();
    //     // doCall();
    //     // sendMessage('got user media' + room);
    //     doCall();
    //   //}
    // };

    // var answerVideoButton = document.querySelector('#answer-video');
    // answerVideoButton.onclick = function() {
    //   //maybeStart();
    // };

    // var stopVideoButton = document.querySelector('#stop-video');
    // stopVideoButton.onclick = function() {
    //   hangup();

    // };  
  }

  render() {
    return (
      <div>
        <div className="body-container">
          <VideoPresentation userName={this.props.userName}/>
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    userName: state.userReducer.userName,
    room: state.sessionReducer.room,
    socket: state.sessionReducer.socket,
    pc: state.sessionReducer.pc
  }
}

export default connect(mapStateToProps)(VideoContainer)
