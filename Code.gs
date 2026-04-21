/**
 * Startwell Education - Google Apps Script backend
 *
 * Supported actions (POST):
 *  - verifyPassword
 *  - addSyllabus
 *  - addCalendar
 *  - addTimetable
 *
 * This script auto-creates:
 *  - Syllabus
 *  - Calendar
 *  - Timetable
 *  - Passwords
 */

const SHEETS = {
  SYLLABUS: 'Syllabus',
  CALENDAR: 'Calendar',
  TIMETABLE: 'Timetable',
  PASSWORDS: 'Passwords',
};

const HEADERS = {
  [SHEETS.SYLLABUS]: [
    'ID',
    'Created At',
    'Class',
    'Subject/Book',
    'Term',
    'Chapter Title',
    'Description',
    'Status',
  ],
  [SHEETS.CALENDAR]: [
    'ID',
    'Created At',
    'Date',
    'Title',
    'Type',
    'Academic Year',
  ],
  [SHEETS.TIMETABLE]: [
    'ID',
    'Created At',
    'Class',
    'Day',
    'Time Slot',
    'Subject',
    'Teacher',
  ],
  [SHEETS.PASSWORDS]: ['Password', 'IsActive', 'Note', 'Created At'],
};

/**
 * Optional script property:
 *  SPREADSHEET_ID = existing spreadsheet ID
 *
 * If not set, script creates a new spreadsheet automatically.
 */
const SPREADSHEET_ID_KEY = 'SPREADSHEET_ID';

function doGet() {
  try {
    ensureSetup_();
    const ss = getSpreadsheet_();
    return jsonResponse_({
      success: true,
      message: 'Startwell backend is running.',
      spreadsheetId: ss.getId(),
      spreadsheetUrl: ss.getUrl(),
      sheets: Object.values(SHEETS),
    });
  } catch (error) {
    return jsonResponse_({
      success: false,
      message: error && error.message ? error.message : 'Unexpected error',
    });
  }
}

function doPost(e) {
  try {
    ensureSetup_();

    const payload = parseRequest_(e);
    const action = toText_(payload.action);

    if (!action) {
      return jsonResponse_({
        success: false,
        message: 'Missing action in request payload.',
      });
    }

    if (action === 'verifyPassword') {
      const password = toText_(payload.password);
      if (!password) {
        return jsonResponse_({
          success: false,
          message: 'Password is required.',
        });
      }

      const ok = isValidPassword_(password);
      return jsonResponse_({
        success: ok,
        message: ok ? 'Password verified.' : 'Invalid password.',
      });
    }

    const password = toText_(payload.password);
    if (!password || !isValidPassword_(password)) {
      return jsonResponse_({
        success: false,
        message: 'Unauthorized: invalid admin password.',
      });
    }

    let result;
    switch (action) {
      case 'addSyllabus':
        result = addSyllabus_(payload);
        break;
      case 'addCalendar':
        result = addCalendar_(payload);
        break;
      case 'addTimetable':
        result = addTimetable_(payload);
        break;
      default:
        return jsonResponse_({
          success: false,
          message: `Unknown action: ${action}`,
        });
    }

    return jsonResponse_({
      success: true,
      message: 'Saved successfully.',
      data: result,
    });
  } catch (error) {
    return jsonResponse_({
      success: false,
      message: error && error.message ? error.message : 'Unexpected error',
    });
  }
}

function addSyllabus_(payload) {
  const className = required_(payload.className, 'className');
  const subject = required_(payload.subject, 'subject');
  const term = required_(payload.term, 'term');
  const chapterTitle = required_(payload.chapterTitle, 'chapterTitle');
  const description = required_(payload.description, 'description');
  const statusRaw = toText_(payload.status) || 'Upcoming';
  const status = statusRaw.toLowerCase() === 'completed' ? 'Completed' : 'Upcoming';

  const sheet = getSheet_(SHEETS.SYLLABUS);
  const id = nextNumericId_(sheet);

  sheet.appendRow([
    id,
    new Date(),
    className,
    subject,
    term,
    chapterTitle,
    description,
    status,
  ]);

  return {
    id: id,
    className: className,
    subject: subject,
    term: term,
    chapterTitle: chapterTitle,
    status: status,
  };
}

