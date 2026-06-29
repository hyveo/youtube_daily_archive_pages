/* Daily AI Insight */
(function(){
  'use strict';

  var APP_TITLE = 'Daily AI Insight';
  var BASE_PATH = getBasePath();
  var DATA_ROOT = BASE_PATH + 'data';
  var DEFAULT_CHANNEL_ID = '12siemannayo';
  var USER_STATE_KEY = 'yda:v1:userState';
  var toastTimer = null;
  var appDataPromise = null;
  var heroTimer = null;
  var tocScrollHandler = null;
  var tocScrollRoot = null;

  function hasValue(value){
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  }

  function escapeHtml(value){
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(value){
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  function fetchJson(path){
    return fetch(path, { cache: 'no-store' }).then(function(response){
      if (!response.ok) return null;
      return response.json();
    }).catch(function(){ return null; });
  }

  function getPageName(){
    var path = window.location.pathname;
    var file = path.split('/').pop() || 'index.html';
    return file.split('?')[0];
  }

  function getBasePath(){
    return './';
  }

  function getSearchParam(name){
    return new URLSearchParams(window.location.search).get(name);
  }

  function showToast(message){
    var toast = document.querySelector('[data-toast]');
    if (!toast){
      toast = document.createElement('div');
      toast.className = 'toast-message';
      toast.setAttribute('data-toast', '');
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.removeAttribute('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){
      toast.setAttribute('hidden', '');
    }, 1800);
  }

  function copyText(value){
    if (navigator.clipboard && window.isSecureContext){
      return navigator.clipboard.writeText(value).then(function(){ return true; });
    }
    var ta = document.createElement('textarea');
    ta.value = value;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      return Promise.resolve(document.execCommand('copy'));
    } finally {
      document.body.removeChild(ta);
    }
  }

  function readUserState(){
    try {
      var parsed = JSON.parse(localStorage.getItem(USER_STATE_KEY) || '{}');
      return {
        subscribedChannelIds: Array.isArray(parsed.subscribedChannelIds) ? parsed.subscribedChannelIds : [],
        savedVideoIds: Array.isArray(parsed.savedVideoIds) ? parsed.savedVideoIds : [],
        likedVideoIds: Array.isArray(parsed.likedVideoIds) ? parsed.likedVideoIds : [],
        reportRatingsByVideoId: parsed.reportRatingsByVideoId && typeof parsed.reportRatingsByVideoId === 'object' ? parsed.reportRatingsByVideoId : {},
        recentVideoIds: Array.isArray(parsed.recentVideoIds) ? parsed.recentVideoIds : []
      };
    } catch (err) {
      return { subscribedChannelIds: [], savedVideoIds: [], likedVideoIds: [], reportRatingsByVideoId: {}, recentVideoIds: [] };
    }
  }

  function writeUserState(state){
    localStorage.setItem(USER_STATE_KEY, JSON.stringify(state));
  }

  function toggleArrayValue(list, value){
    var next = list.slice();
    var index = next.indexOf(value);
    if (index >= 0) next.splice(index, 1);
    else next.push(value);
    return next;
  }

  function setSiteDate(){
    var text = formatDateDot(new Date().toISOString());
    document.querySelectorAll('.site-date, .mobile-titlebar span:not(.mobile-icon):not(.mobile-titlebar-spacer)').forEach(function(el){
      if (!el.classList.contains('mobile-search-icon') && !el.classList.contains('mobile-user-icon')) el.textContent = text;
    });
  }

  function formatDateDot(value){
    var date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return '-';
    var parts = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short'
    }).formatToParts(date).reduce(function(acc, part){
      acc[part.type] = part.value;
      return acc;
    }, {});
    return parts.year + '·' + parts.month + '·' + parts.day + ' ' + parts.weekday;
  }

  function formatDatePlain(value){
    var date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return '-';
    var parts = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'long'
    }).formatToParts(date).reduce(function(acc, part){
      acc[part.type] = part.value;
      return acc;
    }, {});
    return parts.year + '년 ' + Number(parts.month) + '월 ' + Number(parts.day) + '일 ' + parts.weekday;
  }

  function formatDateShort(value){
    var date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return '-';
    var parts = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(date).reduce(function(acc, part){
      acc[part.type] = part.value;
      return acc;
    }, {});
    return parts.month + '·' + parts.day;
  }

  function formatKstMinute(value){
    var date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return '-';
    var parts = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(date).reduce(function(acc, part){
      acc[part.type] = part.value;
      return acc;
    }, {});
    return parts.year + '·' + parts.month + '·' + parts.day + ' ' + parts.hour + ':' + parts.minute + ' KST';
  }

  function formatVideoDateKey(value){
    var date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return '';
    var parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(date).reduce(function(acc, part){
      acc[part.type] = part.value;
      return acc;
    }, {});
    return parts.year + parts.month + parts.day;
  }

  function formatEpisodeDate(value){
    var date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return { date: '-', weekday: '' };
    var parts = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'long'
    }).formatToParts(date).reduce(function(acc, part){
      acc[part.type] = part.value;
      return acc;
    }, {});
    return { date: parts.year + '-' + parts.month + '-' + parts.day, weekday: parts.weekday };
  }

  function cleanTitle(title){
    if (!title) return '';
    return stripEmoji(String(title)
      .replace(/^\[12시에 만나요\]\s*/, '')
      .replace(/[ㅣ|]\s*2026년.*$/, '')
      .replace(/\s*2026년\s*\d+월\s*\d+일\s*[가-힣]+요일.*$/, '')
      .trim());
  }

  function stripEmoji(text){
    return String(text || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/\s+/g, ' ').trim();
  }

  function displayDuration(video){
    var duration = video && video.duration;
    if (!hasValue(duration) || duration === 'P0D') return '';
    return duration;
  }

  function thumbnailStyle(video, mode){
    var imageValue = thumbnailBackgroundImage(video, mode);
    return imageValue ? ' style="background-image: ' + escapeAttr(imageValue) + ';"' : '';
  }

  function thumbnailBackgroundImage(video, mode){
    var url = video && video.thumbnail;
    if (!hasValue(url)) return '';
    var safeUrl = String(url).replace(/["\\\n\r]/g, '');
    var fallbackUrl = safeUrl.replace(/maxresdefault_live\.jpg$/, 'maxresdefault.jpg');
    var urls = fallbackUrl !== safeUrl
      ? 'url("' + safeUrl + '"), url("' + fallbackUrl + '")'
      : 'url("' + safeUrl + '")';
    if (mode === 'plain') return urls;
    var overlay = mode === 'hero'
      ? 'linear-gradient(150deg, rgba(58,34,48,0.12), rgba(21,17,12,0.18))'
      : 'linear-gradient(150deg, rgba(58,34,48,0.72), rgba(21,17,12,0.7))';
    return overlay + ', ' + urls;
  }

  function summaryText(summary, video){
    if (summary && hasValue(summary.headline)) return stripEmoji(summary.headline);
    if (summary && hasValue(summary.insightSummary)) return stripEmoji(summary.insightSummary).slice(0, 110);
    if (summary && hasValue(summary.keyBullets)) return stripEmoji(summary.keyBullets[0]).slice(0, 110);
    if (video && hasValue(video.description)) return stripEmoji(video.description).slice(0, 110);
    return '';
  }

  function getChannelId(){
    var match = window.location.pathname.match(/\/channels\/([^/]+)\/?$/);
    return (match && decodeURIComponent(match[1])) || getSearchParam('channelId') || DEFAULT_CHANNEL_ID;
  }

  function channelDetailHref(channelId){
    return BASE_PATH + 'channel-detail.html?channelId=' + encodeURIComponent(channelId || DEFAULT_CHANNEL_ID);
  }

  function getVideoId(){
    var match = window.location.pathname.match(/\/episodes\/([^/]+)\/?$/);
    if (match && match[1]) return decodeURIComponent(match[1]);
    return getSearchParam('videoId');
  }

  function videoDetailHref(videoId){
    return BASE_PATH + 'detail.html?videoId=' + encodeURIComponent(videoId || '');
  }

  function channelPath(channel){
    return channel && channel.dataPath ? channel.dataPath.replace(/^\/+|\/+$/g, '') : DEFAULT_CHANNEL_ID;
  }

  function getDefaultChannel(channellist){
    var list = channellist && Array.isArray(channellist.channels) ? channellist.channels : [];
    return list.find(function(channel){ return channel.id === getChannelId(); }) || list.find(function(channel){ return channel.id === DEFAULT_CHANNEL_ID; }) || list[0] || null;
  }

  function summaryFileName(video){
    return formatVideoDateKey(video && video.publishedAt) + '_' + video.videoId + '.json';
  }

  function normalizeChannelFromIntro(intro){
    return {
      id: DEFAULT_CHANNEL_ID,
      title: intro && intro.title ? intro.title : '12시에 만나요',
      name: '겸손은힘들다 뉴스공장',
      dataPath: '12siemannayo',
      category: '시사·경제',
      avatarLabel: '겸손',
      playlistUrl: intro && intro.playlistUrl ? intro.playlistUrl : 'https://www.youtube.com/playlist?list=PLpDZdhM6kelSHHNdphTwAWuxxwbI4kGyX',
      youtubeUrl: 'https://www.youtube.com/@gyeomsonisnothing',
      headline: intro && intro.headline ? intro.headline : '',
      body: intro && intro.body ? intro.body : [],
      closing: intro && intro.closing ? intro.closing : '',
      description: intro && intro.closing ? intro.closing : ''
    };
  }

  function loadChannelList(){
    return Promise.all([
      fetchJson(DATA_ROOT + '/channellist.json'),
      fetchJson(DATA_ROOT + '/' + DEFAULT_CHANNEL_ID + '/intro.json')
    ]).then(function(values){
      var list = values[0];
      var intro = values[1];
      if (list && Array.isArray(list.channels) && list.channels.length) return list;
      return { defaultChannelId: DEFAULT_CHANNEL_ID, channels: [normalizeChannelFromIntro(intro)] };
    });
  }

  function loadCategoryList(){
    return fetchJson(DATA_ROOT + '/category.json').then(function(file){
      if (file && Array.isArray(file.categories)) return file;
      return { categories: [] };
    });
  }

  function loadChannelBundle(channel){
    var base = DATA_ROOT + '/' + channelPath(channel);
    return fetchJson(base + '/playlist/index.json').then(function(index){
      var months = index && Array.isArray(index.months) ? index.months : [];
      return Promise.all(months.map(function(month){ return fetchJson(base + '/playlist/' + month + '.json'); })).then(function(monthFiles){
        var videos = [];
        monthFiles.forEach(function(file){
          if (file && Array.isArray(file.videos)) videos = videos.concat(file.videos);
        });
        videos.sort(function(a, b){ return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0); });
        return loadSummaries(channel, videos).then(function(summaryMap){
          return { channel: channel, playlistIndex: index || {}, videos: videos, summaries: summaryMap };
        });
      });
    });
  }

  function loadSummaries(channel, videos){
    var base = DATA_ROOT + '/' + channelPath(channel) + '/summaries';
    var summaryVideos = videos.filter(function(video){ return video && video.videoId && String(video.hasSummary).toUpperCase() === 'Y'; });
    return Promise.all(summaryVideos.map(function(video){
      return fetchJson(base + '/' + summaryFileName(video)).then(function(summary){
        return { videoId: video.videoId, summary: summary };
      });
    })).then(function(entries){
      return entries.reduce(function(acc, entry){
        if (entry.summary) acc[entry.videoId] = entry.summary;
        return acc;
      }, {});
    });
  }

  function loadAppData(){
    if (appDataPromise) return appDataPromise;
    appDataPromise = Promise.all([
      loadChannelList(),
      loadCategoryList(),
      fetchJson(DATA_ROOT + '/home.json'),
      fetchJson(DATA_ROOT + '/rankings.json')
    ]).then(function(values){
      var channellist = values[0];
      var categorylist = values[1] || { categories: [] };
      var home = values[2] || {};
      var rankings = values[3] || {};
      var defaultChannel = getDefaultChannel(channellist);
      return loadChannelBundle(defaultChannel).then(function(bundle){
        return {
          channellist: channellist,
          categorylist: categorylist,
          home: home,
          rankings: rankings,
          defaultChannel: defaultChannel,
          bundles: (function(){
            var map = {};
            map[defaultChannel.id] = bundle;
            return map;
          })()
        };
      });
    });
    return appDataPromise;
  }

  function findVideo(bundle, videoId){
    if (!bundle || !Array.isArray(bundle.videos)) return null;
    if (videoId) return bundle.videos.find(function(video){ return video.videoId === videoId; }) || null;
    return bundle.videos.find(function(video){ return String(video.hasSummary).toUpperCase() === 'Y'; }) || bundle.videos[0] || null;
  }

  function getLatestSummaryVideo(bundle){
    return bundle.videos.find(function(video){ return bundle.summaries[video.videoId]; }) || bundle.videos[0] || null;
  }

  function getHomeHeroItems(bundle){
    var weeklyVideos = getCurrentWeekVideos(bundle.videos);
    var summaryVideos = bundle.videos.filter(function(video){ return bundle.summaries[video.videoId]; });
    var previousWeekVideos = weeklyVideos.length ? [] : getPreviousWeekVideos(bundle.videos).slice(0, 5);
    var videos = weeklyVideos.length ? weeklyVideos : (previousWeekVideos.length ? previousWeekVideos : summaryVideos.length ? summaryVideos.slice(0, 5) : bundle.videos.slice(0, 1));
    return videos.map(function(video){
      return { video: video, summary: bundle.summaries[video.videoId] || null };
    });
  }

  function getCurrentWeekVideos(videos){
    if (!Array.isArray(videos) || !videos.length) return [];
    var week = getKstWeekRange(new Date().toISOString());
    if (!week) return videos;
    return videos.filter(function(video){
      var key = formatKstDateKey(video.publishedAt);
      return key && key >= week.start && key <= week.end;
    });
  }

  function getPreviousWeekVideos(videos){
    if (!Array.isArray(videos) || !videos.length) return [];
    var current = getKstWeekRange(new Date().toISOString());
    if (!current) return [];
    var startParts = current.start.split('-').map(Number);
    var previousDay = new Date(Date.UTC(startParts[0], startParts[1] - 1, startParts[2]) - 86400000);
    var week = getKstWeekRange(dateKeyFromUtc(previousDay) + 'T00:00:00+09:00');
    if (!week) return [];
    return videos.filter(function(video){
      var key = formatKstDateKey(video.publishedAt);
      return key && key >= week.start && key <= week.end;
    });
  }

  function formatKstDateKey(value){
    var date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return '';
    var parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(date).reduce(function(acc, part){
      acc[part.type] = part.value;
      return acc;
    }, {});
    return parts.year + '-' + parts.month + '-' + parts.day;
  }

  function getKstWeekRange(value){
    var key = formatKstDateKey(value);
    if (!key) return null;
    var parts = key.split('-').map(Number);
    var day = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    var mondayOffset = (day.getUTCDay() + 6) % 7;
    var start = new Date(day.getTime() - mondayOffset * 86400000);
    var end = new Date(start.getTime() + 6 * 86400000);
    return { start: dateKeyFromUtc(start), end: dateKeyFromUtc(end) };
  }

  function dateKeyFromUtc(date){
    return date.getUTCFullYear() + '-' + String(date.getUTCMonth() + 1).padStart(2, '0') + '-' + String(date.getUTCDate()).padStart(2, '0');
  }

  function toneClass(index){
    return index % 4 === 1 ? ' tone-2' : index % 4 === 2 ? ' tone-3' : index % 4 === 3 ? ' tone-4' : '';
  }

  function renderHome(app){
    var main = document.querySelector('main');
    if (!main) return;
    var bundle = app.bundles[app.defaultChannel.id];
    var heroItems = getHomeHeroItems(bundle);
    var latest = heroItems[0] && heroItems[0].video ? heroItems[0].video : getLatestSummaryVideo(bundle);
    setSiteDate(latest && latest.publishedAt);
    document.title = '홈 · ' + APP_TITLE;

    main.innerHTML = [
      renderHomeHero(app.defaultChannel, heroItems),
      renderShortcuts(getHomeShortcuts(app)),
      renderFeaturedChannels(app, bundle),
      renderRankings(app, bundle)
    ].filter(hasValue).join('');
    initHomeHeroCarousel(app.defaultChannel, heroItems);
  }

  function renderHomeHero(channel, items){
    if (!hasValue(items)) return '';
    return '<section class="hero" data-hero><div class="hero-panel">' + items.map(function(item, index){
      var video = item.video;
      var summary = item.summary;
      var title = cleanTitle(video.title);
      var desc = summaryText(summary, video);
      var href = videoDetailHref(video.videoId);
      return '<div class="hero-slide' + (index === 0 ? ' is-active' : '') + '"' + thumbnailStyle(video, 'hero') + ' data-hero-slide><div class="hero-copy">' +
        '<div class="eyebrow">이번 주 리포트 · AI 요약</div>' +
        '<h1 class="hero-title">' + escapeHtml(title) + '</h1>' +
        '<p class="hero-summary"' + (hasValue(desc) ? '' : ' hidden') + '>' + escapeHtml(desc || '') + '</p>' +
        '<a class="primary-pill" href="' + href + '">리포트 읽기 →</a>' +
        '</div></div>';
    }).join('') + (items.length > 1 ? '<div class="hero-counter"><button class="pause" type="button" data-hero-toggle aria-label="히어로 롤링 정지">❚❚</button><span class="count" data-hero-count>1 / ' + escapeHtml(String(items.length)) + '</span></div>' : '') + '</div></section>';
  }

  function initHomeHeroCarousel(channel, items){
    if (heroTimer) window.clearInterval(heroTimer);
    heroTimer = null;
    if (!hasValue(items) || items.length < 2) return;
    var hero = document.querySelector('[data-hero]');
    if (!hero) return;
    var index = 0;
    var paused = false;
    function apply(nextIndex){
      var previousIndex = index;
      index = nextIndex % items.length;
      hero.querySelectorAll('[data-hero-slide]').forEach(function(slide, slideIndex){
        slide.classList.toggle('is-active', slideIndex === index);
        slide.classList.toggle('is-leaving', slideIndex === previousIndex && slideIndex !== index);
      });
      setText('[data-hero-count]', (index + 1) + ' / ' + items.length);
    }
    heroTimer = window.setInterval(function(){
      if (!paused) apply(index + 1);
    }, 5000);
    var toggle = hero.querySelector('[data-hero-toggle]');
    if (toggle){
      toggle.addEventListener('click', function(){
        paused = !paused;
        toggle.textContent = paused ? '▶' : '❚❚';
        toggle.setAttribute('aria-label', paused ? '히어로 롤링 재생' : '히어로 롤링 정지');
      });
    }
  }

  function setText(selector, value){
    var el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  function setHidden(selector, hidden){
    var el = document.querySelector(selector);
    if (el) el.hidden = !!hidden;
  }

  function getHomeShortcuts(app){
    var categoryItems = getVisibleCategoryItems(app);
    return [{ label: '전체', icon: '▦', href: 'channel.html' }]
      .map(function(item){ item.filter = ''; return item; })
      .concat(categoryItems);
      // .concat([
      //   { label: '새 리포트', icon: 'NEW', href: 'channel.html' },
      //   { label: '인기', icon: '★', href: 'index.html#ranking' }
      // ]);
  }

  function getVisibleCategoryItems(app){
    var registered = app.categorylist && Array.isArray(app.categorylist.categories) ? app.categorylist.categories : [];
    var channelCategories = new Set();
    (app.channellist.channels || []).forEach(function(channel){
      var categories = Array.isArray(channel.categories) ? channel.categories : (channel.category ? [channel.category] : []);
      categories.forEach(function(category){
        if (hasValue(category)) channelCategories.add(String(category));
      });
    });
    return registered.filter(function(category){
      return category && channelCategories.has(String(category.label || category.id || ''));
    }).map(function(category){
      var label = String(category.label || category.id || '');
      return {
        label: label,
        icon: category.icon || label,
        filter: label,
        href: 'channel.html?category=' + encodeURIComponent(label)
      };
    });
  }

  function renderShortcuts(items){
    if (!hasValue(items)) return '';
    return '<nav class="shortcut-row sx" aria-label="카테고리">' + items.map(function(item, index){
      var iconClass = Object.prototype.hasOwnProperty.call(item, 'filter') ? ' filter' : '';
      var href = item.href || 'channel.html';
      var filterAttr = Object.prototype.hasOwnProperty.call(item, 'filter')
        ? ' data-category-filter="' + escapeAttr(item.filter || '') + '"'
        : '';
      var activeClass = index === 0 && filterAttr ? ' is-active' : '';
      return '<a class="shortcut' + activeClass + '" href="' + escapeAttr(filterAttr ? '#channel-list' : href) + '"' + filterAttr + '><span class="shortcut-icon' + iconClass + '">' + escapeHtml(item.icon || item.label || '') + '</span><span>' + escapeHtml(item.label || '') + '</span></a>';
    }).join('') + '</nav>';
  }

  function renderFeaturedChannels(app, bundle, activeCategory){
    var channels = app.channellist.channels || [];
    if (hasValue(activeCategory)){
      channels = channels.filter(function(channel){
        var categories = Array.isArray(channel.categories) ? channel.categories : (channel.category ? [channel.category] : []);
        return categories.indexOf(activeCategory) >= 0;
      });
    }
    return '<section class="section" id="channel-list" data-channel-list data-active-category="' + escapeAttr(activeCategory || '') + '"><div class="section-head"><div><h2 class="section-title">채널 리스트</h2>' +
      '<div class="section-subtitle">매일 업데이트되는 AI 리포트 채널</div></div><a class="chevron" href="channel.html">›</a></div>' +
      (channels.length ? '<div class="channel-grid sx">' + channels.slice(0, 4).map(function(channel, index){
        var videos = channel.id === bundle.channel.id ? bundle.videos.filter(function(video){ return String(video.hasSummary).toUpperCase() === 'Y'; }).slice(0, 2) : [];
        var channelImage = channel.heroImage || (videos[0] && videos[0].thumbnail) || '';
        return '<article class="channel-card"><a class="feature-card' + toneClass(index) + '" href="' + escapeAttr(channelDetailHref(channel.id)) + '"' + thumbnailStyle({ thumbnail: channelImage }, 'plain') + '>' +
          (hasValue(channel.category) ? '<span class="category-pill">' + escapeHtml(channel.category) + '</span>' : '') +
          '<span class="avatar-chip">' + escapeHtml(channel.avatarLabel || channel.title || '') + '</span>' +
          '<div class="feature-copy"><small>' + escapeHtml(channel.title || '') + '</small><strong>' + escapeHtml(channel.name || channel.title || '') + '</strong>' +
          '<em>EP ' + escapeHtml(String((channel.stats && channel.stats.episodeCount) || bundle.videos.length || '-')) + ' · ' + escapeHtml(String((channel.stats && channel.stats.archiveDays) || '-')) + '일</em></div></a>' +
          '<div class="mobile-channel-meta"><strong>' + escapeHtml((Array.isArray(channel.categories) && channel.categories[0]) || channel.category || channel.title || '') + '</strong><span>매주 업데이트</span></div>' +
          '<div class="feature-list">' + videos.map(function(video, i){
            return '<a class="feature-mini" href="' + escapeAttr(videoDetailHref(video.videoId)) + '"><span class="feature-mini-cover' + toneClass(i) + '"' + thumbnailStyle(video, 'plain') + '></span><span><strong class="feature-mini-title">' + escapeHtml(cleanTitle(video.title)) + '</strong><em class="mini-date">' + escapeHtml(formatDateShort(video.publishedAt)) + '</em></span><b class="read-pill">읽기</b></a>';
          }).join('') + '</div></article>';
      }).join('') + '</div>' : renderEmptyChannelState()) + '</section>';
  }

  function renderEmptyChannelState(){
    return '<div class="empty-channel-card"><div class="pending-report-copy"><div class="ai-lead-title"><span>✦</span> 해당 채널이 없습니다.</div></div><a class="primary-pill pending-discord" href="https://discord.gg/Ajv9563Gf" target="_blank" rel="noreferrer">디스코드 알림받기</a></div>';
  }

  function renderChannelListPage(app){
    var main = document.querySelector('main');
    if (!main) return;
    var selected = getSearchParam('category') || '';
    var channels = app.channellist.channels || [];
    if (hasValue(selected)){
      channels = channels.filter(function(channel){
        var categories = Array.isArray(channel.categories) ? channel.categories : (channel.category ? [channel.category] : []);
        return categories.indexOf(selected) >= 0;
      });
    }
    setSiteDate();
    document.title = '채널 · ' + APP_TITLE;
    main.innerHTML = '<section class="channel-directory">' + renderChannelDirectoryTabs(app, selected) +
      '<div class="channel-directory-grid">' + (channels.length ? channels.map(renderChannelDirectoryCard).join('') : renderEmptyChannelState()) + '</div></section>';
  }

  function renderChannelDirectoryTabs(app, selected){
    var items = [{ label: '추천순', filter: '' }].concat(getVisibleCategoryItems(app));
    return '<nav class="channel-directory-tabs" aria-label="채널 카테고리">' + items.map(function(item){
      var filter = Object.prototype.hasOwnProperty.call(item, 'filter') ? item.filter : item.label;
      var active = String(filter || '') === String(selected || '') ? ' is-active' : '';
      return '<a class="channel-directory-tab' + active + '" href="channel.html' + (filter ? '?category=' + encodeURIComponent(filter) : '') + '" data-channel-page-filter="' + escapeAttr(filter || '') + '">' + escapeHtml(item.label || '') + '</a>';
    }).join('') + '</nav>';
  }

  function renderChannelDirectoryCard(channel, index){
    var categories = Array.isArray(channel.categories) ? channel.categories : (channel.category ? [channel.category] : []);
    var description = channel.shortDescription || channel.description || channel.headline || '';
    var image = channel.heroImage || '';
    return '<a class="channel-directory-card" href="' + escapeAttr(channelDetailHref(channel.id)) + '">' +
      '<span class="channel-directory-cover"' + thumbnailStyle({ thumbnail: image }, 'plain') + '></span>' +
      '<span class="channel-directory-rank"><strong>' + escapeHtml(String(index + 1)) + '</strong><em>-</em></span>' +
      '<span class="channel-directory-copy"><strong>' + escapeHtml(channel.title || channel.name || '') + '</strong>' +
      '<em>' + escapeHtml(channel.name || '-') + '</em>' +
      (hasValue(description) ? '<span>' + escapeHtml(description) + '</span>' : '') +
      (categories.length ? '<small>' + categories.map(escapeHtml).join(' · ') + '</small>' : '') + '</span></a>';
  }

  function getRankingItems(rankings, period){
    var key = period || 'daily';
    if (rankings && rankings.periods && rankings.periods[key] && Array.isArray(rankings.periods[key].items)){
      return rankings.periods[key].items;
    }
    if (rankings && rankings[key] && Array.isArray(rankings[key].items)){
      return rankings[key].items;
    }
    return rankings && Array.isArray(rankings.items) ? rankings.items : [];
  }

  function getRankingVideos(app, bundle, period, category){
    var items = getRankingItems(app.rankings, period);
    if (items.length){
      return items.map(function(item){
        var channelId = item.channelId || bundle.channel.id;
        var channel = (app.channellist.channels || []).find(function(row){ return row.id === channelId; }) || bundle.channel;
        var video = channelId === bundle.channel.id ? findVideo(bundle, item.videoId) : null;
        if (!video) return null;
        return { channel: channel, video: video, summary: bundle.summaries[video.videoId], score: item.score, trend: item.trend };
      }).filter(Boolean).filter(function(row){ return matchesRankingCategory(row.channel, category); });
    }
    return bundle.videos.filter(function(video){ return bundle.summaries[video.videoId]; }).map(function(video){
      return { channel: bundle.channel, video: video, summary: bundle.summaries[video.videoId] };
    }).filter(function(row){ return matchesRankingCategory(row.channel, category); }).slice(0, 12);
  }

  function matchesRankingCategory(channel, category){
    if (!hasValue(category)) return true;
    var categories = Array.isArray(channel.categories) ? channel.categories : (channel.category ? [channel.category] : []);
    return categories.indexOf(category) >= 0;
  }

  function renderRankings(app, bundle, options){
    options = options || {};
    var activeCategory = options.category || '';
    var activePeriod = options.period || (app.rankings && app.rankings.period) || 'daily';
    var allRows = getRankingVideos(app, bundle, activePeriod, '');
    if (!hasValue(allRows)) return '';
    var rows = getRankingVideos(app, bundle, activePeriod, activeCategory);
    var categories = getVisibleCategoryItems(app).map(function(item){ return item.label; });
    var periods = [
      { key: 'daily', label: '일간' },
      { key: 'weekly', label: '주간' },
      { key: 'monthly', label: '월간' }
    ];
    return '<section class="section ranking-section" data-ranking-section data-ranking-category="' + escapeAttr(activeCategory) + '" data-ranking-period="' + escapeAttr(activePeriod) + '"><div class="section-head"><div><h2 class="section-title">리포트 랭킹 <span class="section-subtitle">인기</span></h2></div></div>' +
      '<div class="tabs sx" aria-label="리포트 랭킹 카테고리"><button class="tab-pill' + (!activeCategory ? ' is-active' : '') + '" type="button" data-ranking-category="">추천순</button>' + categories.map(function(category){ return '<button class="tab-pill' + (activeCategory === category ? ' is-active' : '') + '" type="button" data-ranking-category="' + escapeAttr(category) + '">' + escapeHtml(category) + '</button>'; }).join('') + '</div>' +
      '<div class="ranking-meta"><div class="ranking-periods" aria-label="리포트 랭킹 기간">' + periods.map(function(period){ return '<button type="button" class="' + (activePeriod === period.key ? 'is-active' : '') + '" data-ranking-period="' + escapeAttr(period.key) + '">' + escapeHtml(period.label) + '</button>'; }).join('') + '</div><span>' + escapeHtml(formatDateDot((app.rankings && app.rankings.updatedAt) || (allRows[0] && allRows[0].video.publishedAt))) + ' ⓘ</span></div>' +
      (rows.length ? '<div class="ranking-grid">' +
      rows.slice(0, 12).map(function(row, index){
        var trend = row.trend || (index === 0 ? '–' : '');
        var trendClass = String(trend).charAt(0) === '▲' ? ' class="up"' : String(trend).charAt(0) === '▼' ? ' class="down"' : '';
        return '<a class="rank-item" href="' + escapeAttr(videoDetailHref(row.video.videoId)) + '"><span class="rank-num"><strong>' + (index + 1) + '</strong><em' + trendClass + '>' + escapeHtml(trend) + '</em></span>' +
          '<span class="rank-cover' + toneClass(index) + '"' + thumbnailStyle(row.video, 'plain') + '></span><span><strong class="rank-title">' + escapeHtml(cleanTitle(row.video.title)) + '</strong><span class="rank-info"><em class="rank-meta">' + escapeHtml(row.channel.name || row.video.channelTitle || '') + '</em>' +
          (hasValue(row.score) ? '<b class="rank-likes">♥ ' + escapeHtml(row.score) + '</b>' : '') + '</span></span></a>';
      }).join('') + '</div>' : '<div class="ranking-empty"><div class="ai-lead-title"><span>✦</span> 해당 리포트가 없습니다.</div></div>') + '</section>';
  }

  function renderChannel(app){
    var main = document.querySelector('main');
    if (!main) return;
    var bundle = app.bundles[app.defaultChannel.id];
    var channel = bundle.channel;
    setSiteDate(bundle.videos[0] && bundle.videos[0].publishedAt);
    document.title = (channel.title || '채널') + ' · ' + APP_TITLE;
    main.setAttribute('data-tabs', '');
    main.innerHTML = renderChannelHero(channel, bundle) + renderChannelTabs() + renderEpisodeList(bundle) + renderChannelInfo(channel);
  }

  function renderChannelHero(channel, bundle){
    var count = bundle.videos.length;
    var days = channel.stats && channel.stats.archiveDays ? channel.stats.archiveDays : '-';
    var body = Array.isArray(channel.body) ? channel.body.join('<br>') : channel.description || '';
    var heroStyle = thumbnailStyle({ thumbnail: channel.heroImage || (bundle.videos[0] && bundle.videos[0].thumbnail) });
    return '<section class="channel-banner"' + heroStyle + '><div class="eyebrow">THE CHANNEL</div><h1 class="channel-title">' + escapeHtml(channel.name || '') + ' · 〈' + escapeHtml(channel.title || '') + '〉</h1>' +
      (hasValue(channel.headline) ? '<div class="channel-headline">' + escapeHtml(channel.headline) + '</div>' : '') +
      (hasValue(body) ? '<p class="channel-desc">' + body + '</p>' : '') +
      (hasValue(channel.closing) ? '<p class="channel-closing">' + escapeHtml(channel.closing) + '</p>' : '') +
      '<div class="action-row">' + renderSubscribeButton(channel.id) + renderExternalButton(channel.playlistUrl, '플레이리스트 가기', 'outline-pill') + renderExternalButton(channel.youtubeUrl, '유튜브 채널 가기', 'outline-pill') + '</div></section>' +
      '<section class="channel-hero"' + heroStyle + '><div><div class="eyebrow">AI 리포트 채널</div><h1 class="channel-title">' + escapeHtml(channel.title || '') + '</h1>' +
      '<div class="channel-mobile-source">' + escapeHtml(channel.name || '') + '</div>' +
      (hasValue(channel.shortDescription) ? '<p class="channel-desc">' + escapeHtml(channel.shortDescription) + '</p>' : '') +
      '<div class="meta-mono">EP ' + escapeHtml(String(count)) + ' · ' + escapeHtml(String(days)) + '일 리포트 · 매일 업데이트</div>' +
      '<div class="action-row">' + renderSubscribeButton(channel.id) + renderExternalIcon(channel.playlistUrl, 'playlist', '플레이리스트 가기') + renderExternalIcon(channel.youtubeUrl, 'youtube', '유튜브 채널 가기') + '</div></div></section>';
  }

  function renderSubscribeButton(channelId){
    var state = readUserState();
    var subscribed = state.subscribedChannelIds.indexOf(channelId) >= 0;
    return '<button class="primary-pill" type="button" data-subscribe="' + escapeAttr(channelId) + '"><span data-state="off"' + (subscribed ? ' style="display:none;"' : '') + '>＋ 구독</span><span data-state="on"' + (!subscribed ? ' style="display:none;"' : '') + '>✓ 구독중</span></button>';
  }

  function renderExternalButton(url, label, cls){
    if (!hasValue(url)) return '';
    return '<a class="primary-pill ' + cls + '" href="' + escapeAttr(url) + '" target="_blank" rel="noreferrer">' + escapeHtml(label) + '</a>';
  }

  function renderExternalIcon(url, cls, label){
    if (!hasValue(url)) return '';
    return '<a class="channel-icon-btn ' + cls + '" href="' + escapeAttr(url) + '" target="_blank" rel="noreferrer" aria-label="' + escapeAttr(label) + '"></a>';
  }

  function renderChannelTabs(){
    return '<div class="channel-tabs sx"><button class="mtab on" type="button" data-tab="ep">에피소드</button><button class="mtab" type="button" data-tab="info">정보</button></div>';
  }

  function renderEpisodeList(bundle){
    var items = bundle.videos;
    return '<section class="episode-section" data-panel="ep" data-eplist><div class="search-box" data-episode-search-box><span class="search-icon"></span><input type="search" data-episode-search placeholder="에피소드 검색 — 제목·키워드·날짜로 찾기" aria-label="에피소드 검색"></div>' +
      '<div class="episode-head"><strong>Episodes</strong><span class="episode-head-controls"><span class="episode-count">' + escapeHtml(String(items.length)) + ' EPISODES</span><button class="episode-sort" type="button" data-episode-sort>최신순 ↓</button></span><button class="mobile-sort" type="button" data-episode-sort>최신순 ↓</button></div>' +
      items.map(function(video, index){ return renderEpisode(video, bundle, index); }).join('') +
      (items.length > 5 ? '<button class="more-button" type="button" data-more>에피소드 더보기 <span data-more-count>+' + (items.length - 5) + '</span></button>' : '') + '</section>';
  }

  function renderEpisode(video, bundle, index){
    var date = formatEpisodeDate(video.publishedAt);
    var summary = bundle.summaries[video.videoId];
    var hasSummary = !!summary || String(video.hasSummary).toUpperCase() === 'Y';
    return '<article class="episode" data-ep-item data-published="' + escapeAttr(video.publishedAt || '') + '"' + (index > 4 ? ' style="display:none;"' : '') + '><div class="episode-date"><strong>' + escapeHtml(date.date) + '</strong>' +
      (date.weekday ? '<span>' + escapeHtml(date.weekday) + '</span>' : '') +
      (hasSummary ? '<em class="small-report-badge">✦ AI 리포트</em>' : '') +
      (hasValue(displayDuration(video)) ? '<em class="mobile-duration">' + escapeHtml(displayDuration(video)) + '</em>' : '') + '</div>' +
      '<a class="episode-link" href="' + escapeAttr(videoDetailHref(video.videoId)) + '">' +
      '<span class="episode-thumb' + toneClass(index) + '"' + thumbnailStyle(video) + '>' + (hasValue(displayDuration(video)) ? '<em class="duration">' + escapeHtml(displayDuration(video)) + '</em>' : '') + '</span><span>' +
      '<strong class="episode-title">' + escapeHtml(cleanTitle(video.title)) + '</strong>' +
      '<span class="episode-meta"><span>' + escapeHtml(bundle.channel.name || video.channelTitle || '') + '</span>' + (hasValue(displayDuration(video)) ? '<i>|</i><span>Runtime ' + escapeHtml(displayDuration(video)) + '</span>' : '') + '<i>|</i><span>#' + escapeHtml(video.videoId) + '</span>' + (String(video.hasTranscript).toUpperCase() === 'Y' ? '<b>CC</b>' : '') + '</span>' +
      (hasValue(summaryText(summary, video)) ? '<span class="episode-summary">' + escapeHtml(summaryText(summary, video)) + '</span>' : '') + '</span></a></article>';
  }

  function renderChannelInfo(channel){
    var copy = Array.isArray(channel.body) ? channel.body.concat(channel.closing || []).filter(hasValue).join('<br>') : channel.description || '';
    return '<section class="episode-section channel-info-panel" data-panel="info" style="display:none;">' +
      (hasValue(channel.headline) ? '<h2 class="channel-info-title">' + escapeHtml(channel.headline) + '</h2>' : '') +
      (hasValue(copy) ? '<p class="channel-info-copy">' + copy + '</p>' : '') +
      '<div class="action-row">' + renderExternalButton(channel.playlistUrl, '플레이리스트 가기', '') + renderExternalButton(channel.youtubeUrl, '유튜브 채널 가기', 'outline-pill') + '</div></section>';
  }

  function renderDetail(app){
    var main = document.querySelector('main.detail-layout');
    if (!main) return;
    var bundle = app.bundles[app.defaultChannel.id];
    var videoId = getVideoId();
    var video = findVideo(bundle, videoId);
    if (!video){
      main.innerHTML = '<article class="detail-main"><section class="ai-lead"><div class="ai-lead-title"><span>✦</span> 영상을 찾을 수 없습니다.</div><p>요청한 영상 ID와 일치하는 리포트 데이터를 찾지 못했습니다.</p></section></article>';
      return;
    }
    var summary = bundle.summaries[video.videoId] || null;
    var back = document.querySelector('.mobile-back-icon');
    if (back) back.setAttribute('href', channelDetailHref(bundle.channel.id));
    setSiteDate(video.publishedAt);
    document.title = cleanTitle(video.title) + ' · ' + APP_TITLE;
    rememberRecent(video.videoId);
    main.innerHTML = '<div class="mobile-detail-hero" data-video data-vid="' + escapeAttr(video.videoId) + '"' + thumbnailStyle(video) + '><button class="play-button" type="button" data-play aria-label="재생"></button><span>' + escapeHtml(bundle.channel.title || '12시에 만나요').replace(/\s/g, '<br>') + '</span>' + (hasValue(displayDuration(video)) ? '<em class="duration">' + escapeHtml(displayDuration(video)) + '</em>' : '') + '</div>' +
      '<article class="detail-main">' + renderDetailArticle(bundle.channel, video, summary, app.rankings) + '</article>' +
      renderDetailAside(bundle.channel, video, summary);
    restoreRating(video.videoId);
    restoreBookmark(video.videoId);
    restoreLike(video.videoId);
    initTocSpy();
  }

  function initTocSpy(){
    if (tocScrollHandler){
      (tocScrollRoot || window).removeEventListener('scroll', tocScrollHandler);
      window.removeEventListener('resize', tocScrollHandler);
      tocScrollHandler = null;
      tocScrollRoot = null;
    }
    var links = [].slice.call(document.querySelectorAll('.toc-box a[href^="#"]'));
    if (!links.length) return;
    var ids = links.map(function(link){ return link.getAttribute('href'); })
      .filter(function(value, index, arr){ return value && arr.indexOf(value) === index; });
    var sections = ids.map(function(id){
      return { id: id, el: document.querySelector(id) };
    }).filter(function(item){ return item.el; });
    if (!sections.length) return;
    var currentActiveId = '';
    var scrollRoot = getTocScrollRoot();
    tocScrollRoot = scrollRoot;

    function setActive(id){
      if (currentActiveId === id) return;
      currentActiveId = id;
      links.forEach(function(link){
        var active = link.getAttribute('href') === id;
        link.classList.toggle('is-active', active);
        if (active && link.closest('.toc-box')){
          link.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      });
    }

    tocScrollHandler = function(){
      var probe = getTocProbe(scrollRoot);
      var activeId = sections[0].id;
      sections.forEach(function(item){
        if (getSectionTop(item.el, scrollRoot) <= probe) activeId = item.id;
      });
      setActive(activeId);
    };
    tocScrollHandler();
    scrollRoot.addEventListener('scroll', tocScrollHandler, { passive: true });
    window.addEventListener('resize', tocScrollHandler);
  }

  function getTocScrollRoot(){
    var main = document.querySelector('main.detail-layout');
    if (!main) return window;
    if (window.matchMedia('(max-width: 760px)').matches) return main;
    return window;
  }

  function getTocProbe(scrollRoot){
    if (scrollRoot === window){
      return window.scrollY + Math.max(96, Math.round(window.innerHeight * 0.22));
    }
    var rect = scrollRoot.getBoundingClientRect();
    return rect.top + Math.max(96, Math.round(scrollRoot.clientHeight * 0.22));
  }

  function getSectionTop(section, scrollRoot){
    if (scrollRoot === window) return section.offsetTop;
    return section.getBoundingClientRect().top;
  }

  function rememberRecent(videoId){
    var state = readUserState();
    state.recentVideoIds = [videoId].concat(state.recentVideoIds.filter(function(id){ return id !== videoId; })).slice(0, 20);
    writeUserState(state);
  }

  function renderDetailArticle(channel, video, summary, rankings){
    var title = cleanTitle(video.title);
    var summaryReady = !!summary;
    return '<div class="detail-kicker">' + escapeHtml(channel.name || video.channelTitle || '') + ' · AI 리포트 · ' + escapeHtml(formatDatePlain(video.publishedAt)) + '</div>' +
      '<div class="detail-title-row"><h1 class="detail-title">' + escapeHtml(title) + '</h1><div class="detail-actions">' + (summaryReady ? renderLikeButton(video.videoId, rankings) : '') + renderBookmarkButton(video.videoId) + '<button class="icon-circle" type="button" data-share aria-label="공유"><svg class="action-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.4"/><circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="19" r="2.4"/><path d="M8 11l8-5M8 13l8 5"/></svg></button></div></div>' +
      renderMeta(channel, video, summary) +
      (summaryReady ? renderSummaryArticle(summary) : renderPreparingState()) +
      (summaryReady ? renderBottomRatePanel(video.videoId) : '');
  }

  function renderLikeButton(videoId, rankings){
    return '<button class="like-action" type="button" data-like="' + escapeAttr(videoId) + '" data-like-base="' + escapeAttr(String(getBaseLikeCount(videoId, rankings))) + '" aria-label="좋아요"><span data-like-heart>♡</span><span data-like-count>' + escapeHtml(formatCount(getBaseLikeCount(videoId, rankings))) + '</span></button>';
  }

  function getBaseLikeCount(videoId, rankings){
    var items = rankings && Array.isArray(rankings.items) ? rankings.items : [];
    var item = items.find(function(row){ return row.videoId === videoId; });
    if (!item || !hasValue(item.score)) return 0;
    return Number(String(item.score).replace(/[^\d]/g, '')) || 0;
  }

  function formatCount(value){
    return Number(value || 0).toLocaleString('ko-KR');
  }

  function renderBookmarkButton(videoId){
    return '<button class="icon-circle" type="button" data-bookmark="' + escapeAttr(videoId) + '" aria-label="보관"><span data-state="off"><svg class="action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v16l-6-4-6 4z"/></svg></span><span data-state="on" style="display:none;"><svg class="action-icon filled" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v16l-6-4-6 4z"/></svg></span></button>';
  }

  function renderMeta(channel, video, summary){
    var editor = summary && summary.editor && summary.editor.name ? summary.editor.name : 'hyveo';
    var rows = [
      'EDITED BY <b style="color:#E3120B;">' + escapeHtml(editor) + '</b>',
      '발행 ' + escapeHtml(formatKstMinute(video.publishedAt)),
      '요약 갱신 ' + escapeHtml(summary && summary.summaryUpdatedAt ? formatKstMinute(summary.summaryUpdatedAt) : '-'),
      hasValue(displayDuration(video)) ? '원본 ' + escapeHtml(displayDuration(video)) : ''
    ].filter(hasValue);
    return '<div class="article-meta">' + rows.map(function(row){ return '<span>' + row + '</span>'; }).join('') + '</div>';
  }

  function renderPreparingState(){
    return '<section class="pending-report"><div class="pending-report-copy"><div class="ai-lead-title"><span>✦</span> AI 리포트가 준비 중입니다.</div></div><a class="primary-pill pending-discord" href="https://discord.gg/Ajv9563Gf" target="_blank" rel="noreferrer">디스코드 알림받기</a></section>';
  }

  function renderSummaryArticle(summary){
    var html = '';
    if (hasValue(summary.headline) || hasValue(summary.insightSummary)){
      html += '<section class="ai-lead"><div class="ai-lead-title"><span>✦</span> AI 분석 리포트</div>' +
        (hasValue(summary.headline) ? '<p>' + escapeHtml(summary.headline) + '</p>' : '') +
        '</section>';
    }
    html += renderToc(summary);
    if (hasValue(summary.insightSummary)){
      html += '<section id="insight" class="report-section insight-section"><p class="section-label">핵심 해석</p><h2>오늘의 Insight</h2><p class="insight-copy">' + escapeHtml(summary.insightSummary) + '</p></section>';
    }
    if (hasValue(summary.readerTakeaways) || hasValue(summary.watchPoints)){
      html += '<section id="investor-view" class="report-section split-section"><p class="section-label">관점 정리</p><h2>투자자가 가져갈 관점과 체크포인트</h2><div class="split-grid">' +
        renderListColumn('가져갈 관점', summary.readerTakeaways) + renderListColumn('앞으로 볼 것', summary.watchPoints, 'muted-list') + '</div></section>';
    }
    if (summary.strategyFrame && hasValue(summary.strategyFrame)){
      html += renderStrategyFrame(summary.strategyFrame);
    }
    if (hasValue(summary.sections)){
      html += '<div id="chapter-summary" class="chapter-heading"><p class="section-label">방송</p><h2>챕터별 요약</h2></div>' +
        summary.sections.map(function(section, index){ return renderReportSection(section, index + 1); }).join('');
    } else if (hasValue(summary.keyBullets)){
      html += '<section class="report-section"><h2>핵심 요약</h2><ul>' + summary.keyBullets.map(function(text){ return '<li>' + escapeHtml(text) + '</li>'; }).join('') + '</ul></section>';
    }
    return html;
  }

  function renderToc(summary, className){
    var top = [];
    if (hasValue(summary.insightSummary)) top.push({ href: '#insight', num: '1', title: '오늘의 Insight' });
    if (hasValue(summary.readerTakeaways) || hasValue(summary.watchPoints)) top.push({ href: '#investor-view', num: '2', title: '투자 관점과 체크포인트' });
    if (hasValue(summary.strategyFrame)) top.push({ href: '#strategy-frame', num: '3', title: '전략 판단 체크프레임' });
    if (hasValue(summary.sections)) top.push({ href: '#chapter-summary', num: '4', title: '챕터별 요약' });
    var subs = (summary.toc || summary.sections || []).map(function(item, index){
      return { href: '#sec-' + (index + 1), num: '4.' + (index + 1), title: item.title };
    });
    var rows = top.concat(subs);
    if (!hasValue(rows)) return '';
    return '<nav class="toc-box' + (className ? ' ' + escapeAttr(className) : '') + ' sx" aria-label="목차"><strong>목차</strong><div class="toc-grid">' + rows.map(function(row){
      var cls = String(row.num).indexOf('.') >= 0 ? ' class="toc-sub"' : '';
      return '<a' + cls + ' href="' + escapeAttr(row.href) + '"><span>' + escapeHtml(row.num) + '</span>' + escapeHtml(row.title || '') + '</a>';
    }).join('') + '</div></nav>';
  }

  function renderListColumn(title, items, cls){
    if (!hasValue(items)) return '';
    return '<div><h3>' + escapeHtml(title) + '</h3><ul' + (cls ? ' class="' + cls + '"' : '') + '>' + items.map(function(text){ return '<li>' + escapeHtml(text) + '</li>'; }).join('') + '</ul></div>';
  }

  function renderStrategyFrame(frame){
    return '<section id="strategy-frame" class="report-section frame-section"><p class="section-label">전략 프레임</p><h2>전략 판단 체크프레임</h2>' +
      (hasValue(frame.stance) ? '<p class="frame-stance">' + escapeHtml(frame.stance) + '</p>' : '') +
      '<div class="split-grid">' + renderListColumn('가능한 경로', frame.scenarioLens) + renderListColumn('주의할 리스크', frame.riskChecklist, 'muted-list') + '</div>' +
      (hasValue(frame.actionQuestions) ? '<div class="question-box"><h3>내 포트폴리오 질문</h3><ul>' + frame.actionQuestions.map(function(text){ return '<li>' + escapeHtml(text) + '</li>'; }).join('') + '</ul></div>' : '') + '</section>';
  }

  function renderReportSection(section, index){
    if (!hasValue(section)) return '';
    var bullets = Array.isArray(section.bullets) ? section.bullets : [];
    return '<section id="sec-' + index + '" class="report-section"><h2><span>' + index + '</span>' + escapeHtml(section.title || '') + '</h2>' +
      (hasValue(bullets) ? '<ul>' + bullets.map(function(item){ return '<li>' + escapeHtml(typeof item === 'string' ? item : item.text || '') + renderSourceNote(item && item.source) + '</li>'; }).join('') + '</ul>' : '') + '</section>';
  }

  function renderSourceNote(source){
    if (!source || !hasValue(source.timestamp)) return '';
    return ' <em class="source-note">[' + escapeHtml(source.timestamp) + (source.chapter ? ' · ' + escapeHtml(source.chapter) : '') + ']</em>';
  }

  function renderBottomRatePanel(videoId){
    return '<section class="bottom-rate"><div id="rate-bottom" class="rate-panel bottom-rate-panel" data-video-id="' + escapeAttr(videoId) + '"><div><strong>별점으로 의견을 남겨주세요.</strong><div class="meta-mono">선택한 평가는 리포트 랭킹에 반영됩니다.</div></div><div class="stars bottom-stars" data-stars><span data-star="1">★</span><span data-star="2">★</span><span data-star="3">★</span><span data-star="4">★</span><span data-star="5">★</span></div></div></section>';
  }

  function renderDetailAside(channel, video, summary){
    var tocHtml = summary ? renderToc(summary, 'side-toc') : '';
    return '<aside class="side-video"><div class="video-box" data-video data-vid="' + escapeAttr(video.videoId) + '"' + thumbnailStyle(video) + '><button class="play-button" type="button" data-play aria-label="재생"></button>' + (hasValue(displayDuration(video)) ? '<span class="duration">' + escapeHtml(displayDuration(video)) + '</span>' : '') + '</div>' +
      '<div class="side-channel"><span class="side-avatar">' + escapeHtml(channel.avatarLabel || '겸손') + '</span><span><strong>' + escapeHtml(channel.name || video.channelTitle || '') + '</strong><br><em class="meta-mono" style="color:#8a8276;">' + escapeHtml(formatKstMinute(video.publishedAt)) + ' · 발행</em></span></div>' + tocHtml + '</aside>';
  }

  function restoreRating(videoId){
    var state = readUserState();
    var rating = Number(state.reportRatingsByVideoId[videoId] || 0);
    if (!rating) return;
    document.querySelectorAll('[data-rate-score]').forEach(function(el){
      el.textContent = '★ ' + rating;
      el.hidden = false;
    });
    document.querySelectorAll('[data-stars]').forEach(function(grp){
      grp.querySelectorAll('[data-star]').forEach(function(star){
        star.style.color = (+star.getAttribute('data-star') <= rating) ? '#E3120B' : '#d9d3c8';
      });
    });
  }

  function restoreBookmark(videoId){
    var state = readUserState();
    var saved = state.savedVideoIds.indexOf(videoId) >= 0;
    document.querySelectorAll('[data-bookmark="' + CSS.escape(videoId) + '"]').forEach(function(button){
      var off = button.querySelector('[data-state="off"]');
      var on = button.querySelector('[data-state="on"]');
      if (off && on){
        button.classList.toggle('is-saved', saved);
        off.style.display = saved ? 'none' : '';
        on.style.display = saved ? '' : 'none';
      }
    });
  }

  function restoreLike(videoId){
    var state = readUserState();
    var liked = state.likedVideoIds.indexOf(videoId) >= 0;
    document.querySelectorAll('[data-like="' + CSS.escape(videoId) + '"]').forEach(function(button){
      var base = Number(button.getAttribute('data-like-base') || 0);
      var heart = button.querySelector('[data-like-heart]');
      var count = button.querySelector('[data-like-count]');
      button.classList.toggle('is-liked', liked);
      if (heart) heart.textContent = liked ? '♥' : '♡';
      if (count) count.textContent = formatCount(base + (liked ? 1 : 0));
    });
  }

  function renderMy(app){
    var main = document.querySelector('main');
    if (!main) return;
    var bundle = app.bundles[app.defaultChannel.id];
    var state = readUserState();
    var subscribed = (app.channellist.channels || []).filter(function(channel){ return state.subscribedChannelIds.indexOf(channel.id) >= 0; });
    var saved = state.savedVideoIds.map(function(videoId){ return findVideo(bundle, videoId); }).filter(Boolean);
    setSiteDate(bundle.videos[0] && bundle.videos[0].publishedAt);
    main.innerHTML = '<section class="profile-head"><div class="profile-avatar">hy</div><div class="profile-name"><strong>hyveo</strong><p><span class="desktop-label">app.hyveo@gmail.com · </span>가입 2025·09</p></div><div class="profile-stats"><span><strong>' + saved.length + '</strong><em><span class="desktop-label">SAVED</span><span class="mobile-label">보관함</span></em></span><span><strong>' + subscribed.length + '</strong><em><span class="desktop-label">CHANNELS</span><span class="mobile-label">구독</span></em></span></div><a class="ghost-pill profile-edit" href="my.html"><span class="desktop-label">프로필 편집</span><span class="mobile-label">편집</span></a></section>' +
      '<section class="my-grid"><div>' + renderSubscribedChannels(subscribed) + renderSavedList(saved, bundle) + '</div>' + renderServiceBox() + '</section>';
  }

  function renderSubscribedChannels(channels){
    return '<h2 class="section-title my-section-label">구독한 채널 <span>' + channels.length + '</span></h2>' +
      (channels.length ? '<div class="profile-channel-row">' + channels.map(function(channel, index){
        return '<a class="profile-channel" href="' + escapeAttr(channelDetailHref(channel.id)) + '"><span class="profile-channel-avatar' + toneClass(index) + '">' + escapeHtml(channel.avatarLabel || channel.title || '') + '</span><span>' + escapeHtml(channel.name || channel.title || '') + '</span></a>';
      }).join('') + '</div>' : '<p class="meta-mono">구독한 채널이 없습니다.</p>');
  }

  function renderSavedList(videos, bundle){
    return '<h2 class="section-title">보관함 <span class="section-count">' + videos.length + '</span></h2><div>' +
      (videos.length ? videos.map(function(video, index){
        return '<a class="saved-item" href="' + escapeAttr(videoDetailHref(video.videoId)) + '"><span class="saved-cover' + toneClass(index) + '"' + thumbnailStyle(video) + '></span><span><strong class="saved-title">' + escapeHtml(cleanTitle(video.title)) + '</strong><em class="saved-meta">' + escapeHtml(bundle.channel.name || '') + ' · ' + escapeHtml(formatDateShort(video.publishedAt)) + '</em></span><span class="saved-bookmark" aria-hidden="true"></span></a>';
      }).join('') : '<p class="meta-mono">보관한 리포트가 없습니다.</p>') +
      '</div>' + (videos.length > 4 ? '<div class="center-action"><a class="ghost-pill" href="my.html">더보기</a></div>' : '');
  }

  function renderServiceBox(){
    return '<aside class="service-box"><div class="service-row"><strong>서비스 소개<span>원본 방송 기반 AI 분석 리포트</span></strong></div><div class="service-row"><strong>운영 정책<span>원본 링크 · 짧은 출처 표기 · 자막 비공개</span></strong></div><div class="service-row"><strong>문의 · 제휴<span><a href="mailto:app.hyveo@gmail.com">이메일 보내기</a></span></strong></div><div class="service-row"><strong>버전<span>v1.0.0 · 2026.06</span></strong></div></aside>';
  }

  function applyHomeCategoryFilter(category){
    var channelList = document.querySelector('[data-channel-list]');
    if (!channelList) return;
    loadAppData().then(function(app){
      var bundle = app.bundles[app.defaultChannel.id];
      var next = document.createElement('div');
      next.innerHTML = renderFeaturedChannels(app, bundle, category);
      var nextSection = next.firstElementChild;
      if (nextSection) channelList.replaceWith(nextSection);
      document.querySelectorAll('[data-category-filter]').forEach(function(link){
        link.classList.toggle('is-active', (link.getAttribute('data-category-filter') || '') === category);
      });
    }).catch(function(err){
      console.error(err);
      showToast('채널 목록을 필터링하지 못했습니다.');
    });
  }

  function getCurrentRankingCategory(){
    var section = document.querySelector('[data-ranking-section]');
    return section ? (section.getAttribute('data-ranking-category') || '') : '';
  }

  function getCurrentRankingPeriod(){
    var section = document.querySelector('[data-ranking-section]');
    return section ? (section.getAttribute('data-ranking-period') || 'daily') : 'daily';
  }

  function updateRankingSection(options){
    var section = document.querySelector('[data-ranking-section]');
    if (!section) return;
    loadAppData().then(function(app){
      var bundle = app.bundles[app.defaultChannel.id];
      var next = document.createElement('div');
      next.innerHTML = renderRankings(app, bundle, options);
      var nextSection = next.firstElementChild;
      if (nextSection) section.replaceWith(nextSection);
    }).catch(function(err){
      console.error(err);
      showToast('랭킹을 필터링하지 못했습니다.');
    });
  }

  function initDataBinding(){
    var page = getPageName();
    if (page === 'channel.html' && getSearchParam('channelId')){
      window.location.replace(channelDetailHref(getSearchParam('channelId')));
      return;
    }
    setSiteDate();
    if (['index.html', 'channel.html', 'channel-detail.html', 'detail.html', 'episodes.html', 'my.html', 'info.html'].indexOf(page) < 0) return;
    if (page === 'info.html') return;
    loadAppData().then(function(app){
      if (page === 'index.html') renderHome(app);
      if (page === 'channel.html') renderChannelListPage(app);
      if (page === 'channel-detail.html') renderChannel(app);
      if (page === 'detail.html' || page === 'episodes.html') renderDetail(app);
      if (page === 'my.html') renderMy(app);
    }).catch(function(err){
      console.error(err);
      showToast('데이터를 불러오지 못했습니다.');
    });
  }

  document.addEventListener('click', function(e){
    var mobileSearch = e.target.closest('[data-mobile-search]');
    if (mobileSearch){
      var rootForSearch = document.querySelector('[data-tabs]');
      if (rootForSearch){
        var epTab = rootForSearch.querySelector('[data-tab="ep"]');
        if (epTab) epTab.click();
      }
      var searchWrap = mobileSearch.closest('[data-mobile-search-wrap]');
      var searchInput = searchWrap && searchWrap.querySelector('[data-mobile-title-search]');
      if (searchWrap) searchWrap.classList.add('is-open');
      if (searchInput) searchInput.focus();
      return;
    }
    var categoryFilter = e.target.closest('[data-category-filter]');
    if (categoryFilter){
      e.preventDefault();
      applyHomeCategoryFilter(categoryFilter.getAttribute('data-category-filter') || '');
      return;
    }
    var rankingPeriod = e.target.closest('button[data-ranking-period]');
    if (rankingPeriod){
      e.preventDefault();
      updateRankingSection({
        category: getCurrentRankingCategory(),
        period: rankingPeriod.getAttribute('data-ranking-period') || 'daily'
      });
      return;
    }
    var rankingCategory = e.target.closest('button[data-ranking-category]');
    if (rankingCategory){
      e.preventDefault();
      updateRankingSection({
        category: rankingCategory.getAttribute('data-ranking-category') || '',
        period: getCurrentRankingPeriod()
      });
      return;
    }
    var channelPageFilter = e.target.closest('[data-channel-page-filter]');
    if (channelPageFilter){
      e.preventDefault();
      var filter = channelPageFilter.getAttribute('data-channel-page-filter') || '';
      loadAppData().then(function(app){
        if (history.pushState) history.pushState(null, '', 'channel.html' + (filter ? '?category=' + encodeURIComponent(filter) : ''));
        renderChannelListPage(app);
      });
      return;
    }
    var sortButton = e.target.closest('[data-episode-sort]');
    if (sortButton){
      toggleEpisodeSort(sortButton);
      return;
    }
    var tocLink = e.target.closest('.toc-box a[href^="#"]');
    if (tocLink){
      var target = document.querySelector(tocLink.getAttribute('href'));
      if (target){
        e.preventDefault();
        document.querySelectorAll('.toc-box a[href^="#"]').forEach(function(link){
          link.classList.toggle('is-active', link.getAttribute('href') === tocLink.getAttribute('href'));
        });
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (history.pushState) history.pushState(null, '', tocLink.getAttribute('href'));
      }
      return;
    }
    var subscribe = e.target.closest('[data-subscribe]');
    if (subscribe){
      var channelId = subscribe.getAttribute('data-subscribe');
      var state = readUserState();
      state.subscribedChannelIds = toggleArrayValue(state.subscribedChannelIds, channelId);
      writeUserState(state);
      var on = state.subscribedChannelIds.indexOf(channelId) >= 0;
      subscribe.querySelector('[data-state="off"]').style.display = on ? 'none' : '';
      subscribe.querySelector('[data-state="on"]').style.display = on ? '' : 'none';
      showToast(on ? '구독에 추가되었습니다.' : '구독이 해제되었습니다.');
      return;
    }
    var bookmark = e.target.closest('[data-bookmark]');
    if (bookmark){
      var videoId = bookmark.getAttribute('data-bookmark');
      var bmState = readUserState();
      bmState.savedVideoIds = toggleArrayValue(bmState.savedVideoIds, videoId);
      writeUserState(bmState);
      restoreBookmark(videoId);
      showToast(bmState.savedVideoIds.indexOf(videoId) >= 0 ? '보관함에 추가되었습니다.' : '보관함에서 삭제되었습니다.');
      return;
    }
    var like = e.target.closest('[data-like]');
    if (like){
      var likeVideoId = like.getAttribute('data-like');
      var likeState = readUserState();
      likeState.likedVideoIds = toggleArrayValue(likeState.likedVideoIds, likeVideoId);
      writeUserState(likeState);
      restoreLike(likeVideoId);
      return;
    }
    var share = e.target.closest('[data-share]');
    if (share){
      var shareData = {
        title: document.title,
        text: document.querySelector('.detail-title') ? document.querySelector('.detail-title').textContent.trim() : document.title,
        url: window.location.href
      };
      if (navigator.share){
        navigator.share(shareData).catch(function(err){
          if (!err || err.name !== 'AbortError') showToast('공유를 완료하지 못했습니다.');
        });
      } else {
        copyText(shareData.url).then(function(ok){
          showToast(ok ? '주소가 복사되었습니다.' : '주소를 복사하지 못했습니다.');
        });
      }
      return;
    }
    var tab = e.target.closest('[data-tab]');
    if (tab){
      var root = tab.closest('[data-tabs]');
      if (root){
        var name = tab.getAttribute('data-tab');
        root.querySelectorAll('[data-tab]').forEach(function(t){ t.classList.toggle('on', t===tab); });
        root.querySelectorAll('[data-panel]').forEach(function(p){
          var active = p.getAttribute('data-panel') === name;
          p.style.display = active ? '' : 'none';
          if (active) p.scrollTop = 0;
        });
      }
      return;
    }
    var more = e.target.closest('[data-more]');
    if (more){
      var wrap = more.closest('[data-eplist]');
      if (wrap){
        var hidden = [].slice.call(wrap.querySelectorAll('[data-ep-item]')).filter(function(x){ return x.style.display==='none'; });
        hidden.slice(0,5).forEach(function(x){ x.style.display=''; });
        var left = hidden.length - Math.min(5, hidden.length);
        if (left<=0){ more.style.display='none'; }
        else { var c = more.querySelector('[data-more-count]'); if (c) c.textContent = '+'+left; }
      }
      return;
    }
    var rb = e.target.closest('[data-rate-btn]');
    if (rb){
      var panel = document.querySelector(rb.getAttribute('data-rate-target'));
      if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    var star = e.target.closest('[data-star]');
    if (star){
      var n = +star.getAttribute('data-star');
      var panel = star.closest('[data-video-id]');
      var videoIdForRating = panel && panel.getAttribute('data-video-id') || getVideoId();
      var state = readUserState();
      if (videoIdForRating){
        state.reportRatingsByVideoId[videoIdForRating] = n;
        writeUserState(state);
      }
      restoreRating(videoIdForRating);
      showToast('평가가 반영되었습니다.');
      return;
    }
    var pl = e.target.closest('[data-play]');
    if (pl){
      var v = pl.closest('[data-video]');
      if (v){
        var id = v.getAttribute('data-vid') || '';
        v.innerHTML = '<iframe class="video-iframe" width="100%" height="100%" src="https://www.youtube.com/embed/'+encodeURIComponent(id)+'?autoplay=1&rel=0" title="YouTube" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="display:block;width:100%;height:100%;border:0;"></iframe>';
        v.style.cursor='default';
      }
      return;
    }
  });

  document.addEventListener('input', function(e){
    var titleSearch = e.target.closest('[data-mobile-title-search]');
    if (titleSearch){
      var syncedInput = document.querySelector('[data-episode-search]');
      if (syncedInput) syncedInput.value = titleSearch.value;
      filterEpisodes(syncedInput || titleSearch);
      return;
    }
    var searchInput = e.target.closest('[data-episode-search]');
    if (!searchInput) return;
    filterEpisodes(searchInput);
  });

  function filterEpisodes(input){
    if (!input) return;
    var section = input.closest('[data-eplist]') || document.querySelector('[data-eplist]');
    if (!section) return;
    var keyword = input.value.trim().toLowerCase();
    var items = [].slice.call(section.querySelectorAll('[data-ep-item]'));
    var matchedCount = 0;
    items.forEach(function(item){
      var matched = !keyword || item.textContent.toLowerCase().indexOf(keyword) >= 0;
      item.style.display = matched ? '' : 'none';
      if (matched) matchedCount += 1;
    });
    var more = section.querySelector('[data-more]');
    if (more) more.style.display = keyword ? 'none' : '';
    var empty = section.querySelector('[data-search-empty]');
    if (!empty){
      empty = document.createElement('p');
      empty.className = 'search-empty';
      empty.setAttribute('data-search-empty', '');
      empty.textContent = '검색 결과가 없습니다.';
      section.appendChild(empty);
    }
    empty.hidden = !keyword || matchedCount > 0;
  }

  function toggleEpisodeSort(button){
    var section = button.closest('[data-eplist]');
    if (!section) return;
    var nextOrder = section.getAttribute('data-sort-order') === 'oldest' ? 'latest' : 'oldest';
    section.setAttribute('data-sort-order', nextOrder);
    var more = section.querySelector('[data-more]');
    var items = [].slice.call(section.querySelectorAll('[data-ep-item]'));
    items.sort(function(a, b){
      var av = new Date(a.getAttribute('data-published') || 0).getTime();
      var bv = new Date(b.getAttribute('data-published') || 0).getTime();
      return nextOrder === 'oldest' ? av - bv : bv - av;
    });
    items.forEach(function(item, index){
      item.style.display = index < 5 ? '' : 'none';
      section.insertBefore(item, more || null);
    });
    section.querySelectorAll('[data-episode-sort]').forEach(function(sort){
      sort.textContent = nextOrder === 'oldest' ? '오래된순 ↑' : '최신순 ↓';
    });
    if (more){
      var left = Math.max(items.length - 5, 0);
      more.style.display = left > 0 ? '' : 'none';
      var count = more.querySelector('[data-more-count]');
      if (count) count.textContent = '+' + left;
    }
  }

  document.addEventListener('DOMContentLoaded', initDataBinding);
})();
