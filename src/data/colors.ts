export interface MCColor {
  name: string
  code: string
  hex: string
}

const COLORS_RAW = 'black:0:#000000,dark_blue:1:#0000AA,dark_green:2:#00AA00,dark_aqua:3:#00AAAA,dark_red:4:#AA0000,dark_purple:5:#AA00AA,gold:6:#FFAA00,gray:7:#AAAAAA,dark_gray:8:#555555,blue:9:#5555FF,green:a:#55FF55,aqua:b:#55FFFF,red:c:#FF5555,light_purple:d:#FF55FF,yellow:e:#FFFF55,white:f:#FFFFFF'

export const MC_COLORS: MCColor[] = COLORS_RAW.split(',').map(s => {
  const [name, c, hex] = s.split(':')
  return { name, code: '\u00A7' + c, hex }
})
