import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';

const LoginPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoading, error } = useSelector((state) => state.auth);
    
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const validateForm = () => {
        const usernameRegex = /^[a-zA-Z0-9]{8,16}$/;
        if (!usernameRegex.test(formData.username)) {
            toast.error("Tên đăng nhập phải từ 8-16 ký tự và không chứa ký tự đặc biệt.");
            return false;
        }
        if (formData.password.length < 6) {
            toast.error("Mật khẩu phải từ 6 ký tự trở lên.");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            await dispatch(loginUser(formData)).unwrap();
            toast.success("Đăng nhập thành công! Chào mừng bạn quay trở lại.");
            navigate('/');
        } catch (err) {
            toast.error(err || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-600/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="z-10 w-full max-w-lg p-10 bg-zinc-100 dark:bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 mb-2">
                        Chào mừng quay lại
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm">Nhập thông tin của bạn để truy cập hệ thống</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-zinc-700 dark:text-zinc-300 text-sm font-medium mb-2">Tên đăng nhập</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 dark:text-zinc-500">
                                <User size={18} />
                            </div>
                            <input 
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                className="w-full bg-white dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block pl-10 p-3 transition-colors outline-none"
                                placeholder="Nhập tên đăng nhập"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-zinc-700 dark:text-zinc-300 text-sm font-medium mb-2">Mật khẩu</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 dark:text-zinc-500">
                                <Lock size={18} />
                            </div>
                            <input 
                                type="password" 
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full bg-white dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block pl-10 p-3 transition-colors outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 focus:ring-4 focus:outline-none focus:ring-emerald-800 font-medium rounded-lg text-sm px-5 py-3 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Đăng nhập"}
                        {!isLoading && <ArrowRight size={18} />}
                    </button>
                    
                    {error && (
                        <p className="text-red-400 text-sm text-center font-medium bg-red-400/10 py-2 rounded border border-red-400/20">
                            {error}
                        </p>
                    )}
                </form>

                <p className="mt-8 text-sm font-light text-center text-zinc-600 dark:text-zinc-400">
                    Chưa có tài khoản?{' '}
                    <Link to="/register" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                        Đăng ký tại đây
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
