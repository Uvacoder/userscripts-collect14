# Stack Overflow Moderation Userscripts

_by [Samuel Liew](https://stackoverflow.com/users/584192/samuel-liew)_

[Bug reports](https://github.com/samliew/SO-mod-userscripts/issues), Forks, and PRs welcome!



<br>

## Recommended

These are highly recommended for moderators. Minor changes to the UI/defaults makes your mod life easier by a *huge* amount (saving clicks, or having to hunt for a particular link/mod feature, or displaying more info upfront). Click these to jump to their descriptions:

- [Mod User Quicklinks Everywhere](https://github.com/samliew/SO-mod-userscripts/blob/master/README.md#mod-user-quicklinks-everywhere-) ♦
- [User Info Sidebar](https://github.com/samliew/SO-mod-userscripts/blob/master/README.md#user-info-sidebar-) ♦
- [User Review Ban Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/README.md#user-review-ban-helper-) ♦
- [Comment Flags Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/README.md#comment-flags-helper-) ♦
- [Not An Answer Flag Queue Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/README.md#not-an-answer-flag-queue-helper-) ♦
- [Display Inline Comment Flag History](https://github.com/samliew/SO-mod-userscripts/blob/master/README.md#display-inline-comment-flag-history-) ♦
- [Deleted Users Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/README.md#deleted-users-helper-) ♦
- [User History Improvements](https://github.com/samliew/SO-mod-userscripts/blob/master/README.md#user-history-improvements-) ♦
- [Additional Post Mod Actions](https://github.com/samliew/SO-mod-userscripts/blob/master/README.md#additional-post-mod-actions-) ♦


These are highly recommended for everyone because they are too awesome:

- [Searchbar & Nav Improvements](https://github.com/samliew/SO-mod-userscripts/blob/master/README.md#searchbar--nav-improvements)
- [Post Headers & Question TOC](https://github.com/samliew/SO-mod-userscripts/blob/master/README.md#post-headers--question-toc)
- [Post Timeline Filters](https://github.com/samliew/SO-mod-userscripts/blob/master/README.md#post-timeline-filters)


Recommended chat userscripts:

- [Chat Improvements](https://github.com/samliew/SO-mod-userscripts/blob/master/README.md#chat-improvements)
- [No Oneboxes in Chat](https://github.com/samliew/SO-mod-userscripts/blob/master/README.md#no-oneboxes-in-chat)



<br>

## General userscripts


### [Expand Short Links](https://github.com/samliew/SO-mod-userscripts/blob/master/ExpandShortLinks.user.js)

*Can you see the link in the post below?*
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-22_220555.png)

- Appends `_link` to short link texts in posts and comments so they can be easily seen and clicked on
- Link is also bolded and color set to red
- E.g.: Link `.` visually becomes `._link`
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-22_220534.png)


### [Hover Expand Navigation Links](https://github.com/samliew/SO-mod-userscripts/blob/master/HoverExpandNavigationLinks.user.js)

- On pagination dots "```...```" mouseover, adds additional 30 in-between links
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/nav-expand.gif)


### [Lightbox Images](https://github.com/samliew/SO-mod-userscripts/blob/master/LightboxImages.user.js)

- Opens image links in a lightbox instead of new window/tab in main & chat


### [Redacted Screenshots](https://github.com/samliew/SO-mod-userscripts/blob/master/RedactedScreenshots.user.js)

- Anonymizes user links in posts and comments
- Masks and hides user-identifying info on page (IPs and email addresses)
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-09-07_110958.png)
- Redact button can be found fixed on the bottom-left of the screen


### [Reduce Clutter](https://github.com/samliew/SO-mod-userscripts/blob/master/ReduceClutter.user.js)

- Removes unnecessary elements from the UI
  - Show comment vote/flag icons only on comment hover instead of all the time
  - Reduces contrast of edited comment icon
    <br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-09-13_120924.png)
  - Show "Edit" (tags) link only on tag list hover
    <br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/tag-edit-link-hover.gif)
  - Hides announcement bar containing keywords like "podcast"
- See comments in userscript source for more info


### [Searchbar & Nav Improvements](https://github.com/samliew/SO-mod-userscripts/blob/master/SearchbarNavImprovements.user.js)

- (Parent) Option to search child meta
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-07-04_110753.png)

- (Meta) New search bar on meta sites, and option to search parent site
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-07-04_110715.png)

- (Parent) Adds link to child meta in left sidebar
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-07-04_110741.png)

- (Meta) Adds link to parent in left sidebar
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-07-04_110717.png)

- **Advanced Search Helper when search box is focused**
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/advanced-search.gif)
  - Fill-in your watched/ignored tags!
  <br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-07-18_220756.png)
  - Tag autocomplete
  <br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/as-tag-ac.gif)
  - Username autocomplete
  <br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/as-username-ac.gif)
  - Useful add-ons!
  <br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-07-18_120756.png)

- **Saved Searches**
  - Toggle from search results page
  <br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-07-18_120700.png)
  - View list via toggle button in Advanced Search Helper
  <br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-07-18_120752.png)

