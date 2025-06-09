import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/api/firebaseConfig';
import { useAuth } from '@/component/AuthProvider';

export default function GuruDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [kelasList, setKelasList] = useState([]);
  const [namaKelas, setNamaKelas] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const resetForm = () => {
    setNamaKelas('');
    setKeterangan('');
    setEditId(null);
  };

  const fetchKelas = async () => {
    if (!user) return;
    const q = query(collection(db, 'kelas'), where('uid', '==', user.uid));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setKelasList(data);
  };

  useEffect(() => {
    fetchKelas();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (user.role !== 'guru') {
      alert('Kamu tidak diizinkan menambah kelas');
      return;
    }

    const newKelas = {
      namaKelas,
      keterangan,
      uid: user.uid,
    };

    try {
      if (editId) {
        await updateDoc(doc(db, 'kelas', editId), newKelas);
      } else {
        await addDoc(collection(db, 'kelas'), newKelas);
      }
      await fetchKelas();
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving kelas:', error);
    }
  };

  const handleEdit = (kelas) => {
    setNamaKelas(kelas.namaKelas);
    setKeterangan(kelas.keterangan);
    setEditId(kelas.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'kelas', id));
      await fetchKelas();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleKelasClick = (id) => {
    localStorage.setItem('idKelas', id);
    router.push('/guru/dashboard');
  };

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Manajemen Kelas: {user?.namaLengkap}</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow"
        >
          <Plus size={18} className="mr-1" />
          Tambah Kelas
        </button>
      </div>

      {/* Daftar Kelas dalam Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {kelasList.length === 0 ? (
          <p className="text-gray-500">Belum ada kelas.</p>
        ) : (
          kelasList.map((kelas) => (
            <div
              key={kelas.id}
              onClick={() => handleKelasClick(kelas.id)}
              className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition relative"
            >
              <div className="mb-2">
                <h2 className="text-lg font-semibold">{kelas.namaKelas}</h2>
                <p className="text-gray-600 text-sm">{kelas.keterangan}</p>
              </div>
              <div
                className="absolute top-2 right-2 flex space-x-2"
                onClick={(e) => e.stopPropagation()} // Prevent redirect on edit/delete
              >
                <button onClick={() => handleEdit(kelas)} className="text-blue-600 hover:text-blue-800">
                  <Pencil size={18} />
                </button>
                <button onClick={() => handleDelete(kelas.id)} className="text-red-600 hover:text-red-800">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold mb-4">
              {editId ? 'Edit Kelas' : 'Tambah Kelas'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nama Kelas</label>
                <input
                  type="text"
                  value={namaKelas}
                  onChange={(e) => setNamaKelas(e.target.value)}
                  required
                  className="mt-1 w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Keterangan</label>
                <textarea
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  required
                  className="mt-1 w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowModal(false);
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
                >
                  {editId ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
