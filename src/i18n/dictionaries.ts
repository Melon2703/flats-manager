const ru = {
  appName: "Управление арендой",
  description: "Простое пространство для управления арендой.",
  welcome: "Всё начинается с простого.",
  introduction: "Здесь будет удобно вести учёт аренды. Пока можно выбрать язык интерфейса.",
  languageLabel: "Язык интерфейса",
  languages: { ru: "Русский", en: "English" },
};

export type Dictionary = typeof ru;

const en: Dictionary = {
  appName: "Rental Manager",
  description: "A simple space to manage your rentals.",
  welcome: "Start with something simple.",
  introduction: "A space to keep track of your rentals. For now, choose the language that suits you.",
  languageLabel: "Interface language",
  languages: { ru: "Русский", en: "English" },
};

export const dictionaries = { ru, en };
export type Locale = keyof typeof dictionaries;
