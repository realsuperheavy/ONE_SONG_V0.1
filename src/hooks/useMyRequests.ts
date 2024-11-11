import { useState, useEffect } from "react";
import { ref, query, orderByChild, equalTo, onValue } from "@firebase/database";
import { rtdb } from "@/lib/firebase/config";
import type { SongRequest } from "@/types/models";

export function useMyRequests(eventId: string, userId: string) {
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const requestsRef = ref(rtdb, `requests/${eventId}`);
    const userRequestsQuery = query(
      requestsRef,
      orderByChild("userId"),
      equalTo(userId)
    );

    const unsubscribe = onValue(
      userRequestsQuery,
      (snapshot) => {
        const requestsData = snapshot.val();
        if (requestsData) {
          const requestsList = Object.entries(requestsData).map(([id, data]) => ({
            id,
            ...(data as Omit<SongRequest, "id">)
          }));
          setRequests(requestsList.sort((a, b) => 
            b.metadata.requestTime - a.metadata.requestTime
          ));
        } else {
          setRequests([]);
        }
        setIsLoading(false);
      },
      (error) => {
        setError(error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [eventId, userId]);

  return { requests, isLoading, error };
} 