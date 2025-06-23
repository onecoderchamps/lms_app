"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import MainLayout from "./layouts/MainLayout";
import { db } from "../../api/firebaseConfig";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import {
  Users,
  User,
  BookCopy,
  UserPlus,
  BookPlus,
  Loader,
  AlertTriangle,
  X as CloseIcon,
  CheckCircle,
} from "lucide-react";

// --- BAGIAN 1: FUNGSI HELPER & API ---

/**
 * // -- BARU: Fungsi ini mengisolasi semua logika pengambilan dan pemrosesan data dasbor.
 * Mengambil dan memproses semua data yang dibutuhkan untuk dasbor dari Firestore.
 * @returns {Promise<Object>} Objek yang berisi semua data yang telah diproses.
 */
const fetchDashboardData = async () => {
  const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
  const kelasQuery = query(collection(db, "kelas"), orderBy("createdAt", "desc"));
  const enrollmentsQuery = query(collection(db, "enrollments"));

  const [usersSnapshot, kelasSnapshot, enrollmentsSnapshot] = await Promise.all([
    getDocs(usersQuery),
    getDocs(kelasQuery),
    getDocs(enrollmentsQuery),
  ]);

  // Proses data pengguna
  const usersData = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const stats = {
    totalUsers: usersData.length,
    totalGuru: usersData.filter((u) => u.role === "guru").length,
    totalMurid: usersData.filter((u) => u.role === "murid").length,
    totalKelas: kelasSnapshot.size,
  };

  // Proses data pertumbuhan pengguna untuk grafik
  const growthData = usersData.reduce((acc, user) => {
    if (user.createdAt?.toDate) {
      const date = user.createdAt.toDate();
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!acc[monthYear]) {
        acc[monthYear] = {
          name: `${date.toLocaleString("id-ID", { month: "short" })} '${String(date.getFullYear()).slice(2)}`,
          pengguna: 0,
        };
      }
      acc[monthYear].pengguna++;
    }
    return acc;
  }, {});
  const userGrowthData = Object.keys(growthData).sort().map((key) => growthData[key]);

  // Proses data kelas terpopuler
  const enrollmentsByClass = enrollmentsSnapshot.docs.reduce((acc, doc) => {
    const kelasId = doc.data().kelasId;
    acc[kelasId] = (acc[kelasId] || 0) + 1;
    return acc;
  }, {});

  const kelasDataPromises = kelasSnapshot.docs.map(async (kelasDoc) => {
    const guru = usersData.find((u) => u.id === kelasDoc.data().guruId);
    return {
      id: kelasDoc.id,
      ...kelasDoc.data(),
      jumlahMurid: enrollmentsByClass[kelasDoc.id] || 0,
      guruName: guru ? guru.namaLengkap : "N/A",
    };
  });
  const kelasData = await Promise.all(kelasDataPromises);
  const popularClasses = kelasData.sort((a, b) => b.jumlahMurid - a.jumlahMurid).slice(0, 5);

  // Proses aktivitas terbaru
  const recentKelas = kelasData.slice(0, 3).map((d) => ({ ...d, type: "kelas" }));
  const recentUsers = usersData.slice(0, 3).map((d) => ({ ...d, type: "user" }));
  const recentActivities = [...recentKelas, ...recentUsers]
    .filter((act) => act.createdAt?.toDate)
    .sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate())
    .slice(0, 5);

  return { stats, userGrowthData, popularClasses, recentActivities };
};


// --- BAGIAN 2: KOMPONEN-KOMPONEN KECIL ---

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

const MetricCard = ({ title, value, icon, bgColor, animationDelay }) => (
  <div className={`p-6 rounded-2xl shadow-lg flex flex-col justify-between min-h-[160px] ${bgColor} animate-on-scroll`} style={{ animationDelay }}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-white uppercase">{title}</p>
        <p className="text-4xl font-bold text-white mt-5">{value}</p>
      </div>
      <div className="p-3 bg-white/20 rounded-full text-white">{icon}</div>
    </div>
  </div>
);

