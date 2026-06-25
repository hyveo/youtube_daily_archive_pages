const INITIAL_VISIBLE_COUNT = 30;
const LOAD_MORE_COUNT = 10;
const DATA_BASE_PATH = "./12siemannayo";
const DISCORD_INVITE_URL = "https://discord.gg/Ajv9563Gf";

const COPY_ICON_SVG = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8 7a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3h-7a3 3 0 0 1-3-3V7Z" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <path d="M6 9H5a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h7a3 3 0 0 0 3-3v-1" fill="none" stroke="currentColor" stroke-width="1.8"/>
  </svg>
`.trim();

const state = {
  archive: [],
  grouped: {},
  modalJson: "",
  visibleCount: INITIAL_VISIBLE_COUNT,
  summaries: {},
  playlistIndex: null,
  searchQuery: ""
};

const app = document.querySelector("#app");
app.innerHTML = `
  <main class="app-shell">
    <section class="hero">
      <span class="badge">Static YouTube Playlist Archive</span>
      <h1>YouTube Daily Archive</h1>
      <p>놓친 영상도, 지난 날의 콘텐츠도 — 날짜별로 한눈에. 콘텐츠의 흐름을 한 곳에서 되돌아보세요.</p>
    </section>

    <p id="archiveMeta" class="archive-meta" hidden></p>

    <section class="card playlist-intro">
      <div class="archive-header">
        <div class="intro-layout">
          <div class="intro-sidebar">
            <a id="introThumbLink" class="intro-thumb" href="#" target="_blank" rel="noreferrer" hidden>
              <img id="introThumb" src="" alt="" loading="lazy" />
            </a>
            <p id="introMeta" class="intro-meta intro-sidebar-tags" hidden></p>
            <a id="introShortcutLink" class="intro-shortcut" href="#" target="_blank" rel="noreferrer" hidden>👉 플레이리스트 바로가기</a>
          </div>
          <div class="intro-content">
            <h2 id="archiveTitle">아카이브 로딩 중</h2>
            <p id="introHeadline" class="intro-headline" hidden></p>
            <div id="introBody" class="intro-body" hidden></div>
            <p id="introClosing" class="intro-closing" hidden></p>
          </div>
        </div>
        <!-- <a id="supportLink" class="secondary support-link" href="https://ctee.kr/place/hyveo" target="_blank" rel="noreferrer">🩷 응원하기</a> -->
      </div>
      <div id="status" class="status">playlist 데이터를 불러오는 중입니다.</div>
    </section>

    <div id="archiveSearch" class="archive-search-wrap" hidden>
      <div class="archive-search">
        <input id="archiveSearchInput" class="archive-search-input" type="text" placeholder="검색" autocomplete="off" />
        <button id="archiveSearchClearButton" type="button" class="ghost" hidden>초기화</button>
      </div>
    </div>

    <section id="archive" class="card" hidden>
      <div class="archive-header">
        <h2>일별 아카이브</h2>
        <span id="archiveCount" class="meta"></span>
      </div>
      <div id="archiveList"></div>
      <div id="loadMoreWrap" class="load-more-wrap" hidden>
        <button id="loadMoreButton" type="button" class="ghost load-more-button">더보기</button>
      </div>
    </section>
  </main>

  <div id="jsonModal" class="modal" hidden>
    <div class="modal-backdrop" data-close-modal></div>
    <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="jsonModalTitle">
      <div class="modal-header">
        <h3 id="jsonModalTitle">상세 JSON</h3>
        <div class="modal-actions">
          <button id="jsonCopyButton" class="icon-button" type="button" aria-label="JSON 복사">
            ${COPY_ICON_SVG}
          </button>
          <button class="icon-button modal-close" type="button" data-close-modal aria-label="닫기">×</button>
        </div>
      </div>
      <pre id="jsonModalContent"></pre>
    </div>
  </div>

  <div id="toast" class="toast" role="status" aria-live="polite" hidden></div>
