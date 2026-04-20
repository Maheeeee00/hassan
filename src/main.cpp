#include <algorithm>
#include <cctype>
#include <cstdio>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <limits>
#include <sstream>
#include <string>
#include <vector>

namespace {

struct PatientRecord {
    std::string patientId;
    std::string fullName;
    std::string diagnosis;
    std::string treatmentPlan;
    std::string phoneNumber;
    int age = 0;
};

class MedicalDataStore {
   public:
    explicit MedicalDataStore(std::string filePath) : filePath_(std::move(filePath)) {}

    bool load(std::string& error) {
        std::ifstream input(filePath_);
        if (!input.good()) {
            return true;
        }

        records_.clear();
        std::string line;
        int lineNumber = 0;
        while (std::getline(input, line)) {
            ++lineNumber;
            if (line.empty()) {
                continue;
            }

            PatientRecord record;
            if (!deserializeRecord(line, record)) {
                error = "Data file parse error on line " + std::to_string(lineNumber) + ".";
                records_.clear();
                return false;
            }
            records_.push_back(record);
        }
        return true;
    }

    bool save(std::string& error) const {
        // Write to a temporary file first to avoid partial writes.
        const std::string tempPath = filePath_ + ".tmp";
        std::ofstream output(tempPath, std::ios::trunc);
        if (!output.good()) {
            error = "Unable to open temporary file for saving.";
            return false;
        }

        for (const auto& record : records_) {
            output << serializeRecord(record) << "\n";
            if (!output.good()) {
                error = "Failed while writing to temporary data file.";
                return false;
            }
        }
        output.close();

        std::ifstream existingFile(filePath_);
        if (existingFile.good()) {
            const std::string backupPath = filePath_ + ".bak";
            std::remove(backupPath.c_str());
            if (std::rename(filePath_.c_str(), backupPath.c_str()) != 0) {
                error = "Failed to create backup file.";
                return false;
            }
        }

        if (std::rename(tempPath.c_str(), filePath_.c_str()) != 0) {
            const std::string backupPath = filePath_ + ".bak";
            // Best-effort rollback to keep last known good state available.
            std::rename(backupPath.c_str(), filePath_.c_str());
            error = "Failed to finalize data save.";
            return false;
        }
        return true;
    }

    bool addRecord(const PatientRecord& record, std::string& error) {
        if (findById(record.patientId) != records_.end()) {
            error = "A patient with that ID already exists.";
            return false;
        }
        records_.push_back(record);
        return true;
    }

    bool updateRecord(const PatientRecord& updated, std::string& error) {
        auto it = findById(updated.patientId);
        if (it == records_.end()) {
            error = "Patient ID not found.";
            return false;
        }
        *it = updated;
        return true;
    }

    bool deleteRecord(const std::string& patientId, std::string& error) {
        auto it = findById(patientId);
        if (it == records_.end()) {
            error = "Patient ID not found.";
            return false;
        }
        records_.erase(it);
        return true;
    }

    const std::vector<PatientRecord>& records() const { return records_; }

    const PatientRecord* getRecord(const std::string& patientId) const {
        auto it = findByIdConst(patientId);
        if (it == records_.end()) {
            return nullptr;
        }
        return &(*it);
    }

   private:
    std::vector<PatientRecord>::iterator findById(const std::string& patientId) {
        return std::find_if(records_.begin(), records_.end(), [&](const PatientRecord& record) {
            return record.patientId == patientId;
        });
    }

    std::vector<PatientRecord>::const_iterator findByIdConst(const std::string& patientId) const {
        return std::find_if(records_.begin(), records_.end(), [&](const PatientRecord& record) {
            return record.patientId == patientId;
        });
    }

    static std::string escapeField(const std::string& field) {
        std::string escaped;
        escaped.reserve(field.size());
        for (char ch : field) {
            if (ch == '|' || ch == '\\') {
                escaped.push_back('\\');
            }
            escaped.push_back(ch);
        }
        return escaped;
    }

