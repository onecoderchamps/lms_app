'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import MainLayout from './layouts/MainLayout';
import { db } from '../../api/firebaseConfig';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { Settings, Image as ImageIcon, X, Trash2, Megaphone, Loader, AlertTriangle, UserPlus, Edit, CheckCircle } from 'lucide-react';

// --- BAGIAN 1: API & LOGIKA HELPER ---
const uploadFileApi = async (file) => {
  if (!file) return null;
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await fetch('https://apiimpact.coderchamps.co.id/api/v1/file/upload', { method: 'POST', body: formData });
    const result = await response.json();
    if (result.status) return { url: result.path };
    throw new Error(result.message || "Gagal unggah file.");
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};


// --- BAGIAN 2: KOMPONEN UI KECIL & REUSABLE ---

const ImageInput = ({ label, currentImageUrl, onFileSelect, onRemove, inputRef, previewShape = 'rounded-lg' }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <div className="flex items-center gap-4">
      <img
        src={currentImageUrl || 'https://placehold.co/128x128/f0f9ff/64748b?text=Pilih'}
        alt="Preview"
        className={`w-24 h-24 object-cover bg-slate-100 ${previewShape} border border-slate-200`}
      />
      <input type="file" ref={inputRef} onChange={onFileSelect} className="hidden" accept="image/*" />
      <div className='flex flex-col gap-2'>
        <button
          type="button"
          onClick={() => inputRef.current.click()}
          className="text-sm font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-lg transition-colors"
        >
          Ubah Gambar
        </button>
        {currentImageUrl && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-semibold text-red-600 hover:text-red-700"
          >
            Hapus Gambar
          </button>
        )}
      </div>
    </div>
  </div>
);

const SettingsCard = ({ title, children, hasMounted, animationDelay = '0.2s' }) => (
    <div
      className={`bg-white rounded-xl shadow-xl p-6 md:p-8 ${hasMounted ? 'animate-on-scroll is-visible' : ''}`}
      style={{ animationDelay }}
    >
      {/* -- DIUBAH: Garis pemisah dari hitam ke abu-abu muda (border-gray-200) -- */}
      <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-4 mb-6">{title}</h2>
      {children}
    </div>
);

const SubmitButton = ({ isSubmitting, text }) => (
    <button type="submit" disabled={isSubmitting} className="flex items-center justify-center w-full sm:w-auto bg-orange-500 text-white px-6 py-2.5 rounded-lg shadow-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed">
        {isSubmitting ? <Loader className="animate-spin" size={20}/> : <span>{text}</span>}
    </button>
);

const Notification = ({ notification, onClear }) => {
    if (!notification) return null;
    const isSuccess = notification.type === 'success';
    const bgColor = isSuccess ? 'bg-green-500' : 'bg-red-500';
    const Icon = isSuccess ? CheckCircle : AlertTriangle;

    return (
        <div className={`fixed bottom-5 right-5 z-[100] flex items-center gap-4 p-4 rounded-lg text-white shadow-lg animate-fade-in-up ${bgColor}`}>
            <Icon size={24} />
            <p className="flex-1">{notification.message}</p>
            <button onClick={onClear} className="p-1 rounded-full hover:bg-white/20"><X size={18} /></button>
        </div>
    );
};


// --- BAGIAN 3: KOMPONEN UTAMA (REDESIGN) ---

