'use client';

import { useRouter } from "next/router";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from 'next/link';
import { Settings, User, LogOut, BookOpen, X, Camera, Plus, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import {
  collection, getDocs, query, where, getDoc, doc, updateDoc
} from 'firebase/firestore';
import { updateProfile, updatePassword } from 'firebase/auth';
import { db, auth } from '../../api/firebaseConfig';
import { useAuth } from '@/component/AuthProvider';

// --- BAGIAN 1: KOMPONEN-KOMPONEN KECIL & HELPER ---

const Notification = ({ notification, onClear }) => {
    if (!notification) return null;
    const isSuccess = notification.type === 'success';
    const bgColor = isSuccess ? 'bg-green-500' : 'bg-red-500';
    const Icon = isSuccess ? CheckCircle : AlertTriangle;
    return (
        <div className={`fixed bottom-5 right-5 z-[100] flex items-center gap-4 p-4 rounded-lg text-white shadow-lg animate-fade-in-up ${bgColor}`}>
            <Icon size={24} /><p className="flex-1">{notification.message}</p>
            <button onClick={onClear} className="p-1 rounded-full hover:bg-white/20"><X size={18} /></button>
        </div>
    );
};

const uploadFileExternalApi = async (file) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append('file', file);
    try {
        const response = await fetch('https://apiimpact.coderchamps.co.id/api/v1/file/upload', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.status === true) return { url: result.path };
        throw new Error(result.message || "Gagal mengunggah file.");
    } catch (error) {
        console.error("Error uploading file:", error); throw error;
    }
};


// --- BAGIAN 2: KOMPONEN UTAMA HALAMAN ---

export default function MuridPilihKelasPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [kelasList, setKelasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  useEffect(() => {
    const fetchEnrolledClasses = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const enrollmentsQuery = query(collection(db, "enrollments"), where("muridId", "==", user.uid));
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        if (enrollmentsSnapshot.empty) {
          setKelasList([]);
          return;
        }
        const classIds = enrollmentsSnapshot.docs.map(d => d.data().kelasId);
        if (classIds.length === 0) {
          setKelasList([]);
          return;
        }
        const classPromises = classIds.map(id => getDoc(doc(db, 'kelas', id)));
        const classDocs = await Promise.all(classPromises);
        const enrolledClasses = classDocs
          .filter(doc => doc.exists())
          .map(doc => ({ id: doc.id, ...doc.data() }));
        setKelasList(enrolledClasses);
      } catch (error) {
        console.error('Gagal mengambil daftar kelas:', error);
        showNotification("Gagal memuat daftar kelas.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledClasses();
  }, [user, showNotification]);

  const handleProfileUpdate = async (updateData) => {
    const { nama, password, fotoFile } = updateData;
    if (!auth.currentUser) return showNotification("Sesi berakhir, silakan login kembali.", "error");

    try {
      let fotoURL = user.photoURL;
      if (fotoFile) {
        const uploadResult = await uploadFileExternalApi(fotoFile);
        if (uploadResult) fotoURL = uploadResult.url;
      }

      await updateProfile(auth.currentUser, { displayName: nama, photoURL: fotoURL });
      await updateDoc(doc(db, "users", user.uid), { namaLengkap: nama, photoURL: fotoURL });

      if (password) {
        await updatePassword(auth.currentUser, password);
      }
      showNotification("Profil berhasil diperbarui! Halaman akan dimuat ulang.");
      setTimeout(() => router.reload(), 2000);
    } catch (error) {
      console.error("Gagal update profil:", error);
      const message = error.code === 'auth/requires-recent-login' ? "Perlu login ulang untuk ganti password." : "Gagal update profil.";
      showNotification(message, "error");
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (err) {
      console.error(err);
      showNotification("Gagal logout.", "error");
    }
  };

  const handleKelasClick = (id, namaKelas) => {
    localStorage.setItem('idKelas', id);
    localStorage.setItem('namaKelas', namaKelas);
    router.push('/murid/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-orange-600 p-4 sm:p-6 relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50" ref={profileMenuRef}>
        <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center space-x-3 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors backdrop-blur-sm">
          <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.namaLengkap || 'M')}&background=ffffff&color=f97316`} alt="Profil" className="w-9 h-9 rounded-full object-cover" />
          <span className="hidden md:block font-semibold text-white pr-2">{user?.namaLengkap || 'Murid'}</span>
        </button>
        {showProfileMenu && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl animate-fade-in-up">
            <div className="p-2">
              <button onClick={() => { setShowEditProfileModal(true); setShowProfileMenu(false); }} className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md w-full"><User size={16} className="mr-2" /> Edit Profil</button>
              <div className="h-px bg-gray-200 my-1" />
              <button onClick={handleLogout} className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md w-full"><LogOut size={16} className="mr-2" /> Logout</button>
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-7xl mx-auto flex flex-col items-center pt-20">
        <div className="text-center mb-8 animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl font-bold text-white">Kelas yang Anda Ikuti</h1>
            <p className="text-orange-100 mt-2">Selamat datang kembali, {user?.namaLengkap || ''}!</p>
        </div>

        {loading ? <p className="text-white/90 py-10">Memuat daftar kelas Anda...</p>
         : kelasList.length === 0 ? (
            <div className="bg-white/20 backdrop-blur p-8 rounded-lg text-center text-white w-full max-w-md animate-fade-in-up">
                <h2 className="text-xl font-semibold">Anda belum terdaftar di kelas manapun</h2>
                <p className="text-sm mt-2">Silakan hubungi guru Anda untuk ditambahkan ke dalam kelas.</p>
            </div>
         ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                {kelasList.map((kelas) => (
                    <div key={kelas.id} onClick={() => handleKelasClick(kelas.id, kelas.namaKelas)}
                        className="bg-white p-5 rounded-xl shadow-lg flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer">
                        <div className="flex-grow">
                            <BookOpen className="text-orange-500 mb-3" size={28} />
                            <h3 className="text-lg font-bold text-gray-800">{kelas.namaKelas}</h3>
                            <p className="text-gray-600 text-sm mt-1">{kelas.keterangan}</p>
                        </div>
                    </div>
                ))}
            </div>
         )}
      </div>

      {showEditProfileModal && user && <EditProfileModal show={showEditProfileModal} onClose={() => setShowEditProfileModal(false)} onSubmit={handleProfileUpdate} user={user} />}
      <Notification notification={notification} onClear={() => setNotification(null)} />

      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; opacity: 0; }
      `}</style>
    </div>
  );
}

