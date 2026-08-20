const SPREADSHEET_ID = '1bEqzEbYXbmnL_75S8xntKTPZisExDPxP9gYRti272TE';

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
    sheet.appendRow([new Date(), name, attending]);

    return jsonResponse_({ ok: true, saved: true });
  } catch (error) {
    return jsonResponse_({ ok: false, error: String(error) });
  }
}

function doGet() {
  return jsonResponse_({ ok: true, message: 'RSVP endpoint is ready.' });
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheets()[0];
  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Name', 'Attending']);
    return;
  }

  const headers = sheet.getRange(1, 1, 1, 3).getValues()[0];
  const hasHeaders = headers.some((value) => String(value).trim() !== '');

  if (!hasHeaders) {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, 3).setValues([['Timestamp', 'Name', 'Attending']]);
  }
}

function formatAttending_(value) {
  if (value === 'yes') return 'Yes';
  if (value === 'no') return "Can't make it";
  return '';
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
