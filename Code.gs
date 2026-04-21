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
 * Spreadsheet lookup order:
 * 1) Script Property key: SPREADSHEET_ID
 * 2) DEFAULT_SPREADSHEET_ID below (optional hardcoded ID)
 * 3) Active spreadsheet
 * 4) Auto-created spreadsheet
 */
const SPREADSHEET_ID_PROPERTY_KEY = 'SPREADSHEET_ID';
const DEFAULT_SPREADSHEET_ID = '1vIMEJuLzzuuknBoMktwnIbEF2jRLPsDrFKb0w-D7IuI';

function doGet(e) {
  try {
    ensureSetup_();
    const params = parseRequest_(e);
    const action = toText_(params.action);
    const ss = getSpreadsheet_();

    if (action === 'getPortalData') {
      const syllabusRows = getSyllabusData_(params.className);
      const calendarRows = getCalendarData_();
      const timetableRows = getTimetableData_(params.className);
      return jsonResponse_({
        success: true,
        syllabus: toSyllabusMap_(syllabusRows),
        calendar: toCalendarMap_(calendarRows),
        timetable: toTimetableMap_(timetableRows),
      });
    }

    if (action === 'getSyllabus') {
      return jsonResponse_({
        success: true,
        data: getSyllabusData_(params.className),
      });
    }

    if (action === 'getCalendar') {
      return jsonResponse_({
        success: true,
        data: getCalendarData_(),
      });
    }

    if (action === 'getTimetable') {
      return jsonResponse_({
        success: true,
        data: getTimetableData_(params.className),
      });
    }

    return jsonResponse_({
      success: true,
      message: 'Startwell backend is running.',
      spreadsheetId: ss.getId(),
      spreadsheetUrl: ss.getUrl(),
      sheets: Object.values(SHEETS),
      hint: 'Use ?action=getPortalData to load section data.',
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

function getSyllabusData_(classNameFilter) {
  const classFilter = toText_(classNameFilter);
  const sheet = getSheet_(SHEETS.SYLLABUS);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
  const items = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const className = toText_(row[2]);
    if (classFilter && className !== classFilter) continue;

    const termLabel = toText_(row[4]);
    items.push({
      id: Number(row[0]) || i + 1,
      className: className,
      subject: toText_(row[3]),
      term: termLabel,
      termNumber: termToNumber_(termLabel),
      chapterTitle: toText_(row[5]),
      description: toText_(row[6]),
      status: toText_(row[7]) || 'Upcoming',
    });
  }

  items.sort(function (a, b) {
    return a.id - b.id;
  });
  return items;
}

function getCalendarData_() {
  const sheet = getSheet_(SHEETS.CALENDAR);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  const items = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const dateIso = toISODate_(row[2]);
    if (!dateIso) continue;

    items.push({
      id: Number(row[0]) || i + 1,
      date: dateIso,
      dateKey: isoToDateKey_(dateIso),
      title: toText_(row[3]),
      type: toText_(row[4]).toLowerCase() || 'event',
      academicYear: toText_(row[5]),
    });
  }

  items.sort(function (a, b) {
    return a.date.localeCompare(b.date);
  });
  return items;
}

function getTimetableData_(classNameFilter) {
  const classFilter = toText_(classNameFilter);
  const sheet = getSheet_(SHEETS.TIMETABLE);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  const items = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const className = toText_(row[2]);
    if (classFilter && className !== classFilter) continue;

    items.push({
      id: Number(row[0]) || i + 1,
      className: className,
      day: toText_(row[3]),
      slot: normalizeSlot_(toText_(row[4])),
      subject: toText_(row[5]),
      teacher: toText_(row[6]),
    });
  }

  items.sort(function (a, b) {
    return a.id - b.id;
  });
  return items;
}

function toSyllabusMap_(rows) {
  const map = {};
  rows.forEach(function (row) {
    const className = toText_(row.className);
    const termNumber = Number(row.termNumber) || termToNumber_(row.term);
    if (!className || !termNumber) return;

    if (!map[className]) map[className] = {};
    if (!map[className][termNumber]) map[className][termNumber] = [];

    map[className][termNumber].push({
      title: toText_(row.chapterTitle),
      description: toText_(row.description),
      status: toText_(row.status) || 'Upcoming',
      subject: toText_(row.subject),
    });
  });

  return map;
}

function toCalendarMap_(rows) {
  const map = {};
  rows.forEach(function (row) {
    const key = toText_(row.dateKey);
    if (!key) return;

    const type = toText_(row.type).toLowerCase() || 'event';
    const label = toText_(row.title);

    if (!map[key]) {
      map[key] = { type: type, label: label };
      return;
    }

    // If multiple events share a date, keep one dot type and concatenate labels.
    map[key].label = [map[key].label, label].filter(Boolean).join(' | ');
  });

  return map;
}

function toTimetableMap_(rows) {
  const map = {};
  rows.forEach(function (row) {
    const className = toText_(row.className);
    if (!className) return;

    if (!map[className]) {
      map[className] = [[], [], [], [], []];
    }

    const dayIndex = dayToIndex_(row.day);
    const slotIndex = slotToIndex_(row.slot);
    if (dayIndex < 0 || slotIndex < 0) return;

    map[className][dayIndex][slotIndex] = {
      s: toText_(row.subject) || 'Free',
      t: toText_(row.teacher),
      c: subjectToCellClass_(row.subject),
    };
  });

  return map;
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
  const configuredId =
    toText_(props.getProperty(SPREADSHEET_ID_PROPERTY_KEY)) ||
    toText_(DEFAULT_SPREADSHEET_ID);

  if (configuredId) {
    return SpreadsheetApp.openById(configuredId);
  }

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    props.setProperty(SPREADSHEET_ID_PROPERTY_KEY, active.getId());
    return active;
  }

  const created = SpreadsheetApp.create('Startwell Education Portal Data');
  props.setProperty(SPREADSHEET_ID_PROPERTY_KEY, created.getId());
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

function termToNumber_(termValue) {
  const text = toText_(termValue).toLowerCase();
  if (!text) return 0;
  if (text.indexOf('1') >= 0 || text.indexOf('first') >= 0) return 1;
  if (text.indexOf('2') >= 0 || text.indexOf('second') >= 0) return 2;
  if (text.indexOf('3') >= 0 || text.indexOf('third') >= 0) return 3;
  return 0;
}

function toISODate_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  const text = toText_(value);
  if (!text) return '';

  const parts = text.split('-');
  if (parts.length === 3) {
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return (
        String(y).padStart(4, '0') +
        '-' +
        String(m).padStart(2, '0') +
        '-' +
        String(d).padStart(2, '0')
      );
    }
  }

  const dt = new Date(text);
  if (isNaN(dt.getTime())) return '';
  return Utilities.formatDate(dt, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function isoToDateKey_(isoDate) {
  const text = toText_(isoDate);
  if (!text) return '';
  const parts = text.split('-').map(function (x) {
    return Number(x);
  });
  if (parts.length !== 3 || parts.some(isNaN)) return '';
  return parts[0] + '-' + parts[1] + '-' + parts[2];
}

function normalizeSlot_(slotText) {
  return toText_(slotText).replace(/\s+/g, '').replace(/-/g, '–');
}

function dayToIndex_(dayValue) {
  const d = toText_(dayValue).toLowerCase();
  if (d === 'monday' || d === 'mon') return 0;
  if (d === 'tuesday' || d === 'tue') return 1;
  if (d === 'wednesday' || d === 'wed') return 2;
  if (d === 'thursday' || d === 'thu') return 3;
  if (d === 'friday' || d === 'fri') return 4;
  return -1;
}

function slotToIndex_(slotValue) {
  const slot = normalizeSlot_(slotValue);
  const slots = [
    normalizeSlot_('8:00–8:45'),
    normalizeSlot_('8:45–9:30'),
    normalizeSlot_('9:30–10:15'),
    normalizeSlot_('10:15–11:00'),
    normalizeSlot_('11:00–11:45'),
  ];
  for (let i = 0; i < slots.length; i++) {
    if (slots[i] === slot) return i;
  }
  return -1;
}

function subjectToCellClass_(subjectValue) {
  const s = toText_(subjectValue).toLowerCase();
  if (!s) return 'pe';
  if (s.indexOf('math') >= 0) return 'math';
  if (s.indexOf('science') >= 0) return 'sci';
  if (s.indexOf('english') >= 0) return 'eng';
  if (s.indexOf('urdu') >= 0) return 'urdu';
  if (s.indexOf('islamiat') >= 0 || s.indexOf('islamiyat') >= 0) return 'isl';
  return 'pe';
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
