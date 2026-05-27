import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPosts } from '../store/slices/communitySlice';
import { communityApi } from '../api/communityApi';
import { useNavigate } from 'react-router-dom';
import { Heart, AlertTriangle, Download, ArrowLeft, UploadCloud, FileIcon, User, MessageSquare } from 'lucide-react';
import { toast } from 'react-toastify';
import ReportModal from '../components/ReportModal';

const CommunityPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { posts, isLoading } = useSelector(state => state.community);
    const { user } = useSelector(state => state.auth);

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [reportingPostId, setReportingPostId] = useState(null);
    const [uploadTitle, setUploadTitle] = useState("");
    const [uploadDesc, setUploadDesc] = useState("");
    const [uploadFile, setUploadFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        dispatch(fetchPosts());
    }, [dispatch]);

    const handleLike = async (postId) => {
        try {
            await communityApi.toggleLike(postId);
            dispatch(fetchPosts());
        } catch {
            toast.error("Thích thất bại");
        }
    };

    const handleReport = async (reason) => {
        if (!reportingPostId) return;
        await communityApi.reportPost(reportingPostId, reason);
        toast.success('Báo cáo đã được gửi tới quản trị viên!');
        setReportingPostId(null);
    };

    const handleQueryFile = (postId, fileId) => {
        // We will send state to Dashboard which will pick it up and trigger import
        navigate('/', {
            state: {
                importFileId: fileId,
                autoChatMsg: "cho tôi biết nội dung chính của file này"
            }
        });
    };

    const handleSubmitPost = async (e) => {
        e.preventDefault();
        if (!uploadFile) return toast.error("Vui lòng chọn file để chia sẻ");
        setIsSubmitting(true);
        try {
            const fd = new FormData();
            fd.append("file", uploadFile);
            const uploadRes = await communityApi.uploadCommunityFile(fd);
            const fileData = uploadRes.data;
            await communityApi.createPost({
                title: uploadTitle,
                description: uploadDesc,
                file_id: fileData.id,
                file_name: fileData.fileName,
                storage_url: fileData.storageUrl
            });

            toast.success("Đã chia sẻ lên cộng đồng!");
            setIsUploadModalOpen(false);
            setUploadTitle("");
            setUploadDesc("");
            setUploadFile(null);
            dispatch(fetchPosts());
        } catch (err) {
            toast.error(err.message || "Tải file thất bại");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 flex flex-col">
            <ReportModal
                isOpen={!!reportingPostId}
                onClose={() => setReportingPostId(null)}
                onSubmit={handleReport}
                title="Báo cáo bài đăng vi phạm"
            />

            {/* Header */}
            <header className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="p-2 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
                            Cộng đồng chia sẻ
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Khám phá và hỏi AI về tài liệu cộng đồng</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
                >
                    <UploadCloud size={18} />
                    <span>Chia sẻ tài liệu</span>
                </button>
            </header>

            {/* Main Feed */}
            <main className="flex-1 max-w-[95%] w-full mx-auto p-6 space-y-6 overflow-y-auto">
                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center p-12 text-zinc-500 border border-zinc-200 dark:border-zinc-800 border-dashed rounded-2xl">
                        <UploadCloud size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Chưa có tài liệu nào được chia sẻ. Hãy là người đầu tiên!</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-5 max-w-screen-xl mx-auto w-full">
                        {posts.map(post => {
                            const isLiked = post.likes.includes(user?.user_id);
                            return (
                                <div key={post.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-emerald-500/50 transition-all flex flex-col group">
                                    <div className="flex items-center gap-2 mb-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                        <div 
                                            className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center cursor-pointer hover:bg-emerald-500/40 transition-colors"
                                            onClick={(e) => { e.stopPropagation(); navigate(`/user/${post.userId}`); }}
                                        >
                                            <User size={12} />
                                        </div>
                                        <span 
                                            className="hover:text-emerald-500 cursor-pointer transition-colors"
                                            onClick={(e) => { e.stopPropagation(); navigate(`/user/${post.userId}`); }}
                                        >
                                            @{post.username}
                                        </span>
                                        <span className="ml-auto opacity-60">{new Date(post.createdAt || post.created_at).toLocaleDateString('vi-VN')}</span>
                                    </div>

                                    <h3 className="font-bold text-lg mb-2 text-zinc-800 dark:text-zinc-100">{post.title}</h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 whitespace-pre-wrap flex-1 min-h-[60px]">
                                        {post.description}
                                    </p>

                                    <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 overflow-hidden text-emerald-600 dark:text-emerald-400">
                                            <FileIcon size={16} className="shrink-0" />
                                            <span className="text-xs font-semibold truncate">{post.fileName}</span>
                                        </div>
                                        {post.storageUrl && (
                                            <a href={post.storageUrl} target="_blank" rel="noreferrer" title="Download Document" className="p-1.5 bg-zinc-200/50 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg transition-colors">
                                                <Download size={14} />
                                            </a>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-1 text-sm font-medium">
                                            <button
                                                onClick={() => handleLike(post.id)}
                                                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${isLiked ? 'text-red-500 bg-red-500/10' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                                            >
                                                <Heart size={16} className={isLiked ? 'fill-current' : ''} /> {post.likes.length}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleQueryFile(post.id, post.fileId)}
                                                className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                                                title="Duplicate into your private chat"
                                            >
                                                <MessageSquare size={14} /> Hỏi AI
                                            </button>
                                            <button onClick={() => setReportingPostId(post.id)} className="p-1.5 text-zinc-400 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-colors" title="Báo cáo">
                                                <AlertTriangle size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <form onSubmit={handleSubmitPost} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
                        <h2 className="text-2xl font-bold mb-6">Share with Community</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5 opacity-80">Title</label>
                                <input
                                    type="text" required value={uploadTitle} onChange={e => setUploadTitle(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                    placeholder="Brief summary..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5 opacity-80">Description</label>
                                <textarea
                                    required value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} rows="3"
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none"
                                    placeholder="Explain why this document is useful..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5 opacity-80">Document</label>
                                <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-4 text-center hover:border-emerald-500 transition-colors bg-zinc-50 dark:bg-zinc-950 relative">
                                    <input
                                        type="file" required onChange={e => setUploadFile(e.target.files[0])}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    {uploadFile ? (
                                        <div className="flex items-center justify-center gap-2 text-emerald-500 font-semibold">
                                            <FileIcon size={20} /> {uploadFile.name}
                                        </div>
                                    ) : (
                                        <div className="text-zinc-500">
                                            <UploadCloud size={24} className="mx-auto mb-2 opacity-50" />
                                            <span className="text-sm">Click to browse or drag file</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-8">
                            <button type="button" onClick={() => setIsUploadModalOpen(false)} disabled={isSubmitting} className="flex-1 py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={isSubmitting} className="flex-1 py-3 px-4 font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors flex justify-center items-center gap-2">
                                {isSubmitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Posting...</> : 'Publish'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default CommunityPage;
