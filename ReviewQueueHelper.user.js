// ==UserScript==
// @name         Review Queue Helper
// @description  Keyboard shortcuts, skips accepted questions and audits (to save review quota)
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      5.0.1
//
// @match        https://*.stackoverflow.com/review/*
// @match        https://*.serverfault.com/review/*
// @match        https://*.superuser.com/review/*
// @match        https://*.askubuntu.com/review/*
// @match        https://*.mathoverflow.net/review/*
// @match        https://*.stackapps.com/review/*
// @match        https://*.stackexchange.com/review/*
// @match        https://stackoverflowteams.com/c/*/review/*
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
// @match        https://*.stackoverflow.com/admin/dashboard?flagtype=*
// @match        https://*.serverfault.com/admin/dashboard?flagtype=*
// @match        https://*.superuser.com/admin/dashboard?flagtype=*
// @match        https://*.askubuntu.com/admin/dashboard?flagtype=*
// @match        https://*.mathoverflow.net/admin/dashboard?flagtype=*
// @match        https://*.stackapps.com/admin/dashboard?flagtype=*
// @match        https://*.stackexchange.com/admin/dashboard?flagtype=*
// @match        https://stackoverflowteams.com/c/*/admin/dashboard?flagtype=*
//
// @exclude      */review/*/stats
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

/* globals StackExchange, fkey, isSO, siteApiSlug, scriptName */
/// <reference types="./globals" />

'use strict';

/**
 * @typedef {"close"|"first-answers"|"first-questions"|"late-answers"|"low-quality-posts"|"reopen"|"suggested-edits"|"triage"} QueueType
 */

const superusers = [584192];
const isSuperuser = superusers.includes(StackExchange.options.user.userId);

/** @type {QueueType|null} */
const queueType = /^\/review/.test(location.pathname) ? location.pathname.replace(/\/\d+$/, '').split('/').pop() : null;