    static std::vector<std::string> splitEscaped(const std::string& line) {
        std::vector<std::string> fields;
        std::string current;
        bool escaping = false;
        for (char ch : line) {
            if (escaping) {
                current.push_back(ch);
                escaping = false;
                continue;
            }
            if (ch == '\\') {
                escaping = true;
                continue;
            }
            if (ch == '|') {
                fields.push_back(current);
                current.clear();
            } else {
                current.push_back(ch);
            }
        }
        fields.push_back(current);
        return fields;
    }

    static std::string serializeRecord(const PatientRecord& record) {
        std::ostringstream out;
        out << escapeField(record.patientId) << "|"
            << escapeField(record.fullName) << "|"
            << record.age << "|"
            << escapeField(record.diagnosis) << "|"
            << escapeField(record.treatmentPlan) << "|"
            << escapeField(record.phoneNumber);
        return out.str();
    }

    static bool deserializeRecord(const std::string& line, PatientRecord& record) {
        const auto fields = splitEscaped(line);
        if (fields.size() != 6) {
            return false;
        }

        int age = 0;
        try {
            age = std::stoi(fields[2]);
        } catch (...) {
            return false;
        }
        if (age < 0 || age > 130) {
            return false;
        }

        record.patientId = fields[0];
        record.fullName = fields[1];
        record.age = age;
        record.diagnosis = fields[3];
        record.treatmentPlan = fields[4];
        record.phoneNumber = fields[5];
        return true;
    }

    std::string filePath_;
    std::vector<PatientRecord> records_;
};

class MedicalApp {
   public:
    explicit MedicalApp(std::string dataPath) : dataStore_(std::move(dataPath)) {}

    int run() {
        std::string error;
        if (!dataStore_.load(error)) {
            std::cerr << "Error: " << error << "\n";
            return 1;
        }

        while (true) {
            printMenu();
            const int choice = readInt("Choose an option: ");
            switch (choice) {
                case 1:
                    addPatient();
                    break;
                case 2:
                    listPatients();
                    break;
                case 3:
                    searchPatient();
                    break;
                case 4:
                    updatePatient();
                    break;
                case 5:
                    deletePatient();
                    break;
                case 0:
                    if (!saveAndExit()) {
                        return 1;
                    }
                    return 0;
                default:
                    std::cout << "Invalid choice. Try again.\n";
                    break;
            }
        }
    }

   private:
    static void printMenu() {
        std::cout << "\n=== Medical Company Data Manager ===\n";
        std::cout << "1. Add patient record\n";
        std::cout << "2. List all patient records\n";
        std::cout << "3. Search patient by ID\n";
        std::cout << "4. Update patient record\n";
        std::cout << "5. Delete patient record\n";
        std::cout << "0. Save and Exit\n";
    }

    static std::string trim(const std::string& text) {
        std::size_t start = 0;
        while (start < text.size() && std::isspace(static_cast<unsigned char>(text[start]))) {
            ++start;
        }
        std::size_t end = text.size();
        while (end > start && std::isspace(static_cast<unsigned char>(text[end - 1]))) {
            --end;
        }
        return text.substr(start, end - start);
    }

    static std::string readLine(const std::string& prompt) {
        std::cout << prompt;
        std::string value;
        std::getline(std::cin, value);
        return trim(value);
    }

    static int readInt(const std::string& prompt) {
        while (true) {
            const std::string text = readLine(prompt);
            try {
                const int value = std::stoi(text);
                return value;
            } catch (...) {
                std::cout << "Please enter a valid number.\n";
            }
        }
    }

    static bool isPhoneValid(const std::string& phone) {
        if (phone.size() < 7 || phone.size() > 20) {
            return false;
        }
        for (char ch : phone) {
            const bool allowed = std::isdigit(static_cast<unsigned char>(ch)) || ch == '+' || ch == '-' || ch == ' ';
            if (!allowed) {
                return false;
            }
        }
        return true;
    }

