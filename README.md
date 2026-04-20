# Medical Company Data Manager (C++)

This project is a simple and reliable C++ console application to store your medical company patient records.

## Features

- Add new patient record
- List all records
- Search by patient ID
- Update patient details
- Delete patient record
- Safe save process (temporary file + backup file)
- Input validation for age and phone number

## Data Stored Per Patient

- Patient ID (unique)
- Full Name
- Age
- Diagnosis
- Treatment Plan
- Phone Number

Data is saved to:

- `patient_records.db` (main data file)
- `patient_records.db.bak` (automatic backup of previous save)

## Build and Run

### Option 1: CMake (recommended)

```bash
cmake -S . -B build -DCMAKE_CXX_COMPILER=g++
cmake --build build
./build/medical_data_manager
```

### Option 2: g++ direct compile

```bash
g++ -std=c++17 -O2 -Wall -Wextra -pedantic src/main.cpp -o medical_data_manager
./medical_data_manager
```

## Menu

When you run the app, choose:

1. Add patient record
2. List all patient records
3. Search patient by ID
4. Update patient record
5. Delete patient record
0. Save and Exit

## Important Note

This is a local file-based starter system for internal record management.  
For real production medical compliance (privacy laws, access control, encryption, audit logs, backups to secure infrastructure), add stronger security controls before live deployment.
