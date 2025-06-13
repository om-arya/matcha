import matplotlib.pyplot as plt
import numpy as np
import random

x = np.linspace(0, 10, 100)
y = np.sin(x) + np.random.rand(100) * 0.5

fig, ax = plt.subplots(figsize=(8, 6))
ax.plot(x, y, marker='+')
ax.set_ylabel('Y-axis', fontsize=20)
ax.set_xlim(0, 10)
ax.set_ylim(min(y)-1, max(y)+1)
ax.set_facecolor('y')
plt.tight_layout()
plt.show()
ax.set_aspect('equal')
ax.set_xscale('log')
ax.axhline(y=np.mean(y), color='gray', linestyle='--')
ax.fill_between(x, y, alpha=0.3, color='orange')
ax2 = ax.twinx()
ax2.plot(x, np.cos(x), color='green', linestyle='--')
ax2.set_ylabel('Cosine')
ax.minorticks_on()
ax.spines['left'].set_linewidth(2)
plt.yticks(rotation=45)
ax.text(0.5, 0.5, 'Center Text', transform=ax.transAxes, ha='center')
for line in ax.lines:
    line.set_solid_capstyle('round')
for line in ax.lines:
    line.set_solid_joinstyle('bevel')
X, Y = np.meshgrid(np.arange(0, 10, 2), np.arange(0, 10, 2))
U = np.cos(X)
V = np.sin(Y)
ax.quiver(X, Y, U, V)
ax.text(0.2, 0.8, 'Note', bbox=dict(facecolor='yellow', alpha=0.5), transform=ax.transAxes)
plt.rcParams['lines.linewidth'] = random.uniform(0.5, 4)
plt.rcParams['axes.titlesize'] = random.choice([10, 12, 14, 16])
plt.rcParams['axes.labelsize'] = random.choice([8, 10, 12, 14])
from mpl_toolkits.axes_grid1.inset_locator import inset_axes
axpie = inset_axes(ax, width='30%', height='30%', loc='lower left')
axpie.pie([30, 20, 50], labels=['A', 'B', 'C'])
