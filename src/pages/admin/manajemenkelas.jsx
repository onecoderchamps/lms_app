'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import MainLayout from './layouts/MainLayout';
import { db } from '../../api/firebaseConfig';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  X as CloseIcon,
  AlertTriangle,
  Loader,
  Eye,
  CheckCircle // -- TAMBAHAN: Ikon untuk notifikasi sukses
} from 'lucide-react';


// -- TAMBAHAN: Komponen Notifikasi Didefinisikan di Sini --
const Notification = ({ notification, onClear }) => {
    if (!notification) return null;
    const isSuccess = notification.type === 'success';
    const bgColor = isSuccess ? 'bg-green-500' : 'bg-red-500';
    const Icon = isSuccess ? CheckCircle : AlertTriangle;

    return (
        <div className={`fixed bottom-5 right-5 z-[100] flex items-center gap-4 p-4 rounded-lg text-white shadow-lg animate-fade-in-up ${bgColor}`}>
            <Icon size={24} />
            <p className="flex-1">{notification.message}</p>
            <button onClick={onClear} className="p-1 rounded-full hover:bg-white/20"><CloseIcon size={18} /></button>
        </div>
    );
};


export default function ManajemenKelasPage() {
  const router = useRouter();
  const [kelasList, setKelasList] = useState([]);
  const [guruList, setGuruList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // State untuk Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentKelas, setCurrentKelas] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [kelasToDelete, setKelasToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    namaKelas: '',
    keterangan: '',
    guruId: '',
  });

  // -- TAMBAHAN: State untuk notifikasi dan UI --
  const [notification, setNotification] = useState(null);
  const [hasMounted, setHasMounted] = useState(false);

  // -- TAMBAHAN: Fungsi helper untuk menampilkan notifikasi --
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // -- DIUBAH: Logika pengambilan data dibuat lebih efisien --
  useEffect(() => {
    setHasMounted(true);
    
    // 1. Ambil dan pantau daftar guru
    const guruQuery = query(collection(db, "users"), where("role", "==", "guru"));
    const unsubscribeGurus = onSnapshot(guruQuery, (snapshot) => {
      const gurus = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGuruList(gurus);
    }, (error) => {
        console.error("Gagal mengambil data guru:", error);
        showNotification("Gagal memuat data guru.", "error");
    });

    // 2. Ambil dan pantau daftar kelas
    const kelasQuery = query(collection(db, "kelas"), orderBy("createdAt", "desc"));
    const unsubscribeKelas = onSnapshot(kelasQuery, (snapshot) => {
      const kelasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setKelasList(kelasData);
      setLoading(false);
    }, (error) => {
      console.error("Gagal mengambil data kelas:", error);
      showNotification("Gagal memuat data kelas.", "error"); // -- DIUBAH: alert() ke notifikasi
      setLoading(false);
    });

    return () => {
      unsubscribeGurus();
      unsubscribeKelas();
    };
  }, [showNotification]);


  const dataLengkap = useMemo(() => {
    const guruMap = new Map(guruList.map(g => [g.id, g.namaLengkap]));
    return kelasList.map(kelas => ({
      ...kelas,
      guruName: guruMap.get(kelas.guruId) || "Belum Ditugaskan"
    }));
  }, [kelasList, guruList]);


  const handleOpenAddModal = () => {
    setIsEditing(false);
    setFormData({ namaKelas: '', keterangan: '', guruId: '' });
    setCurrentKelas(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (kelas) => {
    setIsEditing(true);
    setCurrentKelas(kelas);
    setFormData({
      namaKelas: kelas.namaKelas,
      keterangan: kelas.keterangan,
      guruId: kelas.guruId || '',
    });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.namaKelas || !formData.keterangan || !formData.guruId) {
      showNotification("Semua field wajib diisi.", "error"); // -- DIUBAH: alert() ke notifikasi
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        const kelasRef = doc(db, "kelas", currentKelas.id);
        await updateDoc(kelasRef, {
          namaKelas: formData.namaKelas,
          keterangan: formData.keterangan,
          guruId: formData.guruId,
        });
        showNotification("Data kelas berhasil diperbarui."); // -- DIUBAH: alert() ke notifikasi
      } else {
        await addDoc(collection(db, 'kelas'), {
          ...formData,
          createdAt: serverTimestamp(),
        });
        showNotification("Kelas baru berhasil dibuat."); // -- DIUBAH: alert() ke notifikasi
      }
      setShowModal(false);
    } catch (error) {
      console.error("Gagal menyimpan kelas:", error);
      showNotification(`Terjadi kesalahan: ${error.message}`, "error"); // -- DIUBAH: alert() ke notifikasi
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOpenDeleteModal = (kelas) => {
    setKelasToDelete(kelas);
    setShowDeleteModal(true);
  };

  const handleDeleteKelas = async () => {
    if (!kelasToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, "kelas", kelasToDelete.id));
      showNotification("Kelas berhasil dihapus."); // -- DIUBAH: alert() ke notifikasi
      setShowDeleteModal(false);
      setKelasToDelete(null);
    } catch (error) {
      console.error("Gagal menghapus kelas:", error);
      showNotification(`Gagal menghapus: ${error.message}`, "error"); // -- DIUBAH: alert() ke notifikasi
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLihatDetail = (kelas) => {
    localStorage.setItem('idKelas', kelas.id);
    localStorage.setItem('namaKelas', kelas.namaKelas);
    router.push('/guru/dashboard');
  };

  const filteredKelas = useMemo(() => {
    return dataLengkap.filter(kelas => {
      const search = searchTerm.toLowerCase();
      return (kelas.namaKelas?.toLowerCase() || '').includes(search) || 
             (kelas.guruName?.toLowerCase() || '').includes(search);
    });
  }, [dataLengkap, searchTerm]);

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-white min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className={`flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4 ${hasMounted ? 'animate-on-scroll is-visible' : ''}`}>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manajemen Kelas</h1>
              <p className="text-gray-600 mt-1">Kelola semua kelas yang ada di platform.</p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center space-x-2 bg-orange-500 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-300 text-sm font-medium"
            >
              <PlusCircle size={20} />
              <span>Tambah Kelas</span>
            </button>
          </div>

          <div className={`mb-8 p-5 bg-gray-50/70 shadow-inner rounded-lg border border-gray-200 ${hasMounted ? 'animate-on-scroll is-visible' : ''}`} style={{ animationDelay: '0.2s' }}>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Cari Kelas atau Guru</label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" id="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                placeholder="Ketik untuk mencari..." />
            </div>
          </div>

          <div className={`overflow-x-auto rounded-lg shadow-lg border border-gray-200 ${hasMounted ? 'animate-on-scroll is-visible' : ''}`} style={{ animationDelay: '0.3s' }}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Kelas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guru Pengajar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Dibuat</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="4" className="text-center p-10 text-gray-500"><Loader className="animate-spin inline-block mr-2" /> Memuat data...</td></tr>
                ) : filteredKelas.length === 0 ? (
                  <tr><td colSpan="4" className="text-center p-10 text-gray-500">Tidak ada kelas yang ditemukan.</td></tr>
                ) : (
                  filteredKelas.map(kelas => (
                    <tr key={kelas.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{kelas.namaKelas}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{kelas.keterangan}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{kelas.guruName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {kelas.createdAt?.toDate().toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'}) || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleLihatDetail(kelas)} className="text-green-600 hover:text-green-900 p-2 rounded-md hover:bg-green-50" title="Lihat Detail Kelas"><Eye size={18} /></button>
                        <button onClick={() => handleOpenEditModal(kelas)} className="ml-2 text-indigo-600 hover:text-indigo-900 p-2 rounded-md hover:bg-indigo-50" title="Edit"><Edit size={18} /></button>
                        <button onClick={() => handleOpenDeleteModal(kelas)} className="ml-2 text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50" title="Hapus"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* -- TAMBAHAN: Komponen notifikasi dirender di sini -- */}
        <Notification notification={notification} onClear={() => setNotification(null)} />

        {/* --- Modal untuk Tambah/Edit Kelas --- */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white rounded-xl shadow-2xl p-7 w-full max-w-lg relative animate-fade-in-up my-8 border-t-4 border-orange-500">
                  <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><CloseIcon size={24} /></button>
                  <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">{isEditing ? 'Edit Kelas' : 'Buat Kelas Baru'}</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelas</label>
                          <input type="text" name="namaKelas" value={formData.namaKelas} onChange={handleFormChange} placeholder="Contoh: Fullstack Developer Batch 3" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500" required />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan Singkat</label>
                          <textarea name="keterangan" value={formData.keterangan} onChange={handleFormChange} rows={3} placeholder="Deskripsi singkat tentang kelas ini" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500" required />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Guru Pengajar</label>
                          <select name="guruId" value={formData.guruId} onChange={handleFormChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 bg-white" required>
                              <option value="">-- Pilih Guru Pengajar --</option>
                              {guruList.map(guru => (
                                  <option key={guru.id} value={guru.id}>{guru.namaLengkap}</option>
                              ))}
                          </select>
                      </div>
                      <div className="flex justify-end space-x-3 pt-4">
                          <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                          <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center">
                              {isSubmitting && <Loader className="animate-spin mr-2" size={16}/>}
                              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
        )}
        
        {/* --- Modal untuk Konfirmasi Hapus --- */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md text-center animate-fade-in-up">
                  <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Konfirmasi Hapus</h3>
                  <p className="text-gray-600 mb-6 text-sm">Anda yakin ingin menghapus kelas <strong className="font-semibold text-gray-900">{kelasToDelete?.namaKelas}</strong>? Semua data di dalamnya akan terhapus.</p>
                  <div className="flex justify-center space-x-4">
                      <button onClick={() => setShowDeleteModal(false)} className="w-full px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold">Batal</button>
                      <button disabled={isSubmitting} onClick={handleDeleteKelas} className="w-full px-5 py-2.5 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 disabled:opacity-50 font-semibold">
                          {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                      </button>
                  </div>
              </div>
          </div>
        )}
      </main>
      <style jsx global>{`
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-on-scroll, .animate-fade-in-up {
            opacity: 0;
            animation: fadeInUp 0.6s ease-out forwards;
        }
        .is-visible {
            opacity: 1;
        }
      `}</style>
    </MainLayout>
  );
}