#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Logo Optimization Script for kapkazan Mobile App
Removes white padding and optimizes logo for app icons
"""

from PIL import Image, ImageChops
import os
import sys

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def trim_whitespace(img):
    """Remove white background/borders from image"""
    # Convert to RGBA if needed
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    # Get image data
    pixels = img.load()
    width, height = img.size

    # Find bounding box by scanning for non-white pixels
    # White = (255, 255, 255) or close to it
    left, top, right, bottom = width, height, 0, 0

    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y][:3]
            # Check if pixel is NOT white (tolerance for near-white)
            if r < 250 or g < 250 or b < 250:
                left = min(left, x)
                top = min(top, y)
                right = max(right, x)
                bottom = max(bottom, y)

    # Add small margin to found content
    margin = 10
    left = max(0, left - margin)
    top = max(0, top - margin)
    right = min(width, right + margin)
    bottom = min(height, bottom + margin)

    if left < right and top < bottom:
        bbox = (left, top, right, bottom)
        return img.crop(bbox), bbox

    return img, None

def optimize_logo():
    """Optimize logo by removing white padding and centering content"""
    input_file = '../kapkazanson.png'

    if not os.path.exists(input_file):
        print(f"[ERROR] {input_file} not found!")
        return

    print(f"[INFO] Opening {input_file}...")

    try:
        # Load original logo
        img = Image.open(input_file)
        original_size = img.size
        print(f"[OK] Original size: {original_size[0]}x{original_size[1]}px")

        # Trim white padding
        print("[INFO] Removing white padding...")
        trimmed_img, bbox = trim_whitespace(img)

        if bbox:
            trimmed_size = trimmed_img.size
            print(f"[OK] Trimmed size: {trimmed_size[0]}x{trimmed_size[1]}px")
            print(f"[INFO] Removed padding: ~{bbox[0]}px from each side")
        else:
            print("[WARNING] No white padding detected")
            trimmed_img = img.convert('RGBA')

        # Calculate new size with optimal padding (5% on each side = 90% content)
        target_size = 1024
        content_size = int(target_size * 0.90)  # 90% of canvas
        padding = (target_size - content_size) // 2  # 5% padding each side

        print(f"[INFO] Creating optimized {target_size}x{target_size}px icons...")
        print(f"[INFO] Content area: {content_size}x{content_size}px")
        print(f"[INFO] Padding: {padding}px on each side")

        # Icon specifications
        icons = [
            {'name': 'icon.png', 'size': 1024, 'description': 'Main app icon'},
            {'name': 'adaptive-icon.png', 'size': 1024, 'description': 'Android adaptive icon'},
            {'name': 'splash-icon.png', 'size': 1024, 'description': 'Splash screen logo'},
            {'name': 'notification-icon.png', 'size': 1024, 'description': 'Notification icon'},
            {'name': 'favicon.png', 'size': 512, 'description': 'Web favicon'}
        ]

        print("\n[INFO] Generating optimized icons...\n")

        for icon_spec in icons:
            size = icon_spec['size']
            name = icon_spec['name']
            desc = icon_spec['description']

            # Calculate dimensions for this icon
            icon_content_size = int(size * 0.90)
            icon_padding = (size - icon_content_size) // 2

            # Resize trimmed content to fit
            resized_content = trimmed_img.resize(
                (icon_content_size, icon_content_size),
                Image.Resampling.LANCZOS
            )

            # Create transparent canvas
            canvas = Image.new('RGBA', (size, size), (255, 255, 255, 0))

            # Paste resized content centered with padding
            canvas.paste(resized_content, (icon_padding, icon_padding), resized_content)

            # Save optimized icon
            output_path = os.path.join('assets', name)
            canvas.save(output_path, 'PNG', optimize=True, quality=95)

            # Get file size
            file_size = os.path.getsize(output_path) / 1024  # KB

            print(f"[OK] {name:25} {size}x{size}px  ({file_size:.1f}KB)  - {desc}")

        print("\n[SUCCESS] All optimized icons created!")
        print(f"[INFO] Icons saved to: {os.path.abspath('assets')}")

        print("\n[OPTIMIZATION SUMMARY]")
        print(f"   - Original logo: {original_size[0]}x{original_size[1]}px")
        if bbox:
            print(f"   - After trim: {trimmed_size[0]}x{trimmed_size[1]}px")
            print(f"   - Removed white padding: ~{bbox[0]}px")
        print(f"   - Content fill: 90% of canvas")
        print(f"   - Padding: {padding}px on each side")
        print(f"   - Background: Transparent (no white borders!)")

        print("\n[NEXT STEPS]")
        print("   1. Check assets/ folder - logos should look larger now!")
        print("   2. git add assets/")
        print("   3. git commit -m 'FIX: Optimize logo - remove white padding, increase size'")
        print("   4. git push")
        print("   5. Test in app - logo should fill screen better")

    except Exception as e:
        print(f"[ERROR] Error optimizing logo: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    optimize_logo()
