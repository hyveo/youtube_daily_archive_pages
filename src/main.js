const INITIAL_VISIBLE_COUNT = 5;
const LOAD_MORE_COUNT = 5;
const DATA_BASE_PATH = "./data/12siemannayo";
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
  searchQuery: "",
  introTab: "episodes",
  screen: window.location.hash === "#channel" ? "channel" : window.location.hash === "#my" ? "my" : "home",
  subscribed: false
};

const app = document.querySelector("#app");
app.innerHTML = `
  <main class="app-shell">
    <header class="app-header masthead">
      <div class="masthead-title">
        <span class="masthead-rule" aria-hidden="true"></span>
        <div>
          <h1>Daily AI Insight</h1>
          <p>원본 방송을 바탕으로 만든 AI 분석 리포트를 날짜별로 확인하세요.</p>
        </div>
      </div>
      <nav class="site-nav" aria-label="주요 메뉴">
        <a class="site-nav-link" href="#home" data-screen-link="home">홈</a>
        <a class="site-nav-link" href="#channel" data-screen-link="channel">채널</a>
        <a class="site-nav-link" href="#my" data-screen-link="my">마이</a>
      </nav>
      <span id="archiveMeta" class="archive-meta" hidden></span>
    </header>

    <section id="home" class="home-screen" hidden>
      <div class="mobile-home-bar">
        <span>홈</span>
        <span id="homeTodayLabel" class="home-date">-</span>
      </div>

      <article id="homeHero" class="home-hero" hidden></article>

      <div class="home-shortcuts" aria-label="빠른 메뉴">
        <button type="button" class="home-shortcut" data-home-jump="ranking">
          <span class="home-shortcut-icon">▦</span>
          <span>전체</span>
        </button>
        <button type="button" class="home-shortcut" data-screen-link="channel">
          <span class="home-shortcut-icon">겸손</span>
          <span>시사·경제</span>
        </button>
        <button type="button" class="home-shortcut" data-home-jump="ranking">
          <span class="home-shortcut-icon">마켓</span>
          <span>경제·증시</span>
        </button>
        <button type="button" class="home-shortcut" data-home-jump="ranking">
          <span class="home-shortcut-icon">과학</span>
          <span>과학·기술</span>
        </button>
        <button type="button" class="home-shortcut" data-home-jump="ranking">
          <span class="home-shortcut-icon">컬처</span>
          <span>문화</span>
        </button>
        <button type="button" class="home-shortcut" data-home-jump="ranking">
          <span class="home-shortcut-icon">NEW</span>
          <span>새 리포트</span>
        </button>
        <button type="button" class="home-shortcut" data-home-jump="ranking">
          <span class="home-shortcut-icon">★</span>
          <span>인기</span>
        </button>
        <button type="button" class="home-shortcut" data-home-jump="ranking">
          <span class="home-shortcut-icon">▣</span>
          <span>카테고리</span>
        </button>
      </div>

      <section class="home-section home-featured">
        <div class="home-section-head">
          <div>
            <h2>주목한 채널</h2>
            <p>매일 업데이트되는 채널 아카이브</p>
          </div>
          <button type="button" class="home-more" data-screen-link="channel" aria-label="채널 보기">›</button>
        </div>
        <div id="featuredChannel" class="featured-channel"></div>
      </section>

      <section id="homeRanking" class="home-section home-ranking">
        <div class="home-section-head">
          <div class="home-section-title-row">
            <h2>리포트 랭킹</h2>
            <span>인기</span>
          </div>
          <button type="button" class="home-more" data-home-jump="ranking" aria-label="리포트 랭킹 보기">›</button>
        </div>
        <div class="rank-tabs" aria-label="랭킹 카테고리">
          <span class="rank-tab is-active">종합</span>
          <span class="rank-tab">시사·경제</span>
          <span class="rank-tab">경제·증시</span>
          <span class="rank-tab">과학·기술</span>
          <span class="rank-tab">문화</span>
          <span class="rank-tab">인터뷰</span>
        </div>
        <div class="ranking-meta">
          <span>일간 ▾</span>
          <span id="homeRankingDate">-</span>
        </div>
        <div id="homeRankingList" class="ranking-list"></div>
        <div class="ranking-more-wrap">
          <button type="button" class="ranking-more" data-screen-link="channel">리포트 랭킹 더보기</button>
        </div>
      </section>
    </section>

    <section id="channel" class="card playlist-intro">
      <div class="mobile-library-bar" aria-hidden="true">
        <span>채널</span>
        <span class="mobile-search-icon"></span>
      </div>

      <div class="intro-card">
        <div id="introThumbLink" class="intro-cover" hidden>
          <img id="introThumb" src="" alt="" loading="lazy" />
        </div>
        <div class="intro-content">
          <p class="intro-kicker">THE CHANNEL</p>
          <h2 id="archiveTitle">아카이브 로딩 중</h2>
          <p id="introMeta" class="intro-meta" hidden></p>
          <p id="introHeadline" class="intro-headline" hidden></p>
          <div id="introBody" class="intro-body" hidden></div>
          <p id="introClosing" class="intro-closing" hidden></p>
          <div class="intro-actions">
            <button id="introSubscribeButton" class="intro-subscribe" type="button" data-subscribed="false">＋ 구독</button>
            <a id="introShortcutLink" class="intro-shortcut" href="#" target="_blank" rel="noreferrer" hidden>플레이리스트 가기</a>
            <a id="introChannelLink" class="intro-channel-link" href="https://www.youtube.com/@gyeomsonisnothing" target="_blank" rel="noreferrer">유튜브 채널 가기 ↗</a>
          </div>
          <p id="introStats" class="intro-stats"></p>
        </div>
      </div>

      <div class="intro-tabs" role="tablist" aria-label="리포트 보기">
        <button id="introEpisodesTab" type="button" class="intro-tab is-active" data-intro-tab="episodes" role="tab" aria-selected="true">에피소드</button>
        <button id="introInfoTab" type="button" class="intro-tab" data-intro-tab="info" role="tab" aria-selected="false">정보</button>
        <span class="sort-label">최신순 ↓</span>
      </div>

      <section id="introInfoPanel" class="intro-info-panel" hidden>
        <h2 id="introInfoTitle">12시에 만나요</h2>
        <p id="introInfoHeadline"></p>
        <div id="introInfoBody"></div>
        <div class="intro-info-actions">
          <button id="introInfoSubscribeButton" class="intro-info-subscribe" type="button" data-subscribed="false">＋ 구독</button>
          <a id="introInfoPlaylistLink" class="intro-info-primary" href="#" target="_blank" rel="noreferrer">플레이리스트 가기</a>
          <a id="introInfoChannelLink" class="intro-info-secondary" href="https://www.youtube.com/@gyeomsonisnothing" target="_blank" rel="noreferrer">유튜브 채널 가기 ↗</a>
        </div>
        <p id="introInfoClosing" class="intro-info-closing"></p>
        <p id="introInfoStats" class="intro-info-stats"></p>
      </section>

      <div id="status" class="status">playlist 데이터를 불러오는 중입니다.</div>
    </section>

    <section id="my" class="my-screen" hidden>
      <div class="mobile-home-bar">
        <span>마이</span>
        <span class="home-date">MY</span>
      </div>
      <section class="my-profile">
        <div class="my-avatar">hy</div>
        <div class="my-profile-copy">
          <h2>hyveo</h2>
          <p>hyveo@archive.kr · 가입 2025·09</p>
        </div>
        <div class="my-profile-stats" aria-label="마이 통계">
          <span><strong id="mySavedCount">0</strong><em>SAVED</em></span>
          <span><strong id="myChannelCount">0</strong><em>CHANNELS</em></span>
        </div>
        <button type="button" class="my-edit-button">프로필 편집</button>
      </section>
      <section class="my-grid">
        <article class="my-panel my-subscription-panel">
          <div class="my-panel-head">
            <h3>구독한 채널</h3>
            <span id="mySubscribedState">미구독</span>
          </div>
          <button type="button" class="my-channel-card" data-screen-link="channel">
            <span>겸손</span>
            <strong>겸손은힘들다 뉴스공장</strong>
            <em id="myArchiveStats">EP 0 · 0일</em>
          </button>
        </article>
        <article class="my-panel">
          <div class="my-panel-head">
            <h3>보관함</h3>
            <span>최근 리포트</span>
          </div>
          <div id="mySavedList" class="my-saved-list"></div>
        </article>
        <article class="my-panel my-service-panel">
          <div class="my-panel-head">
            <h3>서비스 정보</h3>
            <span>v1.0.0</span>
          </div>
          <div class="my-service-list">
            <span><strong>서비스 소개</strong><em>매일의 방송을 4분 요약으로</em></span>
            <span><strong>운영 정책</strong><em>원본 링크 · AI 분석 · 자막 비공개</em></span>
            <span><strong>문의 · 제휴</strong><em>hello@yda.kr</em></span>
            <span><strong>버전</strong><em>v1.0.0 · 2026.06</em></span>
          </div>
        </article>
      </section>
    </section>

    <div id="archiveSearch" class="archive-search-wrap" hidden>
      <div class="archive-search">
        <input id="archiveSearchInput" class="archive-search-input" type="text" placeholder="에피소드 검색 - 제목·키워드·날짜로 찾기" autocomplete="off" />
        <button id="archiveSearchClearButton" type="button" class="ghost" hidden>초기화</button>
      </div>
    </div>

    <section id="archive" class="card" hidden>
      <div class="archive-header">
        <h2>Episodes</h2>
        <span id="archiveCount" class="meta"></span>
      </div>
      <div id="archiveList"></div>
      <div id="loadMoreWrap" class="load-more-wrap" hidden>
        <button id="loadMoreButton" type="button" class="ghost load-more-button">더보기</button>
      </div>
    </section>

    <footer class="app-footer">
      <span>Daily AI Insight · © 2026 hyveo</span>
      <span>AI ANALYSIS · ORIGINAL LINKS</span>
    </footer>
  </main>

  <nav class="mobile-tabbar" aria-label="모바일 하단 메뉴">
    <a class="mobile-tabbar-item" href="#home" data-screen-link="home">
      <span class="mobile-tabbar-home" aria-hidden="true"></span>
      <span>홈</span>
    </a>
    <a class="mobile-tabbar-item" href="#channel" data-screen-link="channel">
      <span class="mobile-tabbar-channel" aria-hidden="true"></span>
      <span>채널</span>
    </a>
    <a class="mobile-tabbar-item" href="#my" data-screen-link="my">
      <span class="mobile-tabbar-my" aria-hidden="true"></span>
      <span>마이</span>
    </a>
  </nav>

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
  appShell: document.querySelector(".app-shell"),
  status: document.querySelector("#status"),
  archiveMeta: document.querySelector("#archiveMeta"),
  // supportLink: document.querySelector('#supportLink'),
  archive: document.querySelector("#archive"),
  channel: document.querySelector("#channel"),
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
  introSubscribeButton: document.querySelector("#introSubscribeButton"),
  introInfoSubscribeButton: document.querySelector("#introInfoSubscribeButton"),
  introShortcutLink: document.querySelector("#introShortcutLink"),
  introChannelLink: document.querySelector("#introChannelLink"),
  introInfoPlaylistLink: document.querySelector("#introInfoPlaylistLink"),
  introInfoChannelLink: document.querySelector("#introInfoChannelLink"),
  introInfoClosing: document.querySelector("#introInfoClosing"),
  introInfoStats: document.querySelector("#introInfoStats"),
  introEpisodesTab: document.querySelector("#introEpisodesTab"),
  introInfoTab: document.querySelector("#introInfoTab"),
  introInfoPanel: document.querySelector("#introInfoPanel"),
  introInfoTitle: document.querySelector("#introInfoTitle"),
  introInfoHeadline: document.querySelector("#introInfoHeadline"),
  introInfoBody: document.querySelector("#introInfoBody"),
  introStats: document.querySelector("#introStats"),
  introMeta: document.querySelector("#introMeta"),
  introHeadline: document.querySelector("#introHeadline"),
  introBody: document.querySelector("#introBody"),
  introClosing: document.querySelector("#introClosing"),
  home: document.querySelector("#home"),
  homeHero: document.querySelector("#homeHero"),
  homeTodayLabel: document.querySelector("#homeTodayLabel"),
  homeRankingDate: document.querySelector("#homeRankingDate"),
  featuredChannel: document.querySelector("#featuredChannel"),
  homeRankingList: document.querySelector("#homeRankingList"),
  my: document.querySelector("#my"),
  mySubscribedState: document.querySelector("#mySubscribedState"),
  myArchiveStats: document.querySelector("#myArchiveStats"),
  mySavedCount: document.querySelector("#mySavedCount"),
  myChannelCount: document.querySelector("#myChannelCount"),
  mySavedList: document.querySelector("#mySavedList"),
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

function formatEpisodeDateLabel(publishedAt) {
  const day = (publishedAt || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "";
  const date = new Date(`${day}T12:00:00`);
  const weekday = Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("ko-KR", { weekday: "long" }).format(date);
  return [day, weekday].filter(Boolean).join(" · ");
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

function formatArchiveStats(total) {
  const daySpan = getDaysSinceFirstBroadcast(state.archive);
  return `EP ${total || 0} · ${daySpan || 0}일 아카이브 · 매일 업데이트`;
}

function formatShortDate(publishedAt) {
  const day = (publishedAt || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "";
  const date = new Date(`${day}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  const month = date.getMonth() + 1;
  const dateNum = date.getDate();
  const weekday = new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(date);
  return `${month}월 ${dateNum}일 ${weekday}`;
}

