// ==UserScript==
// @name         Stack Print Styles
// @description  Print preprocessor and print styles for Stack Exchange Q&A, blog, and chat. Includes a handy load all comments button at bottom right.
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      2.0.11
//
// @match        https://*.stackoverflow.com/*
// @match        https://*.serverfault.com/*
// @match        https://*.superuser.com/*
// @match        https://*.askubuntu.com/*
// @match        https://*.mathoverflow.net/*
// @match        https://*.stackapps.com/*
// @match        https://*.stackexchange.com/*
// @match        https://stackoverflowteams.com/*
// @match        https://stackoverflow.blog/*
//
// @match        https://chat.stackoverflow.com/*
// @match        https://chat.stackexchange.com/*
// @match        https://chat.meta.stackexchange.com/*
//
// @exclude      https://api.stackexchange.com/*
// @exclude      https://data.stackexchange.com/*
// @exclude      https://contests.stackoverflow.com/*
// @exclude      https://winterbash*.stackexchange.com/*
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/se-ajax-common.js
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals StackExchange */
/// <reference types="./globals" />

'use strict';

function processTimestampTooltips() {
  $('.relativetime, .relativetime-clean').not('[data-timestamp]').each(function () {
    const title = $(this).attr('title');
    $(this).attr('data-timestamp', title.replace(/,.+$/, ''));
  });
  $('time[datetime]').not('[data-timestamp]').each(function () {
    const title = $(this).attr('datetime');
    $(this).attr('data-timestamp', title.replace('T', ' ') + 'Z');
  });
  $('#question-header').next().find('a[title]').each(function () {
    const title = $(this).attr('title');
    $(this).attr('data-timestamp', title);
  });
}

function loadAllAnswersAndComments(inclDeletedComments = false) {

  // Load answers from other pages (if more than one)
  function loadAllAnswers() {

    // Wrap all existing answers in a div
    let previousPage = $(`<div class="js-answer-page" data-page="1"></div>`).insertAfter('#answers-header');
    $('#answers').children('.answer, a[name]').not('[name="new-answer"], [name="tab-top"]').appendTo(previousPage);

    return new Promise(function (resolve, reject) {

      // Get other pages, if no other pages resolve immediately
      const pages = $('.pager-answers').first().children('a').not('[rel="prev"]').not('[rel="next"]');
      if (pages.length == 0) {
        console.log('only one page of answers');
        resolve();
        return;
      }

      // Remove pagination
      $('.pager-answers').remove();

      // Load each pager's url into divs below existing answers
      let deferreds = [];
      pages.each(function (i, el) {
        const pageNum = el.innerText.trim();
        const page = $(`<div class="js-answer-page" data-page="${pageNum}"></div>`).insertAfter(previousPage);
        const aj = page.load(el.href + ' #answers', function () {
          page.children().children().not('.answer, a').remove();
        });
        previousPage = page;
        deferreds.push(aj);
      });

      // Resolve when all pages load
      $.when.all(deferreds).then(function () {
        console.log('loaded all answer pages');

        // short delay to allow comments to be added to page
        setTimeout(() => { resolve(); }, 2000);
      }, reject);
    });
  }

  // Always expand comments if comments have not been expanded yet
  function loadAllComments(inclDeletedComments) {
    return new Promise(function (resolve, reject) {
      let deferreds = [];

      $('.question, #answers .answer').find('.js-comments-container').not('.js-del-loaded').addClass('js-del-loaded').each(function () {
        // Get post id which is required for loading comments
        const postId = this.dataset.answerid || this.dataset.questionid || this.dataset.postId;

        // Remove default comment expander after loading comments
        const elems = $(this).next().find('.js-show-link.comments-link:visible').prev('.js-link-separator').addBack();

        // If no comment expander and not loading deleted comments,
        // do nothing else since everything is already displayed
        if (!inclDeletedComments && elems.length == 0) {
          return;
        }

        // Get all including deleted comments
        // This method will avoid jumping to comments section
        const commentsUrl = `/posts/${postId}/comments?includeDeleted=${inclDeletedComments}&_=${Date.now()}`;
        const aj = $('#comments-' + postId).show().children('ul.js-comments-list').load(commentsUrl, function () {
          console.log('loaded comments ' + postId);
          elems.remove();
        });
        deferreds.push(aj);
      });

      // Resolve when all comments load
      $.when.all(deferreds).then(function () {
        console.log('loaded all comments');

        // short delay to allow comments to be added to page
        setTimeout(() => { resolve(); }, 2000);
      }, reject);

    });
  }

  // Short delay for Q&A to init
  setTimeout(() => {

    // Do one then the other after
    loadAllAnswers().then(() => loadAllComments(inclDeletedComments));
  }, 1000);
}


