import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { app } from "../../api/firebaseConfig"; // Sesuaikan path jika perlu
import MainLayout from "./layouts/MainLayout"; // Sesuaikan path jika perlu
import { PlusCircle, X, FileText, Video, ExternalLink, Trash2, Edit, BookText } from 'lucide-react';

const db = getFirestore(app);
const storage = getStorage(app);

export default function MateriPage() {
  const router = useRouter();
  const [materis, setMateris] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeClass, setActiveClass] = useState({ id: null, name: null });

  // State untuk modal & form
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showViewTextModal, setShowViewTextModal] = useState(false);
  const [materiToView, setMateriToView] = useState(null);
  const [materiToDelete, setMateriToDelete] = useState(null);

  // State form tambah
  const [materiName, setMateriName] = useState("");
  const [materiType, setMateriType] = useState("pdf");
  const [materiUrl, setMateriUrl] = useState("");
  const [materiContent, setMateriContent] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const addFileInputRef = useRef(null);
  const addCoverImageInputRef = useRef(null);

  // State form edit
  const [editingMateri, setEditingMateri] = useState(null);
  const [editedMateriName, setEditedMateriName] = useState("");
  const [editedMateriType, setEditedMateriType] = useState("pdf");
  const [editedMateriUrl, setEditedMateriUrl] = useState("");
  const [editedMateriContent, setEditedMateriContent] = useState("");
  const [editedCoverImage, setEditedCoverImage] = useState(null);
  const [editedSelectedFile, setEditedSelectedFile] = useState(null);
  const editFileInputRef = useRef(null);
  const editCoverImageInputRef = useRef(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk notifikasi/alert
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const classId = localStorage.getItem('idKelas');
    const className = localStorage.getItem('namaKelas');
    if (classId && className) {
      setActiveClass({ id: classId, name: className });
    }
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!activeClass.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, "materi"), 
      where("kelas", "==", activeClass.id),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMateris(data);
      setLoading(false);
    }, (error) => {
      console.error("Error getting materi:", error);
      showCustomAlert('Gagal memuat data materi.', 'error');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [activeClass.id]);

  const showCustomAlert = (message, type = "success") => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const resetAddForm = () => {
    setMateriName(""); setMateriType("pdf"); setMateriUrl("");
    setMateriContent(""); setSelectedFile(null); setCoverImage(null);
    if (addFileInputRef.current) addFileInputRef.current.value = "";
    if (addCoverImageInputRef.current) addCoverImageInputRef.current.value = "";
  };
  
  const uploadFile = async (file, path) => {
    if (!file) return null;
    const filePath = `${path}/${Date.now()}_${file.name}`;
    const fileRef = ref(storage, filePath);
    await uploadBytesResumable(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    return { url: downloadURL, path: filePath };
  };

  const handleAddMateri = async (e) => {
    e.preventDefault();
    if (!materiName.trim()) return showCustomAlert("Nama materi wajib diisi!", "error");
    if (materiType === 'pdf' && !selectedFile) return showCustomAlert("Silakan pilih file PDF.", "error");
    if ((materiType === 'video' || materiType === 'link_eksternal') && !materiUrl.trim()) return showCustomAlert("URL wajib diisi.", "error");
    if (materiType === 'teks' && !materiContent.trim()) return showCustomAlert("Konten teks wajib diisi.", "error");

    setIsSubmitting(true);
    try {
      const coverImageUpload = await uploadFile(coverImage, `materi/${activeClass.id}/covers`);
      let fileData = null;
      if (materiType === "pdf" && selectedFile) {
        fileData = await uploadFile(selectedFile, `materi/${activeClass.id}/files`);
      }

      await addDoc(collection(db, "materi"), {
        kelas: activeClass.id,
        name: materiName,
        type: materiType,
        coverImageUrl: coverImageUpload?.url || null,
        coverImagePath: coverImageUpload?.path || null,
        fileUrl: (materiType === 'pdf') ? fileData?.url : (materiType === 'link_eksternal' ? materiUrl : null),
        filePath: (materiType === 'pdf') ? fileData?.path : null,
        videoEmbedUrl: materiType === 'video' ? materiUrl : null,
        content: materiType === 'teks' ? materiContent : null,
        createdAt: serverTimestamp()
      });

      resetAddForm();
      setShowAddModal(false);
      showCustomAlert("Materi berhasil ditambahkan!");
    } catch (err) {
      showCustomAlert("Gagal tambah materi: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOpenEditModal = (materi) => {
    setEditingMateri(materi);
    setEditedMateriName(materi.name);
    setEditedMateriType(materi.type);
    setEditedMateriContent(materi.content || "");
    setEditedMateriUrl(materi.fileUrl || materi.videoEmbedUrl || "");
    setShowEditModal(true);
    setEditedSelectedFile(null);
    setEditedCoverImage(null);
    if(editFileInputRef.current) editFileInputRef.current.value = "";
    if(editCoverImageInputRef.current) editCoverImageInputRef.current.value = "";
  };
  
  const handleSaveEditMateri = async (e) => {
    e.preventDefault();
    if (!editedMateriName.trim()) return showCustomAlert("Nama materi wajib diisi!", "error");
    
    setIsSubmitting(true);
    try {
      const materiDocRef = doc(db, "materi", editingMateri.id);
      
      let dataToUpdate = {
        name: editedMateriName,
        type: editedMateriType,
        updatedAt: serverTimestamp()
      };
      
      // Logika untuk update konten berdasarkan tipe
      if (editedMateriType === 'teks') {
        dataToUpdate.content = editedMateriContent;
      } else if (editedMateriType === 'video' || editedMateriType === 'link_eksternal') {
        dataToUpdate.fileUrl = editedMateriUrl;
      }

      // Logika untuk update gambar sampul
      if (editedCoverImage) {
        if (editingMateri.coverImagePath) await deleteObject(ref(storage, editingMateri.coverImagePath)).catch(console.error);
        const upload = await uploadFile(editedCoverImage, `materi/${activeClass.id}/covers`);
        dataToUpdate.coverImageUrl = upload.url;
        dataToUpdate.coverImagePath = upload.path;
      }
      
      // Logika untuk update file PDF
      if (editedMateriType === "pdf" && editedSelectedFile) {
        if (editingMateri.filePath) await deleteObject(ref(storage, editingMateri.filePath)).catch(console.error);
        const upload = await uploadFile(editedSelectedFile, `materi/${activeClass.id}/files`);
        dataToUpdate.fileUrl = upload.url;
        dataToUpdate.filePath = upload.path;
      }
      
      await updateDoc(materiDocRef, dataToUpdate);
      setShowEditModal(false);
      showCustomAlert("Materi berhasil diupdate!");
    } catch (err) {
      showCustomAlert("Gagal update materi: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancelEdit = () => setShowEditModal(false);

  const confirmDeleteMateri = (materi) => {
    setMateriToDelete(materi);
    setShowDeleteConfirmModal(true);
  };
  
  const handleDeleteMateri = async () => {
    if (!materiToDelete) return;
    setIsSubmitting(true);
    try {
      if (materiToDelete.filePath) await deleteObject(ref(storage, materiToDelete.filePath)).catch(console.error);
      if (materiToDelete.coverImagePath) await deleteObject(ref(storage, materiToDelete.coverImagePath)).catch(console.error);
      await deleteDoc(doc(db, "materi", materiToDelete.id));

      showCustomAlert("Materi berhasil dihapus!");
      setMateriToDelete(null);
      setShowDeleteConfirmModal(false);
    } catch (err) {
      showCustomAlert("Gagal hapus materi: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleViewText = (materi) => {
    setMateriToView(materi);
    setShowViewTextModal(true);
  };

  const getMateriDescription = (type) => {
    switch(type) {
      case 'pdf': return 'Dokumen PDF';
      case 'video': return 'Video dari YouTube/Vimeo';
      case 'link_eksternal': return 'Tautan ke Situs Eksternal';
      case 'teks': return 'Artikel atau Catatan Singkat';
      default: return 'Materi';
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
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manajemen Materi Ajar</h1>
              <p className="text-md text-orange-600 font-semibold mt-1">Untuk Kelas: {activeClass.name || "Pilih kelas dahulu"}</p>
            </div>
            <button
              onClick={() => { resetAddForm(); setShowAddModal(true); }}
              className={`flex items-center space-x-2 ${primaryButtonColor} ${primaryButtonTextColor} px-5 py-2.5 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 text-sm font-medium`}
            >
              <PlusCircle size={20} />
              <span>Tambah Materi Baru</span>
            </button>
          </div>

          {loading ? (
            <p className="text-center text-gray-500 py-16 animate-pulse">Memuat materi...</p>
          ) : materis.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-xl font-medium text-gray-500">Belum ada materi untuk kelas ini.</p>
              <p className="text-sm text-gray-400 mt-2">Klik "Tambah Materi Baru" untuk memulai.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {materis.map((materi, index) => (
                <div 
                  key={materi.id} 
                  className={`bg-white border border-gray-200 rounded-xl flex flex-col shadow-sm hover:shadow-xl transition-shadow duration-300 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: hasMounted ? `${(index * 0.05) + 0.2}s` : '0s' }}
                >
                  <a  onClick={() => materi.type === 'teks' ? handleViewText(materi) : window.open(materi.fileUrl || materi.videoEmbedUrl, '_blank')}
                      className="cursor-pointer group block"
                  >
                    <div className="relative">
                      <img 
                        src={materi.coverImageUrl || `https://placehold.co/600x400/f97316/ffffff?text=${materi.name.charAt(0)}`} 
                        alt={`Sampul untuk ${materi.name}`}
                        className="w-full h-40 object-cover rounded-t-xl"
                        onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/600x400/f97316/ffffff?text=${materi.name.charAt(0)}`}}
                      />
                       <div className={`absolute top-3 right-3 p-2 rounded-full text-white shadow-lg ${
                          materi.type === 'pdf' ? 'bg-red-500' : 
                          materi.type === 'video' ? 'bg-blue-500' :
                          materi.type === 'link_eksternal' ? 'bg-teal-500' :
                          'bg-indigo-500'
                        }`}>
                          {materi.type === 'pdf' ? <FileText size={20} /> : 
                           materi.type === 'video' ? <Video size={20} /> : 
                           materi.type === 'link_eksternal' ? <ExternalLink size={20} /> :
                           <BookText size={20} /> }
                      </div>
                    </div>
                  </a>
                  <div className="p-4 flex flex-col flex-grow">
                    <p className="text-sm text-gray-500 mb-1">{getMateriDescription(materi.type)}</p>
                    <h3 className="font-semibold text-lg text-gray-800 flex-grow" title={materi.name}>{materi.name}</h3>
                     <p className="text-xs text-gray-400 mt-2">Dibuat: {materi.createdAt?.toDate().toLocaleDateString('id-ID')}</p>
                  </div>
                  <div className="flex items-center justify-end space-x-2 p-4 border-t border-gray-100">
                    <button onClick={() => handleOpenEditModal(materi)} className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-100 transition-colors" aria-label="Edit Materi">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => confirmDeleteMateri(materi)} className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-100 transition-colors" aria-label="Hapus Materi">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Tambah Materi */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up my-8">
              <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><X size={24}/></button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Tambah Materi Baru</h2>
              <form onSubmit={handleAddMateri} className="space-y-4">
                <input type="text" value={materiName} onChange={(e) => setMateriName(e.target.value)} placeholder="Nama Materi (Contoh: Pengenalan Aljabar)" className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                <select value={materiType} onChange={(e) => setMateriType(e.target.value)} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition bg-white`}>
                  <option value="pdf">Dokumen PDF</option>
                  <option value="video">Video Embed</option>
                  <option value="link_eksternal">Link Eksternal</option>
                  <option value="teks">Teks / Artikel</option>
                </select>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{ getMateriDescription(materiType) }</label>
                   {materiType === 'pdf' ? <input type="file" ref={addFileInputRef} onChange={(e) => setSelectedFile(e.target.files[0])} className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 ${inputFocusColor} border border-gray-300 rounded-lg cursor-pointer`} accept="application/pdf" />
                    : materiType === 'teks' ? <textarea value={materiContent} onChange={(e) => setMateriContent(e.target.value)} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition min-h-[120px]`} placeholder="Masukkan konten teks di sini..."/>
                    : <input type="url" value={materiUrl} onChange={(e) => setMateriUrl(e.target.value)} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} placeholder={materiType === 'video' ? 'Contoh: https://www.youtube.com/embed/...' : 'https://contoh.com/artikel'} />
                   }
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Sampul <span className="text-gray-400">(Opsional)</span></label>
                   <input type="file" ref={addCoverImageInputRef} onChange={(e) => setCoverImage(e.target.files[0])} className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 ${inputFocusColor} border border-gray-300 rounded-lg cursor-pointer`} accept="image/*" />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                  <button type="submit" disabled={isSubmitting} className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md flex items-center disabled:opacity-50`}>{isSubmitting ? 'Menyimpan...':'Simpan Materi'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Edit Materi */}
        {showEditModal && editingMateri && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
             <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up my-8">
              <button onClick={handleCancelEdit} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><X size={24} /></button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Edit Materi</h2>
              <form onSubmit={handleSaveEditMateri} className="space-y-4">
                <input type="text" value={editedMateriName} onChange={(e) => setEditedMateriName(e.target.value)} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                <select value={editedMateriType} onChange={(e) => setEditedMateriType(e.target.value)} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition bg-white`}>
                  <option value="pdf">Dokumen PDF</option>
                  <option value="video">Video Embed</option>
                  <option value="link_eksternal">Link Eksternal</option>
                  <option value="teks">Teks</option>
                </select>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File/URL/Konten</label>
                  {editedMateriType === 'pdf' ? (
                      <>
                        {editingMateri.fileUrl && <p className="text-xs mb-1 text-gray-500">File saat ini: <a href={editingMateri.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">Lihat File</a></p>}
                        <input type="file" ref={editFileInputRef} onChange={(e) => setEditedSelectedFile(e.target.files[0])}
                          className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 ${inputFocusColor} border border-gray-300 rounded-lg cursor-pointer`}
                          accept="application/pdf" />
                          <p className="text-xs text-gray-500 mt-1">Kosongkan jika tidak ingin mengganti file.</p>
                      </>
                  ) : editedMateriType === 'teks' ? (
                      <textarea value={editedMateriContent} onChange={(e) => setEditedMateriContent(e.target.value)}
                        className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition min-h-[120px]`} required />
                  ) : (
                      <input type="url" value={editedMateriUrl} onChange={(e) => setEditedMateriUrl(e.target.value)}
                        className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                  )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ganti Gambar Sampul <span className="text-gray-400">(Opsional)</span></label>
                    <input type="file" ref={editCoverImageInputRef} onChange={(e) => setEditedCoverImage(e.target.files[0])} className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 ${inputFocusColor} border border-gray-300 rounded-lg cursor-pointer`} accept="image/*" />
                    {editingMateri.coverImageUrl && <p className="text-xs text-gray-500 mt-1">Kosongkan jika tidak ingin mengganti gambar.</p>}
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={handleCancelEdit} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                  <button type="submit" disabled={isSubmitting} className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md flex items-center disabled:opacity-50`}>
                    {isSubmitting ? 'Menyimpan...':'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showViewTextModal && materiToView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-2xl relative animate-fade-in-up my-8">
              <button onClick={() => setShowViewTextModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><X size={24}/></button>
              <h2 className="text-2xl font-bold mb-2 text-gray-800">{materiToView.name}</h2>
              <p className="text-sm text-gray-500 mb-4">Dibuat pada {materiToView.createdAt?.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <div className="prose max-w-none text-gray-700 max-h-[60vh] overflow-y-auto pr-2" dangerouslySetInnerHTML={{ __html: materiToView.content }}>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirmModal && materiToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Konfirmasi Hapus</h3>
              <p className="text-gray-600 mb-6 text-sm">Yakin hapus materi <strong className="text-gray-900">{materiToDelete.name}</strong>?</p>
              <div className="flex justify-center space-x-3">
                <button type="button" className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" onClick={() => setShowDeleteConfirmModal(false)}>Batal</button>
                <button type="button" disabled={isSubmitting} className="px-5 py-2.5 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 flex items-center disabled:opacity-50" onClick={handleDeleteMateri}>
                  {isSubmitting ? 'Menghapus...':'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showAlertModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className={`bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up border-t-4 ${alertType === 'success' ? 'border-green-500' : 'border-red-500'}`}>
              <h3 className={`text-xl font-semibold mb-3 ${alertType === 'success' ? 'text-green-700' : 'text-red-700'}`}>{alertType === 'success' ? 'Berhasil!' : 'Terjadi Kesalahan!'}</h3>
              <p className="text-gray-600 mb-6 text-sm">{alertMessage}</p>
              <button type="button" className={`px-6 py-2.5 rounded-lg shadow-md ${alertType === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`} onClick={() => setShowAlertModal(false)}>Oke</button>
            </div>
          </div>
        )}
        
        <style jsx>{`
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; opacity: 0; }
          .prose { line-height: 1.6; }
          .prose p { margin-bottom: 1em; }
          .prose h1, .prose h2, .prose h3 { margin-bottom: 0.5em; font-weight: 600; }
        `}</style>
      </main>
    </MainLayout>
  );
}