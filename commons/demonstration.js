import {tiny, defs} from './common.js';
const { vec3, vec4, color, Mat4, Shape, Material, Shader, Texture, Component } = tiny;


export class Demonstration extends Component
{
  render_layout( div, options = {} )
    {
      this.div = div;
      div.className = "documentation_treenode";
      div.style.margin = "auto";
      div.style.width = "1080px";

      const rules = [
        `.documentation-big { width:1030px; padding:0 25px; font-size: 29px; font-family: Arial`,
        `.documentation-big-top { padding: 30px 25px }`
        ];
      Component.initialize_CSS( Demonstration, rules );

      const region_1 = div.appendChild( document.createElement( "div" ) );
      region_1.classList.add( "documentation", "documentation-big", "documentation-big-top" );

      region_1.appendChild( document.createElement("p") ).textContent =
        `Demo`
    }
}