/* Key Club email templates.
 * Every piece is plain inline-styled HTML (tables, like the originals) so it
 * survives being pasted into Gmail. Each top-level <tr data-block> is a
 * section the editor can move, duplicate or delete; inner rows/cells with
 * data-block (list items, tiles) can be handled the same way. */
(function () {
  var NAVY = '#063b70', NAVY2 = '#0a4a87', GOLD = '#f4c400', INK = '#102b45',
      MUTED = '#71869a', BODY = '#445c70', LINE = '#dfe6ec';
  var T = 'role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"';

  function logo(size) {
    var img = Math.round(size * 0.92);
    return '<div contenteditable="false" style="width:' + size + 'px;height:' + size + 'px;background:#ffffff;' +
      'border-radius:50%;display:block;text-align:center;line-height:' + size + 'px;overflow:hidden;">' +
      '<img src="' + window.KC_LOGO + '" width="' + img + '" height="' + img + '" alt="Key Club GCS" ' +
      'style="display:inline-block;vertical-align:middle;border:0;outline:none;max-width:' + img + 'px;height:auto;"></div>';
  }

  var B = {};

  B.goldBar = function () {
    return '<tr data-block="Gold bar"><td contenteditable="false" style="height:9px;background:' + GOLD +
      ';font-size:0;line-height:0;">&nbsp;</td></tr>';
  };

  B.hero = function (title) {
    return '<tr data-block="Header"><td style="background:' + NAVY + ';padding:34px 42px 40px;">' +
      '<table ' + T + '><tr>' +
      '<td valign="middle" width="152">' + logo(128) + '</td>' +
      '<td valign="middle" style="padding-left:24px;">' +
      '<div style="font-size:11px;letter-spacing:3.5px;font-weight:800;color:' + GOLD +
      ';text-transform:uppercase;margin-bottom:10px;">GCS KEY CLUB</div>' +
      '<div style="font-size:38px;line-height:1.02;font-weight:900;color:#ffffff;letter-spacing:-1px;">' + title + '</div>' +
      '<div style="font-size:14px;line-height:1.5;color:#d8e5ef;margin-top:14px;">Caring — Our Way of Life</div>' +
      '</td></tr></table></td></tr>';
  };

  B.strip = function () {
    return '<tr data-block="Gold strip"><td style="background:' + GOLD + ';padding:12px 42px;">' +
      '<table ' + T + '><tr>' +
      '<td style="font-size:12px;font-weight:900;letter-spacing:2.5px;color:' + NAVY + ';text-transform:uppercase;">KEY CLUB</td>' +
      '<td align="right" style="font-size:12px;font-weight:900;color:' + NAVY + ';">GAONNURI CHRISTIAN SCHOOL</td>' +
      '</tr></table></td></tr>';
  };

  B.para = function (html) {
    return '<p style="font-size:16px;line-height:1.75;color:' + BODY + ';margin:20px 0 0;">' + html + '</p>';
  };

  B.intro = function (greeting, headline, paras) {
    return '<tr data-block="Intro"><td style="padding:42px 46px 8px;">' +
      '<div style="font-size:14px;letter-spacing:2px;font-weight:800;color:' + MUTED + ';text-transform:uppercase;">' + greeting + '</div>' +
      '<div style="font-size:34px;line-height:1.12;font-weight:900;color:' + NAVY + ';margin-top:8px;">' + headline + '</div>' +
      '<div contenteditable="false" style="height:4px;width:58px;background:' + GOLD + ';margin-top:18px;"></div>' +
      paras.map(B.para).join('') +
      '</td></tr>';
  };

  B.text = function (html) {
    return '<tr data-block="Paragraph"><td style="padding:0 46px 8px;">' +
      B.para(html || 'Write something here.') + '</td></tr>';
  };

  B.heading = function (text) {
    return '<tr data-block="Heading"><td style="padding:30px 46px 4px;">' +
      '<div style="font-size:26px;line-height:1.15;font-weight:900;color:' + NAVY + ';">' + (text || 'A new heading') + '</div>' +
      '</td></tr>';
  };

  B.tile = function (label, value) {
    return '<td data-block="Tile" width="33.33%" valign="top" style="background:' + NAVY + ';padding:24px 20px;">' +
      '<div style="font-size:10px;letter-spacing:2px;font-weight:900;color:' + GOLD + ';">' + label + '</div>' +
      '<div style="font-size:22px;font-weight:900;color:#ffffff;margin-top:9px;">' + value + '</div></td>';
  };

  B.tiles = function (items) {
    items = items || [['DATE', 'September 28th'], ['TIME', '4:20 - 5:00 PM'], ['LOCATION', 'Room 305']];
    return '<tr data-block="Info tiles"><td style="padding:28px 46px 14px;">' +
      '<table ' + T + ' data-tiles><tr>' +
      items.map(function (t) { return B.tile(t[0], t[1]); }).join('') +
      '</tr></table></td></tr>';
  };

  B.label = function (text) {
    return '<tr data-block="Section label"><td style="padding:28px 46px 12px;">' +
      '<div style="font-size:14px;letter-spacing:2px;font-weight:800;color:' + MUTED + ';text-transform:uppercase;">' +
      (text || 'SECTION TITLE') + '</div></td></tr>';
  };

  function badge() {
    return '<td width="58" valign="top" style="padding:15px 0;" contenteditable="false">' +
      '<div data-badge style="width:38px;height:38px;background:' + GOLD + ';text-align:center;line-height:38px;' +
      'font-size:17px;font-weight:900;color:' + NAVY + ';">01</div></td>';
  }

  // Numbered item: title + description (agenda style)
  B.item = function (title, desc) {
    return '<tr data-block="List item">' + badge() +
      '<td valign="top" style="padding:14px 0;border-bottom:1px solid ' + LINE + ';">' +
      '<div style="font-size:17px;font-weight:900;color:' + NAVY + ';">' + title + '</div>' +
      '<div style="font-size:14px;line-height:1.55;color:#627689;margin-top:4px;">' + desc + '</div>' +
      '</td></tr>';
  };

  // Numbered item: small label + big value (payment details style)
  B.detail = function (label, value) {
    return '<tr data-block="List item">' + badge() +
      '<td valign="top" style="padding:14px 0;border-bottom:1px solid ' + LINE + ';">' +
      '<div style="font-size:12px;letter-spacing:2px;font-weight:900;color:' + MUTED + ';">' + label + '</div>' +
      '<div style="font-size:17px;font-weight:900;color:' + NAVY + ';margin-top:4px;">' + value + '</div>' +
      '</td></tr>';
  };

  B.list = function (rows) {
    rows = rows || [B.item('First thing', 'A short line about it.'), B.item('Second thing', 'A short line about it.'),
      B.item('Third thing', 'A short line about it.')];
    return '<tr data-block="Numbered list"><td style="padding:0 46px 14px;">' +
      '<table ' + T + ' data-list>' + rows.join('') + '</table></td></tr>';
  };

  B.callout = function (kicker, title, lines) {
    kicker = kicker || 'IMPORTANT';
    title = title || 'A BIG CALLOUT';
    lines = lines || ['Add the details people really need to see.'];
    return '<tr data-block="Callout box"><td style="padding:30px 46px 14px;">' +
      '<table ' + T + ' style="background:#f4f7fa;border-left:7px solid ' + GOLD + ';"><tr>' +
      '<td style="padding:22px 24px;">' +
      '<div style="font-size:12px;letter-spacing:2px;font-weight:900;color:' + NAVY + ';text-transform:uppercase;">' + kicker + '</div>' +
      '<div style="font-size:23px;line-height:1.25;font-weight:900;color:' + INK + ';margin-top:7px;">' + title + '</div>' +
      lines.map(function (l) {
        return '<div style="font-size:15px;line-height:1.65;color:#52697c;margin-top:7px;">' + l + '</div>';
      }).join('') +
      '</td></tr></table></td></tr>';
  };

  B.button = function (label, href) {
    return '<tr data-block="Button"><td style="padding:24px 46px 8px;">' +
      '<a href="' + (href || 'https://') + '" style="display:inline-block;background:' + NAVY + ';color:#ffffff;' +
      'text-decoration:none;padding:13px 22px;font-size:13px;letter-spacing:2px;font-weight:900;">' +
      (label || 'SIGN UP') + '</a></td></tr>';
  };

  B.image = function (src, width) {
    return '<tr data-block="Image"><td style="padding:24px 46px 8px;" align="left">' +
      '<img src="' + src + '" width="' + width + '" alt="" style="display:block;width:' + width +
      'px;max-width:100%;height:auto;border:0;"></td></tr>';
  };

  B.divider = function () {
    return '<tr data-block="Divider"><td style="padding:24px 46px 8px;" contenteditable="false">' +
      '<div style="height:1px;background:' + LINE + ';font-size:0;line-height:0;">&nbsp;</div></td></tr>';
  };

  B.spacer = function () {
    return '<tr data-block="Spacer"><td contenteditable="false" style="height:30px;font-size:0;line-height:0;">&nbsp;</td></tr>';
  };

  B.footer = function () {
    return '<tr data-block="Footer"><td style="background:' + NAVY + ';padding:28px 46px;">' +
      '<table ' + T + '><tr><td>' +
      '<div style="font-size:13px;letter-spacing:2.5px;font-weight:900;color:' + GOLD + ';">' +
      'LEADERSHIP • CHARACTER BUILDING • CARING • INCLUSIVENESS</div>' +
      '<div style="font-size:12px;line-height:1.5;color:#c6d7e4;margin-top:8px;">' +
      'GAONNURI CHRISTIAN SCHOOL • KEY CLUB INTERNATIONAL</div>' +
      '</td><td align="right" valign="middle">' +
      '<div style="font-size:28px;font-weight:900;color:#ffffff;">K</div>' +
      '</td></tr></table></td></tr>';
  };

  function card(rows) {
    return '<table ' + T + ' style="max-width:760px;background:#ffffff;border-collapse:collapse;" data-card>' +
      '<tbody>' + rows.join('') + '</tbody></table>';
  }

  var TEMPLATES = {
    announcement: {
      name: 'Announcement',
      subject: 'Key Club: 2026 Fall New Members — first All-Member Meeting',
      build: function () {
        return card([
          B.goldBar(),
          B.hero('2026 FALL <br>NEW MEMBERS'),
          B.strip(),
          B.intro('Dear members,', 'Welcome to Key Club.', [
            'A brand new chapter of the GCS Key Club starts here. Help us open and establish our community through Key Club.',
            'Please make sure to remember the following details for our first All-Member Meeting.',
          ]),
          B.tiles([['DATE', 'September 28th'], ['TIME', '4:20 - 5:00 PM'], ['LOCATION', 'Room 305']]),
          B.label('ON THE AGENDA'),
          B.list([
            B.item('Onboarding', 'What Key Club is, how our chapter works, and where new members fit in.'),
            B.item('Expectations', 'Membership requirements and rules.'),
            B.item('New Events', 'Small steps that make a big difference.'),
          ]),
          B.callout('IMPORTANT REMINDERS', 'KEEP IN TOUCH', [
            'This All-Member Meeting is <b>mandatory</b> for all Key Club members. Applications of the warning and probation rules for unexcused absences will not be tolerated, even for new members.',
            'Please make sure to inform an executive member <b>at least 12 hours</b> in advance if you cannot make it to the meeting.',
          ]),
          B.spacer(),
          B.footer(),
        ]);
      },
    },
    fee: {
      name: 'Fee reminder',
      subject: 'Key Club: your membership fee is overdue',
      build: function () {
        return card([
          B.goldBar(),
          B.hero('MEMBERSHIP <br>FEE REMINDER'),
          B.strip(),
          B.intro('Dear members,', 'Your membership fee is overdue.', [
            'The annual membership fee for this year\'s Key Club activities was due on <b>Tuesday, October 13</b>. Our records show that your payment has not yet been received.',
            'Please complete your payment as soon as possible using the account information below.',
          ]),
          B.tiles([['AMOUNT', '25,000 KRW'], ['WAS DUE', 'October 13'], ['STATUS', 'Unpaid']]),
          B.label('PAYMENT DETAILS'),
          B.list([
            B.detail('BANK', 'Shinhan Bank'),
            B.detail('ACCOUNT NUMBER', '110-475-480017'),
            B.detail('ACCOUNT HOLDER', '허성윤'),
          ]),
          B.callout('ACTION REQUIRED', 'PLEASE PAY AS SOON AS POSSIBLE', [
            'When transferring, please use your <b>full name</b> as the sender name so your payment can be matched to your membership.',
            'If you have already paid, thank you, and please disregard this notice. If you have any questions or concerns regarding the fee, please contact a Key Club executive member.',
          ]),
          B.spacer(),
          B.footer(),
        ]);
      },
    },
    blank: {
      name: 'Blank',
      subject: 'Key Club: ',
      build: function () {
        return card([
          B.goldBar(),
          B.hero('YOUR <br>TITLE HERE'),
          B.strip(),
          B.intro('Dear members,', 'Big headline goes here.', ['Start typing your message.']),
          B.spacer(),
          B.footer(),
        ]);
      },
    },
  };

  window.KC = { blocks: B, templates: TEMPLATES, colors: { NAVY: NAVY, NAVY2: NAVY2, GOLD: GOLD } };
})();
