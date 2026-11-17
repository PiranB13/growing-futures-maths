"use strict";
/* Runs last: puts topics in teaching order and hands everything to the server. */
const LEVEL_ORDER=['e1','e2','e3','l1','l2'];
TOPICS.sort((a,b)=>LEVEL_ORDER.indexOf(a.level)-LEVEL_ORDER.indexOf(b.level)||a.b-b.b||a.s-b.s);
({LEVELS,LEVEL_ORDER,TOPICS,TMAP,AREAS,BLOCK_NAMES,makeQ,publicQ,solutionOf,check,checkFull,answerText,typedAnswer,plain,setSeed,rnd,shuffle});
