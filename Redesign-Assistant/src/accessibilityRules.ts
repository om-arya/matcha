interface Rule {
    title: string;
    description: string;
}

const rules = new Map<string, Rule>();

rules.set("MISSING_TITLE", {
    title: "Missing title",
    description: "A missing title causes your graph's purpose to be ambiguous."
});

rules.set("MISSING_XLABEL", {
    title: "Missing x-label",
    description: "A missing x-label causes your graph's dependent variable to be unknown."
});

rules.set("MISSING_YLABEL", {
    title: "Missing y-label",
    description: "A missing y-label causes your graph's independent variable to be unknown."
});

rules.set("MISSING_LEGEND", {
    title: "Missing legend (plotting multiple data series)",
    description: "A missing legend causes ambiguity in what your graph's data series represent."
});

rules.set("FONTSIZE_TOO_SMALL", {
    title: "Text size under 15 pt",
    description: "Small text can cause visual strain."
});

rules.set("FIGSIZE_TOO_SMALL", {
    title: "'figsize' under (8,5).",
    description: "Small figures can cause labels/titles to become illegible when zoomed or magnified."
});

rules.set("INSUFFICIENT_COLOR_CONTRAST", {
    title: "Low-contrast color combinations",
    description: "Low-contrast color combinations can cause visual strain or confusion for colorblind readers. Use contrast checkers or WCAG-compliant palettes."
});

rules.set("ANIMATIONS", {
    title: "Animations",
    description: "Do not use .animation features or blinking elements in static exports. Animations can cause cognitive and sensory overload, and disorientation or seizures in sensitive readers."
});

export { rules };