/**
 * Google Apps Script (Web App) to collect RSVP submissions into your Google Sheet.
 *
 * Spreadsheet target:
 * https://docs.google.com/spreadsheets/d/1VuK45MnODWI8fyJRLgDMzsB7d53-mZIt1Ry0dLC0fJU/edit
 *
 * Setup:
 * 1) Open the spreadsheet
 * 2) Extensions -> Apps Script
 * 3) Paste this file as Code.gs
 * 4) Deploy -> New deployment -> Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5) Copy the Web App URL and paste it into rsvp.html form action
 */

const SPREADSHEET_ID = '1VuK45MnODWI8fyJRLgDMzsB7d53-mZIt1Ry0dLC0fJU';
const SHEET_NAME = 'Responses'; // you can change; script will create if missing

function doPost(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = getOrCreateSheet_(ss, SHEET_NAME);

    // ensure headers
    ensureHeaders_(sheet, [
      'timestamp',
      'language',
      'email',
      'fullName',
      'attend',
      'plusOne',
      'children',
      'childrenCount',
      'dietary',
      'dietOther',
      'danceSong',
      'source'
    ]);

    const p = (e && e.parameter) ? e.parameter : {};

    // dietary[] can arrive as dietary or dietary[] depending on how browser encodes it.
    // Apps Script merges repeated params into comma-separated string when using e.parameter,
    // but e.parameters keeps arrays. We'll use e.parameters if present.
    const dietaryArr = (e && e.parameters && (e.parameters['dietary[]'] || e.parameters['dietary'])) || [];
    const dietary = Array.isArray(dietaryArr) ? dietaryArr.join(', ') : String(dietaryArr || '');

    sheet.appendRow([
      new Date(),
      p.language || '',
      p.email || '',
      p.fullName || '',
      p.attend || '',
      p.plusOne || '',
      p.children || '',
      p.childrenCount || '',
      dietary,
      p.dietOther || '',
      p.danceSong || '',
      p.source || ''
    ]);

    return json_(true, 'ok');
  } catch (err) {
    return json_(false, String(err && err.message ? err.message : err));
  }
}

function doGet() {
  return json_(true, 'alive');
}

function json_(ok, message) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok, message }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet_(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function ensureHeaders_(sheet, headers) {
  const range = sheet.getRange(1, 1, 1, headers.length);
  const values = range.getValues();
  const existing = values[0];

  const isEmpty = existing.every(v => v === '' || v === null);
  if (isEmpty) {
    range.setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
}