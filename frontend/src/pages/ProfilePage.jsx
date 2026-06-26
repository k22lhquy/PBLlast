import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, ShieldQuestion, FileText, Lock, KeyRound, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { authApi } from '../api/authApi';
import { communityApi } from '../api/communityApi';
import { qaApi } from '../api/qaApi';
import { toast } from 'react-toastify';

const ProfilePage = () => {
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [activeTab, setActiveTab] = useState('posts');
    const [posts, setPosts] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [pwData, setPwData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [postRes, qRes] = await Promise.all([
                communityApi.getMyPosts(),
                qaApi.getMyQuestions()
            ]);
            setPosts(postRes.data || []);
            setQuestions(qRes.data || []);
        } catch { toast.error("Failed to load profile data"); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const handleDeletePost = async (id) => {
        if (!window.confirm("Are you sure you want to delete this document?")) return;
        try {
            await communityApi.deletePost(id);
            setPosts(prev => prev.filter(p => p.id !== id));
            toast.success("Document deleted");
        } catch { toast.error("Failed to delete document"); }
    };
    const handleDeleteQuestion = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này? Tất cả câu trả lời liên quan cũng sẽ bị xóa.")) return;
        try {
            await qaApi.deleteQuestion(id);
            setQuestions(prev => prev.filter(q => q.id !== id));
            toast.success("Đã xóa câu hỏi");
        } catch { toast.error("Không thể xóa câu hỏi"); }
    };

    const handlePasswordChange = async (e) => {
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
                setShowPasswordModal(false);
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
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
            <header className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur sticky top-0 z-20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Hồ sơ cá nhân</h1>
                </div>
                
                <button 
                    onClick={() => setShowPasswordModal(true)}
                    className="flex items-center gap-2 py-2 px-4 bg-zinc-200/50 dark:bg-zinc-800/50 hover:bg-emerald-500 hover:text-white rounded-xl text-sm font-bold transition-all group"
                >
                    <Lock size={16} className="text-emerald-500 group-hover:text-white transition-colors" />
                    <span>Đổi mật khẩu</span>
                </button>
            </header>

            <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-8">
                {/* Profile Banner */}
                <div className="flex flex-col items-center py-6">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-4xl shadow-xl border-4 border-white dark:border-zinc-900 mb-6 rotate-3 transform transition-transform hover:rotate-0">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="text-center">
                        <h2 className="text-3xl font-black tracking-tight">
                            {user?.username ? user.username.split('@')[0] : 'Thành viên'}
                        </h2>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full">Pro Member</span>
                            <span className="text-zinc-400 text-sm italic">
                                @{user?.username ? user.username.split('@')[0].toLowerCase() : 'user'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-3 p-1.5 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-2xl w-full max-w-lg mx-auto shadow-inner">
                    <button 
                        onClick={() => setActiveTab('posts')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[1.25rem] text-sm font-bold transition-all ${activeTab === 'posts' ? 'bg-white dark:bg-zinc-700 shadow-xl text-emerald-600 dark:text-emerald-400 scale-[1.02]' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
                    >
                        <FileText size={18} /> Tài liệu của tôi ({posts.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('questions')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[1.25rem] text-sm font-bold transition-all ${activeTab === 'questions' ? 'bg-white dark:bg-zinc-700 shadow-xl text-emerald-600 dark:text-emerald-400 scale-[1.02]' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
                    >
                        <ShieldQuestion size={18} /> Câu hỏi ({questions.length})
                    </button>
                </div>

                {/* Content Area */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-20 animate-pulse">
                        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
                        <p className="text-zinc-500 font-bold uppercase tracking-tighter text-sm">Đang đồng bộ dữ liệu...</p>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
                        {activeTab === 'posts' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {posts.length === 0 ? (
                                    <div className="col-span-full text-center py-20 text-zinc-500 bg-white/40 dark:bg-zinc-900/40 rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                                        <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="font-bold">Chưa có tài liệu nào được chia sẻ.</p>
                                    </div>
                                ) : (
                                    posts.map(post => (
                                        <div key={post.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all flex flex-col group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none" />
                                            <div className="flex-1 min-w-0 mb-4">
                                                <h3 className="font-black text-zinc-800 dark:text-zinc-100 truncate mb-2 text-lg">{post.title}</h3>
                                                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">{post.description}</p>
                                            </div>
                                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="text-[10px] font-bold text-zinc-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                                                    {post.fileName && <span className="text-[10px] font-bold text-emerald-500 truncate max-w-[120px]">{post.fileName}</span>}
                                                </div>
                                                <button 
                                                    onClick={() => handleDeletePost(post.id)}
                                                    className="p-2 text-zinc-400 hover:text-white hover:bg-red-500 rounded-xl transition-all shadow-lg hover:shadow-red-500/20"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'questions' && (
                            <div className="space-y-4">
                                {questions.length === 0 ? (
                                    <div className="text-center py-20 text-zinc-500 bg-white/40 dark:bg-zinc-900/40 rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                                        <ShieldQuestion size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="font-bold">Bạn chưa đặt câu hỏi nào.</p>
                                    </div>
                                ) : (
                                    questions.map(q => (
                                        <div key={q.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-7 shadow-sm hover:shadow-2xl hover:border-emerald-500/30 transition-all flex items-center justify-between group cursor-pointer" onClick={(e) => {
                                            if (!e.target.closest('button')) navigate(`/qa/${q.id}`);
                                        }}>
                                            <div className="flex-1 min-w-0 pr-6">
                                                <p className="text-zinc-800 dark:text-zinc-100 font-bold whitespace-pre-wrap line-clamp-2 mb-4 text-base leading-relaxed">{q.body}</p>
                                                <div className="text-xs text-zinc-400 flex gap-4 items-center font-bold">
                                                    <span className="bg-emerald-500/5 text-emerald-600 px-3 py-1 rounded-full">{new Date(q.created_at).toLocaleDateString()}</span>
                                                    <span>{q.answer_count || 0} Trả lời</span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(q.id); }}
                                                className="p-3 text-white bg-red-500 rounded-[1rem] transition-all opacity-0 group-hover:opacity-100 shadow-xl shadow-red-500/20"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Password Change Modal - Positioned top rightish or centered */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-start justify-end p-6 pt-20">
                    <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl p-8 border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 slide-in-from-top-10 duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                                    <KeyRound size={24} />
                                </div>
                                <h3 className="text-xl font-black">Bảo mật tài khoản</h3>
                            </div>
                            <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 transition-all">
                                <ArrowLeft className="rotate-90" size={20} />
                            </button>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Mật khẩu hiện tại</label>
                                <input 
                                    type="password"
                                    required
                                    value={pwData.oldPassword}
                                    onChange={(e) => setPwData({ ...pwData, oldPassword: e.target.value })}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-5 py-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="h-px bg-zinc-100 dark:bg-zinc-800 mx-2" />
                            <div>
                                <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Mật khẩu mới</label>
                                <input 
                                    type="password"
                                    required
                                    value={pwData.newPassword}
                                    onChange={(e) => setPwData({ ...pwData, newPassword: e.target.value })}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-5 py-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono"
                                    placeholder="Tối thiểu 6 ký tự"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Xác nhận mật khẩu</label>
                                <input 
                                    type="password"
                                    required
                                    value={pwData.confirmPassword}
                                    onChange={(e) => setPwData({ ...pwData, confirmPassword: e.target.value })}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-5 py-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono"
                                    placeholder="••••••••"
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-400 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/10 transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Lưu thay đổi"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
