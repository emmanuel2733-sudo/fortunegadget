import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { db } from "../firebase/config";

const useFetchDocument = (collectionName, documentID) => {
  const [document, setDocument] = useState(null);

  const getDocument = async () => {
    if (!db) {
      setDocument(null);
      return;
    }

    const docRef = doc(db, collectionName, documentID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // console.log("Document data:", docSnap.data());
      const obj = {
        id: documentID,
        ...docSnap.data(),
      };
      setDocument(obj);
    } else {
      toast.error("Document not found");
    }
  };

  useEffect(() => {
    getDocument().catch((error) => toast.error(error.message));
  }, [collectionName, documentID]);

  return { document };
};

export default useFetchDocument;
