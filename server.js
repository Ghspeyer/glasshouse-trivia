'use strict';
const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const path     = require('path');
const os       = require('os');

const app        = express();
const httpServer = http.createServer(app);
const io         = new Server(httpServer, { cors: { origin: '*' } });
const PORT       = process.env.PORT || 3000;

// ════════════════════════════════════════════════════════════════════════════
// GAME DATA  (editable at runtime via host:editQuestion)
// ════════════════════════════════════════════════════════════════════════════
const TEAM_COLORS = ['#00C8FF', '#FF6B6B', '#FFD700', '#00E676'];

const ROUNDS = [
  {
    name: 'General Knowledge', color: '#00C8FF',
    questions: [
      { q: 'How many bones does an adult human body have?', a: '206', d: 2 },
      { q: 'What is the ONLY country in the world that borders both Spain AND France?', a: 'Andorra', d: 3 },
      { q: 'What is the chemical symbol for gold, and what Latin word does it derive from?', a: 'Au — from "Aurum" (Latin for gold)', d: 3 },
      { q: 'How many time zones does Russia span?', a: '11 time zones', d: 3 },
      { q: 'How many countries in the world share a land border with China?', a: '14 countries', d: 3 },
    ]
  },
  {
    name: 'World History', color: '#FFD700',
    questions: [
      { q: 'In what year was the Magna Carta signed, and which English king was forced to seal it?', a: '1215 · King John', d: 3 },
      { q: 'Who was the first woman to win a Nobel Prize?', a: 'Marie Curie (1903 · Physics)', d: 2 },
      { q: 'How many amendments does the United States Constitution currently have?', a: '27 amendments', d: 3 },
      { q: 'The Black Death of the 14th century killed approximately what fraction of Europe\'s population?\n(Accept a range)', a: 'One-third to one-half (accept 30–60%)', d: 3 },
      { q: 'In what year did the Western Roman Empire officially fall?', a: '476 AD', d: 3 },
    ]
  },
  {
    name: 'Name That Tune', color: '#BB86FC',
    note: 'Host plays a clip — name the song AND artist. All songs from 1980 onward.',
    timed: false,
    questions: [
      { q: 'Song 1', a: '—', d: 1 },
      { q: 'Song 2', a: '—', d: 2 },
      { q: 'Song 3', a: '—', d: 2 },
      { q: 'Song 4', a: '—', d: 3 },
      { q: 'Song 5', a: '—', d: 3 },
    ]
  },
  {
    name: 'Movie Quotes', color: '#FF6B6B',
    note: 'Name the film (and actor/character when asked). All films from 1980 onward.',
    questions: [
      { q: 'In what 1996 sports dramedy does a desperate agent try to win back his estranged wife with a heartfelt speech, only for her to stop him mid-sentence with "You had me at hello"?\n\nName the film.', a: 'Jerry Maguire (1996)', d: 2 },
      { q: 'In what 1999 sci-fi film does a computer hacker learn that all of reality is a simulation, and a mentor offers him a choice between a red pill and a blue pill?\n\nName the film AND the actress who played Trinity.', a: 'The Matrix (1999) — Carrie-Anne Moss', d: 3 },
      { q: 'In what 2008 Christopher Nolan film does the villain lean toward a hospitalized city official and whisper "Why so serious?" while recounting how he got his scars?\n\nName the film AND the actor who played the villain.', a: 'The Dark Knight (2008) — Heath Ledger', d: 3 },
      { q: 'In what 1994 film do two hitmen debate whether a foot massage qualifies as intimacy, while one casually notes that a "Royale with Cheese" is just the French name for a Quarter Pounder?\n\nName the film AND its director.', a: 'Pulp Fiction (1994) — Quentin Tarantino', d: 3 },
      { q: 'In what 1980 psychological horror film does a snowbound hotel caretaker — slowly losing his mind — hack through a bathroom door with an axe and shout "Here\'s Johnny!" at his terrified wife?\n\nName the film AND its director.', a: 'The Shining (1980) — Stanley Kubrick', d: 3 },
    ]
  },
  {
    name: '90s & 2000s Hits', color: '#FFB74D',
    questions: [
      { q: 'In what year did "Seinfeld" air its controversial series finale, and what crime were the four main characters put on trial for?', a: '1998 · Violating a Good Samaritan law (failing to help a carjacking victim)', d: 3 },
      { q: 'Destiny\'s Child released "Say My Name" in what year? (±1 year accepted)', a: '1999', d: 2 },
      { q: 'Which British rock band released the album "OK Computer" in 1997, widely considered one of the greatest albums ever made?', a: 'Radiohead', d: 3 },
      { q: 'Which boy band released the mega-hit album "Millennium" in 1999, featuring "I Want It That Way"?', a: 'Backstreet Boys', d: 2 },
      { q: 'What year did "American Idol" first air in the United States, and who won that inaugural season?', a: '2002 · Kelly Clarkson', d: 3 },
    ]
  },
  {
    name: 'Back In My Day', color: '#00E676',
    questions: [
      { q: 'What year did "Space Invaders" first appear in U.S. arcades, and which Japanese company developed it?', a: '1978 · Taito Corporation', d: 3 },
      { q: 'Before smartphones, what portable device let people listen to CDs on the go?', a: 'Discman / Portable CD Player', d: 1 },
      { q: 'This video rental giant had nearly 9,000 stores worldwide at its peak.\nName it AND the year it filed for bankruptcy.', a: 'Blockbuster · 2010', d: 3 },
      { q: 'What was the name of the dominant dial-up internet service that mailed millions of Americans free trial CDs throughout the 1990s?', a: 'AOL (America Online)', d: 2 },
      { q: 'The Motorola DynaTAC 8000X, introduced in 1983, holds what distinction in consumer technology — and approximately how much did it cost at launch?', a: 'First commercially available handheld cellular phone · ~$3,995', d: 3 },
    ]
  },
  {
    name: 'Potent Potables', color: '#FF6B6B',
    questions: [
      { q: 'What spirit forms the base of a classic Mojito?', a: 'Rum (White Rum)', d: 1 },
      { q: 'What is the primary grain in bourbon whiskey\'s mash bill, and what percentage must it legally comprise?', a: 'Corn · at least 51%', d: 3 },
      { q: 'A classic Negroni has exactly three ingredients.\nName all three for full credit.', a: 'Gin + Campari + Sweet Vermouth\n(must name all 3)', d: 3 },
      { q: 'Tequila can only legally be produced in certain regions of Mexico.\nWhat specific plant must it be made from?', a: 'Blue Agave (Weber blue agave)', d: 2 },
      { q: 'The "Last Word" cocktail — popularized during Prohibition — is made with four equal-part ingredients.\nName all four for full credit.', a: 'Gin + Green Chartreuse + Maraschino Liqueur + Fresh Lime Juice\n(must name all 4)', d: 3 },
    ]
  },
  {
    name: 'Sports & Pop Culture', color: '#FFD700',
    questions: [
      { q: 'Who holds the record for the most Grand Slam titles in women\'s tennis singles history?', a: 'Serena Williams (23 titles)', d: 2 },
      { q: 'Who holds the NFL record for most career rushing yards, and with which team did he spend the majority of his career?', a: 'Emmitt Smith · Dallas Cowboys', d: 3 },
      { q: 'What country has won the most FIFA World Cup titles?\n(Bonus: how many times?)', a: 'Brazil — 5 times\n(1958, 1962, 1970, 1994, 2002)', d: 3 },
      { q: 'In what year did Michael Jordan win his FIRST NBA Championship with the Chicago Bulls?', a: '1991', d: 2 },
      { q: 'Which NFL quarterback was first to throw for more than 5,000 yards in a single regular season, and in what year?', a: 'Dan Marino (Miami Dolphins) · 1984', d: 3 },
    ]
  },
  {
    name: 'Food & Travel', color: '#00C8FF',
    questions: [
      { q: 'What is the most visited country in the world by international tourists?', a: 'France', d: 2 },
      { q: 'What country produces more than 60% of the world\'s vanilla supply?', a: 'Madagascar', d: 3 },
      { q: 'What spice — harvested from the stigmas of a specific flower — is the most expensive spice in the world by weight?', a: 'Saffron', d: 3 },
      { q: 'Which country consumes the most chocolate per capita in the world?', a: 'Switzerland', d: 2 },
      { q: '"Ceviche" is a dish where raw seafood is "cooked" without heat.\nWhat country is credited as its origin, and what acid is traditionally used to cure the fish?', a: 'Peru · Lime juice (citric acid)', d: 3 },
    ]
  },
];

