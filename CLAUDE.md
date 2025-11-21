# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Jekyll-based photography portfolio website with automatic EXIF metadata display. The site showcases photography with camera settings (aperture, shutter speed, ISO) automatically extracted and displayed in image popups. It's designed to be hosted on GitHub Pages for free.

**Key Features:**
- Static Jekyll site (no database)
- Client-side EXIF data extraction and display via JavaScript
- Automatic thumbnail generation with EXIF preservation
- No manual code changes needed to add images

## Architecture Overview

### Technology Stack
- **Backend:** Jekyll (static site generator), Ruby
- **Frontend:** HTML/CSS/SCSS, jQuery, Poptrox (popup library), EXIF.js (client-side EXIF parser)
- **Image Processing:** Python 3 with Pillow (PIL)
- **Hosting:** GitHub Pages

### High-Level Architecture

```
Photography Site
├── Jekyll Static Generation
│   ├── _layouts/ → HTML templates
│   ├── _includes/ → Reusable template components
│   ├── index.html → Main gallery page (iterates site.static_files)
│   └── _config.yml → Site metadata and image directory config
│
├── Image Processing Pipeline
│   ├── images/fulls/ → Full-size images (source)
│   ├── images/thumbs/ → Thumbnails (512px, auto-generated)
│   └── scripts/generate_thumbnails.py → Python script that generates thumbnails
│       with EXIF preservation and runs on pre-commit
│
├── Client-Side UI & EXIF Display
│   ├── assets/js/main.js → Gallery initialization, EXIF extraction, Poptrox config
│   ├── assets/js/exif.js → EXIF.js library (binary EXIF parser)
│   ├── assets/js/jquery.poptrox.js → Popup/modal library
│   └── assets/sass/ → Styling (SCSS)
│
└── Deployment
    └── GitHub Pages (automatic on push to master)
```

### Image Flow
1. User places full-size images in `images/fulls/`
2. Thumbnails are generated via `scripts/generate_thumbnails.py` (manually or via optional pre-commit hook)
3. Script generates 512px thumbnails in `images/thumbs/` with EXIF data preserved
4. Jekyll builds site and iterates `site.static_files` to list images
5. Browser loads thumbnail as background-image, hides actual img tag
6. When user clicks image, Poptrox opens modal
7. JavaScript extracts EXIF from thumbnail and displays: Model, Aperture, Shutter Speed, ISO

### EXIF Tag Mapping
The client-side code (`assets/js/main.js`) maps EXIF tags to UI display:
- `Model` → camera model (with camera icon)
- `FNumber` → aperture (displayed as f/)
- `ExposureTime` → shutter speed (with clock icon)
- `ISOSpeedRatings` → ISO value (with info icon)

These mappings are in the `fetchExifData()` and `getExifDataMarkup()` functions in main.js.

## Common Development Tasks

### Local Development Setup
```bash
# Install Ruby gems (Jekyll)
bundle install

# Start Jekyll development server (basic)
bundle exec jekyll serve
# Site runs at http://localhost:4000/

# Or with rbenv and custom host/port:
eval "$(rbenv init -)" && bundle exec jekyll serve --host 0.0.0.0 --port 4000
```

### Adding Images

**Recommended workflow (Python script):**
```bash
# 1. Copy full-size JPEG to images/fulls/
cp image.jpg images/fulls/

# 2. Manually generate thumbnails
python3 scripts/generate_thumbnails.py

# 3. Commit both full and thumbnail
git add images/fulls/image.jpg images/thumbs/image.jpg
git commit -m "Add new image"
```

**Optional: Set up automatic thumbnail generation on commit**

Note: The repository doesn't include a pre-commit hook by default. To add one:

```bash
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
python3 scripts/generate_thumbnails.py
if [ $? -ne 0 ]; then
    echo "Thumbnail generation failed"
    exit 1
fi
git add images/thumbs/*
EOF
chmod +x .git/hooks/pre-commit
```

Once installed, thumbnails will be auto-generated on each commit.

### Image Processing

**Current approach (Python/Pillow - Recommended):**
```bash
# Ensure Python dependencies installed
pip3 install Pillow

# Manually regenerate all thumbnails (512px with EXIF preserved)
python3 scripts/generate_thumbnails.py
```

