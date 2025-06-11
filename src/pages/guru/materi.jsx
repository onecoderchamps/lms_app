
import React, { useState, useEffect, useRef } from 'react';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../../api/firebaseConfig"; // Pastikan path ini benar
import MainLayout from "./layouts/MainLayout"; // Pastikan path ini benar
import { PlusCircle, X, FileText, Video, ExternalLink, Trash2, Edit, BookText } from 'lucide-react';

const db = getFirestore(app);
const storage = getStorage(app);

export default function MateriPage() {
  const [materis, setMateris] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [materiToDelete, setMateriToDelete] = useState(null);

  // State untuk form tambah
  const [materiName, setMateriName] = useState("");
  const [materiType, setMateriType] = useState("pdf");
  const [materiUrl, setMateriUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const addFileInputRef = useRef(null);

  // State untuk form edit
  const [editingMateri, setEditingMateri] = useState(null);
  const [editedMateriName, setEditedMateriName] = useState("");
  const [editedMateriType, setEditedMateriType] = useState("pdf");
  const [editedMateriUrl, setEditedMateriUrl] = useState("");
  const [editedSelectedFile, setEditedSelectedFile] = useState(null);
  const editFileInputRef = useRef(null);

  // State untuk alert & animasi
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const q = query(collection(db, "materi"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMateris(data);
    }, (error) => {
      console.error("Error getting materi:", error);
      showCustomAlert('Gagal memuat data materi dari Firestore', 'error');
    });
    return () => unsubscribe();
  }, []);

  const showCustomAlert = (message, type = "success") => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const resetAddForm = () => {
    setMateriName(""); setMateriType("pdf"); setMateriUrl(""); setSelectedFile(null);
    if(addFileInputRef.current) addFileInputRef.current.value = "";
  };

  const handleAddMateri = async (e) => {
    e.preventDefault();
    if (!materiName.trim() || (materiType !== 'teks' && !materiUrl.trim() && !selectedFile)) {
      showCustomAlert("Nama materi dan file/URL/konten wajib diisi!", "error");
      return;
    }
    try {
      let finalUrl = materiUrl;
      if (materiType === "pdf" && selectedFile) {
        const fileRef = ref(storage, `materi/${Date.now()}_${selectedFile.name}`);
        const snapshot = await uploadBytes(fileRef, selectedFile);
        finalUrl = await getDownloadURL(snapshot.ref);
      }
      await addDoc(collection(db, "materi"), {
        name: materiName, type: materiType,
        fileUrl: (materiType === 'pdf' || materiType === 'link_eksternal') ? finalUrl : null,
        videoEmbedUrl: materiType === 'video' ? finalUrl : null,
        content: materiType === 'teks' ? materiUrl : null,
        createdAt: serverTimestamp()
      });
      resetAddForm();
      setShowAddModal(false);
      showCustomAlert("Materi berhasil ditambahkan!");
    } catch (err) {
      showCustomAlert("Gagal tambah materi: " + err.message, "error");
    }
  };

  const handleOpenEditModal = (materi) => {
    setEditingMateri(materi);
    setEditedMateriName(materi.name);
    setEditedMateriType(materi.type);
    setEditedMateriUrl(
      materi.type === "pdf" || materi.type === "link_eksternal" ? materi.fileUrl || "" :
      materi.type === "video" ? materi.videoEmbedUrl || "" :
      materi.content || ""
    );
    setShowEditModal(true);
    setEditedSelectedFile(null);
  };

  const handleSaveEditMateri = async (e) => {
    e.preventDefault();
    if (!editedMateriName.trim()) return showCustomAlert("Nama materi wajib diisi!", "error");
    if ((editedMateriType !== 'teks' && !editedMateriUrl.trim() && !editedSelectedFile)) return showCustomAlert("URL/Link/Konten wajib diisi!", "error");

    try {
      const materiDocRef = doc(db, "materi", editingMateri.id);
      let updatedData = {
        name: editedMateriName,
        type: editedMateriType,
        updatedAt: serverTimestamp()
      };
      let newUrl = editedMateriUrl;
      if (editedMateriType === "pdf" && editedSelectedFile) {
        const fileRef = ref(storage, `materi/${Date.now()}_${editedSelectedFile.name}`);
        await uploadBytes(fileRef, editedSelectedFile);
        newUrl = await getDownloadURL(fileRef);
      }
      updatedData.fileUrl = (editedMateriType === 'pdf' || editedMateriType === 'link_eksternal') ? newUrl : null;
      updatedData.videoEmbedUrl = editedMateriType === 'video' ? newUrl : null;
      updatedData.content = editedMateriType === 'teks' ? newUrl : null;
      
      await updateDoc(materiDocRef, updatedData);
      setShowEditModal(false);
      showCustomAlert("Materi berhasil diupdate!");
    } catch (err) {
      showCustomAlert("Gagal update materi: " + err.message, "error");
    }
  };
  
  const handleCancelEdit = () => setShowEditModal(false);

  const confirmDeleteMateri = (materi) => {
    setMateriToDelete(materi);
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteMateri = async () => {
    if (!materiToDelete) return;
    try {
      await deleteDoc(doc(db, "materi", materiToDelete.id));
      showCustomAlert("Materi berhasil dihapus!");
      setMateriToDelete(null);
      setShowDeleteConfirmModal(false);
    } catch (err) {
      showCustomAlert("Gagal hapus materi: " + err.message, "error");
    }
  };

  const primaryButtonColor = "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500";
  const primaryButtonTextColor = "text-white";
  const inputFocusColor = "focus:ring-orange-500 focus:border-orange-500";
  
  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className={`flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manajemen Materi Ajar</h1>
            <button
              onClick={() => { resetAddForm(); setShowAddModal(true); }}
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
                  className={`bg-white border border-gray-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between shadow-sm hover:shadow-lg transition-shadow duration-200 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: hasMounted ? `${(index * 0.05) + 0.2}s` : '0s' }}
                >
                  <div className="flex items-center space-x-4 mb-4 sm:mb-0 flex-grow min-w-0">
                    <div className={`p-2.5 rounded-full ${
                      materi.type === 'pdf' ? 'bg-red-50 text-red-600' : 
                      materi.type === 'video' ? 'bg-blue-50 text-blue-600' :
                      materi.type === 'link_eksternal' ? 'bg-teal-50 text-teal-600' :
                      'bg-indigo-50 text-indigo-600'
                    }`}>
                      {materi.type === 'pdf' ? <FileText size={24} /> : 
                       materi.type === 'video' ? <Video size={24} /> : 
                       materi.type === 'link_eksternal' ? <ExternalLink size={24} /> :
                       <BookText size={24} /> 
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
                      onClick={() => confirmDeleteMateri(materi)}
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
                {/* --- FORM FIELDS UNTUK TAMBAH MATERI DI SINI --- */}
                <div>
                  <label htmlFor="addMateriName" className="block text-sm font-medium text-gray-700 mb-1">Nama Materi</label>
                  <input type="text" id="addMateriName" value={materiName} onChange={(e) => setMateriName(e.target.value)}
                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`}
                    placeholder="Contoh: Pengenalan Aljabar Linier" required
                  />
                </div>
                <div>
                  <label htmlFor="addMateriType" className="block text-sm font-medium text-gray-700 mb-1">Jenis Materi</label>
                  <select id="addMateriType" value={materiType} onChange={(e) => { setMateriType(e.target.value); setMateriUrl(''); setSelectedFile(null); }}
                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150 bg-white`}
                  >
                    <option value="pdf">Dokumen PDF</option>
                    <option value="video">Video Embed</option>
                    <option value="link_eksternal">Link Eksternal</option>
                    <option value="teks">Teks / Artikel</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="addMateriUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    {materiType === 'pdf' ? 'Upload File PDF' : 
                     materiType === 'video' ? 'URL Embed Video' :
                     materiType === 'link_eksternal' ? 'URL Link Eksternal' :
                     'Konten Teks'}
                  </label>
                  {materiType === 'pdf' ? (
                      <input type="file" id="addMateriFile" onChange={(e) => setSelectedFile(e.target.files[0])}
                          className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 ${inputFocusColor} border border-gray-300 rounded-lg cursor-pointer`}
                          accept="application/pdf" required />
                  ) : materiType === 'teks' ? (
                      <textarea id="addMateriUrl" value={materiUrl} onChange={(e) => setMateriUrl(e.target.value)}
                          className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150 min-h-[120px]`}
                          placeholder="Masukkan konten teks di sini..." required
                      ></textarea>
                  ) : (
                      <input
                      type="url" id="addMateriUrl" value={materiUrl} onChange={(e) => setMateriUrl(e.target.value)}
                      className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`}
                      placeholder={materiType === 'video' ? 'Contoh: https://www.youtube.com/embed/JG1y0tX4-3Q6' : 'https://website-artikel.com/artikel-menarik'}
                      required
                      />
                  )}
                </div>
                {/* --- AKHIR FORM FIELDS --- */}
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  > Batal </button>
                  <button type="submit"
                    className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md`}
                  > Simpan Materi </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Edit Materi */}
        {showEditModal && editingMateri && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up my-8">
              <button onClick={handleCancelEdit}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-150"
                aria-label="Tutup modal"
              > <X size={24} /> </button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Edit Materi Ajar</h2>
              <form onSubmit={handleSaveEditMateri} className="space-y-4">
                {/* --- FORM FIELDS UNTUK EDIT MATERI DI SINI --- */}
                <div>
                  <label htmlFor="editedMateriName" className="block text-sm font-medium text-gray-700 mb-1">Nama Materi</label>
                  <input type="text" id="editedMateriName" value={editedMateriName} onChange={(e) => setEditedMateriName(e.target.value)}
                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`} required />
                </div>
                <div>
                  <label htmlFor="editedMateriType" className="block text-sm font-medium text-gray-700 mb-1">Jenis Materi</label>
                  <select id="editedMateriType" value={editedMateriType} onChange={(e) => { setEditedMateriType(e.target.value); setEditedSelectedFile(null); }}
                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150 bg-white`} >
                    <option value="pdf">Dokumen PDF</option>
                    <option value="video">Video Embed</option>
                    <option value="link_eksternal">Link Eksternal</option>
                    <option value="teks">Teks</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="editedMateriUrl" className="block text-sm font-medium text-gray-700 mb-1">{/* ... (Label dinamis) ... */}</label>
                  {editedMateriType === 'pdf' ? (
                      <>
                        <p className="text-xs mb-1 text-gray-500">File saat ini: <a href={editedMateriUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">{editedMateriUrl.split('%2F').pop().split('?')[0].replace('materi_','')}</a></p>
                        <input type="file" id="editedMateriFile" onChange={(e) => setEditedSelectedFile(e.target.files[0])}
                            className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 ${inputFocusColor} border border-gray-300 rounded-lg cursor-pointer`}
                            accept="application/pdf" />
                        <p className="text-xs text-gray-500 mt-1">Pilih file baru jika ingin mengganti.</p>
                      </>
                  ) : editedMateriType === 'teks' ? (
                      <textarea id="editedMateriUrl" value={editedMateriUrl} onChange={(e) => setEditedMateriUrl(e.target.value)}
                          className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150 min-h-[120px]`}
                          required
                      ></textarea>
                  ) : (
                      <input type="url" id="editedMateriUrl" value={editedMateriUrl} onChange={(e) => setEditedMateriUrl(e.target.value)}
                        className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`} required />
                  )}
                </div>
                {/* --- AKHIR FORM FIELDS --- */}
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={handleCancelEdit}
                    className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  > Batal </button>
                  <button type="submit"
                    className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md`}
                  > Simpan Perubahan </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Hapus */}
        {showDeleteConfirmModal && materiToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Konfirmasi Hapus</h3>
              <p className="text-gray-600 mb-6 text-sm">Apakah Anda yakin ingin menghapus materi <br/><strong className="text-gray-900">{materiToDelete.name}</strong>?</p>
              <div className="flex justify-center space-x-3">
                <button type="button" className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  onClick={() => setShowDeleteConfirmModal(false)}
                > Batal </button>
                <button type="button" className="px-5 py-2.5 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700"
                  onClick={handleDeleteMateri}
                > Ya, Hapus </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Alert */}
        {showAlertModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
             <div className={`bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up border-t-4 ${
            alertType === 'success' ? 'border-green-500' : 'border-red-500'
          }`}>
            <h3 className={`text-xl font-semibold mb-3 ${
              alertType === 'success' ? 'text-green-700' : 'text-red-700'
            }`}>{alertType === 'success' ? 'Berhasil!' : 'Terjadi Kesalahan!'}</h3>
            <p className="text-gray-600 mb-6 text-sm">{alertMessage}</p>
            <button type="button"
              className={`px-6 py-2.5 rounded-lg shadow-md ${
                alertType === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
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