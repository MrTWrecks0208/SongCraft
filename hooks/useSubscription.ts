import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface SubscriptionData {
  status: 'active' | 'past_due' | 'canceled' | 'none';
  tier: string;
  isLoading: boolean;
}

export function useSubscription(): SubscriptionData {
  const [subData, setSubData] = useState<SubscriptionData>({
    status: 'none',
    tier: 'Free',
    isLoading: true
  });

  useEffect(() => {
    // We only wait to see if auth finishes resolving, but here we can just depend on auth.currentUser
    if (!auth.currentUser) {
      setSubData({ status: 'none', tier: 'Free', isLoading: false });
      return;
    }

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSubData({
          status: data.subscription_status || 'none',
          tier: data.tier || 'Free',
          isLoading: false
        });
      } else {
        setSubData({ status: 'none', tier: 'Free', isLoading: false });
      }
    }, (error) => {
      console.error("Error fetching subscription status:", error);
      setSubData({ status: 'none', tier: 'Free', isLoading: false });
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  return subData;
}
