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
export const SURFACE_TOKENS = Object.freeze({subtle:'customMessageBg',info:'customMessageBg',success:'toolSuccessBg',warning:'toolPendingBg',error:'toolErrorBg'});
export function surfaceRole(value = 'none', fallback = 'none') {
  const role = String(value ?? fallback).toLowerCase();
  if (!['auto','none',...Object.keys(SURFACE_TOKENS)].includes(role)) throw Error('surface must be auto, none, subtle, info, success, warning, or error');
  return role;
}
export function backgroundVisible(background, {theme, colors=true, colorMode='16'}={}) {
  return colors && colorMode !== 'none' && !!SURFACE_TOKENS[background] && (typeof theme?.bg === 'function' || ['256','truecolor'].includes(colorMode));
}
export const SURFACE_PALETTES = Object.freeze({
  dark:{subtle:'#202A36',info:'#202A36',success:'#16352A',warning:'#392F19',error:'#3D232B'},
  light:{subtle:'#F1F3F5',info:'#F1F3F5',success:'#E3F1E5',warning:'#FFF1D6',error:'#FBE8E8'},
});
// Used only outside Pi, or when the host cannot resolve a theme token.
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
export function paint(text,role,{theme,appearance='dark',colorMode='16',colors=true,bold=false,background='none'}={}) {
  if(!colors||colorMode==='none')return text;
  role=tone(role,'text'); let result;
  if(theme?.fg)try{result=theme.fg(ROLE_TOKENS[role],text);}catch{/* Older/missing token: terminal-safe fallback. */}
  if(typeof result!=='string') {
    const hex=(PALETTES[appearance]??PALETTES.dark)[role];
    const code=colorMode==='truecolor'?`38;2;${rgb(hex).join(';')}`:colorMode==='256'?`38;5;${to256(hex)}`:ANSI16[role];
    result=`\x1b[${code}m${text}\x1b[39m`;
  }
  if (backgroundVisible(background,{theme,colors,colorMode})) {
    let shaded;
    if (theme?.bg) try { shaded=theme.bg(SURFACE_TOKENS[background],result); } catch { /* guarded host fallback */ }
    if (typeof shaded === 'string') result=shaded;
    else if (['256','truecolor'].includes(colorMode)) {
      const hex=(SURFACE_PALETTES[appearance]??SURFACE_PALETTES.dark)[background];
      const code=colorMode==='truecolor'?`48;2;${rgb(hex).join(';')}`:`48;5;${to256(hex)}`;
      result=`\x1b[${code}m${result}\x1b[49m`;
    }
  }
  if(bold) {
    if(theme?.bold)try{return theme.bold(result);}catch{}
    return `\x1b[1m${result}\x1b[22m`;
  }
  return result;
}
