// ==UserScript==
// @name         Mod User Quicklinks Everywhere
// @description  Adds quicklinks to user infobox in posts
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.11.4
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
//
// @exclude      *chat.*
// @exclude      https://stackoverflow.com/c/*
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    const isChildMeta = StackExchange.options.site.isChildMeta;
    const parentUrl = isChildMeta ? StackExchange.options.site.parentUrl : '';
    const showOnHover = false;


    function addUserLinks() {

        $('.post-user-info, .user-details, .js-body-loader div.ai-center.fw-wrap')
            .not('.js-mod-quicklinks')
            .addClass('js-mod-quicklinks')
            .find('a[href^="/users/"]:first').each(function() {

                // Add Votes and IP-xref links after mod-flair if mod, or after the user link
                const uid = Number(this.href.match(/-?\d+/));
                const modFlair = $(this).next('.mod-flair');
                if(uid == -1 || modFlair.length == 1) return;

                const userlinks = `<div class="mod-userlinks grid--cell ${showOnHover ? 'show-on-hover' : ''}">` +
`<a href="${parentUrl}/users/account-info/${uid}" target="_blank">mod</a>` +
`<a href="/admin/users/${uid}/post-comments" target="_blank">cmnts</a>` +
`<a href="${parentUrl}/admin/show-user-votes/${uid}" target="_blank">votes</a>` +
`<a href="${parentUrl}/admin/xref-user-ips/${uid}?daysback=30&threshold=2" target="_blank">xref</a>` +
(!isChildMeta ? `<a href="${parentUrl}/admin/cm-message/create/${uid}?action=suspicious-voting" target="_blank">cm</a>` : '') +
`</div>`;

                $(this).closest('.user-info, .js-mod-quicklinks').append($(userlinks));
            });

        $('.user-info').addClass('js-mod-quicklinks');
    }


    function listenToPageUpdates() {
        $(document).ajaxStop(addUserLinks);
        $(document).on('moduserquicklinks', addUserLinks);
    }


    function appendStyles() {

        $('.task-stat-leaderboard').removeClass('user-info');

        const styles = `
<style>
.user-info .user-details {
    position: relative;
}
.mod-userlinks {
    display: block;
    clear: both;
    width: 100%;
    padding-top: 1px;
    font-size: 0.9em;
    white-space: nowrap;
}
.js-mod-quicklinks:hover .mod-userlinks,
.mod-userlinks:hover {
    opacity: 1 !important;
}
.mod-userlinks.show-on-hover {
    display: none;
}
.mod-userlinks,
.mod-userlinks a {
    color: var(--black-500);
}
.mod-userlinks > a {
    display: inline-block;
    margin-right: 3px;
}
.mod-userlinks a:hover {
    color: var(--black);
}
.post-user-info:hover .mod-userlinks,
.user-info:hover .mod-userlinks {
    display: block;
}
.deleted-answer .mod-userlinks {
    background-color: var(--red-050);
}
.deleted-answer .owner .mod-userlinks {
    background-color: transparent;
}
.grid--cell + .mod-userlinks {
    position: initial !important;
    display: inline-block;
    width: auto;
    opacity: 0.6;
    background: none;
}
/* review stats/leaderboard */
.stats-mainbar .task-stat-leaderboard .user-details {
    line-height: inherit;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    addUserLinks();
    listenToPageUpdates();

})();
