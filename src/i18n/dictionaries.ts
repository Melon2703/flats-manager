const ru = {
  appName: "Управление арендой",
  description: "Простое пространство для управления арендой.",
  welcome: "Всё начинается с простого.",
  introduction:
    "Здесь будет удобно вести учёт аренды. Пока можно выбрать язык интерфейса.",
  languageLabel: "Язык интерфейса",
  demoNotice: "Тестовые данные · только локально",
  demoReset: "Сбросить тестовые данные",
  demoResetConfirm:
    "Восстановить тестовые данные? Все ваши локальные изменения будут удалены.",
  languages: { ru: "Русский", en: "English" },
  signIn: "Войти",
  signInHelp: "Войдите, чтобы открыть свои записи об аренде.",
  email: "Электронная почта",
  password: "Пароль",
  signInError:
    "Не удалось войти. Проверьте почту и пароль и попробуйте ещё раз.",
  signingIn: "Входим…",
  signOut: "Выйти",
  setupTitle: "Подключение ещё не настроено",
  setupHelp:
    "Для сохранения записей нужно подключить базу данных. Инструкция есть в README проекта.",
  addApartment: "Добавить квартиру",
  apartmentName: "Название квартиры",
  monthlyRent: "Аренда в месяц, USD",
  dueDay: "День оплаты",
  dueDayHelp:
    "Пока доступны дни с 1 по 28. Правило для 29–31-го числа ещё не подтверждено.",
  startsIn: "Начало учёта",
  saveApartment: "Сохранить квартиру",
  saving: "Сохраняем…",
  cancel: "Отмена",
  invalid:
    "Проверьте поля: сумма должна быть больше нуля, не более 999 999 999,99 USD и содержать не более двух знаков после запятой.",
  saveError:
    "Не удалось сохранить. Ваши данные остались в форме. Попробуйте ещё раз.",
  loadError:
    "Не удалось загрузить записи. Обновите страницу и попробуйте ещё раз.",
  emptyTitle: "Начните с первой квартиры",
  emptyHelp:
    "Добавьте название, сумму аренды и день оплаты. Здесь появятся записи за выбранный месяц.",
  expected: "Начислено",
  received: "Получено",
  outstanding: "Осталось",
  due: "Срок оплаты",
  overdue: "Просрочено",
  awaiting: "Ожидается оплата",
  paid: "Оплачено",
  partial: "Частично оплачено",
  recordReceipt: "Записать получение",
  monthContext: "Аренда за выбранный месяц · USD",
  monthPicker: "Выбрать месяц",
  previousMonth: "Предыдущий месяц",
  nextMonth: "Следующий месяц",
  chooseMonth: "Месяц аренды",
  showMonth: "Показать",
  loading: "Загружаем записи…",
  discardDraft: "Отменить ввод? Несохранённые данные будут потеряны.",
  amountReceived: "Полученная сумма, USD",
  receivedOn: "Дата получения",
  addNote: "Добавить примечание",
  note: "Примечание",
  saveReceipt: "Сохранить получение",
  receiptSaved: "Получение сохранено",
  receipts: "Поступления",
  noReceipts: "Поступлений пока нет",
  remainingRent: "Останется к оплате",
  balanceError:
    "Сумма превышает оставшуюся аренду. Проверьте обновлённые итоги. Излишки и авансы не записываются в этой форме.",
  receiptInvalid:
    "Введите положительную сумму с точностью до цента и корректную дату. Примечание — не более 500 символов.",
  retryReceipt:
    "Сохранение не подтверждено. Повторите ту же отправку — запись не будет продублирована. До подтверждения поля заблокированы.",
  retrySave: "Проверить и повторить",
  retryApartment:
    "Сохранение квартиры не подтверждено. Повторите ту же отправку, чтобы проверить результат без дубликатов. До подтверждения поля заблокированы.",
};

export type Dictionary = typeof ru;

const en: Dictionary = {
  appName: "Rental Manager",
  description: "A simple space to manage your rentals.",
  welcome: "Start with something simple.",
  introduction:
    "A space to keep track of your rentals. For now, choose the language that suits you.",
  languageLabel: "Interface language",
  demoNotice: "Demo data · local only",
  demoReset: "Reset demo data",
  demoResetConfirm:
    "Restore the sample data? All your local demo changes will be removed.",
  languages: { ru: "Русский", en: "English" },
  signIn: "Sign in",
  signInHelp: "Sign in to open your rental records.",
  email: "Email",
  password: "Password",
  signInError:
    "Could not sign in. Check your email and password and try again.",
  signingIn: "Signing in…",
  signOut: "Sign out",
  setupTitle: "Connection is not configured yet",
  setupHelp:
    "Connect the database to save rental records. See the project README for setup instructions.",
  addApartment: "Add apartment",
  apartmentName: "Apartment name",
  monthlyRent: "Monthly rent, USD",
  dueDay: "Rent due day",
  dueDayHelp:
    "Days 1–28 are supported for now. The rule for days 29–31 is not confirmed yet.",
  startsIn: "Records start in",
  saveApartment: "Save apartment",
  saving: "Saving…",
  cancel: "Cancel",
  invalid:
    "Check the fields: enter an amount greater than zero, up to USD 999,999,999.99, with no more than two decimal places.",
  saveError:
    "Could not save. Your entries are still in the form. Please try again.",
  loadError: "Could not load your records. Refresh the page and try again.",
  emptyTitle: "Start with your first apartment",
  emptyHelp:
    "Add its name, monthly rent, and due day. Its records for the selected month will appear here.",
  expected: "Expected",
  received: "Received",
  outstanding: "Outstanding",
  due: "Due",
  overdue: "Overdue",
  awaiting: "Awaiting payment",
  paid: "Paid",
  partial: "Partially paid",
  recordReceipt: "Record receipt",
  monthContext: "Rent for the selected month · USD",
  monthPicker: "Choose month",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  chooseMonth: "Rental month",
  showMonth: "Show month",
  loading: "Loading records…",
  discardDraft: "Discard this entry? Unsaved changes will be lost.",
  amountReceived: "Amount received, USD",
  receivedOn: "Receipt date",
  addNote: "Add note",
  note: "Note",
  saveReceipt: "Save receipt",
  receiptSaved: "Receipt saved",
  receipts: "Receipts",
  noReceipts: "No receipts yet",
  remainingRent: "Remaining rent",
  balanceError:
    "The amount exceeds the remaining rent. Check the updated totals. Excess amounts and advances are not recorded in this form.",
  receiptInvalid:
    "Enter a positive amount with no more than two decimal places and a valid date. Notes can contain up to 500 characters.",
  retryReceipt:
    "Saving has not been confirmed. Retry the same submission; it will not create a duplicate. Fields are locked until confirmed.",
  retrySave: "Check and retry",
  retryApartment:
    "Saving the apartment has not been confirmed. Retry the same submission to check the result without duplicates. Fields are locked until confirmed.",
};

export const dictionaries = { ru, en };
export type Locale = keyof typeof dictionaries;
