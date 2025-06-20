import React, { useState, useEffect } from 'react';
import MainLayout from './layouts/MainLayout';
import Link from 'next/link';
import { db, auth } from "../../api/firebaseConfig"; // Pastikan path ini benar
import { collection, getDocs, query, where, onSnapshot, orderBy, documentId } from 'firebase/firestore';
import { CalendarDays, Clock, Link as LinkIcon, Video, CheckSquare, Hourglass } from 'lucide-react';

export default function MuridLiveSessionPage() {
  const [liveSessions, setLiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userClasses, setUserClasses] = useState(null);
  const [classNames, setClassNames] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasMounted, setHasMounted] = useState(false);

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
    return () => unsubscribeAuth();
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
      setLiveSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "sesiLive"), 
      where("kelas", "in", userClasses), 
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLiveSessions(data);
      setLoading(false);
    }, (error) => {
      console.error("Gagal mengambil data sesi live:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userClasses]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  
  // --- DIUBAH: Logika status disempurnakan dengan warna dan ikon yang tepat ---
  const getSessionStatus = (sessionDate, sessionTime) => {
    const sessionDateTime = new Date(`${sessionDate}T${sessionTime}:00`);
    const now = currentTime;
    const diffMs = sessionDateTime.getTime() - now.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));

    if (diffMinutes > 15) {
      return { text: 'Akan Datang', colorClass: 'bg-indigo-100 text-indigo-800', isJoinable: false, icon: <CalendarDays size={14} /> };
    } else if (diffMinutes > 0) {
      return { text: `Mulai dalam ${diffMinutes} mnt`, colorClass: 'bg-yellow-100 text-yellow-800 animate-pulse', isJoinable: false, icon: <Hourglass size={14} /> };
    } else if (diffMinutes > -60) {
      return { text: 'Berlangsung', colorClass: 'bg-green-100 text-green-800 animate-pulse', isJoinable: true, icon: <Video size={14} /> };
    } else {
      return { text: 'Selesai', colorClass: 'bg-gray-100 text-gray-800', isJoinable: false, icon: <CheckSquare size={14} /> };
    }
  };
  
  const primaryButtonColor = "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500";
  const primaryButtonTextColor = "text-white";

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className={`mb-8 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Sesi Live Saya</h1>
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
            <p className="text-center text-gray-500 py-16 animate-pulse">Memuat jadwal...</p>
          ) : liveSessions.length === 0 ? (
            <div className={`text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
              <p className="text-xl font-medium text-gray-500">Belum ada sesi live yang dijadwalkan.</p>
              <p className="text-sm text-gray-400 mt-2">Anda mungkin belum bergabung dengan kelas manapun, atau belum ada jadwal dari guru.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {liveSessions.map((session, index) => {
                const { colorClass, text: statusText, isJoinable, icon: statusIcon } = getSessionStatus(session.date, session.time);
                
                return (
                  <div key={session.id} 
                       className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 flex flex-col ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`}
                       style={{ animationDelay: hasMounted ? `${(index * 0.05) + 0.2}s` : '0s' }}>
                    
                    <div className="relative">
                        <img 
                            src={session.imageUrl || `/live.svg`}
                            alt={`Banner untuk ${session.name}`}
                            className="w-full h-36 object-cover"
                            onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/600x400/f97316/ffffff?text=Live`}}
                        />
                        {/* --- DIUBAH: Tampilan Badge Status diperbaiki --- */}
                        <span className={`absolute top-2 right-2 px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 ${colorClass}`}>
                            {statusIcon}
                            {statusText}
                        </span>
                    </div>

                    <div className="p-5 flex flex-col flex-grow">
                      <p className="font-semibold text-md text-gray-800 mb-2 leading-tight flex-grow min-h-[40px]">{session.name}</p>
                      <p className="text-xs text-gray-500 mb-3">Kelas: {classNames[session.kelas]}</p>
                      
                      <div className="flex items-center text-gray-600 text-xs mb-1">
                        <CalendarDays size={14} className="mr-2 text-gray-400" />
                        <span>{new Date(session.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                      </div>
                      <div className="flex items-center text-gray-600 text-xs mb-4">
                        <Clock size={14} className="mr-2 text-gray-400" />
                        <span>Pukul: {session.time} WIB</span>
                      </div>
                      <div className="mt-auto">
                        <a
                          href={session.link} target="_blank" rel="noreferrer"
                          className={`flex items-center justify-center px-4 py-2.5 rounded-lg shadow-md transition duration-300 text-sm font-medium w-full ${
                            !isJoinable ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : `${primaryButtonColor} ${primaryButtonTextColor}`
                          }`}
                          onClick={(e) => !isJoinable && e.preventDefault()}
                        >
                          <LinkIcon size={16} className="mr-2" /> Gabung Sesi
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div> 
        <style jsx>{`
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; opacity: 0; }
        `}</style>
      </main>
    </MainLayout>
  );
}