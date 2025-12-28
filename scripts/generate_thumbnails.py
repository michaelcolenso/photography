#!/usr/bin/env python3
"""
Automatically generate thumbnails for images in images/fulls/ directory.
Thumbnails are saved to images/thumbs/ with the same filename.

Improvements:
- Applies EXIF orientation before resizing
- Better EXIF preservation
- Skips unchanged files (deduplication)
- Command-line arguments for flexibility
- Progressive JPEG output
"""

import os
import sys
import hashlib
from pathlib import Path
from PIL import Image, ImageOps

def get_file_hash(file_path):
    """Calculate MD5 hash of file for change detection."""
    hasher = hashlib.md5()
    try:
        with open(file_path, 'rb') as f:
            # Read in chunks to handle large files
            for chunk in iter(lambda: f.read(8192), b""):
                hasher.update(chunk)
        return hasher.hexdigest()
    except Exception:
        return None

def needs_regeneration(source_file, thumb_file):
    """Check if thumbnail needs regeneration."""
    if not thumb_file.exists():
        return True

    # Check if source is newer (simple timestamp check)
    if source_file.stat().st_mtime > thumb_file.stat().st_mtime:
        return True

    return False

def copy_exif_data(source_img):
    """Extract EXIF data from source image."""
    try:
        # Get EXIF data if present
        exif = source_img.info.get('exif')
        return exif if exif else None
    except Exception:
        return None

def convert_to_rgb(img, background_color=(255, 255, 255)):
    """Convert image to RGB mode with proper transparency handling."""
    if img.mode == 'RGB':
        return img

    if img.mode == 'RGBA':
        # Create RGB background and paste with alpha composite
        background = Image.new('RGB', img.size, background_color)
        background.paste(img, mask=img.split()[3])  # Alpha channel
        return background

    if img.mode == 'LA':  # Grayscale + Alpha
        background = Image.new('RGB', img.size, background_color)
        gray = img.convert('L')
        background.paste(gray, mask=img.split()[1])  # Alpha channel
        return background

    if img.mode == 'P':  # Palette mode
        # Convert palette to RGBA first if it has transparency
        if 'transparency' in img.info:
            img = img.convert('RGBA')
            return convert_to_rgb(img, background_color)
        else:
            return img.convert('RGB')

    # Fallback for other modes
    return img.convert('RGB')

def generate_thumbnails(fulls_dir="images/fulls", thumbs_dir="images/thumbs",
                       thumb_width=512, force=False, verbose=True,
                       background_color=(255, 255, 255)):
    """Generate thumbnails for all images in fulls directory, preserving EXIF data.

    Args:
        fulls_dir: Source images directory
        thumbs_dir: Thumbnail output directory
        thumb_width: Thumbnail width in pixels (default: 512)
        force: Force regeneration even if thumbnails exist (default: False)
        verbose: Print progress messages (default: True)
        background_color: RGB tuple for transparent backgrounds (default: white)

    Returns:
        bool: True if all thumbnails generated successfully
    """

    fulls_path = Path(fulls_dir)
    thumbs_path = Path(thumbs_dir)

    # Ensure directories exist
    if not fulls_path.exists():
        if verbose:
            print(f"Error: {fulls_dir} directory not found")
        return False

    thumbs_path.mkdir(parents=True, exist_ok=True)

    # Supported image extensions
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic'}

    generated = []
    skipped = []
    errors = []

    # Process all image files in fulls directory
    for image_file in sorted(fulls_path.iterdir()):
        if image_file.suffix.lower() not in image_extensions:
            continue

        try:
            # Always output as JPG for consistency
            thumb_path = thumbs_path / f"{image_file.stem}.jpg"

            # Skip if not needed (unless force=True)
            if not force and not needs_regeneration(image_file, thumb_path):
                skipped.append(image_file.name)
                continue

            # Open and process image
            with Image.open(image_file) as img:
                # Preserve EXIF before any transformations
                exif_data = copy_exif_data(img)

                # Apply EXIF orientation before resizing (auto-rotate)
                # This ensures images appear correctly even if they were
                # shot in portrait mode or rotated
                img = ImageOps.exif_transpose(img)

                # Convert to RGB if needed (for JPEG output)
                img = convert_to_rgb(img, background_color)

                # Create thumbnail (maintains aspect ratio)
                img.thumbnail((thumb_width, thumb_width), Image.Resampling.LANCZOS)

                # Save thumbnail with EXIF data and optimization
                save_kwargs = {
                    "format": "JPEG",
                    "quality": 85,
                    "optimize": True,
                    "progressive": True  # Progressive JPEG for better loading
                }

                if exif_data:
                    save_kwargs["exif"] = exif_data

                img.save(thumb_path, **save_kwargs)
                generated.append(image_file.name)

        except (IOError, OSError, ValueError) as e:
            # Only catch expected image processing errors
            errors.append(f"{image_file.name}: {str(e)}")
        except KeyboardInterrupt:
            if verbose:
                print("\n\nInterrupted by user")
            return False

    # Print results
    if verbose:
        if generated:
            print(f"✓ Generated {len(generated)} thumbnail(s):")
            for name in generated:
                print(f"  • {name}")

        if skipped:
            print(f"\n↷ Skipped {len(skipped)} up-to-date thumbnail(s)")

        if errors:
            print(f"\n✗ Errors ({len(errors)}):")
            for error in errors:
                print(f"  • {error}")

    return len(errors) == 0

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description='Generate thumbnails from full-size images',
        epilog='Example: python3 scripts/generate_thumbnails.py --force --width 512'
    )
    parser.add_argument('--force', action='store_true',
                       help='Regenerate all thumbnails (ignore timestamps)')
    parser.add_argument('--quiet', action='store_true',
                       help='Suppress output messages')
    parser.add_argument('--width', type=int, default=512,
                       help='Thumbnail width in pixels (default: 512)')
    parser.add_argument('--bg-color', type=str, default='255,255,255',
                       help='Background color for transparency as R,G,B (default: 255,255,255)')
    parser.add_argument('--fulls-dir', type=str, default='images/fulls',
                       help='Source images directory (default: images/fulls)')
    parser.add_argument('--thumbs-dir', type=str, default='images/thumbs',
                       help='Output thumbnails directory (default: images/thumbs)')

    args = parser.parse_args()

    # Parse background color
    try:
        bg_parts = args.bg_color.split(',')
        if len(bg_parts) != 3:
            raise ValueError("Must be R,G,B format")
        bg_color = tuple(int(c) for c in bg_parts)
        if any(c < 0 or c > 255 for c in bg_color):
            raise ValueError("RGB values must be 0-255")
    except (ValueError, AttributeError) as e:
        print(f"Error: --bg-color must be in format R,G,B (0-255): {e}")
        sys.exit(1)

    # Change to project root (parent of scripts directory)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    os.chdir(project_root)

    # Generate thumbnails
    success = generate_thumbnails(
        fulls_dir=args.fulls_dir,
        thumbs_dir=args.thumbs_dir,
        thumb_width=args.width,
        force=args.force,
        verbose=not args.quiet,
        background_color=bg_color
    )

    sys.exit(0 if success else 1)
