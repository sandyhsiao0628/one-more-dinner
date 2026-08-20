/**
 * Bind this script to your sheet: Extensions → Apps Script
 * Row 1 headers: Name | Coming?
 *
 * Deploy → New deployment → Web app
 *   Execute as: Me
 *   Who has access: Anyone
 * Copy the /exec URL into js/config.js
 */

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const name = String(payload.name || '').trim();
    const attending = formatAttending_(payload.attending);

    if (!name) {
      return jsonResponse_({ ok: false, error: 'Name is required.' });
    }

    if (!attending) {
      return jsonResponse_({ ok: false, error: 'Attending response is required.' });
    }

    const sheet = getSheet_();
    sheet.appendRow([name, attending]);

    return jsonResponse_({ ok: true });
  } catch (error) {
    return jsonResponse_({ ok: false, error: String(error) });
  }
}

function doGet() {
  return jsonResponse_({ ok: true, message: 'RSVP endpoint is ready.' });
}

function setupSheet() {
  const sheet = getSheet_();
  sheet.setFrozenRows(1);
  sheet.getRange('A1:B1').setFontWeight('bold');
}

function getSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() > 0) {
    return;
  }

  sheet.appendRow(['Name', 'Coming?']);
}

function formatAttending_(value) {
  if (value === 'yes') {
    return 'Yes';
  }

  if (value === 'no') {
    return "Can't make it";
  }

  return '';
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
