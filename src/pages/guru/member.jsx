import React, { useState, useEffect, useCallback } from 'react';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { app } from '../../api/firebaseConfig';
import MainLayout from './layouts/MainLayout';
import { PlusCircle, X, Trash2, Loader, AlertTriangle, CheckCircle, BookOpen } from 'lucide-react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const db = getFirestore(app);

// --- BAGIAN 1: KOMPONEN-KOMPONEN KECIL & HELPER ---

// -- BARU: Komponen Notifikasi standar --
const Notification = ({ notification, onClear }) => {
    if (!notification) return null;
    const isSuccess = notification.type === 'success';
    const bgColor = isSuccess ? 'bg-green-500' : 'bg-red-500';
    const Icon = isSuccess ? CheckCircle : AlertTriangle;

    return (
        <div className={`fixed bottom-5 right-5 z-[100] flex items-center gap-4 p-4 rounded-lg text-white shadow-lg animate-fade-in-up ${bgColor}`}>
            <Icon size={24} />
            <p className="flex-1">{notification.message}</p>
            <button onClick={onClear} className="p-1 rounded-full hover:bg-white/20"><X size={18} /></button>
        </div>
    );
};

// -- BARU: Komponen Modal Tambah Murid --
const AddMuridModal = ({ show, onClose, onSubmit, activeClassId }) => {
    const [emailToAdd, setEmailToAdd] = useState('');
    const [emailStatus, setEmailStatus] = useState({ valid: null, message: '', isChecking: false, uid: null });

    const checkEmailExists = async (email) => {
        if (!email.trim()) return;
        setEmailStatus({ valid: null, message: '', isChecking: true, uid: null });
        try {
            const usersQuery = query(collection(db, 'users'), where('email', '==', email));
            const userSnap = await getDocs(usersQuery);

            if (userSnap.empty) throw new Error('Email murid tidak ditemukan di database.');
            
            const userData = userSnap.docs[0].data();
            const foundUserUid = userSnap.docs[0].id;
            
            if (userData.role !== 'murid') throw new Error('Email ditemukan, namun bukan milik murid.');

            const enrollmentQuery = query(collection(db, 'enrollments'), where('kelasId', '==', activeClassId), where('muridId', '==', foundUserUid));
            const existingEnrollmentSnap = await getDocs(enrollmentQuery);
            
            if (!existingEnrollmentSnap.empty) throw new Error('Murid ini sudah terdaftar di kelas.');

            setEmailStatus({ valid: true, message: `Ditemukan: ${userData.namaLengkap}`, isChecking: false, uid: foundUserUid });
        } catch (err) {
            setEmailStatus({ valid: false, message: err.message, isChecking: false, uid: null });
        }
    };

    const handleInternalSubmit = (e) => {
        e.preventDefault();
        if (emailStatus.valid && emailStatus.uid) {
            onSubmit(emailToAdd, emailStatus.uid);
        }
    };
    
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 ${show ? 'visible' : 'invisible'}`}>
        <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><X size={24} /></button>
          <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Tambah Murid ke Kelas</h2>
          <form onSubmit={handleInternalSubmit} className="space-y-4">
            <div>
              <label htmlFor="addEmail" className="block text-sm font-medium text-gray-700 mb-1">Email Murid</label>
              <div className="relative">
                <input id="addEmail" type="email" value={emailToAdd}
                  onChange={(e) => { setEmailToAdd(e.target.value); setEmailStatus({ valid: null, message: '', isChecking: false, uid: null }); }}
                  onBlur={() => checkEmailExists(emailToAdd)}
                  required className={`w-full px-4 py-2.5 border rounded-lg transition duration-150 focus:ring-orange-500 focus:border-orange-500 ${emailStatus.valid === true ? 'border-green-500' : emailStatus.valid === false ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Ketik email murid lalu klik di luar..."/>
                {emailStatus.isChecking && <Loader className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>}
              </div>
              {emailStatus.message && (
                <p className={`text-sm mt-2 ${emailStatus.valid ? 'text-green-600' : 'text-red-600'}`}>{emailStatus.message}</p>
              )}
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
              <button type="submit" disabled={!emailStatus.valid || emailStatus.isChecking} className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-md transition disabled:opacity-50">Tambah Murid</button>
            </div>
          </form>
        </div>
      </div>
    );
};


// --- BAGIAN 2: KOMPONEN UTAMA HALAMAN ---

