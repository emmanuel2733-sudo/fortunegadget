import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db, firebaseInitError } from "../firebase/config";
import { toast } from 'react-toastify';



const useFetchCollection = (collectionName) => {
    const [data, setData] = useState([])
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

      useEffect(() => {
        if (!db) {
          setData([]);
          setIsLoading(false);
          setError(firebaseInitError || "Firebase is not configured.");
          return undefined;
        }

        setIsLoading(true);
        setError("");
        try {
          const docRef = collection(db, collectionName);
          const q = query(docRef, orderBy("createdAt", "desc"));
          const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              const allData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setData(allData);
              setIsLoading(false);
              setError("");
            },
            (snapshotError) => {
              const message =
                snapshotError?.message || `Failed to load ${collectionName}.`;
              setData([]);
              setIsLoading(false);
              setError(message);
              toast.error(message);
            }
          );

          return unsubscribe;
        } catch (error) {
          setIsLoading(false);
          setData([]);
          setError(error.message);
          toast.error(error.message);
          return undefined;
        }
      }, [collectionName]);

      return{data, isLoading, error}

};

export default useFetchCollection;
