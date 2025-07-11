import time
import requests
import csv 
import re
from datetime import datetime, timedelta
from tqdm import tqdm
import pandas as pd
from GITHUB_TOKEN import GITHUB_TOKEN


# --- Config ---
KEYWORDS   = ["import matplotlib", "from matplotlib import"]
MAX_PAGES  = 5
PER_PAGE   = 5

# --- API Setup ---
headers = {
    'Authorization': f'token {GITHUB_TOKEN}',
    'Accept':        'application/vnd.github.v3+json'
}
search_url = 'https://api.github.com/search/code'

# --- Time Stuff ---
since = datetime.today() - timedelta(days=30)  # Since 30 days ago
until = since + timedelta(days=1)   # Until 29 days ago 

while until < datetime.today():
    day_url = search_url.format(since.strftime('%Y-%m-%d'), until.strftime('%Y-%m-%d'))
    r = requests.get(day_url, headers)
    print(f'Repositories created between {since} and {until}: {r.json().get("total_count")}')

    # Update dates for the next search
    since = until
    until = since + timedelta(days=1)

# searching for the keywords in Python files
found_files = []

for keyword in KEYWORDS:
    print(f"\nSearching for code fragments containing: '{keyword}'")
    for page in tqdm(range(1, MAX_PAGES + 1)):
        params = {
            'q':       f'{keyword} in:file extension:py',
            'per_page':PER_PAGE,
            'page':    page
        }
        resp = requests.get(search_url, headers=headers, params=params)
        if resp.status_code == 403:
            print("Rate limited. Waiting...")
            time.sleep(60)
            continue
        if resp.status_code != 200:
            print("Error:", resp.status_code, resp.text)
            break

        data = resp.json()
        items = data.get('items', [])
        if not items:
            print("No results.")
            break

        for item in items:
            repo_full_name = item['repository']['full_name']
            file_path      = item['path']
            raw_url        = f"https://raw.githubusercontent.com/{repo_full_name}/HEAD/{file_path}"

            raw_resp = requests.get(raw_url, headers=headers)
            if raw_resp.status_code == 200:
                content = raw_resp.text
                print(f"Fetched: {repo_full_name}/{file_path}")
                # append to our list
                found_files.append({
                    'repo':    repo_full_name,
                    'path':    file_path,
                    'content': content
                })
            else:
                print(f"Failed to fetch: {repo_full_name}/{file_path}")

        time.sleep(1)  # avoid hammering the API

# --- after all scraping is done: build a DataFrame ---
df = pd.DataFrame(found_files)

rule_checks = {
    'MISSING_TITLE':              lambda txt: not bool(re.search(r'\.title\s*\(',  txt)),
    'MISSING_XLABEL':             lambda txt: not bool(re.search(r'\.xlabel\s*\(', txt)),
    'MISSING_YLABEL':             lambda txt: not bool(re.search(r'\.ylabel\s*\(', txt)),
    'MISSING_LEGEND':             lambda txt: not bool(re.search(r'\.legend\s*\(', txt)),
    'INSUFFICIENT_COLOR_CONTRAST': lambda txt: bool(re.search(r'color\s*=',         txt)),
    'FONTSIZE_TOO_SMALL':         lambda txt: not bool(re.search(r'fontsize\s*=',     txt)),
    'FIGSIZE_TOO_SMALL':          lambda txt: not bool(re.search(r'figsize\s*=\s*\(', txt)),
    'ANIMATIONS':                 lambda txt: bool(re.search(r'FuncAnimation|animation', txt, re.IGNORECASE))
}

# Apply rule checks to the DataFrame
for rule_name, check_fn in rule_checks.items():
    df[rule_name] = df['content'].apply(check_fn)

# ───────── FINALLY ─────────
# Export to CSV
df.to_csv(
    'github_accessibility_audit6.csv',
    index=False,
    encoding='utf-8',
    quoting=csv.QUOTE_ALL
)
