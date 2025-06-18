import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import MainLayout from './layouts/MainLayout'; // Path ini dipertahankan sesuai permintaan
import { PlusCircle, X, CalendarDays, Clock, Link as LinkIcon, Trash2, Video, Edit } from 'lucide-react';
import { app } from "../../api/firebaseConfig"; // Path ini dipertahankan sesuai permintaan
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
} from 'firebase/firestore';
// --- BARU: Menambahkan impor untuk Firebase Storage ---
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

const db = getFirestore(app);
// --- BARU: Inisialisasi Firebase Storage ---
const storage = getStorage(app);

export default function SesiLivePage() {
  const router = useRouter();
  const [liveSessions, setLiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeClass, setActiveClass] = useState({ id: null, name: null });

  // State untuk modal tambah
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [sessionLink, setSessionLink] = useState('');
  // --- BARU: State untuk gambar di form tambah ---
  const [sessionImage, setSessionImage] = useState(null);
  const addImageInputRef = useRef(null);
  
  // State untuk modal edit
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  // --- BARU: State untuk gambar di form edit ---
  const [editedSessionImage, setEditedSessionImage] = useState(null);
  const editImageInputRef = useRef(null);

  // State umum untuk proses submit
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk modal hapus dan alert
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const classId = localStorage.getItem('idKelas');
    const className = localStorage.getItem('namaKelas');
    if (classId && className) {
      setActiveClass({ id: classId, name: className });
    } else {
      setLoading(false);
    }
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!activeClass.id) {
      setLiveSessions([]);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, "sesiLive"),
      where("kelas", "==", activeClass.id),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLiveSessions(data);
      setLoading(false);
    }, (error) => {
      console.error("Gagal mengambil data sesi live:", error);
      showCustomAlert('Gagal memuat data sesi live.', 'error');
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
    setSessionName(''); setSessionDate(''); setSessionTime(''); setSessionLink('');
    // --- BARU: Reset state gambar ---
    setSessionImage(null);
    if(addImageInputRef.current) addImageInputRef.current.value = "";
  };
  
  // --- DIUBAH: Logika handleAddSession diperbarui untuk mengunggah gambar ---
  const handleAddSession = async (e) => {
    e.preventDefault();
    if (!sessionName.trim() || !sessionDate || !sessionTime || !sessionLink.trim()) {
      return showCustomAlert('Semua field wajib diisi!', 'error');
    }
    setIsSubmitting(true);
    try {
      let imageUrl = null;
      let imagePath = null;
      if (sessionImage) {
        const filePath = `sesiLiveBanners/${activeClass.id}/${Date.now()}_${sessionImage.name}`;
        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, sessionImage);
        await uploadTask;
        imageUrl = await getDownloadURL(storageRef);
        imagePath = filePath;
      }

      await addDoc(collection(db, "sesiLive"), {
        name: sessionName,
        date: sessionDate,
        time: sessionTime,
        link: sessionLink,
        kelas: activeClass.id,
        createdAt: serverTimestamp(),
        // --- BARU: Menambahkan field gambar ke Firestore ---
        imageUrl: imageUrl, 
        imagePath: imagePath,
      });
      resetAddForm();
      setShowAddSessionModal(false);
      showCustomAlert('Sesi live berhasil dijadwalkan!', 'success');
    } catch (error) {
      showCustomAlert('Gagal menambahkan sesi: ' + error.message, 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (session) => {
    setEditingSession({ ...session });
    // --- BARU: Reset state gambar saat modal edit dibuka ---
    setEditedSessionImage(null);
    if(editImageInputRef.current) editImageInputRef.current.value = "";
    setShowEditSessionModal(true);
  };
  
  // --- DIUBAH: Logika handleSaveEdit diperbarui untuk mengunggah/mengubah gambar ---
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingSession || !editingSession.name.trim() || !editingSession.date || !editingSession.time || !editingSession.link.trim()) {
      return showCustomAlert('Semua field wajib diisi!', 'error');
    }
    setIsSubmitting(true);

    const sessionDocRef = doc(db, "sesiLive", editingSession.id);
    try {
        const dataToUpdate = {
            name: editingSession.name,
            date: editingSession.date,
            time: editingSession.time,
            link: editingSession.link,
            updatedAt: serverTimestamp(),
        };

        if (editedSessionImage) {
            // Hapus gambar lama jika ada
            if (editingSession.imagePath) {
                const oldImageRef = ref(storage, editingSession.imagePath);
                await deleteObject(oldImageRef).catch(err => console.error("Gagal hapus gambar lama:", err));
            }
            // Unggah gambar baru
            const newImagePath = `sesiLiveBanners/${activeClass.id}/${Date.now()}_${editedSessionImage.name}`;
            const newImageRef = ref(storage, newImagePath);
            await uploadBytesResumable(newImageRef, editedSessionImage);
            dataToUpdate.imageUrl = await getDownloadURL(newImageRef);
            dataToUpdate.imagePath = newImagePath;
        }

      await updateDoc(sessionDocRef, dataToUpdate);
      showCustomAlert('Sesi live berhasil diperbarui!', 'success');
      setShowEditSessionModal(false);
    } catch (error) {
      showCustomAlert("Gagal memperbarui sesi.", "error");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => setShowEditSessionModal(false);

  const confirmDeleteSession = (session) => {
    setSessionToDelete(session);
    setShowDeleteConfirmModal(true);
  };

  // --- DIUBAH: Logika handleDeleteSession diperbarui untuk menghapus gambar dari storage ---
  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsSubmitting(true);
    try {
      // Hapus gambar dari storage jika ada
      if (sessionToDelete.imagePath) {
        const imageRef = ref(storage, sessionToDelete.imagePath);
        await deleteObject(imageRef).catch(err => console.error("Gagal hapus gambar:", err));
      }
      // Hapus dokumen dari firestore
      await deleteDoc(doc(db, "sesiLive", sessionToDelete.id));
      showCustomAlert('Sesi live berhasil dihapus!', 'success');
      setSessionToDelete(null);
      setShowDeleteConfirmModal(false);
    } catch (error) {
      showCustomAlert("Gagal menghapus sesi.", "error");
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
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manajemen Sesi Live</h1>
                <p className="text-md text-orange-600 font-semibold mt-1">Untuk Kelas: {activeClass.name}</p>
            </div>
            <button
              onClick={() => { resetAddForm(); setShowAddSessionModal(true); }}
              className={`flex items-center space-x-2 ${primaryButtonColor} ${primaryButtonTextColor} px-5 py-2.5 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 text-sm font-medium`}
            >
              <PlusCircle size={20} />
              <span>Jadwalkan Sesi Baru</span>
            </button>
          </div>

          {loading ? (
             <p className="text-center text-gray-500 py-16 animate-pulse">Memuat data...</p>
          ) : liveSessions.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-xl font-medium text-gray-500">Belum ada sesi live untuk kelas ini.</p>
              <p className="text-sm text-gray-400 mt-2">Klik "Jadwalkan Sesi Baru" untuk menambahkan.</p>
            </div>
          ) : (
            // --- DIUBAH: Tampilan diubah menjadi format kartu (card) ---
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {liveSessions.map((session, index) => (
                <div 
                  key={session.id} 
                  className={`bg-white border border-gray-200 rounded-xl flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-300 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: hasMounted ? `${(index * 0.05) + 0.2}s` : '0s' }}
                >
                  <a href={session.link} target="_blank" rel="noopener noreferrer" className="cursor-pointer group">
                    <img 
                      src={session.imageUrl || `https://placehold.co/600x400/f97316/ffffff?text=Live`} 
                      alt={`Banner untuk ${session.name}`}
                      className="w-full h-40 object-cover rounded-t-xl"
                      onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/600x400/f97316/ffffff?text=Live`}}
                    />
                  </a>
                  <div className="p-4 flex flex-col flex-grow">
                     <h3 className="font-bold text-lg text-gray-800 flex-grow" title={session.name}>{session.name}</h3>
                     <div className="flex items-center text-gray-600 text-sm mt-2 flex-wrap gap-x-4 gap-y-1">
                        <div className="flex items-center">
                          <CalendarDays size={16} className="mr-1.5 text-gray-400" />
                          <span>{new Date(session.date).toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock size={16} className="mr-1.5 text-gray-400" />
                          <span>{session.time} WIB</span>
                        </div>
                      </div>
                  </div>
                   <div className="flex items-center justify-between p-4 border-t border-gray-100">
                     <a href={session.link} target="_blank" rel="noreferrer" className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-md transition duration-150">
                        <LinkIcon size={16} className="mr-1.5" /> Buka Link
                      </a>
                    <div className="flex items-center space-x-1">
                      <button onClick={() => handleOpenEditModal(session)} className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-100 transition-colors" aria-label="Edit Sesi">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => confirmDeleteSession(session)} className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-100 transition-colors" aria-label="Hapus Sesi">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Tambah Sesi */}
        {showAddSessionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up my-8">
              <button onClick={() => setShowAddSessionModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700" disabled={isSubmitting}><X size={24} /></button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Jadwalkan Sesi Live Baru</h2>
              <form onSubmit={handleAddSession} className="space-y-4">
                <input type="text" value={sessionName} onChange={(e) => setSessionName(e.target.value)} placeholder="Nama Sesi / Topik" className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                  <input type="time" value={sessionTime} onChange={(e) => setSessionTime(e.target.value)} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                </div>
                <input type="url" value={sessionLink} onChange={(e) => setSessionLink(e.target.value)} placeholder="Link Sesi Live (Zoom/Meet)" className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                {/* --- BARU: Input gambar di modal tambah --- */}
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Banner <span className="text-gray-400">(Opsional)</span></label>
                   <input type="file" ref={addImageInputRef} onChange={(e) => setSessionImage(e.target.files[0])} className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 ${inputFocusColor} border border-gray-300 rounded-lg cursor-pointer`} accept="image/*" />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setShowAddSessionModal(false)} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" disabled={isSubmitting}>Batal</button>
                  <button type="submit" className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md disabled:opacity-50`} disabled={isSubmitting}>
                    {isSubmitting ? 'Menyimpan...' : 'Jadwalkan Sesi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Edit Sesi */}
        {showEditSessionModal && editingSession && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up my-8">
              <button onClick={handleCancelEdit} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><X size={24} /></button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Edit Sesi Live</h2>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <input type="text" value={editingSession.name} onChange={(e) => setEditingSession({...editingSession, name: e.target.value})} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input type="date" value={editingSession.date} onChange={(e) => setEditingSession({...editingSession, date: e.target.value})} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                    <input type="time" value={editingSession.time} onChange={(e) => setEditingSession({...editingSession, time: e.target.value})} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                </div>
                <input type="url" value={editingSession.link} onChange={(e) => setEditingSession({...editingSession, link: e.target.value})} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                {/* --- BARU: Input gambar di modal edit --- */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ganti Gambar Banner <span className="text-gray-400">(Opsional)</span></label>
                    <input type="file" ref={editImageInputRef} onChange={(e) => setEditedSessionImage(e.target.files[0])} className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 ${inputFocusColor} border border-gray-300 rounded-lg cursor-pointer`} accept="image/*" />
                    {editingSession.imageUrl && <p className="text-xs mt-1">Kosongkan jika tidak ingin mengganti gambar.</p>}
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={handleCancelEdit} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                  <button type="submit" className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md disabled:opacity-50`} disabled={isSubmitting}>
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {showDeleteConfirmModal && sessionToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Konfirmasi Hapus</h3>
              <p className="text-gray-600 mb-6 text-sm">Yakin hapus sesi <strong className="text-gray-900">{sessionToDelete.name}</strong>? Tindakan ini tidak dapat diurungkan.</p>
              <div className="flex justify-center space-x-3">
                <button type="button" className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" onClick={() => setShowDeleteConfirmModal(false)}>Batal</button>
                <button type="button" disabled={isSubmitting} className="px-5 py-2.5 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 disabled:opacity-50" onClick={handleDeleteSession}>
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