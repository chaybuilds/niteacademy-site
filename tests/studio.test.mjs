import test from "node:test";
import assert from "node:assert/strict";
import {TRACKS,GOALS,allLessons,getLesson,getPlan,evaluateDraft,summary} from "../studio/content.mjs";
test("six original tracks and eighteen unique lessons",()=>{
 assert.equal(TRACKS.length,6);
 const ls=allLessons();assert.equal(ls.length,18);
 assert.equal(new Set(ls.map(l=>l.key)).size,18);
 for(const {track,lesson,key} of ls){
  assert.ok(key.startsWith(track.id+":"));
  assert.ok(lesson.task.length>30);
  assert.ok(lesson.scenario.length>40);
  assert.equal(lesson.checks.length,4);
 }
});
test("five learning goals generate a clear route",()=>{
 for(const goal of GOALS){
  const plan=getPlan(goal.id,"new",90);
  assert.equal(plan.goal.id,goal.id);
  assert.equal(plan.weeks.length,3);
  assert.equal(plan.weeks.reduce((sum,week)=>sum+week.minutes,0),90);
 }
});
test("rubric rejects empty work and accepts complete reasoning",()=>{
 const lesson=getLesson("ai:spec").lesson;
 assert.equal(evaluateDraft(lesson,"").pass,false);
 const answer="The known input is Raleigh city and a missing date. Draft a response email that does not confirm a booking or availability. A human must review and check the customer-facing answer before any message is sent to the requester. Ask for the missing date.";
 const result=evaluateDraft(lesson,answer);
 assert.equal(result.pass,true);
 assert.equal(result.score,100);
});
test("pipeline calculations and practice-only scorecard",()=>{
 const lesson=getLesson("sales:funnel").lesson;
 const draft="Response rate is 12/80 = 15%, and paid sale rate is 1/80 = 1.25%. Gross contribution is 175 calculated from 500 - 325. Run a test experiment with a shorter outreach template next week, comparing meeting conversions.";
 assert.equal(evaluateDraft(lesson,draft).pass,true);
 const s=summary({"ai:spec":{score:75,date:"2026-11-08"},"sales:funnel":{score:100,date:"2026-11-08"}});
 assert.equal(s.done,2);assert.equal(s.total,18);assert.equal(s.xp,175);
});
test("blank learner scorecard has zero completed skills",()=>{
 assert.equal(summary({}).done,0);assert.equal(summary({}).percent,0);
});