const filteredTypesElem = document.querySelector('.review-filter-summary');
const filteredTypes = filteredTypesElem ? (filteredTypesElem.innerText || '').replace(/; \[.*$/, '').split('; ') : [''];
const filteredElem = document.querySelector('.review-filter-tags');
const filteredTags = filteredElem ? (filteredElem.value || '').split(' ') : [''];
let processReview, currentReview = {}, post = {}, flaggedReason = null;
let isLinkOnlyAnswer = false, isCodeOnlyAnswer = false;
let numOfReviews = 0;
let remainingCloseVotes = null, remainingPostFlags = null;

let skipAudits = true, skipAccepted = false, skipUpvoted = false, skipMultipleAnswers = false, skipMediumQuestions = false, skipLongQuestions = false, autoCloseShortQuestions = false, autoCloseQuestions = false, downvoteAfterClose = false;

// Keywords to detect opinion-based questions
const opinionKeywords = ['fastest', 'best', 'recommended'];


/**
 * @summary gets current close votes quota for the user
 * @param {number[]} idPool ids of posts to open the popup on
 * @returns {Promise<number>}
 */
const getCloseVotesQuota = async (idPool) => {
  const firstId = idPool[0];

  const res = await fetch(`${location.origin}/flags/questions/${firstId}/close/popup`);
  if (!res.ok) {
    console.debug(`[${scriptName}] failed to get VTC quota`);
    return 0;
  }

  const data = await res.text();

  if (/this question is now closed/i.test(data)) {
    console.debug(`[${scriptName}] question ${firstId} is closed, attempting ${idPool[1]}`);
    await delay(3e3 + 100); // close popups are rate-limited to once in 3 seconds;
    return getCloseVotesQuota(idPool.slice(1));
  }

  if ($(data).find(".js-retract-close-vote").length) {
    console.debug(`[${scriptName}] voted on question ${firstId}, attempting ${idPool[1]}`);
    await delay(3e3 + 100); // close popups are rate-limited to once in 3 seconds;
    return getCloseVotesQuota(idPool.slice(1));
  }

  const num = Number($('.bounty-indicator-tab, .popup-actions .ml-auto.fc-light', data).last().text().replace(/\D+/g, ''));
  console.debug(`[${scriptName}] fetched VTC quota: ${num}`);

  return num;
};

/**
 * @summary requests and parses a list of post ids from /questions page
 * @returns {Promise<number[]>}
 */
const getFirstQuestionPagePostIds = async () => {
  /** @type {number[]} */
  const ids = [];

  const res = await fetch(`${location.origin}/questions`);
  if (!res.ok) return ids;

  const html = await res.text();

  $(html).find(".js-post-summary").each((_, el) => {
    const { postId } = el.dataset;
    if (postId) ids.push(+postId);
  });

  return ids;
};

function getFlagsQuota(viewablePostId = 1) {
  return new Promise(function (resolve, reject) {
    $.get(`${location.origin}/flags/posts/${viewablePostId}/popup`)
      .done(function (data) {
        const num = Number($('.bounty-indicator-tab, .popup-actions .ml-auto.fc-light', data).last().text().replace(/\D+/g, ''));
        console.debug(`[${scriptName}] flags quota: ${num}`);
        resolve(num);
      })
      .fail(reject);
  });
}

/**
 * @summary builds a post summary stats item
 * @param {...(string | Node)} content
 * @returns {HTMLElement}
 */
const makePostSummaryItem = (...content) => {
  const wrapper = document.createElement("div");
  wrapper.classList.add("s-post-summary--stats-item");
  wrapper.append(...content);
  return wrapper;
};

/**
 * @summary builds a badge indicator
 * @param {string} text badge text
 * @param {...string} classes additional CSS classes
 * @returns {HTMLElement}
 */
const makeIndicator = (text, ...classes) => {
  const wrapper = document.createElement("span");
  wrapper.classList.add("s-badge", "s-badge__sm", ...classes);
  wrapper.textContent = text;
  return wrapper;
};

/**
 * @summary appends a "Back" button to the review sidebar
 * @returns {Promise<HTMLElement>}
 */
const addGoBackButton = async () => {
  const goBackBtn = document.createElement("button");
  goBackBtn.classList.add("s-btn", "s-btn__outlined");
  goBackBtn.textContent = "Back";
  goBackBtn.type = "button";

  goBackBtn.addEventListener("click", () => history.back());

  const [{
    parentElement: reviewActionContainer
  }] = await waitForElem(".js-review-submit");

  if (!reviewActionContainer) {
    console.debug(`[${scriptName}] missing review action container`);
    return goBackBtn;
  }

  reviewActionContainer.append(goBackBtn);
  return goBackBtn;
};

async function displayRemainingQuota() {

  // Ignore mods, since we have unlimited power
  if (StackExchange.options.user.isModerator) {
    remainingCloseVotes = 0;
    remainingPostFlags = 0;
  }

  const idPool = await getFirstQuestionPagePostIds();

  // Oops, we don't have values yet, callback when done fetching
  if (remainingCloseVotes == null || remainingPostFlags == null) {
    try {
      const [cvQuota, fQuota] = await Promise.all([
        getCloseVotesQuota(idPool),
        getFlagsQuota(idPool[0])
      ]);

      remainingCloseVotes = cvQuota;
      remainingPostFlags = fQuota;
      displayRemainingQuota();

    } catch (error) {
      console.debug(`[${scriptName}] failed to fetch quotas:\n${error}`);
      return;
    }

    return;
  }

  // Clear old values
  $('.remaining-quota').remove();

  const postStats = document.querySelector(".s-post-summary--stats");
  if (!postStats) {
    console.debug(`[${scriptName}] missing post stats`);
    return;
  }

  // Display number of CVs and flags remaining
  postStats.append(
    makePostSummaryItem(makeIndicator(remainingCloseVotes, "coolbg"), " close votes left"),
    makePostSummaryItem(makeIndicator(remainingPostFlags, "supernovabg"), " flags left")
  );
}


function loadOptions(SOMU) {
  if (queueType == null) return;

  // Set option field in sidebar with current custom value; use default value if not set before
  SOMU.addOption(scriptName, 'Skip Accepted Questions', skipAccepted, 'bool');
  // Get current custom value with default
  skipAccepted = SOMU.getOptionValue(scriptName, 'Skip Accepted Questions', skipAccepted, 'bool');

  // Set option field in sidebar with current custom value; use default value if not set before
  SOMU.addOption(scriptName, 'Skip Upvoted Posts', skipUpvoted, 'bool');
  // Get current custom value with default
  skipUpvoted = SOMU.getOptionValue(scriptName, 'Skip Upvoted Posts', skipUpvoted, 'bool');

  // Set option field in sidebar with current custom value; use default value if not set before
  SOMU.addOption(scriptName, 'Skip Questions with >1 Answer', skipMultipleAnswers, 'bool');
  // Get current custom value with default
  skipMultipleAnswers = SOMU.getOptionValue(scriptName, 'Skip Questions with >1 Answer', skipMultipleAnswers, 'bool');

  // Set option field in sidebar with current custom value; use default value if not set before
  SOMU.addOption(scriptName, 'Skip Medium-length Questions', skipMediumQuestions, 'bool');
  // Get current custom value with default
  skipMediumQuestions = SOMU.getOptionValue(scriptName, 'Skip Medium-length Questions', skipMediumQuestions, 'bool');

  // Set option field in sidebar with current custom value; use default value if not set before
  SOMU.addOption(scriptName, 'Skip Long Questions', skipLongQuestions, 'bool');
  // Get current custom value with default
  skipLongQuestions = SOMU.getOptionValue(scriptName, 'Skip Long Questions', skipLongQuestions, 'bool');

  // Set option field in sidebar with current custom value; use default value if not set before
  SOMU.addOption(scriptName, 'Auto-open close dialogs', autoCloseQuestions, 'bool');
  // Get current custom value with default
  autoCloseQuestions = SOMU.getOptionValue(scriptName, 'Auto-open close dialogs', autoCloseQuestions, 'bool');

  // Set option field in sidebar with current custom value; use default value if not set before
  SOMU.addOption(scriptName, 'Try to close short Questions', autoCloseShortQuestions, 'bool');
  // Get current custom value with default
  autoCloseShortQuestions = SOMU.getOptionValue(scriptName, 'Try to close short Questions', autoCloseShortQuestions, 'bool');

  // Set option field in sidebar with current custom value; use default value if not set before
  SOMU.addOption(scriptName, 'Downvote after Question Closure', downvoteAfterClose, 'bool');
  // Get current custom value with default
  downvoteAfterClose = SOMU.getOptionValue(scriptName, 'Downvote after Question Closure', downvoteAfterClose, 'bool');

  // Set option field in sidebar with current custom value; use default value if not set before
  SOMU.addOption(scriptName, 'Skip Review Audits', skipAudits, 'bool');
  // Get current custom value with default
  skipAudits = SOMU.getOptionValue(scriptName, 'Skip Review Audits', skipAudits, 'bool');
}


let toastTimeout, defaultDuration = 2;

/**
 * @summary displays a toast message
 * @param {string} msg message text
 * @param {number} [durationSeconds] for how long to show it (seconds)
 * @returns {void}
 */
const toastMessage = (msg, durationSeconds = defaultDuration) => {
  const toast = document.getElementById("toasty");
  if (!toast) {
    const newToast = document.createElement("div");
    newToast.id = "toasty";
    newToast.textContent = msg;
    document.body.append(newToast);
    return toastMessage(msg, durationSeconds);
  }

  // Validation
  durationSeconds = Number(durationSeconds);
  if (typeof (msg) !== 'string') return;
  if (isNaN(durationSeconds)) durationSeconds = defaultDuration;

  // Clear existing timeout
  if (toastTimeout) clearTimeout(toastTimeout);

  // update toast message
  toast.textContent = msg;

  $(toast).show();

  // Log in browser console as well
  console.debug(`[${scriptName}] ${msg}`);

  // Hide div
  toastTimeout = setTimeout(() => $(toast).hide(), durationSeconds * 1000);
};


/**
 * @summary Close a question
 * @param {Number} pid question id
 * @param {String} closeReasonId close reason id
 * @param {Number} siteSpecificCloseReasonId off-topic reason id
 * @param {String} siteSpecificOtherText custom close reason text
 * @param {Number|null} duplicateOfQuestionId duplicate question id
 * @returns {Promise<void>}
 */
// closeReasonId:  'NeedMoreFocus', 'SiteSpecific', 'NeedsDetailsOrClarity', 'OpinionBased', 'Duplicate'
// (SO) If closeReasonId is 'SiteSpecific', siteSpecificCloseReasonId:  18-notsoftwaredev, 16-toolrec, 13-nomcve, 11-norepro, 3-custom, 2-migration
function closeQuestionAsOfftopic(pid, closeReasonId = 'SiteSpecific', siteSpecificCloseReasonId = 3, siteSpecificOtherText = 'I’m voting to close this question because ', duplicateOfQuestionId = null) {
  const isSO = location.hostname === 'stackoverflow.com';
  return new Promise(function (resolve, reject) {
    if (!isSO) { reject(); return; }
    if (typeof pid === 'undefined' || pid === null) { reject(); return; }
    if (typeof closeReasonId === 'undefined' || closeReasonId === null) { reject(); return; }
    if (closeReasonId === 'SiteSpecific' && (typeof siteSpecificCloseReasonId === 'undefined' || siteSpecificCloseReasonId === null)) { reject(); return; }

    if (closeReasonId === 'Duplicate') siteSpecificCloseReasonId = null;

    // Logging actual action
    console.debug(`[${scriptName}] %c Closing ${pid} as ${closeReasonId}, reason ${siteSpecificCloseReasonId}.`, 'font-weight: bold');

    $.post({
      url: `${location.origin}/flags/questions/${pid}/close/add`,
      data: {
        'fkey': fkey,
        'closeReasonId': closeReasonId,
        'duplicateOfQuestionId': duplicateOfQuestionId,
        'siteSpecificCloseReasonId': siteSpecificCloseReasonId,
        'siteSpecificOtherText': siteSpecificCloseReasonId == 3 && isSO ? 'This question does not appear to be about programming within the scope defined in the [help]' : siteSpecificOtherText,
        //'offTopicOtherCommentId': '',
        'originalSiteSpecificOtherText': 'I’m voting to close this question because '
      }
    })
      .done(resolve)
      .fail(reject);
  });
}


// Vote for post
// type: 2 - up, 3 - down, omitted = unupdownvote
function votePost(pid, type = 0) {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid === null) { reject(); return; }

    $.post({
      url: `${location.origin}/posts/${pid}/vote/${type}`,
      data: { fkey: fkey }
    })
      .done(resolve)
      .fail(reject);
  });
}
function upvotePost(pid) {
  return votePost(pid, 2);
}
function downvotePost(pid) {
  return votePost(pid, 3);
}


// Follow/Unfollow post
function followPost(pid, undo = false) {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid === null) { reject(); return; }

    $.post({
      url: `${location.origin}/posts/${pid}/vote/21?undo=${undo}`,
      data: { fkey: fkey }
    })
      .done(resolve)
      .fail(reject);
  });
}


function skipReview() {

  // If referred from meta or post timeline, and is first review, do not automatically skip
  if ((document.referrer.includes('meta.') || /\/posts\/\d+\/timeline/.test(document.referrer)) && numOfReviews <= 1) {
    console.debug(`[${scriptName}] review opened from Meta or post timeline page, not skipping`);
    return;
  }

  setTimeout(function () {
    // Remove instant actions
    $('.instant-actions').remove();
    // Click skip or next button
    $('.js-review-actions').find('button[title^="skip this"], button[title="review next item"]').trigger('click');
  }, 500);
}


