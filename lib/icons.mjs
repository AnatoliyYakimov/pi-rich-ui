/** Text-presentation glyphs: Nerd Font Material Design when the terminal has it, plain Unicode otherwise. */
const md = cp => String.fromCodePoint(cp);
const GLYPHS = {
  db:[0xF01BC,'▤'], lock:[0xF033E,'▣'], unlock:[0xF033F,'□'], key:[0xF0306,'⚿'], shield:[0xF0565,'◈'],
  user:[0xF0004,'◉'], team:[0xF0849,'◎'], server:[0xF048B,'▣'], cloud:[0xF015F,'☁'], net:[0xF0317,'◇'],
  web:[0xF059F,'◍'], api:[0xF109B,'⇄'], cpu:[0xF0EE0,'▦'], mem:[0xF035B,'▥'], disk:[0xF02CA,'▭'],
  k8s:[0xF10FE,'⎈'], docker:[0xF0868,'▦'], kafka:[0xF100F,'≋'], queue:[0xF1296,'≋'], pipe:[0xF07E5,'═'],
  branch:[0xF062C,'⑂'], git:[0xF02A2,'⑂'], github:[0xF02A4,'⑂'], gitlab:[0xF0BA0,'⑂'], pkg:[0xF03D6,'▧'],
  code:[0xF0174,'⌘'], term:[0xF018D,'›'], fn:[0xF0871,'ƒ'], test:[0xF0668,'⚗'], bug:[0xF00E4,'✱'],
  tools:[0xF1323,'⚒'], cfg:[0xF0493,'⚙'], rocket:[0xF14DE,'➚'], bot:[0xF06A9,'◘'], ai:[0xF09D1,'✦'],
  java:[0xF0B37,'J'], kotlin:[0xF1219,'K'], python:[0xF0320,'P'], ts:[0xF06E6,'T'], js:[0xF031E,'J'],
  go:[0xF07D3,'G'], npm:[0xF06F7,'n'],
  dir:[0xF024B,'▱'], file:[0xF0219,'▯'], link:[0xF0339,'↗'], tag:[0xF04F9,'#'], filter:[0xF0232,'⏷'],
  search:[0xF0349,'⌕'], table:[0xF04EB,'▦'], layers:[0xF0328,'≡'], tree:[0xF04AA,'⊢'], graph:[0xF1049,'◇'],
  chart:[0xF0128,'▥'], trend:[0xF012A,'↗'], todo:[0xF0756,'☰'], history:[0xF02DA,'↺'], cube:[0xF01A7,'◫'],
  puzzle:[0xF0431,'⊞'], idea:[0xF06E9,'✧'], flag:[0xF023B,'⚑'], eye:[0xF0208,'◉'], edit:[0xF03EB,'✎'],
  del:[0xF01B4,'⌫'], plus:[0xF0415,'+'], minus:[0xF0374,'−'],
  ok:[0xF012C,'✓'], x:[0xF0156,'✗'], cancel:[0xF073A,'⊘'], warn:[0xF0026,'!'], info:[0xF02FC,'i'],
  help:[0xF02D7,'?'], bell:[0xF009A,'♪'], mail:[0xF01EE,'✉'], msg:[0xF0361,'✉'], star:[0xF04CE,'☆'],
  heart:[0xF02D1,'♡'], like:[0xF0513,'+'], dislike:[0xF0511,'−'], bolt:[0xF0241,'ϟ'],
  clock:[0xF0150,'◷'], timer:[0xF051B,'◴'], cal:[0xF00ED,'▦'], sync:[0xF04E6,'⇆'], refresh:[0xF0450,'↻'],
  play:[0xF040A,'▶'], pause:[0xF03E4,'‖'], stop:[0xF04DB,'■'],
  home:[0xF02DC,'⌂'], org:[0xF01D7,'▥'], pin:[0xF034E,'⌖'], globe:[0xF01E7,'◍'],
  usd:[0xF01C1,'$'], cash:[0xF0114,'$'], card:[0xF0FEF,'▭'], bank:[0xF0070,'⌂'], wallet:[0xF0584,'▭'],
  cart:[0xF0110,'⊔'],
  dot:['●','●'], right:['→','→'], left:['←','←'], up:['↑','↑'], down:['↓','↓'],
};
/** Earlier long names keep rendering. */
const ALIASES = {
  database:'db', settings:'cfg', folder:'dir', check:'ok', success:'ok', close:'x', error:'x',
  alert:'warn', warning:'warn', network:'net', 'arrow-right':'right', 'arrow-left':'left',
  'arrow-down':'down', 'arrow-up':'up',
};
const glyph = value => typeof value === 'number' ? md(value) : value;
export const NERD_ICONS = Object.freeze(Object.fromEntries(Object.entries(GLYPHS).map(([name, [nerd]]) => [name, glyph(nerd)])));
export const UNICODE_ICONS = Object.freeze(Object.fromEntries(Object.entries(GLYPHS).map(([name, [, plain]]) => [name, plain])));
export const ICONS = UNICODE_ICONS;
export const ICON_NAMES = Object.freeze(Object.keys(GLYPHS));
const NERD_TERMINALS = ['iterm', 'wezterm', 'kitty', 'ghostty', 'alacritty', 'kaku'];
/** Same heuristic as pi-powerline-footer, so both extensions agree on Nerd Font support. */
export function detectIconSet(env) {
  if (['nerd', 'unicode'].includes(env.PI_RICH_UI_ICONS)) return env.PI_RICH_UI_ICONS;
  if (env.POWERLINE_NERD_FONTS === '1') return 'nerd';
  if (env.POWERLINE_NERD_FONTS === '0') return 'unicode';
  if (env.GHOSTTY_RESOURCES_DIR) return 'nerd';
  const term = String(env.TERM_PROGRAM ?? env.TERM ?? '').toLowerCase();
  return NERD_TERMINALS.some(t => term.includes(t)) ? 'nerd' : 'unicode';
}
let active = UNICODE_ICONS;
export function setIconSet(set) { active = set === 'nerd' ? NERD_ICONS : UNICODE_ICONS; return set === 'nerd' ? 'nerd' : 'unicode'; }
export const icon = name => {
  const key = String(name ?? '').toLowerCase();
  return active[ALIASES[key] ?? key] ?? '•';
};
export const statusIcon=role=>({success:'✓',error:'✗',warning:'!',info:'i',accent:'◆',muted:'○',dim:'○',text:'○'})[role]??'●';
