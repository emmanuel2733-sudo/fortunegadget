import React from "react";
import InfoBox from "../../infoBox/InfoBox";
import styles from "./Home.module.scss";
import { AiFillDollarCircle } from "react-icons/ai";
import { BsCart4 } from "react-icons/bs";
import { FaCartArrowDown } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {selectProducts, STORE_PRODUCTS} from "../../../redux/slice/productSlice";
import {CALC_TOTAL_ORDER_AMOUNT, selectOrderHistory, selectTotalOrderAmount, STORE_ORDERS,} from "../../../redux/slice/orderSlice";
import useFetchCollection from "../../../customHooks/useFetchCollection";
import { useEffect } from "react";
import Chart from "../../chart/Chart";
import { toast } from "react-toastify";
// import Chart from "../../chart/Chart";



//Icons
const earningIcon = <AiFillDollarCircle size={30} color="#b624ff" />;
const productIcon = <BsCart4 size={30} color="#1f93ff" />;
const ordersIcon = <FaCartArrowDown size={30} color="orangered" />;
const sliderFilePath = "src/components/slider/slider-data.js";

const Home = () => {
  const products = useSelector(selectProducts);
  const orders = useSelector(selectOrderHistory);
  const totalOrderAmount = useSelector(selectTotalOrderAmount);


  const fbProducts = useFetchCollection("products");
  const { data } = useFetchCollection("orders");

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(STORE_PRODUCTS({
        products: fbProducts.data,
      })
    );

    dispatch(STORE_ORDERS(data));

    dispatch(CALC_TOTAL_ORDER_AMOUNT());
  }, [dispatch, data, fbProducts]);

  const copySliderPath = async () => {
    try {
      await navigator.clipboard.writeText(sliderFilePath);
      toast.success("Slider file path copied.");
    } catch (error) {
      toast.info(`Edit the slider in ${sliderFilePath}`);
    }
  };

  return (
    <div className={styles.home}>
    <h2>Admin Home</h2>
    <div className={styles["info-box"]}>
      <InfoBox
        cardClass={`${styles.card} ${styles.card1}`}
        title={"Earnings"}
        count={`$${totalOrderAmount}`}
        icon={earningIcon}
      />
      <InfoBox
        cardClass={`${styles.card} ${styles.card2}`}
        title={"Products"}
        count={products.length}
        icon={productIcon}
      />
      <InfoBox
        cardClass={`${styles.card} ${styles.card3}`}
        title={"Orders"}
        count={orders.length}
        icon={ordersIcon}
      />
    </div>
    <div>
      <Chart />
    </div>
    <div className={styles.actions}>
      <button type="button" className="--btn --btn-primary" onClick={copySliderPath}>
        Copy Slider File Path
      </button>
      <p>Homepage slider edits now live in code only.</p>
      <code>{sliderFilePath}</code>
    </div>
  </div>
);
};

export default Home
