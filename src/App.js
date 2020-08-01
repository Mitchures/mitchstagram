import React, { useState, useEffect } from 'react';
import Post from './components/Post';
import Logo from "./components/Logo";
import ImageUpload from "./components/ImageUpload";
import './App.css';

import {auth, db} from './firebase'
import Modal from '@material-ui/core/Modal';
import { Button, Input } from '@material-ui/core';
import { makeStyles } from "@material-ui/core/styles";
import Avatar from "@material-ui/core/Avatar";

function getModalStyle() {
  const top = 50;
  const left = 50;

  return {
    top: `${top}%`,
    left: `${left}%`,
    transform: `translate(-${top}%, -${left}%)`,
  };
}

const useStyles = makeStyles((theme) => ({
  backdrop: {
    backgroundColor: 'blue',
  },
  paper: {
    position: 'absolute',
    width: 400,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
}));

function App() {
  const classes = useStyles();
  const [modalStyle] = useState(getModalStyle);

  const [posts, setPosts] = useState([]);
  const [open, setOpen] = useState(false);
  const [openSignIn, setOpenSignIn] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        // user has logged in...
        setUser(authUser);
      } else {
        // user has logged out...
        setUser(null);
      }
    });

    return () => {
      // perform some cleanup actions
      unsubscribe();
    }
  }, [user, username]);

  useEffect(() => {
    db
      .collection('posts')
      .orderBy('timestamp', 'desc')
      .onSnapshot(snapshot => {
        // every time a new post is added, this code fires...
        setPosts(snapshot.docs.map(doc => (
          {
            id: doc.id,
            post: doc.data(),
          }
        )));
      })
  }, []);

  const handleSignUp = (event) => {
    event.preventDefault();

    auth
      .createUserWithEmailAndPassword(email, password)
      .then((authUser) => {
        return authUser.user.updateProfile({
          displayName: username,
        })
      })
      .catch((error) => alert(error.message));

    setOpen(false);
  };

  const handleSignIn = (event) => {
    event.preventDefault();

    auth
      .signInWithEmailAndPassword(email, password)
      .catch((error) => alert(error.message));

    setOpenSignIn(false);
  };

  return (
    <div className="app">

      <Modal
        open={open}
        onClose={() =>  setOpen(false)}
        BackdropProps={{
          classes: {
            root: classes.backdrop,
          }
        }}
      >
        <div style={modalStyle} className={classes.paper}>
          <form className="app__signUp">
            <Logo/>
            <Input
              placeholder="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              placeholder="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              placeholder="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button onClick={handleSignUp}>Sign Up</Button>
          </form>
        </div>
      </Modal>

      <Modal
        open={openSignIn}
        onClose={() =>  setOpenSignIn(false)}
        BackdropProps={{
          classes: {
            root: classes.backdrop,
          }
        }}
      >
        <div style={modalStyle} className={classes.paper}>
          <form className="app__signUp">
            <Logo/>
            <Input
              placeholder="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              placeholder="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button onClick={handleSignIn}>Sign In</Button>
          </form>
        </div>
      </Modal>

      <div className="app__header">
        <div className="app__headerImage">
          <Logo/>
        </div>
        {user ? (
          <div className="app__logoutContainer">
            <Avatar
              className="app__avatar"
              alt={user.displayName}
              src="/static/images/avatar/1.jpg"
            />
            <Button onClick={() => auth.signOut()}>Logout</Button>
          </div>
        ) : (
          <div className="app__loginContainer">
            <Button onClick={() => setOpenSignIn(true)}>Sign In</Button>
            <Button onClick={() => setOpen(true)}>Sign Up</Button>
          </div>
        )}
      </div>

      <div className="app__posts">
        {
          posts.map(({id, post}) => (
            <Post
              key={id}
              postId={id}
              image={post.image}
              user={user}
              username={post.username}
              caption={post.caption}
              date={post.timestamp && `${post.timestamp.toDate().toDateString()}`}
            />
          ))
        }
      </div>

      {user && (
        <ImageUpload
          username={user.displayName}
        />
      )}

    </div>
  );
}

export default App;
