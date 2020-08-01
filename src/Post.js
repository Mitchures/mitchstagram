import React, {useEffect, useState} from 'react';
import './Post.css';
import Avatar from "@material-ui/core/Avatar";
import {db} from "./firebase";
import firebase from "firebase";
import SendIcon from '@material-ui/icons/Send';

function Post({user, postId, image, username, caption}) {
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');

  useEffect(() => {
    let unsubscribe;
    if (postId) {
      unsubscribe = db
        .collection("posts")
        .doc(postId)
        .collection("comments")
        .orderBy("timestamp", "asc")
        .onSnapshot((snapshot) => {
          setComments(snapshot.docs.map((doc) => doc.data()))
        })
    }

    return () => {
      unsubscribe();
    };
  }, [postId]);

  const handlePostComment = (event) => {
    event.preventDefault();

    db
      .collection("posts")
      .doc(postId)
      .collection("comments")
      .add({
        text: comment,
        username: user.displayName,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

    setComment('');
  };

  const ownerOfComment = ({username}) => {
    if (user) {
      if (user.displayName === username) return "owner";
    }
  };

  return (
    <div className="post">
      <div className="post__header">
        <Avatar
            className="post__avatar"
            alt={username}
            src="/static/images/avatar/1.jpg"
        />
        <h4>{username}</h4>
      </div>
      <div className="post__imageWrapper">
        <img
          className="post__image"
          src={image}
          alt=""
        />
      </div>
      <h4 className="post__text">
        <strong>{username}</strong> {caption}
      </h4>

      <div className="post__comments">
        {comments.map((comment, i) => (
          <div key={`${comment.username}__${i}`} className={`post__comment ${ownerOfComment(comment)}`}>
            <p>
              <strong>{comment.username}</strong> {comment.text}
            </p>
          </div>
        ))}
      </div>

      {user && (
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
      )}
    </div>
  );
}

export default Post;
