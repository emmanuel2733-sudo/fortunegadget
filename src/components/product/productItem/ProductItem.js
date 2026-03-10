import { Link } from "react-router-dom";
import React from 'react';
import Card from '../../card/Card';
import styles from "./ProductItem.module.scss";
import  PropTypes  from "prop-types";
import {useDispatch} from "react-redux";
import { ADD_TO_CART,CALCULATE_TOTAL_QUANTITY } from "../../../redux/slice/cartSlice";
import { fallbackToProductImage, getProductImage } from "../../../utils/image";


const ProductItem = ({product, grid, id, name, price, desc, imageURL}) => {
const dispatch = useDispatch()
  ProductItem.propTypes = {
     product: PropTypes.node.isRequired, 
     grid: PropTypes.node.isRequired, 
     id: PropTypes.node.isRequired, 
     name: PropTypes.node.isRequired, 
     price: PropTypes.node.isRequired, 
     desc: PropTypes.node.isRequired, 
     imageURL: PropTypes.node.isRequired, 
  }; 

 const shortenText = (text, n) => {
    if (text.length > n) {
      const shortenedText = text.substring(0, n).concat("...");
      return shortenedText;
    }
    return text;
  };

const addToCart = (product) => {
  dispatch(ADD_TO_CART(product))
  dispatch(CALCULATE_TOTAL_QUANTITY())
};


  return (
    <Card cardClass={grid ?  `${styles.grid}`:
     `${styles.list}`}>
      <Link to={`/product-details/${id}`} >
      <div className={styles.img}>
        <img src={getProductImage(imageURL)} alt={name} onError={fallbackToProductImage} />
      </div>
      </Link>
      <div className={styles.content}>
        <div className={styles.details}>
          <p>{`$${price}`}</p>
          <h4>{shortenText(name, 18)}</h4>
        </div>
        {!grid && <p className={styles.desc}>{shortenText(desc, 200)}</p>}
        <button className="--btn --btn-danger" onClick={() => addToCart(product)} >Add To Cart  </button>
      </div>
    </Card>
    
  )
}

export default ProductItem
