import React, {useState} from 'react';
import {Button} from "@material-ui/core";
import firebase from "firebase";
import {db, storage} from "../firebase";
import { makeStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import IconButton from '@material-ui/core/IconButton';
import PhotoCamera from '@material-ui/icons/PhotoCamera';
import { v4 as uuidv4 } from 'uuid';

import './ImageUpload.css';

const useStyles = makeStyles((theme) => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
    },
  },
  input: {
    display: 'none',
  },
}));

function ImageUpload({ currentUser, openAddPost }) {
  const classes = useStyles();

  const [image, setImage] = useState(null);
  const [progress, setProgress] = useState(0);
  const [caption, setCaption] = useState('');

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if(file.size > 1000000){ // 1 MB max
        alert("File is too big!");
      } else {
        setImage(file);
      }
    }
  };

  const handleUpload = () => {

    //TODO: figure out how to pull in the compressed resized image from firebase

    // set unique ID for images to prevent duplicate image names
    const uuid = uuidv4();

    const uploadTask = storage
      .ref(`images/${currentUser.uid}/posts/${uuid}`)
      .put(image);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // progress function...
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setProgress(progress);
      },
      (error) => {
        console.log(error);
        alert(error.message);
      },
      () => {
        // complete function...
        storage
          .ref(`images/${currentUser.uid}/posts`)
          .child(`${uuid}`)
          .getDownloadURL()
          .then(url => {
            // post image in db
            db
              .collection("posts")
              .add({
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                caption: caption,
                image: url,
                author: {
                  uid: currentUser.uid,
                  username: currentUser.displayName
                }
            });

            setProgress(0);
            setCaption("");
            setImage(null);
            openAddPost(false);
            window.scrollTo(0, 0);
          });
      }
    )
  };

  const readURL = (input) => URL.createObjectURL(input);

  return (
    <div className="imageUpload">

      <CircularProgress
        className="imageUpload__progress"
        value={progress}
        max={100}
        variant="static"
      />

      {image && (
        <img
          style={{opacity: progress > 0 ? 0.25 : 1}}
          className="imageUpload__preview"
          src={readURL(image)}
          alt={image.name}
        />
      )}

      <div className="imageUpload__inputContainer">
        <input
          accept="image/*"
          className={classes.input}
          onChange={handleChange}
          id="icon-button-file"
          type="file"
        />
        <label htmlFor="icon-button-file">
          <IconButton
            color="primary"
            aria-label="upload picture"
            className="imageUpload__iconButton"
            component="span">
            <PhotoCamera />
          </IconButton>
        </label>

        <input
          className="imageUpload__input"
          type="text"
          placeholder="Enter a caption..."
          value={caption}
          onChange={event => setCaption(event.target.value)}
        />
      </div>

      <Button
        disabled={!image}
        className="imageUpload__button"
        onClick={handleUpload}>
        Post
      </Button>

    </div>
  );
}

export default ImageUpload;
