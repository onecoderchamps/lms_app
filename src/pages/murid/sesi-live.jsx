import { useState, useEffect } from 'react';
import MainLayout from './layouts/MainLayout';
import { CalendarDays, Clock, Link as LinkIcon, CheckCircle, Hourglass, XCircle, Video } from 'lucide-react';

export default function MuridLiveSessionPage() {
  const [liveSessions, setLiveSessions] = useState([
    {
      id: 1, name: 'Matematika: Kalkulus Dasar', kelas: '12 IPA 1', date: '2025-06-10',
      time: '09:00', link: 'https://zoom.us/j/1234567890', hasAttended: false,
    },
    {
      id: 2, name: 'Fisika: Termodinamika', kelas: '12 IPA 2', date: new Date().toISOString().split('T')[0],
      time: new Date(Date.now() + 5 * 60000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit'}),
      link: 'https://meet.google.com/abc-defg-hij', hasAttended: false,
    },
    {
      id: 3, name: 'Sejarah: Perang Dunia II', kelas: '12 IPA 1', date: '2025-05-28',
      time: '10:00', link: 'https://meet.google.com/xyz-uvw-lmn', hasAttended: true,
    },
    {
      id: 4, name: 'Kimia: Reaksi Redoks', kelas: '12 IPA 1', date: new Date().toISOString().split('T')[0],
      time: new Date(Date.now() - 2 * 60 * 60000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit'}),
      link: 'https://zoom.us/j/9876543210', hasAttended: false,
    },
     {
      id: 5, name: 'Biologi: Fotosintesis', kelas: '12 IPA 1', date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit'}),
      link: 'https://zoom.us/j/111222333', hasAttended: false,
    },
  ]);

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); 
    return () => clearInterval(timer);
  }, []);

  const showCustomAlert = (message, type) => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const getSessionStatus = (sessionDate, sessionTime, checkinWindowMinutes = 15) => {
    const sessionDateTime = new Date(`${sessionDate}T${sessionTime}:00`);
    const now = currentTime; 
    const diffMs = sessionDateTime.getTime() - now.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));

    if (diffMinutes > checkinWindowMinutes) {
      return { status: 'Mendatang', color: 'from-indigo-400 to-indigo-600', text: 'Akan Datang', action: 'none' };
    } else if (diffMinutes <= checkinWindowMinutes && diffMinutes >= -checkinWindowMinutes) {
      return { status: 'Berlangsung', color: 'from-green-400 to-green-600', text: 'Sedang Berlangsung', action: 'checkin' };
    } else { 
      return { status: 'Selesai', color: 'from-gray-400 to-gray-600', text: 'Sudah Selesai', action: 'none' };
    }
  };

  const handleCheckIn = (id) => {
    setLiveSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === id ? { ...session, hasAttended: true } : session
      )
    );
    showCustomAlert('Absensi berhasil dicatat!', 'success');
  };
  
  const primaryButtonColor = "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500";
  const primaryButtonTextColor = "text-white";

  return (
    <MainLayout>
      <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Sesi Live Saya</h1>
          </div>

          {liveSessions.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <p className="text-xl font-medium text-gray-500">Belum ada sesi live.</p>
              <p className="text-sm text-gray-400 mt-2">Silakan periksa secara berkala.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {liveSessions.map((session, index) => { 
                const { status: sessionStatus, color: statusColor, text: statusText, action: actionType } = getSessionStatus(session.date, session.time);
                const isCheckinAvailable = actionType === 'checkin' && !session.hasAttended;

                return (
                  <div 
                    key={session.id} 
                    className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 flex flex-col animate-fade-in-up" // Tambahkan kelas animasi
                    style={{ animationDelay: `${(index * 0.05) + 0.2}s` }} // Efek stagger
                  >
                    <div className={`relative h-36 flex flex-col items-center justify-center p-4 text-white bg-gradient-to-br ${statusColor}`}>
                      <Video size={40} strokeWidth={1.5} />
                      <span className="absolute top-2 right-2 px-2.5 py-1 text-xs font-medium rounded-full bg-black bg-opacity-25">
                        {statusText}
                      </span>
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <p className="font-semibold text-md text-gray-800 mb-1 leading-tight flex-grow min-h-[40px] line-clamp-3" title={session.name}>
                        {session.name}
                      </p>
                      <p className="text-xs text-gray-500 mb-3">Kelas: {session.kelas}</p>
                      <div className="flex items-center text-gray-600 text-xs mb-1">
                        <CalendarDays size={14} className="mr-2 text-gray-400" />
                        <span>{new Date(session.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center text-gray-600 text-xs mb-4">
                        <Clock size={14} className="mr-2 text-gray-400" />
                        <span>Pukul: {session.time} WIB</span>
                      </div>

                      <div className="mt-auto space-y-2.5">
                        <a
                          href={session.link} target="_blank" rel="noreferrer"
                          className={`flex items-center justify-center px-4 py-2.5 rounded-lg shadow-md transition duration-300 text-sm font-medium w-full ${
                            (sessionStatus === 'Selesai' && !session.hasAttended && actionType !== 'checkin') ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                            : `${primaryButtonColor} ${primaryButtonTextColor}` // Tombol Gabung Sesi menjadi oranye
                          }`}
                          title={(sessionStatus === 'Selesai' && !session.hasAttended && actionType !== 'checkin') ? 'Sesi telah berakhir' : 'Gabung ke Sesi Live'}
                          onClick={(e) => (sessionStatus === 'Selesai' && !session.hasAttended && actionType !== 'checkin') && e.preventDefault()}
                        >
                          <LinkIcon size={16} className="mr-2" /> Gabung Sesi
                        </a>
                        
                      </div>
                    </div>
                  </div>
                );
              })}
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
            animation: fadeInUp 0.4s ease-out forwards; /* Durasi animasi disamakan */
            opacity: 0; /* Mulai dengan transparan */
          }
          .line-clamp-3 { /* Fallback untuk line-clamp jika tidak pakai plugin */
            overflow: hidden;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
            max-height: calc(1.2em * 3); /* Sesuaikan dengan line-height Anda */
          }
        `}</style>
      </main>
    </MainLayout>
  );
}