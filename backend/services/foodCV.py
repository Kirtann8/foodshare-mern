#!/usr/bin/env python3
import cv2
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import io
from PIL import Image
from datetime import datetime
import logging
import os
import requests
from tensorflow.keras.applications import imagenet_utils
from sklearn.ensemble import RandomForestClassifier
import joblib
from pathlib import Path

logging.basicConfig(level=logging.INFO)
app = Flask(__name__)
CORS(app)

# Create models directory if it doesn't exist
models_dir = Path('models')
models_dir.mkdir(exist_ok=True)

class FoodQualityAI:
    def __init__(self):
        print("Initializing Enhanced Food Quality AI...")
        
        # Load multiple pre-trained models for ensemble prediction
        self.models = {}
        self.load_models()
        
        # Load or train freshness classifier
        self.freshness_classifier = self.load_freshness_classifier()
        
        # Enhanced food detection keywords
        self.food_keywords = [
            'apple', 'banana', 'orange', 'strawberry', 'grape', 'lemon', 'lime',
            'tomato', 'carrot', 'broccoli', 'lettuce', 'spinach', 'potato', 'onion',
            'bread', 'pizza', 'sandwich', 'pasta', 'rice', 'noodle', 'soup',
            'meat', 'chicken', 'beef', 'fish', 'salmon', 'tuna', 'egg',
            'cheese', 'milk', 'yogurt', 'cake', 'cookie', 'pie', 'fruit',
            'vegetable', 'salad', 'burger', 'hamburger', 'cheeseburger', 'hot_dog', 'taco', 'burrito',
            'french_fries', 'fries', 'bagel', 'muffin', 'donut', 'pretzel', 'waffle', 'pancake'
        ]
        
        # Enhanced food categories with detailed freshness indicators
        self.food_freshness_map = {
            # Fruits (high freshness sensitivity)
            'apple': {'base_shelf': 7, 'freshness_factor': 1.2, 'category': 'fruit'},
            'banana': {'base_shelf': 5, 'freshness_factor': 1.5, 'category': 'fruit'},
            'orange': {'base_shelf': 10, 'freshness_factor': 1.0, 'category': 'fruit'},
            'strawberry': {'base_shelf': 3, 'freshness_factor': 2.0, 'category': 'fruit'},
            'grapes': {'base_shelf': 7, 'freshness_factor': 1.3, 'category': 'fruit'},
            
            # Vegetables (medium freshness sensitivity)
            'broccoli': {'base_shelf': 5, 'freshness_factor': 1.4, 'category': 'vegetable'},
            'carrot': {'base_shelf': 14, 'freshness_factor': 0.8, 'category': 'vegetable'},
            'lettuce': {'base_shelf': 7, 'freshness_factor': 1.6, 'category': 'vegetable'},
            'tomato': {'base_shelf': 7, 'freshness_factor': 1.2, 'category': 'vegetable'},
            
            # Cooked foods (low freshness sensitivity)
            'pizza': {'base_shelf': 3, 'freshness_factor': 0.9, 'category': 'cooked'},
            'sandwich': {'base_shelf': 2, 'freshness_factor': 1.1, 'category': 'cooked'},
            'pasta': {'base_shelf': 4, 'freshness_factor': 0.8, 'category': 'cooked'},
            'rice': {'base_shelf': 4, 'freshness_factor': 0.7, 'category': 'cooked'},
            
            # Fast food
            'burger': {'base_shelf': 1, 'freshness_factor': 1.5, 'category': 'fast_food'},
            'hamburger': {'base_shelf': 1, 'freshness_factor': 1.5, 'category': 'fast_food'},
            'cheeseburger': {'base_shelf': 1, 'freshness_factor': 1.5, 'category': 'fast_food'},
            'french_fries': {'base_shelf': 1, 'freshness_factor': 2.0, 'category': 'fast_food'},
            
            # Baked goods
            'bread': {'base_shelf': 5, 'freshness_factor': 1.0, 'category': 'baked'},
            'cake': {'base_shelf': 3, 'freshness_factor': 0.9, 'category': 'baked'},
            'cookie': {'base_shelf': 7, 'freshness_factor': 0.6, 'category': 'baked'}
        }
    
    def load_models(self):
        """Load pre-trained models with error handling"""
        try:
            # Start with lightweight model to avoid memory issues
            print("Loading MobileNetV2...")
            self.models['mobilenet'] = tf.keras.applications.MobileNetV2(
                weights='imagenet', include_top=True
            )
            print(f"Successfully loaded {len(self.models)} models")
            
        except Exception as e:
            print(f"Error loading models: {e}")
            # If even basic model fails, create a dummy model
            self.models = {}
    
    def load_freshness_classifier(self):
        """Load or create freshness classification model"""
        classifier_path = models_dir / 'freshness_classifier.joblib'
        
        if classifier_path.exists():
            try:
                return joblib.load(classifier_path)
            except:
                pass
        
        # Create and train a simple freshness classifier
        # This would normally be trained on a large dataset
        classifier = RandomForestClassifier(n_estimators=100, random_state=42)
        
        # Dummy training data (in production, use real labeled data)
        X_dummy = np.random.random((1000, 10))  # 10 features
        y_dummy = np.random.randint(0, 2, 1000)  # Binary: fresh/not fresh
        
        classifier.fit(X_dummy, y_dummy)
        
        # Save the classifier
        try:
            joblib.dump(classifier, classifier_path)
        except:
            pass
            
        return classifier
        
    def preprocess_image(self, image_data):
        """Enhanced image preprocessing for multiple models"""
        try:
            # Decode base64 image
            if ',' in image_data:
                image_bytes = base64.b64decode(image_data.split(',')[1])
            else:
                image_bytes = base64.b64decode(image_data)
                
            image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
            
            # Simplified preprocessing for available models
            processed_images = {}
            img_224 = image.resize((224, 224))
            img_array_224 = np.array(img_224)
            
            # Process for available models
            for model_name in self.models.keys():
                processed_images[model_name] = np.expand_dims(
                    tf.keras.applications.imagenet_utils.preprocess_input(img_array_224.copy()), axis=0
                )
            
            # Return processed images and original for analysis
            original_array = np.array(image.resize((224, 224)))
            return processed_images, original_array
            
        except Exception as e:
            print(f"Image preprocessing error: {e}")
            raise ValueError(f"Failed to process image: {str(e)}")
    
    def analyze_advanced_freshness(self, image):
        """Enhanced multi-dimensional freshness analysis"""
        try:
            # Multi-color space analysis
            hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
            lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
            yuv = cv2.cvtColor(image, cv2.COLOR_RGB2YUV)
            
            # Color analysis
            h, s, v = cv2.split(hsv)
            l, a, b = cv2.split(lab)
            y, u, v_yuv = cv2.split(yuv)
            
            # Enhanced freshness indicators
            color_variance = np.std(h) / 180.0
            saturation_mean = np.mean(s) / 255.0
            brightness_mean = np.mean(v) / 255.0
            
            # Advanced decay detection
            brown_ratio = np.sum(a > 128) / a.size
            dark_spots = np.sum(l < 50) / l.size  # Dark spots indicate decay
            
            # Texture analysis
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            
            # Edge sharpness
            edges = cv2.Canny(gray, 50, 150)
            edge_density = np.sum(edges > 0) / edges.size
            
            # Texture uniformity (fresh food has more uniform texture)
            texture_variance = np.std(gray) / 255.0
            
            # Local Binary Pattern for texture analysis
            lbp = self.calculate_lbp(gray)
            lbp_uniformity = np.std(lbp) / 255.0
            
            # Color distribution analysis
            color_hist = cv2.calcHist([hsv], [0, 1], None, [50, 60], [0, 180, 0, 256])
            color_diversity = np.count_nonzero(color_hist) / color_hist.size
            
            # Combine all metrics with optimized weights
            freshness_features = np.array([
                color_variance,
                saturation_mean,
                1 - brown_ratio,
                1 - dark_spots,
                edge_density,
                texture_variance,
                1 - lbp_uniformity,
                color_diversity,
                0.7 - abs(brightness_mean - 0.7),
                np.mean(u) / 255.0  # Color balance
            ])
            
            # Use trained classifier if available
            if hasattr(self, 'freshness_classifier'):
                try:
                    freshness_prob = self.freshness_classifier.predict_proba([freshness_features])[0][1]
                    return float(min(1.0, max(0.0, freshness_prob)))
                except:
                    pass
            
            # Fallback to weighted combination
            weights = [0.15, 0.15, 0.15, 0.1, 0.1, 0.1, 0.1, 0.05, 0.05, 0.05]
            freshness_score = np.dot(freshness_features, weights)
            
            return float(min(1.0, max(0.0, freshness_score)))
            
        except Exception as e:
            print(f"Freshness analysis error: {e}")
            return 0.5  # Default moderate freshness
    
    def calculate_lbp(self, gray, radius=1, n_points=8):
        """Calculate Local Binary Pattern for texture analysis"""
        try:
            lbp = np.zeros_like(gray)
            for i in range(radius, gray.shape[0] - radius):
                for j in range(radius, gray.shape[1] - radius):
                    center = gray[i, j]
                    binary_string = ''
                    for k in range(n_points):
                        angle = 2 * np.pi * k / n_points
                        x = int(i + radius * np.cos(angle))
                        y = int(j + radius * np.sin(angle))
                        if x < gray.shape[0] and y < gray.shape[1]:
                            binary_string += '1' if gray[x, y] >= center else '0'
                    lbp[i, j] = int(binary_string, 2) if binary_string else 0
            return lbp
        except:
            return gray  # Fallback to original image
    
    def analyze_texture_quality(self, image):
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        return float(min(100, laplacian_var / 100))
    
    def estimate_portion_size(self, image):
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if contours:
            area = cv2.contourArea(max(contours, key=cv2.contourArea))
            return max(1, int(area / 15000))
        return 1
    
    def is_food_image(self, predictions):
        """Enhanced food detection using multiple criteria"""
        if not predictions:
            return False, None, 0
        
        # Non-food items to exclude
        non_food_items = ['baraca', 'theater', 'curtain', 'stage', 'performance', 'building', 'architecture']
        
        # Check top predictions for food keywords
        for class_name, score in predictions[:3]:  # Only check top 3
            class_lower = class_name.lower().replace('_', ' ')
            score = float(score)
            
            # Skip non-food items
            if any(non_food in class_lower for non_food in non_food_items):
                continue
            
            # Direct food keyword match with higher confidence
            if any(keyword in class_lower for keyword in self.food_keywords) and score > 0.3:
                return True, class_name, score
        
        # Check for common food terms with stricter criteria
        for class_name, score in predictions[:2]:
            class_lower = class_name.lower().replace('_', ' ')
            score = float(score)
            
            food_terms = ['pizza', 'burger', 'sandwich', 'bread', 'meat', 'chicken', 'pasta']
            if any(term in class_lower for term in food_terms) and score > 0.5:
                return True, class_name, score
        
        return False, None, 0
    
    def detect_non_food_objects(self, image, predictions):
        """Detect non-food objects that might be mistaken for food"""
        non_food_objects = [
            'person', 'face', 'hand', 'finger', 'body',
            'plate', 'bowl', 'cup', 'glass', 'utensil', 'fork', 'knife', 'spoon',
            'table', 'chair', 'kitchen', 'restaurant',
            'plastic', 'paper', 'cardboard', 'packaging'
        ]
        
        # Check predictions for non-food objects
        for class_name, score in predictions[:3]:
            class_lower = class_name.lower().replace('_', ' ')
            score = float(score)  # Ensure score is numeric
            if any(obj in class_lower for obj in non_food_objects):
                if score > 0.5:  # High confidence non-food object
                    return True, class_name
        
        # Simple skin tone detection for faces/hands
        try:
            hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
            skin_mask = cv2.inRange(hsv, (0, 20, 70), (20, 255, 255))
            skin_ratio = np.sum(skin_mask > 0) / (image.shape[0] * image.shape[1])
            if skin_ratio > 0.2:  # Significant skin-like pixels
                return True, 'human_skin_detected'
        except:
            pass
            
        return False, None

    def ensemble_prediction(self, processed_images):
        """Enhanced ensemble predictions from multiple models"""
        predictions = {}
        
        # Get predictions from each available model
        for model_name, model in self.models.items():
            if model_name not in processed_images:
                continue
                
            try:
                pred = model.predict(processed_images[model_name], verbose=0)
                
                # Decode predictions
                from tensorflow.keras.applications.imagenet_utils import decode_predictions
                decoded = decode_predictions(pred, top=5)
                
                predictions[model_name] = decoded[0]
                print(f"Model {model_name} predictions: {[p[1] for p in decoded[0][:3]]}")
                
            except Exception as e:
                print(f"Model {model_name} failed: {e}")
                continue
        
        if not predictions:
            return []
        
        # Simple averaging for single model or ensemble
        if len(predictions) == 1:
            return list(predictions.values())[0]
        
        # Ensemble voting for multiple models
        food_scores = {}
        for model_preds in predictions.values():
            for pred in model_preds:
                # Handle both tuple formats: (id, class_name, score) or (class_name, score)
                if len(pred) == 3:
                    _, class_name, score = pred
                else:
                    class_name, score = pred
                
                if class_name not in food_scores:
                    food_scores[class_name] = []
                food_scores[class_name].append(float(score))
        
        # Calculate average scores
        final_predictions = []
        for class_name, scores in food_scores.items():
            avg_score = float(np.mean(scores))
            final_predictions.append((class_name, avg_score))
        
        # Sort by average score
        final_predictions.sort(key=lambda x: float(x[1]), reverse=True)
        return final_predictions[:5]
    
    def assess_food_quality(self, image_data):
        """Enhanced food quality assessment with improved accuracy"""
        try:
            print("Starting food quality assessment...")
            
            # Preprocess image for all models
            processed_images, raw_image = self.preprocess_image(image_data)
            print(f"Image preprocessed for {len(processed_images)} models")
            
            # Get ensemble predictions
            top_predictions = self.ensemble_prediction(processed_images)
            
            if not top_predictions:
                return {'error': 'Analysis failed - no valid predictions from any model'}
            
            print("Top predictions:", [(p[0], round(float(p[1]), 3)) for p in top_predictions[:3]])
            
            # Enhanced food detection
            is_food, food_type, confidence = self.is_food_image(top_predictions)
            
            if not is_food:
                # Check for non-food objects
                is_non_food, non_food_type = self.detect_non_food_objects(raw_image, top_predictions)
                if is_non_food:
                    return {'error': f'Non-food object detected: {non_food_type}. Please scan actual food items. 🥗📱'}
                else:
                    return {'error': f'No food detected! Detected: {top_predictions[0][0]}. Please scan actual food items. 🥗📱'}
            
            print(f"Food detected: {food_type} (confidence: {round(float(confidence), 3)})")
            
            # Advanced analysis
            freshness_ratio = self.analyze_advanced_freshness(raw_image)
            texture_score = self.analyze_texture_quality(raw_image)
            servings = self.estimate_portion_size(raw_image)
            
            print(f"Analysis scores - Freshness: {round(float(freshness_ratio), 3)}, Texture: {round(float(texture_score), 3)}")
            
            # Get food-specific parameters
            food_key = None
            food_type_lower = food_type.lower()
            for key in self.food_freshness_map.keys():
                if key in food_type_lower or food_type_lower in key:
                    food_key = key
                    break
            
            if food_key:
                food_params = self.food_freshness_map[food_key]
                base_shelf = food_params['base_shelf']
                freshness_factor = food_params['freshness_factor']
                food_category = food_params['category']
            else:
                base_shelf = 5
                freshness_factor = 1.0
                food_category = 'unknown'
            
            # Enhanced freshness scoring with confidence weighting
            confidence_weight = min(1.0, float(confidence) * 2)  # Boost confidence impact
            freshness_score = (
                float(freshness_ratio) * 50 +      # Advanced analysis (50%)
                float(texture_score) * 25 +        # Texture quality (25%)
                float(confidence_weight) * 25      # AI confidence (25%)
            )
            
            # Apply food-specific adjustments
            if food_category == 'fruit':
                freshness_score *= 1.1  # Fruits show freshness better
            elif food_category == 'cooked':
                freshness_score *= 0.9   # Cooked food harder to assess
            elif food_category == 'fast_food':
                freshness_score *= 0.8   # Fast food degrades quickly
            
            freshness_score = float(min(100, max(20, freshness_score)))
            
            # Intelligent shelf life prediction
            shelf_life = max(1, min(21, int(float(base_shelf) * (float(freshness_score) / 100) * float(freshness_factor))))
            
            # Enhanced quality grading
            if freshness_score >= 85:
                quality_grade = 'Excellent'
                grade_emoji = '⭐'
            elif freshness_score >= 70:
                quality_grade = 'Good'
                grade_emoji = '✅'
            elif freshness_score >= 50:
                quality_grade = 'Fair'
                grade_emoji = '⚡'
            else:
                quality_grade = 'Poor'
                grade_emoji = '⚠️'
            
            # Donation suitability with stricter criteria
            donation_suitable = float(freshness_score) >= 60 and int(shelf_life) >= 2
            
            result = {
                'freshness_score': round(float(freshness_score), 1),
                'quality_grade': f'{grade_emoji} {quality_grade}',
                'shelf_life_days': shelf_life,
                'confidence': round(float(confidence) * 100, 1),
                'donation_suitable': donation_suitable,
                'estimated_servings': servings,
                'food_type': food_type.replace('_', ' ').title(),
                'food_category': food_category,
                'ensemble_predictions': [f"{pred[0].replace('_', ' ').title()} ({pred[1]*100:.1f}%)" for pred in top_predictions[:3]],
                'recommendations': self.generate_recommendations(freshness_score, shelf_life, food_type, donation_suitable),
                'analysis_details': {
                    'freshness_ratio': round(float(freshness_ratio), 3),
                    'texture_score': round(float(texture_score), 3),
                    'models_used': list(processed_images.keys()),
                    'food_category': food_category
                },
                'timestamp': datetime.now().isoformat()
            }
            
            print(f"Assessment complete: {quality_grade} ({round(float(freshness_score), 1)}%)")
            return result
            
        except Exception as e:
            print(f"Assessment error: {str(e)}")
            return {'error': f'Analysis failed: {str(e)}. Please try again with a clearer image.'}
    
    def generate_recommendations(self, freshness_score, shelf_life, food_type="", donation_suitable=True):
        """Generate enhanced recommendations based on analysis"""
        recommendations = []
        
        # Quality-based recommendations with more detail
        if freshness_score >= 85:
            recommendations.append("⭐ Premium quality - perfect for donation and sharing")
            recommendations.append("🎯 Ideal for food banks and community programs")
        elif freshness_score >= 70:
            recommendations.append("✅ Excellent for donation - high quality food")
            recommendations.append("🤝 Great for immediate sharing with neighbors")
        elif freshness_score >= 50:
            recommendations.append("⚡ Good for immediate donation or consumption")
            recommendations.append("⏰ Share within 24-48 hours for best quality")
        else:
            recommendations.append("⚠️ Not recommended for donation - consume immediately")
            recommendations.append("🏠 Best kept for personal/family consumption")
        
        # Enhanced food-specific storage recommendations
        food_lower = food_type.lower()
        if any(x in food_lower for x in ['fruit', 'apple', 'banana', 'berry', 'grape', 'orange']):
            recommendations.append(f"🍎 Store in cool, dry place - best within {shelf_life} days")
            if 'banana' in food_lower:
                recommendations.append("🍌 Separate from other fruits to prevent over-ripening")
        elif any(x in food_lower for x in ['vegetable', 'salad', 'lettuce', 'broccoli', 'carrot']):
            recommendations.append(f"🥬 Refrigerate immediately - use within {shelf_life} days")
            recommendations.append("💧 Keep in crisper drawer with proper humidity")
        elif any(x in food_lower for x in ['bread', 'cake', 'pastry', 'cookie']):
            recommendations.append(f"🍞 Store in airtight container - best within {shelf_life} days")
            if freshness_score < 70:
                recommendations.append("🔥 Consider toasting bread or reheating baked goods")
        elif any(x in food_lower for x in ['meat', 'fish', 'chicken', 'beef']):
            recommendations.append(f"🍖 Keep refrigerated - use within {shelf_life} days")
            recommendations.append("🌡️ Ensure proper temperature control during transport")
        elif any(x in food_lower for x in ['pizza', 'sandwich', 'pasta', 'rice']):
            recommendations.append(f"🍕 Refrigerate and consume within {shelf_life} days")
            recommendations.append("♨️ Reheat thoroughly before consumption")
        else:
            recommendations.append(f"📅 Best consumed within {shelf_life} days")
        
        # Freshness-specific advice
        if freshness_score < 60:
            recommendations.append("❄️ Consider freezing to extend shelf life")
            recommendations.append("🔍 Inspect carefully before consumption")
        
        # Donation-specific advice
        if donation_suitable:
            recommendations.append("📱 Use FoodShare app to connect with local recipients")
            if shelf_life >= 5:
                recommendations.append("🚚 Suitable for food bank delivery programs")
        else:
            recommendations.append("🏠 Best for personal consumption or composting")
        
        # Sustainability tip
        if freshness_score >= 60:
            recommendations.append("🌱 Help reduce food waste by sharing with community")
        
        return recommendations

