import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  createAdminCategory,
  deleteAdminCategory,
  listAdminCategories,
  updateAdminCategory,
} from "../../../data/categories";
import styles from "./Categories.module.scss";

const toSlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const initialState = {
  name: "",
  slug: "",
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialState);
  const [editingId, setEditingId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadCategories = () => {
    setIsLoading(true);
    listAdminCategories()
      .then((items) => {
        setCategories(items);
      })
      .catch((error) => {
        toast.error(error?.message || "Failed to load categories.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const orderedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  const handleNameChange = (event) => {
    const value = event.target.value;
    setForm((current) => ({
      ...current,
      name: value,
      slug: editingId ? current.slug : toSlug(value),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: toSlug(form.slug || form.name),
    };

    try {
      if (editingId) {
        await updateAdminCategory(editingId, payload);
        toast.success("Category updated.");
      } else {
        await createAdminCategory(payload);
        toast.success("Category created.");
      }

      setForm(initialState);
      setEditingId("");
      loadCategories();
    } catch (error) {
      toast.error(error?.message || "Unable to save the category.");
    }
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
    });
  };

  const removeCategory = async (category) => {
    const confirmed = window.confirm(`Delete ${category.name}?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteAdminCategory(category.id);
      toast.success("Category deleted.");
      if (editingId === category.id) {
        setEditingId("");
        setForm(initialState);
      }
      loadCategories();
    } catch (error) {
      toast.error(error?.message || "Unable to delete the category.");
    }
  };

  return (
    <div className={styles.categories}>
      <div className={styles.header}>
        <h2>Categories</h2>
        <p>Create and manage your store categories.</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Category name"
          value={form.name}
          onChange={handleNameChange}
        />
        <input
          type="text"
          placeholder="Category slug"
          value={form.slug}
          onChange={(event) =>
            setForm((current) => ({ ...current, slug: toSlug(event.target.value) }))
          }
        />
        <button type="submit" className="--btn --btn-primary">
          {editingId ? "Update Category" : "Add Category"}
        </button>
        {editingId ? (
          <button
            type="button"
            className="--btn"
            onClick={() => {
              setEditingId("");
              setForm(initialState);
            }}
          >
            Cancel
          </button>
        ) : null}
      </form>

      {isLoading ? <p>Loading categories...</p> : null}

      <div className={styles.list}>
        {orderedCategories.length === 0 ? (
          <p>No categories yet.</p>
        ) : (
          orderedCategories.map((category) => (
            <div key={category.id} className={styles.item}>
              <div>
                <h4>{category.name}</h4>
                <p>{category.slug}</p>
              </div>
              <div className={styles.actions}>
                <button type="button" className="--btn" onClick={() => startEdit(category)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="--btn --btn-danger"
                  onClick={() => removeCategory(category)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Categories;
