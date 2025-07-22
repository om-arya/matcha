import time
import requests
import csv
import re
from datetime import datetime, timedelta
import pandas as pd
from tqdm import tqdm
from GITHUB_TOKEN import GITHUB_TOKEN

# --- Setup ---
KEYWORDS   = ["import matplotlib", "from matplotlib import"]
MAX_PAGES  = 5
PER_PAGE   = 10
OUTPUT_CSV = "github_matplotlib_code.csv"

HEADERS = {
    'Authorization': f'token {GITHUB_TOKEN}',
    'Accept':        'application/vnd.github.v3+json'
}

SEARCH_URL = "https://api.github.com/search/code"

# --- Time range settings ---
start_date = datetime(2021, 1, 1)  # Start far back; change if needed
end_date   = datetime.today()

# --- Optional: Resume from a checkpoint ---
try:
    existing_df = pd.read_csv(OUTPUT_CSV)
    scraped_repos = set(existing_df['repo'] + '/' + existing_df['path'])
    print(f"Resuming, {len(scraped_repos)} files already scraped.")
except FileNotFoundError:
    scraped_repos = set()

# --- Loop through every day ---
while start_date < end_date:
    next_day = start_date + timedelta(days=1)
    print(f"\nScraping for files created between {start_date.date()} and {next_day.date()}")

    for keyword in KEYWORDS:
        for page in range(1, MAX_PAGES + 1):
            params = {
                'q': f'{keyword} in:file extension:py created:{start_date.date()}..{next_day.date()}',
                'per_page': PER_PAGE,
                'page': page
            }

            response = requests.get(SEARCH_URL, headers=HEADERS, params=params)

            if response.status_code == 403:
                print("Rate limited. Sleeping for 1 minute...")
                time.sleep(60)
                continue
            elif response.status_code != 200:
                print("Error:", response.status_code, response.text)
                break

            for item in response.json().get("items", []):
                repo_full_name = item['repository']['full_name']
                file_path = item['path']
                unique_id = f"{repo_full_name}/{file_path}"

                if unique_id in scraped_repos:
                    continue

                raw_url = f"https://raw.githubusercontent.com/{repo_full_name}/HEAD/{file_path}"
                raw_resp = requests.get(raw_url, headers=HEADERS)

                if raw_resp.status_code == 200:
                    with open(OUTPUT_CSV, "a", newline='', encoding='utf-8') as f:
                        writer = csv.writer(f)
                        writer.writerow([repo_full_name, file_path, raw_resp.text])
                        scraped_repos.add(unique_id)
                        print(f"Saved: {repo_full_name}/{file_path}")
                else:
                    print(f"Failed to fetch raw content for {repo_full_name}/{file_path}")

            time.sleep(1)  # Avoid hammering GitHub

    # Move to the next day
    start_date = next_day
    time.sleep(2)  # Optional slow down between day cycles