`;

const elements = {
  status: document.querySelector("#status"),
  archiveMeta: document.querySelector("#archiveMeta"),
  // supportLink: document.querySelector('#supportLink'),
  archive: document.querySelector("#archive"),
  archiveSearch: document.querySelector("#archiveSearch"),
  archiveList: document.querySelector("#archiveList"),
  archiveCount: document.querySelector("#archiveCount"),
  archiveSearchInput: document.querySelector("#archiveSearchInput"),
  archiveSearchClearButton: document.querySelector("#archiveSearchClearButton"),
  loadMoreWrap: document.querySelector("#loadMoreWrap"),
  loadMoreButton: document.querySelector("#loadMoreButton"),
  archiveTitle: document.querySelector("#archiveTitle"),
  introThumbLink: document.querySelector("#introThumbLink"),
  introThumb: document.querySelector("#introThumb"),
  introShortcutLink: document.querySelector("#introShortcutLink"),
  introMeta: document.querySelector("#introMeta"),
  introHeadline: document.querySelector("#introHeadline"),
  introBody: document.querySelector("#introBody"),
  introClosing: document.querySelector("#introClosing"),
  jsonModal: document.querySelector("#jsonModal"),
  jsonModalTitle: document.querySelector("#jsonModalTitle"),
  jsonModalContent: document.querySelector("#jsonModalContent"),
  jsonCopyButton: document.querySelector("#jsonCopyButton"),
  toast: document.querySelector("#toast")
};

function formatDayLabel(day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return day;
  const date = new Date(`${day}T12:00:00`);
  if (Number.isNaN(date.getTime())) return day;
  const weekday = new Intl.DateTimeFormat("ko-KR", { weekday: "long" }).format(date);
  return `${day} ${weekday}`;
}

function groupByPublishedDate(videos) {
  return videos.reduce((groups, video) => {
    const day = (video.publishedAt || "").slice(0, 10) || "unknown";
    groups[day] = groups[day] || [];
    groups[day].push(video);
    return groups;
  }, {});
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function getDaysSinceFirstBroadcast(videos) {
  const firstDay = videos
    .map((video) => (video.publishedAt || "").slice(0, 10))
    .filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day))
    .sort()[0];
  if (!firstDay) return 0;

  const start = new Date(`${firstDay}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.max(1, Math.floor((today - start) / 86400000) + 1);
}

function formatArchiveSummary(total, filteredTotal, isSearching) {
  const daySpan = getDaysSinceFirstBroadcast(state.archive);
  const dayLabel = daySpan ? `${daySpan}일` : "0일";
  if (isSearching) {
    return `검색 ${filteredTotal}개 | 전체 ${total}개 영상 | ${dayLabel}`;
  }
  return `전체 ${total}개 영상 | ${dayLabel}`;
}

function getFilteredArchive() {
  const query = state.searchQuery.trim().toLowerCase();
  if (!query) return state.archive;
  return state.archive.filter((video) => matchesSearch(video, query));
}

