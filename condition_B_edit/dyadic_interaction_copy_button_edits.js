/******************************************************************************/
/*** Initialise jspsych *******************************************************/
/******************************************************************************/

var jsPsych = initJsPsych({
  on_finish: function() {
      jsPsych.data.displayData('csv');
  },
});

/******************************************************************************/
/*** Setting the port number for communicating with the server ****************/
/******************************************************************************/

var my_port_number = "/ws26/";

/******************************************************************************/
/*** Generate a random participant ID *****************************************/
/******************************************************************************/

var participant_id = jsPsych.randomization.randomID(10);

/******************************************************************************/
/*** Label and object choices *************************************************/
/******************************************************************************/

// The director's array depends on what the server sends.
// The matcher's array and label depend on the director's array and label.

/******************************************************************************/
/*** Saving data trial by trial ***********************************************/
/******************************************************************************/

function save_data(name, data_in) {
  var url = "save_data.php";
  var data_to_send = { filename: name, filedata: data_in };
  fetch(url, {
    method: "POST",
    body: JSON.stringify(data_to_send),
    headers: new Headers({
      "Content-Type": "application/json",
    }),
  });
};

function save_dyadic_interaction_data(data) {
  // choose the data we want to save - this will also determine the order of the columns
  var data_to_save = [
    participant_id,
    data.partner_id,
    data.block,
    data.trial_index,
    data.trial_class,
    data.time_elapsed,
    data.training_image,
    data.training_label,
    data.collected_training_label,
    data.testing_image,
    data.testing_label,
    data.collected_testing_label,
    data.testing_check,
    data.shuffled_context,
    data.target,
    data.target_pos,
    data.foils,
    data.director_label,
    data.response,
    data.button_number_selected,
    data.image_selected,
    data.rt,
  ];
  var line = data_to_save.join(",") + "\n";
  var this_participant_filename = "di_" + participant_id + ".csv";
  save_data(this_participant_filename, line);
};

var write_headers = {
  type: jsPsychCallFunction,
  func: function () {
    var this_participant_filename = "di_" + participant_id + ".csv";
    save_data(
      this_participant_filename,
      "participant_id,partner_id,block,trial_index,trial_class,time_elapsed,training_image,training_label,collected_training_label,testing_image,testing_label,collected_testing_label,testing_check,shuffled_context1,shuffled_context2,shuffled_context3,shuffled_context4,target,target_pos,foil1,foil2,foil3,director_label,response,button_number_selected,image_selected,\
      rt\n"
    );
  },
};

/******************************************************************************/
/*** Observation trials *******************************************************/
/******************************************************************************/

// Training Instructions.

var training_instructions = {
  type: jsPsychHtmlButtonResponseZH,
  stimulus:
    "<h3>Learning Phase Part 1 - Training</h3>\
    <p style='text-align:left'>You will now be trained on an alien language.</p>\
    <p style='text-align:left'>First, you will see an object and its unique label.</p>\
    <p style='text-align:left'>Then, you will type the label for the object that you had just seen.\
    <p style='text-align:left'>Note for the OELS course markers: I have reduced training to run one trial per object.</p>",
  choices: ["Continue"],
};

// Training Phase

function make_training_trial(image, label) {
  trial = {
    timeline: [
      {
        type: jsPsychImageKeyboardResponse,
        // stimulus: image,
        stimulus: 'learning_phase_images/' + image,
        prompt: "<p>" + label + "</p>",
        trial_duration: 2000,
        response_ends_trial: false,
        on_start: function (trial) {
            trial.data = {
                block: "training",
                training_image: image,
                training_label: label,
            };
            console.log(trial.data);
        },
      },
      {
        type: jsPsychSurveyText,
        // preamble: '<img src="' + image + '.png"</img>',
        preamble: '<img src="' + image + '"</img>',
        // preamble: 'learning_phase_images/' + '<img src="' + image + '.png"</img>',
        questions: [
            {prompt: 'Label this object.', placeholder: 'your label', required: true},
        ],
        on_start: function (trial) {
            trial.data = {
                block: "training", 
                training_image: image,
                training_label: label,
            };
            console.log(trial.data);
        },
        on_finish: function (data) {
            var collected_training_label = data.response.Q0;
            data.collected_training_label = collected_training_label;
            console.log(data);
            trial.data = { collected_training_label: collected_training_label };
            console.log(data);
            save_dyadic_interaction_data(data);
        }
      },
    ],
  };
  return trial;
}

