import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getSupabaseProductById } from "../data/products";

const useFetchDocument = (collectionName, documentID, options = {}) => {
  const [document, setDocument] = useState(null);
  const serializedOptions = JSON.stringify(options || {});

  useEffect(() => {
    if (collectionName !== "products") {
      setDocument(null);
      toast.error(`Unsupported document collection: ${collectionName}`);
      return undefined;
    }

    getSupabaseProductById(documentID, JSON.parse(serializedOptions))
      .then((product) => {
        if (product) {
          setDocument(product);
          return;
        }

        setDocument(null);
        toast.error("Document not found");
      })
      .catch((error) => {
        toast.error(error.message);
      });

    return undefined;
  }, [collectionName, documentID, serializedOptions]);

  return { document };
};

export default useFetchDocument;
