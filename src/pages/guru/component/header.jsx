'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/component/AuthProvider'; // Pastikan path ini benar
import { LayoutGrid, User, LogOut, Shield, Settings } from 'lucide-react';

// Fungsi bantuan untuk mendapatkan inisial dari nama
const getInitials = (name) => {
  if (!name) return '..';
  const names = name.split(' ');
  if (names.length === 1 && names[0].length > 1) return names[0].substring(0, 2).toUpperCase();
  if (names.length >= 2) return (names[0][0] + names[1][0]).toUpperCase();
  return names[0]?.[0]?.toUpperCase() || '..';
};

export default function HeaderGuru() {
  const { user, logout } = useAuth(); 
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);
  
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  // Fungsi untuk kembali ke halaman pemilihan kelas guru
  const handlePilihKelas = () => {
    router.push('/guru'); 
    setDropdownOpen(false);
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
    <header className="bg-white shadow-sm p-4 h-16 flex justify-between items-center fixed left-0 md:left-64 right-0 top-0 z-30">
      <h1 className="text-lg font-bold text-gray-800">Panel Guru</h1>
      <div className="flex items-center gap-4">
        
        {/* Tombol ini hanya muncul jika Super Admin yang sedang melihat panel ini */}
        {user && user.role === 'admin' && (
            <button
                onClick={() => {
                    localStorage.removeItem('idKelas');
                    localStorage.removeItem('namaKelas');
                    router.push('/admin/kelas');
                }}
                className="flex items-center gap-2 text-sm font-semibold text-white bg-slate-700 hover:bg-slate-800 px-4 py-2 rounded-lg transition-colors"
            >
                <Shield size={16} />
                <span>Kembali ke Admin</span>
            </button>
        )}

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 cursor-pointer p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {getInitials(user?.namaLengkap)}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block truncate">
              Hi, {user?.namaLengkap || 'Pengguna'}
            </span>
          </button>
          
          {dropdownOpen && (
             <div
                className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-40 border border-gray-200"
            >
                <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800 truncate">{user?.namaLengkap}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                    <button
                        onClick={handlePilihKelas}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                        <LayoutGrid size={14} className="mr-2" />
                        Pilih Kelas Lain
                    </button>
                </div>
                 <div className="py-1 border-t border-gray-100">
                     <button
                        onClick={handleLogout}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                     >
                        <LogOut size={14} className="mr-2" />
                        Logout
                     </button>
                 </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
