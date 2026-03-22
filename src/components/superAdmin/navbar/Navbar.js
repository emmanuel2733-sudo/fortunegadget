import React from "react";
import { NavLink } from "react-router-dom";
import { FaUserShield } from "react-icons/fa";
import styles from "./Navbar.module.scss";

const activeLink = ({ isActive }) => (isActive ? `${styles.active}` : "");

const Navbar = () => {
  return (
    <div className={styles.navbar}>
      <div className={styles.user}>
        <FaUserShield size={40} color="#fff" />
        <h4 className={styles.brand}>
          Fortune <span>Gadgets</span>
        </h4>
      </div>

      <nav>
        <ul>
          <li>
            <NavLink to="/super-admin/home" className={activeLink}>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/super-admin/vendors" className={activeLink}>
              Vendors
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Navbar;
