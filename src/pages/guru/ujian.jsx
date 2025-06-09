import { useState, useEffect } from "react";
import MainLayout from "./layouts/MainLayout";
import {
  PlusCircle,
  X,
  FileText,
  Video,
  BookText,
  ExternalLink,
  Trash2,
  CalendarDays,
  Clock,
  PlayCircle,
  CheckSquare,
  Hourglass,
  Edit,
} from "lucide-react";

export default function UjianPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [ujianName, setUjianName] = useState("");
  const [kelas, setKelas] = useState("");
  const [fileSoalUrl, setFileSoalUrl] = useState("");
  const [fileVideoUrl, setFileVideoUrl] = useState("");
  const [tanggalUjian, setTanggalUjian] = useState("");
  const [waktuUjian, setWaktuUjian] = useState("");
  const [durasiUjian, setDurasiUjian] = useState(90);

  const [ujians, setUjians] = useState([
    {
      id: 1,
      name: "Ujian Matematika Semester Ganjil",
      kelas: "10 IPA 1",
      date: "2025-06-15",
      time: "09:00",
      durationMinutes: 120,
      fileSoalUrl: "/docs/ujian-matematika.pdf",
      fileVideoUrl: "https://www.youtube.com/embed/",
    },
    {
      id: 2,
      name: "Ujian Bahasa Inggris Unit 3",
      kelas: "11 IPS 1",
      date: "2025-05-28",
      time: "10:00",
      durationMinutes: 90,
      fileSoalUrl: "/docs/ujian-inggris.docx",
      fileVideoUrl: null,
    },
    {
      id: 3,
      name: "Ujian Fisika: Gaya & Gerak",
      kelas: "10 IPA 2",
      date: "2025-06-01",
      time: "14:00",
      durationMinutes: 60,
      fileSoalUrl: "/docs/ujian-fisika.pdf",
      fileVideoUrl: "https://www.youtube.com/embed/exampleID",
    },
  ]);

  const classOptions = [
    "10 IPA 1",
    "10 IPA 2",
    "10 IPS 1",
    "11 IPA 1",
    "11 IPS 1",
    "12 IPA 1",
    "12 IPA 2",
    "12 IPS 1",
  ];

  // --- State untuk Fitur Edit ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUjian, setEditingUjian] = useState(null); // Menyimpan objek ujian yang diedit
  // State untuk field di form edit
  const [editedUjianName, setEditedUjianName] = useState("");
  const [editedKelas, setEditedKelas] = useState("");
  const [editedFileSoalUrl, setEditedFileSoalUrl] = useState("");
  const [editedFileVideoUrl, setEditedFileVideoUrl] = useState("");
  const [editedTanggalUjian, setEditedTanggalUjian] = useState("");
  const [editedWaktuUjian, setEditedWaktuUjian] = useState("");
  const [editedDurasiUjian, setEditedDurasiUjian] = useState(90);
  // --- Akhir State untuk Fitur Edit ---

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [ujianToDeleteId, setUjianToDeleteId] = useState(null);

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("success");

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getUjianStatusForGuruDisplay = (
    ujianDate,
    ujianTime,
    durationMinutes
  ) => {
    const ujianStartDateTime = new Date(`${ujianDate}T${ujianTime}:00`);
    const ujianEndDateTime = new Date(
      ujianStartDateTime.getTime() + durationMinutes * 60000
    );
    const now = currentTime;

    if (now < ujianStartDateTime) {
      const diffMs = ujianStartDateTime.getTime() - now.getTime();
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      if (diffMinutes <= 60 * 24 && diffMinutes > 0) {
        return {
          text: "Akan Datang",
          colorClass: "bg-indigo-100 text-indigo-700",
          icon: <Hourglass size={22} />,
        };
      }
      return {
        text: "Dijadwalkan",
        colorClass: "bg-gray-100 text-gray-700",
        icon: <CalendarDays size={22} />,
      };
    } else if (now >= ujianStartDateTime && now < ujianEndDateTime) {
      return {
        text: "Sedang Berlangsung",
        colorClass: "bg-yellow-100 text-yellow-700 animate-pulse",
        icon: <PlayCircle size={22} />,
      };
    } else {
      return {
        text: "Sudah Selesai",
        colorClass: "bg-green-100 text-green-700",
        icon: <CheckSquare size={22} />,
      };
    }
  };

  const showCustomAlert = (message, type) => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const handleAddUjian = (e) => {
    e.preventDefault();
    if (
      !ujianName.trim() ||
      !kelas ||
      !fileSoalUrl.trim() ||
      !tanggalUjian ||
      !waktuUjian ||
      !durasiUjian
    ) {
      showCustomAlert(
        "Semua field (Nama Ujian, Kelas, URL Soal, Tanggal, Waktu, Durasi) wajib diisi!",
        "error"
      );
      return;
    }
    const newUjian = {
      id: Date.now(),
      name: ujianName,
      kelas,
      fileSoalUrl,
      fileVideoUrl: fileVideoUrl.trim() || null,
      date: tanggalUjian,
      time: waktuUjian,
      durationMinutes: parseInt(durasiUjian, 10),
    };
    setUjians((prev) => [newUjian, ...prev]);
    setShowAddModal(false);
    setUjianName("");
    setKelas("");
    setFileSoalUrl("");
    setFileVideoUrl("");
    setTanggalUjian("");
    setWaktuUjian("");
    setDurasiUjian(90);
    showCustomAlert("Ujian berhasil ditambahkan!", "success");
  };

  // --- Fungsi untuk Fitur Edit ---
  const handleOpenEditModal = (ujian) => {
    setEditingUjian(ujian);
    setEditedUjianName(ujian.name);
    setEditedKelas(ujian.kelas);
    setEditedFileSoalUrl(ujian.fileSoalUrl);
    setEditedFileVideoUrl(ujian.fileVideoUrl || "");
    setEditedTanggalUjian(ujian.date);
    setEditedWaktuUjian(ujian.time);
    setEditedDurasiUjian(ujian.durationMinutes);
    setShowEditModal(true);
  };

  const handleSaveEditUjian = (e) => {
    e.preventDefault();
    if (
      !editedUjianName.trim() ||
      !editedKelas ||
      !editedFileSoalUrl.trim() ||
      !editedTanggalUjian ||
      !editedWaktuUjian ||
      !editedDurasiUjian
    ) {
      showCustomAlert(
        "Semua field (Nama Ujian, Kelas, URL Soal, Tanggal, Waktu, Durasi) wajib diisi untuk edit!",
        "error"
      );
      return;
    }
    setUjians((prevUjians) =>
      prevUjians.map((u) =>
        u.id === editingUjian.id
          ? {
              ...u,
              name: editedUjianName,
              kelas: editedKelas,
              fileSoalUrl: editedFileSoalUrl,
              fileVideoUrl: editedFileVideoUrl.trim() || null,
              date: editedTanggalUjian,
              time: editedWaktuUjian,
              durationMinutes: parseInt(editedDurasiUjian, 10),
            }
          : u
      )
    );
    showCustomAlert("Data ujian berhasil diperbarui!", "success");
    setShowEditModal(false);
    setEditingUjian(null);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingUjian(null);
    // Tidak perlu reset field form di sini, karena akan diisi ulang saat handleOpenEditModal
  };
  // --- Akhir Fungsi untuk Fitur Edit ---

  const confirmDeleteUjian = (id) => {
    setUjianToDeleteId(id);
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteUjian = () => {
    if (ujianToDeleteId !== null) {
      setUjians((prev) => prev.filter((ujian) => ujian.id !== ujianToDeleteId));
      showCustomAlert("Ujian berhasil dihapus!", "success");
      setUjianToDeleteId(null);
      setShowDeleteConfirmModal(false);
    }
  };

  const primaryButtonColor =
    "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500";
  const primaryButtonTextColor = "text-white";
  const inputFocusColor = "focus:ring-orange-500 focus:border-orange-500";

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Manajemen Ujian
            </h1>
            <button
              onClick={() => {
                setUjianName("");
                setKelas("");
                setFileSoalUrl("");
                setFileVideoUrl("");
                setTanggalUjian("");
                setWaktuUjian("");
                setDurasiUjian(90);
                setShowAddModal(true);
              }}
              className={`flex items-center space-x-2 ${primaryButtonColor} ${primaryButtonTextColor} px-5 py-2.5 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 text-sm font-medium`}
            >
              <PlusCircle size={20} />
              <span>Upload Ujian Baru</span>
            </button>
          </div>

          {ujians.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-xl font-medium text-gray-500">
                Belum ada ujian.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Klik "Upload Ujian Baru" untuk menambahkan.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {ujians.map((ujian, index) => {
                const statusInfo = getUjianStatusForGuruDisplay(
                  ujian.date,
                  ujian.time,
                  ujian.durationMinutes
                );
                return (
                  <li
                    key={ujian.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                      <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-0 flex-grow min-w-0">
                        <div
                          className={`p-2.5 rounded-full ${
                            statusInfo.colorClass
                              .split(" ")[0]
                              .replace("bg-", "bg-") + "-50"
                          } ${statusInfo.colorClass
                            .split(" ")[1]
                            .replace("text-", "text-")}`}
                        >
                          {statusInfo.icon || <BookText size={22} />}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-x-2">
                            <p
                              className="font-semibold text-md sm:text-lg text-gray-800 leading-tight truncate"
                              title={ujian.name}
                            >
                              {ujian.name}
                            </p>
                            <span
                              className={`mt-1 sm:mt-0 px-2.5 py-0.5 inline-block text-xs leading-5 font-semibold rounded-full whitespace-nowrap ${statusInfo.colorClass}`}
                            >
                              {statusInfo.text}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500">
                            Kelas: {ujian.kelas}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center text-gray-500 text-xs mt-1.5 gap-x-3 gap-y-0.5">
                            <div className="flex items-center">
                              <CalendarDays
                                size={14}
                                className="mr-1.5 text-gray-400"
                              />
                              <span>
                                {new Date(ujian.date).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Clock
                                size={14}
                                className="mr-1.5 text-gray-400"
                              />
                              <span>
                                {ujian.time} WIB ({ujian.durationMinutes} mnt)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0 w-full sm:w-auto justify-start sm:justify-end mt-3 sm:mt-0">
                        <a
                          href={ujian.fileSoalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition duration-150"
                        >
                          {" "}
                          <FileText size={14} className="mr-1" /> Lihat Soal{" "}
                        </a>
                        {ujian.fileVideoUrl && (
                          <a
                            href={ujian.fileVideoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center text-xs font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-md transition duration-150"
                          >
                            {" "}
                            <Video size={14} className="mr-1" /> Lihat Video{" "}
                          </a>
                        )}
                        {/* TOMBOL EDIT DITAMBAHKAN DI SINI */}
                        <button
                          onClick={() => handleOpenEditModal(ujian)}
                          className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-100 transition-colors"
                          aria-label={`Edit ujian ${ujian.name}`}
                        >
                          {" "}
                          <Edit size={16} />{" "}
                        </button>
                        <button
                          onClick={() => confirmDeleteUjian(ujian.id)}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-100 transition-colors"
                          aria-label={`Hapus ujian ${ujian.name}`}
                        >
                          {" "}
                          <Trash2 size={16} />{" "}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Modal Upload Ujian (Tambah Baru) */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up my-8">
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-150"
                aria-label="Tutup modal"
              >
                {" "}
                <X size={24} />{" "}
              </button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">
                Upload Ujian Baru
              </h2>
              <form onSubmit={handleAddUjian} className="space-y-4">
                {/* ... (field-field form tambah ujian: ujianName, kelas, tanggalUjian, waktuUjian, durasiUjian, fileSoalUrl, fileVideoUrl) ... */}
                <div>
                  <label
                    htmlFor="ujianName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nama Ujian
                  </label>
                  <input
                    type="text"
                    id="ujianName"
                    value={ujianName}
                    onChange={(e) => setUjianName(e.target.value)}
                    placeholder="Contoh: Ujian Tengah Semester Matematika"
                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="kelasSelect"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Pilih Kelas
                  </label>
                  <select
                    id="kelasSelect"
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150 bg-white`}
                    required
                  >
                    <option value="">Pilih Kelas</option>
                    {classOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="tanggalUjian"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Tanggal Ujian
                    </label>
                    <input
                      type="date"
                      id="tanggalUjian"
                      value={tanggalUjian}
                      onChange={(e) => setTanggalUjian(e.target.value)}
                      className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="waktuUjian"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Waktu Mulai
                    </label>
                    <input
                      type="time"
                      id="waktuUjian"
                      value={waktuUjian}
                      onChange={(e) => setWaktuUjian(e.target.value)}
                      className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="durasiUjian"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Durasi Ujian (menit)
                  </label>
                  <input
                    type="number"
                    id="durasiUjian"
                    value={durasiUjian}
                    onChange={(e) =>
                      setDurasiUjian(parseInt(e.target.value, 10) || 0)
                    }
                    min="1"
                    placeholder="Contoh: 90"
                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="fileSoalUrl"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    URL File Soal Ujian (PDF/DOC)
                  </label>
                  <input
                    type="url"
                    id="fileSoalUrl"
                    value={fileSoalUrl}
                    onChange={(e) => setFileSoalUrl(e.target.value)}
                    placeholder="Contoh: https://example.com/soal-ujian.pdf"
                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Masukkan URL publik ke file soal.
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="fileVideoUrl"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    URL Video Penjelasan (opsional)
                  </label>
                  <input
                    type="url"
                    id="fileVideoUrl"
                    value={fileVideoUrl}
                    onChange={(e) => setFileVideoUrl(e.target.value)}
                    placeholder="Contoh: https://www.youtube.com/embed/VIDEO_ID"
                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Masukkan URL embed video jika ada.
                  </p>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-300 text-sm font-medium"
                  >
                    {" "}
                    Batal{" "}
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 text-sm font-medium`}
                  >
                    {" "}
                    Upload Ujian{" "}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL EDIT UJIAN --- */}
        {showEditModal && editingUjian && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-lg relative animate-fade-in-up my-8">
              <button
                onClick={handleCancelEdit}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-150"
                aria-label="Tutup modal"
              >
                {" "}
                <X size={24} />{" "}
              </button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">
                Edit Ujian
              </h2>
              <form onSubmit={handleSaveEditUjian} className="space-y-4">
                <div>
                  <label
                    htmlFor="editedUjianName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nama Ujian
                  </label>
                  <input
                    type="text"
                    id="editedUjianName"
                    value={editedUjianName}
                    onChange={(e) => setEditedUjianName(e.target.value)}
                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="editedKelas"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Pilih Kelas
                  </label>
                  <select
                    id="editedKelas"
                    value={editedKelas}
                    onChange={(e) => setEditedKelas(e.target.value)}
                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150 bg-white`}
                    required
                  >
                    <option value="">Pilih Kelas</option>
                    {classOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="editedTanggalUjian"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Tanggal Ujian
                    </label>
                    <input
                      type="date"
                      id="editedTanggalUjian"
                      value={editedTanggalUjian}
                      onChange={(e) => setEditedTanggalUjian(e.target.value)}
                      className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="editedWaktuUjian"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Waktu Mulai
                    </label>
                    <input
                      type="time"
                      id="editedWaktuUjian"
                      value={editedWaktuUjian}
                      onChange={(e) => setEditedWaktuUjian(e.target.value)}
                      className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="editedDurasiUjian"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Durasi Ujian (menit)
                  </label>
                  <input
                    type="number"
                    id="editedDurasiUjian"
                    value={editedDurasiUjian}
                    onChange={(e) =>
                      setEditedDurasiUjian(parseInt(e.target.value, 10) || 0)
                    }
                    min="1"
                    placeholder="Contoh: 90"
                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="editedFileSoalUrl"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    URL File Soal Ujian
                  </label>
                  <input
                    type="url"
                    id="editedFileSoalUrl"
                    value={editedFileSoalUrl}
                    onChange={(e) => setEditedFileSoalUrl(e.target.value)}
                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="editedFileVideoUrl"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    URL Video Penjelasan (opsional)
                  </label>
                  <input
                    type="url"
                    id="editedFileVideoUrl"
                    value={editedFileVideoUrl}
                    onChange={(e) => setEditedFileVideoUrl(e.target.value)}
                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg ${inputFocusColor} transition duration-150`}
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-300 text-sm font-medium"
                  >
                    {" "}
                    Batal{" "}
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2.5 ${primaryButtonColor} ${primaryButtonTextColor} rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 text-sm font-medium`}
                  >
                    {" "}
                    Simpan Perubahan{" "}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* --- AKHIR MODAL EDIT UJIAN --- */}

        {/* Modal Konfirmasi Hapus */}
        {showDeleteConfirmModal && (
          // ... (Kode Modal Konfirmasi Hapus tetap sama) ...
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Konfirmasi Hapus
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                Apakah Anda yakin ingin menghapus ujian ini? Aksi ini tidak
                dapat dibatalkan.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  type="button"
                  className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-300 text-sm font-medium"
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setUjianToDeleteId(null);
                  }}
                >
                  {" "}
                  Batal{" "}
                </button>
                <button
                  type="button"
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-300 text-sm font-medium"
                  onClick={handleDeleteUjian}
                >
                  {" "}
                  Ya, Hapus{" "}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Alert (Sukses/Error) */}
        {showAlertModal && (
          // ... (Kode Modal Alert tetap sama) ...
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div
              className={`bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center animate-fade-in-up ${
                alertType === "success"
                  ? "border-t-4 border-green-500"
                  : "border-t-4 border-red-500"
              }`}
            >
              <h3
                className={`text-xl font-semibold mb-3 ${
                  alertType === "success" ? "text-green-700" : "text-red-700"
                }`}
              >
                {alertType === "success" ? "Berhasil!" : "Terjadi Kesalahan!"}
              </h3>
              <p className="text-gray-600 mb-6 text-sm">{alertMessage}</p>
              <button
                type="button"
                className={`px-6 py-2.5 rounded-lg shadow-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm font-medium ${
                  alertType === "success"
                    ? "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500"
                    : "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
                }`}
                onClick={() => setShowAlertModal(false)}
              >
                {" "}
                Oke{" "}
              </button>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
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
