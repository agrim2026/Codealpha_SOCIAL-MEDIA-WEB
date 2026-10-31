const express = require("express");
const cors = require("cors");
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/User");
const Post = require("./models/Post");
const Notification = require("./models/Notification");
const Story = require("./models/Story");
const Message = require("./models/Message");

const authMiddleware = require("./middleware/authMiddleware");

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// =====================================================
// REGISTER
// =====================================================

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      followers: [],
      following: [],
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        followers: user.followers,
        following: user.following,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// =====================================================
// LOGIN
// =====================================================

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.json({
      message: "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        followers: user.followers || [],
        following: user.following || [],
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// =====================================================
// GET CURRENT USER
// =====================================================

app.get("/api/users/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("-password")
      .populate("followers", "name email")
      .populate("following", "name email");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    console.error("Current User Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// =====================================================
// GET ALL USERS
// =====================================================

app.get("/api/users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("followers", "name email")
      .populate("following", "name email");

    res.json(users);
  } catch (error) {
    console.error("Get Users Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});
// =====================================================
// GET FOLLOWERS / FOLLOWING
// =====================================================

app.get("/api/users/connections/:type", authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { type } = req.params;

    const user = await User.findById(currentUserId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    let userIds = [];

    if (type === "following") {
      userIds = user.following || [];
    } else if (type === "followers") {
      userIds = user.followers || [];
    } else {
      return res.status(400).json({
        message: "Invalid connection type",
      });
    }

    const users = await User.find({
      _id: { $in: userIds },
    }).select("-password");

    res.json(users);
  } catch (error) {
    console.error("Connections Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// =====================================================
// SEARCH USER BY NAME
// =====================================================

app.get("/api/users/search/:searchName", authMiddleware, async (req, res) => {
  try {
    const searchName = req.params.searchName.trim();

    if (!searchName) {
      return res.status(400).json({
        message: "Please enter a user name",
      });
    }

    const user = await User.findOne({
      name: {
        $regex: `^${searchName}$`,
        $options: "i",
      },
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const currentUser = await User.findById(req.user.userId);

    const isFollowing =
      currentUser?.following?.some(
        (id) => id.toString() === user._id.toString(),
      ) || false;

    res.json({
      user,
      isFollowing,
    });
  } catch (error) {
    console.error("Search User Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// =====================================================
// FOLLOW / UNFOLLOW USER
// =====================================================

app.post("/api/users/:id/follow", authMiddleware, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    if (targetUserId.toString() === currentUserId.toString()) {
      return res.status(400).json({
        message: "You cannot follow yourself",
      });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!Array.isArray(currentUser.following)) {
      currentUser.following = [];
    }

    if (!Array.isArray(targetUser.followers)) {
      targetUser.followers = [];
    }

    const isFollowing = currentUser.following.some(
      (id) => id.toString() === targetUserId.toString(),
    );

    // =================================================
    // UNFOLLOW
    // =================================================

    if (isFollowing) {
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId.toString(),
      );

      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUserId.toString(),
      );

      await currentUser.save();
      await targetUser.save();

      return res.json({
        message: "User unfollowed successfully",
        following: false,
        followersCount: targetUser.followers.length,
        followingCount: currentUser.following.length,
      });
    }

    // =================================================
    // FOLLOW
    // =================================================

    currentUser.following.push(targetUser._id);

    targetUser.followers.push(currentUser._id);

    await currentUser.save();
    await targetUser.save();

    res.json({
      message: "User followed successfully",
      following: true,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
    });
  } catch (error) {
    console.error("Follow Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// =====================================================
// CREATE POST
// =====================================================

app.post("/api/posts", authMiddleware, async (req, res) => {
  try {
    const { content, image } = req.body;
    const userId = req.user.userId;

    if ((!content || !content.trim()) && !image) {
      return res.status(400).json({
        message: "Content or photo is required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const post = await Post.create({
      content: content ? content.trim() : "",
      image: image || "",
      userId,
    });

    const populatedPost = await Post.findById(post._id).populate(
      "userId",
      "name email",
    );

    res.status(201).json({
      message: "Post created successfully",
      post: populatedPost,
    });
  } catch (error) {
    console.error("Create Post Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// =====================================================
// GET HOME FEED
// OWN POSTS + FOLLOWING POSTS ONLY
// =====================================================

app.get("/api/posts", authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);

    if (!currentUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const followingIds = Array.isArray(currentUser.following)
      ? currentUser.following
      : [];

    const feedUserIds = [currentUser._id, ...followingIds];

    const posts = await Post.find({
      userId: {
        $in: feedUserIds,
      },
    })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error("Get Feed Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// =====================================================
// LIKE / UNLIKE POST
// =====================================================

app.put("/api/posts/:id/like", authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        message: "Invalid post ID",
      });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (!Array.isArray(post.likes)) {
      post.likes = [];
    }

    const alreadyLiked = post.likes.some(
      (likeId) => likeId.toString() === userId.toString(),
    );

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (likeId) => likeId.toString() !== userId.toString(),
      );
    } else {
      post.likes.push(userId);

      // Create notification for post owner if not self-like
      if (post.userId.toString() !== userId.toString()) {
        try {
          const liker = await User.findById(userId).select("name");
          await Notification.create({
            recipient: post.userId,
            sender: userId,
            type: "like",
            post: post._id,
            message: `${liker?.name || "Someone"} liked your post ❤️`,
          });
        } catch (notifErr) {
          console.error("Notification creation error:", notifErr);
        }
      }
    }

    await post.save();

    res.json({
      message: alreadyLiked ? "Post unliked" : "Post liked",

      liked: !alreadyLiked,

      likeCount: post.likes.length,
    });
  } catch (error) {
    console.error("Like Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// =====================================================
// GET SINGLE POST
// =====================================================

app.get("/api/posts/:id", authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        message: "Invalid post ID",
      });
    }

    const post = await Post.findById(postId).populate("userId", "name email");

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    res.json(post);
  } catch (error) {
    console.error("Get Single Post Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// =====================================================
// DELETE POST
// =====================================================

app.delete("/api/posts/:id", authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        message: "Invalid post ID",
      });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (post.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You can only delete your own post",
      });
    }

    await Post.findByIdAndDelete(postId);

    res.json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete Post Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// =====================================================
// NOTIFICATIONS
// =====================================================

app.get("/api/notifications", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user.userId,
    })
      .populate("sender", "name email")
      .populate("post", "content image")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error("Get Notifications Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

app.put("/api/notifications/mark-read", authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.userId, read: false },
      { $set: { read: true } },
    );
    res.json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Mark Read Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// =====================================================
// STORIES
// =====================================================

app.post("/api/stories", authMiddleware, async (req, res) => {
  try {
    const { image, caption } = req.body;

    if (!image) {
      return res.status(400).json({
        message: "Photo is required for story",
      });
    }

    const story = await Story.create({
      userId: req.user.userId,
      image,
      caption: (caption || "").trim(),
    });

    const populatedStory = await Story.findById(story._id).populate(
      "userId",
      "name email",
    );

    res.status(201).json({
      message: "Story created successfully",
      story: populatedStory,
    });
  } catch (error) {
    console.error("Create Story Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

app.get("/api/stories", authMiddleware, async (req, res) => {
  try {
    // Stories from the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stories = await Story.find({
      createdAt: { $gte: oneDayAgo },
    })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json(stories);
  } catch (error) {
    console.error("Get Stories Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// =====================================================
// COMMENTS
// =====================================================

app.post("/api/posts/:id/comment", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user.userId;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const user = await User.findById(userId).select("name");

    const newComment = {
      userId,
      userName: user?.name || "VIORA User",
      text: text.trim(),
      createdAt: new Date(),
    };

    if (!Array.isArray(post.comments)) {
      post.comments = [];
    }

    post.comments.push(newComment);
    await post.save();

    // Notify author if someone else commented
    if (post.userId.toString() !== userId.toString()) {
      try {
        await Notification.create({
          recipient: post.userId,
          sender: userId,
          type: "comment",
          post: post._id,
          message: `${user?.name || "Someone"} commented: "${text.trim().slice(0, 30)}"`,
        });
      } catch (notifErr) {
        console.error("Comment notification error:", notifErr);
      }
    }

    res.status(201).json({
      message: "Comment added successfully",
      comments: post.comments,
    });
  } catch (error) {
    console.error("Comment error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// =====================================================
// MESSAGES / CHAT
// =====================================================

app.get("/api/messages/conversations", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.userId } })
      .select("name email username")
      .limit(50);
    res.json(users);
  } catch (error) {
    console.error("Conversations error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.get("/api/messages/:recipientId", authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const recipientId = req.params.recipientId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: recipientId },
        { sender: recipientId, recipient: currentUserId },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.post("/api/messages", authMiddleware, async (req, res) => {
  try {
    const { recipientId, text } = req.body;
    const sender = req.user.userId;

    if (!recipientId || !text || !text.trim()) {
      return res.status(400).json({ message: "Recipient and text required" });
    }

    const message = await Message.create({
      sender,
      recipient: recipientId,
      text: text.trim(),
    });

    res.status(201).json(message);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// =====================================================
// API STATUS
// =====================================================

app.get("/", (req, res) => {
  res.send("VIORA Social Media API is running 🚀");
});

// =====================================================
// DATABASE
// =====================================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully ✅");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// =====================================================
// SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
