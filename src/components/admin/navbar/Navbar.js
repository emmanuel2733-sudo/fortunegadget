import React from 'react'
import styles from "./Navbar.module.scss"
import { NavLink } from 'react-router-dom'
import {FaUserCircle} from "react-icons/fa"

const activeLink = ({isActive}) => 
(isActive ? `${styles.active}` :"")

const Navbar = () => {
  return (
    <div className={styles.navbar}>
        <div className={styles.user}>
          <FaUserCircle size={40} color="#fff" />
          <h4 className={styles.brand}>
            Fortune <span>Gadgets</span>
          </h4>
        </div>
     
      <nav>
        <ul>
          <li>
            <NavLink to= "/admin/home" className={activeLink}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to= "/admin/all-product" className={activeLink}>
              All Product
            </NavLink>
          </li>
          <li>
            <NavLink to= "/admin/add-product/ADD" className={activeLink}>
              Add Product
            </NavLink>
          </li>
          <li>
            <NavLink to= "/admin/orders" className={activeLink}>
              Orders
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  )
}

export default Navbar
