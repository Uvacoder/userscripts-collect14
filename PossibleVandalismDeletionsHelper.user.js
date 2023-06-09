// ==UserScript==
// @name         Possible Vandalism Deletions Helper
// @description  Display post score and number of undeleted answers, Recommend action based on post info
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      4.0.12
//
// @match        https://*.stackoverflow.com/admin/dashboard?flagtype=postvandalismdeletionsauto*
// @match        https://*.serverfault.com/admin/dashboard?flagtype=postvandalismdeletionsauto*
// @match        https://*.superuser.com/admin/dashboard?flagtype=postvandalismdeletionsauto*
// @match        https://*.askubuntu.com/admin/dashboard?flagtype=postvandalismdeletionsauto*
// @match        https://*.mathoverflow.net/admin/dashboard?flagtype=postvandalismdeletionsauto*
// @match        https://*.stackapps.com/admin/dashboard?flagtype=postvandalismdeletionsauto*
// @match        https://*.stackexchange.com/admin/dashboard?flagtype=postvandalismdeletionsauto*
// @match        https://stackoverflowteams.com/c/*/admin/dashboard?flagtype=postvandalismdeletionsauto*
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

// This is a moderator-only userscript
if (!isModerator()) return;


// Append styles
addStylesheet(`
.post-list {
  margin-top: 1.5em;
  margin-left: 0px;
  list-style: none;
  width: calc(100% + 60px);
}
.post-list .title-divider {
  margin-top: 5px;
}
.post-list .load-body {
  display: none;
}
.revision-comment {
  position: relative;
  display: block;
}
.revision-comment:hover {
  background: cornsilk;
}
.info-num {
  display: inline-block;
  min-width: 18px;
  margin-right: 10px;
  font-weight: bold;
  font-size: 1.1em;
}
.info-num.red {
  color: var(--red-500);
}
.post-recommendation {
  display: block;
  margin: 5px 0;
  font-weight: bold;
  font-size: 1.2em;
}
.post-recommendation:before {
  content: 'Recommendation: ';
}
.tagged-ignored {
  opacity: 1;
}
.js-body-summary {
  display: none !important;
}
`); // end stylesheet


// On script run
(function init() {

  // Transform UI
  $('.js-flag-text .post-list').before('<div class="post-recommendation">Dismiss</div>');
  $('.js-flagged-post').each(function () {
    const postlist = $('.post-list', this);

    // Sort questions to end of list
    postlist.append(`<li class="title-divider">Questions</li>`);
    postlist.append(postlist.find('a.question-hyperlink').closest('.bg-red-050'));
    postlist.prepend(`<li class="title-divider">Answers</li>`);
  });

  // Open post links in a new window
  $('.post-list a').attr('target', '_blank');

  // For answers, get post info
  $('.post-list .bg-red-050 a.answer-hyperlink').each(function () {
    const isQuestion = !$(this).hasClass('answer-hyperlink');
    const total = $(this).parents('.post-list').children().length;
    const flag = $(this).parents('.js-flagged-post');
    const link = $(this);
    const pid = isQuestion ? this.href.match(/\d+/)[0] : this.href.match(/\d+$/)[0];

    // Insert recommendation div
    const rec = flag.find('.post-recommendation');

    // Get post info
    $.get({
      url: this.href,
      success: function (data) {
        let html = $('#mainbar', data);
        let answerCount = $('.answer', html).not('.deleted-answer').length;
        let post = $(isQuestion ? '#question' : '#answer-' + pid, html);
        let score = Number($('.js-vote-count', post).text());
        let dateDiff = Date.now() - new Date($('.user-action-time:last .relativetime', post).attr('title'));
        let age = Math.floor(dateDiff / 86400000);
        //console.log(html, post, score, dateDiff, age);

        // Insert info
        link.before(`<span class="info-num post-score ${score > 0 ? 'red' : ''}" title="post score (positively-scored answers are more likely to be vandalism)">${score}</span>`);
        link.before(`<span class="info-num answer-count ${answerCount == 0 ? 'red' : ''}" title="non-deleted answers on question (lone answer deletions might possibly trigger roomba on the question)">${answerCount}</span>`);
        link.before(`<span class="info-num post-age" title="post age (newer posts are more likely to be deleted for inaccuracy instead of vandalism)">${age}d</span>`);

        // Calculate flag recommendation
        if (score > 0) {
          let num = (Number(flag.attr('data-positive-posts')) || 0) + 1;
          flag.attr('data-positive-posts', num);
          // If more than 2 positive posts, warn
          if (num >= 2) {
            rec.text('Warn').css('color', 'red');
          }
        }
        if (answerCount == 0) {
          let num = (Number(flag.attr('data-only-answer')) || 0) + 1;
          flag.attr('data-only-answer', num);
          // If more than 50% of deletions are only answers, warn
          if (num / total > 0.5) {
            rec.text('Warn').css('color', 'red');
          }
        }
      }
    });
  });
})();