import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

// --- DATA DEFAULT BAWAAN PABRIK (PAS 23 SOAL DARI GAMPANG -> SUSAH) ---
const defaultSoalData = [
    // LEVEL 1: GAMPANG (Kotak Awal)
    { id: 1, soal: "Apa bahasa Inggrisnya apel?", jawaban: "Apple", gambar: "/assets/apel.svg" },
    { id: 2, soal: "Apa bahasa Inggrisnya pisang?", jawaban: "Banana", gambar: "/assets/pisang.svg" },
    { id: 3, soal: "Apa bahasa Inggrisnya jeruk?", jawaban: "Orange", gambar: "/assets/jeruk.svg" },
    { id: 4, soal: "Apa bahasa Inggrisnya mangga?", jawaban: "Mango", gambar: "/assets/mangga.svg" },
    { id: 5, soal: "Apa bahasa Inggrisnya melon?", jawaban: "Melon", gambar: "/assets/melon.svg" },
    { id: 6, soal: "Apa bahasa Inggrisnya semangka?", jawaban: "Watermelon", gambar: "/assets/semangka.svg" },
    { id: 7, soal: "Apa bahasa Inggrisnya stroberi?", jawaban: "Strawberry", gambar: "/assets/stroberi.svg" },
    { id: 8, soal: "Apa bahasa Inggrisnya anggur?", jawaban: "Grape", gambar: "/assets/anggur.svg" },
    // LEVEL 2: SEDANG (Kotak Tengah)
    { id: 9, soal: "Apa bahasa Inggrisnya nanas?", jawaban: "Pineapple", gambar: "/assets/nanas.svg" },
    { id: 10, soal: "Apa bahasa Inggrisnya kelapa?", jawaban: "Coconut", gambar: "/assets/kelapa.svg" },
    { id: 11, soal: "Apa bahasa Inggrisnya pepaya?", jawaban: "Papaya", gambar: "/assets/pepaya.svg" },
    { id: 12, soal: "Apa bahasa Inggrisnya pir?", jawaban: "Pear", gambar: "/assets/pir.svg" },
    { id: 13, soal: "Apa bahasa Inggrisnya kiwi?", jawaban: "Kiwi", gambar: "/assets/kiwi.svg" },
    { id: 14, soal: "Apa bahasa Inggrisnya alpukat?", jawaban: "Avocado", gambar: "/assets/alpukat.svg" },
    { id: 15, soal: "Apa bahasa Inggrisnya ceri?", jawaban: "Cherry", gambar: "/assets/ceri.svg" },
    { id: 16, soal: "Apa bahasa Inggrisnya buah naga?", jawaban: "Dragon fruit", gambar: "/assets/buahnaga.svg" },
    // LEVEL 3: SUSAH / BUAH LOKAL (Kotak Mendekati Finish)
    { id: 17, soal: "Apa bahasa Inggrisnya jambu biji?", jawaban: "Guava", gambar: "/assets/jambu biji.svg" },
    { id: 18, soal: "Apa bahasa Inggrisnya jambu air?", jawaban: "Water apple", gambar: "/assets/jambuair.svg" },
    { id: 19, soal: "Apa bahasa Inggrisnya leci?", jawaban: "Lychee", gambar: "/assets/leci.svg" },
    { id: 20, soal: "Apa bahasa Inggrisnya manggis?", jawaban: "Mangosteen", gambar: "/assets/manggis.svg" },
    { id: 21, soal: "Apa bahasa Inggrisnya nangka?", jawaban: "Jackfruit", gambar: "/assets/nangka.svg" },
    { id: 22, soal: "Apa bahasa Inggrisnya rambutan?", jawaban: "Rambutan", gambar: "/assets/rambutan.svg" },
    { id: 23, soal: "Apa bahasa Inggrisnya salak?", jawaban: "Snake fruit", gambar: "/assets/salak.svg" }
];

// --- SVG Icons ---
const BackIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>);
const EditIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>);
const TrashIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
const ResetIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>);
const WarningIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>);

