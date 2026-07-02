import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useParams } from 'react-router-dom';

const CopyIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>);
const CheckIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>);
const PlayerWaitIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
const CloseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const WarningIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>);

function Lobby() {
    const { gameId } = useParams(); // Ambil ID game dari URL
    const navigate = useNavigate();

    const [gameData, setGameData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [currentPlayerId, setCurrentPlayerId] = useState(null);
    const [showExitModal, setShowExitModal] = useState(false);

    useEffect(() => {
        const fetchInitialLobby = async () => {
            const savedPlayerId = localStorage.getItem(`tanggapoly_player_id_${gameId}`);
            if (!savedPlayerId) { navigate('/'); return; }

            setCurrentPlayerId(savedPlayerId === 'host' ? 'host' : Number(savedPlayerId));

            const { data, error } = await supabase.from('games').select('*').eq('id', gameId).single();

            if (error || !data || data.finished) {
                navigate('/');
            } else if (data.phase !== 'waiting') {
                navigate(`/game/${gameId}`);
            } else {
                setGameData(data);
            }
            setLoading(false);
        };

        fetchInitialLobby();
    }, [gameId, navigate]);

    useEffect(() => {
        if (!gameId) return;

        const channel = supabase.channel(`vocaclimb_lobby_${gameId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'games',
                filter: `id=eq.${gameId}`
            }, (payload) => {
                if (payload.new.finished) {
                    alert("Seseorang telah membatalkan lobi permainan ini!");
                    localStorage.removeItem(`tanggapoly_player_id_${gameId}`);
                    localStorage.removeItem(`tanggapoly_is_creator_${gameId}`);
                    navigate('/');
                } else {
                    setGameData(payload.new);
                    // Kalau host neken tombol Mulai, lempar semua user di lobi ke halaman game
                    if (payload.new.phase === 'quiz' || payload.new.phase === 'dice') {
                        navigate(`/game/${gameId}`);
                    }
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [gameId, navigate]);

    const handleStartGame = async () => {
        if (gameData.players.length < 2) return;
        setLoading(true);
        await supabase.from('games').update({ phase: 'quiz' }).eq('id', gameId);
    };

    const promptQuitLobby = () => setShowExitModal(true);

    const executeQuitLobby = async () => {
        setShowExitModal(false);
        setLoading(true);
        await supabase.from('games').update({ finished: true, phase: 'cancelled' }).eq('id', gameId);
        localStorage.removeItem(`tanggapoly_player_id_${gameId}`);
        localStorage.removeItem(`tanggapoly_is_creator_${gameId}`);
        navigate('/');
    };

    if (loading || !gameData) {
        return <div className="min-h-screen bg-[#1e2329] flex items-center justify-center text-white font-black text-xl animate-pulse">Menyiapkan Ruang Tunggu...</div>
    }

    const isReadyToStart = gameData.players.length >= 2;
    const isHost = currentPlayerId === 'host' || localStorage.getItem(`tanggapoly_is_creator_${gameId}`) === 'true';
    return (
        <main className="min-h-screen bg-[#1e2329] flex items-center justify-center p-4">
            <div className="bg-[#2a3038] p-5 sm:p-8 rounded-3xl shadow-2xl w-full max-w-md text-center animate-fade-in border border-gray-700 relative z-20">
                <button onClick={promptQuitLobby} className="absolute top-4 right-4 text-gray-500 hover:text-red-400 p-2 transition-colors" title="Batalkan Lobi">
                    <CloseIcon />
                </button>

                <h2 className="text-xl sm:text-2xl font-black mb-4 text-emerald-400 uppercase tracking-widest">Lobi Menunggu</h2>

                {currentPlayerId === 'host' && (
                    <div className="mb-4 bg-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-bold py-1.5 px-4 rounded-full inline-block border border-emerald-500/30">
                        Anda bertindak sebagai PENGAWAS
                    </div>
                )}

                <div className="flex flex-col items-center justify-center gap-2 bg-[#1e2329] rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8 border border-gray-700">
                    <p className="text-xs sm:text-sm font-extrabold text-gray-400 uppercase">Kode Permainan</p>
                    <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
                        <span className="font-mono text-4xl sm:text-5xl font-black tracking-[0.1em] sm:tracking-[0.2em] text-white">{gameData.join_code}</span>
                        <button onClick={() => { navigator.clipboard.writeText(gameData.join_code); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-2 sm:p-3 bg-gray-700/50 hover:bg-gray-600 rounded-xl transition-all active:scale-90">
                            {copied ? <CheckIcon /> : <CopyIcon />}
                        </button>
                    </div>
                </div>

                <div className="text-left space-y-3 bg-[#1e2329]/50 p-4 sm:p-5 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-black text-gray-300 uppercase text-xs sm:text-sm tracking-widest">Pemain Bergabung</h3>
                        <span className="bg-emerald-500/20 text-emerald-400 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-extrabold">{gameData.players.length} / 4 Maks</span>
                    </div>
                    {gameData.players.map(p => (
                        <div key={p.id} className="bg-[#2a3038] p-2.5 sm:p-3 rounded-xl flex items-center gap-3 border border-gray-700 shadow-sm">
                            <div className={`p-1.5 sm:p-2 rounded-lg ${p.id === 1 ? 'bg-red-500/20 text-red-400' : p.id === 2 ? 'bg-blue-500/20 text-blue-400' : p.id === 3 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                <PlayerWaitIcon />
                            </div>
                            <span className="font-extrabold text-white text-base sm:text-lg truncate">{p.name}</span>
                        </div>
                    ))}
                    {gameData.players.length === 0 && (
                        <p className="text-center text-gray-500 text-xs sm:text-sm font-bold italic py-2">Belum ada murid yang bergabung...</p>
                    )}
                </div>

                <div className="mt-6 sm:mt-8">
                    {isHost ? (
                        <button onClick={handleStartGame} disabled={!isReadyToStart} className={`w-full py-3 sm:py-4 rounded-xl font-black text-sm sm:text-lg transition-all shadow-lg active:scale-95 ${isReadyToStart ? 'bg-emerald-500 hover:bg-emerald-400 text-white' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}>
                            {isReadyToStart ? 'M U L A I  G A M E' : `BUTUH ${2 - gameData.players.length} ORANG LAGI...`}
                        </button>
                    ) : (
                        <div className="w-full py-3 sm:py-4 bg-gray-700/50 rounded-xl font-extrabold text-gray-400 animate-pulse border border-gray-600 text-sm sm:text-base">
                            {isReadyToStart ? 'Menunggu Host...' : `Butuh minimal ${2 - gameData.players.length} orang lagi...`}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL CUSTOM UNTUK KELUAR DARI LOBI */}
            {showExitModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
                    <div className="bg-[#2a3038] w-full max-w-md rounded-[2rem] border-4 border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.15)] p-6 sm:p-8 text-center flex flex-col items-center">
                        <div className="bg-yellow-500/10 p-3 sm:p-4 rounded-full mb-4 sm:mb-6">
                            <WarningIcon />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-white mb-2 uppercase tracking-tight">Yakin membatalkan?</h2>
                        <p className="text-gray-400 font-bold mb-6 sm:mb-8 text-xs sm:text-sm">Lobi ini akan ditutup dan semua temanmu akan dikeluarkan.</p>
                        <div className="flex w-full gap-3 sm:gap-4">
                            <button onClick={() => setShowExitModal(false)} className="flex-1 py-2 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white font-black text-base sm:text-lg rounded-xl transition-all">Batal</button>
                            <button onClick={executeQuitLobby} className="flex-1 py-2 sm:py-3 bg-red-600 hover:bg-red-500 text-white font-black text-base sm:text-lg rounded-xl shadow-[0_4px_0_rgb(153,27,27)] active:translate-y-1 active:shadow-none transition-all">Keluar</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default Lobby;