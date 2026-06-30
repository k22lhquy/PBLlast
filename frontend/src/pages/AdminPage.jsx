import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/adminApi';
import { ShieldAlert, Trash2, Edit2, Users, FileText, Settings, ArrowLeft, X, Eye, AlertTriangle, Ban, Unlock } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const AdminPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalQuestions: 0 });
    const [users, setUsers] = useState([]);
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [userContent, setUserContent] = useState({ posts: [], questions: [], loading: false });

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [statsRes, usersRes, reportsRes] = await Promise.all([
                adminApi.getStats(),
                adminApi.getUsers(),
                adminApi.getReportedContent()
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
            setReports(reportsRes.data || []);
        } catch (error) {
            toast.error("Không thể tải dữ liệu quản trị");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return; // Wait for fetchMe to populate user
        
        if (user.isAdmin) {
            loadData();
        } else {
            toast.error("Bạn không có quyền truy cập trang này!");
            navigate('/');
        }
    }, [user]);

    const handleToggleBlockUser = async (userId, isBlocked) => {
        const actionText = isBlocked ? "bỏ chặn" : "chặn";
        if (!window.confirm(`Bạn có chắc muốn ${actionText} người dùng này?`)) return;
        try {
            await adminApi.toggleBlockUser(userId, !isBlocked);
            toast.success(`Đã ${actionText} tài khoản thành công`);
            loadData();
        } catch (e) { toast.error("Thao tác thất bại"); }
    };

    const handleViewUser = async (userObj) => {
        setSelectedUser(userObj);
        setUserContent({ posts: [], questions: [], loading: true });
        try {
            const [postsRes, qRes] = await Promise.all([
                adminApi.getUserPosts(userObj.id),
                adminApi.getUserQuestions(userObj.id)
            ]);
            setUserContent({ posts: postsRes.data || [], questions: qRes.data || [], loading: false });
        } catch (e) {
            toast.error("Không thể tải nội dung người dùng");
            setUserContent({ posts: [], questions: [], loading: false });
        }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center p-12 text-zinc-500 bg-zinc-950">Đang tải trang quản trị...</div>;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col p-6">
            <header className="mb-8 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-4">
                    <ShieldAlert className="text-red-500" size={32} />
                    <h1 className="text-3xl font-bold">Trung Tâm Quản Trị</h1>
                </div>
                <button 
                    onClick={() => {
                        dispatch(logout());
                        navigate('/admin-login');
                    }}
                    className="p-2 px-4 bg-zinc-200 hover:bg-red-500 hover:text-white dark:bg-zinc-800 dark:hover:bg-red-500 rounded-xl transition flex items-center gap-2 font-medium text-zinc-600 dark:text-white"
                >
                    Đăng xuất
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center"><Users size={24} /></div>
                    <div><p className="text-sm text-zinc-500">Tổng người dùng</p><p className="text-2xl font-bold">{stats.totalUsers}</p></div>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center"><FileText size={24} /></div>
                    <div><p className="text-sm text-zinc-500">Bài đăng cộng đồng</p><p className="text-2xl font-bold">{stats.totalPosts}</p></div>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center"><Settings size={24} /></div>
                    <div><p className="text-sm text-zinc-500">Câu hỏi Q&A</p><p className="text-2xl font-bold">{stats.totalQuestions}</p></div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    <h2 className="font-bold text-lg">Danh sách người dùng</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 uppercase">
                            <tr>
                                <th className="p-4 font-semibold">Tên</th>
                                <th className="p-4 font-semibold">Email</th>
                                <th className="p-4 font-semibold">Vai trò</th>
                                <th className="p-4 font-semibold">Nội dung (Bài / Q&A)</th>
                                <th className="p-4 font-semibold">Token đã dùng</th>
                                <th className="p-4 font-semibold">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                                    <td className="p-4 font-medium">{u.name}</td>
                                    <td className="p-4 text-zinc-500">{u.email}</td>
                                    <td className="p-4">
                                        {u.isAdmin ? (
                                            <span className="bg-red-500/10 text-red-500 px-2 flex items-center gap-1 py-1 rounded inline-flex text-xs font-bold leading-none"><ShieldAlert size={12}/> Admin</span>
                                        ) : u.isBlocked ? (
                                            <span className="bg-amber-500/10 text-amber-500 px-2 flex items-center gap-1 py-1 rounded inline-flex text-xs font-bold leading-none"><Ban size={12}/> Đã chặn</span>
                                        ) : (
                                            <span className="text-zinc-500">Người dùng</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className="text-blue-500 mr-2">{u.postsCount} Bài</span>
                                        <span className="text-purple-500">{u.questionsCount} Q&A</span>
                                    </td>
                                    <td className="p-4 text-emerald-500 font-bold">
                                        {u.tokensUsed?.toLocaleString() || 0}
                                    </td>
                                    <td className="p-4 flex gap-2">
                                        <button onClick={() => handleViewUser(u)} className="p-2 bg-zinc-100 hover:bg-emerald-500 hover:text-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded transition" title="Xem hồ sơ"><Eye size={16} /></button>
                                        {!u.isAdmin && (
                                            <button 
                                                onClick={() => handleToggleBlockUser(u.id, u.isBlocked)} 
                                                className={`p-2 rounded transition ${
                                                    u.isBlocked 
                                                        ? 'bg-amber-500/20 hover:bg-amber-500 hover:text-white text-amber-600 dark:text-amber-400' 
                                                        : 'bg-zinc-100 hover:bg-red-500 hover:text-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                                }`}
                                                title={u.isBlocked ? "Bỏ chặn đăng bài/Q&A" : "Chặn đăng bài/Q&A"}
                                            >
                                                {u.isBlocked ? <Unlock size={16} /> : <Ban size={16} />}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Reported Content Section */}
            <div className="mt-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden mb-8">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-red-50 dark:bg-red-900/10 flex items-center justify-between">
                    <h2 className="font-bold text-lg text-red-600 dark:text-red-400 flex items-center gap-2">
                        <ShieldAlert size={20} /> Nội dung bị báo cáo
                    </h2>
                    <span className="bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 py-1 px-3 rounded-full text-xs font-bold">
                        {reports.length} chờ xử lý
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 uppercase">
                            <tr>
                                <th className="p-4 font-semibold">Loại</th>
                                <th className="p-4 font-semibold">Số báo cáo</th>
                                <th className="p-4 font-semibold">Tác giả</th>
                                <th className="p-4 font-semibold">Nội dung</th>
                                <th className="p-4 font-semibold">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {reports.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-zinc-500">Chưa có nội dung vi phạm nào được báo cáo. Tốt lắm!</td></tr>
                            ) : reports.map(r => (
                                <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-bold rounded ${r.type === 'POST' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                                            {r.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-red-500 font-bold flex items-center gap-1">
                                        {r.reportCount} <AlertTriangle size={14} />
                                    </td>
                                    <td className="p-4">{r.author}</td>
                                    <td className="p-4">
                                        <div className="max-w-xs md:max-w-md truncate whitespace-nowrap">{r.content}</div>
                                    </td>
                                    <td className="p-4 flex gap-2">
                                        <button 
                                            onClick={async () => {
                                                if(!window.confirm("Xóa vĩnh viễn nội dung này?")) return;
                                                try {
                                                    if(r.type === 'POST') await adminApi.deletePost(r.id);
                                                    else await adminApi.deleteQuestion(r.id);
                                                    toast.success("Đã xóa nội dung vi phạm");
                                                    loadData();
                                                } catch(e) { toast.error("Xóa thất bại"); }
                                            }}
                                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition"
                                        >
                                            Xóa nội dung
                                        </button>
                                        <button
                                            onClick={() => setSelectedReport(r)}
                                            className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded text-xs font-medium transition"
                                        >
                                            Kiểm tra
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    Hồ sơ: {selectedUser.name}
                                    {selectedUser.isAdmin && <ShieldAlert size={18} className="text-red-500" />}
                                </h2>
                                <p className="text-zinc-500 text-sm">{selectedUser.email} • Token đã dùng: <span className="font-bold text-emerald-500">{selectedUser.tokensUsed?.toLocaleString() || 0}</span></p>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl transition">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 bg-zinc-50 dark:bg-zinc-950/50">
                            {userContent.loading ? (
                                <div className="text-center p-12 text-zinc-500">Đang tải nội dung người dùng...</div>
                            ) : (
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><FileText size={18}/> Bài đăng ({userContent.posts.length})</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {userContent.posts.length === 0 ? <p className="text-zinc-500 text-sm">Chưa có bài đăng nào.</p> : userContent.posts.map(p => (
                                                <div key={p.id} className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
                                                    <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-1 line-clamp-1">{p.title}</h4>
                                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">{p.description}</p>
                                                    <p className="text-xs text-zinc-400 mt-2">{new Date(p.createdAt).toLocaleDateString('vi-VN')}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Settings size={18}/> Câu hỏi Q&A ({userContent.questions.length})</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {userContent.questions.length === 0 ? <p className="text-zinc-500 text-sm">Chưa đặt câu hỏi nào.</p> : userContent.questions.map(q => (
                                                <div key={q.id} className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
                                                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-2 line-clamp-3">{q.body}</p>
                                                    <p className="text-xs text-zinc-400">{new Date(q.created_at).toLocaleDateString('vi-VN')} • {q.answer_count} câu trả lời</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Report Investigate Modal */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
                                <AlertTriangle size={20} /> Kiểm tra nội dung bị báo cáo
                            </h2>
                            <button onClick={() => setSelectedReport(null)} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4">
                                <span className={`px-2 py-1 text-xs font-bold rounded ${selectedReport.type === 'POST' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                                    {selectedReport.type === 'POST' ? 'Bài đăng' : 'Câu hỏi'}
                                </span>
                                <span className="ml-3 text-sm text-zinc-500 font-medium">Tác giả: <span className="text-zinc-800 dark:text-zinc-200">{selectedReport.author}</span></span>
                                <span className="ml-3 text-sm text-zinc-500 font-medium">Lượt báo cáo: <span className="text-red-500 font-bold">{selectedReport.reportCount}</span></span>
                            </div>
                            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 mb-6">
                                <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">{selectedReport.content}</p>
                            </div>
                            
                            {selectedReport.reasons && selectedReport.reasons.length > 0 && (
                                <div className="mb-6 max-h-40 overflow-y-auto">
                                    <h3 className="font-bold text-sm text-zinc-500 uppercase tracking-widest mb-3">Lý do báo cáo</h3>
                                    <div className="space-y-2">
                                        {selectedReport.reasons.map((r, i) => (
                                            <div key={i} className="flex gap-2 text-sm bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                                                <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                                <span className="text-zinc-800 dark:text-zinc-200">{r}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 justify-end border-t border-zinc-200 dark:border-zinc-800 pt-6">
                                <button onClick={() => setSelectedReport(null)} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl font-semibold transition">Đóng</button>
                                <button 
                                    onClick={async () => {
                                        if(!window.confirm("Xóa vĩnh viễn nội dung này?")) return;
                                        try {
                                            if(selectedReport.type === 'POST') await adminApi.deletePost(selectedReport.id);
                                            else await adminApi.deleteQuestion(selectedReport.id);
                                            toast.success("Đã xóa nội dung vi phạm");
                                            setSelectedReport(null);
                                            loadData();
                                        } catch(e) { toast.error("Xóa thất bại"); }
                                    }}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition flex items-center gap-2"
                                >
                                    <Trash2 size={16} /> Xóa nội dung
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
