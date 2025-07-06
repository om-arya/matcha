interface Rule {
    title: string;
    description: string;
}

const rules = new Map<string, Rule>();

// Accessibility rules

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

// "Misleading" rules

rules.set("INVERTED_Y_AXIS", {
    title: "Do not use an inverted y-axis.",
    description: "Y-axes that go from top to bottom (instead of bottom to top) can make increases look like decreases, flipping the meaning of the data."
});

rules.set("TRUNCATED_Y_AXIS", {
    title: "Do not truncate the y-axis.",
    description: "Y-axes that go from top to bottom (instead of bottom to top) can make increases look like decreases, flipping the meaning of the data."
});

rules.set("3D_EFFECTS", {
    title: "Do not use 3D effects.",
    description: "Adding depth to charts (like in 3D pie charts) can skew proportions and make certain slices look larger just because of how they’re angled."
});

rules.set("TAMPERED_ASPECT_RATIO", {
    title: "Do not stretch or squish the aspect ratio.",
    description: "Changing the shape of the graph (tall vs. wide) alters the slope and exaggerates trends that aren't really that steep."
});

rules.set("DUAL_Y_AXES", {
    title: "Do not use two different y-axes.",
    description: "Graphs that use two different y-axes with different scales can create fake correlations between lines that don’t actually relate."
});

rules.set("BIASED_TITLE", {
    title: "Do not use a biased or slanted title.",
    description: "This steers viewers’ interpretation before they even analyze the data."
});

rules.set("MISLEADING_ANNOTATIONS", {
    title: "Do not fabricate causal relationships.",
    description: "This misleads the viewer."
});

export { rules };