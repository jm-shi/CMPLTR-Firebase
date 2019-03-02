let currentRoutines = require('../currentRoutines.json');
let previousRoutines = require('../previousRoutines.json');

const db = require('../mongoose.js');
const { CurrentRoutine, PreviousRoutine } = require('../models/routine.js');

exports.addRoutine = function (req, res) {
  const id = req.body.id;
  const createdAt = req.body.createdAt;
  const title = req.body.title;
  const daysCompleted = 0;
  const daysToComplete = req.body.daysToComplete;
  let completionChart = [];
  for (let i = 0; i < daysToComplete; i++) completionChart.push(0);
  const alarm = req.body.alarm;
  const repeatMonday = req.body.repeatMonday;
  const repeatTuesday = req.body.repeatTuesday;
  const repeatWednesday = req.body.repeatWednesday;
  const repeatThursday = req.body.repeatThursday;
  const repeatFriday = req.body.repeatFriday;
  const repeatSaturday = req.body.repeatSaturday;
  const repeatSunday = req.body.repeatSunday;
  const everyDay = (!repeatSunday && !repeatMonday && !repeatTuesday && !repeatWednesday
    && !repeatThursday && !repeatFriday) || (repeatSunday && repeatMonday
      && repeatTuesday && repeatWednesday && repeatThursday && repeatFriday && repeatSaturday);
  const everyOtherDay = req.body.everyOtherDay;

  let goals = req.body.goals;
  goals = goals.split(",");
  // Remove leading and trailing spaces
  for (let i = 0; i < goals.length; i++) {
    goals[i] = goals[i].trim();
  }
  // Exclude last goal if it's an empty string
  if (goals[goals.length - 1].trim() === "") goals.pop();
  // Capitalize first letter of each item in goals array
  for (let i = 0; i < goals.length; i++) {
    goals[i] = goals[i].charAt(0).toUpperCase() + goals[i].substr(1);
  }
  goals = goals.length === 0 ? undefined : goals;
  console.log('The goals are', goals);

  const goalReward = req.body.goalReward;

  const currentRoutine = {
    id,
    createdAt,
    title,
    daysCompleted,
    daysToComplete,
    completionChart,
    alarm,
    repeatMonday,
    repeatTuesday,
    repeatWednesday,
    repeatThursday,
    repeatFriday,
    repeatSaturday,
    repeatSunday,
    everyDay,
    everyOtherDay,
    goals,
    goalReward
  };

  if (title && daysToComplete) {
    currentRoutines.routines.unshift(currentRoutine);

    const newRoutine = new CurrentRoutine(currentRoutine);
    newRoutine.save().then(function () {
      console.log('Created new routine!');
      res.send(newRoutine);
      return res.redirect('/currentRoutines');
    }).catch(function (err) {
      res.status(400).send(err);
    });
    // return res.redirect(`/routine/${id}`);
  }
};

exports.completeRoutine = function (req, res) {
  const id = req.params.id;
  const completedGoalsCount = parseInt(req.body.completedGoalsCount);
  let goalsArray = req.body.goalsArray;
  if (goalsArray) {
    goalsArray = goalsArray.map(function (item) {
      return {
        goal: item.goal,
        completed: parseInt(item.completed)
      }
    });
  }

  // Add routine to previous routine
  const routineToMove = currentRoutines.routines.find(function (routine) {
    return routine.id === id;
  });
  routineToMove.completedGoalsCount = completedGoalsCount;
  routineToMove.goalsArray = goalsArray;

  const date = new Date();
  const finishDate = {
    day: date.getDay(),
    month: date.getMonth(),
    date: date.getDate(),
    year: date.getFullYear()
  }
  const finishDateString = JSON.stringify(finishDate);
  routineToMove.finishDate = finishDateString;

  previousRoutines.routines.unshift(routineToMove);

  // Delete routine from current routine
  currentRoutines.routines = currentRoutines.routines.filter(function (routine) {
    return routine.id !== id;
  });

  res.render('currentRoutines', {
    navbarTitle: 'Current Routine',
    currentRoutines
  });
};

exports.deletePreviousRoutine = function (req, res) {
  const id = req.params.id;
  previousRoutines.routines = previousRoutines.routines.filter(function (
    routine
  ) {
    return routine.id !== id;
  });
  return res.redirect('/previousRoutines');
};

exports.deleteRoutine = function (req, res) {
  const id = req.params.id;
  currentRoutines.routines = currentRoutines.routines.filter(function (routine) {
    return routine.id !== id;
  });
  return res.redirect('/currentRoutines');
};

