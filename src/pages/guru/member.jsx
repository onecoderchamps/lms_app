
import { useState, useEffect } from 'react'; 
import MainLayout from "./layouts/MainLayout";
import { PlusCircle, X, Edit, Trash2 } from 'lucide-react';

export default function MemberPage() {
  const [showAddMuridModal, setShowAddMuridModal] = useState(false);
  const [muridName, setMuridName] = useState('');
  const [muridEmail, setMuridEmail] = useState('');
  const [muridPassword, setMuridPassword] = useState('');

  const [murids, setMurids] = useState([
    { id: 101, name: 'Budi Santoso', email: 'budi@example.com', password: 'passmurid1' },
    { id: 102, name: 'Siti Aminah', email: 'siti@example.com', password: 'passmurid2' },
    { id: 103, name: 'Agus Salim', email: 'agus@example.com', password: 'passmurid3' },
  ]);

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [muridToDeleteId, setMuridToDeleteId] = useState(null);

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  const [showEditMuridModal, setShowEditMuridModal] = useState(false);
  const [editingMuridId, setEditingMuridId] = useState(null);
  const [editedMuridName, setEditedMuridName] = useState('');
  const [editedMuridEmail, setEditedMuridEmail] = useState('');
  const [editedMuridPassword, setEditedMuridPassword] = useState('');

  const showCustomAlert = (message, type) => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const handleAddMurid = (e) => {
    e.preventDefault();
    if (!muridName.trim() || !muridEmail.trim() || !muridPassword.trim()) {
      showCustomAlert('Nama, Email, dan Password tidak boleh kosong!', 'error');
      return;
    }
    const newMurid = {
      id: Date.now(), name: muridName, email: muridEmail, password: muridPassword,
    };
    setMurids((prevMurids) => [newMurid, ...prevMurids]);
    setMuridName(''); setMuridEmail(''); setMuridPassword('');
    setShowAddMuridModal(false);
    showCustomAlert('Murid berhasil ditambahkan!', 'success');
  };

  const confirmDeleteMurid = (id) => {
    setMuridToDeleteId(id);
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteMurid = () => {
    if (muridToDeleteId !== null) {
      setMurids((prevMurids) => prevMurids.filter((murid) => murid.id !== muridToDeleteId));
      showCustomAlert('Murid berhasil dihapus!', 'success');
      setMuridToDeleteId(null);
      setShowDeleteConfirmModal(false);
    }
  };

  const handleEditMurid = (murid) => {
    setEditingMuridId(murid.id);
    setEditedMuridName(murid.name);
    setEditedMuridEmail(murid.email);
    setEditedMuridPassword(murid.password); // Mengisi password lama sebagai default di form edit
    setShowEditMuridModal(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editedMuridName.trim() || !editedMuridEmail.trim()) { 
      showCustomAlert('Nama dan Email tidak boleh kosong!', 'error');
      return;
    }
    setMurids((prevMurids) =>
      prevMurids.map((murid) =>
        murid.id === editingMuridId
          ? {
              ...murid,
              name: editedMuridName,
              email: editedMuridEmail,
              password: editedMuridPassword.trim() !== '' ? editedMuridPassword : murid.password,
            }
          : murid
      )
    );
    showCustomAlert('Perubahan murid berhasil disimpan!', 'success');
    handleCancelEdit();
  };

  const handleCancelEdit = () => {
    setEditingMuridId(null);
    // Reset field form edit bisa dilakukan di sini atau saat membuka modal edit
    // setEditedMuridName(''); setEditedMuridEmail(''); setEditedMuridPassword('');
    setShowEditMuridModal(false);
  };

  const primaryButtonColor = "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500";
  const primaryButtonTextColor = "text-white";
  const inputFocusColor = "focus:ring-orange-500 focus:border-orange-500";

  // Helper function untuk merender field form (digunakan oleh modal Tambah & Edit)
  const renderMuridFormFields = (isEditMode) => {
    const nameVal = isEditMode ? editedMuridName : muridName;
    const setName = isEditMode ? setEditedMuridName : setMuridName;
    const emailVal = isEditMode ? editedMuridEmail : muridEmail;
    const setEmail = isEditMode ? setEditedMuridEmail : setMuridEmail;
    const passwordVal = isEditMode ? editedMuridPassword : muridPassword;
    const setPassword = isEditMode ? setEditedMuridPassword : setMuridPassword;
    const idPrefix = isEditMode ? "edited" : "";
    const passwordPlaceholder = isEditMode ? "Kosongkan jika tidak ingin mengubah" : "Minimal 6 karakter";
    const passwordRequired = !isEditMode; // Password wajib untuk tambah, opsional untuk edit

    return (
      <>
        <div>
          <label htmlFor={`${idPrefix}MuridName`} className="block text-sm font-medium text-gray-700 mb-1">Nama Murid</label>
          <input type="text" id={`${idPrefix}MuridName`} placeholder="Contoh: Joko Susanto" value={nameVal}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`} required />
        </div>
        <div>
          <label htmlFor={`${idPrefix}MuridEmail`} className="block text-sm font-medium text-gray-700 mb-1">Email Murid</label>
          <input type="email" id={`${idPrefix}MuridEmail`} placeholder="Contoh: joko@example.com" value={emailVal}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`} required />
        </div>
        <div>
          <label htmlFor={`${idPrefix}MuridPassword`} className="block text-sm font-medium text-gray-700 mb-1">
            {isEditMode ? "Password Baru (Opsional)" : "Password"}
          </label>
          <input type="password" id={`${idPrefix}MuridPassword`} placeholder={passwordPlaceholder} value={passwordVal}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`}
            required={passwordRequired} 
          />
        </div>
      </>
    );
  };


  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manajemen Murid</h1>
            <button
              onClick={() => {
                setMuridName(''); setMuridEmail(''); setMuridPassword(''); // Reset form tambah
                setShowAddMuridModal(true);
              }}
              className={`flex items-center space-x-2 ${primaryButtonColor} ${primaryButtonTextColor} px-5 py-2.5 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 text-sm font-medium`}
            >
              <PlusCircle size={20} />
              <span>Tambah Murid Baru</span>
            </button>
          </div>

          {murids.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-xl font-medium text-gray-500">Belum ada murid.</p>
              <p className="text-sm text-gray-400 mt-2">Klik "Tambah Murid Baru" untuk memulai.</p>
            </div>
          ) : (
            <div className="overflow-x-auto mt-6 border border-gray-200 rounded-lg shadow-sm">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
                    <th className="py-3.5 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Nama</th>
                    <th className="py-3.5 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email</th>
                    <th className="py-3.5 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden md:table-cell">Password (Demo)</th>
                    <th className="py-3.5 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {murids.map((murid, index) => ( // Tambahkan index untuk animationDelay
                    <tr 
                      key={murid.id} 
                      className="hover:bg-gray-50/50 transition-colors duration-150 animate-fade-in-up" // Tambahkan kelas animasi
                      style={{ animationDelay: `${index * 0.05}s` }} // Efek stagger
                    >
                      <td className="py-3.5 px-4 text-sm text-gray-700 whitespace-nowrap">{murid.id}</td>
                      <td className="py-3.5 px-4 text-sm text-gray-700 whitespace-nowrap">{murid.name}</td>
                      <td className="py-3.5 px-4 text-sm text-gray-700 whitespace-nowrap">{murid.email}</td>
                      <td className="py-3.5 px-4 text-sm text-gray-700 font-mono hidden md:table-cell">{murid.password}</td>
                      <td className="py-3.5 px-4 text-center space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleEditMurid(murid)}
                          className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-100 transition-colors"
                          aria-label="Edit"
                        > <Edit size={18} /> </button>
                        <button
                          onClick={() => confirmDeleteMurid(murid.id)}
                          className="text-red-600 hover:text-red-800 p-1.5 rounded-md hover:bg-red-100 transition-colors"
                          aria-label="Hapus"
                        > <Trash2 size={18} /> </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Tambah Murid */}
        {showAddMuridModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-md relative animate-fade-in-up my-8">
              <button onClick={() => setShowAddMuridModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-150"
                aria-label="Tutup modal"
              > <X size={24} /> </button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Tambah Murid Baru</h2>
              <form onSubmit={handleAddMurid} className="space-y-4">
                {renderMuridFormFields(false)} {/* Menggunakan helper function */}
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowAddMuridModal(false)}
                    className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-300 text-sm font-medium"
                  > Batal </button>
                  <button type="submit"
                    className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 text-sm font-medium`}
                  > Simpan Murid </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Edit Murid */}
        {showEditMuridModal && editingMuridId !== null && ( // Pastikan editingMuridId tidak null
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-md relative animate-fade-in-up my-8">
              <button onClick={handleCancelEdit}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-150"
                aria-label="Tutup modal"
              > <X size={24} /> </button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Edit Murid</h2>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                {renderMuridFormFields(true)} {/* Menggunakan helper function */}
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
             <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Konfirmasi Hapus</h3>
              <p className="text-gray-600 mb-6 text-sm">Apakah Anda yakin ingin menghapus murid ini? Aksi ini tidak dapat dibatalkan.</p>
              <div className="flex justify-center space-x-3">
                <button type="button"
                  className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-300 text-sm font-medium"
                  onClick={() => { setShowDeleteConfirmModal(false); setMuridToDeleteId(null); }}
                > Batal </button>
                <button type="button"
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-300 text-sm font-medium"
                  onClick={handleDeleteMurid}
                > Ya, Hapus </button>
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
            animation: fadeInUp 0.4s ease-out forwards; /* Durasi animasi disamakan */
            opacity: 0; /* Mulai dengan transparan */
          }
        `}</style>
      </main>
    </MainLayout>
  );
}