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

var my_port_number = "/ws5/";

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
    data.trial_index,
    data.trial_type,
    data.time_elapsed,
    data.partner_id,
    data.shuffled_context,
    data.director_label,
    data.button_selected,
    data.response,
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
      "participant_id,trial_index,trial_type,time_elapsed,\
      partner_id,shuffled_context,director_label,button_selected,repsonse,rt\n"
    );
  },
};

/******************************************************************************/
/*** Observation trials *******************************************************/
/******************************************************************************/

// Learning phase code will be integrated here after successful interaction testing.

// Training Phase

function make_training_trial(image, label) {
  trial = {
    timeline: [
      {
        type: jsPsychImageKeyboardResponse,
        stimulus: image,
        prompt: "<p>" + label + "</p>",
        trial_duration: 2000,
        response_ends_trial: false,
      },
      {
        type: jsPsychSurveyText,
        preamble: '<img src="' + image + '.png"</img>',
        questions: [
            {prompt: 'Label this object.', placeholder: 'your label', required: true},
        ],
        data: { 
          trial_type: "training", 
          training_image: image,
          training_label: label,
        },
        on_finish: function (data) {
          save_dyadic_interaction_data(data);
        }
      },
    ],
  };
  return trial;
}

var training_trial_yellow_blob = make_training_trial("yellow_blob", "kewa");
var training_trial_gray_oval = make_training_trial("grey_oval", "nunuki");
var training_trial_red_star = make_training_trial("red_star", "lono");
var training_trial_blue_rect = make_training_trial("blue_rect", "mopola");

var training_trials = jsPsych.randomization.repeat(
  [
    training_trial_yellow_blob,
    training_trial_gray_oval,
    training_trial_red_star,
    training_trial_blue_rect,
  ],
  [3, 3, 3, 3]
);

// Testing Phase

function make_testing_trial(image, label) {
  trial = {
    timeline: [
      {
        type: jsPsychSurveyText,
        preamble: '<img src="' + image + '.png"</img>',
        questions: [
          {prompt: 'Label this object.', placeholder: 'your label', required: true},
        ],
        data: { 
          trial_type: "testing", 
          testing_image: image,
          testing_label: label,
        },
        on_finish: function(data) {
          save_dyadic_interaction_data
          if(data.response.Q0 == label) {
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
  [3, 3, 3, 3]
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
      <p style='text-align:left'>When you are the SENDER you'll see an object \
      on your screen, and your job is to type a label to name it for the your partner \
      (the receiver), so that they can select the correct object.</p> \
      <p style='text-align:left'>When you are the RECEIVER you'll wait for the sender to \
      type a label, then you'll see the label selected by the sender plus four objects - \
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
      <p style='text-align:left'>Clock continue to progress to the final screen and finish the experiment.</p>",
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
      <p style='text-align:left'>Experiments often end \
      with a final screen, e.g. that contains a completion \
      code so the participant can claim their payment.</p>\
      <p style='text-align:left'>This is a placeholder for that information.</p>",
    choices: ["Continue"],
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

function director_trial(target, foils, partner_id) {
  end_waiting();
  var target_pos = jsPsych.randomization.randomInt(0,3);
  var target_image_as_html = '<img src="' + target + '.png" class="selected">';
  console.log(target_image_as_html)
  var images_as_html = foils.map(function(item) {
  return '<img src="' + item + '.png">'
  });
  console.log(images_as_html)
  images_as_html = jsPsych.randomization.shuffle(images_as_html);
  images_as_html.splice(target_pos,0,target_image_as_html);
  var shuffledContext = images_as_html.join(" ");
  var subtrial = {
    type: jsPsychSurveyText,
    preamble: [],
    questions: [
        {prompt: 'Label the indicated object.', rows: 1}
    ],
    on_start: function (trial) {
        trial.preamble = shuffledContext;
        trial.data = {
          block: "production",
          shuffled_context: trial.preamble,
          target: target,
          foils: foils,
          target_pos: target_pos
        };
        console.log(trial.data)
    },
    on_finish: function(data) {
        var director_label = data.response.Q0; // in director_label, store the response to survey Q0
        console.log(director_label); // in console, display variable, director_label
        data.director_label = director_label; // in data, store variable, director_label, as data.director_label
        trial.data = { response: director_label }
        data.trial_type = "director";
        data.partner_id = partner_id;
        save_dyadic_interaction_data(data);
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
  var trial = {
    timeline: [subtrial, message_to_server],
  };
jsPsych.addNodeToEndOfTimeline(trial);
jsPsych.resumeExperiment();
};

/******************************************************************************/
/*** Matcher (object selection) trials ****************************************/
/******************************************************************************/

function matcher_trial(director_label, partner_id, target, foils) {
  end_waiting();
  var target_pos = jsPsych.randomization.randomInt(0,3);
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
  var trial = {
    type: jsPsychHtmlButtonResponseZH,
    stimulus: director_label,
    choices: [],
    //button_html:'<button class="jspsych-btn"> <img src="%choice%"> </button>',
    prompt: "<p>This label refers to which object?</p>", 
    on_start: function (trial) {
      trial.choices = shuffledContext;
      trial.data = { 
        block: "production",
        shuffled_context: trial.choices,
        target: target,
        foils: foils, 
        target_pos: target_pos
      };
      console.log(trial.data)
    },
    on_finish: function (data) {
      var button_number_selected = data.response;
      console.log(button_number_selected);
      data.button_number_selected = button_number_selected;
      image_selected = data.shuffled_context[button_number_selected]
      console.log(image_selected)
      data.button_selected = image_selected;
      console.log(data.button_selected)
      data.trial_type = "matcher";
      data.partner_id = partner_id;
      save_dyadic_interaction_data(data);
      console.log(data);
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
        response: data.button_number_selected,
      });
      jsPsych.pauseExperiment();
    },
  };
  jsPsych.addNodeToEndOfTimeline(trial);
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
    "<h3>Welcome to the experiment</h3> \
  <p style='text-align:left'>Experiments begin with an information sheet that explains to the participant \
  what they will be doing, how their data will be used, and how they will be \
  remunerated.</p> \
  <p style='text-align:left'>This is a placeholder for that information, which is normally reviewed \
  as part of the ethical review process.</p>",
  choices: ["Yes, I consent to participate"],
};

var instruction_screen_enter_waiting_room = {
  type: jsPsychHtmlButtonResponseZH,
  stimulus:
  "<h3>You are about to enter the waiting room for pairing!</h3>\
  <p style='text-align:left'>Once you proceed past this point we will attempt to pair \
  you with another participant. As soon as you are paired you will start to play the \
  communication game together. <b> Once you are paired, your partner will be waiting for you \
  and depends on you to finish the experiment</b>, so please progress through the experiment \
  in a timely fashion, and please if at all possible <b>don't abandon or reload the \
  experiment</b> since this will also end the experiment for your partner.</p>",
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
  // training_trials,
  // testing_trials,
  instruction_screen_enter_waiting_room,
  start_interaction_loop
);

/******************************************************************************/
/*** Run the timeline *********************************************************/
/******************************************************************************/

jsPsych.run(full_timeline);