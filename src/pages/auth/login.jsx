// src/pages/auth/login.jsx (atau app/login/page.js)
"use client";

import { useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useRouter } from "next/router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/api/firebaseConfig"; // Pastikan path ini benar

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); // State untuk pesan error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(""); // Reset pesan error setiap kali login

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role;

        // Simpan info user ke localStorage
        localStorage.setItem("userRole", role);
        localStorage.setItem("userUID", user.uid);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userName", userData.name || ""); // Menggunakan 'name' dari database

        if (role === "guru") {
          router.push("/guru"); // Arahkan ke dashboard guru
        } else if (role === "murid") {
          router.push("/murid"); // Arahkan ke dashboard murid
        } else if (role === "admin") {
          router.push("/admin"); // Arahkan ke dashboard admin
        } else {
          setError("Peran pengguna tidak dikenali. Hubungi administrator.");
          auth.signOut(); // Logout jika peran tidak jelas
        }
      } else {
        setError("Data pengguna tidak ditemukan di database.");
        auth.signOut();
      }
    } catch (error) {
      console.error("Gagal login:", error.code);
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        setError("Email atau kata sandi salah. Silakan coba lagi.");
      } else {
        setError("Terjadi kesalahan saat login. Silakan coba lagi nanti.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Styling colors
  const primaryColor = "orange";
  const primaryButtonBg = `bg-${primaryColor}-500`;
  const primaryButtonHoverBg = `hover:bg-${primaryColor}-600`;
  const primaryTextColor = `text-${primaryColor}-600`;
  const primaryTextHoverColor = `hover:text-${primaryColor}-500`;
  const primaryRingColor = `focus:ring-${primaryColor}-500`;
  const primaryBorderColor = `focus:border-${primaryColor}-500`;
  const checkboxColor = `text-${primaryColor}-600`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-orange-600 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Head>
        <title>Login - CoderChamps LMS</title>
        <meta
          name="description"
          content="Halaman login CoderChamps Learning Management System"
        />
      </Head>

      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl sm:rounded-xl sm:px-10">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex justify-center mb-6">
              <img
                className="h-12 w-auto"
                src="/logo.png"
                alt="CoderChamps Logo"
              />
            </div>
            <h2 className="mb-1 text-center text-2xl md:text-3xl font-bold tracking-tight text-gray-800">
              Selamat Datang,{" "}
              <span className={`${primaryTextColor}`}>Champion Coder!</span>
            </h2>
            <p className="mb-8 text-center text-sm text-gray-600">
              Silakan masuk untuk melanjutkan.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* --- Pesan Error di Atas Form --- */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Alamat Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Ketik alamat email Anda"
                className={`mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none ${primaryRingColor} ${primaryBorderColor} sm:text-sm`}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Kata Sandi
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Ketik kata sandi Anda"
                  className={`block w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none ${primaryRingColor} ${primaryBorderColor} sm:text-sm`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className={`h-4 w-4 ${checkboxColor} ${primaryRingColor} border-gray-300 rounded`}
                />
                <span className="ml-2 text-sm text-gray-700">Ingat saya</span>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition duration-150 ${
                  loading
                    ? "bg-orange-300 cursor-not-allowed"
                    : `${primaryButtonBg} ${primaryButtonHoverBg}`
                } focus:outline-none focus:ring-2 focus:ring-offset-2 ${primaryRingColor}`}
              >
                <LogIn size={18} className="mr-2" />
                {loading ? "Memproses..." : "Masuk"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Atau</span>
              </div>
            </div>

            <div className="mt-6 text-center text-sm">
              <p className="text-gray-600">
                Belum punya akun?{" "}
                <Link
                  href="/auth/register"
                  className={`font-medium ${primaryTextColor} ${primaryTextHoverColor}`}
                >
                  Daftar sebagai Murid
                </Link>{" "}
                atau{" "}
                <Link
                  href="/authGuru/register"
                  className={`font-medium ${primaryTextColor} ${primaryTextHoverColor}`}
                >
                  Daftar sebagai Guru
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
