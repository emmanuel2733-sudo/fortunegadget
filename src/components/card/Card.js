import React from "react"
import styles from "./Card.module.scss";
import PropTypes from 'prop-types';

const Card = ({ children, cardClass }) => {
  return <div className={`${styles.card} ${cardClass}`}>{children}</div>;
};
Card.propTypes = {
children: PropTypes.node.isRequired, 
cardClass: PropTypes.node.isRequired,
};
export default Card;
