
import { useState, useEffect } from 'react';

import MainLayout from "./layouts/MainLayout";
import { FileText, Video, PlusCircle, X, ExternalLink, Trash2, BookText, Edit } from 'lucide-react';

export default function TugasPage() {
  const [showAddTugasModal, setShowAddTugasModal] = useState(false);
  const [tugasName, setTugasName] = useState('');
  const [kelas, setKelas] = useState('');
  const [fileTugasUrl, setFileTugasUrl] = useState('');
  const [fileVideoPenjelasanUrl, setFileVideoPenjelasanUrl] = useState('');

  const [tugas, setTugas] = useState([
    {
      id: 1, name: 'Tugas Matematika: Persamaan Linear', kelas: '10 IPA 1',
      fileTugasUrl: '/docs/tugas-matematika.pdf',
      fileVideoPenjelasanUrl: 'https://www.youtube.com/embed/example1',
    },
    {
      id: 2, name: 'Tugas Bahasa Inggris: Descriptive Text', kelas: '11 IPS 1',
      fileTugasUrl: '/docs/tugas-inggris.docx', fileVideoPenjelasanUrl: null,
    },
    {
      id: 3, name: 'Tugas Fisika: Hukum Newton', kelas: '10 IPA 2',
      fileTugasUrl: '/docs/tugas-fisika.pdf',
      fileVideoPenjelasanUrl: 'https://www.youtube.com/embed/example2',
    },
  ]);

  const classOptions = ['10 IPA 1', '10 IPA 2', '10 IPS 1', '11 IPA 1', '11 IPS 1', '12 IPA 1', '12 IPA 2', '12 IPS 1'];

  // --- State untuk Fitur Edit ---
  const [showEditTugasModal, setShowEditTugasModal] = useState(false);
  const [editingTugas, setEditingTugas] = useState(null);
  const [editedTugasName, setEditedTugasName] = useState('');
  const [editedKelas, setEditedKelas] = useState('');
  const [editedFileTugasUrl, setEditedFileTugasUrl] = useState('');
  const [editedFileVideoPenjelasanUrl, setEditedFileVideoPenjelasanUrl] = useState('');
  // --- Akhir State untuk Fitur Edit ---

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [tugasToDeleteId, setTugasToDeleteId] = useState(null);

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  const showCustomAlert = (message, type) => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const handleAddTugas = (e) => {
    e.preventDefault();
    if (!tugasName.trim() || !kelas || !fileTugasUrl.trim()) {
      showCustomAlert('Nama Tugas, Kelas, dan URL File Tugas wajib diisi!', 'error');
      return;
    }
    const newTugas = {
      id: Date.now(), name: tugasName, kelas, fileTugasUrl,
      fileVideoPenjelasanUrl: fileVideoPenjelasanUrl.trim() || null,
    };
    setTugas((prev) => [newTugas, ...prev]);
    setShowAddTugasModal(false);
    setTugasName(''); setKelas(''); setFileTugasUrl(''); setFileVideoPenjelasanUrl('');
    showCustomAlert('Tugas berhasil ditambahkan!', 'success');
  };

  // --- Fungsi untuk Fitur Edit ---
  const handleOpenEditModal = (tugasItem) => {
    setEditingTugas(tugasItem);
    setEditedTugasName(tugasItem.name);
    setEditedKelas(tugasItem.kelas);
    setEditedFileTugasUrl(tugasItem.fileTugasUrl);
    setEditedFileVideoPenjelasanUrl(tugasItem.fileVideoPenjelasanUrl || '');
    setShowEditTugasModal(true);
  };

  const handleSaveEditTugas = (e) => {
    e.preventDefault();
    if (!editedTugasName.trim() || !editedKelas || !editedFileTugasUrl.trim()) {
      showCustomAlert('Nama Tugas, Kelas, dan URL File Tugas wajib diisi untuk edit!', 'error');
      return;
    }
    setTugas(prevTugas => prevTugas.map(t => 
      t.id === editingTugas.id 
      ? { 
          ...t, 
          name: editedTugasName, 
          kelas: editedKelas, 
          fileTugasUrl: editedFileTugasUrl,
          fileVideoPenjelasanUrl: editedFileVideoPenjelasanUrl.trim() || null,
        } 
      : t
    ));
    showCustomAlert('Data tugas berhasil diperbarui!', 'success');
    setShowEditTugasModal(false);
    setEditingTugas(null);
  };

  const handleCancelEdit = () => {
    setShowEditTugasModal(false);
    setEditingTugas(null);
  };
  // --- Akhir Fungsi untuk Fitur Edit ---

  const confirmDeleteTugas = (id) => {
    setTugasToDeleteId(id);
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteTugas = () => {
    if (tugasToDeleteId !== null) {
      setTugas((prev) => prev.filter((item) => item.id !== tugasToDeleteId));
      showCustomAlert('Tugas berhasil dihapus!', 'success');
      setTugasToDeleteId(null);
      setShowDeleteConfirmModal(false);
    }
  };
  
  const primaryButtonColor = "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500";
  const primaryButtonTextColor = "text-white";
  const inputFocusColor = "focus:ring-orange-500 focus:border-orange-500";

  // Helper function untuk merender field form (digunakan oleh modal Tambah & Edit)
  const renderTugasFormFields = (isEditMode) => {
    const currentName = isEditMode ? editedTugasName : tugasName;
    const setName = isEditMode ? setEditedTugasName : setTugasName;
    const currentKelas = isEditMode ? editedKelas : kelas;
    const setKelasState = isEditMode ? setEditedKelas : setKelas;
    const currentFileUrl = isEditMode ? editedFileTugasUrl : fileTugasUrl;
    const setFileUrl = isEditMode ? setEditedFileTugasUrl : setFileTugasUrl;
    const currentVideoUrl = isEditMode ? editedFileVideoPenjelasanUrl : fileVideoPenjelasanUrl;
    const setVideoUrl = isEditMode ? setEditedFileVideoPenjelasanUrl : setFileVideoPenjelasanUrl;
    const idPrefix = isEditMode ? "edited" : "";

    return (
      <>
        <div>
          <label htmlFor={`${idPrefix}TugasName`} className="block text-sm font-medium text-gray-700 mb-1">Nama Tugas</label>
          <input type="text" id={`${idPrefix}TugasName`} value={currentName} onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Tugas Matematika Bab Persamaan Linear"
            className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`} required />
        </div>
        <div>
          <label htmlFor={`${idPrefix}KelasSelect`} className="block text-sm font-medium text-gray-700 mb-1">Pilih Kelas</label>
          <select id={`${idPrefix}KelasSelect`} value={currentKelas} onChange={(e) => setKelasState(e.target.value)}
            className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150 bg-white`} required >
            <option value="">Pilih Kelas</option>
            {classOptions.map((option) => (<option key={option} value={option}>{option}</option>))}
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}FileTugasUrl`} className="block text-sm font-medium text-gray-700 mb-1">URL File Tugas (PDF/DOC)</label>
          <input type="url" id={`${idPrefix}FileTugasUrl`} value={currentFileUrl} onChange={(e) => setFileUrl(e.target.value)}
            placeholder="Contoh: https://example.com/tugas.pdf"
            className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`} required />
          <p className="text-xs text-gray-500 mt-1">Masukkan URL langsung ke file tugas.</p>
        </div>
        <div>
          <label htmlFor={`${idPrefix}FileVideoPenjelasanUrl`} className="block text-sm font-medium text-gray-700 mb-1">URL Video Penjelasan (opsional)</label>
          <input type="url" id={`${idPrefix}FileVideoPenjelasanUrl`} value={currentVideoUrl} onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Contoh: https://www.youtube.com/embed/..."
            className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`} />
          <p className="text-xs text-gray-500 mt-1">Masukkan URL embed video jika ada.</p>
        </div>
      </>
    );
  };

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manajemen Tugas</h1>
            <button
              onClick={() => {
                setTugasName(''); setKelas(''); setFileTugasUrl(''); setFileVideoPenjelasanUrl('');
                setShowAddTugasModal(true);
              }}
              className={`flex items-center space-x-2 ${primaryButtonColor} ${primaryButtonTextColor} px-5 py-2.5 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 text-sm font-medium`}
            >
              <PlusCircle size={20} />
              <span>Tambah Tugas Baru</span>
            </button>
          </div>

          {tugas.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-xl font-medium text-gray-500">Belum ada tugas.</p>
              <p className="text-sm text-gray-400 mt-2">Klik "Tambah Tugas Baru" untuk menambahkan.</p>
            </div>
          ) : (
            <ul className="space-y-5">
              {tugas.map((item, index) => (
                <li 
                  key={item.id} 
                  className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between shadow-sm hover:shadow-lg transition-shadow duration-200 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center space-x-4 mb-4 sm:mb-0 flex-grow min-w-0">
                    <div className="p-2.5 bg-green-50 text-green-600 rounded-full"> {/* Warna ikon disesuaikan untuk tugas */}
                      <Edit size={24} /> {/* Ikon Edit bisa juga BookText atau FilePenLine */}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-semibold text-lg text-gray-800 truncate" title={item.name}>{item.name}</p>
                      <p className="text-sm text-gray-500">Kelas: {item.kelas}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3 justify-start sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 sm:border-transparent flex-shrink-0 flex-wrap gap-2">
                    <a
                      href={item.fileTugasUrl} target="_blank" rel="noreferrer"
                      className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-md transition duration-150"
                    > <FileText size={16} className="mr-1.5" /> Lihat Tugas </a>
                    {item.fileVideoPenjelasanUrl && (
                      <a
                        href={item.fileVideoPenjelasanUrl} target="_blank" rel="noreferrer"
                        className="flex items-center text-sm font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3.5 py-2 rounded-md transition duration-150"
                      > <Video size={16} className="mr-1.5" /> Lihat Video </a>
                    )}
                    <button
                        onClick={() => handleOpenEditModal(item)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-100 transition-colors"
                        aria-label={`Edit tugas ${item.name}`}
                    > <Edit size={18} /> </button> 
                    <button
                      onClick={() => confirmDeleteTugas(item.id)}
                      className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-100 transition-colors"
                      aria-label={`Hapus tugas ${item.name}`}
                    > <Trash2 size={18} /> </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Modal Tambah Tugas */}
        {showAddTugasModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
             <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up my-8">
              <button onClick={() => setShowAddTugasModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-150"
                aria-label="Tutup modal"
              > <X size={24} /> </button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Tambah Tugas Baru</h2>
              <form onSubmit={handleAddTugas} className="space-y-4">
                {renderTugasFormFields(false)} {/* Menggunakan helper function */}
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowAddTugasModal(false)}
                    className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-300 text-sm font-medium"
                  > Batal </button>
                  <button type="submit"
                    className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 text-sm font-medium`}
                  > Upload Tugas </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Modal Edit Tugas */}
        {showEditTugasModal && editingTugas && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up my-8">
              <button onClick={handleCancelEdit}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-150"
                aria-label="Tutup modal"
              > <X size={24} /> </button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Edit Tugas</h2>
              <form onSubmit={handleSaveEditTugas} className="space-y-4">
                {renderTugasFormFields(true)} {/* Menggunakan helper function */}
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={handleCancelEdit}
                    className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-300 text-sm font-medium"
                  > Batal </button>
                  <button type="submit"
                    className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 text-sm font-medium`}
                  > Simpan Perubahan </button>
                </div>
              </form>
            </div>
          </div>
        )}


        {/* Modal Konfirmasi Hapus */}
        {showDeleteConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
             <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Konfirmasi Hapus</h3>
              <p className="text-gray-600 mb-6 text-sm">Apakah Anda yakin ingin menghapus tugas ini? Aksi ini tidak dapat dibatalkan.</p>
              <div className="flex justify-center space-x-3">
                <button type="button"
                  className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-300 text-sm font-medium"
                  onClick={() => { setShowDeleteConfirmModal(false); setTugasToDeleteId(null); }}
                > Batal </button>
                <button type="button"
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-300 text-sm font-medium"
                  onClick={handleDeleteTugas}
                > Ya, Hapus </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Alert (Sukses/Error) */}
        {showAlertModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className={`bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up ${
            alertType === 'success' ? 'border-t-4 border-green-500' : 'border-t-4 border-red-500'
          }`}>
            <h3 className={`text-xl font-semibold mb-3 ${
              alertType === 'success' ? 'text-green-700' : 'text-red-700'
            }`}>
              {alertType === 'success' ? 'Berhasil!' : 'Terjadi Kesalahan!'}
            </h3>
            <p className="text-gray-600 mb-6 text-sm">{alertMessage}</p>
            <button type="button"
              className={`px-6 py-2.5 rounded-lg shadow-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm font-medium ${
                alertType === 'success' ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500' : 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
              }`}
              onClick={() => setShowAlertModal(false)}
            > Oke </button>
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