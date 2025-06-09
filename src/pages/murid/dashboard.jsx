
import { useState, useEffect } from 'react';
import MainLayout from './layouts/MainLayout';
import Link from 'next/link';
import { BookOpen, Edit, ListChecks, PlayCircle, FileText, Video } from 'lucide-react'; 

// Komponen Kartu Dashboard Berwarna
const DashboardCard = ({ title, value, subValue, icon, bgColorClasses, link, linkText, animationDelay }) => {
  const IconComponent = icon;
  return (
    <div
      className={`rounded-xl shadow-lg p-5 md:p-6 text-white hover:opacity-90 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up flex flex-col justify-between ${bgColorClasses}`}
      style={{ animationDelay }}
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-base sm:text-lg font-semibold uppercase tracking-wider">{title}</h3>
          <div className="p-2.5 rounded-full bg-white bg-opacity-25">
            <IconComponent size={28} strokeWidth={1.5} />
          </div>
        </div>
        <p className="text-3xl sm:text-4xl font-bold mb-1">{value}</p>
        {subValue && <p className="text-xs sm:text-sm opacity-90">{subValue}</p>}
      </div>
      {link && linkText && (
        <Link href={link} className="text-sm font-medium hover:underline mt-3 pt-2 block self-start">
          {linkText} &rarr;
        </Link>
      )}
    </div>
  );
};


export default function MuridDashboardPage() {
  const [dashboardData, setDashboardData] = useState({
    kursusDiikuti: 3,
    progresRataRata: '75%',
    tugasMendatang: 2,
    ujianBerikutnya: 'Matematika - 20 Juni 2025', // Format nama ujian - tanggal
  });
  
  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        {/* Kartu putih besar sebagai latar belakang konten dashboard */}
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className="mb-8 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            {/* Judul halaman ini idealnya di-handle oleh Navbar di MainLayout */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard Saya</h1>
            <p className="text-gray-600 mt-1">Selamat datang kembali! Pantau progres belajar Anda di sini.</p>
          </div>

          {/* Grid Kartu Ringkasan Berwarna */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6 mb-8">
            <DashboardCard
              title="Kursus Diikuti"
              value={dashboardData.kursusDiikuti}
              subValue="Total kursus aktif"
              icon={BookOpen}
              bgColorClasses="bg-gradient-to-br from-blue-500 to-blue-700"
              link="/murid/kelas" 
              linkText="Lihat Semua Kursus"
              animationDelay="0.2s"
            />
            <DashboardCard
              title="Progres Belajar"
              value={dashboardData.progresRataRata}
              subValue="Rata-rata penyelesaian"
              icon={PlayCircle} 
              bgColorClasses="bg-gradient-to-br from-green-500 to-green-700"
              link="/murid/progres" 
              linkText="Lihat Detail Progres"
              animationDelay="0.3s"
            />
            <DashboardCard
              title="Tugas Mendatang"
              value={dashboardData.tugasMendatang}
              subValue="Perlu dikerjakan segera"
              icon={Edit} // Bisa diganti dengan FilePenLine jika lebih sesuai
              bgColorClasses="bg-gradient-to-br from-yellow-500 to-amber-600" // Menggunakan amber untuk variasi kuning
              link="/murid/kelas/tugas" 
              linkText="Lihat Semua Tugas"
              animationDelay="0.4s"
            />
            <DashboardCard
              title="Ujian Berikutnya"
              value={dashboardData.ujianBerikutnya.split('-')[0].trim()} 
              subValue={dashboardData.ujianBerikutnya.split('-')[1]?.trim()} 
              icon={ListChecks}
              bgColorClasses="bg-gradient-to-br from-purple-500 to-purple-700"
              link="/murid/kelas/ujian" 
              linkText="Lihat Jadwal Ujian"
              animationDelay="0.5s"
            />
          </div>

          {/* Bagian lain dashboard murid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-slate-50 p-6 rounded-xl shadow-inner animate-fade-in-up" style={{animationDelay: '0.6s'}}>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Materi Terbaru</h2>
                <ul className="space-y-3">
                    <li className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-150 shadow-sm">
                        <div className="flex items-center">
                            <FileText size={20} className="text-orange-500 mr-3 flex-shrink-0"/>
                            <span className="text-sm text-gray-700">Pengenalan Aljabar Linear Bab 1</span>
                        </div>
                        <Link href="#" className="text-xs text-orange-600 hover:underline font-medium">Lihat</Link>
                    </li>
                    <li className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-150 shadow-sm">
                         <div className="flex items-center">
                            <Video size={20} className="text-orange-500 mr-3 flex-shrink-0"/>
                            <span className="text-sm text-gray-700">Video: Konsep Dasar Kalkulus</span>
                        </div>
                        <Link href="#" className="text-xs text-orange-600 hover:underline font-medium">Tonton</Link>
                    </li>
                </ul>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl shadow-inner animate-fade-in-up" style={{animationDelay: '0.7s'}}>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Pengumuman</h2>
                <div className="text-sm text-gray-600 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-md">
                    <p className="font-medium text-blue-700">Penting!</p>
                    <p className="mt-1">Ujian Tengah Semester akan dilaksanakan minggu depan. Persiapkan diri Anda dengan baik!</p>
                </div>
            </div>
          </div>

        </div>
        <style jsx>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
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