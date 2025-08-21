import pandas as pd
import numpy as np
import matplotlib
import matplotlib.pyplot as plt
import multiprocessing
import warnings, sys, os, re, random
from io import StringIO

def generate_gh_scraper_graphs():
    # Create graphs directory if it doesn't exist
    os.makedirs('./graphs', exist_ok=True)
    
    # Load the datasets
    try:
        audit_df = pd.read_csv('github_matplotlib_audit.csv')
        flaw_df = pd.read_csv('matplotlib_noncontextual_flaw_assessment.csv')
    except FileNotFoundError as e:
        print(f"Error loading CSV files: {e}")
        return
    
    # Merge the datasets
    merged_df = pd.merge(audit_df, flaw_df, on=['repo', 'filename', 'pushed_date'], how='inner')
    
    flaw_prevalences = {
        '3D_EFFECTS': 0.03,
        'ANIMATIONS': 0.04,
        'DUAL_Y_AXES': 0.01,
        'FIGSIZE_TOO_SMALL': 0.08,
        'FONTSIZE_TOO_SMALL': 0.1,
        'INSUFFICIENT_COLOR_CONTRAST': 0.3,
        'INVERTED_Y_AXIS': 0.01,
        'TAMPERED_ASPECT_RATIO': 0.09,
        'TRUNCATED_Y_AXIS': 0.03
    }
    
    # Forbidden flaws (must be 0)
    forbidden_flaws = ['MISSING_TITLE', 'MISSING_XLABEL', 'MISSING_YLABEL', 'MISSING_LEGEND']
    
    # Filter out entries that have forbidden flaws
    filtered_df = merged_df.copy()
    for flaw in forbidden_flaws:
        filtered_df = filtered_df[filtered_df[flaw] == 0]
    
    print(f"Original dataset size: {len(merged_df)}")
    print(f"After filtering forbidden flaws: {len(filtered_df)}")
    
    if len(filtered_df) == 0:
        print("No suitable code samples found after filtering forbidden flaws.")
        return
    
    # Sample code for each desired flaw prevalence
    selected_samples = []
    
    for flaw, prevalence in flaw_prevalences.items():
        # Get samples with this flaw
        flaw_samples = filtered_df[filtered_df[flaw] == 1]
        # Get samples without this flaw
        no_flaw_samples = filtered_df[filtered_df[flaw] == 0]
        
        if len(flaw_samples) == 0 and prevalence > 0:
            print(f"Warning: No samples found with {flaw} flaw")
            continue
        
        if len(no_flaw_samples) == 0 and prevalence < 1:
            print(f"Warning: No samples found without {flaw} flaw")
            continue
        
        # Calculate number of samples needed
        total_samples_needed = min(100, len(filtered_df))
        flaw_samples_needed = int(total_samples_needed * prevalence)
        no_flaw_samples_needed = total_samples_needed - flaw_samples_needed
        
        # Sample the required number
        selected_flaw = flaw_samples.sample(min(flaw_samples_needed, len(flaw_samples)), random_state=42)
        selected_no_flaw = no_flaw_samples.sample(min(no_flaw_samples_needed, len(no_flaw_samples)), random_state=42)
        
        # Combine samples for this flaw
        flaw_selection = pd.concat([selected_flaw, selected_no_flaw])
        selected_samples.append(flaw_selection)
    
    # Combine all samples and remove duplicates
    if selected_samples:
        final_samples = pd.concat(selected_samples).drop_duplicates(subset=['repo', 'filename', 'pushed_date'])
    else:
        # Fallback: just use a random sample
        final_samples = filtered_df.sample(min(50, len(filtered_df)), random_state=42)
    
    print(f"Final sample size: {len(final_samples)}")
    
    # Process each code sample and generate graphs
    successful_generations = 0
    
    for idx, row in final_samples.iterrows():
        try:
            # Create a safe filename
            safe_filename = f"{row['repo'].replace('/', '_')}_{row['filename'].replace('.py', '').replace(' ', '_')}_{idx}"
            safe_filename = re.sub(r'[^\w\-_\.]', '_', safe_filename)
            
            # Execute the matplotlib code and save the plot
            success = execute_matplotlib_code(row['code'], safe_filename)
            if success:
                successful_generations += 1
                
            # Log the flaw information for this sample
            flaws_present = []
            for flaw in flaw_prevalences.keys():
                if row[flaw] == 1:
                    flaws_present.append(flaw)
            
            if flaws_present:
                print(f"Generated graph {safe_filename} with flaws: {', '.join(flaws_present)}")
            else:
                print(f"Generated graph {safe_filename} with no flaws")
                
        except Exception as e:
            print(f"Error processing sample {idx}: {str(e)}")
            continue
    
    print(f"\nSuccessfully generated {successful_generations} graphs out of {len(final_samples)} attempts")
    
    # Generate summary statistics
    generate_summary_report(final_samples, flaw_prevalences)

