import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import MainLayout from './layouts/MainLayout';
import { app, db } from '../../api/firebaseConfig';
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    doc,
    updateDoc,
    where,
    getDocs,
    serverTimestamp,
    getDoc
} from 'firebase/firestore';
import { FileText, X as CloseIcon, Loader, ArrowLeft, Save, Eye, Check, X as IconX } from 'lucide-react';
import Link from 'next/link';

export default function BeriNilaiUjianPage() {
    const router = useRouter();
    const [activeClass, setActiveClass] = useState({ id: null, name: null });
    const [ujianList, setUjianList] = useState([]);
    const [selectedUjianId, setSelectedUjianId] = useState('');
    
    const [submissions, setSubmissions] = useState([]);
    const [skorTambahan, setSkorTambahan] = useState({});
    const [originalSkorTambahan, setOriginalSkorTambahan] = useState({});


    const [showJawabanModal, setShowJawabanModal] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    
    const [loadingUjian, setLoadingUjian] = useState(true);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState({}); 

    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');
    const [hasMounted, setHasMounted] = useState(false);

    const showCustomAlert = useCallback((message, type = "success") => {
        setAlertMessage(message);
        setAlertType(type);
        setShowAlertModal(true);
    }, []);

    useEffect(() => {
        setHasMounted(true);
        const classId = localStorage.getItem('idKelas');
        const className = localStorage.getItem('namaKelas');
        if (classId && className) {
            setActiveClass({ id: classId, name: className });
        } else {
            setLoadingUjian(false);
        }
    }, []);

    useEffect(() => {
        if (!activeClass.id) return;

        const q = query(
            collection(db, "ujian"),
            where("kelas", "==", activeClass.id),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ujians = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUjianList(ujians);
            setLoadingUjian(false);
        }, (error) => {
            console.error("Gagal mengambil data ujian: ", error);
            showCustomAlert("Gagal memuat daftar ujian.", "error");
            setLoadingUjian(false);
        });

        return () => unsubscribe();
    }, [activeClass.id, showCustomAlert]);

    useEffect(() => {
        if (!selectedUjianId) {
            setSubmissions([]);
            setSkorTambahan({});
            setOriginalSkorTambahan({});
            return;
        }

        setLoadingSubmissions(true);
        const submissionsQuery = query(collection(db, "examSubmissions"), where("ujianId", "==", selectedUjianId), orderBy("submittedAt", "desc"));
        
        const unsubscribe = onSnapshot(submissionsQuery, async (snapshot) => { // async ditambahkan di sini
                const fetchedSubmissionsPromises = snapshot.docs.map(async (d) => {
                    const submissionData = d.data();
                    // Ambil detail murid dari koleksi 'users'
                    let namaSiswa = 'Nama tidak ditemukan';
                    if (submissionData.muridId) {
                        const userDocRef = doc(db, 'users', submissionData.muridId);
                        const userSnap = await getDoc(userDocRef);
                        if (userSnap.exists()) {
                            namaSiswa = userSnap.data().namaLengkap || userSnap.data().displayName || namaSiswa;
                        }
                    }
                    return { id: d.id, ...submissionData, namaSiswa }; // Tambahkan namaSiswa ke objek
                });

                const fetchedSubmissions = await Promise.all(fetchedSubmissionsPromises); // Tunggu semua Promise selesai

                setSubmissions(fetchedSubmissions);

                const initialSkor = {};
                const initialOriginalSkor = {};
                const initialSubmittingState = {};
                fetchedSubmissions.forEach(sub => {
                    initialSkor[sub.id] = Number(sub.skorTambahan) || ''; 
                    initialOriginalSkor[sub.id] = Number(sub.skorTambahan) || 0;
                    initialSubmittingState[sub.id] = false; 
                });
                setSkorTambahan(initialSkor);
                setOriginalSkorTambahan(initialOriginalSkor);
                setIsSubmitting(initialSubmittingState); 
                setLoadingSubmissions(false);
            }, (error) => {
                console.error("Gagal fetch data pengumpulan:", error);
                showCustomAlert("Gagal memuat data pengumpulan siswa.", "error");
                setLoadingSubmissions(false);
            }
        );

        return () => unsubscribe();
    }, [selectedUjianId, showCustomAlert]); 
    
    const handleSkorTambahanChange = (submissionId, value) => {
        setSkorTambahan(prev => ({ ...prev, [submissionId]: value })); 
    };

    const handleOpenJawabanModal = (submission) => {
        setSelectedSubmission(submission);
        setShowJawabanModal(true);
    };

    const handleSimpanNilaiPerMurid = async (submission) => {
        const currentSkorTambahanInput = skorTambahan[submission.id];
        const skorTambahanValue = Number(currentSkorTambahanInput);

        if (currentSkorTambahanInput === '' || isNaN(skorTambahanValue)) {
            showCustomAlert('Skor tambahan harus berupa angka!', 'error');
            return;
        }

        setIsSubmitting(prev => ({ ...prev, [submission.id]: true }));
        try {
            const skorOtomatis = submission.score || 0;
            const nilaiAkhir = Math.min(100, skorOtomatis + skorTambahanValue);

            const submissionDocRef = doc(db, "examSubmissions", submission.id);
            
            await updateDoc(submissionDocRef, {
                skorTambahan: skorTambahanValue,
                nilai: nilaiAkhir,
                status: 'Sudah Dinilai',
                dinilaiPada: serverTimestamp()
            });

            setOriginalSkorTambahan(prev => ({ ...prev, [submission.id]: skorTambahanValue }));

            showCustomAlert(`Nilai untuk ${submission.namaSiswa} berhasil disimpan!`, 'success');
        } catch (error) {
            console.error("Gagal menyimpan nilai per murid: ", error);
            showCustomAlert('Terjadi kesalahan saat menyimpan nilai.', 'error');
        } finally {
            setIsSubmitting(prev => ({ ...prev, [submission.id]: false }));
        }
    };

    const primaryButtonColor = "bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500";
    const primaryButtonTextColor = "text-white";
    const inputFocusColor = "focus:ring-orange-500 focus:border-orange-500";

    if (hasMounted && !activeClass.id) {
        return (
            <MainLayout>
                <main className="flex-1 md:ml-64 md:pt-16 p-4 flex items-center justify-center min-h-screen">
                    <div className="text-center bg-white p-10 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold text-red-600">Akses Ditolak</h2>
                        <p className="text-gray-600 mt-2 mb-6">Anda harus memilih kelas terlebih dahulu untuk memberi nilai.</p>
                        <Link href="/guru">
                            <button className="flex items-center justify-center mx-auto px-5 py-2.5 bg-orange-500 text-white rounded-lg shadow-md hover:bg-orange-600">
                                <ArrowLeft size={18} className="mr-2" />
                                Kembali ke Pemilihan Kelas
                            </button>
                        </Link>
                    </div>
                </main>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
                <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
                    <div className={`mb-8 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Beri Nilai Ujian</h1>
                        <p className="text-md text-orange-600 font-semibold mt-1">Untuk Kelas: {activeClass.name}</p>
                    </div>

                    <div className={`p-5 bg-gray-50 rounded-lg shadow-sm border border-gray-200 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
                        <label htmlFor="ujian-select" className="block text-sm font-medium text-gray-700 mb-1">Pilih Ujian yang Akan Dinilai</label>
                        <select
                            id="ujian-select"
                            value={selectedUjianId}
                            onChange={(e) => setSelectedUjianId(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 bg-white"
                            disabled={loadingUjian}
                        >
                            <option value="">-- Pilih Ujian --</option>
                            {ujianList.map(ujian => (
                                <option key={ujian.id} value={ujian.id}>{ujian.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedUjianId && (
                        <div className={`mt-8 overflow-x-auto rounded-lg shadow-md border border-gray-200 ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Murid</th>
                                        <th className="px-5 py-3.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Skor Otomatis (PG)</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skor Tambahan (Esai)</th>
                                        <th className="px-5 py-3.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Nilai Akhir</th>
                                        <th className="px-5 py-3.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loadingSubmissions ? (
                                        <tr><td colSpan="6" className="text-center p-10 text-gray-500"><Loader className="animate-spin inline-block mr-2" /> Memuat data pengumpulan...</td></tr>
                                    ) : submissions.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center p-10 text-gray-500">Belum ada siswa yang mengerjakan ujian ini.</td></tr>
                                    ) : (
                                        submissions.map((sub, index) => (
                                            <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                                                <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}.</td>
                                                {/* --- PERBAIKAN: Menampilkan namaSiswa --- */}
                                                <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sub.namaSiswa || sub.muridId}</td> {/* Fallback ke muridId jika namaSiswa belum ada */}
                                                <td className="px-5 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-700">{sub.score || 0}</td>
                                                <td className="px-5 py-4 whitespace-nowrap text-sm">
                                                    <input 
                                                        type="number" 
                                                        min="0" 
                                                        value={skorTambahan[sub.id] === undefined ? '' : skorTambahan[sub.id]} 
                                                        onChange={(e) => handleSkorTambahanChange(sub.id, e.target.value)}
                                                        className={`w-24 border border-gray-300 rounded-md px-2 py-1.5 text-center focus:ring-orange-500 focus:border-orange-500`} 
                                                        placeholder="0" 
                                                        disabled={isSubmitting[sub.id] || false} 
                                                    />
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap text-sm text-center font-bold text-orange-600">
                                                    {Math.min(100, (sub.score || 0) + (Number(skorTambahan[sub.id]) || 0))}
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <div className='flex items-center justify-center gap-2'>
                                                        <button 
                                                            onClick={() => handleOpenJawabanModal(sub)} 
                                                            className="text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors"
                                                            aria-label="Lihat Jawaban"
                                                        >
                                                            <Eye size={16}/> Lihat
                                                        </button>
                                                        <button 
                                                            onClick={() => handleSimpanNilaiPerMurid(sub)} 
                                                            disabled={isSubmitting[sub.id] || false} 
                                                            className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg shadow-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                                                (Number(skorTambahan[sub.id]) || 0) !== (Number(originalSkorTambahan[sub.id]) || 0) 
                                                                ? primaryButtonColor 
                                                                : "bg-gray-200 text-gray-800 hover:bg-gray-300" 
                                                            }`} 
                                                            aria-label="Simpan Nilai"
                                                        >
                                                            <Save size={16}/> {isSubmitting[sub.id] ? 'Menyimpan...' : 'Simpan'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                
                {/* Modal Lihat Jawaban */}
                {showJawabanModal && selectedSubmission && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
                        <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-3xl relative animate-fade-in-up my-8">
                            <button onClick={() => setShowJawabanModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><CloseIcon size={24}/></button>
                            <h2 className="text-xl font-semibold mb-1 text-gray-800">Detail Jawaban Siswa</h2>
                            <p className='text-sm text-gray-500 mb-2'>Nama: <span className='font-medium'>{selectedSubmission.namaSiswa}</span></p>
                            <p className='text-sm text-gray-500 mb-4'>Skor Pilihan Ganda: <span className='font-bold text-green-600'>{selectedSubmission.score}</span></p>

                            <div className='max-h-[60vh] overflow-y-auto space-y-5 pr-3 border-t pt-4'>
                                {selectedSubmission.answers.map((ans, idx) => (
                                    <div key={idx} className='border-b pb-4'>
                                        <p className='text-xs text-gray-500'>Soal #{idx + 1}</p>
                                        <p className='font-medium text-gray-700 mt-1 whitespace-pre-wrap'>{ans.questionText}</p>
                                        
                                        {ans.tipeSoal === 'Pilihan Ganda' ? (
                                            <div className='mt-2 space-y-1 text-sm'>
                                                <p className={`flex items-start gap-2 ${ans.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                                    <span className='font-semibold'>Jawaban Murid:</span>
                                                    <span>{ans.studentAnswer || <span className='italic'>Tidak dijawab</span>}</span>
                                                    {ans.isCorrect ? <Check size={18} /> : <IconX size={18} />}
                                                </p>
                                                {!ans.isCorrect && (
                                                    <p className='flex items-start gap-2 text-gray-600'>
                                                        <span className='font-semibold'>Kunci Jawaban:</span>
                                                        <span>{ans.correctAnswer}</span>
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className='mt-2 p-3 bg-gray-50 rounded-md'>
                                                <p className='text-sm text-gray-800'>{ans.studentAnswer || <span className='italic text-gray-400'>Tidak dijawab</span>}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Alert Kustom */}
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
                `}</style>
            </main>
        </MainLayout>
    );
}