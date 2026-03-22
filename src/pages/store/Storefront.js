import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Product from "../../components/product/Product";
import { getPublicVendorBySlug } from "../../data/vendors";

const Storefront = () => {
  const { vendorSlug } = useParams();
  const [vendor, setVendor] = useState(null);

  useEffect(() => {
    getPublicVendorBySlug(vendorSlug)
      .then((record) => {
        setVendor(record);
      })
      .catch((error) => {
        toast.error(error?.message || "Unable to load this store.");
        setVendor(null);
      });
  }, [vendorSlug]);

  return (
    <div>
      <Product
        vendorId={vendor?.id}
        vendorSlug={vendorSlug}
        heading={vendor ? `${vendor.name} Store` : "Storefront"}
      />
    </div>
  );
};

export default Storefront;
