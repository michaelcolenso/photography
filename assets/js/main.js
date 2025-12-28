/*
 Multiverse by HTML5 UP
 html5up.net | @ajlkn
 Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)

 Added EXIF data and enhanced for Jekyll by Ram Patra
 */

(function ($) {

    skel.breakpoints({
        xlarge: '(max-width: 1680px)',
        large: '(max-width: 1280px)',
        medium: '(max-width: 980px)',
        small: '(max-width: 736px)',
        xsmall: '(max-width: 480px)'
    });

    $(function () {

        var $window = $(window),
            $body = $('body'),
            $wrapper = $('#wrapper');

        // Hack: Enable IE workarounds.
        if (skel.vars.IEVersion < 12)
            $body.addClass('ie');

        // Touch?
        if (skel.vars.mobile)
            $body.addClass('touch');

        // Transitions supported?
        if (skel.canUse('transition')) {

            // Add (and later, on load, remove) "loading" class.
            $body.addClass('loading');

            $window.on('load', function () {
                window.setTimeout(function () {
                    $body.removeClass('loading');
                }, 100);
            });

            // Prevent transitions/animations on resize.
            var resizeTimeout;

            $window.on('resize', function () {

                window.clearTimeout(resizeTimeout);

                $body.addClass('resizing');

                resizeTimeout = window.setTimeout(function () {
                    $body.removeClass('resizing');
                }, 100);

            });

        }

        // Scroll back to top.
        $window.scrollTop(0);

        // Panels.
        var $panels = $('.panel');

        $panels.each(function () {

            var $this = $(this),
                $toggles = $('[href="#' + $this.attr('id') + '"]'),
                $closer = $('<div class="closer" />').appendTo($this);

            // Closer.
            $closer
                .on('click', function (event) {
                    $this.trigger('---hide');
                });

            // Events.
            $this
                .on('click', function (event) {
                    event.stopPropagation();
                })
                .on('---toggle', function () {

                    if ($this.hasClass('active'))
                        $this.triggerHandler('---hide');
                    else
                        $this.triggerHandler('---show');

                })
                .on('---show', function () {

                    // Hide other content.
                    if ($body.hasClass('content-active'))
                        $panels.trigger('---hide');

                    // Activate content, toggles.
                    $this.addClass('active');
                    $toggles.addClass('active');

                    // Activate body.
                    $body.addClass('content-active');

                })
                .on('---hide', function () {

                    // Deactivate content, toggles.
                    $this.removeClass('active');
                    $toggles.removeClass('active');

                    // Deactivate body.
                    $body.removeClass('content-active');

                });

            // Toggles.
            $toggles
                .removeAttr('href')
                .css('cursor', 'pointer')
                .on('click', function (event) {

                    event.preventDefault();
                    event.stopPropagation();

                    $this.trigger('---toggle');

                });

        });

        // Global events.
        $body
            .on('click', function (event) {

                if ($body.hasClass('content-active')) {

                    event.preventDefault();
                    event.stopPropagation();

                    $panels.trigger('---hide');

                }

            });

        $window
            .on('keyup', function (event) {

                if (event.keyCode == 27
                    && $body.hasClass('content-active')) {

                    event.preventDefault();
                    event.stopPropagation();

                    $panels.trigger('---hide');

                }

            });

        // Header.
        var $header = $('#header');

        // Links.
        $header.find('a').each(function () {

            var $this = $(this),
                href = $this.attr('href');

            // Internal link? Skip.
            if (!href
                || href.charAt(0) == '#')
                return;

            // Redirect on click.
            $this
                .removeAttr('href')
                .css('cursor', 'pointer')
                .on('click', function (event) {

                    event.preventDefault();
                    event.stopPropagation();

                    window.location.href = href;

                });

        });

        // Footer.
        var $footer = $('#footer');

        // Copyright.
        // This basically just moves the copyright line to the end of the *last* sibling of its current parent
        // when the "medium" breakpoint activates, and moves it back when it deactivates.
        $footer.find('.copyright').each(function () {

            var $this = $(this),
                $parent = $this.parent(),
                $lastParent = $parent.parent().children().last();

            skel
                .on('+medium', function () {
                    $this.appendTo($lastParent);
                })
                .on('-medium', function () {
                    $this.appendTo($parent);
                });

        });

        // Main.
        var $main = $('#main'),
            exifDatas = {};

        // Thumbs.
        $main.children('.thumb').each(function () {

            var $this = $(this),
                $image = $this.find('.image'), $image_img = $image.children('img'),
                x;

            // No image? Bail.
            if ($image.length == 0)
                return;

            // Image.
            // This sets the background of the "image" <span> to the image pointed to by its child
            // <img> (which is then hidden). Gives us way more flexibility.

            // Set background.
            $image.css('background-image', 'url(' + $image_img.attr('src') + ')');

            // Set background position.
            if (x = $image_img.data('position'))
                $image.css('background-position', x);

            // Hide original img.
            $image_img.hide();

            // Hack: IE<11 doesn't support pointer-events, which means clicks to our image never
            // land as they're blocked by the thumbnail's caption overlay gradient. This just forces
            // the click through to the image.
            if (skel.vars.IEVersion < 11)
                $this
                    .css('cursor', 'pointer')
                    .on('click', function () {
                        $image.trigger('click');
                    });

            // EXIF data
            if (typeof EXIF !== 'undefined') {
                try {
                    EXIF.getData($image_img[0], function () {
                        try {
                            exifDatas[$image_img.data('name')] = getExifDataMarkup(this);
                        } catch (error) {
                            console.warn('Failed to extract EXIF from ' + $image_img.data('name') + ':', error);
                        }
                    });
                } catch (error) {
                    console.warn('EXIF.getData failed for ' + $image_img.data('name') + ':', error);
                }
            }

        });

        // Poptrox.
        $main.poptrox({
            baseZIndex: 20000,
            caption: function ($a) {
                var $image_img = $a.children('img');
                var data = exifDatas[$image_img.data('name')];
                if (data === undefined && typeof EXIF !== 'undefined') {
                    // EXIF data
                    try {
                        EXIF.getData($image_img[0], function () {
                            try {
                                data = exifDatas[$image_img.data('name')] = getExifDataMarkup(this);
                            } catch (error) {
                                console.warn('Failed to extract EXIF from ' + $image_img.data('name') + ':', error);
                            }
                        });
                    } catch (error) {
                        console.warn('EXIF.getData failed for ' + $image_img.data('name') + ':', error);
                    }
                }
                return data !== undefined ? '<p>' + data + '</p>' : '';
            },
            fadeSpeed: 300,
            onPopupClose: function () {
                $body.removeClass('modal-active');
            },
            onPopupOpen: function () {
                $body.addClass('modal-active');
            },
            overlayOpacity: 0,
            popupCloserText: '',
            popupHeight: 150,
            popupLoaderText: '',
            popupSpeed: 300,
            popupWidth: 150,
            selector: '.thumb > a.image',
            usePopupCaption: true,
            usePopupCloser: true,
            usePopupDefaultStyling: false,
            usePopupForceClose: true,
            usePopupLoader: true,
            usePopupNav: true,
            windowMargin: 50
        });

        // Hack: Set margins to 0 when 'xsmall' activates.
        skel
            .on('-xsmall', function () {
                $main[0]._poptrox.windowMargin = 50;
            })
            .on('+xsmall', function () {
                $main[0]._poptrox.windowMargin = 0;
            });

        function escapeHtml(unsafe) {
            if (unsafe === undefined || unsafe === null) {
                return '';
            }
            return String(unsafe)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        function getExifDataMarkup(img) {
            var exif = fetchExifData(img);

            // Define display order and formatting rules
            var exifFields = [
                { key: 'model', icon: 'camera-retro', format: function(v) { return v; } },
                { key: 'lens', icon: 'camera', format: function(v) { return v; } },
                { key: 'aperture', icon: 'dot-circle-o', format: function(v) { return 'f/' + v; } },
                { key: 'shutter_speed', icon: 'clock-o', format: function(v) { return v; } },
                { key: 'iso', icon: 'info-circle', format: function(v) { return v; } },
                { key: 'focal_length', icon: 'expand', format: function(v) { return v + 'mm'; } },
                { key: 'exposure_compensation', icon: 'adjust', format: function(v) { return v; } },
                { key: 'flash', icon: 'bolt', format: function(v) { return v; } },
                { key: 'white_balance', icon: 'balance-scale', format: function(v) { return v; } },
                { key: 'metering_mode', icon: 'bar-chart', format: function(v) { return v; } }
            ];

            var parts = [];
            for (var i = 0; i < exifFields.length; i++) {
                var field = exifFields[i];
                if (exif[field.key] !== undefined) {
                    var value = escapeHtml(field.format(exif[field.key]));
                    parts.push('<i class="fa fa-' + field.icon + '" aria-hidden="true"></i> ' + value);
                }
            }

            return parts.join('&nbsp;&nbsp;');
        }

        function fetchExifData(img) {
            var exifData = {};

            if (typeof EXIF === 'undefined') {
                return exifData;
            }

            try {
                if (EXIF.getTag(img, "Model") !== undefined) {
                    exifData.model = EXIF.getTag(img, "Model");
                }

                if (EXIF.getTag(img, "LensModel") !== undefined) {
                    exifData.lens = EXIF.getTag(img, "LensModel");
                }

                if (EXIF.getTag(img, "FNumber") !== undefined) {
                    exifData.aperture = EXIF.getTag(img, "FNumber");
                }

                if (EXIF.getTag(img, "ExposureTime") !== undefined) {
                    exifData.shutter_speed = EXIF.getTag(img, "ExposureTime");
                }

                if (EXIF.getTag(img, "ISOSpeedRatings") !== undefined) {
                    exifData.iso = EXIF.getTag(img, "ISOSpeedRatings");
                }

                if (EXIF.getTag(img, "FocalLength") !== undefined) {
                    exifData.focal_length = EXIF.getTag(img, "FocalLength");
                }

                if (EXIF.getTag(img, "ExposureBiasValue") !== undefined) {
                    exifData.exposure_compensation = EXIF.getTag(img, "ExposureBiasValue");
                }

                if (EXIF.getTag(img, "Flash") !== undefined) {
                    exifData.flash = formatFlashValue(EXIF.getTag(img, "Flash"));
                }

                if (EXIF.getTag(img, "WhiteBalance") !== undefined) {
                    exifData.white_balance = formatWhiteBalance(EXIF.getTag(img, "WhiteBalance"));
                }

                if (EXIF.getTag(img, "MeteringMode") !== undefined) {
                    exifData.metering_mode = formatMeteringMode(EXIF.getTag(img, "MeteringMode"));
                }
            } catch (error) {
                console.warn('Error fetching EXIF tags:', error);
            }

            return exifData;
        }

        function formatFlashValue(flash) {
            var flashValues = {
                0: 'No Flash',
                1: 'Flash Fired',
                5: 'Flash Fired, Return light not detected',
                7: 'Flash Fired, Return light detected'
            };
            return flashValues[flash] || flash;
        }

        function formatWhiteBalance(wb) {
            var wbValues = {
                0: 'Auto',
                1: 'Manual'
            };
            return wbValues[wb] || wb;
        }

        function formatMeteringMode(metering) {
            var meteringValues = {
                0: 'Unknown',
                1: 'Average',
                2: 'Center-weighted',
                3: 'Spot',
                4: 'Multi-spot',
                5: 'Pattern',
                6: 'Partial'
            };
            return meteringValues[metering] || metering;
        }

    });

})(jQuery);