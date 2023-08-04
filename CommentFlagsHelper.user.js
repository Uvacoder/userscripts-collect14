// ==UserScript==
// @name         Comment Flags Helper
// @description  Always expand comments (with deleted) and highlight expanded flagged comments, Highlight common chatty and rude keywords
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      8.4.13
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
// @match        https://*.stackoverflow.com/admin/users/*/post-comments*
// @match        https://*.serverfault.com/admin/users/*/post-comments*
// @match        https://*.superuser.com/admin/users/*/post-comments*
// @match        https://*.askubuntu.com/admin/users/*/post-comments*
// @match        https://*.mathoverflow.net/admin/users/*/post-comments*
// @match        https://*.stackapps.com/admin/users/*/post-comments*
// @match        https://*.stackexchange.com/admin/users/*/post-comments*
// @match        https://stackoverflowteams.com/c/*/admin/users/*/post-comments*
//
// @exclude      *?flagtype=posttoomanycommentsauto*
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
// @require      https://raw.githubusercontent.com/samliew/ajax-progress/master/jquery.ajaxProgress.js
// ==/UserScript==

/* globals StackExchange, store, fkey, MS */
/// <reference types="./globals" />

'use strict';

// This is a moderator-only userscript
if (!isModerator()) return;


const superusers = [584192];
const isSuperuser = superusers.includes(selfId);

let reviewFromBottom = false;
let $eventsTable, $eventsContainer, $events;


let siteModerators = []; // populated later
function getSiteModerators() {
  const storekey = 'SOMU-CFH:moderators';
  let v = JSON.parse(store.getItem(storekey));

  return new Promise(function (resolve, reject) {
    if (v != null) { siteModerators = v; resolve(v); return; }

    $.ajax(`${location.origin}/users?tab=moderators`)
      .done(function (data) {
        const users = $('#user-browser .user-info', data).find('a:first').get().map(el => Number(el.href.match(/\d+/)[0]));
        store.setItem(storekey, JSON.stringify(users));
        siteModerators = users;
        resolve(users);
      })
      .fail(reject);
  });
}

/**
 * @summary Filter out non-moderators from a selection of links
 * @returns {jQuery} jQuery object with only moderators (chainable)
 * @example $('a').moderatorsOnly();
 */
$.fn.moderatorsOnly = function () {
  return this.filter(function (i, el) {
    return el.href && el.href.includes('/users/') && siteModerators.includes(Number(el.dataset.uid || el.href.match(/\d+/)));
  });
};


// Special characters must be escaped with \\
const rudeKeywords = [
  'fuck\\w*', 'arse', 'cunts?', 'dick', 'cock', 'pussy', 'hell', 'stupid', 'idiot',
  'grow up', 'shame', 'wtf', 'garbage', 'trash', 'spam', 'damn', 'horrible', '(in)?ability',
  'nonsense', 'never work', 'illogical', 'fraud', 'crap', '(bull|cow|horse)?\\s?shit', 'screw',
  'reported', 'get lost', 'useless', 'deleted?', 'delete[\\w\\s]+(answer|question|comment)',
  'gay', 'lesbian', 'sissy', 'brain', 'rtfm', 'blind', 'retard(ed)?', 'jerks?', 'bitch\\w*', 'silly',
  'read[\\w\\s]+(tutorial|docs|manual)', 'lack[\\w\\s]+research', 'https?:\\/\\/idownvotedbecau.se/\\w+/?',
  'googl(ed?|ing)\\s?', 'https:\\/\\/www.google[^\\s]+',
];
const rudeRegex = new RegExp('(\\s*)(' + rudeKeywords.join('|') + ')(?![/-])', 'gi');

