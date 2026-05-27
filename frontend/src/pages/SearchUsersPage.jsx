import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, User, Heart, FileText, ShieldQuestion } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../api/userApi';
import { toast } from 'react-toastify';

const TABS = [
    { id: 'users', label: 'Thành viên', icon: User },
    { id: 'posts', label: 'Chia sẻ', icon: FileText },
    { id: 'qa', label: 'Hỏi & Đáp', icon: ShieldQuestion },
];

const SearchUsersPage = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) {
            setUsers([]); setPosts([]); setQuestions([]);
            return;
        }
        setIsLoading(true);
        try {
            const [uRes, pRes, qRes] = await Promise.all([
                userApi.searchUsers(query),
                userApi.searchPosts(query),
                userApi.searchQuestions(query),
            ]);
            setUsers(uRes.data || []);
            setPosts(pRes.data || []);
            setQuestions(qRes.data || []);
        } catch {
            toast.error("Lỗi khi tìm kiếm");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(handleSearch, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const counts = { users: users.length, posts: posts.length, qa: questions.length };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
            <header className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all shrink-0">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">Tìm kiếm</h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Tìm thành viên, bài chia sẻ và câu hỏi</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-6">
                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Nhập từ khóa..."
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-sm text-lg"
                        autoFocus
                    />
                    {isLoading && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    )}
                </div>

                {/* Tabs */}
                <div className="flex bg-zinc-200/50 dark:bg-zinc-800/50 rounded-2xl p-1 gap-1">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-white dark:bg-zinc-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                            >
                                <Icon size={14} />
                                {tab.label}
                                {query && counts[tab.id] > 0 && (
                                    <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs px-1.5 rounded-full font-bold">
                                        {counts[tab.id]}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Results */}
                <div className="space-y-3">
                    {/* Users */}
                    {activeTab === 'users' && (
                        <>
                            {users.length === 0 && query ? (
                                <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                                    <User size={40} className="mx-auto mb-3 opacity-20" />
                                    <p>Không tìm thấy thành viên nào</p>
                                </div>
                            ) : users.map(u => (
                                <div key={u.id} onClick={() => navigate(`/user/${u.id}`)}
                                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl flex items-center gap-4 hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl uppercase group-hover:scale-110 transition-transform shrink-0">
                                        {u.username.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold truncate group-hover:text-emerald-500 transition-colors flex items-center gap-2">
                                            {u.username}
                                            {u.likes?.length > 0 && (
                                                <span className="text-xs flex items-center gap-1 text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full font-semibold shrink-0">
                                                    <Heart size={10} className="fill-current" /> {u.likes.length}
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-zinc-500 truncate">{u.email}</p>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Posts */}
                    {activeTab === 'posts' && (
                        <>
                            {posts.length === 0 && query ? (
                                <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                                    <FileText size={40} className="mx-auto mb-3 opacity-20" />
                                    <p>Không tìm thấy bài chia sẻ nào</p>
                                </div>
                            ) : posts.map(p => (
                                <div key={p.id} onClick={() => navigate('/community')}
                                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group">
                                    <h3 className="font-bold text-zinc-800 dark:text-zinc-100 mb-1 group-hover:text-emerald-500 transition-colors">{p.title}</h3>
                                    <p className="text-sm text-zinc-500 line-clamp-2 mb-3">{p.description}</p>
                                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                                        <span
                                            className="hover:text-emerald-500 cursor-pointer font-medium transition-colors"
                                            onClick={(e) => { e.stopPropagation(); navigate(`/user/${p.userId}`); }}
                                        >@{p.username}</span>
                                        <span>·</span>
                                        <span className="text-emerald-500">{p.fileName}</span>
                                        <span>·</span>
                                        <span className="flex items-center gap-1 text-red-400"><Heart size={10} className="fill-current" />{p.likes?.length || 0}</span>
                                    </div>
                                    {p.tags && p.tags.length > 0 && (
                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            {p.tags.map(t => (
                                                <span key={t} className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-xs text-zinc-500">#{t}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </>
                    )}

                    {/* Q&A */}
                    {activeTab === 'qa' && (
                        <>
                            {questions.length === 0 && query ? (
                                <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                                    <ShieldQuestion size={40} className="mx-auto mb-3 opacity-20" />
                                    <p>Không tìm thấy câu hỏi nào</p>
                                </div>
                            ) : questions.map(q => (
                                <div key={q.id} onClick={() => navigate(`/qa/${q.id}`)}
                                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group">
                                    <p className="font-medium text-zinc-800 dark:text-zinc-100 line-clamp-2 mb-3 group-hover:text-emerald-500 transition-colors">{q.body}</p>
                                    <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
                                        <span
                                            className="hover:text-emerald-500 cursor-pointer font-medium transition-colors"
                                            onClick={(e) => { e.stopPropagation(); navigate(`/user/${q.user_id}`); }}
                                        >@{q.username}</span>
                                        <span>·</span>
                                        <span>{q.answer_count || 0} câu trả lời</span>
                                        {q.tags?.map(t => (
                                            <span key={t} className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-500">{t}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SearchUsersPage;