export default function PengaturanSistemPage() {
  const [settings, setSettings] = useState({ appName: '', appLogoUrl: '', heroImageUrl: '', benefitImageUrl: '' });
  const [files, setFiles] = useState({ appLogo: null, heroImage: null, benefitImage: null });
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [editingMentor, setEditingMentor] = useState(null);

  const inputRefs = {
    appLogo: useRef(null),
    heroImage: useRef(null),
    benefitImage: useRef(null),
    mentorPhoto: useRef(null)
  };

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  useEffect(() => {
    const unsubscribes = [
      onSnapshot(doc(db, "settings", "general"), (docSnap) => {
        if (docSnap.exists()) setSettings(s => ({...s, ...docSnap.data()}));
      }),
      onSnapshot(doc(db, "settings", "landingPage"), (docSnap) => {
        if (docSnap.exists()) setSettings(s => ({...s, ...docSnap.data()}));
      }),
      onSnapshot(query(collection(db, "mentors"), orderBy("name", "asc")), (snapshot) => {
        setMentors(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }),
    ];
    setLoading(false);
    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
        setFiles(f => ({ ...f, [fieldName]: file }));
        setSettings(s => ({ ...s, [`${fieldName}Url`]: URL.createObjectURL(file) }));
    }
  };
  
  const handleGeneralSettingsSave = async (e) => {
    e.preventDefault();
    setSubmitting('general');
    try {
        const dataToUpdate = { appName: settings.appName };
        if (files.appLogo) {
            const upload = await uploadFileApi(files.appLogo);
            if (upload) dataToUpdate.appLogoUrl = upload.url;
        }
        await setDoc(doc(db, "settings", "general"), dataToUpdate, { merge: true });
        showNotification("Pengaturan Umum berhasil disimpan!");
    } catch (err) {
        showNotification("Gagal menyimpan: " + err.message, "error");
    } finally {
        setSubmitting(null);
    }
  };

  const handleLandingPageSave = async (e) => {
    e.preventDefault();
    setSubmitting('landing');
    try {
        const dataToUpdate = {};
        if (files.heroImage) {
            const upload = await uploadFileApi(files.heroImage);
            if(upload) dataToUpdate.heroImageUrl = upload.url;
        }
        if (files.benefitImage) {
            const upload = await uploadFileApi(files.benefitImage);
            if(upload) dataToUpdate.benefitImageUrl = upload.url;
        }
        if (Object.keys(dataToUpdate).length > 0) {
            await updateDoc(doc(db, "settings", "landingPage"), dataToUpdate);
        }
        showNotification("Pengaturan Halaman Depan berhasil disimpan!");
    } catch (err) {
        showNotification("Gagal menyimpan: " + err.message, "error");
    } finally {
        setSubmitting(null);
    }
  };

  const handleMentorSubmit = async (e, mentorData, mentorFile) => {
      e.preventDefault();
      if (!mentorData.name || !mentorData.role) {
          showNotification("Nama dan jabatan mentor wajib diisi.", "error");
          return;
      }
      if (!editingMentor && !mentorFile) {
          showNotification("Foto mentor wajib diunggah.", "error");
          return;
      }
      setSubmitting('mentor');
      try {
          const dataToSave = { ...mentorData };
          if (mentorFile) {
              const upload = await uploadFileApi(mentorFile);
              if (upload) dataToSave.avatarUrl = upload.url;
          }
          
          if (editingMentor) {
              await updateDoc(doc(db, "mentors", editingMentor.id), dataToSave);
              showNotification("Mentor berhasil diperbarui.");
          } else {
              await addDoc(collection(db, "mentors"), dataToSave);
              showNotification("Mentor berhasil ditambahkan.");
          }
          setShowMentorModal(false);
          setEditingMentor(null);
      } catch (err) {
          showNotification("Gagal menyimpan mentor: " + err.message, "error");
      } finally {
          setSubmitting(null);
      }
  };

  const handleDeleteMentor = async (mentorId) => {
    if (!confirm("Yakin ingin menghapus mentor ini?")) return;
    try {
        await deleteDoc(doc(db, "mentors", mentorId));
        showNotification("Mentor berhasil dihapus.");
    } catch(err) {
        showNotification("Gagal menghapus mentor: " + err.message, "error");
    }
  };
  
  if (loading) {
      return <MainLayout><div className="flex justify-center items-center h-screen"><Loader className="animate-spin" size={48}/></div></MainLayout>
  }

  return (
    <MainLayout>
      {/* -- DIUBAH: Latar belakang gradasi menjadi putih polos (bg-white) -- */}
    <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Pengaturan Sistem</h1>
            <p className="text-gray-600 mt-1">Konfigurasi umum, halaman depan, dan data pendukung platform.</p>
          </div>

          <div className="space-y-8">
            <SettingsCard title="Pengaturan Umum" hasMounted={!loading}>
              <form onSubmit={handleGeneralSettingsSave} className="space-y-6">
                <div>
                  <label htmlFor="appName" className="block text-sm font-medium text-gray-700 mb-1">Nama Aplikasi</label>
                  <input type="text" id="appName" value={settings.appName} onChange={(e) => setSettings({...settings, appName: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"/>
                </div>
                <ImageInput label="Logo Aplikasi (Header)" currentImageUrl={settings.appLogoUrl} onFileSelect={(e) => handleFileChange(e, 'appLogo')} onRemove={() => setSettings(s => ({...s, appLogoUrl: ''}))} inputRef={inputRefs.appLogo}/>
                {/* -- DIUBAH: Garis pemisah dari hitam ke abu-abu muda (border-gray-200) -- */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                    <SubmitButton isSubmitting={submitting === 'general'} text="Simpan Pengaturan Umum"/>
                </div>
              </form>
            </SettingsCard>

            <SettingsCard title="Pengaturan Halaman Depan" hasMounted={!loading} animationDelay="0.3s">
              <form onSubmit={handleLandingPageSave} className="space-y-8">
                <ImageInput label="Gambar Hero Section" currentImageUrl={settings.heroImageUrl} onFileSelect={(e) => handleFileChange(e, 'heroImage')} onRemove={() => setSettings(s => ({...s, heroImageUrl: ''}))} inputRef={inputRefs.heroImage}/>
                <ImageInput label="Gambar Bagian 'Keunggulan'" currentImageUrl={settings.benefitImageUrl} onFileSelect={(e) => handleFileChange(e, 'benefitImage')} onRemove={() => setSettings(s => ({...s, benefitImageUrl: ''}))} inputRef={inputRefs.benefitImage}/>
                {/* -- DIUBAH: Garis pemisah dari hitam ke abu-abu muda (border-gray-200) -- */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                    <SubmitButton isSubmitting={submitting === 'landing'} text="Simpan Halaman Depan"/>
                </div>
              </form>
            </SettingsCard>
            
            <SettingsCard title="Manajemen Mentor" hasMounted={!loading} animationDelay="0.4s">
                {/* -- DIUBAH: Garis pemisah dari hitam ke abu-abu muda (border-gray-200) -- */}
                <div className='flex justify-between items-center border-b border-gray-200 pb-4 mb-6'>
                    <h3 className="text-lg font-semibold text-gray-700">Daftar Mentor</h3>
                    <button onClick={() => { setEditingMentor(null); setShowMentorModal(true); }} className="flex items-center space-x-2 text-sm font-semibold text-orange-600 hover:text-orange-700">
                        <UserPlus size={18}/>
                        <span>Tambah Mentor</span>
                    </button>
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {mentors.length === 0 ? <p className="text-center text-sm text-gray-500 py-4">Belum ada mentor.</p> : mentors.map(mentor => (
                        <div key={mentor.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-4">
                                <img src={mentor.avatarUrl || 'https://placehold.co/64x64/e2e8f0/64748b?text=M'} alt={mentor.name} className="w-12 h-12 rounded-full object-cover"/>
                                <div>
                                    <p className="font-semibold text-gray-800">{mentor.name}</p>
                                    <p className="text-sm text-gray-500">{mentor.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button onClick={() => { setEditingMentor(mentor); setShowMentorModal(true); }} className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors" aria-label="Edit Mentor"><Edit size={16}/></button>
                                <button onClick={() => handleDeleteMentor(mentor.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors" aria-label="Hapus Mentor"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </SettingsCard>
          </div>
        </div>

        {showMentorModal && (
            <MentorModal 
                mentor={editingMentor} 
                onClose={() => setShowMentorModal(false)} 
                onSubmit={handleMentorSubmit}
                isSubmitting={submitting === 'mentor'}
                photoInputRef={inputRefs.mentorPhoto}
            />
        )}
        <Notification notification={notification} onClear={() => setNotification(null)} />
      </main>

      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-on-scroll { opacity: 0; }
        .is-visible { animation: fadeInUp 0.6s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
      `}</style>
    </MainLayout>
  );
}

function MentorModal({ mentor, onClose, onSubmit, isSubmitting, photoInputRef }) {
    const [formData, setFormData] = useState({ 
        name: mentor?.name || '', 
        role: mentor?.role || '',
        avatarUrl: mentor?.avatarUrl || ''
    });
    const [photoFile, setPhotoFile] = useState(null);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            setFormData(f => ({ ...f, avatarUrl: URL.createObjectURL(file) }));
        }
    };

    const handleInternalSubmit = (e) => {
        onSubmit(e, {name: formData.name, role: formData.role, avatarUrl: formData.avatarUrl}, photoFile);
    }
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl p-7 w-full max-w-lg relative animate-fade-in-up">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><X size={24}/></button>
            <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">{mentor ? 'Edit Mentor' : 'Tambah Mentor Baru'}</h2>
            <form onSubmit={handleInternalSubmit} className="space-y-4">
              <ImageInput label="Foto Mentor" currentImageUrl={formData.avatarUrl} onFileSelect={handlePhotoChange} onRemove={() => setFormData(f => ({...f, avatarUrl: ''}))} inputRef={photoInputRef} previewShape="rounded-full"/>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Mentor</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Nama lengkap mentor" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500" required/>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan / Role</label>
                  <input type="text" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} placeholder="Contoh: Fullstack Developer" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500" required/>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                  <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
                      {isSubmitting ? 'Menyimpan...' : 'Simpan Mentor'}
                  </button>
              </div>
            </form>
          </div>
        </div>
    );
}