// ════════════════════════════════════════════════════════════════════════════
// GAME STATE
// ════════════════════════════════════════════════════════════════════════════
let G = initState();

// ── Chat history (up to 50 messages per team, keyed by team index) ──
const chatHistory = {};
function getChatHistory(idx) {
  if (!chatHistory[idx]) chatHistory[idx] = [];
  return chatHistory[idx];
}

// ── Player tracking (keyed by lowercase name for reconnect support) ──
const activePlayers = {};

function broadcastPlayers() {
  io.to('host').emit('players:update', Object.values(activePlayers));
}

function syncTeamMembers() {
  G.teams.forEach((t, i) => {
    const tp = Object.values(activePlayers).filter(p => p.teamIdx === i);
    const cap = tp.find(p => p.isCaptain);
    t.members = [
      ...(cap ? [cap.name] : []),
      ...tp.filter(p => !p.isCaptain).map(p => p.name),
    ];
    t.captainName = cap ? cap.name : '';
  });
}

function initState() {
  return {
    phase: 'setup',
    teams: [],
    round: 0,
    qIdx: -1,
    answerShown: false,
    answers: {},
    submitted: {},
    results: {},
    scoreboardOpen: false,
  };
}

let timer = { sec: 30, running: false };
let timerId = null;

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════
function key(r, q, t) { return `r${r}q${q}t${t}`; }

