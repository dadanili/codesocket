import React, { PropTypes, Component } from 'react';
import {Link} from 'react-router';

const NavPresentation = (props) => {
    return (
      <div className='loadingscreen'>
        <ul>
          <li><Link >Rooms</Link></li>
          <li onClick={e=>props.addDoc(e)}><button >Add New Doc</button></li>
          <li>{props.userName}</li>
          <li>History</li>
        </ul>
      </div>
      )
}

export default NavPresentation;