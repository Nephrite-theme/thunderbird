// Generates each flavor's Thunderbird theme manifest from palette.json.
// Usage: node scripts/sync-palette.mjs && node scripts/build.mjs
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const VERSION = "0.1";
const root = new URL("../", import.meta.url);
const palette = JSON.parse(readFileSync(new URL("palette.json", root)));

// Thunderbird surfaces mapped to palette roles (see the palette's porting
// guide). Only keys Thunderbird documents for themes are used.
const ROLES = {
	// Window frame and tabs
	frame: "mantle",
	frame_inactive: "crust",
	tab_selected: "base",
	tab_text: "text",
	tab_background_text: "subtext",
	tab_background_separator: "surface1",
	tab_line: "jade",
	tab_loading: "jade",
	// Toolbars and icons
	toolbar: "base",
	toolbar_text: "text",
	toolbar_bottom_separator: "crust",
	icons: "subtext",
	icons_attention: "jade",
	button_background_hover: "surface1",
	button_background_active: "surface2",
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
	popup_border: "surface0",
	popup_highlight: "surface1",
	popup_highlight_text: "text",
	// Folder pane and message list: Thunderbird calls its trees "sidebar"
	sidebar: "base",
	sidebar_text: "text",
	sidebar_border: "surface0",
	sidebar_highlight: "surface1",
	sidebar_highlight_text: "text",
	sidebar_highlight_border: "jade",
};

const ICONS = ["icon16.png", "icon48.png", "icon128.png"];

for (const [key, flavor] of Object.entries(palette.flavors)) {
	const dir = new URL(`themes/Nephrite ${flavor.name}/`, root);
	mkdirSync(new URL("icons/", dir), { recursive: true });
	// The package only contains its own folder, so each flavor gets its icons.
	for (const icon of ICONS) {
		copyFileSync(new URL(`icons/${icon}`, root), new URL(`icons/${icon}`, dir));
	}

	const colors = Object.fromEntries(
		Object.entries(ROLES).map(([surface, role]) => [surface, flavor.colors[role]]),
	);
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
const used = new Set(Object.values(ROLES));
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
