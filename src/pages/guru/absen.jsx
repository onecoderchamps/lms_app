// src/pages/guru/absen.jsx (atau path yang sesuai)
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MainLayout from './layouts/MainLayout';
import { db, auth } from '../../api/firebaseConfig';
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { ArrowLeft, Loader } from 'lucide-react';

const GuruPantauAbsenPage = () => {
  const router = useRouter();
  const [absensiList, setAbsensiList] = useState([]);
  const [muridDiKelas, setMuridDiKelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeClass, setActiveClass] = useState({ id: null, name: null });
  const [filterTanggal, setFilterTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [hasMounted, setHasMounted] = useState(false);

  // 1. Ambil kelas aktif dari localStorage
  useEffect(() => {
    setHasMounted(true);
    const classId = localStorage.getItem('idKelas');
    const className = localStorage.getItem('namaKelas');
    if (classId && className) {
      setActiveClass({ id: classId, name: className });
    } else {
      setLoading(false);
    }
  }, []);

  // 2. Ambil daftar murid yang terdaftar di kelas aktif
  useEffect(() => {
    if (!activeClass.id) return;

    const enrollmentsQuery = query(collection(db, 'enrollments'), where('kelasId', '==', activeClass.id));
    
    const unsubscribe = onSnapshot(enrollmentsQuery, async (snapshot) => {
        const enrolledMuridPromises = snapshot.docs.map(async (enrollmentDoc) => {
            const muridId = enrollmentDoc.data().muridId;
            const userDocRef = doc(db, 'users', muridId);
            const userSnap = await getDoc(userDocRef);
            if(userSnap.exists()) {
                return { id: userSnap.id, ...userSnap.data() };
            }
            return null;
        });

        const enrolledMuridData = (await Promise.all(enrolledMuridPromises)).filter(Boolean); // filter out nulls
        setMuridDiKelas(enrolledMuridData);
    });

    return () => unsubscribe();
  }, [activeClass.id]);


  // 3. Ambil data absensi yang sudah ada & gabungkan dengan daftar murid di kelas
  useEffect(() => {
    if (!filterTanggal || muridDiKelas.length === 0 || !activeClass.id) {
        if(muridDiKelas.length > 0) setLoading(false);
        // Jika belum ada murid, set absensi list menjadi kosong
        if(muridDiKelas.length === 0 && !loading) setAbsensiList([]);
        return;
    };

    setLoading(true);
    const q = query(
        collection(db, 'attendanceRecords'), 
        where('date', '==', filterTanggal),
        where('kelasId', '==', activeClass.id) // Hanya ambil absensi untuk kelas ini
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const existingAbsensi = {};
      snapshot.forEach(doc => {
        existingAbsensi[doc.data().muridId] = { id: doc.id, ...doc.data() };
      });

      const combinedList = muridDiKelas.map(murid => {
        return existingAbsensi[murid.id] || {
          id: `${filterTanggal}_${murid.id}`,
          muridId: murid.id,
          namaSiswa: murid.namaLengkap, // Menggunakan namaLengkap
          kelasId: activeClass.id, // Menyertakan ID kelas
          kelas: activeClass.name, // Menyertakan nama kelas
          date: filterTanggal,
          status: 'Belum Absen',
          waktu: ''
        };
      });
      
      setAbsensiList(combinedList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filterTanggal, muridDiKelas, activeClass.id]);


  // 4. Fungsi untuk mengubah status absensi
  const handleStatusChange = async (absenData, newStatus) => {
    const docId = `${absenData.date}_${absenData.muridId}`;
    const absenRef = doc(db, 'attendanceRecords', docId);
    
    try {
      const updatedFields = {
        muridId: absenData.muridId,
        namaSiswa: absenData.namaSiswa,
        kelasId: activeClass.id, // Pastikan ID kelas tersimpan
        date: absenData.date,
        status: newStatus,
        waktu: newStatus === 'Hadir' ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '',
        recordedBy: auth.currentUser?.uid || 'guru',
        updatedAt: serverTimestamp()
      };
      await setDoc(absenRef, updatedFields, { merge: true });
    } catch (error) {
      console.error('Gagal update absensi:', error);
      alert('Gagal memperbarui status absensi.');
    }
  };
  
  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case 'Hadir': return 'bg-green-100 text-green-700';
      case 'Sakit': return 'bg-yellow-100 text-yellow-700';
      case 'Izin': return 'bg-blue-100 text-blue-700';
      case 'Alpha': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-200 text-gray-600';
    }
  };
  
  const statusOptions = ['Belum Absen', 'Hadir', 'Sakit', 'Izin', 'Alpha'];
  const inputFocusColor = 'focus:ring-orange-500 focus:border-orange-500';

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className={`mb-8 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Monitoring Absensi Harian</h1>
            <p className="text-md text-orange-600 font-semibold mt-1">Untuk Kelas: {activeClass.name}</p>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-5 bg-gray-50 rounded-lg shadow-sm border border-gray-200 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
            <div>
              <label htmlFor="filterTanggal" className="block text-sm font-medium text-gray-700 mb-1">Pilih Tanggal</label>
              <input type="date" id="filterTanggal" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)}
                className={`w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm ${inputFocusColor} bg-white`} />
            </div>
          </div>

          <div className={`overflow-x-auto rounded-lg border border-gray-200 shadow-sm ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Murid</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                  <th className="px-5 py-3.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ubah Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                    <tr><td colSpan="5" className="text-center p-10 text-gray-500"><Loader className="animate-spin inline-block mr-2" /> Memuat data...</td></tr>
                ) : absensiList.length === 0 ? (
                    <tr><td colSpan="5" className="text-center p-10 text-gray-500">Tidak ada murid di kelas ini. Tambahkan murid di menu 'Manajemen Murid'.</td></tr>
                ) : (
                  absensiList.map((murid, index) => (
                    <tr key={murid.muridId} className="hover:bg-gray-50/50 transition-colors duration-150">
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-800">{index + 1}.</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{murid.namaSiswa}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClasses(murid.status)}`}>{murid.status}</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">{murid.waktu || '-'}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-center text-sm">
                        <select value={murid.status} onChange={(e) => handleStatusChange(murid, e.target.value)}
                          className={`w-full max-w-[160px] text-xs sm:text-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm ${inputFocusColor} bg-white cursor-pointer`}>
                          {statusOptions.map((option) => (<option key={option} value={option}>{option}</option>))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <style jsx>{`
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; opacity: 0; }
        `}</style>
      </main>
    </MainLayout>
  );
}

export default GuruPantauAbsenPage;