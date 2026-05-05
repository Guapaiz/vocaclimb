import React from 'react';
import gambarTangga from '../assets/tanggalurus.svg';
import gambarTanggaMiring from '../assets/tanggamiring.svg';
import gambarUlar from '../assets/ular.svg';
import gambarUlarMangap from '../assets/ularmangap.svg';

// ASSET PION & DADU
import pionMerah from '../assets/pionmerah.svg';
import pionBiru from '../assets/pionbiru.svg';
import pionHijau from '../assets/pionhijau.svg';
import pionKuning from '../assets/pionkuning.svg';
import dice1 from '../assets/dice1.svg';
import dice2 from '../assets/dice2.svg';
import dice3 from '../assets/dice3.svg';
import dice4 from '../assets/dice4.svg';
import dice5 from '../assets/dice5.svg';
import dice6 from '../assets/dice6.svg';

const getPionAsset = (id) => {
    const assets = { 1: pionMerah, 2: pionBiru, 3: pionHijau, 4: pionKuning };
    return assets[id] || pionMerah;
};

const getDiceAsset = (val) => {
    const assets = { 1: dice1, 2: dice2, 3: dice3, 4: dice4, 5: dice5, 6: dice6 };
    return assets[val] || dice1;
};

const generateBoard = () => {
    const rows = 5, cols = 6;
    let board = [];
    for (let r = rows - 1; r >= 0; r--) {
        let row = [];
        for (let c = 0; c < cols; c++) {
            let index = r * cols + (r % 2 === 0 ? c : (cols - 1 - c));
            let label = index === 0 ? "START" : index === 29 ? "FINISH" : index;
            row.push({ id: index, label: label });
        }
        board.push(row);
    }
    return board;
};

