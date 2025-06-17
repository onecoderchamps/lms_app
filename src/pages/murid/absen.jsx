// app/kelas/absen/page.js
// Halaman untuk menampilkan riwayat absensi murid dari Firestore.

'use client';

import { useState, useEffect } from 'react';
import { CalendarDays, CheckCircle, XCircle, MinusCircle, AlertTriangle, Loader } from 'lucide-react';
import { db, auth } from "../../api/firebaseConfig"; // Mengikuti struktur yang diberikan user
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import MainLayout from './layouts/MainLayout';

export default function AbsensiPage() {
  const [absensiRecords, setAbsensiRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMuridId, setCurrentMuridId] = useState(null);
  const [currentKelasId, setCurrentKelasId] = useState(null);
  const [currentKelasName, setCurrentKelasName] = useState(''); // State baru untuk nama kelas
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Mengambil ID Murid dan ID Kelas dari sumber yang benar.
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentMuridId(user.uid);
      } else {
        setCurrentMuridId(null);
      }
      setIsAuthReady(true);
    });

    // Ambil ID dan NAMA kelas dari localStorage
    const kelasIdFromStorage = localStorage.getItem('idKelas');
    const kelasNameFromStorage = localStorage.getItem('namaKelas'); // Ambil nama kelas
    
    setCurrentKelasId(kelasIdFromStorage);
    setCurrentKelasName(kelasNameFromStorage); // Simpan nama kelas

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Fungsi bantu untuk mendapatkan ikon dan warna berdasarkan status
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'Hadir':
        return { icon: <CheckCircle size={22} strokeWidth={2} />, color: 'text-green-700', bgColor: 'bg-green-100', borderColor: 'border-green-300' };
      case 'Sakit':
        return { icon: <MinusCircle size={22} strokeWidth={2} />, color: 'text-yellow-700', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-300' };
      case 'Izin':
        return { icon: <AlertTriangle size={22} strokeWidth={2} />, color: 'text-blue-700', bgColor: 'bg-blue-100', borderColor: 'border-blue-300' };
      case 'Alpha':
        return { icon: <XCircle size={22} strokeWidth={2} />, color: 'text-red-700', bgColor: 'bg-red-100', borderColor: 'border-red-300' };
      case 'Belum Absen':
        return { icon: <MinusCircle size={22} strokeWidth={2} />, color: 'text-gray-700', bgColor: 'bg-gray-100', borderColor: 'border-gray-300' };
      default:
        return { icon: null, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
    }
  };

  // useEffect untuk memuat data absensi dari Firestore
  useEffect(() => {
    if (!isAuthReady || !currentMuridId || !currentKelasId) {
      setLoading(false);
      if (isAuthReady && (!currentMuridId || !currentKelasId)) {
          console.warn("Absensi Murid: Data tidak dapat dimuat. Pastikan user login dan telah memilih kelas.");
      }
      setAbsensiRecords([]);
      return;
    }

    setLoading(true);
    // Query ini memerlukan indeks: attendanceRecords(muridId ASC, kelasId ASC, date DESC)
    const q = query(
      collection(db, 'attendanceRecords'),
      where('muridId', '==', currentMuridId),
      where('kelasId', '==', currentKelasId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAbsensiRecords(records);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching absensi records:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthReady, currentMuridId, currentKelasId]);

  return (
    <MainLayout>
        <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Riwayat Absensi Saya</h1>
            
            {!currentMuridId || !currentKelasId ? (
                <p className="text-md text-red-500 font-semibold mt-1">Harap login dan pilih kelas terlebih dahulu untuk melihat riwayat absensi.</p>
            ) : (
                <p className="text-md text-orange-600 font-semibold mt-1">Kelas: {currentKelasName || 'Memuat...'}</p>
            )}
          </div>

          {loading ? (
              <div className="text-center py-16">
                  <p className="text-xl font-medium text-gray-500"><Loader className="animate-spin inline-block mr-2" /> Memuat riwayat absensi...</p>
              </div>
          ) : absensiRecords.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <p className="text-xl font-medium text-gray-500">Belum ada riwayat absensi yang tercatat untuk kelas ini.</p>
              <p className="text-sm text-gray-400 mt-2">Silakan hubungi guru atau admin jika ada pertanyaan.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {absensiRecords.map((record, index) => {
                const { icon, color, bgColor, borderColor } = getStatusDisplay(record.status);
                return (
                  <div
                    key={record.id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 rounded-lg shadow-md border ${borderColor} ${bgColor} transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in-up`}
                    style={{ animationDelay: `${(index * 0.05) + 0.2}s` }}
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-grow min-w-0">
                      <div className={`p-2.5 rounded-full ${bgColor} ${color}`}>
                        {icon}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-semibold text-md sm:text-lg text-gray-800 truncate" title={record.date}>
                          <span className="mr-2 text-gray-500">
                            <CalendarDays size={16} className="inline -mt-0.5 text-gray-400"/>
                          </span>
                          {/* Mengasumsikan record.date adalah string YYYY-MM-DD atau objek Timestamp */}
                          {new Date(record.date.includes('-') ? record.date.replace(/-/g, '/') : record.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p className={`text-sm font-medium ${color}`}>{record.status} {record.waktu ? `(${record.waktu})` : ''}</p>
                      </div>
                    </div>
                    {record.note && (
                      <p className="mt-2 sm:mt-0 text-sm text-gray-600 italic max-w-full sm:max-w-xs truncate text-left sm:text-right pl-0 sm:pl-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200 sm:border-transparent" title={record.note}>
                        <span className="font-medium not-italic text-gray-500">Catatan: </span>{record.note}
                      </p>
                    )}
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
        `}</style>
      </main>
    </MainLayout>
  );
}