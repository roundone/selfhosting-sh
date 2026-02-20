---
title: "Maloja vs Last.fm: Self-Hosted Music Scrobbling"
description: "Maloja vs Last.fm comparison for music scrobbling. Self-hosted tracking vs the cloud service — privacy, features, and whether to switch."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "music-streaming"
apps:
  - maloja
tags:
  - comparison
  - maloja
  - lastfm
  - scrobbling
  - self-hosted
  - music
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

If you care about owning your listening data and don't need Last.fm's social features, Maloja is an excellent self-hosted replacement. If you value the social network — friends' listening activity, compatibility scores, event recommendations, and the massive music database — Last.fm is still the better option. Most self-hosters run both: Maloja as the primary scrobble destination and Last.fm as a secondary mirror.

## Overview

**Maloja** is a self-hosted music scrobbling server written in Python. It tracks what you listen to, generates statistics and charts, and provides a clean web dashboard showing your listening habits over time. It accepts scrobbles from any client that supports the Last.fm or ListenBrainz API, stores everything locally, and never shares your data with third parties.

**Last.fm** is the original scrobbling service, running since 2002. It tracks listening across 100+ music services, provides social features (friends, compatibility), artist/album pages with metadata from a massive database, personalized recommendations, and event listings. It's free with optional Premium ($3/month for ad removal).

## Feature Comparison

| Feature | Maloja | Last.fm |
|---------|--------|---------|
| **Hosting** | Self-hosted | Cloud service |
| **Privacy** | Full control, no data sharing | CBS Interactive collects data |
| **API Compatibility** | Last.fm + ListenBrainz APIs | Last.fm API |
| **Social Features** | None | Friends, compatibility, groups |
| **Music Database** | Your scrobbles only | Massive community database |
| **Artist/Album Info** | Minimal | Detailed (bios, tags, similar) |
| **Recommendations** | No | Yes (personalized) |
| **Charts** | Personal only | Personal + global |
| **Import/Export** | Import from Last.fm CSV | Export via API |
| **Web UI** | Clean dashboard | Feature-rich |
| **Mobile App** | Web (responsive) | Dedicated iOS/Android |
| **Third-party Integrations** | Basic API | Hundreds of services |
| **Custom Rules** | Yes (artist/album renaming) | No |
| **License** | GPL-3.0 | Proprietary |
| **Cost** | Free (self-hosted) | Free (ads) / $3/mo (no ads) |

## Installation Complexity

**Maloja** runs as a single Docker container with no external dependencies:

```yaml
services:
  maloja:
    image: krateng/maloja:3.2.4
    ports:
      - "42010:42010"
    volumes:
      - maloja-data:/data
    environment:
      MALOJA_DATA_DIRECTORY: /data
    restart: unless-stopped
```

First-run creates an admin account and API key. Configure your music players (Navidrome, Jellyfin, Plex, etc.) to scrobble to `http://your-server:42010` using the generated API key with the Last.fm or ListenBrainz protocol.

**Last.fm** requires no setup — create an account at last.fm, connect your music services, and it starts tracking. Most music apps have built-in Last.fm support.

Maloja is easy to deploy but requires configuring each music source to point at your server. Last.fm is zero-setup because most apps integrate with it natively.

## Performance and Resource Usage

| Metric | Maloja | Last.fm |
|--------|--------|---------|
| **RAM** | 50-150 MB | N/A (cloud) |
| **CPU** | Minimal | N/A (cloud) |
| **Disk** | Grows with scrobble count (~1 MB per 10K scrobbles) | N/A (cloud) |
| **Reliability** | Depends on your server | 99.9%+ uptime |

Maloja is lightweight. Years of scrobbling data (100K+ scrobbles) fits in a few hundred MB. The main risk is your server going down — if it's offline when you scrobble, that data is lost unless your client caches it.

## Data Ownership and Privacy

This is Maloja's primary selling point:

- **Your data stays on your server.** No third-party analytics, no data sharing, no advertising profile built from your listening habits.
- **Full data export.** Your scrobble database is a SQLite file you own and can query directly.
- **Custom data rules.** Maloja lets you define rules for artist name normalization, album merging, and track renaming. If a scrobbler sends "Pink Floyd" and "Pink floyd" as different artists, you can merge them.

Last.fm collects your listening data and uses it for recommendations and advertising. The data is accessible via API but you don't own the underlying database. If Last.fm shuts down (it's changed ownership multiple times), your historical data is at risk.

## Use Cases

### Choose Maloja If...

- You want to own your listening data permanently
- Privacy matters and you don't want CBS tracking your music habits
- You want custom rules for artist/album normalization
- You use a self-hosted music server (Navidrome, Jellyfin) and want a self-hosted scrobbler to match
- You want a simple, focused scrobbling dashboard without social features

### Choose Last.fm If...

- You want social features (friends, compatibility, event recommendations)
- You listen on many platforms (Spotify, Apple Music, YouTube) and want unified tracking
- You want detailed artist/album information from their music database
- You want personalized music recommendations
- You don't want to maintain another self-hosted service

### Run Both

Many self-hosters run Maloja as their primary scrobble destination and forward scrobbles to Last.fm as a secondary. Maloja accepts scrobbles via the Last.fm API, so you can configure your music player to scrobble to Maloja, then set up Maloja to mirror scrobbles to Last.fm. This gives you the best of both worlds: local data ownership plus Last.fm's social features.

## Final Verdict

Maloja and Last.fm serve overlapping but different purposes. **For data ownership and privacy, Maloja is the right choice.** It's lightweight, easy to run, and gives you permanent ownership of your listening history. If you're already self-hosting your music server, adding Maloja is a natural complement.

But Last.fm's social features, massive music database, and seamless integration with commercial streaming services are genuinely useful and can't be replicated by a self-hosted tool. The pragmatic answer for most self-hosters is: **run both**. Scrobble to Maloja as your permanent record, mirror to Last.fm for the social features.

## Frequently Asked Questions

### Can I import my Last.fm history into Maloja?

Yes. Export your Last.fm data using a tool like lastfm-to-csv or the Last.fm API, then import the CSV into Maloja. Maloja supports importing scrobble history from Last.fm, ListenBrainz, and Spotify.

### Does Maloja work with Spotify?

Not directly — Spotify doesn't support custom scrobble endpoints. You'd need to use a bridge service (like web-scrobbler browser extension or a custom script) to forward Spotify scrobbles to Maloja. For self-hosted music servers (Navidrome, Jellyfin), it's straightforward.

### What's ListenBrainz and how does it relate?

ListenBrainz is an open-source, community-run alternative to Last.fm by the MusicBrainz foundation. Maloja supports the ListenBrainz API for receiving scrobbles. If you want an open-source cloud scrobbler without self-hosting, ListenBrainz is the middle ground between Maloja and Last.fm.

## Related

- [How to Self-Host Maloja](/apps/maloja)
- [How to Self-Host Navidrome](/apps/navidrome)
- [Navidrome vs Jellyfin](/compare/navidrome-vs-jellyfin)
- [Best Self-Hosted Music Streaming](/best/music-streaming)
- [Replace Spotify](/replace/spotify)
- [Docker Compose Basics](/foundations/docker-compose-basics)