// --- BAGIAN 3: KOMPONEN MODAL EDIT PROFIL ---
// (Dibuat menjadi komponen terpisah untuk kebersihan kode)

function EditProfileModal({ show, onClose, onSubmit, user }) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [nama, setNama] = useState(user.namaLengkap || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [foto, setFoto] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(user.photoURL || '');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password && password !== confirmPassword) {
            setError("Password dan konfirmasi tidak cocok!");
            return;
        }
        if (password && password.length < 6) {
            setError("Password baru minimal 6 karakter.");
            return;
        }
        setError('');
        setIsUpdating(true);
        await onSubmit({ nama, password, fotoFile: foto });
        setIsUpdating(false);
        onClose(); // Tutup modal setelah submit
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in-up">
                <div className="p-6 flex justify-between items-center border-b"><h2 className="text-lg font-semibold text-gray-800">Edit Profil</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={24} /></button></div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="flex flex-col items-center"><div className="relative"><img src={fotoPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.namaLengkap || '..')}&background=f97316&color=fff&bold=true`} alt="Foto Profil" className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-md"/><label htmlFor="fotoProfil" className="absolute bottom-0 right-0 bg-orange-500 text-white p-1.5 rounded-full cursor-pointer hover:bg-orange-600 transition"><Camera size={16} /><input type="file" id="fotoProfil" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files[0]) { setFoto(e.target.files[0]); setFotoPreview(URL.createObjectURL(e.target.files[0])); } }}/></label></div></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label><input type="text" value={nama} onChange={(e) => setNama(e.target.value)} className="w-full border px-3 py-2 rounded-md focus:ring-orange-500 focus:border-orange-500" required/></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Password Baru (opsional)</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border px-3 py-2 rounded-md focus:ring-orange-500 focus:border-orange-500" placeholder="Kosongkan jika tidak ganti"/></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border px-3 py-2 rounded-md focus:ring-orange-500 focus:border-orange-500" /></div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                        <button type="submit" disabled={isUpdating} className="px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center">
                            {isUpdating && <Loader className="animate-spin mr-2" size={16}/>}
                            {isUpdating ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}