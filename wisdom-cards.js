(function () {
  /* Kid-friendly definitions for every tactic on the Wisdom Map. */
  const DEFS = {
    'phy-nutrition': 'Fueling your body with good food so you have energy to grow, play and think.',
    'phy-exercise': 'Moving your body a little every day so you get strong, fast and healthy.',
    'phy-nature': 'Getting outside, looking closely, and letting the natural world calm and refresh you.',
    'phy-protection': 'Learning how to keep yourself and the people around you safe.',
    'self-handy': 'Knowing how to fix, build and take care of things at home.',
    'self-survival': 'Being ready for emergencies: staying calm, finding your way, and helping when something goes wrong.',
    'agy-hard': 'Choosing difficult things on purpose, because that is how you grow strong and brave.',
    'int-learn': 'Staying curious and getting better at how you learn, for your whole life.',
    'int-read': 'Feeding your mind with good books and ideas, a little every day.',
    'int-art': 'Making something new, and finishing it.',
    'self-decide': 'You get to choose, and your choices shape who you become.',
    'self-money': 'Earning, saving, giving and spending wisely.',
    'self-provide': 'Making sure the people you love have what they need.',
    'agy-exec': 'Getting things done: turning a plan into action, one step at a time.',
    'rel-tolerance': 'Welcoming people who are different from you, and choosing your own attitude.',
    'rel-expectation': 'Believing in someone and expecting their best, while helping them get there.',
    'rel-chastising': 'Caring about someone enough to tell them the truth kindly, even when it is hard.',
    'rel-selfless': 'Putting other people’s needs ahead of your own.',
    'com-deep': 'Really listening and sharing ideas, so you understand each other.',
    'com-speak': 'Sharing your ideas clearly and bravely with a group.',
    'com-write': 'Putting your thoughts on paper so you can see them and share them clearly.',
    'com-gather': 'Bringing people together on purpose, so everyone feels welcome.',
    'com-civic': 'Serving and helping in your neighborhood and community.',
    'god-covenants': 'Making promises to God, and using the Atonement to make things right and start fresh.',
    'god-silence': 'Making quiet time to think, pray and listen for God.',
    'god-gratitude': 'Noticing what you have been given, and saying thank you.',
    'god-giving': 'Sharing what you have, including tithes and offerings, with a happy heart.',
    'god-sabbath': 'Setting one day apart each week to rest, worship and be with family.',
    'god-essentialism': 'Focusing on the few things that matter most, and letting go of the rest.',
  };

  const esc = t => String(t).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));

  /* opts.parent: show the parent view (map description, book, unconfirmed-quote flag) */
  function html(month, opts = {}) {
    const W = window.WISDOM, colors = window.CURRICULUM.branchColors;
    const ts = (month.tactics || []).map(t => ({ ...W.tactics[t.key], role: t.role })).filter(t => t.name);
    if (!ts.length) return '';
    return `<div class="flashcards${opts.parent ? ' parent' : ''}">${ts.map(t => {
      const def = opts.parent && t.desc ? t.desc : (DEFS[t.key] || t.desc || '');
      const showQuote = t.quote && (opts.parent || !t.check);
      return `
        <button type="button" class="flashcard" aria-pressed="false" style="--bc:${colors[t.branch]}">
          <span class="fc-inner">
            <span class="fc-face fc-front">
              <span class="fc-branch">${t.branch}${t.role === 'lead' ? ' · lead' : ''}</span>
              <span class="fc-name">${esc(t.name)}</span>
              <span class="fc-hint">Tap to flip</span>
            </span>
            <span class="fc-face fc-back">
              <span class="fc-label">What it means</span>
              <span class="fc-def">${esc(def)}</span>
              ${showQuote ? `<span class="fc-quote${t.quote.length > 110 ? ' long' : ''}">“${esc(t.quote)}”<span class="by">${esc(t.quoteBy || '')}</span>${t.check && opts.parent ? '<span class="fc-flag">Wording not yet confirmed. Hidden on the kids’ pages.</span>' : ''}</span>` : ''}
              ${opts.parent && t.book ? `<span class="fc-book"><b>Book</b> ${esc(t.book)}${t.bookBy ? ', ' + esc(t.bookBy) : ''}</span>` : ''}
              <span class="fc-ref">${t.scripture ? esc(t.scripture) : ''}</span>
            </span>
          </span>
        </button>`;
    }).join('')}</div>`;
  }

  document.addEventListener('click', e => {
    const card = e.target.closest && e.target.closest('.flashcard');
    if (!card) return;
    const on = card.classList.toggle('flipped');
    card.setAttribute('aria-pressed', String(on));
  });

  window.WisdomCards = { html, DEFS };
})();
