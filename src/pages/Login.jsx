// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === 'gurukeren123') {
            localStorage.setItem('is_guru_logged_in', 'true');
            navigate('/');
        } else {
            setError('Password salah le! Coba lagi.');
        }
    };

    return (
        <main className="min-h-screen bg-[#1e2329] text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#2a3038] p-8 rounded-3xl shadow-2xl border border-gray-700 animate-fade-in">

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black tracking-tighter text-white mb-2">PORTAL <span className="text-emerald-500">GURU</span></h1>
                    <p className="text-gray-400 font-bold text-sm">Masuk untuk mengelola Bank Soal</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 text-red-400 p-3 mb-6 rounded-xl border border-red-500/50 font-bold text-center animate-shake text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div className="relative">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Masukkan Password..."
                            className="w-full px-6 py-4 bg-[#1e2329] text-white rounded-2xl font-bold text-center outline-none focus:ring-4 focus:ring-emerald-500/50 transition-all border border-gray-600 placeholder:text-gray-500"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-[#2ea05b] hover:bg-[#258249] rounded-2xl font-black text-xl text-white transition-all shadow-lg active:scale-95 mt-2"
                    >
                        M A S U K
                    </button>
                </form>

                <button
                    onClick={() => navigate('/')}
                    className="w-full mt-4 py-3 text-gray-400 hover:text-white font-bold text-sm transition-colors"
                >
                    Kembali ke Lobi
                </button>
            </div>
        </main>
    );
}

export default Login;