function formatRankingDate(publishedAt) {
  const day = (publishedAt || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "-";
  const [year, month, date] = day.split("-");
  return `${year}·${month}·${date} ⓘ`;
}

function formatTopbarDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}·${byType.month}·${byType.day} ${byType.weekday}`;
}

function formatGeneratedDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}.${byType.month}.${byType.day} ${byType.weekday}`;
}

function getReportVideos(limit = 12) {
  return state.archive
    .filter((video) => video.hasSummary === "Y")
    .slice(0, limit);
}

function getLeadVideo() {
  return getReportVideos(1)[0] || state.archive[0] || null;
}

function renderHome() {
  const lead = getLeadVideo();
  const reportVideos = getReportVideos(12);
  const total = state.archive.length;
  const daySpan = getDaysSinceFirstBroadcast(state.archive);

  elements.homeTodayLabel.textContent = lead ? formatShortDate(lead.publishedAt) : "-";
  elements.homeRankingDate.textContent = lead ? formatRankingDate(lead.publishedAt) : "-";
  if (lead) {
    const leadDetailUrl = `./detail.html?videoId=${encodeURIComponent(lead.videoId || "")}`;
    const leadSummary = getSimpleSummary(lead, state.summaries[lead.videoId]);
    const leadTitle = getDisplayTitle(lead, state.summaries[lead.videoId], { parts: 1 });
    const leadText = leadSummary.headline || lead.title || "오늘의 리포트";
    elements.homeHero.innerHTML = `
      <div class="home-hero-copy">
        <p class="home-eyebrow">오늘의 리포트 · AI 요약</p>
        <h2><a href="${escapeHtml(leadDetailUrl)}">${escapeHtml(leadTitle)}</a></h2>
        <p>${escapeHtml(leadText)}</p>
        <a class="home-report-link" href="${escapeHtml(leadDetailUrl)}">리포트 읽기 →</a>
      </div>
      <a class="home-report-cover" href="${escapeHtml(leadDetailUrl)}" aria-label="오늘의 리포트 읽기">
        <img src="${escapeHtml(lead.thumbnail || "")}" alt="" loading="lazy" />
        <small>겸손은힘들다 뉴스공장</small>
        <b>${escapeHtml(leadTitle)}</b>
        <span>✦ AI 리포트</span>
        <strong>${escapeHtml(lead.duration || "")}</strong>
      </a>
      <div class="home-hero-counter" aria-hidden="true">
        <span>❚❚</span>
        <strong>1 / ${Math.max(1, Math.min(4, reportVideos.length || 1))} <em>+</em></strong>
      </div>
    `;
    elements.homeHero.hidden = false;
  } else {
    elements.homeHero.hidden = true;
  }

  const featuredReports = reportVideos.slice(0, 8);
  const featuredCards = [
    { category: "시사·경제", mark: "겸손", series: "〈12시에 만나요〉", title: "겸손은힘들다 뉴스공장", meta: `EP ${total || 0} · ${daySpan || 0}일`, offset: 0 },
    { category: "경제·증시", mark: "마켓", series: "〈오늘의 마켓〉", title: "일일 경제 브리핑", meta: `EP ${Math.max(0, total - 4)} · 매일`, offset: 2 },
    { category: "과학·기술", mark: "과학", series: "〈기술과 산업〉", title: "사이언스 데일리", meta: "반도체 · AI · 산업", offset: 4 },
    { category: "문화·인터뷰", mark: "컬처", series: "〈열두시 사랑방〉", title: "컬처 라운지", meta: "사람 · 책 · 대화", offset: 6 }
  ];
  elements.featuredChannel.innerHTML = featuredCards.map((card, index) => {
    const picks = featuredReports.slice(card.offset, card.offset + 2);
    const pickHtml = picks.length
      ? picks.map((video) => `
        <a class="featured-pick" href="./detail.html?videoId=${encodeURIComponent(video.videoId || "")}">
          <span class="featured-pick-cover" aria-hidden="true"></span>
          <span>${escapeHtml(getDisplayTitle(video, state.summaries[video.videoId], { parts: 1 }))}</span>
          <small>${escapeHtml(formatShortDate(video.publishedAt))}</small>
          <b>읽기</b>
        </a>
      `).join("")
      : '<p class="featured-empty">업데이트 대기 중</p>';
    return `
      <div class="featured-card featured-card-${index + 1}">
        <button type="button" class="featured-channel-cover" data-screen-link="channel">
          <span>${escapeHtml(card.category)}</span>
          <i>${escapeHtml(card.mark)}</i>
          <div>
            <small>${escapeHtml(card.series)}</small>
            <strong>${escapeHtml(card.title)}</strong>
            <em>${escapeHtml(card.meta)}</em>
          </div>
        </button>
        <div class="featured-picks">${pickHtml}</div>
      </div>
    `;
  }).join("");

  elements.homeRankingList.innerHTML = reportVideos.length
    ? reportVideos.map((video, index) => `
      <a class="ranking-item" href="./detail.html?videoId=${encodeURIComponent(video.videoId || "")}">
        <span class="ranking-number">
          <strong>${index + 1}</strong>
          <em>–</em>
        </span>
        <span class="ranking-cover" aria-hidden="true"></span>
        <span class="ranking-copy">
          <span class="ranking-title">${escapeHtml(getDisplayTitle(video, state.summaries[video.videoId], { parts: 1 }))}</span>
          <small>${escapeHtml(video.channelTitle || "겸손은힘들다 뉴스공장")}</small>
        </span>
      </a>
    `).join("")
    : '<p class="empty-note">아직 표시할 AI 리포트가 없습니다.</p>';

  renderMy();
}

