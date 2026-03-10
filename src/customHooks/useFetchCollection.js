import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { toast } from 'react-toastify';



const useFetchCollection = (collectionName) => {
    const [data, setData] = useState([])
    const [isLoading, setIsLoading] = useState(false);

      useEffect(() => {
        if (!db) {
          setData([]);
          setIsLoading(false);
          return undefined;
        }

        setIsLoading(true);
        try {
          const docRef = collection(db, collectionName);
          const q = query(docRef, orderBy("createdAt", "desc"));
          const unsubscribe = onSnapshot(q, (snapshot) => {
            const allData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setData(allData);
            setIsLoading(false);
          });

          return unsubscribe;
        } catch (error) {
          setIsLoading(false);
          toast.error(error.message);
          return undefined;
        }
      }, [collectionName]);

      return{data, isLoading}

};

export default useFetchCollection;
