/**
 * CUONEDU PRO — APPLICATION BUNDLE & MODULE LOADER
 * 
 * Codebase has been modularized into 15 focused modules in the /js/ directory:
 * - js/state.js       : State management, Storage keys, Profiles & Database loader
 * - js/utils.js       : Modal system, Toast notifications, Confetti & Helper functions
 * - js/theme.js       : Multi-theme engine (Cyber Sunset, Dark/Light modes) & Font sizer
 * - js/audio.js       : Web Audio API Synthesizer (BGM loop, click & streak SFX)
 * - js/sync.js        : Realtime Cloud Sync via Firebase REST & GitHub API
 * - js/navigation.js  : Drawer menu, Navbar controls, switchView & Teacher auth
 * - js/dashboard.js   : Stats, Live Search, Category filtering & 4 Dynamic Layouts
 * - js/powerups.js    : Power-up items (Shield, 50/50, 2x, Freeze) & Mystery Box drops
 * - js/exam.js        : Arena Exam Engine (Quizizz mode), countdown timers & Grading
 * - js/study.js       : Free Study & Review mode
 * - js/editor.js      : Subject & Question builder / editor
 * - js/parser.js      : Smart Word (.docx), PDF, text regex parser & KaTeX rendering
 * - js/leaderboard.js : 7-Day Weekly Leaderboard with 3D metallic medals
 * - js/ai-copilot.js  : CuonEdu AI Copilot powered by Google Gemini API
 * - js/main.js        : Application initialization & DOMContentLoaded listener
 */

(function() {
  if (typeof appData === "undefined") {
    const modules = [
      "js/state.js",
      "js/utils.js",
      "js/theme.js",
      "js/audio.js",
      "js/sync.js",
      "js/navigation.js",
      "js/dashboard.js",
      "js/powerups.js",
      "js/exam.js",
      "js/study.js",
      "js/editor.js",
      "js/parser.js",
      "js/leaderboard.js",
      "js/ai-copilot.js",
      "js/main.js"
    ];

    modules.forEach(src => {
      document.write('<script src="' + src + '"><\/script>');
    });
  }
})();
