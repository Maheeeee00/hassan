var SHEET_NAME = "CurriculumData";
var REQUIRED_COLUMNS = ["calander", "sallybus", "password"];

function doGet() {
  return HtmlService.createHtmlOutputFromFile("curriculum")
    .setTitle("Curriculum Manager")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getCurriculumData() {
  var sheet = getOrCreateSheet_();
  var columns = ensureColumns_(sheet);
  var rowValues = getDataRowValues_(sheet);

  return {
    calander: rowValues[columns.calander - 1] || "",
    sallybus: rowValues[columns.sallybus - 1] || ""
  };
}

function updateCalander(payload) {
  if (!payload || !payload.calander) {
    throw new Error("Calander value is required.");
  }

  return withScriptLock_(function () {
    var sheet = getOrCreateSheet_();
    var columns = ensureColumns_(sheet);
    var rowIndex = ensureDataRow_(sheet);

    sheet.getRange(rowIndex, columns.calander).setValue(String(payload.calander).trim());

    return { message: "Calander updated successfully." };
  });
}

function saveOrUpdateSallybus(payload) {
  if (!payload || !payload.sallybus) {
    throw new Error("Sallybus value is required.");
  }

  if (!payload.password) {
    throw new Error("Password is required to save sallybus.");
  }

  return withScriptLock_(function () {
    var sheet = getOrCreateSheet_();
    var columns = ensureColumns_(sheet);
    var rowIndex = ensureDataRow_(sheet);

    var enteredPassword = String(payload.password).trim();
    var existingPassword = String(sheet.getRange(rowIndex, columns.password).getValue() || "").trim();

    if (existingPassword && existingPassword !== enteredPassword) {
      throw new Error("Access denied. Password does not match.");
    }

    if (!existingPassword) {
      sheet.getRange(rowIndex, columns.password).setValue(enteredPassword);
    }

    sheet.getRange(rowIndex, columns.sallybus).setValue(String(payload.sallybus).trim());

    return {
      message: existingPassword
        ? "Sallybus updated successfully."
        : "Sallybus and password saved successfully."
    };
  });
}

function withScriptLock_(callback) {
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateSheet_() {
  var spreadsheet = getSpreadsheet_();
  var sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }
  return sheet;
}

function getSpreadsheet_() {
  var spreadsheetId = PropertiesService.getScriptProperties().getProperty("CURRICULUM_SHEET_ID");
  if (spreadsheetId) {
    return SpreadsheetApp.openById(spreadsheetId);
  }

  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    return active;
  }

  throw new Error(
    "Spreadsheet not found. Bind this script to a sheet, or set script property CURRICULUM_SHEET_ID."
  );
}

function ensureColumns_(sheet) {
  var lastColumn = sheet.getLastColumn();
  var headers = lastColumn > 0 ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0] : [];

  var normalizedHeaders = headers.map(function (header) {
    return normalizeHeader_(header);
  });

  var updated = false;
  REQUIRED_COLUMNS.forEach(function (required) {
    if (normalizedHeaders.indexOf(required) === -1) {
      headers.push(required);
      normalizedHeaders.push(required);
      updated = true;
    }
  });

  if (updated || headers.length === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  var map = {};
  headers.forEach(function (header, index) {
    var key = normalizeHeader_(header);
    if (key) {
      map[key] = index + 1;
    }
  });

  return map;
}

function normalizeHeader_(value) {
  return String(value || "").trim().toLowerCase();
}

function ensureDataRow_(sheet) {
  var rowIndex = 2;
  if (sheet.getLastRow() < rowIndex) {
    sheet.getRange(rowIndex, 1).setValue("");
  }
  return rowIndex;
}

function getDataRowValues_(sheet) {
  var rowIndex = ensureDataRow_(sheet);
  var width = Math.max(sheet.getLastColumn(), REQUIRED_COLUMNS.length);
  return sheet.getRange(rowIndex, 1, 1, width).getValues()[0];
}
