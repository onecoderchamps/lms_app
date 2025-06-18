import { useState, useEffect, useRef } from 'react';
import MainLayout from './layouts/MainLayout';
import Link from 'next/link';
import { db, auth } from "../../api/firebaseConfig"; // Pastikan path ini benar
import { collection, getDocs, query, where, onSnapshot, orderBy, documentId } from 'firebase/firestore';
import { FileText, Video, ExternalLink, BookText } from 'lucide-react';

export default function MateriMuridPage() {
  const [materis, setMateris] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userClasses, setUserClasses] = useState(null);
  const [classNames, setClassNames] = useState({}); // State baru untuk nama kelas
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
    return () => unsubscribeAuth();
  }, []);

  // Fungsi untuk mengambil ID dan NAMA kelas
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

  // Langkah 2: Ambil materi berdasarkan daftar kelas yang diikuti
  useEffect(() => {
    if (userClasses === null) return; 
    
    if (userClasses.length === 0) {
      setMateris([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Query ini memerlukan indeks: materi(kelas ASC, createdAt DESC)
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


  return (
    <MainLayout>
        <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className={`mb-8 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Materi Pembelajaran</h1>
            
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
              <p className="text-center text-gray-500 py-16 animate-pulse">Memuat materi...</p>
          ) : materis.length === 0 ? (
            <div className={`text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
              <p className="text-xl font-medium text-gray-500">Belum ada materi tersedia.</p>
              <p className="text-sm text-gray-400 mt-2">Periksa kembali nanti atau hubungi guru Anda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              
              {materis.map((materi, index) => (
                <a
                  key={materi.id}
                  href={materi.type === 'teks' ? '#' : (materi.fileUrl || materi.videoEmbedUrl)}
                  target={materi.type !== 'teks' ? "_blank" : "_self"}
                  rel="noreferrer"
                  onClick={(e) => materi.type === 'teks' && e.preventDefault()}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 cursor-pointer flex flex-col ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: hasMounted ? `${(index * 0.05) + 0.2}s` : '0s' }} 
                >
                  <div className={`relative h-36 flex flex-col items-center justify-center p-4 text-white
                    ${materi.type === 'pdf' ? 'bg-gradient-to-br from-red-400 to-red-600' : 
                      materi.type === 'video' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                      materi.type === 'link_eksternal' ? 'bg-gradient-to-br from-teal-400 to-teal-600' :
                      'bg-gradient-to-br from-indigo-400 to-indigo-600'
                    } transition-colors duration-300`}
                  >
                    {materi.type === 'pdf' ? <FileText size={40} strokeWidth={1.5} /> : 
                      materi.type === 'video' ? <Video size={40} strokeWidth={1.5} /> :
                      materi.type === 'link_eksternal' ? <ExternalLink size={40} strokeWidth={1.5} /> :
                      <BookText size={40} strokeWidth={1.5} />
                    }
                    <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-semibold uppercase bg-black bg-opacity-25 rounded-full">
                      {materi.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <p className="font-semibold text-md text-gray-800 mb-2 leading-tight flex-grow min-h-[3.5rem] line-clamp-3" title={materi.name}>
                      {materi.name}
                    </p>
                    <div className="mt-auto pt-2">
                      <div className="flex items-center text-orange-600 hover:text-orange-700 font-medium text-sm transition duration-150">
                        <ExternalLink size={16} className="mr-1.5" />
                        Lihat Materi
                      </div>
                    </div>
                  </div>
                </a>
              ))}
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