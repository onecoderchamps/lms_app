import React, { useState, useEffect } from 'react';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { app } from '../../api/firebaseConfig';
import MainLayout from './layouts/MainLayout';

const db = getFirestore(app);

const MemberPage = () => {
  const [emailToAdd, setEmailToAdd] = useState('');
  const [emailValid, setEmailValid] = useState(null);
  const [userUid, setUserUid] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showAddMuridModal, setShowAddMuridModal] = useState(false);
  const [murids, setMurids] = useState([]);
  const [loadingMurids, setLoadingMurids] = useState(false);

  // Baru: state modal konfirmasi hapus
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [muridToDelete, setMuridToDelete] = useState(null);

  const primaryButtonColor = 'bg-blue-600 hover:bg-blue-700';
  const primaryButtonTextColor = 'text-white';

  const showCustomAlert = (msg, type) => {
    alert(`${type.toUpperCase()}: ${msg}`);
  };

  const idKelas = typeof window !== 'undefined' ? localStorage.getItem('idKelas') : null;

  const fetchMurids = async () => {
    if (!idKelas) return;
    setLoadingMurids(true);
    try {
      const muridsQuery = query(
        collection(db, 'murids'),
        where('idKelas', '==', idKelas)
      );
      const querySnapshot = await getDocs(muridsQuery);
      const muridList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMurids(muridList);
    } catch (err) {
      console.error('Gagal mengambil data murid:', err);
    } finally {
      setLoadingMurids(false);
    }
  };

  useEffect(() => {
    fetchMurids();
  }, [idKelas]);

  const checkEmailExists = async (email) => {
    setCheckingEmail(true);
    try {
      const usersQuery = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(usersQuery);
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setUserUid(querySnapshot.docs[0].id);
        setUserFullName(userData.namaLengkap || '');
        setEmailValid(true);
      } else {
        setEmailValid(false);
        setUserUid('');
        setUserFullName('');
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
    if (!emailValid || !idKelas || !userUid) return;

    try {
      await addDoc(collection(db, 'murids'), {
        idKelas,
        email: emailToAdd,
        namaLengkap: userFullName,
        idUser: userUid,
      });
      showCustomAlert('Murid berhasil ditambahkan!', 'success');
      setShowAddMuridModal(false);
      setEmailToAdd('');
      setEmailValid(null);
      fetchMurids();
    } catch (err) {
      showCustomAlert('Gagal menambahkan murid!', 'error');
      console.error(err);
    }
  };

  // Fungsi untuk buka modal hapus
  const openDeleteModal = (murid) => {
    setMuridToDelete(murid);
    setShowDeleteModal(true);
  };

  // Fungsi hapus murid dari firestore
  const handleDeleteMurid = async () => {
    if (!muridToDelete) return;
    try {
      await deleteDoc(doc(db, 'murids', muridToDelete.id));
      showCustomAlert('Murid berhasil dihapus!', 'success');
      setShowDeleteModal(false);
      setMuridToDelete(null);
      fetchMurids();
    } catch (err) {
      showCustomAlert('Gagal menghapus murid!', 'error');
      console.error(err);
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <button
          onClick={() => setShowAddMuridModal(true)}
          className={`${primaryButtonColor} ${primaryButtonTextColor} px-4 py-2 rounded-md mb-6`}
        >
          Tambah Murid
        </button>

        {/* List Murid dalam Table */}
        <div className="bg-white shadow rounded-lg p-4 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4">Daftar Murid</h3>
          {loadingMurids ? (
            <p>Memuat data murid...</p>
          ) : murids.length === 0 ? (
            <p className="text-gray-500">Belum ada murid yang ditambahkan.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Lengkap
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {murids.map((murid) => (
                  <tr key={murid.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{murid.namaLengkap || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{murid.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => openDeleteModal(murid)}
                        className="text-red-600 hover:text-red-800 font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Tambah Murid */}
        {showAddMuridModal && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Tambah Murid ke Kelas</h2>
              <form onSubmit={handleAddMuridToKelas} className="space-y-4">
                <div className="relative">
                  <label
                    htmlFor="emailToAdd"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Murid
                  </label>
                  <div className="flex items-center">
                    <input
                      type="email"
                      id="emailToAdd"
                      placeholder="contoh@example.com"
                      value={emailToAdd}
                      onChange={(e) => {
                        setEmailToAdd(e.target.value);
                        setEmailValid(null);
                        setUserFullName('');
                      }}
                      onBlur={() => {
                        if (emailToAdd.trim()) checkEmailExists(emailToAdd.trim());
                      }}
                      required
                      className={`w-full px-4 py-2.5 border rounded-lg transition duration-150 mr-2 ${
                        emailValid === false
                          ? 'border-red-500'
                          : emailValid === true
                          ? 'border-green-500'
                          : 'border-gray-300'
                      }`}
                    />
                    {checkingEmail ? (
                      <span className="text-gray-400 animate-pulse">...</span>
                    ) : emailValid === true ? (
                      <span className="text-green-600">✅</span>
                    ) : emailValid === false ? (
                      <span className="text-red-600">❌</span>
                    ) : null}
                  </div>
                  {emailValid === false && (
                    <p className="text-sm text-red-600 mt-1">
                      Email tidak ditemukan di sistem.
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMuridModal(false)}
                    className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!emailValid}
                    className={`px-5 py-2.5 rounded-lg shadow-md text-sm font-medium ${
                      emailValid
                        ? primaryButtonColor + ' ' + primaryButtonTextColor
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Simpan Murid
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Delete */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
              <h3 className="text-lg font-semibold mb-4">Konfirmasi Hapus Murid</h3>
              <p className="mb-6">
                Apakah Anda yakin ingin menghapus murid{' '}
                <strong>{muridToDelete?.namaLengkap}</strong>?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteMurid}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default MemberPage;
