import { useState, useEffect } from 'react';
import MainLayout from './layouts/MainLayout';
import { CalendarDays, CheckCircle, XCircle, MinusCircle, AlertTriangle } from 'lucide-react';

export default function AbsensiPage() {
  const [absensiRecords, setAbsensiRecords] = useState([
    { id: 1, date: '2025-05-01', status: 'Hadir', note: 'Tepat waktu' },
    { id: 2, date: '2025-05-02', status: 'Hadir', note: '' },
    { id: 3, date: '2025-05-03', status: 'Sakit', note: 'Demam tinggi, surat dokter menyusul.' },
    { id: 4, date: '2025-05-04', status: 'Hadir', note: '' },
    { id: 5, date: '2025-05-05', status: 'Izin', note: 'Acara keluarga mendadak.' },
    { id: 6, date: '2025-05-06', status: 'Alpha', note: '' }, // Nama status disesuaikan jika perlu
    { id: 7, date: '2025-05-07', status: 'Hadir', note: '' },
    { id: 8, date: '2025-05-08', status: 'Hadir', note: '' },
  ]);

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'Hadir':
        return { icon: <CheckCircle size={22} strokeWidth={2} />, color: 'text-green-700', bgColor: 'bg-green-100', borderColor: 'border-green-300' };
      case 'Sakit':
        return { icon: <MinusCircle size={22} strokeWidth={2} />, color: 'text-yellow-700', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-300' };
      case 'Izin':
        return { icon: <AlertTriangle size={22} strokeWidth={2} />, color: 'text-blue-700', bgColor: 'bg-blue-100', borderColor: 'border-blue-300' };
      case 'Alpha': // Atau 'Alfa' jika itu yang Anda gunakan
        return { icon: <XCircle size={22} strokeWidth={2} />, color: 'text-red-700', bgColor: 'bg-red-100', borderColor: 'border-red-300' };
      default:
        return { icon: <MinusCircle size={22} strokeWidth={2} />, color: 'text-gray-700', bgColor: 'bg-gray-100', borderColor: 'border-gray-300' };
    }
  };

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Riwayat Absensi Saya</h1>
          </div>

          {absensiRecords.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <p className="text-xl font-medium text-gray-500">Belum ada riwayat absensi.</p>
              <p className="text-sm text-gray-400 mt-2">Hubungi guru atau admin jika ada pertanyaan.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Menampilkan data terbaru di atas */}
              {absensiRecords.slice().reverse().map((record, index) => { 
                const { icon, color, bgColor, borderColor } = getStatusDisplay(record.status);
                return (
                  <div
                    key={record.id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 rounded-lg shadow-md border ${borderColor} ${bgColor} transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in-up`}
                    style={{ animationDelay: `${(index * 0.05) + 0.2}s` }} // Efek stagger untuk list items
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-grow min-w-0"> {/* min-w-0 untuk truncate */}
                      <div className={`p-2.5 rounded-full ${bgColor} ${color}`}>
                        {icon}
                      </div>
                      <div className="flex-grow min-w-0"> {/* min-w-0 untuk truncate */}
                        <p className="font-semibold text-md sm:text-lg text-gray-800 truncate" title={record.date}>
                          <span className="mr-2 text-gray-500">
                            <CalendarDays size={16} className="inline -mt-0.5 text-gray-400"/>
                          </span>
                          {new Date(record.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p className={`text-sm font-medium ${color}`}>{record.status}</p>
                      </div>
                    </div>
                    {record.note && (
                      <p className="mt-2 sm:mt-0 text-sm text-gray-600 italic max-w-full sm:max-w-xs truncate text-left sm:text-right pl-0 sm:pl-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200 sm:border-transparent" title={record.note}>
                        <span className="font-medium not-italic text-gray-500">Catatan: </span>{record.note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

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