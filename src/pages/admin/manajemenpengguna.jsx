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
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  X as CloseIcon,
  AlertTriangle,
  Loader,
  CheckCircle, // -- TAMBAHAN: Ikon untuk notifikasi
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

// Komponen untuk badge peran (role)
const RoleBadge = ({ role }) => {
  const baseClasses = "px-2.5 py-1 text-xs font-semibold rounded-full capitalize";
  const roles = {
    admin: `bg-red-100 text-red-800`,
    guru: `bg-blue-100 text-blue-800`,
    murid: `bg-green-100 text-green-800`,
  };
  return <span className={`${baseClasses} ${roles[role] || 'bg-gray-100 text-gray-800'}`}>{role}</span>;
};

// Komponen utama
export default function ManajemenPenggunaPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('Semua');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    namaLengkap: '',
    email: '',
    role: 'murid',
    password: '',
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  // -- TAMBAHAN: State untuk notifikasi dan UI --
  const [notification, setNotification] = useState(null);
  const [hasMounted, setHasMounted] = useState(false);

  // -- TAMBAHAN: Fungsi helper untuk menampilkan notifikasi --
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  useEffect(() => {
    setHasMounted(true);
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Gagal mengambil data pengguna:", error);
      showNotification("Gagal memuat data pengguna.", "error");
      setLoading(false);
    });
    return () => unsubscribe();
  }, [showNotification]);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setFormData({ namaLengkap: '', email: '', role: 'murid', password: '' });
    setCurrentUser(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (user) => {
    setIsEditing(true);
    setCurrentUser(user);
    setFormData({
      namaLengkap: user.namaLengkap,
      email: user.email,
      role: user.role,
      password: '',
    });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.namaLengkap || !formData.email) {
      showNotification("Nama dan Email wajib diisi.", "error");
      return;
    }
    if (!isEditing && !formData.password) {
      showNotification("Password wajib diisi untuk pengguna baru.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
        if (isEditing) {  
            const userRef = doc(db, "users", currentUser.id);
            await updateDoc(userRef, {
                namaLengkap: formData.namaLengkap,
                role: formData.role,
            });
            showNotification("Data pengguna berhasil diperbarui.");
        } else {
            showNotification("Simulasi berhasil: Fitur ini memerlukan backend.", "success");
        }
        setShowModal(false);
    } catch (error) {
        console.error("Gagal menyimpan pengguna:", error);
        showNotification(`Terjadi kesalahan: ${error.message}`, "error");
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleOpenDeleteModal = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    try {
      // Catatan Keamanan: Menghapus pengguna juga idealnya melalui backend
      // untuk menghapus data dari Firebase Authentication dan Firestore bersamaan.
      await deleteDoc(doc(db, "users", userToDelete.id));
      showNotification("Pengguna berhasil dihapus dari database."); // -- DIUBAH
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Gagal menghapus pengguna:", error);
      showNotification(`Gagal menghapus: ${error.message}`, "error"); // -- DIUBAH
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesRole = roleFilter === 'Semua' || user.role === roleFilter.toLowerCase();
      const matchesSearch = (user.namaLengkap?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                            (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [users, searchTerm, roleFilter]);

  return (
    <MainLayout>
      {/* -- DIUBAH: Latar belakang utama menjadi putih -- */}
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-white min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className={`flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4 ${hasMounted ? 'animate-on-scroll is-visible' : ''}`}>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manajemen Pengguna</h1>
              <p className="text-gray-600 mt-1">Kelola semua pengguna terdaftar di platform.</p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center space-x-2 bg-orange-500 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-300 text-sm font-medium"
            >
              <PlusCircle size={20} />
              <span>Tambah Pengguna</span>
            </button>
          </div>

          {/* -- DIUBAH: Gaya panel filter diseragamkan -- */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-5 bg-gray-50/70 shadow-inner rounded-lg border border-gray-200 ${hasMounted ? 'animate-on-scroll is-visible' : ''}`} style={{ animationDelay: '0.2s' }}>
            <div className="md:col-span-2">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Cari Nama atau Email</label>
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" id="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Ketik untuk mencari..." />
                </div>
            </div>
            <div>
                <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter Berdasarkan Peran</label>
                <select id="roleFilter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 bg-white">
                    <option>Semua</option>
                    <option>Guru</option>
                    <option>Murid</option>
                    <option>Admin</option>
                </select>
            </div>
          </div>

          <div className={`overflow-x-auto rounded-lg shadow-lg border border-gray-200 ${hasMounted ? 'animate-on-scroll is-visible' : ''}`} style={{ animationDelay: '0.3s' }}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Lengkap</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peran</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Bergabung</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="4" className="text-center p-10 text-gray-500"><Loader className="animate-spin inline-block mr-2" /> Memuat data...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan="4" className="text-center p-10 text-gray-500">Tidak ada pengguna yang ditemukan.</td></tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full object-cover bg-gray-200" src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.namaLengkap)}&background=random&color=fff`} alt={user.namaLengkap} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.namaLengkap}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap"><RoleBadge role={user.role} /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.createdAt && typeof user.createdAt.toDate === 'function' 
                          ? user.createdAt.toDate().toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'}) 
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleOpenEditModal(user)} className="text-indigo-600 hover:text-indigo-900 p-2 rounded-md hover:bg-indigo-50"><Edit size={18} /></button>
                        <button onClick={() => handleOpenDeleteModal(user)} className="ml-2 text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50"><Trash2 size={18} /></button>
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

        {/* Modal Tambah/Edit Pengguna */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white rounded-xl shadow-2xl p-7 w-full max-w-lg relative animate-fade-in-up my-8 border-t-4 border-orange-500">
                  <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><CloseIcon size={24} /></button>
                  <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">{isEditing ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                          <input type="text" name="namaLengkap" value={formData.namaLengkap} onChange={handleFormChange} placeholder="Masukkan nama lengkap" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition" required />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Email</label>
                          <input type="email" name="email" value={formData.email} onChange={handleFormChange} placeholder="contoh@email.com" disabled={isEditing} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 transition" required />
                      </div>
                      {!isEditing && (
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                              <input type="password" name="password" value={formData.password} onChange={handleFormChange} placeholder="Minimal 6 karakter" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition" required />
                          </div>
                      )}
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Peran</label>
                          <select name="role" value={formData.role} onChange={handleFormChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 bg-white transition">
                              <option value="murid">Murid</option>
                              <option value="guru">Guru</option>
                              <option value="admin">Admin</option>
                          </select>
                      </div>
                      <div className="flex justify-end space-x-3 pt-4">
                          <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">Batal</button>
                          <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center transition-colors">
                              {isSubmitting && <Loader className="animate-spin mr-2" size={16}/>}
                              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
        )}
        
        {/* Modal Hapus Pengguna */}
        {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md text-center animate-fade-in-up">
                    <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">Konfirmasi Hapus</h3>
                    <p className="text-gray-600 mb-6 text-sm">Anda yakin ingin menghapus pengguna <strong className="font-semibold text-gray-900">{userToDelete?.namaLengkap}</strong>? Tindakan ini tidak dapat diurungkan.</p>
                    <div className="flex justify-center space-x-4">
                        <button onClick={() => setShowDeleteModal(false)} className="w-full px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold">Batal</button>
                        <button disabled={isSubmitting} onClick={handleDeleteUser} className="w-full px-5 py-2.5 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 disabled:opacity-50 font-semibold">
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