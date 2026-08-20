const invitationView = document.getElementById('invitation-view');
const rsvpView = document.getElementById('rsvp-view');
const rsvpBtn = document.getElementById('rsvp-btn');
const rsvpContent = document.getElementById('rsvp-content');
const rsvpSubmit = document.getElementById('rsvp-submit');
const rsvpForm = document.getElementById('rsvp-form');
const successMessage = document.getElementById('success-message');
const successTitle = document.getElementById('success-title');
const successBody = document.getElementById('success-body');
const successCard = document.getElementById('success-card');
const envelopeIntro = document.getElementById('envelope-intro');
const appShell = document.querySelector('.app-shell');

const REVEAL_START_MS = 4200;
const INTRO_END_MS = 4800;

function readSafeInset(name) {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;
}

function updateViewportScale() {
  const root = document.documentElement;
  const shell = document.querySelector('.app-shell');

  if (shell && shell.clientWidth > 0 && shell.clientHeight > 0) {
    root.style.setProperty('--avail-w', `${shell.clientWidth}px`);
    root.style.setProperty('--avail-h', `${shell.clientHeight}px`);
    return;
  }

  const viewport = window.visualViewport;

  if (!viewport) {
    root.style.removeProperty('--avail-w');
    root.style.removeProperty('--avail-h');
    return;
  }

  const safeTop = readSafeInset('--safe-top');
  const safeRight = readSafeInset('--safe-right');
  const safeBottom = readSafeInset('--safe-bottom');
  const safeLeft = readSafeInset('--safe-left');
  const availWidth = Math.max(viewport.width - safeLeft - safeRight, 0);
  const availHeight = Math.max(viewport.height - safeTop - safeBottom, 0);

  root.style.setProperty('--avail-w', `${availWidth}px`);
  root.style.setProperty('--avail-h', `${availHeight}px`);
}

function bindViewportScaleUpdates() {
  updateViewportScale();
  window.addEventListener('resize', updateViewportScale);
  window.addEventListener('orientationchange', () => {
    window.setTimeout(updateViewportScale, 150);
  });
  window.visualViewport?.addEventListener('resize', updateViewportScale);
  window.visualViewport?.addEventListener('scroll', updateViewportScale);

  const shell = document.querySelector('.app-shell');
  if (shell && typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(updateViewportScale).observe(shell);
  }
}

bindViewportScaleUpdates();

function finishIntro() {
  envelopeIntro.classList.add('is-complete');
  document.body.classList.remove('is-intro-active');

  window.setTimeout(() => {
    envelopeIntro.remove();
  }, 700);
}

function startReveal() {
  envelopeIntro.classList.add('is-revealing');
  appShell.classList.remove('is-app-hidden');
  appShell.classList.add('is-app-visible');
  requestAnimationFrame(updateViewportScale);
}

function playEnvelopeIntro() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    envelopeIntro.remove();
    appShell.classList.remove('is-app-hidden');
    requestAnimationFrame(updateViewportScale);
    return;
  }

  document.body.classList.add('is-intro-active');
  window.setTimeout(startReveal, REVEAL_START_MS);
  window.setTimeout(finishIntro, INTRO_END_MS);
}

playEnvelopeIntro();

function setRsvpDecosVisible(visible) {
  rsvpView.querySelectorAll('.deco').forEach((el) => {
    el.hidden = !visible;
  });
}

const rsvpError = document.getElementById('rsvp-error');
const RSVP_SCRIPT_URL = window.RSVP_CONFIG?.scriptUrl?.trim() || '';

function setRsvpSubmitting(isSubmitting) {
  rsvpSubmit.disabled = isSubmitting;
  rsvpSubmit.textContent = isSubmitting ? 'Submitting...' : 'Submit';
}

function setRsvpError(message) {
  if (!rsvpError) {
    return;
  }

  if (message) {
    rsvpError.textContent = message;
    rsvpError.hidden = false;
    return;
  }

  rsvpError.textContent = '';
  rsvpError.hidden = true;
}

async function submitRsvp({ name, attending }) {
  if (!RSVP_SCRIPT_URL) {
    throw new Error('RSVP is not connected yet. Please try again in a moment.');
  }

  const response = await fetch(RSVP_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({ name, attending }),
  });

  const responseText = await response.text();
  let result = null;

  try {
    result = JSON.parse(responseText);
  } catch {
    if (responseText.includes('doPost')) {
      throw new Error('RSVP could not be saved. The sheet connection needs to be updated.');
    }

    throw new Error('Could not save your RSVP. Please try again.');
  }

  if (!response.ok || !result?.ok || result?.message) {
    throw new Error(result?.error || 'Could not save your RSVP. Please try again.');
  }
}

function showRsvpSuccess({ isAttending, firstName }) {
  if (isAttending) {
    successTitle.textContent = "Can't wait!";
    successBody.textContent = `Thanks, ${firstName}!\nI'll save you a seat (& a drink) 🍷`;
    successCard.hidden = false;
  } else {
    successTitle.textContent = 'Thanks for letting me know';
    successBody.textContent = `Appreciate the note, ${firstName}. We'll miss you at dinner, but hope our paths cross again soon 💌`;
    successCard.hidden = true;
  }

  rsvpContent.hidden = true;
  rsvpSubmit.hidden = true;
  rsvpForm.hidden = true;
  successMessage.hidden = false;
  rsvpView.classList.add('is-success');
  setRsvpDecosVisible(false);
  requestAnimationFrame(updateViewportScale);
}

function restartDecoAnimations() {
  rsvpView.querySelectorAll('.deco').forEach((el) => {
    el.style.animation = 'none';
    void el.offsetHeight;
    el.style.removeProperty('animation');
  });
}

function showView(view) {
  invitationView.classList.toggle('view--active', view === 'invitation');
  invitationView.hidden = view !== 'invitation';

  rsvpView.classList.toggle('view--active', view === 'rsvp');
  rsvpView.hidden = view !== 'rsvp';

  if (view === 'rsvp') {
    rsvpView.classList.remove('is-success');
    setRsvpDecosVisible(true);
    rsvpContent.hidden = false;
    rsvpSubmit.hidden = false;
    rsvpForm.hidden = false;
    successMessage.hidden = true;
    successCard.hidden = true;
    rsvpForm.reset();
    setRsvpError('');
    setRsvpSubmitting(false);
    requestAnimationFrame(() => {
      restartDecoAnimations();
      updateViewportScale();
    });
  }

  requestAnimationFrame(updateViewportScale);

  window.scrollTo({ top: 0, behavior: 'instant' });
}

rsvpBtn.addEventListener('click', () => showView('rsvp'));

rsvpForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setRsvpError('');

  const nameInput = rsvpForm.elements.name;
  const trimmedName = nameInput.value.trim();

  nameInput.value = trimmedName;

  if (!trimmedName) {
    nameInput.setCustomValidity('Please enter your name.');
    nameInput.reportValidity();
    return;
  }

  nameInput.setCustomValidity('');

  if (!rsvpForm.attending.value) {
    rsvpForm.reportValidity();
    return;
  }

  const isAttending = rsvpForm.attending.value === 'yes';
  const firstName = trimmedName.split(/\s+/)[0];

  setRsvpSubmitting(true);

  try {
    await submitRsvp({
      name: trimmedName,
      attending: rsvpForm.attending.value,
    });
    showRsvpSuccess({ isAttending, firstName });
  } catch (error) {
    setRsvpError(error.message || 'Could not save your RSVP. Please try again.');
  } finally {
    setRsvpSubmitting(false);
  }
});
