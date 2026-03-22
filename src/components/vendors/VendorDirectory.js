import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { listPublicVendors } from "../../data/vendors";
import styles from "./VendorDirectory.module.scss";

const VendorDirectory = () => {
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    listPublicVendors()
      .then((items) => {
        setVendors(items);
      })
      .catch((error) => {
        toast.error(error?.message || "Unable to load marketplace vendors.");
      });
  }, []);

  if (vendors.length === 0) {
    return null;
  }

  return (
    <section className={styles.directory}>
      <div className="container">
        <div className={styles.header}>
          <h2>Marketplace Stores</h2>
          <p>Browse each vendor store hosted on the platform.</p>
        </div>
        <div className={styles.grid}>
          {vendors.map((vendor) => (
            <article key={vendor.id} className={styles.card}>
              <h3>{vendor.name}</h3>
              <p>{vendor.description || "Vendor storefront on Fortune Gadgets."}</p>
              <Link to={`/store/${vendor.slug}`} className="--btn --btn-primary">
                Visit Store
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VendorDirectory;
