import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MainLayout from './layouts/MainLayout'; // Pastikan path ini benar
import { PlusCircle, X, CalendarDays, Clock, Link as LinkIcon, Trash2, Video, Edit, ArrowLeft } from 'lucide-react';
import { app } from "../../api/firebaseConfig"; // Pastikan path ini benar
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

const db = getFirestore(app);

export default function SesiLivePage() {
  const router = useRouter();
  const [liveSessions, setLiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // State untuk menyimpan kelas yang aktif dari localStorage
  const [activeClass, setActiveClass] = useState({ id: null, name: null });

  // State untuk modal tambah
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [sessionLink, setSessionLink] = useState('');

  // State untuk modal edit
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  // State untuk modal hapus dan alert
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [hasMounted, setHasMounted] = useState(false);

  // useEffect untuk mengambil ID kelas dari localStorage saat komponen mount
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

  // useEffect untuk mengambil data sesi live berdasarkan kelas yang aktif
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
  };

  const handleAddSession = async (e) => {
    e.preventDefault();
    if (!sessionName.trim() || !sessionDate || !sessionTime || !sessionLink.trim()) {
      showCustomAlert('Semua field wajib diisi!', 'error');
      return;
    }
    try {
      await addDoc(collection(db, "sesiLive"), {
        name: sessionName,
        date: sessionDate,
        time: sessionTime,
        link: sessionLink,
        kelas: activeClass.id,
        createdAt: serverTimestamp(),
      });
      resetAddForm();
      setShowAddSessionModal(false);
      showCustomAlert('Sesi live berhasil dijadwalkan!', 'success');
    } catch (error) {
      showCustomAlert('Gagal menambahkan sesi: ' + error.message, 'error');
    }
  };

  const handleOpenEditModal = (session) => {
    setEditingSession({ ...session });
    setShowEditSessionModal(true);
  };
  
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingSession || !editingSession.name.trim() || !editingSession.date || !editingSession.time || !editingSession.link.trim()) {
      showCustomAlert('Semua field wajib diisi!', 'error');
      return;
    }
    const sessionDocRef = doc(db, "sesiLive", editingSession.id);
    try {
      const { id, createdAt, kelas, ...dataToUpdate } = editingSession;
      await updateDoc(sessionDocRef, dataToUpdate);
      showCustomAlert('Sesi live berhasil diperbarui!', 'success');
      setShowEditSessionModal(false);
    } catch (error) {
      showCustomAlert("Gagal memperbarui sesi.", "error");
    }
  };

  const handleCancelEdit = () => setShowEditSessionModal(false);

  const confirmDeleteSession = (session) => {
    setSessionToDelete(session);
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      await deleteDoc(doc(db, "sesiLive", sessionToDelete.id));
      showCustomAlert('Sesi live berhasil dihapus!', 'success');
      setSessionToDelete(null);
      setShowDeleteConfirmModal(false);
    } catch (error) {
      showCustomAlert("Gagal menghapus sesi.", "error");
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
            <ul className="space-y-5">
              {liveSessions.map((session, index) => (
                <li 
                  key={session.id} 
                  className={`bg-white border border-gray-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between shadow-sm hover:shadow-lg transition-shadow duration-200 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: hasMounted ? `${(index * 0.05) + 0.2}s` : '0s' }}
                >
                  <div className="flex items-start space-x-4 mb-4 sm:mb-0 flex-grow min-w-0">
                    <div className="text-purple-600 pt-1 bg-purple-50 p-2.5 rounded-full">
                      <Video size={24} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-semibold text-lg text-gray-800 truncate" title={session.name}>{session.name}</p>
                      <div className="flex items-center text-gray-600 text-sm mt-2 flex-wrap gap-x-4 gap-y-1">
                        <div className="flex items-center">
                          <CalendarDays size={16} className="mr-1.5 text-gray-400" />
                          <span>{new Date(session.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock size={16} className="mr-1.5 text-gray-400" />
                          <span>{session.time} WIB</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3 justify-start sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 sm:border-transparent flex-shrink-0">
                    <a href={session.link} target="_blank" rel="noreferrer" className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-md transition duration-150">
                      <LinkIcon size={16} className="mr-1.5" /> Buka Link
                    </a>
                    <button onClick={() => handleOpenEditModal(session)} className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-100 transition-colors" aria-label={`Edit sesi ${session.name}`}>
                      <Edit size={18} />
                    </button>
                    <button onClick={() => confirmDeleteSession(session)} className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-100 transition-colors" aria-label={`Hapus sesi ${session.name}`}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {showAddSessionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up my-8">
              <button onClick={() => setShowAddSessionModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-150" aria-label="Tutup modal">
                <X size={24} />
              </button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Jadwalkan Sesi Live Baru</h2>
              <form onSubmit={handleAddSession} className="space-y-4">
                <div>
                  <label htmlFor="sessionName" className="block text-sm font-medium text-gray-700 mb-1">Nama Sesi / Topik</label>
                  <input type="text" id="sessionName" value={sessionName} onChange={(e) => setSessionName(e.target.value)} placeholder="Contoh: Diskusi Aljabar Bab 3" className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="sessionDate" className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                    <input type="date" id="sessionDate" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`} required />
                  </div>
                  <div>
                    <label htmlFor="sessionTime" className="block text-sm font-medium text-gray-700 mb-1">Waktu</label>
                    <input type="time" id="sessionTime" value={sessionTime} onChange={(e) => setSessionTime(e.target.value)} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`} required />
                  </div>
                </div>
                <div>
                  <label htmlFor="sessionLink" className="block text-sm font-medium text-gray-700 mb-1">Link Sesi Live (Zoom/Meet)</label>
                  <input type="url" id="sessionLink" value={sessionLink} onChange={(e) => setSessionLink(e.target.value)} placeholder="Contoh: https://zoom.us/j/..." className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`} required />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setShowAddSessionModal(false)} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                  <button type="submit" className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md`}>Jadwalkan Sesi</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditSessionModal && editingSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up my-8">
              <button onClick={handleCancelEdit} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><X size={24} /></button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Edit Sesi Live</h2>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label htmlFor="editedSessionName" className="block text-sm font-medium text-gray-700 mb-1">Nama Sesi / Topik</label>
                  <input type="text" id="editedSessionName" value={editingSession.name} onChange={(e) => setEditingSession({...editingSession, name: e.target.value})} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="editedSessionDate" className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                    <input type="date" id="editedSessionDate" value={editingSession.date} onChange={(e) => setEditingSession({...editingSession, date: e.target.value})} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                  </div>
                  <div>
                    <label htmlFor="editedSessionTime" className="block text-sm font-medium text-gray-700 mb-1">Waktu</label>
                    <input type="time" id="editedSessionTime" value={editingSession.time} onChange={(e) => setEditingSession({...editingSession, time: e.target.value})} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                  </div>
                </div>
                <div>
                  <label htmlFor="editedSessionLink" className="block text-sm font-medium text-gray-700 mb-1">Link Sesi Live</label>
                  <input type="url" id="editedSessionLink" value={editingSession.link} onChange={(e) => setEditingSession({...editingSession, link: e.target.value})} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={handleCancelEdit} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                  <button type="submit" className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md`}>Simpan Perubahan</button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {showDeleteConfirmModal && sessionToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Konfirmasi Hapus</h3>
              <p className="text-gray-600 mb-6 text-sm">Apakah Anda yakin ingin menghapus sesi <br/><strong className="text-gray-900">{sessionToDelete.name}</strong>?</p>
              <div className="flex justify-center space-x-3">
                <button type="button" className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" onClick={() => setShowDeleteConfirmModal(false)}>Batal</button>
                <button type="button" className="px-5 py-2.5 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700" onClick={handleDeleteSession}>Ya, Hapus</button>
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