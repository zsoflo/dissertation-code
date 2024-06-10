var jsPsych = initJsPsych({
    on_finish: function() {
        jsPsych.data.displayData();
    }
});

var testing_trial1 = {
    timeline: [
        {
            type: jsPsychSurveyText,
            preamble: '<img src="image1.jpg"</img>',
            questions: [
                {prompt: 'Label this object.', placeholder: 'your four-letter label'},
            ],
            data: { correct_response: 'kewa'},
            on_finish: function(data) {
                if(data.response.Q0 == "kewa") {
                    data.correct = true;
                } else {
                    data.correct = false;
                }
            }
        },
        {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: function () {
                last_trial_correct = jsPsych.data.get().last(1).values()[0].correct;
                if (last_trial_correct) {
                    return "Well done!";
                } else {
                    return "Incorrect. The label is kewa.";
                }
            },
        },
    ],
};

var testing_trial2 = {
    timeline: [
        {
            type: jsPsychSurveyText,
            preamble: '<img src="image2.jpg"</img>',
            questions: [
                {prompt: 'Label this object.', placeholder: 'your four-letter label'},
            ],
            data: { correct_response: 'nunuki'},
            on_finish: function(data) {
                if(data.response.Q0 == "nunuki") {
                    data.correct = true;
                } else {
                    data.correct = false;
                }
            }
        },
        {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: function () {
                last_trial_correct = jsPsych.data.get().last(1).values()[0].correct;
                if (last_trial_correct) {
                    return "Well done!";
                } else {
                    return "Incorrect. The label is nunuki.";
                }
            },
        },
    ],
};

var testing_trial3 = {
    timeline: [
        {
            type: jsPsychSurveyText,
            preamble: '<img src="image3.jpg"</img>',
            questions: [
                {prompt: 'Label this object.', placeholder: 'your four-letter label'},
            ],
            data: { correct_response: 'lono'},
            on_finish: function(data) {
                if(data.response.Q0 == "lono") {
                    data.correct = true;
                } else {
                    data.correct = false;
                }
            }
        },
        {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: function () {
                last_trial_correct = jsPsych.data.get().last(1).values()[0].correct;
                if (last_trial_correct) {
                    return "Well done!";
                } else {
                    return "Incorrect. The label is lono.";
                }
            },
        },
    ],
};

var testing_trial4 = {
    timeline: [
        {
            type: jsPsychSurveyText,
            preamble: '<img src="image4.jpg"</img>',
            questions: [
                {prompt: 'Label this object.', placeholder: 'your four-letter label'},
            ],
            data: { correct_response: 'mopola'},
            on_finish: function(data) {
                if(data.response.Q0 == "mopola") {
                    data.correct = true;
                } else {
                    data.correct = false;
                }
            }
        },
        {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: function () {
                last_trial_correct = jsPsych.data.get().last(1).values()[0].correct;
                if (last_trial_correct) {
                    return "Well done!";
                } else {
                    return "Incorrect. The label is mopola.";
                }
            },
        },
    ],
};

var trials = [
    testing_trial1,
    testing_trial2,
    testing_trial3,
    testing_trial4,
];

var random_order = jsPsych.randomization.repeat(trials,3);

jsPsych.run(random_order);