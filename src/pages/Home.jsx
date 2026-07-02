import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

import ularBg from '../assets/ular.svg';
import tanggaBg from '../assets/tanggalurus.svg';
import tanggamiringBg from '../assets/tanggamiring.svg';

const UserIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>);
const GamepadIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 mb-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>);
const QuestionIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>);
const CloseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);

const defaultPlayers = [
    { id: 1, name: "Player 1", color: "red", position: 0, score: 0 },
    { id: 2, name: "Player 2", color: "blue", position: 0, score: 0 },
    { id: 3, name: "Player 3", color: "green", position: 0, score: 0 },
    { id: 4, name: "Player 4", color: "yellow", position: 0, score: 0 }
];

function Home() {
    const [playerName, setPlayerName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isGuru, setIsGuru] = useState(false);
    const [showRules, setShowRules] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (localStorage.getItem('is_guru_logged_in') === 'true') {
            setIsGuru(true);
        }

        const checkExistingGame = async () => {
            const keys = Object.keys(localStorage);
            const savedGameKey = keys.find(key => key.startsWith('tanggapoly_player_id_'));

            if (savedGameKey) {
                const gameId = savedGameKey.split('_')[3];
                const { data, error } = await supabase.from('games').select('*').eq('id', gameId).single();

                if (data && !data.finished) {
                    if (data.phase === 'waiting') {
                        navigate(`/lobby/${data.id}`); // Langsung lempar ke lobby
                    } else {
                        navigate(`/game/${data.id}`); // Langsung lempar ke game
                    }
                } else {
                    localStorage.removeItem(savedGameKey);
                    localStorage.removeItem(`tanggapoly_is_creator_${gameId}`);
                }
            }
            setLoading(false);
        };

        checkExistingGame();
    }, [navigate]);

    const handleCreateGame = async () => {
        if (!isGuru && !playerName.trim()) { setError('Namamu belum diisi!'); return; }
        setLoading(true); setError('');

        try {
            let currentHostId = null;
            const { data: userData, error: userError } = await supabase
                .from('users')
                .insert([{
                    username: isGuru ? 'Guru Pengawas' : playerName,
                    role: isGuru ? 'guru' : 'siswa'
                }])
                .select()
                .single();

            if (userError) throw new Error('Gagal membuat data user di database!');
            currentHostId = userData.id_user;

            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const initialPlayers = isGuru ? [] : [{ ...defaultPlayers[0], name: playerName }];

            const { data, error } = await supabase.from('games').insert([{
                players: initialPlayers,
                join_code: code,
                turn: 0,
                phase: 'waiting',
                diceRoll: [1, 1],
                finished: false,
                is_rolling: false,
                host_id: currentHostId
            }]).select().single();

            if (error) throw error;

            const roleId = isGuru ? 'host' : 1;
            localStorage.setItem(`tanggapoly_player_id_${data.id}`, roleId.toString());
            localStorage.setItem(`tanggapoly_is_creator_${data.id}`, "true");

            navigate(`/lobby/${data.id}`); // Lempar ke halaman lobby

        } catch (err) {
            console.error(err);
            setError('Gagal membuat permainan, coba lagi ya le!');
            setLoading(false);
        }
    };

    const submitJoinGame = async () => {
        if (!playerName.trim()) { setError('Tulis namamu dulu ya sebelum bergabung!'); return; }
        if (!joinCode.trim()) { setError('Masukkan kode permainannya dulu ya!'); return; }
        setLoading(true); setError('');

        const { data: game, error: fetchError } = await supabase.from('games').select('*').eq('join_code', joinCode.trim()).single();

        if (fetchError || !game) { setLoading(false); setError('Kodenya tidak ditemukan. Coba cek lagi!'); return; }
        if (game.players.length >= 4) { setLoading(false); setError('Yah, permainannya sudah penuh maksimal 4 orang!'); return; }

        const newPlayerId = game.players.length + 1;
        const newPlayer = { ...defaultPlayers.find(p => p.id === newPlayerId), name: playerName };
        const updatedPlayers = [...game.players, newPlayer];

        const { error: updateError } = await supabase.from('games').update({ players: updatedPlayers }).eq('id', game.id);

        if (updateError) {
            setLoading(false);
            setError('Gagal bergabung ke permainan, coba lagi ya!');
        } else {
            localStorage.setItem(`tanggapoly_player_id_${game.id}`, newPlayerId.toString());
            localStorage.setItem(`tanggapoly_is_creator_${game.id}`, "false");
            navigate(`/lobby/${game.id}`); // Lempar ke halaman lobby
        }
    };

    const handleLogoutGuru = () => {
        localStorage.removeItem('is_guru_logged_in');
        setIsGuru(false);
    };

    if (loading) {
        return <div className="min-h-screen bg-[#1e2329] flex items-center justify-center text-white font-black text-xl animate-pulse">Menyiapkan Halaman...</div>
    }

    return (
        <main className="min-h-screen bg-[#1e2329] text-white flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <img src={tanggaBg} alt="" className="absolute left-[3%] top-[5%] h-[45%] w-auto opacity-[0.06] grayscale mix-blend-overlay object-contain" />
                <img src={ularBg} alt="" className="absolute -right-[2%] top-[-5%] w-[35%] max-w-[350px] opacity-[0.06] grayscale rotate-[-20deg] mix-blend-overlay object-contain rotate-6" />
                <img src={tanggamiringBg} alt="" className="absolute right-[-3%] -bottom-[7%] h-[60%] w-auto opacity-[0.06] grayscale mix-blend-overlay object-contain" />
                <img src="/assets/semangka.svg" alt="" className="absolute -left-[3%] bottom-[15%] h-[15%] w-auto opacity-[0.06] rotate-[-25deg] grayscale mix-blend-overlay object-contain" />
            </div>

            <header className="w-full bg-[#2a3038] py-3 px-8 flex justify-between items-center shadow-md z-20 border-b border-gray-700 relative">
                <h1 className="text-2xl font-black tracking-tighter text-white">VOCA<span className="text-emerald-500">CLIMB</span></h1>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowRules(true)} className="text-gray-400 hover:text-emerald-400 flex items-center gap-1.5 font-bold text-xs md:text-sm mr-2 transition-colors">
                        <QuestionIcon /> <span className="hidden sm:inline">CARA MAIN</span>
                    </button>
                    {isGuru ? (
                        <>
                            <button onClick={() => navigate('/bank-soal')} className="bg-[#187bb0] hover:bg-[#13618c] text-white px-5 py-2 rounded-full font-extrabold text-sm transition-all shadow-md active:scale-95 tracking-wide hidden sm:block">BANK SOAL</button>
                            <button onClick={handleLogoutGuru} className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-full font-extrabold text-sm transition-all shadow-md active:scale-95 tracking-wide">KELUAR</button>
                        </>
                    ) : (
                        <button onClick={() => navigate('/login')} className="bg-[#2ea05b] hover:bg-[#258249] text-white px-5 py-2 rounded-full font-extrabold text-sm transition-all shadow-md active:scale-95 tracking-wide">PORTAL GURU</button>
                    )}
                </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-4 z-10 relative">
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>

                <div className="w-full max-w-2xl text-center relative z-20 flex flex-col items-center justify-center gap-12">
                    {error && (
                        <div className="bg-red-500/10 text-red-400 p-4 mb-6 rounded-xl border border-red-500/50 font-extrabold animate-shake w-full max-w-md mx-auto">{error}</div>
                    )}
                    <div className="flex flex-col items-center gap-6 animate-fade-in mt-4">
                        {isGuru ? (
                            <div className="flex flex-col items-center w-full max-w-lg mx-auto">
                                <div className="bg-[#187bb0]/10 border-2 border-[#187bb0]/30 p-6 md:p-8 rounded-3xl text-center w-full shadow-lg mb-8 backdrop-blur-md">
                                    <h3 className="text-xl md:text-2xl font-black text-[#187bb0] mb-3 uppercase tracking-widest">Guru</h3>
                                    <p className="text-gray-300 font-medium leading-relaxed text-sm md:text-base">Anda bertugas sebagai <span className="text-white font-bold">Pembuat Ruang Permainan</span>. Anda dapat memulai game dan memantau siswa, namun tidak akan menjadi pion di dalam papan.</p>
                                </div>
                                <button onClick={handleCreateGame} disabled={loading} className="w-full h-[100px] bg-[#2ea05b] hover:bg-[#258249] rounded-2xl flex flex-col items-center justify-center transition-all hover:-translate-y-1 shadow-xl active:scale-95 disabled:opacity-50 group border border-[#40b870]">
                                    <span className="font-black text-2xl text-white group-hover:scale-105 transition-transform uppercase tracking-widest">Buka Ruang Kelas</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="relative w-full max-w-[420px]">
                                    {playerName === '' && (
                                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none opacity-50 transition-opacity"><UserIcon /></div>
                                    )}
                                    <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Masukkan Nama Kamu Disini" className="w-full px-6 py-4 bg-white text-gray-800 rounded-[1.2rem] font-extrabold text-lg outline-none ring-4 ring-[#2ea05b] transition-all shadow-lg text-center placeholder:font-bold placeholder:text-gray-400 relative z-10" />
                                </div>
                                <div className="flex flex-col sm:flex-row w-full max-w-2xl gap-5 mt-4 relative z-10">
                                    <button onClick={handleCreateGame} disabled={loading} className="flex-1 h-[200px] bg-[#2ea05b] hover:bg-[#258249] rounded-2xl flex flex-col items-center justify-center transition-all hover:-translate-y-1 shadow-lg active:scale-95 disabled:opacity-50 group border border-[#40b870] relative overflow-hidden">
                                        <GamepadIcon />
                                        <span className="font-black text-2xl mt-1 text-white group-hover:scale-105 transition-transform">Mulai Game Baru</span>
                                    </button>
                                    <div className="flex-1 h-[200px] bg-[#187bb0] rounded-2xl flex flex-col items-center justify-center p-6 shadow-lg border border-[#2b9eda] relative overflow-hidden">
                                        <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="KODE" maxLength={6} className="bg-[#2a3038] text-white text-center py-2.5 px-6 rounded-full font-black text-lg tracking-[0.2em] outline-none focus:ring-2 focus:ring-white/50 w-40 uppercase placeholder-gray-500 mb-4 transition-all shadow-inner relative z-10" />
                                        <button onClick={submitJoinGame} disabled={loading} className="w-full flex flex-col items-center justify-center rounded-xl transition-all active:scale-95 group relative z-10">
                                            <span className="font-black text-2xl leading-snug text-white group-hover:scale-105 transition-transform">{loading ? 'TUNGGU...' : <>Klik untuk<br />Bergabung</>}</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {showRules && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#2a3038] w-full max-w-lg rounded-3xl border border-gray-600 shadow-2xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6 border-b border-gray-700 pb-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-500/20 p-3 rounded-full text-emerald-400">
                                    <QuestionIcon />
                                </div>
                                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest">
                                    Cara Bermain
                                </h2>
                            </div>

                            <button
                                onClick={() => setShowRules(false)}
                                className="text-gray-400 hover:text-red-400 bg-gray-700/30 hover:bg-red-500/20 p-2.5 rounded-xl transition-all"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="space-y-4 text-left text-gray-300 font-medium relative z-10">

                            <div className="bg-[#1e2329] p-4 rounded-xl border border-gray-700">
                                <h3 className="text-emerald-400 font-bold mb-1">
                                    1. Bergabung ke Permainan 👥
                                </h3>
                                <p className="text-sm">
                                    Salah satu pemain membuat permainan, kemudian pemain lainnya
                                    bergabung menggunakan <span className="text-white font-bold">kode permainan</span>.
                                    Permainan dapat dimulai jika terdapat minimal
                                    <span className="text-white font-bold"> 2 pemain</span> dan maksimal
                                    <span className="text-white font-bold"> 4 pemain</span>.
                                </p>
                            </div>

                            <div className="bg-[#1e2329] p-4 rounded-xl border border-gray-700">
                                <h3 className="text-emerald-400 font-bold mb-1">
                                    2. Jawab Pertanyaan 🧠
                                </h3>
                                <p className="text-sm">
                                    Pada setiap giliran, pemain akan diberikan satu pertanyaan
                                    kosakata. Jawaban yang benar memberikan kesempatan untuk
                                    melanjutkan permainan.
                                </p>
                            </div>

                            <div className="bg-[#1e2329] p-4 rounded-xl border border-gray-700">
                                <h3 className="text-emerald-400 font-bold mb-1">
                                    3. Lempar Dadu 🎲
                                </h3>
                                <p className="text-sm">
                                    Jika jawaban
                                    <span className="text-emerald-400 font-bold"> benar</span>,
                                    pemain dapat melempar dadu dan maju sesuai jumlah mata dadu.
                                    Jika jawaban
                                    <span className="text-red-400 font-bold"> belum benar</span>,
                                    giliran akan berpindah kepada pemain berikutnya.
                                </p>
                            </div>

                            <div className="bg-[#1e2329] p-4 rounded-xl border border-gray-700">
                                <h3 className="text-emerald-400 font-bold mb-1">
                                    4. Perhatikan Ular dan Tangga 🐍🪜
                                </h3>
                                <p className="text-sm">
                                    Jika pemain berhenti pada kotak tangga, pemain akan naik ke
                                    posisi yang lebih tinggi. Sebaliknya, jika berhenti pada kepala
                                    ular, pemain akan turun ke posisi yang telah ditentukan.
                                </p>
                            </div>

                            <div className="bg-[#1e2329] p-4 rounded-xl border border-gray-700">
                                <h3 className="text-emerald-400 font-bold mb-1">
                                    5. Raih Garis Finish 🏆
                                </h3>
                                <p className="text-sm">
                                    Pemain yang pertama mencapai atau melewati kotak
                                    <span className="text-white font-bold"> Finish</span>
                                    akan menjadi pemenang permainan.
                                </p>
                            </div>

                            {/* Informasi Guru */}
                            <div className="bg-[#2d2416] p-4 rounded-xl border border-amber-500/40">
                                <h3 className="text-amber-400 font-bold mb-1">
                                    🔑 Informasi Akses Guru
                                </h3>
                                <p className="text-sm">
                                    Untuk mengakses <span className="text-white font-bold">Menu Guru</span>,
                                    gunakan kata sandi:
                                    <span className="text-amber-300 font-bold"> gurukeren123</span>.
                                    Menu Guru digunakan untuk mengelola soal dan data permainan.
                                </p>
                            </div>

                        </div>

                        <button
                            onClick={() => setShowRules(false)}
                            className="w-full mt-6 py-3 bg-[#187bb0] hover:bg-[#13618c] text-white font-black text-lg rounded-xl shadow-[0_4px_0_rgb(19,97,140)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest relative z-10"
                        >
                            Saya Mengerti
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}

export default Home;