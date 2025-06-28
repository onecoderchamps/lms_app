// /pages/index.js atau /app/page.jsx

import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  Briefcase,
  BarChart2,
  MessageCircle,
  Twitter,
  Instagram,
  Linkedin,
  Menu,
  X as CloseIcon,
  MapPin,
  Mail,
  Phone,
  Star,
  Edit,
  ListChecks,
} from "lucide-react";

// Komponen untuk kartu Benefit (tetap sama)
const BenefitCard = ({ icon, title, description }) => (
  <div className="flex items-start space-x-4">
    <div className="flex-shrink-0 bg-orange-100 text-orange-600 w-12 h-12 rounded-lg flex items-center justify-center">
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-slate-500">{description}</p>
    </div>
  </div>
);

// Komponen untuk kartu Mentor (Tidak digunakan lagi di section mentors, tapi definisinya saya biarkan jika dipakai di tempat lain)
const MentorCard = ({ name, role, avatarUrl }) => (
  // Ini adalah versi terakhir MentorCard dengan efek terangkat dan ikon Briefcase
  // Jika Anda tidak menggunakannya di tempat lain, Anda bisa menghapus definisi ini.
  <div className="bg-white rounded-2xl shadow-lg relative overflow-hidden text-center max-w-[300px] mx-auto">
    <div className="bg-orange-500 h-40 rounded-t-2xl flex items-end justify-center pt-4">
      <img
        src={avatarUrl}
        alt={`Foto ${name}`}
        className="w-[180px] h-[180px] rounded-2xl object-cover shadow-lg border-4 border-white transform translate-y-12"
      />
    </div>
    <div className="pt-[70px] pb-6 px-4">
      <h3 className="text-xl font-bold text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis">
        {name}
      </h3>
      <div className="flex items-center justify-center mt-2 text-slate-600 text-sm">
        <Briefcase size={16} className="mr-1 text-slate-500" />
        <p>{role}</p>
      </div>
    </div>
  </div>
);


