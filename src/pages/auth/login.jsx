import { useState } from "react";
import Link from "next/link";
import Head from "next/head"; // Untuk Pages Router. Jika App Router, gunakan Metadata API.
import { Eye, EyeOff, LogIn } from "lucide-react"; // LogIn untuk ikon tombol

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // const [rememberMe, setRememberMe] = useState(false); // Jika ingin dikelola state-nya

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logika otentikasi Anda
    console.log("Login attempt with:", { username, password });
    alert(`Login dengan Username: ${username}`);
  };

  // Definisi warna konsisten (Oranye)
  const primaryColor = "orange"; // Anda bisa ganti dengan "amber" atau warna spesifik Tailwind lainnya
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
            <meta
              name="description"
              content="Halaman login CoderChamps Learning Management System"
            />
            {/* Pastikan favicon.ico ada di folder public */}
            {/* <link rel="icon" href="/favicon.ico" />  */}
          </Head>

          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img
                className="h-12 w-auto" // Sesuaikan ukuran logo Anda
                src="/logo.png" // Pastikan logo.png ada di folder public
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
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Nama Pengguna atau Email
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text" // Bisa juga type="email" jika login utama pakai email
                  placeholder="Ketik nama pengguna atau email Anda"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className={`appearance-none block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none ${primaryRingColor} ${primaryBorderColor} sm:text-sm transition duration-150`}
                />
              </div>
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
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ketik kata sandi Anda"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`appearance-none block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none ${primaryRingColor} ${primaryBorderColor} sm:text-sm transition duration-150 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={
                    showPassword
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  // onChange={(e) => setRememberMe(e.target.checked)}
                  // checked={rememberMe}
                  className={`h-4 w-4 ${checkboxColor} ${primaryRingColor} border-gray-300 rounded`}
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Ingat saya
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className={`w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${primaryButtonBg} ${primaryButtonHoverBg} focus:outline-none focus:ring-2 focus:ring-offset-2 ${primaryRingColor} transition duration-150`}
              >
                <LogIn size={18} className="mr-2" />
                Masuk
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            Khusus Guru: Pendaftaran melalui Administrator.
            {/* Jika ada halaman info kontak admin: */}
            {/* <Link href="/kontak-admin" className={`font-medium ${primaryTextColor} ${primaryTextHoverColor}`}> Hubungi Admin</Link> */}
          </p>
        </div>
      </div>
    </div>
  );
}
