// ==UserScript==
// @name         Find Users Additional Info
// @description  Loads more user details from the API on the find users page (/admin/find-users)
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.1
//
// @include      https://stackoverflow.com/admin/find-users?*
// @include      https://serverfault.com/admin/find-users?*
// @include      https://superuser.com/admin/find-users?*
// @include      https://askubuntu.com/admin/find-users?*
// @include      https://mathoverflow.net/admin/find-users?*
// @include      https://stackapps.com/admin/find-users?*
// @include      https://*.stackexchange.com/admin/find-users?*
//
// @exclude      *chat.*
// @exclude      https://stackoverflow.blog*
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

if (!isModerator()) return;

const apikey = 'vbWJDc*G3ug1FpRrCx0pEw((';


/*
// API: User
{
  "answer_count": 123,
  "question_count": 123,
  "account_id": 1235467,
  "last_modified_date": 1552884907,
  "last_access_date": 1463183273,
  "reputation": 123,
  "creation_date": 1413755158,
  "user_type": "registered",
  "user_id": 1234567
}
*/
function getUsers(arrUids) {
    return new Promise(function (resolve, reject) {
        if (typeof arrUids === 'undefined' || arrUids === null || arrUids.length == 0) { reject(); return; }

        $.get(`https://api.stackexchange.com/2.2/users/${arrUids.join(';')}?pagesize=100&sort=reputation&site=${location.hostname}&filter=!BTeL)VYJZTHLffEZa-Pp0vhpUAyDVM&key=${apikey}`)
            .done(function (data) {
                resolve(data.items);
                return;
            })
            .fail(reject);
    });
}


function doPageLoad() {

    // UI stuff
    const form = $('#content form').attr('id', 'find-users-form').removeClass('d-flex');
    const searchField = $('input[name="q"]', form).addClass('s-input s-input__md js-usersearch-input');
    const searchSubmit = $('button', form).addClass('s-btn s-btn__md s-btn__primary js-usersearch-submit').insertAfter(searchField);

    searchField.parent().addClass('d-flex');

    const table = $('#users-list');
    const ids = table.find('tbody tr').find('a:first').attr('target', '_blank').each(function () {
        $(this).closest('tr').attr('id', 'user-' + this.innerText);
    }).get().map(v => Number(v.innerText));

    // Add table headers
    table.children('thead').children('tr').append(`<th>Network</th><th>Joined</th><th>Seen</th><th>Rep</th><th>UserType</th><th>Qns</th><th>Ans</th>`);

    // Split API calls, max 100 per call
    for (let i = 0; i < Math.ceil(ids.length / 100); i++) {
        setTimeout(function (ids) {
            getUsers(ids).then(function (users) {
                users.forEach(function (user) {
                    const dateCreated = new Date(user.creation_date * 1000).toISOString().replace('T', ' ').replace(/:\d+\.\d+Z/, 'Z');
                    const dateLastSeen = new Date(user.last_access_date * 1000).toISOString().replace('T', ' ').replace(/:\d+\.\d+Z/, 'Z');
                    $('#user-' + user.user_id)
                        .append(`
<td class="align-right"><a href="https://stackexchange.com/users/${user.account_id}?tab=accounts" target="_blank">${user.account_id}</a></td>
<td>${dateCreated}</td><td>${dateLastSeen}</td><td class="align-right">${user.reputation}</td><td class="align-right">${user.user_type}</td><td class="align-right">${user.question_count}</td><td class="align-right">${user.answer_count}</td>`);
                });
            });
        }, 10000 * i, ids.slice(i * 100, (i + 1) * 100));
    }

    console.log(ids.length);
}


// On page load
doPageLoad();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
/* More space */
body > .container,
#left-sidebar + #content,
#content {
    max-width: none !important;
    width: 100% !important;
    border: none;
}
#content br,
#left-sidebar {
    display: none;
}

/* UI stuff */
.subheader {
    text-align: center;
}
.subheader * {
    float: none !important;
}
#content #find-users-form {
    margin: 40px auto !important;
    width: 40%;
    text-align: center;
}
#content .s-notice {
    text-align: center;
}
.js-usersearch-input,
.js-usersearch-submit {
    height: 40px !important;;
    margin: 0;
}
.js-usersearch-input {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border-right: none;
    margin-right: -1px;
}
.js-usersearch-submit {
    border-top-left-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
    padding: 3px 15px !important;
}
#users-list {
    margin: 30px auto;
    font-family: Consolas, Menlo, Monaco, 'Lucida Console', 'Liberation Mono';
}
#users-list thead th {
    padding-bottom: 8px;
    border-bottom: 2px solid black;
    font-weight: bold;
}
#users-list tbody > tr:first-child td {
    padding-top: 10px;
}
#users-list td,
#users-list th {
    padding: 2px 5px;
}
#users-list tr th:nth-child(5),
#users-list tr td:nth-child(5) {
    display: none;
}
#users-list td {
    min-width: 70px;
    max-width: 320px;
    word-break: break-all;
}
#users-list td.align-right,
#users-list tbody td:first-child {
    min-width: 30px;
    text-align: right;
    word-break: none;
}
`;
document.body.appendChild(styles);