import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Pencil, Trash2, Plus, Settings, User, LogOut, BookOpen, X /*, Camera*/ } from 'lucide-react';
import {
  collection, addDoc, getDocs, doc,
  updateDoc, deleteDoc, query, where, serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { updateProfile, updatePassword } from 'firebase/auth';
// --- Impor untuk Storage dinonaktifkan ---
// import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth } from '../../api/firebaseConfig';
import { useAuth } from '@/component/AuthProvider';

export default function GuruManajemenKelasPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // State untuk modal Buat/Edit Kelas
  const [kelasList, setKelasList] = useState([]);
  const [namaKelas, setNamaKelas] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuRef = useRef(null);
  
  // State untuk modal Edit Profil
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editNama, setEditNama] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  // --- State untuk foto dinonaktifkan ---
  // const [editFoto, setEditFoto] = useState(null);
  // const [editFotoPreview, setEditFotoPreview] = useState('');

  const fetchKelas = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const kelasRef = collection(db, 'kelas');
      const q = query(kelasRef, where('guruId', '==', user.uid), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setKelasList(data);
    } catch (error) {
      console.error('Gagal mengambil kelas:', error);
      if (error.code === 'failed-precondition') {
        alert("Query memerlukan indeks. Silakan periksa console browser (F12) untuk link pembuatan indeks dari Firebase.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
        fetchKelas();
    } else {
        setLoading(false);
    }
  }, [user]);

  const resetForm = () => {
    setNamaKelas('');
    setKeterangan('');
    setEditId(null);
  };

  const handleSubmitKelas = async (e) => {
    e.preventDefault();
    if (!namaKelas || !keterangan) return;
    try {
      const isEditing = !!editId;
      if (isEditing) {
        await updateDoc(doc(db, 'kelas', editId), { namaKelas, keterangan });
      } else {
        await addDoc(collection(db, 'kelas'), {
          namaKelas, keterangan, guruId: user.uid, createdAt: serverTimestamp(),
        });
      }
      resetForm();
      setShowModal(false);
      await fetchKelas();
      alert(isEditing ? 'Kelas berhasil diperbarui!' : 'Kelas baru berhasil dibuat!');
    } catch (error) {
      console.error('Gagal menyimpan kelas:', error);
      alert('Gagal menyimpan kelas.');
    }
  };

  const handleEditKelas = (kelas) => {
    setNamaKelas(kelas.namaKelas);
    setKeterangan(kelas.keterangan);
    setEditId(kelas.id);
    setShowModal(true);
  };

  const handleDeleteKelas = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus kelas ini?')) {
      try {
        await deleteDoc(doc(db, 'kelas', id));
        await fetchKelas();
        alert('Kelas berhasil dihapus.');
      } catch (error) {
        console.error('Gagal menghapus kelas:', error);
        alert('Gagal menghapus kelas.');
      }
    }
  };

  const handleKelasClick = (id, namaKelas) => {
    localStorage.setItem('idKelas', id);
    localStorage.setItem('namaKelas', namaKelas);
    router.push('/guru/dashboard');
  };
  
  const handleOpenEditModal = () => {
    if (user) {
      setEditNama(user.namaLengkap || '');
      setEditPassword('');
      setEditConfirmPassword('');
      // --- Logika untuk foto dinonaktifkan ---
      // setEditFotoPreview(user.photoURL || '');
      // setEditFoto(null);
      setShowEditProfileModal(true);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
        alert("Sesi Anda telah berakhir. Silakan login kembali.");
        return;
    }
    if (editPassword && editPassword !== editConfirmPassword) {
        alert("Password dan konfirmasi password tidak cocok!");
        return;
    }
    setIsUpdating(true);
    try {
      // --- Logika upload foto dinonaktifkan ---
      // let fotoURL = user.photoURL;
      // if (editFoto) {
      //   const storage = getStorage();
      //   const storageRef = ref(storage, `profile_pictures/${user.uid}`);
      //   await uploadBytes(storageRef, editFoto);
      //   fotoURL = await getDownloadURL(storageRef);
      // }

      await updateProfile(auth.currentUser, { 
        displayName: editNama, 
        // photoURL: fotoURL 
      });

      await updateDoc(doc(db, "users", user.uid), { 
        namaLengkap: editNama, 
        // photoURL: fotoURL
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
      if (error.code === 'auth/requires-recent-login') {
          alert("Untuk mengubah password, Anda perlu login kembali demi keamanan.");
      } else {
          alert("Gagal memperbarui profil: " + error.message);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target)) {
        setShowSettingsMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-orange-400 to-orange-600 p-6">
        <div className="absolute top-4 right-4" ref={settingsMenuRef}>
          <button onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className="bg-white/20 text-white hover:bg-white/30 p-2.5 rounded-full"
            title="Pengaturan"
          >
            <Settings size={22} />
          </button>
          {showSettingsMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-50">
              <div className="p-2">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-gray-800">{user?.namaLengkap || 'Guru'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <div className="h-px bg-gray-200 my-2" />
                <button onClick={handleOpenEditModal} className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md w-full">
                  <User size={16} className="mr-2" />
                  Edit Profil
                </button>
                <div className="h-px bg-gray-200 my-2" />
                <button onClick={handleLogout} className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md w-full">
                  <LogOut size={16} className="mr-2" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto flex flex-col items-center">
            <div className="text-center my-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white">Pilih Kelas untuk Dikelola</h1>
              <p className="text-white mt-2">Selamat datang, {user?.namaLengkap || 'Guru'}!</p>
            </div>
            <div className="mb-6">
              <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center bg-white text-orange-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 shadow-lg">
                <Plus size={20} className="mr-2" /> Buat Kelas Baru
              </button>
            </div>
            
            {loading ? (
                <p className="text-white/90 py-10">Memuat kelas...</p>
            ) : kelasList.length === 0 ? (
                <div className="bg-white/20 backdrop-blur p-6 rounded-lg text-center text-white w-full max-w-md">
                    <h2 className="text-xl font-semibold">Belum ada kelas</h2>
                    <p className="text-sm mt-2">Klik "Buat Kelas Baru" untuk memulai.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {kelasList.map((kelas) => (
                    <div key={kelas.id} className="bg-white p-5 rounded-xl shadow hover:shadow-xl transition relative group">
                    <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); handleEditKelas(kelas); }}
                        className="text-blue-500 hover:bg-blue-50 p-1.5 rounded" title="Edit">
                        <Pencil size={16} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteKelas(kelas.id); }}
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded" title="Hapus">
                        <Trash2 size={16} />
                        </button>
                    </div>
                    <div onClick={() => handleKelasClick(kelas.id, kelas.namaKelas)} className="cursor-pointer">
                        <BookOpen className="text-orange-500 mb-3" size={28} />
                        <h3 className="text-lg font-bold text-gray-800">{kelas.namaKelas}</h3>
                        <p className="text-gray-600 text-sm mt-1">{kelas.keterangan}</p>
                    </div>
                    </div>
                ))}
                </div>
            )}
        </div>
      </div>
      
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg relative animate-fade-in-up">
            <button onClick={() => { resetForm(); setShowModal(false); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
              <X size={24} />
            </button>
            <h2 className="text-xl font-semibold mb-4 text-center">{editId ? 'Edit Kelas' : 'Buat Kelas Baru'}</h2>
            <form onSubmit={handleSubmitKelas} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama Kelas</label>
                <input type="text" value={namaKelas} onChange={(e) => setNamaKelas(e.target.value)} required
                  className="w-full border px-4 py-2 rounded-md focus:ring-orange-500 focus:border-orange-500" placeholder="Contoh: Matematika Kelas 9" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Keterangan</label>
                <textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)} rows={3} required
                  className="w-full border px-4 py-2 rounded-md focus:ring-orange-500 focus:border-orange-500" placeholder="Deskripsi singkat tentang kelas ini" />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => { resetForm(); setShowModal(false); }}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Batal</button>
                <button type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
                  {editId ? 'Update Kelas' : 'Simpan Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in-up">
            <div className="p-6 flex justify-between items-center border-b">
              <h2 className="text-lg font-semibold text-gray-800">Edit Profil</h2>
              <button onClick={() => setShowEditProfileModal(false)} className="text-gray-400 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
              {/*
              <div className="flex flex-col items-center space-y-2">
                  <div className="relative">
                      <img src={editFotoPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.namaLengkap || '..')}&background=f97316&color=fff&bold=true`} alt="Foto Profil" className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-md"/>
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
              */}
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