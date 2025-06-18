import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import MainLayout from "./layouts/MainLayout";
import { app, db } from "../../api/firebaseConfig";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import {
  PlusCircle,
  Trash2,
  Edit,
  Check,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

export default function InputSoalUjianPage() {
  const router = useRouter();
  const { ujianId } = router.query; // Mengambil ID ujian dari URL

  const [ujianInfo, setUjianInfo] = useState(null);
  const [soalList, setSoalList] = useState([]);

  // State untuk loading
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [soalToDelete, setSoalToDelete] = useState(null);

  // State untuk form
  const [formState, setFormState] = useState({
    soal: "",
    tipeSoal: "Pilihan Ganda",
    pilihan: ["", "", "", ""],
    jawaban: "",
  });
  const [editingSoal, setEditingSoal] = useState(null);

  // State untuk notifikasi
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("success");
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // --- DIUBAH: Fetch informasi ujian dan daftar soalnya berdasarkan ujianId dari URL ---
  useEffect(() => {
    if (!ujianId) {
      setLoading(false);
      return;
    }

    // 1. Fetch data ujian yang sedang dikelola
    const ujianDocRef = doc(db, "ujian", ujianId);
    const unsubscribeUjian = onSnapshot(ujianDocRef, (docSnap) => {
        if (docSnap.exists()) {
            setUjianInfo({ id: docSnap.id, ...docSnap.data() });
        } else {
            console.error("Ujian tidak ditemukan!");
            setUjianInfo(null);
        }
    });

    // 2. Fetch soal-soal untuk ujian ini
    setLoading(true);
    const q = query(
      collection(db, "soalUjian"),
      where("idUjian", "==", ujianId),
      orderBy("createdAt", "asc")
    );
    const unsubscribeSoal = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSoalList(data);
        setLoading(false);
      },
      (error) => {
        console.error("Gagal mengambil data soal:", error);
        showCustomAlert("Gagal memuat soal ujian.", "error");
        setLoading(false);
      }
    );

    return () => {
      unsubscribeUjian();
      unsubscribeSoal();
    };
  }, [ujianId]);

  const showCustomAlert = (message, type = "success") => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const resetForm = () => {
    setFormState({
      soal: "",
      tipeSoal: "Pilihan Ganda",
      pilihan: ["", "", "", ""],
      jawaban: "",
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handlePilihanChange = (index, value) => {
    const newPilihan = [...formState.pilihan];
    newPilihan[index] = value;
    setFormState((prev) => ({ ...prev, pilihan: newPilihan }));
  };

  const addPilihan = () => {
    setFormState((prev) => ({ ...prev, pilihan: [...prev.pilihan, ""] }));
  };

  const removePilihan = (index) => {
    if (formState.pilihan.length <= 2) {
      showCustomAlert("Minimal harus ada 2 pilihan jawaban.", "error");
      return;
    }
    const newPilihan = formState.pilihan.filter((_, i) => i !== index);
    if (formState.jawaban === formState.pilihan[index]) {
      setFormState((prev) => ({ ...prev, pilihan: newPilihan, jawaban: "" }));
    } else {
      setFormState((prev) => ({ ...prev, pilihan: newPilihan }));
    }
  };

  const handleAddSoal = async (e) => {
    e.preventDefault();
    if (!formState.soal.trim()) return showCustomAlert("Teks soal tidak boleh kosong.", "error");
    if (formState.tipeSoal === "Pilihan Ganda") {
      if (formState.pilihan.some((p) => p.trim() === "")) return showCustomAlert("Semua pilihan harus diisi.", "error");
      if (!formState.jawaban) return showCustomAlert("Silakan pilih jawaban yang benar.", "error");
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "soalUjian"), {
        idUjian: ujianId, // Menggunakan ujianId dari URL
        soal: formState.soal,
        tipeSoal: formState.tipeSoal,
        pilihan: formState.tipeSoal === "Pilihan Ganda" ? formState.pilihan.filter((p) => p.trim() !== "") : [],
        jawaban: formState.tipeSoal === "Pilihan Ganda" ? formState.jawaban : "",
        createdAt: serverTimestamp(),
      });
      resetForm();
      setShowAddModal(false);
      showCustomAlert("Soal berhasil ditambahkan!", "success");
    } catch (error) {
      showCustomAlert("Gagal menambahkan soal: " + error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (soalItem) => {
    setEditingSoal(soalItem);
    setFormState({
      soal: soalItem.soal,
      tipeSoal: soalItem.tipeSoal,
      pilihan: soalItem.pilihan || ["", "", "", ""],
      jawaban: soalItem.jawaban,
    });
    setShowEditModal(true);
  };

  const handleUpdateSoal = async (e) => {
    e.preventDefault();
    if (!editingSoal) return;
    if (!formState.soal.trim()) return showCustomAlert("Teks soal tidak boleh kosong.", "error");
    if (formState.tipeSoal === "Pilihan Ganda") {
      if (formState.pilihan.some((p) => p.trim() === "")) return showCustomAlert("Semua pilihan harus diisi.", "error");
      if (!formState.jawaban) return showCustomAlert("Silakan pilih jawaban yang benar.", "error");
    }

    setIsSubmitting(true);
    const soalDocRef = doc(db, "soalUjian", editingSoal.id);
    try {
      await updateDoc(soalDocRef, {
        soal: formState.soal,
        tipeSoal: formState.tipeSoal,
        pilihan: formState.tipeSoal === "Pilihan Ganda" ? formState.pilihan.filter((p) => p.trim() !== "") : [],
        jawaban: formState.tipeSoal === "Pilihan Ganda" ? formState.jawaban : "",
      });
      setShowEditModal(false);
      setEditingSoal(null);
      showCustomAlert("Soal berhasil diperbarui!", "success");
    } catch (error) {
      showCustomAlert("Gagal memperbarui soal.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (soal) => {
    setSoalToDelete(soal);
    setShowDeleteModal(true);
  };

  const handleDeleteSoal = async () => {
    if (!soalToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, "soalUjian", soalToDelete.id));
      showCustomAlert("Soal berhasil dihapus!", "success");
      setShowDeleteModal(false);
      setSoalToDelete(null);
    } catch (error) {
      showCustomAlert("Gagal menghapus soal.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const primaryButtonColor = "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500";
  const primaryButtonTextColor = "text-white";
  const inputFocusColor = "focus:ring-orange-500 focus:border-orange-500";

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className={`mb-8 ${hasMounted ? "animate-fade-in-up" : "opacity-0"}`}>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Bank Soal Ujian</h1>
            <p className="text-md text-orange-600 font-semibold mt-1">
              {ujianInfo ? `Untuk Ujian: ${ujianInfo.name}` : "Memuat nama ujian..."}
            </p>
          </div>

          <div className="flex justify-start mb-8">
            <button
              onClick={() => { resetForm(); setShowAddModal(true); }}
              disabled={!ujianId}
              className="flex items-center space-x-2 bg-orange-500 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-300 text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <PlusCircle size={20} />
              <span>Tambah Soal</span>
            </button>
          </div>

          {/* --- DIUBAH: Logika tampilan disederhanakan --- */}
          {loading ? (
            <p className="text-center text-gray-500 py-16 animate-pulse">Memuat soal...</p>
          ) : !ujianId ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Info size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-xl font-medium text-gray-500">ID Ujian tidak ditemukan di URL.</p>
                <p className="text-sm text-gray-400 mt-2">Pastikan Anda mengakses halaman ini dari halaman Manajemen Ujian.</p>
            </div>
          ) : soalList.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-xl font-medium text-gray-500">Belum ada soal untuk ujian ini.</p>
              <p className="text-sm text-gray-400 mt-2">Klik "Tambah Soal" untuk memulai.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {soalList.map((soal, index) => (
                <div key={soal.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-medium">Soal #{index + 1} - <span className="font-bold text-gray-600">{soal.tipeSoal}</span></p>
                      <p className="mt-1 text-gray-800 whitespace-pre-wrap">{soal.soal}</p>
                      {soal.tipeSoal === "Pilihan Ganda" && (
                        <div className="mt-4 space-y-2 text-sm">
                          {soal.pilihan.map((p, i) => (
                            <p key={i} className={`flex items-center ${ p === soal.jawaban ? "font-semibold text-green-600" : "text-gray-600"}`}>
                              {p === soal.jawaban && (<Check size={16} className="mr-2 text-green-500 flex-shrink-0" />)}
                              <span className="font-mono mr-2">{String.fromCharCode(65 + i)}.</span> {p}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button onClick={() => handleOpenEditModal(soal)} className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-100 transition-colors"><Edit size={18} /></button>
                      <button onClick={() => handleOpenDeleteModal(soal)} className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-100 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Tambah/Edit Soal */}
        {(showAddModal || (showEditModal && editingSoal)) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-2xl relative animate-fade-in-up my-8">
              <button onClick={() => { showAddModal ? setShowAddModal(false) : setShowEditModal(false); resetForm(); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><X size={24}/></button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">{showAddModal ? 'Tambah Soal Baru' : 'Edit Soal'}</h2>
              <form onSubmit={showAddModal ? handleAddSoal : handleUpdateSoal} className="space-y-4">
                <textarea name="soal" value={formState.soal} onChange={handleFormChange} placeholder="Tulis teks soal di sini..." className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition min-h-[100px]`} required />
                <select name="tipeSoal" value={formState.tipeSoal} onChange={handleFormChange} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition bg-white`}>
                  <option>Pilihan Ganda</option>
                  <option>Esai</option>
                </select>
                {formState.tipeSoal === "Pilihan Ganda" && (
                  <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
                    <p className="text-sm font-medium text-gray-600">Opsi Jawaban & Kunci</p>
                    {formState.pilihan.map((p, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input type="radio" name="jawaban" value={p} checked={formState.jawaban === p} onChange={handleFormChange} className="form-radio text-orange-500 focus:ring-orange-500" />
                        <input type="text" value={p} onChange={(e) => handlePilihanChange(index, e.target.value)} placeholder={`Pilihan ${String.fromCharCode(65 + index)}`} className={`flex-grow px-3 py-2 border border-gray-300 rounded-lg ${inputFocusColor} transition`} />
                        <button type="button" onClick={() => removePilihan(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16}/></button>
                      </div>
                    ))}
                    <button type="button" onClick={addPilihan} className="text-sm text-orange-600 font-semibold hover:underline mt-2">Tambah Pilihan</button>
                  </div>
                )}
                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => { showAddModal ? setShowAddModal(false) : setShowEditModal(false); resetForm(); }} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                  <button type="submit" disabled={isSubmitting} className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md disabled:opacity-50`}>
                    {isSubmitting ? "Menyimpan..." : "Simpan Soal"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Hapus */}
        {showDeleteModal && soalToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up">
              <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Konfirmasi Hapus</h3>
              <p className="text-gray-600 mb-6 text-sm">Apakah Anda yakin ingin menghapus soal ini?</p>
              <div className="flex justify-center space-x-3">
                <button type="button" className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" onClick={() => setShowDeleteModal(false)}>Batal</button>
                <button type="button" disabled={isSubmitting} className="px-5 py-2.5 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 disabled:opacity-50" onClick={handleDeleteSoal}>
                  {isSubmitting ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Alert Umum */}
        {showAlertModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className={`bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up border-t-4 ${alertType === "success" ? "border-green-500" : "border-red-500"}`}>
              <h3 className={`text-xl font-semibold mb-3 ${alertType === "success" ? "text-green-700" : "text-red-700"}`}>
                {alertType === "success" ? "Berhasil!" : "Terjadi Kesalahan"}
              </h3>
              <p className="text-gray-600 mb-6 text-sm">{alertMessage}</p>
              <button type="button" className={`px-6 py-2.5 rounded-lg shadow-md ${alertType === "success" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`} onClick={() => setShowAlertModal(false)}>
                Oke
              </button>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; opacity: 0; }
        `}</style>   
      </main>
    </MainLayout>
  );
}