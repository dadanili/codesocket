import React, { PropTypes } from 'react'
import { Router, Route, hashHistory, IndexRoute, Link } from 'react-router'
import { connect } from 'react-redux'
import EditorPresentation from './presentation'
import axios from 'axios'

var Quill = require('quill');

class EditorContainer extends React.Component {

  constructor(props) {
    super(props);
    // console.log('in constructor');
    // this.myInserts = [];
  }

  componentWillMount() {
    hljs.configure({   // optionally configure hljs
      languages: ['javascript']
    });
  }

  componentWillUnmount() {
    // console.log('does editor unmount');
  }

  componentDidMount() {
    var context = this; 
    // console.log('----------context', context, context.props.myInserts);
    var socket = this.props.socket;
    // var socket = io.connect();

    // console.log('socket inside editor container', socket);
    // console.log('didmount woohooo');
    // var socket = io();
    var quill = new Quill('#editor', {
        modules: {
        syntax: true,              // Include syntax module
        toolbar: [['code-block']]  // Include button in toolbar
      },
      formats: ['code-block'],
      theme: 'snow'

      });

    var serverquill = new Quill('#serverEditor')
    // console.log('serverquill', serverquill);


    document.getElementsByClassName('ql-code-block')[0].click();
    document.getElementsByClassName('ql-toolbar')[0].remove();
    hljs.configure({   // optionally configure hljs
      languages: ['javascript']
    });

    socket.on('fetched live', function(latest){
      // console.log('fetched!!!', latest, latest.ops)
      // console.log('got last elem', latest.ops[latest.ops.length -1].insert)
      // delete latest.ops[latest.ops.length -1].insert;
      // var delta = {
      //   ops: [latest.ops[0]]
      // }
      quill.setContents(latest, 'api');
    });

    socket.on('found latest doc', function(doc){
      // console.log('latest doc', doc);
      // var delta = {
      //   ops: [{insert: doc['doc_content']}]
      // }
      var docContent = JSON.parse(doc['doc_content']);
      if (docContent) {
        quill.setContents(docContent, 'api');
      }
    })

    socket.on('fetch live version', function(requestId){
      // console.log('in fetch latest')
      var delta = quill.getContents();
      // console.log('fetchd', delta)
      var response = {
        delta: delta,
        requestId: requestId
      }
      socket.emit('live version', response);
      // context.props.myInserts = [];
      context.props.dispatch({
        type: 'UPDATE_EDITOR_INSERTS',
        myInserts: []
      })
    })

    // socket.on('receive', function(delta) {
    //   console.log('-----------receive', delta);
    //   //do math
    //   var insertionIndex = JSON.parse(delta)[0].retain || 0;
    //   // console.log('insertionIndex', insertionIndex);
    //   var counter = 0;
    //   for(var i = 0; i < context.props.myInserts.length; i++){
    //     if(context.props.myInserts[i] < insertionIndex) {
    //       counter++;
    //     }
    //   }

    //   var newDelta = JSON.parse(delta);
    //   // console.log('newDelta', newDelta,counter)


    //   var oldIndex = newDelta[0].retain;
    //   newDelta[0].retain += counter;
    //   quill.updateContents(newDelta, 'api');
    //   // console.log('newnewDelta=====', newDelta)

    //   // console.log('before client emit doned', oldIndex)
    //   socket.emit('changesToApply', JSON.stringify({oldIndex:oldIndex}));
    // });
    socket.on('done', function(index) {
      // console.log('---------index', index)
      index= JSON.parse(index).oldIndex;
      // console.log('in done got index:', index)
      var removeIndex = context.props.myInserts.indexOf(index);
      // console.log('oldmyInserts', context.myInserts);

      // console.log('removeIndex', removeIndex);
      context.props.myInserts.splice(removeIndex, 1);
      // console.log('newmyInserts', context.myInserts);

    });

    quill.on('text-change', function(delta,olddelta,source) {
      // console.log('get delta', delta.ops[0],delta.ops[1])
      console.log('omg-------------', delta)
      var arr = [];

      console.log('user-------------', source)
      if(source === 'user') {
        var opPackage = {
          history: context.props.quillHistory,
          id: socket.id,
          op: delta.ops,
          room: context.props.room
        }
        console.log('serverquill:', context.props.serverState);
        console.log('my change history:',context.props.quillHistory);
        console.log('are they equal?:', context.props.serverState === context.props.quillHistory);

        console.log('inflight Op:', context.props.inFlightOp);

        if(context.props.serverState === context.props.quillHistory){
          //send change to server
          
          if(delta.ops[0].retain === undefined){
            delta.ops.unshift({retain:0});
          }

          // console.log('my current room', context.props.room)
          console.log('woo new delta', delta)
          var inFlightOp = opPackage;
          context.props.dispatch({
            type: 'UPDATE_INFLIGHTOP',
            inFlightOp: [inFlightOp]
          })
          console.log('a inFlightOp', inFlightOp)
          console.log('calling---------------------------------------')
          socket.emit('add inflight op', JSON.stringify(inFlightOp))

        } else {

          var newBufferString = JSON.stringify(context.props.buffer);
          var newBufferObj = JSON.parse(newBufferString);
          newBufferObj.push(opPackage);
          console.log('server state:', context.props.serverState);
          console.log('buffer:', newBufferObj);

          context.props.dispatch({
            type: 'UPDATE_BUFFER',
            buffer: newBufferObj
          })
        }
      };

      context.props.dispatch({
        type: 'UPDATE_QUILLHISTORY',
        quillHistory: context.props.quill.getText()
      })
      
    });

    context.props.socket.on('clear inflight', function(inFlightOp){
      console.log('in clear inflight!!------', inFlightOp)
      context.props.dispatch({
        type: 'UPDATE_INFLIGHTOP', 
        inFlightOp: []
      });
    })

    context.props.socket.on('newOp', function(transformedOp){
      console.log('got transformation:', transformedOp);
      console.log('got transformation:', transformedOp.op);
      console.log('got new thing! ==========================')
      // console.log('got transformation:', transformedOp.id, socket.id);
      if(transformedOp.op[0].retain === 0){
        console.log('delete retains 0');
        var serverOpRetain = 0;
        var serverOpInsert = transformedOp.op[1].insert;
        var serverOp = [{insert: serverOpInsert}]

      } else {
        var serverOpRetain = transformedOp.op[0].retain;
        var serverOpInsert = transformedOp.op[1].insert;
        var serverOp = [{retain: serverOpRetain}, {insert: serverOpInsert}]
      }

      if(transformedOp.id !== socket.id){
        console.log('not mine! ---------------------')

        context.props.dispatch({
          type: 'UPDATE_INCOMINGOP', 
          incomingOp: transformedOp
        });
        console.log('my buffer ', context.props.buffer)
        
          if(context.props.inFlightOp.length){
            console.log('getting transformed by inflight ', context.props.inFlightOp)
            //ot
            var transformedOpString = JSON.stringify(transformedOp);
            var transformedOp = JSON.parse(transformedOpString)

            var inflightString = JSON.stringify(context.props.inFlightOp);
            var inflight = JSON.parse(inflightString)

            context.oTransform(transformedOp, inflight, function(newTransformedOp, newBridge){

              context.props.dispatch({
                type: 'UPDATE_INCOMINGOP', 
                incomingOp: newTransformedOp
              });
              console.log('new inflightop', newBridge)
              context.props.dispatch({
                type: 'UPDATE_INFLIGHTOP', 
                inFlightOp: newBridge
              });
            })
          }

          if(context.props.buffer.length){
            //ot
            console.log('getting transformed by buffer', context.props.buffer)
            var incomingString = JSON.stringify(context.props.incomingOp);
            var incoming = JSON.parse(incomingString);

            var bufferString = JSON.stringify(context.props.buffer);
            var buffer = JSON.parse(bufferString);

            context.oTransform(incoming, buffer, function(newTransformedOp, newBridge){
              context.props.dispatch({
                type: 'UPDATE_INCOMINGOP', 
                incomingOp: newTransformedOp
              });

              context.props.dispatch({
                type: 'UPDATE_BUFFER', 
                buffer: newBridge
              });
            })
          }
          console.log('before finding 0 context.props.incomingOp.op', context.props.incomingOp.op)

          if(context.props.incomingOp.op[0].retain === 0){
             context.props.incomingOp.op.shift();
          }

          console.log('after finding 0 context.props.incomingOp.op', context.props.incomingOp.op)
          quill.updateContents({ops:context.props.incomingOp.op}, 'api');
          // apply result to 
      } 
      //update server quill

      serverquill.updateContents({ops:serverOp}, 'api');
      context.props.dispatch({
        type: 'UPDATE_SERVERSTATE', 
        serverState: serverquill.getText()
      });

      //flush buffer
      var bufferString = JSON.stringify(context.props.buffer);
      var buffer = JSON.parse(bufferString);

      console.log('before flushing buffer:', context.props.buffer, buffer)
      console.log('buffer length:', context.props.buffer.length, buffer.length)
      console.log('inFlightOp length:', context.props.inFlightOp.length)
      if(buffer.length && context.props.inFlightOp.length === 0){
        console.log('flushing buffer--------------')
        var inFlightOp = buffer[0];

        context.props.dispatch({
          type: 'UPDATE_INFLIGHTOP',
          inFlightOp: [inFlightOp]
        })
        console.log('emit after flush buffer', inFlightOp)
        console.log('calling---------------------------------------')

        socket.emit('add inflight op', JSON.stringify(inFlightOp));

        context.props.dispatch({
          type: 'UPDATE_BUFFER',
          buffer: buffer.slice(1)
        })
      }
    })
    socket.on('rejected op', function(operation){
      //add to buffer and update

      console.log('in rejected op ===================', operation)
      console.log('inflightop---------->', context.props.inFlightOp)

      if(context.props.inFlightOp.length){
        var insert = context.props.inFlightOp[0].op[1].insert;
        var retain = context.props.inFlightOp[0].op[0].retain;
        var history = context.props.inFlightOp[0].history;
        var op = [{retain: retain}, {insert: insert}]
        var opPackage = {
          history: history,
          id: socket.id,
          op: op,
          room: context.props.room
        }
        context.props.dispatch({
          type: 'UPDATE_REJECTEDOP',
          rejectedOp: opPackage
        })
        console.log('opPackage', opPackage);
        console.log('opPackage', context.props.opPackage);
        socket.emit('add inflight op', JSON.stringify(opPackage));
      }

    })


    context.quill = quill;

    context.props.dispatch({
      type: 'UPDATE_QUILL', 
      quill: quill
    });    
    console.log('before setting serverquill', serverquill, this.props.serverquill)
    context.props.dispatch({
      type: 'UPDATE_SERVERQUILL', 
      serverquill: serverquill
    });  
    console.log('--------------------------i am reloaded')  
    context.props.dispatch({
      type: 'UPDATE_QUILLHISTORY', 
      quillHistory: quill.getText()
    });
    context.props.dispatch({
      type: 'UPDATE_SERVERSTATE', 
      serverState: serverquill.getText()
    }); 
    console.log('---serverquill text', context.props.quillHistory)
    console.log('---serverquill text', context.props.serverState)
    console.log('---serverquill text', context.props.serverState === context.props.quillHistory)
    // case 'UPDATE_QUILLHISTORY' : {
    //   console.log('i am in reducer for quillHistory', action.quillHistory)
    //   return {
    //     ...state,
    //     quillHistory: action.quillHistory
    //   }
    // }
  } // ComponentDidMount

