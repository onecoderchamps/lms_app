import { useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useRouter } from "next/router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/api/firebaseConfig";

export default function RegisterGuruPage() {
  const router = useRouter();

  const [namaLengkap, setNamaLengkap] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Kata sandi dan konfirmasi kata sandi tidak cocok!");
      return;
    }

    if (password.length < 6) {
      alert("Kata sandi minimal 6 karakter!");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        namaLengkap,
        email,
        role: "guru",
        createdAt: serverTimestamp(),
      });

      alert("Registrasi guru berhasil! Anda akan diarahkan ke halaman login.");
      router.push("/auth/login");

    } catch (error) {
      console.error("Gagal registrasi:", error.code);
      
      let errorMessage = "Terjadi kesalahan. Silakan coba lagi.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email ini sudah terdaftar. Silakan gunakan email lain atau login.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Kata sandi terlalu lemah. Gunakan minimal 6 karakter.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Format email yang Anda masukkan tidak valid.";
      }
      alert(`Registrasi gagal: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const primaryButtonClasses = "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500";
  const primaryTextClasses = "text-orange-600 hover:text-orange-500";
  const primaryInputFocusClasses = "focus:ring-orange-500 focus:border-orange-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-orange-600 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl sm:rounded-xl sm:px-10">
          <Head>
            <title>Registrasi Akun Guru - CoderChamps LMS</title>
            <meta name="description" content="Halaman pendaftaran akun khusus untuk guru CoderChamps LMS" />
          </Head>

          <div className="flex justify-center mb-6">
            <img className="h-12 w-auto" src="/logo.png" alt="CoderChamps Logo" />
          </div>
          <h2 className="mb-1 text-center text-2xl md:text-3xl font-bold tracking-tight text-gray-800">
            Pendaftaran Akun <span className="text-orange-600">Guru</span>
          </h2>
          <p className="mb-8 text-center text-sm text-gray-600">
            Isi data berikut untuk membuat akun baru.
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="namaLengkap" className="block text-sm font-medium text-gray-700">
                Nama Lengkap
              </label>
              <input
                id="namaLengkap"
                type="text"
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
                required
                placeholder="Ketik nama lengkap Anda"
                className={`mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none ${primaryInputFocusClasses} sm:text-sm`}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Alamat Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Ketik alamat email Anda"
                className={`mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none ${primaryInputFocusClasses} sm:text-sm`}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Kata Sandi
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Minimal 6 karakter"
                  className={`block w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none ${primaryInputFocusClasses} sm:text-sm`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Konfirmasi Kata Sandi
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Ulangi kata sandi Anda"
                  className={`block w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none ${primaryInputFocusClasses} sm:text-sm`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${primaryButtonClasses} focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150`}
              >
                <UserPlus size={18} className="mr-2" />
                {loading ? "Mendaftarkan..." : "Daftar Akun Guru"}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            Sudah punya akun?{" "}
            <Link href="/auth/login" className={`font-medium ${primaryTextClasses}`}>
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}