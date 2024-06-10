/******************************************************************************/
/*** Initialise jspsych *******************************************************/
/******************************************************************************/

var jsPsych = initJsPsych({
  on_finish: function() {
      jsPsych.data.displayData('csv');
  },
});

/******************************************************************************/
/*** Generate a random participant ID *****************************************/
/******************************************************************************/

var participant_id = jsPsych.randomization.randomID(10);

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

function save_solo_data(data) {
  var data_to_save = [
    participant_id,
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
    data.label_selected,
    data.rt,
    // data.label_choices
  ];
  var line = data_to_save.join(",") + "\n";
  var this_participant_filename = "solo_" + participant_id + ".csv";
  save_data(this_participant_filename, line);
};

var write_headers = {
  type: jsPsychCallFunction,
  func: function () {
    var this_participant_filename = "solo_" + participant_id + ".csv";
    save_data(
      this_participant_filename,
      "participant_id,\
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
      button_number_selected,label_selected,\
      rt\n"
    );
  },
};

var consent_screen = {
  type: jsPsychHtmlButtonResponseZH,
  stimulus:
  "<h3>Welcome to my experiment!</h3>\
  <p style='text-align:left'>In my experiment, you'll first be trained and tested on an alien language. You'll \
  then use that alien language to label more objects. Your labels for these objects will be checked after. It should take around 20-30 minutes to complete.</p>\
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
  If you wish to leave the experiment, simply close the browser.\
  Unfortunately, this experiment is not suitable for people with visual impairments.</p>",
  choices: ["Yes, I consent to participate."],
};

/******************************************************************************/
/*** Learning Phase ***********************************************************/
/******************************************************************************/

// Training Instructions

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

