// /pages/index.js atau /app/page.jsx

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { BookOpen, CheckSquare, Edit, ExternalLink, FileText, LayoutDashboard, ListChecks, MonitorPlay, Users, Video, Twitter, Instagram, Facebook, Menu, X as CloseIcon } from 'lucide-react';

// Komponen untuk kartu fitur agar lebih rapi
const FeatureCard = ({ icon, title, description, delay }) => (
    <div className="bg-white p-8 rounded-2xl shadow-lg animate-on-scroll" style={{ animationDelay: delay }}>
        <div className="bg-orange-100 text-orange-500 w-14 h-14 rounded-full flex items-center justify-center">
            {icon}
        </div>
        <h3 className="text-xl font-bold mt-5">{title}</h3>
        <p className="mt-2 text-slate-600 text-sm">{description}</p>
    </div>
);

// Komponen untuk kartu testimoni
const TestimonialCard = ({ quote, name, role, avatarUrl, delay }) => (
    <div className="bg-slate-50 p-8 rounded-2xl animate-on-scroll" style={{ animationDelay: delay }}>
        <p className="text-slate-700 italic">"{quote}"</p>
        <div className="flex items-center mt-6">
            <img src={avatarUrl} alt={`Foto ${name}`} className="w-12 h-12 rounded-full object-cover" />
            <div className="ml-4">
                <p className="font-bold text-slate-800">{name}</p>
                <p className="text-sm text-slate-500">{role}</p>
            </div>
        </div>
    </div>
);

