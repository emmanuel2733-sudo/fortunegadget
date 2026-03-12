import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import React from 'react'
import {useState} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { firebaseInitError, storage } from '../../../firebase/config'
import Card from '../../card/Card'
import styles from "./AddProduct.module.scss"
import Loader from "../../loader/Loader";
import {useSelector} from "react-redux"; 
import { selectProducts} from "../../../redux/slice/productSlice"; 
import { normalizeCategory, normalizeProductCategory } from '../../../utils/category';
import { compressImageFile } from '../../../utils/imageCompression';
import { getStorageErrorMessage, validateImageFile } from '../../../utils/storage';
import { getCurrentAccessToken } from '../../../auth/client';



const categories =[
  {id: 1, name: "Laptop"},
  {id: 2, name: "Electronices"},
  {id: 3, name: "Accessories"},
  {id: 4, name: "Phone"},
];

const intialState = {
  name: "",
  imageURL: "",
  price: null,
  category: "",
  brand: "",
  desc: "",
}

const SAVE_TIMEOUT_MS = 20000;
const apiBaseUrl = (
  import.meta.env.REACT_APP_API_BASE_URL || "http://localhost:4242"
).replace(/\/+$/, "");

const withTimeout = (promise, timeoutMs, message) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);

const saveProductThroughBackend = async (endpoint, method, product) => {
  const idToken = await getCurrentAccessToken();

  if (!idToken) {
    throw new Error("You must be signed in before saving a product.");
  }
  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(product),
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      json?.error || "Failed to save the product through the backend."
    );
  }

  return json;
};

