import React, { useEffect } from "react";
import {useState} from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import styles from "./Header.module.scss";
import {FaShoppingCart, FaTimes, FaUserCircle } from "react-icons/fa";
import{HiOutlineMenuAlt3} from "react-icons/hi";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import {
  REMOVE_ACTIVE_USER,
  SET_ACTIVE_USER,
  SET_AUTH_READY,
  selectIsSuperAdmin,
} from "../../redux/slice/authSlice";
import ShowOnLogin, { ShowOnLogout } from "../hiddenLink/hiddenLinks";
import { AdminOnlyLink } from "../adminOnlyRoute/AdminOnlyRoute";
import {
  CALCULATE_TOTAL_QUANTITY,
  selectCartTotalQuantity,
} from "../../redux/slice/cartSlice";
import {
  isAuthConfigured,
  signOutUser,
  subscribeToAuthUser,
} from "../../auth/client";
import { syncCurrentUserContext } from "../../data/session";

const logo =(
  <div className={styles.logo}>
  <Link to="/">
   <h2>
     Fortune <span>Gadgets</span>.
   </h2>
   </Link> 
 </div>
);



const activeLink = ({isActive}) => 
(isActive ? `${styles.active}` :"")

const Header = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [displayName, setdisplayName] = useState("");
  const [scrollPage, setScrollPage] = useState(false)
  const cartTotalQuantity = useSelector(selectCartTotalQuantity)
  const isSuperAdmin = useSelector(selectIsSuperAdmin);
  
  useEffect (() => {
    dispatch (CALCULATE_TOTAL_QUANTITY())
  }, []);

  const navigate = useNavigate()

  const dispatch = useDispatch () 
  
  const fixNavbar = () => {
    if (window.scrollY > 50) {
      setScrollPage(true);
    } else {
      setScrollPage(false);
    }
  };
  window.addEventListener("scroll", fixNavbar);

//MONITOR CURRENTLY SIGNED USER
useEffect (() => {
  let unsubscribe = () => undefined;

  if (!isAuthConfigured()) {
    setdisplayName("");
    dispatch(REMOVE_ACTIVE_USER());
    dispatch(SET_AUTH_READY(true));
    return () => undefined;
  }

  dispatch(SET_AUTH_READY(false));
  subscribeToAuthUser((user) => {
    if (user) {
      syncCurrentUserContext(user)
        .then((appContext) => {
          setdisplayName(appContext.displayName || user.displayName);

          dispatch(SET_ACTIVE_USER({
            email: appContext.email || user.email,
            userName: appContext.displayName || user.displayName,
            userID: appContext.userID || user.id,
            role: appContext.role,
            vendor: appContext.vendor,
            isAdmin: appContext.canAccessVendorAdmin || appContext.isSuperAdmin,
            isSuperAdmin: appContext.isSuperAdmin,
            isVendorAdmin: appContext.isVendorAdmin,
          }))
        })
        .catch((error) => {
          toast.error(error?.message || "Unable to load your account access.");
          setdisplayName(user.displayName || "");
          dispatch(REMOVE_ACTIVE_USER());
        })
        .finally(() => {
          dispatch(SET_AUTH_READY(true));
        });
    } else {
     setdisplayName("");
     dispatch(REMOVE_ACTIVE_USER());
     dispatch(SET_AUTH_READY(true));
    }
  }).then((cleanup) => {
    unsubscribe = cleanup;
  });

  return () => unsubscribe();
},[dispatch]);

const toggleMenu = () => {
  setShowMenu(!showMenu)
};

const hideMenu = () => {
  setShowMenu(false)
};
const logoutUser = () => {
  if (!isAuthConfigured()) {
    dispatch(REMOVE_ACTIVE_USER());
    navigate("/");
    return;
  }

  signOutUser().then(() => {
    navigate("/")
    toast.success("Logout successfullly.")
  })
  .catch((error) => {
    toast.error(error?.message || "Logout failed.")
  });
};

const cart = (
  <span className={styles.cart}>
          <Link to="/cart">
            Cart
            <FaShoppingCart size={20}/>
            <p>{cartTotalQuantity}</p>
          </Link>
        </span>
);

const adminLink = isSuperAdmin ? "/super-admin/home" : "/admin/home";
const adminLabel = isSuperAdmin ? "Super Admin" : "Admin";

  return (
    <header className={scrollPage ? `${styles.fixed}` : null}>
      <div className={styles.header}>
    {logo}

    <nav className={showMenu ? `${styles["show-nav"]}` 
    : `${styles["hide-nav"]}`}>

      <div 
      className={showMenu ? `${styles["nav-wrapper"]} ${styles["show-nav-wrapper"]}` : `${styles["nav-wrapper"]}`}
 onClick={hideMenu}
 ></div>
     
      <ul onClick={hideMenu}> 
        <li className={styles["logo-mobile"]}>
         {logo}
         <FaTimes size={22} color ="#fff"onClick={hideMenu} />
        </li>

        <li>
                <AdminOnlyLink>
                  <Link to={adminLink}>
                    <button className="--btn --btn-primary">{adminLabel}</button>
                  </Link>
                </AdminOnlyLink>
              </li>

        <li>
          <NavLink to ="/"className={activeLink}>
            Home
          </NavLink>
        </li>

        <li>
        <NavLink to="/contact" className={activeLink}>
                  Contact Us
                </NavLink>
        </li>

      </ul>
      <div className={styles["header-right"]}onClick={hideMenu}>
        <span className={styles.links}>
      <ShowOnLogout>
          <NavLink to="/login"className={activeLink}>Login</NavLink>
          </ShowOnLogout>
          <ShowOnLogin>
          <a href="#home" style={{color:"#ff7722"}}>
            <FaUserCircle sie={16}/>
            Hi, {displayName}
          </a>
          </ShowOnLogin>
       
          <ShowOnLogin>
          <NavLink to="/order-history"className={activeLink}>My orders</NavLink>
       </ShowOnLogin>
       <ShowOnLogin>
          <NavLink to="/" onClick={logoutUser}>Logout</NavLink>
          </ShowOnLogin>
        </span>
        {cart}
      </div>
    </nav>

    <div className={styles["menu-icon"]}>
      {cart}
      <HiOutlineMenuAlt3 size={28} onClick={toggleMenu}/>
    </div>
      </div>
    </header>
  );
};

export default Header;