var training_trial_yellow_blob = make_training_trial("yellow_blob.png", "kewa");
var training_trial_gray_oval = make_training_trial("grey_oval.png", "nunuki");
var training_trial_red_star = make_training_trial("red_star.png", "lono");
var training_trial_blue_rect = make_training_trial("blue_rect.png", "mopola");

var training_trials = jsPsych.randomization.repeat(
  [
    training_trial_yellow_blob,
    training_trial_gray_oval,
    training_trial_red_star,
    training_trial_blue_rect,
  ],
  [1, 1, 1, 1]
  // [3, 3, 3, 3]
);

// Testing Phase

var testing_instructions = {
  type: jsPsychHtmlButtonResponseZH,
  stimulus:
    "<h3>Learning Phase Part 2 - Testing</h3>\
    <p style='text-align:left'>You will now be tested on the alien language that you have just been trained on.\
    <p style='text-align:left'>You will see an object and have to type its label.</p>\
    <p style='text-align:left'>You will receive feedback after each submitted response.\
    <p style='text-align:left'>Note for the OELS course markers: I have reduced testing to run one trial per object.</p>",
  choices: ["Continue"],
};

function make_testing_trial(image, label) {
  trial = {
    timeline: [
      {
        type: jsPsychSurveyText,
        preamble: '<img src="' + image + '.png"</img>',
        // preamble: '<img src="' + image + '</img>',
        questions: [
          {prompt: 'Label this object.', placeholder: 'your label', required: true},
        ],
        on_start: function (trial) {
            trial.data = {
                block: "testing",
                testing_image: image,
                testing_label: label,
            };
            console.log(trial.data);
        },
        on_finish: function(data) {
            if(data.response.Q0 == label) {
                data.correct = true;
            } else {
                data.correct = false;
            }
            var collected_testing_label = data.response.Q0;
            data.collected_testing_label = collected_testing_label;
            var testing_check = data.correct;
            data.testing_check = testing_check;
            console.log(data);
            save_dyadic_interaction_data(data);
        }
      },
      {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: function () {
          last_trial_correct = jsPsych.data.get().last(1).values()[0].correct;
          if (last_trial_correct) {
            return "Well done!";
          } else {
            return "Incorrect. The label is " + label + ".";
          }
        },
        trial_duration: 2000,
        response_ends_trial: false,
      },
    ],
  };
  return trial;
}

var testing_trial_yellow_blob = make_testing_trial("yellow_blob", "kewa");
var testing_trial_gray_oval = make_testing_trial("grey_oval", "nunuki");
var testing_trial_red_star = make_testing_trial("red_star", "lono");
var testing_trial_blue_rect = make_testing_trial("blue_rect", "mopola");

var testing_trials = jsPsych.randomization.repeat(
  [
    testing_trial_yellow_blob,
    testing_trial_gray_oval,
    testing_trial_red_star,
    testing_trial_blue_rect,
  ],
  [1, 1, 1, 1]
  // [3, 3, 3, 3]
);

/******************************************************************************/
/******************************************************************************/
/*** Interaction **************************************************************/
/******************************************************************************/
/******************************************************************************/

/******************************************************************************/
/*** The interaction loop *****************************************************/
/******************************************************************************/

var start_interaction_loop = {
  type: jsPsychCallFunction,
  func: interaction_loop,
};  

/******************************************************************************/
/*** Instructions from the server *********************************************/
/******************************************************************************/

/******************************************************************************/
/*** Waiting room *************************************************************/
/******************************************************************************/

function waiting_room() {
  var waiting_room_trial = {
    type: jsPsychHtmlButtonResponseZH,
    stimulus: "You are in the waiting room",
    choices: [],
    on_finish: function () {
      jsPsych.pauseExperiment();
    },
  };
  jsPsych.addNodeToEndOfTimeline(waiting_room_trial);
  jsPsych.resumeExperiment();
};

/******************************************************************************/
/*** Waiting for partner ******************************************************/
/******************************************************************************/

