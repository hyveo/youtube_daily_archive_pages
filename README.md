# Daily AI Insight

> **AI-powered insight reports from curated content channels — free for everyone.**

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://hyveo.github.io/youtube_daily_archive_pages/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Built with AI](https://img.shields.io/badge/Built%20with-AI%20Analysis-blue)]()

**[서비스 바로가기](https://hyveo.github.io/youtube_daily_archive_pages/)** · **[채널](https://hyveo.github.io/youtube_daily_archive_pages/channel.html)** · **[정보](https://hyveo.github.io/youtube_daily_archive_pages/info.html)** · **[한국어](#한국어)** · **[English](#english)**

---

## 한국어

**Daily AI Insight**는 YouTube 방송 콘텐츠를 AI 분석 리포트로 재구성해 보여주는 정적 웹 서비스입니다. 원본 방송의 자막과 메타데이터를 바탕으로 핵심 주제, 주요 논점, 시장 관점, 챕터별 흐름을 읽기 쉬운 리포트 형태로 제공합니다.

목표는 단순합니다. 긴 영상을 모두 볼 시간이 없거나 유료 AI 도구를 쓰기 어려운 사용자도 고품질 AI 분석을 무료로 볼 수 있게 하는 것입니다.

리포트는 GitHub Pages 정적 사이트로 공개됩니다. 로그인과 유료 구독 없이 볼 수 있습니다.

## 배포 정보

- 버전: `deploy-19`
- 마지막 배포일: `2026-07-02 18:30:51 KST`
- 서비스 URL: https://hyveo.github.io/youtube_daily_archive_pages
- 소스 커밋: `5858148`
- Actions run: https://github.com/heaun/youtube_daily_archive/actions/runs/28579937628

## 현재 공개 데이터

- 채널 수: 1
- 공개 영상 메타데이터 수: 55
- 공개 AI 리포트 수: 22

## 동작 방식

```text
YouTube Channels
      |
      v
Transcript + Metadata
      |
      v
AI Analysis
  - Summarization
  - Key insight extraction
  - Category tagging
      |
      v
JSON Data Files
      |
      v
GitHub Actions
  auto-deploy on source changes
      |
      v
GitHub Pages
  Static Site - public, free
```

현재 AI 리포트는 private source workflow에서 생성되고, 이 public repository에는 정적 사이트 산출물과 공개 메타데이터, 공개 AI 요약 JSON만 배포됩니다.

다음 목표는 스케줄 기반 수집, 자막 처리, AI 리포트 생성, JSON 발행, 배포까지 이어지는 end-to-end 자동화입니다.

## 콘텐츠 카테고리

| Category | Channel | Update Cycle |
|----------|---------|--------------|
| 시사·경제 Current Affairs | 겸손은힘들다 뉴스공장 | Daily |
| 경제·증시 Markets | Planned expansion | Daily |
| 과학·기술 Science & Tech | Planned expansion | Daily |
| 문화·인터뷰 Culture | Planned expansion | Weekly |

## Public Repository 구조

```text
daily-ai-insight/
├── data/               # Public playlist metadata and AI summary JSON
├── src/                # Public static assets
├── index.html          # Home - today's top report
├── channel.html        # Channel browser
├── detail.html         # Full report view
├── episodes.html       # Episode detail route
├── info.html           # Service information
├── script.js           # Client-side rendering
└── style.css           # Styles
```

이 public repository는 private source repository에서 생성된 산출물입니다. source-only script, secret, `.env` 파일, transcript JSON은 포함하지 않습니다.

## 기술 스택

- **Frontend:** Vanilla HTML/CSS/JS - framework dependency 없이 가볍게 동작
- **Data:** source pipeline에서 생성된 공개 JSON
- **Deployment:** GitHub Actions + GitHub Pages
- **AI Analysis:** 방송 자막과 메타데이터 기반 AI 구조화 리포트

## 로드맵

### Phase 1 - 현재: Static + Source Pipeline
- [x] 큐레이션 채널 선정
- [x] AI insight report 생성
- [x] 채널/에피소드 화면을 포함한 정적 사이트
- [x] GitHub Actions 기반 public Pages 배포

### Phase 2 - Pipeline Automation
- [ ] 스케줄 기반 transcript 수집
- [ ] API 기반 AI 리포트 생성
- [ ] 10개 이상 채널로 확장
- [ ] 리포트 다국어 지원

### Phase 3 - Server Migration
- [ ] GitHub Pages에서 self-hosted server로 이전
- [ ] webhook 기반 real-time pipeline
- [ ] 사용자 개인화
- [ ] backend codebase 보안 강화
- [ ] API rate-limit 및 비용 최적화

## 철학

많은 AI 기반 콘텐츠 도구는 paywall 뒤에 있습니다. Daily AI Insight는 로그인, 구독, premium AI account 없이도 구조화된 AI 분석을 볼 수 있도록 만들고 있습니다.

유용하게 봤거나 추가하면 좋을 채널이 있다면 issue로 제안해 주세요.

## 기여

다음 형태의 기여를 환영합니다.

- **채널 제안** - YouTube 채널 링크와 카테고리를 issue로 제안
- **Frontend 개선** - public site의 HTML/CSS/JS 개선
- **Data/schema 제안** - generated file을 직접 수정하기 전에 issue로 구조 개선 제안
- **Pipeline 아이디어** - source workflow 자동화 개선 제안

## License

MIT (c) 2026 [hyveo](https://github.com/hyveo). See [LICENSE](./LICENSE).

## 콘텐츠 고지

라이브 사이트의 콘텐츠 분석 리포트는 공개 YouTube 방송 메타데이터와 자막을 바탕으로 생성된 AI 요약입니다. 원본 콘텐츠의 저작권은 각 권리자에게 있으며, 이 서비스는 원본 영상을 대체하거나 재배포하지 않습니다.

AI 요약에는 오류나 누락이 있을 수 있습니다. 가장 정확하고 완전한 맥락은 원본 YouTube 영상을 확인해 주세요.

## 연락

Questions or partnership inquiries: [app.hyveo@gmail.com](mailto:app.hyveo@gmail.com)

---

## English

**Daily AI Insight** collects content from curated YouTube channels across categories like current affairs, economics, science, and culture, then uses AI to distill each episode into a structured insight report.

The goal is simple: **give everyone access to high-quality AI analysis for free**, regardless of whether they can afford premium AI tools or have time to watch hours of video.

Insight reports are published as a static site via GitHub Pages. No login. No paywall.

## Deployment

- Version: `deploy-19`
- Last deployed: `2026-07-02 18:30:51 KST`
- Site: https://hyveo.github.io/youtube_daily_archive_pages
- Source commit: `5858148`
- Actions run: https://github.com/heaun/youtube_daily_archive/actions/runs/28579937628

## Current Public Data

- Channels: 1
- Public video metadata records: 55
- Public AI reports: 22

## How It Works

```text
YouTube Channels
      |
      v
Transcript + Metadata
      |
      v
AI Analysis
  - Summarization
  - Key insight extraction
  - Category tagging
      |
      v
JSON Data Files
      |
      v
GitHub Actions
  auto-deploy on source changes
      |
      v
GitHub Pages
  Static Site - public, free
```

**Current status:** AI insight reports are generated through the private source workflow and published here as static site output. The public repository contains generated site files, public metadata, and public AI summary JSON.

**Next milestone:** Continue automating the pipeline end-to-end: scheduled collection, transcript processing, AI report generation, JSON publication, and deployment.

## Content Categories

| Category | Channel | Update Cycle |
|----------|---------|--------------|
| Current Affairs | 겸손은힘들다 뉴스공장 | Daily |
| Markets | Planned expansion | Daily |
| Science & Tech | Planned expansion | Daily |
| Culture | Planned expansion | Weekly |

## Public Repository Structure

```text
daily-ai-insight/
├── data/               # Public playlist metadata and AI summary JSON
├── src/                # Public static assets
├── index.html          # Home - today's top report
├── channel.html        # Channel browser
├── detail.html         # Full report view
├── episodes.html       # Episode detail route
├── info.html           # Service information
├── script.js           # Client-side rendering
└── style.css           # Styles
```

This public repository is generated from a private source repository. It does not include source-only scripts, secrets, `.env` files, or transcript JSON.

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS - zero framework dependencies, fast and lightweight
- **Data:** Public JSON files generated from the source pipeline
- **Deployment:** GitHub Actions + GitHub Pages
- **AI Analysis:** AI-generated structured reports from broadcast transcripts and metadata

## Roadmap

### Phase 1 - Current: Static + Source Pipeline
- [x] Curated channel selection
- [x] AI insight report generation
- [x] Static site with channel and episode views
- [x] GitHub Actions deployment to public Pages

### Phase 2 - Pipeline Automation
- [ ] Scheduled transcript collection
- [ ] API-driven AI report generation
- [ ] Expand to 10+ channels across more categories
- [ ] Multi-language support for reports

### Phase 3 - Server Migration
- [ ] Move from GitHub Pages to a self-hosted server
- [ ] Real-time pipeline with webhook triggers
- [ ] User personalization
- [ ] Security hardening for the full backend codebase
- [ ] API rate-limit management and cost optimization

## Philosophy

Most AI-powered content tools sit behind paywalls. This project exists to challenge that. The public site makes structured AI analysis accessible without requiring a login, subscription, or premium AI account.

If you find this useful or want to suggest a channel, open an issue.

## Contributing

Contributions are welcome, especially:

- **Channel suggestions** - open an issue with a YouTube channel link and category
- **Frontend fixes** - HTML/CSS/JS improvements for the public site
- **Data/schema suggestions** - propose changes through an issue before editing generated files
- **Pipeline ideas** - suggest automation improvements for the source workflow

## License

MIT (c) 2026 [hyveo](https://github.com/hyveo). See [LICENSE](./LICENSE).

## Content Notice

Content analysis reports on the live site are AI-generated summaries based on publicly available YouTube broadcast metadata and transcripts. Original content copyright belongs to each respective creator. This service does not replace or reproduce original videos.

AI-generated summaries may contain errors or omissions. For the most accurate and complete context, refer to the original YouTube videos.

## Contact

Questions or partnership inquiries: [app.hyveo@gmail.com](mailto:app.hyveo@gmail.com)
