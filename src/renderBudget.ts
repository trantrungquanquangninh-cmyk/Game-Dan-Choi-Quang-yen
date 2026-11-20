export const STATIC_UPDATE_MS=100;
export type Bounds={x:number;y:number;width:number;height:number};
export function withinView(object:Bounds,view:Bounds,padding=160){return object.x+object.width>=view.x-padding&&object.x<=view.x+view.width+padding&&object.y+object.height>=view.y-padding&&object.y<=view.y+view.height+padding}
