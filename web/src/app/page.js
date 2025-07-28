"use client";

import React, { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const categoriesList = [
  'All',
  'Politics',
  'Business',
  'Crime',
  'Investigative',
  'Local News',
  'International/World News',
  'Science and Technology',
  'Health',
  'Entertainment',
  'Lifestyle',
  'Culture',
  'Human Interest',
  'Sports',
  'Feature Articles',
  'Opinion Pieces',
];

export default function HomePage() {
  const [categories, setCategories] = useState(categoriesList);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const url = selectedCategory === 'All'
      ? `${API_URL}/articles`
      : `${API_URL}/articles?category=${encodeURIComponent(selectedCategory)}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setArticles(data.articles || []);
        setLoading(false);
      });
  }, [selectedCategory]);

  // Split articles for layout
  const featured = articles[0];
  const latest = articles.slice(1, 5);
  const mostRead = articles.slice(5, 10);

  return (
    <>
      <div className="w-full bg-white -mx-4 px-4 md:px-0">
        {/* Categories Nav */}
        <nav className="flex flex-row gap-3 mb-8 border-b pb-2 overflow-x-auto whitespace-nowrap max-w-full">
          {categories.map(cat => (
            <button
              key={cat}
              className={`inline-block px-6 py-2 rounded-full font-medium transition border ${selectedCategory === cat ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-gray-200 hover:bg-gray-100'} whitespace-nowrap`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </nav>
      </div>
      {selectedCategory === 'All' ? (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Featured News */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {featured && (
                <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-4 border border-gray-100 min-h-[420px]">
                  {featured.original?.image_url && (
                    <img src={featured.original.image_url} alt="" className="w-full h-72 object-cover rounded-xl mb-4" />
                  )}
                  <h2 className="text-3xl font-heading font-bold mb-2 text-primary">{featured.title}</h2>
                  <div className="text-xs text-gray-400 mb-2">{featured.original?.source_name}</div>
                  <div className="prose prose-sm max-w-none text-gray-700 mb-2">{featured.summary}</div>
                  <a href={featured.original?.link} target="_blank" rel="noopener noreferrer" className="text-accent font-semibold hover:underline">Continue Reading</a>
                </div>
              )}
            </div>
            {/* Latest News */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <h3 className="text-xl font-bold mb-2 text-primary">Latest News</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {latest.map(article => (
                  <div key={article.id} className="bg-white rounded-2xl shadow p-6 border border-gray-100 flex flex-col gap-3 min-h-[220px]">
                    <div className="flex items-center gap-3 mb-2">
                      {article.original?.image_url && (
                        <img src={article.original.image_url} alt="" className="w-16 h-16 object-cover rounded-md border border-gray-200" />
                      )}
                      <div>
                        <h4 className="font-heading font-semibold text-base mb-1 text-primary line-clamp-2">{article.title}</h4>
                        <div className="text-xs text-gray-400">{article.original?.source_name}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 line-clamp-3">{article.summary}</div>
                    <a href={article.original?.link} target="_blank" rel="noopener noreferrer" className="text-accent font-semibold hover:underline text-sm">Continue Reading</a>
                  </div>
                ))}
              </div>
            </div>
            {/* Most Read */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              <h3 className="text-xl font-bold mb-2 text-primary">Most Read</h3>
              <div className="flex flex-col gap-4">
                {mostRead.map(article => (
                  <div key={article.id} className="flex gap-3 items-center bg-white rounded-xl shadow border border-gray-100 p-3">
                    {article.original?.image_url && (
                      <img src={article.original.image_url} alt="" className="w-14 h-14 object-cover rounded-md border border-gray-200" />
                    )}
                    <div>
                      <h4 className="font-heading font-semibold text-sm mb-1 text-primary line-clamp-2">{article.title}</h4>
                      <a href={article.original?.link} target="_blank" rel="noopener noreferrer" className="text-accent font-semibold hover:underline text-xs">Continue Reading</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {loading && (
            <div className="text-center py-12 text-lg font-semibold">Loading articles...</div>
          )}
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {articles.map(article => (
              <div key={article.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col overflow-hidden hover:shadow-xl transition h-full">
                {article.original?.image_url && (
                  <img src={article.original.image_url} alt="" className="w-full h-48 object-cover" />
                )}
                <div className="p-5 flex flex-col flex-1">
                  <span className="inline-block mb-2 px-3 py-1 text-xs font-semibold bg-gray-100 text-primary rounded-full self-start">{selectedCategory}</span>
                  <h3 className="font-heading font-bold text-lg mb-2 line-clamp-2 text-primary">{article.title}</h3>
                  <div className="text-xs text-gray-400 mb-2">{article.original?.source_name} &middot; {article.original?.pubDate ? new Date(article.original.pubDate).toLocaleDateString() : ''}</div>
                  <div className="text-sm text-gray-600 line-clamp-3 mb-4">{article.summary}</div>
                  <a href={article.original?.link} target="_blank" rel="noopener noreferrer" className="mt-auto text-accent font-semibold hover:underline text-sm">Continue Reading</a>
                </div>
              </div>
            ))}
          </div>
          {loading && (
            <div className="text-center py-12 text-lg font-semibold">Loading articles...</div>
          )}
    </div>
      )}
    </>
  );
}
