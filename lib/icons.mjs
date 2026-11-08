/** Text-presentation glyphs only: no emoji / Nerd Font dependency. */
export const ICONS=Object.freeze({
  check:'✓',success:'✓',close:'✗',error:'✗',alert:'!',warning:'!',info:'i',help:'?',
  database:'▤',server:'▣',network:'◇',queue:'≋',cloud:'☁',code:'⌘',branch:'⑂',
  clock:'◷',timer:'◴',chart:'▥',bolt:'ϟ',lock:'▣',key:'⚿',search:'⌕',
  star:'☆',heart:'♡',settings:'⚙',folder:'▱',file:'▯',link:'↗',refresh:'↻',
  play:'▶',pause:'‖',stop:'■',dot:'●','arrow-right':'→','arrow-left':'←','arrow-down':'↓','arrow-up':'↑',
});
export const icon=name=>ICONS[String(name??'').toLowerCase()]??'•';
export const statusIcon=role=>({success:'✓',error:'✗',warning:'!',info:'i',accent:'◆',muted:'○',dim:'○',text:'○'})[role]??'●';
