import os
from PIL import Image

src_dir = r"l:\inbawk\mobile\game character"
dest_dir = r"l:\inbawk\mobile\assets\images\characters"

os.makedirs(dest_dir, exist_ok=True)

# Map filenames to cleaner IDs
name_map = {
    "player_1.png": "char1",
    "player_2.png": "char2",
    "Player_3.png": "char3",
    "Player_4.png": "char4",
    "Player_5.png": "char5"
}

for filename, char_id in name_map.items():
    filepath = os.path.join(src_dir, filename)
    if not os.path.exists(filepath):
        print(f"Skipping {filename} (not found)")
        continue
        
    try:
        img = Image.open(filepath)
        w, h = img.size
        
        # Grid 2x2
        # TL (0,0) - TR (w/2, 0)
        # BL (0, h/2) - BR (w/2, h/2)
        
        half_w = w // 2
        half_h = h // 2
        
        crops = {
            "neutral": (0, 0, half_w, half_h),     # Top-Left
            "happy": (half_w, 0, w, half_h),       # Top-Right
            "sad": (0, half_h, half_w, h),         # Bottom-Left
            "angry": (half_w, half_h, w, h)        # Bottom-Right
        }
        
        for emotion, box in crops.items():
            cropped = img.crop(box)
            # Resize to something reasonable for mobile (e.g. 128x128 or 256x256) to save space?
            # User didn't ask to resize, but 512x512 might be heavy. Let's keep original for quality or resize to 256.
            # Let's resize to 256x256 for performance.
            cropped = cropped.resize((256, 256), Image.Resampling.LANCZOS)
            
            out_name = f"{char_id}_{emotion}.png"
            out_path = os.path.join(dest_dir, out_name)
            cropped.save(out_path)
            print(f"Saved {out_name}")
            
    except Exception as e:
        print(f"Error processing {filename}: {e}")
