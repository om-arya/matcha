import time
import requests
from datetime import datetime, timedelta
from tqdm import tqdm
import pandas as pd
from GITHUB_TOKEN import GITHUB_TOKEN

# --- Config ---
KEYWORDS = ["import matplotlib", "from matplotlib import"]
MAX_PAGES = 3
PER_PAGE = 10
START_DATE = datetime(2022, 1, 1)
END_DATE = datetime(2025, 7, 24)

# --- Setup ---
headers = {
    'Authorization': f'token {GITHUB_TOKEN}',
    'Accept': 'application/vnd.github.v3+json'
}
repo_search_url = "https://api.github.com/search/repositories"
found_entries = []

# --- Loop through each day ---
since = START_DATE
while since < END_DATE:
    until = since + timedelta(days=1)
    print(f"\n🔍 Scraping repos pushed from {since.date()} to {until.date()}")

    for page in range(1, MAX_PAGES + 1):
        params = {
            'q': f'language:python pushed:{since.strftime("%Y-%m-%d")}..{until.strftime("%Y-%m-%d")}',
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
                if file['name'].endswith('.py') and file.get('download_url'):
                    raw_resp = requests.get(file['download_url'])
                    if raw_resp.status_code == 200:
                        content = raw_resp.text
                        matching_lines = [
                            line.strip() for line in content.splitlines()
                            if any(keyword in line for keyword in KEYWORDS)
                        ]
                        if matching_lines:
                            print(f"✅ Found matplotlib in {repo_name}/{file['name']}")
                            found_entries.append({
                                'repo': repo_name,
                                'path': file['path'],
                                'pushed_date': since.strftime('%Y-%m-%d'),
                                'code_snippet': '\n'.join(matching_lines)
                            })

        time.sleep(1)

    since = until

# --- Output CSV ---
df = pd.DataFrame(found_entries)
df.to_csv('github_matplotlib_code_1.csv', index=False, encoding='utf-8', quoting=1)
print(f"\n✅ Saved {len(df)} matched files to 'github_matplotlib_snippets.csv'")
