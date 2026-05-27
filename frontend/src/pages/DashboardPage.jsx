import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllConversations, createNewConversation, fetchMessages, setActiveConversationId, addMessageLocally, setSendingMessage, fetchConversationFiles, updateConversationTitleLocally } from '../store/slices/chatSlice';
import { logout } from '../store/slices/authSlice';
import { toggleThemeAsync } from '../store/slices/themeSlice';
import { chatApi } from '../api/chatApi';
import { MessageSquare, Plus, LogOut, Send, Paperclip, Loader2, Bot, User, Trash2, FileText, Edit2, Info, X, Sun, Moon, Globe, HelpCircle, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';

const HighlightedChunk = ({ chunkText, answerText }) => {
    if (!chunkText) return null;
    if (!answerText) return <p className="text-zinc-700 dark:text-zinc-300">{chunkText}</p>;

    const stopWords = new Set([
        "trong", "người", "những", "nhiều", "được", "không", "cùng", "rằng", "thực", "hiện",
        "trên", "dưới", "ngoài", "bằng", "theo", "đang", "từng", "cũng", "định", "phải",
        "nhưng", "khác", "nào", "mới", "với", "cho", "của", "các", "một", "như", "này",
        "đó", "nọ", "kia", "đây", "rất", "quá", "lắm", "hơn", "nhất", "làm", "sao", "thế",
        "thì", "mà", "là", "nếu", "có", "tại", "sẽ", "đã", "vẫn", "chưa", "về", "ra", "vào"
    ]);

    const getKeywords = (text) => {
        return text.toLowerCase()
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .split(/\s+/)
            .filter(w => w.length >= 2 && !stopWords.has(w));
    };

    const answerWords = new Set(getKeywords(answerText));
    const paragraphs = chunkText.split(/\n+/);

    let maxScore = 0;
    const scoredParagraphs = paragraphs.map(para => {
        if (!para.trim()) return { text: para, sentences: [] };
        const sentences = para.match(/[^.!?\n]+[.!?\n]*\s*/g) || [para];
        const scoredSentences = sentences.map(s => {
            const sWords = getKeywords(s);
            let count = 0;
            sWords.forEach(w => { if (answerWords.has(w)) count++; });
            if (count > maxScore) maxScore = count;
            return { text: s, score: count };
        });
        return { text: para, sentences: scoredSentences };
    });

    const threshold = Math.max(3, maxScore * 0.5); // Must have at least 3 keyword overlaps to prevent random highlights
    const globalHasHighlight = maxScore >= 3;

    return (
        <>
            {scoredParagraphs.map((para, pIdx) => {
                if (para.sentences.length === 0) return null;
                return (
                    <p key={pIdx} className="mb-3 last:mb-0 text-zinc-700 dark:text-zinc-300">
                        {para.sentences.map((s, sIdx) => {
                            if (!globalHasHighlight) {
                                return <span key={sIdx}>{s.text}</span>;
                            }
                            if (s.score >= threshold) {
                                return <span key={sIdx} className="bg-emerald-500/20 text-emerald-100 rounded px-1 -mx-0.5 font-medium transition-all">{s.text}</span>;
                            } else {
                                return <span key={sIdx} className="text-zinc-500 dark:text-zinc-500 dark:text-zinc-600">{s.text}</span>;
                            }
                        })}
                    </p>
                );
            })}
        </>
    );
};

const DashboardPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector(state => state.auth);
    const { conversations, activeConversationId, messages, files, isSendingMessage } = useSelector(state => state.chat);
    const { isDark } = useSelector(state => state.theme);

    const [inputMsg, setInputMsg] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [editingChatId, setEditingChatId] = useState(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [selectedSource, setSelectedSource] = useState(null);
    const messagesEndRef = useRef(null);
    const importTriggeredRef = useRef(false);

    // Intercept Community imports
    useEffect(() => {
        if (location.state?.autoChatMsg && location.state?.importFileId && !importTriggeredRef.current) {
            importTriggeredRef.current = true;
            const msg = location.state.autoChatMsg;
            const importId = location.state.importFileId;
            navigate('.', { replace: true, state: {} }); // Clear state

            const startNewChatAndImport = async () => {
                try {
                    // Let initial mounts and fetchAllConversations finish to prevent State Reversion
                    await new Promise(resolve => setTimeout(resolve, 800));

                    toast.info("Initializing context vault...", { autoClose: 2000 });

                    const newChatAction = await dispatch(createNewConversation()).unwrap();
                    const newId = newChatAction.id;

                    await chatApi.importCommunityFile(newId, importId);
                    dispatch(fetchConversationFiles(newId));
                    toast.success("Document imported successfully!");

                    setTimeout(() => {
                        handleSendMessage(null, msg, newId);
                    }, 500);
                } catch (err) {
                    console.error(err);
                    toast.error("Failed to initialize import session: " + (err.message || "Unknown error"));
                }
            };
            startNewChatAndImport();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state, navigate, dispatch]);

    // Initial load
    useEffect(() => {
        dispatch(fetchAllConversations());
    }, [dispatch]);

    // Fetch messages when active conversation changes
    useEffect(() => {
        if (activeConversationId) {
            dispatch(fetchMessages(activeConversationId));
            dispatch(fetchConversationFiles(activeConversationId));
        }
    }, [activeConversationId, dispatch]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleNewChat = () => {
        dispatch(createNewConversation());
    };

    const handleLogout = () => {
        dispatch(logout());
    };

    const handleDeleteConversation = async (id, e) => {
        e.stopPropagation();
        try {
            await chatApi.deleteConversation(id);
            toast.success("Conversation deleted");
            dispatch(fetchAllConversations());
        } catch {
            toast.error("Could not delete conversation");
        }
    }

    const handleStartRename = (e, conv) => {
        e.stopPropagation();
        setEditingChatId(conv.id);
        setEditingTitle(conv.title || "New Chat");
    };

    const handleFinishRename = async (e, convId) => {
        if (e) e.stopPropagation();
        const finalTitle = editingTitle.trim() || "New Chat";

        // Optimistic UI updates
        dispatch(updateConversationTitleLocally({ id: convId, title: finalTitle }));
        setEditingChatId(null);

        try {
            await chatApi.renameConversation(convId, finalTitle);
        } catch {
            toast.error("Could not rename conversation");
            dispatch(fetchAllConversations()); // Revert on failure
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        let targetConversationId = activeConversationId;
        setIsUploading(true);

        if (!targetConversationId) {
            try {
                const res = await chatApi.newChat();
                targetConversationId = res.data.id;
                dispatch(fetchAllConversations());
                dispatch(setActiveConversationId(targetConversationId));
            } catch {
                toast.error("Could not create conversation for file upload.");
                setIsUploading(false);
                e.target.value = null;
                return;
            }
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("conversation_id", targetConversationId);

        try {
            await chatApi.uploadFile(formData, targetConversationId);
            toast.success(`File ${file.name} uploaded & embedded successfully!`);
            dispatch(fetchConversationFiles(targetConversationId));
        } catch (err) {
            toast.error(err.message || "Failed to upload file");
        } finally {
            setIsUploading(false);
            e.target.value = null; // reset
        }
    };

    const handleSendMessage = async (e, overrideMsg = null, forceConvId = null) => {
        if (e) e.preventDefault();
        const userMsg = overrideMsg || inputMsg;
        if (!userMsg.trim()) return;

        let targetConversationId = forceConvId || activeConversationId;
        if (!overrideMsg) setInputMsg("");

        if (!targetConversationId) {
            dispatch(setSendingMessage(true));
            try {
                const res = await chatApi.newChat();
                targetConversationId = res.data.id;
                dispatch(fetchAllConversations());
                dispatch(setActiveConversationId(targetConversationId));
            } catch {
                toast.error("Could not create conversation automatically");
                dispatch(setSendingMessage(false));
                return;
            }
        }

        // Optimistic UI updates
        dispatch(addMessageLocally({ role: "user", content: userMsg }));
        dispatch(setSendingMessage(true));

        try {
            const isFirstMessage = messages.length === 0;
            const res = await chatApi.sendMessage(targetConversationId, userMsg);
            const answer = res.data.answer || "";
            const sources = res.data.sources || [];
            dispatch(addMessageLocally({ role: "assistant", content: answer, sources: sources }));

            // Auto-rename logic for the first message
            if (isFirstMessage && answer) {
                const words = answer.trim().split(/\s+/);
                const firstFewWords = words.slice(0, 5).join(' ');
                const newTitle = firstFewWords + (words.length > 5 ? '...' : '');

                chatApi.renameConversation(targetConversationId, newTitle).catch(console.error);
                dispatch(updateConversationTitleLocally({ id: targetConversationId, title: newTitle }));
            }

        } catch (err) {
            toast.error("Failed to send message: " + err.message);
        } finally {
            dispatch(setSendingMessage(false));
        }
    }

    const handleDeleteFile = async (fileId) => {
        if (!confirm("Are you sure you want to delete this embedded file?")) return;
        try {
            await chatApi.deleteFile(fileId);
            toast.success("File deleted");
            dispatch(fetchConversationFiles(activeConversationId));
        } catch {
            toast.error("Could not delete file");
        }
    };

    return (
        <div className="h-screen w-screen bg-zinc-50 dark:bg-zinc-950 flex overflow-hidden font-sans">
            {/* Sidebar */}
            <div className="w-80 bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-all duration-300">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
                        Nexus RAG
                    </h2>
                </div>

                <div className="p-4 flex flex-col gap-2">
                    <div className="grid grid-cols-2 bg-zinc-200/50 dark:bg-zinc-950/50 p-1 rounded-xl mb-2 gap-0.5">
                        <button onClick={() => navigate('/')} className="py-1.5 text-xs font-semibold bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 rounded-lg shadow-sm flex items-center justify-center gap-1">
                            <MessageSquare size={12} /> Nhắn tin
                        </button>
                        <button onClick={() => navigate('/community')} className="py-1.5 text-xs font-semibold hover:bg-white hover:shadow-sm dark:hover:bg-zinc-800 text-zinc-600 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 rounded-lg transition-all flex items-center justify-center gap-1">
                            <Globe size={12} /> Chia sẻ
                        </button>
                        <button onClick={() => navigate('/qa')} className="py-1.5 text-xs font-semibold hover:bg-white hover:shadow-sm dark:hover:bg-zinc-800 text-zinc-600 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 rounded-lg transition-all flex items-center justify-center gap-1">
                            <HelpCircle size={12} /> Hỏi & Đáp
                        </button>
                        <button onClick={() => navigate('/search-users')} className="py-1.5 text-xs font-semibold hover:bg-white hover:shadow-sm dark:hover:bg-zinc-800 text-zinc-600 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 rounded-lg transition-all flex items-center justify-center gap-1">
                            <Search size={12} /> Tìm kiếm
                        </button>
                    </div>

                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center gap-2 justify-center py-3 px-4 bg-white dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl transition-all border border-zinc-300 dark:border-zinc-700 hover:border-zinc-600 shadow-sm"
                    >
                        <Plus size={18} />
                        <span className="font-medium">Tin nhắn mới</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {conversations.map((conv) => (
                        <div
                            key={conv.id}
                            onClick={() => dispatch(setActiveConversationId(conv.id))}
                            className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${activeConversationId === conv.id ? 'bg-emerald-600/20 border border-emerald-500/50 text-emerald-100' : 'bg-transparent hover:bg-white dark:bg-zinc-800/50 border border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200'}`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                <MessageSquare size={18} className="shrink-0" />
                                {editingChatId === conv.id ? (
                                    <input
                                        type="text"
                                        value={editingTitle}
                                        onChange={(e) => setEditingTitle(e.target.value)}
                                        onBlur={(e) => handleFinishRename(e, conv.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleFinishRename(e, conv.id);
                                            if (e.key === 'Escape') setEditingChatId(null);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        autoFocus
                                        className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-950 text-sm font-medium text-zinc-800 dark:text-zinc-200 border border-emerald-500 rounded px-2 py-0.5 outline-none"
                                    />
                                ) : (
                                    <span className="truncate text-sm font-medium">{conv.title || "Đoạn chat mới"}</span>
                                )}
                            </div>
                            {editingChatId !== conv.id && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                                    <button
                                        onClick={(e) => handleStartRename(e, conv)}
                                        className="p-1 text-zinc-500 dark:text-zinc-500 hover:text-emerald-400 transition-colors"
                                        title="Đổi tên"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                                        className="p-1 text-zinc-500 dark:text-zinc-500 hover:text-red-400 transition-colors"
                                        title="Xóa"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-100 dark:bg-zinc-900/50">
                    <div
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 p-2 -ml-2 rounded-xl transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {user?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]">
                            {user?.username || user?.email?.split('@')[0] || 'User'}
                        </span>
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={() => dispatch(toggleThemeAsync())}
                            className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 hover:bg-white dark:bg-zinc-800 rounded-lg transition-colors"
                            title="Đổi giao diện"
                        >
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-red-500 hover:bg-white dark:bg-zinc-800 rounded-lg transition-colors"
                            title="Đăng xuất"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 relative">
                {/* Decorative splodges */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-emerald-900/10 blur-[120px] rounded-full pointer-events-none"></div>

                {(activeConversationId && messages.length > 0) ? (
                    <>
                        {/* Standard Message View */}
                        {/* Header */}
                        <div className="h-16 border-b border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-950/80 backdrop-blur flex items-center px-6 z-10 shrink-0">
                            <h3 className="text-zinc-800 dark:text-zinc-200 font-medium tracking-wide flex items-center gap-2">
                                <Bot size={20} className="text-emerald-400" />
                                Interactive AI Workspace
                            </h3>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar">
                            {messages.map((msg, index) => {
                                const isUser = msg.role === 'user';
                                return (
                                    <div key={index} className={`flex gap-4 max-w-4xl mx-auto ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${isUser ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white' : 'bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-emerald-400'}`}>
                                            {isUser ? <User size={16} /> : <Bot size={16} />}
                                        </div>
                                        <div className={`p-4 rounded-2xl max-w-[80%] shadow-sm ${isUser ? 'bg-emerald-600 text-white rounded-tr-sm' : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-sm'}`}>
                                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>

                                            {/* RAG Citations Rendering */}
                                            {msg.sources && msg.sources.length > 0 && (
                                                <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800/50 flex flex-wrap gap-2">
                                                    {msg.sources.map((src, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => setSelectedSource({ ...src, index: i + 1, answer: msg.content })}
                                                            className="text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-white dark:bg-zinc-800 hover:text-emerald-400 hover:border-emerald-500/30 transition-all font-medium"
                                                        >
                                                            <Info size={12} />
                                                            [{i + 1}] {src.file_name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {isSendingMessage && (
                                <div className="flex gap-4 max-w-4xl mx-auto flex-row">
                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-emerald-400 flex items-center justify-center shrink-0">
                                        <Bot size={16} />
                                    </div>
                                    <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-sm flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin text-emerald-400" />
                                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Processing complex query...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area (Bottom docked) */}
                        <div className="p-4 bg-gradient-to-t from-zinc-950 to-transparent shrink-0">
                            <div className="max-w-4xl mx-auto relative">
                                <form onSubmit={handleSendMessage} className="relative flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-2xl shadow-xl focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
                                    {/* Upload Button */}
                                    <div className="pl-2">
                                        <label className={`cursor-pointer p-3 flex items-center justify-center rounded-xl transition-colors ${isUploading ? 'text-emerald-400 pointer-events-none' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 hover:bg-white dark:bg-zinc-800'}`}>
                                            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
                                            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading || isSendingMessage} />
                                        </label>
                                    </div>

                                    <input
                                        type="text"
                                        value={inputMsg}
                                        onChange={(e) => setInputMsg(e.target.value)}
                                        disabled={isSendingMessage || isUploading}
                                        placeholder="Nhập tin nhắn..."
                                        className="flex-1 bg-transparent border-none text-zinc-800 dark:text-zinc-200 placeholder-zinc-500 text-sm px-4 py-4 focus:outline-none disabled:opacity-50"
                                    />

                                    <div className="pr-2">
                                        <button
                                            type="submit"
                                            disabled={!inputMsg.trim() || isSendingMessage || isUploading}
                                            className="p-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-white dark:bg-zinc-800 disabled:text-zinc-500 dark:text-zinc-500 dark:text-zinc-600 text-white rounded-xl transition-all flex items-center justify-center"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </form>
                                <p className="text-center text-xs text-zinc-500 dark:text-zinc-500 dark:text-zinc-600 mt-3 font-medium">Nexus RAG có thể mắc lỗi. Vui lòng kiểm tra lại các thông tin quan trọng.</p>
                            </div>
                        </div>
                    </>
                ) : (
                    /* The Big Central Landing Page */
                    <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 w-full overflow-y-auto">
                        <div className="w-20 h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl flex items-center justify-center mb-10 transform hover:scale-105 transition-transform">
                            <Bot size={44} className="text-emerald-500" />
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-200 to-zinc-400 mb-10 text-center tracking-tight">Hôm nay tôi có thể giúp gì cho bạn?</h2>

                        <div className="w-full max-w-3xl relative">
                            <form onSubmit={handleSendMessage} className="relative flex items-center bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700/80 rounded-2xl shadow-2xl focus-within:border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all p-2 backdrop-blur-sm">
                                {/* Upload Button */}
                                <div className="pl-3 py-2">
                                    <label className={`cursor-pointer p-3 flex items-center justify-center rounded-xl transition-colors ${isUploading ? 'text-emerald-400 pointer-events-none' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 hover:bg-white dark:bg-zinc-800'}`}>
                                        {isUploading ? <Loader2 size={24} className="animate-spin" /> : <Paperclip size={24} />}
                                        <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading || isSendingMessage} />
                                    </label>
                                </div>

                                <input
                                    type="text"
                                    value={inputMsg}
                                    onChange={(e) => setInputMsg(e.target.value)}
                                    disabled={isSendingMessage || isUploading}
                                    placeholder="Nhập tin nhắn hoặc tải tệp lên..."
                                    className="flex-1 bg-transparent border-none text-zinc-800 dark:text-zinc-200 placeholder-zinc-500 text-lg sm:text-xl px-4 py-4 focus:outline-none disabled:opacity-50"
                                    autoFocus
                                />

                                <div className="pr-3 py-2">
                                    <button
                                        type="submit"
                                        disabled={!inputMsg.trim() || isSendingMessage || isUploading}
                                        className="p-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-white dark:bg-zinc-800 disabled:text-zinc-500 dark:text-zinc-500 dark:text-zinc-600 text-white rounded-xl transition-all flex items-center justify-center shadow-lg"
                                    >
                                        <Send size={22} className={isSendingMessage ? 'animate-pulse' : ''} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Sidebar - Uploaded Files */}
            {activeConversationId && (
                <div className="w-72 bg-zinc-100 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col transition-all duration-300 z-10">
                    <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4">
                        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                            <FileText size={16} /> Dữ liệu ngữ cảnh
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {files.length === 0 ? (
                            <div className="text-center mt-6">
                                <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 mx-auto flex items-center justify-center mb-3">
                                    <Paperclip size={20} className="text-zinc-500 dark:text-zinc-500" />
                                </div>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Chưa có tệp nào được tải lên.</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Tải lên PDF hoặc TXT để cung cấp thêm ngữ cảnh cho bot.</p>
                            </div>
                        ) : (
                            files.map(f => (
                                <div key={f.id} className="group relative bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 p-3 rounded-xl flex items-start gap-3 hover:border-zinc-600 transition-colors">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 shrink-0">
                                        <FileText size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0 pr-6">
                                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate" title={f.fileName}>{f.fileName}</p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">{(f.fileSize / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteFile(f.id)}
                                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-zinc-300 dark:border-zinc-700"
                                        title="Xóa tệp"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Citation Context Modal */}
            {selectedSource && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedSource(null)}>
                    <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-100 dark:bg-zinc-900/90 backdrop-blur">
                            <div>
                                <h3 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                                    <FileText size={18} />
                                    {selectedSource.file_name}
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Source context extracted via Semantic Search [{selectedSource.index}]</p>
                            </div>
                            <button onClick={() => setSelectedSource(null)} className="text-zinc-600 dark:text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white dark:bg-zinc-800 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto bg-zinc-50 dark:bg-zinc-950/80 custom-scrollbar text-sm leading-relaxed font-mono">
                            <div className="p-5 border-l-4 border-emerald-500 bg-emerald-500/5 text-emerald-100 rounded-r-xl">
                                <HighlightedChunk chunkText={selectedSource.content} answerText={selectedSource.answer} />
                            </div>
                        </div>
                        <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex justify-between items-center">
                            <span className="text-xs text-zinc-500 dark:text-zinc-500 flex items-center gap-1"><Info size={12} /> Exact document snippet retrieved by Reranking model</span>
                            <button onClick={() => setSelectedSource(null)} className="text-xs font-semibold px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg transition-colors">Close Viewer</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default DashboardPage;
