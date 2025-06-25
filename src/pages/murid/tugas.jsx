import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'; // useCallback ditambahkan
import MainLayout from './layouts/MainLayout';
import { db, auth, app } from "../../api/firebaseConfig"; 
import { collection, getDocs, doc, query, where, onSnapshot, orderBy, setDoc, serverTimestamp, getDoc, documentId } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { FileText, UploadCloud, CalendarDays, X as CloseIcon, CheckCircle, Star, Loader, Hourglass, Video, BookOpen } from 'lucide-react'; // BookOpen ditambahkan
import { useAuth } from '@/component/AuthProvider';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/router';

const storage = getStorage(app); 

export default function TugasMuridPage() {
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [userClasses, setUserClasses] = useState(null);
    const [classDetails, setClassDetails] = useState({});

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
    const router = useRouter();

    // --- PERBAIKAN: showCustomAlert dipindahkan ke atas ---
    const showCustomAlert = useCallback((message, type = "success") => {
        setAlertMessage(message);
        setAlertType(type);
        setShowAlertModal(true);
    }, []);

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
    }, [user, showCustomAlert]); // showCustomAlert sebagai dependency

    const fetchUserClassesAndDetails = async (uid) => {
        try {
            const q = query(collection(db, "enrollments"), where("muridId", "==", uid));
            const snap = await getDocs(q);
            const classIds = snap.docs.map(d => d.data().kelasId);
            
            if (classIds.length > 0) {
                const classDetailsMap = {};
                const BATCH_SIZE = 10;
                for (let i = 0; i < classIds.length; i += BATCH_SIZE) {
                    const batchIds = classIds.slice(i, i + BATCH_SIZE);
                    const kelasQuery = query(collection(db, "kelas"), where(documentId(), "in", batchIds));
                    const classDocs = await getDocs(kelasQuery);
                    classDocs.forEach(doc => {
                        if (doc.exists()) {
                            classDetailsMap[doc.id] = doc.data().namaKelas;
                        }
                    });
                }
                setClassDetails(classDetailsMap);
            } else {
                setClassDetails({});
            }
            setUserClasses(classIds.length > 0 ? classIds : []);
        } catch (err) {
            console.error("Gagal mengambil kelas murid:", err);
            showCustomAlert('Gagal memuat daftar kelas Anda.', 'error');
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
        const assignmentQueries = [];
        const BATCH_SIZE = 10;
        for (let i = 0; i < userClasses.length; i += BATCH_SIZE) {
            const batchClassIds = userClasses.slice(i, i + BATCH_SIZE);
            assignmentQueries.push(
                query(
                    collection(db, "tugas"), 
                    where("kelas", "in", batchClassIds),
                    orderBy("deadline", "desc")
                )
            );
        }

        const unsubscribes = assignmentQueries.map(q => 
            onSnapshot(q, (snapshot) => {
                const tugasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAssignments(prevAssignments => {
                    const newAssignmentsMap = new Map(prevAssignments.map(a => [a.id, a]));
                    tugasData.forEach(t => newAssignmentsMap.set(t.id, t));
                    return Array.from(newAssignmentsMap.values());
                });
                setLoading(false);
            }, (error) => {
                console.error("Gagal fetch tugas:", error)
                showCustomAlert('Gagal memuat tugas.', 'error');
                setLoading(false);
            })
        );

        return () => unsubscribes.forEach(unsub => unsub());
    }, [userClasses, showCustomAlert]);

    useEffect(() => {
        if (!user || userClasses === null) return;
        if (userClasses.length === 0 && !loading) { 
             setSubmissions({}); 
             return;
        }

        const submissionQuery = query(collection(db, "assignmentSubmissions"), where("muridId", "==", user.uid));
        const unsubscribe = onSnapshot(submissionQuery, (snapshot) => {
            const newSubmissions = {};
            snapshot.forEach(doc => {
                newSubmissions[doc.data().assignmentId] = { id: doc.id, ...doc.data() };
            });
            setSubmissions(newSubmissions);
        }, (error) => {
            console.error("Gagal memuat pengumpulan tugas:", error);
            showCustomAlert('Gagal memuat status pengumpulan tugas Anda.', 'error');
        });
        return () => unsubscribe();
    }, [user, userClasses, loading, showCustomAlert]);

    const combinedTugas = useMemo(() => {
        const uniqueAssignments = Array.from(new Map(assignments.map(a => [a.id, a])).values());

        return uniqueAssignments.map(tugas => {
            const submission = submissions[tugas.id];
            const deadlineDate = tugas.deadline?.toDate ? tugas.deadline.toDate() : new Date(tugas.deadline);
            const isOverdue = new Date() > deadlineDate;
            
            let status = 'Belum Dikerjakan';
            let action = 'kumpulkan';

            if (submission) {
                status = (submission.nilai !== null && submission.nilai !== undefined) ? 'Sudah Dinilai' : 'Sudah Dikumpulkan';
                action = (status === 'Sudah Dinilai') ? 'lihat_nilai' : 'perbarui';
            } else if (isOverdue) {
                status = 'Terlambat';
                action = 'terlambat';
            }
            return { ...tugas, status, action, submissionData: submission || null };
        });
    }, [assignments, submissions]);

    // showCustomAlert sudah didefinisikan di atas
    // const showCustomAlert = useCallback((message, type = "success") => { ... }, []);
    
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
            
            const uploadTask = uploadBytesResumable(fileRef, submissionFile);
            
            await new Promise((resolve, reject) => {
                uploadTask.on('state_changed', 
                    (snapshot) => {
                        // Optional: Bisa update progress bar di UI di sini
                    }, 
                    (error) => {
                        console.error("Upload failed:", error);
                        reject(new Error(`Unggah file gagal: ${error.message}`));
                    }, 
                    async () => {
                        const submissionUrl = await getDownloadURL(uploadTask.snapshot.ref);

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
                        
                        resolve();
                    }
                );
            });
            
            setShowSubmitModal(false);
            setCurrentSubmittingTugas(null);
            showCustomAlert(`Tugas "${currentSubmittingTugas.name}" berhasil dikumpulkan!`, 'success');
        } catch (err) {
            console.error("Error submitting task:", err);
            showCustomAlert('Gagal mengumpulkan tugas. ' + err.message, 'error');
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
            case 'Sudah Dinilai': return { color: 'bg-green-100 text-green-700', icon: <CheckCircle size={16} /> };
            case 'Sudah Dikumpulkan': return { color: 'bg-yellow-100 text-yellow-700', icon: <Hourglass size={16} /> };
            case 'Terlambat': return { color: 'bg-gray-100 text-gray-700', icon: <CalendarDays size={16} /> };
            case 'Belum Dikerjakan':
            default: return { color: 'bg-red-100 text-red-700', icon: <CloseIcon size={16} /> };
        }
    };

    return (
        <MainLayout>
            <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
                <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
                    <div className={`mb-8 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Tugas Saya</h1>
                        <p className="mt-1 text-orange-600 font-semibold">
                            Kelas: {userClasses && userClasses.length > 0 ? Object.values(classDetails).join(', ') : 'Belum Terdaftar di Kelas Manapun'}
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-16">
                            <Loader className="animate-spin text-orange-500" size={32}/>
                        </div>
                    ) : userClasses && userClasses.length === 0 ? ( // Menangani kasus murid tidak terdaftar di kelas manapun
                        <div className={`text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
                            <BookOpen size={48} className="mx-auto text-gray-400" />
                            <p className="text-xl font-medium text-gray-600 mt-4">Anda belum terdaftar di kelas manapun.</p>
                            <p className="text-sm text-gray-500 mt-2">Silakan hubungi administrator atau guru Anda.</p>
                        </div>
                    ) : combinedTugas.length === 0 ? (
                        <div className={`text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
                            <CheckCircle size={48} className="mx-auto text-green-500" />
                            <p className="text-xl font-medium text-gray-600 mt-4">Tidak ada tugas yang perlu dikerjakan saat ini.</p>
                            <p className="text-sm text-gray-500 mt-2">Anda bisa bersantai sejenak!</p>
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
                                        <div className="relative">
                                            <img
                                                src={item.coverImageUrl || `/tugas.svg`}
                                                alt={`Sampul untuk ${item.name}`}
                                                className="w-full h-32 object-cover"
                                                onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/600x400/f97316/ffffff?text=Tugas`}}
                                            />
                                            <span className={`absolute top-2 right-2 px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 ${statusProps.color}`}>
                                                {statusProps.icon}
                                                {item.status}
                                            </span>
                                        </div>
                                        <div className="p-4 flex flex-col flex-grow">
                                            <p className="font-semibold text-md text-gray-800 mb-1.5 leading-tight flex-grow min-h-[3.5rem] line-clamp-3" title={item.name}>{item.name}</p>
                                            <p className="text-xs text-gray-500 mb-3">Kelas: {classDetails[item.kelas] || 'Memuat...'}</p>
                                            <div className="flex items-center text-red-600 text-xs mb-3">
                                                <CalendarDays size={14} className="mr-2 text-red-400" />
                                                <span>Batas Akhir: {item.deadline?.toDate ? item.deadline.toDate().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date(item.deadline).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                            </div>
                                            <div className="mt-auto space-y-2.5 pt-4 border-t">
                                                {/* Tombol Lihat Soal Tugas dan Video Penjelasan */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <a href={item.fileTugasUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center px-2 py-2 rounded-lg transition duration-300 text-sm font-medium w-full shadow-sm bg-blue-50 text-blue-700 hover:bg-blue-100">
                                                        <FileText size={16} className="mr-1" /> Soal
                                                    </a>
                                                    {item.fileVideoPenjelasanUrl && (
                                                        <a href={item.fileVideoPenjelasanUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center px-2 py-2 rounded-lg transition duration-300 text-sm font-medium w-full shadow-sm bg-purple-50 text-purple-700 hover:bg-purple-100">
                                                            <Video size={16} className="mr-1" /> Video
                                                        </a>
                                                    )}
                                                </div>
                                                {/* Tombol Aksi Utama (Kumpulkan, Perbarui, Lihat Nilai, Terlewat) */}
                                                {item.action === 'kumpulkan' ? (
                                                    <button onClick={() => handleOpenSubmitModal(item)} className={`flex items-center justify-center px-4 py-2.5 rounded-lg shadow-md transition duration-300 text-sm font-medium w-full ${primaryButtonColor} ${primaryButtonTextColor}`}>
                                                        <UploadCloud size={16} className="mr-2" /> Kumpulkan Tugas
                                                    </button>
                                                ) : item.action === 'perbarui' ? (
                                                    <button onClick={() => handleOpenSubmitModal(item)} className="flex items-center justify-center px-4 py-2.5 rounded-lg shadow-md transition duration-300 text-sm font-medium w-full bg-yellow-500 text-white">
                                                        <UploadCloud size={16} className="mr-2" /> Perbarui Jawaban
                                                    </button>
                                                ) : item.action === 'lihat_nilai' ? (
                                                    <button onClick={() => handleOpenNilaiModal(item)} className="flex items-center justify-center px-4 py-2.5 rounded-lg shadow-md transition duration-300 text-sm font-medium w-full bg-green-500 text-white">
                                                        <Star size={16} className="mr-2" /> Lihat Nilai
                                                    </button>
                                                ) : ( // action === 'terlambat'
                                                    <button className="flex items-center justify-center px-4 py-2.5 rounded-lg shadow-sm transition duration-300 text-sm font-medium w-full bg-gray-200 text-gray-500 cursor-not-allowed" disabled>
                                                        <CloseIcon size={16} className="mr-2" /> Batas Akhir Terlewat
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
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