'use client'
import React, { useEffect, useState } from 'react'
import DashboardPage from "./DashboardPage"
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useCounterStore } from '../store';
import { useRouter } from 'next/navigation';
import { app, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

function Page() {

  const auth = getAuth(app);
  const user = useCounterStore((state) => state.user);
  const setUser = useCounterStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const router = useRouter()


  useEffect(() => {
    let mounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUser(userSnap.data());
        } else {
          router.push("/Authentication")
        }
      } else {
        router.push("/Authentication")
      }
    });
  
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [auth, setUser]);

  return (
    <div>
      {(user && Object.keys(user).length > 0) && (
        <DashboardPage/>
      )}
    </div>
  )
}

export default Page