function matchesSearch(video, query) {
  const haystack = [
    video.title,
    video.description,
    video.channelTitle,
    video.videoId,
    ...(video.hashtags || []),
    ...(video.chapters || []).map((chapter) => `${chapter.timestamp} ${chapter.title}`)
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function getVisibleVideos() {
  const source = getFilteredArchive();
  return source.slice(0, Math.min(state.visibleCount, source.length));
}

function updateSearchQuery() {
  const nextQuery = elements.archiveSearchInput.value.trim();
  if (nextQuery === state.searchQuery) return;
  state.searchQuery = nextQuery;
  state.visibleCount = INITIAL_VISIBLE_COUNT;
  renderArchive();
}

function clearSearch() {
  state.searchQuery = "";
  elements.archiveSearchInput.value = "";
  state.visibleCount = INITIAL_VISIBLE_COUNT;
  renderArchive();
}

function loadMoreVideos() {
  const filteredTotal = getFilteredArchive().length;
  state.visibleCount = Math.min(state.visibleCount + LOAD_MORE_COUNT, filteredTotal);
  renderArchive();
}

function renderArchive() {
  elements.archive.hidden = false;
  elements.archiveSearch.hidden = false;
  const filteredArchive = getFilteredArchive();
  const total = state.archive.length;
  const filteredTotal = filteredArchive.length;
  const displayedCount = Math.min(state.visibleCount, filteredTotal);
  const visibleVideos = filteredArchive.slice(0, displayedCount);
  const visibleGrouped = groupByPublishedDate(visibleVideos);

  if (state.searchQuery) {
    elements.archiveCount.textContent = formatArchiveSummary(total, filteredTotal, true);
    elements.archiveSearchClearButton.hidden = false;
  } else {
    elements.archiveCount.textContent = formatArchiveSummary(total, filteredTotal, false);
    elements.archiveSearchClearButton.hidden = true;
  }

  if (!visibleVideos.length) {
    elements.archiveList.innerHTML = `
      <p class="empty-note">${state.searchQuery ? "검색 결과가 없습니다." : "표시할 영상이 없습니다."}</p>
    `;
  } else {
    elements.archiveList.innerHTML = Object.entries(visibleGrouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(
        ([day, videos]) => `
      <article class="day">
        <div class="day-header">
          <h3>${escapeHtml(formatDayLabel(day))}${renderNewBadge(day)}${renderUpdateBadge(videos)}</h3>
          <!-- JSON 버튼 비활성화: <button type="button" class="ghost json-button" data-day="...">JSON</button> -->
        </div>
        <div class="video-list">
          ${videos.map(renderVideoCard).join("")}
        </div>
      </article>
    `
      )
      .join("");
    prefetchSummariesForVisibleVideos(visibleVideos);
  }

  const remaining = filteredTotal - displayedCount;
  if (remaining > 0) {
    const nextCount = Math.min(LOAD_MORE_COUNT, remaining);
    elements.loadMoreButton.textContent = `더보기 (${nextCount}개)`;
    elements.loadMoreWrap.hidden = false;
  } else {
    elements.loadMoreButton.textContent = "더보기";
    elements.loadMoreWrap.hidden = true;
  }
}

function applySummaryToCard(videoId, summary) {
  const card = elements.archiveList.querySelector(`.video-card[data-video-id="${videoId}"]`);
  if (!card || !summary) return;

  const headline = card.querySelector(".summary strong");
  if (headline && hasReportContent(summary)) {
    headline.textContent = getSummaryHeadline(summary);
    card.querySelector(".summary p")?.remove();
  }
}

function summaryFilename(video) {
  const day = publishedDayKey(video?.publishedAt);
  return day ? `${day}_${video.videoId}.json` : `${video?.videoId || ""}.json`;
}

async function fetchSummaryByName(filename) {
  const response = await fetch(`${DATA_BASE_PATH}/summaries/${encodeURIComponent(filename)}`, { cache: "no-store" });
  if (!response.ok) return null;
  return response.json();
}

async function loadSummary(video) {
  const videoId = video?.videoId || "";
  if (!videoId) return null;
  if (state.summaries[videoId]) return state.summaries[videoId];
  try {
    const data = await fetchSummaryByName(summaryFilename(video)) || await fetchSummaryByName(`${videoId}.json`);
    if (!data) return null;
    state.summaries[videoId] = data;
    applySummaryToCard(videoId, data);
    return data;
  } catch {
    return null;
  }
}

function prefetchSummariesForVisibleVideos(videos) {
  videos.forEach((video) => {
    if (!video.videoId || state.summaries[video.videoId]) return;
    loadSummary(video);
  });
}

function renderEnrichmentBadges(video) {
  const transcript = video.hasTranscript === "Y" ? "Y" : "N";
  const summary = video.hasSummary === "Y" ? "Y" : "N";
  return `
    <span class="enrichment-badges">
      <span class="enrichment-badge ${transcript === "Y" ? "yes" : "no"}">자막 ${transcript}</span>
      <span class="enrichment-badge ${summary === "Y" ? "yes" : "no"}">요약 ${summary}</span>
    </span>
  `;
}

function renderLiveStatusBadge(video) {
  if (video.liveStatus === "live") {
    return '<span class="live-status-badge live">방송중</span>';
  }
  if (video.liveStatus === "upcoming") {
    return '<span class="live-status-badge upcoming">방송예정</span>';
  }
  return "";
}

function getSimpleSummary(video, summaryData) {
  if (hasReportContent(summaryData)) {
    return { headline: getSummaryHeadline(summaryData), body: "", hasReport: true };
  }
  if (video.hasSummary === "Y") {
    return { headline: "AI 리포트가 준비되었습니다.", body: "", hasReport: true };
  }
  if (video.hasSummary === "N" && !summaryData?.oneLine) {
    return { headline: "", body: video.hasTranscript === "N" ? "자막 수집 후 요약이 생성됩니다." : "요약 생성 대기 중입니다.", hasReport: false };
  }
  const summary = video.summary || {};
  const placeholder = "요약을 생성하려면 OPENAI_API_KEY와 transcript가 필요합니다.";
  if (summary.oneLine && summary.oneLine !== placeholder) {
    return { headline: summary.oneLine, body: summary.mainTopic || summary.detailedSummary || "", hasReport: true };
  }
  return { headline: "AI 요약 준비 중", body: "", hasReport: false };
}

function hasReportContent(summary) {
  return Boolean(
    summary
    && (
      summary.oneLine
      || summary.headline
      || summary.mainTopic
      || summary.detailedSummary
      || summary.keyBullets?.length
      || summary.sections?.length
      || summary.chapters?.length
    )
  );
}

function getSummaryHeadline(summary) {
  return summary?.oneLine || summary?.headline || "AI 리포트가 준비되었습니다.";
}

function renderVideoCard(video) {
  const summaryData = state.summaries[video.videoId];
  const { headline, body, hasReport } = getSimpleSummary(video, summaryData);
  const detailUrl = `./detail.html?videoId=${encodeURIComponent(video.videoId || "")}`;
  const scriptUrl = `${detailUrl}&view=script`;
  const summaryHtml = headline || body
    ? `
          <div class="summary">
            ${headline ? `<strong>${escapeHtml(headline)}</strong>` : ""}
            ${body ? `<p>${escapeHtml(body)}</p>` : ""}
          </div>
    `
    : "";
  const reportButtonHtml = hasReport
    ? `
          <div class="video-actions">
            <a class="detail-link" href="${escapeHtml(detailUrl)}">AI리포트</a>
          </div>
    `
    : `
          <div class="video-actions">
            <a class="script-link" href="${escapeHtml(scriptUrl)}">스크립트 보기</a>
            <a class="notify-link" href="${DISCORD_INVITE_URL}" target="_blank" rel="noreferrer">디스코드 알림 받기</a>
          </div>
    `;
  return `
    <article class="video-card" data-video-id="${escapeHtml(video.videoId)}">
      <div class="video-card-top">
        <div class="video-media">
          <div class="video-thumb">
            <img src="${escapeHtml(video.thumbnail)}" alt="" loading="lazy" />
          </div>
          <div class="youtube-actions">
            <a class="youtube-link" href="${escapeHtml(video.url)}" target="_blank" rel="noreferrer">유튜브 보러가기</a>
            <button class="youtube-copy-button" type="button" data-youtube-url="${escapeHtml(video.url)}" aria-label="유튜브 URL 복사">
              ${COPY_ICON_SVG}
            </button>
          </div>
        </div>
        <div class="video-summary">
          <h4>${escapeHtml(video.title)}${renderLiveStatusBadge(video)}</h4>
          <div class="meta">
            채널 ${escapeHtml(video.channelTitle)} | 재생시간 ${escapeHtml(video.duration)} | #${escapeHtml(video.videoId)}
            ${renderEnrichmentBadges(video)}
          </div>
          ${summaryHtml}
          ${reportButtonHtml}
        </div>
      </div>
    </article>
  `;
}

function openJsonModal(day) {
  const videos = state.grouped[day] || [];
  state.modalJson = JSON.stringify({ date: day, videos }, null, 2);
  elements.jsonModalTitle.textContent = `${day} JSON`;
  elements.jsonModalContent.textContent = state.modalJson;
  elements.jsonModal.hidden = false;
  document.body.classList.add("modal-open");
  elements.jsonCopyButton.dataset.copied = "false";
  elements.jsonCopyButton.setAttribute("aria-label", "JSON 복사");
}

function closeJsonModal() {
  elements.jsonModal.hidden = true;
  document.body.classList.remove("modal-open");
}

async function copyModalJson() {
  try {
    await navigator.clipboard.writeText(state.modalJson);
    markButtonCopied(elements.jsonCopyButton, "JSON 복사");
  } catch (error) {
    setStatus(`JSON 복사 실패: ${error.message}`, true);
  }
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } finally {
      textarea.remove();
    }
    return copied;
  }
}

async function copyYoutubeUrl(button) {
  const url = button.dataset.youtubeUrl || "";
  if (!url) return;
  try {
    const copied = await copyText(url);
    if (!copied) throw new Error("브라우저가 클립보드 복사를 허용하지 않았습니다.");
    markButtonCopied(button, "유튜브 URL 복사");
    showToast("주소가 복사되었습니다.");
  } catch (error) {
    setStatus(`유튜브 URL 복사 실패: ${error.message}`, true);
  }
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 1800);
}

