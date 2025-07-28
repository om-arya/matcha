import requests
from datetime import datetime, timedelta
import pandas as pd
import csv
import os
from GITHUB_TOKEN import GITHUB_TOKEN

KEYWORDS = ["import matplotlib", "from matplotlib"]

MAX_PAGES = 100
PER_PAGE = 10

START_DATE = datetime(2022, 1, 1)
END_DATE = datetime(2025, 7, 24)

OUTPUT_CSV = 'github_matplotlib_audit_1.csv'

# Prepare the CSV with headers if it doesn't exist
if not os.path.exists(OUTPUT_CSV):
    with open(OUTPUT_CSV, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['repo', 'filename', 'pushed_date', 'code'], quoting=csv.QUOTE_ALL)
        writer.writeheader()

headers = {
    'Authorization': f'token {GITHUB_TOKEN}',
    'Accept': 'application/vnd.github.v3+json'
}
repo_search_url = "https://api.github.com/search/repositories"

since = START_DATE
while since < END_DATE:
    until = since + timedelta(days=1)
    print(f"\n🔍 Scraping repos pushed from {since.date()} to {until.date()}")

    for page in range(1, MAX_PAGES + 1):
        params = {
            'q': f'matplotlib language:python pushed:{since.strftime("%Y-%m-%d")}..{until.strftime("%Y-%m-%d")}',
            'sort': 'updated',
            'order': 'desc',
            'per_page': PER_PAGE,
            'page': page
        }

        repo_resp = requests.get(repo_search_url, headers=headers, params=params)
        if repo_resp.status_code != 200:
            print("Repo API error:", repo_resp.status_code, repo_resp.text)
            break

        repos = repo_resp.json().get('items', [])
        if not repos:
            break

        for repo in repos:
            repo_name = repo['full_name']
            branch = repo.get('default_branch', 'main')
            contents_url = f"https://api.github.com/repos/{repo_name}/contents?ref={branch}"

            contents_resp = requests.get(contents_url, headers=headers)
            if contents_resp.status_code != 200:
                continue

            files = contents_resp.json()
            for file in files:
                if file['name'] and file.get('download_url'):
                    raw_resp = requests.get(file['download_url'])
                    if raw_resp.status_code == 200:
                        content = raw_resp.text
                        matching_lines = [
                            line.strip() for line in content.splitlines()
                            if any(keyword in line for keyword in KEYWORDS)
                        ]
                        if matching_lines:
                            print(f"✅ Found matplotlib code in {repo_name}/{file['name']}")
                            entry = {
                                'repo': repo_name,
                                'filename': file['path'],
                                'pushed_date': since.strftime('%Y-%m-%d'),
                                'code': content
                            }
                            # Append to CSV immediately
                            with open(OUTPUT_CSV, mode='a', newline='', encoding='utf-8') as f:
                                writer = csv.DictWriter(f, fieldnames=entry.keys(), quoting=csv.QUOTE_ALL)
                                writer.writerow(entry)
                            break  # Stop after one file per repo
                        else:
                            print(f"❌ Did not find matplotlib code in {repo_name}/{file['name']}")
    since = until

print(f"\n✅ Scraping complete. Appended matching files to '{OUTPUT_CSV}'")