function waiting_for_partner() {
  end_waiting(); //end any current waiting trial
  var waiting_trial = {
    type: jsPsychHtmlButtonResponseZH,
    stimulus: "Waiting for partner",
    choices: [],
    on_finish: function () {
      jsPsych.pauseExperiment();
    },
  };
  jsPsych.addNodeToEndOfTimeline(waiting_trial);
  jsPsych.resumeExperiment();
};

/******************************************************************************/
/*** Ending infinite wait trials **********************************************/
/******************************************************************************/

function end_waiting() {
if (
  jsPsych.getCurrentTrial().stimulus == "Waiting for partner" ||
  jsPsych.getCurrentTrial().stimulus == "You are in the waiting room"
) {
  jsPsych.finishTrial();
}
};

/******************************************************************************/
/*** Instructions after being paired ******************************************/
/******************************************************************************/

function show_interaction_instructions() {
  end_waiting();
  var instruction_screen_interaction = {
    type: jsPsychHtmlButtonResponseZH,
    stimulus:
      "<h3>Pre-interaction Instructions</h3>\
      <p style='text-align:left'>Time to communicate with your partner!</p>\
      <p style='text-align:left'>When you are the <b>SENDER</b>, you'll see a bordered object in an array of four,\
      and your job is to type a label to name it for the your partner \
      (the receiver), so that they can select the correct object.</p> \
      <p style='text-align:left'>When you are the <b>RECEIVER</b>, you'll wait for the sender to \
      type a label, then you'll see the sender's label and array - \
      you just have to click on the object that you think is being named by the sender.</p>",
    choices: ["Continue"],
    on_finish: function () {
      send_to_server({ response_type: "INTERACTION_INSTRUCTIONS_COMPLETE" });
      jsPsych.pauseExperiment();
    },
  };
  jsPsych.addNodeToEndOfTimeline(instruction_screen_interaction);
  jsPsych.resumeExperiment();
};

/******************************************************************************/
/*** Instructions when partner drops out **************************************/
/******************************************************************************/

function partner_dropout() {
  end_waiting();
  var stranded_screen = {
    type: jsPsychHtmlButtonResponseZH,
    stimulus:
      "<h3>Oh no, something has gone wrong!</h3>\
      <p style='text-align:left'>Unfortunately it looks like something has gone wrong - sorry!</p>\
      <p style='text-align:left'>Click continue to progress to the final screen and finish the experiment.</p>",
    choices: ["Continue"],
  };
  jsPsych.addNodeToEndOfTimeline(stranded_screen);
  end_experiment();
};

/******************************************************************************/
/*** End-of-experiment screen *************************************************/
/******************************************************************************/

function end_experiment() {
  var final_screen = {
    type: jsPsychHtmlButtonResponseZH,
    stimulus:
      "<h3>Finished!</h3>\
      <p style='text-align:left'>Congratulations! You have completed the experiment.</p>",
    choices: [],
    // choices as an empty list
    on_finish: function () {
      close_socket();
      jsPsych.endCurrentTimeline();
    },
  };
  jsPsych.addNodeToEndOfTimeline(final_screen);
  jsPsych.resumeExperiment();
};

/******************************************************************************/
/*** Director (label selection) trials ****************************************/
/******************************************************************************/

var available_syllables = jsPsych.randomization.shuffle([
  "ke",
  "wa",
  "mo",
  "po",
  "la",
  "nu",
  "ki",
  "lo",
  "no",
]);

var participant_final_label_set = [];

