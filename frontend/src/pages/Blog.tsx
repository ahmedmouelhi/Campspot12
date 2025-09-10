import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FileText } from 'lucide-react';
import apiService from '../services/apiService';

// Define BlogPost interface locally
interface BlogPost {
  _id: string;
  id?: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  image: string;
  published: boolean;
  tags: string[];
}

const Blog = () => {
  const [articles, setArticles] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const loadBlogPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getBlogPosts();
        console.log('Blog API response:', response);
        
        // Handle standardized API response format
        const blogData = response.success ? response.data : (response.data || response);
        const publishedPosts = Array.isArray(blogData) ? blogData.filter(post => post.published) : [];
        
        // Map the API response to match our interface
        const formattedPosts = publishedPosts.map(post => ({
          ...post,
          id: post._id,
          author: post.author?.name || post.author || 'Unknown Author',
          date: new Date(post.date || post.createdAt).toLocaleDateString()
        }));
        
        setArticles(formattedPosts);
      } catch (err: any) {
        console.error('Error loading blog posts:', err);
        setError('Failed to load blog posts. Please try again later.');
        toast.error('Failed to load blog posts');
      } finally {
        setLoading(false);
      }
    };
    
    loadBlogPosts();
  }, []);

  const categories = ['All', ...Array.from(new Set(articles.map(article => article.category)))];
  
  const filteredArticles = selectedCategory === 'All' 
    ? articles 
    : articles.filter(article => article.category === selectedCategory);

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">CampSpot Blog</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tips, guides, and stories from outdoor enthusiasts to help you make the most of your camping adventures.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-4 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full border transition-colors ${
                  selectedCategory === category
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'border-gray-300 hover:bg-teal-600 hover:text-white hover:border-teal-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              <p className="mt-4 text-gray-600">Loading blog posts...</p>
            </div>
          )}
          
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
              >
                Retry
              </button>
            </div>
          )}
          
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredArticles.map((article) => (
              <article key={article._id || article.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-6xl">
                  {article.image}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs font-semibold rounded-full">
                      {article.category}
                    </span>
                    <span className="text-gray-500 text-sm">{article.readTime}</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-3 hover:text-teal-600 cursor-pointer">
                    {article.title}
                  </h2>
                  <p className="text-gray-600 mb-4 line-clamp-3">{article.excerpt}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{article.author}</span>
                    <span>{article.date}</span>
                  </div>
                  <button className="mt-4 text-teal-600 font-semibold hover:text-teal-700 transition-colors">
                    Read More →
                  </button>
                </div>
              </article>
              ))}
            </div>
          )}
          
          {!loading && !error && filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {selectedCategory === 'All' ? 'No blog posts available at the moment.' : `No blog posts in ${selectedCategory} category.`}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 bg-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter for the latest camping tips, destination guides, and special offers.
          </p>
          <div className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-800"
            />
            <button className="bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
