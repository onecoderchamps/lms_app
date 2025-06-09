// src/pages/guru/absen.jsx (atau app/guru/absensi/pantau/page.js)
'use client';

import { useState, useEffect } from 'react';
import MainLayout from './layouts/MainLayout';

export default function GuruPantauAbsenPage() {
  const [absensiList, setAbsensiList] = useState([
    { id: 1, nama: 'Budi Santoso', kelas: '10 IPA 1', status: 'Hadir', waktu: '07:55' },
    { id: 2, nama: 'Siti Aminah', kelas: '10 IPA 2', status: 'Sakit', waktu: '08:00' },
    { id: 3, nama: 'Joko Susanto', kelas: '11 IPS 1', status: 'Belum Absen', waktu: '' },
    { id: 4, nama: 'Dewi Fitri', kelas: '10 IPA 1', status: 'Izin', waktu: '08:15' },
    { id: 5, nama: 'Rudi Hartono', kelas: '12 IPA 3', status: 'Alfa', waktu: '' },
    { id: 6, nama: 'Lia Rahayu', kelas: '11 IPS 2', status: 'Hadir', waktu: '07:58' },
  ]);

  const [filterKelas, setFilterKelas] = useState('Semua Kelas');
  const [filterTanggal, setFilterTanggal] = useState(new Date().toISOString().split('T')[0]);

  const statusOptions = ['Hadir', 'Sakit', 'Izin', 'Alfa', 'Belum Absen'];
  const uniqueKelas = [...new Set(absensiList.map(a => a.kelas))];
  const kelasOptions = ['Semua Kelas', ...uniqueKelas.sort()];

  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case 'Hadir': return 'bg-green-100 text-green-700';
      case 'Sakit': return 'bg-yellow-100 text-yellow-700';
      case 'Izin': return 'bg-blue-100 text-blue-700';
      case 'Alfa': return 'bg-red-100 text-red-700';
      case 'Belum Absen': return 'bg-gray-200 text-gray-600';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleStatusChange = (id, newStatus) => {
    const waktuSekarang = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setAbsensiList((prevList) =>
      prevList.map((murid) => {
        if (murid.id === id) {
          let updatedWaktu = murid.waktu;
          if (newStatus === 'Hadir' && murid.status !== 'Hadir') {
            updatedWaktu = waktuSekarang;
          } else if (newStatus === 'Belum Absen' || newStatus === 'Alfa') {
            updatedWaktu = '';
          }
          return { ...murid, status: newStatus, waktu: updatedWaktu };
        }
        return murid;
      })
    );
  };

  const filteredAbsensiList = absensiList.filter(absen => {
    const matchKelas = filterKelas === 'Semua Kelas' || absen.kelas === filterKelas;
    // Tambahkan filter tanggal jika data memiliki field tanggal yang sesuai
    // const matchTanggal = !filterTanggal || absen.tanggal === filterTanggal;
    return matchKelas; // && matchTanggal;
  });

  const inputFocusColor = "focus:ring-orange-500 focus:border-orange-500";

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Monitoring Absensi Harian Murid
            </h1>
          </div>

          {/* Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-5 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
            <div>
              <label htmlFor="filterTanggal" className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
              <input 
                type="date" 
                id="filterTanggal" 
                value={filterTanggal} 
                onChange={(e) => setFilterTanggal(e.target.value)}
                className={`w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm ${inputFocusColor} bg-white`}
              />
            </div>
            <div>
              <label htmlFor="filterKelasPantau" className="block text-sm font-medium text-gray-700 mb-1">Filter Kelas</label>
              <select
                id="filterKelasPantau"
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className={`w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm ${inputFocusColor} bg-white`}
              >
                {kelasOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabel Absensi */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Murid</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                  <th className="px-5 py-3.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ubah Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAbsensiList.map((murid, index) => (
                  <tr 
                    key={murid.id} 
                    className="hover:bg-gray-50/50 transition-colors duration-150 animate-fade-in-up" // Tambahkan kelas animasi
                    style={{ animationDelay: `${index * 0.05}s` }} // Efek stagger
                  >
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-800">{index + 1}.</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{murid.nama}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">{murid.kelas}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClasses(murid.status)}`}>
                        {murid.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">{murid.waktu || '-'}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-center text-sm">
                      <select
                        value={murid.status}
                        onChange={(e) => handleStatusChange(murid.id, e.target.value)}
                        className={`w-full max-w-[160px] text-xs sm:text-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm ${inputFocusColor} bg-white cursor-pointer`}
                      >
                        {statusOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAbsensiList.length === 0 && (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 mt-6">
              <p className="text-xl font-medium text-gray-500">Tidak ada data absensi yang sesuai dengan filter.</p>
            </div>
          )}
        </div>
      </main>
      {/* Pastikan blok <style jsx> ada di dalam return MainLayout atau di dalam children-nya */}
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out forwards;
          opacity: 0; /* Mulai dengan transparan agar animasi terlihat */
        }
      `}</style>
    </MainLayout>
  );
}