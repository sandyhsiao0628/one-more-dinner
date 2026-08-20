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

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
    sheet.appendRow([name, attending]);

    return jsonResponse_({ ok: true });
  } catch (error) {
    return jsonResponse_({ ok: false, error: String(error) });
  }
}

function doGet() {
  return jsonResponse_({ ok: true, message: 'RSVP endpoint is ready.' });
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