function setScreen(screen, shouldPushHash = true) {
  state.screen = screen === "channel" || screen === "my" ? screen : "home";
  const isHome = state.screen === "home";
  const isChannel = state.screen === "channel";
  const isMy = state.screen === "my";
  elements.appShell.dataset.screen = state.screen;
  elements.home.hidden = !isHome;
  elements.channel.hidden = !isChannel;
  elements.my.hidden = !isMy;
  elements.archive.hidden = !isChannel || state.introTab === "info";
  elements.archiveSearch.hidden = !isChannel || state.introTab === "info";
  document.querySelectorAll("[data-screen-link]").forEach((link) => {
    const target = link.dataset.screenLink;
    const isActive = target === state.screen;
    link.classList.toggle("is-active", isActive);
  });
  if (shouldPushHash) {
    const nextHash = isHome ? "#home" : isMy ? "#my" : "#channel";
    if (window.location.hash !== nextHash) history.replaceState(null, "", nextHash);
  }
}

function renderMy() {
  if (!elements.mySavedList) return;
  const total = state.archive.length;
  const daySpan = getDaysSinceFirstBroadcast(state.archive);
  elements.myArchiveStats.textContent = `EP ${total || 0} · ${daySpan || 0}일`;
  elements.mySubscribedState.textContent = state.subscribed ? "구독중" : "미구독";
  const savedVideos = getReportVideos(4);
  if (elements.mySavedCount) elements.mySavedCount.textContent = String(savedVideos.length || 0);
  if (elements.myChannelCount) elements.myChannelCount.textContent = state.subscribed ? "1" : "0";
  elements.mySavedList.innerHTML = savedVideos.length
    ? savedVideos.map((video) => `
      <a class="my-saved-item" href="./detail.html?videoId=${encodeURIComponent(video.videoId || "")}">
        <span class="my-saved-cover" aria-hidden="true"></span>
        <strong>${escapeHtml(getDisplayTitle(video, state.summaries[video.videoId], { parts: 1 }))}</strong>
        <small>${escapeHtml(formatShortDate(video.publishedAt))}</small>
      </a>
    `).join("")
    : '<p class="empty-note">아직 보관한 리포트가 없습니다.</p>';
}

