import React from 'react'
import ReactDOM from "react-dom";
import loaderImg from "../../assests/loader.gif";
import styles from "./Loader.module.scss"

const Loader = () => {
  return  ReactDOM.createPortal(
    <div className={styles.wrapper}>Loader
    <div className={styles.loader} >
        <img src={loaderImg} alt= "Loading..."></img>
    </div>
    </div>,
    document.getElementById("loader")
  );
};

export default Loader;