import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MainLayout from './layouts/MainLayout';
import { app } from '../../api/firebaseConfig';
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { FileText, Download, X as CloseIcon, Loader, ArrowLeft } from 'lucide-react';

const db = getFirestore(app);

export default function BeriNilaiPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeClass, setActiveClass] = useState({ id: null, name: null });

  const [filterStatusNilai, setFilterStatusNilai] = useState('Semua Status');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [hasMounted, setHasMounted] = useState(false);
  
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

  useEffect(() => {
    if (!activeClass.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    
    const q = query(
      collection(db, "assignmentSubmissions"),
      where("kelasId", "==", activeClass.id),
      orderBy("submittedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const submissionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSubmissions(submissionsData);
      setLoading(false);
    }, (error) => {
      console.error("Gagal mengambil data pengumpulan tugas: ", error);
      showCustomAlert("Gagal memuat data dari database.", "error");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeClass.id]);
  
  const showCustomAlert = (message, type = "success") => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const handleNilaiChange = (id, newNilai) => {
    setSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === id ? { ...sub, nilai: newNilai === '' ? null : Number(newNilai) } : sub
      )
    );
  };

  const handleKomentarChange = (id, newKomentar) => {
    setSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === id ? { ...sub, komentarGuru: newKomentar } : sub
      )
    );
  };

  const handleSimpanNilai = async (id) => {
    const submissionToGrade = submissions.find(t => t.id === id);
    if (!submissionToGrade) return;

    if (submissionToGrade.nilai === null || submissionToGrade.nilai === undefined || submissionToGrade.nilai < 0 || submissionToGrade.nilai > 100) {
      showCustomAlert('Nilai harus diisi dengan angka antara 0 dan 100!', 'error');
      return;
    }
    
    const submissionDocRef = doc(db, "assignmentSubmissions", id);
    try {
      await updateDoc(submissionDocRef, {
        nilai: submissionToGrade.nilai,
        komentarGuru: submissionToGrade.komentarGuru || "",
        status: 'Sudah Dinilai'
      });
      showCustomAlert(`Nilai untuk ${submissionToGrade.namaSiswa} berhasil disimpan!`, 'success');
    } catch (error) {
      console.error("Gagal menyimpan nilai: ", error);
      showCustomAlert('Gagal menyimpan nilai ke database.', 'error');
    }
  };

  const filteredTugasSiswa = submissions.filter((tugas) => {
    const matchesStatus = 
      filterStatusNilai === 'Semua Status' ||
      (filterStatusNilai === 'Belum Dinilai' && (tugas.nilai === null || tugas.nilai === undefined)) ||
      (filterStatusNilai === 'Sudah Dinilai' && (tugas.nilai !== null && tugas.nilai !== undefined));
    
    const matchesSearch = (tugas.namaSiswa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (tugas.namaTugas || '').toLowerCase().includes(searchTerm.toLowerCase());

    const deadlineDate = tugas.deadline?.toDate ? tugas.deadline.toDate() : (tugas.deadline ? new Date(tugas.deadline) : null);
    let matchesDate = true;

    if (filterDate) {
      if (!deadlineDate) {
        matchesDate = false;
      } else {
        const filterDateObj = new Date(filterDate);
        const localDeadlineDate = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());
        const localFilterDate = new Date(filterDateObj.getFullYear(), filterDateObj.getMonth(), filterDateObj.getDate());
        matchesDate = localDeadlineDate.getTime() === localFilterDate.getTime();
      }
    }

    return matchesStatus && matchesSearch && matchesDate;
  });

  const getStatusBadgeClass = (status, nilai) => {
    if (nilai !== null && nilai !== undefined) return 'bg-green-100 text-green-700';
    if (status === 'Sudah Dikumpulkan') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };
  
  const formatDeadline = (deadline) => {
    if (!deadline) return <span className="italic text-gray-400">-</span>;
    const dateObj = deadline.toDate ? deadline.toDate() : new Date(deadline);
    return dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (hasMounted && !activeClass.id) {
    return (
        <MainLayout>
            <main className="flex-1 md:ml-64 md:pt-16 p-4 flex items-center justify-center min-h-screen">
                <div className="text-center bg-white p-10 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-red-600">Akses Ditolak</h2>
                    <p className="text-gray-600 mt-2 mb-6">Anda harus memilih kelas terlebih dahulu untuk memberi nilai.</p>
                    <button onClick={() => router.push('/guru')} className="flex items-center justify-center mx-auto px-5 py-2.5 bg-orange-500 text-white rounded-lg shadow-md hover:bg-orange-600">
                        <ArrowLeft size={18} className="mr-2" />
                        Kembali ke Pemilihan Kelas
                    </button>
                </div>
            </main>
        </MainLayout>
    );
  }

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className={`mb-8 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Beri Nilai Tugas Siswa</h1>
            <p className="text-md text-orange-600 font-semibold mt-1">Untuk Kelas: {activeClass.name}</p>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8 p-5 bg-white rounded-lg shadow-sm border border-gray-200 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Cari Nama</label>
              <input type="text" id="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                placeholder="Nama siswa/tugas..." />
            </div>
             <div>
              <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700 mb-1">Filter Status</label>
              <select id="filterStatus" value={filterStatusNilai} onChange={(e) => setFilterStatusNilai(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 bg-white">
                <option>Semua Status</option>
                <option>Belum Dinilai</option>
                <option>Sudah Dinilai</option>
              </select>
            </div>
            <div>
              <label htmlFor="filterDate" className="block text-sm font-medium text-gray-700 mb-1">Filter Tanggal Deadline</label>
              <input type="date" id="filterDate" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"/>
            </div>
          </div>

          <div className={`overflow-x-auto rounded-lg shadow-md border border-gray-200 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Murid</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Tugas</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nilai (0-100)</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Komentar Guru</th>
                  <th className="px-5 py-3.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="8" className="text-center p-10 text-gray-500"><Loader className="animate-spin inline-block mr-2" /> Memuat data...</td></tr>
                ) : filteredTugasSiswa.length === 0 ? (
                  <tr><td colSpan="8" className="text-center p-10 text-gray-500">Tidak ada data pengumpulan tugas yang sesuai.</td></tr>
                ) : (
                  filteredTugasSiswa.map((tugas, index) => (
                    <tr key={tugas.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-800">{index + 1}.</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tugas.namaSiswa}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700 max-w-xs truncate" title={tugas.namaTugas}>{tugas.namaTugas}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDeadline(tugas.deadline)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(tugas.status, tugas.nilai)}`}>
                          {(tugas.nilai !== null && tugas.nilai !== undefined) ? 'Sudah Dinilai' : 'Belum Dinilai'}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm">
                        <input type="number" min="0" max="100" value={tugas.nilai ?? ''}
                          onChange={(e) => handleNilaiChange(tugas.id, e.target.value)}
                          className={`w-20 border border-gray-300 rounded-md px-2 py-1.5 text-center focus:ring-orange-500 focus:border-orange-500`} placeholder="-" />
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <textarea value={tugas.komentarGuru || ''}
                          onChange={(e) => handleKomentarChange(tugas.id, e.target.value)}
                          className={`w-full min-w-[200px] border border-gray-300 rounded-md px-2 py-1.5 focus:ring-orange-500 focus:border-orange-500`}
                          rows="1" placeholder="..."></textarea>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex items-center justify-center space-x-2">
                          {tugas.submissionUrl && (
                            <a href={tugas.submissionUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 p-1.5 rounded-md hover:bg-blue-100 transition-colors" title="Lihat File Tugas">
                              <FileText size={18} />
                            </a>
                          )}
                          <button onClick={() => handleSimpanNilai(tugas.id)}
                            className={`px-3.5 py-2 rounded-md text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors bg-orange-500 text-white hover:bg-orange-600`}
                            title="Simpan Nilai & Komentar">Simpan</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {showAlertModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className={`bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up border-t-4 ${alertType === 'success' ? 'border-green-500' : 'border-red-500'}`}>
              <h3 className={`text-xl font-semibold mb-3 ${alertType === 'success' ? 'text-green-700' : 'text-red-700'}`}>{alertType === 'success' ? 'Berhasil!' : 'Terjadi Kesalahan!'}</h3>
              <p className="text-gray-600 mb-6 text-sm">{alertMessage}</p>
              <button type="button" className={`px-6 py-2.5 rounded-lg shadow-md ${alertType === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                onClick={() => setShowAlertModal(false)}>Oke</button>
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
        `}</style>
      </main>
    </MainLayout>
  );
}