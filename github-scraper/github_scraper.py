import time
import requests
from GITHUB_TOKEN import GITHUB_TOKEN

# --- Config ---
KEYWORDS = ["import matplotlib", "from matplotlib import"]
MAX_PAGES = 1
PER_PAGE = 1

# --- API Setup ---
headers = {
    'Authorization': f'token {GITHUB_TOKEN}',
    'Accept': 'application/vnd.github.v3+json'
}

url = 'https://api.github.com/search/code'

found_files = []

# --- Search Loop ---
for keyword in KEYWORDS:
    print(f"\nSearching for code fragments containing: '{keyword}'")

    for page in range(1, MAX_PAGES + 1):
        params = {
            'q': f'{keyword} in:file extension:py',
            'per_page': PER_PAGE,
            'page': page
        }

        response = requests.get(url, headers=headers, params=params)

        if response.status_code == 403:
            print("Rate limited. Waiting...")
            time.sleep(60)
            continue
        elif response.status_code != 200:
            print("Error:", response.status_code, response.text)
            break

        data = response.json()
        items = data.get('items', [])

        if not items:
            print("No results.")
            break

        for item in items:
            repo_full_name = item['repository']['full_name']
            file_path = item['path']

            # Construct raw URL to download the file
            raw_url = f"https://raw.githubusercontent.com/{repo_full_name}/HEAD/{file_path}"

            raw_response = requests.get(raw_url, headers=headers)
            if raw_response.status_code == 200:
                found_files.append({
                    'repo': repo_full_name,
                    'path': file_path,
                    'content': raw_response.text
                })
                print(f"Fetched: {repo_full_name}/{file_path}: {raw_response.text}")
            else:
                print(f"Failed to fetch: {repo_full_name}/{file_path} - Status {raw_response.status_code}")

        time.sleep(1) # Respect GitHub API rate limits