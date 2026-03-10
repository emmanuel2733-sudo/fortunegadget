import React, { useEffect } from 'react';
//import AdminOnlyRoute from '../../components/adminOnlyRoute/AdminOnlyRoute';
import Product from '../../components/product/Product';
import Slider from '../../components/slider/Slider';




const Home = () => {
  const url = window.location.href;


  
useEffect (() => {
  const scrollToProducts = () => {
    if (url.includes("#products")) {
      window.scrollTo({
        top:700,
        behavoir: "smooth",
      })
      return
    }
  };
  scrollToProducts();
}, [url]);


  return (
    <div>
      <Slider/>
       <Product/>
       
     
    </div>
  )
};

export default Home;