// Special characters must be escaped with \\
const chattyKeywords = [
  'thanks?', 'thx', 'welcome', 'updated', 'edited', 'added', '(in)?correct(ed)?', 'done', 'worked', 'works', 'glad',
  'appreciated?', 'my email', 'email me', 'contact', 'good', 'great', 'sorry', '\\+1', 'love', 'wow', 'pointless', 'no\\s?(body|one)',
  'homework', 'no idea', 'your mind', 'try it', 'typo', 'wrong', 'unclear', 'regret', 'every\\s?(body|one)',
  'exactly', 'check', 'lol', 'ha(ha)+', 'women', 'girl', 'dude', 'effort', 'understand', 'want', 'need', 'little',
  'give up', 'documentation', 'what[\\w\\s]+(try|tried)[\\w\\s]*\\?*', 'free', 'obvious', 'tried',
  'move on', 'go away', 'stop', 'bad', 'bother', 'no sense', 'sense', 'learn', 'ugly', 'read', 'pay(ing)?',
  '(down|up)[-\\s]?vot(er|ed|e|ing)', '\\w{2,} off', 'jesus', 'allah', 'unnecessary', 'code(-\s)writing',
  '!!+', '\\?\\?+',
];
const chattyRegex = new RegExp('(\\s*)(' + chattyKeywords.join('|') + ')(?![/-])', 'gi');

// Special characters must be escaped with \\
const ignoreKeywords = [
  'attribution', 'plagiari[sz]ed?',
];
const ignoreRegex = new RegExp('(\\s*)(' + ignoreKeywords.join('|') + ')(?![/-])', 'gi');


function replaceKeywords(jqElem) {
  let text = ' ' + this.innerHTML;
  text = text.replace(/[*]+/g, ' * ').replace(rudeRegex, '$1<mark class="cmmt-rude">$2</mark>');
  text = text.replace(/[*]+/g, ' * ').replace(chattyRegex, '$1<mark class="cmmt-chatty">$2</mark>');
  text = text.replace(/[*]+/g, ' * ').replace(ignoreRegex, '$1<mark class="cmmt-ignore">$2</mark>');
  this.innerHTML = text;
}


// Dismiss all flags on comment
function dismissCommentFlags(cid) {
  return new Promise(function (resolve, reject) {
    if (typeof cid === 'undefined' || cid == null) { reject(); return; }

    $.post({
      url: `${location.origin}/admin/comment/${cid}/clear-flags`,
      data: { fkey: fkey }
    })
      .done(resolve)
      .fail(reject);
  });
}


// Delete all comments on post
function deleteCommentsOnPost(pid, removeWrapper = false) {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid == null) { reject(); return; }

    $.post({
      url: `${location.origin}/admin/posts/${pid}/delete-comments`,
      data: {
        'fkey': fkey,
        'mod-actions': 'delete-comments'
      }
    })
      .done(function (data) {
        const commentsWrapper = $('#comments-' + pid);
        if (removeWrapper) {
          commentsWrapper.remove();
          $('#comments-link-' + pid).html('<b>Comments deleted.</b>');
        }
        else {
          commentsWrapper.removeClass('js-del-loaded').children('ul.comments-list').empty();
        }
        resolve();
      })
      .fail(reject);
  });
}


// Load all comments on post
function loadCommentsOnPost(pid, loadDeletedComments = false) {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid == null) { reject(); return; }

    const commentsWrapper = $('#comments-' + pid);

    // Remove default comment expander
    const elems = $(this).next().find('.js-show-link.comments-link').prev().addBack();

    // Get all including deleted comments
    const commentsUrl = `/posts/${pid}/comments?includeDeleted=true&_=${Date.now()}`;
    commentsWrapper.children('ul.comments-list').load(commentsUrl, function () {
      elems.remove();
      resolve();
    });
  });
}


// Move all comments on post to chat
function moveCommentsOnPostToChat(pid) {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid == null) { reject(); return; }

    $.post({
      url: `${location.origin}/admin/posts/${pid}/move-comments-to-chat`,
      data: {
        'fkey': fkey,
        'deleteMovedComments': 'true'
      }
    })
      .done(function (data) {
        $('#comments-' + pid).remove();
        $('#comments-link-' + pid).html(`<span>${data.info}</span>`);
        resolve();
      })
      .fail(reject);
  });
}

function fetchUserCommentsPage(filter, pageNum) {
  return new Promise(function (resolve, reject) {
    if (typeof url === 'undefined' || url === null) { reject(); return; }
    if (isNaN(pageNum) || pageNum <= 0) { reject(); return; }

    $.get(`${location.origin}/${location.pathname}?${filter}&page=${pageNum}`)
      .done(resolve)
      .fail(reject);
  });
}

