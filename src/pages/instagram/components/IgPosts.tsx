const igGradient = 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)';

interface IgPost {
  id: string;
  type: string;
  thumbnail: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  leads: number;
  postedAt: string;
}

interface IgPostsProps {
  posts: IgPost[];
  onNewPost: () => void;
}

export default function IgPosts({ posts, onNewPost }: IgPostsProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Posts & Reels Performance</h3>
          <p className="text-xs text-slate-400 mt-0.5">Track engagement, reach and leads generated from each post</p>
        </div>
        <button
          onClick={onNewPost}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap hover:opacity-90"
          style={{ background: igGradient }}
        >
          <i className="ri-add-line" />New Post
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex gap-4 p-4">
              <div className="relative flex-shrink-0">
                <img loading="lazy" decoding="async" src={post.thumbnail} alt={post.type} className="w-20 h-20 rounded-xl object-cover object-top" />
                <span
                  className="absolute top-1 left-1 text-[9px] text-white px-1.5 py-0.5 rounded-full font-bold uppercase"
                  style={{ background: igGradient }}
                >
                  {post.type}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-2">{post.caption}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                  <span className="flex items-center gap-1"><i className="ri-heart-line text-rose-400" />{post.likes.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><i className="ri-chat-1-line text-sky-400" />{post.comments}</span>
                  <span className="flex items-center gap-1"><i className="ri-share-line text-slate-400" />{post.shares}</span>
                  <span className="flex items-center gap-1"><i className="ri-bookmark-line text-amber-400" />{post.saves}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">Reach: <strong className="text-slate-700">{post.reach.toLocaleString()}</strong></span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(220,31,31,0.08)', color: '#DC1F1F' }}>
                    {post.leads} leads
                  </span>
                  <span className="text-[10px] text-slate-400 ml-auto">{post.postedAt}</span>
                </div>
              </div>
            </div>
            <div className="px-4 pb-4">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min((post.likes / 4000) * 100, 100)}%`, background: igGradient }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-slate-400">Engagement rate</span>
                <span className="text-[10px] font-semibold text-slate-600">
                  {((post.likes + post.comments + post.shares) / post.reach * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
