import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

// FIX: Import gambar dari folder src/assets/
import ularBg from '../assets/ular.svg';
import tanggaBg from '../assets/tanggalurus.svg';
import tanggamiringBg from '../assets/tanggamiring.svg';

// --- SVG Icons ---
const UserIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>);
const GamepadIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 mb-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>);
const CopyIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>);
const CheckIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>);
const PlayerWaitIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
const QuestionIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>);
const CloseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const TeacherIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22h20"/><path d="M12 2v20"/><path d="M4 14h16"/><path d="M4 6h16"/><path d="M9 22v-8h6v8"/><circle cx="12" cy="10" r="2"/></svg>);
const WarningIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>);

const defaultPlayers = [
    { id: 1, name: "Player 1", color: "red", position: 0, score: 0 },
    { id: 2, name: "Player 2", color: "blue", position: 0, score: 0 },
    { id: 3, name: "Player 3", color: "green", position: 0, score: 0 },
    { id: 4, name: "Player 4", color: "yellow", position: 0, score: 0 }
];

function Lobby() {
    const [playerName, setPlayerName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [gameData, setGameData] = useState(null);
    const [copied, setCopied] = useState(false);
    const [currentPlayerId, setCurrentPlayerId] = useState(null);

    const [isGuru, setIsGuru] = useState(false);
    const [showRules, setShowRules] = useState(false);

    // FIX: Tambah State khusus buat Modal Keluar Lobi
    const [showExitModal, setShowExitModal] = useState(false);

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
                const storedId = localStorage.getItem(savedGameKey);
                const playerId = storedId === 'host' ? 'host' : Number(storedId);

                const { data, error } = await supabase.from('games').select('*').eq('id', gameId).single();

                if (data && !data.finished) {
                    if (data.phase === 'waiting') {
                        setCurrentPlayerId(playerId);
                        setGameData(data);
                    } else {
                        navigate(`/game/${data.id}`);
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

    useEffect(() => {
        if (!gameData?.id) return;

        const channel = supabase.channel(`vocaclimb_lobby_${gameData.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'games',
                filter: `id=eq.${gameData.id.toString()}`
            }, (payload) => {
                if (payload.new.finished) {
                    alert("Seseorang telah membatalkan lobi permainan ini!");
                    const keys = Object.keys(localStorage);
                    keys.forEach(key => {
                        if (key.startsWith('tanggapoly_player_id_') || key.startsWith('tanggapoly_is_creator_')) {
                            localStorage.removeItem(key);
                        }
                    });
                    window.location.reload();
                } else {
                    setGameData(payload.new);
                    if (payload.new.phase === 'quiz' || payload.new.phase === 'dice') {
                        navigate(`/game/${payload.new.id}`);
                    }
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [gameData?.id, navigate]);

    const handleCreateGame = async () => {
        if (!isGuru && !playerName.trim()) { setError('Namamu belum diisi!'); return; }
        setLoading(true); setError('');

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const initialPlayers = isGuru ? [] : [{ ...defaultPlayers[0], name: playerName }];

        const { data, error } = await supabase.from('games').insert([{
            players: initialPlayers,
            join_code: code,
            turn: 0,
            phase: 'waiting',
            diceRoll: [1, 1],
            finished: false,
            is_rolling: false
        }]).select().single();

        setLoading(false);
        if (error) { setError('Gagal membuat permainan, coba lagi ya!'); }
        else {
            const roleId = isGuru ? 'host' : 1;
            localStorage.setItem(`tanggapoly_player_id_${data.id}`, roleId.toString());
            localStorage.setItem(`tanggapoly_is_creator_${data.id}`, "true");
            setCurrentPlayerId(roleId);
            setGameData(data);
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

        setLoading(false);
        if (updateError) { setError('Gagal bergabung ke permainan, coba lagi ya!'); }
        else {
            localStorage.setItem(`tanggapoly_player_id_${game.id}`, newPlayerId.toString());
            localStorage.setItem(`tanggapoly_is_creator_${game.id}`, "false");
            setCurrentPlayerId(newPlayerId);
            setGameData({ ...game, players: updatedPlayers });
        }
    };

    const handleStartGame = async () => {
        if (gameData.players.length < 2) { setError('Tunggu minimal 2 peserta ya!'); return; }
        setLoading(true);
        await supabase.from('games').update({ phase: 'quiz' }).eq('id', gameData.id);
        setLoading(false);
    };

    // FIX: Fungsi cuma buat nampilin Modal customnya
    const promptQuitLobby = () => {
        setShowExitModal(true);
    }

    // FIX: Fungsi Asli buat Eksekusi Keluar dari Database
    const executeQuitLobby = async () => {
        setShowExitModal(false);
        setLoading(true);
        if (gameData?.id) {
            await supabase.from('games').update({ finished: true, phase: 'cancelled' }).eq('id', gameData.id);
        }
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('tanggapoly_player_id_') || key.startsWith('tanggapoly_is_creator_')) {
                localStorage.removeItem(key);
            }
        });
        window.location.reload();
    }

    const handleLogoutGuru = () => {
        localStorage.removeItem('is_guru_logged_in');
        setIsGuru(false);
    };

    const renderWaitingLobby = () => {
        const isReadyToStart = gameData.players.length >= 2;
        const isHost = currentPlayerId === 'host' || localStorage.getItem(`tanggapoly_is_creator_${gameData.id}`) === 'true';

        return (
            <div className="bg-[#2a3038] p-8 rounded-3xl shadow-2xl w-full max-w-md mx-auto mt-12 text-center animate-fade-in border border-gray-700 relative z-20">
                {/* FIX: Tombol X sekarang manggil promptQuitLobby, bukan bawaan windows */}
                <button onClick={promptQuitLobby} className="absolute top-4 right-4 text-gray-500 hover:text-red-400 p-2 transition-colors" title="Batalkan Lobi">
                    <CloseIcon />
                </button>

                <h2 className="text-2xl font-black mb-4 text-emerald-400 uppercase tracking-widest">Lobi Menunggu</h2>

                {currentPlayerId === 'host' && (
                    <div className="mb-4 bg-emerald-500/20 text-emerald-400 text-xs font-bold py-1.5 px-4 rounded-full inline-block border border-emerald-500/30">
                        Anda bertindak sebagai PENGAWAS
                    </div>
                )}

                <div className="flex flex-col items-center justify-center gap-2 bg-[#1e2329] rounded-2xl p-5 mb-8 border border-gray-700">
                    <p className="text-sm font-extrabold text-gray-400 uppercase">Kode Permainan</p>
                    <div className="flex items-center gap-4">
                        <span className="font-mono text-5xl font-black tracking-[0.2em] text-white">{gameData.join_code}</span>
                        <button onClick={() => { navigator.clipboard.writeText(gameData.join_code); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-3 bg-gray-700/50 hover:bg-gray-600 rounded-xl transition-all active:scale-90">
                            {copied ? <CheckIcon /> : <CopyIcon />}
                        </button>
                    </div>
                </div>

                <div className="text-left space-y-3 bg-[#1e2329]/50 p-5 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-black text-gray-300 uppercase text-sm tracking-widest">Pemain Bergabung</h3>
                        <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-extrabold">{gameData.players.length} / 4 Maks</span>
                    </div>
                    {gameData.players.map(p => (
                        <div key={p.id} className="bg-[#2a3038] p-3 rounded-xl flex items-center gap-3 border border-gray-700 shadow-sm">
                            <div className={`p-2 rounded-lg ${p.id === 1 ? 'bg-red-500/20 text-red-400' : p.id === 2 ? 'bg-blue-500/20 text-blue-400' : p.id === 3 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                <PlayerWaitIcon />
                            </div>
                            <span className="font-extrabold text-white text-lg">{p.name}</span>
                        </div>
                    ))}
                    {gameData.players.length === 0 && (
                        <p className="text-center text-gray-500 text-sm font-bold italic py-2">Belum ada murid yang bergabung...</p>
                    )}
                </div>

                <div className="mt-8">
                    {isHost ? (
                        <button onClick={handleStartGame} disabled={!isReadyToStart || loading} className={`w-full py-4 rounded-xl font-black text-lg transition-all shadow-lg active:scale-95 ${isReadyToStart ? 'bg-emerald-500 hover:bg-emerald-400 text-white' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}>
                            {loading ? 'M E M P R O S E S...' : (isReadyToStart ? 'M U L A I   G A M E' : `BUTUH ${2 - gameData.players.length} ORANG LAGI...`)}
                        </button>
                    ) : (
                        <div className="w-full py-4 bg-gray-700/50 rounded-xl font-extrabold text-gray-400 animate-pulse border border-gray-600">
                            {isReadyToStart ? 'Menunggu Host memulai...' : `Butuh minimal ${2 - gameData.players.length} orang lagi...`}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading && !gameData) {
        return <div className="min-h-screen bg-[#1e2329] flex items-center justify-center text-white font-black text-xl animate-pulse">Menyiapkan Lobi...</div>
    }

    return (
        <main className="min-h-screen bg-[#1e2329] text-white flex flex-col relative overflow-hidden">

            {/* --- DEKORASI BACKGROUND ULAR TANGGA --- */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <img src={tanggaBg} alt="" className="absolute left-[3%] top-[5%] h-[45%] w-auto opacity-[0.06] grayscale mix-blend-overlay object-contain" />
                <img src={tanggaBg} alt="" className="absolute left-[11%] top-[5%] h-[45%] w-auto opacity-[0.06] grayscale mix-blend-overlay object-contain" />
                <img src={ularBg} alt="" className="absolute -right-[2%] top-[-5%] w-[35%] max-w-[350px] opacity-[0.06] grayscale rotate-[-20deg] mix-blend-overlay object-contain rotate-6" />
                <img src={ularBg} alt="" className="absolute -left-[1%] bottom-[-15%] w-[40%] max-w-[400px] opacity-[0.06] rotate-[-25deg] grayscale mix-blend-overlay object-contain -rotate-6" />
                <img src={tanggamiringBg} alt="" className="absolute right-[-3%] -bottom-[7%] h-[60%] w-auto opacity-[0.06] grayscale mix-blend-overlay object-contain" />
                <img src="/assets/semangka.svg" alt="Alpukat" className="absolute -left-[3%] bottom-[15%] h-[15%] w-auto opacity-[0.06] rotate-[-25deg] grayscale mix-blend-overlay object-contain"/>
                <img src="/assets/stroberi.svg" alt="stroberi" className="absolute -left-[1%] bottom-[6%] h-[10%] w-auto opacity-[0.06] rotate-[45deg] grayscale mix-blend-overlay object-contain"/>
                <img src="/assets/pisang.svg" alt="Pisang" className="absolute -left-[1%] bottom-[-4%] h-[15%] w-auto opacity-[0.06] grayscale mix-blend-overlay object-contain"/>
            </div>

            <header className="w-full bg-[#2a3038] py-3 px-8 flex justify-between items-center shadow-md z-20 border-b border-gray-700 relative">
                <h1 className="text-2xl font-black tracking-tighter text-white">VOCA<span className="text-emerald-500">CLIMB</span></h1>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowRules(true)}
                        className="text-gray-400 hover:text-emerald-400 flex items-center gap-1.5 font-bold text-xs md:text-sm mr-2 transition-colors"
                    >
                        <QuestionIcon /> <span className="hidden sm:inline">CARA MAIN</span>
                    </button>

                    {isGuru ? (
                        <>
                            <button
                                onClick={() => navigate('/bank-soal')}
                                className="bg-[#187bb0] hover:bg-[#13618c] text-white px-5 py-2 rounded-full font-extrabold text-sm transition-all shadow-md active:scale-95 tracking-wide hidden sm:block"
                            >
                                BANK SOAL
                            </button>
                            <button
                                onClick={handleLogoutGuru}
                                className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-full font-extrabold text-sm transition-all shadow-md active:scale-95 tracking-wide"
                            >
                                KELUAR
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-[#2ea05b] hover:bg-[#258249] text-white px-5 py-2 rounded-full font-extrabold text-sm transition-all shadow-md active:scale-95 tracking-wide"
                        >
                            PORTAL GURU
                        </button>
                    )}
                </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-4 z-10 relative">

                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>

                <div className="w-full max-w-2xl text-center relative z-20 flex flex-col items-center justify-center gap-12">
                    {error && (
                        <div className="bg-red-500/10 text-red-400 p-4 mb-6 rounded-xl border border-red-500/50 font-extrabold animate-shake w-full max-w-md mx-auto">
                            {error}
                        </div>
                    )}

                    {gameData ? (
                        <div className="flex items-center justify-center gap-12 w-full">
                            {renderWaitingLobby()}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-6 animate-fade-in mt-4">

                            {isGuru ? (
                                <div className="flex flex-col items-center w-full max-w-lg mx-auto">
                                    <div className="bg-[#187bb0]/10 border-2 border-[#187bb0]/30 p-6 md:p-8 rounded-3xl text-center w-full shadow-lg mb-8 backdrop-blur-md">

                                        <h3 className="text-xl md:text-2xl font-black text-[#187bb0] mb-3 uppercase tracking-widest">Guru</h3>
                                        <p className="text-gray-300 font-medium leading-relaxed text-sm md:text-base">
                                            Anda bertugas sebagai <span className="text-white font-bold">Pembuat Ruang Permainan</span>. Anda dapat memulai game dan memantau siswa, namun tidak akan menjadi pion di dalam papan.
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleCreateGame}
                                        disabled={loading}
                                        className="w-full h-[100px] bg-[#2ea05b] hover:bg-[#258249] rounded-2xl flex flex-col items-center justify-center transition-all hover:-translate-y-1 shadow-xl active:scale-95 disabled:opacity-50 group border border-[#40b870]"
                                    >
                                        <span className="font-black text-2xl text-white group-hover:scale-105 transition-transform uppercase tracking-widest">Buka Ruang Kelas</span>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="relative w-full max-w-[420px]">
                                        {playerName === '' && (
                                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none opacity-50 transition-opacity">
                                                <UserIcon />
                                            </div>
                                        )}
                                        <input
                                            type="text"
                                            value={playerName}
                                            onChange={(e) => setPlayerName(e.target.value)}
                                            placeholder="Masukkan Nama Kamu Disini"
                                            className="w-full px-6 py-4 bg-white text-gray-800 rounded-[1.2rem] font-extrabold text-lg outline-none ring-4 ring-[#2ea05b] transition-all shadow-lg text-center placeholder:font-bold placeholder:text-gray-400 relative z-10"
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row w-full max-w-2xl gap-5 mt-4 relative z-10">
                                        <button
                                            onClick={handleCreateGame}
                                            disabled={loading}
                                            className="flex-1 h-[200px] bg-[#2ea05b] hover:bg-[#258249] rounded-2xl flex flex-col items-center justify-center transition-all hover:-translate-y-1 shadow-lg active:scale-95 disabled:opacity-50 group border border-[#40b870] relative overflow-hidden"
                                        >
                                            <GamepadIcon />
                                            <span className="font-black text-2xl mt-1 text-white group-hover:scale-105 transition-transform">Buat Game Baru</span>
                                        </button>

                                        <div className="flex-1 h-[200px] bg-[#187bb0] rounded-2xl flex flex-col items-center justify-center p-6 shadow-lg border border-[#2b9eda] relative overflow-hidden">
                                            <input
                                                type="text"
                                                value={joinCode}
                                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                                placeholder="KODE"
                                                maxLength={6}
                                                className="bg-[#2a3038] text-white text-center py-2.5 px-6 rounded-full font-black text-lg tracking-[0.2em] outline-none focus:ring-2 focus:ring-white/50 w-40 uppercase placeholder-gray-500 mb-4 transition-all shadow-inner relative z-10"
                                            />
                                            <button
                                                onClick={submitJoinGame}
                                                disabled={loading}
                                                className="w-full flex flex-col items-center justify-center rounded-xl transition-all active:scale-95 group relative z-10"
                                            >
                                                <span className="font-black text-2xl leading-snug text-white group-hover:scale-105 transition-transform">
                                                    {loading ? 'TUNGGU...' : <>Klik untuk<br/>Bergabung</>}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL ATURAN MAIN */}
            {showRules && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#2a3038] w-full max-w-lg rounded-3xl border border-gray-600 shadow-2xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto">

                        <div className="flex items-center justify-between mb-6 border-b border-gray-700 pb-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-500/20 p-3 rounded-full text-emerald-400">
                                    <QuestionIcon />
                                </div>
                                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest">Cara Bermain</h2>
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
                                <h3 className="text-emerald-400 font-bold mb-1">1. Kumpulkan Pasukan 👥</h3>
                                <p className="text-sm">Satu orang membuat game, sisanya bergabung menggunakan KODE unik. Game bisa dimulai jika sudah ada minimal 2 player dan maksimal 4 player!</p>
                            </div>
                            <div className="bg-[#1e2329] p-4 rounded-xl border border-gray-700">
                                <h3 className="text-emerald-400 font-bold mb-1">2. Jawab Kuisnya! 🧠</h3>
                                <p className="text-sm">Saat giliranmu tiba, kamu <span className="text-white font-bold">wajib</span> menjawab pertanyaan kuis terlebih dahulu dengan benar untuk bisa lanjut.</p>
                            </div>
                            <div className="bg-[#1e2329] p-4 rounded-xl border border-gray-700">
                                <h3 className="text-emerald-400 font-bold mb-1">3. Lempar Dadu & Jalan 🎲</h3>
                                <p className="text-sm">Jika jawabanmu benar, tombol LEMPAR akan menyala. Klik untuk melempar dadu dan menggerakkan pionmu maju!</p>
                            </div>
                            <div className="bg-[#1e2329] p-4 rounded-xl border border-gray-700">
                                <h3 className="text-emerald-400 font-bold mb-1">4. Awas Ular & Tangga 🐍🪜</h3>
                                <p className="text-sm">Hati-hati saat melangkah! Tangga akan membawamu naik drastis, sedangkan ular akan menelanmu turun ke bawah.</p>
                            </div>
                            <div className="bg-[#1e2329] p-4 rounded-xl border border-gray-700">
                                <h3 className="text-emerald-400 font-bold mb-1">5. Capai Garis Finish 🏆</h3>
                                <p className="text-sm">Pemain pertama yang berhasil bertahan dan mencapai kotak FINISH adalah sang Juara!</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowRules(false)}
                            className="w-full mt-6 py-3 bg-[#187bb0] hover:bg-[#13618c] text-white font-black text-lg rounded-xl shadow-[0_4px_0_rgb(19,97,140)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest relative z-10"
                        >
                            Saya Mengerti!
                        </button>
                    </div>
                </div>
            )}

            {/* FIX: MODAL CUSTOM UNTUK KELUAR DARI LOBI */}
            {showExitModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
                    <div className="bg-[#2a3038] w-full max-w-md rounded-[2rem] border-4 border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.15)] p-8 text-center flex flex-col items-center">
                        <div className="bg-yellow-500/10 p-4 rounded-full mb-6">
                            <WarningIcon />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Yakin mau membatalkan?</h2>
                        <p className="text-gray-400 font-bold mb-8 text-sm">Lobi ini akan ditutup dan semua temanmu akan dikeluarkan.</p>
                        <div className="flex w-full gap-4">
                            <button onClick={() => setShowExitModal(false)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-black text-lg rounded-xl transition-all">Batal</button>
                            <button onClick={executeQuitLobby} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-lg rounded-xl shadow-[0_4px_0_rgb(153,27,27)] active:translate-y-1 active:shadow-none transition-all">Ya, Keluar</button>
                        </div>
                    </div>
                </div>
            )}

        </main>
    );
}

export default Lobby;