    static void printRecord(const PatientRecord& record) {
        std::cout << "---------------------------------\n";
        std::cout << "Patient ID: " << record.patientId << "\n";
        std::cout << "Full Name : " << record.fullName << "\n";
        std::cout << "Age       : " << record.age << "\n";
        std::cout << "Diagnosis : " << record.diagnosis << "\n";
        std::cout << "Treatment : " << record.treatmentPlan << "\n";
        std::cout << "Phone     : " << record.phoneNumber << "\n";
    }

    PatientRecord promptForPatientRecord(const std::string& existingId = "") {
        PatientRecord record;
        if (existingId.empty()) {
            while (record.patientId.empty()) {
                record.patientId = readLine("Patient ID: ");
                if (record.patientId.empty()) {
                    std::cout << "Patient ID cannot be empty.\n";
                }
            }
        } else {
            record.patientId = existingId;
            std::cout << "Patient ID: " << existingId << " (locked)\n";
        }

        while (record.fullName.empty()) {
            record.fullName = readLine("Full name: ");
            if (record.fullName.empty()) {
                std::cout << "Full name cannot be empty.\n";
            }
        }

        while (true) {
            const int age = readInt("Age (0-130): ");
            if (age < 0 || age > 130) {
                std::cout << "Age must be between 0 and 130.\n";
                continue;
            }
            record.age = age;
            break;
        }

        while (record.diagnosis.empty()) {
            record.diagnosis = readLine("Diagnosis: ");
            if (record.diagnosis.empty()) {
                std::cout << "Diagnosis cannot be empty.\n";
            }
        }

        while (record.treatmentPlan.empty()) {
            record.treatmentPlan = readLine("Treatment plan: ");
            if (record.treatmentPlan.empty()) {
                std::cout << "Treatment plan cannot be empty.\n";
            }
        }

        while (record.phoneNumber.empty() || !isPhoneValid(record.phoneNumber)) {
            record.phoneNumber = readLine("Phone number (+, -, space and digits): ");
            if (!isPhoneValid(record.phoneNumber)) {
                std::cout << "Phone number format is invalid.\n";
            }
        }

        return record;
    }

    void addPatient() {
        std::cout << "\nAdd new patient record:\n";
        PatientRecord record = promptForPatientRecord();
        std::string error;
        if (!dataStore_.addRecord(record, error)) {
            std::cout << "Error: " << error << "\n";
            return;
        }
        std::cout << "Patient record added successfully.\n";
    }

    void listPatients() const {
        const auto& records = dataStore_.records();
        if (records.empty()) {
            std::cout << "No patient records found.\n";
            return;
        }
        std::cout << "\nListing all patient records (" << records.size() << "):\n";
        for (const auto& record : records) {
            printRecord(record);
        }
    }

    void searchPatient() const {
        const std::string patientId = readLine("Enter Patient ID to search: ");
        const PatientRecord* record = dataStore_.getRecord(patientId);
        if (!record) {
            std::cout << "Patient ID not found.\n";
            return;
        }
        printRecord(*record);
    }

    void updatePatient() {
        const std::string patientId = readLine("Enter Patient ID to update: ");
        const PatientRecord* existing = dataStore_.getRecord(patientId);
        if (!existing) {
            std::cout << "Patient ID not found.\n";
            return;
        }

        std::cout << "Enter new details for patient.\n";
        PatientRecord updated = promptForPatientRecord(patientId);
        std::string error;
        if (!dataStore_.updateRecord(updated, error)) {
            std::cout << "Error: " << error << "\n";
            return;
        }
        std::cout << "Patient record updated successfully.\n";
    }

    void deletePatient() {
        const std::string patientId = readLine("Enter Patient ID to delete: ");
        std::string error;
        if (!dataStore_.deleteRecord(patientId, error)) {
            std::cout << "Error: " << error << "\n";
            return;
        }
        std::cout << "Patient record deleted successfully.\n";
    }

    bool saveAndExit() {
        std::string error;
        if (!dataStore_.save(error)) {
            std::cerr << "Error while saving: " << error << "\n";
            return false;
        }
        std::cout << "Data saved safely. Goodbye.\n";
        return true;
    }

    MedicalDataStore dataStore_;
};

}  // namespace

int main() {
    MedicalApp app("patient_records.db");
    return app.run();
}
