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
import { PlusCircle, X, FileText, Video, Trash2, Edit, CalendarDays, ArrowLeft } from 'lucide-react';

const db = getFirestore(app);

export default function TugasPage() {
  const router = useRouter();
  const [tugasList, setTugasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeClass, setActiveClass] = useState({ id: null, name: null });

  // State untuk modal & form
  const [showAddModal, setShowAddModal] = useState(false);
  const [tugasName, setTugasName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [fileTugasUrl, setFileTugasUrl] = useState('');
  const [fileVideoPenjelasanUrl, setFileVideoPenjelasanUrl] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTugas, setEditingTugas] = useState(null);

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [tugasToDelete, setTugasToDelete] = useState(null);

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    if (!activeClass.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, "tugas"),
      where("kelas", "==", activeClass.id),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTugasList(data);
      setLoading(false);
    }, (error) => {
      console.error("Gagal mengambil data tugas:", error);
      showCustomAlert('Gagal memuat data tugas.', 'error');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [activeClass.id]);

  const showCustomAlert = (message, type = "success") => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const resetAddForm = () => {
    setTugasName(''); setDeadline(''); setFileTugasUrl(''); setFileVideoPenjelasanUrl('');
  };

  const handleAddTugas = async (e) => {
    e.preventDefault();
    if (!tugasName.trim() || !fileTugasUrl.trim() || !deadline) {
      showCustomAlert('Nama Tugas, URL File, dan Batas Akhir wajib diisi!', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'tugas'), {
        kelas: activeClass.id,
        name: tugasName,
        deadline: new Date(deadline), // Simpan sebagai objek Date
        fileTugasUrl: fileTugasUrl,
        fileVideoPenjelasanUrl: fileVideoPenjelasanUrl.trim() || null,
        createdAt: serverTimestamp()
      });
      resetAddForm();
      setShowAddModal(false);
      showCustomAlert('Tugas berhasil ditambahkan!', 'success');
    } catch (error) {
      showCustomAlert('Gagal menambahkan tugas: ' + error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (tugasItem) => {
    const deadlineDate = tugasItem.deadline?.toDate ? tugasItem.deadline.toDate() : new Date(tugasItem.deadline);
    const formattedDeadline = deadlineDate.toISOString().split('T')[0];

    setEditingTugas({
      ...tugasItem,
      deadline: formattedDeadline,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingTugas || !editingTugas.name.trim() || !editingTugas.fileTugasUrl.trim() || !editingTugas.deadline) {
      showCustomAlert('Semua field wajib diisi untuk edit!', 'error');
      return;
    }
    const tugasDocRef = doc(db, "tugas", editingTugas.id);
    setIsSubmitting(true);
    try {
      const { id, kelas, createdAt, ...dataToUpdate } = editingTugas;
      dataToUpdate.deadline = new Date(editingTugas.deadline); // Simpan sebagai objek Date
      dataToUpdate.updatedAt = serverTimestamp();
      await updateDoc(tugasDocRef, dataToUpdate);
      setShowEditModal(false);
      showCustomAlert('Tugas berhasil diperbarui!', 'success');
    } catch (error) {
      showCustomAlert("Gagal memperbarui tugas: " + error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancelEdit = () => setShowEditModal(false);

  const confirmDeleteTugas = (tugasItem) => {
    setTugasToDelete(tugasItem);
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteTugas = async () => {
    if (!tugasToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, "tugas", tugasToDelete.id));
      showCustomAlert('Tugas berhasil dihapus!', 'success');
    } catch (error) {
      showCustomAlert('Gagal menghapus tugas: ' + error.message, 'error');
    } finally {
      setTugasToDelete(null);
      setShowDeleteConfirmModal(false);
      setIsSubmitting(false);
    }
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return "-";
    const dateObj = deadline.toDate ? deadline.toDate() : new Date(deadline);
    return dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
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
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manajemen Tugas</h1>
              <p className="text-md text-orange-600 font-semibold mt-1">Untuk Kelas: {activeClass.name}</p>
            </div>
            <button
              onClick={() => { resetAddForm(); setShowAddModal(true); }}
              className={`flex items-center space-x-2 ${primaryButtonColor} ${primaryButtonTextColor} px-5 py-2.5 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 text-sm font-medium`}
            >
              <PlusCircle size={20} />
              <span>Tambah Tugas Baru</span>
            </button>
          </div>

          {loading ? (
            <p className="text-center text-gray-500 py-16 animate-pulse">Memuat data tugas...</p>
          ) : tugasList.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-xl font-medium text-gray-500">Belum ada tugas untuk kelas ini.</p>
              <p className="text-sm text-gray-400 mt-2">Klik "Tambah Tugas Baru" untuk menambahkan.</p>
            </div>
          ) : (
            <ul className="space-y-5">
              {tugasList.map((item, index) => (
                <li 
                  key={item.id} 
                  className={`bg-white border border-gray-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between shadow-sm hover:shadow-lg transition-shadow duration-200 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: hasMounted ? `${(index * 0.05) + 0.2}s` : '0s' }}
                >
                  <div className="flex items-center space-x-4 mb-4 sm:mb-0 flex-grow min-w-0">
                    <div className="p-2.5 bg-green-50 text-green-600 rounded-full">
                      <Edit size={24} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-semibold text-lg text-gray-800 truncate" title={item.name}>{item.name}</p>
                      <div className="flex items-center text-xs text-red-600 mt-1.5">
                        <CalendarDays size={14} className="mr-1.5 text-red-400" />
                        <span>Batas Akhir: {formatDeadline(item.deadline)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3 justify-start sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 sm:border-transparent flex-shrink-0 flex-wrap gap-2">
                    <a href={item.fileTugasUrl} target="_blank" rel="noreferrer" className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-md transition duration-150">
                      <FileText size={16} className="mr-1.5" /> Lihat Tugas
                    </a>
                    {item.fileVideoPenjelasanUrl && (
                      <a href={item.fileVideoPenjelasanUrl} target="_blank" rel="noreferrer" className="flex items-center text-sm font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3.5 py-2 rounded-md transition duration-150">
                        <Video size={16} className="mr-1.5" /> Lihat Video
                      </a>
                    )}
                    <button onClick={() => handleOpenEditModal(item)} className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-100 transition-colors" aria-label={`Edit tugas ${item.name}`}>
                      <Edit size={18} />
                    </button>
                    <button onClick={() => confirmDeleteTugas(item)} className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-100 transition-colors" aria-label={`Hapus tugas ${item.name}`}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up my-8">
              <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-150" aria-label="Tutup modal">
                <X size={24} />
              </button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Tambah Tugas Baru</h2>
              <form onSubmit={handleAddTugas} className="space-y-4">
                <div>
                  <label htmlFor="tugasName" className="block text-sm font-medium text-gray-700 mb-1">Nama Tugas</label>
                  <input type="text" id="tugasName" value={tugasName} onChange={(e) => setTugasName(e.target.value)} placeholder="Contoh: Tugas Matematika Bab Persamaan Linear" className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                </div>
                <div>
                  <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">Batas Akhir</label>
                  <input type="date" id="deadline" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                </div>
                <div>
                  <label htmlFor="fileTugasUrl" className="block text-sm font-medium text-gray-700 mb-1">URL File Tugas (PDF/DOC)</label>
                  <input type="url" id="fileTugasUrl" value={fileTugasUrl} onChange={(e) => setFileTugasUrl(e.target.value)} placeholder="Contoh: https://example.com/tugas.pdf" className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                </div>
                <div>
                  <label htmlFor="fileVideoPenjelasanUrl" className="block text-sm font-medium text-gray-700 mb-1">URL Video Penjelasan (opsional)</label>
                  <input type="url" id="fileVideoPenjelasanUrl" value={fileVideoPenjelasanUrl} onChange={(e) => setFileVideoPenjelasanUrl(e.target.value)} placeholder="Contoh: https://www.youtube.com/embed/..." className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                  <button type="submit" disabled={isSubmitting} className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md disabled:opacity-50 flex items-center`}>
                    {isSubmitting ? 'Menyimpan...': 'Upload Tugas'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {showEditModal && editingTugas && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up my-8">
              <button onClick={handleCancelEdit} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><X size={24} /></button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Edit Tugas</h2>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label htmlFor="editedTugasName" className="block text-sm font-medium text-gray-700 mb-1">Nama Tugas</label>
                  <input type="text" id="editedTugasName" value={editingTugas.name} onChange={(e) => setEditingTugas({...editingTugas, name: e.target.value})} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                </div>
                <div>
                  <label htmlFor="editedDeadline" className="block text-sm font-medium text-gray-700 mb-1">Batas Akhir</label>
                  <input type="date" id="editedDeadline" value={editingTugas.deadline} onChange={(e) => setEditingTugas({...editingTugas, deadline: e.target.value})} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                </div>
                <div>
                  <label htmlFor="editedFileTugasUrl" className="block text-sm font-medium text-gray-700 mb-1">URL File Tugas</label>
                  <input type="url" id="editedFileTugasUrl" value={editingTugas.fileTugasUrl} onChange={(e) => setEditingTugas({...editingTugas, fileTugasUrl: e.target.value})} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                </div>
                <div>
                  <label htmlFor="editedFileVideoUrl" className="block text-sm font-medium text-gray-700 mb-1">URL Video Penjelasan (opsional)</label>
                  <input type="url" id="editedFileVideoUrl" value={editingTugas.fileVideoPenjelasanUrl || ''} onChange={(e) => setEditingTugas({...editingTugas, fileVideoPenjelasanUrl: e.target.value})} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={handleCancelEdit} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                  <button type="submit" disabled={isSubmitting} className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md disabled:opacity-50 flex items-center`}>
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {showDeleteConfirmModal && tugasToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Konfirmasi Hapus</h3>
              <p className="text-gray-600 mb-6 text-sm">Apakah Anda yakin ingin menghapus tugas <br/><strong className="text-gray-900">{tugasToDelete.name}</strong>?</p>
              <div className="flex justify-center space-x-3">
                <button type="button" className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" onClick={() => setShowDeleteConfirmModal(false)}>Batal</button>
                <button type="button" disabled={isSubmitting} className="px-5 py-2.5 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 disabled:opacity-50" onClick={handleDeleteTugas}>
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
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; opacity: 0; }
        `}</style>
      </main>
    </MainLayout>
  );
}