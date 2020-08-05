import React, {useEffect, useState} from 'react';
import './Post.css';
import Avatar from "@material-ui/core/Avatar";
import {db, storage} from "../firebase";
import firebase from "firebase";
import SendIcon from '@material-ui/icons/Send';
import {Button} from "@material-ui/core";
import Moment from "react-moment";
import Modal from "@material-ui/core/Modal";
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import IconButton from "@material-ui/core/IconButton";

function Post({user, postId, image, author, caption, date, modal}) {
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [commentsToShow, setCommentsToShow] = useState(3);
  const [showMore, setShowMore] = useState(false);
  const [avatar, setAvatar] = useState('');
  const [display, setDisplay] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [openPostEdit, setOpenPostEdit] = useState(false);
  const [updatedCaption, setUpdatedCaption] = useState(caption);


  useEffect(() => {
    setTimeout(() => {
      setDisplay(true);
    }, 100);
  }, []);

  useEffect(() => {
    let unsubscribe;
    if (postId) {
      unsubscribe = db
        .collection("posts")
        .doc(postId)
        .collection("comments")
        .orderBy("timestamp", "asc")
        .onSnapshot((snapshot) => {
          setComments(snapshot.docs.map((doc) => (
            {
              id: doc.id,
              comment: doc.data()
            }
          )));
        })
    }

    return () => {
      unsubscribe();
    };
  }, [postId]);

  useEffect(() => {
    db
      .collection('users')
      .doc(author.uid)
      .onSnapshot(snapshot => {
        if (snapshot.data()) {
          setAvatar(snapshot.data().photoURL);
        }
      })
  }, [author]);

  const handlePostComment = (event) => {
    event.preventDefault();

    db
      .collection("posts")
      .doc(postId)
      .collection("comments")
      .add({
        text: comment,
        author: {
          uid: user.uid,
          username: user.displayName
        },
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      })
      .catch(error => console.log(error.message));

    setComment('');
    setCommentsToShow(comments.length + 1);
    if (!showMore) {
      setShowMore(true);
    }
  };

  const ownerOfComment = ({author}) => {
    if (user) {
      if (user.displayName === author.username) return "owner";
    }
  };

  const handleDelete = () => {
    setOpenPostEdit(false);
    setDisplay(false);
    setTimeout(() => {
      db
        .collection("posts")
        .doc(postId)
        .delete()
        .then(() => {
          storage
            .refFromURL(image)
            .delete()
            .catch(error => console.log(error.message))
        })
        .catch(error => console.log(error.message))
    }, 500);
  };

  const handleSave = () => {
    setOpenPostEdit(false);
    db
      .collection("posts")
      .doc(postId)
      .update({
        caption: updatedCaption,
      })
      .catch(error => alert(error.message));
  };

  const handleShowMore = () => {
    if (commentsToShow === 3) {
      setCommentsToShow(comments.length);
      setShowMore(true);
    }
  };

  return (
    <div className="post" style={{opacity: display && (1)}}>
      <div className="post__header">
        <div className="post__authorGroup">
          <Avatar
            onLoad={() => setAvatarLoaded(true)}
            style={{opacity: avatarLoaded && (1)}}
            className="post__avatar"
            alt={author.username}
            src={avatar ? avatar : `/static/images/avatar/1.jpg`}
          />
          <h4>{author.username}</h4>
        </div>
        {user && user.uid === author.uid && (
          <div className="post__moreWrapper">
            <IconButton
              color="primary"
              aria-label="upload picture"
              className="post__more"
              component="span"
              onClick={() => setOpenPostEdit(true)}
            >
              <MoreHorizIcon/>
            </IconButton>
            <Modal
              open={openPostEdit}
              onClose={() =>  setOpenPostEdit(false)}
              className={modal.classes.backdrop}
            >
              <div style={modal.modalStyle} className={modal.classes.paper}>
                <h3 className="post__moreModalTitle">Edit Post</h3>
                <div className="post__moreModalActions">
                  <textarea
                    className="post__modalInput"
                    placeholder="Enter a caption..."
                    value={updatedCaption}
                    onChange={event => setUpdatedCaption(event.target.value)}
                  />
                  <Button
                    disabled={!caption}
                    className="post__save"
                    onClick={handleSave}>
                    Save Changes
                  </Button>
                  <Button
                    className="post__delete"
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Modal>
          </div>
        )}
      </div>
      <div className="post__imageWrapper">
        <img
          onLoad={() => setImageLoaded(true)}
          style={{opacity: imageLoaded && (1)}}
          className="post__image"
          src={image}
          alt=""
        />
      </div>
      <h4 className="post__text">
        <strong>{author.username}</strong> {caption}
      </h4>
      <small className="post__date">
        <Moment fromNow>{`${date}`}</Moment>
      </small>

      <div className="post__comments">
        {comments.slice(0, commentsToShow).map(({id, comment}) => (
          <div key={`${id}`} className={`post__comment ${ownerOfComment(comment)}`}>
            <p>
              <strong>{comment.author.username}</strong> {comment.text}
            </p>
            {comment.timestamp && (
              <small className="post__commentDate">
                <Moment fromNow>{`${comment.timestamp.toDate()}`}</Moment>
              </small>
            )}
          </div>
        ))}
        {comments.length > 3 && !showMore && (
          <Button
            className="post__showMore"
            onClick={handleShowMore}
          >
            View All {comments.length} Comments
          </Button>
        )}
      </div>

      {user && (
        <div className="post__actions">
          <form className="post__commentBox">
            <input
              className="post__input"
              type="text"
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button
              className="post__button"
              disabled={!comment}
              type="submit"
              onClick={handlePostComment}
            >
              <SendIcon/>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Post;
