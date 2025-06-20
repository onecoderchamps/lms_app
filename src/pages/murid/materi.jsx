import React, { useState, useEffect } from 'react';
import MainLayout from './layouts/MainLayout';
import Link from 'next/link';
import { db, auth } from "../../api/firebaseConfig"; // Pastikan path ini benar
import { collection, getDocs, query, where, onSnapshot, orderBy, documentId } from 'firebase/firestore';
import { FileText, Video, ExternalLink, BookText, X as CloseIcon, CalendarDays } from 'lucide-react';

export default function MateriMuridPage() {
  const [materis, setMateris] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userClasses, setUserClasses] = useState(null);
  const [classNames, setClassNames] = useState({});
  const [hasMounted, setHasMounted] = useState(false);
  
  const [showTextModal, setShowTextModal] = useState(false);
  const [selectedMateri, setSelectedMateri] = useState(null);

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
      setMateris([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "materi"), 
      where("kelas", "in", userClasses), 
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMateris(data);
      setLoading(false);
    }, (error) => {
      console.error("Gagal mengambil data materi:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userClasses]);

  const handleOpenTextModal = (materi) => {
    setSelectedMateri(materi);
    setShowTextModal(true);
  };

  return (
    <MainLayout>
        <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className={`mb-8 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Materi Pembelajaran</h1>
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
              <p className="text-center text-gray-500 py-16 animate-pulse">Memuat materi...</p>
          ) : materis.length === 0 ? (
            <div className={`text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
              <p className="text-xl font-medium text-gray-500">Belum ada materi tersedia.</p>
              <p className="text-sm text-gray-400 mt-2">Periksa kembali nanti atau hubungi guru Anda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {materis.map((materi, index) => (
                <div
                  key={materi.id}
                  onClick={() => materi.type === 'teks' ? handleOpenTextModal(materi) : window.open(materi.fileUrl || materi.videoEmbedUrl, '_blank')}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 cursor-pointer flex flex-col ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: hasMounted ? `${(index * 0.05) + 0.2}s` : '0s' }} 
                >
                  <div className="relative">
                    <img 
                      src={materi.coverImageUrl || `/materi.svg`} 
                      alt={`Sampul untuk ${materi.name}`}
                      className="w-full h-36 object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/600x400/f97316/ffffff?text=Materi`}}
                    />
                    <div className={`absolute top-2 right-2 p-2 rounded-full text-white shadow-lg 
                        ${materi.type === 'pdf' ? 'bg-red-500' : 
                          materi.type === 'video' ? 'bg-blue-500' :
                          materi.type === 'link_eksternal' ? 'bg-teal-500' :
                          'bg-indigo-500'
                        }`}
                    >
                        {materi.type === 'pdf' ? <FileText size={20} /> : 
                         materi.type === 'video' ? <Video size={20} /> :
                         materi.type === 'link_eksternal' ? <ExternalLink size={20} /> :
                         <BookText size={20} />
                        }
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <p className="font-semibold text-md text-gray-800 mb-2 leading-tight flex-grow min-h-[3.5rem] line-clamp-3" title={materi.name}>
                      {materi.name}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">Kelas: {classNames[materi.kelas]}</p>
                    <div className="text-xs text-gray-500 flex items-center mb-3">
                        <CalendarDays size={14} className="mr-1.5 text-gray-400" />
                        <span>Dibuat: {materi.createdAt?.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <div className="mt-auto pt-2 border-t border-gray-100">
                      <span className="flex items-center text-orange-600 hover:text-orange-700 font-medium text-sm transition duration-150">
                        <ExternalLink size={16} className="mr-1.5" />
                        Lihat Materi
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div> 

        {showTextModal && selectedMateri && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-2xl relative animate-fade-in-up my-8">
              <button onClick={() => setShowTextModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><CloseIcon size={24}/></button>
              <h2 className="text-2xl font-bold mb-2 text-gray-800">{selectedMateri.name}</h2>
              <p className="text-sm text-gray-500 mb-4">Dibuat pada {selectedMateri.createdAt?.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <div className="prose max-w-none text-gray-700 max-h-[60vh] overflow-y-auto pr-2" dangerouslySetInnerHTML={{ __html: selectedMateri.content }}>
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
           .prose { line-height: 1.6; }
          .prose p { margin-bottom: 1em; }
          .prose h1, .prose h2, .prose h3 { margin-bottom: 0.5em; font-weight: 600; }
        `}</style>
        </main>
    </MainLayout>
  );
}