import React, {useState} from 'react';
import {Button} from "@material-ui/core";
import firebase from "firebase";
import {db, storage} from "./firebase";
import { makeStyles } from "@material-ui/core/styles";
import CircularProgress from '@material-ui/core/CircularProgress';

import './ImageUpload.css';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    '& > * + *': {
      marginLeft: theme.spacing(2),
    },
  },
}));

function ImageUpload({ username }) {
  const classes = useStyles();

  const [image, setImage] = useState(null);
  const [progress, setProgress] = useState(0);
  const [caption, setCaption] = useState('');

  const handleChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    const uploadTask = storage
      .ref(`images/${image.name}`)
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
          .ref("images")
          .child(image.name)
          .getDownloadURL()
          .then(url => {
            // post image in db
            db.collection("posts").add({
              timestamp: firebase.firestore.FieldValue.serverTimestamp(),
              caption: caption,
              image: url,
              username: username,
            });

            setProgress(0);
            setCaption("");
            setImage(null);
          });
      }
    )
  };

  return (
    <div className="imageUpload">
      <CircularProgress
        className="imageUpload__progress"
        value={progress}
        max={100}
        variant="static"
      />
      <input
        type="text"
        placeholder="Enter a caption..."
        value={caption}
        onChange={event => setCaption(event.target.value)}
      />
      <input type="file" onChange={handleChange}/>
      <Button
        disabled={!image}
        className="imageUpload__button"
        onClick={handleUpload}>
        Upload
      </Button>
    </div>
  );
}

export default ImageUpload;
