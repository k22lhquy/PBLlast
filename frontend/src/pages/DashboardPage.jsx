import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllConversations, createNewConversation, fetchMessages, setActiveConversationId, addMessageLocally, setSendingMessage, fetchConversationFiles, updateConversationTitleLocally } from '../store/slices/chatSlice';
import { logout } from '../store/slices/authSlice';
import { chatApi } from '../api/chatApi';
import { MessageSquare, Plus, LogOut, Send, Paperclip, Loader2, Bot, User, Trash2, FileText, Edit2 } from 'lucide-react';
import { toast } from 'react-toastify';

const DashboardPage = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { conversations, activeConversationId, messages, files, isSendingMessage } = useSelector(state => state.chat);

    const [inputMsg, setInputMsg] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [editingChatId, setEditingChatId] = useState(null);
    const [editingTitle, setEditingTitle] = useState("");
    const messagesEndRef = useRef(null);

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

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMsg.trim()) return;

        let targetConversationId = activeConversationId;
        const userMsg = inputMsg;
        setInputMsg("");

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
            dispatch(addMessageLocally({ role: "assistant", content: answer })); 

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
        <div className="h-screen w-screen bg-zinc-950 flex overflow-hidden font-sans">
            {/* Sidebar */}
            <div className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col transition-all duration-300">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
                        Nexus RAG
                    </h2>
                </div>

                <div className="p-4">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center gap-2 justify-center py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition-all border border-zinc-700 hover:border-zinc-600 shadow-sm"
                    >
                        <Plus size={18} />
                        <span className="font-medium">New Conversation</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {conversations.map((conv) => (
                        <div
                            key={conv.id}
                            onClick={() => dispatch(setActiveConversationId(conv.id))}
                            className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${activeConversationId === conv.id ? 'bg-emerald-600/20 border border-emerald-500/50 text-emerald-100' : 'bg-transparent hover:bg-zinc-800/50 border border-transparent text-zinc-400 hover:text-zinc-200'}`}
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
                                        className="flex-1 min-w-0 bg-zinc-950 text-sm font-medium text-zinc-200 border border-emerald-500 rounded px-2 py-0.5 outline-none"
                                    />
                                ) : (
                                    <span className="truncate text-sm font-medium">{conv.title || "New Chat"}</span>
                                )}
                            </div>
                            {editingChatId !== conv.id && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                                    <button
                                        onClick={(e) => handleStartRename(e, conv)}
                                        className="p-1 text-zinc-500 hover:text-emerald-400 transition-colors"
                                        title="Rename"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                                        className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm font-medium text-zinc-300 truncate max-w-[120px]">
                            {user?.username || 'User'}
                        </span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-zinc-950 relative">
                {/* Decorative splodges */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-emerald-900/10 blur-[120px] rounded-full pointer-events-none"></div>

                {(activeConversationId && messages.length > 0) ? (
                    <>
                        {/* Standard Message View */}
                        {/* Header */}
                        <div className="h-16 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur flex items-center px-6 z-10 shrink-0">
                            <h3 className="text-zinc-200 font-medium tracking-wide flex items-center gap-2">
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
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${isUser ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white' : 'bg-zinc-800 border border-zinc-700 text-emerald-400'}`}>
                                            {isUser ? <User size={16} /> : <Bot size={16} />}
                                        </div>
                                        <div className={`p-4 rounded-2xl max-w-[80%] shadow-sm ${isUser ? 'bg-emerald-600 text-white rounded-tr-sm' : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm'}`}>
                                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                                        </div>
                                    </div>
                                );
                            })}

                            {isSendingMessage && (
                                <div className="flex gap-4 max-w-4xl mx-auto flex-row">
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 text-emerald-400 flex items-center justify-center shrink-0">
                                        <Bot size={16} />
                                    </div>
                                    <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin text-emerald-400" />
                                        <span className="text-sm text-zinc-400">Processing complex query...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area (Bottom docked) */}
                        <div className="p-4 bg-gradient-to-t from-zinc-950 to-transparent shrink-0">
                            <div className="max-w-4xl mx-auto relative">
                                <form onSubmit={handleSendMessage} className="relative flex items-center bg-zinc-900 border border-zinc-700 rounded-2xl shadow-xl focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
                                    {/* Upload Button */}
                                    <div className="pl-2">
                                        <label className={`cursor-pointer p-3 flex items-center justify-center rounded-xl transition-colors ${isUploading ? 'text-emerald-400 pointer-events-none' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}>
                                            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
                                            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading || isSendingMessage} />
                                        </label>
                                    </div>

                                    <input
                                        type="text"
                                        value={inputMsg}
                                        onChange={(e) => setInputMsg(e.target.value)}
                                        disabled={isSendingMessage || isUploading}
                                        placeholder="Send a message to Nexus..."
                                        className="flex-1 bg-transparent border-none text-zinc-200 placeholder-zinc-500 text-sm px-4 py-4 focus:outline-none disabled:opacity-50"
                                    />

                                    <div className="pr-2">
                                        <button
                                            type="submit"
                                            disabled={!inputMsg.trim() || isSendingMessage || isUploading}
                                            className="p-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl transition-all flex items-center justify-center"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </form>
                                <p className="text-center text-xs text-zinc-600 mt-3 font-medium">Nexus RAG can make mistakes. Verify important information.</p>
                            </div>
                        </div>
                    </>
                ) : (
                    /* The Big Central Landing Page */
                    <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 w-full overflow-y-auto">
                        <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl flex items-center justify-center mb-10 transform hover:scale-105 transition-transform">
                            <Bot size={44} className="text-emerald-500" />
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-200 to-zinc-400 mb-10 text-center tracking-tight">How can I assist you today?</h2>

                        <div className="w-full max-w-3xl relative">
                            <form onSubmit={handleSendMessage} className="relative flex items-center bg-zinc-900/80 border border-zinc-700/80 rounded-2xl shadow-2xl focus-within:border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all p-2 backdrop-blur-sm">
                                {/* Upload Button */}
                                <div className="pl-3 py-2">
                                    <label className={`cursor-pointer p-3 flex items-center justify-center rounded-xl transition-colors ${isUploading ? 'text-emerald-400 pointer-events-none' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}>
                                        {isUploading ? <Loader2 size={24} className="animate-spin" /> : <Paperclip size={24} />}
                                        <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading || isSendingMessage} />
                                    </label>
                                </div>

                                <input
                                    type="text"
                                    value={inputMsg}
                                    onChange={(e) => setInputMsg(e.target.value)}
                                    disabled={isSendingMessage || isUploading}
                                    placeholder="Message Nexus or upload a file..."
                                    className="flex-1 bg-transparent border-none text-zinc-200 placeholder-zinc-500 text-lg sm:text-xl px-4 py-4 focus:outline-none disabled:opacity-50"
                                    autoFocus
                                />

                                <div className="pr-3 py-2">
                                    <button
                                        type="submit"
                                        disabled={!inputMsg.trim() || isSendingMessage || isUploading}
                                        className="p-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl transition-all flex items-center justify-center shadow-lg"
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
                <div className="w-72 bg-zinc-900 border-l border-zinc-800 flex flex-col transition-all duration-300 z-10">
                    <div className="h-16 border-b border-zinc-800 flex items-center px-4">
                        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                            <FileText size={16} /> Data Context
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {files.length === 0 ? (
                            <div className="text-center mt-6">
                                <div className="w-12 h-12 rounded-full bg-zinc-800 mx-auto flex items-center justify-center mb-3">
                                    <Paperclip size={20} className="text-zinc-500" />
                                </div>
                                <p className="text-sm text-zinc-400 font-medium">No files uploaded.</p>
                                <p className="text-xs text-zinc-500 mt-1">Upload a PDF or TXT to give the bot knowledge.</p>
                            </div>
                        ) : (
                            files.map(f => (
                                <div key={f.id} className="group relative bg-zinc-800 border border-zinc-700 p-3 rounded-xl flex items-start gap-3 hover:border-zinc-600 transition-colors">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 shrink-0">
                                        <FileText size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0 pr-6">
                                        <p className="text-sm font-medium text-zinc-200 truncate" title={f.fileName}>{f.fileName}</p>
                                        <p className="text-xs text-zinc-500 mt-1">{(f.fileSize / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteFile(f.id)}
                                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 bg-zinc-900 rounded-md text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-zinc-700"
                                        title="Delete File"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
