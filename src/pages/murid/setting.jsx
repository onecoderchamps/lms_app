import { useState, useRef, useEffect } from 'react';
import MainLayout from './layouts/MainLayout';
import { User, Lock, Save, Image as ImageIcon, Eye, EyeOff, X as CloseIcon } from 'lucide-react';

export default function MuridSettingsPage() {
  const [userProfile, setUserProfile] = useState({
    displayName: 'Nama Murid Contoh', // Data dummy untuk murid
    email: 'murid.contoh@example.com', // Email murid (read-only)
    profilePictureUrl: null,
  });
  
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  const showCustomAlert = (message, type) => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const handleProfileChange = (e) => {
    if (e.target.name === "displayName") {
      setUserProfile({ ...userProfile, [e.target.name]: e.target.value });
    }
  };
  
  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
      if (file) { 
        showCustomAlert('Hanya file gambar (PNG, JPG, GIF) yang diizinkan.', 'error');
      }
    }
  };

  const handleCancelImageSelection = () => {
    setSelectedImageFile(null);
    setImagePreviewUrl(userProfile.profilePictureUrl); 
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    let newProfileData = { ...userProfile };
    let alertMsg = 'Pengaturan nama tampilan berhasil disimpan!';

    if (selectedImageFile) {
      console.log("Mengupload gambar (simulasi):", selectedImageFile.name);
      newProfileData.profilePictureUrl = imagePreviewUrl; 
      alertMsg = 'Profil (termasuk foto) berhasil diperbarui!';
    }
    
    setUserProfile(newProfileData); 
    console.log("Profil disimpan:", newProfileData);
    showCustomAlert(alertMsg, 'success');
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (!currentPassword.trim()) {
        showCustomAlert('Kata sandi saat ini wajib diisi!', 'error');
        return;
    }
    if (newPassword !== confirmNewPassword) {
      showCustomAlert('Kata sandi baru dan konfirmasi tidak cocok!', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showCustomAlert('Kata sandi baru minimal 6 karakter!', 'error');
      return;
    }
    console.log("Kata sandi diubah:", newPassword);
    showCustomAlert('Kata sandi berhasil diubah!', 'success');
    setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
    setShowChangePasswordModal(false);
  };
  
  const primaryButtonColor = "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500";
  const primaryButtonTextColor = "text-white";
  const inputFocusColor = "focus:ring-orange-500 focus:border-orange-500";
  const primaryRingColor = "focus:ring-orange-500";
  
  const renderPasswordField = (id, label, value, setter, showState, setShowState, placeholder, isRequired = true) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={showState ? 'text' : 'password'}
          id={id} value={value} onChange={(e) => setter(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm ${inputFocusColor} transition duration-150 pr-10`}
          required={isRequired}
        />
        <button
          type="button"
          onClick={() => setShowState(prev => !prev)}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label={showState ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
        >
          {showState ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Pengaturan Akun Saya</h1> {/* Judul disesuaikan untuk murid */}
          </div>

          {/* Bagian Pengaturan Profil */}
          <section className="mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center mb-6 pb-3 border-b border-gray-200">
              <User size={24} className="text-orange-500 mr-3" />
              <h2 className="text-xl font-semibold text-gray-700">Profil Saya</h2> {/* Judul section disesuaikan */}
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">Nama Tampilan</label>
                <input type="text" id="displayName" name="displayName" value={userProfile.displayName} onChange={handleProfileChange}
                  className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm ${inputFocusColor} transition duration-150`} />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Alamat Email <span className="text-xs text-gray-400">(tidak bisa diubah)</span></label>
                <input 
                  type="email" id="email" name="email" value={userProfile.email} 
                  readOnly 
                  className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm bg-gray-100 text-gray-500 cursor-not-allowed transition duration-150`}
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Foto Profil</label>
                  <div className="mt-1 flex items-center space-x-4">
                      <span className="inline-block h-16 w-16 rounded-full overflow-hidden bg-gray-100 border border-gray-300">
                          {imagePreviewUrl ? (
                              <img src={imagePreviewUrl} alt="Preview Foto Profil" className="h-full w-full object-cover" />
                          ) : userProfile.profilePictureUrl ? (
                              <img src={userProfile.profilePictureUrl} alt="Foto Profil" className="h-full w-full object-cover" />
                          ) : (
                              <ImageIcon strokeWidth={1} className="h-full w-full text-gray-400 p-2" />
                          )}
                      </span>
                      <input
                          type="file" ref={fileInputRef} onChange={handleImageFileChange}
                          accept="image/png, image/jpeg, image/gif" className="hidden" id="profilePictureInput"
                      />
                      <button type="button" onClick={() => fileInputRef.current.click()}
                          className={`px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm ${inputFocusColor.replace('focus:border-', 'focus:ring-')} focus:outline-none`}
                      >
                          {imagePreviewUrl || userProfile.profilePictureUrl ? 'Ganti Foto' : 'Pilih Foto'}
                      </button>
                      {selectedImageFile && ( 
                          <button type="button" onClick={handleCancelImageSelection}
                              className="text-xs text-red-600 hover:text-red-700 underline"
                          >Batal Pilih</button>
                      )}
                  </div>
                  {selectedImageFile && (
                      <p className="text-xs text-gray-500 mt-1">File terpilih: {selectedImageFile.name}</p>
                  )}
              </div>
              <div className="flex justify-end">
                <button type="submit"
                  className={`flex items-center space-x-2 ${primaryButtonColor} ${primaryButtonTextColor} px-5 py-2.5 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 text-sm font-medium`}
                > <Save size={18} /> Simpan Profil </button>
              </div>
            </form>
          </section>

          {/* Bagian Keamanan Akun */}
          <section className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 pb-3 border-b border-gray-200 gap-3">
              <div className="flex items-center">
                <Lock size={24} className="text-orange-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-700">Keamanan Akun</h2>
              </div>
              <button 
                type="button" onClick={() => setShowChangePasswordModal(true)}
                className={`px-5 py-2.5 border border-orange-500 text-orange-600 hover:bg-orange-50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${primaryRingColor} transition duration-300 text-sm font-medium w-full sm:w-auto`}
              > Ubah Kata Sandi </button>
            </div>
          </section>
        </div>

        {/* Modal Ubah Kata Sandi */}
        {showChangePasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-md relative animate-fade-in-up">
              <button
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
                  setShowCurrentPassword(false); setShowNewPassword(false); setShowConfirmNewPassword(false);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-150"
                aria-label="Tutup modal"
              > <CloseIcon size={24} /> </button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">Ubah Kata Sandi</h2>
              <form onSubmit={handleSavePassword} className="space-y-4">
                {renderPasswordField("currentPasswordModal", "Kata Sandi Saat Ini", currentPassword, setCurrentPassword, showCurrentPassword, setShowCurrentPassword, "Masukkan kata sandi lama")}
                {renderPasswordField("newPasswordModal", "Kata Sandi Baru", newPassword, setNewPassword, showNewPassword, setShowNewPassword, "Minimal 8 karakter")}
                {renderPasswordField("confirmNewPasswordModal", "Konfirmasi Kata Sandi Baru", confirmNewPassword, setConfirmNewPassword, showConfirmNewPassword, setShowConfirmNewPassword, "Ketik ulang kata sandi baru")}
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" 
                    onClick={() => {
                      setShowChangePasswordModal(false);
                      setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
                      setShowCurrentPassword(false); setShowNewPassword(false); setShowConfirmNewPassword(false);
                    }}
                    className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-300 text-sm font-medium"
                  > Batal </button>
                  <button type="submit"
                    className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 text-sm font-medium`}
                  > Simpan Kata Sandi Baru </button>
                </div>
              </form>
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
        `}</style>
      </main>
    </MainLayout>
  );
}