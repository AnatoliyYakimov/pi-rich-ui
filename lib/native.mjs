import { renderDocument } from './render.mjs';
import { glyphWidth } from './surface.mjs';
/** Native ANSI only. No SVG/PNG, external dependencies, image protocols or stdout writes. */
export class NativeRenderer {
  constructor(tui,{getTheme=()=>undefined,colors=true,colorMode='16'}={}) {
    this.tui=tui;this.getTheme=getTheme;this.colors=colors;this.colorMode=colorMode;
  }
  render(xml,width,{theme=this.getTheme()}={}) {
    const measure=this.tui.visibleWidth?g=>this.tui.visibleWidth(g):glyphWidth;
    return renderDocument(xml,width,{measure,monochrome:!this.colors||this.colorMode==='none'})
      .ansi({theme,appearance:theme?.appearance??'dark',colors:this.colors,colorMode:this.colorMode});
  }
  clear(){} // Only ASTs are cached; theme and terminal width always come from the host.
}