export default function MemberPage() {
  const [murids, setMurids] = useState([]);
  const [loadingMurids, setLoadingMurids] = useState(true);
  const [activeClass, setActiveClass] = useState({ id: null, name: null });
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [muridToDelete, setMuridToDelete] = useState(null);

  // -- BARU: State dan fungsi untuk notifikasi --
  const [notification, setNotification] = useState(null);
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  useEffect(() => {
    const classId = localStorage.getItem('idKelas');
    const className = localStorage.getItem('namaKelas');
    if (classId && className) {
      setActiveClass({ id: classId, name: className });
    } else {
      setLoadingMurids(false);
    }
  }, []);

  useEffect(() => {
    if (!activeClass.id) return;

    setLoadingMurids(true);
    const enrollmentsQuery = query(collection(db, 'enrollments'), where('kelasId', '==', activeClass.id));
    
    // onSnapshot akan memantau perubahan secara real-time
    const unsubscribe = onSnapshot(enrollmentsQuery, async (querySnapshot) => {
      const muridListPromises = querySnapshot.docs.map(async (enrollmentDoc) => {
        const enrollmentData = enrollmentDoc.data();
        const userRef = doc(db, 'users', enrollmentData.muridId);
        const userSnap = await getDoc(userRef);
        
        return {
          id: enrollmentDoc.id, // ID dari dokumen enrollment, untuk proses hapus
          namaLengkap: userSnap.exists() ? userSnap.data().namaLengkap : 'Nama tidak ditemukan',
          email: userSnap.exists() ? userSnap.data().email : 'Email tidak ditemukan',
        };
      });

      const muridList = await Promise.all(muridListPromises);
      setMurids(muridList);
      setLoadingMurids(false);
    }, (error) => {
      console.error("Gagal memuat data murid:", error);
      showNotification('Gagal memuat data murid.', 'error');
      setLoadingMurids(false);
    });

    return () => unsubscribe(); // Berhenti memantau saat komponen di-unmount
  }, [activeClass.id, showNotification]);

  const handleAddMuridToKelas = async (email, uid) => {
    try {
      await addDoc(collection(db, 'enrollments'), {
        kelasId: activeClass.id,
        muridId: uid,
        email: email, // Simpan email untuk fallback
        createdAt: serverTimestamp(),
      });
      showNotification('Murid berhasil ditambahkan!', 'success');
      setShowAddModal(false);
    } catch (err) {
      showNotification(`Gagal menambahkan murid: ${err.message}`, 'error');
      console.error(err);
    }
  };

  const handleDeleteMurid = async () => {
    if (!muridToDelete) return;
    try {
      await deleteDoc(doc(db, 'enrollments', muridToDelete.id));
      showNotification('Murid berhasil dihapus dari kelas!', 'success');
    } catch (err) {
      showNotification(`Gagal menghapus murid: ${err.message}`, 'error');
    } finally {
      setMuridToDelete(null);
      setShowDeleteConfirmModal(false);
    }
  };

  const renderContent = () => {
    if (loadingMurids) {
        return <div className="text-center py-20"><Loader className="animate-spin mx-auto text-orange-500" size={32} /></div>;
    }
    if (!activeClass.id) {
        return (
            <div className="text-center py-20 animate-fade-in-up">
                <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-700">Pilih Kelas Terlebih Dahulu</h2>
                <p className="text-gray-500 mt-2 mb-6">Anda harus memilih kelas dari halaman Manajemen Kelas untuk melihat daftar murid.</p>
                <Link href="/admin/manajemen-kelas">
                    <button className="bg-orange-500 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-orange-600 transition">Kembali ke Manajemen Kelas</button>
                </Link>
            </div>
        );
    }
    return (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full bg-white">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Nama Lengkap</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {murids.length === 0 ? (
                        <tr><td colSpan="3" className="text-center py-10 text-gray-500">Belum ada murid di kelas ini.</td></tr>
                    ) : (
                        murids.map((murid) => (
                            <tr key={murid.id} className="hover:bg-gray-50 transition-colors duration-200">
                                <td className="px-6 py-4 whitespace-nowrap text-gray-800">{murid.namaLengkap}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{murid.email}</td>
                                <td className="px-6 py-4 text-center">
                                    <button onClick={() => { setMuridToDelete(murid); setShowDeleteConfirmModal(true); }}
                                        className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-100/70 transition-colors"
                                        aria-label={`Hapus murid ${murid.namaLengkap}`}>
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
  }

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-white min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4 animate-fade-in-up">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manajemen Murid</h1>
              {activeClass.name && <p className="text-md text-orange-600 font-semibold mt-1">Kelas: {activeClass.name}</p>}
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={!activeClass.id}
              className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
              <PlusCircle size={20} />
              <span>Tambah Murid</span>
            </button>
          </div>
          
          {renderContent()}
        </div>

        {showAddModal && <AddMuridModal show={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleAddMuridToKelas} activeClassId={activeClass.id} />}

        {showDeleteConfirmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">Konfirmasi Hapus</h3>
                    <p className="text-gray-600 mb-6 text-sm">Anda yakin ingin menghapus murid <br/><strong className="text-gray-900">{muridToDelete?.namaLengkap}</strong> dari kelas ini?</p>
                    <div className="flex justify-center space-x-3">
                        <button type="button" className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" onClick={() => setShowDeleteConfirmModal(false)}>Batal</button>
                        <button type="button" className="px-5 py-2.5 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700" onClick={handleDeleteMurid}>Ya, Hapus</button>
                    </div>
                </div>
            </div>
        )}
        
        <Notification notification={notification} onClear={() => setNotification(null)} />
      </main>
      
      <style jsx>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; opacity: 0; }
      `}</style>
    </MainLayout>
  );
}