document.addEventListener("DOMContentLoaded", () => {

    /*
    =====================================================
    MEDIA LOADING SYSTEM
    =====================================================

    This script:
    - Adds loading indicators to images
    - Adds loading indicators to videos
    - Automatically hides them when media loads
    - Adds lazy loading to images
    - Adds async decoding to images
    - Does NOT require HTML changes
    - Does NOT require CSS changes
    */


    /* =================================================
       CREATE LOADER
    ================================================= */

    function createLoader(type = "image") {

        const loader = document.createElement("div");

        loader.className =
            type === "video"
                ? "js-media-loader js-video-loader"
                : "js-media-loader js-image-loader";


        loader.innerHTML = `
            <div class="js-loader-spinner"></div>
        `;


        /*
        Inject the loader styling directly through JS.
        This means we don't need to modify style.css.
        */

        return loader;
    }


    /* =================================================
       INJECT LOADER CSS
    ================================================= */

    const style = document.createElement("style");

    style.textContent = `

        .js-media-loader {

            position: absolute;

            inset: 0;

            z-index: 20;

            display: flex;

            align-items: center;

            justify-content: center;

            background: rgba(250, 247, 241, 0.92);

            opacity: 1;

            visibility: visible;

            transition:
                opacity 0.35s ease,
                visibility 0.35s ease;

            pointer-events: none;
        }


        .js-video-loader {

            background: rgba(13, 27, 38, 0.95);
        }


        .js-media-loader.loaded {

            opacity: 0;

            visibility: hidden;
        }


        .js-loader-spinner {

            width: 34px;

            height: 34px;

            border-radius: 50%;

            border:
                3px solid
                rgba(217, 107, 39, 0.20);

            border-top-color:
                #d96b27;

            animation:
                jsMediaSpin 0.8s linear infinite;
        }


        .js-video-loader .js-loader-spinner {

            border-color:
                rgba(255,255,255,0.20);

            border-top-color:
                #d96b27;
        }


        @keyframes jsMediaSpin {

            to {
                transform: rotate(360deg);
            }

        }


        /*
        Prevent the loader from changing
        the layout of your existing gallery.
        */

        .photo-item,
        .gallery-item,
        .video-wrapper {

            position: relative;
        }


        /*
        Slight fade-in when an image finishes loading.
        */

        .js-media-image {

            opacity: 0;

            transition:
                opacity 0.35s ease;
        }


        .js-media-image.js-loaded {

            opacity: 1;
        }

    `;

    document.head.appendChild(style);



    /* =================================================
       IMAGE LOADING
    ================================================= */

    const images = document.querySelectorAll(
        ".photo-item img, .gallery-item img, .hero-image img, .final-image img"
    );


    images.forEach((image) => {

        /*
        Add browser-native lazy loading
        where appropriate.
        */

        if (
            !image.closest(".hero") &&
            !image.closest(".final-image")
        ) {

            image.loading = "lazy";

        }


        /*
        Tell browser to decode images asynchronously.
        */

        image.decoding = "async";


        /*
        Find the nearest image container.
        */

        const container =
            image.closest(
                ".photo-item, .gallery-item, .hero-image, .final-image"
            );


        if (!container) return;


        /*
        Don't add a loader if image
        is already loaded.
        */

        const loader = createLoader("image");

        container.appendChild(loader);


        /*
        Image already loaded from cache?
        */

        if (image.complete && image.naturalWidth > 0) {

            image.classList.add("js-loaded");

            loader.classList.add("loaded");

        }


        /*
        Normal image loading.
        */

        image.addEventListener("load", () => {

            image.classList.add("js-loaded");

            loader.classList.add("loaded");

        });


        /*
        Image loading error.
        */

        image.addEventListener("error", () => {

            loader.innerHTML = `
                <div style="
                    color:#68747c;
                    font-size:0.8rem;
                    text-align:center;
                    padding:20px;
                ">
                    Image unavailable
                </div>
            `;

        });

    });



    /* =================================================
       VIDEO LOADING
    ================================================= */

    const videos = document.querySelectorAll(
        ".video-wrapper video"
    );


    videos.forEach((video) => {

        const container =
            video.closest(".video-wrapper");


        if (!container) return;


        /*
        Don't download the complete video immediately.
        */

        video.preload = "metadata";

        video.playsInline = true;


        /*
        Create loading overlay.
        */

        const loader = createLoader("video");

        container.appendChild(loader);


        /*
        Metadata has loaded.
        */

        video.addEventListener(
            "loadedmetadata",
            () => {

                /*
                Metadata means dimensions and
                basic information are available.

                Keep the loader until actual
                video data is available.
                */

            }
        );


        /*
        Actual video data is ready.
        */

        video.addEventListener(
            "loadeddata",
            () => {

                loader.classList.add("loaded");

            }
        );


        /*
        Browser has buffered enough to play.
        */

        video.addEventListener(
            "canplay",
            () => {

                loader.classList.add("loaded");

            }
        );


        /*
        Video error.
        */

        video.addEventListener(
            "error",
            () => {

                loader.innerHTML = `
                    <div style="
                        color:white;
                        font-size:0.8rem;
                        text-align:center;
                        padding:20px;
                    ">
                        Video unavailable
                    </div>
                `;

            }
        );

    });



    /* =================================================
       SMARTER LAZY LOADING
    =================================================

    Native loading="lazy" is already useful.

    This IntersectionObserver additionally allows us
    to prioritize images shortly before they enter
    the viewport.
    */

    if ("IntersectionObserver" in window) {

        const lazyImages =
            document.querySelectorAll(
                ".photo-item img, .gallery-item img"
            );


        const imageObserver =
            new IntersectionObserver(
                (entries, observer) => {

                    entries.forEach((entry) => {

                        if (!entry.isIntersecting) {
                            return;
                        }


                        const image = entry.target;


                        /*
                        Force browser to start decoding
                        shortly before the image becomes
                        visible.
                        */

                        if (image.decode) {

                            image.decode()
                                .catch(() => {});

                        }


                        observer.unobserve(image);

                    });

                },
                {
                    /*
                    Start loading slightly before
                    the user reaches the image.
                    */

                    rootMargin: "300px 0px"
                }
            );


        lazyImages.forEach((image) => {

            imageObserver.observe(image);

        });

    }



    /* =================================================
       CONNECTION-AWARE VIDEO BEHAVIOR
    ================================================= */

    /*
    On slower mobile connections, don't aggressively
    preload videos.
    */

    if ("connection" in navigator) {

        const connection =
            navigator.connection;


        const slowConnection =
            connection.saveData ||
            connection.effectiveType === "slow-2g" ||
            connection.effectiveType === "2g";


        if (slowConnection) {

            videos.forEach((video) => {

                video.preload = "none";

            });

        }

    }



    /* =================================================
       PAGE VISIBILITY
    =================================================

    Stop unnecessary video buffering when the user
    leaves the page/tab.
    */

    document.addEventListener(
        "visibilitychange",
        () => {

            if (document.hidden) {

                videos.forEach((video) => {

                    if (!video.paused) {

                        video.pause();

                    }

                });

            }

        }
    );

});