function bulkDeleteComments(commentIds) {
  return new Promise(function (resolve, reject) {
    if (typeof commentIds === 'undefined' || commentIds.length === 0) { reject(); return; }

    const datastring = 'commentIds%5B%5D=' + commentIds.join('&commentIds%5B%5D=') + '&action=delete&fkey=' + fkey;
    $.post(`${location.origin}/admin/comment/bulk-comment-change`, datastring)
      .done(resolve)
      .fail(reject);
  });
}

function recurseDeleteUserComments(filter, pageNum) {
  const button = $('#delete-all-btn').text('Deleting page: ' + pageNum);

  if (pageNum <= 0) {
    button.remove();
    return;
  }

  fetchUserCommentsPage(filter, pageNum).then(data => {
    const commentIds = $('.js-bulk-select', data).get().map(v => v.dataset.id);
    bulkDeleteComments(commentIds).then(async v => {
      if (pageNum <= 1) location.reload();
      else {
        await delay(2000);
        recurseDeleteUserComments(filter, pageNum - 1);
      }
    });
  });
}


function addPostCommentsModLinks() {

  $('div[id^="comments-link-"]').addClass('js-comments-menu');

  // Append link to post sidebar if it doesn't exist yet
  const allCommentMenus = $('.js-comments-menu');

  // Init those that are not processed yet
  allCommentMenus.not('.js-comments-menu-init').addClass('js-comments-menu-init').each(function () {

    const post = $(this).closest('.answer, .question');
    const pid = Number(post.attr('data-answerid') || post.attr('data-questionid')) || null;
    this.dataset.postId = pid;

    // If there are deleted comments, move from sidebar to bottom
    const delCommentsBtn = post.find('.js-fetch-deleted-comments');
    if (delCommentsBtn.length == 1) {
      const numDeletedComments = delCommentsBtn.attr('title').match(/\d+/)[0];
      $(this).append(`<span class="js-link-separator">&nbsp;|&nbsp;</span> <a class="js-show-link comments-link js-show-deleted-comments-link fc-red-600" title="expand to show all comments on this post (including deleted)" href="#" onclick="" role="button">load <b>${numDeletedComments}</b> deleted comment${numDeletedComments > 1 ? 's' : ''}</a>`);
      delCommentsBtn.hide();
    }

    // Add move to chat and purge links
    $(this).children('.mod-action-links').remove(); // in case added by another US
    $(this).append(`
      <div class="mod-action-links dno" style="float:right; padding-right:10px">
        <a data-post-id="${pid}" class="js-move-comments-link comments-link fc-red-600" title="move all comments to chat + delete all">move to chat</a>
        <a data-post-id="${pid}" class="js-purge-comments-link comments-link fc-red-600" title="delete all comments">purge all</a>
      </div>`);

  });

  // Show move/purge links depending on comments
  allCommentMenus.each(function () {
    const hasComments = $(this).prev().find('.comment').length > 0;
    $(this).find('.mod-action-links').toggle(hasComments);
  });
}


function initPostCommentsModLinksEvents() {

  const d = $('body').not('.js-comments-menu-events').addClass('js-comments-menu-events');

  d.on('click', 'a.js-show-deleted-comments-link', function () {
    const post = $(this).closest('.answer, .question');
    post.find('.js-fetch-deleted-comments').trigger('click');
  });

  d.on('click', 'a.js-move-comments-link', function () {
    const post = $(this).closest('.answer, .question');
    const pid = Number(this.dataset.postId) || null;
    moveCommentsOnPostToChat(pid);
  });

  d.on('click', 'a.js-purge-comments-link', function () {
    const post = $(this).closest('.answer, .question');
    const pid = Number(this.dataset.postId) || null;
    deleteCommentsOnPost(pid);
  });
}


