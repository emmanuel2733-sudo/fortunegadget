import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, {useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { db, storage } from '../../../firebase/config';
import styles from "./ViewProducts.module.scss"
import {FaEdit, FaTrashAlt} from "react-icons/fa"
import Loader from '../../loader/Loader';
import { deleteObject, ref } from 'firebase/storage';
import Notiflix from 'notiflix';
import {useDispatch, useSelector} from 'react-redux';
import { selectProducts, STORE_PRODUCTS } from '../../../redux/slice/productSlice';
import useFetchCollection from '../../../customHooks/useFetchCollection';
import { FILTER_BY_SEARCH, selectFilteredProducts } from '../../../redux/slice/filterSlice';
import Search from '../../search/Search';
import Pagination from '../../pagination/Pagination';
import { normalizeProductCategory } from '../../../utils/category';
import { fallbackToProductImage, getProductImage } from '../../../utils/image';
import Card from '../../card/Card';




const ViewProducts = () => {
  const [search, setSearch] = useState("");
  const {data, isLoading, error} = useFetchCollection("products")
  const products = useSelector(selectProducts)
  const filteredProducts = useSelector(selectFilteredProducts)
 
 // pagination states
 const [currentPage, setCurrentPage] = useState(1);
 const [productsPerPage, setProductsPerPage] = useState(10);
 //Get current products
 const indexOfLastProduct = currentPage * productsPerPage
 const indexOfFirstProduct = indexOfLastProduct - productsPerPage
 const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);


  const dispatch = useDispatch()
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const successMessage = location.state?.successMessage;

    if (!successMessage) {
      return;
    }

    toast.success(successMessage);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect (() => { 
    const normalizedProducts = data.map((product) => normalizeProductCategory(product));
    dispatch(
      STORE_PRODUCTS({
        products: normalizedProducts,
      })
      );
  }, [dispatch, data]);

  useEffect(() => {
    dispatch(FILTER_BY_SEARCH({products, search}))
  }, [dispatch, products, search]);

 // useEffect(() => {
 //   getProducts()
  // }, [])

 /*  const getProducts = () => {
    setIsLoading (true)
    try {
      const productsRef = collection(db, "products");
      const q = query(productsRef, orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
 // console.log(snapshot.docs)
 const allProducts = snapshot.docs.map((doc) =>({
  id: doc.id,
  ...doc.data()
 }));
 // console.log(allProducts)
 setProduct(allProducts)
 setIsLoading(false)
 dispatch(
  STORE_PRODUCTS({
    products: allProducts
  })
  );
});

    }catch(error) {
      setIsLoading(false)
      toast.error(error.message)
      
    }
  }; */

  const confirmDelete = (id, imageURL) => {
    Notiflix.Confirm.show(
      'Delete product?',
      'You are about to delete this product',
      'Delete',
      'Cancel',
      function okCb() {
        deleteProduct(id, imageURL)
      },
      function cancelCb() {
        console.log("Delete Cancled")
      },
      {
        width: '320px',
        borderRadius: '4px',
        titleColor: "orarigered",
        okButtonBackground: "orangered",
        cssAnimationStyle: "zoom"
        // etc...
      },
    );
  };

  const deleteProduct = async(id, imageURL) => {
    try{
      await deleteDoc(doc(db, "products", id));
      const storageRef = ref(storage, imageURL);
      await deleteObject(storageRef)
      toast.success("Product delected successfuly.")


    }catch(error) {
      toast.error(error.message)
    }
  }
  return (
    <>
    {isLoading && <Loader/>}
    <div className={styles.table}>
    <h2>All Products</h2>

    <div className={styles.search}>
      <p>
        <b>{filteredProducts.length}</b> products found
      </p>
      <Search value={search} onChange={(e) => setSearch(e.target.value)} />

    </div>
    {error ? (
      <Card cardClass={styles.search}>
        <p>{error}</p>
      </Card>
    ) : filteredProducts.length === 0 ? (
      <p>No product found</p>
    ) : (
      <table>
        <thead>
        <tr>
          <th>s/n</th>
          <th>Image</th>
          <th>Name</th>
          <th>category</th>
          <th>Price</th>
          <th>Actions</th>
        </tr>
        </thead>
        <tbody>
        {currentProducts.map((product, index) =>{
          const {id, name, price, imageURL, category} = product;
          return (
            <tr key={id}>
              <td>
                {index + 1}
              </td>
              <td>
                <img
                  src={getProductImage(imageURL)}
                  alt={name}
                  style={{width: "100px"}}
                  onError={fallbackToProductImage}
                />
              </td>
              <td>
                {name}
              </td>
              <td>
                {category}
              </td>
              <td>
                {`$${price}`}
              </td>
              <td className={styles.icons}>
               <Link to={`/admin/add-product/${id}`}>
                <FaEdit size={20} color="red"/>
              </Link>
              &nbsp;
              <FaTrashAlt size={20} color="red" onClick={() => confirmDelete(id, imageURL)} />
              </td>
            </tr>
          )
        })}
        </tbody>
      </table>
    )}
       <Pagination
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      productsPerPage={productsPerPage}
      totalProducts={filteredProducts.length}
      />

    </div>  
    </>
  );
};

export default ViewProducts
