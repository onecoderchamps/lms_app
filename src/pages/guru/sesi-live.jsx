import { useState, useEffect } from 'react'; // Pastikan useEffect diimpor

import MainLayout from "./layouts/MainLayout";

import { PlusCircle, X, CalendarDays, Clock, Link as LinkIcon, Trash2, Video, Edit } from 'lucide-react';



export default function SesiLivePage() {

  const [showAddSessionModal, setShowAddSessionModal] = useState(false);

  const [sessionName, setSessionName] = useState('');

  const [sessionKelas, setSessionKelas] = useState('');

  const [sessionDate, setSessionDate] = useState('');

  const [sessionTime, setSessionTime] = useState('');

  const [sessionLink, setSessionLink] = useState('');



  const [liveSessions, setLiveSessions] = useState([

    {

      id: 1, name: 'Matematika: Kalkulus Dasar', kelas: '12 IPA 1',

      date: '2025-06-10', time: '09:00', link: 'https://zoom.us/j/1234567890',

    },

    {

      id: 2, name: 'Fisika: Termodinamika', kelas: '12 IPA 2',

      date: '2025-06-12', time: '14:00', link: 'https://meet.google.com/abc-defg-hij',

    },

    {

      id: 3, name: 'Kimia: Struktur Atom Lanjutan', kelas: '11 IPA 1',

      date: '2025-06-14', time: '10:30', link: 'https://zoom.us/j/0987654321',

    },

  ]);



  const classOptions = ['10 IPA 1', '10 IPA 2', '10 IPS 1', '11 IPA 1', '11 IPS 1', '12 IPA 1', '12 IPA 2', '12 IPS 1'];



  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  const [sessionToDeleteId, setSessionToDeleteId] = useState(null);



  const [showAlertModal, setShowAlertModal] = useState(false);

  const [alertMessage, setAlertMessage] = useState('');

  const [alertType, setAlertType] = useState('success');



  const [showEditSessionModal, setShowEditSessionModal] = useState(false);

  const [editingSessionId, setEditingSessionId] = useState(null);

  const [editedSessionName, setEditedSessionName] = useState('');

  const [editedSessionKelas, setEditedSessionKelas] = useState('');

  const [editedSessionDate, setEditedSessionDate] = useState('');

  const [editedSessionTime, setEditedSessionTime] = useState('');

  const [editedSessionLink, setEditedSessionLink] = useState('');



  const showCustomAlert = (message, type) => {

    setAlertMessage(message);

    setAlertType(type);

    setShowAlertModal(true);

  };



  const handleAddSession = (e) => {

    e.preventDefault();

    if (!sessionName.trim() || !sessionKelas || !sessionDate || !sessionTime || !sessionLink.trim()) {

      showCustomAlert('Semua field wajib diisi!', 'error');

      return;

    }

    const newSession = {

      id: Date.now(), name: sessionName, kelas: sessionKelas, date: sessionDate, time: sessionTime, link: sessionLink,

    };

    setLiveSessions((prev) => [newSession, ...prev]);

    setSessionName(''); setSessionKelas(''); setSessionDate(''); setSessionTime(''); setSessionLink('');

    setShowAddSessionModal(false);

    showCustomAlert('Sesi live berhasil dijadwalkan!', 'success');

  };



  const confirmDeleteSession = (id) => {

    setSessionToDeleteId(id);

    setShowDeleteConfirmModal(true);

  };



  const handleDeleteSession = () => {

    if (sessionToDeleteId !== null) {

      setLiveSessions((prev) => prev.filter((session) => session.id !== sessionToDeleteId));

      showCustomAlert('Sesi live berhasil dihapus!', 'success');

      setSessionToDeleteId(null);

      setShowDeleteConfirmModal(false);

    }

  };



  const handleEditSession = (session) => {

    setEditingSessionId(session.id);

    setEditedSessionName(session.name);

    setEditedSessionKelas(session.kelas);

    setEditedSessionDate(session.date);

    setEditedSessionTime(session.time);

    setEditedSessionLink(session.link);

    setShowEditSessionModal(true);

  };



  const handleSaveEdit = (e) => {

    e.preventDefault();

    if (!editedSessionName.trim() || !editedSessionKelas || !editedSessionDate || !editedSessionTime || !editedSessionLink.trim()) {

      showCustomAlert('Semua field wajib diisi untuk edit!', 'error');

      return;

    }

    setLiveSessions((prev) =>

      prev.map((session) =>

        session.id === editingSessionId

          ? { ...session, name: editedSessionName, kelas: editedSessionKelas, date: editedSessionDate, time: editedSessionTime, link: editedSessionLink, }

          : session

      )

    );

    showCustomAlert('Sesi live berhasil diperbarui!', 'success');

    handleCancelEdit();

  };



  const handleCancelEdit = () => {

    setEditingSessionId(null);

    setShowEditSessionModal(false);

  };



  const primaryButtonColor = "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500";

  const primaryButtonTextColor = "text-white";

  const inputFocusColor = "focus:ring-orange-500 focus:border-orange-500";



  return (

    <MainLayout>

      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">

        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">

          <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">

            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manajemen Sesi Live</h1>

            <button

              onClick={() => { // Reset form fields saat membuka modal tambah

                setSessionName(''); setSessionKelas(''); setSessionDate('');

                setSessionTime(''); setSessionLink('');

                setShowAddSessionModal(true);

              }}

              className={`flex items-center space-x-2 ${primaryButtonColor} ${primaryButtonTextColor} px-5 py-2.5 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 text-sm font-medium`}

            >

              <PlusCircle size={20} />

              <span>Jadwalkan Sesi Baru</span>

            </button>

          </div>



          {liveSessions.length === 0 ? (

            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">

              <p className="text-xl font-medium text-gray-500">Belum ada sesi live.</p>

              <p className="text-sm text-gray-400 mt-2">Klik "Jadwalkan Sesi Baru" untuk menambahkan.</p>

            </div>

          ) : (

            <ul className="space-y-5">

              {liveSessions.map((session, index) => ( // Tambahkan index untuk animationDelay

                <li

                  key={session.id}

                  className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between shadow-sm hover:shadow-lg transition-shadow duration-200 animate-fade-in-up" // Tambahkan kelas animasi

                  style={{ animationDelay: `${index * 0.05}s` }} // Efek stagger

                >

                  <div className="flex items-start space-x-4 mb-4 sm:mb-0 flex-grow">

                    <div className="text-purple-600 pt-1 bg-purple-50 p-2.5 rounded-full">

                      <Video size={24} />

                    </div>

                    <div className="flex-grow">

                      <p className="font-semibold text-lg text-gray-800">{session.name}</p>

                      <p className="text-sm text-gray-500">Kelas: {session.kelas}</p>

                      <div className="flex items-center text-gray-600 text-sm mt-2">

                        <CalendarDays size={16} className="mr-1.5 text-gray-400" />

                        <span>{new Date(session.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>

                        <Clock size={16} className="ml-3 mr-1.5 text-gray-400" />

                        <span>{session.time} WIB</span>

                      </div>

                    </div>

                  </div>

                  <div className="flex items-center space-x-2 sm:space-x-3 justify-start sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 sm:border-transparent flex-shrink-0">

                    <a

                      href={session.link} target="_blank" rel="noreferrer"

                      className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-md transition duration-150"

                    >

                      <LinkIcon size={16} className="mr-1.5" /> Buka Link

                    </a>

                    <button

                      onClick={() => handleEditSession(session)}

                      className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-100 transition-colors"

                      aria-label={`Edit sesi ${session.name}`}

                    > <Edit size={18} /> </button>

                    <button

                      onClick={() => confirmDeleteSession(session.id)}

                      className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-100 transition-colors"

                      aria-label={`Hapus sesi ${session.name}`}

                    > <Trash2 size={18} /> </button>

                  </div>

                </li>

              ))}

            </ul>

          )}

        </div>



        {/* Modal Tambah Sesi Live */}

        {showAddSessionModal && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">

             <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up">

              <button onClick={() => setShowAddSessionModal(false)}

                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-150"

                aria-label="Tutup modal"

              > <X size={24} /> </button>

              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Jadwalkan Sesi Live Baru</h2>

              <form onSubmit={handleAddSession} className="space-y-4">

                {/* ... (Field-field form tambah sesi: sessionName, sessionKelas, dll.) ... */}

                <div>

                  <label htmlFor="sessionName" className="block text-sm font-medium text-gray-700 mb-1">Nama Sesi / Topik</label>

                  <input type="text" id="sessionName" value={sessionName} onChange={(e) => setSessionName(e.target.value)}

                    placeholder="Contoh: Diskusi Aljabar Bab 3"

                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`} required />

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div>

                    <label htmlFor="kelasSelect" className="block text-sm font-medium text-gray-700 mb-1">Pilih Kelas</label>

                    <select id="kelasSelect" value={sessionKelas} onChange={(e) => setSessionKelas(e.target.value)}

                      className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150 bg-white`} required >

                      <option value="">Pilih Kelas</option>

                      {classOptions.map((option) => (<option key={option} value={option}>{option}</option>))}

                    </select>

                  </div>

                  <div className="hidden sm:block"></div>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div>

                    <label htmlFor="sessionDate" className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>

                    <input type="date" id="sessionDate" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)}

                      className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`} required />

                  </div>

                  <div>

                    <label htmlFor="sessionTime" className="block text-sm font-medium text-gray-700 mb-1">Waktu</label>

                    <input type="time" id="sessionTime" value={sessionTime} onChange={(e) => setSessionTime(e.target.value)}

                      className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`} required />

                  </div>

                </div>

                <div>

                  <label htmlFor="sessionLink" className="block text-sm font-medium text-gray-700 mb-1">Link Sesi Live (Zoom/Meet)</label>

                  <input type="url" id="sessionLink" value={sessionLink} onChange={(e) => setSessionLink(e.target.value)}

                    placeholder="Contoh: https://zoom.us/j/..."

                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`} required />

                </div>

                <div className="flex justify-end space-x-3 pt-2">

                  <button type="button" onClick={() => setShowAddSessionModal(false)}

                    className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-300 text-sm font-medium"

                  > Batal </button>

                  <button type="submit"

                    className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 text-sm font-medium`}

                  > Jadwalkan Sesi </button>

                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Edit Sesi Live */}

        {showEditSessionModal && (

           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">

             {/* ... Konten Modal Edit ... */}

              <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up">

               <button onClick={handleCancelEdit}

                 className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-150"

                 aria-label="Tutup modal"

               > <X size={24} /> </button>

               <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Edit Sesi Live</h2>

               <form onSubmit={handleSaveEdit} className="space-y-4">

                  {/* ... (Field-field form edit: editedSessionName, dll.) ... */}

                  <div>

                    <label htmlFor="editedSessionName" className="block text-sm font-medium text-gray-700 mb-1">Nama Sesi / Topik</label>

                    <input type="text" id="editedSessionName" value={editedSessionName} onChange={(e) => setEditedSessionName(e.target.value)}

                      className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`} required />

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                      <div>

                        <label htmlFor="editedSessionKelas" className="block text-sm font-medium text-gray-700 mb-1">Pilih Kelas</label>

                        <select id="editedSessionKelas" value={editedSessionKelas} onChange={(e) => setEditedSessionKelas(e.target.value)}

                          className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150 bg-white`} required >

                          <option value="">Pilih Kelas</option>

                          {classOptions.map((option) => (<option key={option} value={option}>{option}</option>))}

                        </select>

                      </div>

                      <div className="hidden sm:block"></div>

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                      <div>

                        <label htmlFor="editedSessionDate" className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>

                        <input type="date" id="editedSessionDate" value={editedSessionDate} onChange={(e) => setEditedSessionDate(e.target.value)}

                          className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`} required />

                      </div>

                      <div>

                        <label htmlFor="editedSessionTime" className="block text-sm font-medium text-gray-700 mb-1">Waktu</label>

                        <input type="time" id="editedSessionTime" value={editedSessionTime} onChange={(e) => setEditedSessionTime(e.target.value)}

                          className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`} required />

                      </div>

                  </div>

                  <div>

                    <label htmlFor="editedSessionLink" className="block text-sm font-medium text-gray-700 mb-1">Link Sesi Live</label>

                    <input type="url" id="editedSessionLink" value={editedSessionLink} onChange={(e) => setEditedSessionLink(e.target.value)}

                      className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`} required />

                  </div>

                  <div className="flex justify-end space-x-3 pt-2">

                    <button type="button" onClick={handleCancelEdit}

                      className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-300 text-sm font-medium"

                    > Batal </button>

                    <button type="submit"

                      className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 text-sm font-medium`}

                    > Simpan Perubahan </button>

                  </div>

               </form>

             </div>

           </div>

        )}



        {/* Modal Konfirmasi Hapus */}

        {showDeleteConfirmModal && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">

             {/* ... Konten Modal Konfirmasi Hapus ... */}

             <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up">

                <h3 className="text-xl font-semibold text-gray-800 mb-3">Konfirmasi Hapus</h3>

                <p className="text-gray-600 mb-6 text-sm">Apakah Anda yakin ingin menghapus sesi live ini? Aksi ini tidak dapat dibatalkan.</p>

                <div className="flex justify-center space-x-3">

                  <button type="button"

                    className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-300 text-sm font-medium"

                    onClick={() => { setShowDeleteConfirmModal(false); setSessionToDeleteId(null); }}

                  > Batal </button>

                  <button type="button"

                    className="px-5 py-2.5 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-300 text-sm font-medium"

                    onClick={handleDeleteSession}

                  > Ya, Hapus </button>

                </div>

              </div>

          </div>

        )}



        {/* Modal Alert (Sukses/Error) */}

        {showAlertModal && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">

             {/* ... Konten Modal Alert ... */}

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

            animation: fadeInUp 0.4s ease-out forwards; /* Durasi animasi disamakan dengan halaman lain */

            opacity: 0; /* Start with opacity 0 to make animation visible */

          }

        `}</style>

      </main>

    </MainLayout>

  );
}