- **Auto Refresh**
  - Toggle from search results page
  <br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-08-02_130815.png)

- **Instant Filter Toggles**
  - Toggle from search results page
  <br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2022-01-27_112150.png)


### [Stack Exchange Dark Mode](https://github.com/samliew/SO-mod-userscripts/blob/master/StackExchangeDarkMode.user.js)

- Dark theme for Stack Exchange.
- Some elements have reduced opacity until focused/mouseover (sidebar modules/images/timestamps). Some important colours are retained.
- Code highlighting in darker colours
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-09-30_150956.png)
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-09-30_150953.png)
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-09-30_150909.png)


### [Stack Exchange Wider Mode](https://github.com/samliew/SO-mod-userscripts/blob/master/StackExchangeWiderMode.user.js)

- Unlock the max-width of all Stack Exchange sites and utilize your wide screen
- Change your preferred width size in source code


### [Stack Print Styles](https://github.com/samliew/SO-mod-userscripts/blob/master/StackPrintStyles.user.js)

- Responsive print styles for all sites on the network, as well as chat and chat transcripts
- Strips out unnecessary information from the page only when printing, leaving just the main content


### [Flag Retractor](https://github.com/samliew/SO-mod-userscripts/blob/master/FlagRetractor.user.js)

- Allows you to retract pending post flags from your flag history page


### [Declined Flags Notifier](https://github.com/samliew/SO-mod-userscripts/blob/master/DeclinedFlagsNotifier.user.js)

- Notifies you if you have any declined flags in the past few days


### [Saved Posts Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/SavedPostsHelper.user.js)

- Batch-move saved posts between private lists
- Undo button when unsaving a post
- Quick move dropdown after saving in Q&A



<br>

## Q&A userscripts


### [Additional Post Mod Actions](https://github.com/samliew/SO-mod-userscripts/blob/master/AdditionalPostModActions.user.js) ♦

- Adds a menu of quick mod-actions instead of having to wait for mod menu to load and having to select items in the mod menu
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/additional-post-mod-options.gif)
- The items in the menu are disabled/hidden depending on context, and also slightly different options based on whether it's a Q or A
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2020-04-04_edited.png)
- Able to quickly dispute or comment lock a post with custom number of days, as well as unlock
- Quickly destroy users (with <200 rep) if they are posting spammy content (post age <30 days) (requires confirmation, 5-second throttle)
- Post dissociation link quickly composes a post dissociation request for post user with link of post inserted into dissociation message template
- (Stack Overflow) assists with re-duping of old questions closed with the old duplicate notice
- (Meta Stack Overflow) one-click closing, deleting questions as off-topic, and posting canned comment


### [Additional Inline Post Mod Actions](https://github.com/samliew/SO-mod-userscripts/blob/master/AdditionalInlinePostModMenu.user.js) ♦

- Similar to the above, but places the buttons under each post menu (above comments)



