import "./App.css";
import { useEffect, useState, useRef } from "react";
import {
  Home,
  Search,
  PlusSquare,
  MessageCircle,
  Heart,
  User,
  Send,
  Image as ImageIcon,
  X,
  ArrowLeft,
  Share2,
  MessageSquare,
  LogOut,
  Bell,
  Trash2,
} from "lucide-react";

// =====================================================
// LIVE BACKEND API URL
// =====================================================
const RAW_API_URL = import.meta.env.VITE_API_URL || "https://codealpha-social-media-web.onrender.com";
const API_URL = RAW_API_URL.replace(/\/+$/, "");

function App() {
  // =====================================================
  // AUTH
  // =====================================================

  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // =====================================================
  // POSTS
  // =====================================================

  const [posts, setPosts] = useState([]);
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState("");
  const postFileInputRef = useRef(null);

  // =====================================================
  // NOTIFICATIONS
  // =====================================================
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // =====================================================
  // STORIES
  // =====================================================
  const [stories, setStories] = useState([]);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [storyImage, setStoryImage] = useState("");
  const [storyCaption, setStoryCaption] = useState("");
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const [viewingStory, setViewingStory] = useState(null);
  const storyFileInputRef = useRef(null);

  // =====================================================
  // PAGE
  // =====================================================

  const [activePage, setActivePage] = useState("home");

  // =====================================================
  // SEARCH
  // =====================================================

  const [searchName, setSearchName] = useState("");
  const [searchUser, setSearchUser] = useState(null);
  const [searchMessage, setSearchMessage] = useState("");

  // =====================================================
  // CHAT
  // =====================================================
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSearchText, setChatSearchText] = useState("");
  const chatBodyRef = useRef(null);

  // =====================================================
  // COMMENTS
  // =====================================================
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  // =====================================================
  // FOLLOWING / FOLLOWERS
  // =====================================================

  const [followingUsers, setFollowingUsers] = useState([]);

  const [connectionPage, setConnectionPage] = useState(null);
  const [connectionUsers, setConnectionUsers] = useState([]);
  const [connectionLoading, setConnectionLoading] = useState(false);

  // =====================================================
  // TOKEN
  // =====================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // =====================================================
  // FETCH POSTS / HOME FEED
  // =====================================================

  const fetchPosts = async () => {
    try {
      const token = getToken();

      if (!token) return;

      const response = await fetch(`${API_URL}/api/posts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      console.log("POSTS:", response.status, data);

      if (!response.ok) {
        console.log("Posts fetch failed:", data);
        return;
      }

      if (Array.isArray(data)) {
        setPosts(data);
      } else if (Array.isArray(data.posts)) {
        setPosts(data.posts);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.log("Posts fetch error:", error);
    }
  };

  // =====================================================
  // FETCH CURRENT USER
  // =====================================================

  const fetchCurrentUser = async () => {
    try {
      const token = getToken();

      if (!token) return;

      const response = await fetch(`${API_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      console.log("CURRENT USER:", response.status, data);

      if (!response.ok) {
        return;
      }

      const updatedUser = {
        ...data,
        id: data._id,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));

      setUser(updatedUser);

      setFollowingUsers(data.following || []);
    } catch (error) {
      console.log("Current user fetch error:", error);
    }
  };

  // =====================================================
  // NOTIFICATIONS HANDLERS
  // =====================================================

  const fetchNotifications = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      if (Array.isArray(data)) {
        setNotifications(data);
        const unread = data.filter((n) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.log("Fetch notifications error:", error);
    }
  };

  const openNotifications = async () => {
    setActivePage("notifications");
    setConnectionPage(null);

    try {
      const token = getToken();
      if (!token) return;

      setUnreadCount(0);
      await fetch(`${API_URL}/api/notifications/mark-read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.log("Mark read error:", error);
    }
  };

  // =====================================================
  // STORIES HANDLERS
  // =====================================================

  const fetchStories = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/stories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      if (Array.isArray(data)) {
        setStories(data);
      }
    } catch (error) {
      console.log("Fetch stories error:", error);
    }
  };

  const handleStoryFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("Image size must be less than 8MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setStoryImage(uploadEvent.target.result);
      setShowStoryModal(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleUploadStory = async () => {
    if (!storyImage) {
      alert("Please select a photo first!");
      return;
    }

    try {
      setIsUploadingStory(true);
      const token = getToken();
      if (!token) {
        alert("Please login again.");
        return;
      }

      const response = await fetch(`${API_URL}/api/stories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: storyImage,
          caption: storyCaption.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Story upload failed");
        return;
      }

      setStoryImage("");
      setStoryCaption("");
      setShowStoryModal(false);
      await fetchStories();
      alert("Story posted successfully!");
    } catch (error) {
      console.error("Story upload error:", error);
      alert("Could not post story");
    } finally {
      setIsUploadingStory(false);
    }
  };

  // =====================================================
  // POST IMAGE HANDLER
  // =====================================================

  const handlePostImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("Image size must be less than 8MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setPostImage(uploadEvent.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // =====================================================
  // COMMENTS HANDLERS
  // =====================================================
  const handleToggleComments = (postId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleAddComment = async (postId) => {
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;

    try {
      const token = getToken();
      if (!token) {
        alert("Please login again.");
        return;
      }

      const response = await fetch(`${API_URL}/api/posts/${postId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Failed to add comment");
        return;
      }

      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p._id === postId ? { ...p, comments: data.comments } : p
        )
      );

      setCommentInputs((prev) => ({
        ...prev,
        [postId]: "",
      }));

      await fetchNotifications();
    } catch (error) {
      console.error("Add comment error:", error);
    }
  };

  // =====================================================
  // CHAT / MESSAGES HANDLERS
  // =====================================================
  const fetchChatUsers = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/messages/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data)) {
        setChatUsers(data);
      }
    } catch (error) {
      console.error("Fetch chat users error:", error);
    }
  };

  const fetchChatMessages = async (recipientId) => {
    if (!recipientId) return;
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/messages/${recipientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data)) {
        setChatMessages(data);
        setTimeout(() => {
          if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
          }
        }, 50);
      }
    } catch (error) {
      console.error("Fetch chat messages error:", error);
    }
  };

  const handleSelectChatUser = (chatUser) => {
    setSelectedChatUser(chatUser);
    fetchChatMessages(chatUser._id);
  };

  const handleSendMessage = async () => {
    const text = chatInput.trim();
    if (!text || !selectedChatUser) return;

    try {
      const token = getToken();
      if (!token) return;

      setChatInput("");

      const response = await fetch(`${API_URL}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: selectedChatUser._id,
          text,
        }),
      });

      if (!response.ok) return;
      const newMsg = await response.json();
      setChatMessages((prev) => [...prev, newMsg]);
      setTimeout(() => {
        if (chatBodyRef.current) {
          chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
      }, 50);
    } catch (error) {
      console.error("Send message error:", error);
    }
  };

  // =====================================================
  // INITIAL FETCH
  // =====================================================

  useEffect(() => {
    if (user) {
      fetchCurrentUser();
      fetchPosts();
      fetchStories();
      fetchNotifications();
      fetchChatUsers();

      // Periodic check for notifications
      const interval = setInterval(() => {
        fetchNotifications();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [user?.id]);

  // Polling for active chat
  useEffect(() => {
    if (activePage === "messages" && selectedChatUser) {
      fetchChatMessages(selectedChatUser._id);
      const chatInterval = setInterval(() => {
        fetchChatMessages(selectedChatUser._id);
      }, 4000);
      return () => clearInterval(chatInterval);
    }
  }, [activePage, selectedChatUser?._id]);

  // =====================================================
  // LOGIN / REGISTER
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    try {
      const url = isLogin
        ? `${API_URL}/api/login`
        : `${API_URL}/api/register`;

      const body = isLogin
        ? {
            email,
            password,
          }
        : {
            name,
            email,
            password,
          };

      const response = await fetch(url, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Something went wrong");
        return;
      }

      // =========================
      // LOGIN
      // =========================

      if (isLogin) {
        localStorage.setItem("token", data.token);

        localStorage.setItem("user", JSON.stringify(data.user));

        setUser(data.user);

        setEmail("");
        setPassword("");

        setActivePage("home");

        setMessage("");
      }

      // =========================
      // REGISTER
      // =========================
      else {
        setMessage("Registration successful âœ…");

        setIsLogin(true);

        setName("");
        setEmail("");
        setPassword("");
      }
    } catch (error) {
      console.error("Auth error:", error);

      setMessage("Server se connect nahi ho pa raha");
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setPosts([]);
    setFollowingUsers([]);
    setSearchUser(null);
    setSearchName("");
    setConnectionPage(null);
    setConnectionUsers([]);
    setActivePage("home");
  };

  // =====================================================
  // CREATE POST
  // =====================================================

  const handleCreatePost = async () => {
    if (!postContent.trim() && !postImage) {
      alert("Please write something or select a photo!");
      return;
    }

    try {
      const token = getToken();

      if (!token) {
        alert("Login session expired. Please login again.");
        return;
      }

      const response = await fetch(`${API_URL}/api/posts`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          content: postContent.trim(),
          image: postImage || "",
        }),
      });

      const data = await response.json();

      console.log("CREATE POST:", response.status, data);

      if (!response.ok) {
        alert(data.message || "Post create nahi hua");
        return;
      }

      setPostContent("");
      setPostImage("");

      await fetchPosts();

      setActivePage("home");
    } catch (error) {
      console.error("Create post error:", error);

      alert("Server se connect nahi ho pa raha");
    }
  };

  // =====================================================
  // LIKE / UNLIKE
  // =====================================================

  const handleLike = async (postId) => {
    try {
      const token = getToken();

      if (!token) {
        alert("Login session expired. Please login again.");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/posts/${postId}/like`,
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      console.log("LIKE STATUS:", response.status);
      console.log("LIKE RESPONSE:", data);

      if (!response.ok) {
        alert(data.message || "Like failed");
        return;
      }

      await fetchPosts();
      await fetchNotifications();
    } catch (error) {
      console.error("Like error:", error);

      alert("Server se connect nahi ho pa raha");
    }
  };

  // =====================================================
  // SEARCH USER BY NAME
  // =====================================================

  const handleSearchUser = async () => {
    if (!searchName.trim()) {
      setSearchMessage("Please enter a user name");
      setSearchUser(null);
      return;
    }

    try {
      setSearchMessage("Searching...");
      setSearchUser(null);

      const token = getToken();

      if (!token) {
        setSearchMessage("Please login again.");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/users/search/${encodeURIComponent(
          searchName.trim(),
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      console.log("SEARCH:", response.status, data);

      if (!response.ok) {
        setSearchMessage(data.message || "User not found");
        return;
      }

      setSearchUser({
        ...data.user,
        isFollowing: data.isFollowing,
      });

      setSearchMessage("");
    } catch (error) {
      console.error("Search error:", error);

      setSearchMessage("Server se connect nahi ho pa raha âŒ");
    }
  };

  // =====================================================
  // FOLLOW / UNFOLLOW
  // =====================================================

  const handleAddUser = async () => {
    if (!searchUser?._id) {
      return;
    }

    try {
      const token = getToken();

      if (!token) {
        setSearchMessage("Please login again.");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/users/${searchUser._id}/follow`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      console.log("FOLLOW:", response.status, data);

      if (!response.ok) {
        setSearchMessage(data.message || "Follow failed");
        return;
      }

      setSearchUser((previous) => ({
        ...previous,
        isFollowing: data.following,
      }));

      setSearchMessage(
        data.following
          ? "User followed successfully âœ…"
          : "User unfollowed successfully",
      );

      await fetchCurrentUser();
      await fetchPosts();
    } catch (error) {
      console.error("Follow error:", error);

      setSearchMessage("User follow nahi ho pa raha âŒ");
    }
  };

  // =====================================================
  // FETCH FOLLOWERS / FOLLOWING
  // =====================================================

  const fetchConnections = async (type) => {
    try {
      const token = getToken();

      if (!token) {
        alert("Please login again.");
        return;
      }

      setConnectionLoading(true);
      setConnectionPage(type);
      setConnectionUsers([]);

      const response = await fetch(
        `${API_URL}/api/users/connections/${type}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      console.log("CONNECTIONS:", response.status, data);

      if (!response.ok) {
        alert(data.message || "Users load nahi ho paaye");
        return;
      }

      setConnectionUsers(
        Array.isArray(data)
          ? data
          : Array.isArray(data.users)
            ? data.users
            : [],
      );
    } catch (error) {
      console.error("Connections error:", error);

      alert("Server se connect nahi ho pa raha");
    } finally {
      setConnectionLoading(false);
    }
  };

  // =====================================================
  // LOGIN PAGE
  // =====================================================

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="app-title">VIORA</h1>

          <h2 className="auth-title">{isLogin ? "Login" : "Create Account"}</h2>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="auth-input"
              />
            )}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
            />

            <button type="submit" className="primary-btn">
              {isLogin ? "Login" : "Register"}
            </button>
          </form>

          {message && <p className="message">{message}</p>}

          <p className="switch-text">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </p>

          <button
            className="secondary-btn"
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage("");
            }}
          >
            {isLogin ? "Create Account" : "Login"}
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // HOME PAGE
  // =====================================================

  const HomePage = () => (
    <>
      {/* YOUR STORY & ALL STORIES */}

      <section className="stories-section">
        <div className="stories-container">
          <div
            className="story"
            onClick={() => storyFileInputRef.current?.click()}
            title="Add your story"
          >
            <div className="story-ring own-story">
              <div className="story-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>

              <span className="story-plus">+</span>
            </div>

            <span className="story-name">Your story</span>
          </div>

          {stories.map((st) => {
            const author = st.userId;
            const authorName = author?.name || "VIORA User";
            const authorLetter = authorName.charAt(0).toUpperCase() || "U";

            return (
              <div
                key={st._id}
                className="story"
                onClick={() => setViewingStory(st)}
                title={`View ${authorName}'s story`}
              >
                <div className="story-ring">
                  <div className="story-avatar">{authorLetter}</div>
                </div>

                <span className="story-name">{authorName.split(" ")[0]}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* WELCOME */}

      <div className="home-welcome">
        <h2>Welcome to VIORA ✨</h2>

        <p>See what's happening with people you follow.</p>
      </div>

      {/* FEED */}

      <div className="feed-title">Home Feed</div>

      {posts.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"><MessageSquare size={44} color="#8e8e8e" /></div>

          <h3>Your feed is empty</h3>

          <p>Create your first post or follow users to see their posts here.</p>
        </div>
      ) : (
        posts.map((post, index) => {
          const postUser =
            post.userId?.name || post.user?.name || post.name || "VIORA User";

          const avatarLetter = postUser.charAt(0).toUpperCase();

          const likeCount = Array.isArray(post.likes) ? post.likes.length : 0;

          const currentUserId = user?.id || user?._id;

          const isLiked =
            Array.isArray(post.likes) &&
            post.likes.some(
              (likeId) => likeId?.toString() === currentUserId?.toString(),
            );

          return (
            <article className="post" key={post._id || index}>
              {/* POST HEADER */}

              <div className="post-header">
                <div className="avatar">{avatarLetter}</div>

                <div className="post-user-info">
                  <div className="post-user">{postUser}</div>

                  <div className="post-time">
                    {post.createdAt
                      ? new Date(post.createdAt).toLocaleString()
                      : "Just now"}
                  </div>
                </div>

                <button
                  className="more-btn"
                  onClick={() => alert("More options coming soon")}
                  aria-label="More options"
                >
                  <MoreVertical size={18} />
                </button>
              </div>

              {/* CONTENT */}

                            {/* CONTENT */}
              {post.content && <div className="post-content">{post.content}</div>}

              {/* POST PHOTO */}
              {post.image && (
                <div className="post-image-container">
                  <img src={post.image} alt="Post content" className="post-image" />
                </div>
              )}

              {/* ACTIONS */}

              <div className="post-actions">
                <button
                  onClick={() => handleLike(post._id)}
                  className={`post-action-btn ${isLiked ? "liked" : ""}`}
                  aria-label="Like"
                >
                  <Heart
                    size={19}
                    fill={isLiked ? "#ed4956" : "none"}
                    color={isLiked ? "#ed4956" : "currentColor"}
                  />
                  <span>{likeCount}</span>
                </button>

                <button
                  className="post-action-btn"
                  onClick={() => handleToggleComments(post._id)}
                  aria-label="Comments"
                >
                  <MessageCircle size={19} />
                  <span>{Array.isArray(post.comments) ? post.comments.length : 0}</span>
                </button>

                <button
                  className="post-action-btn"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(window.location.href);
                    }
                    alert("Post link copied to clipboard!");
                  }}
                  aria-label="Share"
                >
                  <Share2 size={19} />
                </button>
              </div>

              {/* COMMENTS SECTION */}
              {expandedComments[post._id] && (
                <div className="comments-section">
                  <div className="comments-list">
                    {(!post.comments || post.comments.length === 0) ? (
                      <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", textAlign: "center", padding: "10px 0" }}>
                        No comments yet. Be the first to comment!
                      </p>
                    ) : (
                      post.comments.map((c, cIdx) => (
                        <div className="comment-item" key={c._id || cIdx}>
                          <div className="comment-avatar">
                            {c.userName?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div className="comment-body">
                            <span className="comment-user">{c.userName || "User"}</span>
                            <span className="comment-text">{c.text}</span>
                            {c.createdAt && (
                              <div className="comment-time">
                                {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="comment-input-box">
                    <input
                      type="text"
                      className="comment-input"
                      placeholder="Write a comment..."
                      value={commentInputs[post._id] || ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [post._id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddComment(post._id);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="comment-submit-btn"
                      onClick={() => handleAddComment(post._id)}
                      aria-label="Post comment"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })
      )}
    </>
  );

  // =====================================================
  // SEARCH PAGE
  // =====================================================

  const SearchPage = () => (
    <div className="page-content">
      <h1 className="page-title">Search</h1>

      <section className="search-section">
        <input
          type="text"
          className="search-input"
          placeholder="Search user name..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearchUser();
            }
          }}
        />

        <button className="search-btn" onClick={handleSearchUser} aria-label="Search">
          <Search size={18} />
        </button>
      </section>

      {searchUser && (
        <div className="search-result">
          <div className="search-user-avatar">
            {searchUser.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="search-user-info">
            <strong>{searchUser.name || "VIORA User"}</strong>

            <span>{searchUser.name}</span>
          </div>

          <button className="add-user-btn" onClick={handleAddUser}>
            {searchUser.isFollowing ? "Unfollow" : "Follow"}
          </button>
        </div>
      )}

      {searchMessage && <p className="search-message">{searchMessage}</p>}
    </div>
  );

  // =====================================================
  // CREATE PAGE
  // =====================================================

  const CreatePage = () => (
    <div className="page-content">
      <h1 className="page-title">Create Post</h1>

      <section className="create-post create-page-box">
        <div className="create-post-top">
          <div className="small-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "A"}
          </div>

          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder="What's on your mind?"
          />
        </div>

                {postImage && (
          <div className="image-preview-box">
            <img src={postImage} alt="Selected preview" className="preview-img" />
            <button
              type="button"
              className="remove-img-btn"
              onClick={() => setPostImage("")}
              title="Remove image"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="create-post-bottom">
          <input
            type="file"
            ref={postFileInputRef}
            accept="image/*"
            style={{ display: "none" }}
            onChange={handlePostImageChange}
          />

          <button
            type="button"
            className="media-btn"
            onClick={() => postFileInputRef.current?.click()}
            title="Add photo"
          >
            <ImageIcon size={18} /> Photo
          </button>

          <button className="post-submit-btn" onClick={handleCreatePost}>
            Post
          </button>
        </div>
      </section>
    </div>
  );

  // =====================================================
  // MESSAGES PAGE
  // =====================================================

  const MessagesPage = () => {
    const filteredUsers = chatUsers.filter((u) =>
      (u.name || "").toLowerCase().includes(chatSearchText.toLowerCase())
    );

    return (
      <div className="page-content messages-page">
        <h1 className="page-title">Messages</h1>

        <div className="messages-container">
          <div className="chat-list">
            <div className="chat-search">
              <input
                type="text"
                placeholder="Search chats..."
                value={chatSearchText}
                onChange={(e) => setChatSearchText(e.target.value)}
              />
            </div>

            {filteredUsers.length === 0 ? (
              <div className="no-chat" style={{ padding: "30px 10px", textAlign: "center" }}>
                <p style={{ color: "#777", fontSize: "14px" }}>
                  {chatSearchText ? "No matching users" : "No users found. Search or follow users to start chatting!"}
                </p>
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = selectedChatUser?._id === u._id;
                const uLetter = u.name?.charAt(0)?.toUpperCase() || "U";

                return (
                  <div
                    key={u._id}
                    className={`chat-user ${isSelected ? "active-chat" : ""}`}
                    onClick={() => handleSelectChatUser(u)}
                  >
                    <div className="chat-avatar">{uLetter}</div>

                    <div className="chat-user-info">
                      <strong>{u.name || "User"}</strong>
                      <span>Start a conversation</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="chat-window">
            {!selectedChatUser ? (
              <div className="no-chat">
                <div className="no-chat-icon">
                  <MessageCircle size={46} color="#8e8e8e" />
                </div>

                <h3>Your Messages</h3>

                <p>Select a user to start chatting in real time.</p>
              </div>
            ) : (
              <>
                <div className="chat-header">
                  <div className="chat-avatar">
                    {selectedChatUser.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>

                  <div className="chat-user-info">
                    <strong>{selectedChatUser.name}</strong>
                  </div>
                </div>

                <div className="chat-body" ref={chatBodyRef}>
                  {chatMessages.length === 0 ? (
                    <div className="empty" style={{ margin: "auto", textAlign: "center" }}>
                      <p style={{ color: "#888", fontSize: "14px" }}>
                        Say hi to {selectedChatUser.name}! 👋
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => {
                      const currentUserId = user?.id || user?._id;
                      const senderId = msg.sender?._id || msg.sender;
                      const isSent =
                        senderId?.toString() === currentUserId?.toString();

                      return (
                        <div
                          key={msg._id || idx}
                          className={`chat-msg-row ${isSent ? "sent" : "received"}`}
                        >
                          <div className="chat-bubble">
                            <div>{msg.text}</div>
                            {msg.createdAt && (
                              <div className="chat-time">
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="chat-input-area">
                  <input
                    type="text"
                    placeholder="Message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSendMessage();
                      }
                    }}
                  />

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    aria-label="Send message"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // =====================================================
  // FOLLOWERS / FOLLOWING PAGE
  // =====================================================

  const ConnectionsPage = () => {
    const title = connectionPage === "followers" ? "Followers" : "Following";

    return (
      <div className="page-content">
        <div className="connections-header">
          <button
            className="back-btn"
            onClick={() => {
              setConnectionPage(null);
              setConnectionUsers([]);
            }}
            aria-label="Back"
          >
            <ArrowLeft size={24} />
          </button>

          <h1 className="page-title">{title}</h1>
        </div>

        {connectionLoading ? (
          <div className="empty">
            <div className="empty-icon">â³</div>

            <h3>Loading...</h3>

            <p>Please wait.</p>
          </div>
        ) : connectionUsers.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">
              <User size={48} color="#8e8e8e" />
            </div>

            <h3>
              {connectionPage === "followers"
                ? "No followers yet"
                : "Not following anyone"}
            </h3>

            <p>
              {connectionPage === "followers"
                ? "When someone follows you, they will appear here."
                : "Users you follow will appear here."}
            </p>
          </div>
        ) : (
          <div className="connections-list">
            {connectionUsers.map((connectionUser) => (
              <div className="connection-user" key={connectionUser._id}>
                <div className="connection-avatar">
                  {connectionUser.name?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <div className="connection-info">
                  <strong>{connectionUser.name || "VIORA User"}</strong>

                  <span>@{connectionUser.username || connectionUser._id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // =====================================================
  // NOTIFICATIONS PAGE
  // =====================================================

  const NotificationsPage = () => (
    <div className="page-content notifications-page">
      <div className="connections-header">
        <button
          className="back-btn"
          onClick={() => setActivePage("home")}
          aria-label="Back"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="page-title">Notifications</h1>
      </div>

      {notifications.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🔔</div>
          <h3>No notifications yet</h3>
          <p>When someone likes your post, you will receive an alert here.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notif) => {
            const senderLetter =
              notif.sender?.name?.charAt(0)?.toUpperCase() || "U";

            return (
              <div
                key={notif._id}
                className={`notification-item ${!notif.read ? "unread" : ""}`}
              >
                <div className="notification-avatar">{senderLetter}</div>
                <div className="notification-content">
                  <div className="notification-msg">{notif.message}</div>
                  <div className="notification-time">
                    {notif.createdAt
                      ? new Date(notif.createdAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recently"}
                  </div>
                </div>
                {notif.post?.image && (
                  <img
                    src={notif.post.image}
                    alt="Post thumb"
                    className="notification-thumb"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // =====================================================
  // PROFILE PAGE
  // =====================================================

  const ProfilePage = () => {
    const myPosts = posts.filter((post) => {
      const postOwner = post.userId?._id || post.userId;

      const currentUserId = user?.id || user?._id;

      return postOwner?.toString() === currentUserId?.toString();
    });

    return (
      <div className="page-content profile-page">
        <div className="profile-big-avatar">
          {user?.name?.charAt(0)?.toUpperCase() || "A"}
        </div>

        <h2>{user?.name || "VIORA User"}</h2>

        <p className="profile-email">{user?.email}</p>

        {/* PROFILE STATS */}

        <section className="profile-stats">
          {/* POSTS */}

          <div className="stat">
            <strong>{myPosts.length}</strong>

            <span>Posts</span>
          </div>

          {/* FOLLOWERS */}

          <button
            className="stat stat-button"
            onClick={() => fetchConnections("followers")}
          >
            <strong>{user?.followers?.length || 0}</strong>

            <span>Followers</span>
          </button>

          {/* FOLLOWING */}

          <button
            className="stat stat-button"
            onClick={() => fetchConnections("following")}
          >
            <strong>{user?.following?.length || 0}</strong>

            <span>Following</span>
          </button>
        </section>

        <button
          className="edit-profile-btn"
          onClick={() => alert("Edit Profile coming soon âœ¨")}
        >
          Edit Profile
        </button>

        <br />

        <button
          className="logout-profile-btn"
          onClick={handleLogout}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", justifyContent: "center" }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    );
  };

  // =====================================================
  // MAIN PAGE
  // IMPORTANT:
  // YAHAN HAR PAGE SIRF EK BAAR RENDER HOGA
  // =====================================================

  return (
    <div className="home-page">
      {/* TOP NAVBAR */}

      <header className="navbar">
        <div className="nav-left">
          <button
            className="nav-icon"
            onClick={() => setActivePage("create")}
            aria-label="Create"
          >
            <PlusSquare size={22} />
          </button>
        </div>

        <div className="logo">VIORA</div>

        <div className="nav-right">
          <button
            className="nav-icon notification-btn"
            onClick={openNotifications}
            aria-label="Notifications"
          >
            <Heart size={22} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* =================================================
          PAGE CONTENT
          ONLY ONE PAGE RENDERS AT A TIME
      ================================================= */}

      {connectionPage ? (
        <ConnectionsPage />
      ) : activePage === "home" ? (
        <main className="home-content">
          <HomePage />
        </main>
      ) : activePage === "search" ? (
        <SearchPage />
      ) : activePage === "create" ? (
        <CreatePage />
      ) : activePage === "messages" ? (
        <MessagesPage />
      ) : activePage === "notifications" ? (
        <NotificationsPage />
      ) : activePage === "profile" ? (
        <ProfilePage />
      ) : (
        <main className="home-content">
          <HomePage />
        </main>
      )}

      {/* =================================================
          BOTTOM NAV
      ================================================= */}

      <nav className="bottom-nav">
        {/* HOME */}
        <button
          className={`bottom-nav-btn ${
            activePage === "home" && !connectionPage ? "active" : ""
          }`}
          onClick={() => {
            setConnectionPage(null);
            setConnectionUsers([]);
            setActivePage("home");
          }}
          aria-label="Home"
        >
          <Home size={22} />
        </button>

        {/* SEARCH */}
        <button
          className={`bottom-nav-btn ${
            activePage === "search" && !connectionPage ? "active" : ""
          }`}
          onClick={() => {
            setConnectionPage(null);
            setConnectionUsers([]);
            setActivePage("search");
          }}
          aria-label="Search"
        >
          <Search size={22} />
        </button>

        {/* CREATE */}
        <button
          className={`bottom-nav-btn ${
            activePage === "create" && !connectionPage ? "active" : ""
          }`}
          onClick={() => {
            setConnectionPage(null);
            setConnectionUsers([]);
            setActivePage("create");
          }}
          aria-label="Create"
        >
          <PlusSquare size={22} />
        </button>

        {/* MESSAGES */}
        <button
          className={`bottom-nav-btn ${
            activePage === "messages" && !connectionPage ? "active" : ""
          }`}
          onClick={() => {
            setConnectionPage(null);
            setConnectionUsers([]);
            setActivePage("messages");
          }}
          aria-label="Messages"
        >
          <MessageCircle size={22} />
        </button>

        {/* PROFILE */}
        <button
          className={`bottom-nav-btn ${
            activePage === "profile" && !connectionPage ? "active" : ""
          }`}
          onClick={() => {
            setConnectionPage(null);
            setConnectionUsers([]);
            setActivePage("profile");
          }}
          aria-label="Profile"
        >
          <User size={22} />
        </button>
      </nav>

      {/* HIDDEN STORY FILE INPUT */}
      <input
        type="file"
        ref={storyFileInputRef}
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleStoryFileSelect}
      />

      {/* STORY UPLOAD MODAL */}
      {showStoryModal && (
        <div className="story-upload-overlay" onClick={() => setShowStoryModal(false)}>
          <div className="story-upload-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Create Story</h3>
              <button
                type="button"
                className="story-viewer-close"
                onClick={() => setShowStoryModal(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {storyImage && (
              <img src={storyImage} alt="Story preview" className="story-upload-preview" />
            )}

            <input
              type="text"
              placeholder="Add a caption... (optional)"
              value={storyCaption}
              onChange={(e) => setStoryCaption(e.target.value)}
              className="story-upload-caption"
            />

            <div className="story-upload-actions">
              <button
                type="button"
                className="story-btn-cancel"
                onClick={() => {
                  setShowStoryModal(false);
                  setStoryImage("");
                  setStoryCaption("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="story-btn-submit"
                disabled={isUploadingStory}
                onClick={handleUploadStory}
              >
                {isUploadingStory ? "Posting..." : "Share Story"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STORY VIEWER MODAL */}
      {viewingStory && (
        <div className="story-viewer-overlay" onClick={() => setViewingStory(null)}>
          <div className="story-viewer-card" onClick={(e) => e.stopPropagation()}>
            <div className="story-viewer-header">
              <div className="story-viewer-user">
                <div className="story-viewer-avatar">
                  {viewingStory.userId?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <div className="story-viewer-name">
                    {viewingStory.userId?.name || "VIORA User"}
                  </div>
                  <div className="story-viewer-time">
                    {viewingStory.createdAt
                      ? new Date(viewingStory.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recently"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="story-viewer-close"
                onClick={() => setViewingStory(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="story-viewer-img-container">
              <img src={viewingStory.image} alt="Story" className="story-viewer-img" />
            </div>

            {viewingStory.caption && (
              <div className="story-viewer-footer">{viewingStory.caption}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