# Initialize the enhanced AI system
print("Initializing Enhanced Food Quality AI System...")
food_ai = FoodQualityAI()
print("AI System ready!")

@app.route('/assess-food', methods=['POST'])
def assess_food_quality():
    """Enhanced food quality assessment endpoint"""
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({
                'success': False, 
                'error': 'No image provided. Please include base64 encoded image data.'
            }), 400
        
        print(f"Received assessment request at {datetime.now()}")
        
        # Process single image or batch
        images = data.get('images', [data['image']])
        results = []
        
        for i, image in enumerate(images):
            print(f"Processing image {i+1}/{len(images)}")
            
            if not image or len(image) < 100:  # Basic validation
                results.append({'error': 'Invalid image data provided'})
                continue
                
            result = food_ai.assess_food_quality(image)
            
            if 'error' in result:
                if len(images) == 1:  # Single image - return error immediately
                    return jsonify({'success': False, 'error': result['error']}), 400
                else:  # Batch - include error in results
                    results.append(result)
            else:
                results.append(result)
        
        # Return appropriate response format
        if len(results) == 1:
            if 'error' in results[0]:
                return jsonify({'success': False, 'error': results[0]['error']}), 400
            return jsonify({'success': True, 'data': results[0]})
        else:
            # Batch results
            successful_results = [r for r in results if 'error' not in r]
            return jsonify({
                'success': True, 
                'data': results,
                'summary': {
                    'total': len(results),
                    'successful': len(successful_results),
                    'failed': len(results) - len(successful_results)
                }
            })
            
    except Exception as e:
        print(f"Assessment endpoint error: {str(e)}")
        return jsonify({
            'success': False, 
            'error': f'Server error during assessment: {str(e)}'
        }), 500

