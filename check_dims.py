import os
from PIL import Image

image_dir = r"l:\inbawk\mobile\game character"
for filename in os.listdir(image_dir):
    if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        filepath = os.path.join(image_dir, filename)
        try:
            with Image.open(filepath) as img:
                print(f"{filename}: {img.size} (Format: {img.format})")
        except Exception as e:
            print(f"Error reading {filename}: {e}")
