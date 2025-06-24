import { useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useRouter } from "next/router";

// Pastikan jalur impor firebaseConfig benar sesuai struktur proyek Anda
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/api/firebaseConfig"; 

export default function RegistermuridPage() {
  const router = useRouter();

  // State untuk menyimpan input form dan status UI
  const [namaLengkap, setNamaLengkap] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Untuk toggle visibilitas password
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Untuk toggle visibilitas konfirmasi password
  const [loading, setLoading] = useState(false); // Status loading saat proses registrasi

  // Fungsi untuk menangani submit form
  const handleSubmit = async (e) => {
    e.preventDefault(); // Mencegah refresh halaman default

    // Validasi sederhana password
    if (password !== confirmPassword) {
      alert("Kata sandi dan konfirmasi kata sandi tidak cocok!");
      return;
    }

    if (password.length < 6) {
      alert("Kata sandi minimal 6 karakter!");
      return;
    }

    try {
      setLoading(true); // Aktifkan status loading
      
      // Membuat user baru di Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Menyimpan data user ke Firestore dengan role "murid"
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        namaLengkap,
        email,
        role: "murid", // Secara otomatis menetapkan peran sebagai "murid"
        createdAt: new Date().toISOString(), // Waktu pembuatan akun
      });

      alert("Registrasi berhasil! Silakan login.");
      router.push("/auth/login"); // Arahkan ke halaman login setelah berhasil registrasi
    } catch (error) {
      console.error("Gagal registrasi:", error);
      alert(`Registrasi gagal: ${error.message}`); // Tampilkan pesan error jika registrasi gagal
    } finally {
      setLoading(false); // Nonaktifkan status loading
    }
  };

  // Definisi warna utama untuk konsistensi desain
  const primaryColor = "orange";
  const primaryButtonBg = `bg-${primaryColor}-500`;
  const primaryButtonHoverBg = `hover:bg-${primaryColor}-600`;
  const primaryTextColor = `text-${primaryColor}-600`;
  const primaryTextHoverColor = `hover:text-${primaryColor}-500`;
  const primaryRingColor = `focus:ring-${primaryColor}-500`;
  const primaryBorderColor = `focus:border-${primaryColor}-500`;

  return (
    // Struktur layout utama halaman dengan Tailwind CSS
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-orange-600 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl sm:rounded-xl sm:px-10">
          {/* Head untuk metadata SEO */}
          <Head>
            <title>Registrasi Akun Murid - CoderChamps LMS</title>
            <meta name="description" content="Halaman pendaftaran akun khusus untuk murid CoderChamps LMS" />
          </Head>

          {/* Logo aplikasi */}
          <div className="flex justify-center mb-6">
            <img className="h-12 w-auto" src="/logo.png" alt="CoderChamps Logo" />
          </div>
          
          {/* Judul dan deskripsi form */}
          <h2 className="mb-1 text-center text-2xl md:text-3xl font-bold tracking-tight text-gray-800">
            Pendaftaran Akun <span className={`${primaryTextColor}`}>Murid</span>
          </h2>
          <p className="mb-8 text-center text-sm text-gray-600">
            Isi data berikut untuk membuat akun baru.
          </p>

          {/* Formulir Pendaftaran */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Input Nama Lengkap */}
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
                className={`mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none ${primaryRingColor} ${primaryBorderColor} sm:text-sm`}
              />
            </div>

            {/* Input Alamat Email */}
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
                className={`mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none ${primaryRingColor} ${primaryBorderColor} sm:text-sm`}
              />
            </div>

            {/* Input Kata Sandi */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Kata Sandi
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"} // Toggle tipe input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Minimal 6 karakter"
                  className={`block w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none ${primaryRingColor} ${primaryBorderColor} sm:text-sm`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)} // Toggle visibilitas
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />} {/* Ikon mata */}
                </button>
              </div>
            </div>

            {/* Input Konfirmasi Kata Sandi */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Konfirmasi Kata Sandi
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"} // Toggle tipe input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Ulangi kata sandi Anda"
                  className={`block w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none ${primaryRingColor} ${primaryBorderColor} sm:text-sm`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)} // Toggle visibilitas
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />} {/* Ikon mata */}
                </button>
              </div>
            </div>

            {/* Tombol Submit */}
            <div>
              <button
                type="submit"
                disabled={loading} // Nonaktifkan tombol saat loading
                className={`w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${primaryButtonBg} ${primaryButtonHoverBg} focus:outline-none focus:ring-2 focus:ring-offset-2 ${primaryRingColor} transition duration-150`}
              >
                <UserPlus size={18} className="mr-2" />
                {loading ? "Mendaftarkan..." : "Daftar Akun Murid"}
              </button>
            </div>
          </form>

          {/* Link ke halaman Login */}
          <p className="mt-8 text-center text-sm text-gray-600">
            Sudah punya akun?{" "}
            <Link href="/auth/login" className={`font-medium ${primaryTextColor} ${primaryTextHoverColor}`}>
              Masuk di sini
            </Link>
          </p>

          {/* Link ke halaman Daftar Guru (Tambahan Baru) */}
          <p className="mt-4 text-center text-sm text-gray-600">
            Atau ingin mendaftar sebagai{" "}
            <Link href="/authGuru/register" className={`font-medium ${primaryTextColor} ${primaryTextHoverColor}`}>
              Guru
            </Link>
            ?
          </p>

        </div>
      </div>
    </div>
  );
}