### [Chat Transcripts By Default](https://github.com/samliew/SO-mod-userscripts/blob/master/ChatTranscriptsByDefault.user.js)

- Rewrites chat room links to chat transcript in Q&A comments, to avoid joining the room directly


### [Discussed On Meta](https://github.com/samliew/SO-mod-userscripts/blob/master/DiscussedOnMeta.user.js)

*This userscript has only been tested on Tampermonkey, and requires additional permissions for cross-site requests to Meta as it's on a different domain. Simply click on "Always allow" when prompted.*

- For questions, displays info if it's discussed on Meta
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-18_210542.png)
- On arrow mouseover, displays the Meta posts
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-18_210522.png)
- Works for posts with IDs >= 100000 only to prevent false positives


### [Question Lists Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/QuestionListsHelper.user.js)

- Fetch details about questions from the API
- See who hammer-duped a question, or which mod closed it, and which close reason
- Comments preview on hover
- Mini images, tables, code snippet


### [Fetch Vote Counts Again](https://github.com/samliew/SO-mod-userscripts/blob/master/FetchVoteCountsAgain.user.js)

- Fetch vote counts for posts and enables you to click to fetch them again, even if you do not have sufficient rep
- Also enables fetch vote counts on posts in mod flag queue


### [Hide Vote Counts](https://github.com/samliew/SO-mod-userscripts/blob/master/HideVoteCounts.user.js)

- Experiment to hide all post scores until you have voted for the post
- Does not hide post scores for own posts, as well as locked or deleted posts.


### [Migration Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/MigrationHelper.user.js) ♦

- Dropdown list of migration targets displaying site icon/logo/header images and links to the selected site's on-topic page and mod list. Displays additional information for custom flagger for selected network site.
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-09-12_130911.png)
- Dropdown transformed with Chosen, allowing for text search of site names
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-09-12_130922.png)


### [Post Headers & Question TOC](https://github.com/samliew/SO-mod-userscripts/blob/master/PostHeadersQuestionToc.user.js)

- Sticky post headers to help when scrolling long posts / comment threads
  - User, revision history, post timeline links
  - Clicking on empty middle area scrolls to start of post (replaces URL hash)

<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-08-07_150823.png)

- Question Table of Contents of Answers in sidebar below Featured Posts module
  - Only shown when there are five or more answers
  - Answer score, accepted, user display name, indicates mods and deleted users, datetime
  - Sorted by current answer sort order (active/oldest/votes)
  - Clicking on answer links scrolls to start of post (replaces URL hash)
  - Option to toggle visibility of deleted answers (visible to 10k rep users)

<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-08-07_150848.png)


### [Post Ids Everywhere](https://github.com/samliew/SO-mod-userscripts/blob/master/PostIdsEverywhere.user.js)

- Inserts post IDs everywhere where there's a post or post link (for copying/easier x-referencing/etc)
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/postids-everywhere.gif)
- Useful for copying ID of answer, for converting an answer to a comment of the target post
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-04-23_190400.png)
- When double clicked, opens post timeline in new tab


### [Post Timeline Filters](https://github.com/samliew/SO-mod-userscripts/blob/master/PostTimelineFilters.user.js)

- Inserts several filter options for post timelines, useful for old posts with humongous timelines
- Hides daily summaries by default
- Fixes display style on comment flags expansion (jQuery show/hide defaults to block, breaking table)
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-06-01_110648.png)


### [HideReputation](https://github.com/samliew/SO-mod-userscripts/blob/master/HideReputation.user.js)

- Hide all user reputation on the site


### [No User Id Share Links](https://github.com/samliew/SO-mod-userscripts/blob/master/NoUserIdShareLinks.user.js)

- Remove your referral user id when copying a post share link



<br>

## Comment Moderation


### [Comment Flag Type Colours](https://github.com/samliew/SO-mod-userscripts/blob/master/CommentFlagTypeColours.user.js)

- Works on user's comment flag history group page

<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-08-08_110813.png)

- Works on user's mod comment history pages

<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-08-08_120852.png)