function publicState() {
  const r = (G.phase !== 'setup' && G.phase !== 'lobby') ? ROUNDS[G.round] : null;
  const q = r && G.qIdx >= 0 ? r.questions[G.qIdx] : null;

  const ans = {}, res = {};
  if (q) {
    G.teams.forEach((_, i) => {
      const k = key(G.round, G.qIdx, i);
      ans[i] = { answer: G.answers[k] || '', submitted: !!G.submitted[k] };
      res[i] = G.results[k] || null;
    });
  }

  return {
    phase:          G.phase,
    round:          G.round,
    qIdx:           G.qIdx,
    roundName:      r?.name        || '',
    roundNum:       G.round + 1,
    roundTotal:     ROUNDS.length,
    roundColor:     r?.color       || '#00C8FF',
    roundNote:      r?.note        || '',
    roundTimed:     r ? (r.timed !== false) : true,
    qTotal:         r?.questions.length || 0,
    roundPoints:    r ? r.questions.reduce((s, q) => s + (q.d || 1), 0) : 0,
    qText:          q?.q           || '',
    qDiff:          q?.d           || 1,
    aText:          (G.answerShown && q) ? q.a : '',
    answerShown:    G.answerShown,
    teams:          G.teams.map(t => ({
      name: t.name, members: t.members, score: t.score,
      color: t.color, emoji: t.emoji || '',
      captainName: t.captainName || '',
    })),
    answers:        ans,
    results:        res,
    scoreboardOpen: G.scoreboardOpen,
  };
}

function bcast() { io.emit('state', publicState()); }

// ════════════════════════════════════════════════════════════════════════════
// TIMER
// ════════════════════════════════════════════════════════════════════════════
function startTimer() {
  if (timer.running) return;
  timer.running = true;
  timerId = setInterval(() => {
    timer.sec = Math.max(0, timer.sec - 1);
    io.emit('timer', { ...timer });
    if (timer.sec === 0) stopTimer();
  }, 1000);
  io.emit('timer', { ...timer });
}
function stopTimer()  { clearInterval(timerId); timer.running = false; io.emit('timer', { ...timer }); }
function resetTimer() { stopTimer(); timer.sec = 30; io.emit('timer', { ...timer }); }

