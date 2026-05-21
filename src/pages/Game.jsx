import React, { useState, useEffect } from "react";
import { supabase } from '../supabaseClient';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import { FaHourglassHalf, FaClipboard, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import Board from "../components/Board";

// --- KONFIGURASI SOUND EFFECT ---
const sfx = {
    roll: new Audio('/sounds/dadu.mp3'),
    step: new Audio('/sounds/pion_bergerak.mp3'),
    correct: new Audio('/sounds/benar.mp3'),
    wrong: new Audio('/sounds/salah.mp3'),
    ladder: new Audio('/sounds/naik.mp3'),
    snake: new Audio('/sounds/turun.mp3'),
    win: new Audio('/sounds/finish.mp3'),
    start: new Audio('/sounds/start.mp3')
};

const playSound = (type) => {
    if (sfx[type]) {
        sfx[type].currentTime = 0;
        sfx[type].play().catch(err => console.log("Browser nge-block autoplay:", err));
    }
};

const stopSound = (type) => {
    if (sfx[type]) {
        sfx[type].pause();
        sfx[type].currentTime = 0;
    }
};

const specialMoves = {
    4: 7, 12: 23, 16: 20, 14: 11, 26: 13, 9: 3
};

const TARGET_FINISH = 29;

function Game() {
    const { gameId } = useParams();
    const navigate = useNavigate();

    const [gameState, setGameState] = useState(null);
    const [loading, setLoading] = useState(true);

    const [rolling, setRolling] = useState(false);
    const [spinning, setSpinning] = useState(false);

    const [localPlayerId, setLocalPlayerId] = useState(null);
    const [copied, setCopied] = useState(false);

    const [visualDice, setVisualDice] = useState([1]);
    const [visualPlayers, setVisualPlayers] = useState(null);

    const [quizAnswer, setQuizAnswer] = useState("");
    const [liveAnswer, setLiveAnswer] = useState(""); // State buat nampung ketikan live di layar guru
    const [answerFeedback, setAnswerFeedback] = useState(null);
    const [timeLeft, setTimeLeft] = useState(60);

    const [bankSoal, setBankSoal] = useState([]);

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showConfirmExitModal, setShowConfirmExitModal] = useState(false);

    const [hasPlayedStartSound, setHasPlayedStartSound] = useState(false);

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            gameState && !gameState.finished &&
            currentLocation.pathname !== nextLocation.pathname
    );

    const promptForceExit = () => setShowConfirmExitModal(true);

    const executeForceExit = async () => {
        setShowConfirmExitModal(false);
        await supabase.from('games').update({ finished: true, phase: 'cancelled' }).eq('id', gameId);
        localStorage.removeItem(`tanggapoly_player_id_${gameId}`);
        navigate('/');
        window.location.reload();
    };

    const getQuestionForPosition = (position) => {
        if (!bankSoal || bankSoal.length === 0) return null;
        const validSquares = [0, 1, 2, 3, 5, 6, 7, 8, 10, 11, 13, 15, 17, 18, 19, 20, 21, 22, 23, 24, 25, 27, 28];
        let index = validSquares.indexOf(position);
        if (index === -1) index = 0;
        return bankSoal[index % bankSoal.length];
    };

    useEffect(() => {
        const savedPlayerId = localStorage.getItem(`tanggapoly_player_id_${gameId}`);
        if (!savedPlayerId) { navigate('/'); return; }

        setLocalPlayerId(savedPlayerId === 'host' ? 'host' : Number(savedPlayerId));

        const fetchInitialGame = async () => {
            setLoading(true);
            const { data: gameData, error: gameError } = await supabase.from('games').select('*').eq('id', gameId).single();
            if (gameError || !gameData || gameData.finished) {
                localStorage.removeItem(`tanggapoly_player_id_${gameId}`);
                navigate('/');
                return;
            }

            const { data: soalData } = await supabase.from('bank_soal').select('*').order('id', { ascending: true });
            setBankSoal(soalData || []);

            setGameState(gameData);
            setVisualDice(gameData.diceRoll || [1]);
            setVisualPlayers(gameData.players);
            setLoading(false);
        };

        fetchInitialGame();

        // FIX: Konfigurasi Supabase buat nangkap fitur Broadcast (CCTV Guru)
        const channel = supabase.channel(`game-room-${gameId}`, {
            config: { broadcast: { ack: false } }
        });

        channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
            (payload) => {
                if (payload.new.phase === 'cancelled') {
                    setShowCancelModal(true);
                    return;
                }
                setGameState(payload.new);
            }
        )
            .on('broadcast', { event: 'typing' }, (payload) => {
                // Kalau yang buka adalah guru/host, update tampilan layar dengan ketikan murid
                if (localStorage.getItem(`tanggapoly_player_id_${gameId}`) === 'host') {
                    setLiveAnswer(payload.payload.text);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [gameId, navigate]);

    useEffect(() => {
        if (gameState && !rolling) setVisualPlayers(gameState.players);
    }, [gameState?.players]);

    useEffect(() => {
        if (gameState && gameState.phase !== 'waiting' && !hasPlayedStartSound) {
            playSound('start');
            setHasPlayedStartSound(true);
        }
    }, [gameState?.phase, hasPlayedStartSound]);

    // JURUS AUTO-RESET TIAP GANTI GILIRAN
    useEffect(() => {
        setTimeLeft(60);
        setQuizAnswer("");
        setLiveAnswer(""); // Reset juga jawaban di layar guru
        setAnswerFeedback(null);
    }, [gameState?.turn]);

    const isMyTurnCheck = gameState ? (gameState.turn + 1) === localPlayerId : false;
    const isHost = localPlayerId === 'host';

    // LOGIKA COUNTDOWN YANG LEBIH STABIL
    useEffect(() => {
        let timer;
        if (gameState?.phase === 'quiz' && !answerFeedback) {
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        if (isMyTurnCheck) executeTimeUp();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (gameState?.phase !== 'quiz') {
            setTimeLeft(60);
        }
        return () => clearInterval(timer);
    }, [gameState?.phase, answerFeedback, isMyTurnCheck]);

    const executeTimeUp = async () => {
        playSound('wrong');
        setAnswerFeedback("timeout");

        const { data: latestGame } = await supabase.from('games').select('*').eq('id', gameId).single();
        if (!latestGame) return;

        const { turn, players } = latestGame;
        const currentFailedAttempts = players[turn].failedAttempts || 0;

        const newPlayers = players.map(p => p.id === players[turn].id ? { ...p, failedAttempts: currentFailedAttempts + 1 } : p);
        const nextTurn = (turn + 1) % players.length;

        setTimeout(async () => {
            stopSound('wrong');
            await supabase.from('games').update({
                turn: nextTurn,
                phase: 'quiz',
                players: newPlayers
            }).eq('id', gameId);
        }, 1500);
    };

    useEffect(() => {
        if (gameState?.is_rolling && !rolling) {
            setRolling(true);
            setSpinning(true);
            playSound('roll');

            // Eksekusi animasi murni 1-6 biar dadu muter natural
            const animationInterval = setInterval(() => {
                setVisualDice([Math.floor(Math.random() * 6) + 1]);
            }, 100);

            setTimeout(() => {
                clearInterval(animationInterval);
                setVisualDice(gameState.diceRoll);
                setSpinning(false);
                stopSound('roll');

                setTimeout(() => {
                    const { turn, players, diceRoll } = gameState;
                    const currentPlayer = players[turn];
                    if (!currentPlayer) { setRolling(false); return; }

                    const startPos = currentPlayer.position;
                    const moveSum = diceRoll[0];
                    let newPos = startPos + moveSum;
                    if (newPos > TARGET_FINISH) newPos = TARGET_FINISH;

                    const path = [];
                    for (let i = startPos + 1; i <= newPos; i++) { path.push(i); }

                    if (path.length === 0) {
                        if (localPlayerId === turn + 1) updateTurnAfterMove(newPos);
                        else setRolling(false);
                        return;
                    }

                    let stepIndex = 0;
                    const stepInterval = setInterval(() => {
                        const currentStep = path[stepIndex];
                        setVisualPlayers(prev => prev.map(p => p.id === currentPlayer.id ? { ...p, position: currentStep } : p));
                        playSound('step');
                        stepIndex++;

                        if (stepIndex >= path.length) {
                            clearInterval(stepInterval);
                            setTimeout(() => stopSound('step'), 300);

                            const finalPos = specialMoves[newPos] || newPos;

                            if (newPos !== finalPos) {
                                setTimeout(() => {
                                    const jumpType = finalPos > newPos ? 'ladder' : 'snake';
                                    playSound(jumpType);
                                    setVisualPlayers(prev => prev.map(p => p.id === currentPlayer.id ? { ...p, position: finalPos } : p));

                                    setTimeout(() => {
                                        stopSound(jumpType);
                                        if (localPlayerId === turn + 1) updateTurnAfterMove(finalPos);
                                        else setRolling(false);
                                    }, 800);
                                }, 600);
                            } else {
                                setTimeout(() => {
                                    if (localPlayerId === turn + 1) updateTurnAfterMove(finalPos);
                                    else setRolling(false);
                                }, 800);
                            }
                        }
                    }, 400);
                }, 1500);
            }, 1200);
        }
    }, [gameState?.is_rolling]);

    const updateTurnAfterMove = async (finalPos) => {
        const { turn, players } = gameState;
        const isFinished = finalPos >= TARGET_FINISH;

        if (isFinished) playSound('win');

        const newPlayers = players.map(p => p.id === players[turn].id ? { ...p, position: finalPos, score: p.score + 10 } : p);
        const nextTurn = (turn + 1) % players.length;

        await supabase.from('games').update({
            players: newPlayers,
            turn: isFinished ? turn : nextTurn,
            phase: isFinished ? 'result' : 'quiz',
            is_rolling: false,
            finished: isFinished
        }).eq('id', gameId);

        setRolling(false);
    };

    // FUNGSI BARU: Nangkep ketikan murid dan broadcast ke guru secara gaib
    const handleAnswerChange = (text) => {
        setQuizAnswer(text);
        // Kirim event 'typing' langsung ke channel tanpa nyentuh database
        supabase.channel(`game-room-${gameId}`).send({
            type: 'broadcast',
            event: 'typing',
            payload: { text: text }
        });
    };

    const submitQuiz = async () => {
        if (!gameState || gameState.phase !== 'quiz') return;
        const { turn, players } = gameState;
        const activeQuestion = getQuestionForPosition(players[turn].position);

        if (!activeQuestion) return;

        const currentFailedAttempts = players[turn].failedAttempts || 0;
        const isCorrect = quizAnswer.trim().toLowerCase() === activeQuestion.jawaban.toLowerCase() || currentFailedAttempts >= activeQuestion.jawaban.length;

        if (isCorrect) {
            playSound('correct');
            setAnswerFeedback("correct");
            setTimeout(async () => {
                stopSound('correct');
                const newPlayers = players.map(p => p.id === players[turn].id ? { ...p, failedAttempts: 0 } : p);

                await supabase.from('games').update({
                    phase: 'dice',
                    players: newPlayers
                }).eq('id', gameId);
            }, 1200);
        } else {
            playSound('wrong');
            setAnswerFeedback("wrong");

            setTimeout(async () => {
                stopSound('wrong');
                const newPlayers = players.map(p => p.id === players[turn].id ? { ...p, failedAttempts: currentFailedAttempts + 1 } : p);
                const nextTurn = (turn + 1) % players.length;

                await supabase.from('games').update({
                    turn: nextTurn,
                    phase: 'quiz',
                    players: newPlayers
                }).eq('id', gameId);
            }, 1500);
        }
    };

    const rollDice = async () => {
        if (rolling || !gameState || gameState.phase !== 'dice' || (gameState.turn + 1) !== localPlayerId) return;
        const currentPlayer = gameState.players[gameState.turn];
        const currentPosition = currentPlayer.position;
        const distanceToFinish = TARGET_FINISH - currentPosition;
        const maxDice = Math.min(6, distanceToFinish);
        const d1 = Math.floor(Math.random() * maxDice) + 1;
        await supabase.from('games').update({ diceRoll: [d1], is_rolling: true }).eq('id', gameId);
    };

    const copyToClipboard = () => { navigator.clipboard.writeText(gameState?.join_code); setCopied(true); setTimeout(() => setCopied(false), 2000); };

    const resetGame = () => {
        localStorage.removeItem(`tanggapoly_player_id_${gameId}`);
        navigate('/');
    };

    const handleCloseCancelModal = () => {
        localStorage.removeItem(`tanggapoly_player_id_${gameId}`);
        navigate('/');
        window.location.reload();
    };

    if (loading || !gameState || !visualPlayers || bankSoal.length === 0) {
        return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white font-black italic text-xl">Menyiapkan Papan & Soal...</div>;
    }

    if (gameState.phase === 'waiting' && !gameState.finished && gameState.phase !== 'cancelled') {
        return (
            <main className="min-h-screen bg-[#0f172a] p-8 text-white flex flex-col justify-center items-center relative">
                {showConfirmExitModal && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
                        <div className="bg-[#2a3038] w-full max-w-md rounded-[2rem] border-4 border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.2)] p-8 text-center flex flex-col items-center">
                            <div className="bg-yellow-500/20 p-4 rounded-full mb-6">
                                <FaExclamationTriangle className="text-5xl text-yellow-500" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Yakin mau membatalkan?</h2>
                            <p className="text-gray-400 font-bold mb-8 text-sm">Semua pemain yang sudah masuk akan dikeluarkan dari lobi ini.</p>
                            <div className="flex w-full gap-4">
                                <button onClick={() => setShowConfirmExitModal(false)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-black text-lg rounded-xl transition-all">Batal</button>
                                <button onClick={executeForceExit} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-lg rounded-xl shadow-[0_4px_0_rgb(153,27,27)] active:translate-y-1 active:shadow-none transition-all">Ya, Keluar</button>
                            </div>
                        </div>
                    </div>
                )}

                <button onClick={promptForceExit} className="absolute top-6 right-6 z-50 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white p-4 rounded-full transition-all active:scale-90 border border-red-500/30 hover:border-red-600" title="Batalkan Game">
                    <FaTimes size={24} />
                </button>

                <FaHourglassHalf className="text-7xl text-emerald-400 mb-6 animate-pulse" />
                <h2 className="text-4xl font-black mb-2 uppercase tracking-tighter text-center">Menunggu Host Memulai...</h2>
                <p className="text-slate-400 mb-8 font-bold uppercase">({gameState.players.length}/4) Murid Terkumpul</p>
                <div className='flex items-center gap-3 bg-slate-800 p-4 rounded-2xl border-4 border-slate-700 shadow-2xl'>
                    <p className="text-3xl font-mono tracking-[0.5em] text-emerald-400 font-black">{gameState.join_code}</p>
                    <button onClick={copyToClipboard} className="p-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg active:scale-90">{copied ? '✔️' : <FaClipboard />}</button>
                </div>
            </main>
        );
    }

    const { turn, phase, finished } = gameState;
    const isMyTurn = (turn + 1) === localPlayerId;
    const activePlayerName = gameState.players[turn]?.name;
    const activeQuestion = getQuestionForPosition(gameState.players[turn]?.position);

    return (
        <main className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center overflow-hidden p-4 relative">
            {showCancelModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
                    <div className="bg-[#2a3038] w-full max-w-md rounded-[2rem] border-4 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.3)] p-8 text-center flex flex-col items-center">
                        <div className="bg-red-500/20 p-4 rounded-full mb-6"><FaTimes className="text-5xl text-red-500" /></div>
                        <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Game Dibatalkan</h2>
                        <p className="text-gray-400 font-bold mb-8">Seseorang telah membatalkan permainan ini. Kamu akan dikembalikan ke Lobi Utama.</p>
                        <button onClick={handleCloseCancelModal} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black text-xl rounded-xl shadow-[0_4px_0_rgb(153,27,27)] active:translate-y-1 active:shadow-none transition-all uppercase">Ke Lobi Utama</button>
                    </div>
                </div>
            )}

            {showConfirmExitModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
                    <div className="bg-[#2a3038] w-full max-w-md rounded-[2rem] border-4 border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.2)] p-8 text-center flex flex-col items-center">
                        <div className="bg-yellow-500/20 p-4 rounded-full mb-6"><FaExclamationTriangle className="text-5xl text-yellow-500" /></div>
                        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Yakin mau membatalkan?</h2>
                        <p className="text-gray-400 font-bold mb-8 text-sm">Permainan akan dibatalkan dan semua pemain akan dikeluarkan dari ruangan ini.</p>
                        <div className="flex w-full gap-4">
                            <button onClick={() => setShowConfirmExitModal(false)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-black text-lg rounded-xl transition-all">Batal</button>
                            <button onClick={executeForceExit} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-lg rounded-xl shadow-[0_4px_0_rgb(153,27,27)] active:translate-y-1 active:shadow-none transition-all">Ya, Keluar</button>
                        </div>
                    </div>
                </div>
            )}

            {!finished && phase !== 'cancelled' && (
                <button onClick={promptForceExit} className="absolute top-4 right-4 z-50 bg-red-600/80 hover:bg-red-500 text-white p-3 rounded-full shadow-lg transition-all active:scale-90 backdrop-blur-sm border border-red-400" title="Keluar Permainan">
                    <FaTimes size={20} />
                </button>
            )}

            {finished && phase !== 'cancelled' ? (
                <div className="bg-[#1e2329] p-8 md:p-12 rounded-[3rem] border-8 border-yellow-400 text-center shadow-2xl animate-fade-in w-full max-w-4xl relative z-20 mx-4">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-2 italic uppercase tracking-tighter">
                        🎉 SELAMATTT! 🎉
                    </h1>

                    <h2 className="text-lg md:text-2xl text-yellow-400 font-black mb-8 uppercase tracking-widest">
                        Pemenangnya adalah {gameState.players.slice().sort((a, b) => b.position - a.position)[0].name}!
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-10 text-left">
                        {gameState.players.slice().sort((a, b) => b.position - a.position).map((p, idx) => {
                            let medal = "🐢";
                            if (idx === 0) medal = "🏆";
                            if (idx === 1) medal = "🥈";
                            if (idx === 2) medal = "🥉";

                            const isWinner = idx === 0;

                            return (
                                <div key={p.id} className={`flex items-center justify-between gap-4 p-4 md:p-5 rounded-2xl border-b-4 transition-transform ${isWinner ? 'bg-gradient-to-r from-yellow-300 to-yellow-500 border-yellow-600 scale-105 shadow-[0_0_30px_rgba(250,204,21,0.6)] z-10' : 'bg-white border-slate-300'}`}>
                                    <span className={`font-black text-xl md:text-2xl flex items-center gap-3 truncate ${isWinner ? 'text-slate-900' : 'text-slate-800'}`}>
                                        <span className={isWinner ? "text-4xl drop-shadow-md animate-bounce" : "text-3xl"}>{medal}</span>
                                        <span>#{idx + 1} {p.name}</span>
                                    </span>
                                    <span className={`font-black text-xl md:text-2xl whitespace-nowrap ${isWinner ? 'text-red-600 drop-shadow-sm' : 'text-emerald-600'}`}>
                                        BOX {p.position}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <button onClick={resetGame} className="px-12 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xl rounded-2xl shadow-[0_6px_0_rgb(5,150,105)] active:translate-y-1 active:shadow-none transition-all tracking-widest uppercase">
                        KE LOBBY
                    </button>
                </div>
            ) : (
                <Board
                    players={visualPlayers}
                    turn={turn}
                    diceRoll={visualDice}
                    rolling={rolling}
                    spinning={spinning}
                    phase={phase}
                    onRoll={rollDice}
                    activeQuestion={activeQuestion}
                    quizAnswer={quizAnswer}
                    handleAnswerChange={handleAnswerChange} // Props baru buat nangkep ketikan murid
                    submitQuiz={submitQuiz}
                    answerFeedback={answerFeedback}
                    isMyTurn={isMyTurn}
                    isHost={isHost} // Ngasih tau board kalau yang buka ini guru
                    liveAnswer={liveAnswer} // Prop buat nampilin ketikan
                    activePlayerName={activePlayerName}
                    timeLeft={timeLeft}
                />
            )}
        </main>
    );
}

export default Game;