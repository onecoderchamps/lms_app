import { useState, useEffect, useRef } from "react";
import MainLayout from "./layouts/MainLayout";
import Link from 'next/link';
import { FileText, Video, ExternalLink } from 'lucide-react';

export default function MateriMuridPage() {
  const [materis, setMateris] = useState([
    { id: 1, name: 'Aljabar Dasar dan Pengenalan Variabel', type: 'pdf', fileUrl: 'https://www.africau.edu/images/default/sample.pdf' },
    { id: 2, name: 'Video Tutorial: Konsep Fisika Kuantum', type: 'video', fileUrl: 'https://www.youtube.com/embed/JG1y0tX4-3Q1' },
    { id: 3, name: 'Modul Lengkap Sejarah Perang Dunia II', type: 'pdf', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
    { id: 4, name: 'Dasar-Dasar Pemrograman JavaScript Interaktif', type: 'video', fileUrl: 'https://www.youtube.com/embed/JG1y0tX4-3Q2' },
    { id: 5, name: 'Panduan Praktikum Kimia Organik', type: 'pdf', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
    { id: 6, name: 'Video Pembelajaran: Struktur Sel dan Fungsinya', type: 'video', fileUrl: 'https://www.youtube.com/embed/JG1y0tX4-3Q3' },
  ]);

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <MainLayout>
       <main className="flex-1 md:ml-64 md:pt-16 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen mt-15">
        <div className="max-w-full mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Materi Pemberlajaran</h1>
          </div>

          {materis.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <p className="text-xl font-medium text-gray-500">Belum ada materi tersedia.</p>
              <p className="text-sm text-gray-400 mt-2">Hubungi guru Anda jika ada pertanyaan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"> {/* xl:grid-cols-4 jika diinginkan */}
              {materis.map((materi, index) => (
                <Link
                  key={materi.id}
                  href={materi.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5  cursor-pointer flex flex-col ${hasMounted ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: hasMounted ? `${(index * 0.05) + 0.2}s` : '0s' }} 
                >
                  <div className={`relative h-36 flex flex-col items-center justify-center p-4 text-white
                    ${materi.type === 'pdf' ? 'bg-gradient-to-br from-red-400 to-red-600' : 
                      materi.type === 'video' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                      'bg-gradient-to-br from-gray-400 to-gray-600'
                    }
                    transition-colors duration-300`}
                  >
                    {materi.type === 'pdf' ? <FileText size={40} strokeWidth={1.5} /> : <Video size={40} strokeWidth={1.5} />}
                    <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-semibold uppercase bg-black bg-opacity-25 rounded-full">
                      {materi.type}
                    </span>
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <p className="font-semibold text-md text-gray-800 mb-2 leading-tight flex-grow min-h-[3.5rem] line-clamp-3" title={materi.name}>
                      {materi.name}
                    </p>
                    <div className="mt-auto pt-2">
                      <div className="flex items-center text-orange-600 hover:text-orange-700 font-medium text-sm transition duration-150">
                        <ExternalLink size={16} className="mr-1.5" />
                        Lihat Materi
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div> 
         <style jsx>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.4s ease-out forwards; 
            opacity: 0;
          }
          .line-clamp-3 { 
            overflow: hidden;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
            max-height: calc(1.2em * 3); 
          }
        `}</style>
      </main>
    </MainLayout>
  );
}