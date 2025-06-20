import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { app } from "../../api/firebaseConfig"; // Sesuaikan path jika perlu
import MainLayout from "./layouts/MainLayout"; // Sesuaikan path jika perlu
import { PlusCircle, X, FileText, Video, ExternalLink, Trash2, Edit, BookText, Loader, AlertTriangle, Info, CalendarDays } from 'lucide-react';

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

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const classId = localStorage.getItem('idKelas');
    const className = localStorage.getItem('namaKelas');
    if (classId && className) {
      setActiveClass({ id: classId, name: className });
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!activeClass.id) {
      setMateris([]);
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
  
  const uploadFileExternalApi = async (file) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('https://apiimpact.coderchamps.co.id/api/v1/file/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.status === true) {
        return { url: result.path, fileId: result.fileId };
      } else {
        throw new Error(result.message || "Gagal mengunggah file ke API eksternal.");
      }
    } catch (error) {
      console.error("Error uploading file to external API:", error);
      throw error;
    }
  };

  const handleAddMateri = async (e) => {
    e.preventDefault();
    if (!materiName.trim()) return showCustomAlert("Nama materi wajib diisi!", "error");
    if (materiType === 'pdf' && !selectedFile) return showCustomAlert("Silakan pilih file PDF.", "error");
    if ((materiType === 'video' || materiType === 'link_eksternal') && !materiUrl.trim()) return showCustomAlert("URL wajib diisi.", "error");
    if (materiType === 'teks' && !materiContent.trim()) return showCustomAlert("Konten teks wajib diisi.", "error");

    setIsSubmitting(true);
    try {
      const coverImageResult = await uploadFileExternalApi(coverImage);
      let fileDataResult = null;
      if (materiType === "pdf" && selectedFile) {
        fileDataResult = await uploadFileExternalApi(selectedFile);
      }

      await addDoc(collection(db, "materi"), {
        kelas: activeClass.id,
        name: materiName,
        type: materiType,
        coverImageUrl: coverImageResult?.url || null,
        fileUrl: (materiType === 'pdf') ? fileDataResult?.url : (materiType === 'link_eksternal' ? materiUrl : null),
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
    if (!editedMateriName.trim()) {
        return showCustomAlert("Nama materi wajib diisi!", "error");
    }
    
    setIsSubmitting(true);
    try {
        const materiDocRef = doc(db, "materi", editingMateri.id);
        
        const dataToUpdate = {
            name: editedMateriName,
            type: editedMateriType,
            updatedAt: serverTimestamp(),
            content: null,
            fileUrl: null,
            videoEmbedUrl: null,
            coverImageUrl: editingMateri.coverImageUrl || null,
        };

        if (editedCoverImage) {
            const upload = await uploadFileExternalApi(editedCoverImage);
            dataToUpdate.coverImageUrl = upload.url;
        }

        switch (editedMateriType) {
            case 'teks':
                dataToUpdate.content = editedMateriContent;
                break;
            case 'video':
                dataToUpdate.videoEmbedUrl = editedMateriUrl;
                break;
            case 'link_eksternal':
                dataToUpdate.fileUrl = editedMateriUrl;
                break;
            case 'pdf':
                if (editedSelectedFile) {
                    const upload = await uploadFileExternalApi(editedSelectedFile);
                    dataToUpdate.fileUrl = upload.url;
                } else {
                    dataToUpdate.fileUrl = editingMateri.fileUrl;
                }
                break;
            default:
                break;
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
              <p className="text-md text-orange-600 font-semibold mt-1">Untuk Kelas: {activeClass.name || "Memuat..."}</p>
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
             <div className="text-center py-16">
                <Loader className="animate-spin text-orange-500 mx-auto" size={32}/>
                <p className="text-center text-gray-500 mt-4">Memuat materi...</p>
             </div>
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
                  className={`bg-white border border-gray-200 rounded-xl flex flex-col shadow-sm hover:shadow-xl transition-all duration-300 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: hasMounted ? `${(index * 0.05) + 0.2}s` : '0s' }}
                >
                    <div className="relative">
                      <a onClick={() => materi.type === 'teks' ? handleViewText(materi) : window.open(materi.fileUrl || materi.videoEmbedUrl, '_blank')}
                          className="cursor-pointer group block"
                      >
                        <img 
                            src={materi.coverImageUrl || `/materi.svg`} 
                            alt={`Sampul untuk ${materi.name}`}
                            className="w-full h-40 object-cover rounded-t-xl"
                            onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/600x400/f97316/ffffff?text=${materi.name ? materi.name.charAt(0) : ''}`}}
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
                      </a>
                    </div>
                    {/* --- DIUBAH: Struktur Konten Kartu Diperbaiki --- */}
                    <div className="p-4 flex flex-col flex-grow">
                        <p className="text-sm text-gray-500 mb-1">{getMateriDescription(materi.type)}</p>
                        <h3 className="font-semibold text-lg text-gray-800 flex-grow min-h-[3rem] line-clamp-2" title={materi.name}>{materi.name}</h3>
                        <p className="text-xs text-gray-400 mt-2">Dibuat: {materi.createdAt?.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <div className="flex items-center justify-end space-x-2 p-3 border-t border-gray-100">
                        <a onClick={() => materi.type === 'teks' ? handleViewText(materi) : window.open(materi.fileUrl || materi.videoEmbedUrl, '_blank')} className="text-xs font-medium text-orange-600 hover:underline cursor-pointer">
                            Lihat Materi
                        </a>
                        <span className="flex-grow"></span> {/* Spacer */}
                        <button onClick={() => handleOpenEditModal(materi)} className="text-gray-400 hover:text-blue-600 p-1.5 rounded-full hover:bg-blue-50 transition-colors" aria-label="Edit Materi">
                        <Edit size={16} />
                        </button>
                        <button onClick={() => confirmDeleteMateri(materi)} className="text-gray-400 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50 transition-colors" aria-label="Hapus Materi">
                        <Trash2 size={16} />
                        </button>
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal-modal lainnya ... */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl p-7 w-full max-w-lg relative animate-fade-in-up my-8 border-t-4 border-orange-500">
              <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><X size={24}/></button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Tambah Materi Baru</h2>
              <form onSubmit={handleAddMateri} className="space-y-4">
                <input type="text" value={materiName} onChange={(e) => setMateriName(e.target.value)} placeholder="Nama Materi" className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
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
                    : <input type="url" value={materiUrl} onChange={(e) => setMateriUrl(e.target.value)} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} placeholder="https://example.com/..." />
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
      </main>
    </MainLayout>
  );
}