// ════════════════════════════════════════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════════════════════════════════════════
function doNext() {
  resetTimer();
  G.answerShown = false;
  G.scoreboardOpen = false;

  if (G.phase === 'ri') {
    G.qIdx = 0; G.phase = 'q';
  } else if (G.phase === 'q') {
    const qLen = ROUNDS[G.round].questions.length;
    if (G.qIdx < qLen - 1) {
      G.qIdx++;
    } else if (G.round < ROUNDS.length - 1) {
      G.round++; G.qIdx = -1; G.phase = 'ri';
      if (G.round === 3 || G.round === 6) G.scoreboardOpen = true;
    } else {
      G.phase = 'final';
    }
  }

  if (G.phase === 'q' && ROUNDS[G.round].timed !== false) {
    startTimer();
  }

  bcast();
}

function doPrev() {
  resetTimer();
  G.answerShown = false;
  if      (G.phase === 'q' && G.qIdx > 0)          { G.qIdx--; }
  else if (G.phase === 'q' && G.qIdx === 0)         { G.qIdx = -1; G.phase = 'ri'; }
  else if (G.phase === 'ri' && G.round > 0)         { G.round--; G.qIdx = ROUNDS[G.round].questions.length - 1; G.phase = 'q'; }
  bcast();
}

// ════════════════════════════════════════════════════════════════════════════
// SOCKET.IO
// ════════════════════════════════════════════════════════════════════════════
io.on('connection', socket => {
  socket.data = {};
  socket.emit('state', publicState());
  socket.emit('timer', { ...timer });

  socket.on('register:host', () => {
    socket.join('host');
    socket.emit('players:update', Object.values(activePlayers));
  });

  // ── Setup → Lobby ──────────────────────────────────────────────────────────
  socket.on('host:createTeams', teams => {
    G = initState();
    G.phase = 'lobby';
    G.teams = teams.map((t, i) => ({
      name:        t.name  || `Team ${i+1}`,
      members:     [],
      emoji:       t.emoji || '',
      score:       0,
      color:       TEAM_COLORS[i],
      captainName: '',
    }));
    Object.keys(activePlayers).forEach(k => delete activePlayers[k]);
    resetTimer();
    bcast();
    broadcastPlayers();
  });

  // ── Lobby → Game ───────────────────────────────────────────────────────────
  socket.on('host:startGame', () => {
    if (G.phase !== 'lobby') return;
    G.phase = 'ri';
    bcast();
  });

  // ── Player join & reconnect ────────────────────────────────────────────────
  socket.on('play:join', ({ name }) => {
    const n = String(name || '').trim().slice(0, 30);
    if (!n) return;
    const lk = n.toLowerCase();
    if (activePlayers[lk]) {
      activePlayers[lk].sid = socket.id;
    } else {
      activePlayers[lk] = { name: n, sid: socket.id, teamIdx: null, isCaptain: false };
    }
    socket.data.playerKey = lk;
    const p = activePlayers[lk];
    if (p.teamIdx !== null) {
      socket.emit('play:joined', { teamIdx: p.teamIdx });
    } else {
      socket.emit('play:waiting', {});
    }
    broadcastPlayers();
  });

  // ── Host: rename team (name or emoji) ─────────────────────────────────────
  socket.on('host:renameTeam', ({ teamIdx, name, emoji }) => {
    if (!G.teams[teamIdx]) return;
    if (name  !== undefined) G.teams[teamIdx].name  = String(name).trim().slice(0, 22) || G.teams[teamIdx].name;
    if (emoji !== undefined) G.teams[teamIdx].emoji = String(emoji).trim().slice(0, 2);
    bcast();
  });

  // ── Host: assign player to team ────────────────────────────────────────────
  socket.on('host:assignPlayer', ({ name, teamIdx }) => {
    const lk = String(name || '').toLowerCase();
    if (!activePlayers[lk] || teamIdx < 0 || teamIdx >= G.teams.length) return;
    activePlayers[lk].teamIdx = teamIdx;
    // Auto-captain if this team has no captain yet
    const hasTeamCaptain = Object.values(activePlayers).some(
      p => p.teamIdx === teamIdx && p.isCaptain
    );
    if (!hasTeamCaptain) activePlayers[lk].isCaptain = true;
    syncTeamMembers();
    bcast();
    broadcastPlayers();
    const sid = activePlayers[lk].sid;
    if (sid) io.to(sid).emit('play:joined', { teamIdx });
  });

  // ── Host: set captain ──────────────────────────────────────────────────────
  socket.on('host:setCaptain', ({ name, teamIdx }) => {
    const lk = String(name || '').toLowerCase();
    if (!activePlayers[lk] || activePlayers[lk].teamIdx !== teamIdx) return;
    Object.values(activePlayers).forEach(p => { if (p.teamIdx === teamIdx) p.isCaptain = false; });
    activePlayers[lk].isCaptain = true;
    syncTeamMembers();
    bcast();
    broadcastPlayers();
  });

  // ── Host: remove player from team ─────────────────────────────────────────
  socket.on('host:removePlayer', ({ name }) => {
    const lk = String(name || '').toLowerCase();
    if (!activePlayers[lk]) return;
    const prevTeam   = activePlayers[lk].teamIdx;
    const wasCaptain = activePlayers[lk].isCaptain;
    activePlayers[lk].teamIdx   = null;
    activePlayers[lk].isCaptain = false;
    // Auto-promote another player as captain if the removed player was captain
    if (wasCaptain && prevTeam !== null) {
      const remaining = Object.values(activePlayers).filter(p => p.teamIdx === prevTeam);
      if (remaining.length > 0) remaining[0].isCaptain = true;
    }
    syncTeamMembers();
    bcast();
    broadcastPlayers();
    const sid = activePlayers[lk].sid;
    if (sid) io.to(sid).emit('play:waiting', {});
  });

  socket.on('host:restart', () => {
    G = initState();
    resetTimer();
    Object.keys(chatHistory).forEach(k => delete chatHistory[k]);
    Object.keys(activePlayers).forEach(k => delete activePlayers[k]);
    bcast();
    broadcastPlayers();
  });

  socket.on('host:next',   doNext);
  socket.on('host:prev',   doPrev);

  socket.on('host:reveal', () => {
    G.answerShown = !G.answerShown;
    if (G.answerShown) stopTimer();
    bcast();
  });

  socket.on('host:score', ({ teamIdx, delta }) => {
    if (!G.teams[teamIdx]) return;
    G.teams[teamIdx].score = Math.max(0, G.teams[teamIdx].score + delta);
    const k = key(G.round, G.qIdx, teamIdx);
    if (G.qIdx >= 0) G.results[k] = delta > 0 ? 'correct' : (delta < 0 ? 'wrong' : null);
    bcast();
  });

  socket.on('host:scoreboard', () => { G.scoreboardOpen = !G.scoreboardOpen; bcast(); });

  socket.on('host:timer', ({ action }) => {
    if (action === 'start') startTimer();
    else if (action === 'stop') stopTimer();
    else if (action === 'reset') resetTimer();
  });

  socket.on('host:editQuestion', ({ roundIdx, qIdx, q, a, d }) => {
    if (ROUNDS[roundIdx] && ROUNDS[roundIdx].questions[qIdx]) {
      ROUNDS[roundIdx].questions[qIdx].q = q;
      ROUNDS[roundIdx].questions[qIdx].a = a;
      if (typeof d === 'number' && [1,2,3].includes(d)) ROUNDS[roundIdx].questions[qIdx].d = d;
      if (G.phase === 'q' && G.round === roundIdx && G.qIdx === qIdx) bcast();
    }
  });

  socket.on('host:addRound', (round) => {
    ROUNDS.push({
      name:      round.name      || 'New Round',
      color:     round.color     || '#00C8FF',
      note:      round.note      || '',
      timed:     round.timed !== false,
      questions: (round.questions || []).map(q => ({
        q: q.q || '', a: q.a || '', d: q.d || 2
      }))
    });
    bcast();
  });

  socket.on('host:setRoundTimed', ({ roundIdx, timed }) => {
    if (ROUNDS[roundIdx]) { ROUNDS[roundIdx].timed = !!timed; bcast(); }
  });

  socket.on('host:deleteRound', (idx) => {
    if (ROUNDS.length <= 1 || idx < 0 || idx >= ROUNDS.length) return;
    ROUNDS.splice(idx, 1);
    if (G.round >= ROUNDS.length) { G.round = ROUNDS.length - 1; G.qIdx = -1; G.phase = 'ri'; }
    bcast();
  });

  socket.on('host:renameRound', ({ roundIdx, name }) => {
    if (ROUNDS[roundIdx]) { ROUNDS[roundIdx].name = name; bcast(); }
  });

  socket.on('host:setRoundNote', ({ roundIdx, note }) => {
    if (ROUNDS[roundIdx]) { ROUNDS[roundIdx].note = String(note || '').slice(0, 500); bcast(); }
  });

  socket.on('host:broadcast', ({ msg }) => {
    const text = String(msg || '').trim().slice(0, 500);
    if (!text) return;
    const entry = { name: '📢 Host', msg: text, ts: Date.now(), broadcast: true };
    G.teams.forEach((_, i) => {
      const hist = getChatHistory(i);
      hist.push(entry);
      if (hist.length > 50) hist.shift();
    });
    io.emit('chat:broadcast', entry);
  });

  socket.on('chat:join', (idx) => {
    [...socket.rooms].filter(r => r.startsWith('chat:')).forEach(r => socket.leave(r));
    socket.join('chat:' + idx);
    socket.emit('chat:history', getChatHistory(idx).slice(-50));
  });

  socket.on('chat:send', ({ teamIdx: idx, name, msg }) => {
    if (typeof idx !== 'number' || idx < 0 || idx >= G.teams.length) return;
    const text = String(msg || '').trim().slice(0, 300);
    if (!text) return;
    const pName = String(name || 'Anonymous').trim().slice(0, 30) || 'Anonymous';
    const entry = { name: pName, msg: text, ts: Date.now() };
    const hist = getChatHistory(idx);
    hist.push(entry);
    if (hist.length > 50) hist.shift();
    io.to('chat:' + idx).emit('chat:msg', entry);
  });

  socket.on('play:answer', ({ round, qIdx, teamIdx, answer }) => {
    if (G.phase !== 'q') return;
    if (round !== G.round || qIdx !== G.qIdx) return;
    if (teamIdx < 0 || teamIdx >= G.teams.length) return;
    const k = key(round, qIdx, teamIdx);
    G.answers[k]   = answer;
    G.submitted[k] = true;
    bcast();
  });

  socket.on('disconnect', () => {
    const lk = socket.data?.playerKey;
    if (lk && activePlayers[lk]) {
      activePlayers[lk].sid = null;
      broadcastPlayers();
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// STATIC FILES & ROUTES
// ════════════════════════════════════════════════════════════════════════════
app.use(express.static(path.join(__dirname, 'public')));
app.get('/',     (_req, res) => res.redirect('/play'));
app.get('/host', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'host.html')));
app.get('/play', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'play.html')));

// ════════════════════════════════════════════════════════════════════════════
// START
// ════════════════════════════════════════════════════════════════════════════
function getLocalIP() {
  for (const iface of Object.values(os.networkInterfaces()))
    for (const a of iface)
      if (a.family === 'IPv4' && !a.internal) return a.address;
  return 'localhost';
}

httpServer.listen(PORT, () => {
  const ip = getLocalIP();
  console.log('\n🎉  GlassHouse Trivia Night — Server Running\n');
  console.log(`   HOST (you):      http://localhost:${PORT}/host`);
  console.log(`   TEAMS share:     http://${ip}:${PORT}/play\n`);
  console.log('   Keep this window open during the game.');
  console.log('   Press Ctrl+C to stop.\n');
  console.log('   TIP: For remote teams outside your network,');
  console.log(`   run: npx ngrok http ${PORT}  and share the ngrok URL.\n`);
});