  oTransform(newObj, bridge, callback){
    console.log('newObj', newObj);
    console.log('old', bridge);
    console.log('how many in buffer', bridge.length);
    var newOp = newObj.op[0];
    for(var i = 0; i < bridge.length; i++){
      console.log('otransform came here once-----------')
      var oldHistory = bridge[i].history;
      var oldOp = bridge[i].op[0];
      //oldop is an array of arrays of one op
      console.log('oldOp', oldOp);

      var newInsertion = newOp.retain;
      var oldInsertion = oldOp.retain;

      console.log('newInsertion', newInsertion);
      console.log('oldinsertion', oldInsertion);
      if(newInsertion > oldInsertion){
        newInsertion++;
        newOp.retain = newInsertion;
      } else {
        oldInsertion++;
        oldOp.retain = oldInsertion;
        console.log('buffer history before', oldHistory)
      }
      if(newInsertion === oldHistory.length){
        console.log('newInsertion is same as oldhistory');
        newInsertion--;
      }
      oldHistory = oldHistory.slice(0, newInsertion) + newObj.op[1].insert + oldHistory.slice(newInsertion);
      console.log('buffer history after', oldHistory)
      bridge[i].history = oldHistory;
      console.log('2buffer', bridge);
      console.log('2op', newObj.op[0].retain);

    }
    //update buffer
    console.log('final update op', newObj)
    console.log('final update bridge', bridge)
    callback(newObj, bridge);

    // if(oldOp.)
    //if item has insert as key
    //ir item has retain as key
  }
  saveCode() {
    var contents = this.props.quill.getContents();
    var gettext = this.props.quill.getText();
    
    console.log('contents',contents);
    console.log('gettext',gettext);
    console.log('serverquill', this.props.serverquill)
    var serverquilltext =  this.props.serverquill.getText();
    console.log('compare server to client', serverquilltext === gettext)

    $.ajax({
      url: '/savedoc',
      type: "POST",
      data: {'room': this.props.room, 'contents': JSON.stringify(contents.ops)},
      success: function(response) {
        console.log((response));
      }
    });

  }
  type() {
    if(this.props.quill.getText().length < 3){
      this.props.quill.updateContents({ops: [{insert: 'abcdefghijk'}]}, 'user');
    }
    var starttyping = function(){
      var char = Math.floor(Math.random()*10) + '';
      var index = Math.floor(Math.random() * this.props.quill.getText().length);
      var op = [{retain: index}, {insert: char}];
      console.log('op', op)
      this.props.quill.updateContents({ops: op}, 'user');
    }
    var freq = Math.floor(Math.random()*500 + 300)
    this.typenow = setInterval(starttyping.bind(this), freq);
    // var inject = [{retain:2}, {insert: 'DANI'}, {retain: 1}, {insert: 'SAM'}]
    // this.props.quill.updateContents({ops: inject}, 'user');

  }
  stopTyping() {
    window.clearInterval(this.typenow);
  }
  render() {
    return(
      <div className="body-container">
        <button onClick={e=>this.type()}>start typing </button>
        <button onClick={e=>this.stopTyping()}>stop typing </button>
        <EditorPresentation saveCode={this.saveCode.bind(this)}/>
        <div id='serverEditor' >
        </div>
      </div>
    )
  }
}

function mapStateToProps(state){
  return {
    userName: state.userReducer.userName,
    myInserts: state.userReducer.myInserts,
    socket: state.sessionReducer.socket,
    room: state.sessionReducer.room,
    quill: state.sessionReducer.quill,
    quillHistory: state.sessionReducer.quillHistory,
    serverquill: state.sessionReducer.serverquill,
    buffer: state.sessionReducer.buffer,
    inFlightOp: state.sessionReducer.inFlightOp,
    incomingOp: state.sessionReducer.incomingOp,
    serverState: state.sessionReducer.serverState,
    rejectedOp: state.sessionReducer.rejectedOp
  }
}

export default connect(mapStateToProps)(EditorContainer)
