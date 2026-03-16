import { PropTypes } from "prop-types";
import { useSelector } from "react-redux";
import {
  selectIsAuthReady,
  selectIsLoggedIn,
} from "../../redux/slice/authSlice";




const ShowOnLogin = ({ children }) => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const isAuthReady = useSelector(selectIsAuthReady);

  ShowOnLogin .propTypes = {
    children: PropTypes.node.isRequired,
    };
  if (!isAuthReady) {
    return null;
  }

  if (isLoggedIn) {
    return children;
  }
  return null;
};


export const ShowOnLogout = ({ children }) => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const isAuthReady = useSelector(selectIsAuthReady);

  ShowOnLogout .propTypes = {
    children: PropTypes.node.isRequired,
    };
  if (!isAuthReady) {
    return null;
  }

  if (!isLoggedIn) {
    return children;
  }
  return null;
};

export default ShowOnLogin;