function observe(image, label) {
  var trial = {
    type: jsPsychImageKeyboardResponse,
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
          save_solo_data(data);
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

// Testing Instructions

var testing_instructions = {
  type: jsPsychHtmlButtonResponseZH,
  stimulus:
    "<h3>The Learning Phase: Testing (Part 2)</h3>\
    <p style='text-align:left'>You'll now be tested on the alien language.\
    <p style='text-align:left'>You'll see an object and have to reproduce its label.</p>\
    <p style='text-align:left'>You'll receive feedback after each submitted response.</p>",
  choices: ["Continue"],
};

// Testing Phase

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
          save_solo_data(data);
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
/*** Solo Director Phase - Expansion ******************************************/
/******************************************************************************/

var participant_final_label_set = [];

// Solo Director Instructions

var instruction_screen_solo_director = {
  type: jsPsychHtmlButtonResponseZH,
  stimulus:
    "<h3>The Expansion Phase</h3>\
    <p style='text-align:left'>You'll see a bordered object in an array of four.\
    Your job is to produce a label to name it.</p>",
  choices: ["Continue"],
};

// Solo Director

function director(target, foils) {
  console.log(target);
  
  var target_pos = jsPsych.randomization.randomInt(0,3);
  console.log(target_pos);
  
  var target_image_as_html = '<img src="' + target + '.png" class="selected">';
  console.log(target_image_as_html);
  
  var images_as_html = foils.map(function(item) {
    return '<img src="' + item + '.png">'
  });
  console.log(images_as_html);
  
  images_as_html = jsPsych.randomization.shuffle(images_as_html);
  images_as_html.splice(target_pos, 0, target_image_as_html);
  console.log(images_as_html);
  var shuffledContext = images_as_html;
  console.log(shuffledContext);

  // available_syllables = jsPsych.randomization.shuffle(available_syllables);

  var building_label = [];
  var continue_production_loop = true;
  var buttons = available_syllables.concat(["<span style='color:red'>DELETE</span>", "<span style='color:green'>DONE</span>"]);

  var trial = {
    type: jsPsychHtmlButtonResponse, 
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
      trial.stimulus = shuffledContext.join(" ")
      console.log(trial.stimulus)
      trial.data = {
        block: "expansion",
        trial_class: "Director",
        shuffled_context: images_as_html,
        target: target,
        target_pos: target_pos,
        foils: foils,
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
          trial.data = { director_label: director_label };
          console.log(data);  
          participant_final_label_set.push(director_label);
          console.log(participant_final_label_set);
          save_solo_data(data);
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
};

var unshuffled_grouped_director = [
  director("yellow_rect", ["blue_rect", "red_rect", "grey_rect"]), // color different
  director("yellow_blob", ["blue_blob", "red_blob", "grey_blob"]), // color different
  director("yellow_oval", ["blue_oval", "red_oval", "grey_oval"]), // color different
  director("yellow_star", ["blue_star", "red_star", "grey_star"]), // color different
  // director("red_rect", ["blue_rect", "yellow_rect", "grey_rect"]), // color different
  // director("red_blob", ["blue_blob", "yellow_blob", "grey_blob"]), // color different
  // director("red_oval", ["blue_oval", "yellow_oval", "grey_oval"]), // color different
  // director("red_star", ["blue_star", "yellow_star", "grey_star"]), // color different
  // director("grey_rect", ["blue_rect", "red_rect", "yellow_rect"]), // color different
  // director("grey_blob", ["blue_blob", "red_blob", "yellow_blob"]), // color different
  // director("grey_oval", ["blue_oval", "red_oval", "yellow_oval"]), // color different
  // director("grey_star", ["blue_star", "red_star", "yellow_star"]), // color different
  // director("blue_rect", ["grey_rect", "red_rect", "yellow_rect"]), // color different
  // director("blue_blob", ["grey_blob", "red_blob", "yellow_blob"]), // color different
  // director("blue_oval", ["grey_oval", "red_oval", "yellow_oval"]), // color different
  // director("blue_star", ["grey_star", "red_star", "yellow_star"]), // color different
  // director("yellow_rect", ["yellow_blob", "yellow_oval", "yellow_star"]), // shape different
  // director("yellow_blob", ["yellow_rect", "yellow_oval", "yellow_star"]), // shape different
  // director("yellow_oval", ["yellow_blob", "yellow_rect", "yellow_star"]), // shape different
  // director("yellow_star", ["yellow_blob", "yellow_oval", "yellow_rect"]), // shape different
  // director("red_rect", ["red_blob", "red_oval", "red_star"]), // shape different
  // director("red_blob", ["red_rect", "red_oval", "red_star"]), // shape different
  // director("red_oval", ["red_blob", "red_rect", "red_star"]), // shape different
  // director("red_star", ["red_blob", "red_oval", "red_rect"]), // shape different
  // director("grey_rect", ["grey_blob", "grey_oval", "grey_star"]), // shape different
  // director("grey_blob", ["grey_rect", "grey_oval", "grey_star"]), // shape different
  // director("grey_oval", ["grey_blob", "grey_rect", "grey_star"]), // shape different
  // director("grey_star", ["grey_blob", "grey_oval", "grey_rect"]), // shape different
  // director("blue_rect", ["blue_blob", "blue_oval", "blue_star"]), // shape different
  // director("blue_blob", ["blue_rect", "blue_oval", "blue_star"]), // shape different
  // director("blue_oval", ["blue_blob", "blue_rect", "blue_star"]), // shape different
  // director("blue_star", ["blue_blob", "blue_oval", "blue_rect"]), // shape different
];

var shuffled_grouped_director = jsPsych.randomization.shuffle(unshuffled_grouped_director);

// ******************************************************************************/
// *** Solo Matcher Phase *******************************************************/
// ******************************************************************************/

// Solo Matcher Instructions

var instruction_screen_solo_matcher = {
  type: jsPsychHtmlButtonResponseZH,
  stimulus:
    "<h3>The Check</h3>\
    <p style='text-align:left'>You'll see all the labels that you produced and an object.\
    Click on your label for the object on the screen.</p>",
  choices: ["Continue"],
};

// Solo Matcher 

function removeDuplicates(arr) {
	return arr.filter((item,
		index) => arr.indexOf(item) === index);
};

function matcher(target) {  
  var target_image_as_html = '<img src="' + target + '.png">';  
  console.log(target_image_as_html);

  var subtrial = {
    type: jsPsychHtmlButtonResponseZH,
    stimulus: target_image_as_html,
    choices: [],
    // prompt: "<p>This label refers to which object?</p>", 
    on_start: function (trial) {
      var label_choices = removeDuplicates(participant_final_label_set);
      console.log(removeDuplicates(label_choices));
      trial.choices = label_choices;
      trial.data = { 
        block: "check",
        trial_class: "Matcher",
        target: target,
        label_choices: label_choices
      };
      console.log(trial.data)
      save_solo_data(data)
    },
    on_finish: function (data) {
      var button_number_selected = data.response;
      console.log(button_number_selected);
      data.button_number_selected = button_number_selected;
      label_selected = data.label_choices[button_number_selected]
      console.log(label_selected)
      data.label_selected = label_selected;
      console.log(data.label_selected);
      console.log(data);
      trial.data = { 
        block: "check",
        trial_class: "Matcher",
        target: target,
        label_selected: label_selected 
      };
      save_solo_data(data);
    },
  };
  return subtrial;
};

var unshuffled_grouped_matcher = [
  matcher("yellow_rect"),
  matcher("yellow_blob"),
  matcher("yellow_oval"),
  matcher("yellow_star"),

  matcher("red_rect"),
  matcher("red_blob"),
  matcher("red_oval"),
  matcher("red_star"),

  matcher("grey_rect"),
  matcher("grey_blob"),
  matcher("grey_oval"),
  matcher("grey_star"),

  matcher("blue_rect"),
  matcher("blue_blob"),
  matcher("blue_oval"),
  matcher("blue_star"),
];

var shuffled_grouped_matcher = jsPsych.randomization.shuffle(unshuffled_grouped_matcher);

/******************************************************************************/
/*** End-of-experiment screen *************************************************/
/******************************************************************************/

var final_screen = {
  type: jsPsychHtmlButtonResponseZH,
  stimulus:
    "<h3>Finished!</h3>\
    <p style='text-align:left'>Congratulations! You have completed the experiment.</p>",
  choices: [],
};

/******************************************************************************/
/******************************************************************************/
/*** Build and run the timeline ***********************************************/
/******************************************************************************/
/******************************************************************************/

var preload_trial = {
  type: jsPsychPreload,
  auto_preload: true,
};

var full_timeline = [].concat(
  consent_screen,
  preload_trial,
  write_headers,
  // training_instructions,
  // training_trials,
  // testing_instructions,
  // testing_trials,
  // instruction_screen_solo_director,
  shuffled_grouped_director,
  instruction_screen_solo_matcher,
  shuffled_grouped_matcher,
  final_screen
);

jsPsych.run(full_timeline);

//