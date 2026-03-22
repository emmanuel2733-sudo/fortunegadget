import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getProductProviderInitError,
  subscribeToSupabaseProducts,
} from "../data/products";

const useFetchCollection = (collectionName, options = {}) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const serializedOptions = JSON.stringify(options || {});

  const refreshData = useCallback(() => {
    setReloadToken((currentValue) => currentValue + 1);
  }, []);

  useEffect(() => {
    if (collectionName !== "products") {
      setData([]);
      setIsLoading(false);
      setError(`Unsupported collection: ${collectionName}`);
      return undefined;
    }

    setIsLoading(true);
    setError("");
    let unsubscribe = () => undefined;

    subscribeToSupabaseProducts(
      (products) => {
        setData(products);
        setIsLoading(false);
        setError("");
      },
      (snapshotError) => {
        const message =
          snapshotError?.message ||
          getProductProviderInitError() ||
          "Failed to load products.";
        setData([]);
        setIsLoading(false);
        setError(message);
        toast.error(message);
      },
      JSON.parse(serializedOptions)
    )
      .then((cleanup) => {
        unsubscribe = cleanup;
      })
      .catch((loadError) => {
        const message =
          loadError?.message ||
          getProductProviderInitError() ||
          "Failed to load products.";
        setData([]);
        setIsLoading(false);
        setError(message);
        toast.error(message);
      });

    return () => unsubscribe();
  }, [collectionName, reloadToken, serializedOptions]);

  return { data, isLoading, error, refreshData };
};

export default useFetchCollection;
