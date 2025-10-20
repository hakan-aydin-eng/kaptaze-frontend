#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Logo Processing Script for kapkazan Mobile App
Converts unnamed.jpg to all required icon formats
"""

from PIL import Image
import os
import sys

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def process_logo():
    # Input file - Updated path for new logo
    input_file = '../kapkazanson.png'

    if not os.path.exists(input_file):
        print(f"[ERROR] {input_file} not found!")
        return

    print(f"[INFO] Opening {input_file}...")

    try:
        # Open the logo
        img = Image.open(input_file)
        print(f"[OK] Logo loaded: {img.size[0]}x{img.size[1]} pixels, mode: {img.mode}")

        # Convert to RGBA (add transparency if needed)
        if img.mode != 'RGBA':
            print("[INFO] Converting to RGBA (adding alpha channel)...")
            img = img.convert('RGBA')

        # Required icon specifications
        icons = [
            {'name': 'icon.png', 'size': 1024, 'description': 'Main app icon'},
            {'name': 'adaptive-icon.png', 'size': 1024, 'description': 'Android adaptive icon'},
            {'name': 'splash-icon.png', 'size': 1024, 'description': 'Splash screen logo'},
            {'name': 'notification-icon.png', 'size': 1024, 'description': 'Notification icon'},
            {'name': 'favicon.png', 'size': 512, 'description': 'Web favicon'}
        ]

        print("\n[INFO] Creating icon variants...\n")

        for icon in icons:
            size = icon['size']
            name = icon['name']
            desc = icon['description']

            # Resize image (high quality)
            resized = img.resize((size, size), Image.Resampling.LANCZOS)

            # Save to assets folder
            output_path = os.path.join('assets', name)
            resized.save(output_path, 'PNG', optimize=True, quality=95)

            # Get file size
            file_size = os.path.getsize(output_path) / 1024  # KB

            print(f"[OK] {name:25} {size}x{size}px  ({file_size:.1f}KB)  - {desc}")

        print("\n[SUCCESS] All icons created successfully!")
        print(f"\n[INFO] Icons saved to: {os.path.abspath('assets')}")

        print("\n[NEXT STEPS]")
        print("   1. Check assets/ folder for new icons")
        print("   2. git add assets/")
        print("   3. git commit -m 'UPDATE: Replace logos with kapkazan branding'")
        print("   4. git push")
        print("   5. Build new app version: eas build")

    except Exception as e:
        print(f"[ERROR] Error processing logo: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    process_logo()
