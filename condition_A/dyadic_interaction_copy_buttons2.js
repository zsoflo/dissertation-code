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
      "participant_id,\
      partner_id,\
      block,\
      trial_index,\
      trial_class,\
      time_elapsed,\
      training_image,training_label,collected_training_label,\
      testing_image,testing_label,collected_testing_label,testing_check,\
      shuffled_context1,\
      shuffled_context2,\
      shuffled_context3,\
      shuffled_context4,\
      target,target_pos,\
      foil1,foil2,foil3,\
      director_label,\
      response,\
      button_number_selected,image_selected,\
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
    "<h3>The Learning Phase: Training (Part 1)</h3>\
    <p style='text-align:left'>You'll be trained on an alien language.</p>\
    <p style='text-align:left'>First, you'll see an object and its unique label.</p>\
    <p style='text-align:left'>Then, you'll reproduce the label for the object that you had just seen.</p>",
  choices: ["Continue"],
};

// Training Phase

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

function observe(image, label) {
  var trial = {
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
  };
  return trial;
};

function test(image, label) {

  // available_syllables = jsPsych.randomization.shuffle(available_syllables);

  var building_label = [];
  var continue_production_loop = true;
  var buttons = available_syllables.concat(["<span style='color:red'>DELETE</span>", "<span style='color:green'>DONE</span>"]);

  var trial = {
    type: jsPsychImageButtonResponse,
    stimulus: 'learning_phase_images/' + image,
    choices: buttons,
    prompt: function () {
      if (building_label.length == 0) {
        return "&nbsp;";
      }
      else {
        return building_label.join("");
      }
    },
    on_start: function (trial) {
      trial.data = {
        block: "training",
        training_image: image,
        training_label: label,
      };
      console.log(trial.data)
    },
    on_finish: function (data) {
      var button_pressed = buttons[data.response];
      if (button_pressed == "<span style='color:green'>DONE</span>") {
        if (building_label.length > 0) {
          var collected_training_label = building_label.join("");
          data.collected_training_label = collected_training_label;
          console.log(data);
          trial.data = { collected_training_label: collected_training_label };
          console.log(data);
          save_dyadic_interaction_data(data);
          continue_production_loop = false;
        }
      }
      else if (button_pressed == "<span style='color:red'>DELETE</span>") {
        building_label = building_label.slice(0, -1);
      }
      else {
        building_label.push(button_pressed);
      }
    },
  };
  var production_loop = {
    timeline: [trial],
    loop_function: function () {
      return continue_production_loop;
    },
  };
  return production_loop;
}

function observe_and_test_part1(image, label) {
    return [observe(image, label), test(image, label)];
}

var grouped_training_trials = 
  [
    observe_and_test_part1("yellow_blob.png", "kewa"),
    observe_and_test_part1("grey_oval.png", "nunuki"),
    observe_and_test_part1("red_star.png", "lono"),
    observe_and_test_part1("blue_rect.png", "mopola"),
    observe_and_test_part1("yellow_blob.png", "kewa"),
    observe_and_test_part1("grey_oval.png", "nunuki"),
    observe_and_test_part1("red_star.png", "lono"),
    observe_and_test_part1("blue_rect.png", "mopola"),
    observe_and_test_part1("yellow_blob.png", "kewa"),
    observe_and_test_part1("grey_oval.png", "nunuki"),
    observe_and_test_part1("red_star.png", "lono"),
    observe_and_test_part1("blue_rect.png", "mopola"),
];

grouped_training_trials = jsPsych.randomization.shuffle(grouped_training_trials);

var training_trials = []
for (trial of grouped_training_trials) {
  training_trials.push(trial[0]);
  training_trials.push(trial[1]);
};

// Testing Phase

var testing_instructions = {
  type: jsPsychHtmlButtonResponseZH,
  stimulus:
    "<h3>The Learning Phase: Testing (Part 2)</h3>\
    <p style='text-align:left'>You'll now be tested on the alien language.\
    <p style='text-align:left'>You'll see an object and have to reproduce its label.</p>\
    <p style='text-align:left'>You'll receive feedback after each submitted response.</p>",
  choices: ["Continue"],
};

