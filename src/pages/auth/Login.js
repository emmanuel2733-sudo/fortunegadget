import React from 'react'
import styles from "./auth.module.scss"
import loginImg from "../../assests/login.png"
import { Link, useNavigate } from 'react-router-dom';
import {FaGoogle} from "react-icons/fa"
import Card from '../../components/card/Card';
import { useState } from 'react';
import {GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, firebaseInitError, isFirebaseEnabled } from '../../firebase/config';
import {toast} from "react-toastify"
import Loader from '../../components/loader/Loader';
import { useSelector } from 'react-redux';
import { selectPreviousURL } from '../../redux/slice/cartSlice';



export const Login = () => {

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const previousURL = useSelector(selectPreviousURL)
  const navigate = useNavigate();

  const redirectUser = () => {
    if (previousURL.includes("cart")){
      return navigate("/cart")
    }
    navigate("/")
  };
  
  
  const loginUser = (e) => {
    e.preventDefault();

    if (!isFirebaseEnabled || !auth) {
      toast.error(`Login unavailable: ${firebaseInitError || "Firebase is not configured"}`);
      return;
    }

    setIsLoading(true);

    signInWithEmailAndPassword(auth, loginId.trim(), password)
    .then((userCredential) => { 
      const user = userCredential.user;
      setIsLoading(false);
      toast.success("Login Successful...")
     redirectUser()

    })
    .catch((error) => {
      setIsLoading(false)
      toast.error(error.message)
    });
  };
// login with Google
const provider = new GoogleAuthProvider();
const signInWithGoogle = () =>  {
  if (!isFirebaseEnabled || !auth) {
    toast.error(`Google login unavailable: ${firebaseInitError || "Firebase is not configured"}`);
    return;
  }

  signInWithPopup(auth, provider)
  .then((result) => {
const user = result.user;
toast.success("Login Successful")
redirectUser()


}).catch((error) => {
    toast.error("error.message")
   
  });
  };

  return (
    <>
    {isLoading && <Loader />}

  <section className={`conta iner ${styles.auth}`}>
    <div className={styles.img}>
      <img src={loginImg} alt="login" width="400"></img>
    </div>
    
    <Card>
    <div className={styles.form}>
      <h2>Login</h2>
     
      <form onSubmit={loginUser}>
        <label>Username</label>
        <input
          type="text"
          placeholder="Username or email"
          required
          value={loginId}
          onChange={(e)=> setLoginId(e.target.value)}
        ></input>
        <label>Password</label>
        <input type="password" placeholder="Password" required value={password} onChange={(e)=> setPassword(e.target.value)}></input>
        <button className="--btn --btn-primary --btn-block">Login</button>
        <div className={styles.Links}>
          <Link to="/reset">Reset password</Link>
      </div>
      <p>-- or --</p>
      </form>
  
      <button type="submit" className="--btn --btn-danger --btn-block" onClick={signInWithGoogle} ><FaGoogle color="#fff"/>Login With Google</button>
      <span className={styles.register}>
        <p>Dont have an account?</p>
        <Link to="/register">Register</Link>
      </span>
    </div>
    </Card>
  </section>
  </>
  );

};

export default Login;
