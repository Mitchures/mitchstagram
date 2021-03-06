import React, { useState} from 'react';
import './Profile.css';
import Avatar from "@material-ui/core/Avatar";
import {Button} from "@material-ui/core";
import Modal from "@material-ui/core/Modal";
import {makeStyles} from "@material-ui/core/styles";
import { auth, db, storage } from "../firebase";
import CircularProgress from "@material-ui/core/CircularProgress";
import { fixImageOrientation } from "../utils/fixImageFileOrientation";

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
    backgroundColor: theme.palette.background.paper,
    boxShadow: '0 2px 3px 0 rgba(0,0,0,0.075)',
    padding: theme.spacing(4),
  },
  large: {
    width: theme.spacing(20),
    height: theme.spacing(20),
  },
  input: {
    display: 'none',
  },
}));

function Profile({ user }) {
  const classes = useStyles();
  const [modalStyle] = useState(getModalStyle());
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [avatar, setAvatar] = useState(user.photoURL);
  const [progress, setProgress] = useState(0);
  const [openDelete, setOpenDelete] = useState(false);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) {
        alert("File is too big! 2 MB Max.");
      } else {
        fixImageOrientation(file)
          .then(newFile => setImage(newFile));
      }
    }
  };

  const readURL = (input) => URL.createObjectURL(input);

  const handleSave = (event) => {
    event.preventDefault();

    //TODO: figure out how to pull in the compressed resized image from firebase

    const uploadTask = storage
      .ref(`images/${user.uid}/profile/${user.uid}`)
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
          .ref(`images/${user.uid}/profile`)
          .child(`${user.uid}`)
          .getDownloadURL()
          .then(url => {
            // set image to user
            auth
              .currentUser
              .updateProfile({
                photoURL: url,
              })
              .then(() => {
                // set image to user collection in db for access when not authenticated
                db
                  .collection("users")
                  .doc(`${user.uid}`)
                  .update({
                    photoURL: url
                  })
                  .then(() => {
                    setAvatar(url);
                    setProgress(0);
                    setImage(null);
                    setOpen(false);
                    window.scrollTo(0, 0);
                  });
              })
              .catch((error) => alert(error.message));
          });
      }
    )
  };

  const handleDelete = () => {
    db
      .collection("posts")
      .where(`author.uid`, "==", user.uid)
      .get()
      .then(snapshot => {
        snapshot.forEach(doc => doc.ref.delete());
      })
      .then(() => {
        auth
          .currentUser
          .delete()
          .catch((error) => alert(error.message));
      })
      .catch((error) => alert(error.message));

    setOpen(false);
    setOpenDelete(false);
  };

  return (
    <div className="profile">
      <Modal
        open={open}
        onClose={() =>  setOpen(false)}
        className={classes.backdrop}
      >
        <div style={modalStyle} className={classes.paper}>
          <form className="profile__preferences">
            <CircularProgress
              style={{display: progress > 0 ? "block" : "none"}}
              className="profile__progress"
              value={progress}
              max={100}
              variant="static"
            />
            <input
              accept="image/*"
              className={classes.input}
              onChange={handleChange}
              id="icon-button-file"
              type="file"
            />
            <label htmlFor="icon-button-file">
              <Avatar
                style={{opacity: progress > 0 ? 0.25 : 1}}
                className={`${classes.large} profile__addAvatar`}
                alt={user.displayName}
                src={image ? readURL(image) : (avatar ? avatar :`/static/images/avatar/1.jpg`)}
              />
            </label>
            {/*<input*/}
            {/*  className="profile__input"*/}
            {/*  placeholder="username"*/}
            {/*  type="text"*/}
            {/*  value={user.display}*/}
            {/*  onChange={}*/}
            {/*/>*/}
            {/*<input*/}
            {/*  placeholder="email"*/}
            {/*  type="text"*/}
            {/*  value={user.username}*/}
            {/*/>*/}
            {/*<input*/}
            {/*  placeholder="password"*/}
            {/*  type="password"*/}
            {/*/>*/}
            <Button
              className="profile__save"
              type="submit"
              disabled={!image}
              onClick={handleSave}
            >
              Save
            </Button>
            <Button
              className="profile__logout"
              onClick={() => auth.signOut()}
            >
              Logout
            </Button>
            <Button
              className="profile__delete"
              onClick={() => setOpenDelete(true)}
            >
              Delete Account
            </Button>
          </form>
        </div>
      </Modal>

      <Modal
        open={openDelete}
        onClose={() =>  setOpenDelete(false)}
        className={classes.backdrop}
      >
        <div style={modalStyle} className={classes.paper}>
          <h3>Delete Account</h3>
          <p>Are you sure you want to <strong>permanently</strong> delete your account?</p>
          <div className="profile__deleteModalButtonGroup">
            <Button
              className="profile__delete"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      <Avatar
        className="profile__avatar"
        alt={user.displayName}
        src={avatar}
        onClick={() => setOpen(true)}
      />
    </div>
  );
}

export default Profile;
