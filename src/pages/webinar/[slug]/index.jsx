import webinars from "../../../data/webinar";
import { notFound } from "next/navigation";
// import Image from 'next/image';

// --- Ikon dari lucide-react ---
import {
  Calendar,
  Clock,
  Tag,
  CheckCircle,
  Users,
  Mail,
  X,
  Circle,
  Quote,
  Briefcase,
  User
} from 'lucide-react';

// --- BARU: Komponen Ikon WhatsApp (SVG) ---
const WhatsAppIcon = (props) => (
  <svg viewBox="0 0 32 32" {...props}>
    <path
      fill="currentColor"
      d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.044-.53-.044-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.33.244-.73.244-1.088 0-.058 0-.144-.03-.215-.1-.172-2.434-1.39-2.678-1.39zm-2.942 3.828c-1.705 0-3.27-.506-4.64-1.448l-.34-.205-3.44 1.82.016-3.545-.2-1.19c-.382-2.29.54-4.61 2.71-6.22 2.17-1.61 4.95-1.95 7.42-.94 2.47.99 4.21 3.23 4.59 5.92.38 2.69-.61 5.25-2.61 6.96-1.51 1.29-3.4 1.99-5.32 1.99zm11.13-17.53c-4.42-4.11-11.33-4.3-16.04-.63-4.7 3.67-6.21 9.94-3.56 15.24 2.65 5.3 8.71 8.16 14.35 6.91 5.64-1.25 9.7-6.08 9.7-11.79 0-1.57-.3-3.09-1.08-4.48z"
    />
  </svg>
);


