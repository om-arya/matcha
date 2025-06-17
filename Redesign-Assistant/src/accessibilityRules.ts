const rules = new Map<string, string>();

rules.set("FIGSIZE_TOO_SMALL", "'figsize' should be at least (8,5). This prevents overcrowding by ensuring that labels/titles are legible even when zoomed or magnified.");
rules.set("FONTSIZE_TOO_SMALL", "All text should use a font size ≥ 15 pt to support screen magnifiers and prevent visual strain.");
rules.set("MISSING_XLABEL", "plt.xlabel() should not be empty.");
rules.set("MISSING_YLABEL", "plt.ylabel() should not be empty.");
rules.set("MISSING_TITLE", "plt.title() should not be empty. A title helps readers understand the graph's purpose.");
rules.set("MISSING_LEGEND", "plt.legend() must be used when plotting multiple data series.");
rules.set("INSUFFICIENT_COLOR_CONTRAST", "Avoid low-contrast combinations. Use contrast checkers or WCAG-compliant palettes.");
rules.set("ANIMATIONS", "Do not use .animation features or blinking elements in static exports. It can cause cognitive and sensory overload, and disorientation or seizures in sensitive users.");

export { rules };