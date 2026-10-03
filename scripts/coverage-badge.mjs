import { readFileSync, writeFileSync } from "node:fs";

const summary = JSON.parse(
  readFileSync("coverage/coverage-summary.json", "utf8"),
);
const pct = summary.total?.lines?.pct;
if (typeof pct !== "number") {
  throw new Error("coverage/coverage-summary.json has no total.lines.pct");
}

const value = `${Math.round(pct)}%`;
const color =
  pct >= 90 ? "#4c1" : pct >= 80 ? "#97ca00" : pct >= 70 ? "#dfb317" : pct >= 60 ? "#fe7d37" : "#e05d44";

const label = "coverage";
const labelWidth = textWidth(label) + 10;
const valueWidth = textWidth(value) + 10;
const width = labelWidth + valueWidth;
const labelTextLength = (labelWidth - 10) * 10;
const valueTextLength = (valueWidth - 10) * 10;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${label}: ${value}">
<title>${label}: ${value}</title>
<linearGradient id="coverage-smooth" x2="0" y2="100%">
<stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
<stop offset="1" stop-opacity=".1"/>
</linearGradient>
<clipPath id="coverage-round">
<rect width="${width}" height="20" rx="3" fill="#fff"/>
</clipPath>
<g clip-path="url(#coverage-round)">
<rect width="${labelWidth}" height="20" fill="#555"/>
<rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
<rect width="${width}" height="20" fill="url(#coverage-smooth)"/>
</g>
<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
<text aria-hidden="true" x="${labelWidth * 5}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${labelTextLength}">${label}</text>
<text x="${labelWidth * 5}" y="140" transform="scale(.1)" fill="#fff" textLength="${labelTextLength}">${label}</text>
<text aria-hidden="true" x="${(labelWidth + valueWidth / 2) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${valueTextLength}">${value}</text>
<text x="${(labelWidth + valueWidth / 2) * 10}" y="140" transform="scale(.1)" fill="#fff" textLength="${valueTextLength}">${value}</text>
</g>
</svg>
`;

writeFileSync(".github/badges/coverage.svg", svg);

function textWidth(text) {
  const widths = {
    "%": 11,
    " ": 4,
    a: 7,
    b: 7,
    c: 6,
    d: 7,
    e: 7,
    f: 4,
    g: 7,
    o: 7,
    r: 4,
    v: 6,
    0: 7,
    1: 6,
    2: 7,
    3: 7,
    4: 7,
    5: 7,
    6: 7,
    7: 7,
    8: 7,
    9: 7,
  };
  let width = 0;
  for (const char of text) width += widths[char] ?? 7;
  return width;
}
