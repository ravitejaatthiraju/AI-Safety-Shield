import math

def get_proximity_score(results, distance_threshold=100):
    """
    Calculates threat score based on distance, BUT ignores background people.
    
    Args:
        distance_threshold (int): Reduced to 100px (stricter).
    """
    
    person_boxes = []
    proximity_score = 0

    # --- 1. EXTRACT PERSON DATA ---
    if results is None:
        return 0

    for r in results:
        boxes = r.boxes
        for box in boxes:
            # Class 0 is 'Person'
            if int(box.cls[0]) == 0:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                
                # Calculate Center
                cx = (x1 + x2) / 2
                cy = (y1 + y2) / 2
                
                # Calculate Height (Used for Depth Estimation)
                height = y2 - y1
                
                # Store Center AND Height
                person_boxes.append({
                    "center": (cx, cy),
                    "height": height,
                    "coords": (x1, y1, x2, y2)
                })

    # --- 2. CALCULATE INTELLIGENT DISTANCE ---
    if len(person_boxes) < 2:
        return 0

    for i in range(len(person_boxes)):
        for j in range(i + 1, len(person_boxes)):
            p1 = person_boxes[i]
            p2 = person_boxes[j]
            
            # --- DEPTH CHECK (The Fix) ---
            # Compare heights. If one person is > 1.5x taller, they are at different depths.
            h1 = p1["height"]
            h2 = p2["height"]
            
            # Avoid division by zero
            if h1 == 0 or h2 == 0: continue
            
            size_ratio = max(h1, h2) / min(h1, h2)
            
            # If size difference is too big, IGNORE this pair (Background vs Foreground)
            if size_ratio > 1.5:
                continue 

            # --- STANDARD DISTANCE CHECK ---
            c1 = p1["center"]
            c2 = p2["center"]
            distance = math.sqrt((c1[0] - c2[0])**2 + (c1[1] - c2[1])**2)
            
            if distance < distance_threshold:
                return 15 # DANGER: Close and same size

    return 0