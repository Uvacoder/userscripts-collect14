// ==UserScript==
// @name         Post Ban Deleted Posts
// @description  When user posts on SO Meta regarding a post ban, fetch and display deleted posts (must be mod) and provide easy way to copy the results into a comment
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      4.3
//
// @include      https://meta.stackoverflow.com/questions/*
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
// @grant        GM_xmlhttpRequest
// ==/UserScript==

/* globals StackExchange, parentUrl, MS */
/// <reference types="./globals" />

'use strict';

// This is a moderator-only userscript
if (!isModerator()) return;

const superusers = [584192];
const isSuperuser = superusers.includes(selfId);


// Append styles
addStylesheet(`
#question ~ .meta-mentioned {
  margin: 15px 0 0;
}
.meta-mentioned {
  position: relative;
  width: 100%;
  margin: 0 0 15px;
  padding: 10px 12px;
  background: var(--yellow-050);
  border: 1px solid #E0DCBF;
  box-sizing: border-box;
  z-index: 1;
}
#answers .meta-mentioned {
  margin: 15px 0 0;
}
.meta-mentioned * {
  box-sizing: border-box;
}
.meta-mentioned:hover {
  z-index: 100;
}
.meta-mentions-toggle {
  position: absolute;
  bottom: 0;
  right: 4px;
  display: block;
  width: 28px;
  height: 32px;
  cursor: pointer;
}
.meta-mentions-toggle:before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 4px;
  left: 0;
  background: var(--black-100);
  border-radius: 3px;
}
.meta-mentions-toggle:after {
  content: '';
  position: absolute;
  top: 10px;
  left: 8px;
  display: block;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 8px 6.5px 0 6.5px;
  border-color: var(--black-500) transparent transparent transparent;
}
.meta-mentions-toggle:hover:before {
  background: var(--black-400);
}
.meta-mentions-toggle:hover:after {
  border-color: var(--white) transparent transparent transparent;
}
.meta-mentions-toggle:hover + .meta-mentions,
.meta-mentions:hover {
  display: block;
}
.meta-mentions {
  display: none;
  position: absolute;
  top: 100%;
  max-width: calc(100% + 2px);
  width: calc(100% + 2px);
  min-height: 40px;
  margin-left: -13px;
  padding: 12px;
  background: var(--white);
  border: 1px solid var(--black-150);
  box-shadow: 5px 5px 5px -3px rgba(0,0,0,0.10);
  z-index: 1;
}
.meta-mentions .question-summary {
  max-width: 100%;
  padding: 10px 0;
}
.meta-mentions .question-summary:last-child {
  border: none;
}
.meta-mentions .question-summary .result-link {
  margin-bottom: 6px;
  font-size: 14px;
  line-height: 1.4;
}
.meta-mentions .question-summary .excerpt,
.meta-mentions .question-summary .started,
.meta-mentions .question-summary .started * {
  line-height: 1.4;
  font-size: 11px !important;
}
.meta-mentions .question-summary .started {
  margin-right: 10px;
  text-align: right;
}
.meta-mentions .question-summary .summary {
  max-width: 600px;
}
.meta-mentions .question-summary .post-tag {
  font-size: 11px;
  pointer-events: none;
}
.meta-mentions .bounty-award-container {
  display: none;
}
.meta-mentions .status {
  margin: 0;
}
.meta-mentions .vote-count-post,
.meta-mentions .question-summary .stats strong {
  font-size: 15px;
  line-height: 0.8;
}
.meta-mentions .question-summary .started {
  margin-top: 0;
}
.meta-mentions .statscontainer {
  padding-top: 5px;
}
.meta-mentions .statscontainer .votes,
.meta-mentions .statscontainer .status {
  font-size: 10px;
}
.meta-mentioned textarea {
  position: relative;
  display: block;
  width: calc(100% - 28px);
  height: 4.2em;
  margin-top: 10px;
}
.main-banned {
  margin: 15px 0;
}
`); // end stylesheet


