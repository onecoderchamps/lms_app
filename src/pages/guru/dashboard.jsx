'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import MainLayout from './layouts/MainLayout';
import Link from 'next/link';
import {
    Users,
    BookOpen,
    Edit,
    MonitorPlay, // Ikon untuk Sesi Live Mendatang
    MessageSquare,
    X as CloseIcon,
    Loader,
    AlertTriangle,
    CheckCircle,
    Trash2,
    User, // Untuk ikon member
    CalendarDays // Untuk ikon Kalender Akademik
} from 'lucide-react';
import { useAuth } from '@/component/AuthProvider';
import { db } from "../../api/firebaseConfig";
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp,
    deleteDoc,
    doc,
    orderBy
} from 'firebase/firestore';

// Import DashboardCalendar dari komponen murid
import DashboardCalendar from '../murid/component/calendar'; // Sesuaikan path ini jika DashboardCalendar tidak di folder murid/component

// --- BAGIAN 1: HELPER & KOMPONEN KECIL ---

const Notification = ({ notification, onClear }) => {
    if (!notification) return null;
    const isSuccess = notification.type === 'success';
    const bgColor = isSuccess ? 'bg-green-500' : 'bg-red-500';
    const Icon = isSuccess ? CheckCircle : AlertTriangle;

    return (
        <div className={`fixed bottom-5 right-5 z-[100] flex items-center gap-4 p-4 rounded-lg text-white shadow-lg animate-fade-in-up ${bgColor}`}>
            <Icon size={24} />
            <p className="flex-1">{notification.message}</p>
            <button onClick={onClear} className="p-1 rounded-full hover:bg-white/20"><CloseIcon size={18} /></button>
        </div>
    );
};

const DashboardCard = ({ title, value, icon: IconComponent, bgColorClasses, link, linkText, animationDelay }) => {
    return (
        <div
            className={`rounded-xl shadow-lg p-5 md:p-6 text-white hover:opacity-90 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up flex flex-col justify-between ${bgColorClasses}`}
            style={{ animationDelay }}
        >
            <div>
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-base sm:text-lg font-semibold uppercase tracking-wider">{title}</h3>
                    <div className="p-2.5 rounded-full bg-white/20">
                        {IconComponent && <IconComponent size={28} strokeWidth={1.5} />}
                    </div>
                </div>
                <p className="text-3xl sm:text-4xl font-bold mb-1">{value}</p>
            </div>
            {link && linkText && (
                <Link href={link} className="text-sm font-medium hover:underline mt-3 pt-2 block self-start">
                    {linkText} &rarr;
                </Link>
            )}
        </div>
    );
};

