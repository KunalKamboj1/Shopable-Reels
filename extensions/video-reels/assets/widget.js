(function() {
  // Use a unique variable name to avoid collisions
  const script = document.currentScript;
  const config = {
    shop: script ? script.getAttribute('data-shop') : window.Shopify?.shop,
    apiUrl: script ? script.getAttribute('data-api-url') : 'https://' + window.location.hostname,
  };

  async function init() {
    const container = document.getElementById('video-widget');
    if (!container) return;

    try {
        const response = await fetch(`${config.apiUrl}/api/videos?shop=${config.shop}`);
        const data = await response.json();
        const videos = data.videos;

        if (!videos || videos.length === 0) return;

        const shadow = container.attachShadow({ mode: 'open' });
        
        // Add Styles
        const style = document.createElement('style');
        style.textContent = `
          :host {
            display: block;
            width: 100%;
            height: 100%;
            min-height: 600px;
            overflow: hidden;
            position: relative;
            background: #000;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            border-radius: 12px;
          }
          .reel-container {
            height: 100%;
            overflow-y: scroll;
            scroll-snap-type: y mandatory;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .reel-container::-webkit-scrollbar { display: none; }
          .video-slide {
            height: 100%;
            width: 100%;
            scroll-snap-align: start;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          video {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .overlay {
            position: absolute;
            bottom: 40px;
            left: 20px;
            right: 20px;
            color: white;
            z-index: 10;
            text-shadow: 0 2px 8px rgba(0,0,0,0.8);
          }
          .title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 12px;
          }
          .cta-button {
            background: #ffffff;
            color: #000000;
            border: none;
            padding: 10px 24px;
            border-radius: 25px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: inline-block;
            text-decoration: none;
            text-align: center;
          }
          .cta-button:hover {
            transform: scale(1.05);
          }
        `;
        shadow.appendChild(style);

        const reel = document.createElement('div');
        reel.className = 'reel-container';

        videos.forEach(video => {
          const slide = document.createElement('div');
          slide.className = 'video-slide';
          
          const v = document.createElement('video');
          v.src = video.videoUrl;
          v.poster = video.thumbnailUrl;
          v.loop = true;
          v.muted = true;
          v.autoplay = false;
          v.setAttribute('playsinline', '');
          v.setAttribute('webkit-playsinline', '');

          const overlay = document.createElement('div');
          overlay.className = 'overlay';
          
          let ctaMarkup = '';
          if (video.productIds && video.productIds.length > 0) {
              const productId = video.productIds[0].split('/').pop();
              ctaMarkup = `<a class="cta-button" href="/products/${productId}">Shop Product</a>`;
          }

          overlay.innerHTML = `
            <div class="title">${video.title || ''}</div>
            ${ctaMarkup}
          `;

          slide.appendChild(v);
          slide.appendChild(overlay);
          reel.appendChild(slide);

          // Intersection Observer for autoplay and impression tracking
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                v.play().catch(() => {});
                trackEvent(video.id, 'impression');
              } else {
                v.pause();
              }
            });
          }, { threshold: 0.7 });
          observer.observe(slide);
        });

        shadow.appendChild(reel);

    } catch (err) {
        console.error('Shoppable Video Widget Error:', err);
    }
  }

  function trackEvent(videoId, type) {
    if (!config.shop) return;
    fetch(`${config.apiUrl}/api/events`, {
      method: 'POST',
      body: JSON.stringify({ videoId, type, shop: config.shop }),
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors'
    }).catch(() => {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
