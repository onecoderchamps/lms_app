import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MainLayout from './layouts/MainLayout';
import Link from 'next/link';
import { db, auth } from "../../api/firebaseConfig"; 
import { collection, getDocs, query, where, onSnapshot, orderBy, documentId } from 'firebase/firestore'; 
import { BookText, CalendarDays, Clock, PlayCircle, CheckSquare, Hourglass, Star, X as CloseIcon } from 'lucide-react';

export default function UjianMuridPage() {
  const [ujians, setUjians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userClasses, setUserClasses] = useState(null);
  const [classNames, setClassNames] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasMounted, setHasMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [examResults, setExamResults] = useState({});
  const [showNilaiModal, setShowNilaiModal] = useState(false);
  const [selectedUjianHasil, setSelectedUjianHasil] = useState(null);
  const router = useRouter();

  useEffect(() => {
    setHasMounted(true);
    const unsubscribeAuth = auth.onAuthStateChanged(currentUser => {
      setUser(currentUser);
      if (currentUser) {
        fetchUserClasses(currentUser.uid);
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

  useEffect(() => {
    if (userClasses === null) return; 
    
    if (userClasses.length === 0) {
      setUjians([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "ujian"), 
      where("kelas", "in", userClasses), 
      orderBy("date", "desc")
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

  useEffect(() => {
    if (!user) return;

    const resultsQuery = query(collection(db, "examSubmissions"), where("muridId", "==", user.uid));
    const unsubscribe = onSnapshot(resultsQuery, (snapshot) => {
        const results = {};
        snapshot.forEach(doc => {
            results[doc.data().ujianId] = doc.data();
        });
        setExamResults(results);
    });

    return () => unsubscribe();
  }, [user]);

  const getUjianStatus = (ujian, resultData) => {
    const ujianStartDateTime = new Date(`${ujian.date}T${ujian.time}:00`);
    const ujianEndDateTime = new Date(
      ujianStartDateTime.getTime() + ujian.durationMinutes * 60000
    );
    const now = currentTime;
    
    if (resultData && resultData.nilai !== null && resultData.nilai !== undefined) {
        return { text: "Sudah Dinilai", colorClass: "bg-green-100 text-green-700", action: "lihat_nilai", icon: <Star size={14} /> };
    }
    
    if (now < ujianStartDateTime) {
        const diffMs = ujianStartDateTime.getTime() - now.getTime();
        const diffMinutes = Math.round(diffMs / (1000 * 60));
        if (diffMinutes <= 60 && diffMinutes > 0) { 
            return { text: `Mulai dalam ${diffMinutes} mnt`, colorClass: "bg-yellow-100 text-yellow-700", action: "tunggu", icon: <Hourglass size={14} /> };
        }
        return { text: 'Akan Datang', colorClass: 'bg-indigo-100 text-indigo-700', action: 'tunggu', icon: <BookText size={14} /> };
    } else if (now >= ujianStartDateTime && now < ujianEndDateTime) {
        if(resultData) {
            return { text: "Sudah Dikerjakan", colorClass: "bg-blue-100 text-blue-700", action: "selesai", icon: <CheckSquare size={14} /> };
        }
      return { text: 'Sedang Berlangsung', colorClass: 'bg-orange-100 text-orange-700', action: 'mulai', icon: <PlayCircle size={14} /> };
    } else {
      if (resultData) {
        return { text: 'Menunggu Penilaian', colorClass: 'bg-gray-100 text-gray-700', action: 'selesai', icon: <Hourglass size={14} /> };
      }
      return { text: 'Ujian Terlewat', colorClass: 'bg-red-100 text-red-700', action: 'terlewat', icon: <CloseIcon size={14} /> };
    }
  };

  const handleOpenNilaiModal = (ujian, result) => {
    setSelectedUjianHasil({ ...ujian, ...result });
    setShowNilaiModal(true);
  };
  
  const primaryButtonColor = "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500";
  const primaryButtonTextColor = "text-white";

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className={`mb-8 ${hasMounted ? "animate-fade-in-up" : ""}`} style={{ animationDelay: "0.1s" }}>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Jadwal Ujian Saya</h1>
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
            <div className={`text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${hasMounted ? "animate-fade-in-up" : ""}`} style={{ animationDelay: "0.2s" }}>
              <p className="text-xl font-medium text-gray-500">Belum ada jadwal ujian.</p>
              <p className="text-sm text-gray-400 mt-2">Hubungi guru Anda jika ada pertanyaan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {ujians.map((ujian, index) => {
                const resultData = examResults[ujian.id];
                const statusInfo = getUjianStatus(ujian, resultData);
                return (
                  <div
                    key={ujian.id}
                    className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 flex flex-col ${hasMounted ? "animate-fade-in-up" : ""}`}
                    style={{ animationDelay: `${index * 0.05 + 0.2}s` }}
                  >
                    {/* --- DIUBAH: Menggunakan <img> untuk gambar dan span untuk status --- */}
                    <div className="relative">
                        <img 
                            src={ujian.coverImageUrl || `/ujian.svg`}
                            alt={`Sampul untuk ${ujian.name}`}
                            className="w-full h-36 object-cover"
                            onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/600x400/f97316/ffffff?text=Ujian`}}
                        />
                        <span className={`absolute top-2 right-2 px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 ${statusInfo.colorClass}`}>
                            {statusInfo.icon}
                            {statusInfo.text}
                        </span>
                    </div>
                    
                    <div className="p-5 flex flex-col flex-grow">
                      <p className="font-semibold text-md text-gray-800 mb-1.5 leading-tight flex-grow min-h-[3.5rem] line-clamp-3" title={ujian.name}>
                        {ujian.name}
                      </p>
                      <p className="text-xs text-gray-500 mb-3 font-medium">
                        Kelas: {classNames[ujian.kelas] || "..."}
                      </p>
                      <div className="flex items-center text-gray-600 text-xs mb-1">
                        <CalendarDays size={14} className="mr-2 text-gray-400" />
                        <span>{new Date(ujian.date).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                      </div>
                      <div className="flex items-center text-gray-600 text-xs mb-4">
                        <Clock size={14} className="mr-2 text-gray-400" />
                        <span>Pukul: {ujian.time} WIB (Durasi: {ujian.durationMinutes} mnt)</span>
                      </div>
                      <div className="mt-auto">
                        {statusInfo.action === 'mulai' ? (
                          <Link
                            href={`/murid/soal?ujianId=${ujian.id}`}
                            className={`flex items-center justify-center px-4 py-2.5 rounded-lg shadow-md transition duration-300 text-sm font-medium w-full ${primaryButtonColor} ${primaryButtonTextColor}`}
                          >
                            <PlayCircle size={16} className="mr-2" /> Mulai Ujian Sekarang
                          </Link>
                        ) : statusInfo.action === 'lihat_nilai' ? (
                           <button
                            onClick={() => handleOpenNilaiModal(ujian, resultData)}
                            className="flex items-center justify-center bg-green-500 text-white px-4 py-2.5 rounded-lg shadow-md text-sm font-medium w-full"
                          > <Star size={16} className="mr-2" /> Lihat Nilai </button>
                        ) : (
                          <button
                            className="flex items-center justify-center bg-gray-200 text-gray-500 px-4 py-2.5 rounded-lg shadow-sm cursor-not-allowed text-sm font-medium w-full" disabled
                          >
                            {React.cloneElement(statusInfo.icon, { size: 16, className: "mr-2" })}
                            {statusInfo.text}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {showNilaiModal && selectedUjianHasil && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up">
              <button onClick={() => setShowNilaiModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
                <CloseIcon size={24} />
              </button>
              <div className="text-center">
                <span className="inline-block p-3 bg-green-100 text-green-600 rounded-full mb-3"><Star size={32} /></span>
                <h2 className="text-2xl font-bold mb-1 text-gray-800">Hasil Ujian</h2>
                <p className="text-sm text-gray-500 mb-4 break-words">"{selectedUjianHasil.name}"</p>
              </div>
              <div className="space-y-4 text-center bg-slate-50 p-6 rounded-lg">
                  <div>
                      <p className="text-sm font-medium text-gray-500">NILAI AKHIR</p>
                      <p className="text-5xl font-bold text-green-600">{selectedUjianHasil.nilai}</p>
                  </div>
              </div>
              <div className="flex justify-end space-x-3 pt-6">
                <button type="button" onClick={() => setShowNilaiModal(false)} className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md text-sm font-medium`}>
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

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