// --- BARU: Komponen Floating WhatsApp Button ---
const FloatingWhatsAppButton = ({ phoneNumber, title, date }) => {
  // Format nomor telepon ke standar internasional
  const formattedPhoneNumber = phoneNumber.startsWith('0') 
    ? `62${phoneNumber.substring(1)}` 
    : phoneNumber;
  
  // Buat pesan default dan encode untuk URL
  const message = `Hallo, saya ingin mendaftar webinar "${title}" yang akan diadakan pada tanggal ${date}.`;
  const encodedMessage = encodeURIComponent(message);
  
  const whatsappUrl = `https://wa.me/${formattedPhoneNumber}?text=${encodedMessage}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex pb-2 pt-2 pl-4 pr-4 items-center justify-center rounded-full bg-green-500 text-white shadow-xl transition-transform duration-300 hover:scale-110 hover:bg-green-600"
      aria-label="Hubungi via WhatsApp"
    >
      DAFTAR SEKARANG
    </a>
  );
};


// Komponen Pembungkus untuk Ikon dan Teks
const DetailItem = ({ Icon, text }) => (
  <div className="flex items-center text-orange-500 space-x-2">
    <Icon className="w-5 h-5 flex-shrink-0" />
    <span className="text-gray-800 font-medium">{text}</span>
  </div>
);

// Komponen Testimoni yang Lebih Menarik
const TestimonialCard = ({ quote, author, title, avatarUrl }) => (
  <blockquote className="relative p-6 bg-white border border-gray-200 rounded-xl shadow-lg transition duration-300 h-full flex flex-col justify-between hover:shadow-orange-200/50">
    <p className="text-lg italic text-gray-700 leading-relaxed pt-4">
      {quote}
    </p>
    <footer className="mt-6 pt-4 border-t border-gray-100 flex items-center">
      <div>
        <div className="font-bold text-orange-600">{author}</div>
        {title && <div className="text-sm text-gray-500">{title}</div>}
      </div>
    </footer>
  </blockquote>
);

export default function WebinarDetail({ webinar }) {
  if (!webinar) return notFound();

  const phoneNumber = "081385285928"; // Ganti dengan nomor WhatsApp Anda

  const formattedPhoneNumber = phoneNumber.startsWith('0') 
    ? `62${phoneNumber.substring(1)}` 
    : phoneNumber;
  
  // Buat pesan default dan encode untuk URL
  const message = `Hallo, saya ingin mendaftar webinar "${webinar.title}" yang akan diadakan pada tanggal ${webinar.date}.`;
  const encodedMessage = encodeURIComponent(message);
  
  const whatsappUrl = `https://wa.me/${formattedPhoneNumber}?text=${encodedMessage}`;

  // Komponen CTA tunggal di luar Sidebar
  const MainCtaButton = () => (
    <div className="mt-12 text-center">
        <a target="_blank" href={whatsappUrl} className="inline-block bg-orange-500 text-white font-extrabold text-xl py-4 px-12 rounded-lg shadow-xl hover:bg-orange-600 transition duration-300 transform hover:scale-105">
            DAFTAR SEKARANG &raquo;
        </a>
        <p className="text-sm text-gray-400 mt-3">Slot terbatas. Amankan kursi Anda sekarang!</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* ... (Konten header dan section lainnya tetap sama) ... */}

      <header className="bg-black text-white py-16 shadow-2xl">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-orange-400 font-medium mb-2 uppercase tracking-widest">Webinar Eksklusif</p>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">{webinar.title}</h1>
          <p className="mt-4 text-xl font-light max-w-3xl opacity-90 mx-auto">{webinar.hero.subtitle}</p> 

          <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-4 bg-white p-4 rounded-lg max-w-fit mx-auto shadow-lg">
            <DetailItem Icon={Calendar} text={webinar.date} />
            <DetailItem Icon={Clock} text={webinar.time} />
            <DetailItem Icon={Tag} text={webinar.price} />
            <DetailItem Icon={Users} text={`Oleh ${webinar.footer.brand}`} />
          </div>

          <a target="_blank" href={whatsappUrl} className="mt-10 inline-block bg-orange-500 text-white font-extrabold text-lg py-3 px-10 rounded-full shadow-2xl hover:bg-orange-400 transition duration-300 transform hover:scale-105">
            DAFTAR SEKARANG &raquo;
          </a>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 md:p-10">
          
        <section className="mt-8 bg-white p-8 rounded-xl shadow-xl border-t-8 border-orange-500 text-gray-800">
          <h2 className="text-3xl font-bold text-orange-600 mb-6 text-center">
            Masalah yang Sering Dialami
          </h2>
          <ul className="space-y-4">
            {webinar.problems.map((p, i) => (
              <li key={i} className="flex items-start text-lg text-gray-700">
                <X className="w-6 h-6 text-orange-500 mr-3 mt-1 flex-shrink-0" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </section>

        <MainCtaButton />

        <section className="mt-12">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Apa yang Anda Dapatkan
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {webinar.benefits.map((b, i) => (
              <div key={i} className="p-6 border border-gray-700 rounded-xl bg-gray-800 shadow-md transition duration-300 hover:shadow-xl hover:border-orange-400 text-white">
                <CheckCircle className="w-7 h-7 text-orange-500 mb-3" />
                <h3 className="font-bold text-xl text-white">{b.title}</h3>
              </div>
            ))}
          </div>
        </section>
        
        <section className="mt-12">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Struktur & Alur Agenda
          </h2>
          <div className="max-w-2xl mx-auto">
            <ol className="space-y-6 border-l-4 border-orange-500 pl-8">
              {webinar.agenda.map((a, i) => (
                <li key={i} className="relative">
                  <div className="absolute w-5 h-5 bg-orange-600 rounded-full -left-[36px] mt-1 border-4 border-gray-900"></div>
                  <div className="text-xl font-bold text-orange-400">Modul {i + 1}</div>
                  <p className="text-gray-300 mt-1">{a}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {webinar.mentor && (
          <section className="mt-12 bg-white p-8 rounded-xl shadow-xl border-t-8 border-orange-500 max-w-3xl mx-auto text-gray-800">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Kenalan dengan Mentor Anda
            </h2>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3 flex flex-col items-center text-center mx-auto md:mx-0">
                <div className="w-40 h-40 relative flex-shrink-0">
                  <img 
                    src={webinar.mentor.avatarUrl || 'https://via.placeholder.com/200?text=Mentor'}
                    alt={webinar.mentor.name}
                    width={160}
                    height={160}
                    className="rounded-full object-cover border-4 border-orange-200 shadow-md"
                  />
                </div>
                <h3 className="text-2xl font-bold text-orange-600 mt-4">{webinar.mentor.name}</h3>
                <p className="text-lg font-semibold text-gray-600">{webinar.mentor.title}</p>
              </div>
              <div className="md:w-2/3 md:text-left">
                <div className="mb-6">
                  <p className="text-gray-700 leading-relaxed italic border-l-4 border-orange-100 pl-4">
                    "{webinar.mentor.profile}"
                  </p>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2" /> Riwayat Karir & Keahlian
                </h4>
                <ul className="space-y-2 list-none">
                  {webinar.mentor.career.map((item, i) => (
                    <li key={i} className="flex items-start text-gray-700">
                      <span className="text-orange-500 font-extrabold text-xl mr-3 leading-none">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}
        
        <MainCtaButton />
      </div>
      
      <section className="bg-white py-16 mt-10 shadow-inner">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
            Kata Mereka yang Sudah Ikut
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {webinar.testimonials.map((t, i) => (
              <TestimonialCard 
                key={i} 
                quote={t.quote} 
                author={t.author} 
                title={t.title} 
                avatarUrl={t.avatarUrl}
              />
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-black text-white py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-lg font-semibold">{webinar.footer.brand}</p>
          <div className="mt-3 text-sm text-gray-400">
            <p className="mt-1">
              Hubungi Kami:
            </p>
            <a
              href={`mailto:${webinar.footer.email}`}
              className="inline-flex items-center space-x-1 text-orange-400 hover:text-orange-300 transition duration-150"
            >
              <Mail className="w-4 h-4" />
              <span>{webinar.footer.email}</span>
            </a>
          </div>
          <p className="mt-6 text-xs text-gray-500">
            © {new Date().getFullYear()} {webinar.footer.brand}. Hak Cipta Dilindungi.
          </p>
        </div>
      </footer>
      
      {/* --- BARU: Pemanggilan Komponen Floating WhatsApp Button --- */}
      {/* Tombol ini akan mengambil data dari 'webinar' yang sedang ditampilkan */}
      <FloatingWhatsAppButton 
        phoneNumber="081385285928" 
        title={webinar.title} 
        date={webinar.date}
      />
    </main>
  );
}

// getStaticPaths dan getStaticProps tetap sama
export async function getStaticPaths() {
  return {
    paths: webinars.map((w) => ({
      params: { slug: w.slug }
    })),
    fallback: false
  };
}

export async function getStaticProps({ params }) {
  const webinar = webinars.find((w) => w.slug === params.slug) || null;
  return {
    props: { webinar }
  };
}