function addCalendar_(payload) {
  const title = required_(payload.title, 'title');
  const dateText = required_(payload.date, 'date');
  const typeRaw = toText_(payload.type) || 'Event';
  const type = normalizeCalendarType_(typeRaw);
  const academicYear = toText_(payload.academicYear) || '2025-26';

  const date = new Date(dateText);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format. Use yyyy-mm-dd.');
  }

  const sheet = getSheet_(SHEETS.CALENDAR);
  const id = nextNumericId_(sheet);

  sheet.appendRow([
    id,
    new Date(),
    Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    title,
    type,
    academicYear,
  ]);

  return {
    id: id,
    title: title,
    date: Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    type: type,
  };
}

function addTimetable_(payload) {
  const className = required_(payload.className, 'className');
  const day = required_(payload.day, 'day');
  const slot = required_(payload.slot, 'slot');
  const subject = required_(payload.subject, 'subject');
  const teacher = required_(payload.teacher, 'teacher');

  const sheet = getSheet_(SHEETS.TIMETABLE);
  const id = nextNumericId_(sheet);

  sheet.appendRow([id, new Date(), className, day, slot, subject, teacher]);

  return {
    id: id,
    className: className,
    day: day,
    slot: slot,
    subject: subject,
    teacher: teacher,
  };
}

function ensureSetup_() {
  const ss = getSpreadsheet_();
  Object.keys(HEADERS).forEach(function (sheetName) {
    ensureSheet_(ss, sheetName, HEADERS[sheetName]);
  });
  ensureDefaultPassword_();
}

function getSpreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  const existingId = props.getProperty(SPREADSHEET_ID_KEY);

  if (existingId) {
    return SpreadsheetApp.openById(existingId);
  }

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    props.setProperty(SPREADSHEET_ID_KEY, active.getId());
    return active;
  }

  const created = SpreadsheetApp.create('Startwell Education Portal Data');
  props.setProperty(SPREADSHEET_ID_KEY, created.getId());
  return created;
}

function getSheet_(sheetName) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    return ensureSheet_(ss, sheetName, HEADERS[sheetName]);
  }
  return sheet;
}

function ensureSheet_(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  const hasHeader = sheet.getLastRow() > 0;
  if (!hasHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }

  return sheet;
}

function ensureDefaultPassword_() {
  const sheet = getSheet_(SHEETS.PASSWORDS);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    sheet.appendRow([
      'admin123',
      true,
      'Default password. Change/remove this row after setup.',
      new Date(),
    ]);
  }
}

function isValidPassword_(passwordInput) {
  const input = toText_(passwordInput);
  if (!input) return false;

  const sheet = getSheet_(SHEETS.PASSWORDS);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;

  const values = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  for (let i = 0; i < values.length; i++) {
    const rowPassword = toText_(values[i][0]);
    const rowActive = values[i][1];
    const isActive = rowActive === '' ? true : toBoolean_(rowActive);

    if (rowPassword && isActive && rowPassword === input) {
      return true;
    }
  }
  return false;
}

function nextNumericId_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1;

  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let max = 0;
  for (let i = 0; i < values.length; i++) {
    const num = Number(values[i][0]);
    if (!isNaN(num) && num > max) {
      max = num;
    }
  }
  return max + 1;
}

function normalizeCalendarType_(typeValue) {
  const t = toText_(typeValue).toLowerCase();
  if (t === 'holiday') return 'Holiday';
  if (t === 'exam') return 'Exam';
  return 'Event';
}

function parseRequest_(e) {
  if (!e) return {};

  const content = e.postData && e.postData.contents ? e.postData.contents : '';
  if (content) {
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error('Request body must be valid JSON.');
    }
  }

  return e.parameter || {};
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function required_(value, fieldName) {
  const v = toText_(value);
  if (!v) {
    throw new Error(`Missing required field: ${fieldName}`);
  }
  return v;
}

function toText_(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function toBoolean_(value) {
  if (typeof value === 'boolean') return value;
  const text = toText_(value).toLowerCase();
  return text === 'true' || text === '1' || text === 'yes' || text === 'y';
}