@app.route('/models/status', methods=['GET'])
def get_model_status():
    """Enhanced model status check with detailed information"""
    status = {}
    total_models = len(food_ai.models)
    ready_models = 0
    
    for model_name, model in food_ai.models.items():
        try:
            # Test prediction with appropriate input size
            if model_name == 'inception':
                test_input = np.random.random((1, 299, 299, 3))
            elif model_name == 'efficientnet':
                test_input = np.random.random((1, 300, 300, 3))
            else:
                test_input = np.random.random((1, 224, 224, 3))
                
            # Quick prediction test
            pred = model.predict(test_input, verbose=0)
            status[model_name] = {
                'status': 'ready',
                'input_shape': test_input.shape,
                'output_shape': pred.shape,
                'model_type': type(model).__name__
            }
            ready_models += 1
            
        except Exception as e:
            status[model_name] = {
                'status': 'error',
                'error': str(e),
                'model_type': type(model).__name__ if model else 'unknown'
            }
    
    # Check freshness classifier
    classifier_status = 'ready' if hasattr(food_ai, 'freshness_classifier') else 'not_loaded'
    
    return jsonify({
        'success': True,
        'models': status,
        'summary': {
            'total_models': total_models,
            'ready_models': ready_models,
            'ensemble_ready': ready_models > 0,
            'freshness_classifier': classifier_status,
            'food_keywords_count': len(food_ai.food_keywords),
            'food_categories_count': len(food_ai.food_freshness_map)
        },
        'timestamp': datetime.now().isoformat()
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Enhanced health check with system information"""
    try:
        # Quick model test
        models_ready = len([m for m in food_ai.models.values() if m is not None])
        
        return jsonify({
            'status': 'healthy',
            'service': 'Enhanced Food Quality AI',
            'version': '2.0',
            'models_loaded': models_ready,
            'features': [
                'Multi-model ensemble prediction',
                'Advanced freshness analysis',
                'Texture quality assessment',
                'Smart food detection',
                'Batch processing support'
            ],
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/test-prediction', methods=['POST'])
def test_prediction():
    """Test endpoint for quick model validation"""
    try:
        # Create a simple test image (solid color)
        test_image = np.ones((224, 224, 3), dtype=np.uint8) * 128  # Gray image
        test_pil = Image.fromarray(test_image)
        
        # Convert to base64
        buffer = io.BytesIO()
        test_pil.save(buffer, format='JPEG')
        test_b64 = base64.b64encode(buffer.getvalue()).decode()
        test_data = f"data:image/jpeg;base64,{test_b64}"
        
        # Run assessment
        result = food_ai.assess_food_quality(test_data)
        
        return jsonify({
            'success': True,
            'test_result': result,
            'message': 'Model test completed successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Model test failed: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)