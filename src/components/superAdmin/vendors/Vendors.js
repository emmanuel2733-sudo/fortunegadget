import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  createManagedVendor,
  listManagedVendors,
  resetManagedVendorPassword,
  updateManagedVendorStatus,
} from "../../../data/vendors";
import styles from "./Vendors.module.scss";

const initialVendorState = {
  name: "",
  slug: "",
  description: "",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
  subaccountCode: "",
};

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState(initialVendorState);
  const [passwordMap, setPasswordMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const loadVendors = () => {
    setIsLoading(true);
    listManagedVendors()
      .then((items) => {
        setVendors(items);
      })
      .catch((error) => {
        toast.error(error?.message || "Failed to load vendors.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleCreateVendor = async (event) => {
    event.preventDefault();

    try {
      await createManagedVendor({
        ...form,
        slug: slugify(form.slug || form.name),
      });
      toast.success("Vendor created successfully.");
      setForm(initialVendorState);
      loadVendors();
    } catch (error) {
      toast.error(error?.message || "Unable to create vendor.");
    }
  };

  const updateStatus = async (vendor, status) => {
    try {
      await updateManagedVendorStatus(vendor.id, { status });
      toast.success(`Vendor ${status}.`);
      loadVendors();
    } catch (error) {
      toast.error(error?.message || "Unable to update vendor status.");
    }
  };

  const resetPassword = async (vendor) => {
    const password = String(passwordMap[vendor.id] || "").trim();

    if (!password) {
      toast.error("Enter a new password first.");
      return;
    }

    try {
      await resetManagedVendorPassword(vendor.id, { password });
      toast.success("Vendor admin password updated.");
      setPasswordMap((current) => ({ ...current, [vendor.id]: "" }));
    } catch (error) {
      toast.error(error?.message || "Unable to reset password.");
    }
  };

  return (
    <div className={styles.vendors}>
      <div className={styles.panel}>
        <h2>Create Vendor</h2>
        <form className={styles.form} onSubmit={handleCreateVendor}>
          <input
            type="text"
            placeholder="Vendor name"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                name: event.target.value,
                slug: current.slug || slugify(event.target.value),
              }))
            }
          />
          <input
            type="text"
            placeholder="Vendor slug"
            value={form.slug}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                slug: slugify(event.target.value),
              }))
            }
          />
          <textarea
            placeholder="Vendor description"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
          />
          <input
            type="text"
            placeholder="Admin full name"
            value={form.adminName}
            onChange={(event) =>
              setForm((current) => ({ ...current, adminName: event.target.value }))
            }
          />
          <input
            type="email"
            placeholder="Admin email"
            value={form.adminEmail}
            onChange={(event) =>
              setForm((current) => ({ ...current, adminEmail: event.target.value }))
            }
          />
          <input
            type="password"
            placeholder="Admin password"
            value={form.adminPassword}
            onChange={(event) =>
              setForm((current) => ({ ...current, adminPassword: event.target.value }))
            }
          />
          <input
            type="text"
            placeholder="Paystack subaccount code"
            value={form.subaccountCode}
            onChange={(event) =>
              setForm((current) => ({ ...current, subaccountCode: event.target.value }))
            }
          />
          <button type="submit" className="--btn --btn-primary">
            Create Vendor
          </button>
        </form>
      </div>

      <div className={styles.panel}>
        <h2>Vendor List</h2>
        {isLoading ? <p>Loading vendors...</p> : null}
        <div className={styles.list}>
          {vendors.map((vendor) => (
            <div key={vendor.id} className={styles.item}>
              <div>
                <h4>{vendor.name}</h4>
                <p>{vendor.slug}</p>
                <p>Status: {vendor.status}</p>
                <p>License: {vendor.licenseStatus}</p>
                <p>Subaccount: {vendor.paystackSubaccountCode || "Not configured"}</p>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className="--btn"
                  onClick={() => updateStatus(vendor, vendor.status === "active" ? "disabled" : "active")}
                >
                  {vendor.status === "active" ? "Disable" : "Enable"}
                </button>
                <input
                  type="password"
                  placeholder="New password"
                  value={passwordMap[vendor.id] || ""}
                  onChange={(event) =>
                    setPasswordMap((current) => ({
                      ...current,
                      [vendor.id]: event.target.value,
                    }))
                  }
                />
                <button
                  type="button"
                  className="--btn --btn-primary"
                  onClick={() => resetPassword(vendor)}
                >
                  Reset Password
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Vendors;
