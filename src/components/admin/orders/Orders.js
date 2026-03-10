import React from 'react'
import styles from "./Orders.module.scss"
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import useFetchCollection from "../../../customHooks/useFetchCollection";
import { deleteDoc, doc } from "firebase/firestore";

import {selectOrderHistory,STORE_ORDERS,} from "../../../redux/slice/orderSlice";
//import { selectUserID } from '../../../redux/slice/authSlice';
import { useEffect } from 'react';
import Loader from '../../loader/Loader';
import { toast } from 'react-toastify';
import { db } from '../../../firebase/config';

const Orders = () => {
  const { data, isLoading } = useFetchCollection("orders");
  const orders = useSelector(selectOrderHistory);
  //const userID = useSelector(selectUserID);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(STORE_ORDERS(data));
  }, [dispatch, data]);

  const handleClick = (id) => {
    navigate(`/admin/order-details/${id}`);
  };

  const deleteOrder = async (event, id) => {
    event.stopPropagation();

    if (!db) {
      toast.error("Firebase must be enabled to delete orders.");
      return;
    }

    const confirmed = window.confirm("Delete this order?");
    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(doc(db, "orders", id));
      toast.success("Order deleted successfully.");
    } catch (error) {
      toast.error(error.message);
    }
  };


  return (
    <>
      <div className={`${styles.order}`}>
        <h2>Your Order History</h2>
        <p>
          Open an order to <b> Change order status </b>
        </p>
        <br />
        <>
          {isLoading && <Loader />}
          <div className={styles.table}>
            {orders.length === 0 ? (
              <p>No order found</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>s/n</th>
                    <th>Date</th>
                    <th>Order ID</th>
                    <th>Order Amount</th>
                    <th>Order Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => {
                    const {
                      id,
                      orderDate,
                      orderTime,
                      orderAmount,
                      orderStatus,
                    } = order;
                    return (
                      <tr key={id} onClick={() => handleClick(id)}>
                        <td>{index + 1}</td>
                        <td>
                          {orderDate} at {orderTime}
                        </td>
                        <td>{id}</td>
                        <td>
                          {"$"}
                          {orderAmount}
                        </td>
                        <td>
                          <p
                            className={
                              orderStatus !== "Delivered"
                                ? `${styles.pending}`
                                : `${styles.delivered}`
                            }
                          >
                            {orderStatus}
                          </p>
                        </td>
                        <td className={styles.actions}>
                          <button
                            type="button"
                            className="--btn --btn-danger"
                            onClick={(event) => deleteOrder(event, id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      </div>
    </>
  );
}

export default Orders
