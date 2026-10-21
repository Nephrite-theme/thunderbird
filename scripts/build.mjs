// Generates each flavor's Thunderbird theme manifest from palette.json.
// Usage: node scripts/sync-palette.mjs && node scripts/build.mjs
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const VERSION = "0.1";
const root = new URL("../", import.meta.url);
const palette = JSON.parse(readFileSync(new URL("palette.json", root)));

// Thunderbird surfaces mapped to palette roles (see the palette's porting
// guide). These are the documented theme keys.
const ROLES = {
	// Window frame and tabs
	frame: "crust",
	frame_inactive: "crust",
	tab_selected: "mantle",
	tab_text: "text",
	tab_background_text: "subtext",
	tab_background_separator: "surface1",
	tab_line: "jade",
	tab_loading: "jade",
	// Toolbars and icons; the message header uses the toolbar color too
	toolbar: "mantle",
	toolbar_text: "text",
	toolbar_top_separator: "crust",
	toolbar_bottom_separator: "surface0",
	toolbar_vertical_separator: "surface1",
	icons: "subtext",
	icons_attention: "jade",
	button_background_hover: "surface0",
	button_background_active: "surface1",
	// Search and other toolbar fields
	toolbar_field: "surface0",
	toolbar_field_text: "text",
	toolbar_field_border: "surface1",
	toolbar_field_focus: "surface0",
	toolbar_field_text_focus: "text",
	toolbar_field_border_focus: "jade",
	toolbar_field_highlight: "jade",
	toolbar_field_highlight_text: "base",
	// Menus and dropdowns
	popup: "mantle",
	popup_text: "text",
	popup_border: "surface1",
	popup_highlight: "surface1",
	popup_highlight_text: "text",
	// Folder pane and message list: Thunderbird calls its trees "sidebar".
	// The highlight is also Thunderbird's accent (--selected-item-color), so
	// it drives primary buttons, toggles, focus rings and selected cards.
	sidebar: "mantle",
	sidebar_text: "text",
	sidebar_border: "surface0",
	sidebar_highlight: "jade",
	sidebar_highlight_text: "base",
	sidebar_highlight_border: "jade",
};

// Everything the documented keys can't reach (the spaces bar, message cards,
// folder icons, badges, the blue accent) is drawn from Thunderbird's own CSS
// variables. A theme experiment sets them on the root of every themed
// document, so they replace the defaults without any extra stylesheet.
// Variables come from mail/themes/shared/mail in thunderbird-desktop.
const EXPERIMENT = {
	// Layout tokens (layout.css): the base every pane is built from
	"--layout-background-0": "base",
	"--layout-background-1": "mantle",
	"--layout-background-2": "surface0",
	"--layout-background-3": "surface1",
	"--layout-background-4": "surface2",
	"--layout-color-0": "text",
	"--layout-color-1": "text",
	"--layout-color-2": "subtext",
	"--layout-color-3": "overlay1",
	"--layout-border-0": "surface0",
	"--layout-border-1": "surface1",
	"--layout-border-2": "surface2",
	// Design tokens (colors.css) that replace Thunderbird's blue and grays
	"--color-primary-default": "jade",
	"--color-primary-hover": "mint",
	"--color-primary-pressed": "jade",
	"--color-primary-soft": "surface0",
	"--color-surface-base": "base",
	"--color-surface-raised": "surface0",
	"--color-surface-subtle": "mantle",
	"--color-surface-lower": "crust",
	"--color-surface-deep": "surface1",
	"--color-surface-border": "surface1",
	"--color-surface-border-intense": "surface2",
	"--color-text-base": "text",
	"--color-text-secondary": "subtext",
	"--color-text-muted": "overlay1",
	"--color-text-brand": "jade",
	"--color-text-highlight": "jade",
	"--color-text-success": "jade",
	"--color-text-warning": "citrine",
	"--color-text-critical": "garnet",
	"--color-accent-blue": "sapphire",
	"--color-accent-teal": "lagoon",
	"--color-accent-purple": "amethyst",
	"--color-accent-orange": "carnelian",
	"--color-accent-pink": "rhodonite",
	"--link-color": "jade",
	"--link-color-hover": "mint",
	"--link-color-active": "jade",
	"--button-link-text-color": "jade",
	"--button-link-active-text-color": "mint",
	// Spaces bar on the far left (spacesToolbar.css)
	"--spaces-bg-color": "crust",
	"--spaces-button-active-bg-color": "jade",
	"--spaces-button-active-text-color": "base",
	"--spaces-button-badge-bg-color": "garnet",
	"--spaces-button-badge-text-color": "base",
	"--tabs-toolbar-background-color": "crust",
	// Message list (tree-listbox.css, threadCard.css, threadPane.css)
	"--tree-view-bg": "mantle",
	"--tree-pane-background": "mantle",
	"--tree-card-background": "base",
	"--tree-card-border": "surface0",
	"--new-subject-color": "jade",
	"--new-color": "jade",
	"--thread-line-color": "overlay0",
	"--thread-pane-unread-fill": "jade",
	"--thread-pane-unread-stroke": "jade",
	"--thread-pane-flag-fill": "carnelian",
	"--thread-pane-flag-stroke": "carnelian",
	"--thread-pane-spam-fill": "garnet",
	"--thread-pane-spam-stroke": "garnet",
	// Folder pane counters (about3Pane.css)
	"--folderpane-unread-count-background": "subtext",
	"--folderpane-unread-count-text": "base",
	"--folderpane-unread-new-count-background": "jade",
	"--folderpane-total-count-background": "surface1",
	"--folderpane-total-count-text": "text",
	// Folder icons (folderColors.css), one palette accent per folder type
	"--folder-color-inbox": "jade",
	"--folder-color-draft": "amethyst",
	"--folder-color-sent": "mint",
	"--folder-color-archive": "carnelian",
	"--folder-color-spam": "garnet",
	"--folder-color-trash": "subtext",
	"--folder-color-template": "subtext",
	"--folder-color-newsletter": "subtext",
	"--folder-color-rss": "carnelian",
	"--folder-color-outbox": "lagoon",
	"--folder-color-folder": "citrine",
	"--folder-color-folder-filter": "rhodonite",
	"--folder-color-folder-rss": "carnelian",
	"--folder-color-warning": "garnet",
	"--new-folder-color": "jade",
	// Message header avatars (messageHeader.css)
	"--recipient-avatar-background-color": "surface1",
	"--recipient-avatar-color": "subtext",
};

