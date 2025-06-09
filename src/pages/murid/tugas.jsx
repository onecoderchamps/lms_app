import { useState, useEffect } from 'react';
import MainLayout from './layouts/MainLayout';
import Link from 'next/link';
import { FileText, Edit, CalendarDays, Clock, CheckCircle, XCircle, ExternalLink, FilePenLine, UploadCloud, X as CloseIcon } from 'lucide-react';

export default function TugasMuridPage() { // Nama komponen diubah agar lebih spesifik
  const [tugas, setTugas] = useState([
    {
      id: 1, name: 'Tugas Matematika: Persamaan Linear Dua Variabel', kelas: '10 IPA 1', dueDate: '2025-06-25',
      status: 'Belum Selesai', fileTugasUrl: 'https://www.africau.edu/images/default/sample.pdf',
      submissionUrl: null, submissionFileName: null, grade: null,
    },
    {
      id: 2, name: 'Analisis Teks Deskriptif Bahasa Inggris', kelas: '11 IPS 1', dueDate: '2025-05-20',
      status: 'Sudah Dinilai', fileTugasUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      submissionUrl: '/submissions/descriptive-text-submission.pdf', submissionFileName: 'descriptive-text-submission.pdf', grade: 'A-',
    },
    {
      id: 3, name: 'Laporan Praktikum Hukum Newton', kelas: '10 IPA 2', dueDate: '2025-06-15',
      status: 'Sudah Dikumpulkan', fileTugasUrl: 'https://www.africau.edu/images/default/sample.pdf',
      submissionUrl: '/submissions/hukum-newton-report.pdf', submissionFileName: 'hukum-newton-report.pdf', grade: null,
    },
    {
      id: 4, name: 'Presentasi Kimia: Reaksi Redoks dan Sel Volta', kelas: '10 IPA 1', dueDate: '2025-06-28',
      status: 'Belum Selesai', fileTugasUrl: 'https://www.africau.edu/images/default/sample.pdf',
      submissionUrl: null, submissionFileName: null, grade: null,
    },
  ]);

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [currentSubmittingTugas, setCurrentSubmittingTugas] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const showCustomAlert = (message, type) => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const handleOpenSubmitModal = (tugasItem) => {
    setCurrentSubmittingTugas(tugasItem);
    setSelectedFile(null);
    setShowSubmitModal(true);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
      showCustomAlert("Hanya file PDF yang diizinkan!", "error");
    }
  };

  const handleActualSubmit = () => {
    if (!selectedFile) {
      showCustomAlert("Silakan pilih file PDF terlebih dahulu.", "error");
      return;
    }
    if (!currentSubmittingTugas) return;

    setTugas(prevTugas =>
      prevTugas.map(t =>
        t.id === currentSubmittingTugas.id ? { 
          ...t, 
          status: 'Sudah Dikumpulkan', 
          submissionUrl: `/simulated_uploads/${selectedFile.name}`,
          submissionFileName: selectedFile.name 
        } : t
      )
    );
    setShowSubmitModal(false);
    setCurrentSubmittingTugas(null);
    setSelectedFile(null);
    showCustomAlert(`Tugas "${currentSubmittingTugas.name}" berhasil dikumpulkan dengan file: ${selectedFile.name}!`, 'success');
  };
  
  const primaryButtonColor = "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500";
  const primaryButtonTextColor = "text-white";
  const inputFocusColor = "focus:ring-orange-500 focus:border-orange-500";

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Tugas Saya</h1>
          </div>

          {tugas.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <p className="text-xl font-medium text-gray-500">Belum ada tugas.</p>
              <p className="text-sm text-gray-400 mt-2">Hubungi guru Anda jika ada pertanyaan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tugas.map((item, index) => ( // Tambahkan index untuk animationDelay
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 flex flex-col animate-fade-in-up" // Tambahkan kelas animasi
                  style={{ animationDelay: `${(index * 0.05) + 0.2}s` }} // Efek stagger
                >
                  <div className={`relative h-36 flex flex-col items-center justify-center p-4 text-white
                    ${item.status === 'Belum Selesai' ? 'bg-gradient-to-br from-red-400 to-red-600' :
                      item.status === 'Sudah Dikumpulkan' ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' :
                      'bg-gradient-to-br from-green-400 to-green-600' // Sudah Dinilai
                    }`}
                  >
                    <FilePenLine size={40} strokeWidth={1.5} />
                    <span className="absolute top-2 right-2 px-2.5 py-1 text-xs font-medium rounded-full bg-black bg-opacity-25">
                      {item.status}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <p className="font-semibold text-md text-gray-800 mb-1.5 leading-tight flex-grow min-h-[3.5rem] line-clamp-3" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">Kelas: {item.kelas}</p>
                    <div className="flex items-center text-gray-600 text-xs mb-2">
                      <CalendarDays size={14} className="mr-2 text-gray-400" />
                      <span>Batas Akhir: {new Date(item.dueDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>

                    {item.status === 'Sudah Dinilai' && item.grade && (
                      <div className="flex items-center text-xs mb-3">
                         <CheckCircle size={14} className="mr-2 text-green-500" />
                        <span className="font-semibold text-green-600">Nilai: {item.grade}</span>
                      </div>
                    )}
                    {!(item.status === 'Sudah Dinilai' && item.grade) && (
                       <div className="mb-3 h-[20px]"></div>
                    )}
                    
                    <div className="mt-auto space-y-2.5">
                      {item.status === 'Belum Selesai' && (
                        <button
                          onClick={() => handleOpenSubmitModal(item)}
                          className={`flex items-center justify-center ${primaryButtonColor} ${primaryButtonTextColor} px-4 py-2.5 rounded-lg shadow-md transition duration-300 text-sm font-medium w-full`}
                        > <UploadCloud size={16} className="mr-2" /> Kumpulkan Tugas </button>
                      )}
                      {(item.status === 'Sudah Dikumpulkan' || item.status === 'Sudah Dinilai') && item.submissionUrl && (
                        <Link
                          href={item.submissionUrl} target="_blank" rel="noreferrer"
                          className={`flex items-center justify-center px-4 py-2.5 rounded-lg shadow-md transition duration-300 text-sm font-medium w-full ${
                            item.status === 'Sudah Dikumpulkan' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        > <ExternalLink size={16} className="mr-2" /> 
                          {item.status === 'Sudah Dikumpulkan' ? 'Lihat Pengumpulan' : 'Lihat Hasil & Nilai'}
                        </Link>
                      )}
                       <Link
                          href={item.fileTugasUrl} target="_blank" rel="noreferrer"
                          className="flex items-center justify-center text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 font-medium text-sm px-4 py-2.5 rounded-lg transition duration-150 w-full"
                        > <FileText size={16} className="mr-2" /> Lihat Soal Tugas </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Pengumpulan Tugas */}
        {showSubmitModal && currentSubmittingTugas && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up my-8">
              <button
                onClick={() => { setShowSubmitModal(false); setCurrentSubmittingTugas(null); setSelectedFile(null); }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-150"
                aria-label="Tutup modal"
              > <CloseIcon size={24} /> </button>
              <h2 className="text-xl font-semibold mb-2 text-center text-gray-800">Kumpulkan Tugas</h2>
              <p className="text-sm text-center text-gray-600 mb-6 break-words">"{currentSubmittingTugas.name}"</p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="fileInput" className="block text-sm font-medium text-gray-700 mb-1">Pilih File PDF Tugas</label>
                  <input 
                    type="file" 
                    id="fileInput" 
                    accept=".pdf" 
                    onChange={handleFileSelect}
                    className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 ${inputFocusColor} border border-gray-300 rounded-lg cursor-pointer`}
                  />
                  {selectedFile && (
                    <p className="text-xs text-gray-600 mt-2">File terpilih: <span className="font-medium">{selectedFile.name}</span> ({Math.round(selectedFile.size / 1024)} KB)</p>
                  )}
                   <p className="text-xs text-gray-500 mt-1">Format yang diizinkan: .pdf</p>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setShowSubmitModal(false); setCurrentSubmittingTugas(null); setSelectedFile(null); }}
                    className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-300 text-sm font-medium"
                  > Batal </button>
                  <button 
                    type="button"
                    onClick={handleActualSubmit}
                    disabled={!selectedFile}
                    className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 text-sm font-medium ${!selectedFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                  > 
                    <UploadCloud size={16} className="mr-2 inline-block"/> Kumpulkan 
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
          .line-clamp-3 {
            overflow: hidden;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
          }
        `}</style>
      </main>
    </MainLayout>
  );
}