import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import messageService from '../services/messageService';
import fileService from '../services/fileService';
import { useAuth } from '../context/AuthContext';
import './Messages.css';

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉', '✅', '❌'];

const Messages = () => {
    const { user: currentUser } = useAuth();
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('project');

    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [sending, setSending] = useState(false);
    
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showPollModal, setShowPollModal] = useState(false);
    const [pollData, setPollData] = useState({ question: '', options: ['', ''] });
    const [activeReactionMessage, setActiveReactionMessage] = useState(null);
    
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const menuRef = useRef(null);

    // Fetch conversations on mount
    useEffect(() => {
        fetchConversations();
    }, []);

    // Handle project query param
    useEffect(() => {
        const initProjectChat = async () => {
            if (projectId) {
                try {
                    const res = await messageService.getProjectConversation(projectId);
                    if (res.success && res.data) {
                        setSelectedConversation(res.data);
                        fetchMessages(res.data._id);
                    }
                } catch (error) {
                    console.error('Error getting project conversation:', error);
                }
            }
        };

        if (projectId && !loading) {
            initProjectChat();
        }
    }, [projectId, loading]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowAttachmentMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const res = await messageService.getConversations();
            if (res.success) {
                setConversations(res.data);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (conversationId) => {
        try {
            setMessagesLoading(true);
            const res = await messageService.getMessages(conversationId);
            if (res.success) {
                setMessages(res.data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setMessagesLoading(false);
        }
    };

    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
        fetchMessages(conversation._id);
    };

    const handleAttachmentClick = (type) => {
        if (type === 'poll') {
            setShowPollModal(true);
        } else {
            let accept = '*/*';
            if (type === 'document') accept = '.pdf,.doc,.docx,.txt';
            if (type === 'media') accept = 'image/*';
            if (fileInputRef.current) {
                fileInputRef.current.accept = accept;
                fileInputRef.current.removeAttribute('capture');
                fileInputRef.current.click();
            }
        }
        setShowAttachmentMenu(false);
    };

    const handleSendPoll = async () => {
        if (!pollData.question || pollData.options.filter(o => o.trim()).length < 2) return;
        
        setSending(true);
        try {
            const formattedPoll = {
                question: pollData.question,
                options: pollData.options.filter(o => o.trim()).map(o => ({ text: o.trim(), votes: [] }))
            };
            const res = await messageService.send(selectedConversation._id, '', null, formattedPoll);
            if (res.success) {
                setMessages(prev => [...prev, res.data]);
                setShowPollModal(false);
                setPollData({ question: '', options: ['', ''] });
                fetchConversations();
            }
        } catch (error) {
            console.error('Error sending poll:', error);
            alert('Failed to send poll');
        } finally {
            setSending(false);
            setTimeout(scrollToBottom, 100);
        }
    };

    const handleVotePoll = async (messageId, optionId) => {
        try {
            const res = await messageService.votePoll(messageId, optionId);
            if (res.success) {
                setMessages(prev => prev.map(m => m._id === messageId ? res.data : m));
            }
        } catch (error) {
            console.error('Error voting on poll:', error);
        }
    };

    const handleReactToMessage = async (messageId, emoji) => {
        try {
            const res = await messageService.reactToMessage(messageId, emoji);
            if (res.success) {
                setMessages(prev => prev.map(m => m._id === messageId ? res.data : m));
                setActiveReactionMessage(null);
            }
        } catch (error) {
            console.error('Error reacting to message:', error);
        }
    };

    const insertEmoji = (emoji) => {
        setNewMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachment) || !selectedConversation || sending) return;

        setSending(true);
        try {
            let attachmentId = null;
            if (attachment) {
                const uploadRes = await fileService.upload(attachment);
                if (uploadRes.success) {
                    attachmentId = uploadRes.data._id;
                }
            }

            const res = await messageService.send(selectedConversation._id, newMessage, attachmentId);
            if (res.success) {
                setMessages([...messages, res.data]);
                setNewMessage('');
                setAttachment(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                fetchConversations();
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        } finally {
            setSending(false);
            setTimeout(scrollToBottom, 100);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getMemberColor = (id) => {
        if (!id) return '#6b7280';
        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#ff8484', '#f97316', '#eab308', '#22c55e', '#14b8a6'];
        let hash = 0;
        const strId = id.toString();
        for (let i = 0; i < strId.length; i++) {
            hash = strId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const getConversationName = (conv) => {
        if (conv.project?.name) return conv.project.name;
        if (conv.isGroup) return conv.name || 'Group Chat';
        const myId = String(currentUser?.id || currentUser?._id || '');
        const other = conv.participants.find(p => String(p._id || p.id) !== myId);
        return other?.name || 'Unknown User';
    };

    const getConversationAvatar = (conv) => {
        if (conv.project) return null;
        if (conv.isGroup) return null;
        const myId = String(currentUser?.id || currentUser?._id || '');
        const other = conv.participants.find(p => String(p._id || p.id) !== myId);
        return other?.avatar;
    };

    return (
        <div className="page messages-page">
            <Navbar />
            <div className="messages-container">
                <div className={`messages-sidebar ${selectedConversation ? 'mobile-hidden' : ''}`}>
                    <div className="sidebar-header">
                        <h2>Messages</h2>
                        <button className="btn-icon" title="New Message">✏️</button>
                    </div>
                    {loading ? (
                        <div className="loading-spinner">Loading...</div>
                    ) : (
                        <div className="conversations-list">
                            {conversations.map(conv => (
                                <div
                                    key={conv._id}
                                    className={`conversation-item ${selectedConversation?._id === conv._id ? 'active' : ''}`}
                                    onClick={() => handleSelectConversation(conv)}
                                >
                                    <div className="conversation-avatar" style={{ background: conv.project?.color || (conv.isGroup ? '#6366f1' : getMemberColor(getConversationAvatar(conv))) }}>
                                        {conv.project ? '📁' : (conv.isGroup ? '👥' : (
                                            getConversationAvatar(conv) ?
                                                <img src={getConversationAvatar(conv)} alt="" /> :
                                                getInitials(getConversationName(conv))
                                        ))}
                                    </div>
                                    <div className="conversation-info">
                                        <div className="conversation-name">{getConversationName(conv)}</div>
                                        <div className="conversation-preview">
                                            {conv.lastMessage ? (
                                                conv.lastMessage.content ? conv.lastMessage.content :
                                                conv.lastMessage.poll ? '📊 Poll' :
                                                conv.lastMessage.attachment ? '📎 Attachment' :
                                                'No messages yet'
                                            ) : 'No messages yet'}
                                        </div>
                                    </div>
                                    <div className="conversation-meta">
                                        {conv.lastMessage && (
                                            <span className="time">{formatTime(conv.lastMessage.createdAt)}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={`chat-area ${!selectedConversation ? 'mobile-hidden' : ''}`}>
                    {selectedConversation ? (
                        <>
                            <div className="chat-header">
                                <button className="back-button mobile-only" onClick={() => setSelectedConversation(null)}>
                                    ←
                                </button>
                                <div className="chat-header-info">
                                    <h3>{getConversationName(selectedConversation)}</h3>
                                    {selectedConversation.isGroup && (
                                        <p>{selectedConversation.participants.length} members</p>
                                    )}
                                </div>
                            </div>

                            <div className="chat-messages">
                                {messagesLoading ? (
                                    <div className="chat-loading">
                                        <div className="spinner"></div>
                                        <p>Loading messages...</p>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="chat-no-messages">
                                        <p>No messages yet. Start the conversation!</p>
                                    </div>
                                ) : (
                                    messages.map((message, index) => {
                                        const getSenderId = (msg) => msg.sender?._id || msg.sender?.id || msg.sender;
                                        const senderId = getSenderId(message);
                                        const prevSenderId = index > 0 ? getSenderId(messages[index - 1]) : null;

                                        const getSenderName = (msg) => {
                                            if (msg.sender?.name) return msg.sender.name;
                                            const participant = selectedConversation?.participants?.find(p =>
                                                String(p._id || p.id) === String(senderId)
                                            );
                                            return participant?.name || 'Unknown';
                                        };

                                        const currentUserId = currentUser.id || currentUser._id;
                                        const isOwn = String(senderId) === String(currentUserId);
                                        const showAvatar = index === 0 || prevSenderId !== senderId;
                                        const senderName = getSenderName(message);

                                        return (
                                            <div
                                                key={message._id}
                                                className={`message ${isOwn ? 'message-own' : 'message-other'}`}
                                            >
                                                {!isOwn && showAvatar && (
                                                    <div
                                                        className="message-avatar"
                                                        style={{ background: getMemberColor(senderId) }}
                                                    >
                                                        {message.sender?.avatar ? (
                                                            <img src={message.sender.avatar} alt={senderName} />
                                                        ) : (
                                                            getInitials(senderName)
                                                        )}
                                                    </div>
                                                )}
                                                <div className="message-content">
                                                    {showAvatar && (
                                                        <span className="message-sender">
                                                            {isOwn ? 'You' : senderName}
                                                        </span>
                                                    )}
                                                    <div
                                                        className="message-bubble"
                                                        style={!isOwn ? {
                                                            background: getMemberColor(senderId),
                                                        } : {}}
                                                    >
                                                        {message.attachment && (
                                                            <div className="message-attachment" style={{ marginBottom: message.content ? '8px' : '0' }}>
                                                                {message.attachment.mimeType?.startsWith('image/') ? (
                                                                    <img 
                                                                        src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/${message.attachment.filename}`} 
                                                                        alt="Attachment" 
                                                                        style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '4px', cursor: 'pointer' }}
                                                                        onClick={() => window.open(`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/${message.attachment.filename}`, '_blank')}
                                                                    />
                                                                ) : (
                                                                    <a 
                                                                        href={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/${message.attachment.filename}`} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', textDecoration: 'underline' }}
                                                                    >
                                                                        📄 {message.attachment.originalName}
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}
                                                        {message.content && <div>{message.content}</div>}
                                                        
                                                        {message.poll && (
                                                            <div className="message-poll">
                                                                <strong className="poll-question">📊 {message.poll.question}</strong>
                                                                <div className="poll-options">
                                                                    {message.poll.options.map(opt => {
                                                                        const totalVotes = message.poll.options.reduce((sum, o) => sum + (o.votes?.length || 0), 0);
                                                                        const pct = totalVotes > 0 ? Math.round(((opt.votes?.length || 0) / totalVotes) * 100) : 0;
                                                                        const userVoted = opt.votes?.some(v => String(v._id || v) === String(currentUserId));
                                                                        return (
                                                                            <div 
                                                                                key={opt._id} 
                                                                                className={`poll-option ${userVoted ? 'voted' : ''}`}
                                                                                onClick={() => handleVotePoll(message._id, opt._id)}
                                                                            >
                                                                                <div className="poll-option-progress" style={{ width: `${pct}%` }} />
                                                                                <span className="poll-option-text">{opt.text}</span>
                                                                                <span className="poll-option-meta">{opt.votes?.length || 0} ({pct}%)</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        <button 
                                                            className="message-react-action"
                                                            onClick={() => setActiveReactionMessage(activeReactionMessage === message._id ? null : message._id)}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="12" cy="12" r="10"></circle>
                                                                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                                                                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                                                                <line x1="15" y1="9" x2="15.01" y2="9"></line>
                                                            </svg>
                                                        </button>

                                                        {activeReactionMessage === message._id && (
                                                            <div className="reaction-picker-popup">
                                                                {COMMON_EMOJIS.map(emoji => (
                                                                    <button 
                                                                        key={emoji} 
                                                                        className="reaction-emoji-btn"
                                                                        onClick={() => handleReactToMessage(message._id, emoji)}
                                                                    >
                                                                        {emoji}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {message.reactions && message.reactions.length > 0 && (
                                                        <div className={`message-reactions ${isOwn ? 'own' : 'other'}`}>
                                                            {message.reactions.map(reaction => (
                                                                <div 
                                                                    key={reaction.emoji} 
                                                                    className={`reaction-badge ${reaction.users.some(u => String(u._id || u) === String(currentUserId)) ? 'voted' : ''}`}
                                                                    onClick={() => handleReactToMessage(message._id, reaction.emoji)}
                                                                >
                                                                    <span>{reaction.emoji}</span>
                                                                    <span className="reaction-count">{reaction.users.length}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <span className="message-time">
                                                        {formatTime(message.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="chat-input-container">
                                {attachment && (
                                    <div className="attachment-preview">
                                        <div className="attachment-info">
                                            <span>📎</span>
                                            <span className="filename">{attachment.name}</span>
                                        </div>
                                        <button className="remove-btn" onClick={() => { setAttachment(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}>✕</button>
                                    </div>
                                )}
                                <form className="chat-input-form" onSubmit={handleSendMessage}>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        style={{ display: 'none' }} 
                                        onChange={handleFileSelect}
                                    />
                                    
                                    <button 
                                        type="button" 
                                        className="btn-icon" 
                                        onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                                        title="Attach"
                                    >
                                        📎
                                    </button>

                                    {showAttachmentMenu && (
                                        <div className="attachment-menu-popup" ref={menuRef}>
                                            <div className="attachment-menu-item" onClick={() => handleAttachmentClick('document')}>
                                                <div className="attachment-icon">📄</div>
                                                <span>Document</span>
                                            </div>
                                            <div className="attachment-menu-item" onClick={() => handleAttachmentClick('media')}>
                                                <div className="attachment-icon">🖼️</div>
                                                <span>Photos</span>
                                            </div>
                                            <div className="attachment-menu-item" onClick={() => handleAttachmentClick('poll')}>
                                                <div className="attachment-icon">📊</div>
                                                <span>Poll</span>
                                            </div>
                                        </div>
                                    )}

                                    <button 
                                        type="button" 
                                        className="btn-icon" 
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        title="Emoji"
                                    >
                                        😀
                                    </button>

                                    {showEmojiPicker && (
                                        <div className="emoji-picker-container">
                                            {COMMON_EMOJIS.map(emoji => (
                                                <button 
                                                    key={emoji} 
                                                    className="emoji-btn"
                                                    onClick={() => insertEmoji(emoji)}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <input
                                        type="text"
                                        className="chat-input"
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                    />

                                    <button type="submit" className="chat-send-btn" disabled={sending} title="Send Message">
                                        {sending ? (
                                            <div className="spinner-sm"></div>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                            </svg>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="no-chat-selected">
                            <div className="empty-state-icon">💬</div>
                            <h3>Select a conversation</h3>
                            <p>Choose a chat from the sidebar or start a new one.</p>
                        </div>
                    )}
                </div>
            </div>

            {showPollModal && (
                <div className="modal-overlay" onClick={() => setShowPollModal(false)}>
                    <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create Poll</h2>
                            <button className="modal-close" onClick={() => setShowPollModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Question</label>
                                <input 
                                    className="input" 
                                    value={pollData.question} 
                                    onChange={(e) => setPollData({...pollData, question: e.target.value})} 
                                    placeholder="Ask a question" 
                                />
                            </div>
                            <div className="form-group">
                                <label>Options</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {pollData.options.map((opt, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '8px' }}>
                                            <input 
                                                className="input" 
                                                value={opt} 
                                                onChange={(e) => {
                                                    const newOpts = [...pollData.options];
                                                    newOpts[i] = e.target.value;
                                                    setPollData({...pollData, options: newOpts});
                                                }} 
                                                placeholder={`Option ${i+1}`} 
                                            />
                                            {pollData.options.length > 2 && (
                                                <button className="btn-icon" onClick={() => {
                                                    const newOpts = pollData.options.filter((_, idx) => idx !== i);
                                                    setPollData({...pollData, options: newOpts});
                                                }} style={{ flexShrink: 0 }}>✕</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {pollData.options.length < 10 && (
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <button className="btn btn-sm btn-ghost poll-add-option-btn" onClick={() => setPollData({...pollData, options: [...pollData.options, '']})}>
                                        + Add Option
                                    </button>
                                </div>
                            )}
                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={() => setShowPollModal(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSendPoll} disabled={!pollData.question || pollData.options.filter(o => o.trim()).length < 2 || sending}>
                                    {sending ? 'Sending...' : 'Send Poll'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Messages;
