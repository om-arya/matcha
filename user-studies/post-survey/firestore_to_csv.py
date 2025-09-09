import firebase_admin
from firebase_admin import credentials, firestore
import csv, re

# Initialize Firebase Admin SDK
cred = credentials.Certificate('serviceAccountKey.json') # Path to the key file
firebase_admin.initialize_app(cred)

db = firestore.client()

# Strip values like '3 (Slightly Positive)' to just '3'.
def clean_value(val):
    if isinstance(val, str):
        match = re.match(r'^(\d+)\s*\(.*\)$', val)
        if match:
            return match.group(1)
    return val

def process_document(doc_data):
    if "value" in doc_data: del doc_data["value"]

    # Clean all field values
    doc_data = {k: clean_value(v) for k, v in doc_data.items()}

    # Swap values if necessary
    if doc_data.get("graphSummaryType0") == "optimized":
        doc_data["graphFilename0"], doc_data["graphFilename2"] = doc_data.get("graphFilename2"), doc_data.get("graphFilename0")
        doc_data["graphFilename1"], doc_data["graphFilename3"] = doc_data.get("graphFilename3"), doc_data.get("graphFilename1")

        doc_data["findAndAnswer1"], doc_data["findAndAnswer3"] = doc_data.get("findAndAnswer3"), doc_data.get("findAndAnswer1")
        doc_data["findAndAnswer2"], doc_data["findAndAnswer4"] = doc_data.get("findAndAnswer4"), doc_data.get("findAndAnswer2")
        
        doc_data["confidence1"], doc_data["confidence3"] = doc_data.get("confidence3"), doc_data.get("confidence1")
        doc_data["confidence2"], doc_data["confidence4"] = doc_data.get("confidence4"), doc_data.get("confidence2")

        doc_data["informativeness1"], doc_data["informativeness3"] = doc_data.get("informativeness3"), doc_data.get("informativeness1")
        doc_data["informativeness2"], doc_data["informativeness4"] = doc_data.get("informativeness4"), doc_data.get("informativeness2")

        doc_data["usability1"], doc_data["usability3"] = doc_data.get("usability3"), doc_data.get("usability1")
        doc_data["usability2"], doc_data["usability4"] = doc_data.get("usability4"), doc_data.get("usability2")

    if "graphSummaryType0" in doc_data: del doc_data["graphSummaryType0"]
    if "graphSummaryType1" in doc_data: del doc_data["graphSummaryType1"]
    if "graphSummaryType2" in doc_data: del doc_data["graphSummaryType2"]
    if "graphSummaryType3" in doc_data: del doc_data["graphSummaryType3"]

    # Shift graphSummaryTypeX -> graphSummaryType(X+1)
    new_data = {}
    for k, v in doc_data.items():
        if k.startswith("graphFilename"):
            idx = int(k.replace("graphFilename", ""))
            new_data[f"graphFilename{idx+1}"] = v
        else:
            new_data[k] = v

    return new_data

def export_firestore_to_csv(collection_name, output_csv_file, prolific_ids=None):
    try:
        collection_ref = db.collection(collection_name)
        docs = collection_ref.stream()

        data_rows = []
        headers = set()

        for doc in docs:
            doc_data = doc.to_dict()

            # If prolific_ids filter is provided, skip docs not in list
            if prolific_ids and doc_data.get("prolificID") not in prolific_ids:
                continue

            processed = process_document(doc_data)
            data_rows.append(processed)
            headers.update(processed.keys())

        if not data_rows:
            print(f"No matching documents found in collection '{collection_name}'.")
            return

        # Sort by participantNumber
        data_rows.sort(key=lambda x: int(x.get("participantNumber", 0)))

        # Write CSV
        headers = sorted(headers)
        with open(output_csv_file, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=headers)
            writer.writeheader()
            writer.writerows(data_rows)

        print(f"Data from collection '{collection_name}' successfully exported to '{output_csv_file}'.")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    collection_to_export = 'post-survey'
    output_file = 'post_survey_firestore_data.csv'

    prolific_ids = [
        # BLV
        "5c50b6dc172b6c000177a036",
        "5d730aab6b4b16001ab9699e",
        "672c18b9a6c9d7bb286cd039",
        "66f0c33279c43367bd7542c4",
        "6774630907f0abb2253c5a05",
        "6728cf34e77227d41aec736c",
        "60e282f9202a8126e2ea0315",
        "5de58f7433a3aa000b024461",
        "66a39e4133c215f408c9cd0c",
        "67d6b89ed0d843d5b37b667a",
        "67ebb7fcb7728fc1387839b9",
        "669bce49fe5a1987b0767370",
        "67ac32ed0bac98257abc2c04",
        "67de5fc8362f9d15ab677d05",
        "67402eca3dd0d3cc8ca11df3",
        "671a442156d47b923c0c4f7a",
        "667d80e9999f7d4918f9fc94",
        "666f0fb7d9900bb03f5d99a1",
        "61031f137855ff378d67c2fc",
        "60d5a860b6472cfdc1885684",
        "66f3f19a6de8f0b0cdf9eb45"

        # ND
        "67cf6dfb019a3a7d53e9dc7e",
        "66311db2f9d3b238692d2972",
        "63d82b2de40f94ceb14816cc",
        "67a796cd3ddc2ecc4a26fa35",
        "5dc916d584b21f64f98d61dd",
        "667c86d3b9ca760b999914f3",
        "654beb18b762f5afea837c8b",
        "667bd5012a43ab2c51a565ce",
        "67a3b1205dced1eb520e10f1",
        "5a147e755d06850001b00937",
        "603e27e4689f94dfc6590465",
        "67a92eb40002d1f843008b03",
        "66445cba51653be6d03587f1",
        "65eb3a99355a9dc09c32dc23",
        "66353ccc7ee2fcdbd28ea518",
        "5e74ff093115e00576f0187c",
        "6672d7c8f27a75aa9998abab",
        "66b267d5f67b576d7d188f0d"
        "66ae590a965e76c5cd7b67d7",
        "67458d30882b7993b554543d",
        "67d127361e372345da2a9149",
        "66cec53bdc37b68c08c86c51",
        "66f59c766e7e22e1f90d08f6",
        "67048c644ae2740b0d23f015",
        "656dfef713b8d414bd002040",
        "67caef1c20cd519bfabedda9",
        "611cdcbb1152bad5b9abdc92",
        "66d7095ab1d3e9fc57d0ed98",
        "67af30076947c47af4af18d8",
        "610c3dca3aa9f75d7057307d",
        "66a7af39796ea115d89dca18",
        "67dbfd5c13f69f693d27d691",
        "67d548fa5d8f6873fccfca3a",
        "6788da2a096d1243e779a70a",
        "665cc0ef4fa57fdf6f53ab2d",
        "664e326b5579c6f6ca3fd1ff",
        "6743278eba3a6dfeeeb53b00",
        "68238de3a3ba8b99fef9b7ca",
        "67dab725b93f66976ef0bdfb",
        "66bd001bdff5991cf61b905e",
        "67ff743c31d72095f14687e3",
        "674d99171387dca1d58cb882",
        "66cf524e6b2a5e244325a533"
    ]

    export_firestore_to_csv(collection_to_export, output_file, prolific_ids)