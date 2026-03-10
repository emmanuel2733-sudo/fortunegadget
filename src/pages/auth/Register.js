import React from 'react'
import styles from "./auth.module.scss";
import registerImg from "../../assests/register.png";
import Card from '../../components/card/Card'; 
import {Link, useNavigate,} from "react-router-dom";
import{useState} from "react";
import{createUserWithEmailAndPassword} from "firebase/auth"
import { auth, firebaseInitError, isFirebaseEnabled } from '../../firebase/config';
import Loader from '../../components/loader/Loader';
import { toast } from 'react-toastify';

const Register = () => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate()

  const registerUser = (e) => {
    e.preventDefault();

    if (!isFirebaseEnabled || !auth) {
      toast.error(`Registration unavailable: ${firebaseInitError || "Firebase is not configured"}`);
      return;
    }

    if (password !==cPassword) {
      toast.error("Passwords does not match.")
    }
    setIsLoading(true);


    createUserWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    const user = userCredential.user;
    console.log(user)
    setIsLoading(false)
    toast.success("Registration successful...")
    navigate("/Login")
  })
  .catch((error) => {
    toast.error(error.message);
    setIsLoading(false);
  });
    // console.log(email, password, cPassword);
  };
  
  
  return (
    <>
    
    {isLoading && <Loader />}
    <section className={`container ${styles.auth}`}>
    
    <Card>
    <div className={styles.form}>
      <h2>Register</h2>
     
      <form onSubmit={registerUser}>
        <input type="text" placeholder="Email" required value={email} onChange={(e)=> setEmail(e.target.value)}></input>
        <input type="password" placeholder="password" required value={password} onChange={(e)=> setPassword(e.target.value)}></input>
        <input type="password" placeholder="confirm password" required value={cPassword} onChange={(e)=> setCPassword(e.target.value)}></input>
        <button type="submit" className="--btn --btn-primary --btn-block">Register</button>
      </form>
  
      
      <span className={styles.register}>
        <p>Already have an account?</p>
        <Link to="/login">Login</Link>
      </span>
    </div>
    </Card>

    <div className={styles.img}>
      <img src={registerImg} alt="Register" width="400"></img>
    </div>  
  </section>
  </>

  );
};

export default Register;
