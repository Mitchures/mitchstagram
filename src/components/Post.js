import React, {useEffect, useState} from 'react';
import './Post.css';
import Avatar from "@material-ui/core/Avatar";
import {db} from "../firebase";
import firebase from "firebase";
import SendIcon from '@material-ui/icons/Send';

function Post({user, postId, image, author, caption, date}) {
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [avatar, setAvatar] = useState('');

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
          )))
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
        setAvatar(snapshot.data().photoURL);
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
      });

    setComment('');
  };

  const ownerOfComment = ({author}) => {
    if (user) {
      if (user.displayName === author.username) return "owner";
    }
  };

  return (
    <div className="post">
      <div className="post__header">
        <Avatar
            className="post__avatar"
            alt={author.username}
            src={avatar ? avatar : `/static/images/avatar/1.jpg`}
        />
        <h4>{author.username}</h4>
      </div>
      <div className="post__imageWrapper">
        <img
          className="post__image"
          src={image}
          alt=""
        />
      </div>
      <h4 className="post__text">
        <strong>{author.username}</strong> {caption}
      </h4>
      <small className="post__date">{date}</small>

      <div className="post__comments">
        {comments.map(({id, comment, date}) => (
          <div key={`${id}`} className={`post__comment ${ownerOfComment(comment)}`}>
            <p>
              <strong>{comment.author.username}</strong> {comment.text}
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
