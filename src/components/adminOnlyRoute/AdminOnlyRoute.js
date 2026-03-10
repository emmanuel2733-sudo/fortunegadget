import React from 'react'
import { useSelector } from 'react-redux'
import { selectIsAdmin } from '../../redux/slice/authSlice'
import PropTypes from 'prop-types'
import { Link } from "react-router-dom";



const AdminOnlyRoute = ({children}) => {
  const isAdmin = useSelector(selectIsAdmin)

  AdminOnlyRoute.propTypes = {
    children: PropTypes.node.isRequired,
    };
  
  if (isAdmin) {
    return children
  }
  return (
    <section style={{ height: "80vh" }}>
      <div className="container">
        <h2>Permission Denied.</h2>
        <p>This page can only be view by an Admin user.</p>
        <br />
        <Link to="/">
          <button className="--btn">&larr; Back To Home</button>
        </Link>
      </div>
    </section>
  );
};
export const AdminOnlyLink = ({children}) => {
  const isAdmin = useSelector(selectIsAdmin)

  AdminOnlyLink.propTypes = {
    children: PropTypes.node.isRequired,
    };
  
  if (isAdmin) {
    return children
  }
  return null

}

export default AdminOnlyRoute
