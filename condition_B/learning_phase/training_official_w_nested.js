var jsPsych = initJsPsych({
    on_finish: function() {
        jsPsych.data.displayData();
    }
});

var instructions = {
  type: jsPsychInstructions,
  pages: [
  'This is a training phase.'
  ],
  show_clickable_nav: true
};

var possible_images_for_training = [
  "yellow_blob", 
  "gray_oval", 
  "red_star",
  "blue_rect"
]

function make_training_trial(image, label) {
  trial = {
    timeline: [
      {
        type: jsPsychImageKeyboardResponse,
        stimulus: image,
        prompt: label,
        trial_duration: 2000,
      },
      {
        type: jsPsychSurveyText,
        preamble: '<img src="' + image + '.png"</img>',
        questions: [
            {prompt: 'Label this object.', placeholder: 'your four-letter label'},
        ],
        data: { trial_type: "observation", observation_label: label },
        on_finish: function (data) {
          save_dyadic_interation_data(data);
        }
      },
    ],
  };
  return trial;
}

var training_trial_yellow_blob = make_observation_trial("yellow_blob", "kewa");
var training_trial_gray_oval = make_observation_trial("gray_oval", "nunuki");
var training_trial_red_star = make_observation_trial("red_star", "lono");
var training_trial_blue_rect = make_observation_trial("blue_rect", "mopola");

var training_trials = jsPsych.randomization.repeat(
  [
    training_trial_yellow_blob,
    training_trial_gray_oval,
    training_trial_red_star,
    training_trial_blue_rect,
  ],
  [3, 3, 3, 3]
);

// var training_trial1_nested = {
//     timeline: [
//       {
//         type: jsPsychImageKeyboardResponse,
//         stimulus: 'image1.jpg',
//         prompt: '<p>kewa</p>',
//         trial_duration: 2000,
//       },
//       {
//         type: jsPsychSurveyText,
//         preamble: '<img src="image1.jpg"</img>',
//         questions: [
//             {prompt: 'Label this object.', placeholder: 'your four-letter label'},
//         ],
//       },
//     ]
// };

// var training_trial2_nested = {
//     timeline: [
//       {
//         type: jsPsychImageKeyboardResponse,
//         stimulus: 'image2.jpg',
//         prompt: '<p>nunuki</p>',
//         trial_duration: 2000,
//       },
//       {
//         type: jsPsychSurveyText,
//         preamble: '<img src="image2.jpg"</img>',
//         questions: [
//             {prompt: 'Label this object.', placeholder: 'your four-letter label'},
//         ],
//       },
//     ]
// };

// var training_trial3_nested = {
//     timeline: [
//       {
//         type: jsPsychImageKeyboardResponse,
//         stimulus: 'image3.jpg',
//         prompt: '<p>lono</p>',
//         trial_duration: 2000,
//       },
//       {
//         type: jsPsychSurveyText,
//         preamble: '<img src="image3.jpg"</img>',
//         questions: [
//             {prompt: 'Label this object.', placeholder: 'your four-letter label'},
//         ],
//       },
//     ]
// };

// var training_trial4_nested = {
//     timeline: [
//       {
//         type: jsPsychImageKeyboardResponse,
//         stimulus: 'image4.jpg',
//         prompt: '<p>mopola</p>',
//         trial_duration: 2000,
//       },
//       {
//         type: jsPsychSurveyText,
//         preamble: '<img src="image4.jpg"</img>',
//         questions: [
//             {prompt: 'Label this object.', placeholder: 'your four-letter label'},
//         ],
//       },
//     ]
// };

var trials = [
    training_trial1_nested,
    training_trial2_nested,
    training_trial3_nested,
    training_trial4_nested,
];

var repeated_trials = jsPsych.randomization.repeat(trials,3);

jsPsych.run(repeated_trials);