function markButtonCopied(button, defaultLabel) {
  button.dataset.copied = "true";
  button.setAttribute("aria-label", "복사됨");
  window.setTimeout(() => {
    if (button.dataset.copied === "true") {
      button.dataset.copied = "false";
      button.setAttribute("aria-label", defaultLabel);
    }
  }, 1500);
}

function setStatus(message, isError = false) {
  elements.status.hidden = false;
  elements.status.textContent = message;
  elements.status.classList.toggle("error", isError);
  elements.archiveMeta.hidden = true;
}

function setArchiveInfo(index) {
  const sync = index.sync || {};
  const generatedAt = index.generatedAt || "unknown";
  const added = sync.addedCount ?? 0;
  const skipped = sync.skippedCount ?? 0;
  const total = sync.totalCount ?? state.archive.length ?? 0;

  elements.archiveMeta.textContent = `생성시각 : ${generatedAt} ( ${added} / ${skipped} / ${total} )`;
  elements.archiveMeta.hidden = false;
  elements.status.hidden = true;
}

function getYoutubeVideoId(value) {
  const input = String(value || "").trim();
  if (!input) return "";
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;
  try {
    const url = new URL(input);
    if (url.hostname.includes("youtu.be")) return url.pathname.replace(/^\//, "").split("/")[0];
    return url.searchParams.get("v") || "";
  } catch {
    return "";
  }
}

function getYoutubeThumbnail(videoId) {
  return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}

function renderIntro(intro, fallbackTitle, playlistId) {
  elements.archiveTitle.textContent = intro?.title || fallbackTitle || "YouTube Daily Archive";

  const thumbnailVideoId = getYoutubeVideoId(intro?.thumbnailVideoUrl || intro?.thumbnailVideoId);
  if (thumbnailVideoId) {
    const watchUrl = `https://www.youtube.com/watch?v=${thumbnailVideoId}`;
    elements.introThumb.src = getYoutubeThumbnail(thumbnailVideoId);
    elements.introThumb.alt = intro?.title || fallbackTitle || "소개 영상";
    elements.introThumbLink.href = watchUrl;
    elements.introThumbLink.hidden = false;
  } else {
    elements.introThumbLink.hidden = true;
  }

  const shortcutUrl = intro?.playlistShortcutUrl || intro?.playlistUrl || "";
  if (shortcutUrl) {
    elements.introShortcutLink.href = shortcutUrl;
    elements.introShortcutLink.textContent = intro?.playlistShortcutLabel || "👉 플레이리스트 바로가기";
    elements.introShortcutLink.hidden = false;
  } else {
    elements.introShortcutLink.hidden = true;
  }

  if (intro?.closing) {
    elements.introClosing.innerHTML = escapeHtml(intro.closing).replace(/\n/g, "<br />");
    elements.introClosing.hidden = false;
  } else {
    elements.introClosing.hidden = true;
  }

  const metaParts = [intro?.dateLabel, ...(intro?.hashtags || [])].filter(Boolean);
  if (metaParts.length) {
    elements.introMeta.textContent = metaParts.join("  ");
    elements.introMeta.hidden = false;
  } else {
    elements.introMeta.hidden = true;
  }

  /*
  if (intro?.supportUrl) {
    elements.supportLink.href = intro.supportUrl;
    elements.supportLink.textContent = intro.supportLabel || '🩷 응원하기';
  }
  */

  if (intro?.headline) {
    elements.introHeadline.textContent = intro.headline;
    elements.introHeadline.hidden = false;
  } else {
    elements.introHeadline.hidden = true;
  }

  const body = intro?.body || [];
  if (body.length) {
    elements.introBody.innerHTML = body.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
    elements.introBody.hidden = false;
  } else {
    elements.introBody.innerHTML = "";
    elements.introBody.hidden = true;
  }
}

async function loadIntro() {
  try {
    const response = await fetch(`${DATA_BASE_PATH}/intro.json`, { cache: "no-store" });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function publishedDayKey(publishedAt) {
  const day = (publishedAt || "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return `${day.slice(0, 4)}${day.slice(5, 7)}${day.slice(8, 10)}`;
  }
  return "";
}

function todayDayKeyKST() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

function renderNewBadge(day) {
  if (day !== todayDayKeyKST()) return "";
  return '<span class="new-badge">NEW</span>';
}

function isDaySummaryComplete(videos) {
  if (!videos?.length) return false;
  return videos.every((video) => video.hasSummary === "Y");
}

function getLatestSummaryUpdatedAt(videos) {
  return (
    videos
      .map((video) => video.summaryUpdatedAt)
      .filter(Boolean)
      .sort()
      .pop() || ""
  );
}

function isSummaryUpdateFresh(updatedAt) {
  if (!updatedAt) return false;
  const updated = new Date(updatedAt);
  if (Number.isNaN(updated.getTime())) return false;
  const elapsedMs = Date.now() - updated.getTime();
  return elapsedMs >= 0 && elapsedMs < 24 * 60 * 60 * 1000;
}

function shouldShowUpdateBadge(videos) {
  if (!isDaySummaryComplete(videos)) return false;
  return isSummaryUpdateFresh(getLatestSummaryUpdatedAt(videos));
}

function renderUpdateBadge(videos) {
  if (!shouldShowUpdateBadge(videos)) return "";
  return '<span class="update-badge">UPDATE</span>';
}

async function loadPlaylist() {
  const indexResponse = await fetch(`${DATA_BASE_PATH}/playlist/index.json`, { cache: "no-store" });
  if (!indexResponse.ok) throw new Error("playlist/index.json 로드 실패");
  const index = await indexResponse.json();
  const monthPayloads = await Promise.all(
    (index.months || []).map(async (month) => {
      const response = await fetch(`${DATA_BASE_PATH}/playlist/${month}.json`, { cache: "no-store" });
      if (!response.ok) throw new Error(`playlist/${month}.json 로드 실패`);
      return response.json();
    })
  );
  const videos = monthPayloads.flatMap((payload) => payload.videos || []);
  return { index, videos };
}

async function loadArchive() {
  try {
    const [playlist, intro] = await Promise.all([loadPlaylist(), loadIntro()]);
    const { index, videos } = playlist;
    state.playlistIndex = index;
    state.archive = videos.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
    state.grouped = groupByPublishedDate(state.archive);
    state.visibleCount = INITIAL_VISIBLE_COUNT;

    renderIntro(intro, index.playlistTitle, index.playlistId);
    renderArchive();
    if (state.archive.length) {
      setArchiveInfo(index);
    } else {
      setStatus("아직 생성된 영상 데이터가 없습니다. GitHub Actions 환경변수에 PLAYLIST_URL 또는 PLAYLIST_ID를 설정하세요.");
    }
  } catch (error) {
    setStatus(error.message, true);
  }
}

elements.loadMoreButton.addEventListener("click", loadMoreVideos);
elements.archiveSearchInput.addEventListener("input", updateSearchQuery);
elements.archiveSearchClearButton.addEventListener("click", clearSearch);
elements.archiveList.addEventListener("click", (event) => {
  const copyButton = event.target.closest(".youtube-copy-button");
  if (!copyButton) return;
  event.preventDefault();
  copyYoutubeUrl(copyButton);
});
elements.jsonCopyButton.addEventListener("click", copyModalJson);
elements.jsonModal.addEventListener("click", (event) => {
  if (event.target.closest("[data-close-modal]")) closeJsonModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.jsonModal.hidden) closeJsonModal();
});
loadArchive();