// On script run
(function init() {

  const post = $('#question');
  const pid = Number(post.attr('data-questionid'));
  const postOwnerLink = $('.post-signature:last .user-details a[href*="/users/"]', post).first();
  const postText = ($('h1 .question-hyperlink').text() + $('.js-post-body p', post).text()).toLowerCase();
  const isDeleted = post.find('.js-post-notice a[href="/help/deleted-questions"]').length > 0;

  const postDate = new Date(post.find('.post-signature').last().find('.relativetime').attr('title'));
  const isRelativelyNew = postDate.getTime() - Date.now() < 3 * MS.oneDay; // three days

  // Is a deleted user, do nothing
  const uid = getUserId(postOwnerLink.attr('href'));
  if (!uid) return;

  const username = postOwnerLink.text().trim();
  const userRep = postOwnerLink.parent().find('.reputation-score').text().replace(',', '') || null;
  const hasDupeLink = $('.js-post-notice a, .comments-list a', post).filter((i, el) => /(https:\/\/meta\.stackoverflow\.com)?\/q(uestions)?\/255583\/?.*/.test(el.href)).length > 0;
  const hasTags = $('a.post-tag', post).filter((i, el) => ['post-ban', 'banning', 'deleted-'].some(v => el.innerText.contains(v))).length > 0;
  const hasKeywords = ['unable', 'cannot', 'can\'t', 'cant', 'create', 'block', 'no longer accepting'].some(v => postText.contains(v)) && ['question', 'answer', 'post', 'restrict', 'account'].some(v => postText.contains(v));

  // User rep too high, don't bother checking
  if (userRep == null || userRep.indexOf('k') > 0 || Number(userRep) >= 1000) return;

  // Definitely not a post ban question, ignore post
  if (!isDeleted && (!hasDupeLink && !hasTags && !hasKeywords)) return;

  // Get user ban stats on main
  ajaxPromise(`${parentUrl}/users/account-info/${uid}`).then(async function (data) {
    const blocked = $('.blocked-no, .blocked-yes', data);
    const qBan = blocked[0].innerText === 'yes';
    const aBan = blocked[1].innerText === 'yes';
    const eBan = blocked[2].innerText === 'yes';
    const rBan = blocked[3].innerText === 'yes';

    const banStats = $(`
      <div class="main-banned postcell post-layout--right">
          <b>${username} - bans on main: </b>
          <span>${qBan ? 'question' : ''}</span>
          <span>${aBan ? 'answer' : ''}</span>
          <span>${eBan ? 'suggested-edit' : ''}</span>
          <span>${rBan ? 'review' : ''}</span>
          <span>${!qBan && !aBan && !eBan && !rBan ? 'none!' : ''}</span>
      </div>`);

    post.find('.postcell').after(banStats);

    // Get deleted posts on main
    if (qBan) {
      await getDeletedPosts(uid, 'question');
    }
    if (aBan) {
      await delay(1000);
      await getDeletedPosts(uid, 'answer');
    }

    // If not superuser or post is not within past three days, do not auto-post anything
    if (!isSuperuser || !isRelativelyNew || !isSOMeta) return;
    await delay(1000);

    // Check if no comments on post containing the post ban meta post
    const hasPostBanComment = post.find('.comment-copy').filter((i, el) => el.innerHTML.includes('/255583')).length > 0;
    if (qBan && !hasPostBanComment) {
      addComment(pid, `Please read this: **[What can I do when getting “We are no longer accepting questions from this account”?](//meta.stackoverflow.com/q/255583)**`);
    }
  });

  async function getDeletedPosts(uid, postType) {

    const url = `${parentUrl}/search?q=user%3a${uid}%20is%3a${postType}%20deleted%3a1%20score%3a..0&pagesize=30&tab=newest`;
    ajaxPromise(url).then(function (data) {
      const count = Number($('.results-header h2, .fs-body3', data).first().text().replace(/[^\d]+/g, ''));
      const stats = $(`
        <div class="meta-mentioned">
            ${username} has <a href="${url}" target="_blank">${count} deleted ${postType}${pluralize(count)}</a> on the main site
            <span class="meta-mentions-toggle"></span>
            <div class="meta-mentions"></div>
        </div>`).insertAfter(post);

      // If no deleted posts, do nothing
      if (isNaN(count) || count <= 0) return;

      // Add deleted posts to the stats element
      const results = $('.js-search-results .s-post-summary, .js-search-results .s-card', data);
      stats.find('.meta-mentions').append(results);

      // Add copyable element to the results
      const hyperlinks = results.find('.s-post-summary--content-title a').attr('href', (i, v) => parentUrl + v).attr('target', '_blank');
      const hyperlinksMarkdown = hyperlinks.map((i, el) => `[${1 + i}](${toShortLink(el.href)})`).get();
      const comment = `[Deleted ${postType}${pluralize(count)}](${parentUrl}/users/deleted-${postType}s/current), score <= 0, contributing to the [${postType} ban](${parentUrl}/help/${postType}-bans): ${hyperlinksMarkdown.join(' ')}`;
      const commentArea = $(`<textarea readonly="readonly"></textarea>`).val(comment).appendTo(stats);

      // If not superuser or post is not within past three days, do not auto-post anything
      if (!isSuperuser || !isRelativelyNew) return;

      // If there are more comments or comments by myself, or deleted comments, ignore
      const hasMyComments = post.find(`.comment-user[href*="/users/${selfId}/"]`).length > 0;
      const hasDeletedComments = post.find('.js-fetch-deleted-comments, .js-show-deleted-comments-link').length > 0;
      if (post.find('.js-show-link:visible').length !== 0 || hasMyComments || hasDeletedComments) return;

      // Check if no comments on post starting with "Deleted question" or "Deleted answer"
      const hasDeletedComment = post.find('.comment-copy').filter((i, el) => el.innerText.toLowerCase().includes('deleted ' + type)).length > 0;
      if (!hasDeletedComment) {

        if (comment.length <= 600) {
          addComment(pid, comment).then(() => location.reload());
        }
      }
    });
  }
})();