function isAudit() {
  let audit = false;

  // Post does not have any of the filtered tags
  if (post.tags && post.tags.length && filteredTags[0] !== '' && !filteredTags.some(t => post.tags.includes(t))) {
    audit = true;
  }

  // Check post score
  else if (!isNaN(post.votes)) {

    let votes, error = false;
    $.ajax({
      url: `${location.origin}/posts/${post.id}/vote-counts`,
      async: false
    }).done(function (data) {
      votes = Number(data.up) + Number(data.down);
    }).fail(function () {
      console.error('failed fetching vote counts');
      error = true;
    });

    // Displayed post score not same as fetched vote score
    if (!error && votes !== post.votes) audit = true;
  }

  console.debug(`[${scriptName}] is audit: ${audit}`);
  return audit;
}


function displayPostKeywords() {
  if (!post.isQuestion) return;

  // Display post keywords
  post.issues = [];
  const header = $('.s-post-summary--stats').first();
  const resultsDiv = $(`<div id="review-keywords"></div>`).appendTo(header);

  const keywords = [
    'suggest', 'software', 'tool', 'library', 'tutorial', 'guide', 'blog', 'resource', 'plugin',
    'didn\'t work', 'doesn\'t work', 'want', 'help', 'advice', 'give',
    'I am new', 'I\'m new', 'Im new', 'beginner', 'newbie', 'explain', 'understand', 'example', 'reference', 'imgur'
  ];
  const foreignKeywords = [
    ' se ', ' de ', ' que ', ' untuk ',
  ];

  try {
    const paras = $(post.contentHtml).filter('p, ol, ul').text();
    const text = (post.title + paras).toLowerCase();
    const results = keywords.filter(v => text.includes(v.toLowerCase()));
    results.forEach(v => {
      $('<span>' + v + '</span>').appendTo(resultsDiv);
      post.issues.push(v);
    });

    const code = $('code', post.contentHtml).text();
    if (code.length < 60) {
      $('<span>no-code</span>').prependTo(resultsDiv);
      post.issues.unshift('no-code');
    };

    const postLinks = text.match(/href="http/g);
    if (postLinks && postLinks.length > 1) {
      $('<span>' + postLinks.length + ' links</span>').prependTo(resultsDiv);
      post.issues.unshift(postLinks.length + ' links');
    }

    const questionMarks = paras.match(/\?+/g);
    if (questionMarks && questionMarks.length > 1) {
      $('<span>' + questionMarks.length + '?</span>').prependTo(resultsDiv);
      post.issues.unshift(questionMarks.length + '?');
    }

    if (foreignKeywords.some(v => text.includes(v.toLowerCase()))) {
      $('<span>non-english</span>').prependTo(resultsDiv);
      post.issues.unshift('non-english');
    };
  }
  catch (e) {
    $('<span>bad-formatting</span>').appendTo(resultsDiv);
    post.issues.push('bad-formatting code-only');
  }

  if (post.content.length <= 500) {
    $('<span>short</span>').prependTo(resultsDiv);
    post.issues.unshift('short');
  }
  else if (post.content.length >= 8000) {
    $('<span>excessive</span>').prependTo(resultsDiv);
    post.issues.unshift('excessive');
  }
  else if (post.content.length >= 5000) {
    $('<span>long</span>').prependTo(resultsDiv);
    post.issues.unshift('long');
  }
}


function processCloseReview() {

  // Question has an accepted answer, skip if enabled
  if (skipAccepted && post.isQuestion && post.accepted) {
    toastMessage('skipping accepted question');
    skipReview();
    return;
  }

  // Post has positive score, skip if enabled
  if (skipUpvoted && post.votes > 3) {
    toastMessage('skipping upvoted post');
    skipReview();
    return;
  }

  // Question has multiple answers, skip if enabled
  if (skipMultipleAnswers && post.isQuestion && post.answers > 1) {
    toastMessage('skipping question with >1 answer');
    skipReview();
    return;
  }

  // Question body is too long, skip if enabled
  if (skipLongQuestions && post.isQuestion && post.content.length > 3000) {
    toastMessage('skipping long-length question, length ' + post.content.length);
    skipReview();
    return;
  }

  // Question body is of medium length, skip if enabled
  if (skipMediumQuestions && post.isQuestion && post.content.length > 1000) {
    toastMessage('skipping medium-length question, length ' + post.content.length);
    skipReview();
    return;
  }

  // Question body is short, try to close if enabled
  if (autoCloseQuestions || (autoCloseShortQuestions && post.isQuestion && post.content.length < 500)) {
    $('.js-review-actions button[title*="Close"], .close-question-link[data-isclosed="false"]').first().trigger('click');
    return;
  }
}


function processReopenReview() {

  // Post has positive score, skip if enabled
  if (skipUpvoted && post.votes > 3) {
    toastMessage('skipping upvoted post');
    skipReview();
    return;
  }

  // Question has multiple answers, skip if enabled
  if (skipMultipleAnswers && post.isQuestion && post.answers > 1) {
    toastMessage('skipping question with >1 answer');
    skipReview();
    return;
  }

  if (!isSuperuser) return;

  const shortPostBody = post.content.length < 500;
  const tooManyQuestions = post.content.includes('?') && post.content.match(/\?/g).length > 3;

  const diff = $('.sidebyside-diff');
  const adds = diff.find('.diff-add').text().length || 0;
  const subs = diff.find('.diff-delete').text().length || 0;

  const imageLinks = $('.inline-diff').find('a[href$="png"], a[href$="jpg"], a[href$="gif"]').length;
  const images = $('.inline-diff').find('img').length;
  const badImageLinks = imageLinks - images;

  console.log('adds', adds, 'subs', subs, 'badImageLinks', badImageLinks);

  // Question has comprehensive changes with no bad images, reopen
  if (adds > 400 && badImageLinks === 0 && !shortPostBody && !tooManyQuestions) {
    toastMessage('reopened');
    $('.js-review-actions button[title^="agree"]').removeAttr('disabled').trigger('click');
    $('#confirm-modal-body').next().children('.js-ok-button').trigger('click');
    return;
  }
  // Question has some edits with no bad images, ignore
  else if ((subs > 200 || adds > 200) && badImageLinks === 0) {
    toastMessage('skipping minor edits', 3);
    setTimeout(skipReview, 4000);
    return;
  }
  // Leave closed
  else {
    toastMessage('leave closed' + (badImageLinks > 0 ? ', has badImageLinks' : '') + (shortPostBody ? ', too short' : ''));
    $('.js-review-actions button[title^="disagree"]').removeAttr('disabled').trigger('click');
    return;
  }
}


function processLowQualityPostsReview() {
  const postEl = $('.reviewable-answer .js-post-body');
  const postText = postEl.text();
  const postHtml = postEl.html();
  const postNoCodeHtml = postEl.clone(true, true).find('pre, code').remove().end().html();

  // If post type is an answer
  if (!post.isQuestion) {

    // If is a short answer and there is a link in the post, select "link-only answer" option in delete dialog
    if (postText.length < 300 && /https?:\/\//.test(postHtml)) {
      isLinkOnlyAnswer = true;
      console.debug(`[${scriptName}] detected a possible link-only answer`);
    }

    // Try to detect if the post contains mostly code
    else if (postEl.find('pre, code').length > 0 &&
      (postNoCodeHtml.length < 50 || postHtml.length / postNoCodeHtml.length > 0.9)) {
      isCodeOnlyAnswer = true;
      console.debug(`[${scriptName}] detected a possible code-only answer`);
    }
  }
}


function insertInstantCloseButtons() {
  const actionsCont = $('.js-review-actions-error-target').first();
  if (actionsCont.length == 0) return;
  actionsCont.children('.instant-actions').remove();

  const instantActions = $(`
    <span class="instant-actions grid gs8 jc-end ff-row-wrap">
      <button class="s-btn s-btn__outlined flex--item" data-instant="unclear" title="Needs details or clarity">Unclear</button>
      <button class="s-btn s-btn__outlined flex--item" data-instant="broad" title="Needs more focus">Broad</button>
      <button class="s-btn s-btn__outlined flex--item" data-instant="softrec" title="It's seeking recommendations for books, software libraries, or other off-site resources">SoftRec</button>
      <button class="s-btn s-btn__outlined flex--item" data-instant="debug" title="It's seeking debugging help but needs more information">Debug</button>
      <button class="s-btn s-btn__outlined flex--item" data-instant="opinion" title="Opinion-based">Opinion</button>
    </span>`).appendTo(actionsCont);

  instantActions.one('click', 'button[data-instant]', function () {
    actionsCont.find('.instant-actions button').prop('disabled', true);
    const pid = post.id;

    // closeQuestionAsOfftopic() :
    // closeReasonId: 'NeedMoreFocus', 'SiteSpecific', 'NeedsDetailsOrClarity', 'OpinionBased', 'Duplicate'
    // if closeReasonId is 'SiteSpecific', offtopicReasonId : 11-norepro, 13-nomcve, 16-toolrec, 3-custom
    let error = false;
    switch (this.dataset.instant) {
      case 'unclear':
        closeQuestionAsOfftopic(pid, 'NeedsDetailsOrClarity');
        break;
      case 'broad':
        closeQuestionAsOfftopic(pid, 'NeedMoreFocus');
        break;
      case 'softrec':
        closeQuestionAsOfftopic(pid, 'SiteSpecific', 16);
        break;
      case 'debug':
        closeQuestionAsOfftopic(pid, 'SiteSpecific', 13);
        break;
      case 'opinion':
        closeQuestionAsOfftopic(pid, 'OpinionBased');
        break;
      default: {
        error = true;
        console.error('invalid option');
      }
    }

    if (!error) {
      // immediately skip to next review
      if (!isSuperuser) {
        skipReview();
      }
      else {
        location.reload();
      }
    }
  });
}


function insertVotingButtonsIfMissing() {
  const reviewablePost = $('.reviewable-post');
  if (reviewablePost.length == 0) return; // e.g.: suggested edits

  const pid = Number(reviewablePost[0].className.replace(/\D+/g, ''));
  const isQuestion = reviewablePost.find('.question').length == 1;

  const voteCont = reviewablePost.find('.js-voting-container').first();
  if (voteCont.length == 0) return;

  const upvoteBtn = `<button class="js-vote-up-btn flex--item s-btn s-btn__unset c-pointer" title="This question shows research effort; it is useful and clear" aria-pressed="false" aria-label="up vote" data-selected-classes="fc-theme-primary"><svg aria-hidden="true" class="svg-icon m0 iconArrowUpLg" width="36" height="36" viewBox="0 0 36 36"><path d="M2 26h32L18 10 2 26z"></path></svg></button>`;
  const dnvoteBtn = `<button class="js-vote-down-btn flex--item s-btn s-btn__unset c-pointer" title="This question does not show any research effort; it is unclear or not useful" aria-pressed="false" aria-label="down vote" data-selected-classes="fc-theme-primary"><svg aria-hidden="true" class="svg-icon m0 iconArrowDownLg" width="36" height="36" viewBox="0 0 36 36"><path d="M2 10h32L18 26 2 10z"></path></svg></button>`;

  if (voteCont.find('.js-vote-up-btn, .js-vote-down-btn').length != 2) {
    voteCont.find('.fs-caption').remove();
    voteCont.find('.js-vote-count').removeClass('mb8').addClass('fc-black-500 fd-column ai-center flex--item grid').unwrap().before(upvoteBtn).after(dnvoteBtn);

    StackExchange.vote.init(pid);
  }
}


function listenToKeyboardEvents() {

  // Focus Delete button when radio button in delete dialog popup is selected
  $(document).on('click', '#delete-question-popup input:radio', function () {
    $('#delete-question-popup').find('input:submit, .js-popup-submit').focus();
  });

  // Focus Flag button when radio button in flag dialog popup is selected, UNLESS it's the custom reason option
  $(document).on('click', '#popup-flag-post input:radio', function (evt) {

    // If custom reason option, do nothing
    if (this.value == 'PostOther') return;

    $('#popup-flag-post').find('input:submit, .js-popup-submit').focus();
  });

  // Focus Reject button when radio button in edit reject dialog popup is selected
  $(document).on('click', '#rejection-popup input:radio', function () {
    if ($(this).hasClass('custom-reason')) $('textarea.custom-reason-text').focus();
    else $('#rejection-popup').find('input:submit, .js-popup-submit').focus();
  });

  // Cancel existing handlers and implement our own keyboard shortcuts
  $(document).off('keypress keyup');

  // Keyboard shortcuts event handler
  $(document).on('keyup', function (evt) {
    // Back buttons: escape (27)
    // Unable to use tilde (192) as on the UK keyboard it is swapped the single quote keycode
    const cancel = evt.keyCode === 27;
    const goback = evt.keyCode === 27;

    // Get numeric key presses
    let index = evt.keyCode - 49; // 49 = number 1 = 0 (index)
    if (index == -1) index = 9; // remap zero to last index
    if (index < 0 || index > 9) { // handle 1-0 number keys only (index 0-9)

      // Try keypad keycodes instead
      let altIndex = evt.keyCode - 97; // 97 = number 1 = 0 (index)
      if (altIndex == -1) altIndex = 9; // remap zero to last index
      if (altIndex >= 0 && altIndex <= 9) {
        index = altIndex; // handle 1-0 number keys only (index 0-9)
      }
      else {
        // Both are invalid
        index = null;
      }
    }

    // Do nothing if key modifiers were pressed
    if (evt.shiftKey || evt.ctrlKey || evt.altKey) return;

    // If edit mode, cancel if esc is pressed
    if (cancel && $('.editing-review-content').length > 0) {
      $('.js-review-cancel-button').trigger('click');
      return;
    }


    // Get current popup
    const currPopup = $('#delete-question-popup, #rejection-popup, #popup-flag-post, #popup-close-question').filter(':visible').last();

    // #69 - If a textbox or textarea is focused, e.g.: comment box
    // E.g.: if post is being edited or being commented on
    if (document.activeElement.tagName == 'TEXTAREA' ||
      (document.activeElement.tagName == 'INPUT' && document.activeElement.type == 'text') ||
      document.getElementsByClassName('editing-review-content').length > 0) {

      // Just unfocus the element if esc was pressed
      if (currPopup.length && goback) document.activeElement.blur();
      return;
    }


    // If there's an active popup
    if (currPopup.length) {

      // If escape key pressed, go back to previous pane, or dismiss popup if on main pane
      if (goback) {

        // If displaying a single duplicate post, go back to duplicates search
        const dupeBack = currPopup.find('.original-display .navi a').filter(':visible');
        if (dupeBack.length) {
          dupeBack.trigger('click');
          return false;
        }

        // Go back to previous pane if possible,
        // otherwise default to dismiss popup
        const link = currPopup.find('.popup-close a, .popup-breadcrumbs a, .js-popup-back').filter(':visible');
        if (link.length) {
          link.last().trigger('click');
          // Always clear dupe closure search box on back action
          $('#search-text').val('');
          return false;
        }
      }

      // If valid index, click it
      else if (index != null) {
        const currPopup = $('.popup:visible').last();
        // Get active (visible) pane
        const pane = currPopup.find('form .action-list, .popup-active-pane').filter(':visible').last();
        // Get options
        const opts = pane.find('input:radio');
        // Click option
        const opt = opts.eq(index).trigger('click');
        // Job is done here. Do not bubble if an option was clicked
        return opt.length !== 1;
      }

    } // end popup is active


    // Review action buttons
    if (index != null && index <= 4) {
      const btns = $('.js-review-actions button');

      // If there is only one button and is "Next", click it
      const nextBtn = document.querySelector(".js-review-instructions button[value='254']")?.click();

      // Default to clicking review buttons based on index
      btns.eq(index).trigger('click');
      return false;
    }
    // Instant action buttons
    else if (index != null && index >= 5) {
      const btns = $('.instant-actions button');
      btns.eq(index - 5).trigger('click');
      return false;
    }
  });
}


function doPageLoad() {

  // Focus VTC button when radio button in close dialog popup is selected
  $(document).on('click', '#popup-close-question input:radio', function (evt) {

    // If dupe radio, do nothing
    if (this.value === 'Duplicate') return;

    // If custom reason option, do nothing
    if (this.value == '3') return;

    // If migrate anywhere radio, do nothing
    if (this.id === 'migrate-anywhere') return;

    $('#popup-close-question').find('input:submit, .js-popup-submit').focus();
  });

  // Review queues styles
  if (/\/review\//.test(location.pathname)) {
    addReviewQueueStyles();
  }

  // If in queue history page
  if (/\/history$/.test(location.pathname)) {

    let userId = location.search.match(/userId=\d+/) || '';
    if (userId) userId = '&' + userId;

    const filterTabs = $(`
      <div id="review-history-tabs" class="tabs">
        <a href="?skipped=true${userId}" class="${location.search.includes('skipped=true') ? 'youarehere' : ''}">Show All</a>
        <a href="?skipped=false${userId}" class="${location.search.includes('skipped=true') ? '' : 'youarehere'}">Default</a>
      </div>`);

    const actions = $('.history-table tbody tr').map((i, el) => {
      const actionName = el.children[2].innerText.trim();
      el.dataset.actionType = actionName.toLowerCase().replace(/\W+/gi, '-');
      return actionName;
    }).get();
    const historyTypes = [...new Set(actions)].sort();
    historyTypes.forEach(function (actionName) {
      const actionSlug = actionName.toLowerCase().replace(/\W+/gi, '-');
      filterTabs.append(`<a data-filter="${actionSlug}">${actionName}</a>`);
    });

    $('.history-table').before(filterTabs);

    // Filter options event
    $('#review-history-tabs').on('click', 'a[data-filter]', function () {

      // Unset if set, and show all
      if ($(this).hasClass('youarehere')) {

        $('.history-table tbody tr').show();

        // Update active tab highlight class
        $(this).removeClass('youarehere');
      }
      else {

        // Filter posts based on selected filter
        $('.history-table tbody tr').hide().filter(`[data-action-type="${this.dataset.filter}"]`).show();

        // Update active tab highlight class
        $(this).addClass('youarehere').siblings('[data-filter]').removeClass('youarehere');
      }

      return false;
    });

    // Triage, filter by "Requires Editing" (or new "Needs community edit") by default
    if (/\/triage\/history$/.test(location.pathname)) {
      $('a[data-filter="needs-community-edit"]').trigger('click');
    }
  }

  // Not in a review queue, do nothing. Required for ajaxComplete function below
  if (queueType == null) return;
  console.debug(`[${scriptName}] queue type: ${queueType}`);

  // Add additional class to body based on review queue
  document.body.classList.add(queueType + '-review-queue');

  // Detect queue type and set appropriate process function
  switch (queueType) {
    case 'close':
      processReview = processCloseReview; break;
    case 'reopen':
      processReview = processReopenReview; break;
    case 'suggested-edits':
      processReview = processCloseReview; break;
    case 'low-quality-posts':
      processReview = processLowQualityPostsReview; break;
    case 'triage':
      processReview = processCloseReview; break;
    case 'first-posts':
      processReview = processCloseReview; break;
    case 'late-answers':
      processReview = processCloseReview; break;
    default:
      break;
  }

  // Handle follow/unfollow feature ourselves
  $('#content').on('click', '.js-somu-follow-post', function () {
    const link = this;
    const postType = this.dataset.postType;
    const undo = this.innerText === 'unfollow';
    followPost(this.dataset.pid, undo).then(v => {
      link.innerText = undo ? 'follow' : 'unfollow';
      if (undo) StackExchange.helpers.showToast('You’re no longer following this ' + postType);
    });
  });
}


function repositionReviewDialogs(scrollTop = true) {

  // option to scroll to top of page
  scrollTop ? setTimeout(() => window.scrollTo(0, 0), 100) : 0;

  // position dialog
  $('.popup').css({
    top: 100,
    left: 680
  });
}


function listenToPageUpdates() {

  // On any page update
  $(document).ajaxComplete((event, xhr, settings) => {
    const { responseJSON } = xhr;

    // Do nothing with fetching vote counts
    if (settings.url.includes('/vote-counts')) return;

    // Do nothing with saving preferences
    if (settings.url.includes('/users/save-preference')) return;

    if (settings.url.includes('/close/add')) {
      !isNaN(remainingCloseVotes) ? remainingCloseVotes-- : null;
    }
    if (settings.url.includes('/add/PostOther')) {
      !isNaN(remainingPostFlags) ? remainingPostFlags-- : null;
    }

    // Close dialog loaded
    if (settings.url.includes('/close/popup')) {
      const postId = Number(settings.url.match(/\/(\d+)\//)[1]);

      setTimeout(function (postId) {

        const popup = $('#popup-close-question');
        const reviewKeywords = $('#review-keywords').text();

        // If post object not populated (i.e.: from question page)
        if (!post?.content) {
          post = {
            content: $('#question .js-post-body').text(),
            answers: $('#answers .answer').length,
            votes: Number($('#question .js-vote-count').text()),
          };
        }

        if (queueType != null) repositionReviewDialogs(true);

        // Find and add class to off-topic badge count so we can avoid it
        popup.find('input[value="SiteSpecific"]').closest('li').find('.s-badge__mini').addClass('offtopic-indicator');

        // Select default radio based on previous votes, ignoring the off-topic reason
        let opts = popup.find('.s-badge__mini').not('.offtopic-indicator').get().sort((a, b) => Number(a.innerText) - Number(b.innerText));
        const selOptCount = Number($(opts).last().text()) || 0;
        const selOpt = $(opts).last().closest('li').find('input:radio').trigger('click');

        // If selected option is in a subpane, display off-topic subpane instead
        const pane = selOpt.closest('.popup-subpane');
        if (pane.attr('id') !== 'pane-main') {

          // Get pane name
          const paneName = pane.attr('data-subpane-name');

          // Select radio with same subpane name
          popup.find(`input[data-subpane-name="${paneName}"]`).trigger('click');

          // Re-select option
          selOpt.trigger('click');
        }

        // If no popular vote
        if (selOpt.length == 0) {

          // Select general flagged close reason
          if (["needs more focus", "needs details or clarity", "opinion-based"].includes(flaggedReason)) {
            const labels = popup.find('.js-action-name');
            const selectedLabel = labels.filter((i, el) => el.textContent.toLowerCase() == flaggedReason);
            const selectedRadio = selectedLabel.closest('li').find('input:radio').trigger('click');

            toastMessage('DETECTED - ' + flaggedReason);
          }
          // Try to prediect close reasons from keywords
          else {

            // No code, close as unclear
            if (reviewKeywords.includes('no-code')) {
              toastMessage('DETECTED - unclear (no code)');
              $('#closeReasonId-NeedsDetailsOrClarity').prop('checked', true).trigger('click');
            }

            // Possibly opinion-based
            else if (["what is", "what's"].some(v => post.content.includes(v)) && opinionKeywords.some(v => post.content.includes(v))) {
              toastMessage('DETECTED - opinion-based');
              $('#closeReasonId-OpinionBased').prop('checked', true).trigger('click');
            }
          }

          if (isSuperuser) {
            // Click Close button to submit previous detections
            popup.find('.js-popup-submit, input:submit').trigger('click');
          }
        }

        // Experimental
        if (isSuperuser) {
          // If only filtering by "Duplicate", do nothing
          if ((filteredTypes.length === 1 && filteredTypes.includes('Duplicate')) === true) return;

          // If dupe, edited, answered, positive score, skip review
          if (post.content.length >= 200 && (post.accepted || post.answers >= 2)) {
            toastMessage('AUTO SKIP - accepted or has answers');
            skipReview();
            return;
          }
          else if (post.content.length >= 200 && post.votes > 1) {
            toastMessage('AUTO SKIP - positive score');
            skipReview();
            return;
          }
          else if (currentReview.instructions?.toLowerCase().includes('duplicate') || flaggedReason.toLowerCase().includes('duplicate')) {
            toastMessage('AUTO SKIP - ignore dupe closure');
            skipReview();
            return;
          }
          else if (post.content.length >= 700 && $('.reviewable-post').find('.post-signature').length === 2) {
            toastMessage('AUTO SKIP - edited long question');
            skipReview();
            return;
          }
          // Debugging but has code
          else if (!reviewKeywords.includes('no-code') && flaggedReason.toLowerCase().includes('not suitable for this site') && selOpt.attr('id') === 'siteSpecificCloseReasonId-13-') {
            toastMessage('AUTO SKIP - Debugging, but code was provided');
            skipReview();
            return;
          }

          // Ignore these close reasons on SO-only
          if ($('#closeReasonId-Duplicate').is(':checked')) { // dupes
            toastMessage('AUTO SKIP - ignore dupes');
            skipReview();
            return;
          }
          else if ($('#siteSpecificCloseReasonId-11-').is(':checked')) { // typos
            toastMessage('AUTO SKIP - ignore typo');
            skipReview();
            return;
          }
          else if ($('#siteSpecificCloseReasonId-16-').is(':checked')) { // software recs
            toastMessage('AUTO SKIP - ignore softrec');
            skipReview();
            return;
          }

          // Ignore migrations
          if ($('#siteSpecificCloseReasonId-2-').is(':checked') || $('input[name="belongsOnBaseHostAddress"]:checked').length > 0) { // migrate
            //$('#closeReasonId-NeedsDetailsOrClarity').prop('checked', true).trigger('click'); // default to unclear?
            toastMessage('AUTO SKIP - ignore migrations');
            skipReview();
            return;
          }

          // After short delay
          setTimeout(postId => {
            if (postId !== post.id) return; // Review changed, do nothing

            // Remove instant actions
            $('.instant-actions').remove();

            // Skip to next review after a short delay if no option is selected
            if ($('#popup-close-question').length > 0 && $('#popup-close-question input:radio:checked').length === 0) {
              toastMessage('AUTO SKIP - no action selected');
              skipReview();
              return;
            }
            // Click Close button
            else {
              toastMessage('AUTO CLOSED');
              popup.find('.js-popup-submit, input:submit').trigger('click');
            }

          }, 5000, post.id);
        }
        else {
          // Focus Close button only
          popup.find('.js-popup-submit, input:submit').focus();
        }

      }, 50, postId);
    }

    // Delete dialog loaded
    else if (settings.url.includes('/posts/popup/delete/')) {
      setTimeout(function () {

        // Select recommended option if there are no auto comments yet
        if (post.comments.some(v => /- From Review/i.test(v)) == false && isLinkOnlyAnswer) {
          $('.popup-active-pane .js-action-name').filter((i, el) => el.innerText.includes('link-only answer')).prev('input').trigger('click');
        }

        // Focus Delete button
        $('#delete-question-popup').find('input:submit, .js-popup-submit').focus();
      }, 50);
    }

    // Flag dialog loaded
    else if (settings.url.includes('/flags/posts/') && settings.url.includes('/popup')) {

      // Convert radio buttons to new stacks radio
      $('#popup-flag-post input:radio').addClass('s-radio');
    }

    // Question was closed
    else if (settings.url.includes('/close/add')) {
      $('.js-review-actions button[title*="close"]').attr('disabled', true);

      // If downvoteAfterClose option enabled, and score >= 0
      if (downvoteAfterClose && post.isQuestion && post.votes >= 0) {
        console.debug(`[${scriptName}] downvoted post ${post.id}`);
        downvotePost(post.id);
      }
    }

    // Next review loaded, transform UI and pre-process review
    else if (settings.url.includes('/review/next-task') || settings.url.includes('/review/task-reviewed/')) {
      if (!responseJSON.isUnavailable) {
        addGoBackButton();
      }

      // If reviewing reopen votes, click "I'm done"
      if (queueType === 'first-posts') {

        setTimeout(() => {
          $('.js-review-actions button[title*="done reviewing"]').trigger('click');
        }, 1000);
      }

      // display "flag" and "close" buttons
      if (queueType === "suggested-edits") {
        const hiddenMenuItems = document.querySelectorAll(".js-post-menu .flex--item.d-none");
        hiddenMenuItems.forEach((item) => item.classList.remove("d-none"));
      }

      // If reviewing a suggested edit from Q&A (outside of review queues)
      if (location.href.includes('/questions/')) {

        // Remove delete button
        $('.js-review-actions button[title*="delete this post"]').remove();

        // If reject is clicked, restyle popups to new stacks theme
        $('.js-post-menu').on('click', '.popup .js-action-button[title="reject this suggested edit"]', function () {

          // Convert radio buttons to new stacks radio
          $('#rejection-popup input:radio').addClass('s-radio');
        });
        return;
      }

      // Keep track of how many reviews were viewed in this session
      numOfReviews++;

      // Reset variables for next task
      isLinkOnlyAnswer = false;
      isCodeOnlyAnswer = false;

      // Get additional info about review from JSON response
      let responseJson = {};
      try {
        responseJson = JSON.parse(xhr.responseText);
        console.debug(`[${scriptName}] intercepted XHR\n`, responseJSON);
      }
      catch (e) {
        console.error('error parsing JSON', xhr.responseText);
      }
      currentReview = responseJson; // store globally

      // Display remaining CV and flag quota
      displayRemainingQuota();

      // If action was taken (post was refreshed), don't do anything else
      if (responseJson.isRefreshing) return;

      // If not review queue, do nothing (e.g.: viewing suggested edit from Q&A)
      if (queueType == null) return;

      // Load more comments
      $('.js-show-link.comments-link').trigger('click');

      // Parse flagged reason (to select as default if no popular vote)
      flaggedReason = (responseJson.instructions.toLowerCase().match(/(needs more focus|needs details or clarity|opinion-based|not suitable for this site)/i) || ['-']).pop().replace('&#39;', "'");
      console.debug(`[${scriptName}] flagged reason: ${flaggedReason}`);

      setTimeout(function () {

        // Get post type
        const reviewablePost = $('.js-review-content, .suggested-edit').first();
        const pid = responseJson.postId;
        const isQuestion = reviewablePost.find('.answers-subheader').text().includes('Question') || reviewablePost.find('.question-hyperlink').length > 0;

        // Get post status
        const isDeleted = reviewablePost.find('.deleted-answer').length > 0;
        const isClosedOrDeleted = reviewablePost.find('.js-post-notice, .deleted-answer').length > 0;
        console.debug(`[${scriptName}] is closed/deleted: ${isClosedOrDeleted}`);

        // If no more reviews, refresh page every 10 seconds
        // Can't use responseJson.isUnavailable here, as it can also refer to current completed review
        if ($('.js-review-instructions').text().includes('This queue has been cleared!')) {
          setTimeout(() => location.reload(), 10000);
          return;
        }

        // If first-posts or late-answers queue, and not already reviewed (no Next button)
        const reviewStatus = $('.review-status').text();
        if ((queueType == 'first-posts' || queueType == 'late-answers') &&
          !reviewStatus.includes('This item is no longer reviewable.') && !reviewStatus.includes('This item is not reviewable.') && !reviewStatus.includes('Review completed')) {

          // If question, insert "Close" option
          if (isQuestion) {
            const closeBtn = $(`<button class="js-action-button s-btn s-btn__primary flex--item" title="close question">Close</button>`).attr('disabled', isClosedOrDeleted);
            closeBtn.on('click', function () {
              // If button not disabled
              if (!$(this).prop('disabled')) {
                $('.js-post-menu').first().find('.close-question-link').trigger('click');
              }
              return false;
            });
            $('.js-review-actions button').first().after(closeBtn);
          }

          // Else if answer and user has delete privs, insert "Delete" option
          else if (!isQuestion && (StackExchange.options.user.isModerator || StackExchange.options.user.rep >= 10000 && $('.js-post-menu a[title="vote to delete this post"]').length === 1)) {
            const delBtn = $(`<button class="js-action-button s-btn s-btn__primary flex--item" title="delete answer">Delete</button>`).attr('disabled', isClosedOrDeleted);
            delBtn.on('click', function () {
              // If button not disabled
              if (!$(this).prop('disabled')) {
                $('.js-post-menu').first().find('a[title*="delete"]').trigger('click');
              }
              return false;
            });
            $('.js-review-actions button').first().after(delBtn).after('<span>&nbsp;</span>');
          }
        }


        // For suggested edits
        if (queueType === 'suggested-edits') {
          // unless timeline link is already present
          if (!document.querySelector("a[data-ks-title=timeline]")) {
            // Add post timeline link to post
            reviewablePost
              .find('.votecell')
              .addClass('grid fd-column ai-stretch gs4')
              .append(`<a class="js-post-issue flex--item s-btn s-btn__unset c-pointer py8 mx-auto mt16 fc-black-200" href="/posts/${pid}/timeline" data-shortcut="T" title="Timeline"><svg aria-hidden="true" class="mln2 mr0 svg-icon iconHistory" width="19" height="18" viewBox="0 0 19 18"><path d="M3 9a8 8 0 113.73 6.77L8.2 14.3A6 6 0 105 9l3.01-.01-4 4-4-4h3L3 9zm7-4h1.01L11 9.36l3.22 2.1-.6.93L10 10V5z"></path></svg></a>`);
          }
        }


        // Show post menu links, if not in queues that don't already show full menus or doesn't support it
        if (queueType !== 'first-posts' && queueType !== 'late-answers' && queueType !== 'suggested-edits') {

          const postmenu = reviewablePost.find('.js-post-menu');

          // delete
          if (StackExchange.options.user.canSeeDeletedPosts) {
            $('.js-post-menu a[id^="delete-post-"]').text(isDeleted ? 'undelete' : 'delete').show();
          }

          // flag
          $('.flag-post-link').each(function () {
            this.dataset.postid = this.dataset.questionid || this.dataset.answerid;
          }).text('flag').show();

          // close
          if (isQuestion) {
            let closeLink = postmenu.find('.close-question-link').show();

            // If close link is not there for any reason, add back (e.g.: suggested-edit)
            if (closeLink.length === 0) {
              closeLink = $(`<a href="#" class="close-question-link js-close-question-link" title="vote to close this question (when closed, no new answers can be added)" data-questionid="${pid}" data-show-interstitial="" data-isclosed="false">close</a>`).prependTo(postmenu);
            }

            // If close link has not been processed for CV count
            if (closeLink.not('.js-close-count') && !closeLink.text().includes('(') && !closeLink.text().includes('reopen')) {
              closeLink.addClass('js-close-count');

              $.get(`https://api.stackexchange.com/2.2/questions/${pid}?order=desc&sort=activity&site=${siteApiSlug}&filter=!)5IW-1CBJh-k0T7yaaeIcKxo)Nsr&key=ViEjavpQX)kK3lob1h2Nxw((`, results => {
                if (results && results.items && results.items.length > 0) {
                  const cvCount = Number(results.items[0].close_vote_count);
                  if (cvCount > 0 && /\d/.test(closeLink.text()) === false) {
                    closeLink.text((i, v) => v + ' (' + cvCount + ')');
                  }
                }
              });
            }
          }

          // if following feature is missing, add our own
          if (!document.getElementById(`btnFollowPost-${pid}`)) {
            postmenu.prepend(`<button data-pid="${pid}" data-post-type="${isQuestion ? 'question' : 'answer'}" class="js-somu-follow-post s-btn s-btn__link fc-black-400 h:fc-black-700 pb2" role="button">follow</button>`);
          }

          // edit
          if (queueType !== 'suggested-edits') {
            postmenu.prepend(`<a href="/posts/${pid}/edit" class="edit-post" title="revise and improve this post">edit</a>`);
            StackExchange.inlineEditing.init();
          }

          // share
          if (!document.querySelector(".js-share-link")) {
            postmenu.prepend(`<a href="/${isQuestion ? 'q' : 'a'}/${pid}" rel="nofollow" itemprop="url" class="js-share-link js-gps-track" title="short permalink to this ${isQuestion ? 'question' : 'answer'}" data-controller="se-share-sheet s-popover" data-se-share-sheet-title="Share a link to this ${isQuestion ? 'question' : 'answer'}" data-se-share-sheet-subtitle="(includes your user id)" data-se-share-sheet-post-type="${isQuestion ? 'question' : 'answer'}" data-se-share-sheet-social="facebook twitter devto" data-se-share-sheet-location="1" data-s-popover-placement="bottom-start" aria-controls="se-share-sheet-0" data-action=" s-popover#toggle se-share-sheet#preventNavigation s-popover:show->se-share-sheet#willShow s-popover:shown->se-share-sheet#didShow">share</a>`);
            StackExchange.question.initShareLinks();
          }

          // mod
          if (StackExchange.options.user.isModerator) {
            postmenu.prepend(`<a class="js-mod-menu-button" href="#" role="button" data-controller="se-mod-button" data-se-mod-button-type="post" data-se-mod-button-id="${pid}">mod</a>`);
          }
        }

        // Remove mod menu button since we already inserted it in the usual post menu, freeing up more space
        const menuSections = $('.js-review-actions fieldset > div:last-child .flex--item');
        if (menuSections.length > 1) menuSections.last().remove();

        // Remove "Delete" option for suggested-edits queue, if not already reviewed (no Next button)
        if (queueType == 'suggested-edits' && !$('.review-status').text().includes('This item is no longer reviewable.')) {
          $('.js-review-actions button[title*="delete"]').remove();
        }

        // Remove "Requires Editing" option for Triage queue
        if (queueType == 'triage') {
          $('.js-review-actions button[data-result-type="20"]').remove();
        }

        // Modify buttons to insert numeric labels
        //$('.js-review-actions button').removeAttr('disabled').text(function(i, v) {
        //    if(v.includes('] ')) return v; // do not modify twice
        //    return '{' + (i+1) + '} ' + v;
        //});

        // Get review vars
        post = {
          id: responseJson.postId,
          permalink: `${location.origin}/${isQuestion ? 'q' : 'a'}/${responseJson.postId}`,
          title: $('h1[itemprop="name"] a').text(),
          content: $('.js-post-body').first().text(),
          contentHtml: $('.js-post-body').first().html(),
          votes: parseInt($('.js-vote-count').first().text(), 10),
          tags: $('.post-taglist .post-tag').get().map(v => v.innerText),
          isQuestion: isQuestion,
          isClosedOrDeleted: isClosedOrDeleted,
          comments: $('.reviewable-post:first .comment-copy').get().map(v => v.innerText),
        };
        // Parse post stats from sidebar
        $('.reviewable-post:first .reviewable-post-stats tr').each(function () {
          let k = $(this).find('.label-key').text();
          let v = $(this).find('.label-value').text();

          if (k.length == 0 && v.length == 0) return;

          // convert key to camelCase (in case of two words, like "is accepted" or "other answers"
          k = k.replace(/[^\S\r\n]([^\s])/g, x => x.toUpperCase()).replace(/\s+/g, '');

          // try convert to primitive
          let d = new Date($(this).find('.label-value').attr('title')).getTime();
          let b = v == 'no' ? false : v == 'yes' ? true : null;
          let n = parseInt(v, 10);

          if (!isNaN(d)) v = d; // date
          else if (b !== null) v = b; // bool
          else if (!isNaN(n)) v = n; // number

          post[k] = v;
        });
        console.debug(`[${scriptName}] post info:\n`, post);

        // Check for audits and skip them
        if (responseJson.isAudit) {

          if (skipAudits) {
            toastMessage('skipping review audit');
            skipReview();
          }
          else {
            toastMessage('this is a review audit', 5);
          }

          return;
        }
        //else if(isAudit()) {
        //    skipReview();
        //    return;
        //}

        // Display post keywords
        displayPostKeywords();

        // Process post based on queue type
        if (typeof processReview === 'function') processReview();

        // Insert voting buttons
        insertVotingButtonsIfMissing();

        // Insert instant buttons
        if (isSO && post.isQuestion && queueType !== 'suggested-edits' && queueType !== 'reopen') insertInstantCloseButtons();
        else if (!post.isQuestion) {
          $('.instant-actions').remove();
        }

      }, 100);
    }
  });
}


// Append styles
addStylesheet(`
/* Edit reasons link to take up less space */
.popup a.edit-link {
  position: absolute;
  bottom: 21px;
  right: 25px;
}

/* Numeric icons for review buttons shortcuts */
.js-review-actions button,
.instant-actions button {
  position: relative;
}
.js-review-actions button:before,
.instant-actions button:before {
  content: '';
  position: absolute;
  top: -5px;
  left: -5px;
  width: 1.3em;
  height: 1.3em;
  font-size: 0.8em;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
  background-color: var(--theme-background-color);
  color: var(--theme-button-outlined-border-color);
  border: 1px solid var(--theme-button-outlined-border-color);
  border-radius: 50%;
}
.js-review-actions button.js-temporary-action-button:before,
.js-review-actions button.js-review-cancel-button:before {
  content: none;
  display: none;
}
.instant-actions button:before {
  background: var(--white);
  color: var(--black);
  border: 1px solid var(--blue-900);
}
.js-review-actions button:nth-of-type(1):before {
  content: '1';
}
.js-review-actions button:nth-of-type(2):before {
  content: '2';
}
.js-review-actions button:nth-of-type(3):before {
  content: '3';
}
.js-review-actions button:nth-of-type(4):before {
  content: '4';
}
.js-review-actions button:nth-of-type(5):before {
  content: '5';
}
.instant-actions button:nth-of-type(1):before {
  content: '6';
}
.instant-actions button:nth-of-type(2):before {
  content: '7';
}
.instant-actions button:nth-of-type(3):before {
  content: '8';
}
.instant-actions button:nth-of-type(4):before {
  content: '9';
}
.instant-actions button:nth-of-type(5):before {
  content: '0';
}

/* Number options in popups */
.popup .action-list li {
  position: relative;
}
.popup .action-list input[type='radio']:not(:checked) {
  background-color: transparent;
  width: 16px;
  height: 16px;
  margin-left: -1px;
  margin-top: 2px;
  margin-right: -1px;
}
.popup .action-list li:before {
  content: '';
  position: absolute;
  top: 16px;
  left: 6px;
  z-index: -1;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  font-size: 0.85em;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
}
.popup .migration-pane .action-list li:before {
  top: 29px;
}
.popup .migration-pane .action-list li.mt24:last-child:before,
.popup .migration-pane .action-list script + li:last-child:before {
  top: 8px;
}
#popup-flag-post.popup .action-list li:before {
  top: 8px;
}
.popup .action-list li:nth-of-type(1):before {
  content: '1';
}
.popup .action-list li:nth-of-type(2):before {
  content: '2';
}
.popup .action-list li:nth-of-type(3):before {
  content: '3';
}
.popup .action-list li:nth-of-type(4):before {
  content: '4';
}
.popup .action-list li:nth-of-type(5):before {
  content: '5';
}
.popup .action-list li:nth-of-type(6):before {
  content: '6';
}
.popup .action-list li:nth-of-type(7):before {
  content: '7';
}
.popup .action-list .chosen-container li:before {
  content: unset;
}

/* No numbers/kb shortcuts for auto-review-comments userscript */
.auto-review-comments.popup .action-list li:before {
  content: '';
}
`); // end stylesheet


// Append review queue styles
function addReviewQueueStyles() {
  addStylesheet(`
.sidebar .ajax-loader,
#footer {
  display: none !important;
}
pre {
  max-height: 320px;
}
#content {
  padding-bottom: 120px !important;
}
.js-review-bar {
  min-height: 115px;
}
.low-quality-posts-review-queue .js-review-bar,
.suggested-edits-review-queue .js-review-bar {
  min-height: unset;
}
.review-task-page .reviewable-post + div {
  margin-top: 40px;
  opacity: 0.8 !important;
}
.review-task-page .reviewable-post + div:hover {
  opacity: 1 !important;
}
.review-task-page .reviewable-post .question {
  position: relative;
}
.reviewable-post-stats > table:first-child {
  min-height: 150px;
}

.suggested-edits-review-queue .review-bar .review-summary {
  flex-basis: 45%;
}
.suggested-edits-review-queue .review-bar .js-review-actions-error-target {
  flex-basis: 55%;
}
.suggested-edits-review-queue .suggested-edit .js-post-menu {
  margin-top: 20px;
  margin-left: 62px;
}
.suggested-edits-review-queue .suggested-edit .body-diffs + div {
  margin: 10px 0;
}

.review-content {
  opacity: 1 !important;
}
#popup-close-question {
  opacity: 0.9;
}
#popup-close-question:hover {
  opacity: 1;
}

.review-task-page .js-post-menu > a,
.review-task-page .js-post-menu > button {
  float: left;
  margin-right: 9px;
}

/* CV and flag counts in sidebar */
.remaining-quota tr:first-child td {
  padding-top: 15px;
}

/* Instant action buttons */
.js-review-actions-error-target button[style*='visibility'] {
  display: none;
}
.js-review-actions-error-target .js-review-actions,
.js-review-actions-error-target .instant-actions {
  display: block;
  text-align: right;
}
.js-review-actions-error-target .instant-actions {
  margin-top: 6px;
}

/* Standardise radio buttons
  - some dialogs are using stacks, others default...
*/
.popup .action-list input[type='radio'] {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  margin: 0;
  width: 1em;
  height: 1em;
  border: 1px solid var(--black-200);
  background-color: var(--white);
  outline: 0;
  font-size: inherit;
  vertical-align: middle;
  cursor: pointer;
  border-radius: 50%;
}
.popup .action-list input[type='radio']:focus {
  box-shadow: 0 0 0 4px var(--focus-ring);
}
.popup .action-list input[type='radio']:checked {
  border-color: var(--blue-500);
  border-width: .30769231em;
  background-color: #fff;
}

#toasty {
  display: block;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate3d(-50%, -50%, 0);
  z-index: 999999;
  padding: 20px 30px;
  background: rgba(255,255,255,0.7) !important;
  color: var(--black) !important;
}
#review-history-tabs {
  position: relative;
  float: none;
  margin: 30px 0;
}
#review-history-tabs:before {
  content: '';
  display: block;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  border-bottom: 1px solid var(--black-075);
}

/* Review keywords */
#review-keywords {
  border: 1px solid var(--black-200);
  border-radius: 0.25em;
  padding: 0.5em;
  position: absolute;
  right: 0;
  top: -43px;
}
#review-keywords > span:after {
  content: ', ';
}
#review-keywords > span:last-child:after {
  content: '';
}
#review-keywords:empty {
  display: none;
}

/* Visited links on review history page need to be in a different colour so we can see which reviews have been handled */
.history-table a[href^="/review/"]:visited {
  color: var(--black-300);
}
.history-table a[href^="/review/"]:visited:hover {
  color: var(--black-400);
}
`); // end stylesheet
}


// On script run
(async function init() {

  // Helper functions to wait for SOMU options to load
  const rafAsync = () => new Promise(resolve => { requestAnimationFrame(resolve); });
  const waitForSOMU = async () => {
    while (typeof SOMU === 'undefined' || !SOMU?.hasInit) { await rafAsync(); }
    return SOMU;
  };

  // Wait for options script to load
  const SOMU = await waitForSOMU();
  loadOptions(SOMU);

  doPageLoad();
  listenToKeyboardEvents();
  listenToPageUpdates();
})();