function BankSoal() {
    const navigate = useNavigate();
    const [soalList, setSoalList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ soal: '', jawaban: '', gambar: '' });

    const [uploadFile, setUploadFile] = useState(null);

    // State untuk modal konfirmasi reset
    const [showResetModal, setShowResetModal] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('is_guru_logged_in') !== 'true') {
            navigate('/');
        } else {
            fetchSoals();
        }
    }, [navigate]);

    const fetchSoals = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('bank_soal').select('*').order('id', { ascending: true });

        if (error) {
            console.error("Gagal narik data:", error);
            alert("Gagal memuat bank soal!");
        } else {
            setSoalList(data || []);
        }
        setLoading(false);
    };

    const promptResetDefault = () => {
        setShowResetModal(true);
    };

    const executeResetDefault = async () => {
        setShowResetModal(false);
        setLoading(true);

        // 1. Timpa/Insert data 1-23
        const { error } = await supabase.from('bank_soal').upsert(defaultSoalData);

        if (error) {
            alert("Gagal mereset soal ke default!");
            console.error(error);
            setLoading(false);
        } else {
            // 2. Sapu bersih sisa data kalo sempet ada yg nyampe 24, 25 dst
            await supabase.from('bank_soal').delete().gt('id', 23);
            fetchSoals();
        }
    };

    const openForm = (item) => {
        setEditId(item.id);
        setFormData({ soal: item.soal, jawaban: item.jawaban, gambar: item.gambar || '' });
        setUploadFile(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditId(null);
        setFormData({ soal: '', jawaban: '', gambar: '' });
        setUploadFile(null);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);

        let finalImageUrl = formData.gambar;

        if (uploadFile) {
            const fileExt = uploadFile.name.split('.').pop();
            const fileName = `soal-${editId}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('gambar-soal')
                .upload(fileName, uploadFile);

            if (uploadError) {
                alert("Gagal mengunggah gambar ke server!");
                console.error(uploadError);
                setLoading(false);
                return;
            }

            const { data: publicUrlData } = supabase.storage.from('gambar-soal').getPublicUrl(fileName);
            finalImageUrl = publicUrlData.publicUrl;
        }

        const dataToSave = {
            soal: formData.soal,
            jawaban: formData.jawaban,
            gambar: finalImageUrl
        };

        const { error } = await supabase.from('bank_soal').update(dataToSave).eq('id', editId);

        if (error) {
            alert("Gagal menyimpan perubahan!");
        }

        closeModal();
        fetchSoals();
    };

    return (
        // FIX: Menggunakan h-screen agar layar tidak melar dan overflow ditangani oleh div pembungkus list
        <main className="h-screen bg-[#1e2329] text-white flex flex-col relative overflow-hidden">

            {/* FIX: Z-Index diubah ke 50 biar header selalu ada di atas saat di scroll */}
            <header className="w-full bg-[#2a3038] py-4 px-8 flex items-center shadow-md z-50 border-b border-gray-700 gap-4 relative">
                <button onClick={() => navigate('/')} className="text-gray-400 hover:text-emerald-400 transition-colors">
                    <BackIcon />
                </button>
                <h1 className="text-2xl font-black tracking-tighter text-white">BANK <span className="text-emerald-500">SOAL</span></h1>

                <button
                    onClick={promptResetDefault}
                    disabled={loading}
                    className="ml-auto bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-5 py-2.5 rounded-full font-black text-xs md:text-sm transition-all shadow-md active:scale-95 flex items-center gap-2 border border-red-500/30 hover:border-red-600 disabled:opacity-50"
                >
                    <ResetIcon /> {loading ? 'MEMPROSES...' : 'RESET DEFAULT'}
                </button>
            </header>

            {/* Area List Soal dengan Scroll Independen */}
            <div className="flex-1 p-8 overflow-y-auto z-10 relative">
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    {loading ? (
                        <div className="text-center py-20 font-black text-2xl text-emerald-500 animate-pulse">Memuat Database Soal...</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-20 pt-4">
                            {soalList.map((item) => (
                                <div key={item.id} className="relative bg-[#2a3038] rounded-2xl p-4 border border-gray-700 shadow-lg flex flex-col group hover:border-[#187bb0] transition-all">

                                    <div className="absolute -top-3 -left-3 bg-[#187bb0] w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-4 border-[#1e2329] z-10 shadow-lg text-white">
                                        {item.id}
                                    </div>

                                    {item.gambar && (
                                        <div className="bg-white/5 rounded-xl h-28 mb-4 mt-2 flex items-center justify-center overflow-hidden border border-white/5 p-4">
                                            <img
                                                src={item.gambar}
                                                alt="Soal"
                                                className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform"
                                                onError={(e) => { e.target.src = "https://via.placeholder.com/100?text=No+Image" }}
                                            />
                                        </div>
                                    )}

                                    <div className="text-center mb-4 flex-1 flex flex-col justify-center">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">PERTANYAAN</p>
                                        <h3 className="font-black text-base md:text-lg leading-tight text-white mb-3">{item.soal}</h3>
                                        <p className="font-bold text-emerald-400 bg-emerald-400/10 py-1.5 px-3 rounded-lg inline-block self-center border border-emerald-400/20 text-sm">Jawaban: {item.jawaban}</p>
                                    </div>

                                    <div className="mt-auto pt-3 border-t border-gray-700/50">
                                        <button onClick={() => openForm(item)} className="w-full bg-[#187bb0] hover:bg-[#13618c] text-white font-bold py-2.5 rounded-xl flex justify-center items-center gap-2 transition-colors active:scale-95 shadow-md">
                                            <EditIcon /> UBAH SOAL
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL UBAH SOAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#2a3038] w-full max-w-md rounded-3xl border border-gray-600 shadow-2xl p-8 relative max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-widest">Ubah Soal Kotak {editId}</h2>

                        <form onSubmit={handleSave} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-1 ml-1">Pertanyaan / Soal</label>
                                <textarea required value={formData.soal} onChange={(e) => setFormData({...formData, soal: e.target.value})} className="w-full bg-[#1e2329] border border-gray-600 rounded-xl px-4 py-3 font-bold text-white outline-none focus:border-[#187bb0] transition-colors resize-none h-24" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-1 ml-1">Kunci Jawaban</label>
                                <input type="text" required value={formData.jawaban} onChange={(e) => setFormData({...formData, jawaban: e.target.value})} className="w-full bg-[#1e2329] border border-gray-600 rounded-xl px-4 py-3 font-bold text-white outline-none focus:border-[#187bb0] transition-colors" />
                            </div>

                            <div className="bg-[#1e2329] p-4 rounded-xl border border-gray-600 mt-2">
                                <label className="block text-sm font-bold text-emerald-400 mb-3 border-b border-gray-700 pb-2">GAMBAR SOAL (Opsional)</label>

                                {formData.gambar && !uploadFile && (
                                    <div className="mb-4 flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
                                        <img src={formData.gambar} alt="Preview Lama" className="w-10 h-10 object-contain drop-shadow-md" onError={(e) => { e.target.style.display = 'none' }} />
                                        <div className="flex flex-col flex-1">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Gambar Saat Ini</span>
                                            <span className="text-xs text-gray-300 truncate w-32">Tersimpan di sistem</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({...formData, gambar: ''})}
                                            className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white p-2.5 rounded-lg transition-colors"
                                            title="Hapus Gambar"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                )}

                                <div className="mb-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setUploadFile(e.target.files[0])}
                                        className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#187bb0] file:text-white hover:file:bg-[#13618c] transition-all cursor-pointer bg-white/5 rounded-xl border border-dashed border-gray-500"
                                    />
                                    {uploadFile && (
                                        <div className="flex items-center justify-between mt-3 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                                            <p className="text-xs text-emerald-400 font-bold flex items-center gap-1"><span>✔️</span> {uploadFile.name}</p>
                                            <button
                                                type="button"
                                                onClick={() => setUploadFile(null)}
                                                className="text-red-400 hover:text-red-300 p-1"
                                                title="Batal Upload"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-500 italic mt-3">*Hapus gambar jika soal hanya berupa teks.</p>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button type="button" onClick={closeModal} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors">BATAL</button>
                                <button type="submit" disabled={loading} className="flex-[2] bg-[#187bb0] hover:bg-[#13618c] text-white font-black py-3 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-lg">
                                    {loading ? (
                                        <span className="animate-pulse">MENYIMPAN...</span>
                                    ) : 'SIMPAN PERUBAHAN'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CUSTOM UNTUK RESET DEFAULT */}
            {showResetModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
                    <div className="bg-[#2a3038] w-full max-w-md rounded-[2rem] border-4 border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.15)] p-8 text-center flex flex-col items-center">
                        <div className="bg-yellow-500/10 p-4 rounded-full mb-6">
                            <WarningIcon />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Yakin mau mereset?</h2>
                        <p className="text-gray-400 font-bold mb-8 text-sm">Semua soal akan kembali ke kosa kata awal bawaan pabrik. Semua soal yang sudah kamu ubah akan hilang!</p>
                        <div className="flex w-full gap-4">
                            <button onClick={() => setShowResetModal(false)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-black text-lg rounded-xl transition-all">Batal</button>
                            <button onClick={executeResetDefault} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-lg rounded-xl shadow-[0_4px_0_rgb(153,27,27)] active:translate-y-1 active:shadow-none transition-all">Ya, Reset!</button>
                        </div>
                    </div>
                </div>
            )}

        </main>
    );
}

export default BankSoal;