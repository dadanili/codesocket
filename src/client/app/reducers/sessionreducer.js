const sessionInitialState = {
  socket : null,
  room: '',
  quill: null,
  modalopen: false,
  videoChannelReady: false,
  pc: null,
  buffer: [],
  serverquill: null
  // serverEditor: []
}

export default function sessionReducer (state = sessionInitialState, action) {
  switch(action.type){
    case 'UPDATE_SOCKET' : {
     return {
       ...state, 
       socket: action.socket
     }
    }    
    case 'UPDATE_BUFFER' : {
     return {
       ...state, 
       buffer: action.buffer
     }
    }    
    case 'VIDEO_CHANNEL_READY' : {
     return {
       ...state, 
       videoChannelReady: action.videoChannelReady
     }
    }
    case 'UPDATE_ROOM' : {
     return {
       ...state, 
       room: action.room
     }
    }
    case 'UPDATE_QUILL' : {
      return {
        ...state,
        quill: action.quill
      }
    }    
    case 'UPDATE_SERVERQUILL' : {
      console.log('i am in reducer for UPDATE_SERVERQUILL', action.serverquill)
      return {
        ...state,
        serverquill: action.serverquill
      }
    }
    case 'DOC_SELECTION_MODAL' : {
     return {
       ...state, 
       modalopen: action.modalopen
     }
    }
    case 'UPDATE_PC' : {
     return {
       ...state, 
       pc: action.pc
     }
    }
    default : {
     return state
    }
  }
}


//make copy of state
//  update property socket in copy
// return copy