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
    // Official Reddit Snoo — source: simpleicons.org (CC0), fill swapped
    // to currentColor so it tracks the surrounding fg-muted / fg state.
    const ICON_REDDIT = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-2.286 2.286C.775 23.225 1.097 24 1.738 24H12c6.627 0 12-5.373 12-12S18.627 0 12 0Zm4.388 3.199c1.104 0 1.999.895 1.999 1.999 0 1.105-.895 2-1.999 2-.946 0-1.739-.657-1.947-1.539v.002c-1.147.162-2.032 1.15-2.032 2.341v.007c1.776.067 3.4.567 4.686 1.363.473-.363 1.064-.58 1.707-.58 1.547 0 2.802 1.254 2.802 2.802 0 1.117-.655 2.081-1.601 2.531-.088 3.256-3.637 5.876-7.997 5.876-4.361 0-7.905-2.617-7.998-5.87-.954-.447-1.614-1.415-1.614-2.538 0-1.548 1.255-2.802 2.803-2.802.645 0 1.239.218 1.712.585 1.275-.79 2.881-1.291 4.64-1.365v-.01c0-1.663 1.263-3.034 2.88-3.207.188-.911.993-1.595 1.959-1.595Zm-8.085 8.376c-.784 0-1.459.78-1.506 1.797-.047 1.016.64 1.429 1.426 1.429.786 0 1.371-.369 1.418-1.385.047-1.017-.553-1.841-1.338-1.841Zm7.406 0c-.786 0-1.385.824-1.338 1.841.047 1.017.634 1.385 1.418 1.385.785 0 1.473-.413 1.426-1.429-.046-1.017-.721-1.797-1.506-1.797Zm-3.703 4.013c-.974 0-1.907.048-2.77.135-.147.015-.241.168-.183.305.483 1.154 1.622 1.964 2.953 1.964 1.33 0 2.47-.81 2.953-1.964.057-.137-.037-.29-.184-.305-.863-.087-1.795-.135-2.769-.135Z"/>
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
        ${navTab('index.html',    'Data Manager',   'app')}
        ${navTab('manual.html',   'Owners Manual',  'manual')}
        ${navTab('tutorial.html', 'Tutorial',       'tutorial')}
        ${navTab('shop.html',     'Shop',           'shop')}
        ${navTab('contact.html',  'Contact',        'contact')}
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
            ${footerLink('index.html',    'Data Manager',   'app')}
            ${footerLink('manual.html',   'Owners Manual',  'manual')}
            ${footerLink('tutorial.html', 'Tutorial',       'tutorial')}
            ${footerLink('shop.html',     'Shop',           'shop')}
            ${footerLink('contact.html',  'Contact',        'contact')}
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
