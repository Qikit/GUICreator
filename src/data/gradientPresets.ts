export interface GradientPreset {
  name: string
  colors: string[]
  text: string
}

export const GRAD_PRESETS: GradientPreset[] = [
  { name: 'Огонь', colors: ['#FF0000', '#FF6600', '#FFFF00'], text: 'Огненный текст' },
  { name: 'Океан', colors: ['#0066FF', '#00CCFF', '#00FFCC'], text: 'Глубины океана' },
  { name: 'Закат', colors: ['#FF0000', '#FF6600', '#FF00FF'], text: 'Закат солнца' },
  { name: 'Радуга', colors: ['#FF0000', '#FF7700', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'], text: 'Радужный текст' },
  { name: 'Лёд', colors: ['#00FFFF', '#0088FF', '#FFFFFF'], text: 'Ледяной текст' },
  { name: 'Оригинальный', colors: ['#4498DB', '#DB44C5', '#DB8044'], text: 'Оригинальный предмет' },
  { name: 'Легендарный', colors: ['#ADFF00', '#CEC700', '#FF7400'], text: 'Легендарный' },
  { name: 'Призрачный', colors: ['#737373', '#362F2F'], text: 'Призрачный предмет' },
  { name: 'Дьявольский', colors: ['#C41010', '#362F2F', '#C41010'], text: 'Талисман Дьявола' },
  { name: 'Мистический', colors: ['#950000', '#FF0000', '#950000'], text: 'Мистический огонь' },
  { name: 'Изумрудный', colors: ['#00AA00', '#55FF55', '#FFFFFF'], text: 'Изумрудный блеск' },
  { name: 'Золотой', colors: ['#FF6600', '#FFC155', '#FFFFE6'], text: 'Золотая надпись' },
  { name: 'Неоновый', colors: ['#FF00FF', '#00FFFF', '#FF00FF'], text: 'Неоновая вывеска' },
  { name: 'Кровавый', colors: ['#8D0000', '#FF0000', '#8D0000'], text: 'Кровавый клинок' },
]
