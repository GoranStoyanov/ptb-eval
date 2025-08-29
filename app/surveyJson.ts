// app/surveyJson.ts
export const surveyJson = {
  title: "Оценка на мача – Park the Bus",
  description: "Анкета за индивидуално и отборно представяне.",
  locale: "bg",
  showProgressBar: "bottom",
  showQuestionNumbers: "off",
  pages: [
    {
      name: "match",
      elements: [
        {
          type: "text",
          inputType: "date",
          name: "match_date",
          title: "Дата на мача",
          isRequired: true,
          placeholder: "YYYY-MM-DD"
        }
      ]
    },
    {
      name: "intro",
      elements: [
        {
          type: "radiogroup",
          name: "count",
          title: "Колко играчи ще оценяваш?",
          isRequired: true,
          choices: [5, 6, 7, 8, 9, 10, 11]
        }
      ]
    },
    {
      name: "players",
      elements: [
        {
          type: "paneldynamic",
          name: "players",
          title: "Оценка на играч",
          description: "Не повтаряй един и същ играч в повече от един панел.",
          keyName: "player",
          panelCount: 5,
          minPanelCount: 1,
          maxPanelCount: 11,
          allowAddPanel: false,
          allowRemovePanel: false,
          templateElements: [
            {
              type: "dropdown",
              name: "player",
              title: "Избери играч",
              isRequired: true,
              choicesOrder: "none",
              choices: [
                "Кристиян","Челси","Бахар","Симака","Миро","Дидо","Тони","Наско",
                "Тянката","Цецо","Ивцата","Монката","Данчо","Гого","Константин","Ицката",
                "Ивака","Пацо","Ивчо","Бойо","Диян","Пресо","Жорката","Ицака",
                "Терзов","Калата","Стъки","Митака"
              ]
            },
            {
              type: "rating",
              name: "technique",
              title: "Техника и пасове – първо докосване, точност на подаванията, контрол върху топката.",
              isRequired: true,
              rateMin: 1, rateMax: 5,
              minRateDescription: "Много слабо", maxRateDescription: "Отлично"
            },
            {
              type: "rating",
              name: "positioning",
              title: "Позициониране и движение – заемане на правилни зони, движение без топка, покриване на пространства.",
              isRequired: true,
              rateMin: 1, rateMax: 5,
              minRateDescription: "Много слабо", maxRateDescription: "Отлично"
            },
            {
              type: "rating",
              name: "engagement",
              title: "Ангажираност и борбеност – усилие, интензитет, участие в единоборства и преса.",
              isRequired: true,
              rateMin: 1, rateMax: 5,
              minRateDescription: "Много слабо", maxRateDescription: "Отлично"
            },
            {
              type: "rating",
              name: "focus",
              title: "Фокус и концентрация – внимание към играта, реакция, минимизиране на грешки.",
              isRequired: true,
              rateMin: 1, rateMax: 5,
              minRateDescription: "Много слабо", maxRateDescription: "Отлично"
            },
            {
              type: "rating",
              name: "teamplay",
              title: "Отборна игра и комуникация – взаимодействие, дисциплина, говорене и координация със съотборници.",
              isRequired: true,
              rateMin: 1, rateMax: 5,
              minRateDescription: "Много слабо", maxRateDescription: "Отлично"
            },
            {
              type: "rating",
              name: "position_metric",
              title: "Показател според позицията – вратар: спасявания; защитник: пресичане/1v1; халф: контрол и преход; нападател: завършващи удари.",
              isRequired: true,
              rateMin: 1, rateMax: 5,
              minRateDescription: "Много слабо", maxRateDescription: "Отлично"
            }
          ]
        }
      ]
    },
    {
      name: "self",
      elements: [
        {
          type: "dropdown",
          name: "self_player",
          title: "Кой си ти?",
          isRequired: true,
          choicesOrder: "none",
          choices: [
            "Кристиян","Челси","Бахар","Симака","Миро","Дидо","Тони","Наско",
            "Тянката","Цецо","Ивцата","Монката","Данчо","Гого","Константин","Ицката",
            "Ивака","Пацо","Ивчо","Бойо","Диян","Пресо","Жорката","Ицака",
            "Терзов","Калата","Стъки","Митака"
          ]
        },
        {
          type: "text",
          inputType: "number",
          name: "self_score",
          title: "Самооценка (обща, 1.0–5.0)",
          description: "Една десетична, напр. 3.7",
          isRequired: true,
          min: 1, max: 5, step: 0.1
        }
      ]
    },
    {
      name: "final",
      elements: [
        {
          type: "rating",
          name: "team_overall",
          title: "Общо представяне на отбора в мача",
          isRequired: true,
          rateMin: 1, rateMax: 5,
          minRateDescription: "Много слабо", maxRateDescription: "Отлично"
        },
        {
          type: "comment",
          name: "notes",
          title: "Свободен коментар или наблюдения",
          isRequired: false, maxLength: 500
        }
      ]
    }
  ]
} as const;