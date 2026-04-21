# Startwell Apps Script Backend

This repository now includes a Google Apps Script backend for the **Startwell Education Curriculum Portal** frontend.

## Files

- `Code.gs` - Main backend script for Google Apps Script Web App.

## What the script does

On first run/deploy, the script automatically creates or initializes:

- `Syllabus` sheet
- `Calendar` sheet
- `Timetable` sheet
- `Passwords` sheet

The `Passwords` sheet is created with a default active password:

- `admin123`

Change or remove that default password after setup.

## Supported API actions

`POST` to your Apps Script web app URL with JSON payload:

- `verifyPassword`
- `addSyllabus`
- `addCalendar`
- `addTimetable`

The payload format matches your current frontend JavaScript implementation.

## Deploy steps

1. Create a new Google Apps Script project.
2. Paste the content of `Code.gs`.
3. Save and deploy:
   - **Deploy > New deployment > Web app**
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Copy the web app URL.
5. In your HTML/JS, set:

```js
const APPS_SCRIPT_URL = 'PASTE_YOUR_WEB_APP_URL_HERE';
```

## Password management

Open the `Passwords` sheet and manage rows:

- **Password**: admin password value
- **IsActive**: `TRUE` or `FALSE`
- **Note**: optional label
- **Created At**: timestamp

Any active row with matching password can unlock admin actions.
