import { PropTypes } from "prop-types";
import { useSelector } from "react-redux";
import { selectIsLoggedIn } from "../../redux/slice/authSlice";




const ShowOnLogin = ({ children }) => {
  const isLoggedIn = useSelector(selectIsLoggedIn);

  ShowOnLogin .propTypes = {
    children: PropTypes.node.isRequired,
    };
  

  if (isLoggedIn) {
    return children;
  }
  return null;
};


export const ShowOnLogout = ({ children }) => {
  const isLoggedIn = useSelector(selectIsLoggedIn);

  ShowOnLogout .propTypes = {
    children: PropTypes.node.isRequired,
    };
  

  if (!isLoggedIn) {
    return children;
  }
  return null;
};

export default ShowOnLogin;