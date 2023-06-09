// ==UserScript==
// @name         Comment Flag Type Colours
// @description  Background colours for each comment flag type
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      4.0.12
//
// @match        https://*.stackoverflow.com/questions/*
// @match        https://*.serverfault.com/questions/*
// @match        https://*.superuser.com/questions/*
// @match        https://*.askubuntu.com/questions/*
// @match        https://*.mathoverflow.net/questions/*
// @match        https://*.stackapps.com/questions/*
// @match        https://*.stackexchange.com/questions/*
// @match        https://stackoverflowteams.com/c/*/questions/*
//
// @match        https://*.stackoverflow.com/posts/*/timeline*
// @match        https://*.serverfault.com/posts/*/timeline*
// @match        https://*.superuser.com/posts/*/timeline*
// @match        https://*.askubuntu.com/posts/*/timeline*
// @match        https://*.mathoverflow.net/posts/*/timeline*
// @match        https://*.stackapps.com/posts/*/timeline*
// @match        https://*.stackexchange.com/posts/*/timeline*
// @match        https://stackoverflowteams.com/c/*/posts/*/timeline*
//
// @match        https://*.stackoverflow.com/admin/dashboard*
// @match        https://*.serverfault.com/admin/dashboard*
// @match        https://*.superuser.com/admin/dashboard*
// @match        https://*.askubuntu.com/admin/dashboard*
// @match        https://*.mathoverflow.net/admin/dashboard*
// @match        https://*.stackapps.com/admin/dashboard*
// @match        https://*.stackexchange.com/admin/dashboard*
// @match        https://stackoverflowteams.com/c/*/admin/dashboard*
//
// @match        https://*.stackoverflow.com/users/flag-summary/*?group=4*
// @match        https://*.serverfault.com/users/flag-summary/*?group=4*
// @match        https://*.superuser.com/users/flag-summary/*?group=4*
// @match        https://*.askubuntu.com/users/flag-summary/*?group=4*
// @match        https://*.mathoverflow.net/users/flag-summary/*?group=4*
// @match        https://*.stackapps.com/users/flag-summary/*?group=4*
// @match        https://*.stackexchange.com/users/flag-summary/*?group=4*
// @match        https://stackoverflowteams.com/c/*/users/flag-summary/*?group=4*
//
// @match        https://*.stackoverflow.com/admin/users/*/post-comments*
// @match        https://*.serverfault.com/admin/users/*/post-comments*
// @match        https://*.superuser.com/admin/users/*/post-comments*
// @match        https://*.askubuntu.com/admin/users/*/post-comments*
// @match        https://*.mathoverflow.net/admin/users/*/post-comments*
// @match        https://*.stackapps.com/admin/users/*/post-comments*
// @match        https://*.stackexchange.com/admin/users/*/post-comments*
// @match        https://stackoverflowteams.com/c/*/admin/users/*/post-comments*
//
// @exclude      */admin/dashboard?flagtype=answerduplicateanswerauto*
// @exclude      */admin/dashboard?flagtype=commentvandalismdeletionsauto*
// @exclude      */admin/dashboard?flagtype=commenttoomanydeletedrudenotconstructiveauto*
//
// @exclude      https://api.stackexchange.com/*
// @exclude      https://data.stackexchange.com/*
// @exclude      https://contests.stackoverflow.com/*
// @exclude      https://winterbash*.stackexchange.com/*
// @exclude      *chat.*
// @exclude      *blog.*
// @exclude      */tour
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/se-ajax-common.js
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals StackExchange */
/// <reference types="./globals" />

'use strict';


// Append styles
addStylesheet(`
.ctype-bad,
.ctype-poor,
.ctype-poor-bot,
.ctype-meh {
  display: inline;
  padding: 2px 5px 3px !important;
  line-height: 1;
  font-size: 10px;
  font-style: normal;
  border-radius: 2px;
  color: white;
  text-shadow: 0px 0px 1px #666;
}
.ctype-bad {
  background-color: var(--red-500);
}
.ctype-poor {
  background-color: var(--orange-400);
}
.ctype-poor-bot {
  background-color: var(--orange-300);
}
.ctype-meh {
  background-color: var(--black-300);
}
.ctype-custom {
  padding: 2px 0 !important;
  background-color: var(--yellow-100);
  line-height: inherit;
  color: var(--black);
}
.comment-flag-off {
  color: var(--black-500);
}
`); // end stylesheet


// On script run
(function init() {

  // Path /post-comments
  if (location.pathname.indexOf('/post-comments') > 0) {

    // wrap comment type text with .revision-comment span
    $('.deleted-info').html((i, html) => html.replace(/span>\s*([a-z]+(\s[a-z]+)*)\s/i, `><span class="revision-comment">$1</span> `));
  }

  // New stacks theme
  if (document.body.classList.contains('unified-theme')) {

    // wrap comment type text with .revision-comment span
    $('.js-flagged-comment .js-flag-text').html((i, html) => html.replace(/^(.*) - </i, `<span class="revision-comment">$1</span> - <`));
  }

  // On Post Timelines, highlight differently
  if (/^\/posts\/\d+\/timeline.*/.test(location.pathname)) {

    $('.event-verb span').filter((i, el) => el.children.length == 0).each(function (i, el) {
      let cls = '';
      el.innerText = el.innerText.trim();
      switch (el.innerText.toLowerCase()) {
        case 'commentrudeoroffensive':
        case 'rudeoroffensive':
          cls = 'ctype-bad';
          break;
        case 'commentunwelcoming':
        case 'unwelcoming':
          cls = 'ctype-poor';
          break;
        case 'commentnolongerneeded':
        case 'nolongerneeded':
          cls = 'ctype-meh';
          break;
        case 'commentother':
        case 'other':
          cls = 'ctype-custom';
          break;
      }
      if (cls !== '') el.classList.add(cls);

      if (cls == 'ctype-custom') {
        $(el).closest('.event-verb').siblings('.event-comment').find('span').addClass('ctype-custom');
      }
    });

    return false;
  }

  // All other included pages
  $('.revision-comment').filter(function () {
    // Not in a mod post list and table cell, or not the first element
    return ($(this).closest('ul.post-list').length == 0 && $(this).parent('td').length == 0) || $(this).index() !== 0;
  }).each(function (i, el) {
    let cls = 'ctype-custom';
    el.innerText = el.innerText.trim();
    switch (el.innerText.toLowerCase()) {
      case 'rude or offensive':
      case 'harassment, bigotry, or abuse':
      case 'harrassment, bigotry, or abuse':
        cls = 'ctype-bad';
        break;
      case 'unfriendly or unkind (auto)':
      case 'robot says unfriendly':
        cls = 'ctype-poor-bot';
        break;
      case 'unfriendly or unkind':
      case 'unwelcoming':
        cls = 'ctype-poor';
        break;
      case 'no longer needed':
      case 'not relevant':
      case 'not constructive':
      case 'obsolete':
      case 'not constructive or off topic':
      case 'too chatty':
        cls = 'ctype-meh';
        break;
    }
    el.classList.add(cls);

    if (cls == 'ctype-custom') {
      $(el).parents('.deleted-info').next('.flag-other-text').addClass('revision-comment ctype-custom');
    }
  });
})();