// Append styles
addStylesheet(`
/* Styles for loading comments buttons */
.print-comment-buttons {
  position: fixed !important;
  bottom: 3px;
  right: 3px;
  z-index: 999999;
}
.print-comment-buttons:hover button {
  display: inline-block !important;
}
.print-comment-buttons button {
  display: none;
  margin-right: 3px;
  opacity: 0.5;
}
.print-comment-buttons button:hover {
  opacity: 1;
}
.print-comment-buttons button:nth-last-child(1) {
  display: inline-block;
  margin-right: 0;
}
`); // end stylesheet


// On script run
(function init() {

  if (location.hostname.includes('chat.')) {
    appendChatPrintStyles();
  }
  else if (document.getElementById('question') || location.pathname.includes('/questions/') || document.body.classList.contains('unified-theme')) {
    appendQnaPrintStyles();
    processTimestampTooltips();

    $(document).on('ajaxStop', processTimestampTooltips);

    const commentButtons = $(`<div class="print-comment-buttons"><button>Load answers and comments</button></div>`).appendTo('body');
    if (StackExchange.options.user.isModerator) {
      commentButtons.prepend(`<button data-incldeletedcomments="true">+ deleted comments</button>`);
    }

    commentButtons.on('click', 'button', function (evt) {

      // Remove buttons
      commentButtons.remove();

      const inclDeletedComments = !!evt.target.dataset.incldeletedcomments;
      loadAllAnswersAndComments(inclDeletedComments);

      return false;
    });
  }
})();


