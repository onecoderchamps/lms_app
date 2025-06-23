'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/component/AuthProvider';
import { Settings, User, LogOut, Camera, X as CloseIcon, Loader } from 'lucide-react';
import { updateProfile, updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
// --- DIUBAH: Path impor diperbaiki menggunakan alias ---
import { db, auth } from '@/api/firebaseConfig';

// Fungsi bantuan untuk mendapatkan inisial dari nama
const getInitials = (name) => {
  if (!name) return 'A';
  const names = name.split(' ');
  if (names.length === 1 && names[0].length > 1) return names[0].substring(0, 2).toUpperCase();
  if (names.length >= 2) return (names[0][0] + names[1][0]).toUpperCase();
  return names[0]?.[0]?.toUpperCase() || 'A';
};

export default function HeaderAdmin() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // State untuk Modal Edit Profil
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editNama, setEditNama] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [editFoto, setEditFoto] = useState(null);
  const [editFotoPreview, setEditFotoPreview] = useState('');

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error("Gagal logout:", error);
      alert("Gagal untuk logout.");
    }
  };

  const handleOpenEditModal = () => {
    if (user) {
      setEditNama(user.namaLengkap || user.displayName || '');
      setEditPassword('');
      setEditConfirmPassword('');
      setEditFotoPreview(user.photoURL || '');
      setEditFoto(null);
      setShowEditProfileModal(true);
      setDropdownOpen(false);
    }
  };

  const uploadFileExternalApi = async (file) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('https://apiimpact.coderchamps.co.id/api/v1/file/upload', {
        method: 'POST', body: formData,
      });
      const result = await response.json();
      if (result.status) return { url: result.path };
      throw new Error(result.message || "Gagal mengunggah file.");
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };
  
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return alert("Sesi Anda telah berakhir. Silakan login kembali.");
    if (editPassword && editPassword !== editConfirmPassword) return alert("Password dan konfirmasi password tidak cocok!");

    setIsUpdating(true);
    try {
      let fotoURL = user.photoURL;
      if (editFoto) {
        const uploadResult = await uploadFileExternalApi(editFoto);
        if (uploadResult) fotoURL = uploadResult.url;
      }

      await updateProfile(auth.currentUser, { 
        displayName: editNama, 
        photoURL: fotoURL 
      });

      await updateDoc(doc(db, "users", user.uid), { 
        namaLengkap: editNama, 
        photoURL: fotoURL
      });

      if (editPassword) {
        if (editPassword.length < 6) {
          alert("Password baru minimal 6 karakter!");
          setIsUpdating(false);
          return;
        }
        await updatePassword(auth.currentUser, editPassword);
      }
      alert("Profil berhasil diperbarui!");
      setShowEditProfileModal(false);
      router.reload();
    } catch (error) {
      console.error("Gagal update profil:", error);
      alert("Gagal memperbarui profil: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) {
    return (
        <header className="bg-white shadow-sm p-4 h-16 flex justify-between items-center fixed left-0 md:left-64 right-0 top-0 z-30 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/4"></div>
            <div className="flex items-center gap-2">
                <div className="h-5 bg-gray-200 rounded w-24"></div>
                <div className="w-9 h-9 rounded-full bg-gray-200"></div>
            </div>
        </header>
    );
  }

  return (
    <>
      <header className="bg-white shadow-sm p-4 h-16 flex justify-between items-center fixed left-0 md:left-64 right-0 top-0 z-30">
        <h1 className="text-lg font-bold text-gray-800">Admin Panel</h1>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 cursor-pointer p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700 hidden sm:block truncate">Hi, {user.namaLengkap || 'Admin'}</span>
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Foto Profil" 
                className="w-9 h-9 rounded-full object-cover" 
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                {getInitials(user.namaLengkap)}
              </div>
            )}
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-40 border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800 truncate">{user.namaLengkap}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <div className="py-1">
                  <button onClick={handleOpenEditModal} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <User size={14} className="mr-2" />
                      Edit Profil
                  </button>
              </div>
              <div className="py-1 border-t border-gray-100">
                   <button onClick={handleLogout} className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <LogOut size={14} className="mr-2" />
                      Logout
                   </button>
              </div>
          </div>
          )}
        </div>
      </header>

      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in-up">
            <div className="p-6 flex justify-between items-center border-b">
              <h2 className="text-lg font-semibold text-gray-800">Edit Profil</h2>
              <button onClick={() => setShowEditProfileModal(false)} className="text-gray-400 hover:text-gray-700">
                <CloseIcon size={24} />
              </button>
            </div>
            <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
              <div className="flex flex-col items-center space-y-2">
                  <div className="relative">
                      <img src={editFotoPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.namaLengkap || '..')}&background=f97316&color=fff&bold=true`} alt="Foto Profil" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"/>
                      <label htmlFor="fotoProfil" className="absolute bottom-0 right-0 bg-orange-500 text-white p-1.5 rounded-full cursor-pointer hover:bg-orange-600 transition-transform hover:scale-110">
                          <Camera size={16} />
                          <input type="file" id="fotoProfil" className="hidden" accept="image/*" onChange={(e) => {
                              if (e.target.files[0]) {
                                  setEditFoto(e.target.files[0]);
                                  setEditFotoPreview(URL.createObjectURL(e.target.files[0]));
                              }
                          }}/>
                      </label>
                  </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input type="text" value={editNama} onChange={(e) => setEditNama(e.target.value)} className="w-full border px-3 py-2 rounded-md focus:ring-orange-500 focus:border-orange-500" required/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru (opsional)</label>
                <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} className="w-full border px-3 py-2 rounded-md focus:ring-orange-500 focus:border-orange-500" placeholder="Kosongkan jika tidak ingin ganti"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
                <input type="password" value={editConfirmPassword} onChange={(e) => setEditConfirmPassword(e.target.value)} className="w-full border px-3 py-2 rounded-md focus:ring-orange-500 focus:border-orange-500" placeholder="Ulangi password baru"/>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                  <button type="button" onClick={() => setShowEditProfileModal(false)} className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">Batal</button>
                  <button type="submit" disabled={isUpdating} className="px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed transition-colors flex items-center">
                      {isUpdating && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
                      {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; opacity: 0; }
      `}</style>
    </>
  );
}
        