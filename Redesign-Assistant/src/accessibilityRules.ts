interface Rule {
    title: string;
    description: string;
}

const rules = new Map<string, Rule>();

rules.set("MISSING_TITLE", {
    title: "WCAG 1.1.1: Graphs must have a title.",
    description: "Clear labeling helps users understand the chart's purpose."
});

rules.set("MISSING_XLABEL", {
    title: "WCAG 1.1.1: Graphs must have an x-label.",
    description: "Clear labeling helps users understand the chart's purpose."
});

rules.set("MISSING_YLABEL", {
    title: "WCAG 1.1.1: Graphs must have a y-label.",
    description: "Clear labeling helps users understand the chart's purpose."
});

rules.set("MISSING_LEGEND", {
    title: "WCAG 1.4.1: Graphs must have a legend when plotting multiple data series.",
    description: "Descriptive legends help distinguish groups, especially when color alone isn't sufficient."
});

rules.set("INSUFFICIENT_COLOR_CONTRAST", {
    title: "WCAG 1.4.3: Colors used must be of high contrast.",
    description: "Users with visual impairments benefit from clear visual separation."
});

rules.set("FONTSIZE_TOO_SMALL", {
    title: "WCAG 1.4.3: Text size must be at least 15 pt.",
    description: "Small text can cause visual strain."
});

rules.set("FIGSIZE_TOO_SMALL", {
    title: "WCAG 1.4.4: 'figsize' must be at least (8,5).",
    description: "Small figures can cause labels/titles to become illegible when zoomed or magnified."
});

rules.set("ANIMATIONS", {
    title: "WCAG 2.3.1: Avoid animations.",
    description: "Do not use .animation features or blinking elements in static exports. Animations can cause cognitive and sensory overload, and disorientation or seizures in sensitive users."
});

export { rules };