import { attr, label } from './nodes.mjs';
import { ownTone } from './theme.mjs';
import { richText } from './rich-text.mjs';
/** A labeled relationship between neighboring composition areas, not a routing engine. */
export function renderConnector(node,width,ctx) {
  const direction=attr(node,'direction','down'),arrows={down:'↓',up:'↑',both:'⇅'};
  if(!Object.hasOwn(arrows,direction))throw Error('Connector direction must be down, up, or both');
  const text=arrows[direction]+(label(node)?'  '+label(node):'');
  return richText({tag:'caption',attrs:{align:'center'},children:[text]},width,ctx,{role:ownTone(node)??'muted'});
}
