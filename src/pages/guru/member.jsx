import React, { useState, useEffect, useRef } from 'react';
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
import { PlusCircle, X, Trash2, Loader, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';

const db = getFirestore(app);

export default function MemberPage() {
  const router = useRouter();
  const [murids, setMurids] = useState([]);
  const [loadingMurids, setLoadingMurids] = useState(true);
  const [activeClass, setActiveClass] = useState({ id: null, name: null });
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [muridToDelete, setMuridToDelete] = useState(null);

  const [emailToAdd, setEmailToAdd] = useState('');
  const [emailValid, setEmailValid] = useState(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [userUidToAdd, setUserUidToAdd] = useState('');
  const [userFullName, setUserFullName] = useState('');

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
    }
  }, []);

  const showCustomAlert = (message, type = "success") => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };
  
  const resetAddForm = () => {
    setEmailToAdd('');
    setEmailValid(null);
    setUserFullName('');
    setCheckingEmail(false);
    setUserUidToAdd('');
  };

  useEffect(() => {
    if (!activeClass.id) {
      setLoadingMurids(false);
      return;
    }

    setLoadingMurids(true);
    const enrollmentsQuery = query(collection(db, 'enrollments'), where('kelasId', '==', activeClass.id));
    const unsubscribe = onSnapshot(enrollmentsQuery, async (querySnapshot) => {
      const docs = querySnapshot.docs;
      const muridList = await Promise.all(
        docs.map(async (enrollmentDoc) => {
          const enrollmentData = enrollmentDoc.data();
          let namaLengkap = 'Nama tidak ditemukan';
          let email = enrollmentData.email || 'Email tidak ada';

          try {
            const userSnap = await getDoc(doc(db, 'users', enrollmentData.muridId));
            if (userSnap.exists()) {
              namaLengkap = userSnap.data().namaLengkap || 'Tanpa Nama';
              email = userSnap.data().email;
            }
          } catch (err) {
            console.error('Gagal ambil nama dari users:', err);
          }

          return {
            id: enrollmentDoc.id,
            email: email,
            namaLengkap,
          };
        })
      );
      setMurids(muridList);
      setLoadingMurids(false);
    }, (error) => {
        console.error("Error getting murids:", error);
        showCustomAlert('Gagal memuat data murid.', 'error');
        setLoadingMurids(false);
    });

    return () => unsubscribe();
  }, [activeClass.id]);

  const checkEmailExists = async (email) => {
    if (!email.trim()) return;
    setCheckingEmail(true);
    setEmailValid(null);
    try {
      const usersQuery = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(usersQuery);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const foundUserUid = querySnapshot.docs[0].id;
        if (userData.role === 'murid') {
          const q = query(collection(db, 'enrollments'), where('kelasId', '==', activeClass.id), where('muridId', '==', foundUserUid));
          const existingEnrollmentSnap = await getDocs(q);

          if (existingEnrollmentSnap.empty) {
            setUserUidToAdd(foundUserUid);
            setUserFullName(userData.namaLengkap || 'Tanpa Nama');
            setEmailValid(true);
          } else {
            setUserFullName('Murid ini sudah terdaftar di kelas.');
            setEmailValid(false);
          }
        } else {
            setUserFullName('Email ditemukan, namun bukan milik murid.');
            setEmailValid(false);
        }
      } else {
        setUserFullName('Email murid tidak ditemukan di database.');
        setEmailValid(false);
      }
    } catch (err) {
      console.error('Gagal cek email:', err);
      setEmailValid(false);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleAddMuridToKelas = async (e) => {
    e.preventDefault();
    if (!emailValid || !activeClass.id || !userUidToAdd) {
        showCustomAlert('Pastikan email murid valid dan belum terdaftar di kelas ini.', 'error');
        return;
    }
    try {
      await addDoc(collection(db, 'enrollments'), {
        kelasId: activeClass.id,
        muridId: userUidToAdd,
        email: emailToAdd,
        createdAt: serverTimestamp(),
      });
      showCustomAlert('Murid berhasil ditambahkan!', 'success');
      setShowAddModal(false);
    } catch (err) {
      showCustomAlert(`Gagal menambahkan murid: ${err.message}`, 'error');
      console.error(err);
    }
  };

  const confirmDeleteMurid = (murid) => {
    setMuridToDelete(murid);
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteMurid = async () => {
    if (!muridToDelete) return;
    try {
      await deleteDoc(doc(db, 'enrollments', muridToDelete.id));
      showCustomAlert('Murid berhasil dihapus dari kelas!', 'success');
    } catch (err) {
      showCustomAlert(`Gagal menghapus murid: ${err.message}`, 'error');
    } finally {
      setMuridToDelete(null);
      setShowDeleteConfirmModal(false);
    }
  };

  const primaryButtonColor = "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500";
  const primaryButtonTextColor = "text-white";
  const inputFocusColor = "focus:ring-orange-500 focus:border-orange-500";

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
            <div className={`flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manajemen Murid</h1>
                    <p className="text-md text-orange-600 font-semibold mt-1">Untuk Kelas: {activeClass.name}</p>
                </div>
                <button
                    onClick={() => { resetAddForm(); setShowAddModal(true); }}
                    className={`flex items-center space-x-2 ${primaryButtonColor} ${primaryButtonTextColor} px-5 py-2.5 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 text-sm font-medium`}
                >
                    <PlusCircle size={20} />
                    <span>Tambah Murid</span>
                </button>
            </div>
            
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
                        {loadingMurids ? (
                            <tr>
                                <td colSpan="3" className="text-center py-10">
                                    <div className="flex justify-center items-center gap-2 text-gray-500">
                                        <Loader className="animate-spin" size={20} />
                                        <span>Memuat data...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : murids.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="text-center py-10 text-gray-500">
                                    Belum ada murid di kelas ini.
                                </td>
                            </tr>
                        ) : (
                            murids.map((murid) => (
                                <tr key={murid.id} className="hover:bg-gray-50 transition-colors duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-800">{murid.namaLengkap}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{murid.email}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => confirmDeleteMurid(murid)}
                                            className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-100 transition-colors"
                                            aria-label={`Hapus murid ${murid.namaLengkap}`}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up">
                    <button onClick={() => { resetAddForm(); setShowAddModal(false); }}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-150"
                        aria-label="Tutup modal">
                        <X size={24} />
                    </button>
                    <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Tambah Murid ke Kelas</h2>
                    <form onSubmit={handleAddMuridToKelas} className="space-y-4">
                        <div>
                            <label htmlFor="addEmail" className="block text-sm font-medium text-gray-700 mb-1">Email Murid</label>
                            <div className="relative">
                                <input
                                    id="addEmail"
                                    type="email"
                                    value={emailToAdd}
                                    onChange={(e) => { setEmailToAdd(e.target.value); setEmailValid(null); }}
                                    onBlur={() => checkEmailExists(emailToAdd)}
                                    required
                                    className={`w-full px-4 py-2.5 border rounded-lg transition duration-150 ${inputFocusColor} 
                                        ${emailValid === true ? 'border-green-500' : emailValid === false ? 'border-red-500' : 'border-gray-300'}`
                                    }
                                    placeholder="Ketik email murid lalu klik di luar..."/>
                                {checkingEmail && <Loader className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>}
                            </div>
                            {emailValid === false && (
                                <p className="text-sm text-red-600 mt-2">{userFullName || "Email tidak ditemukan atau bukan role murid."}</p>
                            )}
                            {emailValid === true && (
                                <p className="text-sm text-green-600 mt-2">Ditemukan: <strong>{userFullName}</strong></p>
                            )}
                        </div>
                        <div className="flex justify-end space-x-3 pt-2">
                            <button type="button" onClick={() => { resetAddForm(); setShowAddModal(false); }} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
                                Batal
                            </button>
                            <button type="submit" disabled={!emailValid || checkingEmail} className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md transition-opacity disabled:opacity-50`}>
                                Tambah Murid
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {showDeleteConfirmModal && muridToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">Konfirmasi Hapus</h3>
                    <p className="text-gray-600 mb-6 text-sm">Apakah Anda yakin ingin menghapus murid <br/><strong className="text-gray-900">{muridToDelete.namaLengkap}</strong> dari kelas ini?</p>
                    <div className="flex justify-center space-x-3">
                        <button type="button" className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" onClick={() => setShowDeleteConfirmModal(false)}>Batal</button>
                        <button type="button" className="px-5 py-2.5 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700" onClick={handleDeleteMurid}>Ya, Hapus</button>
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