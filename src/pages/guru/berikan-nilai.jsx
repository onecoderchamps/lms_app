
import { useState, useEffect } from 'react';
import MainLayout from './layouts/MainLayout';
import { FileText, Download, X as CloseIcon } from 'lucide-react'; // Tambahkan CloseIcon untuk modal

export default function BeriNilaiPage() {
  const [tugasSiswa, setTugasSiswa] = useState([
    {
      id: 1, namaSiswa: 'Budi Santoso', kelas: '10 IPA 1', namaTugas: 'Tugas Matematika Bab Aljabar',
      statusTugas: 'Sudah Dikumpulkan', tanggalKumpul: '2024-05-20', nilai: null, komentarGuru: '',
      fileTugasUrl: '/files/10IPA1/tugas-matematika-aljabar/budi-santoso-tugas.pdf',
    },
    {
      id: 2, namaSiswa: 'Citra Dewi', kelas: '10 IPA 1', namaTugas: 'Tugas Matematika Bab Aljabar',
      statusTugas: 'Sudah Dinilai', tanggalKumpul: '2024-05-21', nilai: 85, komentarGuru: 'Sudah bagus, perhatikan kerapian penulisan.',
      fileTugasUrl: '/files/10IPA1/tugas-matematika-aljabar/citra-dewi-tugas.pdf',
    },
    {
      id: 3, namaSiswa: 'Dani Pratama', kelas: '10 IPA 1', namaTugas: 'Tugas Matematika Bab Aljabar',
      statusTugas: 'Belum Dinilai', tanggalKumpul: '2024-05-19', nilai: null, komentarGuru: '',
      fileTugasUrl: '/files/10IPA1/tugas-matematika-aljabar/dani-pratama-tugas.pdf',
    },
    {
      id: 4, namaSiswa: 'Eka Lestari', kelas: '10 IPA 1', namaTugas: 'Tugas Matematika Bab Aljabar',
      statusTugas: 'Belum Mengumpulkan', tanggalKumpul: '-', nilai: null, komentarGuru: '',
      fileTugasUrl: null,
    },
    {
      id: 5, namaSiswa: 'Fajar Indah', kelas: '10 IPA 2', namaTugas: 'Tugas Fisika Getaran',
      statusTugas: 'Sudah Dikumpulkan', tanggalKumpul: '2024-05-22', nilai: null, komentarGuru: '',
      fileTugasUrl: '/files/10IPA2/tugas-fisika-getaran/fajar-indah-tugas.pdf',
    },
  ]);

  const [filterKelas, setFilterKelas] = useState('Semua Kelas');
  const [filterStatusNilai, setFilterStatusNilai] = useState('Semua Status');
  const [searchTerm, setSearchTerm] = useState('');

  // State untuk modal alert
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  const kelasOptions = ['Semua Kelas', ...new Set(tugasSiswa.map(t => t.kelas))];
  const statusNilaiOptions = ['Semua Status', 'Belum Dinilai', 'Sudah Dinilai', 'Belum Mengumpulkan'];

  const showCustomAlert = (message, type) => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const handleNilaiChange = (id, newNilai) => {
    setTugasSiswa((prevTugas) =>
      prevTugas.map((tugas) =>
        tugas.id === id ? { ...tugas, nilai: newNilai === '' ? null : Number(newNilai) } : tugas
      )
    );
  };

  const handleKomentarChange = (id, newKomentar) => {
    setTugasSiswa((prevTugas) =>
      prevTugas.map((tugas) =>
        tugas.id === id ? { ...tugas, komentarGuru: newKomentar } : tugas
      )
    );
  };

  const handleSimpanNilai = (id) => {
    const tugasYangDinilai = tugasSiswa.find(t => t.id === id);
    if (tugasYangDinilai && tugasYangDinilai.statusTugas !== 'Belum Mengumpulkan' && tugasYangDinilai.nilai === null) {
      showCustomAlert('Nilai belum diisi untuk tugas ini!', 'error');
      return;
    }
    
    setTugasSiswa(prevTugas => prevTugas.map(tugas =>
        tugas.id === id && tugas.statusTugas !== 'Belum Mengumpulkan' && tugas.nilai !== null 
        ? { ...tugas, statusTugas: 'Sudah Dinilai' } 
        : tugas
    ));
    showCustomAlert(`Nilai untuk ${tugasYangDinilai.namaSiswa} (${tugasYangDinilai.namaTugas}) berhasil disimpan: ${tugasYangDinilai.nilai !== null ? tugasYangDinilai.nilai : 'Belum diisi'}`, 'success');
  };

  const filteredTugasSiswa = tugasSiswa.filter((tugas) => {
    const matchesKelas = filterKelas === 'Semua Kelas' || tugas.kelas === filterKelas;
    const currentStatus = tugas.nilai !== null ? 'Sudah Dinilai' : tugas.statusTugas;
    const matchesStatus = 
        filterStatusNilai === 'Semua Status' ||
        (filterStatusNilai === 'Belum Dinilai' && tugas.nilai === null && currentStatus !== 'Belum Mengumpulkan') ||
        (filterStatusNilai === 'Sudah Dinilai' && tugas.nilai !== null) ||
        (filterStatusNilai === 'Belum Mengumpulkan' && currentStatus === 'Belum Mengumpulkan');
    const matchesSearch = tugas.namaSiswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tugas.namaTugas.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesKelas && matchesStatus && matchesSearch;
  });

  const getStatusBadgeClass = (status, nilai) => {
    if (status === 'Belum Mengumpulkan') return 'bg-red-100 text-red-700';
    if (nilai !== null || status === 'Sudah Dinilai') return 'bg-green-100 text-green-700';
    if (status === 'Sudah Dikumpulkan' || status === 'Belum Dinilai') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };
  
  const primaryButtonColor = "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500";
  const primaryButtonTextColor = "text-white";
  const inputFocusColor = "focus:ring-orange-500 focus:border-orange-500";

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-8 text-gray-800">
            Berikan Nilai Tugas Siswa
          </h1>

          {/* Filter Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-5 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
            <div>
              <label htmlFor="filterKelas" className="block text-sm font-medium text-gray-700 mb-1">Filter Kelas</label>
              <select
                id="filterKelas" value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)}
                className={`w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm ${inputFocusColor} bg-white`}
              >
                {kelasOptions.map((option) => (<option key={option} value={option}>{option}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700 mb-1">Filter Status Nilai</label>
              <select
                id="filterStatus" value={filterStatusNilai} onChange={(e) => setFilterStatusNilai(e.target.value)}
                className={`w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm ${inputFocusColor} bg-white`}
              >
                {statusNilaiOptions.map((option) => (<option key={option} value={option}>{option}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="searchNama" className="block text-sm font-medium text-gray-700 mb-1">Cari Nama/Tugas</label>
              <input
                type="text" id="searchNama" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ketik untuk mencari..."
                className={`w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm ${inputFocusColor}`}
              />
            </div>
          </div>

          {filteredTugasSiswa.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-xl font-medium text-gray-500">Tidak ada tugas yang sesuai filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Tugas</th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nilai (0-100)</th>
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Komentar Guru</th>
                    <th className="px-5 py-3.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTugasSiswa.map((tugas, index) => (
                    <tr key={tugas.id} className="hover:bg-gray-50/50 transition-colors duration-150 animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-800">{index + 1}.</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tugas.namaSiswa}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">{tugas.kelas}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700 max-w-xs truncate" title={tugas.namaTugas}>{tugas.namaTugas}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(tugas.statusTugas, tugas.nilai)}`}>
                          {tugas.nilai !== null ? 'Sudah Dinilai' : tugas.statusTugas}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm">
                        {tugas.statusTugas !== 'Belum Mengumpulkan' ? (
                          <input
                            type="number" min="0" max="100"
                            value={tugas.nilai === null ? '' : tugas.nilai}
                            onChange={(e) => handleNilaiChange(tugas.id, e.target.value)}
                            className={`w-20 border border-gray-300 rounded-md px-2 py-1.5 text-center ${inputFocusColor}`}
                            placeholder="-"
                          />
                        ) : ( <span className="text-gray-400 italic">N/A</span> )}
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {tugas.statusTugas !== 'Belum Mengumpulkan' ? (
                          <textarea
                            value={tugas.komentarGuru}
                            onChange={(e) => handleKomentarChange(tugas.id, e.target.value)}
                            className={`w-full min-w-[200px] border border-gray-300 rounded-md px-2 py-1.5 ${inputFocusColor}`}
                            rows="1" placeholder="..."
                          ></textarea>
                        ) : ( <span className="text-gray-400 italic">-</span> )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex items-center justify-center space-x-2">
                          {tugas.fileTugasUrl && tugas.statusTugas !== 'Belum Mengumpulkan' && (
                            <>
                              <a href={tugas.fileTugasUrl} target="_blank" rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 p-1.5 rounded-md hover:bg-blue-100 transition-colors" title="Lihat File Tugas">
                                <FileText size={18} />
                              </a>
                              <a href={tugas.fileTugasUrl} download
                                className="text-gray-500 hover:text-gray-700 p-1.5 rounded-md hover:bg-gray-100 transition-colors" title="Unduh File Tugas">
                                <Download size={18} />
                              </a>
                            </>
                          )}
                          {tugas.statusTugas !== 'Belum Mengumpulkan' ? (
                            <button
                              onClick={() => handleSimpanNilai(tugas.id)}
                              className={`px-3.5 py-2 rounded-md text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${primaryButtonColor} ${primaryButtonTextColor}`}
                              title="Simpan Nilai & Komentar"
                            > Simpan </button>
                          ) : ( <span className="text-gray-400 text-xs italic">Tunggu</span> )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Modal Alert (Sukses/Error) */}
        {showAlertModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className={`bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up ${
              alertType === 'success' ? 'border-t-4 border-green-500' : 'border-t-4 border-red-500'
            }`}>
              <h3 className={`text-xl font-semibold mb-3 ${
                alertType === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {alertType === 'success' ? 'Berhasil!' : 'Terjadi Kesalahan!'}
              </h3>
              <p className="text-gray-600 mb-6 text-sm">{alertMessage}</p>
              <button type="button"
                className={`px-6 py-2.5 rounded-lg shadow-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm font-medium ${
                  alertType === 'success' ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500' : 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
                }`}
                onClick={() => setShowAlertModal(false)}
              > Oke </button>
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