- Works on mod comment flag queues

<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-08-08_120838.png)


### [Comment Undeleter](https://github.com/samliew/SO-mod-userscripts/blob/master/CommentUndeleter.user.js) ♦

- Allows moderators to undelete comments deleted by any user, including ex-mods and Communnity user


### [Comment User Colors](https://github.com/samliew/SO-mod-userscripts/blob/master/CommentUserColours.user.js)

- Unique border colour for each user in comments to make following users in long comment threads easier
- Only appears if user has more than one comment on the page
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-07-05_100726.png)


### [Display Inline Comment Flag History](https://github.com/samliew/SO-mod-userscripts/blob/master/DisplayInlineCommentFlagHistory.user.js) ♦

- Grabs post timelines and display comment flag counts beside post comments. This also permalinks to comment in post timeline
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-10_230533.png)
- Displays flags on comment hover
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-10_230507.png)
- Clear CommentFlags cache on weekends
- On post timeline page, if comment is found in URL, also expand flags on the comment
- Fixes display style on comment flags expansion (jQuery show/hide defaults to block, breaking table)


### [New Comments Layout](https://github.com/samliew/SO-mod-userscripts/blob/master/NewCommentsLayout.user.js)

Better comments layout for easier readability and moderation.

- Reduce comment body font-size to 96%
- Comment meta-text is on a new line, font-size reduced to 90%
- Usernames in comments are italicized
- Deleted comment info is floated right to keep comments compact instead of taking up a new line
- Delete links are floated right (to make it consistent with Undelete links)
- When mouse is over comments section, show faint preview of all delete links
- Comment hover background
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2019-03-14_110300.png)



<br>

## User Moderation


### [Deleted Users Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/DeletedUsersHelper.user.js) ♦

- Redirects user 404 pages to main profile
- Linkify deleted users, show display name on mouseover
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-06-09_000636.png)
- You can now multi-select delete/undelete posts by deleted user
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-06-09_000637.png)
- Improved deleted user page, linkify URLs
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-07-02_210759.png)
- Additional helpful links below for IP & username cross-referencing
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-07-09_080758.png)
- When PII is loaded on user mod page, format the info in a textarea for easier copying into delete/destroy reason so it will look like this
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-10-03_081002-copy.png)


### [Find Users Additional Info](https://github.com/samliew/SO-mod-userscripts/blob/master/FindUsersAdditionalInfo.user.js) ♦

- Improvements for /admin/find-users


### [Mod Message Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/ModMessageHelper.user.js) ♦

- Adds a message menu to userinfo boxes
- Select from usual mod message or CM message templates
- Selected templates are automatically selected on landing on the new message page


### [Mod User Quicklinks Everywhere](https://github.com/samliew/SO-mod-userscripts/blob/master/ModUserQuicklinksEverywhere.user.js) ♦

- Adds user quick links under display name in posts (opens in new tabs)
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/user-quicklinks.gif)


### [Post Ban Deleted Posts](https://github.com/samliew/SO-mod-userscripts/blob/master/PostBanDeletedPosts.user.js) ♦

- When user posts on Meta Stack Overflow regarding a post ban, fetch and display deleted posts (must be mod) and provide easy way to copy the results into a comment
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-07-09_100703.png)


### [User Activity Notifications](https://github.com/samliew/SO-mod-userscripts/blob/master/UserActivityNotifications.user.js)

- Display Windows notification when user page is open and user has new activity (new post, new comment, new edit, etc.)


### [User History Improvements](https://github.com/samliew/SO-mod-userscripts/blob/master/UserHistoryImprovements.user.js) ♦

- Fixes broken links in user annotations, and minor layout improvements
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-07-24_160759.png)


### [User Info Sidebar](https://github.com/samliew/SO-mod-userscripts/blob/master/UserInfoSidebar.user.js) ♦

- Adds user moderation collapsable left-sidebar to user-specific pages: quick links & selection of user details from Mod Dashboard
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-04-12_210450.png)


