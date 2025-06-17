import { useState, useEffect } from 'react';
import MainLayout from './layouts/MainLayout';
import Link from 'next/link';
import { db, auth } from "../../api/firebaseConfig"; // Pastikan path ini benar
import { collection, getDocs, query, where, onSnapshot, orderBy, documentId } from 'firebase/firestore'; // Import documentId
import { BookText, CalendarDays, Clock, PlayCircle, CheckSquare, Hourglass } from 'lucide-react';

export default function UjianMuridPage() {
  const [ujians, setUjians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userClasses, setUserClasses] = useState(null);
  const [classNames, setClassNames] = useState({}); // State baru untuk nama kelas
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasMounted, setHasMounted] = useState(false);

  // Langkah 1: Dapatkan daftar kelas yang diikuti murid
  useEffect(() => {
    setHasMounted(true);
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        fetchUserClasses(user.uid);
      } else {
        setLoading(false);
        setUserClasses([]);
      }
    });

    const timer = setInterval(() => setCurrentTime(new Date()), 60000); 
    
    return () => {
      unsubscribeAuth();
      clearInterval(timer);
    };
  }, []);

  const fetchUserClasses = async (uid) => {
    try {
      const enrollmentsQuery = query(collection(db, "enrollments"), where("muridId", "==", uid));
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      const classIds = enrollmentsSnapshot.docs.map(doc => doc.data().kelasId);
      
      if (classIds.length > 0) {
        // Ambil juga nama kelasnya
        const kelasQuery = query(collection(db, "kelas"), where(documentId(), "in", classIds));
        const kelasSnapshot = await getDocs(kelasQuery);
        
        const namesMap = {};
        kelasSnapshot.forEach(doc => {
          namesMap[doc.id] = doc.data().namaKelas;
        });
        
        setClassNames(namesMap);
        setUserClasses(classIds);
      } else {
        setUserClasses([]);
        setClassNames({});
      }
    } catch (err) {
      console.error("Gagal mengambil kelas murid:", err);
      setUserClasses([]); 
    }
  };

  // Langkah 2: Ambil data ujian berdasarkan daftar kelas murid
  useEffect(() => {
    if (userClasses === null) return; 
    
    if (userClasses.length === 0) {
      setUjians([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Query ini memerlukan indeks: ujian(kelas ASC, date DESC)
    const q = query(
      collection(db, "ujian"), 
      where("kelas", "in", userClasses), 
      orderBy("date", "desc") // Mengurutkan berdasarkan tanggal ujian
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUjians(data);
      setLoading(false);
    }, (error) => {
      console.error("Gagal mengambil data ujian:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userClasses]);

  const getUjianStatus = (ujianDate, ujianTime, durationMinutes) => {
    const ujianStartDateTime = new Date(`${ujianDate}T${ujianTime}:00`);
    const ujianEndDateTime = new Date(ujianStartDateTime.getTime() + durationMinutes * 60000);
    const now = currentTime;

    if (now < ujianStartDateTime) {
      const diffMs = ujianStartDateTime.getTime() - now.getTime();
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      if (diffMinutes <= 60 && diffMinutes > 0) { 
        return { text: `Mulai dalam ${diffMinutes} mnt`, color: 'from-yellow-400 to-yellow-600', action: 'tunggu_dekat', icon: <Hourglass size={36} strokeWidth={1.5}/> };
      }
      return { text: 'Akan Datang', color: 'from-indigo-400 to-indigo-600', action: 'tunggu', icon: <BookText size={36} strokeWidth={1.5}/> };
    } else if (now >= ujianStartDateTime && now < ujianEndDateTime) {
      return { text: 'Sedang Berlangsung', color: 'from-orange-400 to-orange-600', action: 'mulai', icon: <PlayCircle size={36} strokeWidth={1.5}/> };
    } else {
      return { text: 'Sudah Selesai', color: 'from-green-400 to-green-600', action: 'selesai', icon: <CheckSquare size={36} strokeWidth={1.5}/> };
    }
  };
  
  const primaryButtonColor = "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500";
  const primaryButtonTextColor = "text-white";

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className={`mb-8 ${hasMounted ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '0.1s' }}>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Jadwal Ujian Saya</h1>
            
            {/* SUB-JUDUL PINTAR DITAMPILKAN DI SINI */}
            {Object.keys(classNames).length > 0 && (
                <p className="mt-1 text-orange-600 font-semibold">
                    {Object.keys(classNames).length === 1
                        ? `Kelas: ${Object.values(classNames)[0]}`
                        : 'Untuk Semua Kelas Anda'
                    }
                </p>
            )}
          </div>

          {loading ? (
              <p className="text-center text-gray-500 py-16 animate-pulse">Memuat jadwal ujian...</p>
          ) : ujians.length === 0 ? (
            <div className={`text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${hasMounted ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '0.2s' }}>
              <p className="text-xl font-medium text-gray-500">Belum ada jadwal ujian.</p>
              <p className="text-sm text-gray-400 mt-2">Hubungi guru Anda jika ada pertanyaan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {ujians.map((ujian, index) => {
                const statusInfo = getUjianStatus(ujian.date, ujian.time, ujian.durationMinutes);
                return (
                  <div
                    key={ujian.id}
                    className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 flex flex-col ${hasMounted ? 'animate-fade-in-up' : ''}`}
                    style={{ animationDelay: `${(index * 0.05) + 0.2}s` }}
                  >
                    <div className={`relative h-36 flex flex-col items-center justify-center p-4 text-white bg-gradient-to-br ${statusInfo.color}`}>
                      {statusInfo.icon}
                      <span className="absolute top-2 right-2 px-2.5 py-1 text-xs font-medium rounded-full bg-black bg-opacity-25">
                        {statusInfo.text}
                      </span>
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <p className="font-semibold text-md text-gray-800 mb-1.5 leading-tight flex-grow min-h-[3.5rem] line-clamp-3" title={ujian.name}>
                        {ujian.name}
                      </p>
                      
                      {/* NAMA KELAS DITAMPILKAN DI SINI */}
                      <p className="text-xs text-gray-500 mb-3 font-medium">
                        Kelas: {classNames[ujian.kelas] || '...'}
                      </p>
                      
                      <div className="flex items-center text-gray-600 text-xs mb-1">
                        <CalendarDays size={14} className="mr-2 text-gray-400" />
                        <span>{new Date(ujian.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center text-gray-600 text-xs mb-4">
                        <Clock size={14} className="mr-2 text-gray-400" />
                        <span>Pukul: {ujian.time} WIB (Durasi: {ujian.durationMinutes} mnt)</span>
                      </div>

                      <div className="mt-auto">
                        {statusInfo.action === 'mulai' ? (
                          <a
                            href={ujian.fileSoalUrl} target="_blank" rel="noreferrer"
                            className={`flex items-center justify-center px-4 py-2.5 rounded-lg shadow-md transition duration-300 text-sm font-medium w-full ${primaryButtonColor} ${primaryButtonTextColor}`}
                          > <PlayCircle size={16} className="mr-2" /> Mulai Ujian Sekarang </a>
                        ) : statusInfo.action === 'tunggu_dekat' ? (
                          <button
                            className="flex items-center justify-center bg-yellow-500 text-white px-4 py-2.5 rounded-lg shadow-md text-sm font-medium w-full cursor-default" disabled
                          > <Hourglass size={16} className="mr-2" /> {statusInfo.text} </button>
                        ): statusInfo.action === 'tunggu' ? (
                          <button
                            className="flex items-center justify-center bg-gray-200 text-gray-500 px-4 py-2.5 rounded-lg shadow-sm cursor-not-allowed text-sm font-medium w-full" disabled
                          > <Hourglass size={16} className="mr-2" /> Ujian Belum Dimulai </button>
                        ) : (
                          <button
                            className="flex items-center justify-center bg-green-500 text-white px-4 py-2.5 rounded-lg shadow-md text-sm font-medium w-full cursor-default" disabled
                          > <CheckSquare size={16} className="mr-2" /> Ujian Telah Selesai </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.4s ease-out forwards;
            opacity: 0; 
          }
          .line-clamp-3 { 
            overflow: hidden;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
          }
        `}</style>
      </main>
    </MainLayout>
  );
}