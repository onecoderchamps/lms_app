import { useState } from "react";
import Link from "next/link";
import Head from "next/head"; // Untuk Pages Router. Jika App Router, gunakan Metadata API.
import { Eye, EyeOff, UserPlus } from "lucide-react"; // UserPlus untuk ikon tombol

export default function RegisterGuruPage() {
  const [namaLengkap, setNamaLengkap] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Kata sandi dan konfirmasi kata sandi tidak cocok!"); // Ganti dengan showCustomAlert jika pakai modal
      return;
    }
    if (password.length < 6) {
      alert("Kata sandi minimal 6 karakter!"); // Ganti dengan showCustomAlert
      return;
    }

    // Logika registrasi guru Anda akan ada di sini
    console.log("Form registrasi guru disubmit!");
    console.log("Nama Lengkap:", namaLengkap);
    console.log("Email:", email);
    console.log("Password:", password);
    alert(
      `Registrasi Guru berhasil untuk Nama: ${namaLengkap}, Email: ${email}`
    );
    // Redirect ke halaman login atau halaman tunggu persetujuan admin
    // Misalnya: router.push('/login');
  };

  // Definisi warna konsisten (Oranye)
  const primaryColor = "orange";
  const primaryButtonBg = `bg-${primaryColor}-500`;
  const primaryButtonHoverBg = `hover:bg-${primaryColor}-600`;
  const primaryTextColor = `text-${primaryColor}-600`;
  const primaryTextHoverColor = `hover:text-${primaryColor}-500`;
  const primaryRingColor = `focus:ring-${primaryColor}-500`;
  const primaryBorderColor = `focus:border-${primaryColor}-500`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-gray-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl sm:rounded-xl sm:px-10">
          <Head>
            <title>Registrasi Akun Guru - CoderChamps LMS</title>
            <meta
              name="description"
              content="Halaman pendaftaran akun khusus untuk guru CoderChamps LMS"
            />
          </Head>

          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex justify-center mb-6">
              <img
                className="h-12 w-auto"
                src="/logo.png"
                alt="CoderChamps Logo"
              />
            </div>
            <h2 className="mb-1 text-center text-2xl md:text-3xl font-bold tracking-tight text-gray-800">
              Pendaftaran Akun{" "}
              <span className={`${primaryTextColor}`}>Guru</span>
            </h2>
            <p className="mb-8 text-center text-sm text-gray-600">
              Isi data berikut untuk membuat akun baru.
            </p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="namaLengkap"
                className="block text-sm font-medium text-gray-700"
              >
                Nama Lengkap
              </label>
              <div className="mt-1">
                <input
                  id="namaLengkap"
                  name="namaLengkap"
                  type="text"
                  placeholder="Ketik nama lengkap Anda"
                  autoComplete="name"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  required
                  className={`appearance-none block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none ${primaryRingColor} ${primaryBorderColor} sm:text-sm transition duration-150`}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Alamat Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Ketik alamat email Anda"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  placeholder="Minimal 8 karakter"
                  autoComplete="new-password"
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

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Konfirmasi Kata Sandi
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ketik ulang kata sandi baru Anda"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`appearance-none block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none ${primaryRingColor} ${primaryBorderColor} sm:text-sm transition duration-150 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={
                    showConfirmPassword
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className={`w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${primaryButtonBg} ${primaryButtonHoverBg} focus:outline-none focus:ring-2 focus:ring-offset-2 ${primaryRingColor} transition duration-150`}
              >
                <UserPlus size={18} className="mr-2" />
                Daftar Akun Guru
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            Sudah punya akun?{" "}
            <Link
              href="/auth/login"
              className={`font-medium ${primaryTextColor} ${primaryTextHoverColor}`}
            >
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
