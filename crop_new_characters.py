from PIL import Image
import os

# Open the sprite sheet
sprite_sheet_path = r'L:\inbawk\mobile\assets\images\characters\ChatGPT Image Feb 8, 2026, 11_47_16 PM.png'
output_dir = r'L:\inbawk\mobile\assets\images\characters'

img = Image.open(sprite_sheet_path)
width, height = img.size

print(f"Image size: {width}x{height}")

# The image is a 2x3 grid (2 columns, 3 rows)
cols = 2
rows = 3

# Calculate cell dimensions
cell_width = width // cols
cell_height = height // rows

print(f"Cell size: {cell_width}x{cell_height}")

# Character mapping (left to right, top to bottom)
characters = [
    ('char6', 0, 0),  # Top-left
    ('char7', 1, 0),  # Top-right
    ('char8', 0, 1),  # Middle-left
    ('char9', 1, 1),  # Middle-right
    ('char10', 0, 2), # Bottom-left
    ('char11', 1, 2), # Bottom-right
]

# Crop and save each character
for char_name, col, row in characters:
    # Calculate crop box
    left = col * cell_width
    top = row * cell_height
    right = left + cell_width
    bottom = top + cell_height
    
    # Crop the character
    char_img = img.crop((left, top, right, bottom))
    
    # Save as neutral expression
    output_path = os.path.join(output_dir, f'{char_name}_neutral.png')
    char_img.save(output_path)
    print(f"Saved: {output_path}")

print("\nAll characters cropped successfully!")
