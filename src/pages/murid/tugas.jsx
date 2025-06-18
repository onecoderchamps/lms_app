import React, { useState, useEffect, useRef } from 'react';
import MainLayout from './layouts/MainLayout';
// --- DIUBAH: Menambahkan 'app' pada import dari firebaseConfig ---
import { app, db, auth } from "../../api/firebaseConfig";
import { collection, getDocs, doc, query, where, onSnapshot, orderBy, setDoc, serverTimestamp, getDoc, documentId } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { FileText, UploadCloud, ExternalLink, CalendarDays, X as CloseIcon, CheckCircle, Star, Link as LinkIcon, Loader, Hourglass } from 'lucide-react';
import { useAuth } from '@/component/AuthProvider';
import { onAuthStateChanged } from 'firebase/auth';

// Inisialisasi Storage sekarang akan berjalan karena 'app' sudah diimpor
const storage = getStorage(app); 

export default function TugasMuridPage() {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [userClasses, setUserClasses] = useState(null);
  const [classDetails, setClassDetails] = useState({});

  // State untuk semua modal
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [currentSubmittingTugas, setCurrentSubmittingTugas] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const submissionFileRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNilaiModal, setShowNilaiModal] = useState(false);
  const [selectedTugasNilai, setSelectedTugasNilai] = useState(null);
  const [hasMounted, setHasMounted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setHasMounted(true);
    const handleAuthChange = (firebaseUser) => {
      if (firebaseUser) {
        fetchUserClassesAndDetails(firebaseUser.uid);
      } else {
        setLoading(false);
        setUserClasses([]);
      }
    };
    if (user) {
      handleAuthChange(user);
    } else {
      const unsubscribeAuth = onAuthStateChanged(auth, handleAuthChange);
      return () => unsubscribeAuth();
    }
  }, [user]);

  const fetchUserClassesAndDetails = async (uid) => {
    try {
      const q = query(collection(db, "enrollments"), where("muridId", "==", uid));
      const snap = await getDocs(q);
      const classIds = snap.docs.map(d => d.data().kelasId);
      
      if (classIds.length > 0) {
        const kelasQuery = query(collection(db, "kelas"), where(documentId(), "in", classIds));
        const classDocs = await getDocs(kelasQuery);
        
        const details = {};
        classDocs.forEach(doc => {
          if (doc.exists()) {
            details[doc.id] = doc.data().namaKelas;
          }
        });
        setClassDetails(details);
      }
      setUserClasses(classIds.length > 0 ? classIds : []);
    } catch (err) {
      console.error("Gagal mengambil kelas murid:", err);
      setUserClasses([]);
    }
  };

  useEffect(() => {
    if (userClasses === null) return;

    if (userClasses.length === 0) {
      setAssignments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const tugasQuery = query(
      collection(db, "tugas"), 
      where("kelas", "in", userClasses),
      orderBy("deadline", "desc")
    );
    const unsubscribe = onSnapshot(tugasQuery, (snapshot) => {
      const tugasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAssignments(tugasData);
      setLoading(false);
    }, (error) => {
      console.error("Gagal fetch tugas:", error)
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userClasses]);

  useEffect(() => {
    if (!user) return;
    const submissionQuery = query(collection(db, "assignmentSubmissions"), where("muridId", "==", user.uid));
    const unsubscribe = onSnapshot(submissionQuery, (snapshot) => {
      const newSubmissions = {};
      snapshot.forEach(doc => {
        newSubmissions[doc.data().assignmentId] = doc.data();
      });
      setSubmissions(newSubmissions);
    });
    return () => unsubscribe();
  }, [user]);

  const combinedTugas = assignments.map(tugas => {
    const submission = submissions[tugas.id];
    const deadlineDate = tugas.deadline?.toDate ? tugas.deadline.toDate() : new Date(tugas.deadline);
    const isOverdue = new Date() > deadlineDate && !submission;
    
    let status = 'Belum Dikerjakan';
    if (submission) {
      status = (submission.nilai !== null && submission.nilai !== undefined) ? 'Sudah Dinilai' : 'Sudah Dikumpulkan';
    } else if (isOverdue) {
      status = 'Terlambat';
    }
    return { ...tugas, status, submissionData: submission || null };
  });

  const showCustomAlert = (message, type = "success") => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };
  
  const handleOpenSubmitModal = (tugasItem) => {
    setCurrentSubmittingTugas(tugasItem);
    setSubmissionFile(null);
    if(submissionFileRef.current) submissionFileRef.current.value = "";
    setShowSubmitModal(true);
  };

  const handleActualSubmit = async () => {
    if (!submissionFile) {
      showCustomAlert('Silakan pilih file untuk diunggah.', 'error');
      return;
    }
    if (!currentSubmittingTugas || !user) return;
    
    setIsSubmitting(true);
    try {
      const filePath = `submissions/${currentSubmittingTugas.kelas}/${currentSubmittingTugas.id}/${user.uid}/${submissionFile.name}`;
      const fileRef = ref(storage, filePath);
      await uploadBytesResumable(fileRef, submissionFile);
      const submissionUrl = await getDownloadURL(fileRef);

      const submissionId = `${currentSubmittingTugas.id}_${user.uid}`;
      const submissionRef = doc(db, 'assignmentSubmissions', submissionId);
      
      await setDoc(submissionRef, {
        assignmentId: currentSubmittingTugas.id,
        muridId: user.uid,
        namaSiswa: user.namaLengkap || user.displayName || 'Nama Tidak Ada',
        namaTugas: currentSubmittingTugas.name,
        kelasId: currentSubmittingTugas.kelas,
        deadline: currentSubmittingTugas.deadline,
        submissionUrl: submissionUrl,
        submittedAt: serverTimestamp(),
        status: 'Sudah Dikumpulkan',
        nilai: null,
        komentarGuru: ''
      }, { merge: true });
      
      setShowSubmitModal(false);
      setCurrentSubmittingTugas(null);
      showCustomAlert(`Tugas "${currentSubmittingTugas.name}" berhasil dikumpulkan!`, 'success');
    } catch (err) {
      console.error(err);
      showCustomAlert('Gagal mengumpulkan tugas.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOpenNilaiModal = (tugasItem) => {
    setSelectedTugasNilai(tugasItem.submissionData);
    setShowNilaiModal(true);
  };
  
  const primaryButtonColor = "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500";
  const primaryButtonTextColor = "text-white";
  const inputFocusColor = "focus:ring-orange-500 focus:border-orange-500";
  
  const getStatusProps = (status) => {
      switch (status) {
          case 'Sudah Dinilai': return { color: 'bg-green-500', icon: <CheckCircle size={16} /> };
          case 'Sudah Dikumpulkan': return { color: 'bg-yellow-500', icon: <Hourglass size={16} /> };
          case 'Terlambat': return { color: 'bg-gray-500', icon: <CalendarDays size={16} /> };
          case 'Belum Dikerjakan':
          default: return { color: 'bg-red-500', icon: <CloseIcon size={16} /> };
      }
  };

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className={`mb-8 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Tugas Saya</h1>
            <p className="mt-1 text-gray-500">Daftar semua tugas dari kelas yang Anda ikuti.</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader className="animate-spin text-orange-500" size={32}/>
            </div>
          ) : combinedTugas.length === 0 ? (
            <div className={`text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
              <CheckCircle size={48} className="mx-auto text-green-500" />
              <p className="text-xl font-medium text-gray-600 mt-4">Hebat! Tidak ada tugas yang perlu dikerjakan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {combinedTugas.map((item, index) => {
                const statusProps = getStatusProps(item.status);
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 flex flex-col ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`}
                    style={{ animationDelay: hasMounted ? `${(index * 0.05) + 0.2}s` : '0s' }}
                  >
                    <div className={`relative p-3 text-white font-semibold text-sm flex items-center gap-2 ${statusProps.color}`}>
                      {statusProps.icon}
                      <span>{item.status}</span>
                    </div>
                    <img 
                        src={item.coverImageUrl || `https://placehold.co/600x400/f97316/ffffff?text=Tugas`}
                        alt={`Sampul untuk ${item.name}`}
                        className="w-full h-32 object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/600x400/f97316/ffffff?text=Tugas`}}
                    />
                    <div className="p-5 flex flex-col flex-grow">
                      <p className="font-semibold text-md text-gray-800 mb-1.5 leading-tight flex-grow min-h-[3.5rem] line-clamp-3" title={item.name}>{item.name}</p>
                      <p className="text-xs text-gray-500 mb-3">Kelas: {classDetails[item.kelas] || item.kelas}</p>
                      <div className="flex items-center text-red-600 text-xs mb-3">
                        <CalendarDays size={14} className="mr-2 text-red-400" />
                        <span>Batas Akhir: {item.deadline?.toDate ? item.deadline.toDate().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date(item.deadline).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                      </div>
                      <div className="mt-auto space-y-2.5 pt-4 border-t">
                        <a href={item.fileTugasUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center px-4 py-2.5 rounded-lg transition duration-300 text-sm font-medium w-full shadow-sm bg-blue-50 text-blue-700 hover:bg-blue-100">
                          <FileText size={16} className="mr-2" /> Lihat Soal Tugas
                        </a>
                        {item.status === 'Belum Dikerjakan' || item.status === 'Terlambat' || item.status === 'Sudah Dikumpulkan' ? (
                          <button onClick={() => handleOpenSubmitModal(item)}
                            className={`flex items-center justify-center px-4 py-2.5 rounded-lg shadow-md transition duration-300 text-sm font-medium w-full ${item.status === 'Sudah Dikumpulkan' ? 'bg-yellow-500 text-white' : `${primaryButtonColor} ${primaryButtonTextColor}`}`}
                          >
                            <UploadCloud size={16} className="mr-2" /> 
                            {item.status === 'Sudah Dikumpulkan' ? 'Perbarui Jawaban' : 'Kumpulkan Tugas'}
                          </button>
                        ) : (
                          <button onClick={() => handleOpenNilaiModal(item)}
                              className="flex items-center justify-center px-4 py-2.5 rounded-lg shadow-md transition duration-300 text-sm font-medium w-full bg-green-500 text-white"
                          >
                            <Star size={16} className="mr-2" /> Lihat Nilai & Feedback
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )})}
            </div>
          )}
        </div>

        {showSubmitModal && currentSubmittingTugas && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up">
              <button onClick={() => setShowSubmitModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
                <CloseIcon size={24} />
              </button>
              <h2 className="text-xl font-semibold mb-2 text-center text-gray-800">Kumpulkan Tugas</h2>
              <p className="text-sm text-center text-gray-600 mb-6 break-words">"{currentSubmittingTugas.name}"</p>
              <div>
                <label htmlFor="submissionFile" className="block text-sm font-medium text-gray-700 mb-2">Unggah File Jawaban Anda</label>
                 <input type="file" id="submissionFile" ref={submissionFileRef} onChange={(e) => setSubmissionFile(e.target.files[0])} className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 ${inputFocusColor} border border-gray-300 rounded-lg cursor-pointer`} />
                 {submissionFile && <p className="text-sm text-green-600 mt-2">File dipilih: {submissionFile.name}</p>}
                <p className="text-xs text-gray-500 mt-2">Anda bisa mengunggah file gambar (JPG, PNG) atau dokumen (PDF, DOCX).</p>
              </div>
              <div className="flex justify-end space-x-3 pt-6">
                <button type="button" onClick={() => setShowSubmitModal(false)} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                <button type="button" onClick={handleActualSubmit} disabled={!submissionFile || isSubmitting}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg shadow-md text-sm font-medium transition-colors disabled:opacity-50 ${!submissionFile ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : `${primaryButtonColor} ${primaryButtonTextColor}`}`}
                > 
                  <UploadCloud size={16} /><span>{isSubmitting ? 'Mengirim...' : 'Kumpulkan'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {showNilaiModal && selectedTugasNilai && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up">
              <button onClick={() => setShowNilaiModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><CloseIcon size={24} /></button>
              <div className="text-center">
                <span className="inline-block p-3 bg-green-100 text-green-600 rounded-full mb-3"><Star size={32} /></span>
                <h2 className="text-2xl font-bold mb-1 text-gray-800">Hasil Tugas</h2>
                <p className="text-sm text-gray-500 mb-4 break-words">"{selectedTugasNilai.namaTugas}"</p>
              </div>
              <div className="space-y-4 text-center bg-slate-50 p-6 rounded-lg">
                  <div>
                      <p className="text-sm font-medium text-gray-500">NILAI AKHIR</p>
                      <p className="text-5xl font-bold text-green-600">{selectedTugasNilai.nilai}</p>
                  </div>
                  {selectedTugasNilai.komentarGuru && (
                    <div>
                        <p className="text-sm font-medium text-gray-500 mt-4">Feedback dari Guru:</p>
                        <p className="text-gray-700 italic mt-1">"{selectedTugasNilai.komentarGuru}"</p>
                    </div>
                  )}
              </div>
              <div className="flex justify-end space-x-3 pt-6">
                <a href={selectedTugasNilai.submissionUrl || '#'} target="_blank" rel="noreferrer" className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm font-medium">Lihat File Terkumpul</a>
                <button type="button" onClick={() => setShowNilaiModal(false)} className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md text-sm font-medium`}>Tutup</button>
              </div>
            </div>
          </div>
        )}
        
        {showAlertModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className={`bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up border-t-4 ${alertType === 'success' ? 'border-green-500' : 'border-red-500'}`}>
              <h3 className={`text-xl font-semibold mb-3 ${alertType === 'success' ? 'text-green-700' : 'text-red-700'}`}>{alertType === 'success' ? 'Berhasil!' : 'Gagal'}</h3>
              <p className="text-gray-600 mb-6 text-sm">{alertMessage}</p>
              <button type="button" className={`px-6 py-2.5 rounded-lg shadow-md ${alertType === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                onClick={() => setShowAlertModal(false)}>Oke</button>
            </div>
          </div>
        )}
        
        <style jsx>{`
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; opacity: 0; }
          .line-clamp-3 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
        `}</style>
      </main>
    </MainLayout>
  );
}