function test_part2(image, label) {

  // available_syllables = jsPsych.randomization.shuffle(available_syllables);

  var building_label = [];
  var continue_production_loop = true;
  var buttons = available_syllables.concat(["<span style='color:red'>DELETE</span>", "<span style='color:green'>DONE</span>"]);

  var trial = {
    type: jsPsychImageButtonResponse,
    stimulus: 'learning_phase_images/' + image,
    choices: buttons,
    prompt: function () {
      if (building_label.length == 0) {
        return "&nbsp;";
      }
      else {
        return building_label.join("");
      }
    },
    on_start: function (trial) {
      trial.data = {
        block: "testing",
        testing_image: image,
        testing_label: label
      };
      console.log(trial.data)
    },
    on_finish: function (data) {
      var button_pressed = buttons[data.response];
      if (button_pressed == "<span style='color:green'>DONE</span>") {
        if (building_label.length > 0) {
          var collected_testing_label = building_label.join("");
          data.collected_testing_label = collected_testing_label;
          console.log(data);
          if (data.collected_testing_label == label) {
            data.correct = true;
          } else {
            data.correct = false
          }
          var testing_check = data.correct;
          data.testing_check = testing_check;
          console.log(data);
          trial.data = { 
            collected_testing_label: collected_testing_label,
            testing_check: testing_check
          };
          console.log(data);
          save_dyadic_interaction_data(data);
          continue_production_loop = false;
        }
      }
      else if (button_pressed == "<span style='color:red'>DELETE</span>") {
        building_label = building_label.slice(0, -1);
      }
      else {
        building_label.push(button_pressed);
      }
    },
  };
  var production_loop = {
    timeline: [trial],
    loop_function: function () {
      return continue_production_loop;
    },
  };
  return production_loop;
}

function check(image, label) {
  console.log(image)
  var trial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function () {
    last_trial_correct = jsPsych.data.get().last(1).values()[0].correct;
    if (last_trial_correct) {
      return "<p style='text-align:center'>Well done! " + 
    '<img src="' + image + '"</img>' + " was <b>" + label +"</b>.</p>"
    } else {
      return "<p style='text-align:center'>False. " + 
    '<img src="' + image + '"</img>' + " was <b>" + label +"</b>.</p>"
    }
    },
    trial_duration: 2000,
    response_ends_trial: false,
  };
  return trial;
}

function test_and_check(image, label) {
  return [test_part2(image, label), check(image, label)];
}

var grouped_testing_trials = 
  [
    test_and_check("yellow_blob.png", "kewa"),
    test_and_check("grey_oval.png", "nunuki"),
    test_and_check("red_star.png", "lono"),
    test_and_check("blue_rect.png", "mopola"),
    test_and_check("yellow_blob.png", "kewa"),
    test_and_check("grey_oval.png", "nunuki"),
    test_and_check("red_star.png", "lono"),
    test_and_check("blue_rect.png", "mopola"),
    test_and_check("yellow_blob.png", "kewa"),
    test_and_check("grey_oval.png", "nunuki"),
    test_and_check("red_star.png", "lono"),
    test_and_check("blue_rect.png", "mopola"),
];

grouped_testing_trials = jsPsych.randomization.shuffle(grouped_testing_trials);

var testing_trials = []
for (trial of grouped_testing_trials) {
  testing_trials.push(trial[0]);
  testing_trials.push(trial[1]);
};

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
    stimulus: "You are in the waiting room.",
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
    stimulus: "Waiting for partner...",
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
  jsPsych.getCurrentTrial().stimulus == "Waiting for partner..." ||
  jsPsych.getCurrentTrial().stimulus == "You are in the waiting room."
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
      "<h3>The Communication Phase</h3>\
      <p style='text-align:left'>Time to communicate!</p>\
      <p style='text-align:left'>When you are the <b>SENDER</b>:\
      <p style='text-align:left'>1. You'll see one object bordered with pink (surrounded by three nasty distractors). The bordered object is your <b>target</b>!</p>\
      <p style='text-align:left'>2. <b>Name the target using elements of the alien language that you have just learned.</b> The elements can be combined in any way. They are simply buttons that you press to build your label (as in the Learning Phase).\
      Once your label is ready, click <b>DONE</b>. <b>Make sure to label the target, so that your partner will click on the correct image (the target)!</b>\
      <p style='text-align:left'>3. Your label, your target (but without the pink border), and the nasty distractors will all appear on your partner's screen.\
      Your partner will try to match your label to your target. If they do, you guys gain 1 point! If your partner selects the wrong image, you guys gain no points... womp, womp :(</p> \
      <p style='text-align:left'>When you are the <b>MATCHER</b>:\
      <p style='text-align:left'>1. You'll wait for the sender to name their object (the target).</p>\
      <p style='text-align:left'>2. When they are finished, you'll see <b>your partner's label, their target, and three nasty distractors</b>.</p>\
      <p style='text-align:left'>3. <b>Click on the image that you think is the target!</b> Careful, don't be fooled by any distractors...</p>\
      <p style='text-align:left'>Let's play! (:</p>",
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

