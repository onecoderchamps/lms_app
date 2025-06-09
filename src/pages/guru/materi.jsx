
import { useState, useEffect } from 'react'; 
import MainLayout from "./layouts/MainLayout";
import { FileText, Video, PlusCircle, X, ExternalLink, Trash2, Edit } from 'lucide-react'; // Tambah ikon Edit

export default function MateriPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [materiName, setMateriName] = useState('');
  const [materiType, setMateriType] = useState('pdf');
  const [materiUrl, setMateriUrl] = useState('');

  const [materis, setMateris] = useState([
    { id: 1, name: 'Materi Matematika Dasar: Aljabar', type: 'pdf', fileUrl: '/docs/contoh-matematika.pdf', videoEmbedUrl: null, content: null },
    { id: 2, name: 'Video Pengantar Fisika Kuantum', type: 'video', fileUrl: null, videoEmbedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', content: null },
    { id: 3, name: 'Modul Sejarah: Perang Dunia II', type: 'pdf', fileUrl: '/docs/contoh-sejarah.pdf', videoEmbedUrl: null, content: null },
    { id: 4, name: 'Tutorial Coding Dasar JavaScript', type: 'video', fileUrl: null, videoEmbedUrl: 'https://www.youtube.com/embed/PkZNo7MFNFg', content: null },
    { id: 5, name: 'Artikel: Konsep OOP', type: 'teks', fileUrl: null, videoEmbedUrl: null, content: 'Ini adalah isi artikel tentang OOP...' },
  ]);

  // --- State untuk Fitur Edit ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMateri, setEditingMateri] = useState(null); // Menyimpan objek materi yang diedit
  const [editedMateriName, setEditedMateriName] = useState('');
  const [editedMateriType, setEditedMateriType] = useState('pdf');
  const [selectedFile, setSelectedFile] = useState(null); // State untuk menyimpan file gambar yang dipilih
    const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [editedMateriUrl, setEditedMateriUrl] = useState('');
  // --- Akhir State untuk Fitur Edit ---

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [materiToDeleteId, setMateriToDeleteId] = useState(null);

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  const showCustomAlert = (message, type) => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const handleAddMateri = (e) => {
    e.preventDefault();
    if (!materiName.trim() || (materiType !== 'teks' && !materiUrl.trim()) || (materiType === 'teks' && !materiUrl.trim())) {
      showCustomAlert('Nama materi dan URL/Link/Konten wajib diisi!', 'error');
      return;
    }
    const newMateri = {
      id: Date.now(), name: materiName, type: materiType,
      fileUrl: (materiType === 'pdf' || materiType === 'link_eksternal') ? materiUrl : null,
      videoEmbedUrl: materiType === 'video' ? materiUrl : null,
      content: materiType === 'teks' ? materiUrl : null,
    };
    setMateris((prev) => [newMateri, ...prev]);
    setMateriName(''); setMateriType('pdf'); setMateriUrl('');
    setShowAddModal(false);
    showCustomAlert('Materi baru berhasil ditambahkan!', 'success');
  };

  // --- Fungsi untuk Fitur Edit ---
  const handleOpenEditModal = (materi) => {
    setEditingMateri(materi);
    setEditedMateriName(materi.name);
    setEditedMateriType(materi.type);
    let urlOrContent = '';
    if (materi.type === 'pdf' || materi.type === 'link_eksternal') urlOrContent = materi.fileUrl || '';
    else if (materi.type === 'video') urlOrContent = materi.videoEmbedUrl || '';
    else if (materi.type === 'teks') urlOrContent = materi.content || '';
    setEditedMateriUrl(urlOrContent);
    setShowEditModal(true);
  };

  const handleSaveEditMateri = (e) => {
    e.preventDefault();
    if (!editedMateriName.trim() || (editedMateriType !== 'teks' && !editedMateriUrl.trim()) || (editedMateriType === 'teks' && !editedMateriUrl.trim())) {
      showCustomAlert('Nama materi dan URL/Link/Konten wajib diisi untuk edit!', 'error');
      return;
    }
    setMateris(prevMateris => prevMateris.map(m => 
      m.id === editingMateri.id 
      ? { 
          ...m, 
          name: editedMateriName, 
          type: editedMateriType,
          fileUrl: (editedMateriType === 'pdf' || editedMateriType === 'link_eksternal') ? editedMateriUrl : null,
          videoEmbedUrl: editedMateriType === 'video' ? editedMateriUrl : null,
          content: editedMateriType === 'teks' ? editedMateriUrl : null,
        } 
      : m
    ));
    showCustomAlert('Data materi berhasil diperbarui!', 'success');
    setShowEditModal(false);
    setEditingMateri(null);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingMateri(null);
  };
  // --- Akhir Fungsi untuk Fitur Edit ---

  const confirmDeleteMateri = (id) => {
    setMateriToDeleteId(id);
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteMateri = () => {
    if (materiToDeleteId !== null) {
      setMateris((prev) => prev.filter((materi) => materi.id !== materiToDeleteId));
      showCustomAlert('Materi berhasil dihapus!', 'success');
      setMateriToDeleteId(null);
      setShowDeleteConfirmModal(false);
    }
  };

  const primaryButtonColor = "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500";
  const primaryButtonTextColor = "text-white";
  const inputFocusColor = "focus:ring-orange-500 focus:border-orange-500";

  const renderMateriFormFields = (isEdit = false) => {
    const nameVal = isEdit ? editedMateriName : materiName;
    const typeVal = isEdit ? editedMateriType : materiType;
    const urlVal = isEdit ? editedMateriUrl : materiUrl;
    const setName = isEdit ? setEditedMateriName : setMateriName;
    const setType = isEdit ? setEditedMateriType : setMateriType;
    const setUrl = isEdit ? setEditedMateriUrl : setMateriUrl;
    const idPrefix = isEdit ? "edited" : "";

    return (
      <>
        <div>
          <label htmlFor={`${idPrefix}MateriName`} className="block text-sm font-medium text-gray-700 mb-1">Nama Materi</label>
          <input type="text" id={`${idPrefix}MateriName`} value={nameVal} onChange={(e) => setName(e.target.value)}
            className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`}
            placeholder="Contoh: Pengenalan Aljabar Linier" required
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}MateriType`} className="block text-sm font-medium text-gray-700 mb-1">Jenis Materi</label>
          <select id={`${idPrefix}MateriType`} value={typeVal} onChange={(e) => setType(e.target.value)}
            className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150 bg-white`}
          >
            <option value="pdf">Dokumen PDF</option>
            <option value="video">Video Embed (YouTube, dll)</option>
            <option value="link_eksternal">Link Eksternal</option>
            <option value="teks">Teks / Artikel</option>
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}MateriUrl`} className="block text-sm font-medium text-gray-700 mb-1">
            {typeVal === 'pdf' ? 'URL File PDF' : 
             typeVal === 'video' ? 'URL Embed Video' :
             typeVal === 'link_eksternal' ? 'URL Link Eksternal' :
             'Konten Teks'}
          </label>
          {typeVal === 'teks' ? (
            <textarea id={`${idPrefix}MateriUrl`} value={urlVal} onChange={(e) => setUrl(e.target.value)}
              className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150 min-h-[120px]`}
              placeholder="Masukkan konten teks di sini..." required
            ></textarea>
          ) : (
            <input
              type="url" id={`${idPrefix}MateriUrl`} value={urlVal} onChange={(e) => setUrl(e.target.value)}
              className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`}
              placeholder={
                typeVal === 'pdf' ? 'https://example.com/dokumen.pdf' :
                typeVal === 'video' ? 'Contoh: https://www.youtube.com/embed/JG1y0tX4-3Q6' :
                'https://website-artikel.com/artikel-menarik'
              }
              required
            />
          )}
          <p className="text-xs text-gray-500 mt-1">
            {typeVal === 'pdf' ? 'Masukkan URL publik ke file PDF materi.' :
             typeVal === 'video' ? 'Masukkan URL embed video (misal dari YouTube).' :
             typeVal === 'link_eksternal' ? 'Masukkan URL lengkap ke halaman web atau sumber eksternal.' :
             'Tulis atau salin konten artikel/teks di sini.'}
          </p>
        </div>
      </>
    );
  };


  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manajemen Materi Ajar</h1>
            <button
              onClick={() => {
                  setMateriName(''); setMateriType('pdf'); setMateriUrl('');
                  setShowAddModal(true);
              }}
              className={`flex items-center space-x-2 ${primaryButtonColor} ${primaryButtonTextColor} px-5 py-2.5 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 text-sm font-medium`}
            >
              <PlusCircle size={20} />
              <span>Tambah Materi Baru</span>
            </button>
          </div>

          {materis.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-xl font-medium text-gray-500">Belum ada materi.</p>
              <p className="text-sm text-gray-400 mt-2">Klik "Tambah Materi Baru" untuk memulai.</p>
            </div>
          ) : (
            <ul className="space-y-5">
              {materis.map((materi, index) => (
                <li 
                  key={materi.id} 
                  className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between shadow-sm hover:shadow-lg transition-shadow duration-200 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center space-x-4 mb-4 sm:mb-0 flex-grow min-w-0">
                    <div className={`p-2.5 rounded-full ${
                      materi.type === 'pdf' ? 'bg-red-50 text-red-600' : 
                      materi.type === 'video' ? 'bg-blue-50 text-blue-600' :
                      materi.type === 'link_eksternal' ? 'bg-teal-50 text-teal-600' :
                      materi.type === 'teks' ? 'bg-indigo-50 text-indigo-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {materi.type === 'pdf' ? <FileText size={24} /> : 
                       materi.type === 'video' ? <Video size={24} /> : 
                       materi.type === 'link_eksternal' ? <ExternalLink size={24} /> :
                       <FileText size={24} />
                      }
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-semibold text-lg text-gray-800 truncate" title={materi.name}>{materi.name}</p>
                      <p className="text-sm text-gray-500 capitalize">{materi.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3 justify-start sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 sm:border-transparent flex-shrink-0 flex-wrap gap-2">
                    <a
                      href={materi.type === 'video' ? materi.videoEmbedUrl : materi.fileUrl || '#'}
                      target="_blank" rel="noreferrer"
                      className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-md transition duration-150"
                    > <ExternalLink size={16} className="mr-1.5" /> Lihat Materi </a>
                    <button
                        onClick={() => handleOpenEditModal(materi)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-100 transition-colors"
                        aria-label={`Edit materi ${materi.name}`}
                    > <Edit size={18} /> </button>
                    <button
                      onClick={() => confirmDeleteMateri(materi.id)}
                      className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-100 transition-colors"
                      aria-label={`Hapus materi ${materi.name}`}
                    > <Trash2 size={18} /> </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Modal Tambah Materi */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up my-8">
              <button onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-150"
                aria-label="Tutup modal"
              > <X size={24} /> </button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Tambah Materi Baru</h2>
              <form onSubmit={handleAddMateri} className="space-y-4">
                {renderMateriFormFields(false)}
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-300 text-sm font-medium"
                  > Batal </button>
                  <button type="submit"
                    className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 text-sm font-medium`}
                  > Simpan Materi </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Edit Materi --- BARU --- */}
        {showEditModal && editingMateri && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up my-8">
              <button onClick={handleCancelEdit}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-150"
                aria-label="Tutup modal"
              > <X size={24} /> </button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Edit Materi Ajar</h2>
              <form onSubmit={handleSaveEditMateri} className="space-y-4">
                {renderMateriFormFields(true)} {/* Menggunakan helper function untuk form fields */}
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
        {/* --- AKHIR MODAL EDIT MATERI --- */}


        {/* Modal Konfirmasi Hapus */}
        {showDeleteConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
             <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Konfirmasi Hapus</h3>
              <p className="text-gray-600 mb-6 text-sm">Apakah Anda yakin ingin menghapus materi ini? Aksi ini tidak dapat dibatalkan.</p>
              <div className="flex justify-center space-x-3">
                <button type="button"
                  className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-300 text-sm font-medium"
                  onClick={() => { setShowDeleteConfirmModal(false); setMateriToDeleteId(null); }}
                > Batal </button>
                <button type="button"
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-300 text-sm font-medium"
                  onClick={handleDeleteMateri}
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