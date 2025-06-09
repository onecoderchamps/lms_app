import { useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useRouter } from "next/router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/api/firebaseConfig"; // Pastikan path ini sesuai

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(""); // Ganti dari username ke email
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login berhasil!");
      router.push("/dashboard"); // Ganti sesuai tujuan setelah login
    } catch (error) {
      console.error("Login error:", error);
      alert(`Login gagal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const primaryColor = "orange";
  const primaryButtonBg = `bg-${primaryColor}-500`;
  const primaryButtonHoverBg = `hover:bg-${primaryColor}-600`;
  const primaryTextColor = `text-${primaryColor}-600`;
  const primaryTextHoverColor = `hover:text-${primaryColor}-500`;
  const primaryRingColor = `focus:ring-${primaryColor}-500`;
  const primaryBorderColor = `focus:border-${primaryColor}-500`;
  const checkboxColor = `text-${primaryColor}-600`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-gray-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl sm:rounded-xl sm:px-10">
          <Head>
            <title>Login - CoderChamps LMS</title>
            <meta name="description" content="Halaman login CoderChamps Learning Management System" />
          </Head>

          <div className="flex justify-center mb-6">
            <img className="h-12 w-auto" src="/logo.png" alt="CoderChamps Logo" />
          </div>

          <h2 className="mb-1 text-center text-2xl md:text-3xl font-bold tracking-tight text-gray-800">
            Selamat Datang,{" "}
            <span className={`${primaryTextColor}`}>Champion Coder!</span>
          </h2>
          <p className="mb-8 text-center text-sm text-gray-600">
            Silakan masuk untuk melanjutkan.
          </p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Alamat Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Ketik alamat email Anda"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none ${primaryRingColor} ${primaryBorderColor} sm:text-sm`}
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
                  placeholder="Ketik kata sandi Anda"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`block w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none ${primaryRingColor} ${primaryBorderColor} sm:text-sm`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${primaryButtonBg} ${primaryButtonHoverBg} focus:outline-none focus:ring-2 focus:ring-offset-2 ${primaryRingColor} transition duration-150`}
              >
                <LogIn size={18} className="mr-2" />
                {loading ? "Masuk..." : "Masuk"}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            Belum punya akun?{" "}
            <Link href="/auth/register-guru" className={`font-medium ${primaryTextColor} ${primaryTextHoverColor}`}>
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
