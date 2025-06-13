import subprocess
import os
import random
import string

def generate_random_matplotlib_script(filename):
    colors = ['b', 'g', 'r', 'c', 'm', 'y', 'k', '#FF5733', '#33FFCE']
    linestyles = ['-', '--', '-.', ':']
    markers = ['o', 's', 'D', '^', '*', 'x', '+', 'p']
    fontsizes = [8, 10, 12, 14, 16, 18, 20]

    def chance():
        return random.random() < 0.5

    with open(filename, 'w') as f:
        f.write("import matplotlib.pyplot as plt\n")
        f.write("import numpy as np\n")
        f.write("import random\n\n")
        f.write("x = np.linspace(0, 10, 100)\n")
        f.write("y = np.sin(x) + np.random.rand(100) * 0.5\n\n")

        # Create figure and axis
        if chance():
            f.write("fig, ax = plt.subplots(figsize=(8, 6))\n")
        else:
            f.write("fig, ax = plt.subplots()\n")

        # Line plot with random style
        plot_cmd = "ax.plot(x, y"
        if chance():
            plot_cmd += f", color='{random.choice(colors)}'"
        if chance():
            plot_cmd += f", linestyle='{random.choice(linestyles)}'"
        if chance():
            plot_cmd += f", marker='{random.choice(markers)}'"
        if chance():
            plot_cmd += f", linewidth={random.uniform(0.5, 4):.1f}"
        plot_cmd += ")\n"
        f.write(plot_cmd)

        # Title
        if chance():
            f.write(f"ax.set_title('Title', fontsize={random.choice(fontsizes)})\n")

        # X/Y labels
        if chance():
            f.write(f"ax.set_xlabel('X-axis', fontsize={random.choice(fontsizes)})\n")
        if chance():
            f.write(f"ax.set_ylabel('Y-axis', fontsize={random.choice(fontsizes)})\n")

        # Axis limits
        if chance():
            f.write("ax.set_xlim(0, 10)\n")
        if chance():
            f.write("ax.set_ylim(min(y)-1, max(y)+1)\n")

        # Ticks
        if chance():
            f.write("ax.set_xticks(np.linspace(0, 10, 6))\n")
        if chance():
            f.write("ax.set_yticks(np.arange(int(min(y)), int(max(y))+1))\n")

        # Tick parameters
        if chance():
            f.write("ax.tick_params(axis='both', which='major', labelsize=10, length=6, width=2)\n")

        # Grid
        if chance():
            f.write(f"ax.grid(True, linestyle='{random.choice(linestyles)}', linewidth={random.uniform(0.5, 2):.1f})\n")

        # Legend
        if chance():
            f.write("ax.plot(x, np.cos(x), label='Cosine')\n")
            f.write("ax.legend()\n")

        # Spine visibility
        if chance():
            f.write("for spine in ['top', 'right']:\n")
            f.write("    ax.spines[spine].set_visible(False)\n")

        # Background color
        if chance():
            f.write(f"ax.set_facecolor('{random.choice(colors)}')\n")
        if chance():
            f.write(f"fig.patch.set_facecolor('{random.choice(colors)}')\n")

        # Tight layout
        if chance():
            f.write("plt.tight_layout()\n")

        # Save figure
        if chance():
            f.write("plt.savefig('output.png')\n")

        # Show plot
        f.write("plt.show()\n")

        # Aspect ratio
        if chance():
            f.write("ax.set_aspect('equal')\n")

        # Log scale
        if chance():
            f.write("ax.set_yscale('log')\n")
        if chance():
            f.write("ax.set_xscale('log')\n")

        # Annotations
        if chance():
            f.write("ax.annotate('Peak', xy=(x[np.argmax(y)], max(y)), xytext=(5, max(y)+1), "
                    "arrowprops=dict(facecolor='black', shrink=0.05))\n")

        # Horizontal and vertical lines
        if chance():
            f.write("ax.axhline(y=np.mean(y), color='gray', linestyle='--')\n")
        if chance():
            f.write("ax.axvline(x=5, color='purple', linestyle=':')\n")

        # Fill between
        if chance():
            f.write("ax.fill_between(x, y, alpha=0.3, color='orange')\n")

        # Twin axis
        if chance():
            f.write("ax2 = ax.twinx()\n")
            f.write("ax2.plot(x, np.cos(x), color='green', linestyle='--')\n")
            if chance():
                f.write("ax2.set_ylabel('Cosine')\n")

        # Inset plot
        if chance():
            f.write("from mpl_toolkits.axes_grid1.inset_locator import inset_axes\n")
            f.write("axins = inset_axes(ax, width='30%', height='30%', loc='upper right')\n")
            f.write("axins.plot(x, y, color='red')\n")
            f.write("axins.set_xlim(2, 4)\n")
            f.write("axins.set_ylim(min(y), max(y))\n")

        # Minor ticks
        if chance():
            f.write("ax.minorticks_on()\n")

        # Customize spines
        if chance():
            f.write("ax.spines['left'].set_linewidth(2)\n")
        if chance():
            f.write("ax.spines['bottom'].set_color('blue')\n")

        # Tick label rotation
        if chance():
            f.write("plt.xticks(rotation=45)\n")
        if chance():
            f.write("plt.yticks(rotation=45)\n")

        # Custom tick labels
        if chance():
            f.write("ax.set_xticklabels([f'{val:.1f}' for val in ax.get_xticks()])\n")

        # Text inside plot
        if chance():
            f.write("ax.text(0.5, 0.5, 'Center Text', transform=ax.transAxes, ha='center')\n")

        # Bar plot overlay
        if chance():
            f.write("ax.bar(x[::10], y[::10], width=0.5, alpha=0.3, color='gray')\n")

        # Scatter plot overlay
        if chance():
            f.write("ax.scatter(x[::5], y[::5], color='black')\n")

        # Line cap/join styles
        if chance():
            f.write("for line in ax.lines:\n")
            f.write("    line.set_solid_capstyle('round')\n")
        if chance():
            f.write("for line in ax.lines:\n")
            f.write("    line.set_solid_joinstyle('bevel')\n")

        # Add quiver plot
        if chance():
            f.write("X, Y = np.meshgrid(np.arange(0, 10, 2), np.arange(0, 10, 2))\n")
            f.write("U = np.cos(X)\n")
            f.write("V = np.sin(Y)\n")
            f.write("ax.quiver(X, Y, U, V)\n")

        # Box style text
        if chance():
            f.write("ax.text(0.2, 0.8, 'Note', bbox=dict(facecolor='yellow', alpha=0.5), transform=ax.transAxes)\n")

        # Rectangle patch
        if chance():
            f.write("from matplotlib.patches import Rectangle\n")
            f.write("ax.add_patch(Rectangle((2, 1), 2, 2, fill=True, color='cyan', alpha=0.3))\n")

        # Event marker
        if chance():
            f.write("ax.axvspan(3, 4, color='red', alpha=0.2)\n")

        # Custom grid axis
        if chance():
            f.write("ax.xaxis.grid(True, which='minor')\n")
            f.write("ax.yaxis.grid(True, linestyle='dotted', linewidth=0.8)\n")

        # Apply random Matplotlib style
        if chance():
            f.write("plt.style.use(random.choice(plt.style.available))\n")

        # Random rcParams (a few safe ones)
        if chance():
            f.write("plt.rcParams['lines.linewidth'] = random.uniform(0.5, 4)\n")
        if chance():
            f.write("plt.rcParams['axes.titlesize'] = random.choice([10, 12, 14, 16])\n")
        if chance():
            f.write("plt.rcParams['axes.labelsize'] = random.choice([8, 10, 12, 14])\n")
        if chance():
            f.write("plt.rcParams['xtick.labelsize'] = random.choice([8, 10, 12])\n")
        if chance():
            f.write("plt.rcParams['ytick.labelsize'] = random.choice([8, 10, 12])\n")

        # 3D plot
        if chance():
            f.write("from mpl_toolkits.mplot3d import Axes3D\n")
            f.write("fig3d = plt.figure()\n")
            f.write("ax3d = fig3d.add_subplot(111, projection='3d')\n")
            f.write("X = np.linspace(-5, 5, 50)\n")
            f.write("Y = np.linspace(-5, 5, 50)\n")
            f.write("X, Y = np.meshgrid(X, Y)\n")
            f.write("Z = np.sin(np.sqrt(X**2 + Y**2))\n")
            f.write("ax3d.plot_surface(X, Y, Z, cmap='viridis')\n")

        # Inset pie chart
        if chance():
            f.write("from mpl_toolkits.axes_grid1.inset_locator import inset_axes\n")
            f.write("axpie = inset_axes(ax, width='30%', height='30%', loc='lower left')\n")
            f.write("axpie.pie([30, 20, 50], labels=['A', 'B', 'C'])\n")

        # Broken axis example
        if chance():
            f.write("from matplotlib import gridspec\n")
            f.write("fig_broken, (ax1, ax2) = plt.subplots(2, 1, sharex=True, figsize=(6, 4))\n")
            f.write("ax1.plot(x, y)\n")
            f.write("ax2.plot(x, y)\n")
            f.write("ax1.set_ylim(max(y)-0.1, max(y)+0.5)\n")
            f.write("ax2.set_ylim(min(y)-1, min(y)+0.5)\n")
            f.write("ax1.spines['bottom'].set_visible(False)\n")
            f.write("ax2.spines['top'].set_visible(False)\n")
            f.write("ax1.xaxis.tick_top()\n")
            f.write("ax2.xaxis.tick_bottom()\n")

        # Polar plot
        if chance():
            f.write("fig_polar, ax_polar = plt.subplots(subplot_kw={'projection': 'polar'})\n")
            f.write("theta = np.linspace(0, 2 * np.pi, 100)\n")
            f.write("r = np.abs(np.sin(5 * theta))\n")
            f.write("ax_polar.plot(theta, r)\n")

        # Subplot grid
        if chance():
            f.write("fig_grid, axs = plt.subplots(2, 2)\n")
            f.write("for axx in axs.flatten():\n")
            f.write("    axx.plot(x, np.sin(x + random.uniform(0, 2*np.pi)))\n")
            f.write("    axx.set_title('Title')\n")

def save_random_matplotlib_image():
    # Create a unique filename to avoid conflicts
    random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    script_filename = f"temp_plot_{random_suffix}.py"

    # Generate the script
    generate_random_matplotlib_script(script_filename)

    # Run the script to produce the image
    try:
        subprocess.run(["python3", script_filename], check=True)
        print(f"Script {script_filename} executed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error executing {script_filename}: {e}")

if __name__ == "__main__":
    for i in range(10):
        save_random_matplotlib_image()