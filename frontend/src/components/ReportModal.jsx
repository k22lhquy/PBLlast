import React, { useState } from 'react';
import { X, AlertTriangle, Send } from 'lucide-react';

const PRESET_REASONS = [
    'Nội dung phản cảm / tục tĩu',
    'Spam hoặc quảng cáo',
    'Thông tin sai lệch / giả mạo',
    'Quấy rối hoặc bắt nạt',
    'Vi phạm bản quyền',
    'Khác',
];

const ReportModal = ({ isOpen, onClose, onSubmit, title = 'Báo cáo nội dung vi phạm' }) => {
    const [selected, setSelected] = useState('');
    const [custom, setCustom] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const reason = selected === 'Khác' ? custom.trim() : selected;

    const handleSubmit = async () => {
        if (!reason) return;
        setIsSubmitting(true);
        try {
            await onSubmit(reason);
            setSelected('');
            setCustom('');
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-red-50 dark:bg-red-900/10">
                    <h2 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2 text-base">
                        <AlertTriangle size={18} />
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-zinc-500 hover:text-red-500 transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-3">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Chọn lý do báo cáo:</p>
                    <div className="grid grid-cols-1 gap-2">
                        {PRESET_REASONS.map(r => (
                            <button
                                key={r}
                                onClick={() => setSelected(r)}
                                className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium border transition-all
                                    ${selected === r
                                        ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/20'
                                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/10'
                                    }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>

                    {selected === 'Khác' && (
                        <textarea
                            autoFocus
                            value={custom}
                            onChange={e => setCustom(e.target.value)}
                            placeholder="Mô tả lý do của bạn..."
                            rows={3}
                            className="w-full mt-2 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 transition"
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-semibold transition">
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!reason || isSubmitting}
                        className="px-4 py-2 text-sm rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center gap-2 transition"
                    >
                        <Send size={15} />
                        {isSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportModal;