function setSubscribed(nextValue) {
  state.subscribed = Boolean(nextValue);
  [elements.introSubscribeButton, elements.introInfoSubscribeButton].forEach((button) => {
    if (!button) return;
    button.dataset.subscribed = state.subscribed ? "true" : "false";
    button.textContent = state.subscribed ? "✓ 구독중" : "＋ 구독";
  });
  renderMy();
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
    const sortedGroups = Object.entries(visibleGrouped).sort(([a], [b]) => b.localeCompare(a));
    elements.archiveList.innerHTML = sortedGroups
      .map(
        ([day, videos], index) => `
      <article class="day" ${index === 0 ? 'id="latestArchiveDay"' : ""}>
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
    elements.loadMoreButton.textContent = `에피소드 더보기 +${nextCount}`;
    elements.loadMoreWrap.hidden = false;
  } else {
    elements.loadMoreButton.textContent = "에피소드 더보기";
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
  if (transcript !== "Y") return "";
  return `
    <span class="enrichment-badges">
      <span class="enrichment-badge yes">CC</span>
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
    return { headline: "", body: "AI 리포트 준비 중입니다.", hasReport: false };
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

function getDisplayTitle(video, summaryData = null, options = {}) {
  const explicitTitle = video?.displayTitle || video?.shortTitle || summaryData?.displayTitle || summaryData?.shortTitle;
  if (explicitTitle) return explicitTitle;

  let title = String(video?.title || summaryData?.title || "").trim();
  title = title.replace(/^\s*\[[^\]]+\]\s*/, "");
  title = title.replace(/\s*[|ㅣ]\s*\d{4}년\s*\d{1,2}월\s*\d{1,2}일.*$/u, "");
  title = title.replace(/\s*[|ㅣ]\s*\d{4}[.-]\s*\d{1,2}[.-]\s*\d{1,2}.*$/u, "");
  title = title.replace(/\s*[|ㅣ]\s*[가-힣A-Za-z0-9·.\s]+(?:교수|연구위원|소장|평론가|앵커|PD|아나운서|위원|대표|박사)\s*$/u, "");
  title = title.replace(/[📈💓🔥🚨🥹😤🫠😭]+/gu, "");
  return title
    .split(/\s*[|ㅣ]\s*/u)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, options.parts || 2)
    .join(" | ")
    .trim() || String(video?.title || "").trim();
}