// The whole palette as --nephrite-<role>, for theme/nephrite.css.
for (const role of [...palette.neutrals, ...palette.accents]) {
	EXPERIMENT[`--nephrite-${role}`] = role;
}

// Theme experiment keys are plain names, one per CSS variable.
const experimentKey = (variable) =>
	`nephrite_${variable.slice(2).replace(/^nephrite-/, "").replaceAll("-", "_")}`;

// A few widgets set their colors on their own element instead of :root, so
// the variables above can't reach them. This stylesheet covers those, using
// the --nephrite-* variables, so one file serves every flavor.
const STYLESHEET = "nephrite.css";

const ICONS = ["icon16.png", "icon48.png", "icon128.png"];

for (const [key, flavor] of Object.entries(palette.flavors)) {
	const dir = new URL(`themes/Nephrite ${flavor.name}/`, root);
	mkdirSync(new URL("icons/", dir), { recursive: true });
	// The package only contains its own folder, so each flavor gets its icons.
	for (const icon of ICONS) {
		copyFileSync(new URL(`icons/${icon}`, root), new URL(`icons/${icon}`, dir));
	}
	copyFileSync(new URL(`theme/${STYLESHEET}`, root), new URL(STYLESHEET, dir));

	const colors = Object.fromEntries([
		...Object.entries(ROLES).map(([surface, role]) => [surface, flavor.colors[role]]),
		...Object.entries(EXPERIMENT).map(([variable, role]) => [
			experimentKey(variable),
			flavor.colors[role],
		]),
	]);
	const scheme = flavor.dark ? "dark" : "light";

	const manifest = {
		manifest_version: 3,
		name: `Nephrite ${flavor.name}`,
		version: VERSION,
		description: `A calm, jade-inspired theme for Thunderbird. ${flavor.name} flavor of the Nephrite palette.`,
		homepage_url: "https://getnephrite.dev",
		icons: { 16: "icons/icon16.png", 48: "icons/icon48.png", 128: "icons/icon128.png" },
		browser_specific_settings: {
			gecko: {
				// A fixed ID keeps updates tied to the same listing. It differs
				// from the Firefox theme's so the two never collide.
				id: `nephrite-${key}-thunderbird@getnephrite.dev`,
				strict_min_version: "128.0",
			},
		},
		theme_experiment: {
			stylesheet: STYLESHEET,
			colors: Object.fromEntries(
				Object.keys(EXPERIMENT).map((variable) => [experimentKey(variable), variable]),
			),
		},
		theme: {
			colors,
			// Menus and message content follow the flavor's lightness.
			properties: { color_scheme: scheme, content_color_scheme: scheme },
		},
	};

	writeFileSync(new URL("manifest.json", dir), `${JSON.stringify(manifest, null, 2)}\n`);
	console.log(`${key}: themes/Nephrite ${flavor.name}/manifest.json v${VERSION}`);
}

// README swatches: only the palette colors this port actually uses, in
// palette order, so the preview never promises colors the theme skips.
const used = new Set([...Object.values(ROLES), ...Object.values(EXPERIMENT)]);
const usedKeys = [...palette.neutrals, ...palette.accents].filter((k) => used.has(k));
mkdirSync(new URL("assets/", root), { recursive: true });
for (const [key, flavor] of Object.entries(palette.flavors)) {
	const c = flavor.colors;
	const size = 44;
	const gap = 10;
	const pad = 14;
	const w = pad * 2 + usedKeys.length * size + (usedKeys.length - 1) * gap;
	const h = pad * 2 + size + 22;
	const cells = usedKeys
		.map((k, i) => {
			const x = pad + i * (size + gap);
			return `<rect x="${x}" y="${pad}" width="${size}" height="${size}" rx="10" fill="${c[k]}" stroke="${c.surface1}" stroke-width="1"/><text x="${x + size / 2}" y="${pad + size + 16}" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="9" fill="${c.subtext}">${k}</text>`;
		})
		.join("");
	writeFileSync(
		new URL(`assets/${key}.svg`, root),
		`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" rx="14" fill="${c.base}"/>${cells}</svg>\n`,
	);
}
console.log(`swatches: ${usedKeys.length} colors (${usedKeys.join(", ")})`);
