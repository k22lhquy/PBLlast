import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { qaApi } from '../api/qaApi';
import { ArrowLeft, Heart, Send, ImageIcon, X } from 'lucide-react';
import { toast } from 'react-toastify';
import ReportModal from '../components/ReportModal';

const QADetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);

    const [question, setQuestion] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [answerBody, setAnswerBody] = useState('');
    const [answerImage, setAnswerImage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadAll = async () => {
        setIsLoading(true);
        try {
            const [qRes, aRes] = await Promise.all([
                qaApi.getQuestion(id),
                qaApi.getAnswers(id)
            ]);
            setQuestion(qRes.data);
            setAnswers(aRes.data || []);
        } catch { toast.error("Không thể tải dữ liệu"); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { loadAll(); }, [id]);

    const handleLike = async (answerId) => {
        try {
            await qaApi.likeAnswer(answerId);
            setAnswers(prev => prev.map(a => {
                if (a.id !== answerId) return a;
                const already = a.likes.includes(user?.user_id);
                const newLikes = already
                    ? a.likes.filter(l => l !== user?.user_id)
                    : [...a.likes, user?.user_id];
                return { ...a, likes: newLikes };
            }).sort((a, b) => b.likes.length - a.likes.length));
        } catch { toast.error("Thích thất bại"); }
    };

    const handleSubmitAnswer = async (e) => {
        e.preventDefault();
        if (!answerBody.trim()) return toast.error("Vui lòng viết câu trả lời");
        setIsSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('body', answerBody);
            if (answerImage) fd.append('image', answerImage);
            await qaApi.createAnswer(id, fd);
            toast.success("Đã đăng câu trả lời!");
            setAnswerBody('');
            setAnswerImage(null);
            loadAll();
        } catch { toast.error("Đăng câu trả lời thất bại"); }
        finally { setIsSubmitting(false); }
    };

    const handleReportQuestion = async (reason) => {
        await qaApi.reportQuestion(id, reason);
        toast.success('Báo cáo đã được gửi tới quản trị viên!');
    };

    if (isLoading) return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
            <ReportModal
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                onSubmit={handleReportQuestion}
                title="Báo cáo câu hỏi vi phạm"
            />
            <header className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur sticky top-0 z-10 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">Chi tiết câu hỏi</h1>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
                {/* Question block */}
                {question && (
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 shadow-lg text-white mb-8 relative overflow-hidden">
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-black opacity-10 rounded-full blur-xl"></div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-emerald-50 font-bold text-xs uppercase tracking-widest opacity-90">
                                    <span>Câu hỏi</span>
                                </div>
                                <button onClick={() => setIsReportOpen(true)} className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow transition-colors">
                                    Báo cáo
                                </button>
                            </div>
                            <p className="text-white text-2xl sm:text-3xl font-bold whitespace-pre-wrap mb-6 leading-tight drop-shadow-sm">{question.body}</p>
                            {question.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {question.tags.map(t => (
                                        <span key={t} 
                                              onClick={() => navigate(`/search-users?q=${t}&tab=qa`)}
                                              className="text-xs px-3 py-1 bg-white/20 backdrop-blur-md text-white rounded-full font-medium border border-white/20 shadow-sm hover:bg-white/30 cursor-pointer transition-all">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-sm text-emerald-50 font-medium">
                                <div 
                                    className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-white shadow-inner uppercase cursor-pointer hover:bg-white/30 transition-colors"
                                    onClick={() => navigate(`/user/${question.user_id}`)}
                                >
                                    {question.username?.split('@')[0].charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="flex flex-col">
                                    <span 
                                        className="cursor-pointer hover:underline transition-all"
                                        onClick={() => navigate(`/user/${question.user_id}`)}
                                    >{question.username?.split('@')[0]}</span>
                                    <span className="text-xs opacity-70">{new Date(question.created_at).toLocaleDateString('vi-VN')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Answers */}
                <div>
                    <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                        <span className="bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-md">{answers.length}</span> {answers.length === 1 ? 'Câu trả lời' : 'Câu trả lời'}
                    </h2>
                    <div className="space-y-4">
                        {answers.map((a, idx) => {
                            const isLiked = a.likes.includes(user?.user_id);
                            return (
                                <div key={a.id} className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 transition-all
                                    ${idx === 0 && answers.length > 0 ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-zinc-200 dark:border-zinc-800'}`}>
                                    {idx === 0 && answers.length > 1 && (
                                        <div className="text-xs font-semibold text-emerald-500 mb-2 flex items-center gap-1">
                                            ⭐ Câu trả lời được thích nhất
                                        </div>
                                    )}
                                    <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap mb-4">{a.body}</p>
                                    {a.image_url && (
                                        <div className="mb-4 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                                            <img src={a.image_url} alt="answer" className="max-h-80 object-contain w-full bg-zinc-50 dark:bg-zinc-950" />
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                            <span 
                                                className="hover:text-emerald-500 cursor-pointer font-medium transition-colors"
                                                onClick={() => navigate(`/user/${a.user_id}`)}
                                            >{a.username?.split('@')[0]}</span> 
                                            <span>·</span> 
                                            <span>{new Date(a.created_at).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <button
                                            onClick={() => handleLike(a.id)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                                                ${isLiked ? 'text-red-500 bg-red-500/10' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                                        >
                                            <Heart size={15} className={isLiked ? 'fill-current' : ''} /> {a.likes.length}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Write answer */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                    <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-4">Câu trả lời của bạn</h3>
                    <form onSubmit={handleSubmitAnswer} className="space-y-3">
                        <textarea
                            value={answerBody} onChange={e => setAnswerBody(e.target.value)} rows="4"
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none"
                            placeholder="Viết câu trả lời rõ ràng và hữu ích..."
                        />

                        {/* Image preview */}
                        {answerImage ? (
                            <div className="relative inline-block">
                                <img src={URL.createObjectURL(answerImage)} alt="preview" className="max-h-40 rounded-xl border border-zinc-200 dark:border-zinc-800 object-contain bg-zinc-50 dark:bg-zinc-950" />
                                <button type="button" onClick={() => setAnswerImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                                    <X size={12} />
                                </button>
                            </div>
                        ) : null}

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                <ImageIcon size={16} /> Đính kèm ảnh
                                <input type="file" accept="image/*" className="hidden" onChange={e => setAnswerImage(e.target.files[0])} />
                            </label>
                            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm transition-colors">
                                {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={15} />}
                                Gửi câu trả lời
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default QADetailPage;
