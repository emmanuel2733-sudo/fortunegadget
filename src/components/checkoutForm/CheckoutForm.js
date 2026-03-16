import React, { useEffect, useRef, useState } from "react";
import styles from "./CheckoutForm.module.scss";
import Card from "../card/Card";
import CheckoutSummary from "../checkoutSummary/CheckoutSummary";
import spinnerImg from "../../assests/spinner.jpg";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { selectEmail, selectUserID } from "../../redux/slice/authSlice";
import {
  CLEAR_CART,
  selectCartItems,
  selectCartTotalAmount,
} from "../../redux/slice/cartSlice";
import {
  selectBillingAddress,
  selectShippingAddress,
} from "../../redux/slice/checkoutSlice";
import { useNavigate } from "react-router-dom";
import { isValidEmail, pickValidEmail } from "../../utils/email";
import { createOrder } from "../../data/orders";

const CheckoutForm = ({ paymentConfig }) => {
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const paymentCompletedRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const stopPollingRef = useRef(false);
  const apiBaseUrl = (
    import.meta.env.REACT_APP_API_BASE_URL || "http://localhost:4242"
  ).replace(/\/+$/, "");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const userID = useSelector(selectUserID);
  const userEmail = useSelector(selectEmail);
  const cartItems = useSelector(selectCartItems);
  const cartTotalAmount = useSelector(selectCartTotalAmount);
  const shippingAddress = useSelector(selectShippingAddress);
  const billingAddress = useSelector(selectBillingAddress);
  const customerEmail = pickValidEmail(
    userEmail,
    billingAddress?.email,
    shippingAddress?.email
  );

  const saveOrder = async (paymentDetails) => {
    if (saveInFlightRef.current) {
      return;
    }

    saveInFlightRef.current = true;
    const today = new Date();
    const date = today.toDateString();
    const time = today.toLocaleTimeString();
    const orderConfig = {
      userID,
      userEmail: customerEmail,
      orderDate: date,
      orderTime: time,
      orderAmount: cartTotalAmount,
      orderStatus: "Order Placed...",
      cartItems,
      shippingAddress,
      paymentGateway: "paystack",
      paymentReference: paymentDetails.reference,
      paymentStatus: paymentDetails.status,
      createdAt: new Date(),
    };

    try {
      await createOrder(orderConfig);
      dispatch(CLEAR_CART());
      toast.success("Order saved");
    } catch (error) {
      toast.warning(error?.message || "Payment completed, but order could not be saved.");
    }
    navigate("/checkout-success");
    saveInFlightRef.current = false;
  };

  const verifyPayment = async (reference) => {
    const response = await fetch(`${apiBaseUrl}/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference,
        items: cartItems,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Payment could not be verified.");
    }

    return data;
  };

  const handleVerificationSuccess = async (verification) => {
    if (paymentCompletedRef.current) {
      return;
    }

    paymentCompletedRef.current = true;
    stopPollingRef.current = true;
    setMessage(null);
    toast.success("Payment successful");
    await saveOrder({
      reference: verification.reference,
      status: verification.status,
    });
  };

  const attemptVerification = async ({ silent = false } = {}) => {
    if (!paymentConfig) {
      if (!silent) {
        setMessage("Payment details are not ready yet.");
      }
      return;
    }

    if (!customerEmail || !isValidEmail(customerEmail)) {
      if (!silent) {
        const errorMessage = "Sign in with a valid account email before payment.";
        setMessage(errorMessage);
        toast.error(errorMessage);
      }
      return;
    }

    if (!paymentConfig.reference) {
      if (!silent) {
        setMessage("Paystack payment session is not ready yet.");
      }
      return;
    }

    if (paymentCompletedRef.current || saveInFlightRef.current || stopPollingRef.current) {
      return;
    }

    try {
      setIsVerifying(true);
      const verification = await verifyPayment(paymentConfig.reference);

      if (!verification?.verified) {
        const paymentStatus = verification?.status || "unknown";

        if (["failed", "abandoned", "cancelled"].includes(paymentStatus)) {
          stopPollingRef.current = true;

          if (!silent) {
            const errorMessage = `Payment status is ${paymentStatus}.`;
            setMessage(errorMessage);
            toast.error(errorMessage);
          }
        } else if (!silent) {
          setMessage(`Payment status is ${paymentStatus}. Finish the Paystack checkout, then verify again.`);
        }

        return;
      }

      await handleVerificationSuccess(verification);
    } catch (error) {
      const errorMessage = error?.message || "Payment has not been completed yet.";
      if (!silent) {
        setMessage(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (!paymentConfig?.authorizationUrl) {
      setMessage("Paystack checkout URL is not ready yet.");
      setIsLoading(false);
      return;
    }

    if (!customerEmail || !isValidEmail(customerEmail)) {
      setMessage("Sign in with a valid account email before payment.");
      setIsLoading(false);
      return;
    }

    setMessage(null);
    setIsLoading(true);
    paymentCompletedRef.current = false;
    saveInFlightRef.current = false;
    stopPollingRef.current = false;
  }, [customerEmail, paymentConfig?.authorizationUrl]);

  const handleReloadCheckout = () => {
    paymentCompletedRef.current = false;
    saveInFlightRef.current = false;
    stopPollingRef.current = false;
    setMessage("Reloading secure Paystack checkout...");
    setIsLoading(true);
    setIframeKey((currentValue) => currentValue + 1);
  };

  return (
    <section>
      <div className={`container ${styles.checkout}`}>
        <h2>Checkout</h2>
        <form>
          <div>
            <Card cardClass={styles.card}>
              <CheckoutSummary />
            </Card>
          </div>
          <div>
            <Card cardClass={`${styles.card} ${styles.pay}`}>
              <h3>Paystack Checkout</h3>
              <p>
                Enter your card details in the secure Paystack frame below. If
                payment finishes, click the verify button under the frame to
                confirm the order.
              </p>
              <div className={styles.actions}>
                <button
                  type="button"
                  disabled={isLoading || !paymentConfig?.authorizationUrl}
                  id="submit"
                  className={styles.button}
                  onClick={handleReloadCheckout}
                >
                  <span id="button-text">
                    {isLoading ? (
                      <img
                        src={spinnerImg}
                        alt="Loading..."
                        style={{ width: "20px" }}
                      />
                    ) : (
                      "Reload checkout"
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={isVerifying || isLoading || paymentCompletedRef.current}
                  className={`${styles.button} ${styles.secondaryButton}`}
                  onClick={() => attemptVerification()}
                >
                  {isVerifying ? "Verifying..." : "Verify payment"}
                </button>
              </div>
              <div className={styles.cardNotice}>
                <span className={styles.cardNoticeLabel}>Card Details</span>
                <span className={styles.cardNoticeText}>
                  Put your card number, expiry date, CVV, and email in the
                  secure Paystack frame directly below.
                </span>
              </div>
              {paymentConfig?.authorizationUrl && (
                <div className={styles.embedContainer}>
                  <iframe
                    key={iframeKey}
                    title="Secure Paystack Checkout"
                    src={paymentConfig.authorizationUrl}
                    className={styles.embedFrame}
                    onLoad={() => {
                      setIsLoading(false);
                      setMessage(null);
                    }}
                  />
                </div>
              )}
              {message && <div id={styles["payment-message"]}>{message}</div>}
            </Card>
          </div>
        </form>
      </div>
    </section>
  );
};

export default CheckoutForm;
