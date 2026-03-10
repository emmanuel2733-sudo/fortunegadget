import React, { useEffect, useMemo, useState } from 'react'
import ProductFilter from './productFilter/ProductFilter'
import ProductList from './productList/ProductList'
import styles from "./Product.module.scss"
import useFetchCollection from '../../customHooks/useFetchCollection'
import { useDispatch, useSelector } from 'react-redux'
import { GET_PRICE_RANGE, selectProducts, STORE_PRODUCTS } from '../../redux/slice/productSlice'
import spinnerImg from "../../assests/spinner.jpg"
import {FaCogs} from "react-icons/fa"
import { normalizeProductCategory } from '../../utils/category'


const Product = () => {
  const {data, isLoading} = useFetchCollection("products");
  const [showFilter, setShowFilter] = useState(false);
  const products = useSelector(selectProducts); 
  const dispatch = useDispatch();
  const normalizedProducts = useMemo(
    () => data.map((product) => normalizeProductCategory(product)),
    [data]
  );

  useEffect (() => { 
    dispatch(
      STORE_PRODUCTS({
        products: normalizedProducts,
      })
      );

      dispatch(GET_PRICE_RANGE ({
        products: normalizedProducts,

      }));
  }, [dispatch, normalizedProducts]);

  const toggleFilter = () => {
    setShowFilter(!showFilter);
  };




  return (
    <section>
      <div className={`container ${styles.product}`}>
        <aside className={showFilter ? `${styles.filter} ${styles.show}`: `${styles.filter}`}>
          {isLoading ? null :<ProductFilter />}
        </aside>
        <div className={styles.content}>
          {isLoading ? (
          <img src={spinnerImg} 
          alt="Loading..." 
          style={{width: "50px"}} className="--center-all" />) : (

          <ProductList products={products}/>

        )}
          <div className={styles.icon} onClick = {toggleFilter}>
            <FaCogs size ={20} color= "orangered" />
               <p>
                <b>{showFilter ? "Hide Filter" : "Show Filter"}</b>
               </p>
         </div>
        </div>
      </div>
      </section>
  )
}

export default Product
