# VICTOR OLUWATOBILOBA OGUNDIPE

**Full-Stack & AI Systems Software Engineer**  
Ibadan, Oyo State, Nigeria · Open to Remote & Relocation  
Email: [ogundipe.victobiloba@gmail.com](mailto:ogundipe.victobiloba@gmail.com) · Phone: +234 704 309 0092  
GitHub: [github.com/victobiloba](https://github.com/victobiloba) · LinkedIn: [linkedin.com/in/victobiloba](https://linkedin.com/in/victobiloba)

---

## PROFESSIONAL SUMMARY

Full-Stack & AI Systems Software Engineer (B.Eng. Computer Engineering) experienced in architecting end-to-end web platforms, evidence-grounded LLM & scholarly-graph engines, fintech/e-commerce payment workflows, and fault-tolerant network/edge systems. Proven ability to own systems from schema and API security to interactive UI and automated verification across TypeScript, React/Next.js, Python/FastAPI, Node.js/Express, and C++/FreeRTOS.

---

## TECHNICAL SKILLS

- **Languages:** TypeScript, Python, JavaScript (ES2024+), C / C++, SQL, HTML5, CSS3
- **Frontend & Graphics:** React 18/19, Next.js 16, Vite, Tailwind CSS, Three.js (WebGL), HTML5 Canvas, Zustand, Leaflet, Progressive Web Apps (PWA)
- **Backend, APIs & Payments:** FastAPI (ASGI), Node.js, Express, Square API (Web Payments SDK, Card Auth/Capture/Void), REST APIs, WebSockets, OAuth 2.0 (PKCE), JWT (HS256)
- **AI, Data & Geospatial:** Gemini API (768-dim Embeddings & Flash), Claude API, OpenAlex & ROR v2 APIs, PyMuPDF4LLM, OSRM, Google Route Matrix, Pandas, NumPy, Scikit-learn, Selenium WebDriver
- **Databases, Infra & Security:** Cloud Firestore, Firebase RTDB, SQLite (WAL), Cloudinary, Nginx (CIDR Perimeter / Reverse Proxy), Docker Compose, AES-256-GCM, Proof-of-Work & Request Signing
- **Embedded, Testing & Tooling:** ESP32-S3, FreeRTOS, I²C/SPI/UART, Vitest, fast-check (Property-Based Testing), Pytest, Node Test Runner, Git, GitHub Actions, Vercel, Render, Linux

---

## SELECTED SOFTWARE ENGINEERING PROJECTS

### **ThesisBridge — Evidence-Grounded Academic Intelligence & Outreach Platform** | *2026 – Present*
*React 18 · TypeScript · Vite · FastAPI · Python 3.11+ · Cloud Firestore · OpenAlex · Gemini & Claude APIs*
- Architected a full-stack graduate admissions intelligence platform resolving institutions via ROR v2 and indexing faculty across the live OpenAlex graph (250M+ scholarly works), enforcing a source-backed-or-empty data contract and an ORCID/publication career-stage gate to eliminate hallucinated faculty.
- Built a dual-document ingestion pipeline (`pymupdf4llm`) parsing thesis PDFs and CVs into a 4-category skill taxonomy, ranking advisor fit via 768-dim Gemini embeddings with Gemini Flash / Claude fallback evaluation and verified NSF/NIH RePORTER grant attribution.
- Engineered default-deny HS256 JWT session auth, an AES-256-GCM token vault, sliding-window IP rate limiting, OAuth 2.0 PKCE Sign-In (zero inbox read/send permissions), a rubric-scored Statement of Purpose Studio (DOCX/PDF export), and an outreach CRM with A/B tone telemetry.

### **Farm Pay — Multi-Tenant E-Commerce Storefront, Wholesale & Farmer Terminal** | *2026*
*Node.js 22 · Express · Square Web Payments SDK · JavaScript · QR Scanner · Automated Mock-API Testing*
- Built a full-stack farm commerce storefront and order terminal powered by the Square API, supporting retail checkout (Apple Pay, Google Pay, cards), access-gated wholesale ordering (case pricing, up to $200k order caps, delivery/pickup scheduling), and direct browser-to-Square PCI-safe card tokenization.
- Engineered a dedicated `/farmer` phone-order portal implementing two-step card-on-file authorization holds with deferred capture upon packing, voiding, signed customer payment links, and mobile QR pickup verification.
- Designed isomorphic browser/server pricing and fulfillment-window modules with full progressive enhancement (100% functional without client JavaScript), verified by an automated `node:test` suite against a mock Square API.

### **MedRoute — Capability-Based Emergency Medical Routing Platform** | *2026*
*TypeScript Monorepo · React 19 PWA · Node.js · Leaflet · OSRM · Google Route Matrix · Vitest · fast-check*
- Developed an Expected Time to Definitive Care (ETDC) routing engine (`POST /v2/routing/evaluate`) directing patients to facilities verified to treat their clinical emergency rather than merely the closest hospital, incorporating stabilize-first triage, an F0–F4 never-empty fallback ladder, capacity leases, and idempotent retries.
- Implemented multi-tier travel-time resolution combining self-hosted OSRM on Nigeria OpenStreetMap road data, circuit-breaker-guarded Google Route Matrix live-traffic refinement with hysteresis, and Haversine `L1` degraded fallback.
- Built a mobile-first React 19 + Leaflet Citizen PWA localized into 5 languages (English, Pidgin, Yoruba, Hausa, Igbo) and verified core routing invariants—non-emptiness, input-order determinism, and capability monotonicity—using `fast-check` property-based testing.

### **Abuja Story — 3D Browser Life Simulation & Anti-Automation Security Engine** | *2026*
*Next.js 16 · React 19 · Three.js · TypeScript · Zustand · Python (OSM Pipeline) · Firebase Admin*
- Built a browser-played 3D city simulation generated from real OpenStreetMap Abuja roads, waterways, parks, and Aso Rock geometry via a custom Python pipeline (`build-abuja-map.py`), featuring real road-network ride routing (`roadGraph.ts`), procedural theme synthesis, end-to-end message encryption, and multiplayer social/economic systems.
- Engineered a defense-in-depth anti-scraping and anti-bot guard (`lib/guard/`): Proof-of-Work `/api/handshake` passes, WebDriver/CDP headless browser detection, ephemeral in-memory request signing keys preventing `curl` cookie replay, synthetic DOM input rejection, and production bundle obfuscation.

### **NetShare LAN — Subnet-Isolated File Sharing & Media Streaming Infrastructure** | *2026*
*Python · FastAPI · Nginx · WebSockets · SQLite (WAL) · Cryptography · Docker Compose · Pytest*
- Engineered a defense-in-depth intranet file-sharing system pairing an Nginx RFC1918 CIDR reverse-proxy perimeter with FastAPI middleware that dynamically introspects host NICs to enforce strict same-subnet (`STRICT_SAME_SUBNET`) isolation and audit blocked WAN requests.
- Implemented a 5 MB chunked multi-gigabyte upload pipeline with SHA-256 integrity verification, HTTP 206 Partial Content byte-range video/audio streaming, real-time WebSocket LAN peer presence, and SQLite WAL multi-user authentication.

### **Codebase DNA — Interactive GitHub Repository Organism & Dead-Code Visualizer** | *2026*
*JavaScript (ES Modules) · HTML5 Canvas · Static Dependency Analysis · Node.js*
- Built a zero-dependency static-analysis and physics-driven Canvas engine mapping GitHub repositories into living organisms—rendering modules as organs, files as byte-scaled cells across 15+ languages, internal imports as veins, high fan-in files as stress hotspots, and unreferenced code as scar tissue.
- Designed framework-aware entrypoint heuristics (Next.js/Nuxt/SvelteKit App Router, Django/Celery autodiscovery, test suites) and per-language stdlib filters to prevent false-positive dead-code flags, with Markdown health report and PNG export.

### **HerdSense — Edge-ML Wearable Biosensing & Cloud Telemetry System** | *Mar 2026 – Aug 2026*
*C++ · ESP32-S3 · FreeRTOS · LittleFS · Firebase RTDB · EasyEDA PCB · Web Dashboard* · [github.com/victobiloba/HerdSense](https://github.com/victobiloba/HerdSense)
- Built an end-to-end wearable biosensing system: 4-task mutex-guarded FreeRTOS firmware sampling PPG (MAX30102), IR thermometry (MLX90614), 6-axis IMU (25 Hz), and ToF contact-gating (VL53L0X) across a dual I²C bus, running C++ DFT spectral extraction on-device.
- Engineered an offline-first LittleFS flash ring buffer (~3 days capacity) with bulk Firebase RTDB resync, custom EasyEDA PCB, and a web dashboard featuring 1h/24h telemetry views, CSV export, and Telegram physiological threshold alerts.

---

## WORK EXPERIENCE & OPEN SOURCE

### **Freelance Software Automation Engineer** — *Independent Contract (Remote, Nigeria)* | *Sep 2024 – Feb 2025*
- Architected and delivered a Python & Selenium WebDriver browser automation system handling authenticated session lifecycle, dynamic DOM synchronization, and structured data extraction.
- Built automated validation and cleaning pipelines with Pandas and NumPy, owning end-to-end requirements, testing, and client delivery under a fixed-term contract.

### **Open-Source Contributor** — *sciencecorp/synapse-python (Science Corp, Remote)* | *Oct 2026*
*Python · gRPC Simulator · BCI Device Client*
- Diagnosed and patched a `SpikeSource` simulator startup crash in Science Corp's Python BCI device client (`synapse-python`).

---

## EDUCATION & PUBLICATIONS

- **B.Eng. Computer Engineering** — *Federal University of Technology Akure (FUTA), Nigeria* | *Oct 2020 – Expected Nov 2026*  
  **Second Class Upper Honours** · Coursework: Data Structures & Algorithms, Computer Networks, Embedded Systems, Digital Signal Processing, Digital Systems Design.
- **Publication:** Ogundipe, V.O., & Adedokun, A. *"Development of an IoT-based Wearable Device for Real-Time Health and Activities Monitoring of Native Fulani Cattle."* **2026 IEEE NIGERCON**, Lagos, Nigeria *(Conditionally accepted)*.
- **Machine Learning Training:** Applied Machine Learning Fellow, *AI Federax* (2024–2025), a year-long applied ML programme.
