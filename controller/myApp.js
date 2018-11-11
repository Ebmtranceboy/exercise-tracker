const express = require('express')
const mongoose = require('mongoose')
const app= require('express').Router();

const exerciseSchema = mongoose.Schema({
  description: String,
  duration: Number,
  date: Date
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

const studentSchema = mongoose.Schema({
  name: String,
  exerciseIds: [String]
});

const Student = mongoose.model('Student', studentSchema);

app.post("/new-user", (req, res) => {
  const userName = req.body.username;
  const user = new Student({name: userName, exerciseIds: []});
  user.save();
  return res.json({"username": userName, "_id": user._id});
});

 app.get("/users", (req,res) => {
   Student.find({}).select('-exerciseIds -__v').exec((err, data) => {
     res.json(data);
   });
 });

app.post("/add", (req, res) => {
  const student = req.body.userId;
  const descr = req.body.description;
  const dur = req.body.duration;
  const date = req.body.date && req.body.date != "" ? new Date(req.body.date): new Date();
  
  const exercise = new Exercise({description: descr, duration: dur, date:date});
  exercise.save();
  Student.findById(student, 
                  (err, data) => {
                      let exos = data.exerciseIds.concat([exercise._id]);
                      data.exerciseIds = exos;
                      data.save();
  });
  return res.json({description: descr, duration: dur, date:date, _id: student});
});

app.get("/log", (req,res) => {
  const student = req.query.userId;
  const from = req.query.from ? req.query.from : new Date(-8640000000000000);
  const to = req.query.to ? req.query.to : new Date(8640000000000000);
  Student.findById(student).exec((err, data) => {
    const exos = data.exerciseIds;
    const limit= req.query.limit ? Number(req.query.limit) : exos.length;
    console.log(limit);
    Exercise.find({_id: {$in: exos}, $and: [{date: {$gte: from}},{date: {$lte: to}}]})
     .limit(limit)
     .select("-_id -__v")
     .exec((err, content) => 
     res.json({_id: data._id, name: data.name, count: exos.length, log: content}));
   });
 });


module.exports = app