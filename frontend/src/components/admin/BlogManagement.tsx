import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, FileText, Calendar, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import RealAdminApiService, { type BlogPost } from '../../services/RealAdminApiService';

const BlogManagement = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<BlogPost, 'id'>>({
    title: '',
    excerpt: '',
    content: '',
    author: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    readTime: '',
    image: '',
    published: false,
    tags: [],
    slug: '',
    views: 0
  });

  const adminService = RealAdminApiService.getInstance();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const postsData = await adminService.getBlogPosts();
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading blog posts:', error);
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      author: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      readTime: '',
      image: '',
      published: false,
      tags: [],
      slug: '',
      views: 0
    });
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (post: BlogPost) => {
    setFormData({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      author: post.author,
      date: post.date || new Date().toISOString().split('T')[0],
      category: post.category,
      readTime: post.readTime,
      image: post.image,
      published: post.published,
      tags: [...post.tags],
      slug: post.slug,
      views: post.views
    });
    setEditingId(post.id || null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    console.log('🗑️ Blog delete button clicked for ID:', id);
    
    if (!id) {
      console.error('❌ No ID provided for delete');
      toast.error('Cannot delete: No ID provided');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        setLoading(true);
        console.log('🔄 Calling admin service delete for ID:', id);
        await adminService.deleteBlogPost(id);
        console.log('✅ Blog post delete successful');
        toast.success('Blog post deleted successfully');
        await loadPosts();
      } catch (error) {
        console.error('Error deleting blog post:', error);
        toast.error('Failed to delete blog post');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTogglePublished = async (id: string, published: boolean) => {
    try {
      setLoading(true);
      await adminService.updateBlogPost(id, { published });
      toast.success(`Blog post ${published ? 'published' : 'unpublished'} successfully`);
      await loadPosts();
    } catch (error) {
      console.error('Error updating blog post:', error);
      toast.error('Failed to update blog post');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Blog post form submission started');
    console.log('📝 Form data:', formData);
    console.log('✏️ Editing ID:', editingId);
    
    try {
      setLoading(true);
      
      console.log('🎯 Form data to submit:', formData);
      
      let response;
      if (editingId) {
        console.log('🔄 Updating existing blog post with ID:', editingId);
        response = await adminService.updateBlogPost(editingId, formData);
      } else {
        console.log('➕ Creating new blog post');
        response = await adminService.addBlogPost(formData);
      }
      
      console.log('📥 Admin service response:', response);
      
      if (response?.success) {
        console.log('✅ Blog post save successful');
        toast.success(editingId ? 'Blog post updated successfully' : 'Blog post created successfully');
        console.log('🔄 Reloading blog posts list...');
        await loadPosts();
        setIsFormOpen(false);
        console.log('✅ Form reset and closed');
      } else {
        console.error('❌ Failed to save blog post:', response?.message || 'Unknown error');
        toast.error(response?.message || 'Failed to save blog post');
      }
    } catch (error) {
      console.error('❌ Error saving blog post:', error);
      toast.error('Failed to save blog post');
    } finally {
      setLoading(false);
      console.log('🏁 Blog post form submission completed');
    }
  };

  const handleTagAdd = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || post.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(posts.map(p => p.category))];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Blog Management</h2>
        <button
          onClick={handleAddNew}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"
        >
          <Plus size={16} />
          <span>New Post</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">
                  {editingId ? 'Edit Post' : 'Create New Post'}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Author *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.author}
                      onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      placeholder="e.g., Gear Guide, Destinations"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Read Time
                    </label>
                    <input
                      type="text"
                      value={formData.readTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, readTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      placeholder="e.g., 5 min read"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image/Emoji
                    </label>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      placeholder="e.g., 🏕️ or image URL"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Excerpt *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={formData.excerpt}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Brief summary of the post..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content *
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Full post content..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleTagRemove(tag)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['camping', 'gear', 'destinations', 'tips', 'beginners', 'advanced', 'nature', 'hiking'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagAdd(tag)}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                        disabled={formData.tags.includes(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="published"
                    checked={formData.published}
                    onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="published" className="ml-2 block text-sm text-gray-900">
                    Publish immediately
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"
                  >
                    <Save size={16} />
                    <span>{editingId ? 'Update' : 'Create'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Posts List */}
      <div>
        {/* Desktop Table */}
        <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Blog Posts ({filteredPosts.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Post
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">{post.image || '📝'}</div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{post.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{post.excerpt}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {post.tags.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="inline-block bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                            {post.tags.length > 3 && (
                              <span className="inline-block bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                                +{post.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {post.author}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {post.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-1 text-gray-400" />
                        {new Date(post.date).toLocaleDateString()}
                      </div>
                      {post.readTime && (
                        <div className="text-xs text-gray-500">{post.readTime}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePublished(post.id || '', !post.published)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          post.published
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        }`}
                      >
                        {post.published ? <Eye size={12} className="mr-1" /> : <EyeOff size={12} className="mr-1" />}
                        {post.published ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(post)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id || '')}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Blog Posts ({filteredPosts.length})
            </h3>
          </div>
          {filteredPosts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="text-2xl flex-shrink-0">{post.image || '📝'}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">{post.title}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">{post.excerpt}</p>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <span className="font-medium">{post.author}</span>
                      <span className="mx-2">•</span>
                      <span>{post.category}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(post)}
                    className="text-blue-600 hover:text-blue-900 p-2"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id || '')}
                    className="text-red-600 hover:text-red-900 p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar size={14} className="mr-1" />
                  <span>{new Date(post.date).toLocaleDateString()}</span>
                  {post.readTime && (
                    <>
                      <span className="mx-2">•</span>
                      <span>{post.readTime}</span>
                    </>
                  )}
                </div>
                <button
                  onClick={() => handleTogglePublished(post.id || '', !post.published)}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    post.published
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  }`}
                >
                  {post.published ? <Eye size={12} className="mr-1" /> : <EyeOff size={12} className="mr-1" />}
                  {post.published ? 'Published' : 'Draft'}
                </button>
              </div>
              
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {post.tags.slice(0, 4).map((tag, idx) => (
                    <span key={idx} className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                  {post.tags.length > 4 && (
                    <span className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                      +{post.tags.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No blog posts found</h3>
              <p className="text-gray-500">
                {searchTerm || filterCategory !== 'all' ? 'Try adjusting your search or filter.' : 'Get started by creating your first blog post.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogManagement;
