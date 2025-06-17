import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { db } from '../../../api/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Komponen untuk menandai tanggal dengan titik berwarna
const EventDot = ({ color }) => (
  <div style={{ height: '6px', width: '6px', backgroundColor: color, borderRadius: '50%' }}></div>
);

export default function DashboardCalendar({ enrolledKelasIds }) {
  const [eventDates, setEventDates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enrolledKelasIds || enrolledKelasIds.length === 0) {
      setLoading(false);
      return;
    }

    const fetchEvents = async () => {
      setLoading(true);
      const newEventDates = {};
      try {
        // Ambil data Tugas (berdasarkan deadline)
        const tugasQuery = query(collection(db, 'tugas'), where('kelas', 'in', enrolledKelasIds));
        const tugasSnap = await getDocs(tugasQuery);
        tugasSnap.forEach(doc => {
          if (doc.data().deadline) {
            const deadline = doc.data().deadline.toDate();
            const dateString = deadline.toISOString().split('T')[0];
            if (!newEventDates[dateString]) newEventDates[dateString] = [];
            newEventDates[dateString].push({ type: 'tugas' });
          }
        });
        
        // Ambil data Ujian (berdasarkan date)
        const ujianQuery = query(collection(db, 'ujian'), where('kelas', 'in', enrolledKelasIds));
        const ujianSnap = await getDocs(ujianQuery);
        ujianSnap.forEach(doc => {
          if (doc.data().date) {
            const examDate = new Date(doc.data().date);
            const dateString = examDate.toISOString().split('T')[0];
            if (!newEventDates[dateString]) newEventDates[dateString] = [];
            newEventDates[dateString].push({ type: 'ujian' });
          }
        });

        // Ambil data Sesi Live (berdasarkan date)
        const sesiLiveQuery = query(collection(db, 'sesiLive'), where('kelas', 'in', enrolledKelasIds));
        const sesiLiveSnap = await getDocs(sesiLiveQuery);
        sesiLiveSnap.forEach(doc => {
            if (doc.data().date) {
                const liveDate = new Date(doc.data().date);
                const dateString = liveDate.toISOString().split('T')[0];
                if (!newEventDates[dateString]) newEventDates[dateString] = [];
                newEventDates[dateString].push({ type: 'sesiLive' });
            }
        });
        
        setEventDates(newEventDates);

      } catch (error) {
        console.error("Gagal mengambil data untuk kalender:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [enrolledKelasIds]);

  // Fungsi untuk merender titik di bawah tanggal
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateString = date.toISOString().split('T')[0];
      const eventsOnDay = eventDates[dateString];
      if (eventsOnDay && eventsOnDay.length > 0) {
        const hasTugas = eventsOnDay.some(e => e.type === 'tugas');
        const hasUjian = eventsOnDay.some(e => e.type === 'ujian');
        const hasSesiLive = eventsOnDay.some(e => e.type === 'sesiLive');
        
        return (
            <div className="flex justify-center items-center space-x-1 absolute bottom-1.5 left-0 right-0">
                {hasTugas && <EventDot color="#f59e0b" />}
                {hasUjian && <EventDot color="#ef4444" />}
                {hasSesiLive && <EventDot color="#8b5cf6" />}
            </div>
        )
      }
    }
    return null;
  };

  return (
    <>
      <div className="dashboard-calendar-container">
        <Calendar
          tileContent={tileContent}
          className="w-full border-0 shadow-none bg-transparent"
          locale="id-ID"
          prev2Label={null} // Sembunyikan tombol navigasi tahun
          next2Label={null} // Sembunyikan tombol navigasi tahun
        />
        <div className="mt-4 p-2 text-xs flex flex-wrap justify-center gap-x-4 gap-y-2 text-gray-600">
              <div className="flex items-center"><span className="h-2 w-2 rounded-full bg-amber-500 mr-2"></span>Batas Tugas</div>
              <div className="flex items-center"><span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>Ujian</div>
              <div className="flex items-center"><span className="h-2 w-2 rounded-full bg-violet-500 mr-2"></span>Sesi Live</div>
          </div>
      </div>
      
      {/* --- BLOK STYLE KUSTOM --- */}
      <style jsx global>{`
        .dashboard-calendar-container .react-calendar {
          font-family: inherit;
          border-radius: 0.75rem; /* rounded-xl */
          padding: 0.5rem;
        }

        /* Navigasi (Bulan & Panah) */
        .dashboard-calendar-container .react-calendar__navigation {
          display: flex;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        .dashboard-calendar-container .react-calendar__navigation__label {
          font-weight: 700;
          font-size: 1rem;
          flex-grow: 1 !important;
        }
        .dashboard-calendar-container .react-calendar__navigation__arrow {
          font-size: 1.5rem;
          padding: 0 0.75rem;
        }

        /* Nama Hari (SEN, SEL, RAB...) */
        .dashboard-calendar-container .react-calendar__month-view__weekdays__weekday {
          text-align: center;
          padding: 0.5rem 0;
          font-weight: 600;
          font-size: 0.75rem;
          color: #4b5563; /* gray-600 */
        }
        .dashboard-calendar-container .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none; /* Hapus garis bawah */
        }

        /* Kotak Tanggal */
        .dashboard-calendar-container .react-calendar__tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 0.5rem 0.25rem;
          height: 48px;
          border-radius: 0.5rem; /* rounded-lg */
          font-size: 0.875rem;
          transition: background-color 0.2s;
          position: relative; /* Diperlukan untuk posisi absolut titik event */
        }

        /* Kotak tanggal saat di-hover */
        .dashboard-calendar-container .react-calendar__tile:enabled:hover,
        .dashboard-calendar-container .react-calendar__tile:enabled:focus {
          background-color: #f3f4f6; /* gray-100 */
        }

        /* Kotak tanggal hari ini */
        .dashboard-calendar-container .react-calendar__tile--now {
          background-color: #fef3c7; /* amber-100 */
          font-weight: 700;
        }
        .dashboard-calendar-container .react-calendar__tile--now:enabled:hover {
          background-color: #fde68a; /* amber-200 */
        }

        /* Kotak tanggal yang dipilih */
        .dashboard-calendar-container .react-calendar__tile--active {
          background-color: #f97316; /* orange-500 */
          color: white;
          font-weight: 700;
        }
        .dashboard-calendar-container .react-calendar__tile--active:enabled:hover {
          background-color: #ea580c; /* orange-600 */
        }
      `}</style>
    </>
  );
}