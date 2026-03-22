import React from "react";
import styles from "./Home.module.scss";

const Home = () => {
  return (
    <div className={styles.home}>
      <h2>Super Admin</h2>
      <p>
        Manage vendors, vendor admins, settlement setup, and marketplace-wide
        operations from here.
      </p>
    </div>
  );
};

export default Home;