**Legacy approach (Gulp/npm - Deprecated):**

The repository still contains `package.json` and `gulpfile.js` from an older Node.js-based workflow. This is no longer the recommended approach but is documented here for reference:

```bash
# Install Node dependencies (legacy)
npm install

# Place images in images/ root directory, then run:
gulp

# This resizes to 1024px (fulls) and 512px (thumbs)
# Note: EXIF preservation with Gulp is less reliable than Python script
```

**Use the Python script approach unless you have a specific need for the Gulp workflow.**

### Configuration
- **Site metadata:** `_config.yml` (title, author, social links, image directories)
- **Image paths:** `image_fulls_loc` and `image_thumbs_loc` in _config.yml must match directory names
- **Gallery template:** `index.html` (Liquid template that iterates `site.static_files`)

## Key Implementation Details

### Gallery Rendering (`index.html`)
- Uses Jekyll's `site.static_files` with string matching on path `contains 'fulls'`
- Outputs `<img data-name="{{ image.name }}" />` so JavaScript can key EXIF data by filename
- CSS sets thumbnail as `background-image` (actual img tag is hidden)

### EXIF Data Preservation
- The thumbnail generation script (`scripts/generate_thumbnails.py`) extracts EXIF binary data from source image and embeds it in the thumbnail JPEG
- JavaScript reads EXIF via EXIF.js library (works client-side on JPEG images)
- Both full and thumbnail images contain identical EXIF data

### Client-Side EXIF Extraction
In `assets/js/main.js`:
1. Loop through thumbnails and call `EXIF.getData()` on each
2. Extract specific tags with `EXIF.getTag(img, "TagName")`
3. Format and cache in `exifDatas` object keyed by filename
4. When Poptrox opens a modal, retrieve cached or fetch EXIF and display in caption

## Important Conventions

1. **Filename matching:** Thumbnails and full images MUST have identical filenames. The `data-name` attribute on the thumbnail image is used to link them.

2. **Directory structure:** Keep `image_fulls_loc: "/images/fulls"` and `image_thumbs_loc: "/images/thumbs"` in sync with actual directories and _config.yml.

3. **Image format:** EXIF is only readable from JPEG files. PNG, GIF, WebP may be processed but won't display EXIF data.

4. **Git hook (optional):** A pre-commit hook can be manually installed to automatically run `scripts/generate_thumbnails.py` before each commit. See "Adding Images" section for setup instructions.

## When Modifying Code

**Changing EXIF display:**
- Update `fetchExifData()` to extract new tags (lines 329-348 in main.js)
- Update `getExifDataMarkup()` to format and render the new data (lines 309-327 in main.js)

**Adding image directories:**
- Update both `_config.yml` (image_fulls_loc, image_thumbs_loc)
- Update `index.html` Liquid template (path matching logic)
- Update `scripts/generate_thumbnails.py` if using different defaults

**Changing thumbnail size:**
- Modify `thumb_width` parameter in `scripts/generate_thumbnails.py` (currently 512px)
- Regenerate all thumbnails via `python3 scripts/generate_thumbnails.py`

**Styling changes:**
- Edit SCSS under `assets/sass/`
- No automated Sass build task (manual rebuild or external watcher needed)

## Documentation Files

- **`.github/copilot-instructions.md`** — Detailed AI agent notes on architecture, file locations, data flows, and conventions for this project
- **`README.md`** — User-facing documentation (setup, quick start, features)
- **`CLAUDE.md`** — This file; guidance for Claude Code instances

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the `master` branch. Ensure `_config.yml` has correct `url` and `baseurl` for your domain.

## Common Issues

- **EXIF not displaying:** Ensure thumbnails have EXIF data (run `scripts/generate_thumbnails.py`). EXIF.js only reads from JPEG files.
- **Images not showing:** Check that filenames in `images/fulls/` match those in `images/thumbs/`, and that `data-name` attribute is present on thumbnail `<img>` tags.
- **Broken links:** Verify `image_fulls_loc` and `image_thumbs_loc` in `_config.yml` match actual directory paths.
- **Thumbnail generation failure:** Ensure Pillow is installed: `pip3 install Pillow`.