function director(target, foils, partner_id) {
  end_waiting();
  console.log(target);
  
  var target_pos = jsPsych.randomization.randomInt(0,3);
  console.log(target_pos);
  
  // var target_image_as_html = '<img src="' + target + '.png" class="selected"></img>';
  var target_image_as_html = '<img src="' + target + '.png" class="selected">';
  console.log(target_image_as_html);
  
  var images_as_html = foils.map(function(item) {
    // return '<img src="' + item + '.png"></img>'
    return '<img src="' + item + '.png">'
  });
  console.log(images_as_html);
  
  images_as_html = jsPsych.randomization.shuffle(images_as_html);
  images_as_html.splice(target_pos, 0, target_image_as_html);
  console.log(images_as_html);
  // var shuffledContext = images_as_html.join(" ");
  var shuffledContext = images_as_html;
  console.log(shuffledContext);

  // available_syllables = jsPsych.randomization.shuffle(available_syllables);

  var building_label = [];
  var continue_production_loop = true;
  var buttons = available_syllables.concat(["<span style='color:red'>DELETE</span>", "<span style='color:green'>DONE</span>"]);

  var trial = {
    type: jsPsychHtmlButtonResponse, //KENNY changed this to html-button-response from image-button-response
    stimulus: [],
    choices: buttons,
    prompt: function() {
      if (building_label.length == 0) {
        return "&nbsp;";
      }
      else {
        return building_label.join("");
      }
    },
    on_start: function (trial) {
      trial.stimulus = shuffledContext.join(" ") //KENNY added this to turn the shuffledContext array into a single string of html
      console.log(trial.stimulus)
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
      if (button_pressed == "<span style='color:green'>DONE</span>") {
        if (building_label.length > 0) {
          var director_label = building_label.join("");
          console.log(director_label);
          data.director_label = director_label;
          console.log(data);
          trial.data = {
            director_label: director_label
          }  ;
          console.log(data);   
          save_dyadic_interaction_data(data);
          continue_production_loop = false;
        }
      }
      else if (button_pressed == "<span style='color:red'>DELETE</span>") {
        building_label = building_label.slice(0, -1);
      }
      else {
        building_label.push(button_pressed);
      }
    },
  };
  var production_loop = {
    timeline: [trial],
    loop_function: function () {
      return continue_production_loop;
    },
  };
  return production_loop;
}

function message(target, foils, partner_id) {
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
    }
  };
  return message_to_server;
}

function director_trial(target, foils, partner_id) {
  var trial = {
    timeline: [director(target, foils, partner_id), message(target, foils, partner_id)]
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

function display_feedback(score, target, label) {
  end_waiting();
  if (score == 1) {
    var target_stim = target.shift();
    // var feedback_stim = ["Correct!" + '<img src="' + target_stim + '.png"</img>' + "is " + label + "."];
    var feedback_stim = "<p style='text-align:center'>True! " + 
    '<img src="' + target_stim + '.png"</img>' + " was <b>" + label +"</b>.</p>"
  } else {
    var target_stim = target.shift();
    // var feedback_stim = ["Correct!" + '<img src="' + target_stim + '.png"</img>' + "is " + label + "."];
    var feedback_stim = "<p style='text-align:center'>False! " + 
    '<img src="' + target_stim + '.png"</img>' + " was <b>" + label +"</b>.</p>"
  }
  var feedback_trial = {
    type: jsPsychHtmlButtonResponseZH,
    stimulus: feedback_stim,
    choices: [],
    trial_duration: 2000,
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
  "<h3>Welcome to my experiment!</h3>\
  <p style='text-align:left'>In my experiment, you'll first be trained and tested on an alien language. You'll \
  then use that alien language to communicate with a partner. It should take around 20-30 minutes to complete.</p>\
  \
  <p style='text-align:left'>This experiment is part of my (Zsófia Hauk's) 4th year dissertation. It is supervised by Prof. Kenny \
  Smith at The University of Edinburgh. It has been approved by the Linguistics and \
  English Language Ethics Committee. Please click \
  <a href='dissertation_information_letter.pdf' download>here</a> \
  to download a PDF of the study information letter. This provides further information about the study.</p>\
  \
  <p style='text-align:left'>Clicking on the consent button below indicates that:<br>\
  - you have downloaded and read the information letter, <br>\
  - you voluntarily agree to participate, <br>\
  - you are at least 18 years of age, and <br>\
  - you speak English.<br>\
  If you do not agree to all of these, please do not participate in this experiment.</p>\
  \
  <p style='text-align:left'>This experiment requires that you do not use any external language (such as, English).\
  Also, make sure that you can see the entire screen throughout the experiment.\
  Please do not use the back or refresh button until you have seen the 'Finished!' screen.\
  If you are just not comfortable interacting with a partner, please do not participate in this experiment.\
  If you wish to leave the experiment, simply close the browser.\
  Unfortunately, this experiment is not suitable for people with visual impairments.</p>",
  choices: ["Yes, I consent to participate."],
};

var instruction_screen_enter_waiting_room = {
  type: jsPsychHtmlButtonResponseZH,
  stimulus:
  "<h3>You are about to enter the waiting room for pairing!</h3>\
  <p style='text-align:left'>Once you proceed past this point, we'll attempt to pair \
  you with another participant. As soon as you are paired, you'll start to play the \
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
  training_trials,
  testing_instructions,
  testing_trials,
  instruction_screen_enter_waiting_room,
  start_interaction_loop,
);

/******************************************************************************/
/*** Run the timeline *********************************************************/
/******************************************************************************/

jsPsych.run(full_timeline);

//