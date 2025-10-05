import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="w-full">
      <section className="bg-gradient-to-r from-green-500 to-green-600 text-white py-24 px-8 rounded-2xl mb-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 leading-tight">Share Food, Reduce Waste, Help Community</h1>
          <p className="text-xl mb-8 leading-relaxed">
            Join FoodShare to connect food donors with those in need. 
            Together, we can make a difference in reducing food waste and fighting hunger.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/" className="inline-block px-8 py-4 bg-white text-green-600 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 no-underline text-lg">
              Browse Available Food
            </Link>
            <Link to="/register" className="inline-block px-8 py-4 bg-transparent text-white font-semibold rounded-lg border-2 border-white hover:bg-white hover:text-green-600 transition-all duration-300 no-underline text-lg">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <section className="mb-16 px-8">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 text-center">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Post Food</h3>
            <p className="text-gray-600 leading-relaxed">Share surplus food with details, images, and pickup information</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Browse & Filter</h3>
            <p className="text-gray-600 leading-relaxed">Find available food in your area with smart filters</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 text-center">
            <div className="text-5xl mb-4">🤝</div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Claim Food</h3>
            <p className="text-gray-600 leading-relaxed">Connect with donors and arrange pickup</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 text-center">
            <div className="text-5xl mb-4">🌍</div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Make Impact</h3>
            <p className="text-gray-600 leading-relaxed">Reduce waste and help your community</p>
          </div>
        </div>
      </section>

      <section className="bg-green-50 py-16 px-8 rounded-2xl">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Our Impact</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">1,000+</div>
            <div className="text-gray-600 font-medium">Food Items Shared</div>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">500+</div>
            <div className="text-gray-600 font-medium">Active Users</div>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">50+</div>
            <div className="text-gray-600 font-medium">Cities Covered</div>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">5,000+</div>
            <div className="text-gray-600 font-medium">Meals Saved</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
