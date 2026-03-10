
import { BrowserRouter, Route, Routes} from "react-router-dom";
import Footer from "./components/footer/Footer";
import Header from "./components/header/Header";
import Home from "./pages/home/Home"
import React from "react"
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Reset from "./pages/auth/Reset";
import { ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import Admin from "./pages/admin/Admin"
import AdminOnlyRoute from "./components/adminOnlyRoute/AdminOnlyRoute";
import ProductDetails from "./components/product/productDetails/ProductDetails";
import Cart from "./pages/cart/Cart";
import Checkout from "./pages/checkout/Checkout";
import CheckoutDetails from "./pages/checkout/CheckoutDetails";
import CheckoutSuccess from "./pages/checkout/CheckoutSuccess";
import OrderHistory from "./pages/orderHistory/OrderHistory";
import OrderDetails from "./pages/orderDetails/OrderDetails";
import ReviewProducts from "./components/reviewProducts/ReviewProducts";
import Contact from "./pages/contact/Contact";
import NotFound from "./pages/notFound/NotFound";





const App = () => { 
  return (
    <>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
      <ToastContainer />
       <Header></Header>
        <Routes> 
          <Route path="/" element={ <Home/> } />
          <Route path="/contact" element={ <Contact/> } />
          <Route path="/login" element={ <Login/> } />
          <Route path="/register" element={ <Register/> } />
          <Route path="/reset" element={ <Reset/> } />
          <Route path="/admin/*" element={<AdminOnlyRoute> <Admin/> </AdminOnlyRoute> } />
          <Route path="/product-details/:id" element={ <ProductDetails/> } />
          <Route path="/cart" element={ <Cart/> } />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout-success" element={<CheckoutSuccess />} />
          <Route path="/checkout-details" element={<CheckoutDetails />} />
          <Route path="/order-history" element={<OrderHistory />} />
          <Route path="/order-details/:id" element={<OrderDetails />} />
          <Route path="/review-product/:id" element={<ReviewProducts />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
       <Footer></Footer>
      </BrowserRouter>
      
    </>
  );
}

export default App;
