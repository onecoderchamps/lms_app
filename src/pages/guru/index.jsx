'use client';

import { useRouter } from "next/router";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from 'next/link';
import {
    LayoutDashboard, Users, BookText, MonitorPlay, FileText, ListChecks, Edit, ClipboardCheck,
    ChevronDown, ChevronUp, BookCheck, FilePen, Settings, User, LogOut, BookOpen, X, Camera,
    Plus, Pencil, Trash2, AlertTriangle, CheckCircle, Loader
} from 'lucide-react';
import {
    collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, serverTimestamp, orderBy
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

export default function GuruManajemenKelasPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    
    const [kelasList, setKelasList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);

    // State untuk modal
    const [showKelasModal, setShowKelasModal] = useState(false);
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    // State untuk data yang akan dimanipulasi
    const [kelasToEdit, setKelasToEdit] = useState(null);
    const [kelasToDelete, setKelasToDelete] = useState(null);

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef = useRef(null);

    const showNotification = useCallback((message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    }, []);

    const fetchKelas = useCallback(async () => {
        if (!user) { // Pastikan user ada sebelum fetch kelas
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const q = query(collection(db, 'kelas'), where('guruId', '==', user.uid), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            setKelasList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error('Gagal mengambil kelas:', error);
            showNotification(error.code === 'failed-precondition' ? "Query memerlukan indeks." : "Gagal mengambil data kelas.", 'error');
        } finally {
            setLoading(false);
        }
    }, [user, showNotification]); // user ditambahkan sebagai dependency

    // Efek untuk mengambil data kelas
    useEffect(() => {
        if (user) { // Hanya panggil fetchKelas jika user sudah dimuat
            fetchKelas();
        } else {
            setLoading(false);
        }
    }, [user, fetchKelas]);

    // Efek untuk menutup menu profil jika klik di luar area
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    // --- (Fungsi-fungsi handler lainnya tetap sama persis seperti sebelumnya) ---
    const handleKelasSubmit = async (formData) => {
        const isEditing = !!formData.id; // formData.id akan ada hanya jika mode edit
        try {
            if (isEditing) {
                // Mode Edit: Gunakan updateDoc dengan ID yang ada
                const { id, ...dataToUpdate } = formData; // Pisahkan id dari data
                await updateDoc(doc(db, 'kelas', id), dataToUpdate);
            } else {
                // Mode Tambah: Gunakan addDoc, biarkan Firestore membuat ID
                // Pastikan guruId ada di sini
                await addDoc(collection(db, 'kelas'), { ...formData, guruId: user.uid, createdAt: serverTimestamp() });
            }
            setShowKelasModal(false);
            await fetchKelas(); // Refresh daftar kelas
            showNotification(isEditing ? 'Kelas berhasil diperbarui!' : 'Kelas baru berhasil dibuat!');
        } catch (error) {
            console.error('Gagal menyimpan kelas:', error);
            showNotification('Gagal menyimpan kelas.', 'error');
        }
    };

    const handleProfileUpdate = async (updateData) => {
        const { nama, password, fotoFile } = updateData;
        if (!auth.currentUser) {
            showNotification("Sesi berakhir, silakan login kembali.", "error");
            return;
        }

        try {
            let fotoURL = auth.currentUser.photoURL; // Ambil URL foto yang ada dari Auth
            if (fotoFile) {
                const uploadResult = await uploadFileExternalApi(fotoFile);
                if (uploadResult) fotoURL = uploadResult.url;
            }

            // Update Auth profile
            await updateProfile(auth.currentUser, { displayName: nama, photoURL: fotoURL });
            // Update Firestore user document
            await updateDoc(doc(db, "users", auth.currentUser.uid), { namaLengkap: nama, photoURL: fotoURL });

            if (password) {
                await updatePassword(auth.currentUser, password);
            }
            showNotification("Profil berhasil diperbarui! Halaman akan dimuat ulang.");
            // Karena user state di AuthProvider mungkin tidak langsung update
            // Reload halaman untuk memastikan data profil terbaru terlihat
            setTimeout(() => router.reload(), 2000); 
        } catch (error) {
            console.error("Gagal update profil:", error);
            const message = error.code === 'auth/requires-recent-login' ? "Perlu login ulang untuk ganti password." : "Gagal update profil.";
            showNotification(message, "error");
        }
    };
    
    const handleDeleteKelas = async () => {
        if (!kelasToDelete) return;
        try {
            await deleteDoc(doc(db, 'kelas', kelasToDelete.id));
            await fetchKelas(); // Refresh daftar kelas
            showNotification('Kelas berhasil dihapus.');
        } catch (error) {
            console.error('Gagal menghapus kelas:', error);
            showNotification('Gagal menghapus kelas.', 'error');
        } finally {
            setShowDeleteModal(false);
            setKelasToDelete(null);
        }
    };

    const handleKelasClick = (id, namaKelas) => {
        localStorage.setItem('idKelas', id);
        localStorage.setItem('namaKelas', namaKelas);
        router.push('/guru/dashboard'); // Arahkan ke dashboard guru
    };

    const handleLogout = async () => {
        try {
            await logout(); // Panggil fungsi logout dari AuthProvider
            router.push('/auth/login');
        } catch (err) {
            showNotification("Gagal logout.", "error");
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-400 to-orange-600 p-4 sm:p-6 relative">
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50" ref={profileMenuRef}>
                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center space-x-3 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors backdrop-blur-sm">
                    <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.namaLengkap || 'G')}&background=ffffff&color=f97316`} alt="Profil" className="w-9 h-9 rounded-full object-cover" />
                    <span className="hidden md:block font-semibold text-white pr-2">{user?.namaLengkap || 'Guru'}</span>
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
            
            {/* Konten utama halaman */}
            <div className="w-full max-w-7xl mx-auto flex flex-col items-center pt-20">
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white">Pilih Kelas untuk Dikelola</h1>
                    <p className="text-white/90 mt-2">Selamat datang, {user?.namaLengkap || 'Guru'}!</p>
                </div>
                <div className="mb-6">
                    <button onClick={() => { setKelasToEdit(null); setShowKelasModal(true); }} className="flex items-center bg-white text-orange-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 shadow-lg transition">
                        <Plus size={20} className="mr-2" /> Buat Kelas Baru
                    </button>
                </div>
                
                {loading ? <p className="text-white/90 py-10">Memuat kelas...</p>
                 : kelasList.length === 0 ? (
                    <div className="bg-white/20 backdrop-blur p-6 rounded-lg text-center text-white w-full max-w-md">
                        <h2 className="text-xl font-semibold">Belum ada kelas</h2>
                        <p className="text-sm mt-2">Klik "Buat Kelas Baru" untuk memulai.</p>
                    </div>
                   ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                    {kelasList.map((kelas) => (
                        <div key={kelas.id} className="bg-white p-5 rounded-xl shadow hover:shadow-xl transition-all relative group cursor-pointer" onClick={() => handleKelasClick(kelas.id, kelas.namaKelas)}>
                            <div className="absolute top-3 right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); setKelasToEdit(kelas); setShowKelasModal(true); }} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded" title="Edit"><Pencil size={16} /></button>
                                <button onClick={(e) => { e.stopPropagation(); setKelasToDelete(kelas); setShowDeleteModal(true); }} className="text-red-500 hover:bg-red-50 p-1.5 rounded" title="Hapus"><Trash2 size={16} /></button>
                            </div>
                            <BookOpen className="text-orange-500 mb-3" size={32} />
                            <h3 className="text-lg font-bold text-gray-800 truncate">{kelas.namaKelas}</h3>
                            <p className="text-gray-600 text-sm mt-1 h-10 overflow-hidden">{kelas.keterangan}</p>
                        </div>
                    ))}
                    </div>
                   )}
            </div>

            {/* --- Render semua modal di sini --- */}
            {showKelasModal && <KelasModal show={showKelasModal} onClose={() => setShowKelasModal(false)} onSubmit={handleKelasSubmit} kelas={kelasToEdit} />}
            {showEditProfileModal && user && <EditProfileModal show={showEditProfileModal} onClose={() => setShowEditProfileModal(false)} onSubmit={handleProfileUpdate} user={user} />}
            {showDeleteModal && <DeleteConfirmModal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteKelas} itemName={kelasToDelete?.namaKelas} />}
            <Notification notification={notification} onClear={() => setNotification(null)} />
            
            <style jsx global>{`
              @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
              .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; opacity: 0; }
            `}</style>
        </div>
    );
}


// --- BAGIAN 3: KOMPONEN-KOMPONEN MODAL ---
function KelasModal({ show, onClose, onSubmit, kelas }) {
    const [namaKelas, setNamaKelas] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const isEditing = !!kelas; // True jika kelas ada (mode edit), false jika tidak (mode tambah)

    useEffect(() => {
        if (isEditing) {
            setNamaKelas(kelas.namaKelas);
            setKeterangan(kelas.keterangan);
        } else {
            setNamaKelas(''); // Reset untuk mode tambah
            setKeterangan(''); // Reset untuk mode tambah
        }
    }, [kelas, isEditing]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!namaKelas || !keterangan) return;

        // --- PERBAIKAN PENTING: Objek yang dikirim ke onSubmit ---
        const formData = { namaKelas, keterangan };
        if (isEditing) {
            formData.id = kelas.id; // Hanya tambahkan ID jika sedang dalam mode editing
        }
        
        onSubmit(formData); // Kirim data yang sudah bersih (tanpa 'id' jika mode tambah)
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-7 w-full max-w-lg relative animate-fade-in-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><X size={24} /></button>
                <h2 className="text-xl font-semibold mb-5 text-center">{isEditing ? 'Edit Kelas' : 'Buat Kelas Baru'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nama Kelas</label>
                        <input type="text" value={namaKelas} onChange={(e) => setNamaKelas(e.target.value)} required className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-orange-500 focus:border-orange-500" placeholder="Contoh: Fullstack Developer" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Keterangan</label>
                        <textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)} rows={3} required className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-orange-500 focus:border-orange-500" placeholder="Deskripsi singkat tentang kelas ini" />
                    </div>
                    <div className="flex justify-end space-x-3 pt-3">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-red-500 bg-gray-200 rounded-lg hover:bg-gray-300">Batal</button>
                        <button type="submit" className="px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">{isEditing ? 'Update Kelas' : 'Simpan Kelas'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function EditProfileModal({ show, onClose, onSubmit, user }) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [nama, setNama] = useState(user.namaLengkap || user.displayName || ''); // Fallback ke displayName
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [foto, setFoto] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.namaLengkap || user.displayName || 'U')}&background=f97316&color=fff&bold=true`); // Fallback lebih baik
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
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in-up">
                <div className="p-6 flex justify-between items-center border-b border-gray-300 relative">
                    <h2 className="text-lg font-semibold text-gray-800 absolute left-1/2 -translate-x-1/2">
                        Edit Profil
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 ml-auto">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <img
                                src={fotoPreview} // Menggunakan fotoPreview yang sudah di-fallback
                                alt="Foto Profil"
                                className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-md"
                            />
                            <label
                                htmlFor="fotoProfil"
                                className="absolute bottom-0 right-0 bg-orange-500 text-white p-1.5 rounded-full cursor-pointer hover:bg-orange-600 transition"
                            >
                                <Camera size={16} />
                                <input
                                    type="file"
                                    id="fotoProfil"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files[0]) {
                                            setFoto(e.target.files[0]);
                                            setFotoPreview(URL.createObjectURL(e.target.files[0]));
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                        <input
                            type="text"
                            value={nama}
                            onChange={(e) => setNama(e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-orange-500 focus:border-orange-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password Baru (opsional)
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Kosongkan jika tidak ganti"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Konfirmasi Password Baru
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="flex justify-end space-x-3 pt-4 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isUpdating}
                            className="px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center"
                        >
                            {isUpdating && <Loader className="animate-spin mr-2" size={16} />}
                            {isUpdating ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function DeleteConfirmModal({ show, onClose, onConfirm, itemName }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up">
                <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Konfirmasi Hapus</h3>
                <p className="text-gray-600 mb-6 text-sm">Anda yakin ingin menghapus <strong className="text-gray-900">{itemName}</strong>? Tindakan ini tidak dapat diurungkan.</p>
                <div className="flex justify-center space-x-3">
                    <button type="button" className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" onClick={onClose}>Batal</button>
                    <button type="button" className="px-5 py-2.5 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700" onClick={onConfirm}>Ya, Hapus</button>
                </div>
            </div>
        </div>
    );
}

