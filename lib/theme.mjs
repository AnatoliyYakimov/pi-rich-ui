/** Semantic roles, not arbitrary CSS. Pi owns actual hues and terminal color depth. */
export const ROLE_TOKENS = Object.freeze({
  text:'text', accent:'accent', success:'success', error:'error', warning:'warning',
  info:'mdLink', purple:'syntaxKeyword', cyan:'mdCode', muted:'muted', dim:'dim', border:'borderMuted',
});
export const ALIASES = Object.freeze({
  green:'success', positive:'success', red:'error', danger:'error', negative:'error',
  yellow:'warning', orange:'warning', blue:'info', violet:'purple', magenta:'purple',
  teal:'cyan', gray:'muted', grey:'muted', neutral:'text', default:'text',
});
export const SEMANTIC_ROLES = Object.freeze(Object.keys(ROLE_TOKENS));
export function tone(value, fallback='accent') {
  const key=String(value??'').trim().toLowerCase(), normalized=ALIASES[key]??key;
  return Object.hasOwn(ROLE_TOKENS,normalized)?normalized:(Object.hasOwn(ROLE_TOKENS,fallback)?fallback:'accent');
}
export function ownTone(node) {
  const a=node?.attrs;
  return a && (a.tone!==undefined || a.color!==undefined)?tone(a.tone??a.color):undefined;
}
export function roleOf(node,context={},fallback='accent') {return ownTone(node)??context.tone??fallback;}
// Used only outside Pi, or when the host cannot resolve a theme token. No background is painted.
export const PALETTES = Object.freeze({
  dark:{text:'#E5EDF7',muted:'#A5B4C8',dim:'#718096',border:'#66758A',accent:'#7DD3FC',success:'#86EFAC',warning:'#FCD34D',error:'#FDA4AF',info:'#93C5FD',purple:'#C4B5FD',cyan:'#67E8F9'},
  light:{text:'#142438',muted:'#52667D',dim:'#65758C',border:'#728095',accent:'#0369A1',success:'#15803D',warning:'#946200',error:'#BE123C',info:'#1D4ED8',purple:'#7E22CE',cyan:'#0E7490'},
});
const ANSI16={text:39,muted:90,dim:90,border:90,accent:36,success:32,error:31,warning:33,info:34,purple:35,cyan:36};
export function detectColorMode(env=process.env) {
  if(Object.hasOwn(env,'NO_COLOR') || env.PI_RICH_UI_COLORS==='none' || env.TERM==='dumb')return 'none';
  if(['16','256','truecolor'].includes(env.PI_RICH_UI_COLORS))return env.PI_RICH_UI_COLORS;
  if(/truecolor|24bit/i.test(env.COLORTERM??''))return 'truecolor';
  if(/256color/i.test(env.TERM??''))return '256';
  return '16';
}
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
function to256(hex) {
  const [r,g,b]=rgb(hex),cube=[r,g,b].map(v=>Math.round(v/255*5));
  const cubeRGB=cube.map(x=>x===0?0:55+40*x),ci=16+36*cube[0]+6*cube[1]+cube[2];
  const gray=Math.max(0,Math.min(23,Math.round(((r+g+b)/3-8)/10))),gv=8+10*gray;
  return [r,g,b].reduce((s,v)=>s+(v-gv)**2,0)<[r,g,b].reduce((s,v,i)=>s+(v-cubeRGB[i])**2,0)?232+gray:ci;
}
export function paint(text,role,{theme,appearance='dark',colorMode='16',colors=true,bold=false}={}) {
  if(!colors||colorMode==='none')return text;
  role=tone(role,'text'); let result;
  if(theme?.fg)try{result=theme.fg(ROLE_TOKENS[role],text);}catch{/* Older/missing token: terminal-safe fallback. */}
  if(typeof result!=='string') {
    const hex=(PALETTES[appearance]??PALETTES.dark)[role];
    const code=colorMode==='truecolor'?`38;2;${rgb(hex).join(';')}`:colorMode==='256'?`38;5;${to256(hex)}`:ANSI16[role];
    result=`\x1b[${code}m${text}\x1b[39m`;
  }
  if(bold) {
    if(theme?.bold)try{return theme.bold(result);}catch{}
    return `\x1b[1m${result}\x1b[22m`;
  }
  return result;
}