const SummaryChart = ({ data, animationDelay }) => {
    const [chartJsLoaded, setChartJsLoaded] = useState(false);
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/chart.js";
        script.async = true;
        script.onload = () => {
            setChartJsLoaded(true);
        };
        script.onerror = (e) => {
            console.error("SummaryChart: FAILED to load Chart.js script.", e);
        };
        document.body.appendChild(script);
        return () => {
            document.body.contains(script) && document.body.removeChild(script);
        };
    }, []);

    useEffect(() => {
        if (chartJsLoaded && data && chartRef.current) {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            if (typeof window !== 'undefined' && window.Chart) {
                const Chart = window.Chart;
                const ctx = chartRef.current.getContext("2d");

                const chartData = {
                    labels: ['Total Murid', 'Materi', 'Tugas Perlu Dinilai', 'Sesi Live'],
                    datasets: [{
                        label: 'Jumlah',
                        data: [data.totalMurid, data.totalMateri, data.tugasPerluDinilai, data.sesiLiveMendatang],
                        backgroundColor: [
                            'rgba(59, 130, 246, 0.7)',
                            'rgba(99, 102, 241, 0.7)',
                            'rgba(251, 191, 36, 0.7)',
                            'rgba(168, 85, 247, 0.7)'
                        ],
                        borderColor: [
                            'rgb(59, 130, 246)',
                            'rgb(99, 102, 241)',
                            'rgb(251, 191, 36)',
                            'rgb(168, 85, 247)'
                        ],
                        borderWidth: 1
                    }]
                };

                chartInstanceRef.current = new Chart(ctx, {
                    type: 'bar',
                    data: chartData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    precision: 0
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        let label = context.dataset.label || '';
                                        if (label) {
                                            label += ': ';
                                        }
                                        if (context.parsed.y !== null) {
                                            label += context.parsed.y;
                                        }
                                        return label;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }
        return () => {
            if (chartInstanceRef.current) chartInstanceRef.current.destroy();
        };
    }, [chartJsLoaded, data]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in-up" style={{ animationDelay }}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Ringkasan Data Kelas</h3>
            <div className="relative" style={{ height: 300 }}>
                {!chartJsLoaded ? (
                    <div className="flex items-center justify-center h-full text-gray-500"><Loader className="animate-spin mr-2" /> Memuat Grafik...</div>
                ) : (data && Object.keys(data).length > 0 && (data.totalMurid + data.totalMateri + data.tugasPerluDinilai + data.sesiLiveMendatang > 0)) ? (
                    <canvas ref={chartRef}></canvas>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">Tidak ada data untuk grafik.</div>
                )}
            </div>
        </div>
    );
};


// --- BAGIAN 2: KOMPONEN UTAMA HALAMAN GURU ---

export default function GuruDashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeClass, setActiveClass] = useState({ id: null, name: null });

    const [summaryData, setSummaryData] = useState({
        totalMurid: 0,
        totalMateri: 0,
        tugasPerluDinilai: 0,
        sesiLiveMendatang: 0,
    });
    const [loading, setLoading] = useState(true);
    const [hasMounted, setHasMounted] = useState(false);

    const [showPengumumanModal, setShowPengumumanModal] = useState(false);
    const [pengumumanText, setPengumumanText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [announcements, setAnnouncements] = useState([]);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [announcementToDelete, setAnnouncementToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(true);

    const [enrolledKelasIds, setEnrolledKelasIds] = useState([]);


    const [notification, setNotification] = useState(null);
    const showNotification = useCallback((message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    }, []);

    const fetchDashboardData = useCallback(async (kelasId) => {
        if (!kelasId) return;
        setLoading(true);
        try {
            const enrollmentsSnap = await getDocs(query(collection(db, "enrollments"), where("kelasId", "==", kelasId)));
            const materiSnap = await getDocs(query(collection(db, "materi"), where("kelas", "==", kelasId)));
            const submissionsSnap = await getDocs(query(collection(db, "assignmentSubmissions"), where("kelasId", "==", kelasId), where("nilai", "==", null)));
            const sesiLiveSnap = await getDocs(query(collection(db, "sesiLive"), where("kelas", "==", kelasId))); 

            let sesiLiveMendatangCount = 0;
            
            sesiLiveSnap.forEach(doc => {
                const sesi = doc.data();
                if (sesi.date && sesi.time) {
                    const sesiDateTimeString = `${sesi.date}T${sesi.time}`;
                    const currentDateTimeString = new Date().toISOString().slice(0, 16);

                    if (sesiDateTimeString > currentDateTimeString) {
                        sesiLiveMendatangCount++;
                    }
                }
            });

            setSummaryData({
                totalMurid: enrollmentsSnap.size,
                totalMateri: materiSnap.size,
                tugasPerluDinilai: submissionsSnap.size,
                sesiLiveMendatang: sesiLiveMendatangCount,
            });

        } catch (error) {
            console.error("Gagal mengambil data dashboard:", error);
            showNotification("Gagal memuat data dasbor. Pastikan data Firestore sesuai format.", "error");
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    const fetchAnnouncements = useCallback(async (kelasId) => {
        if (!kelasId) return;
        setLoadingAnnouncements(true);
        try {
            const q = query(
                collection(db, "pengumuman"),
                where("kelasId", "==", kelasId),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const fetchedAnnouncements = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAnnouncements(fetchedAnnouncements);
        } catch (error) {
            console.error("Gagal mengambil pengumuman:", error);
            showNotification("Gagal memuat pengumuman.", "error");
        } finally {
            setLoadingAnnouncements(false);
        }
    }, [showNotification]);

    const fetchMembers = useCallback(async (kelasId) => {
        if (!kelasId) return;
        setLoadingMembers(true);
        try {
            const enrollmentsQuery = query(collection(db, "enrollments"), where("kelasId", "==", kelasId));
            const enrollmentsSnap = await getDocs(enrollmentsQuery);
            
            const memberIds = enrollmentsSnap.docs.map(doc => doc.data().muridId);
            const fetchedMembers = [];

            if (memberIds.length > 0) {
                const BATCH_SIZE = 10;
                for (let i = 0; i < memberIds.length; i += BATCH_SIZE) {
                    const batchIds = memberIds.slice(i, i + BATCH_SIZE);
                    const usersQuery = query(collection(db, "users"), where("uid", "in", batchIds));
                    const usersSnap = await getDocs(usersQuery);
                    usersSnap.forEach(userDoc => {
                        fetchedMembers.push({ id: userDoc.id, ...userDoc.data() });
                    });
                }
            }
            
            setMembers(fetchedMembers);
        } catch (error) {
            console.error("Gagal mengambil daftar member:", error);
            showNotification("Gagal memuat daftar member.", "error");
        } finally {
            setLoadingMembers(false);
        }
    }, [showNotification]);

    const confirmDeletePengumuman = (announcement) => {
        setAnnouncementToDelete(announcement);
        setShowDeleteConfirmModal(true);
    };

    const handleDeletePengumumanConfirmed = async () => {
        if (!announcementToDelete) return;

        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, "pengumuman", announcementToDelete.id));
            setAnnouncements(prev => prev.filter(ann => ann.id !== announcementToDelete.id));
            showNotification("Pengumuman berhasil dihapus!");
            setShowDeleteConfirmModal(false);
            setAnnouncementToDelete(null);
        } catch (error) {
            console.error("Gagal menghapus pengumuman:", error);
            showNotification("Gagal menghapus pengumuman.", "error");
        } finally {
            setIsDeleting(false);
        }
    };


    useEffect(() => {
        setHasMounted(true);
        const idKelas = localStorage.getItem("idKelas");
        const namaKelas = localStorage.getItem("namaKelas");

        if (idKelas && user) {
            setActiveClass({ id: idKelas, name: namaKelas });
            setEnrolledKelasIds([idKelas]); 
            
            fetchDashboardData(idKelas);
            fetchAnnouncements(idKelas);
            fetchMembers(idKelas);
        } else {
            setLoading(false);
            setLoadingAnnouncements(false);
            setLoadingMembers(false);
            setEnrolledKelasIds([]);
            if (user?.role === 'guru') {
                router.push('/guru/manajemen-kelas');
            }
        }
    }, [user, fetchDashboardData, fetchAnnouncements, fetchMembers, router]);

    const handleKirimPengumuman = async () => {
        if (!pengumumanText.trim() || !activeClass.id) {
            showNotification('Pengumuman tidak boleh kosong!', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const docRef = await addDoc(collection(db, 'pengumuman'), {
                isi: pengumumanText,
                kelasId: activeClass.id,
                namaKelas: activeClass.name,
                guruId: user.uid,
                namaGuru: user.namaLengkap,
                createdAt: serverTimestamp(),
            });

            setAnnouncements(prev => [
                {
                    id: docRef.id,
                    isi: pengumumanText,
                    kelasId: activeClass.id,
                    namaKelas: activeClass.name,
                    guruId: user.uid,
                    namaGuru: user.namaLengkap,
                    createdAt: { toDate: () => new Date() }
                },
                ...prev
            ]);

            showNotification('Pengumuman berhasil dikirim!');
            setShowPengumumanModal(false);
            setPengumumanText('');

        } catch (error) {
            console.error("Gagal mengirim pengumuman:", error);
            showNotification('Terjadi kesalahan saat mengirim pengumuman.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderContent = () => {
        if (loading) {
            return <div className="flex justify-center items-center h-64"><Loader className="animate-spin text-orange-500" size={40} /></div>;
        }

        if (!activeClass.id) {
            return (
                <div className="text-center py-20 animate-fade-in-up">
                    <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-700">Tidak Ada Kelas yang Aktif</h2>
                    <p className="text-gray-500 mt-2 mb-6">Silakan pilih kelas terlebih dahulu dari halaman Manajemen Kelas.</p>
                    <Link href="/guru/manajemen-kelas">
                        <button className="bg-orange-500 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-orange-600 transition">
                            Pilih Kelas Sekarang
                        </button>
                    </Link>
                </div>
            );
        }

        return (
            <>
                {/* Bagian Ringkasan Dashboard (Kartu) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-8">
                    <DashboardCard title="Total Murid" value={summaryData.totalMurid} icon={Users} bgColorClasses="bg-gradient-to-br from-blue-500 to-blue-700" link="/guru/member" linkText="Kelola Murid" animationDelay="0.2s" />
                    <DashboardCard title="Total Materi" value={summaryData.totalMateri} icon={BookOpen} bgColorClasses="bg-gradient-to-br from-indigo-500 to-indigo-700" link="/guru/materi" linkText="Lihat Materi" animationDelay="0.3s" />
                    <DashboardCard title="Tugas Perlu Dinilai" value={summaryData.tugasPerluDinilai} icon={Edit} bgColorClasses="bg-gradient-to-br from-amber-500 to-amber-600" link="/guru/berikan-nilai" linkText="Beri Nilai" animationDelay="0.4s" />
                    <DashboardCard title="Sesi Live Mendatang" value={summaryData.sesiLiveMendatang} icon={MonitorPlay} bgColorClasses="bg-gradient-to-br from-purple-500 to-purple-700" link="/guru/sesi-live" linkText="Kelola Sesi Live" animationDelay="0.5s" />
                </div>

                {/* Bagian Grafik & Pengumuman */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                    {/* Kolom Kiri: Grafik Ringkasan */}
                    <div className="xl:col-span-2">
                        <SummaryChart data={summaryData} animationDelay="0.6s" />
                    </div>

                    {/* Kolom Kanan: Pengumuman dengan Tombol di Atas */}
                    <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in-up flex flex-col" style={{ animationDelay: "0.7s" }}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Pengumuman Kelas</h3>
                            <button onClick={() => setShowPengumumanModal(true)} className="flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg shadow-md text-sm font-medium">
                                <MessageSquare size={16} /><span>Buat</span>
                            </button>
                        </div>
                        
                        {loadingAnnouncements ? (
                            <div className="flex justify-center items-center h-24 text-gray-500">
                                <Loader className="animate-spin mr-2" size={20} /> Memuat pengumuman...
                            </div>
                        ) : announcements.length > 0 ? (
                            <ul className="space-y-4 max-h-64 overflow-y-auto pr-2">
                                {announcements.map((ann) => (
                                    <li key={ann.id} className="border-b pb-3 last:border-b-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{ann.isi}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {ann.createdAt?.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) || 'Tanggal tidak tersedia'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => confirmDeletePengumuman(ann)}
                                                className="ml-2 p-1 rounded-full text-red-500 hover:bg-red-100 transition"
                                                title="Hapus Pengumuman"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">Belum ada pengumuman untuk kelas ini.</p>
                        )}
                    </div>
                </div>

                {/* --- Bagian Daftar Member (KIRI) dan Kalender Akademik (KANAN) --- */}
                {/* Gunakan grid 2 kolom dengan xl:grid-cols-2 untuk layar besar */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                    {/* Kolom Kiri: Daftar Member */}
                    <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in-up" style={{ animationDelay: "0.9s" }}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Daftar Member Kelas</h3>
                            <User size={24} className="text-gray-500" />
                        </div>
                        {loadingMembers ? (
                            <div className="flex justify-center items-center h-48 text-gray-500">
                                <Loader className="animate-spin mr-2" size={30} /> Memuat daftar member...
                            </div>
                        ) : members.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Murid</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {members.map((member, index) => (
                                            <tr key={member.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}.</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.namaLengkap}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">Belum ada member terdaftar di kelas ini.</p>
                        )}
                    </div>

                    {/* Kolom Kanan: Kalender Akademik */}
                    <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in-up" style={{ animationDelay: "1.0s" }}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Kalender Akademik</h3>
                            <CalendarDays size={24} className="text-gray-500" /> {/* Ikon Kalender */}
                        </div>
                        {/* Menggunakan komponen DashboardCalendar, meneruskan enrolledKelasIds */}
                        <DashboardCalendar enrolledKelasIds={enrolledKelasIds} />
                    </div>
                </div>
            </>
        );
    };

    return (
        <MainLayout>
            <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen mt-15">
                <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
                    <div className={`mb-8 ${hasMounted ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: "0.1s" }}>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                            Dashboard Kelas: <span className='text-orange-600'>{activeClass.name || 'Pilih Kelas'}</span>
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Selamat datang kembali, {user?.namaLengkap || 'Guru'}! Berikut ringkasan aktivitas kelas Anda.
                        </p>
                    </div>

                    {renderContent()}
                </div>

                {showPengumumanModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up">
                            <button onClick={() => setShowPengumumanModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><CloseIcon size={24} /></button>
                            <h2 className="text-xl font-semibold mb-1 text-gray-800">Buat Pengumuman Baru</h2>
                            <p className="text-sm text-gray-500 mb-6">Untuk Kelas: <span className="font-bold text-orange-600">{activeClass.name}</span></p>
                            <div>
                                <textarea
                                    value={pengumumanText}
                                    onChange={(e) => setPengumumanText(e.target.value)}
                                    rows={5}
                                    placeholder="Ketik isi pengumuman Anda di sini..."
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-6">
                                <button type="button" onClick={() => setShowPengumumanModal(false)} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                                <button
                                    type="button"
                                    onClick={handleKirimPengumuman}
                                    disabled={isSubmitting || !pengumumanText.trim()}
                                    className="px-5 py-2.5 bg-orange-500 text-white rounded-lg shadow-md hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Mengirim...' : 'Kirim Pengumuman'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showDeleteConfirmModal && announcementToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up">
                            <h3 className="text-xl font-semibold text-gray-800 mb-3">Konfirmasi Hapus</h3>
                            <p className="text-gray-600 mb-6 text-sm">
                                Yakin hapus pengumuman:{" "}
                                <strong className="text-gray-900 line-clamp-2">
                                    "{announcementToDelete.isi}"
                                </strong>
                                ? Tindakan ini tidak dapat diurungkan.
                            </p>
                            <div className="flex justify-center space-x-3">
                                <button
                                    type="button"
                                    className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                    onClick={() => {
                                        setShowDeleteConfirmModal(false);
                                        setAnnouncementToDelete(null);
                                    }}
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    disabled={isDeleting}
                                    className="px-5 py-2.5 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 disabled:opacity-50"
                                    onClick={handleDeletePengumumanConfirmed}
                                >
                                    {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <Notification notification={notification} onClear={() => setNotification(null)} />
            </main>

            <style jsx global>{`
                /* Styling yang relevan jika ada, untuk elemen umum atau komponen */
                /* Animasi */
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; opacity: 0; }
                .is-visible { opacity: 1; }
            `}</style>
        </MainLayout>
    );
}