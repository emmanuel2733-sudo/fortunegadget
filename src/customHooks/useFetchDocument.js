import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getSupabaseProductById } from "../data/products";

const useFetchDocument = (collectionName, documentID) => {
  const [document, setDocument] = useState(null);

  useEffect(() => {
    if (collectionName !== "products") {
      setDocument(null);
      toast.error(`Unsupported document collection: ${collectionName}`);
      return undefined;
    }

    getSupabaseProductById(documentID)
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
  }, [collectionName, documentID]);

  return { document };
};

export default useFetchDocument;
