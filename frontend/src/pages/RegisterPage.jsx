import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { authApi } from '../api/authApi';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await authApi.register(formData);
            toast.success("Account created successfully! You can now login.");
            navigate('/login');
        } catch (err) {
            setError(err.message || "Failed to register. Username might exist.");
            toast.error(err.message || "Registration failed.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="z-10 w-full max-w-md p-8 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-2">
                        Create Account
                    </h1>
                    <p className="text-slate-400 text-sm">Join the next-gen AI platform</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-slate-300 text-sm font-medium mb-2">Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                <Mail size={18} />
                            </div>
                            <input 
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                className="w-full bg-slate-800/50 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block pl-10 p-3 transition-colors outline-none"
                                placeholder="name@email.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-slate-300 text-sm font-medium mb-2">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                <Lock size={18} />
                            </div>
                            <input 
                                type="password" 
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength="6"
                                className="w-full bg-slate-800/50 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block pl-10 p-3 transition-colors outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 focus:ring-4 focus:outline-none focus:ring-purple-800 font-medium rounded-lg text-sm px-5 py-3 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Sign up details"}
                        {!isLoading && <ArrowRight size={18} />}
                    </button>
                    
                    {error && (
                        <p className="text-red-400 text-sm text-center font-medium bg-red-400/10 py-2 rounded border border-red-400/20">
                            {error}
                        </p>
                    )}
                </form>

                <p className="mt-8 text-sm font-light text-center text-slate-400">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-purple-400 hover:text-purple-300 transition-colors">
                        Sign in here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