function director_trial(target, foils, partner_id) {
  end_waiting();
  var target_pos = jsPsych.randomization.randomInt(0,3);
  console.log(target_pos)
  var target_image_as_html = '<img src="' + target + '.png" class="selected">';
  console.log(target_image_as_html)
  var images_as_html = foils.map(function(item) {
  return '<img src="' + item + '.png">'
  });
  console.log(images_as_html)
  images_as_html = jsPsych.randomization.shuffle(images_as_html);
  images_as_html.splice(target_pos,0,target_image_as_html);
  var shuffledContext = images_as_html.join(" ");
  console.log(shuffledContext);
  var building_label = [];
  var continue_production_loop = true;
  var buttons = available_syllables.concat(["DELETE", "DONE"]);
  var subtrial = {
    type: jsPsychImageButtonResponse,
    // stimulus: [],
    stimulus: target_image_as_html,
    stimulus_height: 150,
    choices: buttons, 
    prompt: function(){
      if (building_label.length == 0) {
        return "&nbsp";
      }
      else {
        return building_label.join("");
      }
    },
    on_start: function(trial) {
      // trial.stimulus = shuffledContext;
      trial.data = {
        block: "interaction",
        trial_class: "Director",
        shuffled_context: images_as_html,
        target: target,
        target_pos: target_pos,
        foils: foils,
        partner_id: partner_id,
      };
      console.log(trial.data);
    },
    on_finish: function (data) {
      var button_pressed = buttons[data.response];
      if (button_pressed == "DONE") {
        if (building_label.length > 0) {
          var director_label = building_label.join("");
          console.log(director_label);
          data.director_label = director_label;
          console.log(data);
          save_dyadic_interaction_data(data);
          continue_production_loop = false;
        }
      }
      else if (button_pressed == "DELETE") {
        building_label = building_label.slice(0, -1);
      }
      else {
        building_label.push(button_pressed);
      }
    },
  };
  var message_to_server = {
    type: jsPsychCallFunction,
    func: function () {
      var lasttrialdata = jsPsych.data.get().last(1).values()[0];
      var director_label = lasttrialdata.director_label;
      var lasttrialdata = jsPsych.data.get().last(1).values()[0];
      var shuffled_context = lasttrialdata.shuffled_context;
        send_to_server({
            response_type: "RESPONSE",
            participant: participant_id,
            partner: partner_id,
            role: "Director",
            target: target, 
            foils: foils,
            shuffled_context: shuffled_context,
            response: director_label,
        });
        jsPsych.pauseExperiment();
    },
  };
  // var trial = {
  //   timeline: [subtrial, message_to_server],
  // };
  var trial = {
    timeline: [subtrial, message_to_server],
    loop_function: function(){
      return continue_production_loop;
    },
  };
jsPsych.addNodeToEndOfTimeline(trial);
jsPsych.resumeExperiment();
};

    // type: jsPsychSurveyText,
    // preamble: [],
    // questions: [
    //     {prompt: 'Label the indicated object.', rows: 1, required: true}
    // ],
    // on_start: function (trial) {
    //     trial.preamble = shuffledContext;
    //     trial.data = {
    //         block: "interaction",
    //         trial_class: "Director",
    //         shuffled_context: images_as_html,
    //         target: target,
    //         target_pos: target_pos,
    //         foils: foils,
    //         partner_id: partner_id,
    //     };
    //     console.log(trial.data);
    // },
    // on_finish: function (data) {
    //     var director_label = data.response.Q0; // in director_label, store the response to survey Q0
    //     console.log(director_label); // in console, display variable, director_label
    //     data.director_label = director_label; // in data, store variable, director_label, as data.director_label
    //     data.response = director_label // in trial.data, store director_label under response
    //     console.log(data)
    //     save_dyadic_interaction_data(data);
    // },


/******************************************************************************/
/*** Matcher (object selection) trials ****************************************/
/******************************************************************************/

