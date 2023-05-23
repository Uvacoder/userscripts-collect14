// ==UserScript==
// @name         Post Headers & Question TOC
// @description  Sticky post headers while you view each post (helps for long posts). Question ToC of Answers in sidebar.
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      4.5
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
// @match        https://*.stackoverflow.com/election*
// @match        https://*.serverfault.com/election*
// @match        https://*.superuser.com/election*
// @match        https://*.askubuntu.com/election*
// @match        https://*.mathoverflow.net/election*
// @match        https://*.stackapps.com/election*
// @match        https://*.stackexchange.com/election*
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
//
// @run-at       document-end
// ==/UserScript==

/* globals StackExchange, store */
/// <reference types="./globals" />

'use strict';

const modflair = '<span class="mod-flair" title="moderator">♦</span>';
const hasFixedHeader = $('.top-bar').hasClass('_fixed');
const postBaseUrl = $('#question-header h1 a').attr('href');
const sortDropdown = $('#answer-sort-dropdown-select-menu');


// Fetch and store option
const delKeyRoot = 'PostToC-ShowDeleted';
function saveShowDeleted(val) {
  if (typeof val !== 'boolean') return;
  store.setItem(delKeyRoot, val);
}
function getShowDeleted() {
  let val = store.getItem(delKeyRoot);
  return val !== 'false';
}


// (Promise) Get post timeline
function getPostTimeline(pid) {
  return new Promise(function (resolve, reject) {
    // Strict validation for pid: must be a positive integer
    if (typeof pid !== 'number' || isNaN(pid) || pid <= 0) { reject(); return; }

    $.ajax(`${location.origin}/posts/${pid}/timeline`, {
      xhr: jQueryXhrOverride
    })
      .done(function (data) {
        const events = $('.event-rows', data);
        resolve(events);
      })
      .fail(reject);
  });
}
// (Promise) Get post answers from timeline
function getPostAnswers(pid) {
  return new Promise(function (resolve, reject) {
    // Strict validation for pid: must be a positive integer
    if (typeof pid !== 'number' || isNaN(pid) || pid <= 0) { reject(); return; }

    getPostTimeline(pid).then(function (v) {
      const answers = $(v).children().filter(function () {
        return $(this).find('.answer-type').length !== 0;
      });
      resolve(answers);
    });
  });
}


// Returns true if element found
function gotoPost(pid, isQuestion = false) {
  let elem = $(isQuestion ? '#question' : '#answer-' + pid);

  if (isElectionPage || elem.length === 0) {
    elem = $(`#post-${pid}, .candidate-row[data-candidate-id="${pid}"]`).first();
  }

  if (elem.length === 1) {

    if (isElectionPage) {
      history.replaceState(null, document.title, `${location.pathname}${location.search}#post-${pid}`);
    }
    else {
      history.replaceState(null, document.title, `${postBaseUrl}${isQuestion ? '' : '/' + pid + '#' + pid}`);
    }
    $('html, body').animate({ scrollTop: elem.offset().top + 1 }, 400);
    return true;
  }
  return false;
}

