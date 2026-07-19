
// ── STATE ──
    let currentPlatform = 'youtube';
    let currentType = 'video';
    const BASE_API = '/api/downloader';

    // ── PLATFORM CONFIG ──
    const platforms = {
      youtube: {
        hint: '// Supports youtube.com & youtu.be URLs',
        placeholder: 'https://youtube.com/watch?v=...',
        showType: true
      },
      instagram: {
        hint: '// Supports instagram.com/reel/ & instagram.com/p/ URLs',
        placeholder: 'https://instagram.com/reel/...',
        showType: false
      },
      tiktok: {
        hint: '// Supports tiktok.com/@user/video/... URLs',
        placeholder: 'https://tiktok.com/@user/video/...',
        showType: false
      },
      twitter: {
        hint: '// Supports twitter.com & x.com status URLs',
        placeholder: 'https://x.com/user/status/...',
        showType: false
      },
      other: {
        hint: '// Facebook, Reddit, dan platform lainnya',
        placeholder: 'https://...',
        showType: false
      }
    };

    // ── DOM REFS ──
    const tabBtns = document.querySelectorAll('.tab-btn');
    const typeBtns = document.querySelectorAll('.type-btn');
    const urlInput = document.getElementById('urlInput');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const result = document.getElementById('result');
    const ytTypeOptions = document.getElementById('ytTypeOptions');
    const platformHint = document.getElementById('platformHint');
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');

    // ── TABS ──
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPlatform = btn.dataset.platform;

        const cfg = platforms[currentPlatform];
        platformHint.textContent = cfg.hint;
        urlInput.placeholder = cfg.placeholder;
        ytTypeOptions.classList.toggle('visible', cfg.showType);
        result.innerHTML = '';
      });
    });

    // ── TYPE BTNS ──
    typeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        typeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentType = btn.dataset.type;
      });
    });

    // ── FETCH ──
    submitBtn.addEventListener('click', handleFetch);
    urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleFetch(); });

    async function handleFetch() {
      const url = urlInput.value.trim();
      if (!url) return;

      setLoading(true);
      result.innerHTML = renderLoading();

      try {
        let data;

        if (currentPlatform === 'youtube') {
          data = await fetchYoutube(url);
        } else if (currentPlatform === 'instagram') {
          data = await fetchInstagram(url);
        } else if (currentPlatform === 'tiktok') {
          data = await fetchTiktok(url);
        } else if (currentPlatform === 'twitter') {
          data = await fetchTwitter(url);
        } else {
          data = await fetchOther(url);
        }

        result.innerHTML = renderResult(data, currentPlatform);
      } catch (err) {
        result.innerHTML = renderError(err.message);
      } finally {
        setLoading(false);
      }
    }

    // ── API CALLS ──
    async function fetchYoutube(url) {
      const res = await fetch(`${BASE_API}/downloader?platform=youtube`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type: currentType })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to process YouTube URL');
      return { platform: 'youtube', ...json.data };
    }

    async function fetchInstagram(url) {
      // Auto-detect slide vs video
      const isSlide = url.includes('/p/');
      const endpoint = isSlide ? 'downloader?platform=instagram' : 'downloader?platform=instagram&type=video';
      const res = await fetch(`${BASE_API}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const json = await res.json();
      if (!json.status) throw new Error(json.error || 'Failed to process Instagram URL');
      return { platform: 'instagram', type: isSlide ? 'slide' : 'video', ...json.result };
    }

    async function fetchTiktok(url) {
      const res = await fetch(`${BASE_API}/downloader?platform=tiktok&url=${encodeURIComponent(url)}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return { platform: 'tiktok', ...json };
    }

    async function fetchTwitter(url) {
      const res = await fetch(`${BASE_API}/downloader?platform=twitter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return { platform: 'twitter', ...json };
    }

    async function fetchOther(url) {
      const res = await fetch(`${BASE_API}/downloader?platform=other`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return { platform: 'other', ...json };
    }

    // ── RENDER ──
    function renderLoading() {
      return `
        <div class="loading-box">
          <div class="loader"></div>
          <span class="loading-text">Processing URL...</span>
        </div>
      `;
    }

    function renderError(msg) {
      return `
        <div class="error-box">
          <span class="error-icon">ERR</span>
          <p class="error-msg">${escHtml(msg)}</p>
        </div>
      `;
    }

    function renderResult(data, platform) {
      if (platform === 'youtube') return renderYoutube(data);
      if (platform === 'instagram') return renderInstagram(data);
      if (platform === 'tiktok') return renderTiktok(data);
      if (platform === 'twitter') return renderTwitter(data);
      return renderOther(data);
    }

    function renderYoutube(d) {
      const thumb = d.thumbnail || d.thumbnails?.[0]?.url || '';
      const title = d.title || d.videoDetails?.title || 'Unknown Title';
      const author = d.author || d.videoDetails?.author?.name || '';
      const duration = d.duration || d.videoDetails?.lengthSeconds || '';
      const views = d.views || d.videoDetails?.viewCount || '';

      let downloadHtml = '';
      if (d.download?.url) {
        const label = d.download.type === 'audio' ? 'Download MP3' : 'Download MP4';
        downloadHtml = `
          <div class="download-section">
            <p class="download-label">// Download Ready</p>
            <div class="download-options">
              <a href="${escHtml(d.download.url)}" target="_blank" class="dl-btn">
                ${dlIcon()} ${label}
              </a>
            </div>
          </div>
        `;
      }

      return cardWrap('YouTube', `
        <div class="result-body">
          <div class="result-thumb">
            ${thumb ? `<img src="${escHtml(thumb)}" alt="thumbnail"/>` : `<div class="result-thumb-placeholder">NO THUMB</div>`}
          </div>
          <div class="result-info">
            <p class="result-title">${escHtml(title)}</p>
            <div class="result-meta">
              ${author ? metaItem('Channel', author) : ''}
              ${duration ? metaItem('Duration', formatDuration(duration)) : ''}
              ${views ? metaItem('Views', formatNum(views)) : ''}
            </div>
          </div>
        </div>
        ${downloadHtml}
      `);
    }

    function renderInstagram(d) {
      const thumb = d.media?.thumbnails?.[0]?.url || '';
      const caption = d.metadata?.caption?.slice(0, 120) || '';
      const username = d.author?.username || '';
      const fullName = d.author?.fullName || '';

      // Slide mode
      if (d.type === 'slide' && d.media?.slides) {
        const slidesHtml = d.media.slides.map((s, i) => {
          const imgUrl = s.images?.[0]?.url || '';
          if (!imgUrl) return '';
          const proxyUrl = `/api/downloader/downloader?platform=tiktok&action=proxy&downloadUrl=${encodeURIComponent(imgUrl)}&type=image`;
          return `
            <div class="slide-item">
              <img src="${escHtml(imgUrl)}" alt="slide ${i+1}" loading="lazy"/>
              <div class="slide-dl">
                <a href="${proxyUrl}" download>Download</a>
              </div>
            </div>
          `;
        }).join('');

        return cardWrap('Instagram · Slide', `
          <div class="result-body">
            <div class="result-info" style="border-left:none">
              <p class="result-title">${escHtml(caption || 'Instagram Carousel')}</p>
              <div class="result-meta">
                ${username ? metaItem('User', '@' + username) : ''}
                ${metaItem('Slides', d.media.total_slides + ' items')}
              </div>
            </div>
          </div>
          <div class="slides-grid">${slidesHtml}</div>
        `);
      }

      // Video mode
      const bestVideo = d.media?.videos?.[0];
      const downloadHtml = bestVideo?.url ? `
        <div class="download-section">
          <p class="download-label">// Download Options</p>
          <div class="download-options">
            ${d.media.videos.slice(0, 3).map((v, i) => `
              <a href="/api/downloader/downloader?platform=tiktok&action=proxy&downloadUrl=${encodeURIComponent(v.url)}&type=video"
                 download class="dl-btn">
                ${dlIcon()} ${v.qualityLabel || v.resolution || 'Video ' + (i+1)}
              </a>
            `).join('')}
          </div>
        </div>
      ` : '';

      return cardWrap('Instagram · Reel', `
        <div class="result-body">
          <div class="result-thumb">
            ${thumb ? `<img src="${escHtml(thumb)}" alt="thumbnail"/>` : `<div class="result-thumb-placeholder">NO THUMB</div>`}
          </div>
          <div class="result-info">
            <p class="result-title">${escHtml(caption || 'Instagram Reel')}</p>
            <div class="result-meta">
              ${username ? metaItem('User', '@' + username) : ''}
              ${fullName ? metaItem('Name', fullName) : ''}
            </div>
          </div>
        </div>
        ${downloadHtml}
      `);
    }

    function renderTiktok(d) {
      const thumb = d.cover || d.origin_cover || '';
      const title = d.title || d.desc || 'TikTok Video';
      const author = d.author?.nickname || d.author?.unique_id || '';
      const duration = d.duration || '';
      const plays = d.play_count || d.statistics?.play_count || '';

      const videoUrl = d.hdplay || d.play || '';
      const audioUrl = d.music_info?.play || d.music?.play || '';

      const downloadHtml = (videoUrl || audioUrl) ? `
        <div class="download-section">
          <p class="download-label">// Download Options</p>
          <div class="download-options">
            ${videoUrl ? `<a href="/api/downloader/downloader?platform=tiktok&action=proxy&downloadUrl=${encodeURIComponent(videoUrl)}&type=video" download class="dl-btn">${dlIcon()} Video HD</a>` : ''}
            ${d.play && d.play !== videoUrl ? `<a href="/api/downloader/downloader?platform=tiktok&action=proxy&downloadUrl=${encodeURIComponent(d.play)}&type=video" download class="dl-btn">${dlIcon()} Video SD</a>` : ''}
            ${audioUrl ? `<a href="/api/downloader/downloader?platform=tiktok&action=proxy&downloadUrl=${encodeURIComponent(audioUrl)}&type=audio" download class="dl-btn">${dlIcon()} Audio</a>` : ''}
          </div>
        </div>
      ` : '';

      return cardWrap('TikTok', `
        <div class="result-body">
          <div class="result-thumb">
            ${thumb ? `<img src="${escHtml(thumb)}" alt="thumbnail"/>` : `<div class="result-thumb-placeholder">NO THUMB</div>`}
          </div>
          <div class="result-info">
            <p class="result-title">${escHtml(title)}</p>
            <div class="result-meta">
              ${author ? metaItem('Creator', '@' + author) : ''}
              ${duration ? metaItem('Duration', duration + 's') : ''}
              ${plays ? metaItem('Plays', formatNum(plays)) : ''}
            </div>
          </div>
        </div>
        ${downloadHtml}
      `);
    }

    function renderTwitter(d) {
      // xdownloader returns medias array
      const medias = d.medias || [];
      const thumb = d.thumbnail || medias?.[0]?.thumb || '';
      const title = d.title || 'Twitter/X Post';
      const author = d.author || '';

      const downloadHtml = medias.length > 0 ? `
        <div class="download-section">
          <p class="download-label">// Download Options</p>
          <div class="download-options">
            ${medias.map((m, i) => `
              <a href="${escHtml(m.url || m.src || m)}" target="_blank" download class="dl-btn">
                ${dlIcon()} ${m.quality || m.resolution || ('Media ' + (i+1))}
              </a>
            `).join('')}
          </div>
        </div>
      ` : '';

      return cardWrap('Twitter / X', `
        <div class="result-body">
          <div class="result-thumb">
            ${thumb ? `<img src="${escHtml(thumb)}" alt="thumbnail"/>` : `<div class="result-thumb-placeholder">NO THUMB</div>`}
          </div>
          <div class="result-info">
            <p class="result-title">${escHtml(title)}</p>
            <div class="result-meta">
              ${author ? metaItem('Author', author) : ''}
              ${d.duration ? metaItem('Duration', d.duration) : ''}
            </div>
          </div>
        </div>
        ${downloadHtml}
      `);
    }

    function renderOther(d) {
      const thumb = d.thumbnail || '';
      const title = d.title || 'Media';
      const author = d.author || '';
      const medias = d.medias || [];

      const downloadHtml = medias.length > 0 ? `
        <div class="download-section">
          <p class="download-label">// Download Options</p>
          <div class="download-options">
            ${medias.map((m, i) => `
              <a href="${escHtml(m.url || m)}" target="_blank" download class="dl-btn">
                ${dlIcon()} ${m.quality || m.label || ('Media ' + (i+1))}
              </a>
            `).join('')}
          </div>
        </div>
      ` : '';

      return cardWrap('Other', `
        <div class="result-body">
          <div class="result-thumb">
            ${thumb ? `<img src="${escHtml(thumb)}" alt="thumbnail"/>` : `<div class="result-thumb-placeholder">NO THUMB</div>`}
          </div>
          <div class="result-info">
            <p class="result-title">${escHtml(title)}</p>
            <div class="result-meta">
              ${author ? metaItem('Author', author) : ''}
              ${d.duration ? metaItem('Duration', d.duration) : ''}
            </div>
          </div>
        </div>
        ${downloadHtml}
      `);
    }

    // ── HELPERS ──
    function cardWrap(platform, inner) {
      return `
        <div class="result-card">
          <div class="result-card-header">
            <span class="result-platform">// ${platform}</span>
            <span class="result-status">
              <span class="result-status-dot"></span>
              Ready
            </span>
          </div>
          ${inner}
        </div>
      `;
    }

    function metaItem(key, val) {
      return `
        <div class="meta-item">
          <span class="meta-key">${key}</span>
          <span class="meta-val">${escHtml(String(val))}</span>
        </div>
      `;
    }

    function dlIcon() {
      return `<svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M5 1v6M2 5l3 3 3-3M1 9h8" stroke="currentColor" stroke-width="1.1"/>
      </svg>`;
    }

    function escHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function formatDuration(sec) {
      const s = parseInt(sec);
      if (isNaN(s)) return sec;
      const m = Math.floor(s / 60), r = s % 60;
      return `${m}:${r.toString().padStart(2, '0')}`;
    }

    function formatNum(n) {
      return parseInt(n).toLocaleString();
    }

    function setLoading(state) {
      submitBtn.disabled = state;
      btnText.textContent = state ? 'Loading' : 'Fetch';
    }

    // ── HAMBURGER ──
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
    });

    document.querySelectorAll('.mobile-link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
      });
    });

    // ── NAV SCROLL ──
    const navEl = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      navEl.style.borderBottomColor = window.scrollY > 20
        ? 'rgba(255,255,255,0.1)' : 'var(--border)';
    });