function matcher_trial(director_label, partner_id, target, foils) {
  end_waiting();
  var target_pos = jsPsych.randomization.randomInt(0,3);
  console.log(target_pos)
  var target_image_as_html = '<img src="' + target + '.png">';
  console.log(target_image_as_html)
  var images_as_html = foils.map(function(item) {
  return '<img src="' + item + '.png">'
  });
  console.log(images_as_html)
  images_as_html = jsPsych.randomization.shuffle(images_as_html);
  images_as_html.splice(target_pos,0,target_image_as_html);
  console.log(images_as_html)
  var shuffledContext = images_as_html;
  console.log(shuffledContext)
  var subtrial = {
    type: jsPsychHtmlButtonResponseZH,
    stimulus: director_label,
    choices: [],
    //button_html:'<button class="jspsych-btn"> <img src="%choice%"> </button>',
    prompt: "<p>This label refers to which object?</p>", 
    on_start: function (trial) {
      trial.choices = shuffledContext;
      trial.data = { 
        block: "interaction",
        trial_class: "Matcher",
        shuffled_context: shuffledContext,
        target: target,
        target_pos: target_pos,
        foils: foils, 
        director_label: director_label,
        partner_id: partner_id,
      };
      console.log(trial.data)
    },
    on_finish: function (data) {
      var button_number_selected = data.response;
      console.log(button_number_selected);
      data.button_number_selected = button_number_selected;
      image_selected = data.shuffled_context[button_number_selected]
      console.log(image_selected)
      data.image_selected = image_selected;
      console.log(data.image_selected);
      console.log(data);
      save_dyadic_interaction_data(data);
      send_to_server({
        response_type: "RESPONSE",
        participant: participant_id,
        partner: partner_id,
        role: "Matcher",
        director_label: director_label,
        target: target,
        target_pos: data.target_pos,
        foils: foils,
        shuffled_context: data.shuffled_context,
        response: data.button_number_selected
      });
      jsPsych.pauseExperiment();
    },
  };
  jsPsych.addNodeToEndOfTimeline(subtrial);
  jsPsych.resumeExperiment();
};

/******************************************************************************/
/*** Feedback trials **********************************************************/
/******************************************************************************/

function display_feedback(score) {
  end_waiting();
  if (score == 1) {
    var feedback_stim = "Correct!";
  } else {
    var feedback_stim = "Incorrect!";
  }
  var feedback_trial = {
    type: jsPsychHtmlButtonResponseZH,
    stimulus: feedback_stim,
    choices: [],
    trial_duration: 1500,
    on_finish: function () {
      send_to_server({ response_type: "FINISHED_FEEDBACK" });
      jsPsych.pauseExperiment();
    },
  };
  jsPsych.addNodeToEndOfTimeline(feedback_trial);
  jsPsych.resumeExperiment();
};

/******************************************************************************/
/******************************************************************************/
/*** Build and run the timeline ***********************************************/
/******************************************************************************/
/******************************************************************************/

/******************************************************************************/
/*** Instruction trials *******************************************************/
/******************************************************************************/

var consent_screen = {
  type: jsPsychHtmlButtonResponseZH,
  stimulus:
    "<h3>Welcome to the experiment!</h3> \
  <p style='text-align:left'>In this experiment, you will first be trained and tested on an alien language.\
  <p style='text-align:left'>You will then use that alien language to communicate with a partner.\
  <p style='text-align:left'>It should take around 20-30 minutes to complete.\
  <p style='text-align:left'>Please do not use the back or refresh button until you have seen the 'Finished!' screen.\
  <p style='text-align:left'>Please do not use any language that you know to communicate with your partner.\
  <p style='text-align:left'>Please make sure that you are able to see the entire screen throughout the experiment.\
  <p style='text-align:left'>Unfortunately, this experiment is not suitable for people with visual impairments.\
  <p style='text-align:left'>If you wish to leave the experiment, simply close the browser.</p>",
  choices: ["Yes, I consent to participate."],
};

var instruction_screen_enter_waiting_room = {
  type: jsPsychHtmlButtonResponseZH,
  stimulus:
  "<h3>You are about to enter the waiting room for pairing!</h3>\
  <p style='text-align:left'>Once you proceed past this point, we will attempt to pair \
  you with another participant. As soon as you are paired, you will start to play the \
  communication game together.\
  <p style='text-align:left'><b> Once you are paired, your partner will be waiting for you \
  and depends on you to finish the experiment</b>, so please progress through the experiment \
  in a timely fashion.\
  <p style='text-align:left'>Please, if at all possible, <b>don't abandon or reload the \
  experiment</b>, since this will also end the experiment for your partner.</p>",
  choices: ["Continue"],
};

var preload_trial = {
  type: jsPsychPreload,
  auto_preload: true,
};

/******************************************************************************/
/*** Build the timeline *******************************************************/
/******************************************************************************/

var full_timeline = [].concat(
  consent_screen,
  preload_trial,
  write_headers,
  training_instructions,
  // training_trials,
  testing_instructions,
  // testing_trials,
  instruction_screen_enter_waiting_room,
  start_interaction_loop
);

/******************************************************************************/
/*** Run the timeline *********************************************************/
/******************************************************************************/

jsPsych.run(full_timeline);