### [User Social Media Profile Links](https://github.com/samliew/SO-mod-userscripts/blob/master/UserSocialMediaProfileLinks.user.js) ♦

- When user PII is loaded, add links to social media profile
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-07-08_200748.png)


### [User Profile Links](https://github.com/samliew/SO-mod-userscripts/blob/master/UserProfileLinks.user.js) ♦

- On user profile pages, expands user network links menu and add chat profile links


### [Suspicious Voting Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/SuspiciousVotingHelper.user.js) ♦

- Assists in building suspicious votes CM messages
- Highlight same users across IPxref table (hover to highlight, click to pin highlight)



<br>

## Reviews Moderation


### [Rejected Suggested Edits](https://github.com/samliew/SO-mod-userscripts/blob/master/RejectedSuggestedEdits.user.js)

- Adds new page `/review/suggested-edits/history/rejected`
- Adds link to above page via mod links page (`/admin/links`) as well as Suggested Edits tabs
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/2a721b89-98a7-4781-99bf-0a52136aa6a2.png)
- has toggle date format (like post timelines) and pagination
- anonymous users are easy to spot because they are unlinked
- click on left arrow toggle to display review summary
- anonymous edits reviews are preloaded so we can detect whether they have spam rejection reasons
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/c52e1b6b-a09b-45b8-b987-e54fd9d9831c.png)
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/cac56371-d7c7-4927-9b19-9cb77ab0e1bb.png)


### [Review Queue Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/ReviewQueueHelper.user.js)

- Keyboard shortcuts for review action buttons
- Keyboard shortcuts for popup action dialogs (close, flag, delete, reject edit)
- Auto-focus submit button when option selected in popup action dialogs (e.g.: so you can go "2 > 2 > space" to submit)
- Automatically skips review audits
- Esc goes back a previous dialog pane
- More options available when SOMU Options userscript is installed


### [User Review Ban Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/UserReviewBanHelper.user.js) ♦

- Display users' prior review bans in review (links to review ban history), ban quicklink
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-04-24_140417.png)
- Insert review ban/unban button in user review ban history page
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-04-24_140443.png)
- If ban quicklink is clicked from a review, auto user lookup if user ID passed via hash, auto-fill reason with review URL
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-12-31_111248.png)
- Link ban counts in table to user's review history
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-12-31_111202.png)



<br>

## Mod Improvements & New Tools


### [10k Tools Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/10kToolsHelper.user.js)

- Expands all sections
- Adds question or answer filters to Delete votes page
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2019-11-19_141119.png)


### [Mobile Moderator Pages](https://github.com/samliew/SO-mod-userscripts/blob/master/MobileModeratorPages.user.js)

- Before/After *(screenshot redacted using RedactedScreenshots, and also running CommentFlagsHelper and CommentFlagTypeColours)*
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-08-31_110831-befaft.png)
- Use new responsive menu
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/mod-responsive-nav.gif)


### [Mod Batch Comment Deleter](https://github.com/samliew/SO-mod-userscripts/blob/master/ModBatchCommentDeleter.user.js) ♦

- Batch delete comments using comment permalinks from SEDE, e.g.: https://data.stackexchange.com/stackoverflow/query/1131935
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/mod-batch-comments-deleter.gif)


### [Mod Flagger Stats](https://github.com/samliew/SO-mod-userscripts/blob/master/ModFlaggerStats.user.js)

- On post hover in mod flag queue, get and display flaggers stats (via tooltip on flag badge):<br>
  Reputation, Total Flags, Declined Flags, % Declined
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-06-01_110629.png)
- Badge links to user's flag history (opens in a new window)
- **Non-mods:** Can view own flag badge on main profile page
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-06-01_110628.png)


### [Moderator History Improvements](https://github.com/samliew/SO-mod-userscripts/blob/master/ModeratorHistoryImprovements.user.js) ♦

- Better UI for recent moderator flag handling history
- Automatically updates every 30 seconds


### [Personal Mod Message History](https://github.com/samliew/SO-mod-userscripts/blob/master/PersonalModMessageHistory.user.js) ♦