function listenToPageUpdates() {

  // On any page update
  $(document).ajaxStop(function () {

    // Highlight flagged comments in expanded posts
    const $flaggedComms = $('.js-flagged-comment .js-comment').not('.roa-comment');
    $flaggedComms.each(function () {
      let cid = this.dataset.commentId;
      $('#comment-' + cid).addClass('js-active-flag');
    });

    // Always expand comments if post is expanded, if comments have not been expanded yet
    $('.question, .answer').find('.js-comments-container').not('.js-del-loaded').each(function () {

      const postId = this.dataset.postId;

      // So we only load deleted comments once
      $(this).addClass('js-del-loaded').removeClass('dno');

      // Remove default comment expander
      const elems = $(this).next().find('.js-show-link.comments-link').prev().addBack();

      // Get all including deleted comments
      const commentsUrl = `/posts/${postId}/comments?includeDeleted=true&_=${Date.now()}`;
      $('#comments-' + postId).children('ul.comments-list').load(commentsUrl, function () {
        elems.remove();
      });
    });

    // Continue reviewing from bottom of page if previously selected
    if (reviewFromBottom) {
      const scrLeft = document.documentElement.scrollLeft || document.body.scrollLeft || window.pageXOffset;
      window.scrollTo(scrLeft, 999999);
    }

    setTimeout(addPostCommentsModLinks, 100);
  });
}


// Append styles
addStylesheet(`
#footer,
.s-sidebarwidget.module,
.s-sidebarwidget.module ~ .module {
  display: none !important;
}
.js-admin-dashboard {
  position: relative;
}
.js-flagged-comment > .js-comment > .comment-form > .js-comment-edit-hide {
  min-height: 6em;
}
.js-flagged-comment > .js-comment .comment-copy {
  word-break: break-word;
}
.js-flagged-comment .relativetime.old-comment {
  color: coral;
}
.js-comment-flag-options > div,
.js-flagged-comment .js-comment-edit,
.js-comment-flag-options button[aria-controls^="extra-comment-flag-handling-options"] {
  display: none;
}
.js-flagged-post { /* for skip-post button */
  position: relative;
  padding-bottom: 25px;
}
.js-flagged-comment .js-comment-delete,
.js-flagged-comment .js-dismiss-flags,
.skip-post {
  margin-left: 20px;
  padding: 5px 8px;
  font-size: 1rem;
  background: var(--black-050);
}
.meta-row .delete-comment,
.meta-row .edit-comment,
.text-row .comment-flag-on .dismiss-comment {
  float: right;
  margin-top: -5px;
  margin-left: 10px;
  padding: 5px 8px;
  font-size: 1rem;
  background: var(--black-050);
}
.skip-post {
  position: absolute !important;
  bottom: 0;
  right: 0;
  white-space: nowrap;
  opacity: 0.3;
}
.skip-post:hover {
  background: var(--blue-400);
  color: var(--white);
  opacity: 1;
}
.text-row .comment-flag-on .dismiss-comment:hover,
.cancel-comment-flag:hover {
  color: var(--white);
  background: var(--red-500);
  z-index: 1;
}
.js-del-all-comments {
  color: var(--red-500) !important;
  font-weight: bold;
}
.js-comment-deleted {
  display: none !important;
}
table.flagged-posts tr.js-flagged-post:first-child > td {
  border-top: 1px solid transparent;
}
.js-dismiss-flags {
  position: relative;
}
.js-dismiss-flags .js-cancel-delete-comment-flag {
  position: absolute;
  top: 0;
  left: 100%;
  display: none;
  width: auto;
  height: 100%;
  padding: 5px 8px;
  color: var(--white);
  background: var(--red-500);
  border-left: 1px solid var(--black-050);
}
.js-dismiss-flags:hover .js-cancel-delete-comment-flag {
  display: block;
}
.js-cancel-delete-comment-flag {
  line-height:25px;
}
.comment.js-active-flag .js-comment-actions {
  position: relative;
}
.comment.js-active-flag .js-comment-actions:before {
  content: '';
  display: block;
  position: absolute;
  top: 0;
  left: -6px;
  bottom: 0;
  width: 4px;
  background: var(--orange-400) !important;
}
mark {
  color: inherit;
}
.cmmt-rude {
  background-color: var(--orange-200);
  border-bottom: var(--orange-700) solid 2px;
  font-weight: bold;
}
.cmmt-chatty {
  background-color: var(--orange-200);
  font-weight: bold;
}
.cmmt-ignore {
  font-weight: normal;
  font-style: italic;
}

#actionBtns {
  margin: 25px 24px 20px;
}
#actionBtns button {
  margin-top: 10px;
  margin-right: 10px;
}

/* General new mod interface stuff */
.js-admin-dashboard > div.flex--item {
  /* so the decline + delete option goes over the sidebar */
  position: relative;
  z-index: 1;
}
.visited-post {
  opacity: 0.7;
}
.js-flagged-post .bc-black-3 {
  border-color: var(--black-075) !important;
}
.js-admin-dashboard span[title]:hover {
  cursor: help !important;
}

/* Other new mod interface stuff */
.js-comment-flag-options {
  margin-left: 0 !important;
}
.js-comment-flag-options button {
  padding: 8px !important;
}

.js-comment-flag-options button,
.js-dismiss-flags {
  text-transform: lowercase;
}
.js-comment-flag-options button:hover {
  background: var(--black-150);
}
.js-comment-flag-options .js-dismiss-flags:hover {
  background: var(--red-500);
  color: var(--white);
}
`); // end stylesheet