// -- BARU: Komponen khusus untuk grafik, mengelola logikanya sendiri --
const UserGrowthChart = ({ data, animationDelay }) => {
  const [chartJsLoaded, setChartJsLoaded] = useState(false);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js";
    script.async = true;
    script.onload = () => setChartJsLoaded(true);
    document.body.appendChild(script);
    return () => { document.body.contains(script) && document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    if (chartJsLoaded && data.length > 0 && chartRef.current) {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();
      
      const Chart = window.Chart;
      const ctx = chartRef.current.getContext("2d");
      chartInstanceRef.current = new Chart(ctx, {
        type: "line",
        data: {
          labels: data.map((d) => d.name),
          datasets: [{
            label: "Pengguna Baru",
            data: data.map((d) => d.pengguna),
            borderColor: "#f97316",
            backgroundColor: "rgba(249, 115, 22, 0.2)",
            fill: true,
            tension: 0.4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true } },
          plugins: { legend: { display: false } },
        },
      });
    }
    return () => { if (chartInstanceRef.current) chartInstanceRef.current.destroy(); };
  }, [chartJsLoaded, data]);
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg animate-on-scroll" style={{ animationDelay }}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Pertumbuhan Pengguna Baru</h3>
      <div className="relative" style={{ height: 300 }}>
        {!chartJsLoaded ? (
            <div className="flex items-center justify-center h-full text-gray-500"><Loader className="animate-spin mr-2" /> Memuat Pustaka Grafik...</div>
        ) : data.length > 0 ? (
            <canvas ref={chartRef}></canvas>
        ) : (
            <div className="flex items-center justify-center h-full text-gray-500">Tidak ada data pertumbuhan.</div>
        )}
      </div>
    </div>
  );
};

// -- BAGIAN 3: Komponen Utama Halaman Dasbor --
export default function AdminDashboardPage() {
  const [data, setData] = useState({ stats: {}, userGrowthData: [], popularClasses: [], recentActivities: [] });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [hasMounted, setHasMounted] = useState(false);
  
  const showNotification = useCallback((message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  useEffect(() => {
    setHasMounted(true);
    const loadData = async () => {
      setLoading(true);
      try {
        const dashboardData = await fetchDashboardData();
        setData(dashboardData);
      } catch (error) {
        console.error("Error fetching data: ", error);
        showNotification("Gagal memuat data. Pastikan indeks Firestore sudah dibuat.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [showNotification]);

  // Efek untuk animasi scroll, hanya berjalan setelah data dimuat
  useEffect(() => {
    if (loading || !hasMounted) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    const elements = document.querySelectorAll(".animate-on-scroll");
    elements.forEach((el) => observer.observe(el));
    return () => elements.forEach((el) => observer.unobserve(el));
  }, [loading, hasMounted]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-screen bg-white"><Loader className="animate-spin text-orange-500" size={48} /></div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
       <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-white min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className="mb-8 animate-on-scroll">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dasbor Admin</h1>
            <p className="text-gray-600 mt-1">Selamat datang! Berikut ringkasan aktivitas di platform Anda.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-8">
            <MetricCard title="Total Pengguna" value={data.stats.totalUsers} icon={<Users size={24} />} bgColor="bg-gradient-to-br from-blue-500 to-blue-600" animationDelay="0.2s" />
            <MetricCard title="Total Guru" value={data.stats.totalGuru} icon={<User size={24} />} bgColor="bg-gradient-to-br from-indigo-500 to-indigo-600" animationDelay="0.3s" />
            <MetricCard title="Total Murid" value={data.stats.totalMurid} icon={<Users size={24} />} bgColor="bg-gradient-to-br from-purple-500 to-purple-600" animationDelay="0.4s" />
            <MetricCard title="Total Kelas" value={data.stats.totalKelas} icon={<BookCopy size={24} />} bgColor="bg-gradient-to-br from-pink-500 to-pink-600" animationDelay="0.5s" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2">
              <UserGrowthChart data={data.userGrowthData} animationDelay="0.6s" />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg animate-on-scroll" style={{ animationDelay: "0.7s" }}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Aktivitas Terbaru</h3>
              <ul className="space-y-4">
                {data.recentActivities.length > 0 ? data.recentActivities.map((activity, index) => (
                    <li key={activity.id || index} className="flex items-start space-x-3">
                      <div className="bg-slate-100 p-2 rounded-full">
                        {activity.type === "user" ? <UserPlus size={18} className="text-slate-500" /> : <BookPlus size={18} className="text-slate-500" />}
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-700" dangerouslySetInnerHTML={{ __html: activity.type === "user" ? `Pengguna baru <strong class="font-semibold">${activity.namaLengkap}</strong> telah bergabung.` : `Kelas baru <strong class="font-semibold">${activity.namaKelas}</strong> telah dibuat.` }}></p>
                        <p className="text-xs text-gray-400 mt-0.5">{activity.createdAt?.toDate().toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</p>
                      </div>
                    </li>
                  )) : <p className="text-sm text-gray-500 text-center py-4">Belum ada aktivitas.</p>
                }
              </ul>
            </div>
          </div>

          <div className="mt-8 bg-white p-6 rounded-xl shadow-lg animate-on-scroll" style={{ animationDelay: "0.8s" }}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Kelas Terpopuler</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Kelas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guru</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Murid</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.popularClasses.length > 0 ? data.popularClasses.map((kelas) => (
                      <tr key={kelas.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{kelas.namaKelas}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{kelas.guruName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-800">{kelas.jumlahMurid}</td>
                      </tr>
                    )) : <tr><td colSpan="3" className="text-center p-10 text-gray-500">Belum ada data pendaftaran kelas.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
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