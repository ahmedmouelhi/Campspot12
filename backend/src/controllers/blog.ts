import { Request, Response } from 'express';
import BlogPost, { IBlogPost } from '../models/BlogPost';
import User from '../models/User';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';
import { clearCache } from '../middleware/cache';
import { NotificationService } from '../services/notificationService';

// Get all blog posts
export const getBlogPosts = async (req: Request, res: Response) => {
  try {
    const {
      category,
      tags,
      published,
      author,
      search,
      sort = 'date',
      order = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (published !== undefined) filter.published = published === 'true';
    if (category) filter.category = category;
    if (author) filter.author = author;
    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagsArray };
    }
    
    // Text search
    if (search) {
      filter.$text = { $search: search as string };
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sort as string] = order === 'desc' ? -1 : 1;

    // Calculate pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Math.min(50, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Get blog posts with pagination
    const posts = await BlogPost
      .find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .populate('author', 'name avatar')
      .populate('comments.user', 'name avatar');

    // Get total count
    const total = await BlogPost.countDocuments(filter);

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error getting blog posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve blog posts'
    });
  }
};

// Get blog post by ID or slug
export const getBlogPost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Try to find by ID first, then by slug
    let post = await BlogPost
      .findById(id)
      .populate('author', 'name avatar')
      .populate('comments.user', 'name avatar');

    if (!post) {
      post = await BlogPost
        .findOne({ slug: id })
        .populate('author', 'name avatar')
        .populate('comments.user', 'name avatar');
    }

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found'
      });
    }

    // Increment view count
    post.views += 1;
    await post.save();

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error getting blog post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve blog post'
    });
  }
};

// Create new blog post
export const createBlogPost = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // For temporary testing, use admin user if no authenticated user
    let authorId = req.user?._id;
    if (!authorId) {
      const adminUser = await User.findOne({ role: 'admin' });
      authorId = adminUser?._id;
    }
    
    const postData = {
      ...req.body,
      author: authorId
    };
    
    const post = new BlogPost(postData);
    await post.save();

    const populatedPost = await BlogPost
      .findById(post._id)
      .populate('author', 'name avatar');

    // Clear blog cache
    clearCache('/api/blog');
    clearCache('/api/blog/categories');
    clearCache('/api/blog/tags');
    clearCache('/api/blog/stats');

    // Create notification for new blog post (if published)
    if (populatedPost && populatedPost.published) {
      try {
        await NotificationService.notifyNewBlogPost(populatedPost);
      } catch (error) {
        console.error('Error creating blog notification:', error);
      }
    }

    res.status(201).json({
      success: true,
      data: populatedPost,
      message: 'Blog post created successfully'
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    
    if ((error as any).name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: (error as any).errors
      });
    }

    if ((error as any).code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'A blog post with this slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create blog post'
    });
  }
};

// Update blog post
export const updateBlogPost = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔍 Update blog post request:', {
      params: req.params,
      body: req.body,
      user: req.user ? { id: req.user._id, role: req.user.role } : 'No user'
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove author field from update data to prevent ObjectId casting errors
    // The author should not change during updates
    delete updateData.author;

    console.log('🔍 Looking for blog post with ID:', id);
    const post = await BlogPost.findById(id);
    if (!post) {
      console.error('❌ Blog post not found for ID:', id);
      return res.status(404).json({
        success: false,
        error: 'Blog post not found'
      });
    }

    console.log('✅ Found blog post, proceeding with update');
    console.log('📝 Update data (author removed):', updateData);
    // Admin access is already enforced by middleware, so proceed with update

    const updatedPost = await BlogPost.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'name avatar');

    // Clear blog cache
    clearCache('/api/blog');
    clearCache('/api/blog/categories');
    clearCache('/api/blog/tags');
    clearCache('/api/blog/stats');

    // Create notification if blog post was just published
    if (updatedPost && updatedPost.published && (!post.published || updateData.published)) {
      try {
        await NotificationService.notifyNewBlogPost(updatedPost);
      } catch (error) {
        console.error('Error creating blog update notification:', error);
      }
    }

    res.json({
      success: true,
      data: updatedPost,
      message: 'Blog post updated successfully'
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    
    if ((error as any).name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: (error as any).errors
      });
    }

    if ((error as any).code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'A blog post with this slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update blog post'
    });
  }
};

// Delete blog post
export const deleteBlogPost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const post = await BlogPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found'
      });
    }

    // Check if user is author or admin
    if (post.author.toString() !== req.user?._id.toString() && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own posts'
      });
    }

    await BlogPost.findByIdAndDelete(id);

    // Clear blog cache
    clearCache('/api/blog');
    clearCache('/api/blog/categories');
    clearCache('/api/blog/tags');
    clearCache('/api/blog/stats');

    res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete blog post'
    });
  }
};

// Add comment to blog post
export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const post = await BlogPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found'
      });
    }

    // Add new comment
    post.comments.push({
      user: userId,
      content,
      date: new Date(),
      approved: false
    });

    await post.save();

    const updatedPost = await BlogPost
      .findById(id)
      .populate('author', 'name avatar')
      .populate('comments.user', 'name avatar');

    res.json({
      success: true,
      data: updatedPost,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment'
    });
  }
};

// Like/unlike blog post
export const toggleLike = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const post = await BlogPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found'
      });
    }

    const likeIndex = post.likes.indexOf(userId);
    
    if (likeIndex > -1) {
      // User already liked, remove like
      post.likes.splice(likeIndex, 1);
    } else {
      // Add like
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      success: true,
      data: {
        likes: post.likes.length,
        isLiked: likeIndex === -1
      },
      message: likeIndex > -1 ? 'Like removed' : 'Like added'
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle like'
    });
  }
};

// Get blog categories
export const getBlogCategories = async (req: Request, res: Response) => {
  try {
    const categories = await BlogPost.distinct('category', { published: true });
    
    res.json({
      success: true,
      data: categories.sort()
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve categories'
    });
  }
};

// Get popular tags
export const getBlogTags = async (req: Request, res: Response) => {
  try {
    const tagCounts = await BlogPost.aggregate([
      { $match: { published: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);
    
    res.json({
      success: true,
      data: tagCounts
    });
  } catch (error) {
    console.error('Error getting tags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve tags'
    });
  }
};

// Get blog statistics (for admin dashboard)
export const getBlogStats = async (req: Request, res: Response) => {
  try {
    const totalPosts = await BlogPost.countDocuments();
    const publishedPosts = await BlogPost.countDocuments({ published: true });
    const totalViews = await BlogPost.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);
    const categoryCounts = await BlogPost.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        total: totalPosts,
        published: publishedPosts,
        draft: totalPosts - publishedPosts,
        totalViews: totalViews[0]?.totalViews || 0,
        categories: categoryCounts
      }
    });
  } catch (error) {
    console.error('Error getting blog stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve blog statistics'
    });
  }
};
