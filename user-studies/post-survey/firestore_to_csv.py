import firebase_admin
from firebase_admin import credentials, firestore
import csv

# Initialize Firebase Admin SDK
cred = credentials.Certificate('serviceAccountKey.json') # Path to the key file
firebase_admin.initialize_app(cred)

db = firestore.client()

def export_firestore_to_csv(collection_name, output_csv_file):
    """
    Exports data from a Firestore collection to a CSV file.

    Args:
        collection_name (str): The name of the Firestore collection to export.
        output_csv_file (str): The path to the output CSV file.
    """
    try:
        collection_ref = db.collection(collection_name)
        docs = collection_ref.stream()

        data_rows = []
        headers = set()

        for doc in docs:
            doc_data = doc.to_dict()
            data_rows.append(doc_data)
            headers.update(doc_data.keys()) # Collect all unique keys for headers

        if not data_rows:
            print(f"No documents found in collection '{collection_name}'.")
            return

        sorted_headers = sorted(list(headers)) # Sort headers alphabetically

        with open(output_csv_file, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=sorted_headers)
            writer.writeheader()
            writer.writerows(data_rows)

        print(f"Data from collection '{collection_name}' successfully exported to '{output_csv_file}'.")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    collection_to_export = 'post-survey'
    output_file = 'post_survey_firestore_data.csv'

    export_firestore_to_csv(collection_to_export, output_file)