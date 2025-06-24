import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
    getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot,
    query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { app } from "../../api/firebaseConfig";
import MainLayout from "./layouts/MainLayout";
import { PlusCircle, X, FileText, Video, ExternalLink, Trash2, Edit, BookText, Loader, AlertTriangle, Info, CheckCircle, CalendarDays } from 'lucide-react';

const db = getFirestore(app);

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
    const [materiType, setMateriType] = useState("pdf"); // Default ke pdf
    const [materiUrl, setMateriUrl] = useState(""); // <--- Perbaikan: Pastikan ini string kosong
    const [materiContent, setMateriContent] = useState(""); // <--- Perbaikan: Pastikan ini string kosong
    const [coverImage, setCoverImage] = useState(null); // File objek untuk cover
    const [selectedFile, setSelectedFile] = useState(null); // File objek untuk PDF
    const addFileInputRef = useRef(null);
    const addCoverImageInputRef = useRef(null);

    // State form edit
    const [editingMateri, setEditingMateri] = useState(null);
    const [editedMateriName, setEditedMateriName] = useState("");
    const [editedMateriType, setEditedMateriType] = useState("pdf"); // <--- Perbaikan: Pastikan ini string
    const [editedMateriUrl, setEditedMateriUrl] = useState(""); // <--- Perbaikan: Pastikan ini string kosong
    const [editedMateriContent, setEditedMateriContent] = useState(""); // <--- Perbaikan: Pastikan ini string kosong
    const [editedCoverImage, setEditedCoverImage] = useState(null); // File objek baru untuk cover yang diedit
    const [editedSelectedFile, setEditedSelectedFile] = useState(null); // File objek baru untuk PDF yang diedit
    const editFileInputRef = useRef(null);
    const editCoverImageInputRef = useRef(null);
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState(""); // <--- Perbaikan: Pastikan ini string kosong
    const [alertType, setAlertType] = useState("success"); // <--- Perbaikan: Pastikan ini string
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
        const classId = localStorage.getItem('idKelas');
        const className = localStorage.getItem('namaKelas');
        if (classId && className) {
            setActiveClass({ id: classId, name: className });
        } else {
            router.push('/guru/manajemen-kelas');
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
            let coverImageUploadResult = null;
            if (coverImage) {
                coverImageUploadResult = await uploadFileExternalApi(coverImage);
            }
            
            let fileDataResult = null;
            if (materiType === "pdf" && selectedFile) {
                fileDataResult = await uploadFileExternalApi(selectedFile);
            }

            await addDoc(collection(db, "materi"), {
                kelas: activeClass.id,
                name: materiName,
                type: materiType,
                coverImageUrl: coverImageUploadResult?.url || null,
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
        setEditedMateriName(materi.name || ""); // Pastikan string
        setEditedMateriType(materi.type || "pdf"); // Pastikan string dan default
        setEditedMateriContent(materi.content || ""); // Pastikan string
        // Perbaikan: Ambil URL yang sesuai dengan tipe materi, default ke string kosong
        setEditedMateriUrl(materi.videoEmbedUrl || materi.fileUrl || ""); 
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
                    if (!editedMateriContent.trim()) throw new Error("Konten teks wajib diisi.");
                    dataToUpdate.content = editedMateriContent;
                    break;
                case 'video':
                    if (!editedMateriUrl.trim()) throw new Error("URL video wajib diisi.");
                    dataToUpdate.videoEmbedUrl = editedMateriUrl;
                    break;
                case 'link_eksternal':
                    if (!editedMateriUrl.trim()) throw new Error("Link eksternal wajib diisi.");
                    dataToUpdate.fileUrl = editedMateriUrl;
                    break;
                case 'pdf':
                    if (editedSelectedFile) {
                        const upload = await uploadFileExternalApi(editedSelectedFile);
                        dataToUpdate.fileUrl = upload.url;
                    } else {
                        dataToUpdate.fileUrl = editingMateri.type === 'pdf' ? editingMateri.fileUrl : null;
                    }
                    if (!dataToUpdate.fileUrl) throw new Error("File PDF wajib ada.");
                    break;
                default:
                    break;
            }
          
            await updateDoc(materiDocRef, dataToUpdate);
            setShowEditModal(false);
            setEditingMateri(null);
            showCustomAlert("Materi berhasil diupdate!");
        } catch (err) {
            showCustomAlert("Gagal update materi: " + err.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleCancelEdit = () => {
        setShowEditModal(false);
        setEditingMateri(null);
    };

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
                            disabled={!activeClass.id}
                        >
                            <PlusCircle size={20} />
                            <span>Tambah Materi Baru</span>
                        </button>
                    </div>

                    {!activeClass.id ? (
                         <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                             <Info className="text-blue-500 mx-auto mb-4" size={40} />
                             <p className="text-xl font-medium text-gray-700">Silakan pilih kelas terlebih dahulu.</p>
                             <p className="text-sm text-gray-500 mt-2">Materi tidak dapat dikelola tanpa kelas aktif.</p>
                             <Link href="/guru/manajemen-kelas">
                                 <button className="mt-6 bg-orange-500 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-orange-600 transition">
                                     Pilih Kelas Sekarang
                                 </button>
                             </Link>
                         </div>
                    ) : loading ? (
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
                                        <img
                                            src={materi.coverImageUrl || `/materi.svg`} 
                                            alt={`Sampul untuk ${materi.name}`}
                                            className="w-full h-32 object-cover rounded-t-xl"
                                            onError={(e) => { 
                                                e.target.onerror = null; 
                                                e.target.src=`https://placehold.co/600x400/f97316/ffffff?text=${materi.name ? materi.name.charAt(0) : ''}`;
                                                e.target.style.objectFit = 'contain'; 
                                                e.target.style.backgroundColor = '#f97316'; 
                                            }}
                                        />
                                        <div className={`absolute top-3 right-3 p-2 rounded-full text-white shadow-lg ${
                                            materi.type === 'pdf' ? 'bg-orange-600' : 
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
                                    <div className="p-4 flex flex-col flex-grow">
                                        <h3 className="font-semibold text-lg text-gray-800 flex-grow min-h-[3rem] line-clamp-2" title={materi.name}>{materi.name}</h3>
                                        <div className="flex items-center text-xs text-gray-400 mt-2">
                                            <CalendarDays size={14} className="mr-1.5" />
                                            <span>Dibuat: {materi.createdAt?.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end space-x-2 p-3 border-t border-gray-100">
                                        <a 
                                            onClick={() => materi.type === 'teks' ? handleViewText(materi) : window.open(materi.fileUrl || materi.videoEmbedUrl, '_blank')} 
                                            className="flex-1 text-center text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1.5 rounded-md transition duration-150"
                                        >
                                            Lihat Materi
                                        </a>
                                        <button onClick={() => handleOpenEditModal(materi)} className="text-blue-600 hover:text-blue-800 p-1.5 rounded-full hover:bg-blue-50 transition-colors" aria-label="Edit Materi">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => confirmDeleteMateri(materi)} className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors" aria-label="Hapus Materi">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- Modal Tambah Materi --- */}
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
                        <div className="bg-white rounded-xl shadow-2xl p-7 w-full max-w-lg relative animate-fade-in-up my-8 border-t-4 ">
                            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><X size={24}/></button>
                            <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Tambah Materi Baru</h2>
                            <form onSubmit={handleAddMateri} className="space-y-4">
                                <div>
                                    <label htmlFor="materiName" className="block text-sm font-medium text-gray-700 mb-1">Nama Materi</label>
                                    <input id="materiName" type="text" value={materiName} onChange={(e) => setMateriName(e.target.value)} placeholder="Nama Materi" className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                                </div>
                                <div>
                                    <label htmlFor="materiType" className="block text-sm font-medium text-gray-700 mb-1">Tipe Materi</label>
                                    <select id="materiType" value={materiType} onChange={(e) => setMateriType(e.target.value)} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition bg-white`}>
                                        <option value="pdf">Dokumen PDF</option>
                                        <option value="video">Video Embed (YouTube/Vimeo)</option>
                                        <option value="link_eksternal">Link Eksternal</option>
                                        <option value="teks">Teks / Artikel</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {materiType === 'pdf' ? 'File PDF' :
                                         materiType === 'teks' ? 'Konten Teks' :
                                         materiType === 'video' ? 'URL Video Embed' : 'URL Link Eksternal'}
                                    </label>
                                    {materiType === 'pdf' ? (
                                        <input type="file" ref={addFileInputRef} onChange={(e) => setSelectedFile(e.target.files[0])} className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 ${inputFocusColor} border border-gray-300 rounded-lg cursor-pointer`} accept="application/pdf" />
                                    ) : materiType === 'teks' ? (
                                        <textarea value={materiContent} onChange={(e) => setMateriContent(e.target.value)} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition min-h-[120px]`} placeholder="Masukkan konten teks di sini..."/>
                                    ) : ( // video atau link_eksternal
                                        <input type="url" value={materiUrl} onChange={(e) => setMateriUrl(e.target.value)} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} placeholder={materiType === 'video' ? "Misal: https://www.youtube.com/watch?v=xxxxxxxx" : "Misal: https://www.situs-materi.com"} />
                                    )}
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

                {/* --- Modal Edit Materi --- */}
                {showEditModal && editingMateri && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
                        <div className="bg-white rounded-xl shadow-2xl p-7 w-full max-w-lg relative animate-fade-in-up my-8 border-t-4 border-orange-500">
                            <button onClick={handleCancelEdit} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><X size={24}/></button>
                            <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Edit Materi</h2>
                            <form onSubmit={handleSaveEditMateri} className="space-y-4">
                                <div>
                                    <label htmlFor="editedMateriName" className="block text-sm font-medium text-gray-700 mb-1">Nama Materi</label>
                                    <input id="editedMateriName" type="text" value={editedMateriName} onChange={(e) => setEditedMateriName(e.target.value)} placeholder="Nama Materi" className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} required />
                                </div>
                                <div>
                                    <label htmlFor="editedMateriType" className="block text-sm font-medium text-gray-700 mb-1">Tipe Materi</label>
                                    <select id="editedMateriType" value={editedMateriType} onChange={(e) => setEditedMateriType(e.target.value)} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition bg-white`}>
                                        <option value="pdf">Dokumen PDF</option>
                                        <option value="video">Video Embed</option>
                                        <option value="link_eksternal">Link Eksternal</option>
                                        <option value="teks">Teks / Artikel</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {editedMateriType === 'pdf' ? 'File PDF' :
                                         editedMateriType === 'teks' ? 'Konten Teks' :
                                         editedMateriType === 'video' ? 'URL Video Embed' : 'URL Link Eksternal'}
                                    </label>
                                    {editedMateriType === 'pdf' ? (
                                        <>
                                            <input type="file" ref={editFileInputRef} onChange={(e) => setEditedSelectedFile(e.target.files[0])} className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 ${inputFocusColor} border border-gray-300 rounded-lg cursor-pointer`} accept="application/pdf" />
                                            {editingMateri.fileUrl && !editedSelectedFile && <p className="text-xs text-gray-500 mt-1">File saat ini: <a href={editingMateri.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Lihat PDF</a></p>}
                                        </>
                                    ) : editedMateriType === 'teks' ? (
                                        <textarea value={editedMateriContent} onChange={(e) => setEditedMateriContent(e.target.value)} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition min-h-[120px]`} placeholder="Masukkan konten teks di sini..."/>
                                    ) : ( // video atau link_eksternal
                                        <input type="url" value={editedMateriUrl} onChange={(e) => setEditedMateriUrl(e.target.value)} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition`} placeholder={editedMateriType === 'video' ? "Misal: https://www.youtube.com/watch?v=xxxxxxxx" : "Misal: https://www.situs-materi.com"} />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Sampul Baru <span className="text-gray-400">(Opsional)</span></label>
                                    <input type="file" ref={editCoverImageInputRef} onChange={(e) => setEditedCoverImage(e.target.files[0])} className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 ${inputFocusColor} border border-gray-300 rounded-lg cursor-pointer`} accept="image/*" />
                                    {editingMateri.coverImageUrl && !editedCoverImage && <p className="text-xs text-gray-500 mt-1">Sampul saat ini: <a href={editingMateri.coverImageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Lihat Gambar</a></p>}
                                </div>
                                <div className="flex justify-end space-x-3 pt-2">
                                    <button type="button" onClick={handleCancelEdit} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                                    <button type="submit" disabled={isSubmitting} className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md flex items-center disabled:opacity-50`}>{isSubmitting ? 'Menyimpan...':'Simpan Perubahan'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* --- Modal Konfirmasi Hapus --- */}
                {showDeleteConfirmModal && materiToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl p-7 w-full max-w-sm text-center animate-fade-in-up">
                            <h3 className="text-xl font-semibold text-gray-800 mb-3">Konfirmasi Hapus</h3>
                            <p className="text-gray-600 mb-6 text-sm">
                                Yakin hapus materi <strong className="text-gray-900 line-clamp-2">"{materiToDelete.name}"</strong>? Tindakan ini tidak dapat diurungkan.
                            </p>
                            <div className="flex justify-center space-x-3">
                                <button type="button" onClick={() => { setShowDeleteConfirmModal(false); setMateriToDelete(null); }} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                                <button type="button" onClick={handleDeleteMateri} disabled={isSubmitting} className="px-5 py-2.5 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 disabled:opacity-50">
                                    {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- Modal Lihat Teks --- */}
                {showViewTextModal && materiToView && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
                        <div className="bg-white rounded-xl shadow-2xl p-7 w-full max-w-2xl relative animate-fade-in-up my-8 border-t-4 border-orange-500">
                            <button onClick={() => setShowViewTextModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><X size={24}/></button>
                            <h2 className="text-xl font-semibold mb-2 text-gray-800">Materi Teks: {materiToView.name}</h2>
                            <p className="text-sm text-gray-500 mb-6">Tipe: {materiToView.type}</p>
                            <div className="prose max-w-none h-96 overflow-y-auto p-4 border border-gray-200 rounded-lg bg-gray-50">
                                <p className="text-gray-700 whitespace-pre-wrap">{materiToView.content}</p>
                            </div>
                            <div className="flex justify-end pt-6">
                                <button type="button" onClick={() => setShowViewTextModal(false)} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Tutup</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- Modal Alert Kustom --- */}
                {showAlertModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className={`bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm text-center animate-fade-in-up border-t-4 ${alertType === 'success' ? 'border-green-500' : 'border-red-500'}`}>
                            {alertType === 'success' ? <CheckCircle className="text-green-500 mx-auto mb-4" size={48} /> : <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />}
                            <h3 className="text-xl font-semibold text-gray-800 mb-3">{alertType === 'success' ? 'Berhasil!' : 'Terjadi Kesalahan!'}</h3>
                            <p className="text-gray-600 mb-6 text-sm">{alertMessage}</p>
                            <button onClick={() => setShowAlertModal(false)} className={`px-5 py-2.5 ${alertType === 'success' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white rounded-lg shadow-md`}>Tutup</button>
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