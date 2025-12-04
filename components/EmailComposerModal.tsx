import React, { useState } from 'react';
import Icon from './Icon';
import { ICONS } from '../constants/icons';

interface EmailComposerModalProps {
    show: boolean;
    onClose: () => void;
    recipientEmail: string;
    subject: string;
    body: string;
    onSend: () => void;
}

const EmailComposerModal: React.FC<EmailComposerModalProps> = ({ show, onClose, recipientEmail, subject, body, onSend }) => {
    const [emailBody, setEmailBody] = useState(body);

    if (!show) return null;

    const handleSend = () => {
        const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
        window.location.href = mailtoLink;
        onSend();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl animate-fade-in-down" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-black">E-Mail senden</h2>
                        <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800">
                            <Icon path={ICONS.xMark} className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="space-y-4 text-black">
                        <div>
                            <label className="text-sm font-medium">An:</label>
                            <p className="p-2 bg-gray-100 rounded mt-1">{recipientEmail}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Betreff:</label>
                            <p className="p-2 bg-gray-100 rounded mt-1">{subject}</p>
                        </div>
                        <div>
                             <label htmlFor="emailBody" className="text-sm font-medium">Nachricht:</label>
                             <textarea
                                id="emailBody"
                                value={emailBody}
                                onChange={(e) => setEmailBody(e.target.value)}
                                rows={10}
                                className="w-full p-2 bg-gray-100 rounded mt-1 border border-gray-300 focus:ring-violet-500 focus:border-violet-500"
                            />
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">
                        Abbrechen
                    </button>
                    <button onClick={handleSend} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
                        <Icon path={ICONS.email} className="w-5 h-5"/>
                        Senden
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailComposerModal;