function gotoAnchor(aid) {
  aid = aid.replace(/^#/, '');

  if (isElectionPage) return;

  let elem = $('#' + aid);
  let isQuestion = elem.closest('.answer').length == 0;
  let post = elem.closest('.question, .answer, .candidate-row').get(0);
  let pid = post ? Number(post.dataset.questionid || post.dataset.answerid) : 0;

  if (pid && elem.length === 1) {
    history.replaceState(null, document.title, `${postBaseUrl}${isQuestion ? '#' + aid : '/' + pid + '#' + aid}`);
    $('html, body').animate({ scrollTop: elem.offset().top - (hasFixedHeader ? 40 : 50) }, 400);
    return true;
  }
  return false;
}


function initStickyPostHeaders() {

  const postsOnPage = $('#question, .answer, .candidate-row').each(function () {
    const post = $(this);
    const isQuestion = post.hasClass('question');
    const pid = isQuestion ? this.dataset.questionid : this.dataset.answerid;
    const isWiki = $(this).find('span.community-wiki').length > 0;

    const postUser = $(this).find('.user-info:last .user-details').last().children('a, span.d-none');
    const postUserText = postUser.last().text().replace(/\d+ revs/, '').trim();
    let postUserHtml = `<span class="deleted-user">${postUserText}</span>`; // default to deleted user
    if (isWiki) {
      postUserHtml = `<span>${postUserText}</span>`;
    }
    else if (postUser.length > 1) {
      postUserHtml = postUser.filter('a')[0].outerHTML;
    }
    else if (isElectionPage) {
      postUserHtml = postUser[0].outerHTML;
    }

    const postIsMod = postUser.length != 0 ? postUser.next().hasClass('mod-flair') : false;
    const postDate = $(this).find('.user-info .user-action-time').last().html() || '';
    const postDateReversed = postDate.trim().replace(/<span title="([^"]+)".*>([^<]+)<\/span>/, '<span title="$2" class="absolutetime">$1</span>');

    if (post.find('.post-layout--left').length == 0) {
      post.find('.post-layout--right').before(`<div class="votecell post-layout--left"></div>`);
    }

    const stickyHeader = $(`<div class="post-stickyheader ${isElectionPage ? 'election-stickyheader' : ''}">
      ${isElectionPage ? 'Nomination' : isQuestion ? 'Question' : 'Answer'} by ${postUserHtml}${postIsMod ? modflair : ''} ${postDateReversed}
      <div class="sticky-tools">
        <a href="/${isQuestion ? 'q' : 'a'}/${pid}">permalink</a> | <a href="/posts/${pid}/revisions">revs</a> | <a href="/posts/${pid}/timeline?filter=WithVoteSummaries">timeline</a>
      </div></div>`);
    post.prepend(stickyHeader);
  });

  $('.post-stickyheader a').attr('target', '_blank');
  $('.post-stickyheader').on('click', function () {
    const isQuestion = $(this.parentNode).hasClass('question');
    const p = this.parentNode;
    const pid = isQuestion ? p.dataset.questionid : p.dataset.answerid || p.id.replace('post-', '') || p.dataset.candidateId;
    gotoPost(pid, isQuestion);
  }).on('click', 'a', function (evt) {
    evt.stopPropagation();
  });

  function hashChange(evt) {
    if (location.hash == null || /^#\d+$/.test(location.hash) == false) return;

    let id = location.hash.match(/\d+/)[0];
    let elem;

    if (location.hash.indexOf('#comment') == 0) {
      elem = $('#comment-' + id);
    }
    else if (location.hash.length > 1) {
      elem = $('#answer' - id);
    }

    if (id && elem && elem.length) {
      window.scrollTo({ top: elem.offset().top - (hasFixedHeader ? 40 : 50), behavior: 'instant' });
    }
  }
  window.addEventListener("hashchange", hashChange, false);
  window.addEventListener("load", function () { setTimeout(hashChange, 400); }, false);

  // Move sticky headers before MonicasFlagToC userscript if present
  function updatePostHeaders() {
    $('.mod-tools-post').next('.post-stickyheader').each(function () {
      $(this).prependTo(this.parentNode);
    });
  }
  setTimeout(updatePostHeaders, 3000);
  $(document).ajaxStop(updatePostHeaders);
}


async function loadNewCommentsOnElectionPage() {
  if (!isElectionPage) return;

  const posts = [...document.querySelectorAll('.candidate-row')]
    .filter(el => el.querySelector('.comments, .js-comments-container')); // only load comments for posts that have a comments container (nomination tab)

  posts.forEach(async function (el, i) {
    const pid = el.id.match(/\d+$/)[0];

    await delay(800 * i);

    $.ajax({
      url: `/posts/${pid}/comments?includeDeleted=true&_=${Date.now()}`,
      type: 'GET',
      success: function (data) {
        $(`#comments-${pid}`).show().children('ul.comments-list').html(data);
      },
    });
  });

  $('.js-show-link.comments-link, .js-load-deleted-comments-link').prev('.js-link-separator').addBack().remove();

  await delay(30000);
  loadNewCommentsOnElectionPage();
}


function initTableOfContentsSidebar() {

  const postsOnPage = $('#answers > .answer');
  const qid = Number($('#question').attr('data-questionid'));
  let sortby = 'score';

  // New answer sort dropdown is used
  if (sortDropdown.length) {
    /*
      Possible values:
        scoredesc - Highest score (default)
        trending - Trending (recent votes count more)
        modifieddesc - Date modified (newest first)
        createdasc - Date created (oldest first)
     */
    sortby = sortDropdown.val();
  }

  if (isElectionPage) {
    loadNewCommentsOnElectionPage();

    // Missing sidebar, add it
    if ($('#sidebar').length === 0) {
      $('#mainbar').after(`<div id="sidebar"></div>`);
    }

    $('#sidebar').addClass('show-votes');

    let nominations = $('.candidate-row');
    const answerContainer = nominations.first().parent();

    // Sort by votes if votes shown
    if ($('.js-vote-count').length > 0) {
      let sortedList = nominations.get().sort(function (a, b) {
        const ax = Number($(a).find('.js-vote-count')[0].dataset.value);
        const bx = Number($(b).find('.js-vote-count')[0].dataset.value);
        return bx - ax; // desc
      });
      nominations = $(sortedList);
      answerContainer.append(nominations);
    }

    let answerlist = '';
    nominations.each(function () {
      const postuser = $(this).find('.user-details a').first();
      const postusername = postuser.text();
      const pid = this.id.replace('post-', '') || this.dataset.candidateId;
      const votes = $(this).find('.js-vote-count').text();
      const datetime = $(this).find('.relativetime')[0].outerHTML;

      answerlist += `
        <div class="spacer" data-answerid="${pid}">
          <a href="#${pid}" title="Vote score (upvotes - downvotes)">
            <div class="answer-votes large">${votes}</div>
          </a>
          <a href="#${pid}" class="post-hyperlink">${postusername}</a>
          ${datetime}
        </div>`;
    });

    const qtoc = $(`
      <div class="module sidebar-linked mt24" id="qtoc">
        <h4 id="qtoc-header">${nominations.length} Candidate${pluralize(nominations.length)}</h4>
        <div class="linked">${answerlist}</div>
      </div>`);

    // If answer is on current page, clicking on them scrolls to the answer
    qtoc.on('click', 'a', function () {
      const pid = this.parentNode.dataset.answerid;
      return !gotoPost(pid);
    });

    // Append to sidebar
    $('#sidebar').append(qtoc);
  }

  // If no answers, do nothing else
  if (postsOnPage.length == 0) return;

  getPostAnswers(qid).then(function (v) {
    v = v.get();

    // Sort by oldest first
    if (sortby === 'createdasc') {
      v = v.reverse();
    }
    // Sort by active first
    else if (sortby === 'modifieddesc') {
      v = v.sort((a, b) => {
        const aid = $(a).find('.event-comment a.timeline').attr('href').match(/[0-9]+/)[0];
        const bid = $(b).find('.event-comment a.timeline').attr('href').match(/[0-9]+/)[0];
        const apost = $('#answer-' + aid).get(0);
        const bpost = $('#answer-' + bid).get(0);

        if (apost == null || bpost == null) return 0;
        return apost.offsetTop - bpost.offsetTop;
      });
    }
    // Sort by default (score)
    else {
      v = v.sort((a, b) => {
        const ax = Number($(a).find('.event-comment span:not(.badge-earned-check)').last().text().match(/[-0-9]+$/)[0]);
        const bx = Number($(b).find('.event-comment span:not(.badge-earned-check)').last().text().match(/[-0-9]+$/)[0]);

        // If sorted by votes, deleted answers are placed at the bottom
        const adel = $(a).hasClass('deleted-event');
        const bdel = $(b).hasClass('deleted-event');

        return (adel && bdel) || (!adel && !bdel) ? bx - ax : (adel ? 1 : -1); // desc
      });
    }

    // Move deleted posts to the end
    v = v.sort((a, b) => {
      const aDel = a.classList.contains('deleted-event');
      const bDel = b.classList.contains('deleted-event');

      if (!aDel && !bDel) return 0;
      return aDel ? 1 : -1;
    });

    const answers = $(v);
    let answerlist = '';
    let deletedCount = 0;

    answers.each(function () {
      const isDel = $(this).hasClass('deleted-event');
      const postUserCell = $(this).children('td').eq(3);
      const postuserLink = postUserCell.find('a').first();
      const isPostuserDeleted = postuserLink.length === 0;
      const postusername = postUserCell.text().replace('♦', ' ♦');
      const pid = $(this).find('.event-comment a.timeline').attr('href').match(/[0-9]+/)[0];
      const votes = $(this).find('.event-comment span:not(.badge-earned-check)').last().text().match(/[-0-9]+$/)[0];
      const datetime = $(this).find('.relativetime')[0].outerHTML;
      const isAccepted = $(this).find('.badge-earned-check').length == 1;

      answerlist += `
        <div class="spacer ${isDel ? 'deleted-answer' : ''}" data-answerid="${pid}" data-votes="${votes}" data-datetime="${votes}">
          <a href="${postBaseUrl}/${pid}#${pid}" title="Vote score (upvotes - downvotes)">
            <div class="answer-votes large ${isAccepted ? 'answered-accepted' : ''}">${votes}</div>
          </a>
          <a href="${postBaseUrl}/${pid}#${pid}" class="post-hyperlink">${isPostuserDeleted ? '<span class="deleted-user">' : ''}${postusername}</a>
          ${datetime}
        </div>`;
      if (isDel) deletedCount++;
    });

    const qtoc = $(`
      <div class="module sidebar-linked" id="qtoc">
        <h4 id="qtoc-header">
          <span class="back-to-question" title="Back to question">${v.length} Answer${pluralize(v.length)}</span>
          <label title="toggle deleted answers">
            <input class="m0 mr6" id="qtoc-toggle-del" type="checkbox" checked="checked" />
            ${deletedCount} deleted
          </label>
        </h4>
        <div class="linked">${answerlist}</div>
      </div>`);

    // Back to question click
    qtoc.find('.back-to-question').on('click', function () {
      return !gotoPost(qid, true);
    });

    // Accepted answer first
    qtoc.find('.answered-accepted').parents('.spacer').prependTo(qtoc.find('.linked'));

    // If answer is on current page, clicking on them scrolls to the answer
    qtoc.on('click', 'a', function () {
      const pid = this.parentNode.dataset.answerid;
      return !gotoPost(pid);
    });

    /*
    // Insert after linked or related posts module
    const linkedRelated = $('.sidebar-linked, .sidebar-related').first().before(qtoc);
    // If no linked or related posts, insert after featured community posts
    if(linkedRelated.length === 0) $('#sidebar .s-sidebarwidget__yellow').first().after(qtoc);
    */

    // Init sticky sidebar
    const stickySidebar = $('<div id="sticky-sidebar-content"></div>').append(qtoc).appendTo('#sidebar');

    // Remove chat and hot network questions as they take up a lot of sidebar real-estate
    $('#chat-feature, #hot-network-questions').hide();
    $('.js-chat-ad-link').closest('.module').hide();

    // Toggle checkbox event for deleted answers
    const showDelBtn = $('#qtoc-toggle-del').on('click', function () {
      const isChecked = $(this).is(':checked');
      saveShowDeleted(isChecked);
      $(document.body).toggleClass('SOMU-PHQT-hide-deleted', !isChecked);
    });

    // If user previously selected do not show deleted posts, hide them
    if (!getShowDeleted()) showDelBtn.trigger('click');

    // Put count of deleted answers next to total
    $('#answers-header h2').append(`<span class="deleted-count fs-body1">(${deletedCount} deleted)</span>`);
  });

  // Set min-height of sidebar to height of mainbar
  function updateSidebarHeight() {
    $('#sidebar').css('min-height', $('#mainbar').height() + 'px');
  }
  setTimeout(updateSidebarHeight, 3000);
}


function initNamedAnchors() {
  if (isElectionPage) return;

  // Parse headers and insert anchors
  $('.js-post-body').find('h1, h2, h3').each(function () {
    // Only if they do not contain links
    if ($(this).children('a').length > 0) return;

    const id = this.innerText.toLowerCase().replace(/'/g, '').replace(/\W+/g, '-').replace(/(^\W+|\W+$)/g, '')
    this.id = id;
    $(this).wrap(`<a class="js-named-anchor" href="#${id}"></a>`);
  });

  // Click event
  $('.js-post-body').on('click', 'a.js-named-anchor', function () {
    gotoAnchor(this.hash);
    return false;
  });

  // On page load, if not answer permalink
  if (location.hash && /^#\d+?$/.test(location.hash) == false) {
    setTimeout(() => gotoAnchor(location.hash), 50);
  }
}


// Append styles
addStylesheet(`
/* Right sidebar */
#qinfo {
  margin-bottom: 6px;
}
#qinfo p.label-key {
  margin-bottom: 6px;
}

/* Hide newsletter sidebar ad,
  since we need all the space we can get */
#newsletter-ad {
  display: none !important;
}


/* Sticky post votes/sidebar */
.post-layout {
  overflow: visible !important;
}
.post-layout--left.votecell {
  grid-row: 1 / 10;
}
.votecell .vote,
.votecell .js-voting-container {
  position: sticky;
  top: 10px;
  padding-bottom: 20px;
}
.votecell .vote .message,
.votecell .js-voting-container .message {
  min-width: 360px;
}
.votecell .s-popover__tooltip {
  min-width: 200px;
  margin-top: 1px !important;
}
.downvoted-answer .vote > * {
  transform: translateZ(0);
}


/* Sticky post header */
.question-page #answers .answer {
  border-bottom: none;
}
.answer {
  margin-bottom: 20px;
  padding-bottom: 20px;
  padding-top: 0;
}
.question .post-layout,
.answer .post-layout {
  padding-bottom: 15px;
}
.pager-answers {
  padding-top: 10px;
  padding-bottom: 20px;
}
#answers .answers-subheader {
  margin-bottom: 20px !important;
}
#answers .answers-subheader h2 {
  font-size: 19px;
}
.post-stickyheader {
  position: sticky;
  top: 50px;
  display: block;
  margin-bottom: 15px;
  padding: 12px 16px;
  z-index: 2;

  background: var(--black-050);
  border-bottom: 1px solid var(--black-150);
  box-shadow: 0px 0px 4px -1px rgba(0,0,0,0.5);
  cursor: pointer;
}
.post-stickyheader > a:not([href*="/users/"]) {
  color: inherit;
}
.election-page .votecell .vote,
.election-page .votecell .js-voting-container {
  top: 101px;
}
.post-stickyheader ~ .post-layout .votecell .vote,
.post-stickyheader ~ .post-layout .votecell .js-voting-container {
  top: 101px;
  z-index: 1;
}
.question:hover,
.answer:hover {
  z-index: 10;
}
.question:hover .votecell .vote,
.question:hover .votecell .js-voting-container,
.answer:hover .votecell .vote,
.answer:hover .votecell .js-voting-container {
  z-index: 3;
}
.question:hover .post-stickyheader,
.answer:hover .post-stickyheader {
  z-index: 11;
}
#postflag-bar {
  z-index: 1000;
}
.post-stickyheader .relativetime,
.post-stickyheader .absolutetime {
  color: var(--red-700);
  border-bottom: 1px dashed var(--red-700);
}
.post-stickyheader .absolutetime {
  font-size: 0.95em;
}
.post-stickyheader .sticky-tools {
  float: right;
}
.post-stickyheader > span:not(.absolutetime) { /* CW user */
  font-style: italic;
}
.post-stickyheader .deleted-user { /* Deleted user */
  display: inline-block;
  padding: 3px 5px;
  background: var(--red-600) !important;
  color: var(--white) !important;
}
.election-page .post-stickyheader .sticky-tools {
  display: none;
}


/* Sticky Sidebar ToC */
body.question-page #content .inner-content,
body.election-page #content {
  flex-wrap: wrap;
}
.subheader,
#question-header,
#question-header + div.grid {
  flex-basis: 100%;
}
body.election-page #sidebar > #qtoc,
#sidebar #sticky-sidebar-content {
  position: sticky;
  top: 50px;
  margin-top: 15px;
  padding-top: 20px;
}
#sidebar #qtoc > .linked {
  max-height: calc(100vh - 150px);
  overflow-x: hidden;
  overflow-y: auto;
  margin-right: -8px;
  padding-right: 8px;
}


/* Remove timeline button in post sidebar as we have a link in the header now */
.js-post-issue[title="Timeline"] {
  display: none;
}

/* Compat with MonicasFlagToC */
.mod-tools.mod-tools-post {
  position: static;
}

/* Table of Contents Sidebar */
body:not(.no-grid-post-layout) .post-layout--full {
  grid-column: 2 / 3;
}
body:not(.no-grid-post-layout) .post-layout--full .question-status {
  position: relative;
  left: -60px;
  width: calc(100% + 60px);
}
#qtoc-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}
#qtoc-header > label {
  display: inline-flex;
  margin-bottom: 3px;
  font-size: 13px;
}
#qtoc-header .back-to-question {
  cursor: pointer;
}
#qtoc .relativetime {
  padding-top: 2px;
  white-space: nowrap;
}
#sidebar .linked a:first-of-type {
  padding-right: 10px;
}
#sidebar #qtoc .spacer {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  margin-bottom: 7px;
  font-size: 12px;
  font-weight: normal;
  color: var(--black-400);
}
#qtoc .answer-votes {
  white-space: nowrap;
  width: 38px;
  text-align: center;
  box-sizing: border-box;
  float: none;
  border-radius: 2px;
  font-size: 90%;
  transform: translateY(-1px);
}
#qtoc .answer-votes.large {
  min-width: 16px;
  min-height: 20px;
  font-size: 11px;
}
#qtoc .post-hyperlink {
  display: inline-flex;
  flex-grow: 1;
  align-items: center;
  justify-content: flex-start;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}
#qtoc .deleted-user { /* Deleted user */
  display: inline-block;
  padding: 3px 5px;
  background: var(--red-600) !important;
  color: var(--white) !important;
  font-style: italic;
}
#qtoc .deleted-answer {
  margin-left: 0;
  padding-left: 0;
  border: 0;
}

/* Compat with us-bookmarkers */
#left-sidebar, .left-sidebar {
  z-index: 1;
}
.question:hover .votecell,
.question:hover .js-voting-container {
  z-index: 10;
}
.us-bookmarkers-popover.s-popover {
  width: auto;
}

/* Toggle deleted posts */
.SOMU-PHQT-hide-deleted #answers .answer.deleted-answer,
.SOMU-PHQT-hide-deleted #sidebar #qtoc .deleted-answer {
  display: none !important;
}


/* Named anchors functionality */
a.js-named-anchor {
  text-decoration: none !important;
  color: inherit !important;
}

/* Keep bottom margin for headings (broken by wrapping them inside an <a> element). */
.s-prose a.js-named-anchor > h1,
.s-prose a.js-named-anchor > h2,
.s-prose a.js-named-anchor > h3 {
  margin-bottom: revert;
}


/* Move share link to header to save space now that we have the follow button
  Reduce font size slightly
  This makes the six links stay in the same row
*/
.js-post-menu .lsep,
.js-post-menu .js-share-link {
  display: none;
}
.js-post-menu > a,
.js-post-menu > button {
  font-size: 0.95em;
  padding: 2px 0px;
  margin-right: 5px;
}


/* Overrides for election pages */
body.election-page #content {
  display: flex;
  flex-wrap: wrap;
}
body.election-page #content > div:not([id]):first-child {
  flex-basis: 100%;
}
`); // end stylesheet


// On script run
(function init() {
  initStickyPostHeaders();
  initTableOfContentsSidebar();
  initNamedAnchors();
})();