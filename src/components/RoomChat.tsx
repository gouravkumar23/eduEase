"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, query, where, orderBy, onSnapshot, addDoc, 
  serverTimestamp, doc, updateDoc, limit, getDocs 
} from 'firebase/firestore';
import { Send, X, MessageSquare, Megaphone, Lock, Unlock, Loader2, Paperclip, FileText, Download, BookOpen, Maximize2, Eye, ShieldCheck, Mail } from 'lucide-react';
import MaterialPicker from './MaterialPicker';
import DocumentPreview from './DocumentPreview';
import { notifyEvent } from '../utils/notifications';
import { templates } from '../utils/emailTemplates';

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  role: string;
  text: string;
  type: 'message' | 'announcement' | 'material';
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  materialId?: string;
  materialTitle?: string;
  materialSubject?: string;
  timestamp: any;
}

interface RoomChatProps {
  roomId: string;
  roomName: string;
  role: 'faculty' | 'student' | 'admin';
  onClose: () => void;
  isInline?: boolean;
}

export default function RoomChat({ roomId, roomName, role, onClose, isInline = false }: RoomChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomData, setRoomData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [previewFile, setPreviewFile] = useState<{url: string, type: string, name: string} | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const roomRef = doc(db, 'rooms', roomId);
    const unsubscribeRoom = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        setRoomData({ id: docSnap.id, ...docSnap.data() });
      }
    });

    const q = query(
      collection(db, 'room_messages'),
      where('roomId', '==', roomId),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribeMessages = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Message[]);
      setLoading(false);
    });

    return () => {
      unsubscribeRoom();
      unsubscribeMessages();
    };
  }, [roomId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const isOwner = user?.id === roomData?.faculty_id;
  const chatEnabled = roomData?.chatEnabled === true;

  const handleSend = async (type: 'message' | 'announcement' | 'material' = 'message', extraData?: any) => {
    if (!user || (!newMessage.trim() && !extraData) || sending) return;
    
    if (role === 'student' && !chatEnabled) return;

    setSending(true);
    try {
      const messageText = newMessage.trim();
      await addDoc(collection(db, 'room_messages'), {
        roomId,
        senderId: user.id,
        senderName: user.name,
        role: role,
        text: messageText,
        type,
        ...(extraData || {}),
        timestamp: serverTimestamp()
      });

      if (type === 'announcement' && sendEmail) {
        const membersQ = query(collection(db, 'room_members'), where('room_id', '==', roomId));
        const membersSnap = await getDocs(membersQ);
        const memberIds = membersSnap.docs
          .map(d => d.data().student_id)
          .filter(id => id !== user.id);
        
        if (memberIds.length > 0) {
          await notifyEvent({
            type: 'info',
            title: `New Announcement: ${roomName}`,
            message: messageText,
            userIds: memberIds,
            emailPayload: {
              subject: `Update in ${roomName}`,
              html: templates.roomAnnouncement(roomName, messageText, roomId)
            },
            link: `/room/${roomId}`
          });
        }
      }

      setNewMessage('');
    } catch (error) {
      console.error('Send error:', error);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      
      await handleSend('message', {
        fileUrl: data.secure_url,
        fileType: file.type,
        fileName: file.name
      });
    } catch (error) {
      alert('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleShareMaterial = (material: any) => {
    handleSend('material', {
      materialId: material.id,
      materialTitle: material.title,
      materialSubject: material.subject,
      fileUrl: material.fileURL,
      fileName: material.fileName,
      fileType: material.fileType || 'application/pdf'
    });
    setShowMaterialPicker(false);
  };

  const toggleChat = async () => {
    if (!isOwner) return;
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        chatEnabled: !chatEnabled
      });
    } catch (error) {
      alert('Failed to update chat settings');
    }
  };

  const renderMessageContent = (msg: Message) => {
    const isMe = msg.senderId === user?.id;

    if (msg.type === 'material') {
      return (
        <div className={`mt-2 p-4 rounded-2xl border-2 flex flex-col gap-3 ${
          isMe ? 'bg-white/10 border-white/20' : 'bg-indigo-50 border-indigo-100'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl ${isMe ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
              <FileText size={24} className={isMe ? 'text-white' : 'text-indigo-600'} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-black truncate ${isMe ? 'text-white' : 'text-slate-900'}`}>
                {msg.materialTitle}
              </p>
              <p className={`text-[10px] font-bold flex items-center gap-1 mt-0.5 ${isMe ? 'text-indigo-100' : 'text-slate-500'}`}>
                <BookOpen size={10} /> {msg.materialSubject}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setPreviewFile({ url: msg.fileUrl!, type: msg.fileType!, name: msg.fileName! })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                isMe ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              <Eye size={14} /> Preview
            </button>
            <a 
              href={msg.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`p-2 rounded-xl transition-colors ${
                isMe ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Download size={16} />
            </a>
          </div>
        </div>
      );
    }

    if (msg.fileUrl) {
      const isImage = msg.fileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.fileName || '');
      
      return (
        <div className="mt-2 flex flex-col gap-2">
          <div className="relative group rounded-xl overflow-hidden border border-slate-100 bg-slate-50 max-h-64">
            {isImage ? (
              <img 
                src={msg.fileUrl} 
                alt={msg.fileName} 
                className="max-w-full h-auto max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setPreviewFile({ url: msg.fileUrl!, type: msg.fileType!, name: msg.fileName! })}
              />
            ) : (
              <div className="p-6 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isMe ? 'bg-white/20' : 'bg-indigo-50'}`}>
                  <FileText size={20} className={isMe ? 'text-white' : 'text-indigo-600'} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold truncate ${isMe ? 'text-white' : 'text-slate-900'}`}>{msg.fileName}</p>
                  <p className={`text-[9px] uppercase font-bold ${isMe ? 'text-indigo-100' : 'text-slate-400'}`}>{msg.fileType?.split('/')[1] || 'FILE'}</p>
                </div>
              </div>
            )}
            <button 
              onClick={() => setPreviewFile({ url: msg.fileUrl!, type: msg.fileType!, name: msg.fileName! })}
              className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-bold text-xs"
            >
              <Maximize2 size={16} /> Open Preview
            </button>
          </div>
          <a 
            href={msg.fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-2 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all ${
              isMe ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Download size={12} /> Download
          </a>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`flex flex-col overflow-hidden ${isInline ? 'h-full' : 'bg-white rounded-3xl shadow-2xl max-w-2xl w-full h-[80vh] animate-in fade-in zoom-in duration-200'}`}>
      {previewFile && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-6xl h-[90vh] relative">
            <DocumentPreview 
              fileUrl={previewFile.url}
              fileName={previewFile.name}
              fileType={previewFile.type}
              onClose={() => setPreviewFile(null)}
            />
          </div>
        </div>
      )}

      {!isInline && (
        <div className="bg-indigo-600 p-4 sm:p-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{roomName} Chat</h3>
              <p className="text-indigo-100 text-xs">
                {chatEnabled ? 'Student chat enabled' : 'Student chat disabled'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <button 
                onClick={toggleChat}
                className={`p-2 rounded-xl transition-all ${chatEnabled ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`}
                title={chatEnabled ? 'Disable Student Chat' : 'Enable Student Chat'}
              >
                {chatEnabled ? <Unlock size={18} /> : <Lock size={18} />}
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50 scroll-smooth">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4">
              <MessageSquare size={40} className="opacity-20" />
            </div>
            <p className="text-sm font-bold">No messages yet</p>
            <p className="text-xs mt-1">Be the first to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            const isFaculty = msg.role === 'faculty';
            
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {!isMe && (
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {msg.senderName}
                    </span>
                    {isFaculty && (
                      <span className="flex items-center gap-1 text-[8px] font-black px-1.5 py-0.5 rounded bg-indigo-600 text-white uppercase">
                        <ShieldCheck size={8} /> Faculty
                      </span>
                    )}
                  </div>
                )}
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm relative ${
                  msg.type === 'announcement' 
                    ? 'bg-amber-50 border-2 border-amber-200 text-amber-900 w-full text-center' 
                    : isMe 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                }`}>
                  {msg.type === 'announcement' && (
                    <div className="flex items-center justify-center gap-2 mb-2 text-[10px] font-black uppercase text-amber-600 tracking-widest">
                      <Megaphone size={14} /> Official Announcement
                    </div>
                  )}
                  {msg.text && <p className="leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>}
                  {renderMessageContent(msg)}
                  <div className={`text-[9px] mt-2 font-bold opacity-60 ${isMe ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 sm:p-6 border-t bg-white shrink-0">
        {role === 'student' && !chatEnabled ? (
          <div className="bg-amber-50 p-4 rounded-2xl border border-dashed border-amber-200 flex flex-col items-center justify-center gap-2 text-amber-700 text-center animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest">
              <Lock size={16} /> Chat Disabled
            </div>
            <p className="text-[10px] font-medium opacity-80">
              The faculty has restricted student messaging in this room. You can still receive announcements and materials.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 items-end">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex gap-1">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || sending}
                  className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all disabled:opacity-50"
                  title="Attach File"
                >
                  {uploading ? <Loader2 className="animate-spin" size={20} /> : <Paperclip size={20} />}
                </button>
                {role === 'faculty' && (
                  <button 
                    onClick={() => setShowMaterialPicker(true)}
                    disabled={sending}
                    className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all"
                    title="Share Material"
                  >
                    <FileText size={20} />
                  </button>
                )}
              </div>
              <textarea 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 bg-slate-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none min-h-[48px] max-h-32"
                rows={1}
              />
              <button 
                onClick={() => handleSend()}
                disabled={(!newMessage.trim() && !uploading) || sending}
                className="bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 shrink-0"
              >
                {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              </button>
            </div>
            {role === 'faculty' && (
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${sendEmail ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={sendEmail} 
                      onChange={(e) => setSendEmail(e.target.checked)} 
                    />
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${sendEmail ? 'translate-x-4' : ''}`} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                    <Mail size={10} /> Send Email Notification
                  </span>
                </label>
                <button 
                  onClick={() => handleSend('announcement')}
                  disabled={!newMessage.trim() || sending || uploading}
                  className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 hover:text-amber-700 uppercase tracking-widest"
                >
                  <Megaphone size={14} />
                  Send as Announcement
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showMaterialPicker && (
        <MaterialPicker 
          onSelect={handleShareMaterial} 
          onClose={() => setShowMaterialPicker(false)} 
        />
      )}
    </div>
  );
}