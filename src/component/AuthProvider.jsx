import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, getAuth, signOut } from 'firebase/auth'; // 1. Impor signOut
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { app } from '../api/firebaseConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Bonus: untuk mencegah 'flicker'
  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL, // Ambil photoURL dari Auth
              ...userSnap.data(),
            });
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: 'unknown',
            });
          }
        } catch (error) {
          console.error('Gagal mengambil data user:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false); // Proses pengecekan selesai
    });

    return () => unsubscribe();
  }, [auth, db]);

  // 2. Buat fungsi logout di sini
  const logout = async () => {
    try {
      await signOut(auth);
      // setUser(null) akan dijalankan otomatis oleh onAuthStateChanged
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  // Gabungkan semua yang ingin Anda sediakan ke seluruh aplikasi
  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    logout, // 3. Sediakan fungsi logout di dalam value
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook (tidak berubah)
export const useAuth = () => useContext(AuthContext);