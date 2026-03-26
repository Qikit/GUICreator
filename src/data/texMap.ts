const _c = ['white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray', 'light_gray', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black']

export const TEX_MAP: Record<string, string> = (() => {
  const m: Record<string, string> = {}
  _c.forEach(c => { m[c + '_stained_glass_pane'] = 'block/' + c + '_stained_glass.png' })
  m.glass_pane = 'block/glass_pane_top.png'
  m.crossbow = 'item/crossbow_standby.png'; m.compass = 'item/compass_00.png'; m.clock = 'item/clock_00.png'
  m.enchanted_golden_apple = 'item/golden_apple.png'; m.sunflower = 'block/sunflower_front.png'
  m.shield = 'entity/shield_base_nopattern.png'
  m.tnt = 'block/tnt_side.png'; m.crafting_table = 'block/crafting_table_front.png'
  m.furnace = 'block/furnace_front.png'; m.blast_furnace = 'block/blast_furnace_front.png'
  m.smoker = 'block/smoker_front.png'; m.dispenser = 'block/dispenser_front.png'; m.dropper = 'block/dropper_front.png'
  m.observer = 'block/observer_front.png'; m.lectern = 'block/lectern_front.png'
  m.loom = 'block/loom_front.png'; m.smithing_table = 'block/smithing_table_front.png'
  m.fletching_table = 'block/fletching_table_front.png'; m.cartography_table = 'block/cartography_table_top.png'
  m.barrel = 'block/barrel_top.png'; m.jukebox = 'block/jukebox_top.png'
  m.stonecutter = 'block/stonecutter_top.png'; m.composter = 'block/composter_top.png'
  m.command_block = 'block/command_block_front.png'; m.chain_command_block = 'block/chain_command_block_front.png'
  m.repeating_command_block = 'block/repeating_command_block_front.png'
  m.enchanting_table = 'block/enchanting_table_top.png'; m.structure_block = 'block/structure_block.png'
  m.jigsaw = 'block/jigsaw.png'; m.piston = 'block/piston_side.png'; m.sticky_piston = 'block/piston_side.png'
  m.respawn_anchor = 'block/respawn_anchor_top.png'; m.lodestone = 'block/lodestone_top.png'
  m.crafter = 'block/crafter_east_crafting.png'; m.beehive = 'block/beehive_front.png'; m.bee_nest = 'block/bee_nest_front.png'
  m.carved_pumpkin = 'block/carved_pumpkin.png'; m.jack_o_lantern = 'block/jack_o_lantern.png'
  m.snow = 'block/snow.png'; m.sculk_sensor = 'block/sculk_sensor_top.png'
  m.calibrated_sculk_sensor = 'block/calibrated_sculk_sensor_top.png'
  m.trial_spawner = 'block/trial_spawner_side_inactive.png'; m.vault = 'block/vault_front_off.png'
  m.scaffolding = 'block/scaffolding_top.png'; m.note_block = 'block/note_block.png'
  m.target = 'block/target_top.png'; m.daylight_detector = 'block/daylight_detector_top.png'
  return m
})()

export const CSS_FB: Record<string, string> = {
  chest: '#A06F28', ender_chest: '#0B3B37', trapped_chest: '#A06F28',
  player_head: '#C4A57B', skeleton_skull: '#C8C8C8', zombie_head: '#5B8B4C',
  creeper_head: '#5B9B3F', piglin_head: '#D4A74F', dragon_head: '#1B1B1B', wither_skeleton_skull: '#3B3B3B',
  white_bed: '#E8E8E8', orange_bed: '#E07020', magenta_bed: '#C040C0', light_blue_bed: '#60A0E0',
  yellow_bed: '#E0E020', lime_bed: '#60C020', pink_bed: '#E890A0', gray_bed: '#606060',
  light_gray_bed: '#A0A0A0', cyan_bed: '#20A0A0', purple_bed: '#8020C0', blue_bed: '#3040C0',
  brown_bed: '#805030', green_bed: '#406020', red_bed: '#C02020', black_bed: '#202020',
  conduit: '#A08050', decorated_pot: '#B09070',
}
