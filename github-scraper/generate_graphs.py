import os
import csv
import matplotlib.pyplot as plt
from multiprocessing import Process, Queue

def generate_graph_from_matplotlib_code(code: str, title="graph", queue=None):
    os.makedirs('./graphs', exist_ok=True)  # Ensure the graphs directory exists
    namespace = {}
    figures_saved = 0

    try:
        exec(code, namespace)
    except Exception as e:
        print(f"Error executing code: {e}")

    # Save all figures that were generated, even if an error occurred
    figures = [plt.figure(n) for n in plt.get_fignums()]
    for i, fig in enumerate(figures, start=1):
        filepath = f'./graphs/{title}_{i}.png'
        try:
            fig.savefig(filepath)
            print(f"Saved figure {i} to {filepath}")
            figures_saved += 1
        except Exception as e:
            print(f"Error saving figure {i}: {e}")
    
    plt.close('all')  # Free memory

    if queue:
        queue.put(figures_saved)  # Return the number of figures saved

def generate_graphs(num_graphs: int):
    os.makedirs('./graphs', exist_ok=True)
    graph_count = 0

    # Load the noncontextual flaw assessment CSV
    flaw_dict = {}
    with open('matplotlib_noncontextual_flaw_assessment.csv', newline='', encoding='utf-8') as flaw_file:
        reader = csv.DictReader(flaw_file)
        flaw_headers = reader.fieldnames[3:]  # All flaw columns
        for row in reader:
            key = (row['repo'], row['filename'])
            flaw_dict[key] = {k: row[k] for k in flaw_headers}

    output_file = 'generated_graphs.csv'
    with open(output_file, 'w', newline='', encoding='utf-8') as out_csv:
        fieldnames = ['title', 'repo', 'filename', 'pushed_date'] + flaw_headers
        writer = csv.DictWriter(out_csv, fieldnames=fieldnames)
        writer.writeheader()

        with open('github_matplotlib_audit.csv', newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                if graph_count >= num_graphs:
                    break

                code = row['code']
                repo_name = row['repo'].replace('/', '_')
                filename_no_ext = os.path.splitext(row['filename'])[0]
                title = f"{repo_name}_{filename_no_ext}"

                queue = Queue()
                p = Process(target=generate_graph_from_matplotlib_code, args=(code, title, queue))
                p.start()
                p.join(timeout=10)

                if p.is_alive():
                    print(f"Timeout reached for {title}, terminating process.")
                    p.terminate()
                    p.join()
                    figures_saved = 0
                else:
                    figures_saved = queue.get() if not queue.empty() else 0

                if figures_saved > 0:
                    graph_count += figures_saved
                    key = (row['repo'], row['filename'])
                    flaw_data = flaw_dict.get(key, {k: '' for k in flaw_headers})

                    writer.writerow({
                        'title': title,
                        'repo': row['repo'],
                        'filename': row['filename'],
                        'pushed_date': row['pushed_date'],
                        **flaw_data
                    })

    print(f"Total graphs generated: {graph_count}")

if __name__ == "__main__":
    generate_graphs(3)