export default function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // Efek untuk mengubah tampilan header saat di-scroll
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Efek untuk animasi elemen saat di-scroll
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, { threshold: 0.1 });

        const elements = document.querySelectorAll('.animate-on-scroll');
        elements.forEach(el => observer.observe(el));

        return () => elements.forEach(el => observer.unobserve(el));
    }, []);

    return (
        <>
            <Head>
                <title>CoderChamps - Platform Belajar Masa Depan</title>
                <meta name="description" content="Kelola kelas, materi, ujian, dan tugas dengan mudah dalam satu platform terintegrasi." />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <div className="bg-slate-50 text-slate-800 font-sans">
                {/* Header / Navigasi */}
                <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-lg shadow-md' : 'bg-white/80'}`}>
                    <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                        <Link href="/" className="flex items-center space-x-2">
                            <img src="/logo.png" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/40x40/f97316/ffffff?text=C' }} alt="Logo CoderChamps" className="h-8 w-8 rounded-lg" />
                            <span className="text-xl font-bold text-slate-800">CoderChamps</span>
                        </Link>

                        <nav className="hidden md:flex items-center space-x-8">
                            <a href="#fitur" className="text-slate-600 hover:text-orange-500 font-medium transition-colors">Fitur</a>
                            <a href="#testimoni" className="text-slate-600 hover:text-orange-500 font-medium transition-colors">Testimoni</a>
                            <a href="#tentang" className="text-slate-600 hover:text-orange-500 font-medium transition-colors">Tentang Kami</a>
                        </nav>

                        <div className="hidden md:flex items-center space-x-3">
                            <Link href="/auth/login" className="text-orange-600 font-semibold text-sm hover:text-orange-700 transition-colors">Masuk</Link>
                            <Link href="/auth/register" className="bg-orange-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-orange-600 shadow-md hover:shadow-lg transition-all duration-300">
                                Daftar Gratis
                            </Link>
                        </div>

                        <div className="md:hidden">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                {isMenuOpen ? <CloseIcon className="w-6 h-6 text-slate-700" /> : <Menu className="w-6 h-6 text-slate-700" />}
                            </button>
                        </div>
                    </div>

                    {isMenuOpen && (
                        <div className="md:hidden px-6 pt-2 pb-4 space-y-2 border-t border-slate-200">
                            <a href="#fitur" className="block text-slate-600 hover:text-orange-500 font-medium py-2" onClick={() => setIsMenuOpen(false)}>Fitur</a>
                            <a href="#testimoni" className="block text-slate-600 hover:text-orange-500 font-medium py-2" onClick={() => setIsMenuOpen(false)}>Testimoni</a>
                            <a href="#tentang" className="block text-slate-600 hover:text-orange-500 font-medium py-2" onClick={() => setIsMenuOpen(false)}>Tentang Kami</a>
                            <div className="border-t border-slate-200 pt-4 space-y-3">
                                <Link href="/auth/login" className="block text-center text-orange-600 font-semibold py-2 rounded-full hover:bg-orange-50 transition-colors">Masuk</Link>
                                <Link href="/auth/register" className="block text-center bg-orange-500 text-white px-5 py-2 rounded-full font-semibold hover:bg-orange-600 shadow-md">
                                    Daftar Gratis
                                </Link>
                            </div>
                        </div>
                    )}
                </header>

                <main>
                    {/* Hero Section */}
                    <section className="bg-white pt-32 pb-20 md:pt-40 md:pb-28">
                        <div className="container mx-auto px-6 text-center">
                            <div className="max-w-3xl mx-auto">
                                <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight animate-on-scroll">
                                    Platform Belajar Masa Depan, Kini Hadir untuk Anda.
                                </h1>
                                <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto animate-on-scroll" style={{ animationDelay: '0.2s' }}>
                                    Kelola kelas, materi, ujian, dan tugas dengan mudah dalam satu platform terintegrasi yang dirancang untuk guru dan murid modern.
                                </p>
                                <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 animate-on-scroll" style={{ animationDelay: '0.4s' }}>
                                    <Link href="/auth/register" className="bg-orange-500 text-white px-8 py-3 rounded-full text-base font-semibold hover:bg-orange-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                                        Mulai Belajar Sekarang
                                    </Link>
                                    <a href="#fitur" className="bg-slate-100 text-slate-700 px-8 py-3 rounded-full text-base font-semibold hover:bg-slate-200 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                                        Lihat Fitur
                                    </a>
                                </div>
                            </div>
                            <div className="mt-16 animate-on-scroll" style={{ animationDelay: '0.6s' }}>
                                <img src="https://placehold.co/1200x600/f0f9ff/64748b?text=Ilustrasi+Platform+LMS" alt="Dashboard Platform" className="rounded-2xl shadow-2xl mx-auto border-4 border-white" />
                            </div>
                        </div>
                    </section>

                    {/* Fitur Section */}
                    <section id="fitur" className="py-20 md:py-28">
                        <div className="container mx-auto px-6">
                            <div className="text-center max-w-2xl mx-auto animate-on-scroll">
                                <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Kenapa Memilih Platform Kami?</h2>
                                <p className="mt-4 text-slate-600">Kami menyediakan semua yang Anda butuhkan untuk pengalaman belajar mengajar yang lebih efisien dan menyenangkan.</p>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
                                <FeatureCard icon={<BookOpen size={28} strokeWidth={1.5} />} title="Manajemen Kelas Lengkap" description="Buat dan kelola berbagai kelas, mulai dari materi, tugas, ujian, hingga absensi siswa dalam satu tempat." delay="0.1s" />
                                <FeatureCard icon={<Video size={28} strokeWidth={1.5} />} title="Materi Interaktif" description="Unggah berbagai tipe materi, mulai dari PDF, video embed dari YouTube, tautan eksternal, hingga artikel langsung." delay="0.2s" />
                                <FeatureCard icon={<CheckSquare size={28} strokeWidth={1.5} />} title="Penilaian Otomatis" description="Buat ujian online dengan soal pilihan ganda yang dinilai otomatis dan berikan skor tambahan untuk esai dengan mudah." delay="0.3s" />
                            </div>
                        </div>
                    </section>

                    {/* Testimoni Section */}
                    <section id="testimoni" className="py-20 md:py-28 bg-white">
                        <div className="container mx-auto px-6">
                            <div className="text-center max-w-2xl mx-auto animate-on-scroll">
                                <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Apa Kata Mereka?</h2>
                                <p className="mt-4 text-slate-600">Lihat bagaimana platform kami telah membantu para guru dan murid.</p>
                            </div>
                            <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8 mt-16 max-w-4xl mx-auto">
                                <TestimonialCard quote="Platform ini benar-benar mengubah cara saya mengajar. Mengelola puluhan murid dan beberapa kelas menjadi sangat mudah dan terorganisir. Fitur penilaiannya sangat membantu!" name="Budi Hartono" role="Guru Matematika, SMA Negeri 1 Jakarta" avatarUrl="https://i.pravatar.cc/150?u=a042581f4e29026704d" delay="0.2s" />
                                <TestimonialCard quote="Sebagai murid, saya suka karena semua materi dan tugas ada di satu tempat. Saya tidak perlu lagi bingung mencari link atau file. Semuanya jelas dan mudah diakses kapan saja." name="Citra Lestari" role="Siswa Kelas 11" avatarUrl="https://i.pravatar.cc/150?u=a042581f4e29026704e" delay="0.4s" />
                            </div>
                        </div>
                    </section>

                    {/* Call to Action Section */}
                    <section id="tentang" className="py-20 md:py-32">
                        <div className="container mx-auto px-6 text-center">
                            <div className="max-w-2xl mx-auto animate-on-scroll">
                                <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Siap Meningkatkan Pengalaman Belajar Anda?</h2>
                                <p className="mt-4 text-slate-600">Bergabunglah dengan ratusan guru dan murid yang telah merasakan kemudahan belajar mengajar dengan platform kami.</p>
                                <div className="mt-10">
                                    <Link href="/auth/register" className="bg-orange-500 text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-orange-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                                        Daftar Gratis Sekarang
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                {/* Footer */}
                <footer className="bg-slate-800 text-slate-400">
                    <div className="container mx-auto px-6 py-8">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <div className="text-center md:text-left mb-4 md:mb-0">
                                <Link href="/" className="flex items-center justify-center md:justify-start space-x-2">
                                    <img src="/logo.png" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/40x40/f97316/ffffff?text=C' }} alt="Logo CoderChamps" className="h-8 w-8 rounded-lg" />
                                    <span className="text-xl font-bold text-white">CoderChamps</span>
                                </Link>
                                <p className="text-sm mt-2">Platform Belajar Masa Depan.</p>
                            </div>
                            <div className="flex space-x-6">
                                <a href="#" className="hover:text-white"><Twitter /></a>
                                <a href="#" className="hover:text-white"><Instagram /></a>
                                <a href="#" className="hover:text-white"><Facebook /></a>
                            </div>
                        </div>
                        <div className="border-t border-slate-700 mt-8 pt-6 text-center text-sm">
                            <p>&copy; {new Date().getFullYear()} CoderChamps. Semua Hak Cipta Dilindungi.</p>
                        </div>
                    </div>
                </footer>
            </div>
            {/* CSS untuk Animasi (bisa dipindahkan ke file CSS global) */}
            <style jsx global>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-on-scroll {
                    opacity: 0;
                }
                .is-visible {
                    animation: fadeInUp 0.8s ease-out forwards;
                }
            `}</style>
        </>
    );
}





