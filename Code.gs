const SHEET_ID = "14UKMRb732DCPK0749NSLKZmGqvalS2a_Xo8IDlnJhAM";
const CURRICULUM_SHEET_LINK = "";
const MAIN_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz5I5ngVb1wqEn3CcOQU1M0ABrTAHoP9GVk4WSGmrt-9XPbXaWIUtXLPtxkqZNWNX7eMw/exec";
// Example:
// const CURRICULUM_SHEET_LINK = "https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0";

const CURRICULUM_SHEET_NAME = "CurriculumData";
const CURRICULUM_HEADERS = ["calander", "sallybus", "password"];

// ============================================================
// POST — handles write operations
// ============================================================
function doPost(e) {
  try {
    var action = (e && e.parameter && e.parameter.sheet) ? String(e.parameter.sheet) : "";
    var data = parsePostBody_(e);
    var result = "";

    if (action === "Curriculum" || action === "Curriculum_Save") {
      result = saveCurriculum(data);
    } else if (action === "Curriculum_Update_Calander") {
      result = updateCalander(data).message;
    } else if (action === "Curriculum_Update_Sallybus") {
      result = saveOrUpdateSallybus(data).message;
    } else if (action === "Curriculum_Set_Sheet_Link") {
      result = setCurriculumSheetLink(data.sheetLink || data.sheetId).message;
    } else if (action === "Curriculum_Clear_Sheet_Link") {
      result = clearCurriculumSheetLink().message;
    } else {
      result = "Unknown sheet action: " + action;
    }

    return buildResponse({ success: true, result: result });
  } catch (err) {
    return buildResponse({ success: false, error: err.message });
  }
}

// ============================================================
// GET — serves HTML or returns curriculum data
// ============================================================
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? String(e.parameter.action) : "";

    // Keep web UI working: no action => serve curriculum.html
    if (!action) {
      return HtmlService.createHtmlOutputFromFile("curriculum")
        .setTitle("Curriculum Manager")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    var data = {};
    if (action === "all" || action === "curriculum") {
      data = getCurriculumData();
    } else if (action === "rows") {
      data = getRows(CURRICULUM_SHEET_NAME);
    } else if (action === "health") {
      data = { status: "Curriculum API is running", time: new Date().toISOString() };
    } else {
      data = { status: "Unknown action", action: action };
    }

    return buildResponse({ success: true, data: data });
  } catch (err) {
    return buildResponse({ success: false, error: err.message });
  }
}

