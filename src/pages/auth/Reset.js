import React, { useState } from 'react'
import Card from '../../components/card/Card';
import resetImg from "../../assests/forgot.png"
import { Link } from 'react-router-dom';
import styles from "./auth.module.scss";
import { toast } from 'react-toastify';
import Loader from '../../components/loader/Loader';
import { getAuthInitError, isAuthConfigured, requestPasswordReset } from '../../auth/client';

const Reset = () => { 
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

const resetPasword = (e) => {
  e.preventDefault()

  if (!isAuthConfigured()) {
    toast.error(`Password reset unavailable: ${getAuthInitError() || "Auth provider is not configured"}`);
    return;
  }

setIsLoading(true);

  requestPasswordReset(email)
  .then(() => {
    setIsLoading(false);
    toast.success("check your email for a reset link")
  })
  .catch((error) => {
    setIsLoading(false);
    toast.error(error?.message || "Password reset failed.")
  });


};

  return (
    <>
    {isLoading && <Loader/ >}
    <section className={`container ${styles.auth}`}>
    <div className={styles.img}>
      <img src={resetImg} alt="Reset password" width="400"></img>
    </div>
    
    <Card>
    <div className={styles.form}>
      <h2>Reset password</h2>
     
      <form onSubmit={resetPasword}>
        <input type="text" placeholder="Email" required value={email} onChange={(e)=> setEmail(e.target.value)}></input>
        <button type="submit" className="--btn --btn-primary --btn-block">Reset password  </button>
        <div className={styles.Links}>
          <p>
          <Link to="/login">Login</Link>
          </p>
          <p>
          <Link to="/Register">Register</Link>
          </p>
          
      </div>
  
      </form>
    </div>
    </Card>
  </section>
  </>
  );
};

export default Reset;
