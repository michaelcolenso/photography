<!-- .github/copilot-instructions.md -->
# Project snapshot for AI coding agents

This repository is a small Jekyll-based photography site with a client-side EXIF UI and a simple image-processing pipeline using Gulp. Use the notes below to be immediately productive changing templates, JS behavior, or the image pipeline.

## High-level architecture
- Static site generated with Jekyll (templates in `_layouts/` and includes in `_includes/`).
- Client-side behavior lives in `assets/js/` (notably `main.js` and `exif.js`) and uses jQuery + Poptrox to render popups with EXIF metadata.
- Image pipeline: Python script (`scripts/generate_thumbnails.py`) powered by Pillow — source images placed in `images/fulls` are automatically thumbnailed into `images/thumbs` with EXIF data preserved. A git pre-commit hook runs the script automatically before commits.

## Key files and where to change things (examples)
- Site metadata & config: `_config.yml` — controls `image_fulls_loc` and `image_thumbs_loc` used by templates.
- Main gallery template: `index.html` — iterates `site.static_files` and selects images that contain `fulls`. Important snippet: it outputs `<img ... data-name="{{ image.name }}" />` so JS can key EXIF data by filename.
- Layouts/includes: `_layouts/default.html`, `_includes/header.html`, `_includes/footer.html` — modify global HTML structure and meta.
- Client JS and EXIF logic: `assets/js/main.js` — functions `fetchExifData()` and `getExifDataMarkup()` map EXIF tags to the UI. If you change the EXIF keys or caption UI, update this file.
- Image processing script: `scripts/generate_thumbnails.py` — Python script that reads images from `images/fulls/`, generates 512px thumbnails with preserved EXIF data, and saves them to `images/thumbs/`. Automatically runs before each commit via `.git/hooks/pre-commit`.

## Data flows and important conventions
- Upload workflow: Place full-size camera/JPEG files directly into `images/fulls/`. The pre-commit hook will automatically generate 512px thumbnails in `images/thumbs/` with EXIF data preserved (filenames are identical).
- Naming convention: Thumbnails and full images must share the same filename. The client code uses the thumbnail `src` for background and the `data-name` attribute to find EXIF data for the matching image.
- `_config.yml` values `image_fulls_loc` and `image_thumbs_loc` are used by templates; keep them in-sync when changing file locations.
- Manual thumbnail generation: Run `python3 scripts/generate_thumbnails.py` from the repo root to manually regenerate all thumbnails.

## Build / dev commands (practical examples)
Install Ruby gems for Jekyll (recommended with Bundler):

    # macOS (if Bundler not installed):
    gem install bundler
    bundle install   # reads Gemfile (jekyll, github-pages)
    bundle exec jekyll serve --watch

Image processing (Python):

    pip3 install Pillow  # required for thumbnail generation
    python3 scripts/generate_thumbnails.py  # generates 512px thumbnails with EXIF preserved

The thumbnail generation script is also automatically invoked via git pre-commit hook, so thumbnails are generated before each commit.

Note: Place full-size images in `images/fulls/` directory. Do not place raw source images in the `images/` root — the old Gulp workflow is no longer used.

## Client-side EXIF specifics (concrete mappings)
- `assets/js/main.js` uses EXIF tags via `EXIF.getTag(img, "...")` and maps them to UI keys:
  - `Model` -> `model`
  - `FNumber` -> `aperture` (display as f/)
  - `ExposureTime` -> `shutter_speed`
  - `ISOSpeedRatings` -> `iso`
- The `poptrox` caption code looks up `exifDatas[filename]` where `filename` comes from the `data-name` attribute on the thumbnail `<img>` (see `index.html`). Keep that linking intact when changing templates.

## Repo-specific gotchas and patterns
- The thumbnail generation script reads from `images/fulls/` and writes to `images/thumbs/` — always place full-size images in `fulls/`.
- The gallery relies on Jekyll's `site.static_files` and string matching for `fulls` in the path. If you change the directory names, update both `_config.yml` and `index.html` logic.
- EXIF data is automatically preserved during thumbnail generation using Pillow. Ensure source images contain EXIF metadata if you want it displayed in the gallery.
- CSS is authored as SCSS under `assets/sass/` but there is no automated Sass task. Edits to SCSS require a manual rebuild if you add a watcher or an external tool.
- No test framework or CI configuration is present; focus reviews on functional manual checks (local `jekyll serve` preview + browser checks for EXIF popup behavior).

## When editing code, quick checklist
1. Update `_config.yml` if moving image directories or changing `baseurl`/`url`.
2. If changing thumbnail/full filename assumptions, update `index.html` (data-name attr) and `assets/js/main.js` (EXIF lookup).
3. If modifying the image pipeline, update `scripts/generate_thumbnails.py` (no external tool dependencies beyond Pillow).
4. Run `bundle exec jekyll serve` and open the site locally to verify layout and EXIF popups.
5. Ensure Pillow is installed: `pip3 install Pillow`.

If anything here is unclear or you want more examples (e.g., a small unit-test harness or a CI job to build the site), tell me which area to expand and I will iterate.