exports.editRoutine = function (req, res) {
  const id = req.params.id;

  let goals = req.body.goals;
  goals = goals.split(",");
  // Remove leading and trailing spaces
  for (let i = 0; i < goals.length; i++) {
    goals[i] = goals[i].trim();
  }
  // Exclude last goal if it's an empty string
  if (goals[goals.length - 1].trim() === "") goals.pop();
  // Capitalize first letter of each item in goals array
  for (let i = 0; i < goals.length; i++) {
    goals[i] = goals[i].charAt(0).toUpperCase() + goals[i].substr(1);
  }

  const update = {
    title: req.body.title,
    daysToComplete: req.body.daysToComplete,
    alarm: req.body.alarm,
    repeatMonday: req.body.repeatMonday,
    repeatTuesday: req.body.repeatTuesday,
    repeatWednesday: req.body.repeatWednesday,
    repeatThursday: req.body.repeatThursday,
    repeatFriday: req.body.repeatFriday,
    repeatSaturday: req.body.repeatSaturday,
    repeatSunday: req.body.repeatSunday,
    everyDay: (!req.body.repeatSunday && !req.body.repeatMonday && !req.body.repeatTuesday
      && !req.body.repeatWednesday && !req.body.repeatThursday && !req.body.repeatFriday)
      || (req.body.repeatSunday && req.body.repeatMonday && req.body.repeatTuesday
        && req.body.repeatWednesday && req.body.repeatThursday && req.body.repeatFriday
        && req.body.repeatSaturday),
    everyOtherDay: req.body.everyOtherDay,
    goalReward: req.body.goalReward,
    goals: goals
  }

  CurrentRoutine.findByIdAndUpdate(id, update, { new: true }, function (err, updatedRoutine) {
    if (err) {
      return console.log('Error with updating routine', err);
    }
    return res.redirect('/currentRoutines');
  });
};

exports.updateCompletionLog = function (req, res) {
  console.log('Update completion log', req.body);

  const index = req.body.index;
  const isComplete = req.body.isComplete === 'on' ? 1 : 0;
  const id = req.params.id;

  let update = {};
  update['completionChart.' + index] = isComplete;

  const indexToUpdate = 'completionChart.' + index;
  const incrementBy = isComplete ? 1 : -1;

  update = {
    $set: { [indexToUpdate]: isComplete },
    $inc: { daysCompleted: incrementBy }
  }

  CurrentRoutine.findByIdAndUpdate(id, update, { new: true }, function (err, updatedRoutine) {
    if (err) {
      return console.log('Error with updating completion log', err);
    }
    res.render('currentRoutine', {
      navbarTitle: 'Current Routine',
      currentRoutineData: updatedRoutine
    });
  });
};

exports.viewCreateRoutine = function (req, res) {
  res.render('createRoutine', {
    navbarTitle: 'Create Routine',
    currentRoutines
  });
};

exports.viewCreateRoutineAlt = function (req, res) {
  res.render('createRoutineAlt', {
    navbarTitle: 'Create Routine',
    currentRoutines
  });
};

exports.viewCurrentRoutine = function (req, res) {
  const id = req.params.id;

  CurrentRoutine.findById(id, function (err, routine) {
    if (err) {
      return console.log('Error with finding current routine:', err);
    }

    console.log('Current routine data:', routine);
    res.render('currentRoutine', {
      navbarTitle: 'Current Routine',
      currentRoutineData: routine
    });
  });
};

exports.viewEditRoutine = function (req, res) {
  const id = req.params.id;

  CurrentRoutine.findById(id, function (err, currentRoutine) {
    if (err) {
      return console.log('Could not view edit routine screen', err);
    }
    console.log('Found routine!', currentRoutine);
    if (currentRoutine.goals) {
      // Append a space to the start of each subsequent goal
      for (let i = 1; i < currentRoutine.goals.length; i++) {
        if (currentRoutine.goals[i].charAt(0) != " ") {
          currentRoutine.goals[i] = " " + currentRoutine.goals[i];
        }
      }
    }

    res.render('editRoutine', {
      navbarTitle: 'Edit Routine',
      currentRoutineData: currentRoutine
    });
  })
};

exports.viewPreviousRoutine = function (req, res) {
  const id = req.params.id;

  const previousRoutineData = previousRoutines.routines.find(function (routine) {
    return routine.id === id;
  });

  console.log('Previous routine data:', previousRoutineData);

  res.render('previousRoutine', {
    navbarTitle: 'Archived Routine',
    previousRoutineData
  });
};

exports.viewAllCurrentRoutines = function (req, res) {
  CurrentRoutine.find({}, function (err, currRoutines) {
    res.render('currentRoutines', {
      navbarTitle: 'Current Routines',
      currentRoutines: currRoutines
    });
  });
};

exports.viewAllPreviousRoutines = function (req, res) {
  res.render('previousRoutines', {
    navbarTitle: 'Archived Routines',
    previousRoutines
  });
};
