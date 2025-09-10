import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBlogPost extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  title: string;
  excerpt: string;
  content: string;
  author: Types.ObjectId;
  date: Date;
  category: string;
  readTime: string;
  image: string;
  published: boolean;
  tags: string[];
  slug: string;
  views: number;
  likes: Types.ObjectId[];
  comments: {
    user: Types.ObjectId;
    content: string;
    date: Date;
    approved: boolean;
  }[];
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const BlogPostSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    excerpt: {
      type: String,
      required: true,
      maxlength: 300,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    readTime: {
      type: String,
      default: '1 min read',
    },
    image: {
      type: String,
      required: true,
    },
    published: {
      type: Boolean,
      default: false,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      default: 'blog-post',
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    comments: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      content: {
        type: String,
        required: true,
        maxlength: 1000,
      },
      date: {
        type: Date,
        default: Date.now,
      },
      approved: {
        type: Boolean,
        default: false,
      },
    }],
    seo: {
      metaTitle: {
        type: String,
        maxlength: 60,
      },
      metaDescription: {
        type: String,
        maxlength: 160,
      },
      keywords: [{
        type: String,
        trim: true,
        lowercase: true,
      }],
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug from title before saving
BlogPostSchema.pre('save', function(this: IBlogPost, next) {
  // Always generate slug if not set or if title changed
  if (!this.slug || this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }
  next();
});

// Calculate read time based on content
BlogPostSchema.pre('save', function(this: IBlogPost, next) {
  if (this.isModified('content')) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    this.readTime = `${minutes} min read`;
  }
  next();
});

// Indexes
BlogPostSchema.index({ published: 1, date: -1 });
BlogPostSchema.index({ category: 1, published: 1 });
BlogPostSchema.index({ tags: 1, published: 1 });
BlogPostSchema.index({ author: 1 });
BlogPostSchema.index({ title: 'text', content: 'text', excerpt: 'text' });

export default mongoose.model<IBlogPost>('BlogPost', BlogPostSchema);
