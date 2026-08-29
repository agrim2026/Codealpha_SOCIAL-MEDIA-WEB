import "./App.css";
import { useEffect, useState } from "react";

function App() {
  // =====================================================
  // BACKEND URL
  // =====================================================

  const API_URL = "https://codealpha-social-media-web.onrender.com";

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

  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessage, setChatMessage] = useState("");

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
  // INITIAL FETCH
  // =====================================================

  useEffect(() => {
    if (user) {
      fetchCurrentUser();
      fetchPosts();
    }
  }, [user?.id]);

  // =====================================================
  // LOGIN / REGISTER
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    try {
      const url = isLogin ? `${API_URL}/api/login` : `${API_URL}/api/register`;

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

      console.log("AUTH:", response.status, data);

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
        setMessage("Registration successful ✅");

        setIsLogin(true);

        setName("");
        setEmail("");
        setPassword("");
      }
    } catch (error) {
      console.error("Auth error:", error);

      setMessage("Server se connect nahi ho pa raha ❌");
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
    if (!postContent.trim()) {
      alert("Please write something first ✍️");
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
        }),
      });

      const data = await response.json();

      console.log("CREATE POST:", response.status, data);

      if (!response.ok) {
        alert(data.message || "Post create nahi hua ❌");
        return;
      }

      setPostContent("");

      await fetchPosts();

      setActivePage("home");
    } catch (error) {
      console.error("Create post error:", error);

      alert("Server se connect nahi ho pa raha ❌");
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

      const response = await fetch(`${API_URL}/api/posts/${postId}/like`, {
        method: "PUT",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      console.log("LIKE STATUS:", response.status);
      console.log("LIKE RESPONSE:", data);

      if (!response.ok) {
        alert(data.message || "Like failed ❌");
        return;
      }

      await fetchPosts();
    } catch (error) {
      console.error("Like error:", error);

      alert("Server se connect nahi ho pa raha ❌");
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
        `${API_URL}/api/users/search/${encodeURIComponent(searchName.trim())}`,
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

      setSearchMessage("Server se connect nahi ho pa raha ❌");
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
          ? "User followed successfully ✅"
          : "User unfollowed successfully",
      );

      await fetchCurrentUser();
      await fetchPosts();
    } catch (error) {
      console.error("Follow error:", error);

      setSearchMessage("User follow nahi ho pa raha ❌");
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

      const response = await fetch(`${API_URL}/api/users/connections/${type}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

      alert("Server se connect nahi ho pa raha ❌");
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
      {/* YOUR STORY */}

      <section className="stories-section">
        <div className="stories-container">
          <div className="story">
            <div className="story-ring own-story">
              <div className="story-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>

              <span className="story-plus">+</span>
            </div>

            <span className="story-name">Your story</span>
          </div>
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
          <div className="empty-icon">✨</div>

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
                >
                  ⋯
                </button>
              </div>

              {/* CONTENT */}

              <div className="post-content">{post.content}</div>

              {/* ACTIONS */}

              <div className="post-actions">
                <button
                  onClick={() => handleLike(post._id)}
                  className={isLiked ? "liked" : ""}
                >
                  {isLiked ? "♥" : "♡"} {likeCount}
                </button>

                <button onClick={() => alert("Comments coming soon 💬")}>
                  💬
                </button>

                <button onClick={() => alert("Share coming soon ↗️")}>↗</button>
              </div>
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

        <button className="search-btn" onClick={handleSearchUser}>
          🔍
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

        <div className="create-post-bottom">
          <button
            className="media-btn"
            onClick={() => alert("Photo upload coming soon 📷")}
          >
            📷
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

  const MessagesPage = () => (
    <div className="page-content messages-page">
      <h1 className="page-title">Messages</h1>

      <div className="messages-container">
        <div className="chat-list">
          <div className="chat-search">
            <input type="text" placeholder="Search chats..." />
          </div>

          <div
            className={`chat-user ${selectedChat ? "active-chat" : ""}`}
            onClick={() =>
              setSelectedChat({
                name: "VIORA User",
              })
            }
          >
            <div className="chat-avatar">V</div>

            <div className="chat-user-info">
              <strong>VIORA User</strong>

              <span>Start a conversation</span>
            </div>
          </div>
        </div>

        <div className="chat-window">
          {!selectedChat ? (
            <div className="no-chat">
              <div className="no-chat-icon">💬</div>

              <h3>Your Messages</h3>

              <p>Select a user to start chatting.</p>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <div className="chat-avatar">V</div>

                <div className="chat-user-info">
                  <strong>{selectedChat.name}</strong>
                </div>
              </div>

              <div className="chat-body">
                {chatMessage && (
                  <div className="chat-message">{chatMessage}</div>
                )}
              </div>

              <div className="chat-input-area">
                <input
                  type="text"
                  placeholder="Message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && chatMessage.trim()) {
                      setChatMessage("");
                    }
                  }}
                />

                <button
                  onClick={() => {
                    if (chatMessage.trim()) {
                      setChatMessage("");
                    }
                  }}
                >
                  ➤
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

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
          >
            ←
          </button>

          <h1 className="page-title">{title}</h1>
        </div>

        {connectionLoading ? (
          <div className="empty">
            <div className="empty-icon">⏳</div>

            <h3>Loading...</h3>

            <p>Please wait.</p>
          </div>
        ) : connectionUsers.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">👥</div>

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
          onClick={() => alert("Edit Profile coming soon ✨")}
        >
          Edit Profile
        </button>

        <br />

        <button className="logout-profile-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    );
  };

  // =====================================================
  // MAIN PAGE
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
            ＋
          </button>
        </div>

        <div className="logo">VIORA</div>

        <div className="nav-right">
          <button
            className="nav-icon"
            onClick={() => alert("Notifications coming soon ❤️")}
            aria-label="Notifications"
          >
            ♡
          </button>
        </div>
      </header>

      {/* PAGE CONTENT */}

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
          <span>⌂</span>
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
          <span>⌕</span>
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
          <span>＋</span>
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
          <span>♡</span>
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
          <span>◉</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
