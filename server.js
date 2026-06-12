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
const TEAM_COLORS = ['#00C8FF', '#FF6B6B', '#FFD700', '#00E676', '#BB86FC', '#FFB74D', '#FF8A65', '#80DEEA'];

const ROUNDS = [
  {
    name: 'General Knowledge', color: '#00C8FF',
    questions: [
      { q: 'What is the capital city of Australia?', a: 'Canberra', d: 1 },
      { q: 'How many colors are in a standard rainbow?', a: '7 (red, orange, yellow, green, blue, indigo, violet)', d: 1 },
      { q: 'The world\'s longest river flows northward through multiple countries before emptying into the Mediterranean Sea. Name it.', a: 'The Nile', d: 2 },
      { q: 'The only metal that remains liquid at room temperature, this element carries the chemical symbol Hg — derived from its Latin name "Hydrargyrum," meaning liquid silver. Name it.', a: 'Mercury', d: 2 },
      { q: 'Standing at 19,341 feet in East Africa, this dormant stratovolcano is the tallest free-standing mountain on Earth and the highest point on the African continent. Name it.', a: 'Mount Kilimanjaro', d: 3 },
    ]
  },
  {
    name: 'World History', color: '#FFD700',
    questions: [
      { q: 'Who was the first woman to win a Nobel Prize?', a: 'Marie Curie (Physics, 1903)', d: 1 },
      { q: 'The Black Death of the 14th century killed approximately what fraction of Europe\'s population? (Accept a range)', a: 'One-third to one-half (30–60%)', d: 1 },
      { q: 'Sealed at a meadow called Runnymede in 1215, this landmark royal charter was one of the first documents to establish limits on a king\'s power. What was it called?', a: 'The Magna Carta', d: 2 },
      { q: 'Starting with the Bill of Rights in 1791, the U.S. Constitution has been amended over more than two centuries. How many amendments does it currently have?', a: '27 amendments', d: 2 },
      { q: 'This warrior queen of the Iceni tribe launched a fierce revolt against Roman occupation of Britain around 60 AD — torching several Roman settlements including Londinium before her forces were ultimately defeated. Name her.', a: 'Boudica (also accepted: Boudicca)', d: 3 },
    ]
  },
  {
    name: 'Name That Tune', color: '#BB86FC',
    note: 'Host plays a clip — name the song AND artist. All songs from 1980 onward.',
    timed: false,
    questions: [
      { q: 'Song 1', a: '"Blank Space" – Taylor Swift', d: 1 },
      { q: 'Song 2', a: '"Wake Me Up Before You Go-Go" – Wham!', d: 1 },
      { q: 'Song 3', a: '"Get Lucky" – Daft Punk ft. Pharrell Williams', d: 2 },
      { q: 'Song 4', a: '"Dixieland Delight" – Alabama', d: 2 },
      { q: 'Song 5', a: '"To Be With You" – Mr. Big', d: 3 },
    ]
  },
  {
    name: 'Movie Quotes', color: '#FF6B6B',
    note: 'Name the film. All films from 1980 onward.',
    questions: [
      { q: '"You had me at hello." In what 1996 sports dramedy does a desperate sports agent use this line to win back the woman he loves?\n\nName the film.', a: 'Jerry Maguire (1996)', d: 1 },
      { q: '"I know kung fu." In what 1999 sci-fi blockbuster does a computer hacker discover that all of reality is a simulation?\n\nName the film.', a: 'The Matrix (1999)', d: 1 },
      { q: '"I\'ll be back." In what 1984 James Cameron sci-fi film does a relentless, time-traveling cybernetic assassin deliver this iconic line to a police station desk clerk?\n\nName the film.', a: 'The Terminator (1984)', d: 2 },
      { q: '"Royale with Cheese." In what 1994 Quentin Tarantino crime film do two hitmen casually debate fast food terminology while on the job?\n\nName the film.', a: 'Pulp Fiction (1994)', d: 2 },
      { q: 'Directed by David Fincher in 1999, this psychological thriller follows a sleep-deprived office worker who forms an underground fight club with a mysterious soap salesman — and ends with one of cinema\'s most shocking plot twists.\n\nName the film.', a: 'Fight Club (1999)', d: 3 },
    ]
  },
  {
    name: '90s & 2000s Hits', color: '#FFB74D',
    questions: [
      { q: 'What is the name of the fictional coffee house where the six main characters of "Friends" spend most of their time?', a: 'Central Perk', d: 1 },
      { q: 'Which boy band released the mega-hit album "Millennium" in 1999, featuring "I Want It That Way"?', a: 'Backstreet Boys', d: 1 },
      { q: 'On Seinfeld, George Costanza\'s father invented a made-up holiday celebrated with a plain aluminum pole instead of a Christmas tree. What is this holiday called?', a: 'Festivus', d: 2 },
      { q: 'Widely regarded as one of the greatest albums ever made, "OK Computer" was released in 1997 by which British rock band?', a: 'Radiohead', d: 2 },
      { q: 'Before becoming one of pop music\'s biggest stars, this singer from Burleson, Texas won the very first season of American Idol. Name her.', a: 'Kelly Clarkson', d: 3 },
    ]
  },
  {
    name: 'Back In My Day', color: '#00E676',
    questions: [
      { q: 'Before streaming and DVDs, people recorded TV shows at home using magnetic tape in a device that sat below their television. What was this technology called?', a: 'VCR (Video Cassette Recorder)', d: 1 },
      { q: 'What was the name of the dominant dial-up internet service that mailed millions of Americans free trial CDs throughout the 1990s?', a: 'AOL (America Online)', d: 1 },
      { q: 'Launched by Apple in October 2001 with the tagline "1,000 songs in your pocket," this portable music player transformed how the world listened to music. Name it.', a: 'The iPod', d: 2 },
      { q: 'Introduced by Motorola in 1983 as the DynaTAC 8000X, this device — which cost nearly $4,000 at launch — was the first commercially available what?', a: 'Handheld cellular / mobile phone', d: 2 },
      { q: 'Released in Japan in 1978 and later a sensation in U.S. arcades, this landmark game featured rows of alien creatures slowly descending toward the player. Name it.', a: 'Space Invaders', d: 3 },
    ]
  },
  {
    name: 'US State Facts', color: '#42A5F5',
    questions: [
      { q: 'What Tennessee city — home to Beale Street and a legendary music scene — is widely credited as the birthplace of rock and roll?', a: 'Memphis', d: 1 },
      { q: 'What is the state capital of Texas?', a: 'Austin', d: 1 },
      { q: 'Michigan\'s Lower Peninsula is famous for resembling the shape of a common household item — something locals use to show out-of-staters exactly where they live by holding up their hand. What does it look like?', a: 'A mitten', d: 2 },
      { q: 'The largest Native American nation by land area in the United States, this nation\'s reservation spans northeastern Arizona, Utah, and New Mexico. Name it.', a: 'The Navajo Nation', d: 2 },
      { q: 'In 1904, St. Louis, Missouri made history by simultaneously hosting the Summer Olympic Games and a world\'s fair — the first time both events had shared a city. By what official name is this world\'s fair known?', a: 'The Louisiana Purchase Exposition', d: 3 },
    ]
  },
  {
    name: 'Sports', color: '#FFD700',
    questions: [
      { q: 'Who holds the record for the most Grand Slam titles in women\'s tennis singles history?', a: 'Serena Williams (23 titles)', d: 1 },
      { q: 'What country has won the most FIFA World Cup titles?', a: 'Brazil (5 times — 1958, 1962, 1970, 1994, 2002)', d: 1 },
      { q: 'Wearing #22 for the Dallas Cowboys for most of his career, who holds the NFL record for most career rushing yards?', a: 'Emmitt Smith', d: 2 },
      { q: 'Michael Jordan led the Chicago Bulls to six NBA championships. In what year did they win the first one?', a: '1991', d: 2 },
      { q: 'Playing for the Miami Dolphins in the 1980s, this Hall of Fame quarterback — widely regarded as the greatest to never win a Super Bowl — was the first to throw for more than 5,000 yards in a single NFL season. Name him.', a: 'Dan Marino', d: 3 },
    ]
  },
  {
    name: 'Food & Travel', color: '#00C8FF',
    questions: [
      { q: 'What is the most visited country in the world by international tourists?', a: 'France', d: 1 },
      { q: 'What spice — harvested from the stigmas of a crocus flower — is the most expensive spice in the world by weight?', a: 'Saffron', d: 1 },
      { q: 'This island nation — known for its extraordinary wildlife found nowhere else on Earth, including lemurs and chameleons — produces more than 60% of the world\'s vanilla supply. Name it.', a: 'Madagascar', d: 2 },
      { q: 'What country is the world\'s largest producer and exporter of coffee, responsible for roughly one-third of global supply?', a: 'Brazil', d: 2 },
      { q: 'This coastal South American nation — whose cuisine features fresh fish, aji peppers, and an abundance of citrus — is widely credited as the birthplace of ceviche. Name it.', a: 'Peru', d: 3 },
    ]
  },
  {
    name: 'Pop Culture', color: '#F48FB1',
    questions: [
      { q: 'This British boy band was assembled on The X Factor in 2010 after each of its five members individually auditioned as a solo act and was eliminated — then grouped together by the judges. They became one of the best-selling music acts in history. Name them.', a: 'One Direction', d: 3 },
      { q: 'In her acceptance speech at the 2016 Grammy Awards — where "1989" won Album of the Year — Taylor Swift publicly addressed her feud with a fellow artist who had claimed credit for launching her fame. Name that artist.', a: 'Kanye West', d: 3 },
      { q: '"The Simpsons" holds the record as the longest-running American primetime scripted television series. In what year did the show make its debut on Fox?', a: '1989', d: 3 },
      { q: 'Lena Headey — best known as Cersei Lannister in "Game of Thrones" — starred as Sarah Connor in what 2008 Fox sci-fi series set in the Terminator universe, which was cancelled after two seasons?', a: 'Terminator: The Sarah Connor Chronicles', d: 3 },
      { q: 'This AMC crime drama — following high school chemistry teacher Walter White\'s transformation into a drug kingpin in Albuquerque, New Mexico — aired from 2008 to 2013 and is widely considered one of the greatest television series ever made. Name it.', a: 'Breaking Bad', d: 3 },
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
    gameName: '',
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
    gameName:       G.gameName,
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
  socket.on('host:createTeams', data => {
    const teams = Array.isArray(data) ? data : (data.teams || []);
    const gameName = (!Array.isArray(data) && data.gameName) ? String(data.gameName).trim().slice(0, 60) : '';
    G = initState();
    G.phase = 'lobby';
    G.gameName = gameName;
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

  socket.on('host:addTeam', () => {
    if (G.phase !== 'lobby' || G.teams.length >= 8) return;
    const i = G.teams.length;
    G.teams.push({ name: `Team ${i+1}`, members: [], emoji: '', score: 0, color: TEAM_COLORS[i] || '#AAAAAA', captainName: '' });
    bcast(); broadcastPlayers();
  });

  socket.on('host:removeTeam', () => {
    if (G.phase !== 'lobby' || G.teams.length <= 1) return;
    const lastIdx = G.teams.length - 1;
    Object.values(activePlayers).forEach(p => { if (p.teamIdx === lastIdx) { p.teamIdx = null; p.isCaptain = false; } });
    G.teams.pop();
    syncTeamMembers();
    bcast(); broadcastPlayers();
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
    const joinMsg = { name: '', msg: `${activePlayers[lk].name} was added to the team`, ts: Date.now(), system: true };
    const hist = getChatHistory(teamIdx);
    hist.push(joinMsg);
    if (hist.length > 50) hist.shift();
    io.to('chat:' + teamIdx).emit('chat:msg', joinMsg);
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
