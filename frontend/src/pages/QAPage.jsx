import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { qaApi } from '../api/qaApi';
import { ArrowLeft, MessageSquare, Tag, Plus, X, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';

const QAPage = () => {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [body, setBody] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const load = async () => {
        setIsLoading(true);
        try {
            const res = await qaApi.getQuestions();
            setQuestions(res.data || []);
        } catch { toast.error("Không thể tải câu hỏi"); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const addTag = (e) => {
        if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!body.trim()) return toast.error("Vui lòng nhập nội dung câu hỏi");
        setIsSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('body', body);
            fd.append('tags', tags.join(','));
            await qaApi.createQuestion(body, tags);
            toast.success("Đã đăng câu hỏi!");
            setIsModalOpen(false);
            setBody(''); setTags([]);
            load();
        } catch { toast.error("Đăng câu hỏi thất bại"); }
        finally { setIsSubmitting(false); }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
            <header className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="p-2 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">Hỏi & Đáp cộng đồng</h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Đặt câu hỏi, cùng nhau giải đáp</p>
                    </div>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm">
                    <Plus size={18} /> Đặt câu hỏi
                </button>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-4">
                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                    </div>
                ) : questions.length === 0 ? (
                    <div className="text-center p-12 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                        <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!</p>
                    </div>
                ) : questions.map(q => (
                    <div
                        key={q.id}
                        onClick={() => navigate(`/qa/${q.id}`)}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-emerald-500/50 cursor-pointer transition-all group"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-zinc-800 dark:text-zinc-100 line-clamp-3 mb-3">{q.body}</p>
                                {q.tags?.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {q.tags.map(t => (
                                            <span key={t} className="flex items-center gap-1 text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full font-medium">
                                                <Tag size={10} />{t}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                                    <span 
                                        className="hover:text-emerald-500 cursor-pointer font-medium transition-colors"
                                        onClick={(e) => { e.stopPropagation(); navigate(`/user/${q.user_id}`); }}
                                    >
                                        @{q.username}
                                    </span>
                                    <span>·</span>
                                    <span>{new Date(q.created_at).toLocaleDateString('vi-VN')}</span>
                                    <span>·</span>
                                    <span className="flex items-center gap-1">
                                        <MessageSquare size={12} /> {q.answer_count} câu trả lời
                                    </span>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-zinc-400 group-hover:text-emerald-500 shrink-0 transition-colors mt-1" />
                        </div>
                    </div>
                ))}
            </main>

            {/* Create Question Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Đặt câu hỏi</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5 opacity-80">Nội dung câu hỏi</label>
                                <textarea
                                    required value={body} onChange={e => setBody(e.target.value)} rows="5"
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none"
                                    placeholder="Mô tả câu hỏi của bạn chi tiết..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5 opacity-80">Thẻ tag (nhấn Enter để thêm)</label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {tags.map(t => (
                                        <span key={t} className="flex items-center gap-1 text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full font-medium">
                                            {t}
                                            <button type="button" onClick={() => setTags(tags.filter(x => x !== t))}><X size={10} /></button>
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                    placeholder="VD: AI, Python..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">Hủy</button>
                            <button type="submit" disabled={isSubmitting} className="flex-1 py-3 font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors flex items-center justify-center gap-2">
                                {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                                Đăng câu hỏi
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default QAPage;
