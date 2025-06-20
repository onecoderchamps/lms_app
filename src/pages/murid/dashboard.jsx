import React, { useState, useEffect } from 'react';
import MainLayout from './layouts/MainLayout';
import Link from 'next/link';
import { db, auth } from "../../api/firebaseConfig";
// --- DIUBAH: Menambahkan 'limit' pada import dari firestore ---
import { collection, getDocs, query, where, doc, getDoc, orderBy, Timestamp, limit } from 'firebase/firestore';
import { BookText, ListChecks, Edit, Loader, AlertTriangle, Video, FileText } from 'lucide-react';
import DashboardCalendar from './component/calendar';
import { useAuth } from '@/component/AuthProvider';

// Komponen Kartu Dashboard
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

// --- Komponen Utama Dashboard Murid ---
export default function MuridDashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    tugasMendatang: 0,
    ujianBerikutnya: { nama: 'Tidak ada', tanggal: 'Tidak ada jadwal' },
    materiTerbaru: [],
    pengumumanTerbaru: null,
  });
  const [namaMurid, setNamaMurid] = useState('');
  const [enrolledKelasIds, setEnrolledKelasIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    };

    const fetchDashboardData = async (muridId) => {
      try {
        setLoading(true);

        const userDocRef = doc(db, 'users', muridId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setNamaMurid(userDocSnap.data().namaLengkap?.split(' ')[0] || 'Siswa');
        }

        const enrollmentsQuery = query(collection(db, 'enrollments'), where('muridId', '==', muridId));
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        const ids = enrollmentsSnapshot.docs.map(d => d.data().kelasId);
        
        if (ids.length === 0) {
            setLoading(false);
            setDashboardData(prev => ({...prev, tugasMendatang: 0, ujianBerikutnya: { nama: 'Tidak ada', tanggal: 'Tidak ada jadwal' }}));
            return;
        }
        setEnrolledKelasIds(ids);
        
        let tugasMendatangCount = 0;
        let ujianBerikutnyaData = { nama: 'Tidak ada', tanggal: 'Tidak ada jadwal' };
        let materiTerbaruData = [];
        let pengumumanTerbaruData = null;

        const today = new Date();
        const tugasQuery = query(collection(db, 'tugas'), where('kelas', 'in', ids), where('deadline', '>=', Timestamp.fromDate(today)));
        const ujianQuery = query(collection(db, 'ujian'), where('kelas', 'in', ids), orderBy('date', 'asc'));
        const materiQuery = query(collection(db, 'materi'), where('kelas', 'in', ids), orderBy('createdAt', 'desc'), limit(4));
        const pengumumanQuery = query(collection(db, 'pengumuman'), where('kelas', 'in', ids), orderBy('createdAt', 'desc'), limit(1));

        const [tugasSnap, ujianSnap, materiSnap, pengumumanSnap] = await Promise.all([
          getDocs(tugasQuery), getDocs(ujianQuery), getDocs(materiQuery), getDocs(pengumumanQuery)
        ]);

        tugasMendatangCount = tugasSnap.size;
        materiTerbaruData = materiSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        if (!pengumumanSnap.empty) {
          pengumumanTerbaruData = pengumumanSnap.docs[0].data();
        }

        if (!ujianSnap.empty) {
          const now = new Date();
          const futureExams = ujianSnap.docs
            .map(doc => ({id: doc.id, ...doc.data()}))
            .filter(ujian => {
                const ujianDateTime = new Date(`${ujian.date}T${ujian.time || '00:00'}:00`);
                return ujianDateTime >= now;
            });
            
          if(futureExams.length > 0) {
              const ujian = futureExams[0];
              const kelasUjianRef = doc(db, 'kelas', ujian.kelas);
              const kelasUjianSnap = await getDoc(kelasUjianRef);
              const namaKelasUjian = kelasUjianSnap.exists() ? kelasUjianSnap.data().namaKelas : 'Ujian';
              
              ujianBerikutnyaData = {
                nama: `${namaKelasUjian} - ${ujian.name}`,
                tanggal: new Date(ujian.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
              };
          }
        }
        
        setDashboardData({
          tugasMendatang: tugasMendatangCount,
          ujianBerikutnya: ujianBerikutnyaData,
          materiTerbaru: materiTerbaruData,
          pengumumanTerbaru: pengumumanTerbaruData,
        });

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Gagal memuat data dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData(user.uid);
  }, [user]);

  if (loading) {
      return (
          <MainLayout>
              <div className="flex justify-center items-center h-screen">
                  <Loader className="animate-spin text-orange-500" size={48} />
              </div>
          </MainLayout>
      );
  }

  if (error) {
      return (
          <MainLayout>
              <div className="flex flex-col justify-center items-center h-screen text-center p-4">
                  <AlertTriangle className="text-red-500 mb-4" size={48} />
                  <h2 className="text-xl font-semibold text-gray-700">Terjadi Kesalahan</h2>
                  <p className="text-gray-500">{error}</p>
              </div>
          </MainLayout>
      );
  }

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard Saya</h1>
            <p className="text-gray-600 mt-1">Selamat datang kembali, {namaMurid}! Pantau progres belajar Anda di sini.</p>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DashboardCard
                title="Tugas Mendatang"
                value={dashboardData.tugasMendatang}
                icon={Edit}
                bgColorClasses="bg-gradient-to-br from-yellow-500 to-amber-600"
                link="/murid/tugas"
                linkText="Lihat Semua Tugas"
                animationDelay="0.2s"
              />
              <DashboardCard
                title="Ujian Berikutnya"
                value={dashboardData.ujianBerikutnya.nama}
                subValue={dashboardData.ujianBerikutnya.tanggal}
                icon={ListChecks}
                bgColorClasses="bg-gradient-to-br from-purple-500 to-purple-700"
                link="/murid/ujian"
                linkText="Lihat Jadwal Ujian"
                animationDelay="0.3s"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-50 p-6 rounded-xl shadow-inner animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Materi Terbaru</h2>
                {dashboardData.materiTerbaru.length > 0 ? (
                  <ul className="space-y-3">
                    {dashboardData.materiTerbaru.map(materi => (
                      <li key={materi.id} className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-150 shadow-sm">
                        <div className="flex items-center min-w-0">
                           {materi.type === 'video' ? <Video size={20} className="text-blue-500 mr-3 flex-shrink-0" /> : <FileText size={20} className="text-red-500 mr-3 flex-shrink-0" />}
                          <span className="text-sm text-gray-700 truncate">{materi.name}</span>
                        </div>
                        <Link href={`/murid/materi`} className="text-xs text-orange-600 hover:underline font-medium flex-shrink-0 ml-4">
                          Lihat
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Belum ada materi baru.</p>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-xl shadow-inner animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">Pengumuman</h2>
                  {dashboardData.pengumumanTerbaru ? (
                      <div className="text-sm text-gray-600 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-md">
                        <p className="font-medium text-blue-700">Penting!</p>
                        <p className="mt-1">{dashboardData.pengumumanTerbaru.isi}</p>
                      </div>
                  ): (
                    <p className="text-sm text-gray-500 text-center py-4">Tidak ada pengumuman baru.</p>
                  )}
                </div>

                <div className="bg-slate-50/50 p-4 rounded-xl shadow-inner animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                  <h2 className="text-xl font-semibold text-gray-700 mb-2 text-center">Kalender Akademik</h2>
                  <DashboardCalendar enrolledKelasIds={enrolledKelasIds} />
                </div>
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