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
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { PlusCircle, X, FileText, Video, Trash2, Edit, CalendarDays } from 'lucide-react';

const db = getFirestore(app);
const storage = getStorage(app);

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
  const [coverImage, setCoverImage] = useState(null); // BARU
  const addCoverImageInputRef = useRef(null); // BARU

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTugas, setEditingTugas] = useState(null);
  const [editedCoverImage, setEditedCoverImage] = useState(null); // BARU
  const editCoverImageInputRef = useRef(null); // BARU

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
    setCoverImage(null); // BARU
    if(addCoverImageInputRef.current) addCoverImageInputRef.current.value = ""; // BARU
  };

  // --- BARU: Fungsi helper untuk upload file ---
  const uploadFile = async (file, path) => {
    if (!file) return null;
    const filePath = `${path}/${Date.now()}_${file.name}`;
    const fileRef = ref(storage, filePath);
    await uploadBytesResumable(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    return { url: downloadURL, path: filePath };
  };

  const handleAddTugas = async (e) => {
    e.preventDefault();
    if (!tugasName.trim() || !fileTugasUrl.trim() || !deadline) {
      showCustomAlert('Nama Tugas, URL File, dan Batas Akhir wajib diisi!', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const coverImageUpload = await uploadFile(coverImage, `tugas/${activeClass.id}/covers`);

      await addDoc(collection(db, 'tugas'), {
        kelas: activeClass.id,
        name: tugasName,
        deadline: new Date(deadline),
        fileTugasUrl: fileTugasUrl,
        fileVideoPenjelasanUrl: fileVideoPenjelasanUrl.trim() || null,
        coverImageUrl: coverImageUpload?.url || null, // BARU
        coverImagePath: coverImageUpload?.path || null, // BARU
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
    setEditedCoverImage(null); // BARU
    if (editCoverImageInputRef.current) editCoverImageInputRef.current.value = ""; // BARU
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
      dataToUpdate.deadline = new Date(editingTugas.deadline);
      dataToUpdate.updatedAt = serverTimestamp();

      // --- BARU: Logika update gambar ---
      if (editedCoverImage) {
        if (editingTugas.coverImagePath) {
            await deleteObject(ref(storage, editingTugas.coverImagePath)).catch(console.error);
        }
        const upload = await uploadFile(editedCoverImage, `tugas/${activeClass.id}/covers`);
        dataToUpdate.coverImageUrl = upload.url;
        dataToUpdate.coverImagePath = upload.path;
      }

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
      // --- BARU: Hapus gambar dari storage ---
      if (tugasToDelete.coverImagePath) {
        await deleteObject(ref(storage, tugasToDelete.coverImagePath)).catch(console.error);
      }
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
            // --- DIUBAH: Tampilan list menjadi kartu ---
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {tugasList.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`bg-white border border-gray-200 rounded-xl flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-300 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: hasMounted ? `${(index * 0.05) + 0.2}s` : '0s' }}
                >
                  <img 
                    src={item.coverImageUrl || `https://placehold.co/600x400/f97316/ffffff?text=Tugas`}
                    alt={`Sampul untuk ${item.name}`}
                    className="w-full h-32 object-cover rounded-t-xl"
                    onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/600x400/f97316/ffffff?text=Tugas`}}
                  />
                  <div className="p-4 flex flex-col flex-grow">
                    <p className="font-semibold text-lg text-gray-800 flex-grow" title={item.name}>{item.name}</p>
                    <div className="flex items-center text-xs text-red-600 mt-2">
                      <CalendarDays size={14} className="mr-1.5 text-red-400" />
                      <span>Batas Akhir: {formatDeadline(item.deadline)}</span>
                    </div>
                  </div>
                  <div className="p-2 border-t border-gray-100 grid grid-cols-2 gap-2">
                      <a href={item.fileTugasUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition duration-150">
                        <FileText size={16} className="mr-1.5" /> Tugas
                      </a>
                      {item.fileVideoPenjelasanUrl && (
                        <a href={item.fileVideoPenjelasanUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center text-sm font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-md transition duration-150">
                          <Video size={16} className="mr-1.5" /> Video
                        </a>
                      )}
                      <div className="col-span-2 flex justify-end">
                        <button onClick={() => handleOpenEditModal(item)} className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-100 transition-colors" aria-label={`Edit tugas ${item.name}`}>
                          <Edit size={18} />
                        </button>
                        <button onClick={() => confirmDeleteTugas(item)} className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-100 transition-colors" aria-label={`Hapus tugas ${item.name}`}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Tambah Tugas */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up my-8">
              <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-150"><X size={24} /></button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Tambah Tugas Baru</h2>
              <form onSubmit={handleAddTugas} className="space-y-4">
                <input type="text" value={tugasName} onChange={(e) => setTugasName(e.target.value)} placeholder="Nama Tugas" className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                <input type="url" value={fileTugasUrl} onChange={(e) => setFileTugasUrl(e.target.value)} placeholder="URL File Tugas (PDF/DOC)" className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                <input type="url" value={fileVideoPenjelasanUrl} onChange={(e) => setFileVideoPenjelasanUrl(e.target.value)} placeholder="URL Video Penjelasan (Opsional)" className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} />
                {/* --- BARU: Input gambar sampul --- */}
                <div>
                  <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-1">Gambar Sampul (Opsional)</label>
                  <input type="file" id="coverImage" ref={addCoverImageInputRef} onChange={(e) => setCoverImage(e.target.files[0])} className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 ${inputFocusColor} border border-gray-300 rounded-lg cursor-pointer`} accept="image/*" />
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
        
        {/* Modal Edit Tugas */}
        {showEditModal && editingTugas && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up my-8">
              <button onClick={handleCancelEdit} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><X size={24} /></button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Edit Tugas</h2>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <input type="text" value={editingTugas.name} onChange={(e) => setEditingTugas({...editingTugas, name: e.target.value})} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                <input type="date" value={editingTugas.deadline} onChange={(e) => setEditingTugas({...editingTugas, deadline: e.target.value})} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                <input type="url" value={editingTugas.fileTugasUrl} onChange={(e) => setEditingTugas({...editingTugas, fileTugasUrl: e.target.value})} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                <input type="url" value={editingTugas.fileVideoPenjelasanUrl || ''} onChange={(e) => setEditingTugas({...editingTugas, fileVideoPenjelasanUrl: e.target.value})} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} />
                {/* --- BARU: Input edit gambar sampul --- */}
                <div>
                  <label htmlFor="editedCoverImage" className="block text-sm font-medium text-gray-700 mb-1">Ganti Gambar Sampul (Opsional)</label>
                  <input type="file" id="editedCoverImage" ref={editCoverImageInputRef} onChange={(e) => setEditedCoverImage(e.target.files[0])} className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 ${inputFocusColor} border border-gray-300 rounded-lg cursor-pointer`} accept="image/*" />
                  {editingTugas.coverImageUrl && <p className="text-xs text-gray-500 mt-1">Kosongkan jika tidak ingin mengubah gambar.</p>}
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
        
        {/* Modal-modal lainnya */}
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