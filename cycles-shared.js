/* CYCLES — shared chrome injection + wiring.

   Every page (Data Manager, Owners Manual, Contact, future static pages)
   loads this file. It:
     1. Reads <body data-page="app|manual|contact">.
     2. Injects header, menu drawer, and footer HTML into empty slots
        (#header, #menu-dropdown, #site-footer).
     3. Wires the theme toggle + menu drawer.
     4. Dispatches 'cycles:themechange' so the main app can react to
        theme flips (viewer redraw, per-theme shadow-color override).
     5. Reveals the page by adding `.cycles-ready` to <body> — pairs
        with the `visibility: hidden` rule in cycles-shared.css.

   Include as a classic script (no defer) placed AFTER the slot elements
   in <body> but BEFORE any inline page script that queries those
   elements. innerHTML is applied synchronously, so inline scripts
   further down the page can safely use getElementById. */

(function() {
    const body = document.body;
    const page = (body && body.dataset && body.dataset.page) || 'app';
    const isApp = page === 'app';

    // ── Logo SVG (inline — the st0/st1 classes pick up --brand-red /
    //    --logo-dark, so the same SVG renders light and dark). ──
    const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 136.73 23.06" width="28em">
      <defs><style>.st0{fill:var(--brand-red)}.st1{fill:var(--logo-dark)}</style></defs>
      <g>
        <path class="st1" d="M20.33,7.28h-7.12c-1.85,0-3.23.26-4.14.77-1.19.67-1.78,1.84-1.78,3.52s.6,2.82,1.8,3.46c.88.47,2.25.71,4.11.71h11.89c.41,0,.94-.26,1.59-.77.09-.07.56-.48,1.4-1.24l-6.7-6.07c-.29-.26-.64-.39-1.05-.39ZM20.2,13.56h-6.99c-2.07,0-3.26-.31-3.58-.95-.1-.2-.15-.54-.15-1.03,0-.56.07-.95.21-1.18.38-.62,1.55-.92,3.51-.92h6.94l4.47,4.08h-4.42Z"/>
        <path class="st1" d="M103.36,0h-18.79c-2.13,0-3.96.74-5.47,2.22-1.52,1.48-2.27,3.29-2.27,5.41v5.92h-5.92V0h-2.19v13.54c0,.61.21,1.13.64,1.56.43.43.95.65,1.55.65h8.15c-.01-.15-.04-.3-.04-.46v-7.54c0-1.53.54-2.83,1.63-3.92,1.09-1.09,2.4-1.63,3.92-1.63h52.15V0h-33.36Z"/>
        <path class="st1" d="M95.62,13.56h-11.51v1.2c0,.3.11.54.33.73.2.17.45.26.76.26h26.14c.41,0,.61-.21.61-.62,0-.32-.2-.55-.61-.71-.43-.17-1.07-.3-1.91-.42-.26-.04-.93-.11-1.99-.21-2.93-.3-5.03-.72-6.29-1.27-2.23-.95-3.34-2.54-3.34-4.77,0-.16.03-.31.04-.46h-12.64c-.31,0-.56.09-.76.26-.22.19-.33.43-.33.73v1.2h11.7c.09.4.21.79.37,1.16.27.64.64,1.23,1.11,1.76.38.42.81.81,1.31,1.16h-3Z"/>
        <path class="st1" d="M103.37,7.95c0,.34.28.57.83.71,1.1.18,1.93.3,2.51.35,2.33.26,3.8.44,4.42.56,1.78.35,3.13.89,4.07,1.62,1.19.93,1.78,2.22,1.78,3.86s-.57,2.96-1.71,4.09c-1.14,1.13-2.51,1.7-4.1,1.7h-26.6l-5.47-.03-19.15.03h-3.32c-3.3,0-5.9-.7-7.79-2.09-2.15-1.58-3.22-3.97-3.22-7.17,0-1.64.29-3.07.85-4.3h-3.06c-.41,0-.79.16-1.15.48l-12.48,11.23c-1.37,1.23-2.93,1.85-4.68,1.85h-11.89c-3.3,0-5.9-.7-7.79-2.09-2.15-1.58-3.22-3.97-3.22-7.17s1.07-5.6,3.21-7.22c1.91-1.45,4.51-2.17,7.8-2.17h7.12c1.74,0,3.24.57,4.49,1.7l7.04,6.36,6.97-6.28c1.31-1.18,2.84-1.77,4.59-1.77h18.02v5.09h-4.8c-1.85,0-3.23.26-4.14.77-1.19.67-1.78,1.84-1.78,3.52s.6,2.82,1.8,3.46c.88.47,2.25.71,4.11.71h6.99V0h-20.21c-2.3,0-4.32.78-6.05,2.34l-5.5,4.95-5.56-5.03c-1.68-1.51-3.67-2.27-5.97-2.27h-7.12c-3.92,0-7.04.93-9.37,2.78C1.28,4.82,0,7.76,0,11.58s1.28,6.75,3.85,8.75c2.31,1.8,5.43,2.71,9.36,2.71h4.8v.02h7.09c2.31,0,4.36-.81,6.14-2.43l12.28-11.15h.06c-.1.67-.16,1.37-.16,2.11,0,3.83,1.28,6.75,3.85,8.75,2.31,1.8,5.43,2.71,9.36,2.71h54.54c2.21,0,4.09-.78,5.66-2.34,1.56-1.56,2.35-3.44,2.35-5.65,0-1.1-.24-2.15-.73-3.14-.48-.99-1.17-1.8-2.05-2.43h20.32v-2.19h-32.69c-.44.01-.67.23-.67.67ZM56.63,13.56c-2.07,0-3.26-.31-3.58-.95-.1-.2-.15-.54-.15-1.03,0-.56.07-.95.21-1.18.38-.62,1.55-.92,3.51-.92h4.8v4.08h-4.8Z"/>
      </g>
      <path class="st0" d="M56.63,19.39h54.54c1.2,0,2.23-.42,3.09-1.27.86-.84,1.28-1.87,1.28-3.07,0-1.9-1.22-3.22-3.65-3.95-.07-.02-2.33-.39-6.78-1.12-2.44-.39-3.65-1.14-3.65-2.23,0-.52.19-.96.56-1.34.38-.38.82-.57,1.34-.57h33.36v-2.19h-52.15c-1.12,0-2.08.42-2.89,1.26-.81.84-1.21,1.82-1.21,2.95v7.33c0,.74.19,1.4.54,2.02h-10.1c-1.01,0-1.87-.36-2.58-1.07-.71-.72-1.06-1.58-1.06-2.59V0h-2.19v13.54c0,1.4.45,2.62,1.31,3.66h-9.76c-2.27,0-4-.36-5.18-1.08-1.47-.91-2.2-2.42-2.2-4.53,0-3.83,2.46-5.75,7.38-5.75h4.8v-2.19h-18.02c-1.42,0-2.63.45-3.64,1.36l-7.92,7.14-7.98-7.22c-.95-.86-2.13-1.29-3.55-1.29h-7.12c-2.88,0-5.13.59-6.77,1.76-1.87,1.35-2.8,3.41-2.8,6.18s.94,4.81,2.82,6.12c1.61,1.12,3.86,1.69,6.76,1.69h11.89c1.42,0,2.66-.48,3.74-1.45l12.47-11.24c.64-.58,1.35-.87,2.11-.87h5.92c-1.52,1.34-2.28,3.25-2.28,5.75,0,2.77.94,4.81,2.82,6.12,1.61,1.12,3.86,1.69,6.76,1.69M27.3,16.24c-.71.64-1.44.96-2.2.96h-11.89c-2.27,0-4-.36-5.18-1.08-1.47-.91-2.2-2.42-2.2-4.53,0-3.83,2.46-5.75,7.38-5.75h7.12c.75,0,1.42.27,2.01.79l7.81,7.06-2.85,2.56ZM102.92,11.57c2.26.36,4.52.72,6.78,1.09,2.44.42,3.65,1.21,3.65,2.4,0,.59-.21,1.1-.64,1.52s-.94.63-1.54.63h-26.6c-.51,0-.96-.23-1.35-.69-.37-.44-.56-.92-.56-1.44v-2.67h14.64c-.48-.53-.84-1.12-1.11-1.76h-13.53v-2.67c0-.52.19-1.01.57-1.46.38-.45.83-.67,1.34-.67h15.19c-.32.58-.49,1.21-.49,1.91,0,1.86,1.22,3.13,3.65,3.82Z"/>
    </svg>`;

    const THEME_TOGGLE_HTML = `
        <label class="theme-toggle" title="Toggle dark mode">
            <input type="checkbox" id="btn-theme" />
            <span class="theme-toggle-track">
                <span class="theme-toggle-label light">LIGHT</span>
                <span class="theme-toggle-label dark">DARK</span>
                <span class="theme-toggle-icon moon" aria-hidden="true">
                    <svg viewBox="0 0 12 12">
                        <mask id="toggle-moon-mask">
                            <rect width="12" height="12" fill="white"/>
                            <circle cx="8.5" cy="4" r="4" fill="black"/>
                        </mask>
                        <circle cx="6" cy="6" r="4.5" fill="currentColor" mask="url(#toggle-moon-mask)"/>
                    </svg>
                </span>
                <span class="theme-toggle-icon sun" aria-hidden="true">
                    <svg viewBox="0 0 12 12" fill="currentColor">
                        <circle cx="6" cy="6" r="2.2"/>
                        <rect x="5.25" y="0"    width="1.5" height="2"/>
                        <rect x="5.25" y="10"   width="1.5" height="2"/>
                        <rect x="0"    y="5.25" width="2"   height="1.5"/>
                        <rect x="10"   y="5.25" width="2"   height="1.5"/>
                        <g transform="rotate(45 6 6)">
                            <rect x="5.25" y="0.5" width="1.5" height="1.8"/>
                            <rect x="5.25" y="9.7" width="1.5" height="1.8"/>
                            <rect x="0.5"  y="5.25" width="1.8" height="1.5"/>
                            <rect x="9.7"  y="5.25" width="1.8" height="1.5"/>
                        </g>
                    </svg>
                </span>
                <span class="theme-toggle-thumb"></span>
            </span>
        </label>`;

    const MENU_BUTTON_HTML = `
        <div id="menu-wrapper">
            <button id="menu-hamburger" aria-label="Menu" aria-expanded="false" aria-controls="menu-dropdown">
                <span class="menu-label">Menu</span>
                <span class="menu-bars"><span></span><span></span><span></span></span>
            </button>
        </div>`;

    // Shadow-picker + ⚙ customizer are webapp-only (index.html wires them).
    const APP_EXTRAS_HTML = `
        <label class="shadow-picker" title="Button shadow color (per theme)">
            <span>SHADOW</span>
            <input type="color" id="btn-shadow-color">
        </label>
        <button id="btn-theme-customize" title="Customize colors">⚙</button>`;

    function logoSub() {
        if (page === 'manual')   return 'Owners Manual';
        if (page === 'tutorial') return 'Tutorial';
        if (page === 'shop')     return 'Shop';
        if (page === 'contact')  return 'Contact';
        if (page === 'v2-spec')  return 'Developer Login';
        return 'Looper Workstation Data Manager';
    }

    function navTab(href, label, key) {
        const active = page === key;
        const cls = 'main-nav-tab' + (active ? ' active' : '');
        const aria = active ? ' aria-current="page"' : '';
        return `<a class="${cls}" href="${href}"${aria} role="menuitem">${label}</a>`;
    }

    function footerLink(href, label, key) {
        const cls = page === key ? ' class="current"' : '';
        return `<a href="${href}"${cls}>${label}</a>`;
    }

    // Contact icons — stroked outlines in currentColor so they inherit
    // fg-muted (rest) / fg (hover) via `color:` on the wrapping <a>.
    const ICON_EMAIL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="1"/>
        <path d="M3 7l9 6 9-6"/>
    </svg>`;
    const ICON_INSTAGRAM = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="4"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17" cy="7" r="0.9" fill="currentColor" stroke="none"/>
    </svg>`;
    // Reddit Snoo — user-provided rounded-badge SVG with the Snoo punched
    // out as negative space. We merge the circle and Snoo subpaths into
    // one `<path>` and use fill-rule="evenodd" so the Snoo interior reads
    // as a hole through the circle (whatever sits behind the SVG shows
    // through). fill="currentColor" tracks the surrounding icon color,
    // matching the email + Instagram hover behavior.
    const ICON_REDDIT = `<svg viewBox="0 0 800 800" aria-hidden="true">
        <path fill="currentColor" fill-rule="evenodd" d="M 0 400 A 400 400 0 1 0 800 400 A 400 400 0 1 0 0 400 Z M666.8 400c.08 5.48-.6 10.95-2.04 16.24s-3.62 10.36-6.48 15.04c-2.85 4.68-6.35 8.94-10.39 12.65s-8.58 6.83-13.49 9.27c.11 1.46.2 2.93.25 4.4a107.268 107.268 0 0 1 0 8.8c-.05 1.47-.14 2.94-.25 4.4 0 89.6-104.4 162.4-233.2 162.4S168 560.4 168 470.8c-.11-1.46-.2-2.93-.25-4.4a107.268 107.268 0 0 1 0-8.8c.05-1.47.14-2.94.25-4.4a58.438 58.438 0 0 1-31.85-37.28 58.41 58.41 0 0 1 7.8-48.42 58.354 58.354 0 0 1 41.93-25.4 58.4 58.4 0 0 1 46.52 15.5 286.795 286.795 0 0 1 35.89-20.71c12.45-6.02 25.32-11.14 38.51-15.3s26.67-7.35 40.32-9.56 27.45-3.42 41.28-3.63L418 169.6c.33-1.61.98-3.13 1.91-4.49.92-1.35 2.11-2.51 3.48-3.4 1.38-.89 2.92-1.5 4.54-1.8 1.61-.29 3.27-.26 4.87.09l98 19.6c9.89-16.99 30.65-24.27 48.98-17.19s28.81 26.43 24.71 45.65c-4.09 19.22-21.55 32.62-41.17 31.61-19.63-1.01-35.62-16.13-37.72-35.67L440 186l-26 124.8c13.66.29 27.29 1.57 40.77 3.82a284.358 284.358 0 0 1 77.8 24.86A284.412 284.412 0 0 1 568 360a58.345 58.345 0 0 1 29.4-15.21 58.361 58.361 0 0 1 32.95 3.21 58.384 58.384 0 0 1 25.91 20.61A58.384 58.384 0 0 1 666.8 400zm-396.96 55.31c2.02 4.85 4.96 9.26 8.68 12.97 3.71 3.72 8.12 6.66 12.97 8.68A40.049 40.049 0 0 0 306.8 480c16.18 0 30.76-9.75 36.96-24.69 6.19-14.95 2.76-32.15-8.68-43.59s-28.64-14.87-43.59-8.68c-14.94 6.2-24.69 20.78-24.69 36.96 0 5.25 1.03 10.45 3.04 15.31zm229.1 96.02c2.05-2 3.22-4.73 3.26-7.59.04-2.87-1.07-5.63-3.07-7.68s-4.73-3.22-7.59-3.26c-2.87-.04-5.63 1.07-7.94 2.8a131.06 131.06 0 0 1-19.04 11.35 131.53 131.53 0 0 1-20.68 7.99c-7.1 2.07-14.37 3.54-21.72 4.39-7.36.85-14.77 1.07-22.16.67-7.38.33-14.78.03-22.11-.89a129.01 129.01 0 0 1-21.64-4.6c-7.08-2.14-13.95-4.88-20.56-8.18s-12.93-7.16-18.89-11.53c-2.07-1.7-4.7-2.57-7.38-2.44s-5.21 1.26-7.11 3.15c-1.89 1.9-3.02 4.43-3.15 7.11s.74 5.31 2.44 7.38c7.03 5.3 14.5 9.98 22.33 14s16 7.35 24.4 9.97 17.01 4.51 25.74 5.66c8.73 1.14 17.54 1.53 26.33 1.17 8.79.36 17.6-.03 26.33-1.17A153.961 153.961 0 0 0 476.87 564c7.83-4.02 15.3-8.7 22.33-14zm-7.34-68.13c5.42.06 10.8-.99 15.81-3.07 5.01-2.09 9.54-5.17 13.32-9.06s6.72-8.51 8.66-13.58A39.882 39.882 0 0 0 532 441.6c0-16.18-9.75-30.76-24.69-36.96-14.95-6.19-32.15-2.76-43.59 8.68s-14.87 28.64-8.68 43.59c6.2 14.94 20.78 24.69 36.96 24.69z"/>
    </svg>`;

    // Email trigger: default `mailto:` (fires on mobile tap); desktop hover
    // reveals a small dropdown with Gmail / Outlook-web / copy alternatives
    // since we can't detect which mail handler a visitor prefers.
    const EMAIL_ADDR = 'info@TwoSeam.com';
    const EMAIL_ENC = encodeURIComponent(EMAIL_ADDR);
    const emailMenuHTML = `
    <div class="email-menu">
        <a href="mailto:${EMAIL_ADDR}" class="email-menu-trigger" aria-label="Email" title="${EMAIL_ADDR}">${ICON_EMAIL}</a>
        <div class="email-menu-dropdown-wrap">
            <ul class="email-menu-dropdown">
                <li><a href="mailto:${EMAIL_ADDR}">Default mail</a></li>
                <li><a href="https://mail.google.com/mail/?view=cm&to=${EMAIL_ENC}" target="_blank" rel="noopener noreferrer">Gmail</a></li>
                <li><a href="https://outlook.live.com/mail/0/deeplink/compose?to=${EMAIL_ENC}" target="_blank" rel="noopener noreferrer">Outlook</a></li>
                <li><button type="button" class="email-copy-btn" data-default-label="Copy address">Copy address</button></li>
            </ul>
        </div>
    </div>`;

    const headerHTML = `
    <a id="logo" href="index.html" aria-label="CYCLES — home">
        ${LOGO_SVG}
        <div id="logo-sub">${logoSub()}</div>
    </a>
    <div id="header-right">
        <div id="theme-controls">
            ${THEME_TOGGLE_HTML}
            ${isApp ? APP_EXTRAS_HTML : ''}
            ${MENU_BUTTON_HTML}
        </div>
        ${isApp ? '<div id="card-status">Checking for CYCLES card…</div>' : ''}
    </div>`;

    const menuDropdownHTML = `
    <div class="menu-dropdown-inner">
        ${navTab('index.html',    'Data Manager',     'app')}
        ${navTab('manual.html',   'Owners Manual',    'manual')}
        ${navTab('tutorial.html', 'Tutorial',         'tutorial')}
        ${navTab('shop.html',     'Shop',             'shop')}
        ${navTab('contact.html',  'Contact',          'contact')}
        ${navTab('v2-spec.html',  'Developer Login',  'v2-spec')}
        <div class="main-nav-socials">
            <button type="button" class="main-nav-email-toggle" aria-label="Email options" aria-expanded="false" aria-controls="main-nav-email-submenu">${ICON_EMAIL}</button>
            <a href="https://www.instagram.com/michaelmartinkc/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram">${ICON_INSTAGRAM}</a>
            <a href="https://www.reddit.com/user/TwoSeam/" target="_blank" rel="noopener noreferrer" aria-label="Reddit" title="Reddit">${ICON_REDDIT}</a>
        </div>
        <div id="main-nav-email-submenu" class="main-nav-email-submenu">
            <div class="main-nav-email-submenu-inner">
                <a class="main-nav-tab main-nav-tab-sub" href="mailto:${EMAIL_ADDR}">Default Mail</a>
                <a class="main-nav-tab main-nav-tab-sub" href="https://mail.google.com/mail/?view=cm&to=${EMAIL_ENC}" target="_blank" rel="noopener noreferrer">Gmail</a>
                <a class="main-nav-tab main-nav-tab-sub" href="https://outlook.live.com/mail/0/deeplink/compose?to=${EMAIL_ENC}" target="_blank" rel="noopener noreferrer">Outlook</a>
                <button type="button" class="main-nav-tab main-nav-tab-sub email-copy-btn" data-default-label="Copy Address">Copy Address</button>
            </div>
        </div>
    </div>`;

    const footerHTML = `
    <div class="footer-top">
        <nav class="footer-nav">
            ${footerLink('index.html',    'Data Manager',     'app')}
            ${footerLink('manual.html',   'Owners Manual',    'manual')}
            ${footerLink('tutorial.html', 'Tutorial',         'tutorial')}
            ${footerLink('shop.html',     'Shop',             'shop')}
            ${footerLink('contact.html',  'Contact',          'contact')}
            ${footerLink('v2-spec.html',  'Developer Login',  'v2-spec')}
        </nav>
        <div class="footer-contact">
            ${emailMenuHTML}
            <a href="https://www.instagram.com/michaelmartinkc/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram">${ICON_INSTAGRAM}</a>
            <a href="https://www.reddit.com/user/TwoSeam/" target="_blank" rel="noopener noreferrer" aria-label="Reddit" title="Reddit">${ICON_REDDIT}</a>
        </div>
    </div>
    <div class="footer-copyright">© 2026 TwoSeam, LLC. All rights reserved.</div>`;

    // ── Inject into slots ──────────────────────────────────────────────
    const headerSlot = document.getElementById('header');
    if (headerSlot) headerSlot.innerHTML = headerHTML;

    const menuSlot = document.getElementById('menu-dropdown');
    if (menuSlot) {
        menuSlot.setAttribute('role', 'menu');
        menuSlot.innerHTML = menuDropdownHTML;
    }

    const footerSlot = document.getElementById('site-footer');
    if (footerSlot) footerSlot.innerHTML = footerHTML;

    // ── Theme toggle ───────────────────────────────────────────────────
    (function() {
        const btn = document.getElementById('btn-theme');
        if (!btn) return;
        const saved = localStorage.getItem('cycles-theme');
        if (saved === 'dark') {
            document.body.classList.add('dark');
            btn.checked = true;
        }
        btn.addEventListener('change', () => {
            const dark = btn.checked;
            document.body.classList.toggle('dark', dark);
            localStorage.setItem('cycles-theme', dark ? 'dark' : 'light');
            // Hook for page-specific handlers (index.html uses this to
            // redraw the waveform viewer and reapply per-theme shadow).
            window.dispatchEvent(new CustomEvent('cycles:themechange', { detail: { dark } }));
        });
    })();

    // ── Menu drawer ────────────────────────────────────────────────────
    (function() {
        const btn = document.getElementById('menu-hamburger');
        const dropdown = document.getElementById('menu-dropdown');
        const wrapper = document.getElementById('menu-wrapper');
        if (!btn || !dropdown || !wrapper) return;

        const close = () => {
            dropdown.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
        };
        const open = () => {
            dropdown.classList.add('open');
            btn.setAttribute('aria-expanded', 'true');
        };
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.contains('open') ? close() : open();
        });
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target) && !dropdown.contains(e.target)) close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') close();
        });
    })();

    // ── Email submenu toggle (header nav drawer) ───────────────────────
    (function() {
        const toggle = document.querySelector('#menu-dropdown .main-nav-email-toggle');
        const submenu = document.getElementById('main-nav-email-submenu');
        if (!toggle || !submenu) return;
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = submenu.classList.toggle('open');
            toggle.setAttribute('aria-expanded', String(isOpen));
        });
    })();

    // ── "Copy address" buttons (footer dropdown + header nav submenu) ──
    (function() {
        const btns = document.querySelectorAll('.email-copy-btn');
        if (!btns.length) return;
        btns.forEach((btn) => {
            btn.addEventListener('click', async () => {
                const label = btn.dataset.defaultLabel || btn.textContent;
                try {
                    await navigator.clipboard.writeText(EMAIL_ADDR);
                    btn.textContent = 'Copied!';
                } catch {
                    btn.textContent = 'Copy failed';
                }
                btn.disabled = true;
                setTimeout(() => {
                    btn.textContent = label;
                    btn.disabled = false;
                }, 1400);
            });
        });
    })();

    // Reveal the page now that chrome is mounted.
    body.classList.add('cycles-ready');
})();
