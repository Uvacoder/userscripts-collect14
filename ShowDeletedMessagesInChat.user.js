// ==UserScript==
// @name         Show Deleted Messages in Chat
// @description  Show Deleted Messages in Chat and Transcripts. Works with NoOneboxesInChat userscript
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.2.1
//
// @include      https://chat.stackoverflow.com/rooms/*
// @include      https://chat.stackexchange.com/rooms/*
// @include      https://chat.meta.stackexchange.com/rooms/*
//
// @include      https://chat.stackoverflow.com/transcript/*
// @include      https://chat.stackexchange.com/transcript/*
// @include      https://chat.meta.stackexchange.com/transcript/*
//
// @include      https://chat.stackoverflow.com/rooms/*/conversation/*
// @include      https://chat.stackexchange.com/rooms/*/conversation/*
// @include      https://chat.meta.stackexchange.com/rooms/*/conversation/*
// ==/UserScript==

(function() {
    'use strict';


    function getDeletedMessagesHistory(mid) {
        const msgDiv = $(`#message-${mid}`);
        const contentDiv = msgDiv.find('.content');

        // Get message's history
        $.get(`/messages/${mid}/history`, function(data) {

            // Get message and deleted-by from history
            const origMsg = $(`#message-${mid}`, data).first().find('.content').html();
            const deletedBy = $('b:contains("deleted")', data).closest('.monologue').find('.username').attr('target', '_blank').html();

            // Insert into message
            contentDiv.append(origMsg);
            contentDiv.find('.deleted').first().html(`(deleted by ${deletedBy})`);

            // Add class 'cmmt-deleted' for styling purposes (background/text color)
            msgDiv.addClass('cmmt-deleted');

            // Hide oneboxes if userscript is installed
            if (typeof hideOneboxes === 'function') { hideOneboxes(); }
        });
    }


    function processNewDeletedMessages() {

        // Use class 'js-history-loaded' to track which ones have been processed
        $('.deleted').not('.js-history-loaded').addClass('js-history-loaded')

            .parents('.message')

            // Hand-off message ID to function
            .each((i, el) => getDeletedMessagesHistory(el.id.replace('message-', '')));
    }


    function doPageload()
    {
        var me = CHAT.RoomUsers.current();
        var canSeeDeleted = me.is_moderator || me.is_owner;
        if (canSeeDeleted) {
            // Once on page load
            processNewDeletedMessages();

            // Occasionally, look for new deleted messages and load them
            setInterval(processNewDeletedMessages, 5000);
        }
    }


    function appendStyles() {

        const styles = `
<style>
.message.cmmt-deleted {
    background: #f4eaea;
    color: #990000;
}
.message.cmmt-deleted span.deleted {
    float: right;
    padding-left: 10px;
    font-style: italic;
}
.message.cmmt-deleted span.deleted a {
    color: #999;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();

})();
