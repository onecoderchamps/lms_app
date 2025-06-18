import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { db, auth } from '../../api/firebaseConfig';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Loader, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import MainLayout from './layouts/MainLayout';

export default function KerjakanUjianPage() {
  const router = useRouter();
  const { ujianId } = router.query;

  const [ujianDetails, setUjianDetails] = useState(null);
  const [soalList, setSoalList] = useState([]);
  const [answers, setAnswers] = useState({}); // { soalId: "jawaban" }
  const [timeLeft, setTimeLeft] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState('loading'); // loading, not_started, in_progress, submitted

  const timerRef = useRef(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login'); // Arahkan ke login jika tidak ada user
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  // Fetch data ujian dan soal, serta cek status pengerjaan
  useEffect(() => {
    if (!ujianId || !user) return;

    const checkAndFetchData = async () => {
        // Cek apakah ujian sudah pernah dikerjakan
        const submissionRef = doc(db, 'examSubmissions', `${ujianId}_${user.uid}`);
        const submissionSnap = await getDoc(submissionRef);

        if (submissionSnap.exists()) {
            setSubmissionStatus('submitted');
            setLoading(false);
            return;
        }

        // Jika belum, ambil data ujian dan soal
        const ujianDocRef = doc(db, "ujian", ujianId);
        const ujianSnap = await getDoc(ujianDocRef);

        if (!ujianSnap.exists()) {
            console.error("Ujian tidak ditemukan!");
            setLoading(false);
            return;
        }
        
        const ujianData = { id: ujianSnap.id, ...ujianSnap.data() };
        setUjianDetails(ujianData);
        setTimeLeft(ujianData.durationMinutes * 60);

        const soalQuery = query(collection(db, "soalUjian"), where("idUjian", "==", ujianId), orderBy("createdAt", "asc"));
        const unsubscribeSoal = onSnapshot(soalQuery, (snapshot) => {
            const soalData = snapshot.docs.map(s => ({ id: s.id, ...s.data() }));
            setSoalList(soalData);
            setLoading(false);
            setSubmissionStatus('in_progress');
        });

        return () => unsubscribeSoal();
    };

    checkAndFetchData();
  }, [ujianId, user]);
  
  // Logika Timer
  useEffect(() => {
    if (submissionStatus !== 'in_progress' || timeLeft === null) return;

    if (timeLeft <= 0) {
        handleSubmitUjian();
        return;
    }

    timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, submissionStatus]);


  const handleAnswerChange = (soalId, answer) => {
    setAnswers(prev => ({ ...prev, [soalId]: answer }));
  };

  const handleSubmitUjian = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    clearInterval(timerRef.current); // Hentikan timer

    let score = 0;
    const totalPilihanGanda = soalList.filter(s => s.tipeSoal === 'Pilihan Ganda').length;
    const scorePerSoal = totalPilihanGanda > 0 ? 100 / totalPilihanGanda : 0;

    const detailedAnswers = soalList.map(soal => {
        const studentAnswer = answers[soal.id] || "";
        let isCorrect = false;
        if (soal.tipeSoal === 'Pilihan Ganda' && studentAnswer === soal.jawaban) {
            score += scorePerSoal;
            isCorrect = true;
        }
        return {
            soalId: soal.id,
            questionText: soal.soal,
            studentAnswer: studentAnswer,
            correctAnswer: soal.jawaban || '',
            isCorrect: isCorrect,
            tipeSoal: soal.tipeSoal
        };
    });

    try {
        const submissionId = `${ujianId}_${user.uid}`;
        const submissionRef = doc(db, 'examSubmissions', submissionId);

        await setDoc(submissionRef, {
            ujianId: ujianId,
            muridId: user.uid,
            kelasId: ujianDetails.kelas,
            namaSiswa: user.displayName || user.email,
            namaUjian: ujianDetails.name,
            answers: detailedAnswers,
            score: Math.round(score),
            submittedAt: serverTimestamp(),
            status: 'Selesai'
        });

        setSubmissionStatus('submitted');
    } catch (error) {
        console.error("Gagal menyimpan jawaban:", error);
        alert("Terjadi kesalahan saat menyimpan jawaban Anda.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
        <MainLayout>
            <div className="flex justify-center items-center h-screen">
                <Loader className="animate-spin text-orange-500" size={48} />
            </div>
        </MainLayout>
    );
  }

  if (submissionStatus === 'submitted') {
    return (
        <MainLayout>
            <div className="flex flex-col justify-center items-center h-screen text-center p-4">
                <CheckCircle size={64} className="text-green-500 mb-4" />
                <h1 className="text-3xl font-bold text-gray-800">Ujian Telah Selesai</h1>
                <p className="text-gray-600 mt-2">Anda sudah pernah mengerjakan ujian ini. Jawaban Anda telah berhasil disimpan.</p>
                <button onClick={() => router.push('/murid/ujian')} className="mt-6 px-6 py-2 bg-orange-500 text-white rounded-lg shadow-md hover:bg-orange-600">
                    Kembali ke Daftar Ujian
                </button>
            </div>
        </MainLayout>
    );
  }

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-4xl mx-auto">
          {/* Header Ujian */}
          <div className="bg-white rounded-xl shadow-xl p-6 md:p-8 mb-8 sticky top-20 z-10">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{ujianDetails?.name}</h1>
            <div className="flex items-center justify-between mt-4 border-t pt-4">
                <p className="text-sm text-gray-500">Kerjakan dengan jujur dan teliti.</p>
                <div className="flex items-center text-lg font-bold bg-red-100 text-red-600 px-4 py-2 rounded-lg">
                    <Clock size={20} className="mr-2"/>
                    <span>Sisa Waktu: {formatTime(timeLeft)}</span>
                </div>
            </div>
          </div>

          {/* Daftar Soal */}
          <div className="space-y-6">
            {soalList.map((soal, index) => (
              <div key={soal.id} className="bg-white rounded-xl shadow-lg p-6">
                <p className="text-sm text-gray-500 font-medium">Pertanyaan #{index + 1}</p>
                <p className="mt-2 text-gray-800 text-lg whitespace-pre-wrap">{soal.soal}</p>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                    {soal.tipeSoal === "Pilihan Ganda" ? (
                        <div className="space-y-3">
                            {soal.pilihan.map((p, i) => (
                                <label key={i} className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-orange-50 cursor-pointer transition-colors">
                                    <input 
                                        type="radio"
                                        name={soal.id}
                                        value={p}
                                        checked={answers[soal.id] === p}
                                        onChange={() => handleAnswerChange(soal.id, p)}
                                        className="form-radio h-5 w-5 text-orange-600 focus:ring-orange-500"
                                    />
                                    <span className="ml-3 text-gray-700">{p}</span>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div>
                            <textarea
                                rows="5"
                                value={answers[soal.id] || ''}
                                onChange={(e) => handleAnswerChange(soal.id, e.target.value)}
                                placeholder="Tulis jawaban Anda di sini..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                    )}
                </div>
              </div>
            ))}
          </div>

          {/* Tombol Selesai */}
          <div className="mt-10 flex justify-center">
                <button 
                    onClick={handleSubmitUjian}
                    disabled={isSubmitting}
                    className="flex items-center space-x-2 w-full max-w-sm justify-center px-6 py-4 text-lg font-bold bg-orange-500 text-white rounded-xl shadow-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-wait"
                >
                    <CheckCircle size={24} />
                    <span>{isSubmitting ? 'Mengumpulkan...' : 'Selesai & Kumpulkan Jawaban'}</span>
                </button>
          </div>
        </div>
      </main>
    </MainLayout>
  );
}