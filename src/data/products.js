import { supabase, isSupabaseEnabled } from "../supabase/config";

const env = import.meta.env;

export const supabaseProductsTable = (
  env.REACT_APP_SUPABASE_PRODUCTS_TABLE || "products"
).trim();
export const supabaseProductBucket = (
  env.REACT_APP_SUPABASE_PRODUCT_BUCKET || "product-images"
).trim();

const toIsoString = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const getSupabaseStoragePublicUrl = (imagePath) => {
  if (!supabase || !imagePath) {
    return "";
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(supabaseProductBucket).getPublicUrl(imagePath);

  return publicUrl;
};

const normalizeProductImagePath = (value) => {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    return "";
  }

  if (!normalizedValue.startsWith("http")) {
    return normalizedValue.replace(/^\/+/, "");
  }

  try {
    const parsedUrl = new URL(normalizedValue);
    const marker = `/storage/v1/object/public/${supabaseProductBucket}/`;
    const markerIndex = parsedUrl.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return "";
    }

    return decodeURIComponent(parsedUrl.pathname.slice(markerIndex + marker.length));
  } catch (_error) {
    return "";
  }
};

export const getProductProviderInitError = () => {
  if (!isSupabaseEnabled || !supabase) {
    return "Supabase is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.";
  }

  if (!supabaseProductBucket) {
    return "Supabase product bucket is not configured.";
  }

  return "";
};

export const mapSupabaseProductRow = (row = {}) => {
  const imagePath = normalizeProductImagePath(row.image_path || row.imagePath || "");
  const imageURL =
    String(row.image_url || row.imageURL || "").trim() ||
    getSupabaseStoragePublicUrl(imagePath);

  return {
    id: row.id,
    name: String(row.name || "").trim(),
    imagePath,
    imageURL,
    price: Number(row.price || 0),
    category: String(row.category || "").trim(),
    brand: String(row.brand || "").trim(),
    desc: String(row.desc || "").trim(),
    createdAt: row.created_at || row.createdAt || null,
    editedAt: row.edited_at || row.editedAt || null,
  };
};

export const mapProductForSupabase = (product = {}) => ({
  name: String(product.name || "").trim(),
  image_url: String(product.imageURL || "").trim(),
  image_path: normalizeProductImagePath(product.imagePath || product.imageURL || ""),
  price: Number(product.price),
  category: String(product.category || "").trim(),
  brand: String(product.brand || "").trim(),
  desc: String(product.desc || "").trim(),
  created_at: toIsoString(product.createdAt) || new Date().toISOString(),
  edited_at: toIsoString(product.editedAt),
});

export const listSupabaseProducts = async () => {
  if (!supabase) {
    throw new Error(getProductProviderInitError() || "Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from(supabaseProductsTable)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map(mapSupabaseProductRow);
};

export const getSupabaseProductById = async (productId) => {
  if (!supabase) {
    throw new Error(getProductProviderInitError() || "Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from(supabaseProductsTable)
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapSupabaseProductRow(data) : null;
};

export const subscribeToSupabaseProducts = async (onData, onError) => {
  const loadProducts = async () => {
    const products = await listSupabaseProducts();
    onData(products);
  };

  await loadProducts();

  if (!supabase) {
    return () => undefined;
  }

  const channel = supabase
    .channel("products-feed")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: supabaseProductsTable },
      () => {
        loadProducts().catch(onError);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const uploadProductImage = async (file) => {
  if (!supabase) {
    throw new Error(getProductProviderInitError() || "Supabase is not configured.");
  }

  const extension = (file.name.split(".").pop() || "jpg").toLowerCase();
  const filePath = `products/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}.${extension}`;

  const { error } = await supabase.storage
    .from(supabaseProductBucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return {
    imagePath: filePath,
    imageURL: getSupabaseStoragePublicUrl(filePath),
  };
};

export const removeProductImage = async (value) => {
  const imagePath = normalizeProductImagePath(value);

  if (!imagePath || !supabase) {
    return;
  }

  const { error } = await supabase.storage
    .from(supabaseProductBucket)
    .remove([imagePath]);

  if (error) {
    throw error;
  }
};