function appendQnaPrintStyles() {
  const qnaCss = `
@media print {

  html, body {
    max-width: none;
  }
  body {
    font-size: 1rem;
    background-color: #fff;
    background-image: none;
  }
  .comments,
  .comments .comment-body > * {
    font-size: 1.1rem;
    line-height: 1.35;
  }
  header,
  footer,
  #topbar,
  #sidebar,
  #left-sidebar,
  #footer,
  #post-form,
  body > span,
  .site-header,
  .deleted-comment-info,
  .comment-flagging,
  .comment-voting,
  .js-post-issue,
  .comments + div[id^="comments-link"],
  .pager-answers,
  .bottom-notice,
  a.new-answer,
  .js-comment-edit,
  .js-comment-delete,
  .z-banner,
  #edit-tags,
  .js-bookmark-btn,
  .js-new-contributor-indicator,
  .new-contributor-indicator
  {
    display: none;
  }

  #content
  .question-page #answers .answer {
    border: none;
  }

  /* Lighten bg of deleted answers */
  .deleted-answer {
    background-color: #fff8f8;
  }
  /* Do not fade downvoted answers */
  .downvoted-answer .comment-body,
  .downvoted-answer .post-signature,
  .downvoted-answer .s-prose,
  .downvoted-answer .vote>* {
    opacity: 1;
  }

  /* Don't show if you have voted */
  .js-voting-container .s-btn {
    color: inherit;
  }

  /* No relative dates */
  .relativetime,
  .relativetime-clean,
  #question-header + .grid > .flex--item time,
  #question-header + .grid > .flex--item a {
    font-size: 0;
  }
  .relativetime:before,
  .relativetime-clean:before,
  #question-header + .grid > .flex--item time:before,
  #question-header + .grid > .flex--item a:before {
    content: attr(data-timestamp);
    font-size: 13px;
    white-space: nowrap;
  }
  .comment-date .relativetime:before,
  .comment-date .relativetime-clean:before,
  .user-info .user-action-time .relativetime:before,
  .user-info .user-action-time .relativetime-clean:before {
    font-size: 12px;
  }

  /* Answers starts on a new page */
  #answers-header,
  #answers .pager-answers + a[name],
  #answers-header + .js-answer-page[data-page="1"] > a:first-child {
    page-break-before: avoid;
  }
  #answers > a,
  .js-answer-page > a {
    display: block;
    height: 1px;
    page-break-before: always;
  }
  #answers > a:nth-of-type(2),
  #answers > a:last-of-type,
  .js-answer-page[data-page="1"] > a:first-child,
  #mainbar > table .msg {
    page-break-before: always;
  }

  /* Deleted comments on deleted posts */
  .deleted-answer .comments .comment.deleted-comment .comment-text,
  .deleted-answer .comments .comment.deleted-comment .comment-actions {
    background-color: var(--red-100);
  }

  /* Embiggen images */
  .s-prose p {
    page-break-inside: avoid;
  }
  .s-prose img {
    width: auto;
    max-width: 100%;
    max-height: 90vh;
    page-break-inside: avoid;
  }

  /* Do not break comments and usercards between pages */
  .comment-text,
  .post-signature,
  .user-gravatar32,
  .s-prose ~ div {
    page-break-inside: avoid;
  }

  /* Hide/Reset SOMU stuff */
  #somusidebar,
  #usersidebar,
  .redact-buttons,
  .print-comment-buttons,
  .post-id,
  .post-mod-menu-link,
  .mod-userlinks,
  .somu-mod-message-link,
  .comment-flagcount,
  .meta-mentioned {
    display: none;
  }
  .votecell .vote,
  .votecell .js-voting-container,
  .post-stickyheader {
    position: relative;
    top: 0;
  }
  .post-stickyheader .relativetime {
    border-bottom: none;
  }
  .deleted-answer .votecell .vote, .deleted-answer .votecell .js-voting-container {
    background-color: transparent;
  }

  /* Hide/Reset other userscripts stuff */
  #roombaFieldRow,
  .mod-tools,
  .pronouns
  {
    display: none;
  }

}
`.replace(/ !important/g, '').replace(/;/g, ' !important;'); // failsafe to prevent dupe !important
  addStylesheet(qnaCss);

} // End QnA styles


