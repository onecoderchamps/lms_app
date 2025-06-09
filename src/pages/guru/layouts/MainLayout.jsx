import Header from "../component/header";
import Sidebar from "../component/sidebar";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/router";
// import { doc, getDoc } from "firebase/firestore";
// import { auth, db  } from "@/api/firebaseConfig";
// import { onAuthStateChanged } from "firebase/auth";

export default function MainLayout({ children }) {

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, async (user) => {
  //     if (user) {
  //       const docRef = doc(db, "users", user.uid);
  //       const docSnap = await getDoc(docRef);
  //       const role = docSnap.data()?.role;
  //       if (role !== "guru") {
  //         window.location.href = "/auth/login";
  //       }
  //     } else {
  //       window.location.href = "/login";
  //     }
  //   });

  //   return () => unsubscribe();
  // }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
