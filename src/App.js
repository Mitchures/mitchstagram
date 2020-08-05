import React, { useState, useEffect } from 'react';
import Post from './components/Post';
import ImageUpload from "./components/ImageUpload";
import './App.css';
import {auth, db} from './firebase'
import Modal from '@material-ui/core/Modal';
import { Button } from '@material-ui/core';
import { makeStyles } from "@material-ui/core/styles";
import Fab from '@material-ui/core/Fab';
import Add from "@material-ui/icons/Add";
import Profile from "./components/Profile";
import firebase from "firebase";

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
    backdropFilter: 'blur(25px) saturate(120%)',
  },
  paper: {
    position: 'absolute',
    width: '70%',
    maxWidth: 400,
    borderRadius: "1rem",
    backgroundColor: 'white',
    boxShadow: '0 2px 3px 0 rgba(0,0,0,0.075)',
    padding: theme.spacing(4),
  },
}));

function App() {
  const classes = useStyles();
  const [modalStyle] = useState(getModalStyle);

  const [posts, setPosts] = useState([]);
  const [open, setOpen] = useState(false);
  const [openSignIn, setOpenSignIn] = useState(false);
  const [openAddPost, setOpenAddPost] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [display, setDisplay] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setDisplay(true);
    }, 300);
  }, []);

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
        db
          .collection("users")
          .doc(authUser.user.uid)
          .set({
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            uid: authUser.user.uid,
            photoURL: authUser.user.photoURL,
        });
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
        className={classes.backdrop}
      >
        <div style={modalStyle} className={classes.paper}>
          <form className="app__signUp">
            <h2 className="app__headerLogo">mitchstagram.</h2>
            <input
              placeholder="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              placeholder="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              placeholder="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" onClick={handleSignUp}>Sign Up</Button>
          </form>
        </div>
      </Modal>

      <Modal
        open={openSignIn}
        onClose={() =>  setOpenSignIn(false)}
        className={classes.backdrop}
      >
        <div style={modalStyle} className={classes.paper}>
          <form className="app__signUp">
            <h2 className="app__headerLogo">mitchstagram.</h2>
            <input
              placeholder="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              placeholder="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" onClick={handleSignIn}>Sign In</Button>
          </form>
        </div>
      </Modal>

      {user && (
        <Modal
          open={openAddPost}
          onClose={() =>  setOpenAddPost(false)}
          className={classes.backdrop}
        >
          <div style={modalStyle} className={classes.paper}>
            <ImageUpload
              currentUser={user}
              openAddPost={(boolean) => setOpenAddPost(boolean)}
            />
          </div>
        </Modal>
      )}

      <div className="app__header" style={{opacity: display && (1)}}>
        <h2 className="app__headerLogo">mitchstagram.</h2>
        {user ? (
          <div className="app__logoutContainer">
            <Profile
              user={user}
              setUser={(usr) => setUser(usr)}
            />
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
              author={post.author}
              caption={post.caption}
              date={post.timestamp && `${post.timestamp.toDate()}`}
              modal={{classes, modalStyle}}
            />
          ))
        }
      </div>

      {user && (
        <div className="app__add" style={{opacity: display && (1)}}>
          <Fab
            color="primary"
            aria-label="add post"
            className="app__addButton"
            onClick={() => setOpenAddPost(true)}
          >
            <Add />
          </Fab>
        </div>
      )}

      {/*<footer className="app__footer">*/}
      {/*  <p>*/}
      {/*    <span className="MadeWithLove">*/}
      {/*      Made with <FavoriteIcon/> by <a*/}
      {/*        href="https://mitchures.co/"*/}
      {/*        rel="noopener noreferrer"*/}
      {/*        target="_blank">Mitchell Hollander</a> &copy; {new Date().getFullYear()}*/}
      {/*    </span>*/}
      {/*  </p>*/}
      {/*</footer>*/}

    </div>
  );
}

export default App;
