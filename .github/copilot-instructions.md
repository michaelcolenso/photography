<!-- .github/copilot-instructions.md -->
# Project snapshot for AI coding agents

This repository is a small Jekyll-based photography site with a client-side EXIF UI and a simple image-processing pipeline using Gulp. Use the notes below to be immediately productive changing templates, JS behavior, or the image pipeline.

## High-level architecture
- Static site generated with Jekyll (templates in `_layouts/` and includes in `_includes/`).
- Client-side behavior lives in `assets/js/` (notably `main.js` and `exif.js`) and uses jQuery + Poptrox to render popups with EXIF metadata.
- Image pipeline: `npm` + `gulp` (see `package.json` and `gulpfile.js`) — source images placed in `images/` are resized into `images/fulls` and `images/thumbs`.

## Key files and where to change things (examples)
- Site metadata & config: `_config.yml` — controls `image_fulls_loc` and `image_thumbs_loc` used by templates.
- Main gallery template: `index.html` — iterates `site.static_files` and selects images that contain `fulls`. Important snippet: it outputs `<img ... data-name="{{ image.name }}" />` so JS can key EXIF data by filename.
- Layouts/includes: `_layouts/default.html`, `_includes/header.html`, `_includes/footer.html` — modify global HTML structure and meta.
- Client JS and EXIF logic: `assets/js/main.js` — functions `fetchExifData()` and `getExifDataMarkup()` map EXIF tags to the UI. If you change the EXIF keys or caption UI, update this file.
- Image processing task: `gulpfile.js` — `gulp` runs `resize` (1024px -> `images/fulls`, 512px -> `images/thumbs`) then `del` removes original files from `images/`.

## Data flows and important conventions
- Upload workflow: place original camera/JPEG files into the repository `images/` root and run the Gulp pipeline locally to produce `images/fulls` and `images/thumbs` (filenames are preserved).
- Naming convention: thumbnails and full images must share the same filename. The client code uses the thumbnail `src` for background and the `data-name` attribute to find EXIF for the matching full image.
- `_config.yml` values `image_fulls_loc` and `image_thumbs_loc` are used by templates; keep them in-sync when changing file locations.

## Build / dev commands (practical examples)
Install Ruby gems for Jekyll (recommended with Bundler):

    # macOS (if Bundler not installed):
    gem install bundler
    bundle install   # reads Gemfile (jekyll, github-pages)
    bundle exec jekyll serve --watch

Image processing (node):

    npm install       # installs gulp + gulp-image-resize + del
    # Make sure ImageMagick or GraphicsMagick is installed on macOS (required by gulp-image-resize):
    #   brew install imagemagick
    # Then, from repo root:
    gulp              # runs default -> resize (1024 & 512) -> del (removes images/*.* originals)

Note: `gulp` will delete files under `images/*.*` after creating `images/fulls` and `images/thumbs`. Back up originals or run gulp from a working copy.

## Client-side EXIF specifics (concrete mappings)
- `assets/js/main.js` uses EXIF tags via `EXIF.getTag(img, "...")` and maps them to UI keys:
  - `Model` -> `model`
  - `FNumber` -> `aperture` (display as f/)
  - `ExposureTime` -> `shutter_speed`
  - `ISOSpeedRatings` -> `iso`
- The `poptrox` caption code looks up `exifDatas[filename]` where `filename` comes from the `data-name` attribute on the thumbnail `<img>` (see `index.html`). Keep that linking intact when changing templates.

## Repo-specific gotchas and patterns
- The gulp pipeline expects full originals in `images/` and will remove them after processing — be careful when running locally.
- The gallery relies on Jekyll's `site.static_files` and string matching for `fulls` in the path. If you change the directory names, update both `_config.yml` and `index.html` logic.
- CSS is authored as SCSS under `assets/sass/` but there is no automated Sass task in `gulpfile.js`. Edits to SCSS require a manual rebuild if you add a watcher or an external tool.
- No test framework or CI configuration is present; focus reviews on functional manual checks (local `jekyll serve` preview + browser checks for EXIF popup behavior).

## When editing code, quick checklist
1. Update `_config.yml` if moving image directories or changing `baseurl`/`url`.
2. If changing thumbnail/full filename assumptions, update `index.html` (data-name attr) and `assets/js/main.js` (EXIF lookup).
3. If modifying the image pipeline, update `gulpfile.js` and keep in mind ImageMagick dependency.
4. Run `bundle exec jekyll serve` and open the site locally to verify layout and EXIF popups.

If anything here is unclear or you want more examples (e.g., a small unit-test harness or a CI job to build the site), tell me which area to expand and I will iterate.
