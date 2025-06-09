import { useState, useEffect } from "react";
import MainLayout from "./layouts/MainLayout";
import Link from "next/link";
import {
  Users,
  BookOpen,
  Edit,
  MonitorPlay,
  BarChart3,
  PieChart,
} from "lucide-react"; // Sesuaikan ikon yang dipakai

// Mengembalikan Komponen DashboardCard dengan background gradient penuh warna
const DashboardCard = ({
  title,
  value,
  icon,
  bgColorClasses,
  link,
  linkText,
  animationDelay,
}) => {
  const IconComponent = icon;
  return (
    <div
      // Terapkan kelas gradient background di sini
      className={`rounded-xl shadow-lg p-5 md:p-6 text-white hover:opacity-90 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up flex flex-col justify-between ${bgColorClasses}`}
      style={{ animationDelay }}
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-base sm:text-lg font-semibold uppercase tracking-wider">
            {title}
          </h3>
          <div className="p-2.5 rounded-full bg-white bg-opacity-25">
            {" "}
            {/* Background ikon dibuat transparan */}
            <IconComponent size={28} strokeWidth={1.5} />
          </div>
        </div>
        <p className="text-3xl sm:text-4xl font-bold mb-1">{value}</p>
      </div>
      {link && linkText && (
        <Link
          href={link}
          className="text-sm font-medium hover:underline mt-3 pt-2 block self-start"
        >
          {linkText} &rarr;
        </Link>
      )}
    </div>
  );
};

// Komponen Section di dalam kartu putih besar
const DashboardSection = ({
  title,
  icon,
  children,
  animationDelay,
  className,
}) => {
  const IconComponent = icon;
  return (
    <div
      className={`bg-slate-50 p-6 rounded-xl shadow-inner animate-fade-in-up ${className}`}
      style={{ animationDelay }}
    >
      <div className="flex items-center mb-4">
        {IconComponent && (
          <IconComponent size={20} className="text-orange-500 mr-2.5" />
        )}
        <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
      </div>
      {children}
    </div>
  );
};

export default function GuruDashboardPage() {
  const [summaryData, setSummaryData] = useState({
    totalMurid: 150,
    kelasAktif: 5,
    tugasPerluDinilai: 7,
    sesiLiveMendatang: 2,
  });

  const primaryButtonColor =
    "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500";
  const primaryButtonTextColor = "text-white";

  useEffect(() => {
    const idKelas = localStorage.getItem("idKelas");
    if (idKelas) {
      // console.log("Kelas terpilih:", idKelas);
      // fetch data by idKelas
    }
  }, []);

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        {/* Kartu putih besar sebagai latar belakang konten dashboard */}
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div
            className="mb-8 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Dashboard Guru
            </h1>
            <p className="text-gray-600 mt-1">
              Selamat datang kembali! Berikut ringkasan aktivitas Anda.
            </p>
          </div>

          {/* Grid Kartu Ringkasan BERWARNA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-8">
            <DashboardCard
              title="Total Murid"
              value={summaryData.totalMurid}
              icon={Users}
              bgColorClasses="bg-gradient-to-br from-blue-500 to-blue-700"
              link="/guru/member"
              linkText="Kelola Murid"
              animationDelay="0.2s"
            />
            <DashboardCard
              title="Kelas Aktif"
              value={summaryData.kelasAktif}
              icon={BookOpen}
              bgColorClasses="bg-gradient-to-br from-indigo-500 to-indigo-700"
              link="#"
              linkText="Lihat Kelas"
              animationDelay="0.3s"
            />
            <DashboardCard
              title="Tugas Perlu Dinilai"
              value={summaryData.tugasPerluDinilai}
              icon={Edit}
              bgColorClasses="bg-gradient-to-br from-amber-500 to-amber-600"
              link="/guru/kelas/berikan-nilai"
              linkText="Beri Nilai"
              animationDelay="0.4s"
            />
            <DashboardCard
              title="Sesi Live Mendatang"
              value={summaryData.sesiLiveMendatang}
              icon={MonitorPlay}
              bgColorClasses="bg-gradient-to-br from-purple-500 to-purple-700"
              link="/guru/kelas/sesi-live"
              linkText="Kelola Sesi Live"
              animationDelay="0.5s"
            />
          </div>

          {/* Bagian lain dashboard, misalnya Chart atau Daftar Aktivitas Terbaru */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <DashboardSection
              title="Aktivitas Kelas (Contoh)"
              icon={BarChart3}
              animationDelay="0.6s"
              className="lg:col-span-1"
            >
              <ul className="space-y-2 text-sm">
                <li className="text-gray-600 border-b border-slate-200 pb-1.5">
                  Murid A mengumpulkan tugas "Aljabar Bab 1".
                </li>
                <li className="text-gray-600 border-b border-slate-200 pb-1.5">
                  Sesi Live "Kalkulus Lanjutan" akan dimulai besok.
                </li>
                <li className="text-gray-600">
                  Anda memberikan nilai untuk tugas "Descriptive Text".
                </li>
              </ul>
            </DashboardSection>
            <DashboardSection
              title="Distribusi Nilai (Contoh)"
              icon={PieChart}
              animationDelay="0.7s"
              className="lg:col-span-2"
            >
              <div className="h-48 bg-slate-100 flex items-center justify-center rounded-md border border-slate-200">
                <p className="text-gray-400">Area Grafik Distribusi Nilai</p>
              </div>
            </DashboardSection>
          </div>

          {/* Aksi Cepat */}
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: "0.8s" }}
          >
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Aksi Cepat
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/guru/sesi-live">
                <button
                  className={`flex items-center space-x-2 ${primaryButtonColor} ${primaryButtonTextColor} px-4 py-2 rounded-lg shadow-md text-sm font-medium`}
                >
                  <MonitorPlay size={18} /> <span>Jadwalkan Sesi Live</span>
                </button>
              </Link>
              <Link href="/guru/tugas">
                <button
                  className={`flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md text-sm font-medium`}
                >
                  <Edit size={18} /> <span>Buat Tugas Baru</span>
                </button>
              </Link>
              {/* Tambahkan tombol aksi cepat lainnya jika perlu */}
            </div>
          </div>
        </div>
        <style jsx>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.5s ease-out forwards;
            opacity: 0;
          }
        `}</style>
      </main>
    </MainLayout>
  );
}