function renderVideoCard(video) {
  const summaryData = state.summaries[video.videoId];
  const { headline, body, hasReport } = getSimpleSummary(video, summaryData);
  const displayTitle = getDisplayTitle(video, summaryData, { parts: 1 });
  const detailUrl = `./detail.html?videoId=${encodeURIComponent(video.videoId || "")}`;
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
            <a class="detail-link" href="${escapeHtml(detailUrl)}">AI 리포트 →</a>
            <a class="youtube-inline-link" href="${escapeHtml(video.url)}" target="_blank" rel="noreferrer">유튜브에서 보기 ↗</a>
          </div>
    `
    : `
          <div class="video-actions">
            <a class="youtube-inline-link" href="${escapeHtml(video.url)}" target="_blank" rel="noreferrer">유튜브에서 보기 ↗</a>
            <a class="notify-link" href="${DISCORD_INVITE_URL}" target="_blank" rel="noreferrer">디스코드 알림 받기</a>
          </div>
    `;
  return `
    <article class="video-card" data-video-id="${escapeHtml(video.videoId)}">
      <div class="video-card-top">
        <div class="video-media">
          <div class="video-thumb">
            <img src="${escapeHtml(video.thumbnail)}" alt="" loading="lazy" />
            <span class="video-duration">${escapeHtml(video.duration || "")}</span>
          </div>
          <div class="youtube-actions">
            <a class="youtube-link" href="${escapeHtml(video.url)}" target="_blank" rel="noreferrer">유튜브 보러가기</a>
            <button class="youtube-copy-button" type="button" data-youtube-url="${escapeHtml(video.url)}" aria-label="유튜브 URL 복사">
              ${COPY_ICON_SVG}
            </button>
          </div>
        </div>
        <div class="video-summary">
          <div class="mobile-episode-meta">
            <span>${escapeHtml(formatEpisodeDateLabel(video.publishedAt))}</span>
            ${hasReport ? '<span class="mobile-report-badge">✦ AI 리포트</span>' : ""}
            <span class="mobile-duration">${escapeHtml(video.duration || "")}</span>
          </div>
          <h4><a href="${escapeHtml(detailUrl)}">${escapeHtml(displayTitle)}</a>${renderLiveStatusBadge(video)}</h4>
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
  const daySpan = getDaysSinceFirstBroadcast(state.archive);

  elements.archiveMeta.textContent = formatTopbarDate(generatedAt);
  elements.introStats.textContent = formatArchiveStats(total);
  elements.introInfoStats.textContent = formatArchiveStats(total);
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
  elements.archiveTitle.textContent = intro?.title || fallbackTitle || "Daily AI Insight";
  elements.introInfoTitle.textContent = intro?.title || fallbackTitle || "12시에 만나요";

  const thumbnailVideoId = getYoutubeVideoId(intro?.thumbnailVideoUrl || intro?.thumbnailVideoId);
  if (thumbnailVideoId) {
    elements.introThumb.src = getYoutubeThumbnail(thumbnailVideoId);
    elements.introThumb.alt = intro?.title || fallbackTitle || "소개 영상";
    elements.introThumbLink.hidden = false;
  } else {
    elements.introThumbLink.hidden = true;
  }

  const shortcutUrl = intro?.playlistUrl || intro?.playlistShortcutUrl || "";
  if (shortcutUrl) {
    elements.introShortcutLink.href = shortcutUrl;
    elements.introInfoPlaylistLink.href = shortcutUrl;
    elements.introShortcutLink.textContent = (intro?.playlistShortcutLabel || "플레이리스트 가기").replace(/^👉\s*/, "");
    elements.introInfoPlaylistLink.textContent = (intro?.playlistShortcutLabel || "플레이리스트 가기").replace(/^👉\s*/, "");
    elements.introShortcutLink.hidden = false;
    elements.introInfoPlaylistLink.hidden = false;
  } else {
    elements.introShortcutLink.hidden = true;
    elements.introInfoPlaylistLink.hidden = true;
  }

  if (intro?.closing) {
    elements.introClosing.innerHTML = escapeHtml(intro.closing).replace(/\n/g, "<br />");
    elements.introInfoClosing.innerHTML = escapeHtml(intro.closing).replace(/\n/g, "<br />");
    elements.introClosing.hidden = false;
  } else {
    elements.introInfoClosing.textContent = "";
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
    elements.introInfoHeadline.textContent = intro.headline;
    elements.introHeadline.hidden = false;
  } else {
    elements.introInfoHeadline.textContent = "";
    elements.introHeadline.hidden = true;
  }

  const body = intro?.body || [];
  if (body.length) {
    elements.introBody.innerHTML = body.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
    elements.introInfoBody.innerHTML = body.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
    elements.introBody.hidden = false;
  } else {
    elements.introBody.innerHTML = "";
    elements.introInfoBody.innerHTML = "";
    elements.introBody.hidden = true;
  }
}

