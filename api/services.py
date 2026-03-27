from datetime import datetime, timedelta
from typing import Dict
from math import log

class TrustScoreCalculator:
    """
    Calculates trust score for renovation teams based on:
    1. Rating Score (0-25 points): Average rating weighted by review count
    2. Volume Score (0-25 points): Number of verified reviews
    3. Recency Score (0-25 points): How recent the reviews are
    4. Verification Score (0-25 points): Percentage of verified project reviews
    """
    
    # Constants
    MIN_REVIEWS_FOR_SCORE = 1
    MAX_RATING = 5.0
    RECENCY_DECAY_DAYS = 180  # Reviews older than 6 months lose points
    
    @staticmethod
    def calculate_rating_score(avg_rating: float, review_count: int) -> float:
        """
        Rating score: 0-25 points
        - Full marks for 5-star average with enough reviews
        - Penalize low review counts
        """
        if review_count < TrustScoreCalculator.MIN_REVIEWS_FOR_SCORE:
            return 0.0
        
        # Base score from rating (0-20)
        rating_base = (avg_rating / TrustScoreCalculator.MAX_RATING) * 20
        
        # Review count multiplier (1-1.25x)
        # With 20+ reviews, get full 1.25x multiplier
        count_multiplier = min(1.0 + (log(review_count + 1) / 10), 1.25)
        
        return min(rating_base * count_multiplier, 25.0)
    
    @staticmethod
    def calculate_volume_score(review_count: int) -> float:
        """
        Volume score: 0-25 points
        - Logarithmic scale: more reviews = higher score, but with diminishing returns
        - Max points at 50+ reviews
        """
        if review_count < TrustScoreCalculator.MIN_REVIEWS_FOR_SCORE:
            return 0.0
        
        # Logarithmic scale: log(review_count + 1) * 7.6 gives us 0-25
        # At 50 reviews: log(51) * 7.6 ≈ 25
        score = min(log(review_count + 1) * 7.6, 25.0)
        return score
    
    @staticmethod
    def calculate_recency_score(reviews: list) -> float:
        """
        Recency score: 0-25 points
        - Recent reviews boost score, old reviews reduce it
        - Reviews older than 180 days lose points
        """
        if not reviews:
            return 0.0
        
        now = datetime.utcnow()
        total_recency_score = 0.0
        
        for review in reviews:
            created_at = review.get("created_at")
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            
            days_old = (now - created_at).days
            
            if days_old <= 30:
                # Recent reviews: full points
                daily_score = 1.0
            elif days_old <= TrustScoreCalculator.RECENCY_DECAY_DAYS:
                # Gradual decay
                daily_score = 1.0 - (days_old / TrustScoreCalculator.RECENCY_DECAY_DAYS) * 0.8
            else:
                # Very old reviews: minimal points
                daily_score = 0.2
            
            total_recency_score += daily_score
        
        # Normalize: cap at 25 points
        avg_recency = total_recency_score / len(reviews) if reviews else 0
        return min(avg_recency * 25, 25.0)
    
    @staticmethod
    def calculate_verification_score(verified_count: int, total_count: int) -> float:
        """
        Verification score: 0-25 points
        - Higher percentage of verified project reviews = higher score
        - Requires at least 1 review to validate
        """
        if total_count < 1:
            return 0.0
        
        verification_rate = verified_count / total_count
        # Square the rate to heavily reward verified reviews
        return min(verification_rate ** 2 * 25, 25.0)
    
    @staticmethod
    def calculate_total_score(
        avg_rating: float,
        review_count: int,
        reviews: list,
        verified_count: int
    ) -> Dict[str, float]:
        """
        Calculate complete trust score breakdown
        Returns dict with individual scores and total (0-100)
        """
        rating_score = TrustScoreCalculator.calculate_rating_score(avg_rating, review_count)
        volume_score = TrustScoreCalculator.calculate_volume_score(review_count)
        recency_score = TrustScoreCalculator.calculate_recency_score(reviews)
        verification_score = TrustScoreCalculator.calculate_verification_score(
            verified_count, review_count
        )
        
        total_score = rating_score + volume_score + recency_score + verification_score
        
        return {
            "rating_score": round(rating_score, 2),
            "volume_score": round(volume_score, 2),
            "recency_score": round(recency_score, 2),
            "verification_score": round(verification_score, 2),
            "total_score": round(max(0, min(total_score, 100)), 2),
        }