// ============================================================
// CORS helpers
// ============================================================
function buildResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doOptions() {
  return ContentService
    .createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

// ============================================================
// Frontend-callable helpers (google.script.run)
// ============================================================
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

function saveCurriculum(payload) {
  var hasCalander = payload && payload.calander;
  var hasSallybus = payload && payload.sallybus;

  if (!hasCalander && !hasSallybus) {
    throw new Error("At least one of calander or sallybus is required.");
  }

  return withScriptLock_(function () {
    var sheet = getOrCreateSheet_();
    var columns = ensureColumns_(sheet);
    var rowIndex = ensureDataRow_(sheet);

    if (hasCalander) {
      sheet.getRange(rowIndex, columns.calander).setValue(String(payload.calander).trim());
    }

    if (hasSallybus) {
      if (!payload.password) {
        throw new Error("Password is required to set sallybus.");
      }
      var enteredPassword = String(payload.password).trim();
      var existingPassword = String(sheet.getRange(rowIndex, columns.password).getValue() || "").trim();

      if (existingPassword && existingPassword !== enteredPassword) {
        throw new Error("Access denied. Password does not match.");
      }
      if (!existingPassword) {
        sheet.getRange(rowIndex, columns.password).setValue(enteredPassword);
      }
      sheet.getRange(rowIndex, columns.sallybus).setValue(String(payload.sallybus).trim());
    }

    return "Curriculum saved successfully.";
  });
}

// ============================================================
// READ — returns rows as objects with _row index
// ============================================================
function getRows(sheetName) {
  var ws = getSpreadsheet_().getSheetByName(sheetName);
  if (!ws) {
    return [];
  }

  var data = ws.getDataRange().getValues();
  if (data.length <= 1) {
    return [];
  }

  var headers = data[0];
  return data.slice(1).map(function (row, i) {
    var obj = { _row: i + 2 };
    headers.forEach(function (h, j) {
      obj[h] = row[j];
    });
    return obj;
  });
}

// ============================================================
// Setup + configuration helpers
// ============================================================
function setCurriculumSheetLink(sheetLinkOrId) {
  if (!sheetLinkOrId) {
    throw new Error("Sheet link or ID is required.");
  }
  var spreadsheetId = extractSpreadsheetId_(sheetLinkOrId);
  PropertiesService.getScriptProperties().setProperty("CURRICULUM_SHEET_ID", spreadsheetId);
  return { message: "Sheet link saved successfully.", spreadsheetId: spreadsheetId };
}

function clearCurriculumSheetLink() {
  PropertiesService.getScriptProperties().deleteProperty("CURRICULUM_SHEET_ID");
  return { message: "Saved sheet link cleared." };
}

function setupCurriculumSheet() {
  var sheet = getOrCreateSheet_();
  ensureColumns_(sheet);
  ensureDataRow_(sheet);
  Logger.log("Curriculum sheet ready in: " + getSpreadsheet_().getName());
}

function testConnection() {
  try {
    var ss = getSpreadsheet_();
    Logger.log("Connected to: " + ss.getName());
  } catch (err) {
    Logger.log("Connection failed: " + err.message);
  }
}

// ============================================================
// Internal utilities
// ============================================================
function parsePostBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {};
  }
  return JSON.parse(e.postData.contents || "{}");
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

function getSpreadsheet_() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var spreadsheetId = scriptProperties.getProperty("CURRICULUM_SHEET_ID");

  if (!spreadsheetId && CURRICULUM_SHEET_LINK) {
    spreadsheetId = extractSpreadsheetId_(CURRICULUM_SHEET_LINK);
  }

  if (!spreadsheetId && SHEET_ID) {
    spreadsheetId = extractSpreadsheetId_(SHEET_ID);
  }

  if (spreadsheetId) {
    return SpreadsheetApp.openById(spreadsheetId);
  }

  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    return active;
  }

  throw new Error(
    "Spreadsheet not found. Set SHEET_ID, CURRICULUM_SHEET_LINK, or script property CURRICULUM_SHEET_ID."
  );
}

function getOrCreateSheet_() {
  var spreadsheet = getSpreadsheet_();
  var sheet = spreadsheet.getSheetByName(CURRICULUM_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CURRICULUM_SHEET_NAME);
  }
  return sheet;
}

function ensureColumns_(sheet) {
  var lastColumn = sheet.getLastColumn();
  var headers = lastColumn > 0 ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0] : [];

  var normalizedHeaders = headers.map(function (header) {
    return normalizeHeader_(header);
  });

  var updated = false;
  CURRICULUM_HEADERS.forEach(function (required) {
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

function ensureDataRow_(sheet) {
  var rowIndex = 2;
  if (sheet.getLastRow() < rowIndex) {
    sheet.getRange(rowIndex, 1).setValue("");
  }
  return rowIndex;
}

function getDataRowValues_(sheet) {
  var rowIndex = ensureDataRow_(sheet);
  var width = Math.max(sheet.getLastColumn(), CURRICULUM_HEADERS.length);
  return sheet.getRange(rowIndex, 1, 1, width).getValues()[0];
}

function normalizeHeader_(value) {
  return String(value || "").trim().toLowerCase();
}

function extractSpreadsheetId_(sheetLinkOrId) {
  var value = String(sheetLinkOrId || "").trim();
  if (!value) {
    throw new Error("Sheet link or ID cannot be empty.");
  }

  if (/^[a-zA-Z0-9-_]{25,}$/.test(value) && value.indexOf("/") === -1) {
    return value;
  }

  var match = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }

  throw new Error("Invalid Google Sheet link or ID.");
}
