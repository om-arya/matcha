import pandas as pd
import matplotlib.pyplot as plt
from redesign_service.redesign_service import find_flaws

def assess_matplotlib_files(csv_path='github_matplotlib_audit.csv', output_csv='matplotlib_flaw_assessment.csv'):
    df = pd.read_csv(csv_path)

    all_flaws_set = set() # Collect all unique flaws found across files
    flaw_results = []

    for idx, row in df.iterrows():
        filename = row['filename']
        pushed_date = row['pushed_date']
        code = row['code']

        print(f"Finding flaws in \"{filename}\" from {pushed_date}...")
        flaws = find_flaws(code)
        flaw_results.append(flaws)
        all_flaws_set.update(flaws)

    all_flaws = sorted(all_flaws_set)  # Ensure consistent column order

    # Build binary matrix
    binary_data = []
    for flaws in flaw_results:
        row_data = {flaw: int(flaw in flaws) for flaw in all_flaws}
        binary_data.append(row_data)

    binary_df = pd.DataFrame(binary_data)
    result_df = pd.concat([df[['repo', 'filename', 'pushed_date']], binary_df], axis=1)

    # Save output
    result_df.to_csv(output_csv, index=False)
    print(f"✅ Saved flaw-assessed data to '{output_csv}'")
    return result_df

def create_flaw_chart(assessment_csv='matplotlib_flaw_assessment.csv', output_image='flaw_chart.png'):
    df = pd.read_csv(assessment_csv)

    file_count = len(df)

    # Identify flaw columns (all except metadata columns)
    flaw_columns = [col for col in df.columns if col not in ['repo', 'filename', 'pushed_date']]

    # Count number of files with each flaw
    flaw_counts = df[flaw_columns].sum()

    # Plot
    plt.figure(figsize=(12, 6))
    bars = plt.bar(flaw_counts.index, flaw_counts.values, color='black', edgecolor='black')

    plt.xlabel("Flaw Type", fontsize=12)
    plt.ylabel("Number of Files", fontsize=12)
    plt.title("Frequency of Matplotlib Flaws in GitHub Files", fontsize=14)
    plt.xticks(rotation=45, ha='right')
    plt.ylim(0, file_count)

    # Add value labels on top of bars
    for bar in bars:
        height = bar.get_height()
        plt.annotate(f'{int(height)}',
                     xy=(bar.get_x() + bar.get_width() / 2, height),
                     xytext=(0, 3),
                     textcoords="offset points",
                     ha='center', va='bottom', fontsize=9)

    plt.tight_layout()
    plt.savefig(output_image, dpi=300)
    print(f"📊 Saved flaw chart to '{output_image}'")

if __name__ == "__main__":
    create_flaw_chart()