const getShuffledIndices = (text, attempts, playerId) => {
    if (!text || attempts === 0) return [];
    let indices = Array.from({ length: text.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
        const seed = playerId * (i + 1) * (text.charCodeAt(0) || 1);
        const j = Math.floor((seed % 100) / 100 * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices.slice(0, attempts);
};

const Board = ({
    players, turn, diceRoll = [1], rolling = false, spinning = false, phase, onRoll,
    activeQuestion, quizAnswer, setQuizAnswer, submitQuiz, answerFeedback, isMyTurn, activePlayerName, timeLeft
}) => {
    const boardData = generateBoard();
    const currentPlayer = players?.[turn];
    const currentFailedAttempts = currentPlayer?.failedAttempts || 0;
    const currentPlayerId = currentPlayer?.id || 1;
    const revealedIndices = activeQuestion ? getShuffledIndices(activeQuestion.jawaban, currentFailedAttempts, currentPlayerId) : [];

    const PlayerCard = ({ id, colorClass, textColor }) => {
        const p = players?.find(player => player.id === id);
        const isActive = (turn + 1) === id;
        const displayName = p?.name || `Player ${id}`;

        return (
            <div className={`${colorClass} rounded-2xl 2xl:rounded-[2rem] p-1.5 2xl:p-4 border-2 2xl:border-4 ${isActive ? 'border-white ring-4 2xl:ring-8 ring-yellow-400 scale-105 shadow-2xl z-20' : 'border-black/20 z-0'} transition-all duration-300 h-[105px] 2xl:h-[180px] flex flex-row items-center justify-center gap-1.5 2xl:gap-4 overflow-hidden`}>
                <img src={getPionAsset(id)} alt={`Pion ${id}`} className={`w-9 h-11 2xl:w-16 2xl:h-20 object-contain drop-shadow-md flex-none ${isActive && !rolling ? 'animate-bounce' : ''}`} />
                <div className="flex flex-col items-center min-w-0 flex-1">
                    <span className={`text-[10px] 2xl:text-xl font-black uppercase mb-1 2xl:mb-3 drop-shadow-md truncate w-full text-center px-0.5 ${textColor || 'text-white'}`} title={displayName}>
                        {displayName}
                    </span>
                    <div className="bg-white border-2 2xl:border-4 border-gray-800 rounded-lg 2xl:rounded-2xl px-2.5 py-0.5 2xl:px-6 2xl:py-2 flex flex-col items-center shadow-inner min-w-[48px] 2xl:min-w-[100px] flex-none">
                        <span className="text-[8px] 2xl:text-sm font-bold text-gray-800 leading-none">Kotak</span>
                        <span className="text-xl 2xl:text-4xl font-black text-black leading-none mt-0.5 2xl:mt-2">{p?.position || 0}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-[1920px] mx-auto min-h-[100dvh] lg:min-h-0 lg:h-[96vh] p-2 lg:p-2 2xl:p-6 flex flex-col lg:flex-row gap-3 lg:gap-4 2xl:gap-8 items-center lg:items-stretch justify-start lg:justify-center overflow-y-auto lg:overflow-hidden bg-transparent">

            <div className="w-full lg:w-auto h-auto lg:h-full aspect-[6/5] relative bg-[#4B2C85] p-2 md:p-3 2xl:p-8 rounded-[2rem] 2xl:rounded-[4rem] border-8 2xl:border-[16px] border-[#D32F2F] shadow-2xl flex-none overflow-hidden flex items-center justify-center mt-4 lg:mt-0">
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>

                <div className="relative grid grid-cols-6 grid-rows-5 gap-0 bg-white border-4 2xl:border-8 border-orange-400 w-full h-full z-0">
                    {boardData.map((row) => row.map((cell) => (
                        <div key={cell.id} className="border border-orange-100 flex flex-col justify-start p-0.5 2xl:p-2 relative bg-white overflow-hidden">
                            <span className={`absolute top-1 right-1.5 font-black leading-none z-10 text-right ${cell.label === "START" || cell.label === "FINISH" ? "text-slate-800 text-[10px] sm:text-xs 2xl:text-2xl tracking-tighter" : "text-gray-300 text-[9px] sm:text-[11px] 2xl:text-xl"}`}>
                                {cell.label}
                            </span>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-2 z-30">
                                <div className="flex flex-wrap gap-0 justify-center items-center">
                                    {players?.filter(p => p.position === cell.id).map((p) => (
                                        <img key={p.id} src={getPionAsset(p.id)} className="w-6 h-6 sm:w-8 sm:h-8 2xl:w-20 2xl:h-20 object-contain drop-shadow-md animate-bounce" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )))}

                    <div className="absolute pointer-events-none z-10" style={{ bottom: '3%', left: '66%', width: '12%', height: '34%' }}><img src={gambarTangga} className="w-full h-full object-contain" /></div>
                    <div className="absolute pointer-events-none z-10" style={{ bottom: '40%', left: '1%', width: '12%', height: '34%' }}><img src={gambarTangga} className="w-full h-full object-contain" /></div>
                    <div className="absolute pointer-events-none z-10" style={{ bottom: '48%', left: '58%', width: '18%', height: '26%', transform: 'scaleX(-1) rotate(25deg)' }}><img src={gambarTanggaMiring} className="w-full h-full object-contain" /></div>
                    <div className="absolute pointer-events-none z-10" style={{ bottom: '18%', left: '6%', width: '38%', height: '46%', transform: 'scaleX(-1) rotate(25deg)' }}><img src={gambarUlar} className="w-full h-full object-contain" /></div>
                    <div className="absolute pointer-events-none z-10" style={{ bottom: '45%', left: '9%', width: '48%', height: '56%', transform: ' rotate(-50deg)' }}><img src={gambarUlarMangap} className="w-full h-full object-contain" /></div>
                    <div className="absolute pointer-events-none z-10" style={{ bottom: '2%', left: '32%', width: '38%', height: '36%', transform: 'rotate(40deg)' }}><img src={gambarUlar} className="w-full h-full object-contain" /></div>
                </div>

                {phase === "quiz" && activeQuestion && isMyTurn && (
                    <div className="fixed lg:absolute inset-0 z-[100] flex items-center justify-center p-2 lg:p-4 bg-black/80 lg:bg-black/60 lg:backdrop-blur-sm animate-fade-in">
                        <div className="bg-[#FFF9EB] w-full max-w-[320px] lg:max-w-[400px] 2xl:max-w-[500px] max-h-[95%] overflow-y-auto rounded-[2rem] 2xl:rounded-[3rem] border-[6px] 2xl:border-[10px] border-[#5D4037] shadow-2xl p-4 lg:p-4 2xl:p-8 flex flex-col items-center gap-2 lg:gap-2 2xl:gap-4 relative">
                            <h2 className="text-lg lg:text-xl 2xl:text-3xl font-black text-[#5D4037] uppercase tracking-tighter flex-none">
                                SOAL KOTAK NO {players[turn]?.position + 1}
                            </h2>

                            {activeQuestion.gambar && (
                                <div className="bg-white rounded-xl 2xl:rounded-2xl p-2 shadow-inner border border-[#5D4037]/10 w-full flex justify-center h-[120px] lg:h-[100px] 2xl:h-[200px] flex-none">
                                    <img src={activeQuestion.gambar} alt="Gambar Soal" className="w-full h-full object-contain drop-shadow-md animate-fade-in" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                                </div>
                            )}

                            <div className="text-center mt-1 w-full px-2 flex-none">
                                <h3 className="text-xl lg:text-xl 2xl:text-4xl font-black text-[#2E7D32] leading-tight break-words">
                                    {activeQuestion.soal}
                                </h3>
                            </div>

                            {currentFailedAttempts > 0 && isMyTurn && (
                                <div className="w-full flex flex-col items-center mt-1 animate-fade-in flex-none">
                                    <span className="text-[10px] lg:text-xs 2xl:text-lg font-black text-orange-500 uppercase tracking-widest mb-1">Bantuan Huruf Acak:</span>
                                    <div className="flex flex-wrap gap-1 justify-center">
                                        {activeQuestion.jawaban.split('').map((char, index) => {
                                            if (char === ' ') return <span key={index} className="w-3 lg:w-4"></span>;
                                            const isRevealed = revealedIndices.includes(index);
                                            return (
                                                <span key={index} className="text-lg lg:text-xl 2xl:text-3xl font-black text-orange-700 bg-orange-100 px-2 py-1 lg:px-2 lg:py-1 2xl:px-4 2xl:py-2 rounded-md lg:rounded-lg border-2 lg:border-4 border-orange-300 shadow-sm min-w-[28px] lg:min-w-[32px] 2xl:min-w-[50px] text-center">
                                                    {isRevealed ? char.toUpperCase() : '?'}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="w-full flex flex-col gap-2 mt-1 lg:mt-2 flex-none">
                                {isMyTurn ? (
                                    <>
                                        <input type="text" placeholder="Ketik jawabanmu..." className="w-full text-center text-md lg:text-base 2xl:text-2xl font-black border-2 lg:border-4 border-[#5D4037]/20 rounded-lg lg:rounded-xl py-2 lg:py-2 2xl:py-4 bg-white text-slate-800 outline-none focus:border-red-500 transition-all shadow-inner uppercase" value={quizAnswer} onChange={(e) => setQuizAnswer(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitQuiz()} />
                                        <button onClick={submitQuiz} className="w-full py-2.5 lg:py-2.5 2xl:py-4 bg-red-600 hover:bg-red-700 text-white font-black text-lg lg:text-lg 2xl:text-3xl rounded-xl lg:rounded-xl shadow-[0_4px_0_rgb(153,27,27)] lg:shadow-[0_4px_0_rgb(153,27,27)] 2xl:shadow-[0_8px_0_rgb(153,27,27)] active:translate-y-1 active:shadow-none transition-all">KIRIM</button>
                                    </>
                                ) : (
                                    <p className="text-slate-500 font-bold text-[10px] lg:text-xs 2xl:text-lg text-center italic py-2 leading-tight">Giliran {activePlayerName} menjawab...</p>
                                )}
                            </div>

                            <div className="h-4 lg:h-5 2xl:h-8 flex items-center justify-center mt-1 flex-none">
                                {answerFeedback === "correct" && <p className="text-emerald-600 font-black text-[12px] lg:text-xs 2xl:text-xl">✅ Jawaban Anda Benar</p>}
                                {answerFeedback === "wrong" && <p className="text-red-600 font-black text-[12px] lg:text-xs 2xl:text-xl">❌ Jawaban Anda Salah</p>}
                                {answerFeedback === "timeout" && <p className="text-red-600 font-black text-[12px] lg:text-xs 2xl:text-xl animate-pulse">⏰ Waktu Habis!</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="w-full max-w-[350px] lg:w-[320px] 2xl:max-w-none 2xl:w-[25vw] flex-none h-auto lg:h-full flex flex-col gap-3 2xl:gap-8 bg-[#D32F2F] p-3 2xl:p-8 rounded-[1.5rem] 2xl:rounded-[3rem] border-4 2xl:border-8 border-yellow-400 shadow-2xl overflow-hidden mb-8 lg:mb-0">
                {players?.some(p => p.id === 1) || players?.some(p => p.id === 2) ? (
                    <div className="grid grid-cols-2 gap-2 2xl:gap-4 flex-none">
                        {players?.some(p => p.id === 1) && <PlayerCard id={1} colorClass="bg-[#E53935]" />}
                        {players?.some(p => p.id === 2) && <PlayerCard id={2} colorClass="bg-[#1E88E5]" />}
                    </div>
                ) : null}

                <div className="flex-1 bg-white rounded-xl 2xl:rounded-3xl p-2 2xl:p-8 flex flex-col items-center justify-center gap-2 2xl:gap-8 border-4 2xl:border-8 border-gray-200 shadow-inner overflow-hidden">
                    <div className="text-center">
                        <p className="text-[12px] 2xl:text-2xl font-black text-slate-400 uppercase tracking-widest leading-none">Giliran</p>
                        <p className="text-2xl 2xl:text-6xl font-black text-red-600 uppercase mt-0.5 2xl:mt-4">{activePlayerName || `P${turn + 1}`}</p>
                    </div>

                    <div className="bg-gray-50 p-3 2xl:p-10 rounded-3xl 2xl:rounded-[3rem] border-2 2xl:border-4 border-gray-100 shadow-md relative w-full flex items-center justify-center min-h-[120px] 2xl:min-h-[280px]">
                        {phase === 'quiz' ? (
                            <div className="flex flex-col items-center">
                                <span className={`text-6xl 2xl:text-[9rem] font-black leading-none drop-shadow-md ${timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
                                    {timeLeft}
                                </span>
                                <span className="text-[12px] 2xl:text-2xl font-bold text-slate-400 mt-2 uppercase tracking-widest">Detik</span>
                            </div>
                        ) : (
                            <img src={getDiceAsset(diceRoll[0])} alt="Dice" className={`w-24 h-24 2xl:w-56 2xl:h-56 object-contain drop-shadow-md ${spinning ? 'animate-spin' : ''}`} />
                        )}
                    </div>

                    <div className="w-full mt-2 2xl:mt-6">
                        <button onClick={onRoll} disabled={rolling || phase !== 'dice' || !isMyTurn} className={`w-full py-3 2xl:py-8 rounded-2xl 2xl:rounded-[2rem] font-black text-xl 2xl:text-4xl tracking-widest shadow-[0_5px_0_rgb(185,28,28)] 2xl:shadow-[0_10px_0_rgb(185,28,28)] transition-all active:translate-y-1 active:shadow-none ${rolling || phase !== 'dice' || !isMyTurn ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-red-600 hover:bg-red-700 text-white animate-pulse'}`}>
                            {rolling ? 'M E L E M P A R...' : phase === 'quiz' ? 'M E N J A W A B...' : 'L E M P A R'}
                        </button>
                        <p className="text-[10px] 2xl:text-xl font-bold text-gray-400 italic text-center leading-tight mt-2 2xl:mt-4">
                            {phase === 'dice' ? "Klik untuk melempar dadunya!" : "Jawab sebelum waktu habis!"}
                        </p>
                    </div>
                </div>

                {players?.some(p => p.id === 3) || players?.some(p => p.id === 4) ? (
                    <div className="grid grid-cols-2 gap-2 2xl:gap-4 flex-none">
                        {players?.some(p => p.id === 3) && <PlayerCard id={3} colorClass="bg-[#43A047]" />}
                        {players?.some(p => p.id === 4) && <PlayerCard id={4} colorClass="bg-[#FDD835]" />}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default Board;