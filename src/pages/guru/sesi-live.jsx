
import { useState } from 'react';
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
      id: 1,
      name: 'Matematika: Kalkulus Dasar',
      kelas: '12 IPA 1',
      date: '2025-06-01',
      time: '09:00',
      link: 'https://zoom.us/j/1234567890',
    },
    {
      id: 2,
      name: 'Fisika: Termodinamika',
      kelas: '12 IPA 2',
      date: '2025-06-05',
      time: '14:00',
      link: 'https://meet.google.com/abc-defg-hij',
    },
  ]);

  const classOptions = ['10 IPA 1', '10 IPA 2', '10 IPS 1', '11 IPA 1', '11 IPS 1', '12 IPA 1', '12 IPA 2', '12 IPS 1'];

  // State dan fungsi untuk Edit
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editedSessionName, setEditedSessionName] = useState('');
  const [editedSessionKelas, setEditedSessionKelas] = useState('');
  const [editedSessionDate, setEditedSessionDate] = useState('');
  const [editedSessionTime, setEditedSessionTime] = useState('');
  const [editedSessionLink, setEditedSessionLink] = useState('');

  // Notifikasi masih menggunakan alert() bawaan browser sesuai kode awal
  const handleAddSession = (e) => {
    e.preventDefault();
    if (!sessionName.trim() || !sessionKelas || !sessionDate || !sessionTime || !sessionLink.trim()) {
      alert('Semua field wajib diisi!');
      return;
    }
    const newSession = {
      id: Date.now(),
      name: sessionName,
      kelas: sessionKelas,
      date: sessionDate,
      time: sessionTime,
      link: sessionLink,
    };
    setLiveSessions((prev) => [newSession, ...prev]);
    setSessionName('');
    setSessionKelas('');
    setSessionDate('');
    setSessionTime('');
    setSessionLink('');
    setShowAddSessionModal(false);
    alert('Sesi live berhasil dijadwalkan!');
  };

  const handleDeleteSession = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus sesi live ini?')) {
      setLiveSessions((prev) => prev.filter((session) => session.id !== id));
      alert('Sesi live berhasil dihapus!');
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
      alert('Semua field wajib diisi untuk edit!');
      return;
    }
    setLiveSessions((prev) =>
      prev.map((session) =>
        session.id === editingSessionId
          ? {
              ...session,
              name: editedSessionName,
              kelas: editedSessionKelas,
              date: editedSessionDate,
              time: editedSessionTime,
              link: editedSessionLink,
            }
          : session
      )
    );
    alert('Sesi live berhasil diperbarui!');
    setShowEditSessionModal(false);
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setShowEditSessionModal(false);
  };

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-6"> {/* Margin dan padding dasar */}
        <div className="max-w-full mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900">Manajemen Sesi Live</h1>
            <button
              onClick={() => setShowAddSessionModal(true)}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-300"
            >
              <PlusCircle size={20} />
              <span>Jadwalkan Sesi Baru</span>
            </button>
          </div>

          {liveSessions.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-xl font-medium text-gray-500">Belum ada sesi live yang dijadwalkan.</p>
              <p className="text-sm text-gray-400 mt-2">Klik "Jadwalkan Sesi Baru" untuk menambahkan.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {liveSessions.map((session) => (
                <li
                  key={session.id}
                  className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between shadow-sm hover:shadow-md transition duration-200"
                >
                  <div className="flex items-start space-x-4">
                    <div className="text-purple-600 pt-1">
                      <Video size={28} />
                    </div>
                    <div>
                      <p className="font-semibold text-lg text-gray-800">{session.name}</p>
                      <p className="text-sm text-gray-500">Kelas: {session.kelas}</p>
                      <div className="flex items-center text-gray-600 text-sm mt-1">
                        <CalendarDays size={16} className="mr-2 text-gray-500" />
                        <span>{session.date}</span>
                        <Clock size={16} className="ml-4 mr-2 text-gray-500" />
                        <span>{session.time} WIB</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <a
                      href={session.link} target="_blank" rel="noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm transition duration-150"
                    >
                      <LinkIcon size={18} className="mr-1" /> Buka Link
                    </a>
                    <button
                      onClick={() => handleEditSession(session)}
                      className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 transition duration-150"
                      aria-label={`Edit sesi ${session.name}`}
                    > <Edit size={20} /> </button>
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition duration-150"
                      aria-label={`Hapus sesi ${session.name}`}
                    > <Trash2 size={20} /> </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Modal Tambah Sesi Live */}
        {showAddSessionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl p-7 w-full max-w-md relative">
              <button
                onClick={() => setShowAddSessionModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-150"
              > <X size={24} /> </button>
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Jadwalkan Sesi Live Baru</h2>
              <form onSubmit={handleAddSession} className="space-y-5">
                <div>
                  <label htmlFor="sessionName" className="block text-sm font-semibold text-gray-700 mb-1">Nama Sesi / Topik</label>
                  <input type="text" id="sessionName" value={sessionName} onChange={(e) => setSessionName(e.target.value)}
                    placeholder="Contoh: Diskusi Aljabar Bab 3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150" required />
                </div>
                <div>
                  <label htmlFor="kelasSelect" className="block text-sm font-semibold text-gray-700 mb-1">Pilih Kelas</label>
                  <select id="kelasSelect" value={sessionKelas} onChange={(e) => setSessionKelas(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 bg-white" required >
                    <option value="">Pilih Kelas</option>
                    {classOptions.map((option) => (<option key={option} value={option}>{option}</option>))}
                  </select>
                </div>
                <div>
                  <label htmlFor="sessionDate" className="block text-sm font-semibold text-gray-700 mb-1">Tanggal</label>
                  <input type="date" id="sessionDate" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150" required />
                </div>
                <div>
                  <label htmlFor="sessionTime" className="block text-sm font-semibold text-gray-700 mb-1">Waktu</label>
                  <input type="time" id="sessionTime" value={sessionTime} onChange={(e) => setSessionTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150" required />
                </div>
                <div>
                  <label htmlFor="sessionLink" className="block text-sm font-semibold text-gray-700 mb-1">Link Sesi Live (Zoom/Google Meet)</label>
                  <input type="url" id="sessionLink" value={sessionLink} onChange={(e) => setSessionLink(e.target.value)}
                    placeholder="Contoh: https://zoom.us/j/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150" required />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button type="button" onClick={() => setShowAddSessionModal(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-300"
                  > Batal </button>
                  <button type="submit"
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-300"
                  > Jadwalkan Sesi </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Edit Sesi Live */}
        {showEditSessionModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
             <div className="bg-white rounded-xl shadow-2xl p-7 w-full max-w-md relative">
               <button onClick={handleCancelEdit}
                 className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-150"
                 aria-label="Tutup modal"
               > <X size={24} /> </button>
               <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Edit Sesi Live</h2>
               <form onSubmit={handleSaveEdit} className="space-y-5">
                  {/* ... field-field edit ... */}
                  <div>
                    <label htmlFor="editedSessionName" className="block text-sm font-semibold text-gray-700 mb-1">Nama Sesi / Topik</label>
                    <input type="text" id="editedSessionName" value={editedSessionName} onChange={(e) => setEditedSessionName(e.target.value)}
                      placeholder="Contoh: Diskusi Aljabar Bab 3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150" required />
                  </div>
                  <div>
                    <label htmlFor="editedSessionKelas" className="block text-sm font-semibold text-gray-700 mb-1">Pilih Kelas</label>
                    <select id="editedSessionKelas" value={editedSessionKelas} onChange={(e) => setEditedSessionKelas(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 bg-white" required >
                      <option value="">Pilih Kelas</option>
                      {classOptions.map((option) => (<option key={option} value={option}>{option}</option>))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="editedSessionDate" className="block text-sm font-semibold text-gray-700 mb-1">Tanggal</label>
                    <input type="date" id="editedSessionDate" value={editedSessionDate} onChange={(e) => setEditedSessionDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150" required />
                  </div>
                  <div>
                    <label htmlFor="editedSessionTime" className="block text-sm font-medium text-gray-700 mb-1">Waktu</label>
                    <input type="time" id="editedSessionTime" value={editedSessionTime} onChange={(e) => setEditedSessionTime(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150" required />
                  </div>
                  <div>
                    <label htmlFor="editedSessionLink" className="block text-sm font-medium text-gray-700 mb-1">Link Sesi Live</label>
                    <input type="url" id="editedSessionLink" value={editedSessionLink} onChange={(e) => setEditedSessionLink(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150" required />
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button type="button" onClick={handleCancelEdit}
                      className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-300"
                    > Batal </button>
                    <button type="submit"
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-300"
                    > Simpan Perubahan </button>
                  </div>
               </form>
             </div>
           </div>
        )}
        
        {/* Modal Konfirmasi Hapus dan Alert saya hapus dari sini karena Anda menggunakan confirm() dan alert() bawaan */}
        
      </main>
    </MainLayout>
  );
}