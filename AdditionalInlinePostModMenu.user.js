// ==UserScript==
// @name         Additional Inline Post Mod Menu
// @description  Adds mod-only quick actions in existing post menu
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.3.7
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
//
// @exclude      *chat.*
// @exclude      *blog.*
// @exclude      https://stackoverflow.com/c/*
//
// @require      https://github.com/samliew/SO-mod-userscripts/raw/master/lib/common.js
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(!isModerator()) return;


    const superusers = [ 584192, 366904, 6451573 ];
    const isSuperuser = () => superusers.includes(StackExchange.options.user.userId);

    const newlines = '\n\n';
    const fkey = StackExchange.options.user.fkey;
    const getQueryParam = key => new URLSearchParams(window.location.search).get(key) || '';
    const isSO = location.hostname == 'stackoverflow.com';
    const isSOMeta = location.hostname == 'meta.stackoverflow.com';
    const isMeta = typeof StackExchange.options.site.parentUrl !== 'undefined';
    const parentUrl = StackExchange.options.site.parentUrl || 'https://' + location.hostname;
    const metaUrl = StackExchange.options.site.childUrl;


    function goToPost(pid) {
        if(typeof pid === 'undefined' || pid === null) { return; }

        // If in mod queues, open in new tab/window
        if(location.pathname.includes('/admin/dashboard')) {
            const link = $(`<a href="https://${location.hostname}/q/${pid}" target="_blank" style="display:none !important;">&nbsp;</a>`).appendTo('body');
            link[0].click();
            link.remove();
        }
        else {
            location.href = `https://${location.hostname}/q/${pid}`;
        }
    }
    function reloadPage() {
        // If in mod queues, do not reload
        if(location.pathname.includes('/admin/dashboard')) return false;
        location.reload(true);
    }
    function reloadWhenDone() {

        // Triggers when all ajax requests have completed
        $(document).ajaxStop(function() {

            // Stop subsequent calls
            $(this).off("ajaxStop");

            reloadPage();
        });
    }


    // Post comment on post
    function addComment(pid, commentText) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }
            if(typeof commentText !== 'string' || commentText.trim() === '') { reject(); return; }

            $.post({
                url: `https://${location.hostname}/posts/${pid}/comments`,
                data: {
                    'fkey': fkey,
                    'comment': commentText,
                }
            })
            .done(resolve)
            .fail(reject);
        });
    }


    // Close individual post
    // closeReasonId: 'NeedMoreFocus', 'SiteSpecific', 'NeedsDetailsOrClarity', 'OpinionBased', 'Duplicate'
    // if closeReasonId is 'SiteSpecific', offtopicReasonId : 11-norepro, 13-nomcve, 16-toolrec, 3-custom
    function closeQuestionAsOfftopic(pid, closeReasonId = 'SiteSpecific', offtopicReasonId = 3, offTopicOtherText = 'I’m voting to close this question because ', duplicateOfQuestionId = null) {

        // OffTopic has been replaced with SiteSpecific
        if(closeReasonId === 'OffTopic') closeReasonId = 'SiteSpecific';

        return new Promise(function(resolve, reject) {
            if(!isSO) { reject(); return; }
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }
            if(typeof closeReasonId === 'undefined' || closeReasonId === null) { reject(); return; }
            if(closeReasonId === 'SiteSpecific' && (typeof offtopicReasonId === 'undefined' || offtopicReasonId === null)) { reject(); return; }

            if(closeReasonId === 'Duplicate') offtopicReasonId = null;

            // Logging actual action
            console.log(`%c Closing ${pid} as ${closeReasonId}, reason ${offtopicReasonId}.`, 'font-weight: bold');

            $.post({
                url: `https://${location.hostname}/flags/questions/${pid}/close/add`,
                data: {
                    'fkey': fkey,
                    'closeReasonId': closeReasonId,
                    'duplicateOfQuestionId': duplicateOfQuestionId,
                    'siteSpecificCloseReasonId': offtopicReasonId,
                    'siteSpecificOtherText': offtopicReasonId == 3 && isSO ? 'This question does not appear to be about programming within the scope defined in the [help]' : offTopicOtherText,
                    //'offTopicOtherCommentId': '',
                    'originalSiteSpecificOtherText': 'I’m voting to close this question because ',
                }
            })
            .done(resolve)
            .fail(reject);
        });
    }
    function closeQuestionAsDuplicate(pid, targetPid) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }
            if(typeof targetPid === 'undefined' || targetPid === null) { reject(); return; }
            closeQuestionAsOfftopic(pid, 'Duplicate', null, 'I\'m voting to close this question as off-topic because ', targetPid)
               .then(resolve)
               .catch(reject);
        });
    }
    function closeSOMetaQuestionAsOfftopic(pid, closeReason = 'SiteSpecific', offtopicReasonId = 6) {
        return new Promise(function(resolve, reject) {
            if(!isSOMeta) { reject(); return; }
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }
            if(typeof closeReason === 'undefined' || closeReason === null) { reject(); return; }
            if(closeReason === 'SiteSpecific' && (typeof offtopicReasonId === 'undefined' || offtopicReasonId === null)) { reject(); return; }

            addComment(pid, `You are on [Meta](/help/whats-meta). This question will not be answered here and you may want to go over the [Checklist](//meta.stackoverflow.com/q/260648) and [ask] before you repost on [main].`);

            $.post({
                url: `https://${location.hostname}/flags/questions/${pid}/close/add`,
                data: {
                    'fkey': fkey,
                    'closeReasonId': closeReason,
                    'siteSpecificCloseReasonId': offtopicReasonId
                }
            })
            .done(resolve)
            .fail(reject);
        });
    }
    // Reopen individual post
    function reopenQuestion(pid) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/flags/questions/${pid}/reopen/add`,
                data: {
                    'fkey': fkey
                }
            })
            .done(resolve)
            .fail(reject);
        });
    }


    // Delete individual post
    function deletePost(pid) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/posts/${pid}/vote/10`,
                data: {
                    'fkey': fkey
                }
            })
            .done(resolve)
            .fail(reject);
        });
    }
    // Undelete individual post
    function undeletePost(pid) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/posts/${pid}/vote/11`,
                data: {
                    'fkey': fkey
                }
            })
            .done(resolve)
            .fail(reject);
        });
    }


    // Locks individual post
    // Type: 20 - content dispute
    //       21 - offtopic comments
    function lockPost(pid, type, hours = 24) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }
            if(typeof type === 'undefined' || type === null) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/admin/posts/${pid}/lock`,
                data: {
                    'mod-actions': 'lock',
                    'noticetype': type,
                    'duration': hours,
                    'fkey': fkey
                }
            })
            .done(resolve)
            .fail(reject);
        });
    }
    // Unlock individual post
    function unlockPost(pid) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/admin/posts/${pid}/unlock`,
                data: {
                    'mod-actions': 'unlock',
                    'fkey': fkey
                }
            })
            .done(resolve)
            .fail(reject);
        });
    }


    // Protect individual post
    function protectPost(pid) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/admin/posts/${pid}/protect`,
                data: {
                    'mod-actions': 'protect',
                    'duration': 1,
                    'fkey': fkey
                }
            })
            .done(resolve)
            .fail(reject);
        });
    }
    // Unprotect individual post
    function unprotectPost(pid) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/admin/posts/${pid}/unprotect`,
                data: {
                    'mod-actions': 'unprotect',
                    'duration': 1,
                    'fkey': fkey
                }
            })
            .done(resolve)
            .fail(reject);
        });
    }


    // Edit individual post to remove more than one @ symbols to be able to convert to comment without errors
    function tryRemoveMultipleAtFromPost(pid) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }

            $.get(`https://${location.hostname}/posts/${pid}/edit`)
            .done(function(data) {
                const editUrl = $('#post-form-' + pid, data).attr('action');
                let postText = $('#wmd-input-' + pid, data).val();

                const matches = postText.match(/[@]/g);
                if(matches === null || matches && matches.length <= 1) { resolve(); return; }

                postText = postText.replace(/ [@]([\w.-]+)\b/g, ' $1');
                console.log(editUrl, postText);

                $.post({
                    url: `https://${location.hostname}${editUrl}`,
                    data: {
                        'is-current': true,
                        'edit-comment': 'remove additional @ for converting to comment',
                        'post-text': postText,
                        'fkey': fkey
                    }
                })
                .done(resolve)
                .fail(reject);
            });
        });
    }
    // Convert to comment
    function convertToComment(pid, targetId) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }
            if(typeof targetId === 'undefined' || targetId === null) { reject(); return; }

            tryRemoveMultipleAtFromPost(pid).then(v => {
                $.post({
                    url: `https://${location.hostname}/admin/posts/${pid}/convert-to-comment`,
                    data: {
                        'mod-actions': 'convert-to-comment',
                        'duration': 1,
                        'target-post-id': targetId,
                        'fkey': fkey
                    }
                })
                .done(resolve)
                .fail(reject);
            });
        });
    }
    // Convert to edit
    function convertToEdit(pid, targetId) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }
            if(typeof targetId === 'undefined' || targetId === null) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/admin/posts/${pid}/convert-to-edit`,
                data: {
                    'mod-actions': 'convert-to-edit',
                    'duration': 1,
                    'target-post-id': targetId,
                    'fkey': fkey
                }
            })
            .done(resolve)
            .fail(reject);
        });
    }


    // Delete all comments on post
    function deleteCommentsOnPost(pid) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid == null) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/admin/posts/${pid}/delete-comments`,
                data: {
                    'fkey': fkey,
                    'mod-actions': 'delete-comments'
                }
            })
            .done(function(data) {
                $('#comments-' + pid).remove();
                $('#comments-link-' + pid).html('<b>Comments deleted.</b>');
                resolve();
            })
            .fail(reject);
        });
    }


    // Move all comments on post to chat
    function moveCommentsOnPostToChat(pid) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid == null) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/admin/posts/${pid}/move-comments-to-chat`,
                data: {
                    'fkey': fkey,
                    'deleteMovedComments': 'true'
                }
            })
            .done(function(data) {
                $('#comments-' + pid).remove();
                $('#comments-link-' + pid).html(`<span>${data.info}</span>`);
                resolve();
            })
            .fail(reject);
        });
    }


    // Undelete and re-delete post (prevent user from undeleting)
    function modUndelDelete(pid) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid == null) { reject(); return; }

            undeletePost(pid).then(function() {
                deletePost(pid).then(resolve, reject);
            }, reject);
        });
    }


    // Spam flag individual post
    function spamFlagPost(pid) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/flags/posts/${pid}/add/PostSpam`,
                data: {
                    'otherText': null,
                    'overrideWarning': true,
                    'fkey': fkey
                }
            })
            .done(resolve)
            .fail(reject);
        });
    }


    // Send mod message + optional suspension
    function modMessage(uid, message = '', sendEmail = true, suspendDays = 0) {
        return new Promise(function(resolve, reject) {
            if(typeof uid === 'undefined' || uid === null) { reject(); return; }
            if(suspendDays < 0 || suspendDays > 365) { reject(); return; }

            // Message cannot be empty
            if(message == null || message.trim().length == 0) {
                alert('Mod message cannot be empty.'); reject(); return;
            }

            let suspendUser = false;
            let suspendChoice = 0;
            if(suspendDays > 0) {
                suspendUser = true;
                suspendChoice = suspendDays;
            }

            let templateName = 'something else...';
            let suspendReason = 'for rule violations';
            if(message == 'goodbye') {
                templateName = 'a farewell';
            }

            $.post({
                url: `https://${location.hostname}/users/message/save`,
                data: {
                    'userId': uid,
                    'lastMessageDate': 0,
                    'email': sendEmail,
                    'suspendUser': suspendUser,
                    'suspend-choice': suspendChoice,
                    'suspendDays': suspendDays,
                    'templateName': templateName,
                    'suspendReason': suspendReason,
                    'templateEdited': false,
                    'post-text': message,
                    'fkey': fkey,
                    'author': null,
                }
            })
            .done(resolve)
            .fail(reject);
        });
    }


    // Destroy spammer
    function destroySpammer(uid, destroyDetails = null) {
        return new Promise(function(resolve, reject) {
            if(typeof uid === 'undefined' || uid === null) { reject(); return; }

            // If details is null or whitespace, get optional details
            if(destroyDetails == null || destroyDetails.trim().length == 0) {

                // Prompt for additional details if userscript is not under spam attack mode
                destroyDetails = prompt('Additional details for destroying user (if any). Cancel button terminates destroy action.');

                // If still null, reject promise and return early
                if(destroyDetails == null) { alert('Destroy cancelled. User was not destroyed.'); reject(); return; }
            }

            // Apply max suspension before deletion
            if(isSuperuser()) {
                modMessage(uid, 'goodbye', false, 365);
            }

            $.post({
                url: `https://${location.hostname}/admin/users/${uid}/destroy`,
                data: {
                    'annotation': '',
                    'deleteReasonDetails': '',
                    'mod-actions': 'destroy',
                    'destroyReason': 'This user was created to post spam or nonsense and has no other positive participation',
                    'destroyReasonDetails': destroyDetails.trim(),
                    'fkey': fkey
                }
            })
            .done(resolve)
            .fail(reject);
        });
    }


    function updateModTemplates() {

        const template = $('.popup input[name=mod-template]').filter((i,el) => $(el).next().text().includes('post disassociation'));
        let addstr = '';

        // Build list of posts
        const pids = getQueryParam('pid').split('|');
        pids.forEach(function(v) {
            if(v.length === 0) return;
            addstr += `https://${location.hostname}/a/${v}` + newlines;
        });

        // Build list of meta posts
        const metapids = getQueryParam('metapid').split('|');
        metapids.forEach(function(v) {
            if(v.length === 0) return;
            addstr += `${metaUrl}/a/${v}` + newlines;
        });

        if(addstr === '') addstr = newlines;

        // Insert to template
        template.val(template.val()
          .replace(/:\s+{todo}/, ':<br>\n' + addstr + '**Requested via custom flag.**' + newlines) // replace todo with additional information
        ).click();

        $('.popup-submit').click();

        // Failsafe
        $('#templateName').val('post disassociation');
    }


    function initPostDissociationHelper() {

        // Only on main sites
        if(isMeta) return;

        // Run once, whether on AdditionalPostModActions or AdditionalInlinePostModMenu
        if(document.body.classList.contains('SOMU-PostDissociationHelper')) return;
        else document.body.classList.add('SOMU-PostDissociationHelper');

        // If on contact CM page and action = dissocciate
        if(location.pathname.includes('/admin/cm-message/create/') && getQueryParam('action') == 'post-dissociation') {

            // On any page update
            $(document).ajaxComplete(function(event, xhr, settings) {

                // If CM templates loaded on contact CM page, and action = dissocciate, update templates
                if(settings.url.includes('/admin/contact-cm/template-popup/')) {

                    // Run once only. Unbind ajaxComplete event
                    $(event.currentTarget).unbind('ajaxComplete');

                    // Update CM mod templates
                    setTimeout(updateModTemplates, 500);
                }
            });

            // click template link
            $('#show-templates').click();

            return;
        }

        // If on mod flag queues, remove close question and convert to comment buttons when flag message contains "di(sa)?ssociate", and add "dissociate" button
        if(location.pathname.includes('/admin/dashboard')) {
            const dissocFlags = $('.revision-comment.active-flag').filter((i,v) => v.innerText.match(/di(sa)?ssociate/));
            const dissocPosts = dissocFlags.closest('.js-flagged-post');
            dissocPosts.each(function() {
                const post = $(this);
                const userlink = post.find('.mod-audit-user-info a').attr('href');

                // User not found, prob already deleted
                if(userlink == null) return;

                const uid = Number(userlink.match(/\/(\d+)\//)[0].replace(/\//g, ''));
                const pid = post.attr('data-post-id') || post.attr('data-questionid') || post.attr('data-answerid');
                $('.js-post-flag-options', this).prepend(`<a href="https://${location.hostname}/admin/cm-message/create/${uid}?action=post-dissociation&pid=${pid}" class="btn" target="_blank">dissociate</a>`);

                $('.close-question-button, .js-convert-to-comment', this).hide();
            });
            return;
        }
    }


    function addPostCommentsModLinks() {

        $('div[id^="comments-link-"]').addClass('js-comments-menu');

        // Append link to post sidebar if it doesn't exist yet
        const allCommentMenus = $('.js-comments-menu');

        // Init those that are not processed yet
        allCommentMenus.not('.js-comments-menu-init').addClass('js-comments-menu-init').each(function() {

            const post = $(this).closest('.answer, .question');
            const pid = Number(post.attr('data-answerid') || post.attr('data-questionid')) || null;
            this.dataset.postId = pid;

            // If there are deleted comments, move from sidebar to bottom
            const delCommentsBtn = post.find('.js-fetch-deleted-comments');
            if(delCommentsBtn.length == 1) {
                const numDeletedComments = delCommentsBtn.attr('title').match(/\d+/)[0];
                $(this).append(`<span class="js-link-separator">&nbsp;|&nbsp;</span> <a class="comments-link js-show-deleted-comments-link fc-red-600" title="expand to show all comments on this post (including deleted)" href="#" onclick="" role="button">load <b>${numDeletedComments}</b> deleted comment${numDeletedComments > 1 ? 's' : ''}</a>`);
                delCommentsBtn.hide();
            }

            // Add move to chat and purge links
            $(this).children('.mod-action-links').remove(); // in case added by another US
            $(this).append(`<div class="mod-action-links dno" style="float:right; padding-right:10px">
<a data-post-id="${pid}" class="js-move-comments-link comments-link fc-red-600" title="move all comments to chat + delete all">move to chat</a>
<a data-post-id="${pid}" class="js-purge-comments-link comments-link fc-red-600" title="delete all comments">purge all</a>
</div>`);

        });

        // Show move/purge links depending on comments
        allCommentMenus.each(function() {
            const hasComments = $(this).prev().find('.comment').length > 0;
            $(this).find('.mod-action-links').toggle(hasComments);
        });
    }


    function initPostCommentsModLinksEvents() {

        const d = $('body').not('.js-comments-menu-events').addClass('js-comments-menu-events');

        d.on('click', 'a.js-show-deleted-comments-link', function() {
            const post = $(this).closest('.answer, .question');
            post.find('.js-fetch-deleted-comments').click();
            $(this).prev('.js-link-separator').addBack().remove();
        });

        d.on('click', 'a.js-move-comments-link', function() {
            const post = $(this).closest('.answer, .question');
            const pid = Number(this.dataset.postId) || null;
            $(this).remove();
            moveCommentsOnPostToChat(pid);
        });

        d.on('click', 'a.js-purge-comments-link', function() {
            const post = $(this).closest('.answer, .question');
            const pid = Number(this.dataset.postId) || null;
            deleteCommentsOnPost(pid);
        });
    }


    function appendInlinePostModMenus() {

        // Append link to post sidebar if it doesn't exist yet
        $('.post-menu').not('.preview-options').not('.js-init-better-inline-menu').addClass('js-init-better-inline-menu').each(function() {
            const post = $(this).closest('.question, .answer');
            const postScore = Number($(this).find('.js-vote-count').text());
            const postStatus = post.find('.js-post-notice, .special-status, .question-status').text().toLowerCase();
            const isQuestion = post.hasClass('question');
            const isDeleted = post.hasClass('deleted-answer');
            const isModDeleted = post.find('.deleted-answer-info').text().includes('♦') || (postStatus.includes('deleted') && postStatus.includes('♦'));
            const isClosed = postStatus.includes('closed') || postStatus.includes('on hold') || postStatus.includes('duplicate') || postStatus.includes('already has');
            const isProtected = post.find('.js-post-notice b').text().includes('Highly active question');
            const isMigrated = postStatus.includes('migrated to');
            const isLocked = isMigrated || postStatus.includes('locked');
            const isOldDupe = isQuestion && post.find('.post-text blockquote').first().find('strong').text().includes('Possible Duplicate');
            const needsRedupe = postStatus.match(/This question already has( an)? answers? here:(\s|\n|\r)+Closed/i) != null;
            const hasComments = post.find('.comment, .comments-link.js-show-link:not(.dno)').length > 0;
            const pid = post.attr('data-questionid') || post.attr('data-answerid');
            const userbox = post.find('.post-layout .user-info:last .user-action-time').filter((i, el) => el.innerText.includes('answered') || el.innerText.includes('asked')).parent();
            const userlink = userbox.find('a').attr('href');
            const userrep = userbox.find('.reputation-score').text();
            const username = userbox.find('.user-details a').first().text();
            const postdate = userbox.find('.relativetime').attr('title');
            const postage = (Date.now() - new Date(postdate)) / 86400000;

            // Wrap both post signatures into a single div, if it stacks due to lack of horizontal space, we can avoid having a large vertical space too due to the added post menu size (height)
            //$(this).closest('.grid').find('.post-signature').wrapAll('<div class="js-post-signatures"></div>');

            // Validation, since .post-menu is also found on post revisions page, which we do not want to touch
            if(typeof pid === 'undefined') return;

            // Create menu based on post type and state
            let menuitems = '';

            // Comment mod links are now added below the comments section
            //if(hasComments) { // when there are comments only?
            //    menuitems += '<span class="inline-label comments-label">comments: </span>';
            //    menuitems += `<a data-action="move-comments" class="inline-link ${isDeleted || !hasComments ? 'disabled' : ''}">move</a>`;
            //    menuitems += `<a data-action="purge-comments" class="inline-link ${!hasComments ? 'disabled' : ''}">purge</a>`;
            //    menuitems += '<div class="block-clear"></div>';
            //}

            if(isQuestion) { // Q-only
                menuitems += '<div class="block-clear"></div>';
                menuitems += '<span class="inline-label post-label">instant: </span>';

                if(isProtected) {
                    menuitems += `<a data-action="unprotect" class="inline-link ${isDeleted ? 'disabled' : ''}" title="${isDeleted ? 'question is deleted!' : ''}">unprotect</a>`;
                }
                else {
                    menuitems += `<a data-action="protect" class="inline-link ${isDeleted ? 'disabled' : ''}" title="${isDeleted ? 'question is deleted!' : ''}">protect</a>`;
                }

                if(isSO && !isClosed && !isDeleted) {
                    menuitems += `<a data-action="close-offtopic" class="inline-link" title="close with default off-topic reason">close</a>`;
                }

                // Incorrectly posted question on SO Meta
                if(isSOMeta && !isDeleted) {
                    menuitems += `<a data-action="meta-incorrect" class="inline-link">close + delete</a>`;
                }
                else {
                    menuitems += `<a data-action="mod-delete" class="inline-link" title="redelete post as moderator to prevent undeletion">redelete</a>`;
                }
            }
            else { // A-only
                menuitems += '<span class="inline-label post-label">convert: </span>';
                menuitems += `<a data-action="convert-comment" class="inline-link" title="convert only the post to a comment on the question">to-comment</a>`;
                menuitems += `<a data-action="convert-edit" class="inline-link" title="append the post as an edit to the question">to-edit</a>`;

                menuitems += '<div class="block-clear"></div>';
                menuitems += '<span class="inline-label post-label">instant: </span>';
                menuitems += `<a data-action="mod-delete" class="inline-link" title="redelete post as moderator to prevent undeletion">redelete</a>`;
            }

            menuitems += '<div class="block-clear"></div>';
            menuitems += '<span class="inline-label lock-label">lock: </span>';
            if(!isLocked) { // unlocked-only
                menuitems += `<a data-action="lock-dispute" class="inline-link" title="prompts for number of days to dispute lock">dispute...</a>`;
                menuitems += `<a data-action="lock-comments" class="inline-link" title="prompts for number of days to comment lock">comments...</a>`;

                // Old good questions only
                if(isQuestion && postage >= 60 && postScore >= 20) {
                    menuitems += `<a data-action="lock-historical" class="inline-link" title="historical perma-lock">historical</a>`;
                }
            }
            else { // locked-only
                menuitems += `<a data-action="unlock" class="inline-link">unlock</a>`;
            }

            // CM message and destroy options won't work on Meta
            if(userlink && /.*\/\d+\/.*/.test(userlink)) {
                const uid = Number(userlink.match(/\/\d+\//)[0].replace(/\D+/g, ''));

                menuitems += '<div class="block-clear"></div>';
                menuitems += '<span class="inline-label user-label">user: </span>';

                const postIdParam = pid ? '&' + (!isMeta ? `pid=${pid}` : `metapid=${pid}`) : '';
                menuitems += `<a href="${parentUrl}/admin/cm-message/create/${uid}?action=post-dissociation${postIdParam}" target="_blank" class="inline-link" title="compose CM dissociation message in a new window">dissociate...</a>`; // non-deleted user only

                // Allow destroy option only if < 60 days and not on Meta site
                if(!isMeta && (postage < 60 || isSuperuser())) {

                    // Allow destroy option only if user < 200 rep
                    if(/^\d+$/.test(userrep) && Number(userrep) < 200) {
                        menuitems += `<a data-action="destroy-spammer" data-uid="${uid}" data-username="${username}" class="inline-link danger" title="confirms whether you want to destroy the account for spamming">destroy...</a>`; // non-deleted user only
                    }
                }
            }

            $(this).append(`<div class="block-clear"></div><div class="js-better-inline-menu smaller" data-pid="${pid}">${menuitems}</div>`);
        });
    }


    function initPostModMenuLinkActions() {

        // Handle mod actions menu link click
        // have to use tag "main" for mobile web doesn't contain wrapping elem "#content"
        $('#content, main').on('click', '.js-better-inline-menu a[data-action]', function() {

            if($(this).hasClass('disabled') || $(this).hasClass('dno')) return false;

            // Get question link if in mod queue
            const qlink = $(this).closest('.js-flagged-post').find('.js-body-loader a').first().attr('href');
            const reviewlink = $('.question-hyperlink').attr('href');

            const menuEl = this.parentNode;
            const pid = Number(menuEl.dataset.postId || menuEl.dataset.pid);
            const qid = Number($('#question').attr('data-questionid') || getPostId(qlink) || getPostId(reviewlink)) || null;
            const uid = Number(this.dataset.uid);
            const uName = this.dataset.username;
            //console.log(pid, qid);
            if(isNaN(pid) || isNaN(qid)) return false;

            const post = $(this).closest('.answer, .question');
            const isQuestion = post.hasClass('question');
            const isDeleted = post.hasClass('deleted-answer');
            const action = this.dataset.action;
            console.log(action);

            function removePostFromModQueue() {
                if(location.pathname.includes('/admin/dashboard')) {
                    post.parents('.js-flagged-post').remove();
                }
            }

            switch(action) {
                case 'move-comments':
                    if(confirm('Really move comments to chat?')) {
                        moveCommentsOnPostToChat(pid).then(function(v) {
                            post.find('.comments-list').html('');
                            post.find('.comments-link').prev().addBack().remove();
                            removePostFromModQueue();
                            reloadPage();
                        });
                    }
                    break;
                case 'purge-comments':
                    deleteCommentsOnPost(pid).then(function(v) {
                        post.find('.comments-list').html('');
                        post.find('.comments-link').prev().addBack().remove();
                        removePostFromModQueue();
                        reloadPage();
                    });
                    break;
                case 'convert-comment':
                    undeletePost(pid).then(function() {
                        convertToComment(pid, qid).then(function() {
                            removePostFromModQueue();
                            reloadPage();
                        });
                    });
                    break;
                case 'convert-edit':
                    undeletePost(pid).then(function() {
                        convertToEdit(pid, qid).then(function() {
                            removePostFromModQueue();
                            goToPost(qid);
                        });
                    });
                    break;
                case 'protect': {
                        protectPost(pid).finally(reloadPage);
                    }
                    break;
                case 'unprotect': {
                        unprotectPost(pid).finally(reloadPage);
                    }
                    break;
                case 'meta-incorrect':
                    closeSOMetaQuestionAsOfftopic(pid).then(function() {
                        deletePost(pid).finally(reloadPage);
                    });
                    break;
                case 'close-offtopic':
                    closeQuestionAsOfftopic(pid).then(function() {
                        removePostFromModQueue();
                        goToPost(qid);
                    });
                    break;
                case 'mod-delete':
                    modUndelDelete(pid).then(reloadPage);
                    break;
                case 'lock-dispute': {
                    let d = Number(prompt('Lock for how many days?', '3').trim());
                    if(!isNaN(d)) lockPost(pid, 20, 24 * d).then(reloadPage);
                    else StackExchange.helpers.showErrorMessage(menuEl.parentNode, 'Invalid number of days');
                    break;
                }
                case 'lock-comments': {
                    let d = Number(prompt('Lock for how many days?', '1').trim());
                    if(!isNaN(d)) lockPost(pid, 21, 24 * d).then(reloadPage);
                    else StackExchange.helpers.showErrorMessage(menuEl.parentNode, 'Invalid number of days');
                    break;
                }
                case 'lock-historical':
                    if(confirm(`Confirm apply a permanent historical lock on this question and answers?`)) {
                        lockPost(pid, 22, -1).then(reloadPage);
                    }
                    break;
                case 'unlock':
                    unlockPost(pid).then(reloadPage);
                    break;
                case 'destroy-spammer':
                    if(confirm(`Confirm DESTROY the spammer "${uName}" (id: ${uid}) irreversibly???`) &&
                       confirm(`Are you VERY SURE you want to DESTROY the account "${uName}"???`)) {
                        spamFlagPost(pid);
                        destroySpammer(uid).then(function() {
                            if(!isSuperuser() && !underSpamAttackMode) window.open(`https://${location.hostname}/users/${uid}`);
                            removePostFromModQueue();
                            reloadPage();
                        });
                    }
                    break;
                default:
                    return true;
            }

            return false;
        });
    }


    function doPageload() {

        // Election page - allow loading of comments under nominations
        if(document.body.classList.contains('election-page')) {

            const posts = $('#mainbar table').find('div[id^="post-"]');

            posts.each(function() {
                const pid = this.id.match(/\d+$/)[0];
                const cmmts = $(this).find('.js-comments-container');
                const cmmtlinks = $(this).find('[id^="comments-link-"]');
                cmmtlinks.append(`<span class="js-link-separator">|&nbsp;</span><a class="s-link__danger comments-link js-load-deleted-comments-link" data-pid="${pid}">show deleted comments</a>`);
            });

            $('.js-load-deleted-comments-link').click(function() {
                const pid = this.dataset.pid;
                const elems = $(this).prevAll('.comments-link, .js-link-separator').addBack().not('.js-add-link');
                const commentsUrl = `/posts/${pid}/comments?includeDeleted=true&_=${Date.now()}`;
                $('#comments-' + pid).children('ul.comments-list').load(commentsUrl, function() {
                    elems.remove();
                });
            });

            // Stop rest of script
            return false;
        }

        // Once on page load
        initPostCommentsModLinksEvents();
        addPostCommentsModLinks();

        initPostModMenuLinkActions();
        appendInlinePostModMenus();

        initPostDissociationHelper();

        // After requests have completed
        $(document).ajaxStop(function() {
            addPostCommentsModLinks();
            appendInlinePostModMenus();
        });
    }


    function appendStyles() {

        const styles = `
<style>
/* Better post menu links */
.post-menu .lsep {
    display: none;
}
.post-menu > a,
.post-menu > button {
    font-size: 0.95em;
    padding: 2px 0px;
    margin-right: 5px;
}

.post-signature {
    min-width: 180px;
    width: auto;
}
.block-clear {
    display: block !important;
}

.js-better-inline-menu {
    display: block;
    clear: both;
    float: left;
    min-width: 200px;
    margin: 5px 0 10px;
    padding-top: 5px;
    border-top: 1px solid var(--black-075);
}
.js-better-inline-menu.smaller {
    margin: 5px 0 5px;
    padding: 8px 6px 8px;
    font-size: 0.88em;
    line-height: 1;
    background-color: var(--white);
}

.js-better-inline-menu .inline-label {
    display: inline-block;
    padding: 3px 4px;
    color: var(--black-700);
}
.js-better-inline-menu a {
    margin: 2px 2px;
    padding: 0px 2px;
    display: block;
    color: var(--black-400);
    text-decoration: none;
}
.js-better-inline-menu a.dno {
    display: none;
}
.js-better-inline-menu a:hover {
    color: var(--black-700);
}
.js-better-inline-menu a.inline-link {
    display: inline-block;
}
.js-better-inline-menu a.disabled {
    display: none;
    background-color: var(--black-050) !important;
    color: var(--black-200) !important;
    cursor: not-allowed;
}
.js-better-inline-menu a.danger:hover {
    background-color: var(--red-500);
    color: var(--white);
}
.js-better-inline-menu .separator {
    display: block;
    border-top: 1px solid var(--black-075);
    margin: 5px 0;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();

})();
