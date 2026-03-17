import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import messageService from '../services/messageService';
import { useAuth } from '../context/AuthContext';
import './Messages.css';

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
    const messagesEndRef = useRef(null);

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
        // On mobile, you might want to switch view
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            const res = await messageService.send(selectedConversation._id, newMessage);
            if (res.success) {
                setMessages([...messages, res.data]);
                setNewMessage('');
                // Refresh conversations list to update last message preview
                fetchConversations();
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        }
    };

    // Helpers
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
        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6'];
        let hash = 0;
        const strId = id.toString();
        for (let i = 0; i < strId.length; i++) {
            hash = strId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const getConversationName = (conv) => {
        if (conv.project) console.log(`Conv ${conv._id} Project:`, conv.project);
        if (conv.project?.name) return conv.project.name;
        if (conv.isGroup) return conv.name || 'Group Chat';
        // For direct messages, find the other participant
        const myId = String(currentUser?.id || currentUser?._id || '');
        const other = conv.participants.find(p => String(p._id || p.id) !== myId);
        return other?.name || 'Unknown User';
    };

    const getConversationAvatar = (conv) => {
        if (conv.project) return null; // Use project color/icon
        if (conv.isGroup) return null; // Use group icon in UI
        const myId = String(currentUser?.id || currentUser?._id || '');
        const other = conv.participants.find(p => String(p._id || p.id) !== myId);
        return other?.avatar;
    };

    return (
        <div className="page messages-page">
            <Navbar />
            <div className="messages-container">
                {/* Sidebar */}
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
                                            {conv.lastMessage?.content || 'No messages yet'}
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

                {/* Chat Area */}
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
                                        // Helper to safely get sender ID
                                        const getSenderId = (msg) => msg.sender?._id || msg.sender?.id || msg.sender;
                                        const senderId = getSenderId(message);
                                        const prevSenderId = index > 0 ? getSenderId(messages[index - 1]) : null;

                                        // Helper to safely get sender name
                                        const getSenderName = (msg) => {
                                            if (msg.sender?.name) return msg.sender.name;
                                            // Try to find in conversation participants
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
                                                        {message.content}
                                                    </div>
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

                            {/* Message Input */}
                            <form className="chat-input-form" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    className="chat-input"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <button type="submit" className="btn-send" disabled={!newMessage.trim()}>
                                    Send
                                </button>
                            </form>
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
        </div>
    );
};

export default Messages;