// Komponen untuk kartu Testimoni Murid (tetap sama)
const StudentTestimonialCard = ({ quote, name, role, avatarUrl }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
    <p className="text-slate-600 text-sm">"{quote}"</p>
    <div className="flex items-center mt-4">
      <img
        src={avatarUrl}
        alt={`Foto ${name}`}
        className="w-10 h-10 rounded-full object-cover"
      />
      <div className="ml-3">
        <p className="font-semibold text-slate-800 text-sm">{name}</p>
        <p className="text-xs text-slate-500">{role}</p>
      </div>
    </div>
  </div>
);

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Fungsi untuk smooth scroll (tetap sama)
  const handleSmoothScroll = (e) => {
    e.preventDefault();
    const targetId = e.currentTarget.getAttribute("href").substring(1);
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setIsMenuOpen(false); // Tutup menu mobile setelah diklik
  };

  return (
    <>
      <Head>
        <title>CoderChamps - Membangun Masa Depan Developer Indonesia</title>
        <meta
          name="description"
          content="CoderChamps adalah lembaga pendidikan teknologi yang berkomitmen untuk mencetak talenta digital berstandar global melalui pelatihan intensif."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="bg-white text-slate-800 font-sans">
        {/* Header / Navigasi (tetap sama) */}
        <header className="bg-white/95 backdrop-blur-lg fixed top-0 left-0 right-0 z-50">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <img
                src="/logo.png"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://placehold.co/40x40/f97316/ffffff?text=C";
                }}
                alt="Logo CoderChamps"
                className="h-8 w-auto"
              />
            </Link>

            <nav className="hidden md:flex items-center space-x-10">
              <a
                href="#home"
                onClick={handleSmoothScroll}
                className="text-slate-700 hover:text-orange-600 font-medium transition-colors"
              >
                Beranda
              </a>
              <a
                href="#benefits"
                onClick={handleSmoothScroll}
                className="text-slate-700 hover:text-orange-600 font-medium transition-colors"
              >
                Keunggulan
              </a>
              <a
                href="#mentors"
                onClick={handleSmoothScroll}
                className="text-slate-700 hover:text-orange-600 font-medium transition-colors"
              >
                Mentor
              </a>
              <a
                href="#testimonials"
                onClick={handleSmoothScroll}
                className="text-slate-700 hover:text-orange-600 font-medium transition-colors"
              >
                Testimoni
              </a>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-orange-600 font-semibold text-sm px-5 py-2 rounded-full border border-orange-500 hover:bg-orange-50 transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/auth/register"
                className="bg-orange-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-orange-600 shadow-md hover:shadow-lg transition-all duration-300"
              >
                Daftar
              </Link>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? (
                  <CloseIcon className="w-6 h-6 text-slate-700" />
                ) : (
                  <Menu className="w-6 h-6 text-slate-700" />
                )}
              </button>
            </div>
          </div>

          {isMenuOpen && (
            <div className="md:hidden px-6 pt-2 pb-4 space-y-2 border-t border-slate-200">
              <a
                href="#home"
                onClick={handleSmoothScroll}
                className="block text-slate-700 hover:text-orange-600 font-medium py-2"
              >
                Beranda
              </a>
              <a
                href="#benefits"
                onClick={handleSmoothScroll}
                className="block text-slate-700 hover:text-orange-600 font-medium py-2"
              >
                Keunggulan
              </a>
              <a
                href="#mentors"
                onClick={handleSmoothScroll}
                className="block text-slate-700 hover:text-orange-600 font-medium py-2"
              >
                Mentor
              </a>
              <a
                href="#testimonials"
                onClick={handleSmoothScroll}
                className="block text-slate-700 hover:text-orange-600 font-medium py-2"
              >
                Testimoni
              </a>
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <Link
                  href="/auth/login"
                  className="block text-center text-orange-600 font-semibold py-2 rounded-full hover:bg-orange-50 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/register"
                  className="block text-center bg-orange-500 text-white px-5 py-2 rounded-full font-semibold hover:bg-orange-600 shadow-md"
                >
                  Daftar
                </Link>
              </div>
            </div>
          )}
        </header>

        <main>
          {/* Hero Section (tetap sama) */}
          <section id="home" className="pt-32 pb-20 md:pt-40 md:pb-28">
            <div className="container mx-auto px-6">
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div className="text-center md:text-left">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">
                    Pilihan Terbaik untuk Memulai Karir Masa Depan Anda.
                  </h1>
                  <p className="mt-6 text-lg text-slate-600">
                    Kami hadir untuk membantu Anda mencapai potensi penuh dalam
                    dunia teknologi yang kompetitif.
                  </p>
                  <div className="mt-10">
                    <a
                      href="/auth/login"
                      className="bg-orange-500 text-white px-8 py-3 rounded-lg text-base font-semibold hover:bg-orange-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      Jelajahi Program
                    </a>
                  </div>
                </div>
                <div className="relative">
                  <img
                    src="/gambar1.png"
                    alt="Siswa memegang buku"
                    className="mx-auto"
                  />
                  <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-orange-100 rounded-3xl -z-10"></div>
                </div>
              </div>
            </div>
          </section>

          {/* Why CoderChamps Different? (tetap sama) */}
          <section
            id="benefits"
            className="relative py-20 md:py-28 overflow-hidden"
          >
            <style jsx>{`
              #benefits::before {
                content: "";
                position: absolute;
                inset: 0;
                background-image: url("/latar.png");
                background-size: cover;
                background-position: center;
                opacity: 0.3;
                z-index: 0;
              }
            `}</style>

            <div className="container mx-auto px-6 text-center relative z-10">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                  Mengapa CoderChamps Berbeda?
                </h2>
                <p className="mt-4 text-slate-600">
                  CoderChamps menggabungkan kurikulum praktis, mentor ahli, dan
                  komunitas global untuk menemani perjalanan karir digital Anda.
                </p>
              </div>
              <div className="grid lg:grid-cols-2 gap-10 items-center mt-16">
                <div>
                  <img
                    src="/gambar2.png"
                    alt="Siswa sedang belajar"
                    className="rounded-2xl shadow-xl mx-auto"
                  />
                </div>
                <div className="text-left space-y-8">
                  <h3 className="text-2xl font-bold text-slate-800">
                    Keunggulan Program Kami
                  </h3>
                  <BenefitCard
                    icon={<Briefcase size={24} />}
                    title="Pelatihan Intensif"
                    description="Kami berkomitmen memberikan bootcamp pemrograman intensif dengan materi relevan dan terkini."
                  />
                  <BenefitCard
                    icon={<BarChart2 size={24} />}
                    title="Pelatihan Soft Skill Gratis"
                    description="Kami menyediakan pelatihan komunikasi dan persiapan wawancara yang sesuai standar industri."
                  />
                  <BenefitCard
                    icon={<MessageCircle size={24} />}
                    title="Bimbingan Karir"
                    description="Tidak ada kata gagal, kami akan terus membimbing hingga Anda sukses berkarir di dunia kerja."
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section Mentor (Direvisi untuk menampilkan gambar langsung) */}
          <section id="mentors" className="py-20 md:py-28">
            <div className="container mx-auto px-6 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                Mentor Profesional Kami
              </h2>
              
              <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-8 gap-y-8 justify-center items-center mt-20 max-w-4xl mx-auto">
                <img
                  src="/mentor 1.png" // Path ke gambar mentor pertama
                  alt="Hilyatul Wahid"
                  className="w-full h-auto object-contain rounded-xl shadow-lg" // Gaya untuk gambar individual
                />
                <img
                  src="/mentor 2.png" // Path ke gambar mentor kedua
                  alt="Naufal Ash Siddiq"
                  className="w-full h-auto object-contain rounded-xl shadow-lg" // Gaya untuk gambar individual
                />
              </div>
              

            </div>
          </section>

          {/* Testimonial Section (tetap sama) */}
          <section id="testimonials" className="py-20 md:py-28 bg-slate-50">
            <div className="container mx-auto px-6">
              <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                  Apa Kata Alumni Kami?
                </h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8 mt-16 max-w-5xl mx-auto">
                <StudentTestimonialCard
                  quote="Materinya sangat relevan dengan industri saat ini. Saya merasa jauh lebih siap untuk terjun ke dunia kerja setelah mengikuti bootcamp di sini."
                  name="Andi Pratama"
                  role="Fullstack Developer"
                  avatarUrl="https://i.pravatar.cc/150?u=andi"
                />
                <StudentTestimonialCard
                  quote="Mentor-mentornya sangat sabar dan suportif. Mereka tidak hanya mengajar, tetapi juga membimbing. Komunitasnya juga sangat aktif!"
                  name="Siti Nurhaliza"
                  role="UI/UX Designer"
                  avatarUrl="https://i.pravatar.cc/150?u=siti"
                />
                <StudentTestimonialCard
                  quote="Kurikulumnya terstruktur dengan baik. Dari yang tidak tahu apa-apa tentang coding, sekarang saya percaya diri membangun aplikasi sendiri."
                  name="Rian Hidayat"
                  role="Mobile Developer"
                  avatarUrl="https://i.pravatar.cc/150?u=rian"
                />
                <StudentTestimonialCard
                  quote="Pelatihan soft skill-nya sangat berguna. Saya belajar banyak tentang cara membuat CV dan menghadapi wawancara kerja. Benar-benar paket lengkap!"
                  name="Dewi Anjani"
                  role="Data Scientist"
                  avatarUrl="https://i.pravatar.cc/150?u=dewi"
                />
              </div>
            </div>
          </section>
        </main>

        {/* Footer (tetap sama) */}
        <footer className="bg-white text-slate-500 border-t">
          <div className="container mx-auto px-6 py-12">
            <div className="grid md:grid-cols-12 gap-8">
              <div className="md:col-span-4">
                <Link href="/" className="flex items-center space-x-2">
                  <img
                    src="/logo.png"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://placehold.co/40x40/f97316/ffffff?text=C";
                    }}
                    alt="Logo CoderChamps"
                    className="h-8 w-auto"
                  />
                </Link>
                <p className="text-sm mt-4 max-w-xs">
                  CoderChamps adalah lembaga pendidikan yang membantu Anda
                  memulai karir di dunia teknologi.
                </p>
              </div>
              <div className="md:col-span-2">
                <h3 className="font-semibold text-slate-800">Perusahaan</h3>
                <ul className="mt-4 space-y-2 text-sm">
                  <li>
                    <a
                      href="#home"
                      onClick={handleSmoothScroll}
                      className="hover:text-orange-600"
                    >
                      Beranda
                    </a>
                  </li>
                  <li>
                    <a
                      href="#benefits"
                      onClick={handleSmoothScroll}
                      className="hover:text-orange-600"
                    >
                      Keunggulan
                    </a>
                  </li>
                  <li>
                    <a
                      href="#mentors"
                      onClick={handleSmoothScroll}
                      className="hover:text-orange-600"
                    >
                      Mentor
                    </a>
                  </li>
                </ul>
              </div>
              <div className="md:col-span-3">
                <h3 className="font-semibold text-slate-800">Hubungi Kami</h3>
                <ul className="mt-4 space-y-3 text-sm">
                  <li className="flex items-start">
                    <Mail size={16} className="mr-3 mt-1 flex-shrink-0" />
                    <span>lembagalmsindonesia@gmail.com</span>
                  </li>
                  <li className="flex items-start">
                    <Phone size={16} className="mr-3 mt-1 flex-shrink-0" />
                    <span>(62) 851-5992-2325</span>
                  </li>
                  <li className="flex items-start">
                    <MapPin size={16} className="mr-3 mt-1 flex-shrink-0" />
                    <span>
                      Jl. Margonda Pondok Indah No. 73A kelurahan, Jawa Barat
                      16424
                    </span>
                  </li>
                </ul>
              </div>
              <div className="md:col-span-3">
                <h3 className="font-semibold text-slate-800">Media Sosial</h3>
                <div className="flex space-x-4 mt-4">
                  <a href="#" className="text-slate-400 hover:text-orange-600">
                    <Twitter />
                  </a>
                  <a href="#" className="text-slate-400 hover:text-orange-600">
                    <Instagram />
                  </a>
                  <a href="#" className="text-slate-400 hover:text-orange-600">
                    <Linkedin />
                  </a>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-200 mt-12 pt-8 text-center text-sm">
              <p>
                Hak Cipta &copy; {new Date().getFullYear()} CoderChamps. Semua
                Hak Dilindungi.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}