def _run_code_in_process(code, filename, return_dict):
    import matplotlib
    matplotlib.use("Agg")

    import matplotlib.pyplot as plt
    import warnings, sys, os, re, random
    from io import StringIO
    import pandas as pd
    import numpy as np

    warnings.filterwarnings("ignore")
    os.makedirs("./graphs", exist_ok=True)

    exec_globals = {
        'pd': pd,
        'np': np,
        'matplotlib': matplotlib,
        'plt': plt,
        'os': os,
        're': re,
        'random': random,
        '__builtins__': __builtins__,
    }

    # Prevent plt.show() from blocking/clearing
    exec_globals['plt'].show = lambda *a, **k: None

    # Redirect stdout/stderr
    sys.stdout, sys.stderr = StringIO(), StringIO()

    try:
        exec(code, exec_globals)

        # Collect figures
        figs = [plt.figure(n) for n in plt.get_fignums()]
        if not figs:
            return_dict['success'] = False
            return

        for i, fig in enumerate(figs):
            out = f"./graphs/{filename}_{i}.png" if len(figs) > 1 else f"./graphs/{filename}.png"
            fig.savefig(out, dpi=150, bbox_inches="tight")

        return_dict['success'] = True
    except Exception as e:
        return_dict['error'] = str(e)
        return_dict['success'] = False
    finally:
        plt.close("all")


def execute_matplotlib_code(code, filename, timeout=10):
    manager = multiprocessing.Manager()
    return_dict = manager.dict()

    p = multiprocessing.Process(target=_run_code_in_process, args=(code, filename, return_dict))
    p.start()
    p.join(timeout)

    if p.is_alive():
        p.terminate()
        p.join()
        print(f"Timeout: {filename} took longer than {timeout}s")
        return False

    if return_dict.get("success", False):
        return True
    else:
        if "error" in return_dict:
            print(f"Error executing code for {filename}: {return_dict['error']}")
        return False

def generate_summary_report(samples_df, flaw_prevalences):
    print("\n" + "="*50)
    print("SUMMARY REPORT")
    print("="*50)
    
    # Calculate actual prevalence for each flaw
    actual_prevalences = {}
    for flaw in flaw_prevalences.keys():
        actual_count = samples_df[flaw].sum()
        total_count = len(samples_df)
        actual_prevalence = actual_count / total_count if total_count > 0 else 0
        actual_prevalences[flaw] = actual_prevalence
        
        print(f"{flaw}:")
        print(f"  Target: {flaw_prevalences[flaw]:.1%}")
        print(f"  Actual: {actual_prevalence:.1%} ({actual_count}/{total_count})")
        print()
    
    # Check forbidden flaws
    print("Forbidden flaws (should all be 0%):")
    forbidden_flaws = ['MISSING_TITLE', 'MISSING_XLABEL', 'MISSING_YLABEL', 'MISSING_LEGEND']
    for flaw in forbidden_flaws:
        count = samples_df[flaw].sum()
        prevalence = count / len(samples_df) if len(samples_df) > 0 else 0
        print(f"  {flaw}: {prevalence:.1%} ({count}/{len(samples_df)})")
    
    print(f"\nTotal graphs generated: {len(samples_df)}")
    print(f"Graphs saved in: ./graphs/")

if __name__ == "__main__":
    generate_gh_scraper_graphs()