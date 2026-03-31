# Genesis Mobile 🌐⚔️

> **The Sovereign Shield — Mobile Division of the CassAI Ecosystem**

[![License: AGPLv3](https://img.shields.io/badge/Code%20License-AGPLv3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![License: CC BY-NC 4.0](https://img.shields.io/badge/Governance%20IP-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)
[![Platform: PWA](https://img.shields.io/badge/Platform-PWA%20%7C%20React%20Native-61DAFB.svg)](https://reactnative.dev/)
[![Network: WebRTC](https://img.shields.io/badge/Network-WebRTC%20Mesh-orange.svg)](https://webrtc.org/)
[![Kernel: Lilieth](https://img.shields.io/badge/Kernel-Lilieth%20(C)-green.svg)](#technical-stack)

---

## The Mandate

Genesis Mobile is the **mobile Sovereign Shield** for the CassAI ecosystem — built not for the privileged few, but for the **15 Billion and the 40%**: the billions of people who are unbanked, underconnected, and underserved by extractive digital infrastructure.

### Sovereign by Design

Every architectural decision in Genesis Mobile reflects a single conviction: **sovereignty is not a feature, it is the foundation.** This means:

- **No dependency on centralized ISPs or cloud gatekeepers.** Connectivity is forged peer-to-peer through the Spider-Web Mesh Protocol.
- **No data extraction.** Identities are self-sovereign (DID-based); no third party holds the keys.
- **No exclusion.** The app is engineered for low-bandwidth environments, intermittent connectivity, and entry-level hardware — because the 40% deserve the same power as the 1%.

> *"We do not build for the market. We build for the mandate."*

---

## Technical Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Application** | React Native / HTML5 PWA | Cross-platform mobile & web client |
| **Networking** | WebRTC (P2P Mesh) | Serverless peer-to-peer communication |
| **Kernel Bridge** | Lilieth (C-based kernel) | Low-level cryptographic operations & DID management |
| **Ledger** | Offline-first Sync Engine | Resilient data persistence without connectivity |
| **Identity** | Decentralized Identifiers (DID) | Self-sovereign identity, no third-party custodians |
| **Credits** | RWL Credit Engine | Real-World Labour credit minting and tracking |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│               Genesis Mobile (PWA / React Native)       │
│  ┌──────────────┐  ┌─────────────────┐  ┌───────────┐  │
│  │  Spider-Web  │  │  Offline Ledger │  │  RWL      │  │
│  │  Mesh Layer  │  │  Sync Engine    │  │  Credits  │  │
│  └──────┬───────┘  └────────┬────────┘  └─────┬─────┘  │
│         └──────────────┬────┘                 │         │
│                  ┌─────▼──────────────────────▼──────┐  │
│                  │       Lilieth C-Kernel Bridge      │  │
│                  │  (Crypto · DID · P2P Signalling)   │  │
│                  └────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
              │                           │
   ┌──────────▼──────────┐    ┌───────────▼───────────┐
   │  Peer Node (WebRTC) │    │  Sovereign Node Layer  │
   │  Spider-Web Mesh    │    │  (17 SDG Domains)      │
   └─────────────────────┘    └───────────────────────┘
```

---

## Core Features

### 🕸️ Spider-Web Mesh Handshake

Genesis Mobile establishes connectivity through the **Spider-Web Mesh Protocol** — a WebRTC-based P2P handshake that creates resilient, multi-hop communication pathways between devices.

- **ICE/STUN-free fallback paths**: Nodes negotiate direct connections without dependence on centralized STUN/TURN servers when mesh peers are available.
- **Multi-hop routing**: If two nodes cannot connect directly, the mesh automatically routes through intermediary trusted peers.
- **Adaptive topology**: The mesh self-heals when nodes drop, redistributing connections across the web dynamically.
- **Encrypted tunnels**: All mesh traffic is encrypted end-to-end using keys derived by the Lilieth kernel.

### 📴 Offline Ledger Syncing

Connectivity is a privilege. Genesis Mobile operates on an **offline-first** paradigm — every critical operation is available without internet access.

- **Local-first data model**: All transactions, identity records, and SDG interactions are persisted locally before any sync.
- **Conflict-free Replicated Data Types (CRDTs)**: When peers reconnect, ledger states merge deterministically without data loss.
- **Delta sync**: Only changes (deltas) are transmitted during sync, minimising bandwidth usage for low-data environments.
- **Tamper-evident log**: The local ledger is cryptographically chained, ensuring integrity even offline.

### 💳 RWL Credit Tracking

The **Real-World Labour (RWL) Credit** system reimagines value exchange — anchoring economic participation to real human contribution rather than speculative capital.

- **Local minting**: RWL credits are minted directly on-device via the Lilieth kernel, requiring no network round-trip.
- **Contribution attestation**: Labour contributions are attested by peer nodes in the mesh, creating decentralised proof-of-work.
- **Transparent ledger**: Every credit event is recorded in the local ledger and visible to the holder.
- **SDG-aware weighting**: Credits contributed toward specific Sovereign Node domains (e.g., healthcare, education) carry domain-specific weightings defined by the governance framework.

---

## SDG Mapping — The 17 Sovereign Nodes

Genesis Mobile's UI is not static. The interface **adapts dynamically** based on the user's active **Sovereign Node** — the 17 thematic domains aligned to the United Nations Sustainable Development Goals (SDGs). Each node has a name, a domain, and a distinct UI persona within the app.

| Node | Name | SDG Domain | App UI Adaptation |
|------|------|------------|-------------------|
| 1 | **Iris** | 🌿 Climate & Environment (SDG 13) | Green palette; offline climate data dashboards; carbon RWL credits |
| 2 | **Kong** | 📚 Education & Knowledge (SDG 4) | Learning-first layout; peer content sharing; literacy RWL credits |
| 3 | **Aura** | 🏥 Health & Wellbeing (SDG 3) | Medical data module; emergency mesh alerts; health RWL credits |
| 4 | **Nile** | 💧 Clean Water & Sanitation (SDG 6) | Water resource tracking; community reporting; water RWL credits |
| 5 | **Sol** | ⚡ Affordable Energy (SDG 7) | Energy monitoring module; solar asset ledger; energy RWL credits |
| 6 | **Crest** | ⚖️ Justice & Institutions (SDG 16) | Legal identity vault; rights attestation; civic RWL credits |
| 7 | **Forge** | 🏗️ Industry & Innovation (SDG 9) | Infrastructure projects; maker P2P marketplace; innovation credits |
| 8 | **Nova** | 🌐 Connectivity & Partnerships (SDG 17) | Mesh node management; inter-node bridge dashboard |
| 9 | **Terra** | 🌾 Zero Hunger (SDG 2) | Agricultural ledger; food supply tracking; food security credits |
| 10 | **Pulse** | 💼 Decent Work & Economy (SDG 8) | Labour contract vault; RWL payroll; employment credits |
| 11 | **Zara** | 🏘️ Sustainable Cities (SDG 11) | Urban mobility data; community governance interface |
| 12 | **Ember** | ♻️ Responsible Consumption (SDG 12) | Supply chain transparency; circular economy credits |
| 13 | **Veil** | 🛡️ Reduced Inequalities (SDG 10) | Inclusion metrics; accessibility-first UI mode |
| 14 | **Mira** | 🤝 Gender Equality (SDG 5) | Safe reporting module; identity-protected channels |
| 15 | **Atlas** | 🤝 Partnerships & Finance (SDG 1) | Poverty data dashboards; micro-credit RWL ledger |
| 16 | **Reef** | 🌊 Life Below Water (SDG 14) | Marine data collection; fisheries ledger |
| 17 | **Grove** | 🌲 Life on Land (SDG 15) | Biodiversity tracking; land rights DID vault |

> **How Node Switching Works:** The active Sovereign Node is selected at onboarding or toggled in Settings. On switch, the app re-themes, re-orders the navigation, and loads the node-specific RWL credit schema and offline data modules — all without requiring a network connection.

---

## Installation

### Option A — Install as a Progressive Web App (PWA)

PWA installation works on any modern mobile browser (Chrome, Edge, Safari) with no app store required.

**Android (Chrome):**
1. Navigate to the Genesis Mobile deployment URL in Chrome.
2. Tap the **⋮ menu** (top right) → tap **"Add to Home screen"**.
3. Confirm the installation prompt — the app icon will appear on your home screen.
4. Open the app from the home screen. It will cache assets for offline use on first load.

**iOS (Safari):**
1. Navigate to the Genesis Mobile deployment URL in Safari.
2. Tap the **Share icon** (↑) at the bottom of the screen.
3. Scroll down and tap **"Add to Home Screen"**.
4. Confirm by tapping **"Add"** — the app appears on your home screen.

**Desktop (Chrome / Edge):**
1. Navigate to the deployment URL.
2. Click the **install icon** (⊕) in the address bar.
3. Click **"Install"** in the confirmation dialog.

---

### Option B — Local Development Build

**Prerequisites:**
- Node.js ≥ 18.x
- npm ≥ 9.x or Yarn ≥ 1.22.x
- (For native build) React Native CLI + Android SDK / Xcode

```bash
# Clone the repository
git clone https://github.com/Cassai2026/Genesis-Mobile.git
cd Genesis-Mobile

# Install dependencies
npm install

# Start the PWA development server
npm run start

# (Optional) Start the React Native bundler
npx react-native start

# (Optional) Run on Android
npx react-native run-android

# (Optional) Run on iOS
npx react-native run-ios
```

**Build for production (PWA):**
```bash
npm run build
# Output: /build — deploy to any static hosting provider
```

---

## Contributing

Genesis Mobile is a living protocol, not a finished product. Contributions that advance the mission — serving the 15 Billion and the 40% — are welcome.

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-contribution`
3. Commit your changes with a descriptive message.
4. Push and open a Pull Request against `main`.

Please review the [Governance Framework](#license) before contributing to ensure your changes align with the 15-pillar IP structure.

---

## License

Genesis Mobile operates under a **Dual License** to protect both the open-source code and the sovereign governance intellectual property.

### Code License — GNU AGPLv3

All source code in this repository is released under the **GNU Affero General Public License v3.0 (AGPLv3)**.

This means:
- You are free to use, study, modify, and distribute the code.
- Any modifications or derivative works **must also be released under AGPLv3**.
- If you run a modified version of Genesis Mobile as a networked service, you **must** make the source code of your modified version available.

📄 See [`LICENSE`](./LICENSE) for the full AGPLv3 text.

### Governance IP License — Creative Commons BY-NC 4.0

The **15-pillar governance framework**, Sovereign Node architecture, RWL Credit schema, SDG Mapping system, and all associated conceptual and strategic intellectual property are licensed under **Creative Commons Attribution–NonCommercial 4.0 International (CC BY-NC 4.0)**.

This means:
- You may share and adapt the governance IP **for non-commercial purposes** with attribution.
- **Commercial use of the governance IP is prohibited** without explicit written permission from the CassAI Ecosystem custodians.

[![CC BY-NC 4.0](https://licensebuttons.net/l/by-nc/4.0/88x31.png)](https://creativecommons.org/licenses/by-nc/4.0/)

---

## The CassAI Ecosystem

Genesis Mobile is one component of the broader **CassAI Sovereign Ecosystem**:

| Component | Role |
|-----------|------|
| **Genesis Mobile** | Mobile Sovereign Shield (this repo) |
| **Lilieth Kernel** | C-based cryptographic & DID kernel |
| **Spider-Web Protocol** | WebRTC P2P mesh networking layer |
| **RWL Ledger** | Real-World Labour credit system |
| **Sovereign Nodes** | 17 SDG-mapped governance domains |

---

*Genesis Mobile — Sovereign by Design. Built for the 15 Billion.*