function doPageLoad() {
  initPostCommentsModLinksEvents();

  // For Too Many Rude/Abusive queue, load user's R/A flagged comments
  if (location.search.includes('commenttoomanydeletedrudenotconstructiveauto')) {

    // Additional styles for this page
    addStylesheet(`
#mod-history {
  position: relative;
  top: 0;
}
.flagged-posts.moderator {
  margin-top: 0;
}
.js-flagged-post > td {
  padding-bottom: 50px !important;
}
.js-loaded-body,
.js-body-summary,
.js-flagged-post > td > table:first-child {
  display: none;
}
table.mod-message {
  font-size: 1.1em;
}
table.mod-message .flagcell {
  display: none;
}
table.comments {
  width: 100%;
  word-break: break-word;
}
table.comments {
  border: 1px solid var(--black-100);
}
table.comments > tr:last-child > td {
  border-bottom: 1px solid var(--black-100);
}
table.comments > tr:nth-child(even) {
  background: var(--black-025);
}
table.comments tr.roa-comment > td {
  height: auto;
  padding: 4px 10px;
  line-height: 1.4;
}
.roa-comment .relativetime {
  float: right;
}
.ra-userlinks {
  margin: 18px 0 0;
}
.visited-post,
.tagged-ignored {
  opacity: 1 !important;
}
`);

    $('.js-flag-text a[href*="/post-comments"]').attr('target', '_blank').each(function () {
      const uid = getUserId(this.href);
      const post = $(this).closest('.js-flagged-post');
      const flagText = $(this).parents('.js-flag-text');
      post.find('.js-post-header').hide();

      const commentsPageUrl = this.href.replace('http:', 'https:').replace('?state=All&flagState=all', '?flagState=all');
      this.href = commentsPageUrl;

      // Add links to user and comment history
      const userinfo = $(`<div class="ra-userlinks">[
          <a href="${location.origin}/users/${uid}" target="_blank">Profile</a> |
          <a href="${location.origin}/users/account-info/${uid}" target="_blank">Dashboard</a> |
          <a href="${location.origin}/users/history/${uid}?type=User+suspended" target="_blank">Susp. History</a> |
          <a href="${location.origin}/users/message/create/${uid}?action=abusive" target="_blank">Message/Suspend</a> |
          <a href="${location.origin}/admin/users/${uid}/post-comments?flagState=all" target="_blank">Comments</a>
        ]</div>`).appendTo(flagText);

      const flagGroup = post.find('.js-post-flag-group');
      const commentsContainer = $(`<table class="comments"></table>`).insertAfter(flagGroup);

      // Load latest R/A helpful comments
      $.get(commentsPageUrl, function (data) {

        // Filter and Transform
        const results = $('tbody tr', data).get()
        const rudeUnkindComments = results.filter(tr => tr.innerText.includes('Rude/Abusive') || tr.innerText.includes('Unfriendly'));

        rudeUnkindComments.forEach(tr => {
          const commentText = tr.children[1].children[0].innerText;
          const commentId = tr.dataset.id;
          const postId = tr.dataset.postid;
          //const permalink = toShortLink(tr.children[1].querySelector('.s-link').href);
          const timelinePermalink = `${location.origin}/posts/${postId}/timeline?filter=WithVoteSummaries#comment_${commentId}`;

          // Create new element and add data as attributes
          $(`<tr class="comment roa-comment"><td>${commentText}</td></tr>`)
            .toggleClass('deleted-comment', tr.classList.contains('bg-red-050'))
            .attr({
              'data-post-id': tr.dataset.postid,
              'data-id': tr.dataset.id,
              'data-timestamp': tr.querySelector('.relativetime').title,
            })
            .appendTo(commentsContainer)
            .each(replaceKeywords)
            .each(function () {
              $(`<a href="${timelinePermalink}" target="_blank">
                <span class="relativetime" title="${this.dataset.timestamp}">${this.dataset.timestamp}</span>
              </a>`).appendTo(this.children[0]);
            });
        });

        // Update relativetime links
        StackExchange.realtime.updateRelativeDates();

        // Remove old comments
        $('.comments .relativetime').filter((i, el) => el.innerText.includes("'")).closest('.roa-comment').remove();
      });
    });
  }

  // If commentrobotsaysunfriendly queue, hide comments with all other flag types
  if (location.search.includes('commentrobotsaysunfriendly')) {

    $('.revision-comment').filter((i, el) => el.innerText != 'Unfriendly or unkind (auto)').closest('.js-flagged-comment').remove();
  }

  // Insert 'skip' button to temporarily hide current post
  $('.js-flagged-post').append(`<a class="skip-post" title="skip (hide) this post" href="#">skip post</a>`);

  // Highlight chatty/rude keywords in comments
  $('.comment-copy, tr.text-row > td > span').each(replaceKeywords);

  // Change "dismiss" link to "decline", insert alternate action
  $('.js-flagged-comment .js-dismiss-flags').text('decline').append(`<span class="js-cancel-delete-comment-flag" title="dismiss flags AND delete comment">+delete</span>`);

  // If there are comment flags
  if ($('.js-comments-container').length > 0) {

    const actionBtns = $('<div id="actionBtns"></div>');
    $('.js-flagged-post').first().parent().prepend(actionBtns);

    function removePostsWithoutFlags() {
      $('.js-comments-container[data-comment-context="flag"]').filter(function () {
        return $(this).children('.js-flagged-comment').length === 0;
      }).parents('.js-flagged-post').remove();
    }

    // Hide recent comments button (day)
    $('<button class="s-btn s-btn__xs s-btn__filled">Ignore 2h</button>')
      .on('click', function () {
        $(this).remove();
        let now = Date.now();
        // Remove comments < twohours
        $('.js-comment-link').filter(function () {
          return now - new Date($(this).children('.relativetime').attr('title')).getTime() <= MS.twoHours;
        }).closest('.js-flagged-comment').addBack().remove();
        // Remove posts without comment flags
        removePostsWithoutFlags();
      })
      .appendTo(actionBtns);

    // Hide recent comments button (day)
    $('<button class="s-btn s-btn__xs s-btn__filled">Ignore 12h</button>')
      .on('click', function () {
        $(this).prev().remove();
        $(this).remove();
        let now = Date.now();
        // Remove comments < oneday
        $('.js-comment-link').filter(function () {
          return now - new Date($(this).children('.relativetime').attr('title')).getTime() <= (MS.oneDay / 2);
        }).closest('.js-flagged-comment').addBack().remove();
        // Remove posts without comment flags
        removePostsWithoutFlags();
      })
      .appendTo(actionBtns);

    // Hide recent comments button (week)
    $('<button class="s-btn s-btn__xs s-btn__filled">Ignore 1w</button>')
      .on('click', function () {
        $(this).prev().remove();
        $(this).prev().remove();
        $(this).remove();
        let now = Date.now();
        // Remove comments < oneweek
        $('.js-comment-link').filter(function () {
          return now - new Date($(this).children('.relativetime').attr('title')).getTime() <= MS.oneWeek;
        }).closest('.js-flagged-comment').addBack().remove();
        // Remove posts without comment flags
        removePostsWithoutFlags();
      })
      .appendTo(actionBtns);

    if (isSuperuser) {

      // Decline flags on mod comments
      if (location.search.includes('commentrobotsaysunfriendly') || location.search.includes('commentunwelcoming') || location.search.includes('commentrudeoroffensive')) {

        $('<button class="s-btn s-btn__xs s-btn__filled s-btn__danger" title="Decline flags on mod comments">Decline Mod</button>')
          .on('click', function () {
            console.log('declining R/A flags on mod comments (if any)');
            $(this).remove();
            const modComments = $('.comment-user:visible').moderatorsOnly().parents('.js-flagged-comment').find('.js-dismiss-flags');
            $('body').showAjaxProgress(modComments.length, { position: 'fixed' });
            modComments.trigger('click');
          })
          .appendTo(actionBtns)
          .trigger('click'); // auto
      }

      // Delete R/A comments on page
      $('<button class="s-btn s-btn__xs s-btn__filled s-btn__danger" title="Delete comments with rude/offensive keywords">Rude</button>')
        .on('click', function () {
          $(this).remove();
          const rudeComments = $('.cmmt-rude').filter(':visible').parents('.js-flagged-comment').find('.js-comment-delete');
          $('body').showAjaxProgress(rudeComments.length, { position: 'fixed' });
          rudeComments.trigger('click');
        })
        .appendTo(actionBtns);

      // Delete chatty comments on page
      $('<button class="s-btn s-btn__xs s-btn__filled s-btn__danger" title="Delete comments with chatty keywords">Chatty</button>')
        .on('click', function () {
          $(this).remove();
          const chattyComments = $('.cmmt-chatty, .cmmt-rude').filter(':visible').parents('.js-flagged-comment').find('.js-comment-delete');
          $('body').showAjaxProgress(chattyComments.length, { position: 'fixed' });
          chattyComments.trigger('click');
        })
        .appendTo(actionBtns);

      // Delete all comments left on page
      $('<button class="s-btn s-btn__xs s-btn__filled s-btn__danger" title="Delete all comments left on page">Delete</button>')
        .on('click', function () {
          if (!confirm('Confirm Delete ALL?')) return false;
          $(this).remove();
          const visibleComments = $('.js-comment-delete:visible');
          $('body').showAjaxProgress(visibleComments.length, { position: 'fixed' });
          visibleComments.trigger('click');
        })
        .appendTo(actionBtns);

      // Decline all comments left on page
      $('<button class="s-btn s-btn__xs s-btn__filled s-btn__danger" title="Decline all comments left on page">Decline</button>')
        .on('click', function () {
          if (!confirm('Confirm Decline ALL?')) return false;
          $(this).remove();
          const visibleComments = $('.js-dismiss-flags:visible');
          $('body').showAjaxProgress(visibleComments.length, { position: 'fixed' });
          visibleComments.trigger('click');
        })
        .appendTo(actionBtns);

      // Decline + Delete all comments left on page
      $('<button class="s-btn s-btn__xs s-btn__filled s-btn__danger" title="Decline + Delete all comments left on page">DD</button>')
        .on('click', function () {
          if (!confirm('Confirm Decline + Delete ALL?')) return false;
          $(this).remove();
          const visibleComments = $('.js-dismiss-flags:visible .js-cancel-delete-comment-flag');
          $('body').showAjaxProgress(visibleComments.length * 2, { position: 'fixed' });
          visibleComments.trigger('click');
        })
        .appendTo(actionBtns);
    }
    else {

      // Start from bottom link (only when more than 3 posts present on page)
      $('<button class="s-btn s-btn__xs s-btn__filled">Review from bottom</button>')
        .on('click', function () {
          reviewFromBottom = true;
          $(this).remove();
          $('.flagged-posts.moderator').css('margin-top', '600px');
          window.scrollTo(0, 999999);
        })
        .appendTo(actionBtns);
    }
  }

  // Convert urls in comments to clickable links that open in a new window
  $('.comment-summary')
    .html(function (i, v) {
      return v.replace(/(https?:\/\/[^\s\)]+)\b/gi, '<a href="$1" target="_blank" class="comment-link">$1</a>');
    })
    .on('click', 'a.comment-link', function (ev) {
      ev.stopPropagation();
    });

  // Highlight comments from last year or older
  const thisYear = new Date().getFullYear();
  $('.js-comment-link .relativetime').filter((i, el) => Number(el.title.substr(0, 4)) < thisYear).addClass('old-comment');

  // Shorten additional actions descriptions after flag
  $('.js-flag-text > span:last-child').not('[title]').not('.js-abbrev').addClass('js-abbrev').html(function (i, v) {
    return v.replace(/(added (\d+) comments?)/, '<span title="$1">$2C</span>')
      .replace(/(Vote Up)/gi, '<span title="$1">VU</span>')
      .replace(/(Vote Down)/gi, '<span title="$1">VD</span>')
      .replace(/(Deletion)/gi, '<span title="voted to delete">Deletion</span>')
      .replace(/(Moderator Review)/gi, '<span title="a moderator took previous action in the mod queue">Mod</span>');
  });

  // On delete/dismiss comment action
  $('.js-comment-delete, .js-dismiss-flags', '.js-flagged-comment').on('click', function () {

    const $post = $(this).parents('.js-flagged-post');

    // Sanity check
    if ($post.length !== 1) return;

    // Remove current comment from DOM
    const $comm = $(this).closest('.js-flagged-comment').addClass('js-comment-deleted').hide();

    // Hide post immediately if no comments remaining
    setTimeout(function ($post) {
      let $remainingComms = $post.find('.js-flagged-comment').not('.js-comment-deleted');
      if ($remainingComms.length === 0) $post.remove();
    }, 50, $post);
  });

  // On dismiss + delete comment action
  $('.js-cancel-delete-comment-flag', '.js-flagged-comment').on('click', function (evt) {
    evt.stopPropagation(); // we don't want to bubble the event, but trigger it manually

    const $post = $(this).parents('.js-flagged-post');
    const cid = $(this).closest('.js-flagged-comment').attr('data-comment-id');

    // Sanity check
    if ($post.length !== 1) return;

    // Dismiss flag by clicking on parent element
    $(this).parent().trigger('click');

    // Delete comment after a short delay
    setTimeout(function () {
      $.post(`${location.origin}/posts/comments/${cid}/vote/10`, { fkey: fkey });
    }, 500);

    return false;
  });

  // On purge all comments link click, hide flagged post
  $('.js-flagged-post').on('click', '.js-purge-comments-link', function () {
    const pid = this.dataset.postId;
    const $post = $(this).parents('.js-flagged-post');
    $post.hide();
  });

  // On skip post link click
  $('.js-flagged-post').on('click', '.skip-post', function () {

    // Hide post immediately so we can move on
    $(this).parents('.js-flagged-post').remove();

    return false;
  });

  // On user comments history page
  if (isSuperuser && location.pathname.includes('/admin/users/') && location.pathname.includes('/post-comments')) {

    // Init batch comments deleter
    const delAllComments = $(`<button id="delete-all-btn" class="flex--item mb12 ml12 s-btn s-btn__filled s-btn__danger js-delete-all" role="button">Delete ALL</button>`);
    delAllComments.on('click', function () {
      const searchUrl = location.search.slice(1).replace(/[&?]page=\d+/, '');
      const lastPageLink = $('.js-comments-table-container .s-pagination--item').not('[rel="next"]').last();
      const lastPageNum = Number(lastPageLink.text()) || 1; // no pagination, one/current page only
      const commentCount = Number($('.js-comment-count').text().match(/of (\d+)/)[1]);

      // Prompt
      if (!confirm(`Delete ALL ${commentCount} filtered comments starting from last page?`)) return;

      const button = $(this).prop('disabled', true);
      $('body').showAjaxProgress(lastPageNum * 2, { position: 'fixed' });
      recurseDeleteUserComments(searchUrl, lastPageNum);
    });
    $('.js-comment-search-form').parent().after(delAllComments);
  }
}


// On script run
(function init() {
  getSiteModerators().then(() => {
    doPageLoad();
    listenToPageUpdates();
  });
})();