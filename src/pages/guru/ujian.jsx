import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import MainLayout from "./layouts/MainLayout";
import { app } from "../../api/firebaseConfig";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { PlusCircle, X, CalendarDays, Clock, PlayCircle, CheckSquare, Hourglass, Edit, Trash2, FileText, Video, ArrowLeft } from 'lucide-react';

const db = getFirestore(app);

export default function UjianPage() {
  const router = useRouter();
  const [ujians, setUjians] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeClass, setActiveClass] = useState({ id: null, name: null });

  const [showAddModal, setShowAddModal] = useState(false);
  const [ujianName, setUjianName] = useState("");
  const [fileSoalUrl, setFileSoalUrl] = useState("");
  const [fileVideoUrl, setFileVideoUrl] = useState("");
  const [tanggalUjian, setTanggalUjian] = useState("");
  const [waktuUjian, setWaktuUjian] = useState("");
  const [durasiUjian, setDurasiUjian] = useState(90);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUjian, setEditingUjian] = useState(null);

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [ujianToDelete, setUjianToDelete] = useState(null);
  
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const classId = localStorage.getItem('idKelas');
    const className = localStorage.getItem('namaKelas');
    if (classId && className) {
      setActiveClass({ id: classId, name: className });
    }
    setHasMounted(true);
  }, []);
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!activeClass.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, "ujian"), 
      where("kelas", "==", activeClass.id),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUjians(data);
      setLoading(false);
    }, (error) => {
      console.error("Gagal mengambil data ujian:", error);
      showCustomAlert('Gagal memuat data ujian.', 'error');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [activeClass.id]);

  const getUjianStatusForGuruDisplay = (ujianDate, ujianTime, durationMinutes) => {
    const ujianStartDateTime = new Date(`<span class="math-inline">\{ujianDate\}T</span>{ujianTime}:00`);
    const ujianEndDateTime = new Date(ujianStartDateTime.getTime() + durationMinutes * 60000);
    const now = currentTime;

    if (now < ujianStartDateTime) {
      return { text: 'Akan Datang', colorClass: 'bg-indigo-100 text-indigo-700', icon: <Hourglass size={22} /> };
    } else if (now >= ujianStartDateTime && now < ujianEndDateTime) {
      return { text: 'Sedang Berlangsung', colorClass: 'bg-yellow-100 text-yellow-700 animate-pulse', icon: <PlayCircle size={22} /> };
    } else {
      return { text: 'Sudah Selesai', colorClass: 'bg-green-100 text-green-700', icon: <CheckSquare size={22} /> };
    }
  };

  const showCustomAlert = (message, type = "success") => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const resetAddForm = () => {
    setUjianName(''); setFileSoalUrl(''); setFileVideoUrl('');
    setTanggalUjian(''); setWaktuUjian(''); setDurasiUjian(90);
  };
  
  const handleAddUjian = async (e) => {
    e.preventDefault();
    if (!ujianName.trim() || !fileSoalUrl.trim() || !tanggalUjian || !waktuUjian || !durasiUjian) {
      showCustomAlert('Semua field (kecuali URL Video) wajib diisi!', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'ujian'), {
        kelas: activeClass.id,
        name: ujianName, 
        fileSoalUrl: fileSoalUrl,
        fileVideoUrl: fileVideoUrl.trim() || null,
        date: tanggalUjian, 
        time: waktuUjian,
        durationMinutes: parseInt(durasiUjian, 10),
        createdAt: serverTimestamp()
      });
      resetAddForm();
      setShowAddModal(false);
      showCustomAlert('Ujian berhasil ditambahkan!', 'success');
    } catch (error) {
      showCustomAlert('Gagal menambahkan ujian.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (ujian) => {
    setEditingUjian({ 
        ...ujian,
        durationMinutes: ujian.durationMinutes || 90
    });
    setShowEditModal(true);
  };

  const handleSaveEditUjian = async (e) => {
    e.preventDefault();
    if (!editingUjian || !editingUjian.name.trim() || !editingUjian.fileSoalUrl.trim() || !editingUjian.date || !editingUjian.time || !editingUjian.durationMinutes) {
      showCustomAlert('Semua field (kecuali URL Video) wajib diisi!', 'error');
      return;
    }
    const ujianDocRef = doc(db, "ujian", editingUjian.id);
    setIsSubmitting(true);
    try {
      const { id, createdAt, kelas, ...dataToUpdate } = editingUjian;
      dataToUpdate.updatedAt = serverTimestamp();
      await updateDoc(ujianDocRef, dataToUpdate);
      setShowEditModal(false);
      showCustomAlert('Data ujian berhasil diperbarui!', 'success');
    } catch (error) {
      showCustomAlert('Gagal memperbarui ujian.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancelEdit = () => setShowEditModal(false);

  const confirmDeleteUjian = (ujian) => {
    setUjianToDelete(ujian);
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteUjian = async () => {
    if (!ujianToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, "ujian", ujianToDelete.id));
      showCustomAlert('Ujian berhasil dihapus!', 'success');
      setUjianToDelete(null);
      setShowDeleteConfirmModal(false);
    } catch (error) {
      showCustomAlert('Gagal menghapus ujian.', 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  const primaryButtonColor = "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500";
  const primaryButtonTextColor = "text-white";
  const inputFocusColor = "focus:ring-orange-500 focus:border-orange-500";

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className={`flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manajemen Ujian</h1>
                <p className="text-md text-orange-600 font-semibold mt-1">Untuk Kelas: {activeClass.name}</p>
            </div>
            <button onClick={() => { resetAddForm(); setShowAddModal(true); }} className={`flex items-center space-x-2 ${primaryButtonColor} ${primaryButtonTextColor} px-5 py-2.5 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 text-sm font-medium`}>
              <PlusCircle size={20} />
              <span>Tambah Ujian Baru</span>
            </button>
          </div>

          {loading ? (
            <p className="text-center text-gray-500 py-16 animate-pulse">Memuat data ujian...</p>
          ) : ujians.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-xl font-medium text-gray-500">Belum ada ujian.</p>
              <p className="text-sm text-gray-400 mt-2">Klik "Tambah Ujian Baru" untuk menambahkan.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {ujians.map((ujian, index) => {
                const statusInfo = getUjianStatusForGuruDisplay(ujian.date, ujian.time, ujian.durationMinutes);
                return (
                  <li 
                    key={ujian.id} 
                    className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`}
                    style={{ animationDelay: hasMounted ? `${(index * 0.05) + 0.2}s` : '0s' }}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                      <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-0 flex-grow min-w-0">
                        <div className={`p-2.5 rounded-full`}>
                            {statusInfo.icon || <BookText size={22} />}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-x-2">
                            <p className="font-semibold text-md sm:text-lg text-gray-800 leading-tight truncate" title={ujian.name}>
                              {ujian.name}
                            </p>
                            <span className={`mt-1 sm:mt-0 px-2.5 py-0.5 inline-block text-xs leading-5 font-semibold rounded-full whitespace-nowrap ${statusInfo.colorClass}`}>
                                {statusInfo.text}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center text-gray-500 text-xs mt-1.5 gap-x-3 gap-y-0.5">
                            <div className="flex items-center">
                                <CalendarDays size={14} className="mr-1.5 text-gray-400" />
                                <span>{new Date(ujian.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center">
                                <Clock size={14} className="mr-1.5 text-gray-400" />
                                <span>{ujian.time} WIB ({ujian.durationMinutes} mnt)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0 w-full sm:w-auto justify-end mt-3 sm:mt-0">
                        <a href={ujian.fileSoalUrl} target="_blank" rel="noreferrer" className="flex items-center text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition duration-150">
                          <FileText size={14} className="mr-1" /> Lihat Soal
                        </a>
                        {ujian.fileVideoUrl && (
                          <a href={ujian.fileVideoUrl} target="_blank" rel="noreferrer" className="flex items-center text-xs font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-md transition duration-150">
                            <Video size={14} className="mr-1" /> Lihat Video
                          </a>
                        )}
                        <button onClick={() => handleOpenEditModal(ujian)} className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-100 transition-colors" aria-label={`Edit ujian ${ujian.name}`}>
                          <Edit size={16} />
                        </button>
                        <button onClick={() => confirmDeleteUjian(ujian)} className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-100 transition-colors" aria-label={`Hapus ujian ${ujian.name}`}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {showAddModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto ">
             <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up my-8">
               <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-150"><X size={24}/></button>
               <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Upload Ujian Baru</h2>
               <form onSubmit={handleAddUjian} className="space-y-4">
                 <div>
                   <label htmlFor="ujianName" className="block text-sm font-medium text-gray-700 mb-1">Nama Ujian</label>
                   <input type="text" id="ujianName" value={ujianName} onChange={(e) => setUjianName(e.target.value)} placeholder="Contoh: Ujian Tengah Semester Matematika" className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                         <label htmlFor="tanggalUjian" className="block text-sm font-medium text-gray-700 mb-1">Tanggal Ujian</label>
                         <input type="date" id="tanggalUjian" value={tanggalUjian} onChange={(e) => setTanggalUjian(e.target.value)} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                     </div>
                     <div>
                         <label htmlFor="waktuUjian" className="block text-sm font-medium text-gray-700 mb-1">Waktu Mulai</label>
                         <input type="time" id="waktuUjian" value={waktuUjian} onChange={(e) => setWaktuUjian(e.target.value)} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                     </div>
                 </div>
                 <div>
                     <label htmlFor="durasiUjian" className="block text-sm font-medium text-gray-700 mb-1">Durasi Ujian (menit)</label>
                     <input type="number" id="durasiUjian" value={durasiUjian} onChange={(e) => setDurasiUjian(parseInt(e.target.value, 10) || 0)} min="1" placeholder="Contoh: 90" className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                 </div>
                 <div>
                   <label htmlFor="fileSoalUrl" className="block text-sm font-medium text-gray-700 mb-1">URL File Soal Ujian (PDF/DOC)</label>
                   <input type="url" id="fileSoalUrl" value={fileSoalUrl} onChange={(e) => setFileSoalUrl(e.target.value)} placeholder="Contoh: https://example.com/soal-ujian.pdf" className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                   <p className="text-xs text-gray-500 mt-1">Masukkan URL publik ke file soal.</p>
                 </div>
                 <div>
                   <label htmlFor="fileVideoUrl" className="block text-sm font-medium text-gray-700 mb-1">URL Video Penjelasan (opsional)</label>
                   <input type="url" id="fileVideoUrl" value={fileVideoUrl} onChange={(e) => setFileVideoUrl(e.target.value)} placeholder="Contoh: https://youtube.com/embed/..." className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} />
                   <p className="text-xs text-gray-500 mt-1">Masukkan URL embed video jika ada.</p>
                 </div>
                 <div className="flex justify-end space-x-3 pt-2">
                   <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                   <button type="submit" disabled={isSubmitting} className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md disabled:opacity-50`}>
                     {isSubmitting ? 'Menyimpan...' : 'Upload Ujian'}
                   </button>
                 </div>
               </form>
             </div>
           </div>
        )}

        {showEditModal && editingUjian && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up my-8">
              <button onClick={handleCancelEdit} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><X size={24} /></button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Edit Ujian</h2>
              <form onSubmit={handleSaveEditUjian} className="space-y-4">
                <div>
                  <label htmlFor="editedUjianName" className="block text-sm font-medium text-gray-700 mb-1">Nama Ujian</label>
                  <input type="text" id="editedUjianName" value={editingUjian.name} onChange={(e) => setEditingUjian({...editingUjian, name: e.target.value})} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="editedTanggalUjian" className="block text-sm font-medium text-gray-700 mb-1">Tanggal Ujian</label>
                        <input type="date" id="editedTanggalUjian" value={editingUjian.date} onChange={(e) => setEditingUjian({...editingUjian, date: e.target.value})} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                    </div>
                    <div>
                        <label htmlFor="editedWaktuUjian" className="block text-sm font-medium text-gray-700 mb-1">Waktu Mulai</label>
                        <input type="time" id="editedWaktuUjian" value={editingUjian.time} onChange={(e) => setEditingUjian({...editingUjian, time: e.target.value})} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                    </div>
                </div>
                <div>
                    <label htmlFor="editedDurasiUjian" className="block text-sm font-medium text-gray-700 mb-1">Durasi Ujian (menit)</label>
                    <input type="number" id="editedDurasiUjian" value={editingUjian.durationMinutes} onChange={(e) => setEditingUjian({...editingUjian, durationMinutes: parseInt(e.target.value, 10) || 0})} min="1" className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                </div>
                <div>
                  <label htmlFor="editedFileSoalUrl" className="block text-sm font-medium text-gray-700 mb-1">URL File Soal Ujian</label>
                  <input type="url" id="editedFileSoalUrl" value={editingUjian.fileSoalUrl} onChange={(e) => setEditingUjian({...editingUjian, fileSoalUrl: e.target.value})} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                </div>
                <div>
                  <label htmlFor="editedFileVideoUrl" className="block text-sm font-medium text-gray-700 mb-1">URL Video Penjelasan (opsional)</label>
                  <input type="url" id="editedFileVideoUrl" value={editingUjian.fileVideoUrl || ''} onChange={(e) => setEditingUjian({...editingUjian, fileVideoUrl: e.target.value})} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={handleCancelEdit} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                  <button type="submit" disabled={isSubmitting} className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md disabled:opacity-50`}>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {showDeleteConfirmModal && ujianToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Konfirmasi Hapus</h3>
              <p className="text-gray-600 mb-6 text-sm">Apakah Anda yakin ingin menghapus ujian <br/><strong className="text-gray-900">{ujianToDelete.name}</strong>?</p>
              <div className="flex justify-center space-x-3">
                <button type="button" className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" onClick={() => setShowDeleteConfirmModal(false)}>Batal</button>
                <button type="button" disabled={isSubmitting} className="px-5 py-2.5 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 disabled:opacity-50 flex items-center" onClick={handleDeleteUjian}>
                    {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showAlertModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
             <div className={`bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up border-t-4 ${alertType === 'success' ? 'border-green-500' : 'border-red-500'}`}>
              <h3 className={`text-xl font-semibold mb-3 ${alertType === 'success' ? 'text-green-700' : 'text-red-700'}`}>{alertType === 'success' ? 'Berhasil!' : 'Terjadi Kesalahan!'}</h3>
              <p className="text-gray-600 mb-6 text-sm">{alertMessage}</p>
              <button type="button" className={`px-6 py-2.5 rounded-lg shadow-md ${alertType === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`} onClick={() => setShowAlertModal(false)}>Oke</button>
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