function renderIntroTabs() {
  const isInfo = state.introTab === "info";
  const isChannel = state.screen === "channel";
  elements.introEpisodesTab.classList.toggle("is-active", !isInfo);
  elements.introInfoTab.classList.toggle("is-active", isInfo);
  elements.introEpisodesTab.setAttribute("aria-selected", isInfo ? "false" : "true");
  elements.introInfoTab.setAttribute("aria-selected", isInfo ? "true" : "false");
  elements.introInfoPanel.hidden = !isInfo;
  elements.archive.hidden = !isChannel || isInfo;
  elements.archiveSearch.hidden = !isChannel || isInfo;
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
  return '<span class="update-badge">✦ AI 리포트</span>';
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
    renderHome();
    renderMy();
    setScreen(state.screen, false);
    renderIntroTabs();
    requestAnimationFrame(() => window.scrollTo({ top: 0 }));
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
elements.introSubscribeButton.addEventListener("click", () => setSubscribed(!state.subscribed));
elements.introInfoSubscribeButton.addEventListener("click", () => setSubscribed(!state.subscribed));
document.querySelectorAll("[data-intro-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    state.introTab = button.dataset.introTab || "episodes";
    renderIntroTabs();
  });
});
document.addEventListener("click", (event) => {
  const screenLink = event.target.closest("[data-screen-link]");
  if (screenLink) {
    event.preventDefault();
    setScreen(screenLink.dataset.screenLink);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const homeJump = event.target.closest("[data-home-jump]");
  if (homeJump) {
    event.preventDefault();
    setScreen("home");
    const target = homeJump.dataset.homeJump === "ranking" ? document.querySelector("#homeRanking") : elements.home;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});
window.addEventListener("hashchange", () => {
  const hashScreen = window.location.hash === "#channel" ? "channel" : window.location.hash === "#my" ? "my" : "home";
  setScreen(hashScreen, false);
});
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
