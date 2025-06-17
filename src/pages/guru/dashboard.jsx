import { useState, useEffect } from "react";
import MainLayout from "./layouts/MainLayout";
import Link from "next/link";
import { Users, BookOpen, Edit, MonitorPlay, MessageSquare, X as CloseIcon } from "lucide-react";
import { useAuth } from "@/component/AuthProvider";
import { db } from "../../api/firebaseConfig";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";

// Komponen Kartu Ringkasan
const DashboardCard = ({ title, value, icon, bgColorClasses, link, linkText, animationDelay }) => {
  const IconComponent = icon;
  return (
    <div
      className={`rounded-xl shadow-lg p-5 md:p-6 text-white hover:opacity-90 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up flex flex-col justify-between ${bgColorClasses}`}
      style={{ animationDelay }}
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-base sm:text-lg font-semibold uppercase tracking-wider">
            {title}
          </h3>
          <div className="p-2.5 rounded-full bg-white bg-opacity-25">
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

export default function GuruDashboardPage() {
  const { user } = useAuth();
  const [activeClass, setActiveClass] = useState({ id: null, name: null });
  
  const [summaryData, setSummaryData] = useState({
    totalMurid: 0,
    totalMateri: 0,
    tugasPerluDinilai: 0,
    sesiLiveMendatang: 0,
  });
  const [loading, setLoading] = useState(true);

  // State untuk modal pengumuman
  const [showPengumumanModal, setShowPengumumanModal] = useState(false);
  const [pengumumanText, setPengumumanText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const idKelas = localStorage.getItem("idKelas");
    const namaKelas = localStorage.getItem("namaKelas");

    if (idKelas && user) {
        setActiveClass({ id: idKelas, name: namaKelas });
        
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // 1. Hitung Total Murid di Kelas Ini
                const enrollmentsQuery = query(collection(db, "enrollments"), where("kelasId", "==", idKelas));
                const enrollmentsSnap = await getDocs(enrollmentsQuery);
                const totalMurid = enrollmentsSnap.size;

                // 2. Hitung Total Materi di Kelas Ini
                const materiQuery = query(collection(db, "materi"), where("kelas", "==", idKelas));
                const materiSnap = await getDocs(materiQuery);
                const totalMateri = materiSnap.size;

                // 3. Hitung Tugas yang Perlu Dinilai di Kelas Ini
                const submissionsQuery = query(collection(db, "assignmentSubmissions"), where("kelasId", "==", idKelas), where("nilai", "==", null));
                const submissionsSnap = await getDocs(submissionsQuery);
                const tugasPerluDinilai = submissionsSnap.size;

                // 4. Hitung Sesi Live Mendatang (LOGIKA DIKEMBALIKAN KE ASLI)
                const today = new Date().toISOString().split('T')[0];
                const sesiLiveQuery = query(collection(db, "sesiLive"), where("kelas", "==", idKelas), where("date", ">=", today));
                const sesiLiveSnap = await getDocs(sesiLiveQuery);
                let sesiLiveMendatang = 0;
                sesiLiveSnap.forEach(doc => {
                    const sesi = doc.data();
                    if (sesi.date && sesi.time) { 
                        const sesiDateTime = new Date(`${sesi.date}T${sesi.time}`);
                        if (sesiDateTime > new Date()) {
                            sesiLiveMendatang++;
                        }
                    }
                });

                setSummaryData({
                    totalMurid,
                    totalMateri,
                    tugasPerluDinilai,
                    sesiLiveMendatang,
                });

            } catch (error) {
                console.error("Gagal mengambil data dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    } else {
        setLoading(false);
    }
  }, [user]);

  const handleKirimPengumuman = async () => {
    if (!pengumumanText.trim()) {
        alert('Harap isi teks pengumuman.');
        return;
    }
    if (!activeClass.id) {
        alert('Kelas aktif tidak ditemukan. Harap pilih kelas terlebih dahulu.');
        return;
    }
    
    setIsSubmitting(true);
    try {
        await addDoc(collection(db, 'pengumuman'), {
            isi: pengumumanText,
            kelas: activeClass.id,
            namaKelas: activeClass.name,
            guruId: user.uid,
            namaGuru: user.namaLengkap,
            createdAt: serverTimestamp(),
        });
        
        alert('Pengumuman berhasil dikirim!');
        setShowPengumumanModal(false);
        setPengumumanText('');

    } catch (error) {
        console.error("Gagal mengirim pengumuman:", error);
        alert('Terjadi kesalahan saat mengirim pengumuman.');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div
            className="mb-8 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Dashboard Kelas: <span className='text-orange-600'>{activeClass.name || 'Pilih Kelas'}</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Selamat datang kembali, {user?.namaLengkap}! Berikut ringkasan aktivitas kelas Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-8">
            <DashboardCard
              title="Total Murid"
              value={loading ? '...' : summaryData.totalMurid}
              icon={Users}
              bgColorClasses="bg-gradient-to-br from-blue-500 to-blue-700"
              link="/guru/member"
              linkText="Kelola Murid"
              animationDelay="0.2s"
            />
            <DashboardCard
              title="Total Materi"
              value={loading ? '...' : summaryData.totalMateri}
              icon={BookOpen}
              bgColorClasses="bg-gradient-to-br from-indigo-500 to-indigo-700"
              link="/guru/materi"
              linkText="Lihat Materi"
              animationDelay="0.3s"
            />
            <DashboardCard
              title="Tugas Perlu Dinilai"
              value={loading ? '...' : summaryData.tugasPerluDinilai}
              icon={Edit}
              bgColorClasses="bg-gradient-to-br from-amber-500 to-amber-600"
              link="/guru/berikan-nilai"
              linkText="Beri Nilai"
              animationDelay="0.4s"
            />
            <DashboardCard
              title="Sesi Live Mendatang"
              value={loading ? '...' : summaryData.sesiLiveMendatang}
              icon={MonitorPlay}
              bgColorClasses="bg-gradient-to-br from-purple-500 to-purple-700"
              link="/guru/sesi-live"
              linkText="Kelola Sesi Live"
              animationDelay="0.5s"
            />
          </div>

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
                  className={`flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow-md text-sm font-medium`}
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
              <button
                  onClick={() => setShowPengumumanModal(true)}
                  className={`flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md text-sm font-medium`}
              >
                  <MessageSquare size={18} /> <span>Buat Pengumuman</span>
              </button>
            </div>
          </div>
        </div>

        {showPengumumanModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up">
                    <button 
                        onClick={() => setShowPengumumanModal(false)} 
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                    >
                        <CloseIcon size={24} />
                    </button>
                    <h2 className="text-xl font-semibold mb-1 text-gray-800">Buat Pengumuman Baru</h2>
                    <p className="text-sm text-gray-500 mb-6">Untuk Kelas: <span className="font-bold text-orange-600">{activeClass.name}</span></p>
                    
                    <div>
                        <textarea
                            value={pengumumanText}
                            onChange={(e) => setPengumumanText(e.target.value)}
                            rows={5}
                            placeholder="Ketik isi pengumuman Anda di sini..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-6">
                        <button 
                            type="button" 
                            onClick={() => setShowPengumumanModal(false)} 
                            className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                        >
                            Batal
                        </button>
                        <button 
                            type="button" 
                            onClick={handleKirimPengumuman} 
                            disabled={isSubmitting || !pengumumanText.trim()}
                            className="px-5 py-2.5 bg-orange-500 text-white rounded-lg shadow-md hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        > 
                            {isSubmitting ? 'Mengirim...' : 'Kirim Pengumuman'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        
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