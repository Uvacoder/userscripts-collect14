// ==UserScript==
// @name         Fetch Vote Counts Again
// @description  Fetch vote counts for posts and enables you to click to fetch them again, even if you do not have sufficient rep. Also enables fetch vote counts on posts in mod flag queue as well as question/search lists!
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      3.0.10
//
// @match        https://*.stackoverflow.com/*
// @match        https://*.serverfault.com/*
// @match        https://*.superuser.com/*
// @match        https://*.askubuntu.com/*
// @match        https://*.mathoverflow.net/*
// @match        https://*.stackapps.com/*
// @match        https://*.stackexchange.com/*
// @match        https://stackoverflowteams.com/*
//
// @exclude      https://api.stackexchange.com/*
// @exclude      https://data.stackexchange.com/*
// @exclude      https://contests.stackoverflow.com/*
// @exclude      https://winterbash*.stackexchange.com/*
// @exclude      *chat.*
// @exclude      *blog.*
// @exclude      */tour
// @exclude      */election*
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/se-ajax-common.js
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals StackExchange */
/// <reference types="./globals" />

'use strict';

const apikey = 'Omd8BBk1xrNxvCOh*xtiCw((';


// Append styles
addStylesheet(`
.votecell .js-vote-count,
.votecell .vote-count-post,
.question-summary .vote-count-post {
  cursor: pointer !important;
}
.vote-count-separator {
  margin-left: auto;
  margin-right: auto;
}
.vote-count-post:not([title*="totals"]) + .viewcount {
  display: none;
}
`); // end stylesheet


// On script run
(function init() {
  $('.js-vote-count, .vote-count-post').attr('title', 'View upvote and downvote totals');

  $('#content').on('click', '.js-vote-count, .vote-count-post', function () {
    const votesElem = $(this);
    let pid, post = $(this).parents('.answer, .question, .question-summary, .search-result')[0];

    if (post == null) { // reviews
      post = $(this).parents('.review-content').find('.answer-hyperlink, .question-hyperlink')[0];
      pid = getPostId(post.href);
    }
    else {
      pid = Number(post.dataset.answerid || post.dataset.questionid || post.id.replace('post-', '').replace('question-summary-', '').replace('answer-id-', ''));
    }

    // Invalid post id, do nothing
    if (isNaN(pid)) return;

    // If user does not have vote counts priv, use API to fetch vote counts
    if (StackExchange.options.user.rep < 1000) {
      StackExchange.helpers.addStacksSpinner(this, "sm");

      $.get(`${seApiUrl}/posts/${pid}?filter=!w-*Ytm8Gt4I)pS_ZBu&site=${location.hostname}&key=${apikey}`)
        .done(function (data) {
          votesElem.attr('title', `${+data.items[0].up_vote_count} up / ${+data.items[0].down_vote_count} down`)
            .html(`<div style="color:green">+${data.items[0].up_vote_count}</div><div class="vote-count-separator"></div><div style="color:maroon">${-data.items[0].down_vote_count}</div>`);
        })
        .always(() => StackExchange.helpers.removeSpinner());
      return false;
    }

    // Main and teams, question list/search results page
    else if (votesElem.hasClass('vote-count-post')) {
      StackExchange.helpers.addStacksSpinner(this, "sm");

      $.get(`${location.origin}${StackExchange.options.site.routePrefix || ''}/posts/${pid}/vote-counts`)
        .done(function (data) {
          votesElem.attr('title', `${+data.up} up / ${+data.down} down`)
            .html(`<div style="color:green">${data.up}</div><div class="vote-count-separator"></div><div style="color:maroon">${data.down}</div>`);
        })
        .always(() => StackExchange.helpers.removeSpinner());
      return false;
    }

    // User has vote count priv and already fetched vote counts once
    //   or on mod page (mods can't fetch vote counts)
    else if ((votesElem.children().length > 1 && StackExchange.options.user.rep >= 1000) || document.body.classList.contains('mod-page')) {
      StackExchange.helpers.addStacksSpinner(this, "sm");

      $.get(`${location.origin}/posts/${pid}/vote-counts`)
        .done(function (data) {
          votesElem.attr('title', `${+data.up} up / ${+data.down} down`)
            .html(`<div style="color:green">${data.up}</div><div class="vote-count-separator"></div><div style="color:maroon">${data.down}</div>`);
        })
        .always(() => StackExchange.helpers.removeSpinner());
      return false;
    }
  });
})();