function appendChatPrintStyles() {
  const printCss = `
@media print {

  html, body {
    max-width: 780px;
  }
  body {
    font-size: 11px;
    background-color: #fff;
    background-image: none;
  }

  body > span[style*="absolute"],
  #topbar,
  .topbar,
  #feed-ticker,
  #bottom,
  #input-area,
  #sound,
  input,
  button,
  .button,
  #container > a,
  #container > br,
  #widgets > .sidebar-widget:nth-child(2),
  #widgets > .sidebar-widget:last-child,
  #sidebar .more,
  #sidebar .user-currentuser,
  #sidebar .js-hasfull .message-orig,
  #sidebar #room-ad,
  #toggle-favorite,
  #transcript-body #info br,
  #transcript-body .room-mini ~ br,
  #transcript-body .room-mini .mspbar.now,
  #transcript-body #info .tag,
  #transcript-body #transcript-logo,
  #transcript-body #copyright,
  #transcript-body .action-link,
  #transcript-body .transcript-nav,
  .monologue .avatar,
  .message-controls,
  .message > .action-link,
  .message > .meta,
  .username .name + br,
  .username .pronouns
  {
    display: none;
  }

  #sidebar #info #roomdesc > div,
  #starred-posts > div > ul > li,
  .ob-message.js-onebox-hidden,
  #chat .monologue:first-child .js-dynamic-timestamp
  {
    display: block;
  }

  #sidebar .js-hasfull .message-full
  {
    display: inline;
  }

  #main {
    display: flex;
    flex-direction: column-reverse;
    width: 100%;
  }
  #sidebar {
    position: relative;
    width: auto;
    margin: 10px 0 20px;
    padding: 10px;
    border: 1px dotted black;
  }
  #transcript-body #container {
    padding: 0;
  }
  #transcript-body #sidebar {
    margin-top: 0;
    margin-bottom: -10px;
  }
  #sidebar #info #roomdesc {
    position: relative;
    height: auto;
    padding-bottom: 0;
    border: none;
    background: transparent;
    white-space: unset;
  }
  #sidebar #info #roomdesc + #sidebar-menu {
    margin-top: 10px;
  }
  #sidebar #present-users-list {
    max-height: none;
    overflow: visible;
    color: #000;
  }
  #sidebar #present-users-list li {
    flex: 0 0 20%;
  }
  #sidebar #present-users-list li.inactive {
    opacity: 0.7;
  }
  #sidebar #starred-posts ul.collapsible,
  #sidebar #starred-posts ul.collapsible.expanded {
    max-height: none;
    padding-bottom: 0;
    overflow: visible;
  }
  #chat-body #container {
    padding-top: 0;
  }
  #chat {
    padding-bottom: 20px;
  }
  .monologue {
    display: table;
    page-break-inside: avoid;
    width: calc(100% - 26px);
    margin: 0;
    padding: 0;
  }
  .monologue,
  .system-message-container {
    padding-top: 15px;
    margin-bottom: -15px;
  }
  .monologue .signature {
    flex: 0 1 120px;
    margin-right: 8px;
  }
  .monologue .messages {
    flex: 1 0 80%;
    border-color: #f2f2f2;
    background-color: #f8f8f8;
  }
  div.message.reply-parent,
  div.message.reply-child {
    border-color: #f2f2f2;
    background-color: #f8f8f8;
  }
  .monologue.catchup-marker {
    padding-top: 0;
    border-top: none;
  }
  #chat .message {
    display: flex;
  }
  .message {
    page-break-inside: avoid;
    border: none;
  }
  .message .content {
    flex: 1 1 100%;
    padding-right: 52px;
  }
  .message .mention {
    background-color: transparent;
  }
  div.message {
    padding-left: 15px;
  }
  div.message .full,
  div.message .partial {
    max-height: none;
  }
  #chat .messages .timestamp,
  #chat .message.cmmt-deleted span.deleted {
    position: absolute;
    right: 38px;
  }
  .stars .img {
    filter: saturate(0) grayscale(1) brightness(0);
  }
  #transcript-body .pager {
    text-align: center;
  }
  #transcript-body .pager > * {
    float: none;
    display: inline-block;
  }
  #transcript-body .pager .page-numbers {
    margin-bottom: 3px;
  }

  /* SOMU - Chat Transcript Helper - switch back to original timestamp (UTC) */
  .page-numbers[data-orig-text],
  .timestamp[data-orig-timestamp] {
    font-size: 0;
  }
  .page-numbers[data-orig-text]:before,
  .timestamp[data-orig-timestamp]:before {
    content: attr(data-orig-timestamp);
    font-size: 9px;
    white-space: nowrap;
  }
  .page-numbers[data-orig-text]:before {
    content: attr(data-orig-text);
    font-size: 14px;
  }

  /* Chat Transcript - room mini - expand full description */
  #transcript-body #info .room-mini {
    width: auto;
    margin-bottom: 15px;
  }
  #transcript-body #info .room-mini .room-mini-description {
    font-size: 0;
  }
  #transcript-body #info .room-mini .room-current-user-count,
  #transcript-body #info .room-mini .room-message-count {
    display: none;
    width: auto;
    font-size: 11px;
  }
  #transcript-body #info .room-mini .room-current-user-count:before,
  #transcript-body #info .room-mini .room-message-count:before,
  #transcript-body #info .room-mini .room-mini-description:before {
    display: inline-block;
    content: attr(title);
    margin-right: 3px;
    font-size: 11px;
    word-break: break-word;
  }

  /* Chat Transcript - convert calendar to text with year */
  #transcript-body #info > h2 {
    display: inline-block;
  }
  #transcript-body #info .icon .calendar,
  #transcript-body #info .calendar-small-link {
    display: none;
  }
  #transcript-body #info .icon {
    display: inline-block;
    float: none;
    font-size: 0;
  }
  #transcript-body #info .icon:before {
    content: attr(title);
    font-size: 16.5px;
    font-weight: bold;
  }

}
`.replace(/ !important/g, '').replace(/;/g, ' !important;'); // failsafe to prevent dupe !important
  addStylesheet(printCss);

} // End chat print styles
