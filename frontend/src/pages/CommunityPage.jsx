import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPosts } from '../store/slices/communitySlice';
import { communityApi } from '../api/communityApi';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, AlertTriangle, Download, ArrowLeft, UploadCloud, FileIcon, User, MessageSquare, Eye, Loader2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import ReportModal from '../components/ReportModal';

const CommunityPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { posts, isLoading } = useSelector(state => state.community);
    const { user } = useSelector(state => state.auth);

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [reportingPostId, setReportingPostId] = useState(null);
    const [uploadTitle, setUploadTitle] = useState("");
    const [uploadDesc, setUploadDesc] = useState("");
    const [uploadTags, setUploadTags] = useState("");
    const [uploadFile, setUploadFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // States for Document Content Preview Modal
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewFileName, setPreviewFileName] = useState("");
    const [previewFileContent, setPreviewFileContent] = useState("");
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    useEffect(() => {
        dispatch(fetchPosts());
    }, [dispatch]);

    useEffect(() => {
        if (location.state?.scrollToPostId && !isLoading && posts.length > 0) {
            const targetPostId = location.state.scrollToPostId;
            const timer = setTimeout(() => {
                const element = document.getElementById(`post-${targetPostId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('ring-4', 'ring-emerald-500', 'ring-offset-2', 'dark:ring-offset-zinc-950');
                    
                    // Auto open preview modal
                    const targetPostObj = posts.find(p => p.id === targetPostId);
                    if (targetPostObj && targetPostObj.storageUrl) {
                        handlePreviewFile(new Event('click'), targetPostObj.storageUrl, targetPostObj.fileName);
                    }

                    setTimeout(() => {
                        element.classList.remove('ring-4', 'ring-emerald-500', 'ring-offset-2', 'dark:ring-offset-zinc-950');
                    }, 3000);
                }
                
                // Clear state after execution inside the timeout callback
                navigate(location.pathname, { replace: true, state: {} });
            }, 300);
            
            return () => clearTimeout(timer);
        }
    }, [location.state, isLoading, posts, navigate]);

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
                autoChatMsg: "cho tôi biết nội dung chính của file này",
                importTimestamp: Date.now()
            }
        });
    };

    const handlePreviewFile = async (e, url, fileName) => {
        e.preventDefault();
        setIsLoadingPreview(true);
        setPreviewFileName(fileName);
        try {
            const res = await communityApi.previewFile(url);
            const apiRes = res;
            if (!apiRes.success) {
                throw new Error(apiRes.message || "Lỗi không xác định ở máy chủ.");
            }
            setPreviewFileContent(apiRes.data || "(Nội dung tệp rỗng)");
            setIsPreviewModalOpen(true);
        } catch (err) {
            console.error(err);
            toast.error("Không thể đọc tệp: " + (err.response?.data?.message || err.message));
        } finally {
            setIsLoadingPreview(false);
        }
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
            const tagsArray = uploadTags.split(',')
                .map(t => t.trim())
                .filter(t => t.length > 0);

            await communityApi.createPost({
                title: uploadTitle,
                description: uploadDesc,
                file_id: fileData.id,
                file_name: fileData.fileName,
                storage_url: fileData.storageUrl,
                tags: tagsArray
            });

            toast.success("Đã chia sẻ lên cộng đồng!");
            setIsUploadModalOpen(false);
            setUploadTitle("");
            setUploadDesc("");
            setUploadTags("");
            setUploadFile(null);
            await dispatch(fetchPosts()).unwrap();
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
                    <button onClick={() => navigate(-1)} className="p-2 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all">
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
                                <div id={`post-${post.id}`} key={post.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-emerald-500/50 transition-all flex flex-col group duration-300">
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
                                            {post.username ? post.username.split('@')[0] : '...'}
                                        </span>
                                        <span className="ml-auto opacity-60">{new Date(post.createdAt || post.created_at).toLocaleDateString('vi-VN')}</span>
                                    </div>

                                    <h3 className="font-bold text-lg mb-2 text-zinc-800 dark:text-zinc-100">{post.title}</h3>
                                    {post.tags && post.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {post.tags.map((tag, idx) => (
                                                <span key={idx} 
                                                      onClick={(e) => { e.stopPropagation(); navigate(`/search-users?q=${tag}&tab=posts`); }}
                                                      className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs rounded-md hover:bg-emerald-500/20 hover:text-emerald-500 transition-colors cursor-pointer">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 whitespace-pre-wrap flex-1 min-h-[60px]">
                                        {post.description}
                                    </p>

                                    <div 
                                        onClick={(e) => post.storageUrl && handlePreviewFile(e, post.storageUrl, post.fileName)}
                                        title="Click để xem nội dung tài liệu" 
                                        className={`bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex items-center justify-between mb-4 transition-all ${post.storageUrl ? 'cursor-pointer hover:bg-emerald-500/10 dark:hover:bg-emerald-500/5 hover:border-emerald-500/30' : ''}`}
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden text-emerald-600 dark:text-emerald-400">
                                            <FileIcon size={16} className="shrink-0" />
                                            <span className="text-xs font-semibold truncate">{post.fileName}</span>
                                        </div>
                                        {post.storageUrl && (
                                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 shrink-0 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500 hover:text-white transition-all">
                                                <Eye size={12} /> Xem tài liệu
                                            </span>
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
                        <h2 className="text-2xl font-bold mb-6">Chia sẻ với cộng đồng</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5 opacity-80">Tiêu đề</label>
                                <input
                                    type="text" required value={uploadTitle} onChange={e => setUploadTitle(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                    placeholder="Tóm tắt ngắn gọn..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5 opacity-80">Mô tả</label>
                                <textarea
                                    required value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} rows="3"
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none"
                                    placeholder="Giải thích tại sao tài liệu này hữu ích..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5 opacity-80">Tags (ngăn cách bằng dấu phẩy)</label>
                                <input
                                    type="text" value={uploadTags} onChange={e => setUploadTags(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                    placeholder="Ví dụ: dinh dưỡng, gạo lứt..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5 opacity-80">Tài liệu</label>
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
                                            <span className="text-sm">Click để duyệt hoặc kéo thả file</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-8">
                            <button type="button" onClick={() => setIsUploadModalOpen(false)} disabled={isSubmitting} className="flex-1 py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors">
                                Hủy
                            </button>
                            <button type="submit" disabled={isSubmitting} className="flex-1 py-3 px-4 font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors flex justify-center items-center gap-2">
                                {isSubmitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang đăng...</> : 'Công khai'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Preview Modal */}
            {isPreviewModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsPreviewModalOpen(false)}>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/90 pr-5">
                            <div>
                                <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                    <FileIcon size={20} className="text-emerald-500" />
                                    {previewFileName}
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Đang xem trước nội dung tài liệu</p>
                            </div>
                            <button onClick={() => setIsPreviewModalOpen(false)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-white p-2 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto bg-zinc-50 dark:bg-zinc-950/50 custom-scrollbar text-sm leading-relaxed whitespace-pre-wrap max-h-[55vh] font-mono text-zinc-800 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800">
                            {previewFileContent}
                        </div>
                        <div className="px-6 py-4 bg-white dark:bg-zinc-900 flex justify-end">
                            <button onClick={() => setIsPreviewModalOpen(false)} className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors shadow-sm">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Loading Spinner */}
            {isLoadingPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl flex items-center gap-3 border border-zinc-200 dark:border-zinc-800 shadow-xl">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                        <span className="text-sm font-semibold">Đang đọc dữ liệu tài liệu...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunityPage;
