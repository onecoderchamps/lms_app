import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { app } from "../../api/firebaseConfig"; // Pastikan path ini benar
import MainLayout from "./layouts/MainLayout";
import { PlusCircle, X, Edit, Trash2 } from "lucide-react"; // Impor ikon yang dibutuhkan

const db = getFirestore(app);

export default function MemberPage() {
  const [emailToAdd, setEmailToAdd] = useState("");
  const [emailValid, setEmailValid] = useState(null);
  const [userUid, setUserUid] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showAddMuridModal, setShowAddMuridModal] = useState(false);
  const [murids, setMurids] = useState([]);
  const [loadingMurids, setLoadingMurids] = useState(true); // Default ke true agar loading tampil

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [muridToDelete, setMuridToDelete] = useState(null);

  const showCustomAlert = (msg, type) => {
    alert(`${type.toUpperCase()}: ${msg}`);
  };

  const idKelas =
    typeof window !== "undefined" ? localStorage.getItem("idKelas") : null;

  const fetchMurids = async () => {
    if (!idKelas) {
      setLoadingMurids(false);
      return;
    }
    setLoadingMurids(true);
    try {
      const muridsQuery = query(
        collection(db, "murids"),
        where("idKelas", "==", idKelas)
      );
      const querySnapshot = await getDocs(muridsQuery);
      const muridList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMurids(muridList);
    } catch (err) {
      console.error("Gagal mengambil data murid:", err);
    } finally {
      setLoadingMurids(false);
    }
  };

  useEffect(() => {
    fetchMurids();
  }, [idKelas]);

  const checkEmailExists = async (email) => {
    setCheckingEmail(true);
    try {
      const usersQuery = query(
        collection(db, "users"),
        where("email", "==", email)
      );
      const querySnapshot = await getDocs(usersQuery);
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setUserUid(querySnapshot.docs[0].id);
        setUserFullName(userData.namaLengkap || "");
        setEmailValid(true);
      } else {
        setEmailValid(false);
        setUserUid("");
        setUserFullName("");
      }
    } catch (err) {
      console.error("Gagal cek email:", err);
      setEmailValid(false);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleAddMuridToKelas = async (e) => {
    e.preventDefault();
    if (!emailValid || !idKelas || !userUid) return;

    try {
      await addDoc(collection(db, "murids"), {
        idKelas,
        email: emailToAdd,
        namaLengkap: userFullName,
        idUser: userUid,
      });
      showCustomAlert("Murid berhasil ditambahkan!", "success");
      setShowAddMuridModal(false);
      setEmailToAdd("");
      setEmailValid(null);
      fetchMurids();
    } catch (err) {
      showCustomAlert("Gagal menambahkan murid!", "error");
      console.error(err);
    }
  };

  const openDeleteModal = (murid) => {
    setMuridToDelete(murid);
    setShowDeleteModal(true);
  };

  const handleDeleteMurid = async () => {
    if (!muridToDelete) return;
    try {
      await deleteDoc(doc(db, "murids", muridToDelete.id));
      showCustomAlert("Murid berhasil dihapus!", "success");
      setShowDeleteModal(false);
      setMuridToDelete(null);
      fetchMurids();
    } catch (err) {
      showCustomAlert("Gagal menghapus murid!", "error");
      console.error(err);
    }
  };

  // Definisi warna konsisten untuk styling
  const primaryButtonColor ="bg-orange-500 hover:bg-orange-600 focus:ring-orange-500";
  const primaryButtonTextColor = "text-white";
  const inputFocusColor = "focus:ring-orange-500 focus:border-orange-500";

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        {/* Kartu putih besar sebagai latar belakang konten */}
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          {/* Header Halaman */}
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Manajemen Murid
            </h1>
            <button
              onClick={() => {
                setEmailToAdd("");
                setEmailValid(null);
                setUserFullName("");
                setShowAddMuridModal(true);
              }}
              className={`flex items-center space-x-2 ${primaryButtonColor} ${primaryButtonTextColor} px-5 py-2.5 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 text-sm font-medium`}
            >
              <PlusCircle size={20} />
              <span>Tambah Murid</span>
            </button>
          </div>

          {/* Tabel Daftar Murid */}
          <div className="overflow-x-auto mt-6 border border-gray-200 rounded-lg shadow-sm">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3.5 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Lengkap
                  </th>
                  <th className="py-3.5 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="py-3.5 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loadingMurids ? (
                  <tr>
                    <td
                      colSpan="3"
                      className="text-center p-8 text-gray-500 animate-pulse"
                    >
                      Memuat data murid...
                    </td>
                  </tr>
                ) : murids.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center p-8 text-gray-500">
                      Belum ada murid di kelas ini.
                    </td>
                  </tr>
                ) : (
                  murids.map((murid) => (
                    <tr
                      key={murid.id}
                      className="hover:bg-gray-50/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {murid.namaLengkap || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {murid.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
                        {/* Tombol Edit bisa ditambahkan di sini jika ada fungsionalitasnya */}
                        {/* <button className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-100 transition-colors"> <Edit size={16}/> </button> */}
                        <button
                          onClick={() => openDeleteModal(murid)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-100 transition-colors"
                          aria-label={`Hapus ${murid.namaLengkap}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Tambah Murid */}
        {showAddMuridModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-md relative">
              <button
                onClick={() => setShowAddMuridModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-150"
                aria-label="Tutup modal"
              >
                <X size={24} />
              </button>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">
                Tambah Murid ke Kelas
              </h2>
              <form onSubmit={handleAddMuridToKelas} className="space-y-4">
                <div className="relative">
                  <label
                    htmlFor="emailToAdd"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Murid
                  </label>
                  <div className="flex items-center">
                    <input
                      type="email"
                      id="emailToAdd"
                      placeholder="contoh@example.com"
                      value={emailToAdd}
                      onChange={(e) => {
                        setEmailToAdd(e.target.value);
                        setEmailValid(null);
                        setUserFullName("");
                      }}
                      onBlur={() => {
                        if (emailToAdd.trim())
                          checkEmailExists(emailToAdd.trim());
                      }}
                      required
                      className={`w-full px-4 py-2.5 border rounded-lg transition duration-150 mr-2 shadow-sm ${
                        emailValid === false
                          ? `border-red-400 ring-1 ring-red-400 ${inputFocusColor}`
                          : emailValid === true
                          ? `border-green-500 ring-1 ring-green-500 ${inputFocusColor}`
                          : `border-gray-300 ${inputFocusColor}`
                      }`}
                    />
                    {checkingEmail ? (
                      <span className="text-gray-400 animate-pulse text-xs">
                        ...
                      </span>
                    ) : emailValid === true ? (
                      <span className="text-green-600">✅</span>
                    ) : emailValid === false ? (
                      <span className="text-red-600">❌</span>
                    ) : null}
                  </div>
                  {emailValid === false ? (
                    <p className="text-xs text-red-600 mt-1">
                      Email tidak ditemukan di daftar pengguna sistem.
                    </p>
                  ) : emailValid === true ? (
                    <p className="text-xs text-green-600 mt-1">
                      Pengguna ditemukan:{" "}
                      <span className="font-semibold">{userFullName}</span>
                    </p>
                  ) : null}
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddMuridModal(false)}
                    className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-300 text-sm font-medium"
                  >
                    {" "}
                    Batal{" "}
                  </button>
                  <button
                    type="submit"
                    disabled={!emailValid}
                    className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg shadow-md text-sm font-medium transition-colors duration-300 ${
                      emailValid
                        ? `${primaryButtonColor} ${primaryButtonTextColor} focus:outline-none focus:ring-2 focus:ring-offset-2`
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {" "}
                    <PlusCircle size={18} /> <span>Tambahkan</span>{" "}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Hapus */}
        {showDeleteModal && muridToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-sm text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Konfirmasi Hapus
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                Apakah Anda yakin ingin menghapus murid <br />
                <strong className="text-gray-900">
                  {muridToDelete.namaLengkap}
                </strong>{" "}
                dari kelas ini?
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  type="button"
                  className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-300 text-sm font-medium"
                  onClick={() => setShowDeleteModal(false)}
                >
                  {" "}
                  Batal{" "}
                </button>
                <button
                  type="button"
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-300 text-sm font-medium"
                  onClick={handleDeleteMurid}
                >
                  {" "}
                  Ya, Hapus{" "}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Anda bisa menambahkan <style jsx> di sini jika diperlukan, terutama untuk animasi */}
      </main>
    </MainLayout>
  );
}
