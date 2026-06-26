import React, { useState } from 'react';
import { X, Settings, KeyRound, Lock, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { authApi } from '../api/authApi';

const SettingsModal = ({ isOpen, onClose }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pwData, setPwData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (pwData.newPassword.length < 6) {
            toast.error("Mật khẩu mới phải từ 6 ký tự trở lên.");
            return;
        }
        if (pwData.newPassword !== pwData.confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp!");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await authApi.changePassword({
                old_password: pwData.oldPassword,
                new_password: pwData.newPassword,
                confirm_password: pwData.confirmPassword
            });
            if (res.success) {
                toast.success("Đổi mật khẩu thành công!");
                setPwData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                onClose();
            } else {
                toast.error(res.message || "Đổi mật khẩu thất bại.");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Đã có lỗi xảy ra.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
                    <h3 className="font-bold flex items-center gap-2">
                        <Settings size={18} className="text-emerald-500" />
                        Cài đặt tài khoản
                    </h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <KeyRound size={24} />
                            </div>
                            <h4 className="font-bold">Đổi mật khẩu</h4>
                            <p className="text-xs text-zinc-500">Mật khẩu phải từ 6 ký tự trở lên</p>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <input 
                                    type="password"
                                    required
                                    value={pwData.oldPassword}
                                    onChange={(e) => setPwData({ ...pwData, oldPassword: e.target.value })}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    placeholder="Mật khẩu hiện tại"
                                />
                            </div>
                            <div className="relative">
                                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <input 
                                    type="password"
                                    required
                                    value={pwData.newPassword}
                                    onChange={(e) => setPwData({ ...pwData, newPassword: e.target.value })}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    placeholder="Mật khẩu mới"
                                />
                            </div>
                            <div className="relative">
                                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <input 
                                    type="password"
                                    required
                                    value={pwData.confirmPassword}
                                    onChange={(e) => setPwData({ ...pwData, confirmPassword: e.target.value })}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    placeholder="Xác nhận mật khẩu mới"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 mt-2"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Cập nhật mật khẩu"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
