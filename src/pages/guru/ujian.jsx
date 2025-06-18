import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { app } from "../../api/firebaseConfig"; // Sesuaikan path jika perlu
import MainLayout from "./layouts/MainLayout"; // Sesuaikan path jika perlu
import { PlusCircle, X, CalendarDays, Clock, PlayCircle, CheckSquare, Hourglass, Edit, Trash2, FileText } from 'lucide-react';

const db = getFirestore(app);
const storage = getStorage(app);

export default function UjianPage() {
  const router = useRouter();
  const [ujians, setUjians] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeClass, setActiveClass] = useState({ id: null, name: null });

  const [showAddModal, setShowAddModal] = useState(false);
  const [ujianName, setUjianName] = useState("");
  const [tanggalUjian, setTanggalUjian] = useState("");
  const [waktuUjian, setWaktuUjian] = useState("");
  const [durasiUjian, setDurasiUjian] = useState(90);
  const [coverImage, setCoverImage] = useState(null);
  const addCoverImageInputRef = useRef(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUjian, setEditingUjian] = useState(null);
  const [editedCoverImage, setEditedCoverImage] = useState(null);
  const editCoverImageInputRef = useRef(null);

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
    const ujianStartDateTime = new Date(`${ujianDate}T${ujianTime}:00`);
    const ujianEndDateTime = new Date(ujianStartDateTime.getTime() + durationMinutes * 60000);
    const now = currentTime;

    if (now < ujianStartDateTime) {
      return { text: 'Akan Datang', colorClass: 'bg-indigo-100 text-indigo-700' };
    } else if (now >= ujianStartDateTime && now < ujianEndDateTime) {
      return { text: 'Berlangsung', colorClass: 'bg-yellow-100 text-yellow-700 animate-pulse' };
    } else {
      return { text: 'Selesai', colorClass: 'bg-green-100 text-green-700' };
    }
  };

  const showCustomAlert = (message, type = "success") => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const resetAddForm = () => {
    setUjianName('');
    setTanggalUjian(''); setWaktuUjian(''); setDurasiUjian(90);
    setCoverImage(null);
    if (addCoverImageInputRef.current) addCoverImageInputRef.current.value = "";
  };
  
  const uploadFile = async (file, path) => {
    if (!file) return null;
    const filePath = `${path}/${Date.now()}_${file.name}`;
    const fileRef = ref(storage, filePath);
    await uploadBytesResumable(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    return { url: downloadURL, path: filePath };
  };

  const handleAddUjian = async (e) => {
    e.preventDefault();
    if (!ujianName.trim() || !tanggalUjian || !waktuUjian || !durasiUjian) {
      showCustomAlert('Nama, Tanggal, Waktu, dan Durasi Ujian wajib diisi!', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const coverImageUpload = await uploadFile(coverImage, `ujian/${activeClass.id}/covers`);
      
      await addDoc(collection(db, 'ujian'), {
        kelas: activeClass.id,
        name: ujianName, 
        date: tanggalUjian, 
        time: waktuUjian,
        durationMinutes: parseInt(durasiUjian, 10),
        coverImageUrl: coverImageUpload?.url || null,
        coverImagePath: coverImageUpload?.path || null,
        createdAt: serverTimestamp()
      });
      
      resetAddForm();
      setShowAddModal(false);
      // --- DIUBAH: Pesan notifikasi disesuaikan ---
      showCustomAlert('Jadwal ujian berhasil disimpan!', 'success');

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
    setEditedCoverImage(null);
    if (editCoverImageInputRef.current) editCoverImageInputRef.current.value = "";
    setShowEditModal(true);
  };

  const handleSaveEditUjian = async (e) => {
    e.preventDefault();
    if (!editingUjian || !editingUjian.name.trim() || !editingUjian.date || !editingUjian.time || !editingUjian.durationMinutes) {
      showCustomAlert('Semua field wajib diisi!', 'error');
      return;
    }
    const ujianDocRef = doc(db, "ujian", editingUjian.id);
    setIsSubmitting(true);
    try {
      const { id, createdAt, kelas, fileSoalUrl, fileVideoUrl, ...dataToUpdate } = editingUjian;
      dataToUpdate.updatedAt = serverTimestamp();

      if (editedCoverImage) {
        if (editingUjian.coverImagePath) {
            await deleteObject(ref(storage, editingUjian.coverImagePath)).catch(console.error);
        }
        const upload = await uploadFile(editedCoverImage, `ujian/${activeClass.id}/covers`);
        dataToUpdate.coverImageUrl = upload.url;
        dataToUpdate.coverImagePath = upload.path;
      }

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
      if (ujianToDelete.coverImagePath) {
        await deleteObject(ref(storage, ujianToDelete.coverImagePath)).catch(console.error);
      }
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {ujians.map((ujian, index) => {
                const statusInfo = getUjianStatusForGuruDisplay(ujian.date, ujian.time, ujian.durationMinutes);
                return (
                  <div 
                    key={ujian.id} 
                    className={`bg-white border border-gray-200 rounded-xl flex flex-col shadow-sm hover:shadow-lg transition-all duration-300 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`}
                    style={{ animationDelay: hasMounted ? `${(index * 0.05) + 0.2}s` : '0s' }}
                  >
                    <div className="relative">
                       <img 
                        src={ujian.coverImageUrl || `https://placehold.co/600x400/f97316/ffffff?text=Ujian`} 
                        alt={`Sampul untuk ${ujian.name}`}
                        className="w-full h-32 object-cover rounded-t-xl"
                        onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/600x400/f97316/ffffff?text=Ujian`}}
                      />
                       <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.colorClass}`}>
                          {statusInfo.text}
                       </span>
                    </div>

                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="font-semibold text-gray-800 flex-grow leading-tight" title={ujian.name}>{ujian.name}</h3>
                      <div className="text-gray-500 text-xs mt-2 space-y-1">
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

                    <div className="flex items-center justify-between space-x-1 p-2 border-t border-gray-100">
                        <button onClick={() => {
                          router.push(`/guru/soal?ujianId=` + ujian.id)
                          localStorage.setItem('idUjian',ujian.id)
                          }} className="flex-1 text-center text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1.5 rounded-md transition duration-150">
                           Input Soal
                        </button>
                        <div className='flex'>
                            <button onClick={() => handleOpenEditModal(ujian)} className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-100 transition-colors" aria-label={`Edit ujian ${ujian.name}`}>
                            <Edit size={16} />
                            </button>
                            <button onClick={() => confirmDeleteUjian(ujian)} className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-100 transition-colors" aria-label={`Hapus ujian ${ujian.name}`}>
                            <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Tambah Ujian */}
        {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto ">
              <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up my-8">
                <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-150"><X size={24}/></button>
                <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Buat Jadwal Ujian</h2>
                <form onSubmit={handleAddUjian} className="space-y-4">
                  <input type="text" value={ujianName} onChange={(e) => setUjianName(e.target.value)} placeholder="Nama Ujian" className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input type="date" value={tanggalUjian} onChange={(e) => setTanggalUjian(e.target.value)} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                      <input type="time" value={waktuUjian} onChange={(e) => setWaktuUjian(e.target.value)} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                  </div>
                  <input type="number" value={durasiUjian} onChange={(e) => setDurasiUjian(parseInt(e.target.value, 10) || 0)} min="1" placeholder="Durasi (menit)" className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Sampul (Opsional)</label>
                    <input type="file" ref={addCoverImageInputRef} onChange={(e) => setCoverImage(e.target.files[0])} className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 ${inputFocusColor} border border-gray-300 rounded-lg cursor-pointer`} accept="image/*" />
                  </div>
                  <div className="flex justify-end space-x-3 pt-2">
                    <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                    {/* --- DIUBAH: Teks tombol disesuaikan --- */}
                    <button type="submit" disabled={isSubmitting} className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md disabled:opacity-50`}>
                      {isSubmitting ? 'Menyimpan...' : 'Simpan Jadwal'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        {/* Modal Edit Ujian */}
        {showEditModal && editingUjian && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up my-8">
              <button onClick={handleCancelEdit} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><X size={24} /></button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Edit Ujian</h2>
              <form onSubmit={handleSaveEditUjian} className="space-y-4">
                <input type="text" value={editingUjian.name} onChange={(e) => setEditingUjian({...editingUjian, name: e.target.value})} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input type="date" value={editingUjian.date} onChange={(e) => setEditingUjian({...editingUjian, date: e.target.value})} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                    <input type="time" value={editingUjian.time} onChange={(e) => setEditingUjian({...editingUjian, time: e.target.value})} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                </div>
                <input type="number" value={editingUjian.durationMinutes} onChange={(e) => setEditingUjian({...editingUjian, durationMinutes: parseInt(e.target.value, 10) || 0})} min="1" className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ganti Gambar Sampul (Opsional)</label>
                  <input type="file" ref={editCoverImageInputRef} onChange={(e) => setEditedCoverImage(e.target.files[0])} className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 ${inputFocusColor} border border-gray-300 rounded-lg cursor-pointer`} accept="image/*" />
                  {editingUjian.coverImageUrl && <p className="text-xs text-gray-500 mt-1">Kosongkan jika tidak ingin mengubah gambar.</p>}
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={handleCancelEdit} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                  <button type="submit" disabled={isSubmitting} className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md disabled:opacity-50`}>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Modal Hapus & Alert */}
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