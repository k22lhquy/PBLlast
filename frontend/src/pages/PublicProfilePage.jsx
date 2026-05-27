import React, { useEffect, useState } from 'react';
import { ArrowLeft, ShieldQuestion, FileText, Heart } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { userApi } from '../api/userApi';
import { toast } from 'react-toastify';

const PublicProfilePage = () => {
    const navigate = useNavigate();
    const { id: targetUserId } = useParams();
    
    const [targetUser, setTargetUser] = useState(null);
    const [activeTab, setActiveTab] = useState('posts');
    const [posts, setPosts] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLiking, setIsLiking] = useState(false);
    
    const { user } = useSelector(state => state.auth);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [profileRes, postRes, qRes] = await Promise.all([
                userApi.getProfile(targetUserId),
                userApi.getUserPosts(targetUserId),
                userApi.getUserQuestions(targetUserId)
            ]);
            setTargetUser(profileRes.data);
            setPosts(postRes.data || []);
            setQuestions(qRes.data || []);
        } catch { 
            toast.error("Không thể tải hồ sơ người dùng"); 
            navigate('/');
        }
        finally { setIsLoading(false); }
    };

    useEffect(() => { loadData(); }, [targetUserId]);

    const handleLikeUser = async () => {
        if (!user) return toast.error("Vui lòng đăng nhập để thực hiện");
        setIsLiking(true);
        try {
            const res = await userApi.likeUser(targetUserId);
            setTargetUser(prev => ({ ...prev, likes: res.data.likes }));
        } catch {
            toast.error("Lỗi khi tương tác");
        } finally {
            setIsLiking(false);
        }
    };

    const isLiked = targetUser?.likes?.includes(user?.user_id);
    const likeCount = targetUser?.likes?.length || 0;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
            <header className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur sticky top-0 z-10 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1 flex justify-center">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Hồ sơ người dùng</h1>
                </div>
                <div className="w-10" />
            </header>

            <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-8">
                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col items-center py-6">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-4xl shadow-xl border-4 border-white dark:border-zinc-900 mb-4">
                                {targetUser?.username?.charAt(0).toUpperCase() || targetUser?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <h2 className="text-2xl font-bold">{targetUser?.username || targetUser?.email?.split('@')[0] || 'User'}</h2>
                            <p className="text-zinc-500 mb-4">@{targetUser?.username}</p>
                            
                            <button
                                onClick={handleLikeUser}
                                disabled={isLiking}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all shadow-sm active:scale-95 ${isLiked ? 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:border-red-500/30' : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-emerald-500 hover:text-emerald-500'}`}
                            >
                                <Heart size={18} className={isLiked ? 'fill-current' : ''} />
                                <span>{likeCount} Yêu thích</span>
                            </button>
                        </div>

                        <div className="flex gap-2 p-1 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-2xl w-full max-w-md mx-auto">
                            <button 
                                onClick={() => setActiveTab('posts')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${activeTab === 'posts' ? 'bg-white dark:bg-zinc-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                            >
                                <FileText size={16} /> Bài đăng ({posts.length})
                            </button>
                            <button 
                                onClick={() => setActiveTab('questions')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${activeTab === 'questions' ? 'bg-white dark:bg-zinc-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                            >
                                <ShieldQuestion size={16} /> Câu hỏi ({questions.length})
                            </button>
                        </div>

                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {activeTab === 'posts' && (
                                <div className="space-y-4">
                                    {posts.length === 0 ? (
                                        <div className="text-center py-12 text-zinc-500 bg-white/50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700">
                                            Người dùng này chưa chia sẻ bài đăng nào.
                                        </div>
                                    ) : (
                                        posts.map(post => (
                                            <div key={post.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <h3 className="font-bold text-zinc-800 dark:text-zinc-100 truncate mb-1">{post.title}</h3>
                                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{post.description}</p>
                                                    <div className="text-xs text-zinc-400 mt-3 flex gap-4">
                                                        <span>{new Date(post.createdAt || post.created_at).toLocaleDateString('vi-VN')}</span>
                                                        <span>{post.likes?.length || 0} Thích</span>
                                                        {post.fileName && <span className="truncate text-emerald-500">{post.fileName}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'questions' && (
                                <div className="space-y-4">
                                    {questions.length === 0 ? (
                                        <div className="text-center py-12 text-zinc-500 bg-white/50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700">
                                            Người dùng này chưa đặt câu hỏi nào.
                                        </div>
                                    ) : (
                                        questions.map(q => (
                                            <div key={q.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between group cursor-pointer" 
                                                onClick={() => navigate(`/qa/${q.id}`)}>
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <p className="text-zinc-800 dark:text-zinc-100 font-medium whitespace-pre-wrap line-clamp-2 mb-3">{q.body}</p>
                                                    <div className="text-xs text-zinc-400 flex gap-4 items-center">
                                                        <span>{new Date(q.created_at).toLocaleDateString('vi-VN')}</span>
                                                        <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded font-mono text-zinc-600 dark:text-zinc-300">{q.answer_count || 0} câu trả lời</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default PublicProfilePage;
