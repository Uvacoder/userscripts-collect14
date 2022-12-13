// ==UserScript==
// @name         Refresh Empty Mod Queue
// @description  If current mod queue is empty, reload page occasionally
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      3.3
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
//
// @exclude      *chat.*
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

if (typeof unsafeWindow !== 'undefined' && window !== unsafeWindow) {
    window.jQuery = unsafeWindow.jQuery;
    window.$ = unsafeWindow.jQuery;
} else {
    unsafeWindow = window;
}

const goToMain = () => location.href = '/admin/dashboard?filtered=false';
const reloadPage = () => location.search.contains('filtered=false') ? location.reload() : location.search += (location.search.length == 0 ? '' : '&') + 'filtered=false';
let timeoutSecs = unsafeWindow.modRefreshInterval || 10;
let timeout, interval;


let initRefresh = function (main = false) {

    if ($('.js-flagged-post:visible, .flagged-post-row:visible').length > 0) return;
    if (timeoutSecs < 1) timeoutSecs = 5;

    // Function called again, reset
    if (timeout || interval) {
        clearTimeout(timeout);
        clearInterval(interval);
        timeout = null;
        interval = null;
        $('#somu-refresh-queue-counter').remove();
    }

    let c = timeoutSecs;
    $(`<div id="somu-refresh-queue-counter">Refreshing page in <b id="refresh-counter">${timeoutSecs}</b> seconds...</div>`).appendTo('body');

    // Main timeout
    timeout = setTimeout(main ? goToMain : reloadPage, timeoutSecs * 1000);

    // Counter update interval
    interval = setInterval(function () {
        $('#refresh-counter').text(--c > 0 ? c : 0);
    }, 1000);
};
unsafeWindow.initRefresh = initRefresh;


function doPageLoad() {

    // If no mod flags, insert mod flags indicator in header anyway...
    if ($('.js-admin-dashboard-button').length === 0) {
        $('.js-mod-inbox-button').parent().after(`<li>
            <a href="/admin/dashboard" class="s-topbar--item px4 js-admin-dashboard-button" aria-label="no flagged posts" title="no posts flagged for moderator attention">
                <span class="s-badge s-badge__bounty">0</span>
            </a>
         </li>`);
    }

    // If not on mod flag pages, ignore rest of script
    if (!location.pathname.includes('/admin/dashboard') || ($('.js-admin-dashboard').length == 0 && !document.body.classList.contains('flag-page'))) return;

    // If completely no post flags, redirect to main
    if ($('.s-sidebarwidget--header .bounty-indicator-tab').length === 0 && $('.so-flag, .m-flag, .c-flag').length === 0) {
        initRefresh(true);
    }
    // Refresh if no flags left in current queue
    else {
        initRefresh();
    }

    // On user action on page, restart and lengthen countdown
    $(document).on('mouseup keyup', 'body', function () {
        if (timeout) timeoutSecs++;
        initRefresh();
    });

    // On skip post link click
    $('.js-flagged-post, .flagged-post-row').on('click', '.skip-post', initRefresh);

    // When ajax requests have completed
    $(document).ajaxComplete(function (event, xhr, settings) {

        // If post deleted, remove from queue
        if (!settings.url.includes('/comments/') && settings.url.includes('/vote/10')) {
            const pid = settings.url.match(/\/\d+\//)[0].replace(/\//g, '');
            $('#flagged-' + pid).remove();

            // Refresh if no flags in current queue
            initRefresh();
        }
    });

    // When flags are handled, refresh if no flags in current queue
    $(document).ajaxStop(initRefresh);
}


// On page load
doPageLoad();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
#somu-refresh-queue-counter {
    position:fixed;
    bottom:0;
    left:50%;
    line-height:2em;
    transform:translateX(-50%);
}
.js-admin-dashboard > div > div > fieldset {
    display: none;
}
`;
document.body.appendChild(styles);
