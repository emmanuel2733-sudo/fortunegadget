import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CALCULATE_SUBTOTAL,
  CALCULATE_TOTAL_QUANTITY,
  selectCartItems,
  selectCartTotalAmount,
} from "../../redux/slice/cartSlice";
import { selectEmail, selectIsAuthReady } from "../../redux/slice/authSlice";
import {
  selectBillingAddress,
  selectShippingAddress,
} from "../../redux/slice/checkoutSlice";
import { toast } from "react-toastify";
import CheckoutForm from "../../components/checkoutForm/CheckoutForm";
import { isValidEmail, normalizeEmail, pickValidEmail } from "../../utils/email";
import Loader from "../../components/loader/Loader";
import { isAuthConfigured } from "../../auth/client";

const paystackPublicKey = (import.meta.env.REACT_APP_PAYSTACK_PUBLIC_KEY || "").trim();
const apiBaseUrl = (
  import.meta.env.REACT_APP_API_BASE_URL || "http://localhost:4242"
).replace(/\/+$/, "");

const Checkout = () => {
  const [message, setMessage] = useState("Preparing Paystack checkout...");
  const [paymentConfig, setPaymentConfig] = useState(null);

  const cartItems = useSelector(selectCartItems);
  const totalAmount = useSelector(selectCartTotalAmount);
  const accountEmail = useSelector(selectEmail);
  const isAuthReady = useSelector(selectIsAuthReady);
  const shippingAddress = useSelector(selectShippingAddress);
  const billingAddress = useSelector(selectBillingAddress);
  const customerEmail = pickValidEmail(
    accountEmail,
    billingAddress?.email,
    shippingAddress?.email
  );
  const normalizedShippingAddress = {
    ...shippingAddress,
    email: normalizeEmail(shippingAddress?.email),
  };
  const normalizedBillingAddress = {
    ...billingAddress,
    email: normalizeEmail(billingAddress?.email),
  };
  const uniqueVendorIds = [
    ...new Set(
      cartItems
        .map((item) => String(item?.vendorID || "").trim())
        .filter(Boolean)
    ),
  ];

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(CALCULATE_SUBTOTAL());
    dispatch(CALCULATE_TOTAL_QUANTITY());
  }, [dispatch, cartItems]);

  const description = `Fortune Gadgets payment: email: ${customerEmail}, Amount: ${totalAmount}`;

  useEffect(() => {
    if (isAuthConfigured() && !isAuthReady) {
      setPaymentConfig(null);
      setMessage("Checking your session...");
      return;
    }

    if (!paystackPublicKey) {
      setPaymentConfig(null);
      setMessage(
        "Paystack is not configured. Add REACT_APP_PAYSTACK_PUBLIC_KEY to the frontend .env file."
      );
      return;
    }

    if (!customerEmail || !isValidEmail(customerEmail)) {
      setPaymentConfig(null);
      setMessage("Sign in with a valid account email before continuing to checkout.");
      return;
    }

    if (uniqueVendorIds.length > 1) {
      setPaymentConfig(null);
      setMessage("Checkout only supports one vendor at a time. Clear your cart and try again.");
      return;
    }

    fetch(`${apiBaseUrl}/initialize-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cartItems,
        userEmail: customerEmail,
        shipping: normalizedShippingAddress,
        billing: normalizedBillingAddress,
        description,
      }),
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        return res.json().then((json) => Promise.reject(json));
      })
      .then((data) => {
        setPaymentConfig(data);
        setMessage("");
      })
      .catch((error) => {
        const errorMessage =
          error?.error ||
          error?.message ||
          (error instanceof TypeError
            ? "Checkout backend is not reachable on http://localhost:4242. Start the backend server and try again."
            : "Failed to initialize checkout");
        setPaymentConfig(null);
        setMessage(errorMessage);
        toast.error(errorMessage);
      });
  }, [
    apiBaseUrl,
    billingAddress,
    cartItems,
    customerEmail,
    description,
    isAuthReady,
    shippingAddress,
    uniqueVendorIds.length,
  ]);

  if (isAuthConfigured() && !isAuthReady) {
    return <Loader />;
  }

  return (
    <>
      <section>
        <div className="container">
          {!paymentConfig && <h3>{message}</h3>}
        </div>
      </section>
      {paymentConfig && <CheckoutForm paymentConfig={paymentConfig} />}
    </>
  );
};

export default Checkout;
