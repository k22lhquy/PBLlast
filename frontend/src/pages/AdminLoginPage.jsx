import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminLoginPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoading } = useSelector((state) => state.auth);
    
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await dispatch(loginUser(formData)).unwrap();
            toast.success("Admin login successful!");
            navigate('/admin');
        } catch (err) {
            toast.error("Invalid Admin Credentials. Redirecting to normal login...");
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center relative overflow-hidden">
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="z-10 w-full max-w-md p-8 bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-red-900/50 shadow-2xl shadow-red-900/20">
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-4 border border-red-500/20">
                        <ShieldAlert size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-red-400 mb-2">
                        Admin Portal Area
                    </h1>
                    <p className="text-zinc-400 text-sm">Superuser access only</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-zinc-300 text-sm font-medium mb-2">Admin Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-red-500">
                                <Mail size={18} />
                            </div>
                            <input 
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                className="w-full bg-black/50 border border-red-900 text-zinc-200 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block pl-10 p-3 transition-colors outline-none"
                                placeholder="..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-zinc-300 text-sm font-medium mb-2">Admin Passcode</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-red-500">
                                <Lock size={18} />
                            </div>
                            <input 
                                type="password" 
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full bg-black/50 border border-red-900 text-zinc-200 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block pl-10 p-3 transition-colors outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-900 font-medium rounded-lg text-sm px-5 py-3 transition-all duration-300 disabled:opacity-70 shadow-lg shadow-red-900/50"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Authenticate Admin"}
                    </button>
                    
                    <button 
                        type="button"
                        onClick={() => navigate('/login')}
                        className="w-full text-zinc-400 text-sm hover:text-white transition-colors"
                    >
                        Return to User Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLoginPage;
