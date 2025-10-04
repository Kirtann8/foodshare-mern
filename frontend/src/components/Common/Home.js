import React from 'react';
import { Link } from 'react-router-dom';
import './Common.css';

const Home = () => {
  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Share Food, Reduce Waste, Help Community</h1>
          <p className="hero-subtitle">
            Join FoodShare to connect food donors with those in need. 
            Together, we can make a difference in reducing food waste and fighting hunger.
          </p>
          <div className="hero-actions">
            <Link to="/" className="btn btn-primary btn-large">
              Browse Available Food
            </Link>
            <Link to="/register" className="btn btn-outline btn-large">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2>How It Works</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Post Food</h3>
            <p>Share surplus food with details, images, and pickup information</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Browse & Filter</h3>
            <p>Find available food in your area with smart filters</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤝</div>
            <h3>Claim Food</h3>
            <p>Connect with donors and arrange pickup</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌍</div>
            <h3>Make Impact</h3>
            <p>Reduce waste and help your community</p>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <h2>Our Impact</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">1,000+</div>
            <div className="stat-label">Food Items Shared</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">500+</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">50+</div>
            <div className="stat-label">Cities Covered</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">5,000+</div>
            <div className="stat-label">Meals Saved</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
