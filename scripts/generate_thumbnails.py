#!/usr/bin/env python3
"""
Automatically generate thumbnails for images in images/fulls/ directory.
Thumbnails are saved to images/thumbs/ with the same filename.
"""

import os
import sys
from pathlib import Path
from PIL import Image

def generate_thumbnails(fulls_dir="images/fulls", thumbs_dir="images/thumbs", thumb_width=300):
    """Generate thumbnails for all images in fulls directory."""

    fulls_path = Path(fulls_dir)
    thumbs_path = Path(thumbs_dir)

    # Ensure directories exist
    if not fulls_path.exists():
        print(f"Error: {fulls_dir} directory not found")
        return False

    thumbs_path.mkdir(parents=True, exist_ok=True)

    # Supported image extensions
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}

    generated = []
    errors = []

    # Process all image files in fulls directory
    for image_file in fulls_path.iterdir():
        if image_file.suffix.lower() in image_extensions:
            try:
                thumb_path = thumbs_path / image_file.name

                # Open and resize image
                with Image.open(image_file) as img:
                    # Convert RGBA to RGB if needed
                    if img.mode in ('RGBA', 'LA', 'P'):
                        background = Image.new('RGB', img.size, (255, 255, 255))
                        background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                        img = background

                    # Create thumbnail
                    img.thumbnail((thumb_width, thumb_width), Image.Resampling.LANCZOS)

                    # Save thumbnail
                    img.save(thumb_path, "JPEG", quality=85)
                    generated.append(image_file.name)

            except Exception as e:
                errors.append(f"{image_file.name}: {str(e)}")

    # Print results
    if generated:
        print(f"Generated {len(generated)} thumbnail(s):")
        for name in generated:
            print(f"  ✓ {name}")

    if errors:
        print(f"\nErrors ({len(errors)}):")
        for error in errors:
            print(f"  ✗ {error}")
        return False

    return True

if __name__ == "__main__":
    # Get the script directory and change to project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    os.chdir(project_root)

    success = generate_thumbnails()
    sys.exit(0 if success else 1)