const AddProduct = () => {
  const {id} = useParams()
  const products = useSelector(selectProducts);
  const productEdit = normalizeProductCategory(
    products.find((item) => item.id === id)
  );


  const [product, setProduct] = useState(() => {
    const newSate = detectForm(id,
      {...intialState},
      productEdit
      )
      return newSate 
    });

  const [uploadProgress, setUploadProgress] = useState (0)
  const [isLoading, setIsLoading] = useState (false);
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const navigate = useNavigate()
  const isImageUploading = uploadProgress > 0 && uploadProgress < 100;
  const isUploadBusy = isPreparingImage || isImageUploading;
  const isSaveDisabled = isUploadBusy || isLoading;


  function detectForm(id, f1,f2) {
    if (id === "ADD") {
      return f1;
    }
    return f2
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const handleImageChange = async (e) => {
    if (!storage) {
      toast.error(firebaseInitError || "Firebase Storage is not available.");
      e.target.value = "";
      return;
    }

    const originalFile = e.target.files[0];
    const initialFileError = validateImageFile(originalFile);
    if (initialFileError) {
      toast.error(initialFileError);
      e.target.value = "";
      return;
    }

    setIsPreparingImage(true);
    let file = originalFile;

    try {
      file = await compressImageFile(originalFile);
    } catch (error) {
      toast.error(error.message || "Unable to prepare the selected image.");
      setIsPreparingImage(false);
      e.target.value = "";
      return;
    }

    const compressedFileError = validateImageFile(file);
    if (compressedFileError) {
      toast.error(compressedFileError);
      e.target.value = "";
      setIsPreparingImage(false);
      return;
    }

    setUploadProgress(0);
    const storageRef = ref(storage, `fortune-gadgets/${Date.now()}${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        toast.error(getStorageErrorMessage(error));
        setUploadProgress(0);
        setIsPreparingImage(false);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setProduct((currentProduct) => ({
            ...currentProduct,
            imageURL: downloadURL.trim(),
          }));
          setIsPreparingImage(false);
          toast.success("Image uploaded successfully.");
        }).catch((error) => {
          toast.error(getStorageErrorMessage(error));
          setIsPreparingImage(false);
        });
      }
    );
  };
  
    const addProduct = async (e) => {
      e.preventDefault()

      if (isUploadBusy) {
        toast.error("Please wait for the image upload to finish.");
        return;
      }

      if (!product.imageURL) {
        toast.error("Please upload a product image.");
        return;
      }

      setIsLoading(true)

      try {
        await withTimeout(
          saveProductThroughBackend("/admin/products", "POST", {
          name: product.name,
          imageURL: product.imageURL.trim(),
          price: Number(product.price),
          category: normalizeCategory(product.category),
          brand: product.brand,
          desc: product.desc,
          createdAt: new Date(),
          }),
          SAVE_TIMEOUT_MS,
          "Saving the product took too long. Check the Railway backend, Firebase Admin credentials, and network connection."
        );
        setUploadProgress(0)
        setProduct({ ...intialState})

        navigate ("/admin/all-product", {
          state: { successMessage: "Product uploaded successfully." },
        })
     
  } catch (error) {
    toast.error(error.message);
  } finally {
    setIsLoading(false)
  }
};

const editProduct = async (e) => {
  e.preventDefault()

  if (isUploadBusy) {
    toast.error("Please wait for the image upload to finish.");
    return;
  }

  if (!product.imageURL) {
    toast.error("Please upload a product image.");
    return;
  }

  setIsLoading(true)

  try {
    await withTimeout(
      saveProductThroughBackend(`/admin/products/${id}`, "PUT", {
      name: product.name,
      imageURL: product.imageURL.trim(),
      price: Number(product.price),
      category: normalizeCategory(product.category),
      brand: product.brand,
      desc: product.desc,
      createdAt: productEdit.createdAt,
      editedAt: new Date(),
      }),
      SAVE_TIMEOUT_MS,
      "Updating the product took too long. Check the Railway backend, Firebase Admin credentials, and network connection."
    );

    if (product.imageURL !== productEdit.imageURL) {
      const storageRef = ref(storage, productEdit.imageURL);
      await deleteObject(storageRef).catch(() => undefined)
    }

    navigate("/admin/all-product", {
      state: { successMessage: "Product edited successfully." },
    });

  }catch(error) {
    toast.error(error.message)
  } finally {
    setIsLoading(false)
  }
};

  return (
    <>
    {isLoading && <Loader/>}
    <div className={styles.product}>
      <h2>{detectForm(id, "Add New Product","Edit Product")}</h2>
      <Card cardClass={styles.card}>
        <form onSubmit={detectForm(id, addProduct, editProduct)}>
          <label>Product name:</label>
          <input
            type="text"
            placeholder="Product name"
            required
            name="name"
            value={product.name}
            onChange={(e) => handleInputChange(e)}
            />

            <label>Product image:</label>
            <Card cardClass={styles.group}>
              {isPreparingImage ? (
              <p>Optimizing image before upload...</p>
              ) : null}

              {uploadProgress ===0 ? null : (
              <div className={styles.progress}>

                <div className={styles["progress-bar"]} 
                style={{width: `${uploadProgress}%`}}>
                
                {uploadProgress < 100 
                ? `uploading ${uploadProgress}` 
                : `upload complete ${uploadProgress}%`}
                </div>
              </div>
              )}


              <input type="file" accept="image/*"placeholder=
              "Product Image"name="image"
              onClick={(e) => {
                e.target.value = "";
              }}
              onChange=
              {(e) => handleImageChange (e)} />
              
              {product.imageURL === "" ? null :(
             <input type="text"
              // required 
              placeholder="Image URL"
              name="imageURL" 
              value={product.imageURL} disabled />
              )}
            
            </Card>

            <label>Product price:</label>
            <input
              type="number"
              placeholder="Product price"
              required
              name="price"
              value={product.price}
              onChange={(e) => handleInputChange(e)}
            />

            <select required name="category" 
            value={product.category} onChange=
            {(e) => handleInputChange(e)}>
              <option value="" disabled>
                --choose product category
              </option>
              {categories.map((cat) =>{
                return (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}

                  </option>
                )
            })}
         </select>   

           <label>Product Company/Brand:</label>
            <input
            type="text"
            placeholder="Product brand"
            required
            name="brand"
            value={product.brand}
            onChange={(e) => handleInputChange(e)}
            />     

            <label>Product Desription</label>
            <textarea name="desc" required value=
            {product.desc} onChange=
            {(e) => handleInputChange(e)}
             cols="30"rows="10"
            ></textarea>
            <button className="--btn --btn-primary" disabled={isSaveDisabled}>
              {isLoading
                ? detectForm(id, "Saving Product...", "Updating Product...")
                : detectForm(id, "Save Product", "Edit Product")}
              </button>           
       </form>
      </Card>
    </div>
</>
  )
}

export default AddProduct