- Displays link to switch to your recently sent mod messages in the inbox dialog
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/mod-messages.png)


### [Refresh Empty Mod Queue](https://github.com/samliew/SO-mod-userscripts/blob/master/RefreshEmptyModQueue.user.js) ♦

- If current mod queue is empty, reload page occasionally
- Also puts the flag count back in the navbar in case you miss it or need a link to the empty flag queue for some reason



<br>

## Mod Queue-specific userscripts


### [Comment Flags Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/CommentFlagsHelper.user.js) ♦

- Highlight common chatty/rude keywords
- Some style improvements
- Rename "dismiss" link to "decline" with hover warning color
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-04-23_210443.png)
- Add "dismiss + delete" option on hover
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/decline-delete.gif)
- Always expand comments if post is expanded (**includes deleted posts**), and highlights flagged user comments in expanded posts
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-04-23_210428.png)
- Quick **purge all comments link** (with confirmation prompt)
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-01_100511.png)
- Option to review from the bottom of the page (so page won't jump around after handling each flag)
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-04-23_210423.png)
- Option to hide comments posted within the past day
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-09_160527.png)


### [Duplicate Answers Flags Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/DuplicateAnswersFlagsHelper.user.js) ♦

- Add action button to delete AND insert duplicate comment at the same time, saving you from deleting and then having to open up a new tab to manually insert comment
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-05_120501.png)
- Comment left on answer:<br>`Please [don't post identical answers to multiple questions](https://meta.stackexchange.com/q/104227). Instead, tailor the answer to the question asked. If the questions are exact duplicates of each other, please vote/flag to close instead.`

**[Options](#somu-options "SOMU Options userscript required")**:

- Duplicate Comment (text)


### [Not An Answer Flag Queue Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/NotAnAnswerFlagQueueHelper.user.js) ♦

- Inserts several sort options for the **NAA / VLQ / Review LQ Disputed** queues
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-04-30_150426.png)


### [Possible Vandalism Comment Deletions Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/PossibleVandalismCommentDeletionsHelper.user.js) ♦

- Display deleted comments and user who deleted the comments
- UI is similar to commenttoomanydeletedrudenotconstructiveauto queue + Comment Flags Helper
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-06-08_130627.png)


### [Possible Vandalism Deletions Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/PossibleVandalismDeletionsHelper.user.js) ♦

- Sort answers first
- Display post score, number of undeleted answers, post age
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-09_220559.png)

- Recommend action based on post info
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-09_220518.png)


### [Possible Vandalism Edits Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/PossibleVandalismEditsHelper.user.js) ♦

- Similar to the above, display revision count, post age
- Does not recommend as edits still need to be reviewed manually


### [Too Many Comments Flag Queue Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/TooManyCommentsFlagQueueHelper.user.js) ♦

- Auto-expand unhandled posts
- Display post info at the bottom
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-08-04_080850.png)
- Inserts quicklinks to "Move comments to chat + delete" and "Delete all comments"
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-04_120553.png)
- Confirmation displayed after successful response from server (don't forget to mark as helpful)
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-04_120549.png)



<br>

## Chat UI & Chat Moderation


### [Chat Emojis](https://github.com/samliew/SO-mod-userscripts/blob/master/ChatEmojis.user.js)

- Allows users to insert unicode emojis into chat
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-09-13_160947.png)
- If chat messages contains just a single emoji, increase size
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-10-29_111015.png)


### [Chat Improvements](https://github.com/samliew/SO-mod-userscripts/blob/master/ChatImprovements.user.js)

Works with "No Oneboxes In Chat" and "Stack Exchange Dark Mode".

