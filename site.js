const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('[data-menu-toggle]');
const mobileMenu = document.querySelector('[data-mobile-menu]');

function focusable(container) {
  return [...container.querySelectorAll('a[href], button:not([disabled]), audio[controls], [tabindex]:not([tabindex="-1"])')];
}

function closeMenu({ restoreFocus = false } = {}) {
  if (!menuButton || !mobileMenu) return;
  mobileMenu.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
  document.body.classList.remove('menu-open');
  if (restoreFocus) menuButton.focus();
}

function openMenu() {
  if (!menuButton || !mobileMenu) return;
  mobileMenu.hidden = false;
  menuButton.setAttribute('aria-expanded', 'true');
  menuButton.setAttribute('aria-label', 'Close menu');
  document.body.classList.add('menu-open');
  mobileMenu.querySelector('a')?.focus();
}

menuButton?.addEventListener('click', () => mobileMenu.hidden ? openMenu() : closeMenu({ restoreFocus: true }));

const drawer = document.querySelector('[data-reader-drawer]');
const drawerPanel = drawer?.querySelector('.reader-drawer-panel');
const drawerOpen = document.querySelector('[data-reader-open]');
let drawerScroll = 0;

function openDrawer() {
  if (!drawer || !drawerPanel || !drawerOpen) return;
  drawerScroll = window.scrollY;
  drawer.hidden = false;
  drawerOpen.setAttribute('aria-expanded', 'true');
  document.body.style.top = `-${drawerScroll}px`;
  document.body.classList.add('drawer-open');
  drawerPanel.focus({ preventScroll: true });
}

function closeDrawer({ restoreFocus = true } = {}) {
  if (!drawer || drawer.hidden) return;
  drawer.hidden = true;
  drawerOpen?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('drawer-open');
  document.body.style.top = '';
  window.scrollTo(0, drawerScroll);
  if (restoreFocus) drawerOpen?.focus({ preventScroll: true });
}

drawerOpen?.addEventListener('click', openDrawer);
drawer?.querySelectorAll('[data-reader-close]').forEach(button => button.addEventListener('click', () => closeDrawer()));

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (drawer && !drawer.hidden) { event.preventDefault(); closeDrawer(); return; }
    if (mobileMenu && !mobileMenu.hidden) { event.preventDefault(); closeMenu({ restoreFocus: true }); }
  }
  if (event.key !== 'Tab') return;
  const activeContainer = drawer && !drawer.hidden ? drawerPanel : mobileMenu && !mobileMenu.hidden ? mobileMenu : null;
  if (!activeContainer) return;
  const items = focusable(activeContainer);
  if (!items.length) return;
  const first = items[0];
  const last = items.at(-1);
  if (document.activeElement === activeContainer) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 980) closeMenu();
  if (window.innerWidth > 760) closeDrawer({ restoreFocus: false });
});

const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 10);
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

const privacyButtons = [...document.querySelectorAll('[data-privacy-example]')];
const privacyMode = document.querySelector('[data-result-mode]');
const privacyText = document.querySelector('[data-result-text]');
const privacyList = document.querySelector('[data-result-list]');

function updatePrivacy(button) {
  privacyButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  if (!privacyMode || !privacyText || !privacyList) return;
  privacyMode.textContent = button.dataset.mode;
  privacyText.textContent = button.dataset.result;
  privacyList.replaceChildren(...button.dataset.shares.split('|').map(value => {
    const item = document.createElement('li');
    item.textContent = value;
    return item;
  }));
}

privacyButtons.forEach(button => button.addEventListener('click', () => updatePrivacy(button)));
if (privacyButtons[0]) updatePrivacy(privacyButtons[0]);

const audioPlayers = [...document.querySelectorAll('audio')];
audioPlayers.forEach(player => player.addEventListener('play', () => {
  audioPlayers.forEach(other => {
    if (other !== player && !other.paused) other.pause();
  });
}));

document.querySelectorAll('[data-device-carousel]').forEach(carousel => {
  const slides = [...carousel.querySelectorAll('[data-carousel-slide]')];
  const previous = carousel.querySelector('[data-carousel-prev]');
  const next = carousel.querySelector('[data-carousel-next]');
  const current = carousel.querySelector('[data-carousel-current]');
  let index = 0;

  function show(target) {
    index = Math.max(0, Math.min(target, slides.length - 1));
    carousel.dataset.carouselIndex = String(index);
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === index;
      slide.hidden = !active;
      slide.setAttribute('aria-hidden', String(!active));
    });
    if (current) current.textContent = String(index + 1);
    if (previous) previous.disabled = index === 0;
    if (next) next.disabled = index === slides.length - 1;
  }

  previous?.addEventListener('click', () => show(index - 1));
  next?.addEventListener('click', () => show(index + 1));
  carousel.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      show(index - 1);
      previous?.focus();
    }
    if (event.key === 'ArrowRight' && index < slides.length - 1) {
      event.preventDefault();
      show(index + 1);
      next?.focus();
    }
  });
  show(0);
});

const readerAudioMenu = document.querySelector('[data-reader-audio-menu]');
const readerAudioPanel = document.querySelector('[data-reader-audio-panel]');

function setReaderAudioPanel(open, { focusFirst = false } = {}) {
  if (!readerAudioMenu || !readerAudioPanel) return;
  readerAudioPanel.hidden = !open;
  readerAudioMenu.setAttribute('aria-expanded', String(open));
  if (open && focusFirst) readerAudioPanel.querySelector('[data-compact-audio-trigger]')?.focus();
}

readerAudioMenu?.addEventListener('click', () => {
  setReaderAudioPanel(readerAudioPanel?.hidden ?? true, { focusFirst: true });
});

function activateCompactAudio(trigger, { autoplay = true } = {}) {
  const targetId = trigger?.dataset.audioTarget;
  const target = targetId ? document.getElementById(targetId) : null;
  if (!target || !readerAudioPanel) return;
  readerAudioPanel.querySelectorAll('[data-compact-audio-trigger]').forEach(button => {
    button.setAttribute('aria-pressed', String(button === trigger));
  });
  readerAudioPanel.querySelectorAll('[data-compact-audio-player]').forEach(container => {
    const active = container === target;
    container.hidden = !active;
    if (!active) container.querySelector('audio')?.pause();
  });
  if (autoplay) target.querySelector('audio')?.play().catch(() => {});
}

document.querySelectorAll('[data-compact-audio-trigger]').forEach(trigger => {
  trigger.addEventListener('click', () => activateCompactAudio(trigger));
});

if (window.location.hash === '#story-audio') {
  setReaderAudioPanel(true);
  activateCompactAudio(readerAudioPanel?.querySelector('[data-audio-kind="story"]'), { autoplay: false });
}
