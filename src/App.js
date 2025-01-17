// App.js

import React, { useState, useEffect } from 'react';
import useSocket from 'use-socket.io-client';
import { useImmer } from 'use-immer';

import './index.css';

let uniqueID = 1;
const Messages = props => props.data.map(m => m[0] !== '' ? (<li key={uniqueID++}><strong>{m[0]}</strong> : <div className="innermsg">{m[1]}</div></li>) : (<li className="update" key={uniqueID++}>{m[1]}</li>) );

const Online = props => props.data.map(m => <li id={m[0]} key={uniqueID++}>{m[1]}</li>);

export default () => {
  const [id, setId] = useState('');
  const [name, setNameInput] = useState('');
  const [room, setRoom] = useState('');
  const [input, setInput] = useState('');

  const [socket] = useSocket('https://open-chat-naostsaecf.now.sh');
  socket.connect();

  const [messages, setMessages] = useImmer([]);
  const [online, setOnline] = useImmer([]);

  useEffect(() => {
    socket.on('message que', (nick, message) => {
      setMessages(draft => {
        draft.push([nick, message])
      })
    });

    socket.on('update', message => setMessages(draft => {
      draft.push(['', message]);
    }));

    socket.on('people-list', people => {
      let newState = [];
      for (let person in people) {
        newState.push([people[person].id, people[person].nick]);
      }
      setOnline(draft=>{draft.push(...newState)});
    });

    socket.on('add-person', (nick, id) => {
      setOnline(draft => {
        draft.push([id, nick])
      })
    });

    socket.on('remove-person', id => {
      setOnline(draft => draft.filter(m => m[0] !== id))
    });

    socket.on('chat message', (nick, message) => {
      setMessages(draft => {draft.push([nick, message])})
    });
  }, 0);

  const handleSubmit = e => {
    e.preventDefault();
    if (!name) {
      return alert("Name can't be empty");
    }
    setId(name);
    socket.emit("join", name, room);
  };

  const handleSend = e => {
    e.preventDefault();
    if(input !== ''){
      socket.emit('chat message', input, room);
      setInput('');
    }
  };

  return id ? (
    <section>
      <div id="chat">
        <ul id="messages"><Messages data={messages} /></ul>
        <div id="sendform">
          <form onSubmit={e => handleSend(e)}>
              <input id="msg" value={input} onChange={e => setInput(e.target.value.trim())} /><button type="submit">Send</button>
          </form>
        </div>
      </div>
      <ul id="online"> &#x1f310; : <Online data={online} /> </ul>
    </section>
  ) : (
    <div id="login">
      <form onSubmit={event => handleSubmit(event)}>
        <input id="name" onChange={e => setNameInput(e.target.value.trim())} required placeholder="What is your name .." /><br />
        <input id="room" onChange={e => setRoom(e.target.value.trim())} placeholder="What is your room .." /><br />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};