- **New responsive user list** displaying usernames and total count
- **Timestamps on every message** in live chat
- Use tiny signatures and avatars only
- Mods with diamonds in signatures
- **Message parser** (smart links and link expander)
- Minimize room description and room tags (hover to expand)
- **Topbar with live inbox notifications** and chat domain switcher
- Link to rejoin starred rooms
- Expand starred messages in sidebar on hover and on print
- Starred messages are now scrollable instead of having to click on "show more"
- On mouseover user signatures or mentions, highlight occurences of same user's links and mentions on page
- **Room owner changelog** in access info page
- Add transcript and room owners links above user list
- Print styles for live chat and transcripts (for printing to PDF with clickable links)
- (Mobile) font size increase
- and more...


### [Chat More Magic Links](https://github.com/samliew/SO-mod-userscripts/blob/master/ChatMoreMagicLinks.user.js)

- Some magic links are not parsed in Stack Overflow Chat. This script parses and submit expanded magic links via an edit to your latest message.
- List of additional magic links handled by this userscript:
  - `[mcve]`
  - `[help]`
  - `[help/on-topic]`
  - `[help/dont-ask]`
  - `[help/behavior]`
  - `[meta-help]`
  - `[tour]`
  - `[chat]`


### [Chat Pagination](https://github.com/samliew/SO-mod-userscripts/blob/master/ChatPagination.user.js)

- Do not install if you have *ChatImprovements* as it already includes this feature
- Adds pagination to user's recent messages page


### [Chat Redact Messages](https://github.com/samliew/SO-mod-userscripts/blob/master/ChatRedactMessages.user.js) ♦

- Add "Redact + Purge + Delete" button to message history page
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-09-14_120911.png)
- Add history link to message actions popup if not found
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-09-14_120923.png)


### [Chat Room Info Annotations](https://github.com/samliew/SO-mod-userscripts/blob/master/ChatRoomInfoAnnotations.user.js) ♦

- Display users' annotation count in chat room general info tab
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-04-23_210431.png)


### [Chat Transcript Helper](https://github.com/samliew/SO-mod-userscripts/blob/master/ChatTranscriptHelper.user.js)

- Replaces timestamps in chat transcripts with your local time


### [Create Private Mod Chatroom](https://github.com/samliew/SO-mod-userscripts/blob/master/CreatePrivateModChatroom.user.js) ♦

- One-click button to create private mod chatroom from user chat profile, and then grants the user write access immediately after
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-10-29_111028.png)
- When entering this room, add view chat profile and superping buttons in message
- Clicking on superping button will generate a superping with instructions on how to join the room (because inbox only links to room transcript, and new users may not know what to do)
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-10-29_111052.png)


### [No Oneboxes in Chat](https://github.com/samliew/SO-mod-userscripts/blob/master/NoOneboxesInChat.user.js)

- Collapses oneboxes from live chat, chat transcripts, bookmarked conversations
- Click to display onebox
- Has exposed function to work together with [Show Deleted Messages in Chat](#show-deleted-messages-in-chat-) userscript


### [No Oneboxes in Chat Transcripts](https://github.com/samliew/SO-mod-userscripts/blob/master/NoOneboxesInChatTranscripts.user.js)

- Do not install if you have *NoOneboxesInChat*, as it already includes this feature
- Collapses oneboxes from chat transcripts, bookmarked conversations (**live chat untouched**)
- Click to display onebox


### [Show Deleted Messages in Chat](https://github.com/samliew/SO-mod-userscripts/blob/master/ShowDeletedMessagesInChat.user.js) ♦

- Show deleted messages from live chat, chat transcripts, bookmarked conversations
- Works with [No Oneboxes in Chat](#no-oneboxes-in-chat) userscript



<br>

## Miscellaneous


### [SOMU Options](https://github.com/samliew/SO-mod-userscripts/blob/master/SOMU-options.user.js)

- Required for userscripts that allows further customization
- See options under each userscript above for info on what is available
- Options sidebar will appear on pages that the respective userscripts are running on


### [Election Supporter Flairs](https://github.com/samliew/SO-mod-userscripts/blob/master/ElectionSupporterFlairs.user.js)

- Flair users who voted in the elections...
  - mods:  when you were elected
  - users: for the latest election
<br>![screenshot](https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/images/Screenshot_2018-05-17_210559.png)
