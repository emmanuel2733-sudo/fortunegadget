import React from "react";
import { Route, Routes } from "react-router-dom";
import styles from "./SuperAdmin.module.scss";
import Navbar from "../../components/superAdmin/navbar/Navbar";
import Home from "../../components/superAdmin/home/Home";
import Vendors from "../../components/superAdmin/vendors/Vendors";

const SuperAdmin = () => {
  return (
    <div className={styles.admin}>
      <div className={styles.navbar}>
        <Navbar />
      </div>
      <div className={styles.content}>
        <Routes>
          <Route path="home" element={<Home />} />
          <Route path="vendors" element={<Vendors />} />
        </Routes>
      </div>
    </div>
  );
};

export default SuperAdmin;
