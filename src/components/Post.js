import React, {useEffect, useState} from 'react';
import './Post.css';
import Avatar from "@material-ui/core/Avatar";
import {db, storage} from "../firebase";
import firebase from "firebase";
import SendIcon from '@material-ui/icons/Send';
import {Button} from "@material-ui/core";
import Moment from "react-moment";
import Modal from "@material-ui/core/Modal";

function Post({user, postId, image, author, caption, date, modal}) {
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [commentsToShow, setCommentsToShow] = useState(3);
  const [showMore, setShowMore] = useState(false);
  const [avatar, setAvatar] = useState('');
  const [openDelete, setOpenDelete] = useState(false);
  const [display, setDisplay] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);

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
    setOpenDelete(false);
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

  const handleShowMore = () => {
    if (commentsToShow === 3) {
      setCommentsToShow(comments.length);
      setShowMore(true);
    }
  };

  return (
    <div className="post" style={{opacity: display && (1)}}>
      <div className="post__header">
        <Avatar
            onLoad={() => setAvatarLoaded(true)}
            style={{opacity: avatarLoaded && (1)}}
            className="post__avatar"
            alt={author.username}
            src={avatar ? avatar : `/static/images/avatar/1.jpg`}
        />
        <h4>{author.username}</h4>
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
          {user.uid === author.uid && (
            <div className="post__deleteWrapper">
              <Modal
                open={openDelete}
                onClose={() =>  setOpenDelete(false)}
                className={modal.classes.backdrop}
              >
                <div style={modal.modalStyle} className={modal.classes.paper}>
                  <h3>Delete Post</h3>
                  <p>Are you sure you want to delete this post?</p>
                  <div className="post__deleteModalButtonGroup">
                    <Button
                      className="post__delete"
                      onClick={handleDelete}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Modal>
              <Button
                className="post__delete"
                onClick={() => setOpenDelete(true)}
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Post;
