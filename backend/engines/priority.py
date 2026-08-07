def evaluate_priority(category: str, quantity: int, affected_count: int) -> str:
    """
    Evaluates request priority based on Section 12.2 of ReliefLink PRD.
    Returns: 'Critical', 'High', 'Medium', or 'Low'
    """
    cat_clean = category.lower().strip()

    # Rule 1: Critical Triggers
    if "water" in cat_clean:
        # Drinking water requirement: ~3L per person per day. If quantity < 3 * affected_count, critical shortage.
        if quantity < (3 * affected_count) or affected_count >= 150:
            return "Critical"
        return "Critical"  # All water shortages in disaster zones treated as Critical by default
    
    if "medicine" in cat_clean or "medical" in cat_clean or "first_aid" in cat_clean:
        return "Critical"
    
    if affected_count >= 200:
        return "Critical"

    # Rule 2: High Triggers
    if "food" in cat_clean or "ration" in cat_clean or "shelter" in cat_clean or "tents" in cat_clean:
        return "High"

    # Rule 3: Medium Triggers
    if "blanket" in cat_clean or "clothes" in cat_clean or "clothing" in cat_clean:
        return "Medium"

    # Rule 4: Low Triggers
    return "Low"
