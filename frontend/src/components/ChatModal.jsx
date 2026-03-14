import { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useSocket } from '../context/SocketContext';
import api from '../utils/axiosInstance';

const ChatModal = ({ job, onClose }) => {
  const { user } = useSelector(s => s.auth);
  const { socket, joinJobRoom, leaveJobRoom, sendTyping, stopTyping } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  const otherName = user.role === 'client'
    ? (job.acceptedBy?.name || 'Worker')
    : (job.clientId?.name || 'Client');

  useEffect(() => {
    fetchMessages();
    joinJobRoom(job._id);

    if (socket) {
      socket.on('new_message', (msg) => {
        setMessages(prev => [...prev, msg]);
      });
      socket.on('user_typing', () => setOtherTyping(true));
      socket.on('user_stop_typing', () => setOtherTyping(false));
    }

    return () => {
      leaveJobRoom(job._id);
      socket?.off('new_message');
      socket?.off('user_typing');
      socket?.off('user_stop_typing');
    };
  }, [job._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTyping]);

  const fetchMessages = async () => {
    try {
      const { data } = await api.get(`/chat/${job._id}`);
      setMessages(data);
    } catch (e) {
      console.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    const msgText = text.trim();
    setText('');
    stopTyping(job._id);
    try {
      const { data } = await api.post(`/chat/${job._id}`, { text: msgText });
      setMessages(prev => [...prev, data]);
    } catch (e) {
      console.error('Send failed');
      setText(msgText);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    sendTyping(job._id, user.name);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => stopTyping(job._id), 1500);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md flex flex-col h-[600px] border border-gray-100 dark:border-slate-800 overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shrink-0">
            {otherName[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{otherName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{job.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all text-gray-400">
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-slate-950">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader size={24} className="animate-spin text-indigo-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle size={36} className="text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No messages yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Start the conversation!</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isMine = msg.senderId === user.id;
                return (
                  <motion.div key={msg._id || msg.createdAt} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isMine
                        ? 'bg-indigo-600 text-white rounded-br-md'
                        : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-white border border-gray-100 dark:border-slate-700 rounded-bl-md'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${isMine ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              {otherTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl rounded-bl-md px-4 py-2.5">
                    <div className="flex gap-1 items-center h-4">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex gap-2 items-end">
            <textarea
              value={text}
              onChange={handleTyping}
              onKeyDown={handleKey}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 resize-none border border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all max-h-24"
              style={{ minHeight: '44px' }}
            />
            <button onClick={handleSend} disabled={!text.trim() || sending}
              className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-95">
              {sending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatModal;
